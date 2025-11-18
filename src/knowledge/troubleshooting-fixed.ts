export const troubleshootingKnowledge = `# DNS Troubleshooting Guide

## Overview
Comprehensive guide to diagnosing and resolving DNS issues for authoritative servers, recursive resolvers, and clients.

## Common DNS Response Codes

### NOERROR (0)
- Successful query
- Record exists and was returned

### NXDOMAIN (3)
- Domain does not exist
- Check: Typos, delegation, parent zone

### SERVFAIL (2)
- Server failure during query
- Most common causes:
  - DNSSEC validation failure
  - Backend database error
  - Dependency failure (forwarder down)
  - Circular dependency
  - Zone file syntax error

### REFUSED (5)
- Server refused to answer
- Check: ACLs, recursion settings, allow-query

### NOTIMP (4)
- Not implemented
- Server doesn't support requested operation

## Troubleshooting by Symptom

### SERVFAIL Errors

**Causes:**
1. DNSSEC validation failures
2. Broken delegation
3. Lame delegation
4. Circular dependencies
5. Zone file errors

**Debug Steps:**
\`\`\`bash
# Check DNSSEC
dig +dnssec domain.com
delv @resolver domain.com

# Disable DNSSEC to test
dig +cd domain.com

# Check delegation
dig +trace domain.com

# Query authoritative nameservers directly
dig @ns1.example.com domain.com
\`\`\`

### NXDOMAIN When Domain Should Exist

**Causes:**
1. Typo in domain name
2. Domain not yet propagated
3. Incorrect delegation
4. Zone not loaded

**Debug Steps:**
\`\`\`bash
# Check authoritative nameservers
dig NS example.com

# Query each nameserver
dig @ns1.example.com www.example.com

# Check parent zone delegation
dig @a.gtld-servers.net example.com NS

# Check zone serial
dig @ns1.example.com example.com SOA
\`\`\`

### Slow DNS Resolution

**Causes:**
1. Timeout on unreachable nameservers
2. Network issues
3. Rate limiting
4. Large DNSSEC responses
5. Cache poisoning attacks

**Debug Steps:**
\`\`\`bash
# Time queries
time dig example.com

# Check specific nameserver
dig @ns1.example.com example.com +stats

# Trace full delegation
dig +trace example.com

# Check for packet loss
mtr ns1.example.com
\`\`\`

### Zone Transfer Failures

**Causes:**
1. Missing allow-transfer ACL
2. TSIG key mismatch
3. Network firewall
4. Serial number not incremented

**Debug Steps:**
\`\`\`bash
# Test zone transfer
dig @primary.ns.com example.com AXFR

# With TSIG
dig @primary.ns.com example.com AXFR -y hmac-sha256:keyname:base64key

# Check notify
tail -f /var/log/named/named.log

# Verify serial
dig @primary example.com SOA
dig @secondary example.com SOA
\`\`\`

## DNSSEC Issues

### Validation Failures

\`\`\`bash
# Detailed validation
delv @8.8.8.8 example.com

# Check DNSSEC chain
drill -TD example.com

# Verify signatures
dig +dnssec example.com DNSKEY
dig +dnssec example.com DS

# Check if DS is in parent
dig @parent-ns.com example.com DS
\`\`\`

### Common DNSSEC Problems

1. **Expired signatures**
   - Re-sign zone
   - Check automatic re-signing

2. **Missing DS at parent**
   - Submit DS records to registrar
   - Verify with parent nameservers

3. **Clock skew**
   - Sync NTP
   - Check signature validity periods

4. **Algorithm mismatch**
   - Ensure parent supports algorithm
   - Use widely supported algorithms (13, 14)

## Propagation Issues

### Check Propagation

\`\`\`bash
# Multiple public resolvers
dig @8.8.8.8 example.com        # Google
dig @1.1.1.1 example.com        # Cloudflare
dig @9.9.9.9 example.com        # Quad9
dig @208.67.222.222 example.com # OpenDNS

# Check each authoritative nameserver
for ns in $(dig +short NS example.com); do
  echo "Checking $ns"
  dig @$ns example.com A +short
done
\`\`\`

### Flush Caches

\`\`\`bash
# BIND
rndc flush

# Unbound
unbound-control flush example.com

# PowerDNS Recursor
rec_control wipe-cache example.com

# System resolver (varies by OS)
sudo systemd-resolve --flush-caches  # Linux systemd
sudo killall -HUP mDNSResponder     # macOS
ipconfig /flushdns                   # Windows
\`\`\`

## Tools for Troubleshooting

### dig
\`\`\`bash
dig example.com                 # Basic query
dig example.com MX              # Specific type
dig @8.8.8.8 example.com        # Specific server
dig +short example.com          # Concise output
dig +trace example.com          # Full delegation
dig +dnssec example.com         # With DNSSEC
dig -x 192.0.2.1               # Reverse lookup
\`\`\`

### drill
\`\`\`bash
drill example.com               # Basic query
drill -TD example.com           # Trace with DNSSEC
drill -S example.com           # Chase signatures
\`\`\`

### host
\`\`\`bash
host example.com
host -t MX example.com
host -a example.com            # All records
\`\`\`

### Online Tools
- DNSViz: https://dnsviz.net/
- Zonemaster: https://zonemaster.net/
- IntoDNS: https://intodns.com/
- DNS Propagation: https://www.whatsmydns.net/

## Best Practices

1. **Monitor DNS health**
   - Set up monitoring for query rates
   - Alert on SERVFAIL rates
   - Track response times

2. **Use redundant nameservers**
   - Minimum 2, recommended 3-4
   - Different networks/ASNs
   - Geographic distribution

3. **Keep software updated**
   - Security patches
   - DNSSEC algorithm support
   - Performance improvements

4. **Test changes before deployment**
   - Use staging environments
   - Validate zone files
   - Check DNSSEC before going live

5. **Document your DNS setup**
   - Nameserver IPs
   - TSIG keys (securely)
   - Zone file locations
   - Change procedures
`;
