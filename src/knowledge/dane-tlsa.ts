export const daneTlsaKnowledge = `# DANE and TLSA Records - Complete Guide

## Overview
DANE (DNS-based Authentication of Named Entities) is a protocol that uses DNSSEC to bind TLS/SSL certificates to domain names, eliminating reliance on traditional Certificate Authorities.

## TLSA Record Structure

### Format
\`\`\`
_port._protocol.hostname IN TLSA Usage Selector MatchType CertData
\`\`\`

### Components

#### 1. Name Format
\`\`\`
_443._tcp.www.example.com.    # HTTPS
_25._tcp.mail.example.com.    # SMTP
_465._tcp.mail.example.com.   # SMTPS
_993._tcp.imap.example.com.   # IMAPS
_853._tcp.dns.example.com.    # DNS over TLS
\`\`\`

#### 2. Usage Field (Certificate Usage)

**0 - PKIX-TA (CA Constraint)**
- Trust anchor (CA certificate)
- Must pass normal PKIX validation
- Use case: Restrict which CAs can issue certs
\`\`\`
_443._tcp   IN  TLSA 0 0 1 <CA-cert-hash>
\`\`\`

**1 - PKIX-EE (Service Certificate Constraint)**
- End entity certificate
- Must pass normal PKIX validation
- Use case: Pin specific certificate from valid CA
\`\`\`
_443._tcp   IN  TLSA 1 0 1 <cert-hash>
\`\`\`

**2 - DANE-TA (Trust Anchor Assertion)**
- Trust anchor assertion
- Bypasses PKIX validation if matched
- Use case: Private CA, self-signed CA
\`\`\`
_443._tcp   IN  TLSA 2 0 1 <CA-cert-hash>
\`\`\`

**3 - DANE-EE (Domain Issued Certificate)** [MOST COMMON]
- End entity certificate match
- Completely bypasses PKIX validation
- Use case: Self-signed certificates, full control
\`\`\`
_443._tcp   IN  TLSA 3 1 1 <cert-pubkey-hash>
\`\`\`

#### 3. Selector Field

**0 - Full Certificate**
- Match against entire certificate
- Larger DNS record
- Changes when certificate is renewed
\`\`\`
_443._tcp   IN  TLSA 3 0 1 <full-cert-hash>
\`\`\`

**1 - SubjectPublicKeyInfo** [RECOMMENDED]
- Match against public key only
- Smaller DNS record
- Survives certificate renewal if key unchanged
- **Best practice for most deployments**
\`\`\`
_443._tcp   IN  TLSA 3 1 1 <pubkey-hash>
\`\`\`

#### 4. Matching Type

**0 - No Hash (Full)**
- Full data in DNS (large record)
- Not recommended due to size
\`\`\`
_443._tcp   IN  TLSA 3 1 0 <full-pubkey-data>
\`\`\`

**1 - SHA-256** [RECOMMENDED]
- SHA-256 hash of selector
- Balance of security and size
- **Most common choice**
\`\`\`
_443._tcp   IN  TLSA 3 1 1 <sha256-hash>
\`\`\`

**2 - SHA-512**
- SHA-512 hash of selector
- Maximum security, larger record
\`\`\`
_443._tcp   IN  TLSA 3 1 2 <sha512-hash>
\`\`\`

## Common TLSA Configurations

### Recommended: 3 1 1 (DANE-EE + SPKI + SHA-256)
Most flexible and common configuration:
\`\`\`
_443._tcp.www   IN  TLSA 3 1 1 (
    d2abde240d7cd3ee6b4b28c54df034b9
    7983a1d16e8a410e4561cb106618e971
)
\`\`\`

**Advantages:**
- No CA required
- Key can be reused across certificate renewals
- Smaller DNS record than full cert
- Complete control over trust

**Use when:**
- Self-signed certificates
- Internal services
- Maximum security control needed

### Alternative: 2 1 1 (DANE-TA + SPKI + SHA-256)
For private CA infrastructures:
\`\`\`
_443._tcp.www   IN  TLSA 2 1 1 <private-CA-pubkey-hash>
\`\`\`

### Public CA with Pinning: 1 1 1
When using public CA but want to pin specific cert:
\`\`\`
_443._tcp.www   IN  TLSA 1 1 1 <cert-pubkey-hash>
\`\`\`

## Generating TLSA Records

### Using OpenSSL

#### Generate Hash for Usage 3 1 1 (Public Key, SHA-256)
\`\`\`bash
# From certificate file
openssl x509 -in cert.pem -noout -pubkey | \\
    openssl pkey -pubin -outform DER | \\
    openssl dgst -sha256 -binary | \\
    xxd -p -c 256

# From server directly
echo | openssl s_client -connect www.example.com:443 2>/dev/null | \\
    openssl x509 -noout -pubkey | \\
    openssl pkey -pubin -outform DER | \\
    openssl dgst -sha256 -binary | \\
    xxd -p -c 256
\`\`\`

#### Generate Hash for Usage 3 0 1 (Full Certificate, SHA-256)
\`\`\`bash
openssl x509 -in cert.pem -outform DER | \\
    openssl dgst -sha256 -binary | \\
    xxd -p -c 256
\`\`\`

#### Using hash-slinger (Debian/Ubuntu)
\`\`\`bash
apt-get install hash-slinger

# Generate from certificate
tlsa --create --certificate cert.pem --port 443 --protocol tcp www.example.com

# Generate from running service
tlsa --create --server www.example.com --port 443 --protocol tcp www.example.com
\`\`\`

#### Using ldns-dane (from ldns-utils)
\`\`\`bash
apt-get install ldns-utils

# Generate TLSA record
ldns-dane create www.example.com 443 cert.pem

# Verify TLSA record
ldns-dane verify www.example.com 443
\`\`\`

## Complete DANE Deployment Example

### 1. Generate Self-Signed Certificate
\`\`\`bash
# Generate key
openssl genrsa -out server.key 4096

# Generate certificate
openssl req -new -x509 -key server.key -out server.crt -days 365 \\
    -subj "/C=US/ST=State/L=City/O=Org/CN=www.example.com"
\`\`\`

### 2. Extract Public Key Hash
\`\`\`bash
HASH=$(openssl x509 -in server.crt -noout -pubkey | \\
    openssl pkey -pubin -outform DER | \\
    openssl dgst -sha256 -binary | \\
    xxd -p -c 256)

echo $HASH
\`\`\`

### 3. Create TLSA Record
\`\`\`
_443._tcp.www   IN  TLSA 3 1 1 $HASH
\`\`\`

### 4. Ensure DNSSEC is Enabled
DANE **requires** DNSSEC to be secure!
\`\`\`bash
# Check DNSSEC
dig +dnssec example.com

# Verify TLSA with DNSSEC
dig +dnssec _443._tcp.www.example.com TLSA
\`\`\`

## Testing TLSA Records

### Using dig
\`\`\`bash
dig _443._tcp.www.example.com TLSA +short
dig _25._tcp.mail.example.com TLSA +dnssec
\`\`\`

### Using OpenSSL s_client
\`\`\`bash
openssl s_client -connect www.example.com:443 -dane_tlsa_domain www.example.com
\`\`\`

### Using ldns-dane
\`\`\`bash
ldns-dane verify www.example.com 443
ldns-dane -c /etc/ssl/certs verify www.example.com 443
\`\`\`

### Using dane-validation.sh
\`\`\`bash
wget https://github.com/kirei/dane/raw/master/dane-validation.sh
bash dane-validation.sh www.example.com 443
\`\`\`

### Online Tools
- https://dane.sys4.de/
- https://check.sidnlabs.nl/dane/
- https://www.huque.com/bin/danecheck

## Roll-over Procedures

### Certificate Renewal with Same Key
If keeping the same key (Usage 3 1 1):
\`\`\`
1. No DNS changes needed!
2. Renew certificate with same key
3. Deploy new certificate
\`\`\`

### Certificate Renewal with New Key
\`\`\`
1. Generate new key and certificate
2. Calculate new TLSA hash
3. Add new TLSA record (multi-record)
4. Wait for TTL to expire
5. Deploy new certificate
6. Remove old TLSA record
\`\`\`

Example during transition:
\`\`\`
_443._tcp   IN  TLSA 3 1 1 <old-key-hash>  ; Current
_443._tcp   IN  TLSA 3 1 1 <new-key-hash>  ; Future
\`\`\`

## DANE for Email (SMTP)

### MTA-STS vs DANE
- MTA-STS: Policy via HTTPS, no DNSSEC required
- DANE: Policy via DNS, requires DNSSEC
- Can use both together

### SMTP DANE Configuration
\`\`\`
_25._tcp.mail.example.com.    IN  TLSA 3 1 1 <hash>
_587._tcp.mail.example.com.   IN  TLSA 3 1 1 <hash>  # Submission
\`\`\`

### Postfix DANE Support
\`\`\`
# main.cf
smtp_dns_support_level = dnssec
smtp_tls_security_level = dane
smtp_host_lookup = dns
\`\`\`

### Test Email DANE
\`\`\`bash
swaks --to test@example.com --server mail.example.com --tls --tls-verify
\`\`\`

## Browser Support

### Current Status
- **Firefox**: Full support (requires DNSSEC)
- **Chrome**: Limited support
- **Opera**: Supports via extension
- **Safari**: No native support

### Enabling in Firefox
\`\`\`
about:config
browser.xul.error_pages.expert_bad_cert = true
\`\`\`

## Security Considerations

### 1. DNSSEC is MANDATORY
TLSA records without DNSSEC provide **zero security**
\`\`\`bash
# Always verify DNSSEC
dig +dnssec _443._tcp.www.example.com TLSA
\`\`\`

### 2. TTL Settings
Use reasonable TTL for roll-overs:
\`\`\`
_443._tcp   3600    IN  TLSA 3 1 1 <hash>  # 1 hour
\`\`\`

### 3. Multiple Records for Transition
Always publish both old and new during key roll-over

### 4. Monitor Expiration
Certificate expiration with DANE can cause hard failures

### 5. Backup Records
Consider publishing multiple valid TLSA records

## Common Issues

### TLSA Record Not Found
\`\`\`bash
# Check DNS propagation
dig _443._tcp.www.example.com TLSA @8.8.8.8
dig _443._tcp.www.example.com TLSA @ns1.example.com
\`\`\`

### DNSSEC Validation Failure
\`\`\`bash
# Check DNSSEC chain
delv _443._tcp.www.example.com TLSA
drill -TD _443._tcp.www.example.com TLSA
\`\`\`

### Hash Mismatch
\`\`\`bash
# Verify hash matches certificate
echo | openssl s_client -connect www.example.com:443 2>/dev/null | \\
    openssl x509 -noout -pubkey | \\
    openssl pkey -pubin -outform DER | \\
    openssl dgst -sha256

# Compare to DNS record
dig _443._tcp.www.example.com TLSA +short
\`\`\`

## Real-World Examples

### Web Server (Apache)
\`\`\`
_443._tcp.www.example.com.    IN  TLSA 3 1 1 (
    1234567890abcdef1234567890abcdef
    1234567890abcdef1234567890abcdef
)
\`\`\`

### Mail Server (Multiple Ports)
\`\`\`
_25._tcp.mail.example.com.    IN  TLSA 3 1 1 <hash>
_465._tcp.mail.example.com.   IN  TLSA 3 1 1 <hash>
_587._tcp.mail.example.com.   IN  TLSA 3 1 1 <hash>
_993._tcp.mail.example.com.   IN  TLSA 3 1 1 <hash>
\`\`\`

### DNS over TLS
\`\`\`
_853._tcp.dns.example.com.    IN  TLSA 3 1 1 <hash>
\`\`\`

## References
- RFC 6698: DANE
- RFC 7671: DANE Operations
- RFC 7672: DANE for SMTP
- https://www.internetsociety.org/deploy360/dane/
`;
