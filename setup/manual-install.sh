#!/bin/bash

# Manual Captive Portal Installation Script
# ==========================================
# 
# PURPOSE: This script installs and configures all components manually for full control
#          and educational understanding of captive portal mechanics.
#
# COMPONENTS INSTALLED:
#   - hostapd: Manages WiFi access point
#   - dnsmasq: Provides DNS and DHCP services
#   - nginx: Web server for portal page
#   - iptables-persistent: Firewall rules
#
# EDUCATIONAL NOTE: Each step is documented to explain what it does and why.
# This script can be used as a reference for understanding the complete setup process.

set -e  # Exit immediately if any command fails

echo "================================================"
echo "  Raspberry Pi Captive Portal - Manual Setup"
echo "================================================"
echo ""
echo "This script will configure your Raspberry Pi as a captive portal."
echo "Each step will be explained as it progresses."
echo ""

# Check if running as root
# WHY: System configuration requires root privileges to modify network settings,
#      install packages, and configure system services.
if [ "$EUID" -ne 0 ]; then 
    echo "ERROR: This script must be run with root privileges"
    echo "Please run: sudo bash manual-install.sh"
    exit 1
fi

# Configuration variables
SSID="CheckThisOut"
PASSWORD=""  # Empty = open network (no password)
INTERFACE="wlan0"
PORTAL_IP="10.3.141.1"
DHCP_RANGE="10.3.141.50,10.3.141.150"

echo "This will set up a captive portal with:"
echo "  - SSID: $SSID"
if [ -z "$PASSWORD" ]; then
    echo "  - Password: (none - open network)"
else
    echo "  - Password: $PASSWORD"
fi
echo "  - Portal IP: $PORTAL_IP"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "[1/7] Updating system packages..."
echo "-----------------------------------"
echo "EXPLANATION: We update package lists and upgrade existing packages to ensure"
echo "             we have the latest security patches and compatibility fixes."
echo ""
apt update
apt upgrade -y
echo ""
echo "System update complete."

echo ""
echo "[2/7] Installing required packages..."
echo "--------------------------------------"
echo "EXPLANATION: Installing four core components:"
echo "  - hostapd: Turns the WiFi adapter into an access point"
echo "  - dnsmasq: Provides both DNS (name resolution) and DHCP (IP assignment)"
echo "  - nginx: Lightweight web server to host the portal page"
echo "  - iptables-persistent: Saves firewall rules so they survive reboots"
echo ""
apt install -y hostapd dnsmasq nginx iptables-persistent
echo ""
echo "All packages installed successfully."

echo ""
echo "[3/7] Configuring network interface..."
echo "---------------------------------------"
echo "EXPLANATION: The wireless interface (wlan0) needs a static IP address because"
echo "             it will act as the gateway for connected clients. We also prevent"
echo "             wpa_supplicant from managing this interface since we're using it"
echo "             as an access point, not as a client."
echo ""
echo "Assigned IP: $PORTAL_IP"
echo "Subnet: 10.3.141.0/24"
echo ""

# Stop services during configuration
# WHY: Prevents conflicts while we modify configuration files
echo "Stopping services temporarily for configuration..."
systemctl stop hostapd dnsmasq nginx 2>/dev/null || true
systemctl stop wpa_supplicant 2>/dev/null || true

# Detect network manager (dhcpcd vs NetworkManager)
# WHY: Raspberry Pi OS Bookworm uses NetworkManager instead of dhcpcd
echo "Detecting network management system..."
if systemctl is-active --quiet NetworkManager; then
    echo "NetworkManager detected (Bookworm or later)"
    
    # Configure NetworkManager to ignore wlan0
    # WHY: NetworkManager interferes with hostapd by trying to manage wlan0
    echo "Configuring NetworkManager to ignore $INTERFACE..."
    mkdir -p /etc/NetworkManager/conf.d
    cat > /etc/NetworkManager/conf.d/wlan0-unmanaged.conf << EOF
[keyfile]
unmanaged-devices=interface-name:$INTERFACE
EOF
    
    # Create systemd service to configure static IP at boot
    # WHY: NetworkManager won't manage it, so we need to set the IP ourselves
    echo "Creating systemd service for static IP configuration..."
    cat > /etc/systemd/system/wlan0-static-ip.service << EOF
