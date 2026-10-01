# Sinthwave (AETHER-909) // Autonomous AI Hardware & Virtual MIDI Synth Studio

**Sinthwave** (`AETHER-909`) is an infinite, ever-evolving AI-conducted multi-instrument MIDI sequencer, synthesizer studio, and **5× Raspberry Pi Zero 2 W hardware synth rack** controller.

It runs 100% digitally out-of-the-box (via a built-in 48kHz WebAudio Analog-Modeled DSP synth rack + live CoreMIDI output to **Ableton Live 12 Suite** and **Arturia V Collection** synths) and transitions seamlessly to controlling **5 physical headless Raspberry Pi Zero 2 W synthesizer boxes** (which can be swapped out 1-for-1 with real hardware synths like a Moog Minitaur, Roland TB-03, TR-8S, Sequential Prophet, or Juno-60 as you acquire them).

---

## Key Features

- **5 Dedicated Synthesizer Channels**:
  - **Unit 01 (`Ch 10`)**: **TR-808 / TR-909 Rhythm Computer** (Kick, Snare, Clap, Rim, Closed/Open Hats, Ride)
  - **Unit 02 (`Ch 2`)**: **Roland TB-303 Acid Bassline** (18dB/oct resonant diode ladder, Slide, Accent, Overdrive)
  - **Unit 03 (`Ch 3`)**: **Moog Model D / Little Phatty Sub Bass** (Triple VCO + 24dB/oct Transistor Ladder)
  - **Unit 04 (`Ch 4`)**: **Sequential Prophet-5 / Analog Lead** (Poly/Mono Lead + LFO Mod)
  - **Unit 05 (`Ch 5`)**: **Roland Juno-60 / Yamaha CS-80 Lush Poly Pads** (4-Voice Chord Voicings + BBD Stereo Chorus)
- **Dynamic Section-Based Voice Staging (`activeVoices`)**:
  - Never plays all 5 synths non-stop. Stages **2 to 4 synths per section** (`INTRO` → `GROOVE` → `TENSION BUILD` → `PEAK EUPHORIA` → `DUB BREAKDOWN` → `OUTRO`).
  - **Strict TB-303 Acid Restraint (`acidPolicy`)**: Keeps the 303 Acid resting (`AI RESTING`) in non-acid genres and during Intros/Grooves/Breakdowns so it never gets fatiguing, dropping it in only for Builds/Peaks or when explicitly requested (with a manual **`PIN`** override button on every unit).
- **Hybrid AI Conductor (`gemini-flash-latest` & `gemini-flash-lite-latest` + Local Symbolic Theory Engine v2)**:
  - Uses **`gemini-flash-latest`** and **`gemini-flash-lite-latest`** for natural-language prompt interpretation, voice staging, MIDI Program Change (`0xC0`) patch selection, and continuous MIDI CC (`0xB0`) parameter morphing, paired with a `<1ms` local Symbolic Music Theory Engine so the 16-step clock never drops a beat.
- **Pre-Mapped Factory MIDI CC Profiles**:
  - Includes exact factory CC maps extracted from **Arturia V Collection** (`Acid V`, `Mini V4`, `Prophet-5 V`, `Jun-6 V`, `Jup-8 V4`, `CS-80 V4`) alongside hardware synth CC profiles (`Moog Little Phatty`, `Moog Minitaur`, `Sequential Prophet '08 / Rev2`, `Korg Minilogue XD`, `Roland TB-03`, `Roland TR-8S`, `Roland JU-06A`).

---

## Quick Start (Host Computer)

```bash
./start.sh
# Or directly:
/usr/bin/python3 server.py
```

Then open **`http://localhost:8089`** in Chrome or Safari.

---

## Handover & 5× Raspberry Pi Zero 2 W Provisioning

- **[AGENT_HANDOVER_5_PI_SYNTH_RACK.md](./AGENT_HANDOVER_5_PI_SYNTH_RACK.md)**: **Read this first on the machine flashing the 5 Raspberry Pi Zero 2 W boards.** Contains the complete hardware architecture, Mini-HDMI Audio Extractor configuration (`config.txt` / `cmdline.txt`), custom `libcomposite` USB MIDI Gadget setup, and `systemd` headless synth services.
- **[ARCHITECTURE_AND_OPTIONS.md](./ARCHITECTURE_AND_OPTIONS.md)**: Full architectural comparison and Digital-to-Physical MIDI studio blueprint.
- **[`pi-provisioning/`](./pi-provisioning/)**: Ready-to-copy provisioning scripts (`aether-usb-midi-gadget.sh`, `aether-synth-runner.sh`, `aether-synth.service`, `asound.conf`, and `config.txt.snippet`) for the 5 Raspberry Pi Zero 2 W SD cards.
