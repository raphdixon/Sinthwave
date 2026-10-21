#!/usr/bin/env bash
set -e

if [ -f /boot/firmware/aether-unit.conf ]; then
  source /boot/firmware/aether-unit.conf
fi

ROLE="${PI_HOSTNAME:-$(hostname)}"
case "$ROLE" in
  pi-drums*)
    SYNTH_ID="1"
    SYNTH_NAME="${SYNTH_NAME:-AETHER-Pi1-SP404-EP40}"
    ;;
  pi-moog*|pi-acid*)
    SYNTH_ID="2"
    SYNTH_NAME="${SYNTH_NAME:-AETHER-Pi2-MoogSub37}"
    ;;
  pi-lead*)
    SYNTH_ID="3"
    SYNTH_NAME="${SYNTH_NAME:-AETHER-Pi3-Prophet6-Volca}"
    ;;
  pi-pads*)
    SYNTH_ID="4"
    SYNTH_NAME="${SYNTH_NAME:-AETHER-Pi4-Minilogue-Kronos}"
    ;;
  *)
    SYNTH_ID="${SYNTH_ID:-1}"
    SYNTH_NAME="${SYNTH_NAME:-AETHER-Pi1-SP404-EP40}"
    ;;
esac

SERIAL_NUM="AETHER909-000${SYNTH_ID}"

modprobe libcomposite || true

GADGET_DIR="/sys/kernel/config/usb_gadget/aether_midi"
mkdir -p "$GADGET_DIR"
cd "$GADGET_DIR"

echo "" > UDC 2>/dev/null || true
rm -f configs/c.1/acm.usb0 2>/dev/null || true
rm -f configs/c.1/midi.usb0 2>/dev/null || true

echo 0x1d6b > idVendor
echo "0x010${SYNTH_ID}" > idProduct
echo "0x010${SYNTH_ID}" > bcdDevice
echo 0x0200 > bcdUSB
echo 0x00 > bDeviceClass
echo 0x00 > bDeviceSubClass
echo 0x00 > bDeviceProtocol

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
ln -sf functions/midi.usb0 configs/c.1/

UDC_DEV=$(ls /sys/class/udc | head -n 1)
if [ -n "$UDC_DEV" ]; then
  echo "$UDC_DEV" > UDC
fi
