export const dnsRecordsKnowledge = `# Complete DNS Record Types Reference

## Standard Record Types (RFC 1035 and later)

### A (Address) - Type 1
Maps hostname to IPv4 address
\`\`\`
example.com.    IN  A   192.0.2.1
www             IN  A   192.0.2.10
\`\`\`

### AAAA (IPv6 Address) - Type 28
Maps hostname to IPv6 address
\`\`\`
example.com.    IN  AAAA    2001:db8::1
www             IN  AAAA    2001:db8::10
\`\`\`

### CNAME (Canonical Name) - Type 5
Alias from one name to another
\`\`\`
www             IN  CNAME   example.com.
blog            IN  CNAME   hosting.example.net.
\`\`\`
**Important:** CNAME cannot coexist with other records at the same name

### MX (Mail Exchange) - Type 15
Specifies mail servers for domain
\`\`\`
@               IN  MX  10  mail1.example.com.
@               IN  MX  20  mail2.example.com.
\`\`\`
Priority: Lower number = higher priority

### NS (Name Server) - Type 2
Delegates zone to nameservers
\`\`\`
example.com.    IN  NS  ns1.example.com.
example.com.    IN  NS  ns2.example.com.
subdomain       IN  NS  ns1.hosting.com.
\`\`\`

### PTR (Pointer) - Type 12
Reverse DNS lookup (IP to hostname)
\`\`\`
1.2.0.192.in-addr.arpa.     IN  PTR mail.example.com.
1.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa. IN PTR www.example.com.
\`\`\`

### SOA (Start of Authority) - Type 6
Zone authority and parameters
\`\`\`
@   IN  SOA ns1.example.com. admin.example.com. (
        2024011701  ; Serial (increment on each change)
        3600        ; Refresh (secondary checks primary)
        1800        ; Retry (retry interval on failed refresh)
        604800      ; Expire (secondary stops answering)
        86400       ; Negative cache TTL (NXDOMAIN caching)
)
\`\`\`

### TXT (Text) - Type 16
Arbitrary text data
\`\`\`
@           IN  TXT "v=spf1 mx -all"
@           IN  TXT "google-site-verification=abc123..."
selector._domainkey IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCS..."
\`\`\`

### SRV (Service) - Type 33
Service location records
\`\`\`
_service._proto.name    TTL class SRV priority weight port target

_sip._tcp       IN  SRV 10  60  5060  sipserver.example.com.
_ldap._tcp      IN  SRV 0   100 389   ldap.example.com.
_minecraft._tcp IN  SRV 0   5   25565 mc.example.com.
\`\`\`

### CAA (Certification Authority Authorization) - Type 257
Restricts which CAs can issue certificates
\`\`\`
@           IN  CAA 0 issue "letsencrypt.org"
@           IN  CAA 0 issue "digicert.com"
@           IN  CAA 0 issuewild "letsencrypt.org"
@           IN  CAA 0 iodef "mailto:security@example.com"
subdomain   IN  CAA 0 issue ";"  # Prevent cert issuance
\`\`\`

Flags:
- 0 = non-critical
- 128 = critical

### TLSA (TLS Association) - Type 52
DANE: Associate TLS certificates with domain names
\`\`\`
_443._tcp.www   IN  TLSA 3 1 1 (
    d2abde240d7cd3ee6b4b28c54df034b9
    7983a1d16e8a410e4561cb106618e971
)
_25._tcp.mail   IN  TLSA 2 0 1 abc123def456...
\`\`\`

Format: Usage Selector MatchingType CertData

**Usage:**
- 0 = PKIX-TA (CA constraint)
- 1 = PKIX-EE (Service certificate constraint)
- 2 = DANE-TA (Trust anchor assertion)
- 3 = DANE-EE (Domain-issued certificate) **[Most common]**

**Selector:**
- 0 = Full certificate
- 1 = SubjectPublicKeyInfo **[Most common]**

**Matching Type:**
- 0 = Exact match
- 1 = SHA-256 hash **[Most common]**
- 2 = SHA-512 hash

### SSHFP (SSH Fingerprint) - Type 44
SSH key fingerprints for validation
\`\`\`
@   IN  SSHFP 1 1 abc123def456...  # RSA SHA-1
@   IN  SSHFP 3 2 def789abc012...  # ECDSA SHA-256
@   IN  SSHFP 4 2 ghi345jkl678...  # Ed25519 SHA-256
\`\`\`

Algorithm:
- 1 = RSA
- 2 = DSA
- 3 = ECDSA
- 4 = Ed25519

Hash type:
- 1 = SHA-1
- 2 = SHA-256

### NAPTR (Naming Authority Pointer) - Type 35
Used for ENUM, SIP, and other URI mappings
\`\`\`
@   IN  NAPTR 100 10 "u" "E2U+sip" "!^.*$!sip:info@example.com!" .
\`\`\`

### DNAME (Delegation Name) - Type 39
Alias for entire subtree
\`\`\`
old.example.com.    IN  DNAME   new.example.com.
\`\`\`

### DS (Delegation Signer) - Type 43
DNSSEC delegation
\`\`\`
example.com.    IN  DS  12345 8 2 (
    49FD46E6C4B45C55D4AC69CBD3CD34AC
    1AFE51DE57A5D9B2E5A5A0B5D5B5D5B5
)
\`\`\`

### DNSKEY (DNS Public Key) - Type 48
DNSSEC public keys
\`\`\`
example.com.    IN  DNSKEY 257 3 8 (
    AwEAAb4...base64-encoded-key
) ; KSK
example.com.    IN  DNSKEY 256 3 8 (
    AwEAAc7...base64-encoded-key
) ; ZSK
\`\`\`

Flags:
- 256 = ZSK (Zone Signing Key)
- 257 = KSK (Key Signing Key)

### NSEC (Next Secure) - Type 47
DNSSEC authenticated denial of existence
\`\`\`
example.com.    IN  NSEC    a.example.com. A NS SOA MX AAAA RRSIG NSEC DNSKEY
\`\`\`

### NSEC3 (Next Secure v3) - Type 50
Hashed authenticated denial of existence
\`\`\`
abc123.example.com. IN NSEC3 1 0 10 AABBCCDD def456 A RRSIG
\`\`\`

### NSEC3PARAM (NSEC3 Parameters) - Type 51
Parameters for NSEC3
\`\`\`
example.com.    IN  NSEC3PARAM 1 0 10 AABBCCDD
\`\`\`

### RRSIG (Resource Record Signature) - Type 46
DNSSEC signature
\`\`\`
example.com.    IN  RRSIG A 8 2 86400 (
    20240201000000 20240101000000 12345 example.com.
    base64-encoded-signature
)
\`\`\`

### CDS (Child DS) - Type 59
Child copy of DS for automated DNSSEC updates
\`\`\`
example.com.    IN  CDS 12345 8 2 49FD46E6C4B45C55...
\`\`\`

### CDNSKEY (Child DNSKEY) - Type 60
Child copy of DNSKEY for automated updates
\`\`\`
example.com.    IN  CDNSKEY 257 3 8 AwEAAb4...
\`\`\`

### HINFO (Host Info) - Type 13
Hardware and OS information (rarely used, security risk)
\`\`\`
server  IN  HINFO "Intel Xeon" "Linux"
\`\`\`

### LOC (Location) - Type 29
Geographical location
\`\`\`
@   IN  LOC 42 21 54 N 71 06 18 W 24m
\`\`\`

### RP (Responsible Person) - Type 17
Administrative contact
\`\`\`
@   IN  RP  admin.example.com. admin-info.example.com.
\`\`\`

### AFSDB (AFS Database) - Type 18
Andrew File System database
\`\`\`
@   IN  AFSDB 1 afsdb.example.com.
\`\`\`

### CERT (Certificate) - Type 37
Stores certificates in DNS
\`\`\`
@   IN  CERT PKIX 0 0 base64-encoded-cert
\`\`\`

### URI (Uniform Resource Identifier) - Type 256
Maps to URIs
\`\`\`
_ftp._tcp   IN  URI 10 1 "ftp://ftp.example.com/public"
\`\`\`

### SMIMEA (S/MIME Association) - Type 53
S/MIME certificate association
\`\`\`
abc123._smimecert   IN  SMIMEA 3 1 1 base64-hash
\`\`\`

### OPENPGPKEY - Type 61
OpenPGP public key
\`\`\`
abc123._openpgpkey  IN  OPENPGPKEY base64-encoded-key
\`\`\`

### SPF (Sender Policy Framework) - Type 99
**Deprecated:** Use TXT records instead
\`\`\`
@   IN  SPF "v=spf1 mx -all"  # Don't use this
@   IN  TXT "v=spf1 mx -all"  # Use this instead
\`\`\`

### SVCB (Service Binding) - Type 64
Modern service binding and HTTPS resource records
\`\`\`
@   IN  SVCB 1 . alpn=h3,h2 port=443
\`\`\`

### HTTPS - Type 65
HTTP-specific service binding
\`\`\`
@   IN  HTTPS 1 . alpn=h3,h2,http/1.1 ipv4hint=192.0.2.1 ipv6hint=2001:db8::1
\`\`\`

## Special Use Cases

### DMARC (via TXT)
\`\`\`
_dmarc  IN  TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; ruf=mailto:forensics@example.com; pct=100"
\`\`\`

### DKIM (via TXT)
\`\`\`
selector._domainkey IN  TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
\`\`\`

### BIMI (Brand Indicators for Message Identification)
\`\`\`
default._bimi   IN  TXT "v=BIMI1; l=https://example.com/logo.svg; a=https://example.com/cert.pem"
\`\`\`

### MTA-STS (Mail Transfer Agent Strict Transport Security)
\`\`\`
_mta-sts    IN  TXT "v=STSv1; id=20240101T000000"
\`\`\`

### ACME Challenge (Let's Encrypt)
\`\`\`
_acme-challenge IN  TXT "abc123def456ghi789jkl012..."
\`\`\`

## Record Type Numbers
Quick reference for numeric types:
- 1 = A
- 2 = NS
- 5 = CNAME
- 6 = SOA
- 12 = PTR
- 15 = MX
- 16 = TXT
- 28 = AAAA
- 33 = SRV
- 43 = DS
- 46 = RRSIG
- 47 = NSEC
- 48 = DNSKEY
- 50 = NSEC3
- 52 = TLSA
- 257 = CAA
- 255 = ANY (query type, not a record)

## Best Practices

1. **Always use FQDN** (Fully Qualified Domain Names) ending with '.'
2. **Increment SOA serial** on every zone change
3. **Use TTL wisely** - lower for frequently changing records
4. **CNAME restrictions** - Cannot coexist with other records
5. **MX priority** - Lower number = higher priority
6. **CAA records** - Essential for security
7. **DNSSEC** - Sign all zones when possible
8. **TLSA records** - Require DNSSEC to be effective
`;
