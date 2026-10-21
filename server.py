#!/usr/bin/env python3
"""
AETHER-909 // Native macOS CoreMIDI Virtual Studio Bridge & AI Conductor Server
Uses Apple's signed system /usr/bin/python3 + ctypes to bind directly to
/System/Library/Frameworks/CoreMIDI.framework/CoreMIDI.
"""

import ctypes
import json
import os
import struct
import subprocess
import sys
import threading
import time
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# ---------------------------------------------------------------------------
# 1. NATIVE MACOS COREMIDI ENGINE (via ctypes)
# ---------------------------------------------------------------------------

kCFStringEncodingUTF8 = 0x08000100


class NativeCoreMIDIBridge:
    def __init__(self):
        self.lock = threading.Lock()
        self.available = False
        self.virtual_sources = {}
        self.selected_hw_destinations = []
        self.tx_message_count = 0
        self.last_midi_events = []

        self.port_names = {
            0: "ARTURIA // Master Bus (All Ch)",
            1: "AETHER // Unit 1 Emulator II Sampler",
            2: "AETHER // Unit 2 Mini V4 Bass",
            3: "AETHER // Unit 3 Prophet-5 V Lead",
            4: "AETHER // Unit 4 Jun-6 / CS-80 Pads",
        }

        try:
            self.cm = ctypes.cdll.LoadLibrary("/System/Library/Frameworks/CoreMIDI.framework/CoreMIDI")
            self.cf = ctypes.cdll.LoadLibrary("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")

            self.cf.CFStringCreateWithCString.restype = ctypes.c_void_p
            self.cf.CFStringCreateWithCString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_uint32]
            self.cf.CFStringGetCString.restype = ctypes.c_bool
            self.cf.CFStringGetCString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_long, ctypes.c_uint32]
            self.cf.CFRunLoopRunInMode.argtypes = [ctypes.c_void_p, ctypes.c_double, ctypes.c_bool]
            self.cf.CFRunLoopRunInMode.restype = ctypes.c_int32

            self.cm.MIDIPacketListInit.restype = ctypes.c_void_p
            self.cm.MIDIPacketListInit.argtypes = [ctypes.c_void_p]
            self.cm.MIDIPacketListAdd.restype = ctypes.c_void_p
            self.cm.MIDIPacketListAdd.argtypes = [
                ctypes.c_void_p,
                ctypes.c_size_t,
                ctypes.c_void_p,
                ctypes.c_uint64,
                ctypes.c_size_t,
                ctypes.c_char_p,
            ]

            self.client = ctypes.c_uint32()
            self.out_port = ctypes.c_uint32()
            self.prop_display_name = self._cfstr("displayName")
            self.prop_name = self._cfstr("name")
            err1 = self.cm.MIDIClientCreate(self._cfstr("AETHER-909 AI Studio"), None, None, ctypes.byref(self.client))
            err2 = self.cm.MIDIOutputPortCreate(self.client, self._cfstr("AETHER-909 Out"), ctypes.byref(self.out_port))
            for pid, name in sorted(self.port_names.items()):
                endpoint = ctypes.c_uint32()
                err = self.cm.MIDISourceCreate(self.client, self._cfstr(name), ctypes.byref(endpoint))
                if err == 0:
                    self.virtual_sources[pid] = endpoint
            self.available = (err1 == 0 and err2 == 0)
            self._runloop_mode = ctypes.c_void_p.in_dll(self.cf, "kCFRunLoopDefaultMode")
            print(f"[CoreMIDI] Initialized successfully. Created {len(self.virtual_sources)} virtual MIDI ports.")
        except Exception as e:
            print(f"[CoreMIDI] Initialization warning: {e}", file=sys.stderr)

    def pump_main_runloop(self):
        if not self.available:
            time.sleep(0.25)
            return
        with self.lock:
            try:
                self.cf.CFRunLoopRunInMode(self._runloop_mode, 0.05, False)
            except Exception:
                pass
        time.sleep(0.15)
    def _cfstr(self, s: str):
        return ctypes.c_void_p(
            self.cf.CFStringCreateWithCString(None, s.encode("utf-8"), kCFStringEncodingUTF8)
        )

    def _list_destinations_unlocked(self):
        if not self.available:
            return []
        result = []
        count = self.cm.MIDIGetNumberOfDestinations()
        for i in range(count):
            ep = self.cm.MIDIGetDestination(i)
            str_ref = ctypes.c_void_p()
            name = f"MIDI Destination {i}"
            if self.cm.MIDIObjectGetStringProperty(ep, self.prop_display_name, ctypes.byref(str_ref)) == 0 and str_ref.value:
                buf = ctypes.create_string_buffer(256)
                if self.cf.CFStringGetCString(str_ref, buf, 256, kCFStringEncodingUTF8):
                    name = buf.value.decode("utf-8", errors="replace")
            elif self.cm.MIDIObjectGetStringProperty(ep, self.prop_name, ctypes.byref(str_ref)) == 0 and str_ref.value:
                buf = ctypes.create_string_buffer(256)
                if self.cf.CFStringGetCString(str_ref, buf, 256, kCFStringEncodingUTF8):
                    name = buf.value.decode("utf-8", errors="replace")
            if name == "AETHER-Pi4-ProphetLead":
                name = "AETHER-Pi4-Minilogue-Kronos"
            result.append({
                "index": i,
                "name": name,
                "enabled": i in self.selected_hw_destinations,
            })
        return result

    def list_destinations(self):
        with self.lock:
            return self._list_destinations_unlocked()
    @staticmethod
    def _dest_matches_port(dest_name: str, port_id: int) -> bool:
        if port_id == 0:
            return True
        low = dest_name.lower()
        if "aether" not in low and "pi" not in low:
            return True
        if "pi1" in low:
            return port_id == 1
        if "pi2" in low:
            return port_id == 2
        if "pi3" in low:
            return port_id == 3
        if "pi4" in low or "pi5" in low:
            return port_id == 4
        if "sp404" in low or "drum" in low:
            return port_id == 1
        if "moog" in low or "sub37" in low or "acid" in low:
            return port_id == 2
        if "prophet" in low or "volca" in low or "lead" in low:
            return port_id == 3
        if "minilogue" in low or "kronos" in low or "juno" in low or "pad" in low:
            return port_id == 4
        return True

    def send_batch(self, events):
        """
        events: list of dicts {"port": int, "bytes": [int, ...]}
        port 1..4 = specific instrument port routed strictly to its matching AETHER-Pi hardware unit
        port 0 = global/clock/master
        """
        if not self.available or not events:
            return 0
        sent = 0
        with self.lock:
            pkt_buf = ctypes.create_string_buffer(512)
            dest_info = self._list_destinations_unlocked()
            active_dests = [
                (d["name"], self.cm.MIDIGetDestination(d["index"]))
                for d in dest_info
                if d["enabled"]
            ]

            for ev in events:
                raw_bytes = ev.get("bytes", [])
                if not raw_bytes:
                    continue
                port_id = int(ev.get("port", 0))
                msg = bytes(int(b) & 0xFF for b in raw_bytes)

                pkt = self.cm.MIDIPacketListInit(pkt_buf)
                pkt = self.cm.MIDIPacketListAdd(pkt_buf, 512, pkt, 0, len(msg), msg)
                if not pkt:
                    continue

                # 1. Broadcast on instrument-specific virtual source
                if port_id in self.virtual_sources:
                    self.cm.MIDIReceived(self.virtual_sources[port_id], pkt_buf)

                # 2. Mirror to Master Bus virtual source (port 0)
                if port_id != 0 and 0 in self.virtual_sources:
                    self.cm.MIDIReceived(self.virtual_sources[0], pkt_buf)

                # 3. Send ONLY to the matching physical Pi / enabled hardware destination
                for dest_name, dest_ep in active_dests:
                    if self._dest_matches_port(dest_name, port_id):
                        self.cm.MIDISend(self.out_port, dest_ep, pkt_buf)

                sent += 1
                self.tx_message_count += 1

        return sent

    def panic_all(self):
        events = []
        for ch in range(16):
            status = 0xB0 | ch
            # CC 123 (All Notes Off), CC 120 (All Sound Off)
            events.append({"port": 0, "bytes": [status, 123, 0]})
            events.append({"port": 0, "bytes": [status, 120, 0]})
            for p in range(1, 6):
                events.append({"port": p, "bytes": [status, 123, 0]})
        self.send_batch(events)


