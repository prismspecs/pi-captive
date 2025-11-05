# Raspberry Pi Captive Portal

A complete educational implementation of a WiFi captive portal on Raspberry Pi 5. This project demonstrates core networking concepts including access point configuration, DNS hijacking, DHCP server setup, and HTTP redirection.

## Educational Objectives

This project teaches:
1. **Wireless Access Point Configuration** - Understanding hostapd and WiFi radio management
2. **DNS and DHCP Services** - How devices get IP addresses and resolve domain names
3. **HTTP Redirection** - Using iptables and nginx for traffic manipulation
4. **Web Server Configuration** - Serving content with nginx
5. **System Service Management** - Working with systemd services
6. **Network Architecture** - Understanding the data flow in captive portals

## Prerequisites

### Hardware Requirements
- Raspberry Pi 5 (or Pi 4 with WiFi capability)
- MicroSD card (16GB minimum, Class 10 recommended)
- Power supply (official Raspberry Pi power supply recommended)
- Ethernet connection for initial setup (optional but recommended)

### Software Requirements
- Raspberry Pi OS Lite or Desktop (Bookworm or later)
- Internet connection for package installation during setup
- SSH access or direct terminal access

### Knowledge Prerequisites
Students should be familiar with:
- Basic Linux command line navigation
- Understanding of IP addressing and subnets
- Basic networking concepts (DHCP, DNS, HTTP)
- Text editing in Linux (nano, vim, or similar)

## Architecture Overview

### Network Components

The captive portal consists of four main components:

1. **hostapd** - Creates and manages the WiFi access point
   - Configures the WiFi radio to broadcast an SSID
   - Handles WPA2 encryption and client authentication
   - Manages wireless channel selection and radio parameters

2. **dnsmasq** - Provides DNS and DHCP services
   - Assigns IP addresses to connecting clients (DHCP)
   - Intercepts ALL DNS queries and redirects them to the portal
   - Handles special captive portal detection domains

3. **nginx** - Web server hosting the portal page
   - Serves the HTML/CSS/JavaScript portal interface
   - Handles HTTP requests on port 80
   - Configured to catch all domain names

4. **iptables** - Firewall rules for traffic redirection
   - Redirects all HTTP (port 80) traffic to the portal
   - Redirects all HTTPS (port 443) traffic to HTTP
   - Ensures clients cannot bypass the portal

### Data Flow Diagram

```
Client Device Connects to WiFi
         |
         v
hostapd authenticates device
         |
         v
dnsmasq assigns IP address (e.g., 10.3.141.52)
         |
         v
Client tries to access any website (e.g., google.com)
         |
         v
dnsmasq intercepts DNS query, returns 10.3.141.1
         |
         v
Client makes HTTP request to 10.3.141.1
         |
         v
iptables ensures traffic goes to nginx
         |
         v
nginx serves captive portal webpage
```

### Network Configuration Details

- **Access Point IP**: 10.3.141.1
- **Subnet**: 10.3.141.0/24
- **DHCP Range**: 10.3.141.50 - 10.3.141.150 (100 addresses)
- **SSID**: PiCaptivePortal (configurable)
- **WiFi Channel**: 7 (2.4GHz band)
- **Security**: WPA2-PSK with CCMP encryption

## Installation Methods

This project provides two installation approaches. Choose based on your learning objectives:

### Method 1: Manual Installation (Recommended for Learning)

**When to use**: Educational environments, understanding each component, production deployments

**Advantages**:
- Complete control over each configuration file
- Understand how each service works
- Easy to troubleshoot and modify
- Better for learning networking concepts

**Time required**: 30-45 minutes

### Method 2: RaspAP Installation (Quick Setup)

**When to use**: Quick demonstrations, prototyping, non-technical users

**Advantages**:
- Fast installation (15 minutes)
- Web-based configuration interface
- All components pre-configured
- Good for testing the concept quickly

**Time required**: 15 minutes

**Limitations**:
- Less visibility into configuration
- Harder to understand individual components
- Web interface adds complexity

## Step-by-Step Installation

### Preparation (All Methods)

1. **Flash Raspberry Pi OS to SD card**
   ```bash
   # Use Raspberry Pi Imager or similar tool
   # Enable SSH during imaging for headless setup
   ```

2. **Boot and connect to your Pi**
   ```bash
   ssh pi@raspberrypi.local
   # Default password: raspberry
   ```

