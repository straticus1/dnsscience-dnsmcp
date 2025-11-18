export const unboundKnowledge = `# Unbound Recursive DNS Resolver

## Overview
Unbound is a validating, recursive, and caching DNS resolver developed by NLnet Labs. It's optimized for privacy and security with built-in DNSSEC validation, DNS-over-TLS support, and minimal dependencies.

## Key Features
- Recursive resolver with caching
- Full DNSSEC validation with validation
- DNS-over-TLS (DoT) support
- DNS-over-HTTPS (DoH) support via external tools
- Response rate limiting
- Query minimization for privacy
- Minimal memory footprint
- Threaded architecture for high performance
- Access control and rate limiting
- Local zone definitions

## Current Versions
- Unbound 1.19+ (Current Stable)
- Unbound 1.17 LTS - Long-term support
- Regular security updates from NLnet Labs

## Installation

### Linux (Debian/Ubuntu)
\`\`\`bash
apt-get update
apt-get install unbound unbound-anchor
\`\`\`

### Linux (RHEL/CentOS)
\`\`\`bash
yum install unbound
# or
dnf install unbound
\`\`\`

### FreeBSD
\`\`\`bash
pkg install unbound
\`\`\`

### macOS
\`\`\`bash
brew install unbound
\`\`\`

### From Source
\`\`\`bash
wget https://www.nlnetlabs.nl/downloads/unbound/unbound-latest.tar.gz
tar xzf unbound-latest.tar.gz
cd unbound-latest
./configure --prefix=/usr/local/unbound
make
make install
\`\`\`

## Configuration Files

### Main Configuration: /etc/unbound/unbound.conf
Primary configuration file controlling server, forwarding, and local zone definitions.

### Trust Anchors: /etc/unbound/root.key
Contains DNSSEC trust anchors for root zone validation. Managed by unbound-anchor.

### Local Configuration Directory: /etc/unbound/conf.d/
Directory for additional zone or configuration includes.

## Basic Configuration Structure

### Minimal Caching Resolver
\`\`\`
server:
    # Listen addresses
    interface: 0.0.0.0
    interface: ::0
    port: 53

    # Trust anchor for DNSSEC
    auto-trust-anchor-file: "/var/lib/unbound/root.key"

    # Cache settings
    num-threads: 4
    msg-cache-size: 100m
    rrset-cache-size: 200m

    # Logging
    verbosity: 1
    logfile: "/var/log/unbound.log"

    # DNSSEC validation
    module-config: "validator iterator"
    val-log-level: 0
\`\`\`

### Production Resolver with Privacy
\`\`\`
server:
    # Listening on specific interface
    interface: 192.168.1.1
    interface: ::1
    port: 53

    # Disable IPv6 if not needed
    do-ip6: yes
    do-ip4: yes

    # Hide server identity
    hide-identity: yes
    hide-version: yes
    identity: "DNS Resolver"
    version: "1.0"

    # Threads and performance
    num-threads: 8
    num-queries-per-thread: 4096

    # Memory allocation
    msg-cache-size: 256m
    rrset-cache-size: 512m
    key-cache-size: 128m

    # Caching parameters
    cache-min-ttl: 300
    cache-max-ttl: 86400
    cache-min-negative-ttl: 60
    cache-max-negative-ttl: 3600

    # DNSSEC
    module-config: "validator iterator"
    auto-trust-anchor-file: "/var/lib/unbound/root.key"
    trust-anchor-file: "/var/lib/unbound/root.key"

    # Query minimization (privacy)
    qname-minimisation: yes
    qname-minimisation-strict: no

    # Prefetch
    prefetch: yes
    prefetch-key: yes

    # Logging
    verbosity: 1
    logfile: "/var/log/unbound.log"
    log-queries: no
    log-replies: no
    log-tag-queryreply: no

    # Response rate limiting
    rrl-size: 4m
    rrl-ratelimit: 1000

    # TCP settings
    tcp-upstream: no
    tcp-only: no
    tcp-auth-query-timeout: 3000
    tcp-idle-timeout: 30000

    # Aggressive NSEC caching
    aggressive-nsec: yes

    # Root zone refresh
    root-hints: "/etc/unbound/root.hints"

    # Access control
    access-control: 127.0.0.1 allow
    access-control: ::1 allow
    access-control: 192.168.1.0/24 allow
    access-control: 0.0.0.0/0 deny

    # Extended DNS (EDNS)
    edns-buffer-size: 4096
    max-udp-size: 4096

    # DNSSEC validation settings
    val-permissive-mode: no
    val-clean-additional: yes
    val-log-level: 0

    # Unwanted reply types
    unwanted-reply-threshold: 10000000
    do-not-query-localhost: no

    # Log source of answers
    val-log: no

# Define forwarding
forward-zone:
    name: "."
    forward-addr: 8.8.8.8@53
    forward-addr: 8.8.4.4@53
    forward-first: yes

# Local zones (split-brain DNS)
local-zone: "internal.corp" typetransparent
local-data: "ns.internal.corp. IN A 192.168.1.10"
local-data: "www.internal.corp. IN A 192.168.1.11"

# Stub zone (forward specific domains)
stub-zone:
    name: "private.local"
    stub-addr: 192.168.1.10@53
    stub-prime: yes

remote-control:
    control-enable: yes
    control-interface: 127.0.0.1
    control-port: 8953
    server-key-file: "/etc/unbound/unbound_server.key"
    server-cert-file: "/etc/unbound/unbound_server.pem"
    control-key-file: "/etc/unbound/unbound_control.key"
    control-cert-file: "/etc/unbound/unbound_control.pem"
\`\`\`

## DNS-over-TLS (DoT) Configuration

### Unbound as DoT Server
\`\`\`
server:
    # TLS certificates
    tls-service-key: "/etc/unbound/server.key"
    tls-service-pem: "/etc/unbound/server.pem"

    # TLS ports
    tls-port: 853
    https-port: 443

    # TLS settings
    ssl-protocols: "TLSv1.2 TLSv1.3"
    ssl-ciphers: "ECDHE-ECDSA-AES256-GCM-SHA384"
\`\`\`

### Unbound Forwarding to DoT Upstream
\`\`\`
forward-zone:
    name: "."
    forward-addr: 1.1.1.1@53
    forward-addr: 8.8.8.8@853  # DoT
    forward-first: yes
    forward-tls-upstream: yes
\`\`\`

## DNSSEC Validation

### Enable DNSSEC Validation
\`\`\`
server:
    # Load DNSSEC trust anchors
    auto-trust-anchor-file: "/var/lib/unbound/root.key"

    # Validation module
    module-config: "validator iterator"

    # Validation settings
    val-permissive-mode: no
    val-clean-additional: yes
    aggressive-nsec: yes
\`\`\`

### Update Trust Anchors
\`\`\`bash
# Automatic update (run via cron)
unbound-anchor -a "/var/lib/unbound/root.key"

# Manual verification
dig +dnssec . SOA
\`\`\`

### DNSSEC Logging
\`\`\`
server:
    val-log: yes
    val-log-level: 2
\`\`\`

## Forwarding Configuration

### Simple Forwarding
\`\`\`
forward-zone:
    name: "."
    forward-addr: 8.8.8.8@53
    forward-addr: 1.1.1.1@53
    forward-first: yes
\`\`\`

### Forwarding Specific Domains
\`\`\`
forward-zone:
    name: "company.local"
    forward-addr: 192.168.1.10@53

forward-zone:
    name: "."
    forward-addr: 8.8.8.8@53
\`\`\`

### Stub Zones (Lightweight Forwarding)
\`\`\`
stub-zone:
    name: "example.com"
    stub-addr: 192.0.2.1@53
    stub-prime: yes
    stub-first: yes

stub-zone:
    name: "."
    stub-addr: 8.8.8.8@53
\`\`\`

### Conditional Forwarding
\`\`\`
server:
    domain-insecure: "company.local"

forward-zone:
    name: "company.local"
    forward-addr: 192.168.1.10@53
    forward-no-cache: no
    forward-ssl-upstream: no
\`\`\`

## Local Zone Definitions

### Simple Local Records
\`\`\`
local-zone: "localhost" typetransparent
local-data: "localhost. IN A 127.0.0.1"
local-data: "localhost. IN AAAA ::1"

local-zone: "internal.corp" typetransparent
local-data: "internal.corp. IN A 192.168.1.1"
local-data: "www.internal.corp. IN A 192.168.1.11"
local-data: "mail.internal.corp. IN A 192.168.1.20"
local-data: "mail.internal.corp. IN MX 10 mail.internal.corp."
\`\`\`

### Local Zone Types
\`\`\`
# transparent: Answer queries; fall through for NXDOMAIN
local-zone: "example.com" typetransparent

# static: Only answer with configured data
local-zone: "example.com" typestatic

# deny: Don't answer
local-zone: "ads.com" typedeny

# refuse: Send REFUSED response
local-zone: "malware.com" typerefuse

# inform: Log queries (with transparent behavior)
local-zone: "debug.com" typeinform

# block: Return NODATA
local-zone: "tracking.com" typeblock
\`\`\`

## Access Control

### Basic ACLs
\`\`\`
server:
    # Default deny all
    access-control: 0.0.0.0/0 deny

    # Allow localhost
    access-control: 127.0.0.1 allow
    access-control: ::1 allow

    # Allow internal network
    access-control: 192.168.1.0/24 allow
    access-control: 10.0.0.0/8 allow_snoop

    # Allow specific IPs
    access-control: 203.0.113.45 allow_recursion
\`\`\`

### ACL Actions
- deny: Refuse connection
- refuse: Send REFUSED
- allow: Allow queries
- allow_snoop: Allow zone transfers
- allow_recursion: Allow recursive queries

## Rate Limiting

### Response Rate Limiting
\`\`\`
server:
    # RRL cache size
    rrl-size: 4m

    # Rate limit in responses per second
    rrl-ratelimit: 1000

    # Slip responses (send truncated on limit)
    rrl-slip: 2

    # Per-zone ratelimit
    rrl-whitelist: 192.0.2.0/24
\`\`\`

## Performance Optimization

### Threading
\`\`\`
server:
    # Number of threads (set to number of cores)
    num-threads: 8

    # Queries per thread
    num-queries-per-thread: 4096
\`\`\`

### Memory Management
\`\`\`
server:
    # Message cache (DNS responses)
    msg-cache-size: 256m

    # RRset cache (DNS records)
    rrset-cache-size: 512m

    # Key cache (DNSSEC)
    key-cache-size: 128m

    # Negative query cache
    neg-cache-size: 64m
\`\`\`

### Prefetching
\`\`\`
server:
    # Prefetch expiring records
    prefetch: yes
    prefetch-key: yes

    # Prefetch all frequently queried
    prefetch-common: yes
\`\`\`

## Logging Configuration

### Query Logging
\`\`\`
server:
    logfile: "/var/log/unbound.log"
    use-syslog: yes
    verbosity: 1

    # Log queries
    log-queries: no
    log-replies: no
    log-tag-queryreply: no

    # Log file settings
    log-local-actions: no
    log-servfail: no
\`\`\`

### Log Rotation
\`\`\`bash
cat > /etc/logrotate.d/unbound << 'EOF'
/var/log/unbound.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 unbound unbound
    postrotate
        unbound-control log_reopen
    endscript
}
EOF
\`\`\`

## Useful Commands

### Configuration Checking
\`\`\`bash
# Syntax check
unbound-checkconf /etc/unbound/unbound.conf

# Check specific zone
unbound-checkconf -z
\`\`\`

### Service Management
\`\`\`bash
# Start/stop/restart
systemctl start unbound
systemctl stop unbound
systemctl restart unbound

# Check status
systemctl status unbound

# Enable on boot
systemctl enable unbound
\`\`\`

### Remote Control
\`\`\`bash
# Generate control certs
unbound-control-setup

# Control operations
unbound-control status
unbound-control reload
unbound-control stats
unbound-control stats_noreset

# Query operations
unbound-control dump_cache
unbound-control flush example.com
unbound-control flush_zone example.com

# Trust anchor management
unbound-control auth_zone_transfer example.com
unbound-control list_local_zones
unbound-control list_local_data
\`\`\`

### Query Testing
\`\`\`bash
# Test resolver with dig
dig @127.0.0.1 example.com

# Test with DNSSEC
dig +dnssec @127.0.0.1 example.com

# Test from specific source
dig -b 192.168.1.1 example.com
\`\`\`

## Monitoring and Statistics

### Real-time Statistics
\`\`\`bash
# Get statistics
unbound-control stats

# Reset statistics
unbound-control stats_reset

# Continuous monitoring
watch -n 1 'unbound-control stats'
\`\`\`

### Extended Monitoring
\`\`\`bash
# Extended stats
unbound-control stats_noreset

# Cache dump
unbound-control dump_cache > /tmp/cache.txt

# Memory usage
unbound-control list_stubs
\`\`\`

## Common Issues and Solutions

### 1. DNSSEC Validation Failures
- Ensure auto-trust-anchor-file is correctly configured
- Update trust anchors: \`unbound-anchor\`
- Check for DNSSEC failures in logs
- Disable validation temporarily: \`val-permissive-mode: yes\`

### 2. High CPU Usage
- Reduce thread count
- Disable aggressive NSEC caching
- Enable rate limiting
- Monitor with \`unbound-control stats\`

### 3. Cache Not Effective
- Increase cache sizes: msg-cache-size, rrset-cache-size
- Adjust TTL limits: cache-max-ttl
- Enable prefetching
- Check hit rate in stats

### 4. Slow Recursive Queries
- Enable forwarding for root
- Reduce timeout values
- Increase num-threads
- Enable query minimization: \`qname-minimisation: yes\`

### 5. DNS Rebinding Issues
- Use local-zone for private addresses
- Configure domain-insecure for internal domains
- Use stub zones for delegation

## Integration with Systems

### Pi-hole Integration
\`\`\`
forward-zone:
    name: "."
    forward-addr: 127.0.0.1@5053  # Pi-hole's dnsmasq
\`\`\`

### AdGuard Home Integration
\`\`\`
forward-zone:
    name: "."
    forward-addr: 127.0.0.1@53  # AdGuard Home
\`\`\`

### BIND Integration (Mixed Environment)
\`\`\`
# Unbound forwarding to BIND
forward-zone:
    name: "corp.example.com"
    forward-addr: 192.168.1.10@53
\`\`\`

## References
- Official Unbound: https://www.nlnetlabs.nl/projects/unbound/
- Unbound Manual: https://man.cx/unbound.conf(5)
- DNSSEC Validation: https://www.nlnetlabs.nl/projects/dnssec/
- DNS Privacy: https://www.nlnetlabs.nl/projects/dns-privacy/
`;
