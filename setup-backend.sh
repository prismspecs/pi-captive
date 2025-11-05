#!/bin/bash

# Backend Setup Script for Captive Portal
# Installs Node.js and configures the real-time backend server

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo"
    exit 1
fi

echo "================================================"
echo "  Captive Portal - Backend Setup"
echo "================================================"
echo ""
echo "Installing Node.js and backend dependencies..."
echo ""

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "[1/4] Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✓ Node.js installed: $(node --version)"
else
    echo "✓ Node.js already installed: $(node --version)"
fi

# Create backend directory
echo ""
echo "[2/4] Setting up backend directory..."
mkdir -p /opt/captive-portal/backend
cp backend/server.js /opt/captive-portal/backend/
cp backend/package.json /opt/captive-portal/backend/

# Install dependencies
echo ""
echo "[3/4] Installing Node.js dependencies..."
cd /opt/captive-portal/backend
npm install --production

# Set permissions
chown -R www-data:www-data /opt/captive-portal

# Install and start systemd service
echo ""
echo "[4/4] Installing systemd service..."
cp $(dirname "$0")/backend/captive-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable captive-backend
systemctl start captive-backend

# Check status
sleep 2
if systemctl is-active --quiet captive-backend; then
    echo ""
    echo "================================================"
    echo "  ✓ Backend Setup Complete!"
    echo "================================================"
    echo ""
    echo "Backend server is running on port 3000"
    echo ""
    echo "Check status: sudo systemctl status captive-backend"
    echo "View logs: sudo journalctl -u captive-backend -f"
    echo ""
else
    echo ""
    echo "✗ Backend failed to start"
    echo "Check logs: sudo journalctl -u captive-backend -n 50"
    exit 1
fi

