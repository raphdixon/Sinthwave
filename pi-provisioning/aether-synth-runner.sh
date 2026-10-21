#!/usr/bin/env bash
# Always sync latest scripts from /boot/firmware/aether on every boot so SD card updates apply without firstrun reboot
if [ -d /boot/firmware/aether ]; then
  cp -f /boot/firmware/aether/aether-usb-midi-gadget.sh /usr/local/bin/aether-usb-midi-gadget.sh 2>/dev/null || true
  cp -f /boot/firmware/aether/aether-builtin-synth.py /usr/local/bin/aether-builtin-synth.py 2>/dev/null || true
  cp -f /boot/firmware/aether/asound.conf /etc/asound.conf 2>/dev/null || true
  chmod +x /usr/local/bin/aether-usb-midi-gadget.sh /usr/local/bin/aether-builtin-synth.py 2>/dev/null || true
fi

/usr/local/bin/aether-usb-midi-gadget.sh || true

if [ -f /boot/firmware/aether-unit.conf ]; then
  source /boot/firmware/aether-unit.conf
fi
ROLE="${PI_HOSTNAME:-$(hostname)}"

# Ensure Wi-Fi is unblocked and background package installer runs if fluidsynth is not yet installed
raspi-config nonint do_wifi_country AU 2>/dev/null || true
rfkill unblock all 2>/dev/null || true

install_packages_bg() {
  if command -v fluidsynth >/dev/null 2>&1 && [ -f /usr/share/sounds/sf2/FluidR3_GM.sf2 ]; then
    return 0
  fi
  for _ in $(seq 1 60); do
    if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -y && apt-get install -y \
        alsa-utils fluidsynth fluid-soundfont-gm python3-rtmidi python3-numpy && \
        systemctl restart aether-synth.service
      return 0
    fi
    sleep 5
  done
}
install_packages_bg &

# Wait up to 8 seconds for vc4hdmi ALSA card to initialize
for _ in $(seq 1 16); do
  if aplay -l 2>/dev/null | grep -q "vc4hdmi"; then
    break
  fi
  sleep 0.5
done

amixer -c vc4hdmi set PCM 100% unmute 2>/dev/null || true

# Use proven working FluidSynth engine for all 4 roles (with strict per-channel patch & channel isolation!)
if command -v fluidsynth >/dev/null 2>&1 && [ -f /usr/share/sounds/sf2/FluidR3_GM.sf2 ]; then
  INIT_FILE="/tmp/fluidsynth-aether.txt"
  : > "$INIT_FILE"
  # Mute all 16 channels first so this Pi ONLY plays its own instrument channel
  for ch in $(seq 0 15); do
    echo "cc $ch 7 0" >> "$INIT_FILE"
  done

  case "$ROLE" in
    pi-drums*)
      # Unit 1 (Ch 10 -> 0-idx 9): Electronic / TR-808 Drum Kit (Bank 128, Prog 25)
      echo "select 9 1 128 25" >> "$INIT_FILE"
      echo "cc 9 7 127" >> "$INIT_FILE"
      ;;
    pi-moog*|pi-acid*)
      # Unit 2 (Ch 2 & 3 -> 0-idx 1 & 2): Analog Synth Bass 1 (Bank 0, Prog 38)
      echo "select 1 1 0 38" >> "$INIT_FILE"
      echo "select 2 1 0 38" >> "$INIT_FILE"
      echo "cc 1 7 127" >> "$INIT_FILE"
      echo "cc 2 7 127" >> "$INIT_FILE"
      ;;
    pi-lead*)
      # Unit 3 (Ch 4 -> 0-idx 3): Prophet-6 Sawtooth Lead (Bank 0, Prog 81)
      echo "select 3 1 0 81" >> "$INIT_FILE"
      echo "cc 3 7 127" >> "$INIT_FILE"
      ;;
    pi-pads*)
      # Unit 4 (Ch 5 -> 0-idx 4): Minilogue / Kronos Warm Poly Pad (Bank 0, Prog 89)
      echo "select 4 1 0 89" >> "$INIT_FILE"
      echo "cc 4 7 127" >> "$INIT_FILE"
      ;;
    *)
      echo "select 3 1 0 81" >> "$INIT_FILE"
      echo "cc 3 7 127" >> "$INIT_FILE"
      ;;
  esac

  fluidsynth -is -a alsa -o audio.alsa.device=default -m alsa_seq \
    -f "$INIT_FILE" \
    -g 1.6 -r 48000 -c 2 -z 128 \
    /usr/share/sounds/sf2/FluidR3_GM.sf2 &

  while true; do
    GADGET_PORT=$(aconnect -i 2>/dev/null | awk '/f_midi|AETHER/ {print $2}' | tr -d ':' | head -n 1)
    SYNTH_PORT=$(aconnect -o 2>/dev/null | grep -i "FLUID Synth" | awk '{print $2}' | tr -d ':' | head -n 1)
    if [ -n "$GADGET_PORT" ] && [ -n "$SYNTH_PORT" ]; then
      aconnect "${GADGET_PORT}:0" "${SYNTH_PORT}:0" 2>/dev/null || true
    fi
    sleep 2
  done
else
  exec /usr/bin/python3 /usr/local/bin/aether-builtin-synth.py
fi
