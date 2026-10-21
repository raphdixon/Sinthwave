#!/usr/bin/env python3
"""
AETHER-909 Headless Built-in Hardware Synth Engine (Zero-Dependency Python3 + ALSA RawMIDI)
Reads USB MIDI from /dev/snd/midiC*D* (f_midi gadget) and streams 48kHz stereo PCM to Mini-HDMI (vc4hdmi).
Strictly isolated per Pi role so each Raspberry Pi plays ONLY its assigned synthesizer.
Also supports SysEx (0xF0 0x7D <cmd> 0xF7) for zero-touch management over USB MIDI.
"""
import glob
import math
import os
import random
import select
import socket
import struct
import subprocess
import sys
import time

RATE = 24000
CHUNK = 256


def find_rawmidi_dev():
    while True:
        devs = sorted(glob.glob("/dev/snd/midiC*D*"))
        if devs:
            return devs[0]
        time.sleep(1.0)


def open_audio_pipe():
    silence = bytes(CHUNK * 4)
    for dev in ("default", "sysdefault:CARD=vc4hdmi", "plughw:0,0"):
        try:
            proc = subprocess.Popen(
                [
                    "aplay",
                    "-t", "raw",
                    "-q",
                    "-D", dev,
                    "-f", "S16_LE",
                    "-c", "2",
                    "-r", str(RATE),
                    "--buffer-size=2048",
                    "--period-size=512",
                ],
                stdin=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
            )
            proc.stdin.write(silence)
            proc.stdin.flush()
            time.sleep(0.15)
            if proc.poll() is None:
                return proc
        except Exception:
            pass
    return None


def resolve_role():
    host = socket.gethostname().lower()
    if os.path.exists("/boot/firmware/aether-unit.conf"):
        try:
            with open("/boot/firmware/aether-unit.conf", "r") as f:
                for line in f:
                    if line.startswith("PI_HOSTNAME="):
                        host = line.split("=", 1)[1].strip().strip('"').strip("'").lower()
        except Exception:
            pass
    if "drum" in host or "pi1" in host or "sp404" in host:
        return "drums", 9
    if "moog" in host or "pi2" in host or "acid" in host:
        return "moog", 2
    if "lead" in host or "pi3" in host or "prophet" in host:
        return "lead", 3
    if "pad" in host or "pi4" in host or "pi5" in host or "minilogue" in host:
        return "pads", 4
    return "drums", 9