[Unit]
Description=Configure static IP for wlan0
Before=hostapd.service
After=network-pre.target
Wants=network-pre.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/ip addr flush dev $INTERFACE
ExecStart=/usr/sbin/ip addr add ${PORTAL_IP}/24 dev $INTERFACE
ExecStart=/usr/sbin/ip link set $INTERFACE up
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable wlan0-static-ip.service
    
    # Apply configuration immediately
    ip addr flush dev $INTERFACE 2>/dev/null || true
    ip addr add ${PORTAL_IP}/24 dev $INTERFACE 2>/dev/null || true
    ip link set $INTERFACE up
    
    # Restart NetworkManager to apply unmanaged configuration
    systemctl restart NetworkManager
    
    echo "NetworkManager configured successfully."
    
elif systemctl list-unit-files | grep -q dhcpcd.service; then
    echo "dhcpcd detected (older Raspberry Pi OS)"
    
    # Configure static IP for wlan0 using dhcpcd
    # WHY: The access point needs a predictable, static IP address
    cat > /etc/dhcpcd.conf << EOF
# Static IP configuration for wlan0
# This interface will serve as the gateway for all connected clients
interface $INTERFACE
    static ip_address=${PORTAL_IP}/24
    nohook wpa_supplicant
EOF
    
    systemctl restart dhcpcd
    echo "dhcpcd configured successfully."
else
    echo "WARNING: No known network manager detected."
    echo "Configuring static IP manually..."
    ip addr flush dev $INTERFACE 2>/dev/null || true
    ip addr add ${PORTAL_IP}/24 dev $INTERFACE
    ip link set $INTERFACE up
fi

# Disable wpa_supplicant on wlan0
# WHY: wpa_supplicant is for WiFi client mode, conflicts with hostapd (AP mode)
systemctl disable wpa_supplicant 2>/dev/null || true

echo "Network interface configured with static IP."

echo ""
echo "[4/7] Configuring hostapd (WiFi Access Point)..."
echo "-------------------------------------------------"
echo "EXPLANATION: hostapd configures the WiFi radio to broadcast as an access point."
echo "             It handles:"
echo "               - SSID broadcast (network name)"
echo "               - WPA2 encryption and authentication"
echo "               - Channel selection and radio parameters"
echo "               - Client association and handshakes"
echo ""
echo "Configuration:"
echo "  SSID: $SSID"
if [ -z "$PASSWORD" ]; then
    echo "  Password: (none - open network)"
    echo "  Security: Open (no encryption)"
else
    echo "  Password: $PASSWORD"
    echo "  Security: WPA2-PSK with CCMP encryption"
fi
echo "  Interface: $INTERFACE"
echo "  Channel: 7 (2.4GHz band)"
echo ""

# Copy configuration template
cp config/hostapd.conf /etc/hostapd/hostapd.conf

# Update SSID and interface in config
# WHY: We use sed to replace placeholders with actual values,
#      making this script reusable with different settings.
sed -i "s/SSID_PLACEHOLDER/$SSID/" /etc/hostapd/hostapd.conf
sed -i "s/INTERFACE_PLACEHOLDER/$INTERFACE/" /etc/hostapd/hostapd.conf

# Configure security based on whether password is provided
# WHY: Open networks (no password) require different configuration than WPA2
if [ -z "$PASSWORD" ]; then
    # Open network configuration (no password)
    SECURITY_CONFIG="# Open network - no authentication required\nauth_algs=1"
else
    # WPA2 secured network configuration
    SECURITY_CONFIG="# WPA2 secured network\nauth_algs=1\nwpa=2\nwpa_key_mgmt=WPA-PSK\nwpa_passphrase=$PASSWORD\nwpa_pairwise=CCMP\nrsn_pairwise=CCMP"
fi

# Replace security placeholder with actual configuration
sed -i "s|# SECURITY_CONFIG_PLACEHOLDER|$SECURITY_CONFIG|" /etc/hostapd/hostapd.conf

# Tell hostapd where to find config
# WHY: The default hostapd configuration may not specify a config file location
echo 'DAEMON_CONF="/etc/hostapd/hostapd.conf"' > /etc/default/hostapd
echo "hostapd configured successfully."

