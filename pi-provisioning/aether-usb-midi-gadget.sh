#!/usr/bin/env bash
set -e

# Automatically map hostname to unique USB MIDI Product Name & Serial Number
ROLE=$(hostname)
case "$ROLE" in
  pi-drums*)
    SYNTH_ID="1"
    SYNTH_NAME="AETHER-Pi1-Drums"
    ;;
  pi-acid*)
    SYNTH_ID="2"
    SYNTH_NAME="AETHER-Pi2-Acid303"
    ;;
  pi-moog*)
    SYNTH_ID="3"
    SYNTH_NAME="AETHER-Pi3-MoogBass"
    ;;
  pi-lead*)
    SYNTH_ID="4"
    SYNTH_NAME="AETHER-Pi4-ProphetLead"
    ;;
  pi-pads*)
    SYNTH_ID="5"
    SYNTH_NAME="AETHER-Pi5-JunoPads"
    ;;
  *)
    SYNTH_ID="${SYNTH_ID:-1}"
    SYNTH_NAME="${SYNTH_NAME:-AETHER-Pi-Synth}"
    ;;
esac

SERIAL_NUM="AETHER909-000${SYNTH_ID}"

modprobe libcomposite

GADGET_DIR="/sys/kernel/config/usb_gadget/aether_midi"
if [ -d "$GADGET_DIR" ]; then
    exit 0
fi

mkdir -p "$GADGET_DIR"
cd "$GADGET_DIR"

echo 0x1d6b > idVendor
echo 0x0104 > idProduct
echo 0x0100 > bcdDevice
echo 0x0200 > bcdUSB

mkdir -p strings/0x409
echo "$SERIAL_NUM" > strings/0x409/serialnumber
echo "Sinthwave AETHER-909" > strings/0x409/manufacturer
echo "$SYNTH_NAME" > strings/0x409/product

mkdir -p configs/c.1/strings/0x409
echo "USB MIDI Synth Config" > configs/c.1/strings/0x409/configuration
echo 250 > configs/c.1/MaxPower

mkdir -p functions/midi.usb0
echo "$SYNTH_NAME" > functions/midi.usb0/id
echo 1 > functions/midi.usb0/in_ports
echo 1 > functions/midi.usb0/out_ports

ln -s functions/midi.usb0 configs/c.1/

UDC_DEV=$(ls /sys/class/udc | head -n 1)
echo "$UDC_DEV" > UDC
