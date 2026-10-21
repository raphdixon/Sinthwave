# Sinthwave (AETHER-909) // Autonomous AI Hardware & Virtual MIDI Synth Studio

**Sinthwave** (`AETHER-909`) is an infinite, ever-evolving AI-conducted multi-instrument MIDI sequencer, synthesizer studio, and **5× Raspberry Pi Zero 2 W hardware synth rack** controller.

It runs 100% digitally out-of-the-box (via a built-in 48kHz WebAudio Analog-Modeled DSP synth rack + live CoreMIDI output to **Ableton Live 12 Suite** and **Arturia V Collection** synths) and transitions seamlessly to controlling **5 physical headless Raspberry Pi Zero 2 W synthesizer boxes** (which can be swapped out 1-for-1 with real hardware synths like a Moog Minitaur, Roland TB-03, TR-8S, Sequential Prophet, or Juno-60 as you acquire them).

---

## Key Features (4-Synth Hardware & Raspberry Pi Rig)

- **4 Dedicated Hardware Synthesizer & Sampler Channels**:
  - **Unit 01 (`Ch 10` — `AETHER-Pi1-SP404-EP40`)**: **Roland SP-404MKII / Teenage Engineering EP-40 Sampler** (6 Sample/Drum Pads + MFX / DJFX / Isolator CCs; includes dedicated `LIMITED CC MAPPING` mode for Teenage Engineering EP-40)
  - **Unit 02 (`Ch 2–3` — `AETHER-Pi2-MoogSub37`)**: **Moog Sub 37 Analog Bass** (Ladder Filter Cutoff `CC 19`, Resonance `CC 21`, EG Contour `CC 22`, Decay `CC 23`, Multidrive `CC 18` + Sub Osc `CC 114`, Glide `CC 5` + Legato Slide & Accent)
  - **Unit 03 (`Ch 4` — `AETHER-Pi3-Prophet6-Volca`)**: **Sequential Prophet-6 / Korg Volca FM / Korg Volca Keys Lead & Arp** (Switchable hardware CC profiles for Prophet-6 `CC 102/103/104/62/68`, Volca FM `CC 44/45/49/43/47/41`, and Volca Keys `CC 44/42/46/52/53/11`)
  - **Unit 04 (`Ch 5` — `AETHER-Pi4-Minilogue-Kronos`)**: **Korg Minilogue / Korg Kronos 4-Voice Polyphonic Chords & Pads** (Switchable hardware CC profiles for Korg Minilogue `CC 43/44/45/16/19/29/30/31`, Korg Kronos `CC 74/93/71/73/72/91/7`, and Prophet-6 Poly Chords)
- **Dynamic Section-Based Voice Staging (`activeVoices`)**:
  - Stages **2 to 4 synths per section** (`INTRO` → `GROOVE` → `TENSION BUILD` → `PEAK EUPHORIA` → `DUB BREAKDOWN`) with manual **`PIN`** override on every unit.
- **Hybrid AI Conductor (`gemini-flash-latest` & `gemini-flash-lite-latest` + Local Symbolic Theory Engine v2)**:
  - Uses **`gemini-flash-latest`** and **`gemini-flash-lite-latest`** for natural-language prompt interpretation, voice staging, MIDI Program Change (`0xC0`), and continuous MIDI CC (`0xB0`) parameter morphing, paired with a `<1ms` local Symbolic Music Theory Engine.
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
