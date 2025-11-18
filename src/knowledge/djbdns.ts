export const djbdnsKnowledge = `# DJBDNS / TinyDNS - Lightweight DNS Implementation

## Overview
DJBDNS is a DNS suite created by D.J. Bernstein, consisting of several small, focused programs. TinyDNS is the authoritative DNS server component. The suite is known for simplicity, security, and efficiency with a focus on minimizing code and dependencies.

## Key Components
- **tinydns**: Authoritative DNS server
- **dnscache**: Recursive resolver and caching nameserver
- **axfr-get**: Zone transfer client
- **dnsq**: DNS query tool
- **dnsip**: IP lookup utility
- **dnsname**: Reverse DNS lookup
- **dnsroots**: Root servers utility

## Key Features
- Extremely lightweight and fast
- Minimal memory footprint
- Excellent security track record
- Data file format instead of zone file format
- No complex configuration files
- Built-in zone transfer support (via tinydns-get)
- Zone compilation and binary representation
- Can run under daemontools supervision

## Installation

### Linux (Debian/Ubuntu)
\`\`\`bash
apt-get update
apt-get install djbdns ucspi-tcp daemontools daemontools-run
\`\`\`

### Linux (RHEL/CentOS)
\`\`\`bash
yum install djbdns ucspi-tcp daemontools
# or
dnf install djbdns ucspi-tcp daemontools
\`\`\`

### From Source
\`\`\`bash
# Get source
wget http://cr.yp.to/djbdns/djbdns-1.05.tar.gz
tar xzf djbdns-1.05.tar.gz
cd djbdns-1.05

# Compile
make

# Install
./install.sh
\`\`\`

## TinyDNS Data File Format

### Basic Syntax
The data file uses single-character directives:

\`\`\`
# SOA record
.domain.com:ns1.domain.com:admin.domain.com:serial:refresh:retry:expire:ttl:timestamp

# NS record
&domain.com:ns1.domain.com:ttl:timestamp

# A record
+domain.com:ip:ttl:timestamp

# AAAA record (IPv6)
3domain.com:ipv6:ttl:timestamp

# MX record
@domain.com:mail.domain.com:priority:ttl:timestamp

# CNAME record
Cdomain.com:target:ttl:timestamp

# TXT record
'domain.com:txt:ttl:timestamp

# CAA record (newer djbdns)
:domain.com:flags:tag:value:ttl:timestamp

# PTR record (reverse DNS)
^ip:hostname:ttl:timestamp

# SRV record
:service._protocol.domain.com:priority:weight:port:target:ttl:timestamp
\`\`\`

### Complete Example Data File
\`\`\`
# SOA and NS records for example.com
.example.com:ns1.example.com:admin.example.com:2024011701:3600:1800:604800:86400
&example.com:ns1.example.com:86400
&example.com:ns2.example.com:86400

# Nameserver A records
+ns1.example.com:192.0.2.1:86400
+ns2.example.com:192.0.2.2:86400

# A records
+example.com:192.0.2.10:86400
+www.example.com:192.0.2.10:86400
+mail.example.com:192.0.2.20:86400
+ftp.example.com:192.0.2.30:86400

# AAAA records (IPv6)
3example.com:2001:db8::10:86400
3www.example.com:2001:db8::10:86400

# MX records
@example.com:mail.example.com:10:86400
@example.com:mail2.example.com:20:86400

# CNAME records
Caliases.example.com:www.example.com:86400
Cftp2.example.com:ftp.example.com:86400

# TXT records
'example.com:v=spf1 mx -all:86400
'_dmarc.example.com:v=DMARC1; p=quarantine:86400

# CAA records
:example.com:0:issue:letsencrypt.org:86400
:example.com:0:iodef:mailto:security@example.com:86400

# SRV records
:_sip._tcp.example.com:10:60:5060:sipserver.example.com:86400
:_ldap._tcp.example.com:10:10:389:ldapserver.example.com:86400

# PTR records (reverse DNS)
^192.0.2.1:ns1.example.com:86400
^192.0.2.2:ns2.example.com:86400
^192.0.2.10:www.example.com:86400
\`\`\`

### Wildcard Records
\`\`\`
# Wildcard A record
+*.example.com:192.0.2.100:86400

# Wildcard CNAME
C*.sub.example.com:example.com:86400
\`\`\`

## Setting Up TinyDNS

### 1. Create Data Directory
\`\`\`bash
mkdir -p /etc/tinydns
mkdir -p /var/tinydns/root
chown -R tinydns:tinydns /var/tinydns
\`\`\`

### 2. Create Data File
\`\`\`bash
cat > /etc/tinydns/data << 'EOF'
# SOA and NS
.example.com:ns1.example.com:admin.example.com:2024011701:3600:1800:604800:86400
&example.com:ns1.example.com:86400
&example.com:ns2.example.com:86400

# Nameservers
+ns1.example.com:192.0.2.1:86400
+ns2.example.com:192.0.2.2:86400

# Main A records
+example.com:192.0.2.10:86400
+www.example.com:192.0.2.10:86400

# MX
@example.com:mail.example.com:10:86400
+mail.example.com:192.0.2.20:86400
EOF
\`\`\`

### 3. Compile Data File
\`\`\`bash
tinydns-data -f /etc/tinydns/data -c /var/tinydns/root
\`\`\`

### 4. Start with Daemontools
\`\`\`bash
# Create run script
mkdir -p /etc/sv/tinydns/log

cat > /etc/sv/tinydns/run << 'EOF'
#!/bin/sh
exec 2>&1
exec chpst -u tinydns tinydns
EOF

cat > /etc/sv/tinydns/log/run << 'EOF'
#!/bin/sh
exec chpst -u tinydns svlogd -tt /var/log/tinydns
EOF

chmod +x /etc/sv/tinydns/run /etc/sv/tinydns/log/run

# Enable service
ln -s /etc/sv/tinydns /service/tinydns
\`\`\`

### 5. Verify Operation
\`\`\`bash
# Check if listening
ss -lnpu | grep tinydns

# Query locally
dnsq a example.com 127.0.0.1
dnsq mx example.com 127.0.0.1
\`\`\`

## Setting Up DNSCache (Recursive Resolver)

### 1. Create User and Directory
\`\`\`bash
useradd -s /dev/null -d /nonexistent dnscache
mkdir -p /etc/dnscache/root
mkdir -p /var/log/dnscache
chown -R dnscache:dnscache /etc/dnscache /var/log/dnscache
\`\`\`

### 2. Configure Root Nameservers
\`\`\`bash
# Get current root nameservers
dnsroots > /etc/dnscache/root/servers/@

# Or download from IANA
wget -O /etc/dnscache/root/servers/@ https://www.internic.net/domain/named.cache
chown dnscache /etc/dnscache/root/servers/@
\`\`\`

### 3. Configure Forwarders (Optional)
\`\`\`bash
# Forward queries for specific domain
echo "8.8.8.8" > /etc/dnscache/root/servers/example.com

# Set global forwarder
echo "8.8.8.8" > /etc/dnscache/root/forwarders
\`\`\`

### 4. Daemontools Setup
\`\`\`bash
mkdir -p /etc/sv/dnscache/log

cat > /etc/sv/dnscache/run << 'EOF'
#!/bin/sh
exec 2>&1
exec chpst -u dnscache \
    -x /etc/dnscache/root \
    dnscache
EOF

cat > /etc/sv/dnscache/log/run << 'EOF'
#!/bin/sh
exec chpst -u dnscache svlogd -tt /var/log/dnscache
EOF

chmod +x /etc/sv/dnscache/run /etc/sv/dnscache/log/run

ln -s /etc/sv/dnscache /service/dnscache
\`\`\`

### 5. Cache Performance
\`\`\`bash
# Queries per second (check ps output)
ps aux | grep dnscache

# Monitor cache
dnsq a example.com 127.0.0.1
dnsq a google.com 127.0.0.1
\`\`\`

## DNSCache Access Control

### Allow Specific Networks
\`\`\`bash
# Create IP access file
cat > /etc/dnscache/root/ip/192.168.1 << 'EOF'
x
EOF

cat > /etc/dnscache/root/ip/10.0 << 'EOF'
x
EOF

# This allows 192.168.1.0/24 and 10.0.0.0/16
\`\`\`

### Deny Specific IPs
\`\`\`bash
# Deny specific IP
cat > /etc/dnscache/root/ip/192.168.1.50 << 'EOF'
!
EOF
\`\`\`

## Zone Transfers with TinyDNS

### Slave Setup (Receiving Transfers)
\`\`\`bash
# Create slave data script
cat > /var/tinydns/axfr-fetch.sh << 'EOF'
#!/bin/sh
axfr-get example.com 192.0.2.1 /etc/tinydns/data.new
if [ \$? -eq 0 ]; then
    mv /etc/tinydns/data.new /etc/tinydns/data
    cd /var/tinydns/root
    tinydns-data -f /etc/tinydns/data
fi
EOF

chmod +x /var/tinydns/axfr-fetch.sh

# Schedule with cron
# */30 * * * * /var/tinydns/axfr-fetch.sh > /dev/null
\`\`\`

### Master Setup (Sending Transfers)
\`\`\`bash
# Ensure data file is compiled
tinydns-data -f /etc/tinydns/data -c /var/tinydns/root

# TinyDNS automatically supports AXFR for all zones
# Just keep data file updated and recompile
\`\`\`

## Advanced Configuration

### Split Horizon (Multiple Views)
\`\`\`bash
# Create separate data files
cat > /etc/tinydns/data.internal << 'EOF'
# Internal records
+www.example.com:192.168.1.10:86400
@example.com:mail.internal.example.com:10:86400
EOF

cat > /etc/tinydns/data.external << 'EOF'
# External records
+www.example.com:203.0.113.10:86400
@example.com:mail.example.com:10:86400
EOF

# Run multiple tinydns instances on different IPs/ports
# Using daemontools with different configurations
\`\`\`

### Subdomain Delegation
\`\`\`
# Delegate sub.example.com to another nameserver
&sub.example.com:ns.sub.example.com:86400
+ns.sub.example.com:192.0.2.50:86400
\`\`\`

## Useful Tools and Commands

### DNSQuery Tools
\`\`\`bash
# Basic query
dnsq a example.com 127.0.0.1

# Query specific record type
dnsq mx example.com 127.0.0.1
dnsq ns example.com 127.0.0.1
dnsq txt example.com 127.0.0.1

# Reverse DNS lookup
dnsname 192.0.2.10

# IP address lookup
dnsip example.com
dnsip www.example.com
\`\`\`

### Data File Validation
\`\`\`bash
# Compile with verbose output
tinydns-data -f /etc/tinydns/data -c /var/tinydns/root

# Check syntax
grep "^[^#]" /etc/tinydns/data | while read line; do
    # Validate each line format
    echo "Checking: $line"
done
\`\`\`

### Management Commands
\`\`\`bash
# Check service status
svstat /service/tinydns
svstat /service/dnscache

# Restart service
svc -t /service/tinydns
svc -t /service/dnscache

# Stop/start
svc -d /service/tinydns
svc -u /service/tinydns

# Tail logs
tail -f /var/log/tinydns/current
\`\`\`

## Data File Editor Script

### Auto-update Helper
\`\`\`bash
#!/bin/bash
# Function to add record
add_tinydns_record() {
    local record_type=\$1
    local name=\$2
    local target=\$3
    local ttl=\${4:-86400}

    case \$record_type in
        a)
            echo "+\${name}:\${target}:\${ttl}" >> /etc/tinydns/data
            ;;
        mx)
            echo "@\${name}:\${target}:10:\${ttl}" >> /etc/tinydns/data
            ;;
        cname)
            echo "C\${name}:\${target}:\${ttl}" >> /etc/tinydns/data
            ;;
        txt)
            echo "'\${name}:\${target}:\${ttl}" >> /etc/tinydns/data
            ;;
    esac

    # Recompile
    tinydns-data -f /etc/tinydns/data -c /var/tinydns/root
}

# Usage
add_tinydns_record a www.example.com 192.0.2.10
\`\`\`

## Performance Optimization

### TinyDNS Tuning
\`\`\`bash
# Run with multiple processes (if using supervise)
# Create multiple instances on same port with load balancing
# Use UDP buffer size optimization
echo 4194304 > /proc/sys/net/core/rmem_max
echo 4194304 > /proc/sys/net/core/wmem_max
\`\`\`

### DNSCache Optimization
\`\`\`bash
# Increase cache size (if memory permits)
# Set root servers optimally
# Configure forwarders for faster resolution

# Monitor performance
while true; do
    clear
    echo "Testing DNSCache performance:"
    time dnsq a google.com 127.0.0.1
    sleep 1
done
\`\`\`

## Common Issues and Solutions

### 1. Data File Changes Not Taking Effect
- Always recompile after editing: \`tinydns-data -f /etc/tinydns/data -c /var/tinydns/root\`
- Restart tinydns service: \`svc -t /service/tinydns\`
- Check compiled files have correct permissions

### 2. Zone Transfer Failures
- Verify axfr-get syntax is correct
- Check master allows transfers
- Verify network connectivity on port 53
- Ensure data file is properly compiled on master

### 3. DNSCache Not Resolving
- Check root servers file: \`/etc/dnscache/root/servers/@\`
- Verify forwarders if using them
- Check IP access control files
- Monitor logs in \`/var/log/dnscache/\`

### 4. High Memory Usage
- DNSCache is very efficient, check if data file is huge
- Limit tinydns zones
- Monitor with \`top\` or \`ps\`

### 5. Slow Queries
- TinyDNS should be very fast; check system resources
- Verify data file is compiled (not text)
- Use dnsq directly for performance testing
- Check for network issues to upstream

## Tips and Best Practices

1. **Keep Data Files Simple**: One line per record, easy to edit
2. **Use Proper TTLs**: Set shorter TTLs during transitions, longer for stable records
3. **Version Control Data Files**: Keep in git for easy rollback
4. **Monitor Logs**: Use daemontools logging for troubleshooting
5. **Test Before Deploy**: Use dnsq to verify records before compiling
6. **Regular Backups**: Backup /etc/tinydns/data regularly
7. **Use Comments**: Document zones and special records in data file
8. **Separate Zones**: Keep different zones in comments for clarity

## References
- DJB DNS Tools: https://cr.yp.to/djbdns.html
- TinyDNS Documentation: https://cr.yp.to/djbdns/tinydns.html
- DNSCache Documentation: https://cr.yp.to/djbdns/dnscache.html
- Daemontools: https://cr.yp.to/daemontools.html
- ucspi-tcp: https://cr.yp.to/ucspi-tcp.html
`;
