#!/bin/bash

# Quick script to deploy webapp updates to the Pi

if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo"
    exit 1
fi

echo "Deploying updated webapp..."
echo ""

# Backup existing webapp
if [ -d /var/www/html.backup ]; then
    rm -rf /var/www/html.backup
fi

cp -r /var/www/html /var/www/html.backup
echo "✓ Backed up existing webapp"

# Deploy new webapp
rm -rf /var/www/html/*
cp -r webapp/* /var/www/html/

# Set permissions
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

echo "✓ Deployed new webapp files"
echo "✓ Set correct permissions"
echo ""
echo "Restarting nginx..."
systemctl restart nginx

if systemctl is-active --quiet nginx; then
    echo "✓ nginx restarted successfully"
    echo ""
    echo "✓ Webapp updated!"
    echo ""
    echo "The chat feature is now live. Connect to the WiFi and refresh your browser."
else
    echo "✗ nginx failed to restart"
    echo "Check logs: sudo journalctl -u nginx -n 30"
fi

