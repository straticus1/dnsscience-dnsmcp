export const nsdKnowledge = `# NLnet Labs NSD - Authoritative DNS Server

## Overview
NSD (Name Server Daemon) is an open-source authoritative DNS server developed by NLnet Labs. It's designed to be lightweight, efficient, and standards-compliant, making it ideal for authoritative DNS infrastructure.

## Key Features
- Pure authoritative DNS server (no recursive resolver)
- Written in C for performance and efficiency
- DNSSEC support with zone signing
- Zone transfers (AXFR/IXFR)
- Rate limiting and DDoS protection
- Minimal memory footprint
- IPv4 and IPv6 support

## Current Versions
- NSD 4.8+ (Current Stable) - Fully featured
- NSD 4.7 - Still supported
- Regular security updates from NLnet Labs

## Installation

### Linux (Debian/Ubuntu)
\`\`\`bash
apt-get update
apt-get install nsd
\`\`\`

### Linux (RHEL/CentOS)
\`\`\`bash
yum install nsd
# or
dnf install nsd
\`\`\`

### FreeBSD
\`\`\`bash
pkg install nsd
\`\`\`

### From Source
\`\`\`bash
wget https://www.nlnetlabs.nl/downloads/nsd/nsd-latest.tar.gz
tar xzf nsd-latest.tar.gz
cd nsd-latest
./configure --prefix=/usr/local/nsd
make
make install
\`\`\`

## Configuration Files

### Main Configuration: /etc/nsd/nsd.conf
The primary configuration file controlling server behavior and zone definitions.

### Zone Files Location
- Default: /etc/nsd/zones/
- Each zone has its own text file in standard DNS zone format

## Basic Configuration Structure

### Minimal Authoritative Server
\`\`\`
server:
    # Logging
    verbosity: 1
    logfile: "/var/log/nsd.log"

    # Listen addresses
    ip-address: 192.0.2.1
    ip-address: 2001:db8::1
    port: 53

    # Performance
    num-threads: 4
    hide-version: yes
    hide-identity: yes

zone:
    name: "example.com"
    zonefile: "/etc/nsd/zones/db.example.com"
\`\`\`

### Production Configuration with Security
\`\`\`
server:
    # Identity and version hiding
    identity: "ns1"
    version: "1.0"
    hide-version: yes
    hide-identity: yes

    # Listening
    ip-address: 192.0.2.1
    ip-address: 2001:db8::1
    port: 53

    # Performance tuning
    num-threads: 8
    database: "/var/lib/nsd/nsd.db"
    pidfile: "/var/run/nsd/nsd.pid"
    statistics: "/var/lib/nsd/nsd.stats"

    # Logging
    logfile: "/var/log/nsd.log"
    verbosity: 2

    # Zone loading
    zone-stats: yes
    zonefiles-check: mtime

    # Rate limiting
    rrl-size: 4m
    rrl-ratelimit: 200

    # EDNS
    max-udp-size: 4096
    edns-udp-size: 4096

    # DNSSEC
    dnssec-enable: yes

# Key material for zone signing
key:
    name: "tsig-transfer-key"
    algorithm: hmac-sha256
    secret: "d2FudC9kZXRhaWxzPz8/Cg=="

# Multiple zones
zone:
    name: "example.com"
    zonefile: "/etc/nsd/zones/db.example.com"
    notify: 192.0.2.2 tsig-transfer-key
    provide-xfr: 192.0.2.2 tsig-transfer-key
    allow-query: 0.0.0.0/0
    allow-query: ::/0

zone:
    name: "example.net"
    zonefile: "/etc/nsd/zones/db.example.net"
    notify: 192.0.2.3 NOKEY
    provide-xfr: 192.0.2.3 NOKEY

# Access control (remote-control)
remote-control:
    control-enable: yes
    control-port: 8953
    server-key-file: "/etc/nsd/nsd_server.key"
    server-cert-file: "/etc/nsd/nsd_server.pem"
    control-key-file: "/etc/nsd/nsd_control.key"
    control-cert-file: "/etc/nsd/nsd_control.pem"
\`\`\`

## Zone File Format

### Standard Zone File
\`\`\`
; Zone file for example.com
\$TTL 86400
@   IN  SOA ns1.example.com. admin.example.com. (
            2024011701  ; Serial (YYYYMMDDNN)
            3600        ; Refresh (1 hour)
            1800        ; Retry (30 minutes)
            604800      ; Expire (1 week)
            86400       ; Minimum TTL (1 day)
)

; Name servers
@       IN  NS  ns1.example.com.
@       IN  NS  ns2.example.com.

; A records
ns1     IN  A   192.0.2.1
ns2     IN  A   192.0.2.2
www     IN  A   192.0.2.10
@       IN  A   192.0.2.10

; AAAA records
ns1     IN  AAAA    2001:db8::1
ns2     IN  AAAA    2001:db8::2
www     IN  AAAA    2001:db8::10

; MX records
@       IN  MX  10  mail.example.com.
mail    IN  A   192.0.2.20

; CNAME records
ftp     IN  CNAME   www.example.com.

; TXT records
@       IN  TXT "v=spf1 mx -all"
_dmarc  IN  TXT "v=DMARC1; p=quarantine"

; CAA records
@       IN  CAA 0 issue "letsencrypt.org"
@       IN  CAA 0 iodef "mailto:security@example.com"

; SRV records
_sip._tcp   IN  SRV 10 60 5060 sipserver.example.com.

; TLSA records (DANE)
_443._tcp.www   IN  TLSA 3 1 1 d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2
\`\`\`

## DNSSEC Configuration

### Generating DNSSEC Keys
\`\`\`bash
# Generate ZSK (Zone Signing Key)
ldns-keygen -a ECDSAP256SHA256 example.com

# Generate KSK (Key Signing Key)
ldns-keygen -a ECDSAP256SHA256 -k example.com

# This creates:
# - Kexample.com.+013+12345.key
# - Kexample.com.+013+12345.private
# - Kexample.com.+013+54321.key
# - Kexample.com.+013+54321.private
\`\`\`

### Signing a Zone
\`\`\`bash
# Sign the zone (requires both KSK and ZSK)
ldns-signzone -n -s random \
    -f db.example.com.signed \
    db.example.com \
    Kexample.com.+013+*.private
\`\`\`

### NSD Configuration for DNSSEC
\`\`\`
zone:
    name: "example.com"
    zonefile: "/etc/nsd/zones/db.example.com.signed"
    dnssec-policy: "standard"

dnssec-policy:
    name: "standard"
    keys:
        ksk: algorithm ecdsap256sha256 lifetime unlimited
        zsk: algorithm ecdsap256sha256 lifetime 30d
    nsec3: "1 0 1 ab12cd34"
    publish-safety: 3600
    retire-safety: 3600
\`\`\`

### DS Record Generation
\`\`\`bash
# Generate DS record from KSK
ldns-key2ds -n Kexample.com.+013+12345.key

# Output will include:
# example.com. IN DS 12345 13 2 3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f
\`\`\`

## Zone Management

### Adding a New Zone
\`\`\`bash
# 1. Create zone file
cat > /etc/nsd/zones/db.newdomain.com << 'EOF'
\$TTL 86400
@   IN  SOA ns1.example.com. admin.example.com. (
            2024011701
            3600
            1800
            604800
            86400
)
@   IN  NS  ns1.example.com.
@   IN  NS  ns2.example.com.
@   IN  A   192.0.2.10
EOF

# 2. Update nsd.conf
cat >> /etc/nsd/nsd.conf << 'EOF'

zone:
    name: "newdomain.com"
    zonefile: "/etc/nsd/zones/db.newdomain.com"
EOF

# 3. Check configuration
nsd-checkconf /etc/nsd/nsd.conf

# 4. Reload NSD
nsd-control reload newdomain.com
\`\`\`

### Zone Transfers (Secondary Server Setup)

**Master Configuration:**
\`\`\`
zone:
    name: "example.com"
    zonefile: "/etc/nsd/zones/db.example.com"
    notify: 192.0.2.2 NOKEY
    provide-xfr: 192.0.2.2 NOKEY
\`\`\`

**Secondary Configuration:**
\`\`\`
zone:
    name: "example.com"
    zonefile: "/etc/nsd/zones/db.example.com"
    request-xfr: 192.0.2.1 NOKEY
\`\`\`

With TSIG:
\`\`\`bash
# Generate TSIG key
tsig-keygen -a hmac-sha256 transfer-key > /tmp/tsig.conf
\`\`\`

\`\`\`
# Master
key:
    name: "transfer-key"
    algorithm: hmac-sha256
    secret: "base64encodedkey=="

zone:
    name: "example.com"
    zonefile: "/etc/nsd/zones/db.example.com"
    notify: 192.0.2.2 transfer-key
    provide-xfr: 192.0.2.2 transfer-key

# Secondary
zone:
    name: "example.com"
    zonefile: "/etc/nsd/zones/db.example.com"
    request-xfr: 192.0.2.1 transfer-key
\`\`\`

## Security Best Practices

### 1. Hide Server Information
\`\`\`
server:
    hide-version: yes
    hide-identity: yes
    identity: "ns1"
    version: "1.0"
\`\`\`

### 2. Rate Limiting
\`\`\`
server:
    rrl-size: 4m
    rrl-ratelimit: 200
    rrl-slip: 2
    rrl-window: 60
\`\`\`

### 3. Query Limits
\`\`\`
server:
    max-udp-size: 4096
    edns-udp-size: 4096
    logfile-mode: 0644
\`\`\`

### 4. TSIG Authentication
\`\`\`
key:
    name: "admin-key"
    algorithm: hmac-sha256
    secret: "d2FudC9kZXRhaWxzPz8/Cg=="
\`\`\`

### 5. Remote Control Protection
\`\`\`
remote-control:
    control-enable: yes
    control-interface: 127.0.0.1
    control-port: 8953
    server-key-file: "/etc/nsd/nsd_server.key"
    server-cert-file: "/etc/nsd/nsd_server.pem"
    control-key-file: "/etc/nsd/nsd_control.key"
    control-cert-file: "/etc/nsd/nsd_control.pem"
\`\`\`

## Useful Commands

### Configuration Checking
\`\`\`bash
# Syntax check
nsd-checkconf /etc/nsd/nsd.conf

# Check specific zone
nsd-checkzone example.com /etc/nsd/zones/db.example.com
\`\`\`

### Service Management
\`\`\`bash
# Start/stop/restart
systemctl start nsd
systemctl stop nsd
systemctl restart nsd

# Check status
systemctl status nsd

# Enable on boot
systemctl enable nsd
\`\`\`

### Remote Control Operations
\`\`\`bash
# Reload all zones
nsd-control reload

# Reload specific zone
nsd-control reload example.com

# Flush cache (for recursive resolver only, not applicable)
nsd-control flush_zone example.com

# View statistics
nsd-control stats

# Write database
nsd-control write_db

# Reconfig zones
nsd-control reconfig
\`\`\`

### Zone Management Commands
\`\`\`bash
# List configured zones
nsd-control zonestatus

# Get zone information
nsd-control zonestatus example.com

# Force zone refresh (secondary)
nsd-control force_transfer example.com
\`\`\`

## Performance Tuning

### Threading Configuration
\`\`\`
server:
    # Set to number of CPU cores
    num-threads: 8

    # Increase for high-traffic zones
    max-concurrent-queries: 100
\`\`\`

### Cache and Memory Settings
\`\`\`
server:
    # Increase for large zone counts
    zone-stats: yes

    # Database file for faster startup
    database: "/var/lib/nsd/nsd.db"
\`\`\`

### Network Optimization
\`\`\`
server:
    # UDP buffer sizes
    edns-udp-size: 4096
    max-udp-size: 4096

    # TCP settings
    tcp-query-count: 0  ; unlimited
    tcp-timeout: 120
\`\`\`

## Monitoring and Logging

### Log Rotation
\`\`\`bash
# Create logrotate config
cat > /etc/logrotate.d/nsd << 'EOF'
/var/log/nsd.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nsd nsd
    postrotate
        nsd-control log_reopen
    endscript
}
EOF
\`\`\`

### Statistics Collection
\`\`\`bash
# Enable statistics in nsd.conf
server:
    statistics: "/var/lib/nsd/nsd.stats"

# Query statistics
nsd-control stats

# View statistics file
tail -f /var/lib/nsd/nsd.stats
\`\`\`

### Monitoring Commands
\`\`\`bash
# Server status
nsd-control status

# Zone status
nsd-control zonestatus

# All statistics
nsd-control stats_noreset
\`\`\`

## Common Issues and Solutions

### 1. Zone Transfer Failures
- Verify IP addresses in notify/provide-xfr directives
- Check TSIG key configuration on both servers
- Ensure network connectivity on port 53
- Review logs: \`journalctl -u nsd\`
- Verify zone file syntax: \`nsd-checkzone\`

### 2. DNSSEC Issues
- Verify KSK and ZSK are both present
- Check DS records uploaded to parent zone
- Ensure zone file is signed: \`file db.example.com.signed\`
- Validate DNSSEC chain: \`dig +dnssec example.com SOA\`

### 3. Slow Zone Loading
- Reduce zone file size
- Use database cache: \`database: "/var/lib/nsd/nsd.db"\`
- Adjust \`zonefiles-check\` directive
- Increase \`num-threads\`

### 4. High Query Response Time
- Enable multi-threading
- Check rate limiting settings
- Verify zone file integrity
- Monitor system resources (CPU, memory, disk I/O)

### 5. AXFR Request Denied
- Check allow-xfr ACL in zone configuration
- Verify TSIG key if required
- Check IP address in provide-xfr
- Review logs for access control denials

## References
- Official NSD Documentation: https://www.nlnetlabs.nl/projects/nsd/
- NSD Manual: https://man.cx/nsd.conf(5)
- NLnet Labs Security: https://www.nlnetlabs.nl/
- DNSSEC with NSD: https://www.nlnetlabs.nl/projects/ldns/
`;