3. **Update the system**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   sudo reboot
   ```

4. **Clone or download this repository**
   ```bash
   cd ~
   git clone <repository-url> pi-captive
   cd pi-captive
   ```

### Method 1: Manual Installation (Step-by-Step)

The manual installation script performs these steps:

```bash
cd setup
sudo bash manual-install.sh
```

**What this script does** (in order):

**Step 1: System Update**
- Updates package lists
- Upgrades existing packages
- *Why*: Ensures latest security patches and compatibility

**Step 2: Package Installation**
- Installs `hostapd` (access point software)
- Installs `dnsmasq` (DNS and DHCP server)
- Installs `nginx` (web server)
- Installs `iptables-persistent` (firewall rule persistence)
- *Why*: These are the four core components of the captive portal

**Step 3: Network Interface Configuration**
- Configures wlan0 with static IP 10.3.141.1
- Prevents wpa_supplicant from managing wlan0
- *Why*: Access point needs a fixed IP address and dedicated control

**Step 4: hostapd Configuration**
- Copies template from `setup/config/hostapd.conf`
- Sets SSID, password, and WiFi channel
- Configures WPA2 security
- *Why*: Defines how the WiFi access point will operate

**Step 5: dnsmasq Configuration**
- Copies template from `setup/config/dnsmasq.conf`
- Configures DHCP range (10.3.141.50-150)
- Sets up DNS hijacking (all queries return 10.3.141.1)
- *Why*: Clients need IP addresses and must be redirected to portal

**Step 6: nginx Configuration**
- Copies template from `setup/config/nginx-default`
- Configures catch-all server block
- Deploys webapp to `/var/www/html/`
- *Why*: Web server must respond to any domain name request

**Step 7: iptables Configuration**
- Redirects port 80 to 10.3.141.1:80
- Redirects port 443 to 10.3.141.1:80
- Saves rules for persistence
- *Why*: Ensures clients cannot bypass portal by using direct IP or HTTPS

**Step 8: Service Management**
- Enables services to start on boot
- Starts all services
- *Why*: Portal must survive reboots

### Method 2: RaspAP Installation

```bash
cd setup
sudo bash raspap-install.sh
```

**Post-installation configuration**:

1. Reboot the Raspberry Pi:
   ```bash
   sudo reboot
   ```

2. Connect to the WiFi network `raspi-webgui`
   - Password: `ChangeMe`

3. Access the web interface:
   - URL: `http://10.3.141.1`
   - Username: `admin`
   - Password: `secret`

4. Enable captive portal:
   - Navigate to: Hotspot > Captive Portal
   - Enable the captive portal feature
   - Configure as needed

5. Deploy custom webapp (optional):
   ```bash
   sudo cp -r webapp/* /var/www/html/
   sudo systemctl restart nginx
   ```

## Configuration Files Explained

### hostapd.conf

Located at: `setup/config/hostapd.conf`

Key parameters:
```bash
interface=wlan0          # Wireless interface to use
ssid=PiCaptivePortal     # Network name users will see
hw_mode=g                # WiFi mode (g = 2.4GHz)
channel=7                # WiFi channel (1-11 for 2.4GHz)
wpa=2                    # WPA2 security
wpa_passphrase=raspberry # WiFi password (CHANGE THIS)
```

**Educational note**: The channel selection matters. Channels 1, 6, and 11 are non-overlapping in 2.4GHz band. Channel 7 is chosen as a compromise but may conflict with nearby networks.

### dnsmasq.conf

Located at: `setup/config/dnsmasq.conf`

Key parameters:
```bash
interface=wlan0                    # Listen on this interface only
dhcp-range=10.3.141.50,10.3.141.150,12h  # DHCP pool and lease time
address=/#/10.3.141.1              # Redirect ALL DNS queries to portal
```

**Educational note**: The `address=/#/10.3.141.1` line is the "magic" that creates the captive portal. Every DNS query, regardless of domain, returns the portal's IP address.

### nginx-default

Located at: `setup/config/nginx-default`

Key parameters:
```bash
server_name _;                    # Catch all server names
root /var/www/html;               # Document root
location / {                      # Main location block
    try_files $uri $uri/ /index.html;
}
```

**Educational note**: The `server_name _` directive makes nginx respond to ANY domain name, which is essential for a captive portal.

## Testing and Verification

### Step 1: Check Service Status

```bash
cd scripts
sudo bash status-check.sh
```

Expected output:
```
Service Status:
---------------
[OK] hostapd is running
[OK] dnsmasq is running
[OK] nginx is running

Network Interface:
------------------
[OK] wlan0 is up (IP: 10.3.141.1)

Active Connections:
-------------------
Connected clients: 1
```

### Step 2: Connect a Test Device

1. On a phone/laptop, scan for WiFi networks
2. Connect to `PiCaptivePortal`
3. Enter password: `raspberry`
4. Wait for captive portal popup (should appear automatically)
5. If no popup, open a browser and visit any HTTP website

### Step 3: Verify DNS Redirection

