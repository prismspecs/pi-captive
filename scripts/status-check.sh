#!/bin/bash

# Status Check Script
# Checks the status of all captive portal components

echo "================================================"
echo "  Captive Portal Status Check"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
    local service=$1
    if systemctl is-active --quiet $service; then
        echo -e "${GREEN}[OK]${NC} $service is running"
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $service is NOT running"
        return 1
    fi
}

check_interface() {
    local interface=$1
    if ip addr show $interface &>/dev/null; then
        local ip=$(ip -4 addr show $interface | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
        if [ ! -z "$ip" ]; then
            echo -e "${GREEN}[OK]${NC} $interface is up (IP: $ip)"
            return 0
        else
            echo -e "${YELLOW}[WARN]${NC} $interface is up but has no IP"
            return 1
        fi
    else
        echo -e "${RED}[FAIL]${NC} $interface is down"
        return 1
    fi
}

echo "Service Status:"
echo "---------------"
check_service hostapd
check_service dnsmasq
check_service nginx
echo ""

echo "Network Interface:"
echo "------------------"
check_interface wlan0
echo ""

echo "Active Connections:"
echo "-------------------"
if command -v iw &> /dev/null; then
    num_clients=$(iw dev wlan0 station dump 2>/dev/null | grep -c "Station")
    echo "Connected clients: $num_clients"
else
    echo "iw tool not installed (install: sudo apt install iw)"
fi
echo ""

echo "DHCP Leases:"
echo "------------"
if [ -f /var/lib/misc/dnsmasq.leases ]; then
    lease_count=$(wc -l < /var/lib/misc/dnsmasq.leases)
    echo "Active leases: $lease_count"
    if [ $lease_count -gt 0 ]; then
        echo ""
        cat /var/lib/misc/dnsmasq.leases
    fi
else
    echo "No lease file found"
fi
echo ""

echo "Recent Nginx Access:"
echo "--------------------"
if [ -f /var/log/nginx/captive-portal-access.log ]; then
    echo "Last 5 requests:"
    tail -5 /var/log/nginx/captive-portal-access.log
elif [ -f /var/log/nginx/access.log ]; then
    echo "Last 5 requests:"
    tail -5 /var/log/nginx/access.log
else
    echo "No nginx access log found"
fi
echo ""

echo "System Resources:"
echo "-----------------"
echo "CPU Temperature: $(vcgencmd measure_temp 2>/dev/null || echo 'N/A')"
echo "Memory Usage:"
free -h | grep Mem
echo ""

echo "================================================"