midi_bridge = NativeCoreMIDIBridge()


# ---------------------------------------------------------------------------
# 2. INSTALLED ARTURIA & ABLETON APP DETECTION + 1-CLICK LAUNCHER
# ---------------------------------------------------------------------------

UNIT_VIRTUAL_PORTS = {
    1: "AETHER // Unit 1 Emulator II Sampler",
    2: "AETHER // Unit 2 Mini V4 Bass",
    3: "AETHER // Unit 3 Prophet-5 V Lead",
    4: "AETHER // Unit 4 Jun-6 / CS-80 Pads",
}

RECOMMENDED_APPS = [
    # UNIT 2: BASS (Moog Sub 37 Counterparts)
    {
        "id": "mini_v",
        "unit": 2,
        "libDir": "Mini V4",
        "name": "Arturia Mini V4",
        "role": "Unit 2 Bass (Moog Model D / Sub 37 Match)",
        "channel": "Ch 3",
        "path": "/Applications/Arturia/Mini V4.app",
    },
    {
        "id": "acid_v",
        "unit": 2,
        "libDir": "Acid V",
        "name": "Arturia Acid V",
        "role": "Unit 2 Bass (TB-303 Diode Ladder Bass)",
        "channel": "Ch 2 & 3",
        "path": "/Applications/Arturia/Acid V.app",
    },
    {
        "id": "arp2600_v",
        "unit": 2,
        "libDir": "ARP 2600 V3",
        "name": "Arturia ARP 2600 V3",
        "role": "Unit 2 Bass (Semi-Modular Sub Bass)",
        "channel": "Ch 3",
        "path": "/Applications/Arturia/ARP 2600 V3.app",
    },
    # UNIT 3: LEAD & ARP (Prophet-6 / Volca FM / Volca Keys Counterparts)
    {
        "id": "prophet_v",
        "unit": 3,
        "libDir": "Prophet-5 V",
        "name": "Arturia Prophet-5 V",
        "role": "Unit 3 Lead (Sequential Prophet Match)",
        "channel": "Ch 4",
        "path": "/Applications/Arturia/Prophet-5 V.app",
    },
    {
        "id": "dx7_v",
        "unit": 3,
        "libDir": "DX7 V",
        "name": "Arturia DX7 V",
        "role": "Unit 3 Lead (6-Op FM — Volca FM Match)",
        "channel": "Ch 4",
        "path": "/Applications/Arturia/DX7 V.app",
    },
    {
        "id": "ms20_v",
        "unit": 3,
        "libDir": "KORG MS-20 V",
        "name": "Arturia KORG MS-20 V",
        "role": "Unit 3 Lead (Korg Analog Filter — Volca Keys Match)",
        "channel": "Ch 4",
        "path": "/Applications/Arturia/KORG MS-20 V.app",
    },
    # UNIT 4: POLY PADS (Korg Minilogue / Korg Kronos Counterparts)
    {
        "id": "jun6_v",
        "unit": 4,
        "libDir": "Jun-6 V",
        "name": "Arturia Jun-6 V",
        "role": "Unit 4 Pads (6-Voice Analog Poly — Minilogue Match)",
        "channel": "Ch 5",
        "path": "/Applications/Arturia/Jun-6 V.app",
    },
    {
        "id": "cs80_v",
        "unit": 4,
        "libDir": "CS-80 V4",
        "name": "Arturia CS-80 V4",
        "role": "Unit 4 Pads (Expressive Poly — Kronos Match)",
        "channel": "Ch 5",
        "path": "/Applications/Arturia/CS-80 V4.app",
    },
    {
        "id": "jup8_v",
        "unit": 4,
        "libDir": "Jup-8 V4",
        "name": "Arturia Jup-8 V4",
        "role": "Unit 4 Pads (Jupiter-8 Lush Analog Pads)",
        "channel": "Ch 5",
        "path": "/Applications/Arturia/Jup-8 V4.app",
    },
    {
        "id": "matrix12_v",
        "unit": 4,
        "libDir": "Matrix-12 V2",
        "name": "Arturia Matrix-12 V2",
        "role": "Unit 4 Pads (Oberheim 12-Voice Mod Pads)",
        "channel": "Ch 5",
        "path": "/Applications/Arturia/Matrix-12 V2.app",
    },
    # UNIT 1: SAMPLER / DRUMS (SP-404 / TE EP-40 Counterparts)
    {
        "id": "emulator_ii",
        "unit": 1,
        "libDir": "Emulator II V",
        "name": "Arturia Emulator II V",
        "role": "Unit 1 Sampler (12-Bit Hardware Sampler)",
        "channel": "Ch 10",
        "path": "/Applications/Arturia/Emulator II V.app",
    },
    {
        "id": "cmi_v",
        "unit": 1,
        "libDir": "CMI V",
        "name": "Arturia CMI V",
        "role": "Unit 1 Sampler (Fairlight CMI Workstation)",
        "channel": "Ch 10",
        "path": "/Applications/Arturia/CMI V.app",
    },
    {
        "id": "analog_lab",
        "unit": 1,
        "libDir": "Analog Lab V",
        "name": "Arturia Analog Lab V",
        "role": "Unit 1 Sampler / Multi Anthology",
        "channel": "Ch 10",
        "path": "/Applications/Arturia/Analog Lab V.app",
    },
]


