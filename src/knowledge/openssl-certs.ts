export const opensslCertsKnowledge = `# OpenSSL and SSL/TLS Certificates - Complete Guide

## OpenSSL Overview
OpenSSL is a robust toolkit for SSL/TLS and general-purpose cryptography, essential for DNS administrators working with DANE, TLSA, and secure services.

## Certificate Generation

### Generate Self-Signed Certificate (Quick)
\`\`\`bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \\
    -subj "/C=US/ST=State/L=City/O=Organization/CN=www.example.com"
\`\`\`

### Generate Certificate with SAN (Subject Alternative Names)
\`\`\`bash
# Create config file
cat > san.cnf <<EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
C=US
ST=State
L=City
O=Organization
CN=www.example.com

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = www.example.com
DNS.2 = example.com
DNS.3 = mail.example.com
IP.1 = 192.0.2.1
IP.2 = 2001:db8::1
EOF

# Generate
openssl req -x509 -new -nodes -key key.pem -sha256 -days 365 \\
    -out cert.pem -config san.cnf -extensions req_ext
\`\`\`

### Generate CSR (Certificate Signing Request)
\`\`\`bash
# Generate private key
openssl genrsa -out domain.key 4096

# Generate CSR
openssl req -new -key domain.key -out domain.csr \\
    -subj "/C=US/ST=State/L=City/O=Org/CN=www.example.com"

# Verify CSR
openssl req -text -noout -verify -in domain.csr
\`\`\`

### Generate CSR with SAN
\`\`\`bash
openssl req -new -key domain.key -out domain.csr -config san.cnf
\`\`\`

## Key Generation

### RSA Keys
\`\`\`bash
# 2048-bit (minimum for production)
openssl genrsa -out key.pem 2048

# 4096-bit (recommended)
openssl genrsa -out key.pem 4096

# Encrypted key
openssl genrsa -aes256 -out key.pem 4096
\`\`\`

### ECC (Elliptic Curve) Keys - Recommended for Modern Systems
\`\`\`bash
# List available curves
openssl ecparam -list_curves

# P-256 (prime256v1) - Most compatible
openssl ecparam -genkey -name prime256v1 -out ec-key.pem

# P-384 (secp384r1) - Higher security
openssl ecparam -genkey -name secp384r1 -out ec-key.pem

# Generate certificate with ECC
openssl req -new -x509 -key ec-key.pem -out ec-cert.pem -days 365
\`\`\`

### Ed25519 Keys - Modern, Fast, Secure
\`\`\`bash
# Generate Ed25519 private key
openssl genpkey -algorithm Ed25519 -out ed25519-key.pem

# Generate certificate
openssl req -new -x509 -key ed25519-key.pem -out ed25519-cert.pem -days 365
\`\`\`

## Certificate Inspection

### View Certificate Details
\`\`\`bash
# Full certificate information
openssl x509 -in cert.pem -text -noout

# Subject and issuer
openssl x509 -in cert.pem -noout -subject -issuer

# Validity dates
openssl x509 -in cert.pem -noout -dates

# Serial number
openssl x509 -in cert.pem -noout -serial

# Fingerprint (SHA-256)
openssl x509 -in cert.pem -noout -fingerprint -sha256

# Check expiration
openssl x509 -in cert.pem -noout -checkend 86400  # Check if expires in 24h
\`\`\`

### View Certificate from Server
\`\`\`bash
# Get certificate
echo | openssl s_client -connect www.example.com:443 2>/dev/null | \\
    openssl x509 -text -noout

# Get certificate chain
openssl s_client -connect www.example.com:443 -showcerts

# Get certificate with SNI
openssl s_client -connect www.example.com:443 -servername www.example.com

# Save certificate
echo | openssl s_client -connect www.example.com:443 2>/dev/null | \\
    openssl x509 -outform PEM -out server-cert.pem
\`\`\`

### View CSR Details
\`\`\`bash
openssl req -text -noout -verify -in domain.csr
\`\`\`

### View Private Key
\`\`\`bash
# RSA key
openssl rsa -in key.pem -text -noout

# ECC key
openssl ec -in ec-key.pem -text -noout

# Check if key is encrypted
openssl rsa -in key.pem -check
\`\`\`

## Certificate Verification

### Verify Certificate Against CA
\`\`\`bash
# Verify with CA bundle
openssl verify -CAfile ca-bundle.crt cert.pem

# Verify chain
openssl verify -CAfile ca-bundle.crt -untrusted intermediate.crt cert.pem

# Verify using system CA store
openssl verify cert.pem
\`\`\`

### Verify Certificate Matches Private Key
\`\`\`bash
# Get modulus from certificate
openssl x509 -in cert.pem -noout -modulus | openssl md5

# Get modulus from key
openssl rsa -in key.pem -noout -modulus | openssl md5

# They should match!
\`\`\`

### Verify Certificate Matches CSR
\`\`\`bash
openssl x509 -in cert.pem -noout -modulus | openssl md5
openssl req -in domain.csr -noout -modulus | openssl md5
\`\`\`

## Certificate Conversion

### PEM to DER
\`\`\`bash
openssl x509 -in cert.pem -outform DER -out cert.der
\`\`\`

### DER to PEM
\`\`\`bash
openssl x509 -in cert.der -inform DER -outform PEM -out cert.pem
\`\`\`

### PEM to PKCS#12 (PFX)
\`\`\`bash
openssl pkcs12 -export -out cert.pfx -inkey key.pem -in cert.pem -certfile ca-bundle.crt
\`\`\`

### PKCS#12 to PEM
\`\`\`bash
# Extract certificate
openssl pkcs12 -in cert.pfx -clcerts -nokeys -out cert.pem

# Extract private key
openssl pkcs12 -in cert.pfx -nocerts -out key.pem -nodes
\`\`\`

### Extract Public Key from Certificate
\`\`\`bash
openssl x509 -in cert.pem -noout -pubkey -out pubkey.pem
\`\`\`

### Extract Public Key from Private Key
\`\`\`bash
openssl rsa -in key.pem -pubout -out pubkey.pem
\`\`\`

## Testing SSL/TLS Connections

### Basic Connection Test
\`\`\`bash
openssl s_client -connect www.example.com:443

# With timeout
timeout 5 openssl s_client -connect www.example.com:443

# Test specific protocol
openssl s_client -connect www.example.com:443 -tls1_2
openssl s_client -connect www.example.com:443 -tls1_3
\`\`\`

### Test with SNI (Server Name Indication)
\`\`\`bash
openssl s_client -connect www.example.com:443 -servername www.example.com
\`\`\`

### Test Mail Server TLS
\`\`\`bash
# SMTP STARTTLS
openssl s_client -connect mail.example.com:25 -starttls smtp

# SMTP over TLS
openssl s_client -connect mail.example.com:465

# IMAP STARTTLS
openssl s_client -connect mail.example.com:143 -starttls imap

# IMAP over TLS
openssl s_client -connect mail.example.com:993

# POP3 STARTTLS
openssl s_client -connect mail.example.com:110 -starttls pop3

# POP3 over TLS
openssl s_client -connect mail.example.com:995
\`\`\`

### Test Supported Ciphers
\`\`\`bash
# Test specific cipher
openssl s_client -connect www.example.com:443 -cipher 'ECDHE-RSA-AES256-GCM-SHA384'

# Get all supported ciphers
nmap --script ssl-enum-ciphers -p 443 www.example.com
\`\`\`

### Verify Certificate Chain
\`\`\`bash
openssl s_client -connect www.example.com:443 -showcerts
\`\`\`

## Hashing for TLSA/DANE

### Generate SHA-256 Hash of Certificate
\`\`\`bash
# Full certificate hash (TLSA 3 0 1)
openssl x509 -in cert.pem -outform DER | openssl dgst -sha256 -hex

# Public key hash (TLSA 3 1 1) - RECOMMENDED
openssl x509 -in cert.pem -noout -pubkey | \\
    openssl pkey -pubin -outform DER | \\
    openssl dgst -sha256 -hex
\`\`\`

### Generate SHA-512 Hash
\`\`\`bash
# Certificate hash (TLSA 3 0 2)
openssl x509 -in cert.pem -outform DER | openssl dgst -sha512 -hex

# Public key hash (TLSA 3 1 2)
openssl x509 -in cert.pem -noout -pubkey | \\
    openssl pkey -pubin -outform DER | \\
    openssl dgst -sha512 -hex
\`\`\`

### Generate Hash from Running Server
\`\`\`bash
# Get public key hash from server
echo | openssl s_client -connect www.example.com:443 2>/dev/null | \\
    openssl x509 -noout -pubkey | \\
    openssl pkey -pubin -outform DER | \\
    openssl dgst -sha256 -hex
\`\`\`

## Certificate Authority (CA) Operations

### Create Root CA
\`\`\`bash
# Generate CA private key
openssl genrsa -aes256 -out ca-key.pem 4096

# Generate CA certificate
openssl req -new -x509 -days 3650 -key ca-key.pem -out ca-cert.pem \\
    -subj "/C=US/ST=State/O=MyCA/CN=MyCA Root"
\`\`\`

### Sign Certificate with CA
\`\`\`bash
# Create serial and index files
echo 01 > serial
touch index.txt

# Sign the CSR
openssl ca -config openssl.cnf -in domain.csr -out domain-cert.pem \\
    -keyfile ca-key.pem -cert ca-cert.pem -days 365

# Or using x509
openssl x509 -req -in domain.csr -CA ca-cert.pem -CAkey ca-key.pem \\
    -CAcreateserial -out domain-cert.pem -days 365 -sha256
\`\`\`

### Create Intermediate CA
\`\`\`bash
# Generate intermediate key
openssl genrsa -aes256 -out intermediate-key.pem 4096

# Create intermediate CSR
openssl req -new -key intermediate-key.pem -out intermediate.csr

# Sign intermediate certificate with root CA
openssl x509 -req -in intermediate.csr -CA ca-cert.pem -CAkey ca-key.pem \\
    -CAcreateserial -out intermediate-cert.pem -days 1825 -sha256
\`\`\`

## Let's Encrypt / ACME

### Generate CSR for Let's Encrypt
\`\`\`bash
# Generate key
openssl genrsa -out le-key.pem 4096

# Generate CSR with multiple domains
openssl req -new -key le-key.pem -out le.csr -config san.cnf
\`\`\`

### Verify Let's Encrypt Certificate
\`\`\`bash
echo | openssl s_client -connect www.example.com:443 2>/dev/null | \\
    openssl x509 -noout -issuer -subject
\`\`\`

## Common OpenSSL Config File

### /etc/ssl/openssl.cnf
\`\`\`ini
[req]
default_bits = 4096
default_md = sha256
prompt = no
encrypt_key = no
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=Organization
OU=Department
CN=www.example.com

[v3_req]
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = www.example.com
DNS.2 = example.com
\`\`\`

## Security Best Practices

### 1. Key Size Recommendations
- RSA: Minimum 2048-bit, recommended 4096-bit
- ECC: P-256 (minimum), P-384 (recommended)
- Ed25519: 256-bit (modern, fast, secure)

### 2. Protect Private Keys
\`\`\`bash
# Restrict permissions
chmod 600 key.pem
chown root:root key.pem

# Encrypt keys
openssl rsa -aes256 -in key.pem -out key-encrypted.pem
\`\`\`

### 3. Use Strong Ciphers
\`\`\`
# Recommended cipher suite
ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
\`\`\`

### 4. Certificate Validity
- Maximum 397 days (13 months) for public trust
- Shorter is better for security (90 days with Let's Encrypt)

### 5. Monitor Expiration
\`\`\`bash
# Check expiration
openssl x509 -in cert.pem -noout -enddate

# Check if expires soon
openssl x509 -in cert.pem -noout -checkend $((30*86400))  # 30 days
\`\`\`

## Troubleshooting

### Common Errors

**"unable to get local issuer certificate"**
\`\`\`bash
# Missing CA certificate
openssl verify -CAfile ca-bundle.crt cert.pem
\`\`\`

**"certificate verify failed"**
\`\`\`bash
# Check chain
openssl s_client -connect www.example.com:443 -showcerts

# Verify locally
openssl verify -verbose cert.pem
\`\`\`

**"wrong signature type"**
\`\`\`bash
# Certificate and key don't match
openssl x509 -in cert.pem -noout -modulus | openssl md5
openssl rsa -in key.pem -noout -modulus | openssl md5
\`\`\`

### Debug TLS Handshake
\`\`\`bash
openssl s_client -connect www.example.com:443 -debug
openssl s_client -connect www.example.com:443 -state
openssl s_client -connect www.example.com:443 -msg
\`\`\`

## Quick Reference Commands

\`\`\`bash
# Generate self-signed cert (quick)
openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365

# View certificate
openssl x509 -in cert.pem -text -noout

# Test server
openssl s_client -connect host:443

# Get server certificate
echo | openssl s_client -connect host:443 2>/dev/null | openssl x509 -out cert.pem

# Verify certificate
openssl verify cert.pem

# TLSA hash (3 1 1)
openssl x509 -in cert.pem -noout -pubkey | openssl pkey -pubin -outform DER | openssl dgst -sha256 -hex

# Check expiration
openssl x509 -in cert.pem -noout -dates
\`\`\`

## Online Tools
- SSL Labs: https://www.ssllabs.com/ssltest/
- Certificate Decoder: https://certlogik.com/decoder/
- CSR Decoder: https://www.sslshopper.com/csr-decoder.html
`;
