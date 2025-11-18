export const digKnowledge = `# DNS Debugging Tools - Comprehensive Guide

## Overview
A comprehensive guide to DNS query and debugging tools including dig, drill, ldns-tools, host, nslookup, kdig, and doggo. These tools are essential for DNS troubleshooting, testing, and validation.

## dig - Domain Information Groper

### Installation
\`\`\`bash
# Linux (Debian/Ubuntu)
apt-get install dnsutils

# Linux (RHEL/CentOS)
yum install bind-utils

# macOS
brew install bind-tools

# FreeBSD
pkg install bind-tools
\`\`\`

### Basic Usage

#### Simple Query
\`\`\`bash
# Default (A record)
dig example.com

# Specific record type
dig example.com A
dig example.com AAAA
dig example.com MX
dig example.com NS
dig example.com TXT
dig example.com SOA
dig example.com CNAME
dig example.com CAA
\`\`\`

#### Query Specific Nameserver
\`\`\`bash
# Query authoritative nameserver
dig @ns1.example.com example.com

# Query public resolver
dig @8.8.8.8 example.com
dig @1.1.1.1 example.com

# Query recursive resolver
dig @127.0.0.1 example.com

# Query with port
dig @ns1.example.com:5353 example.com
\`\`\`

### Output Format Options

#### Short Output
\`\`\`bash
# Minimal output
dig +short example.com

# Only answer section
dig +short example.com A

# Only NS records
dig +short example.com NS
\`\`\`

#### Detailed Output
\`\`\`bash
# Show all sections
dig example.com

# Show query sent
dig +noall +answer example.com

# Show authoritative section
dig +noall +authority example.com

# Show additional section
dig +noall +additional example.com

# Show all details
dig +all example.com
\`\`\`

#### Output Control Flags
\`\`\`bash
# Show only answer section
dig +noall +answer example.com

# Show question section
dig +noquestion +answer example.com

# Show comments
dig +nocomments example.com

# Show stats
dig +nostats example.com

# Pretty print
dig +multiline example.com

# Include timestamp
dig +nostat +nocmd +nocomments example.com
\`\`\`

### DNSSEC Validation

#### Query with DNSSEC
\`\`\`bash
# Enable DNSSEC checking
dig +dnssec example.com

# Enable DNSSEC + CD flag
dig +dnssec +cdflag example.com

# Trust anchor
dig +dnssec +trust-anchor example.com

# Disable DNSSEC (checking only)
dig +nocrypto example.com
\`\`\`

#### Validate Chain
\`\`\`bash
# Show full DNSSEC chain
dig +dnssec +trace example.com

# Check RRSIG
dig +dnssec example.com | grep RRSIG

# Validate with delve
delve @8.8.8.8 example.com +rtrace
\`\`\`

### Advanced Query Options

#### Trace Query Path
\`\`\`bash
# Trace from root
dig +trace example.com

# Trace to specific server
dig +trace @8.8.8.8 example.com

# Trace without recursion
dig +trace +norecurse example.com
\`\`\`

#### Domain Transfer (AXFR)
\`\`\`bash
# Full zone transfer
dig @ns1.example.com example.com AXFR

# Incremental zone transfer (IXFR)
dig @ns1.example.com example.com IXFR=2024011701

# Zone transfer with TSIG
dig @ns1.example.com example.com AXFR -y transfer-key:base64secret
\`\`\`

#### Reverse DNS Lookup
\`\`\`bash
# Reverse lookup (FQDN style)
dig -x 192.0.2.10

# Reverse lookup (IP style)
dig +short -x 192.0.2.10

# IPv6 reverse
dig -x 2001:db8::10

# Reverse zone query
dig @ns1.example.com 2.0.192.in-addr.arpa PTR
\`\`\`

#### Any Query
\`\`\`bash
# Query all records
dig example.com ANY

# Short format
dig +short example.com ANY

# No DNSSEC
dig example.com ANY +nocrypto
\`\`\`

### Query Flags

#### Request Flags
\`\`\`bash
# Recursion Desired (default)
dig +recurse example.com

# No Recursion
dig +norecurse example.com

# Checking Disabled (skip DNSSEC)
dig +cdflag example.com

# Authentic Data (DNSSEC)
dig +adflag example.com

# Allow EDNS
dig +edns=0 example.com

# DNSSEC OK
dig +dnssec example.com
\`\`\`

#### Response Analysis
\`\`\`bash
# Show flags in response
dig example.com +all

# Decode flags
# QR = Query Response
# AA = Authoritative Answer
# TC = Truncated
# RD = Recursion Desired
# RA = Recursion Available
# AD = Authenticated Data
# CD = Checking Disabled
\`\`\`

### Batch Queries

#### Multiple Domains
\`\`\`bash
# Single command, multiple queries
dig example.com google.com amazon.com

# Multiple types
dig example.com A MX TXT

# Loop through file
for domain in $(cat domains.txt); do
    dig +short \$domain
done
\`\`\`

#### Batch File
\`\`\`bash
# Create file: queries.txt
example.com
google.com
amazon.com

# Run batch
dig -f queries.txt +short
\`\`\`

### Useful Query Examples

#### Email Configuration
\`\`\`bash
# Check MX records
dig example.com MX +short

# Check SPF records
dig example.com TXT +short | grep v=spf1

# Check DMARC records
dig _dmarc.example.com TXT +short

# Check DKIM records
dig default._domainkey.example.com TXT +short
\`\`\`

#### SSL/TLS Configuration
\`\`\`bash
# Check TLSA records (DANE)
dig _443._tcp.example.com TLSA +short

# Check CAA records
dig example.com CAA +short

# Check all security records
dig example.com +short CAA MX TXT
\`\`\`

#### API Endpoint Discovery
\`\`\`bash
# Check SRV records
dig _ldap._tcp.example.com SRV +short

# Check service discovery
dig _http._tcp.example.com SRV +short

# Check XMPP
dig _xmpp-server._tcp.example.com SRV +short
\`\`\`

## drill - DNSSEC Lookup Tool

### Installation
\`\`\`bash
# Linux (Debian/Ubuntu)
apt-get install ldns-tools

# Linux (RHEL/CentOS)
yum install ldns-tools

# macOS
brew install ldns

# FreeBSD
pkg install ldns-tools
\`\`\`

### Basic Usage
\`\`\`bash
# Simple query
drill example.com

# Specific record type
drill example.com MX

# Query nameserver
drill @ns1.example.com example.com

# Short output
drill -S example.com

# Trace (from root)
drill -t example.com

# Only show answer
drill -a example.com
\`\`\`

### DNSSEC Validation
\`\`\`bash
# DNSSEC validation
drill -D example.com

# Show DNSSEC records
drill -S example.com

# DNSSEC trace
drill -t -D example.com

# Trust anchor
drill -k /etc/drill/root.key example.com
\`\`\`

### Advanced Options
\`\`\`bash
# Zone transfer (AXFR)
drill @ns1.example.com example.com axfr

# Incremental transfer (IXFR)
drill @ns1.example.com example.com ixfr=serial

# Reverse DNS
drill -x 192.0.2.10

# Query statistics
drill -V example.com

# TCP query
drill -T example.com

# Specific port
drill -p 5353 example.com
\`\`\`

## host - Simple DNS Lookup

### Installation
\`\`\`bash
# Linux (Debian/Ubuntu)
apt-get install bind-utils

# Linux (RHEL/CentOS)
yum install bind-utils

# macOS
brew install bind-tools

# FreeBSD
pkg install bind-tools
\`\`\`

### Basic Usage
\`\`\`bash
# Simple query
host example.com

# Query specific nameserver
host example.com ns1.example.com

# All record types
host -a example.com

# Specific type
host -t MX example.com
host -t NS example.com
host -t SOA example.com

# Reverse DNS
host 192.0.2.10

# IPv4 only
host -4 example.com

# IPv6 only
host -6 example.com
\`\`\`

### Useful Flags
\`\`\`bash
# Verbose output
host -v example.com

# Batch lookup
host -f hosts.txt

# No recursion
host -N 0 example.com

# Timeout
host -W 5 example.com

# TTL display
host -T example.com
\`\`\`

## nslookup - Interactive Lookup

### Basic Usage
\`\`\`bash
# Simple query
nslookup example.com

# Query specific nameserver
nslookup example.com ns1.example.com

# Specific record type
nslookup -type=MX example.com
nslookup -type=NS example.com

# Reverse DNS
nslookup 192.0.2.10

# Non-interactive
nslookup example.com 8.8.8.8
\`\`\`

### Interactive Mode
\`\`\`bash
# Enter interactive mode
nslookup

# Commands in interactive mode:
# set type=MX
# set server ns1.example.com
# set domain example.com
# ls -a example.com  # List zone
# exit
\`\`\`

### Practical Examples
\`\`\`bash
nslookup> set type=MX
nslookup> example.com
nslookup> set server 8.8.8.8
nslookup> google.com
nslookup> exit
\`\`\`

## kdig - ISC BIND dig Alternative

### Installation
\`\`\`bash
# Linux (Debian/Ubuntu)
apt-get install knot-dnsutils

# Linux (RHEL/CentOS)
yum install knot-dnsutils

# macOS
brew install knot

# FreeBSD
pkg install knot
\`\`\`

### Basic Usage
\`\`\`bash
# Simple query
kdig example.com

# Specific type
kdig example.com A
kdig example.com MX

# Query server
kdig @8.8.8.8 example.com

# Short output
kdig +short example.com

# DNSSEC validation
kdig +dnssec example.com

# Trace
kdig +trace example.com
\`\`\`

### Advanced Features
\`\`\`bash
# Zone transfer (AXFR)
kdig @ns1.example.com example.com axfr

# Batch file
kdig -f queries.txt

# Multiple queries
kdig example.com google.com amazon.com

# Raw output
kdig +raw example.com

# Pretty format
kdig +multiline example.com
\`\`\`

## doggo - Modern DNS Lookup

### Installation
\`\`\`bash
# Go-based tool
go install github.com/mr-karan/doggo@latest

# Or download binary from releases
wget https://github.com/mr-karan/doggo/releases/download/v0.5.7/doggo_linux_amd64
chmod +x doggo_linux_amd64
mv doggo_linux_amd64 /usr/local/bin/doggo
\`\`\`

### Basic Usage
\`\`\`bash
# Simple query
doggo example.com

# Specific type
doggo example.com A
doggo example.com MX

# Query server
doggo example.com @8.8.8.8

# Multiple types
doggo example.com A MX TXT

# JSON output
doggo example.com --json

# Pretty output
doggo example.com --color
\`\`\`

### Advanced Options
\`\`\`bash
# DNSSEC validation
doggo example.com +dnssec

# Query strategy
doggo example.com --strategy udp
doggo example.com --strategy tcp

# No recursion
doggo example.com +norecurse

# With timeout
doggo --timeout=5s example.com

# Nameserver with port
doggo @1.1.1.1:53 example.com
\`\`\`

## ldns-tools - Complete LDNS Utilities

### Installation
\`\`\`bash
apt-get install ldns-tools
\`\`\`

### Key Tools

#### ldns-dig
\`\`\`bash
# Similar to dig
ldns-dig example.com

# With DNSSEC
ldns-dig -D example.com

# Zone transfer
ldns-dig @ns1.example.com example.com axfr
\`\`\`

#### ldns-host
\`\`\`bash
# Host lookup
ldns-host example.com

# DNSSEC validation
ldns-host -a example.com

# Specific type
ldns-host -t MX example.com
\`\`\`

#### ldns-zone2file
\`\`\`bash
# Convert zone to file
ldns-zone2file example.com > example.com.zone

# With specific nameserver
ldns-zone2file -n ns1.example.com example.com > example.com.zone
\`\`\`

#### ldns-keygen
\`\`\`bash
# Generate DNSSEC keys
ldns-keygen -a ECDSAP256SHA256 example.com

# Generate KSK
ldns-keygen -k -a ECDSAP256SHA256 example.com
\`\`\`

## Comparison and Use Cases

### When to Use Each Tool

#### dig
- Most flexible and detailed output
- Best for complex troubleshooting
- Standard on most systems
- Full DNSSEC support

#### drill
- DNSSEC validation emphasis
- Better for DNSSEC troubleshooting
- Slightly simpler output
- Integrated DNSSEC features

#### host
- Simplest syntax
- Quick lookups
- Good for scripts
- Minimal output overhead

#### nslookup
- Interactive mode for multiple queries
- Good for batch operations
- Familiar to Windows users
- Less detailed than dig

#### kdig
- High-performance
- KNOT DNS integration
- Modern features
- Good for bulk queries

#### doggo
- User-friendly output
- Color-coded results
- JSON export
- Modern interface

## Batch Query Scripts

### All Tools Comparison
\`\`\`bash
#!/bin/bash
domain=\${1:-example.com}

echo "=== dig ==="
dig +short \$domain

echo "=== host ==="
host \$domain

echo "=== drill ==="
drill -S \$domain

echo "=== nslookup ==="
nslookup \$domain

echo "=== kdig ==="
kdig +short \$domain
\`\`\`

### DNSSEC Validation Script
\`\`\`bash
#!/bin/bash
domain=\${1:-example.com}

echo "Validating DNSSEC for \$domain"
echo "=== dig +dnssec ==="
dig +dnssec \$domain | grep -E "RRSIG|DNSKEY|ad;"

echo "=== drill -D ==="
drill -D \$domain

echo "=== Check DS Records ==="
dig \$domain DS
\`\`\`

### Nameserver Comparison Script
\`\`\`bash
#!/bin/bash
domain=\${1:-example.com}

# Get nameservers
nameservers=\$(dig +short \$domain NS)

for ns in \$nameservers; do
    echo "Querying \$ns for \$domain"
    dig @\$ns \$domain +short
    echo "---"
done
\`\`\`

## Troubleshooting Examples

### DNS Resolution Issues
\`\`\`bash
# Check all nameservers
for ns in \$(dig +short example.com NS); do
    echo "Testing \$ns..."
    dig @\$ns example.com +short
done

# Check response time
dig example.com | grep "Query time"

# Check propagation
for nameserver in 8.8.8.8 1.1.1.1 ns1.example.com; do
    echo "\$nameserver:"
    dig @\$nameserver example.com +short
done
\`\`\`

### DNSSEC Validation
\`\`\`bash
# Check DNSSEC chain
dig +dnssec example.com | grep -E "RRSIG|DNSKEY|ad"

# Validate with drill
drill -D example.com

# Check trust anchors
dig +dnssec example.com SOA
\`\`\`

### Email Configuration
\`\`\`bash
# Check SPF
dig example.com TXT +short | grep v=spf1

# Check DMARC
dig _dmarc.example.com TXT +short

# Check DKIM
dig default._domainkey.example.com TXT +short

# Check MX records with priorities
dig example.com MX +short | sort -n -k1
\`\`\`

## References
- dig Manual: https://linux.die.net/man/1/dig
- drill Manual: https://linux.die.net/man/1/drill
- host Manual: https://linux.die.net/man/1/host
- nslookup Manual: https://linux.die.net/man/1/nslookup
- kdig Manual: https://man.cx/kdig(1)
- doggo GitHub: https://github.com/mr-karan/doggo
- ldns-tools: https://www.nlnetlabs.nl/projects/ldns/
`;