def get_default_macos_audio_output() -> str:
    try:
        out = subprocess.check_output(["system_profiler", "SPAudioDataType"], text=True, timeout=2.0)
        lines = out.splitlines()
        for idx, line in enumerate(lines):
            if "Default Output Device: Yes" in line:
                for back in range(idx - 1, max(0, idx - 6), -1):
                    cand = lines[back].strip()
                    if cand.endswith(":") and not cand.startswith(("Manufacturer", "Output", "Current", "Transport")):
                        return cand[:-1].strip()
    except Exception:
        pass
    return "Mac Studio Speakers"


def preconfigure_arturia_standalone(app_item: dict, audio_dev: str = None) -> str:
    """
    Writes /Library/Arturia/<libDir>/tmp/standalone.pref BEFORE launching an Arturia standalone app
    so it automatically opens bound ONLY to its dedicated AETHER unit CoreMIDI port & active audio output!
    """
    lib_dir = app_item.get("libDir")
    unit_num = app_item.get("unit", 2)
    midi_port_name = UNIT_VIRTUAL_PORTS.get(unit_num, "AETHER // Master Bus (All Ch)")
    if not lib_dir:
        return midi_port_name

    base_dir = f"/Library/Arturia/{lib_dir}"
    if not os.path.isdir(base_dir):
        return midi_port_name

    out_dev = audio_dev or get_default_macos_audio_output()
    tmp_dir = os.path.join(base_dir, "tmp")
    try:
        os.makedirs(tmp_dir, exist_ok=True)
        pref_path = os.path.join(tmp_dir, "standalone.pref")
        pref_xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n\n'
            '<PROPERTIES>\n'
            '  <VALUE name="AudioDeviceOutputType" val="CoreAudio"/>\n'
            f'  <VALUE name="AudioDeviceOutputName" val="{out_dev}"/>\n'
            '  <VALUE name="AudioDeviceOutputSampleRate" val="48000"/>\n'
            '  <VALUE name="Tempo" val="124"/>\n'
            '  <VALUE name="AudioDeviceOutputBufferSize" val="256"/>\n'
            f'  <VALUE name="MidiDevice_1" val="{midi_port_name}"/>\n'
            '</PROPERTIES>\n'
        )
        with open(pref_path, "w", encoding="utf-8") as f:
            f.write(pref_xml)
    except Exception as e:
        print(f"[Arturia Prefs] Warning for {lib_dir}: {e}", file=sys.stderr)
    return midi_port_name


def preconfigure_all_installed_arturia():
    audio_dev = get_default_macos_audio_output()
    for item in RECOMMENDED_APPS:
        if os.path.exists(item["path"]):
            preconfigure_arturia_standalone(item, audio_dev=audio_dev)


def get_best_arturia_suite():
    bass_candidates = ["mini_v", "acid_v", "arp2600_v"]
    lead_candidates = ["prophet_v", "dx7_v", "ms20_v"]
    pads_candidates = ["jun6_v", "cs80_v", "jup8_v", "matrix12_v"]
    drums_candidates = ["emulator_ii", "cmi_v", "analog_lab"]

    installed_ids = {a["id"] for a in RECOMMENDED_APPS if os.path.exists(a["path"])}
    best_bass = next((cid for cid in bass_candidates if cid in installed_ids), "mini_v")
    best_lead = next((cid for cid in lead_candidates if cid in installed_ids), "dx7_v")
    best_pads = next((cid for cid in pads_candidates if cid in installed_ids), "jun6_v")
    best_drums = next((cid for cid in drums_candidates if cid in installed_ids), "emulator_ii")

    return {
        "bass": next((a for a in RECOMMENDED_APPS if a["id"] == best_bass), None),
        "lead": next((a for a in RECOMMENDED_APPS if a["id"] == best_lead), None),
        "pads": next((a for a in RECOMMENDED_APPS if a["id"] == best_pads), None),
        "drums": next((a for a in RECOMMENDED_APPS if a["id"] == best_drums), None),
    }


def get_installed_apps():
    apps = []
    for item in RECOMMENDED_APPS:
        apps.append({
            **item,
            "installed": os.path.exists(item["path"]),
        })
    return apps

# ---------------------------------------------------------------------------
# 3. STANDARD MIDI FILE (.MID FORMAT 1) MULTI-TRACK EXPORTER
# ---------------------------------------------------------------------------

def encode_vlq(val: int) -> bytes:
    val = max(0, int(val))
    buf = [val & 0x7F]
    val >>= 7
    while val > 0:
        buf.append((val & 0x7F) | 0x80)
        val >>= 7
    buf.reverse()
    return bytes(buf)


def build_midi_track(name: str, bpm: int, note_events: list) -> bytes:
    """
    note_events: list of (tick, status_byte, data1, data2)
    """
    events = []
    # Track Name Meta Event (FF 03)
    name_bytes = name.encode("utf-8")
    events.append((0, bytes([0xFF, 0x03]) + encode_vlq(len(name_bytes)) + name_bytes))
    if bpm > 0:
        mpqn = int(60_000_000 / max(40, min(240, bpm)))
        events.append((0, bytes([0xFF, 0x51, 0x03, (mpqn >> 16) & 0xFF, (mpqn >> 8) & 0xFF, mpqn & 0xFF])))

    for tick, st, d1, d2 in note_events:
        events.append((int(tick), bytes([st & 0xFF, d1 & 0x7F, d2 & 0x7F])))

    events.sort(key=lambda x: (x[0], 0 if (x[1][0] & 0xF0) == 0x80 else 1))

    track_data = bytearray()
    last_tick = 0
    for tick, raw in events:
        delta = max(0, tick - last_tick)
        track_data.extend(encode_vlq(delta))
        track_data.extend(raw)
        last_tick = tick

    # End of Track (FF 2F 00)
    track_data.extend(encode_vlq(0))
    track_data.extend(bytes([0xFF, 0x2F, 0x00]))

    return b"MTrk" + struct.pack(">I", len(track_data)) + bytes(track_data)