echo ""
echo "[5/7] Configuring dnsmasq (DNS and DHCP)..."
echo "--------------------------------------------"
echo "EXPLANATION: dnsmasq provides two critical services:"
echo ""
echo "  1. DHCP Server: Automatically assigns IP addresses to connecting clients"
echo "     - Clients will receive IPs in range: $DHCP_RANGE"
echo "     - Lease time: 12 hours"
echo "     - Gateway and DNS server both set to: $PORTAL_IP"
echo ""
echo "  2. DNS Server: The 'magic' of the captive portal"
echo "     - ALL DNS queries (any domain name) resolve to $PORTAL_IP"
echo "     - This forces clients to hit our web server no matter what they try to visit"
echo "     - Special handling for captive portal detection domains used by:"
echo "       * Android (connectivitycheck.gstatic.com)"
echo "       * iOS/macOS (captive.apple.com)"
echo "       * Windows (msftconnecttest.com)"
echo "       * Firefox (detectportal.firefox.com)"
echo ""

# Backup original config
# WHY: Preserve the original configuration in case we need to revert
if [ -f /etc/dnsmasq.conf ]; then
    mv /etc/dnsmasq.conf /etc/dnsmasq.conf.backup
    echo "Original dnsmasq.conf backed up to dnsmasq.conf.backup"
fi

# Copy configuration template
cp config/dnsmasq.conf /etc/dnsmasq.conf

# Update variables in config
sed -i "s/INTERFACE_PLACEHOLDER/$INTERFACE/" /etc/dnsmasq.conf
sed -i "s/DHCP_RANGE_PLACEHOLDER/$DHCP_RANGE/" /etc/dnsmasq.conf
sed -i "s/PORTAL_IP_PLACEHOLDER/$PORTAL_IP/g" /etc/dnsmasq.conf
echo "dnsmasq configured successfully."

echo ""
echo "[6/7] Configuring nginx (Web Server)..."
echo "----------------------------------------"
echo "EXPLANATION: nginx serves the captive portal webpage."
echo "             Key configuration points:"
echo "               - Listens on port 80 (HTTP)"
echo "               - Catches ALL domain names with 'server_name _'"
echo "               - Disables caching to ensure fresh content"
echo "               - Handles captive portal detection endpoints"
echo ""

# Configure nginx
cp config/nginx-default /etc/nginx/sites-available/default

