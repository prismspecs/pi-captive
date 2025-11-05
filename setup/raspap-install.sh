#!/bin/bash

# RaspAP Quick Installation Script
# This script installs RaspAP - an all-in-one solution for captive portal on Raspberry Pi

set -e

echo "================================================"
echo "  Raspberry Pi Captive Portal - RaspAP Setup"
echo "================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "Warning: This doesn't appear to be a Raspberry Pi"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "This will install RaspAP with the following features:"
echo "  - WiFi Access Point"
echo "  - DHCP Server"
echo "  - DNS Server"
echo "  - Captive Portal"
echo "  - Web-based administration panel"
echo ""
echo "Default settings:"
echo "  - SSID: raspi-webgui"
echo "  - Password: ChangeMe"
echo "  - Admin Interface: http://10.3.141.1"
echo "  - Admin Login: admin / secret"
echo ""
read -p "Continue with installation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "Installing RaspAP..."
echo "This may take 10-15 minutes..."
echo ""

# Run the official RaspAP installer
curl -sL https://install.raspap.com | bash -s -- --yes

echo ""
echo "================================================"
echo "  Installation Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Reboot your Raspberry Pi: sudo reboot"
echo "  2. Connect to WiFi network 'raspi-webgui' (password: ChangeMe)"
echo "  3. Open browser to http://10.3.141.1"
echo "  4. Login with admin / secret"
echo "  5. Go to Hotspot > Captive Portal and enable it"
echo "  6. Customize your portal page"
echo ""
echo "To deploy the custom webapp:"
echo "  sudo cp -r ../webapp/* /var/www/html/"
echo "  sudo systemctl restart nginx"
echo ""
echo "Remember to change default passwords!"
echo "================================================"