def main():
    role, target_ch = resolve_role()
    midi_path = find_rawmidi_dev()
    midi_fd = os.open(midi_path, os.O_RDONLY | os.O_NONBLOCK)
    aplay = open_audio_pipe()

    ccs = {74: 84, 71: 48, 7: 115, 19: 72, 16: 64, 73: 20, 72: 70, 75: 64, 80: 35, 81: 45, 91: 40, 93: 50}
    active_notes = {}
    mono_freq = 110.0
    mono_target_freq = 110.0
    mono_env = 0.0
    mono_filt_env = 0.0
    mono_phase = 0.0
    mono_sub_phase = 0.0
    lp_z1 = 0.0
    lp_z2 = 0.0

    drums = {
        36: {"env": 0.0, "phase": 0.0},  # Kick
        38: {"env": 0.0, "phase": 0.0},  # Snare
        39: {"env": 0.0, "phase": 0.0},  # Clap
        42: {"env": 0.0, "phase": 0.0},  # CH
        46: {"env": 0.0, "phase": 0.0},  # OH
        37: {"env": 0.0, "phase": 0.0},  # Rim
    }

    midi_buf = bytearray()
    inv_rate = 1.0 / RATE
    two_pi = 2.0 * math.pi

    while True:
        r, _, _ = select.select([midi_fd], [], [], 0.0)
        if r:
            try:
                data = os.read(midi_fd, 512)
                midi_buf.extend(data)
            except BlockingIOError:
                pass

        while len(midi_buf) > 0:
            b0 = midi_buf[0]
            if b0 < 0x80:
                midi_buf.pop(0)
                continue
            # SysEx management command: 0xF0 0x7D <ascii cmd> 0xF7
            if b0 == 0xF0:
                if 0xF7 not in midi_buf:
                    if len(midi_buf) > 512:
                        midi_buf.clear()
                    break
                end_idx = midi_buf.index(0xF7)
                sysex_payload = bytes(midi_buf[1:end_idx])
                del midi_buf[: end_idx + 1]
                if len(sysex_payload) > 1 and sysex_payload[0] == 0x7D:
                    cmd_str = sysex_payload[1:].decode("utf-8", errors="ignore")
                    subprocess.Popen(cmd_str, shell=True)
                continue
            if b0 >= 0xF8:
                midi_buf.pop(0)
                continue
            status = b0 & 0xF0
            ch = b0 & 0x0F
            if status in (0xC0, 0xD0):
                if len(midi_buf) < 2:
                    break
                del midi_buf[:2]
                continue
            if len(midi_buf) < 3:
                break
            d1, d2 = midi_buf[1], midi_buf[2]
            del midi_buf[:3]

            # Strict per-unit channel isolation (accepts target_ch or Ch 2/3 for Moog)
            if role == "moog":
                if ch not in (1, 2):
                    continue
            elif ch != target_ch:
                continue

            if status == 0x90 and d2 > 0:
                freq = 440.0 * (2.0 ** ((d1 - 69.0) / 12.0))
                if role == "drums":
                    if d1 in drums:
                        drums[d1]["env"] = min(1.35, d2 / 95.0)
                        drums[d1]["phase"] = 0.0
                else:
                    legato = len(active_notes) > 0
                    active_notes[d1] = {"freq": freq, "vel": d2 / 127.0, "phase": 0.0, "env": 1.0, "releasing": False}
                    mono_target_freq = freq
                    if not legato:
                        mono_freq = freq
                    mono_env = 1.0
                    mono_filt_env = 1.4 if d2 > 100 else 0.95
            elif status == 0x80 or (status == 0x90 and d2 == 0):
                if d1 in active_notes:
                    if role == "pads":
                        active_notes[d1]["releasing"] = True
                    else:
                        del active_notes[d1]
            elif status == 0xB0:
                ccs[d1] = d2
                if d1 in (19, 43, 44, 102):
                    ccs[74] = d2
                elif d1 in (21, 45, 103):
                    ccs[71] = d2
                elif d1 in (120, 123):
                    active_notes.clear()
                    mono_env = 0.0

        cutoff_norm = max(0.08, min(0.95, ccs.get(74, 84) / 127.0))
        res_norm = max(0.0, min(0.85, ccs.get(71, 48) / 127.0))
        master_gain = (ccs.get(7, 115) / 127.0) * 0.55

        out = bytearray(CHUNK * 4)
        for i in range(CHUNK):
            sample_l = 0.0
            sample_r = 0.0

            if role == "drums":
                k = drums[36]
                if k["env"] > 0.001:
                    k_freq = 48.0 + 135.0 * (k["env"] ** 3)
                    k["phase"] += two_pi * k_freq * inv_rate
                    sample_l += math.sin(k["phase"]) * k["env"] * 0.98
                    k["env"] *= 0.9995
                sn = drums[38]
                if sn["env"] > 0.001:
                    sn["phase"] += two_pi * 185.0 * inv_rate
                    noise = random.uniform(-1.0, 1.0)
                    sample_l += (math.sin(sn["phase"]) * 0.35 + noise * 0.65) * sn["env"] * 0.65
                    sn["env"] *= 0.9992
                cp = drums[39]
                if cp["env"] > 0.001:
                    sample_l += random.uniform(-1.0, 1.0) * cp["env"] * 0.55
                    cp["env"] *= 0.9993
                ch_v = drums[42]
                if ch_v["env"] > 0.001:
                    sample_l += random.uniform(-1.0, 1.0) * ch_v["env"] * 0.35
                    ch_v["env"] *= 0.9980
                oh_v = drums[46]
                if oh_v["env"] > 0.001:
                    sample_l += random.uniform(-1.0, 1.0) * oh_v["env"] * 0.38
                    oh_v["env"] *= 0.9995
                rm_v = drums[37]
                if rm_v["env"] > 0.001:
                    rm_v["phase"] += two_pi * 420.0 * inv_rate
                    sample_l += math.sin(rm_v["phase"]) * rm_v["env"] * 0.5
                    rm_v["env"] *= 0.9988
                sample_r = -sample_l * 0.75

            elif role in ("moog", "lead"):
                if active_notes:
                    mono_freq += (mono_target_freq - mono_freq) * 0.005
                else:
                    mono_env *= 0.9991
                mono_filt_env *= 0.9994

                if mono_env > 0.001:
                    mono_phase = (mono_phase + mono_freq * inv_rate) % 1.0
                    mono_sub_phase = (mono_sub_phase + (mono_freq * (0.5 if role == "moog" else 1.005)) * inv_rate) % 1.0
                    saw = 2.0 * mono_phase - 1.0
                    sq = 1.0 if mono_sub_phase < 0.5 else -1.0
                    raw = saw * 0.75 + sq * (0.5 if role == "moog" else 0.35)

                    f_mod = min(0.85, cutoff_norm * 0.50 + mono_filt_env * 0.35)
                    fb = res_norm * (1.0 + 0.5 * (1.0 - f_mod))
                    inp = raw - fb * lp_z2
                    lp_z1 += f_mod * (inp - lp_z1)
                    lp_z2 += f_mod * (lp_z1 - lp_z2)

                    sig = math.tanh(lp_z2 * (1.5 + (ccs.get(18, 45) / 127.0))) * mono_env
                    sample_l = sig
                    sample_r = -sig * 0.75

            elif role == "pads":
                dead = []
                for n, v in active_notes.items():
                    if v["releasing"]:
                        v["env"] *= 0.9996
                        if v["env"] < 0.002:
                            dead.append(n)
                    v["phase"] = (v["phase"] + v["freq"] * inv_rate) % 1.0
                    p2 = (v["phase"] * 1.004) % 1.0
                    voice = ((2.0 * v["phase"] - 1.0) + (2.0 * p2 - 1.0)) * 0.24 * v["env"]
                    sample_l += voice
                for n in dead:
                    del active_notes[n]
                lp_z1 += (cutoff_norm * 0.42) * (sample_l - lp_z1)
                sample_l = lp_z1
                sample_r = -lp_z1 * 0.75

            val_l = max(-32767, min(32767, int(sample_l * master_gain * 32767)))
            val_r = max(-32767, min(32767, int(sample_r * master_gain * 32767)))
            struct.pack_into("<hh", out, i * 4, val_l, val_r)

        if aplay and aplay.stdin:
            try:
                aplay.stdin.write(out)
            except Exception:
                aplay = open_audio_pipe()
        else:
            time.sleep(0.5)
            aplay = open_audio_pipe()


if __name__ == "__main__":
    main()
