export const bindKnowledge = `# ISC BIND DNS Server - Comprehensive Guide

## Overview
BIND (Berkeley Internet Name Domain) is the most widely deployed DNS software on the Internet. Developed by the Internet Systems Consortium (ISC), it's the de facto standard for DNS server implementations.

## Current Versions
- BIND 9.18+ (Current Stable) - ESV (Extended Support Version)
- BIND 9.16 (Older Stable) - Still supported
- BIND 10 was discontinued; development continues on BIND 9

## Installation

### Linux (Debian/Ubuntu)
\`\`\`bash
apt-get update
apt-get install bind9 bind9utils bind9-doc
\`\`\`

### Linux (RHEL/CentOS)
\`\`\`bash
yum install bind bind-utils
# or
dnf install bind bind-utils
\`\`\`

### FreeBSD
\`\`\`bash
pkg install bind918
\`\`\`

## Key Configuration Files

### /etc/bind/named.conf (Debian) or /etc/named.conf (RHEL)
Main configuration file that includes:
- \`named.conf.options\` - Global options
- \`named.conf.local\` - Local zones
- \`named.conf.default-zones\` - Root hints and localhost zones

## Basic Configuration Structure

### Authoritative Server Example
\`\`\`
options {
    directory "/var/cache/bind";

    // Listen on specific interfaces
    listen-on { 192.0.2.1; };
    listen-on-v6 { 2001:db8::1; };

    // Allow queries from specific networks
    allow-query { any; };

    // Disable recursion for authoritative server
    recursion no;

    // DNSSEC
    dnssec-validation auto;

    // Security
    version "not available";

    // Rate limiting
    rate-limit {
        responses-per-second 10;
        window 5;
    };
};

// Zone definition
zone "example.com" {
    type master;
    file "/etc/bind/zones/db.example.com";
    allow-transfer { 192.0.2.2; };  // Secondary server
    notify yes;
    also-notify { 192.0.2.2; };
};
\`\`\`

### Recursive Resolver Example
\`\`\`
options {
    directory "/var/cache/bind";

    recursion yes;
    allow-recursion { 192.168.1.0/24; localhost; };

    // Forward queries to upstream resolvers (optional)
    forwarders {
        8.8.8.8;
        8.8.4.4;
    };
    forward first;

    // DNSSEC validation
    dnssec-validation auto;

    // Query source
    query-source address * port *;

    // Cache settings
    max-cache-size 512m;
    max-cache-ttl 86400;
    max-ncache-ttl 3600;
};
\`\`\`

## Zone File Format

### Standard Zone File
\`\`\`
$TTL 86400
@   IN  SOA ns1.example.com. admin.example.com. (
            2024011701  ; Serial (YYYYMMDDNN)
            3600        ; Refresh (1 hour)
            1800        ; Retry (30 minutes)
            604800      ; Expire (1 week)
            86400       ; Negative Cache TTL (1 day)
)

; Name servers
@       IN  NS  ns1.example.com.
@       IN  NS  ns2.example.com.

; A records
ns1     IN  A   192.0.2.1
ns2     IN  A   192.0.2.2
www     IN  A   192.0.2.10
@       IN  A   192.0.2.10

; AAAA records (IPv6)
www     IN  AAAA    2001:db8::10

; MX records
@       IN  MX  10  mail.example.com.
mail    IN  A   192.0.2.20

; TXT records
@       IN  TXT "v=spf1 mx -all"
_dmarc  IN  TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"

; CAA records
@       IN  CAA 0 issue "letsencrypt.org"
@       IN  CAA 0 iodef "mailto:security@example.com"

; SRV records
_sip._tcp   IN  SRV 10 60 5060 sipserver.example.com.
\`\`\`

## DNSSEC Configuration

### Signing a Zone
\`\`\`bash
# Generate keys
dnssec-keygen -a ECDSAP256SHA256 -n ZONE example.com    # ZSK
dnssec-keygen -a ECDSAP256SHA256 -f KSK -n ZONE example.com  # KSK

# Sign the zone
dnssec-signzone -A -3 $(head -c 1000 /dev/random | sha1sum | cut -b 1-16) \\
    -N INCREMENT -o example.com -t db.example.com

# Update named.conf
zone "example.com" {
    type master;
    file "/etc/bind/zones/db.example.com.signed";
    auto-dnssec maintain;
    inline-signing yes;
};
\`\`\`

### Modern DNSSEC with dnssec-policy
\`\`\`
dnssec-policy "standard" {
    keys {
        ksk lifetime unlimited algorithm ecdsap256sha256;
        zsk lifetime 90d algorithm ecdsap256sha256;
    };
    nsec3param;
};

zone "example.com" {
    type master;
    file "/etc/bind/zones/db.example.com";
    dnssec-policy "standard";
};
\`\`\`

## Access Control Lists (ACLs)

\`\`\`
acl "trusted" {
    192.168.1.0/24;
    10.0.0.0/8;
    localhost;
};

acl "slaves" {
    192.0.2.2;
    192.0.2.3;
};

options {
    allow-query { trusted; };
    allow-transfer { slaves; };
    allow-recursion { trusted; };
};
\`\`\`

## Views (Split-Horizon DNS)

\`\`\`
view "internal" {
    match-clients { 192.168.1.0/24; };
    recursion yes;

    zone "example.com" {
        type master;
        file "/etc/bind/zones/internal/db.example.com";
    };
};

view "external" {
    match-clients { any; };
    recursion no;

    zone "example.com" {
        type master;
        file "/etc/bind/zones/external/db.example.com";
    };
};
\`\`\`

## Security Best Practices

### 1. Disable Version Disclosure
\`\`\`
version "not available";
hostname none;
server-id none;
\`\`\`

### 2. Rate Limiting
\`\`\`
rate-limit {
    responses-per-second 10;
    window 5;
    slip 2;
    qps-scale 250;
};
\`\`\`

### 3. Response Policy Zones (RPZ)
\`\`\`
zone "rpz.example.com" {
    type master;
    file "/etc/bind/db.rpz";
    allow-query { none; };
};

options {
    response-policy {
        zone "rpz.example.com";
    };
};
\`\`\`

### 4. Transaction Signatures (TSIG)
\`\`\`bash
# Generate TSIG key
tsig-keygen -a hmac-sha256 transfer-key > /etc/bind/transfer.key

# In named.conf
include "/etc/bind/transfer.key";

server 192.0.2.2 {
    keys { transfer-key; };
};

zone "example.com" {
    allow-transfer { key transfer-key; };
};
\`\`\`

## Logging Configuration

\`\`\`
logging {
    channel default_log {
        file "/var/log/named/named.log" versions 3 size 5m;
        severity info;
        print-time yes;
        print-severity yes;
        print-category yes;
    };

    channel query_log {
        file "/var/log/named/query.log" versions 3 size 10m;
        severity info;
        print-time yes;
    };

    category default { default_log; };
    category queries { query_log; };
    category security { default_log; };
};
\`\`\`

## Useful Commands

### Check Configuration
\`\`\`bash
named-checkconf
named-checkzone example.com /etc/bind/zones/db.example.com
\`\`\`

### Reload Configuration
\`\`\`bash
rndc reload
rndc reload example.com
\`\`\`

### View Statistics
\`\`\`bash
rndc stats
rndc status
\`\`\`

### Flush Cache
\`\`\`bash
rndc flush
rndc flush example.com
\`\`\`

### Query Trace
\`\`\`bash
rndc trace
rndc trace 3  # Set level
rndc notrace  # Disable
\`\`\`

## Performance Tuning

\`\`\`
options {
    // Cache size
    max-cache-size 1024m;

    // Query limits
    clients-per-query 10;
    max-clients-per-query 100;

    // Transfer settings
    transfers-in 10;
    transfers-per-ns 2;

    // TCP settings
    tcp-clients 100;

    // Recursion limits
    max-recursion-depth 7;
    max-recursion-queries 75;
};
\`\`\`

## Common Issues and Solutions

### 1. Zone Transfer Failures
- Check \`allow-transfer\` ACL
- Verify network connectivity
- Check TSIG key configuration
- Review logs: \`journalctl -u named\`

### 2. SERVFAIL Responses
- Check DNSSEC validation
- Verify forwarders are reachable
- Check for circular dependencies
- Review \`rndc recursing\`

### 3. High CPU Usage
- Enable query rate limiting
- Reduce logging verbosity
- Check for amplification attacks
- Optimize zone serial queries

### 4. Memory Issues
- Reduce \`max-cache-size\`
- Limit \`max-cache-ttl\`
- Monitor with \`rndc status\`

## References
- Official documentation: https://bind9.readthedocs.io/
- BIND ARM: https://downloads.isc.org/isc/bind9/
- Security advisories: https://kb.isc.org/docs/aa-00913
`;