From a connected client:
```bash
# These should all return 10.3.141.1
nslookup google.com
nslookup facebook.com
nslookup any-domain-at-all.com
```

### Step 4: Test Portal Page

Visit any HTTP website in a browser. You should see the captive portal page with:
- Welcome message
- Connection information cards
- Interactive color scheme button
- Statistics display button

## Troubleshooting Guide

### Problem: hostapd won't start

**Symptoms**: Service fails immediately after starting

**Diagnosis**:
```bash
sudo systemctl status hostapd
sudo journalctl -u hostapd -n 50
```

**Common causes**:
1. Another service is using wlan0
   - Solution: Disable wpa_supplicant on wlan0
   ```bash
   sudo systemctl stop wpa_supplicant
   sudo systemctl disable wpa_supplicant
   ```

2. Invalid configuration in hostapd.conf
   - Solution: Check for syntax errors
   ```bash
   sudo hostapd -dd /etc/hostapd/hostapd.conf
   ```

3. WiFi interface doesn't support AP mode
   - Solution: Verify with `iw list | grep "Supported interface modes" -A 8`

### Problem: Clients can't get IP addresses

**Symptoms**: WiFi connects but no internet, no IP assigned

**Diagnosis**:
```bash
sudo systemctl status dnsmasq
sudo tail -f /var/log/dnsmasq.log
```

**Common causes**:
1. dnsmasq not listening on wlan0
   - Solution: Check interface setting in dnsmasq.conf

2. IP forwarding interfering
   - Solution: Disable if not needed
   ```bash
   sudo sysctl -w net.ipv4.ip_forward=0
   ```

3. DHCP range conflicts with static IP
   - Solution: Ensure DHCP range doesn't include 10.3.141.1

### Problem: Portal page doesn't appear

**Symptoms**: Clients connect and get IP but see browser errors

**Diagnosis**:
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

**Common causes**:
1. nginx not serving files correctly
   - Solution: Check permissions on /var/www/html/
   ```bash
   sudo chown -R www-data:www-data /var/www/html/
   ```

2. iptables rules missing
   - Solution: Verify rules exist
   ```bash
   sudo iptables -t nat -L -n -v
   ```

3. Client using HTTPS or DNS-over-HTTPS
   - Solution: This is a limitation; educate users to try HTTP sites

### Problem: Portal works but internet doesn't

**Symptoms**: Portal appears, but no internet access afterward

**Note**: This is expected behavior by default. If you want to provide internet access AFTER viewing the portal:

1. Enable IP forwarding:
   ```bash
   sudo sysctl -w net.ipv4.ip_forward=1
   echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
   ```

2. Set up NAT (Network Address Translation):
   ```bash
   sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
   sudo netfilter-persistent save
   ```

## Customization Guide

### Changing WiFi Settings

Edit `setup/config/hostapd.conf` before installation, or `/etc/hostapd/hostapd.conf` after:

```bash
# Change SSID
ssid=YourNetworkName

# Change password (8-63 characters)
wpa_passphrase=YourStrongPassword

# Change channel
channel=1    # or 6, 11 for non-overlapping

# Use 5GHz band (if supported)
hw_mode=a
channel=36
```

Apply changes:
```bash
sudo systemctl restart hostapd
```

### Customizing the Portal Page

The portal webapp is located in `webapp/` directory:

- `index.html` - Main page structure
- `styles/main.css` - All styling and animations
- `scripts/app.js` - Interactive functionality

To deploy changes:
```bash
sudo cp -r webapp/* /var/www/html/
sudo systemctl restart nginx
```

**Customization ideas for students**:
1. Add institution logo
2. Change color schemes
3. Add usage policy or terms of service
4. Implement a login form (requires backend)
5. Add analytics or usage tracking

### Changing Network Range

If 10.3.141.0/24 conflicts with existing networks:

1. Choose new subnet (e.g., 192.168.100.0/24)
2. Update all three configuration files:
   - `setup/config/hostapd.conf` - No changes needed
   - `setup/config/dnsmasq.conf` - Change IP addresses
   - `setup/config/nginx-default` - No changes needed
3. Update static IP in network configuration
4. Update iptables rules with new IP

## Educational Exercises

### Exercise 1: Packet Capture Analysis

Use tcpdump to observe the captive portal in action:

```bash
sudo tcpdump -i wlan0 -n -v port 53
```

Questions:
- What DNS queries do you see?
- What responses are sent back?
- How does this differ from normal DNS operation?

### Exercise 2: Modify DNS Behavior

Try modifying dnsmasq to:
1. Allow certain domains through (whitelist)
2. Return different IPs for different domains
3. Log all DNS queries to a file

### Exercise 3: Security Analysis

