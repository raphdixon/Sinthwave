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
        self.selected_hw_destinations = [0]  # Default: route to Dest 0 (IAC Driver Bus 1) if present
        self.tx_message_count = 0
        self.last_midi_events = []

        self.port_names = {
            0: "AETHER // Master Bus (All Ch)",
            1: "AETHER // Ch10 808-909 Drums",
            2: "AETHER // Ch2 TB-303 Acid",
            3: "AETHER // Ch3 Moog Sub Bass",
            4: "AETHER // Ch4 Prophet Lead",
            5: "AETHER // Ch5 Juno-CS80 Pads",
        }

        try:
            self.cm = ctypes.cdll.LoadLibrary("/System/Library/Frameworks/CoreMIDI.framework/CoreMIDI")
            self.cf = ctypes.cdll.LoadLibrary("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")

            self.cf.CFStringCreateWithCString.restype = ctypes.c_void_p
            self.cf.CFStringCreateWithCString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_uint32]
            self.cf.CFStringGetCString.restype = ctypes.c_bool
            self.cf.CFStringGetCString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_long, ctypes.c_uint32]

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

            err1 = self.cm.MIDIClientCreate(self._cfstr("AETHER-909 AI Studio"), None, None, ctypes.byref(self.client))
            err2 = self.cm.MIDIOutputPortCreate(self.client, self._cfstr("AETHER-909 Out"), ctypes.byref(self.out_port))

            for pid, name in sorted(self.port_names.items()):
                endpoint = ctypes.c_uint32()
                err = self.cm.MIDISourceCreate(self.client, self._cfstr(name), ctypes.byref(endpoint))
                if err == 0:
                    self.virtual_sources[pid] = endpoint

            self.prop_display_name = self._cfstr("displayName")
            self.prop_name = self._cfstr("name")
            self.available = (err1 == 0 and err2 == 0)
            print(f"[CoreMIDI] Initialized successfully. Created {len(self.virtual_sources)} virtual MIDI ports.")
        except Exception as e:
            print(f"[CoreMIDI] Initialization warning: {e}", file=sys.stderr)

    def _cfstr(self, s: str):
        return ctypes.c_void_p(
            self.cf.CFStringCreateWithCString(None, s.encode("utf-8"), kCFStringEncodingUTF8)
        )

    def list_destinations(self):
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
            result.append({
                "index": i,
                "name": name,
                "enabled": i in self.selected_hw_destinations,
            })
        return result

    def send_batch(self, events):
        """
        events: list of dicts {"port": int, "bytes": [int, ...]}
        port 1..5 = specific instrument port (and mirrored to port 0 Master Bus + enabled hardware destinations)
        port 0 = global/clock/master
        """
        if not self.available or not events:
            return 0
        sent = 0
        with self.lock:
            pkt_buf = ctypes.create_string_buffer(512)
            num_dests = self.cm.MIDIGetNumberOfDestinations()
            active_dests = [
                self.cm.MIDIGetDestination(idx)
                for idx in self.selected_hw_destinations
                if 0 <= idx < num_dests
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

                # 3. Send to enabled physical / IAC destinations
                for dest_ep in active_dests:
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

RECOMMENDED_APPS = [
    {
        "id": "ableton",
        "name": "Ableton Live 12 Suite",
        "role": "Master DAW Host",
        "channel": "All (Ch 1–10)",
        "path": "/Applications/Ableton Live 12 Suite.app",
    },
    {
        "id": "acid_v",
        "name": "Arturia Acid V",
        "role": "TB-303 Bassline Synth",
        "channel": "Ch 2",
        "path": "/Applications/Arturia/Acid V.app",
    },
    {
        "id": "mini_v",
        "name": "Arturia Mini V4",
        "role": "Moog Model D Sub/Bass",
        "channel": "Ch 3",
        "path": "/Applications/Arturia/Mini V4.app",
    },
    {
        "id": "prophet_v",
        "name": "Arturia Prophet-5 V",
        "role": "Classic Analog Lead",
        "channel": "Ch 4",
        "path": "/Applications/Arturia/Prophet-5 V.app",
    },
    {
        "id": "ms20_v",
        "name": "Arturia KORG MS-20 V",
        "role": "Aggressive Modular Lead",
        "channel": "Ch 4",
        "path": "/Applications/Arturia/KORG MS-20 V.app",
    },
    {
        "id": "jup8_v",
        "name": "Arturia Jup-8 V4",
        "role": "Lush 8-Voice Poly Pads",
        "channel": "Ch 5",
        "path": "/Applications/Arturia/Jup-8 V4.app",
    },
    {
        "id": "jun6_v",
        "name": "Arturia Jun-6 V",
        "role": "Juno Chorus Poly Pads",
        "channel": "Ch 5",
        "path": "/Applications/Arturia/Jun-6 V.app",
    },
    {
        "id": "cs80_v",
        "name": "Arturia CS-80 V4",
        "role": "Vangelis Expressive Pads",
        "channel": "Ch 5",
        "path": "/Applications/Arturia/CS-80 V4.app",
    },
]


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
    tracks.append(build_midi_track("Ch10 808-909 Drums", bpm, drum_ev))

    # Track 2: TB-303 Acid (Ch 2 -> 0x91 / 0x81) with overlapping slide notes!
    acid_ev = []
    acid_steps = state.get("acid", [])
    for bar in range(4):
        for s in range(16):
            if s < len(acid_steps) and acid_steps[s].get("active"):
                st_obj = acid_steps[s]
                t0 = (bar * 16 + s) * step_ticks
                note = int(st_obj.get("note", 36))
                vel = 124 if st_obj.get("accent") else int(st_obj.get("vel", 86))
                # Overlap past step_ticks if slide is enabled so hardware 303 & Acid V glide!
                dur = int(step_ticks * 1.18) if st_obj.get("slide") else int(step_ticks * 0.58)
                acid_ev.append((t0, 0x91, note, vel))
                acid_ev.append((t0 + dur, 0x81, note, 0))
    tracks.append(build_midi_track("Ch2 TB-303 Acid", 0, acid_ev))

    # Track 3: Moog Sub Bass (Ch 3 -> 0x92 / 0x82)
    bass_ev = []
    bass_steps = state.get("bass", [])
    for bar in range(4):
        for s in range(16):
            if s < len(bass_steps) and bass_steps[s].get("active"):
                st_obj = bass_steps[s]
                t0 = (bar * 16 + s) * step_ticks
                note = int(st_obj.get("note", 36))
                vel = int(st_obj.get("vel", 95))
                dur = int(step_ticks * float(st_obj.get("gate", 0.75)))
                bass_ev.append((t0, 0x92, note, vel))
                bass_ev.append((t0 + max(30, dur), 0x82, note, 0))
    tracks.append(build_midi_track("Ch3 Moog Sub Bass", 0, bass_ev))

    # Track 4: Prophet Lead (Ch 4 -> 0x93 / 0x83)
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
    tracks.append(build_midi_track("Ch4 Prophet Lead", 0, lead_ev))

    # Track 5: Juno / CS-80 Poly Pads (Ch 5 -> 0x94 / 0x84)
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
    tracks.append(build_midi_track("Ch5 Juno-CS80 Pads", 0, pad_ev))

    header = b"MThd" + struct.pack(">IHHH", 6, 1, len(tracks), ppqn)
    return header + b"".join(tracks)


# ---------------------------------------------------------------------------
# 4. OPTIONAL CLOUD GEMINI API PROXY (IF USER PROVIDES API KEY)
# ---------------------------------------------------------------------------

def call_gemini_composer(prompt_data: dict):
    api_key = (prompt_data.get("apiKey") or os.environ.get("GEMINI_API_KEY", "")).strip()
    model_name = prompt_data.get("model") or "gemini-flash-latest"
    if model_name not in ("gemini-flash-latest", "gemini-flash-lite-latest"):
        model_name = "gemini-flash-latest"
    if not api_key:
        return None

    user_prompt = prompt_data.get("prompt", "Deep Berlin dub techno")
    section = prompt_data.get("section", "GROOVE")
    bpm = prompt_data.get("bpm", 122)
    root = prompt_data.get("rootNote", "D")
    scale = prompt_data.get("scale", "minor")

    sys_instruction = (
        "You are AETHER-909, an elite electronic music producer and hardware MIDI sequencer AI. "
        "CRITICAL RULE: Never use all 5 synths at once! Stage only 2 to 4 synths per section so the track breathes. "
        "Keep the TB-303 Acid ('acid') RESTING (false) unless the prompt/section explicitly calls for acid squelch. "
        "Return ONLY valid JSON with keys: "
        "commentary (string), bpm (number), rootNote (string), scale (string), "
        "activeVoices (object with booleans for drums, acid, moog, lead, pads), "
        "programs (object with MIDI patch integers 0-15 for drums, acid, moog, lead, pads), "
        "macros (object with 0.0-1.0 floats for acidCutoff, acidRes, acidEnvMod, acidDecay, moogCutoff, leadCutoff, padCutoff, delayMix, reverbMix, masterFilter)."
    )
    query = (
        f"Compose an evolving {section} section for prompt: '{user_prompt}'. "
        f"Current key: {root} {scale}, BPM: {bpm}."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    payload = {
        "system_instruction": {"parts": [{"text": sys_instruction}]},
        "contents": [{"parts": [{"text": query}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.85},
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=6.0) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            text = body["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
    except Exception as e:
        print(f"[Gemini API] Fallback to local harmonic engine ({e})", file=sys.stderr)
        return None


# ---------------------------------------------------------------------------
# 5. HTTP SERVER HANDLER
# ---------------------------------------------------------------------------

WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")


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
            })
            return
        return super().do_GET()

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_len) if content_len > 0 else b"{}"
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

        if self.path == "/api/launch-app":
            app_id = body.get("id", "")
            target = next((a for a in RECOMMENDED_APPS if a["id"] == app_id), None)
            if not target or not os.path.exists(target["path"]):
                self._send_json({"ok": False, "error": "Application not found"}, 404)
                return
            try:
                subprocess.Popen(["open", "-a", target["path"]])
                self._send_json({"ok": True, "launched": target["name"]})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, 500)
            return

        if self.path == "/api/ai/compose":
            llm_result = call_gemini_composer(body)
            self._send_json({"ok": True, "llm": llm_result})
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
    port = int(os.environ.get("PORT", 8089))
    os.makedirs(WEB_DIR, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", port), StudioRequestHandler)
    print(f"==================================================================")
    print(f" AETHER-909 // AI Autonomous Hardware & Virtual MIDI Synth Studio ")
    print(f" Running at: http://localhost:{port}")
    print(f" CoreMIDI Virtual Bus: {'ONLINE' if midi_bridge.available else 'OFFLINE'}")
    print(f"==================================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down AETHER-909 and sending MIDI All-Notes-Off...")
        midi_bridge.panic_all()


if __name__ == "__main__":
    main()
