export const dnssecKnowledge = `# DNSSEC - DNS Security Extensions

## Overview
DNSSEC adds cryptographic signatures to DNS records, protecting against cache poisoning and ensuring DNS data authenticity.

## Key Concepts

### Resource Records
- **DNSKEY**: Public keys (ZSK and KSK)
- **RRSIG**: Signatures for record sets
- **DS**: Delegation Signer (in parent zone)
- **NSEC/NSEC3**: Authenticated denial of existence

### Key Types
- **ZSK (Zone Signing Key)**: Signs zone data
- **KSK (Key Signing Key)**: Signs DNSKEY records

## BIND 9 DNSSEC Configuration

### Modern Method (dnssec-policy)
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
    file "example.com.zone";
    dnssec-policy "standard";
    inline-signing yes;
};
\`\`\`

### Manual Method
\`\`\`bash
# Generate keys
cd /var/cache/bind/keys
dnssec-keygen -a ECDSAP256SHA256 -n ZONE example.com  # ZSK
dnssec-keygen -a ECDSAP256SHA256 -f KSK -n ZONE example.com  # KSK

# Sign zone
dnssec-signzone -A -3 $(head -c 1000 /dev/random | sha1sum | cut -b 1-16) \\
    -N INCREMENT -o example.com -t example.com.zone
\`\`\`

## Algorithm Recommendations

### Current Best Practices
- **Algorithm 13**: ECDSAP256SHA256 (Recommended)
- **Algorithm 14**: ECDSAP384SHA384 (High security)
- **Algorithm 15**: Ed25519 (Future)
- **Algorithm 16**: Ed448 (Future)

### Deprecated
- Algorithm 5: RSASHA1 (Deprecated)
- Algorithm 7: RSASHA1-NSEC3-SHA1 (Deprecated)

## Validation

### Check DNSSEC Status
\`\`\`bash
dig +dnssec example.com
dig +dnssec example.com @8.8.8.8
delv @8.8.8.8 example.com
\`\`\`

### Verify Chain of Trust
\`\`\`bash
drill -TD example.com
unbound-host -C /etc/unbound/unbound.conf -v example.com
\`\`\`

### Check DS Records at Parent
\`\`\`bash
dig +short DS example.com @a.gtld-servers.net
\`\`\`

## Key Rollover

### ZSK Rollover (Pre-Publication)
\`\`\`bash
# 1. Generate new ZSK
dnssec-keygen -a ECDSAP256SHA256 -n ZONE example.com

# 2. Add to zone and wait TTL
# 3. Start signing with new key
# 4. Remove old key after TTL
\`\`\`

### KSK Rollover (Double-DS)
\`\`\`bash
# 1. Generate new KSK
dnssec-keygen -a ECDSAP256SHA256 -f KSK -n ZONE example.com

# 2. Add both DS records to parent
# 3. Wait for propagation
# 4. Remove old KSK
# 5. Remove old DS from parent
\`\`\`

## Troubleshooting

### SERVFAIL due to DNSSEC
\`\`\`bash
# Check validation
dig +cd example.com  # Check disabled
delv example.com      # Detailed validation

# Common issues:
# - Missing RRSIG
# - Expired signatures
# - Missing DS at parent
# - Clock skew
\`\`\`

## NSEC vs NSEC3

### NSEC
- Simple, efficient
- Allows zone enumeration
\`\`\`
example.com. NSEC a.example.com. A NS SOA RRSIG NSEC DNSKEY
\`\`\`

### NSEC3
- Hashed names
- Prevents zone enumeration
- Slightly more overhead
\`\`\`
example.com. NSEC3 1 0 10 AABBCCDD abc123... A NS SOA RRSIG
\`\`\`
`;