Analyze the security implications:
1. What attacks is this vulnerable to?
2. How could someone bypass the captive portal?
3. How would you add authentication?
4. What data can the portal operator see?

### Exercise 4: Performance Testing

Measure portal performance:
1. How many concurrent clients can connect?
2. What is the average page load time?
3. What happens under heavy load?
4. Monitor CPU and memory usage during stress test

## Security Considerations

### Important Warnings

1. **Default Passwords**: Change ALL default passwords:
   - WiFi password in hostapd.conf
   - RaspAP admin password (if using)
   - Raspberry Pi user password

2. **No Encryption**: HTTP traffic is unencrypted
   - Portal operator can see all unencrypted traffic
   - Users should be warned
   - Consider adding HTTPS (requires valid certificate)

3. **No Internet Isolation**: Clients on same network can see each other
   - Add client isolation in hostapd.conf:
   ```bash
   ap_isolate=1
   ```

4. **Physical Security**: Anyone with physical access can:
   - Read configuration files
   - View logs
   - Modify the portal

### Recommended Hardening

For production use:

1. Change default credentials
2. Enable automatic security updates
3. Configure firewall (ufw) for management
4. Disable unnecessary services
5. Implement proper logging and monitoring
6. Regular backup of configuration
7. Use strong WPA2 or WPA3 passwords
8. Consider MAC address filtering (limited security)

## Performance Tuning

### Expected Performance

With default settings:
- Concurrent clients: 20-30 (depends on Pi model)
- Page load time: <500ms on local network
- DNS response time: <50ms
- DHCP assignment time: <2 seconds

### Optimization Tips

1. **Reduce WiFi power consumption**:
   ```bash
   # In hostapd.conf
   wmm_enabled=0  # Disable WiFi Multimedia
   ```

2. **Increase DHCP lease time**:
   ```bash
   # In dnsmasq.conf
   dhcp-range=10.3.141.50,10.3.141.150,24h  # 24 hour leases
   ```

3. **Enable nginx caching**:
   ```nginx
   # In nginx config
   location ~* \.(jpg|jpeg|png|css|js)$ {
       expires 1d;
   }
   ```

4. **Monitor system resources**:
   ```bash
   htop
   iotop
   sudo journalctl -f
   ```

## Advanced Topics

### Adding Authentication

To add user authentication:
1. Install Flask or Node.js backend
2. Create login form in portal page
3. Store credentials (hashed) in SQLite
4. Modify iptables to whitelist authenticated MAC addresses

### Analytics and Logging

Track portal usage:
1. Parse nginx access logs
2. Store connection data in database
3. Create dashboard with visualization
4. Monitor popular landing pages

### Multi-SSID Setup

Broadcast multiple networks:
1. Create multiple hostapd configurations
2. Use separate DHCP ranges
3. Implement VLAN tagging
4. Isolate traffic between networks

## Additional Resources

### Networking Concepts
- [How DNS Works](https://howdns.works/)
- [Understanding DHCP](https://www.youtube.com/watch?v=e6-TaH5bkjo)
- [iptables Tutorial](https://www.frozentux.net/iptables-tutorial/iptables-tutorial.html)

### Raspberry Pi Resources
- [Official Documentation](https://www.raspberrypi.org/documentation/)
- [Network Boot Setup](https://www.raspberrypi.org/documentation/hardware/raspberrypi/bootmodes/net.md)

### Captive Portal Standards
- [RFC 7710 - Captive Portal Identification](https://tools.ietf.org/html/rfc7710)
- [RFC 8910 - Captive Portal API](https://tools.ietf.org/html/rfc8910)

## Frequently Asked Questions

**Q: Can I use this for commercial purposes?**
A: Yes, this project is MIT licensed. However, ensure you comply with local regulations regarding WiFi operation.

**Q: Why doesn't HTTPS redirect work?**
A: HTTPS redirect without valid certificates causes browser warnings. This is by design for security.

**Q: Can I provide internet access after showing the portal?**
A: Yes, enable IP forwarding and NAT (see Troubleshooting section).

**Q: How many devices can connect?**
A: Raspberry Pi 5 can handle 20-30 concurrent clients. Adjust `max_num_sta` in hostapd.conf.

**Q: Does this work on Raspberry Pi Zero?**
A: Yes, but performance will be limited. Recommend Pi 4 or 5 for production.

## Contributing

This is an educational project. Contributions that improve clarity, add educational value, or fix bugs are welcome.

## License

MIT License - Free for educational and commercial use.

## Support

For educational use:
1. Review the Architecture Overview section
2. Run diagnostic scripts in `scripts/` directory
3. Check service logs with `journalctl`
4. Consult the Troubleshooting Guide

For bugs or improvements, refer to the project repository.
