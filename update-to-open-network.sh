#!/bin/bash

# Quick script to update existing hostapd to open network with SSID "CheckThisOut"

if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo"
    exit 1
fi

echo "Updating hostapd configuration..."
echo "  - New SSID: CheckThisOut"
echo "  - Security: Open (no password)"
echo ""

# Backup current config
cp /etc/hostapd/hostapd.conf /etc/hostapd/hostapd.conf.backup-$(date +%Y%m%d-%H%M%S)

# Update SSID
sed -i 's/^ssid=.*/ssid=CheckThisOut/' /etc/hostapd/hostapd.conf

# Remove WPA security lines (make it open network)
sed -i '/^wpa=/d' /etc/hostapd/hostapd.conf
sed -i '/^wpa_key_mgmt=/d' /etc/hostapd/hostapd.conf
sed -i '/^wpa_passphrase=/d' /etc/hostapd/hostapd.conf
sed -i '/^wpa_pairwise=/d' /etc/hostapd/hostapd.conf
sed -i '/^rsn_pairwise=/d' /etc/hostapd/hostapd.conf

# Ensure auth_algs is set
if ! grep -q "^auth_algs=" /etc/hostapd/hostapd.conf; then
    # Add it after the ssid line
    sed -i '/^ssid=/a auth_algs=1' /etc/hostapd/hostapd.conf
fi

echo "Configuration updated. Restarting hostapd..."
systemctl restart hostapd

sleep 2

if systemctl is-active --quiet hostapd; then
    echo ""
    echo "✓ Success! Your network is now broadcasting as:"
    echo "    SSID: CheckThisOut"
    echo "    Security: Open (no password)"
    echo ""
    echo "Scan for WiFi networks on your device to connect."
else
    echo ""
    echo "✗ Error: hostapd failed to start. Check logs:"
    echo "    sudo journalctl -u hostapd -n 30"
    echo ""
    echo "Your original config was backed up."
fi

