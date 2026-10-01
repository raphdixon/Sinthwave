#!/usr/bin/env bash
/usr/local/bin/aether-usb-midi-gadget.sh

ROLE=$(hostname)

case "$ROLE" in
  pi-drums*)
    # Unit 1: Ch 10 808/909 Drums
    fluidsynth -is -a alsa -o audio.alsa.device=default -m alsa_seq \
      -g 1.2 -r 48000 -c 2 -z 128 \
      /usr/share/sounds/sf2/FluidR3_GM.sf2 &
    SYNTH_CLIENT_MATCH="FLUID Synth"
    ;;
  pi-acid*)
    # Unit 2: Ch 2 TB-303 Acid Bassline
    amsynth --headless -a alsa -m alsa -c 2 &
    SYNTH_CLIENT_MATCH="amsynth"
    ;;
  pi-moog*)
    # Unit 3: Ch 3 Moog Sub Bass
    amsynth --headless -a alsa -m alsa -c 3 &
    SYNTH_CLIENT_MATCH="amsynth"
    ;;
  pi-lead*)
    # Unit 4: Ch 4 Prophet / Analog Lead
    amsynth --headless -a alsa -m alsa -c 4 &
    SYNTH_CLIENT_MATCH="amsynth"
    ;;
  pi-pads*)
    # Unit 5: Ch 5 Juno / CS-80 Lush Poly Pads
    amsynth --headless -a alsa -m alsa -c 5 &
    SYNTH_CLIENT_MATCH="amsynth"
    ;;
  *)
    amsynth --headless -a alsa -m alsa -c 1 &
    SYNTH_CLIENT_MATCH="amsynth"
    ;;
esac

# Auto-connect USB Gadget MIDI Input (f_midi) -> Synth ALSA Sequencer Port
while true; do
  GADGET_PORT=$(aconnect -i | awk '/f_midi|AETHER/ {print $2}' | tr -d ':' | head -n 1)
  SYNTH_PORT=$(aconnect -o | grep -i "$SYNTH_CLIENT_MATCH" | awk '{print $2}' | tr -d ':' | head -n 1)
  if [ -n "$GADGET_PORT" ] && [ -n "$SYNTH_PORT" ]; then
    aconnect "${GADGET_PORT}:0" "${SYNTH_PORT}:0" 2>/dev/null || true
  fi
  sleep 3
done
