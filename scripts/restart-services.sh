#!/bin/bash

# Restart Services Script
# Restarts all captive portal services

echo "================================================"
echo "  Restarting Captive Portal Services"
echo "================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

echo "Stopping services..."
systemctl stop nginx
systemctl stop dnsmasq
systemctl stop hostapd

echo "Waiting 3 seconds..."
sleep 3

echo "Starting services..."
systemctl start hostapd
sleep 2
systemctl start dnsmasq
sleep 2
systemctl start nginx

echo ""
echo "Checking status..."
echo ""

systemctl status hostapd --no-pager | head -3
echo ""
systemctl status dnsmasq --no-pager | head -3
echo ""
systemctl status nginx --no-pager | head -3

echo ""
echo "================================================"
echo "  Services restarted!"
echo "================================================"
echo ""
echo "Run 'bash status-check.sh' for detailed status"