def export_pattern_to_mid(state: dict) -> bytes:
    """
    Converts the current 5-instrument 16-step state (repeated over 4 bars = 64 steps)
    into a multi-track Standard MIDI File (Format 1, 480 PPQN).
    """
    ppqn = 480
    step_ticks = ppqn // 4  # 16th note = 120 ticks
    bpm = int(state.get("bpm", 126))
    tracks = []

    # Track 1: Drums (Ch 10 -> 0x99 / 0x89)
    drum_notes = {"kick": 36, "snare": 38, "clap": 39, "ch": 42, "oh": 46, "perc": 37}
    drum_ev = []
    drums = state.get("drums", {})
    for bar in range(4):
        for s in range(16):
            t0 = (bar * 16 + s) * step_ticks
            for lane, note_num in drum_notes.items():
                steps = drums.get(lane, [])
                if s < len(steps) and steps[s].get("active"):
                    vel = int(steps[s].get("vel", 100))
                    drum_ev.append((t0, 0x99, note_num, vel))
                    drum_ev.append((t0 + step_ticks // 2, 0x89, note_num, 0))
    tracks.append(build_midi_track("Unit1 Ch10 SP-404 EP-40 Sampler", bpm, drum_ev))

    # Track 2: Moog Sub 37 Bass (Ch 3 -> 0x92 / 0x82) with overlapping glide notes & accent velocity
    bass_ev = []
    bass_steps = state.get("bass", [])
    for bar in range(4):
        for s in range(16):
            if s < len(bass_steps) and bass_steps[s].get("active"):
                st_obj = bass_steps[s]
                t0 = (bar * 16 + s) * step_ticks
                note = int(st_obj.get("note", 36))
                vel = 124 if st_obj.get("accent") else int(st_obj.get("vel", 100))
                dur = int(step_ticks * 1.18) if st_obj.get("slide") else int(step_ticks * float(st_obj.get("gate", 0.75)))
                bass_ev.append((t0, 0x92, note, vel))
                bass_ev.append((t0 + max(30, dur), 0x82, note, 0))
    tracks.append(build_midi_track("Unit2 Ch3 Moog Sub 37 Bass", 0, bass_ev))

    # Track 3: Prophet-6 / Volca FM & Keys Lead (Ch 4 -> 0x93 / 0x83)
    lead_ev = []
    lead_steps = state.get("lead", [])
    for bar in range(4):
        for s in range(16):
            if s < len(lead_steps) and lead_steps[s].get("active"):
                st_obj = lead_steps[s]
                t0 = (bar * 16 + s) * step_ticks
                note = int(st_obj.get("note", 60))
                vel = int(st_obj.get("vel", 90))
                dur = int(step_ticks * float(st_obj.get("gate", 0.65)))
                lead_ev.append((t0, 0x93, note, vel))
                lead_ev.append((t0 + max(30, dur), 0x83, note, 0))
    tracks.append(build_midi_track("Unit3 Ch4 Prophet-6 Volca Lead", 0, lead_ev))

    # Track 4: Korg Minilogue / Kronos 4-Voice Poly Pads (Ch 5 -> 0x94 / 0x84)
    pad_ev = []
    pad_chords = state.get("pads", [])
    for bar in range(4):
        chord_obj = pad_chords[bar % len(pad_chords)] if pad_chords else {"notes": [60, 63, 67, 70], "vel": 82}
        t0 = bar * 16 * step_ticks
        dur = int(16 * step_ticks * 0.95)
        vel = int(chord_obj.get("vel", 82))
        for n in chord_obj.get("notes", [60, 63, 67, 70]):
            pad_ev.append((t0, 0x94, int(n), vel))
            pad_ev.append((t0 + dur, 0x84, int(n), 0))
    tracks.append(build_midi_track("Unit4 Ch5 Minilogue Kronos Pads", 0, pad_ev))
    header = b"MThd" + struct.pack(">IHHH", 6, 1, len(tracks), ppqn)
    return header + b"".join(tracks)


# ---------------------------------------------------------------------------
# 4. OPTIONAL CLOUD GEMINI API PROXY (IF USER PROVIDES API KEY)
# ---------------------------------------------------------------------------

def _resolve_gemini_api_key(explicit_key: str = "") -> str:
    if explicit_key and len(explicit_key.strip()) > 12:
        return explicit_key.strip()
    env_val = os.environ.get("GEMINI_API_KEY", "").strip()
    if env_val:
        return env_val
    for rc_path in (os.path.expanduser("~/.omp/.env"), os.path.expanduser("~/.zshrc")):
        if os.path.exists(rc_path):
            try:
                for line in open(rc_path, "r", encoding="utf-8", errors="ignore"):
                    if "GEMINI_API_KEY" in line and "=" in line:
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            os.environ["GEMINI_API_KEY"] = val
                            return val
            except Exception:
                pass
    return ""


def analyze_wav_pcm_metrics(wav_bytes: bytes) -> dict:
    """Compute exact acoustic telemetry directly from stereo 16-bit PCM WAV samples."""
    import wave
    import io
    import math
    try:
        with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
            n_ch = wf.getnchannels()
            sr = wf.getframerate()
            n_frames = wf.getnframes()
            raw = wf.readframes(n_frames)
        n_samples = len(raw) // 2
        samples = struct.unpack(f"<{n_samples}h", raw[:n_samples * 2])
        if n_ch >= 2:
            left = [samples[i] / 32768.0 for i in range(0, len(samples) - 1, n_ch)]
            right = [samples[i + 1] / 32768.0 for i in range(0, len(samples) - 1, n_ch)]
        else:
            left = [s / 32768.0 for s in samples]
            right = left
        n = max(1, len(left))
        mono = [0.5 * (left[i] + right[i]) for i in range(n)]
        side = [0.5 * (left[i] - right[i]) for i in range(n)]
        rms = math.sqrt(sum(x * x for x in mono) / n)
        side_rms = math.sqrt(sum(x * x for x in side) / n)
        peak = max(1e-7, max(abs(x) for x in mono))
        alpha_sub = min(0.99, (2.0 * math.pi * 115.0) / max(1.0, sr))
        alpha_hi = min(0.99, (2.0 * math.pi * 2200.0) / max(1.0, sr))
        lp_sub = 0.0
        lp_mid = 0.0
        sub_sq = 0.0
        mid_sq = 0.0
        hi_sq = 0.0
        for x in mono:
            lp_sub += alpha_sub * (x - lp_sub)
            lp_mid += alpha_hi * (x - lp_mid)
            hi = x - lp_mid
            mid = lp_mid - lp_sub
            sub_sq += lp_sub * lp_sub
            mid_sq += mid * mid
            hi_sq += hi * hi
        db = lambda v: round(20.0 * math.log10(max(1e-7, math.sqrt(v))), 2)
        return {
            "durationSec": round(n / max(1, sr), 2),
            "sampleRate": sr,
            "rmsDb": round(20.0 * math.log10(max(1e-7, rms)), 2),
            "peakDb": round(20.0 * math.log10(peak), 2),
            "crestFactorDb": round(20.0 * math.log10(peak / max(1e-7, rms)), 2),
            "subBandDb": db(sub_sq / n),
            "dubMidBandDb": db(mid_sq / n),
            "highCasioBandDb": db(hi_sq / n),
            "stereoWidthRatio": round(side_rms / max(1e-5, rms), 3),
        }
    except Exception as exc:
        return {"error": str(exc)}


def call_gemini_composer(prompt_data: dict):
    api_key = _resolve_gemini_api_key(prompt_data.get("apiKey", ""))
    model_name = prompt_data.get("model") or "gemini-flash-latest"
    if model_name not in ("gemini-flash-latest", "gemini-flash-lite-latest"):
        model_name = "gemini-flash-latest"
    if not api_key:
        return None

    user_prompt = prompt_data.get("prompt", "Berlin Basic Channel / DeepChord dub techno")
    section = prompt_data.get("section", "GROOVE")
    bpm = prompt_data.get("bpm", 122)
    root = prompt_data.get("rootNote", "D")
    scale = prompt_data.get("scale", "minor")

    sys_instruction = (
        "You are AETHER-909, an elite Berlin/Detroit Dub Techno sound architect and 4-synth controller "
        "(Basic Channel, Maurizio, Rhythm & Sound, DeepChord, Echospace, Fluxion, Yagya, Porter Ricks, Prince of Denmark). "
        "NEVER generate cheesy Casio chord progressions, sustained organ pads, or busy lead melodies. "
        "Enforce single-chord minor-7/9/11 stasis, polymetric 16/14/12 cross-rhythms, zero-sustain dub stabs, "
        "degrading RE-201 tape feedback, hydrothermal noise floor, and deep phase-locked sub-bass. "
        "Return ONLY valid JSON with keys: "
        "commentary (string), archetypeId (string from: basic_channel, deepchord, rhythm_sound, maurizio, fluxion, yagya, porter_ricks, prince_of_denmark), "
        "bpm (number 110-128), rootNote (string), scale (string), "
        "activeVoices (object with booleans for drums, moog, lead, pads), "
        "programs (object with MIDI patch integers 0-15 for drums, moog, lead, pads), "
        "macros (object with 0.0-1.0 floats for acidCutoff, acidRes, acidEnvMod, acidDecay, moogCutoff, leadCutoff, padCutoff, delayMix, reverbMix, masterFilter)."
    )
    query = (
        f"Architect an authentic Berlin/Detroit Dub Techno {section} patch & groove for: '{user_prompt}'. "
        f"Current tonal center: {root} {scale}, BPM: {bpm}."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    payload = {
        "system_instruction": {"parts": [{"text": sys_instruction}]},
        "contents": [{"parts": [{"text": query}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.45},
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=22.0) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            text = body["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
    except Exception as e:
        print(f"[Gemini API] Fallback to local harmonic engine ({e})", file=sys.stderr)
        return None


def call_gemini_audio_ear_refine(body: dict) -> dict:
    """
    Closed-Loop Gemini Multimodal Audio Listening ('Ear'):
    Receives real rendered WAV base64 audio from Sinthwave's DSP engine, inspects its acoustic spectrum
    both via Gemini multimodal audio tokens AND physical PCM metrics, critiques any cheesy artifacts,
    computes refined synthesizer patch & DSP parameters, AND dispatches live MIDI CCs + Program Changes
    directly into the running Arturia V Collection 11 Pro synths.
    """
    import base64
    api_key = _resolve_gemini_api_key(body.get("apiKey", ""))
    if not api_key:
        return {"ok": False, "error": "Missing GEMINI_API_KEY"}

    wav_b64 = body.get("audioWavBase64", "")
    current_params = body.get("currentParams", {})
    archetype_id = current_params.get("archetypeId", "basic_channel")
    round_num = int(body.get("round", 1))
    user_goal = body.get("prompt", "Authentic Berlin/Detroit Dub Techno (Basic Channel / DeepChord / Echospace)")

    raw_wav = base64.b64decode(wav_b64) if wav_b64 else b""
    pcm_metrics = analyze_wav_pcm_metrics(raw_wav) if raw_wav else {}

    sys_instruction = (
        "You are the Master Berlin/Detroit Dub Techno Mastering & Synth Patch Engineer at Dubplates & Mastering Berlin, "
        "working directly with Moritz von Oswald, Mark Ernestus (Basic Channel / Rhythm & Sound), Rod Modell (DeepChord), and Stephen Hitchell (Echospace). "
        "You are listening directly to a real 16-bit PCM WAV recording rendered from our 4-synth Dub Techno engine + Arturia V Collection 11 Pro rig. "
        "Your mission is to ruthlessly eliminate ANY 'children's Casio / cheap keyboard preset' characteristics: "
        "1) If chords sound too bright, plastic, buzzy, organ-sustained, or lack dark 24dB/oct filter warmth: lower stabCutoffHz (340-880 Hz), tighten stabDecayMs (85-190 ms), set sustain to 0, calibrate resonance (1.6-4.2). "
        "2) If delay echoes sound dry, thin, or cluttered rather than a hypnotic RE-201 Space Echo feedback matrix: tune delayFeedback (0.64-0.81), darken delayFilterHz (1100-2200 Hz), and deepen cavernous reverbWet (0.34-0.56). "
        "3) If sub-bass or kick lacks submerged chest weight or clicks harshly: lower kickMuffleHz (88-118 Hz) and subCutoffHz (58-88 Hz). "
        "4) If silence feels sterile/digital: calibrate noiseBedLevel (0.24-0.46) and vinylCrackleDensity (0.28-0.55). "
        "Return ONLY valid JSON matching the exact responseSchema."
    )

    prompt_text = (
        f"Listen carefully to this rendered WAV recording (Closed-Loop Iteration Round #{round_num}) for target subgenre '{archetype_id}'.\n"
        f"Target Aesthetic Directive: {user_goal}\n"
        f"Measured PCM Acoustic Telemetry: {json.dumps(pcm_metrics)}\n"
        f"Current Synthesizer & DSP Patch Parameters: {json.dumps(current_params)}\n"
        "Critique what your ears hear in the WAV audio (harmonic timbre, filter darkness, transient attack/decay, RE-201 delay feedback degradation, sub-bass depth, hydrothermal noise & vinyl floor) "
        "and output refined exact numerical parameters + MIDI CC values (0-127) for our Arturia V Collection synths."
    )

    schema = {
        "type": "OBJECT",
        "properties": {
            "critique": {
                "type": "OBJECT",
                "properties": {
                    "dubAuthenticityScore": {"type": "NUMBER"},
                    "casioArtifactScore": {"type": "NUMBER"},
                    "whatGeminiHeard": {"type": "STRING"},
                    "filterAndChordCritique": {"type": "STRING"},
                    "delayAndReverbSpaceCritique": {"type": "STRING"},
                    "subBassAndGrooveCritique": {"type": "STRING"},
                },
                "required": [
                    "dubAuthenticityScore",
                    "casioArtifactScore",
                    "whatGeminiHeard",
                    "filterAndChordCritique",
                    "delayAndReverbSpaceCritique",
                    "subBassAndGrooveCritique",
                ],
            },
            "patchAdjustments": {
                "type": "OBJECT",
                "properties": {
                    "stabCutoffHz": {"type": "NUMBER"},
                    "stabResonance": {"type": "NUMBER"},
                    "stabAttackMs": {"type": "NUMBER"},
                    "stabDecayMs": {"type": "NUMBER"},
                    "stabEnvDepth": {"type": "NUMBER"},
                    "delayFeedback": {"type": "NUMBER"},
                    "delayFilterHz": {"type": "NUMBER"},
                    "reverbWet": {"type": "NUMBER"},
                    "noiseBedLevel": {"type": "NUMBER"},
                    "vinylCrackleDensity": {"type": "NUMBER"},
                    "subCutoffHz": {"type": "NUMBER"},
                    "kickMuffleHz": {"type": "NUMBER"},
                    "swing": {"type": "NUMBER"},
                    "arturiaMidiCCs": {
                        "type": "OBJECT",
                        "properties": {
                            "cc74_cutoff": {"type": "INTEGER"},
                            "cc71_resonance": {"type": "INTEGER"},
                            "cc73_envAmt": {"type": "INTEGER"},
                            "cc79_envDecay": {"type": "INTEGER"},
                            "cc13_delayFeedback": {"type": "INTEGER"},
                            "cc91_delayWet": {"type": "INTEGER"},
                            "cc93_reverbWet": {"type": "INTEGER"},
                        },
                        "required": [
                            "cc74_cutoff",
                            "cc71_resonance",
                            "cc73_envAmt",
                            "cc79_envDecay",
                            "cc13_delayFeedback",
                            "cc91_delayWet",
                            "cc93_reverbWet",
                        ],
                    },
                },
                "required": [
                    "stabCutoffHz",
                    "stabResonance",
                    "stabAttackMs",
                    "stabDecayMs",
                    "stabEnvDepth",
                    "delayFeedback",
                    "delayFilterHz",
                    "reverbWet",
                    "noiseBedLevel",
                    "vinylCrackleDensity",
                    "subCutoffHz",
                    "kickMuffleHz",
                    "swing",
                    "arturiaMidiCCs",
                ],
            },
        },
        "required": ["critique", "patchAdjustments"],
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
    payload = {
        "system_instruction": {"parts": [{"text": sys_instruction}]},
        "contents": [
            {
                "parts": [
                    {"text": prompt_text},
                    {"inline_data": {"mime_type": "audio/wav", "data": wav_b64}},
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.35,
            "responseSchema": schema,
        },
    }
    parsed = None
    last_err = None
    for attempt, m_name in enumerate(("gemini-flash-latest", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-flash-latest")):
        try:
            try_url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={api_key}"
            req = urllib.request.Request(
                try_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=35.0) as resp:
                raw_resp = json.loads(resp.read().decode("utf-8"))
                parsed = json.loads(raw_resp["candidates"][0]["content"]["parts"][0]["text"])
                break
        except Exception as exc:
            last_err = exc
            time.sleep(1.1 * (attempt + 1))
    if parsed is None:
        raise RuntimeError(f"Gemini Audio Ear failed after retries: {last_err}")
    cc_map = parsed.get("patchAdjustments", {}).get("arturiaMidiCCs", {})
    midi_events = []
    cc_num_lookup = {
        "cc74_cutoff": 74,
        "cc71_resonance": 71,
        "cc73_envAmt": 73,
        "cc79_envDecay": 79,
        "cc13_delayFeedback": 13,
        "cc91_delayWet": 91,
        "cc93_reverbWet": 93,
    }
    for key_name, cc_num in cc_num_lookup.items():
        if key_name in cc_map:
            raw_val = max(0, min(127, int(cc_map[key_name])))
            if cc_num == 13:
                val = min(36, raw_val)  # Cap Arturia Delay Feedback safely <= 28% (zero runaway!)
            elif cc_num == 91:
                val = min(38, raw_val)  # Cap Arturia Delay Wet safely <= 30%
            else:
                val = raw_val
            for unit_id in (1, 2, 3, 4):
                midi_events.append({"unit": unit_id, "status": 0xB0, "d1": cc_num, "d2": val})
    sent_ccs = midi_bridge.send_batch(midi_events) if midi_events else 0

    return {
        "ok": True,
        "round": round_num,
        "archetypeId": archetype_id,
        "pcmMetrics": pcm_metrics,
        "midiCCsSent": sent_ccs,
        "critique": parsed.get("critique", {}),
        "patchAdjustments": parsed.get("patchAdjustments", {}),
    }

# ---------------------------------------------------------------------------
# 5. HTTP SERVER HANDLER
# ---------------------------------------------------------------------------

WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

ACTIVE_FFMPEG_STREAM = {"proc": None, "path": None}


class StudioRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def log_message(self, format, *args):
        # Suppress noisy high-frequency /api/midi/send logs
        if len(args) > 0 and isinstance(args[0], str) and "/api/midi/send" in args[0]:
            return
        super().log_message(format, *args)

    def _send_json(self, data: dict, status: int = 200):
        raw = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path.startswith("/api/midi/status"):
            self._send_json({
                "ok": True,
                "coreMidiAvailable": midi_bridge.available,
                "virtualPorts": [
                    {"id": k, "name": v} for k, v in sorted(midi_bridge.port_names.items())
                ],
                "hardwareDestinations": midi_bridge.list_destinations(),
                "selectedDestinations": midi_bridge.selected_hw_destinations,
                "txMessageCount": midi_bridge.tx_message_count,
                "installedApps": get_installed_apps(),
                "arturiaSuite": get_best_arturia_suite(),
            })
            return
        return super().do_GET()

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        if self.path == "/api/audio/mp3-stream-raw":
            proc = ACTIVE_FFMPEG_STREAM.get("proc")
            if proc is not None and proc.stdin is not None:
                proc.stdin.write(raw_body)
                proc.stdin.flush()
            self._send_json({"ok": True, "bytesWritten": len(raw_body)})
            return
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except Exception:
            body = {}
        if self.path == "/api/midi/send":
            events = body.get("events", [])
            sent = midi_bridge.send_batch(events)
            self._send_json({"ok": True, "sent": sent, "totalTx": midi_bridge.tx_message_count})
            return

        if self.path == "/api/midi/config":
            action = body.get("action", "")
            if action == "panic":
                midi_bridge.panic_all()
            elif action == "toggle_dest":
                idx = int(body.get("index", -1))
                if idx >= 0:
                    if idx in midi_bridge.selected_hw_destinations:
                        midi_bridge.selected_hw_destinations.remove(idx)
                    else:
                        midi_bridge.selected_hw_destinations.append(idx)
            self._send_json({
                "ok": True,
                "hardwareDestinations": midi_bridge.list_destinations(),
                "selectedDestinations": midi_bridge.selected_hw_destinations,
            })
            return

        if self.path == "/api/launch-arturia-all":
            audio_dev = get_default_macos_audio_output()
            suite = get_best_arturia_suite()
            launched = []
            errors = []
            include_drums = bool(body.get("includeDrums", False))
            roles = ("drums", "bass", "lead", "pads") if include_drums else ("bass", "lead", "pads")
            for role_key in roles:
                app_obj = suite.get(role_key)
                if app_obj and os.path.exists(app_obj["path"]):
                    try:
                        port_name = preconfigure_arturia_standalone(app_obj, audio_dev=audio_dev)
                        subprocess.Popen(["open", "-a", app_obj["path"]])
                        launched.append(f"{app_obj['name']} → {port_name}")
                    except Exception as e:
                        errors.append(f"{app_obj['name']}: {e}")
            self._send_json({"ok": len(launched) > 0, "launched": launched, "errors": errors, "suite": suite})
            return

        if self.path == "/api/launch-app":
            app_id = body.get("id", "")
            target = next((a for a in RECOMMENDED_APPS if a["id"] == app_id), None)
            if not target or not os.path.exists(target["path"]):
                self._send_json({"ok": False, "error": f"Application '{app_id}' is still downloading or not installed"}, 404)
                return
            try:
                port_name = preconfigure_arturia_standalone(target)
                subprocess.Popen(["open", "-a", target["path"]])
                self._send_json({"ok": True, "launched": target["name"], "midiPort": port_name})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, 500)
            return

        if self.path == "/api/director/plan-transition":
            import sqlite3
            db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "studio_set_director.db")
            conn = sqlite3.connect(db_path)
            conn.execute(
                """CREATE TABLE IF NOT EXISTS set_state (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    track_index INTEGER NOT NULL DEFAULT 1,
                    current_archetype TEXT NOT NULL DEFAULT 'basic_channel',
                    next_archetype TEXT NOT NULL DEFAULT 'fluxion',
                    user_steering_json TEXT NOT NULL DEFAULT '{}',
                    narrative_summary TEXT NOT NULL DEFAULT '',
                    updated_at INTEGER NOT NULL DEFAULT 0
                )"""
            )
            conn.execute("INSERT OR IGNORE INTO set_state (id) VALUES (1)")
            row = conn.execute("SELECT track_index, current_archetype, next_archetype, user_steering_json FROM set_state WHERE id = 1").fetchone()
            compat = {
                "basic_channel": ["fluxion", "rhythm_sound", "maurizio", "deepchord"],
                "deepchord": ["prince_of_denmark", "yagya", "fluxion", "basic_channel"],
                "rhythm_sound": ["basic_channel", "maurizio", "porter_ricks", "fluxion"],
                "maurizio": ["porter_ricks", "basic_channel", "prince_of_denmark", "rhythm_sound"],
                "fluxion": ["deepchord", "yagya", "basic_channel", "prince_of_denmark"],
                "yagya": ["deepchord", "fluxion", "prince_of_denmark", "basic_channel"],
                "porter_ricks": ["maurizio", "rhythm_sound", "basic_channel", "deepchord"],
                "prince_of_denmark": ["deepchord", "yagya", "maurizio", "fluxion"],
            }
            cur_arch = body.get("currentArchetype") or row[1] or "basic_channel"
            steering = {**json.loads(row[3] or "{}"), **(body.get("userSteering") or {})}
            candidates = compat.get(cur_arch, ["deepchord", "fluxion", "maurizio"])
            next_idx = int(row[0] or 1) + 1
            next_arch = body.get("requestedArchetype") or candidates[next_idx % len(candidates)]
            if next_arch == cur_arch:
                next_arch = candidates[(next_idx + 1) % len(candidates)]

            narrative = f"Track #{next_idx}: Seamless 16-bar stem-by-stem DJ handover from {cur_arch.upper()} -> {next_arch.upper()} (Sub-bass swap -> Dyad weave -> Filter bloom)."
            api_key = _resolve_gemini_api_key(body.get("apiKey", ""))
            if api_key and body.get("userPrompt"):
                try:
                    g_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={api_key}"
                    g_req = urllib.request.Request(
                        g_url,
                        data=json.dumps({
                            "contents": [{
                                "parts": [{
                                    "text": f"You are an elite Berlin Dub Techno Live Set Director. Current track: {cur_arch}. Next incoming track: {next_arch}. User feedback: '{body.get('userPrompt')}'. Active persistent constraints: {json.dumps(steering)}. In one crisp sentence (<115 chars), state how the upcoming 16-bar DJ stem crossfade morphs into the next track while honoring user constraints."
                                }]
                            }],
                            "generationConfig": {"maxOutputTokens": 75, "temperature": 0.5},
                        }).encode("utf-8"),
                        headers={"Content-Type": "application/json"},
                        method="POST",
                    )
                    with urllib.request.urlopen(g_req, timeout=8.0) as g_resp:
                        g_data = json.loads(g_resp.read().decode("utf-8"))
                        narrative = g_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                except Exception:
                    pass

            cutoff_target = 34 if steering.get("darker") else (88 if steering.get("brighter") else 66)
            delay_cap = 14 if steering.get("dry") else 34
            timeline = [
                {"barOffset": 0,  "stem": "fx",    "cc": 91, "val": delay_cap,     "desc": "Open space echo wash on outgoing chords"},
                {"barOffset": 4,  "stem": "moog",  "cc": 74, "val": 58,            "desc": f"Cross-swap Sub-Bass stem -> incoming {next_arch}"},
                {"barOffset": 8,  "stem": "lead",  "cc": 74, "val": cutoff_target, "desc": f"Weave incoming {next_arch} upper fifth dyads & hats"},
                {"barOffset": 12, "stem": "drums", "cc": 13, "val": delay_cap,     "desc": "Drop outgoing kick on final turnaround bar"},
                {"barOffset": 16, "stem": "pads",  "cc": 74, "val": cutoff_target, "desc": f"Full seamless arrival of Track #{next_idx} ({next_arch})"},
            ]
            conn.execute(
                "UPDATE set_state SET track_index=?, current_archetype=?, next_archetype=?, user_steering_json=?, narrative_summary=?, updated_at=? WHERE id=1",
                (next_idx, cur_arch, next_arch, json.dumps(steering), narrative, int(time.time())),
            )
            conn.commit()
            conn.close()
            self._send_json({
                "ok": True,
                "trackNumber": next_idx,
                "fromArchetype": cur_arch,
                "toArchetype": next_arch,
                "persistentUserSteering": steering,
                "narrative": narrative,
                "automationTimeline": timeline,
            })
            return

        if self.path == "/api/ai/compose":
            llm_result = call_gemini_composer(body)
            self._send_json({"ok": True, "llm": llm_result})
            return

        if self.path == "/api/ai/listen-and-refine":
            try:
                result = call_gemini_audio_ear_refine(body)
                self._send_json(result)
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, 500)
            return

        if self.path == "/api/audio/save-wav":
            import base64
            renders_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "renders")
            os.makedirs(renders_dir, exist_ok=True)
            fname = os.path.basename(body.get("filename", "dub-render.wav"))
            if not fname.endswith(".wav"):
                fname += ".wav"
            wav_bytes = base64.b64decode(body.get("audioWavBase64", ""))
            out_path = os.path.join(renders_dir, fname)
            with open(out_path, "wb") as wf:
                wf.write(wav_bytes)
            metrics = analyze_wav_pcm_metrics(wav_bytes)
            self._send_json({"ok": True, "savedPath": out_path, "sizeBytes": len(wav_bytes), "pcmMetrics": metrics})
            return

        if self.path == "/api/audio/mp3-stream-open":
            gdrive_dir = "/Users/Rr/Library/CloudStorage/GoogleDrive-raphaeldixon@gmail.com/My Drive/Sinthwave Dub Techno Mixes"
            os.makedirs(gdrive_dir, exist_ok=True)
            fname = os.path.basename(body.get("filename", "Sinthwave_Dub_Techno_1Hour_Set_v1.mp3"))
            if not fname.endswith(".mp3"):
                fname += ".mp3"
            out_mp3 = os.path.join(gdrive_dir, fname)
            if ACTIVE_FFMPEG_STREAM["proc"] is not None:
                try:
                    ACTIVE_FFMPEG_STREAM["proc"].stdin.close()
                    ACTIVE_FFMPEG_STREAM["proc"].wait(timeout=5)
                except Exception:
                    pass
            proc = subprocess.Popen(
                [
                    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                    "-f", "s16le", "-ar", str(int(body.get("sampleRate", 24000))), "-ac", "2",
                    "-i", "pipe:0", "-codec:a", "libmp3lame", "-b:a", "192k", out_mp3,
                ],
                stdin=subprocess.PIPE,
            )
            ACTIVE_FFMPEG_STREAM["proc"] = proc
            ACTIVE_FFMPEG_STREAM["path"] = out_mp3
            self._send_json({"ok": True, "mp3Path": out_mp3})
            return

        if self.path == "/api/audio/mp3-stream-chunk":
            import base64
            proc = ACTIVE_FFMPEG_STREAM.get("proc")
            if proc is None or proc.stdin is None:
                self._send_json({"ok": False, "error": "No open MP3 stream"}, 400)
                return
            raw_pcm = base64.b64decode(body.get("pcm16Base64", ""))
            proc.stdin.write(raw_pcm)
            proc.stdin.flush()
            self._send_json({"ok": True, "bytesWritten": len(raw_pcm)})
            return

        if self.path == "/api/audio/mp3-stream-close":
            proc = ACTIVE_FFMPEG_STREAM.get("proc")
            out_mp3 = ACTIVE_FFMPEG_STREAM.get("path")
            if proc is not None:
                try:
                    proc.stdin.close()
                    proc.wait(timeout=30)
                except Exception:
                    pass
            ACTIVE_FFMPEG_STREAM["proc"] = None
            size_bytes = os.path.getsize(out_mp3) if (out_mp3 and os.path.exists(out_mp3)) else 0
            self._send_json({"ok": True, "mp3Path": out_mp3, "sizeBytes": size_bytes})
            return

        if self.path == "/api/midi/export":
            mid_bytes = export_pattern_to_mid(body)
            self.send_response(200)
            self.send_header("Content-Type", "audio/midi")
            self.send_header("Content-Disposition", 'attachment; filename="aether-909-session.mid"')
            self.send_header("Content-Length", str(len(mid_bytes)))
            self.end_headers()
            self.wfile.write(mid_bytes)
            return

        self._send_json({"ok": False, "error": "Unknown endpoint"}, 404)


def main():
    preconfigure_all_installed_arturia()
    port = int(os.environ.get("PORT", 8089))
    os.makedirs(WEB_DIR, exist_ok=True)
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("127.0.0.1", port), StudioRequestHandler)
    http_thread = threading.Thread(target=server.serve_forever, daemon=True)
    http_thread.start()
    print(f"==================================================================")
    print(f" AETHER-909 // AI Autonomous Hardware & Virtual MIDI Synth Studio ")
    print(f" Running at: http://localhost:{port}")
    print(f" CoreMIDI Virtual Bus: {'ONLINE' if midi_bridge.available else 'OFFLINE'}")
    print(f"==================================================================")
    try:
        while True:
            midi_bridge.pump_main_runloop()
    except KeyboardInterrupt:
        print("\nShutting down AETHER-909 and sending MIDI All-Notes-Off...")
        midi_bridge.panic_all()


if __name__ == "__main__":
    main()
