#!/usr/bin/env bash
set +e

BOOT_DIR="/boot/firmware"
if [ ! -d "$BOOT_DIR" ]; then
  BOOT_DIR="/boot"
fi

if [ -f "$BOOT_DIR/aether-unit.conf" ]; then
  source "$BOOT_DIR/aether-unit.conf"
fi

PI_HOSTNAME="${PI_HOSTNAME:-pi-drums}"
WIFI_SSID="${WIFI_SSID:-Google-Guest-Legacy}"
WIFI_PASS="${WIFI_PASS:-}"

# 1. Hostname & disable cloud-init override
mkdir -p /etc/cloud
touch /etc/cloud/cloud-init.disabled
rm -f "$BOOT_DIR/user-data" "$BOOT_DIR/meta-data" "$BOOT_DIR/network-config" 2>/dev/null || true
echo "$PI_HOSTNAME" > /etc/hostname
sed -i "s/127.0.1.1.*/127.0.1.1\t$PI_HOSTNAME/g" /etc/hosts

# 2. User pi (password: raspberry) & passwordless sudo + root serial autologin
if ! id -u pi >/dev/null 2>&1; then
  useradd -m -s /bin/bash -G adm,dialout,cdrom,sudo,audio,video,plugdev,games,users,input,render,netdev,gpio,i2c,spi pi
fi
echo "pi:raspberry" | chpasswd
echo "root:raspberry" | chpasswd
echo "pi ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/010_pi-nopasswd
chmod 440 /etc/sudoers.d/010_pi-nopasswd

# 3. Enable SSH & USB Serial Console (ttyGS0)
systemctl enable ssh.service 2>/dev/null || systemctl enable ssh 2>/dev/null || true
mkdir -p /etc/systemd/system/serial-getty@ttyGS0.service.d
cat << 'EOF' > /etc/systemd/system/serial-getty@ttyGS0.service.d/autologin.conf
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin root -8 --keep-baud 115200,38400,9600 ttyGS0 $TERM
EOF
systemctl enable serial-getty@ttyGS0.service 2>/dev/null || true

# 4. Configure Wi-Fi via NetworkManager
rfkill unblock wifi 2>/dev/null || true
mkdir -p /etc/NetworkManager/system-connections
if [ -z "$WIFI_PASS" ]; then
  cat << EOF > "/etc/NetworkManager/system-connections/${WIFI_SSID}.nmconnection"
[connection]
id=${WIFI_SSID}
type=wifi
autoconnect=true

[wifi]
mode=infrastructure
ssid=${WIFI_SSID}

[ipv4]
method=auto

[ipv6]
method=auto
EOF
else
  cat << EOF > "/etc/NetworkManager/system-connections/${WIFI_SSID}.nmconnection"
[connection]
id=${WIFI_SSID}
type=wifi
autoconnect=true

[wifi]
mode=infrastructure
ssid=${WIFI_SSID}

[wifi-security]
key-mgmt=wpa-psk
psk=${WIFI_PASS}

[ipv4]
method=auto

[ipv6]
method=auto
EOF
fi
chmod 600 "/etc/NetworkManager/system-connections/${WIFI_SSID}.nmconnection"

# 5. Install AETHER-909 scripts, ALSA config, and systemd service
install -m 755 "$BOOT_DIR/aether/aether-usb-midi-gadget.sh" /usr/local/bin/aether-usb-midi-gadget.sh
install -m 755 "$BOOT_DIR/aether/aether-synth-runner.sh" /usr/local/bin/aether-synth-runner.sh
install -m 755 "$BOOT_DIR/aether/aether-builtin-synth.py" /usr/local/bin/aether-builtin-synth.py
install -m 644 "$BOOT_DIR/aether/asound.conf" /etc/asound.conf
install -m 644 "$BOOT_DIR/aether/aether-synth.service" /etc/systemd/system/aether-synth.service

mkdir -p /etc/systemd/system/multi-user.target.wants
ln -sf /etc/systemd/system/aether-synth.service /etc/systemd/system/multi-user.target.wants/aether-synth.service

# 6. Clean up firstrun kernel arguments from cmdline.txt
sed -i 's| systemd.run=/boot/firmware/firstrun.sh systemd.run_success_action=reboot systemd.unit=kernel-command-line.target||g' "$BOOT_DIR/cmdline.txt"
sed -i 's| systemd.run=/boot/firstrun.sh systemd.run_success_action=reboot systemd.unit=kernel-command-line.target||g' "$BOOT_DIR/cmdline.txt"
sync
exit 0