# Deploy webapp
echo "Deploying custom webapp to /var/www/html/..."
rm -rf /var/www/html/*
cp -r ../webapp/* /var/www/html/
chown -R www-data:www-data /var/www/html
echo "Webapp deployed successfully."

echo ""
echo "[7/7] Configuring iptables (Firewall Rules)..."
echo "-----------------------------------------------"
echo "EXPLANATION: iptables redirects all HTTP and HTTPS traffic to our portal."
echo "             This ensures clients cannot bypass the portal by:"
echo "               - Using direct IP addresses"
echo "               - Attempting HTTPS connections"
echo "               - Bypassing DNS with hosts file entries"
echo ""
echo "Rules being applied:"
echo "  1. Redirect all port 80 (HTTP) → $PORTAL_IP:80"
echo "  2. Redirect all port 443 (HTTPS) → $PORTAL_IP:80"
echo ""

# Configure iptables for captive portal
# WHY: Even if DNS is bypassed, these rules ensure traffic hits our portal

# NOTE: IP forwarding is commented out by default
# EDUCATIONAL DISCUSSION: Should we provide internet access after showing the portal?
# Uncomment the following lines to enable internet passthrough:
# echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
# sysctl -p
# iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# Redirect all HTTP traffic to portal
iptables -t nat -A PREROUTING -i $INTERFACE -p tcp --dport 80 -j DNAT --to-destination ${PORTAL_IP}:80

# Redirect all HTTPS traffic to portal (will show as HTTP, may cause certificate warnings)
iptables -t nat -A PREROUTING -i $INTERFACE -p tcp --dport 443 -j DNAT --to-destination ${PORTAL_IP}:80

# Save iptables rules for persistence across reboots
# WHY: Without this, rules would be lost on reboot
netfilter-persistent save
echo "Firewall rules configured and saved."

echo ""
echo "Enabling and starting services..."
echo "----------------------------------"
echo "EXPLANATION: We enable services to start automatically on boot, then start them now."
echo "             Start order matters: hostapd first (creates network), then dnsmasq (serves it)."
echo ""

# Unmask and enable services
# WHY: 'unmask' removes any previous disable flags
#      'enable' makes services start on boot
systemctl unmask hostapd
systemctl enable hostapd
systemctl enable dnsmasq
systemctl enable nginx

echo "Starting services in correct order..."
# Start services
# ORDER MATTERS: hostapd must create the network before dnsmasq can serve on it
systemctl start hostapd
sleep 2  # Give hostapd time to initialize the interface
systemctl start dnsmasq
sleep 1
systemctl start nginx

echo ""
echo "Verifying service status..."
if systemctl is-active --quiet hostapd; then
    echo "  [OK] hostapd is running"
else
    echo "  [FAIL] hostapd failed to start"
fi

if systemctl is-active --quiet dnsmasq; then
    echo "  [OK] dnsmasq is running"
else
    echo "  [FAIL] dnsmasq failed to start"
fi

if systemctl is-active --quiet nginx; then
    echo "  [OK] nginx is running"
else
    echo "  [FAIL] nginx failed to start"
fi

echo ""
echo "================================================"
echo "  Installation Complete!"
echo "================================================"
echo ""
echo "SUMMARY OF CONFIGURATION:"
echo "-------------------------"
echo "Network Settings:"
echo "  - SSID: $SSID"
if [ -z "$PASSWORD" ]; then
    echo "  - Password: (none - open network)"
else
    echo "  - Password: $PASSWORD"
fi
echo "  - Portal IP: $PORTAL_IP"
echo "  - DHCP Range: $DHCP_RANGE"
echo ""
echo "Services Running:"
echo "  - hostapd (WiFi Access Point)"
echo "  - dnsmasq (DNS + DHCP Server)"
echo "  - nginx (Web Server)"
echo "  - iptables (Firewall Rules)"
echo ""
echo "NEXT STEPS:"
echo "-----------"
echo "1. REBOOT the Raspberry Pi to ensure all changes take effect:"
echo "   sudo reboot"
echo ""
echo "2. CONNECT a test device:"
echo "   - Scan for WiFi network: $SSID"
if [ -z "$PASSWORD" ]; then
    echo "   - Connect directly (no password required)"
else
    echo "   - Enter password: $PASSWORD"
fi
echo "   - Wait for captive portal popup (should appear automatically)"
echo ""
echo "3. TEST the portal:"
echo "   - If no popup appears, open a browser and visit any HTTP website"
echo "   - You should be redirected to the captive portal page"
echo "   - Try visiting different domains to verify DNS redirection"
echo ""
echo "TROUBLESHOOTING:"
echo "----------------"
echo "If something doesn't work:"
echo "  - Check service status:"
echo "      cd scripts && sudo bash status-check.sh"
echo ""
echo "  - View service logs:"
echo "      sudo journalctl -u hostapd -n 50"
echo "      sudo journalctl -u dnsmasq -n 50"
echo "      sudo tail -f /var/log/nginx/error.log"
echo ""
echo "  - Restart services:"
echo "      cd scripts && sudo bash restart-services.sh"
echo ""
echo "  - Test DNS manually from connected client:"
echo "      nslookup google.com"
echo "      (Should return $PORTAL_IP)"
echo ""
echo "SECURITY WARNING:"
echo "-----------------"
if [ -z "$PASSWORD" ]; then
    echo "IMPORTANT: This is an OPEN network (no password required)."
    echo "Anyone within range can connect. For production use, consider adding WPA2."
    echo "Edit /etc/hostapd/hostapd.conf to add password protection."
else
    echo "IMPORTANT: Change the default WiFi password before production use!"
    echo "Edit /etc/hostapd/hostapd.conf and modify 'wpa_passphrase' line."
fi
echo "Then restart: sudo systemctl restart hostapd"
echo ""
echo "EDUCATIONAL RESOURCES:"
echo "----------------------"
echo "Review README.md for:"
echo "  - Detailed architecture explanation"
echo "  - Configuration file documentation"
echo "  - Troubleshooting guide"
echo "  - Educational exercises"
echo "  - Security considerations"
echo ""
echo "================================================"
echo "Happy Learning!"
echo "================================================"

