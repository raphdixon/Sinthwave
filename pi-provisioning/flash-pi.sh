#!/usr/bin/env bash
set -euo pipefail

# Usage: ./flash-pi.sh <UNIT_NUMBER_1_TO_5> [TARGET_DISK_OR_BOOTFS]
UNIT="${1:-1}"
TARGET="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMG_PATH="/Users/Rr/Sinthwave/raspios-lite-arm64.img"

case "$UNIT" in
  1)
    PI_HOSTNAME="pi-drums"
    SYNTH_NAME="AETHER-Pi1-SP404-EP40"
    MIDI_CH="10"
    ;;
  2)
    PI_HOSTNAME="pi-moog"
    SYNTH_NAME="AETHER-Pi2-MoogSub37"
    MIDI_CH="3"
    ;;
  3)
    PI_HOSTNAME="pi-lead"
    SYNTH_NAME="AETHER-Pi3-Prophet6-Volca"
    MIDI_CH="4"
    ;;
  4)
    PI_HOSTNAME="pi-pads"
    SYNTH_NAME="AETHER-Pi4-Minilogue-Kronos"
    MIDI_CH="5"
    ;;
  *)
    echo "Error: UNIT must be 1..4"
    exit 1
    ;;
esac

echo "=== Configuring AETHER-909 Unit #${UNIT}: ${SYNTH_NAME} (${PI_HOSTNAME}.local, MIDI Ch ${MIDI_CH}) ==="

configure_bootfs() {
  local BOOTFS="$1"
  mkdir -p "$BOOTFS/aether"
  cp "$SCRIPT_DIR/aether-usb-midi-gadget.sh" "$BOOTFS/aether/"
  cp "$SCRIPT_DIR/aether-synth-runner.sh" "$BOOTFS/aether/"
  cp "$SCRIPT_DIR/aether-builtin-synth.py" "$BOOTFS/aether/"
  cp "$SCRIPT_DIR/asound.conf" "$BOOTFS/aether/"
  cp "$SCRIPT_DIR/aether-synth.service" "$BOOTFS/aether/"
  cp "$SCRIPT_DIR/firstrun.sh" "$BOOTFS/firstrun.sh"

  cat << EOF > "$BOOTFS/aether-unit.conf"
SYNTH_ID="${UNIT}"
PI_HOSTNAME="${PI_HOSTNAME}"
SYNTH_NAME="${SYNTH_NAME}"
MIDI_CH="${MIDI_CH}"
WIFI_SSID="${WIFI_SSID:-Google-Guest-Legacy}"
WIFI_PASS="${WIFI_PASS:-}"
EOF

  touch "$BOOTFS/ssh"
  rm -f "$BOOTFS/user-data" "$BOOTFS/meta-data" "$BOOTFS/network-config" 2>/dev/null || true

  if ! grep -q "dtoverlay=dwc2,dr_mode=peripheral" "$BOOTFS/config.txt"; then
    cat << 'EOF' >> "$BOOTFS/config.txt"

# ============================================================================
# AETHER-909 HEADLESS MINI-HDMI AUDIO + USB OTG GADGET CONFIGURATION
# ============================================================================
hdmi_force_hotplug=1
hdmi_drive=2
hdmi_force_edid_audio=1
dtparam=audio=on
dtoverlay=dwc2,dr_mode=peripheral
EOF
  fi

  local CMDLINE
  CMDLINE=$(cat "$BOOTFS/cmdline.txt" | tr -d '\n')
  if [[ "$CMDLINE" != *"modules-load=dwc2,libcomposite"* ]]; then
    CMDLINE="${CMDLINE} video=HDMI-A-1:1280x720M@60D modules-load=dwc2,libcomposite"
  fi
  if [[ "$CMDLINE" != *"firstrun.sh"* ]]; then
    CMDLINE="${CMDLINE} systemd.run=/boot/firmware/firstrun.sh systemd.run_success_action=reboot systemd.unit=kernel-command-line.target"
  fi
  echo "$CMDLINE" > "$BOOTFS/cmdline.txt"
  sync
  echo "=== Successfully provisioned $BOOTFS for ${SYNTH_NAME} (${PI_HOSTNAME}) ==="
}

if [ -d "/Volumes/bootfs" ] && [ -z "$TARGET" ]; then
  configure_bootfs "/Volumes/bootfs"
  exit 0
fi

if [ -n "$TARGET" ] && [ -d "$TARGET" ]; then
  configure_bootfs "$TARGET"
  exit 0
fi

if [ -n "$TARGET" ]; then
  # Fast path: if the SD card already has a flashed Raspberry Pi OS bootfs partition, update it in 1s!
  diskutil mount "${TARGET}s1" 2>/dev/null || true
  if [ -f "/Volumes/bootfs/kernel8.img" ] && [ "${3:-}" != "--full" ]; then
    echo "Detected existing Raspberry Pi OS bootfs on $TARGET — performing instant 1-second re-provision..."
    configure_bootfs "/Volumes/bootfs"
    diskutil eject "$TARGET"
    echo "=== Done re-provisioning Unit #${UNIT} (${SYNTH_NAME})! ==="
    exit 0
  fi

  RAW_DISK="${TARGET/disk/rdisk}"
  echo "Unmounting $TARGET..."
  diskutil unmountDisk "$TARGET"
  echo "Flashing $IMG_PATH to $RAW_DISK..."
  sudo dd if="$IMG_PATH" of="$RAW_DISK" bs=4m status=progress && sync
  sleep 2
  diskutil mountDisk "$TARGET" || true
  if [ -d "/Volumes/bootfs" ]; then
    configure_bootfs "/Volumes/bootfs"
    diskutil eject "$TARGET"
  fi
  echo "=== Done flashing Unit #${UNIT} (${SYNTH_NAME})! ==="
fi
