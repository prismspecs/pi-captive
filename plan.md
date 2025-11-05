# Raspberry Pi Captive Portal Project

## Project Overview
A complete pedagogical implementation for setting up a Raspberry Pi 5 as a WiFi access point with captive portal functionality. This project is designed for educational environments to teach networking concepts including wireless access points, DNS/DHCP configuration, HTTP redirection, and web server management.

When users connect to the WiFi network, they are automatically redirected to a custom webpage, demonstrating the fundamental principles behind commercial captive portal systems used in hotels, airports, and coffee shops.

## Architecture

### Components
1. **WiFi Access Point** - Allows devices to connect wirelessly
2. **DHCP Server** - Assigns IP addresses to connected devices
3. **DNS Server** - Intercepts all DNS queries and redirects to portal
4. **Web Server** - Hosts the captive portal webpage
5. **Firewall Rules** - Redirects HTTP/HTTPS traffic to portal

### Two Implementation Approaches

#### Approach 1: Manual Setup (Recommended for Education)
- **Components**: hostapd, dnsmasq, nginx, iptables
- **Pros**: Full visibility into each component, excellent for learning, production-ready, complete control
- **Cons**: Requires more time, students must understand each service
- **Use Case**: Educational environments, learning networking fundamentals, production deployments
- **Learning Value**: HIGH - Students understand every component and configuration

#### Approach 2: RaspAP (Quick Demonstration)
- **Pros**: Fast installation, web-based configuration, all-in-one solution, good for quick demos
- **Cons**: Less educational value, "black box" behavior, harder to troubleshoot
- **Use Case**: Quick demonstrations, prototyping, time-constrained scenarios
- **Learning Value**: LOW - Hides complexity behind web interface

## Network Configuration

### Default Settings
- **SSID**: PiCaptivePortal
- **WiFi Password**: raspberry (change this!)
- **AP IP Address**: 10.3.141.1
- **DHCP Range**: 10.3.141.50 - 10.3.141.150
- **Gateway**: 10.3.141.1

### Network Flow
```
Client Device → Connects to WiFi
    ↓
DHCP assigns IP (10.3.141.x)
    ↓
DNS query for any domain → resolves to 10.3.141.1
    ↓
HTTP/HTTPS request → iptables redirects to portal
    ↓
Captive Portal webpage served
```

## File Structure
```
pi-captive/
├── plan.md                          # This file
├── README.md                        # User documentation
├── setup/
│   ├── raspap-install.sh           # Quick RaspAP installation
│   ├── manual-install.sh           # Manual component-by-component setup
│   └── config/
│       ├── hostapd.conf            # Access point configuration
│       ├── dnsmasq.conf            # DNS/DHCP configuration
│       └── nginx-default           # Nginx site configuration
├── webapp/
│   ├── index.html                  # Main captive portal page
│   ├── styles/
│   │   └── main.css                # Styles for portal
│   ├── scripts/
│   │   └── app.js                  # Interactive functionality
│   └── assets/
│       └── (images, fonts, etc.)
└── scripts/
    ├── status-check.sh             # Check system status
    └── restart-services.sh         # Restart all services
```

## Security Considerations

### Educational Discussion Points

This section provides important security concepts for classroom discussion:

1. **Default Credentials** - Why default passwords are a critical vulnerability
2. **Wireless Encryption** - WPA2-PSK minimum, WPA3 recommended for production
3. **Unencrypted HTTP Traffic** - Portal operator can inspect all HTTP traffic
4. **Client Isolation** - Preventing clients from seeing each other on the network
5. **Physical Security** - Anyone with physical access can modify configuration
6. **DNS Hijacking Ethics** - Appropriate use cases vs. malicious interception
7. **Rate Limiting** - Protecting web server from abuse
8. **Log Management** - Balancing monitoring with privacy concerns
9. **Regular Updates** - Importance of security patch management
10. **Legal Compliance** - Local regulations regarding WiFi operation and data handling

### Implementation Checklist

Before deploying in any real-world scenario:
- [ ] Change all default passwords (WiFi, system, web interface)
- [ ] Use strong WPA2-PSK encryption (minimum 12 character password)
- [ ] Enable client isolation in hostapd configuration
- [ ] Implement nginx rate limiting
- [ ] Configure log rotation
- [ ] Set up automated security updates
- [ ] Document the network architecture
- [ ] Create incident response plan
- [ ] Post appropriate legal notices on portal page
- [ ] Test all functionality before deployment

## Educational Learning Outcomes

After completing this project, students will be able to:

1. **Configure a Linux-based wireless access point** using hostapd
2. **Implement DNS hijacking** to redirect all domain queries
3. **Set up DHCP services** for automatic IP address assignment
4. **Configure web server** to serve content on port 80
5. **Implement iptables rules** for traffic redirection
6. **Manage systemd services** and troubleshoot issues
7. **Understand captive portal detection** mechanisms in different operating systems
8. **Analyze network traffic** using command-line tools
9. **Apply security best practices** for wireless networks
10. **Troubleshoot network services** using logs and diagnostic tools

## Customization Options

Students can extend this project by:
- Modifying SSID and password configuration
- Creating branded landing pages with institutional logos
- Implementing multi-language support
- Adding user tracking and analytics
- Implementing authentication systems
- Creating content filtering mechanisms
- Adding time-based access control
- Implementing bandwidth limiting per client

## Performance Targets
- Support 20+ concurrent connections
- <100ms redirect latency
- <500ms page load time
- Stable operation for 24+ hours

## Milestones
- [x] Project structure created
- [x] RaspAP installation script
- [x] Manual installation script
- [x] Custom webapp with modern JavaScript
- [x] Configuration templates
- [x] Status monitoring tools
- [x] Documentation complete

## Future Enhancements
- OAuth/social login integration
- Usage analytics dashboard
- Content management system
- Multi-portal support
- Remote management API
- Automatic updates

## Database Schema
N/A - This project uses file-based configuration. If analytics are added in the future, consider:
- `connections` table: timestamp, mac_address, device_type, duration
- `pages_viewed` table: timestamp, session_id, page_url
- `settings` table: key-value configuration storage

