export const registrarKnowledge = `# Domain Registrar APIs and Protocols

## Overview
Comprehensive guide to domain registrar APIs and protocols including OpenSRS XML API, GoDaddy API, Namecheap API, and EPP protocol. These tools enable programmatic domain management, DNS configuration, and registrant operations.

## EPP - Extensible Provisioning Protocol

### Overview
EPP (RFC 5730) is the standard protocol for domain registrar operations. Supports registration, transfers, renewals, and contact management.

### Connection and Authentication

#### EPP Server Connection
\`\`\`bash
# Connect via OpenSSL
openssl s_client -connect epp.registrar.com:700

# Or use epp-cli tools
epp-cli --host epp.registrar.com --port 700 \\
    --cert /path/to/cert.pem \\
    --key /path/to/key.pem
\`\`\`

#### Example: Login Command
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <login>
      <clID>username</clID>
      <pw>password</pw>
      <newPW>newpassword</newPW>
      <clTRID>ABC-12345</clTRID>
    </login>
  </command>
</epp>
\`\`\`

### Domain Operations

#### Check Domain Availability
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0"
     xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <check>
      <domain:check>
        <domain:name>example.com</domain:name>
        <domain:name>example.net</domain:name>
      </domain:check>
    </check>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>
\`\`\`

#### Register Domain
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0"
     xmlns:domain="urn:ietf:params:xml:ns:domain-1.0"
     xmlns:contact="urn:ietf:params:xml:ns:contact-1.0">
  <command>
    <create>
      <domain:create>
        <domain:name>example.com</domain:name>
        <domain:period unit="y">1</domain:period>
        <domain:ns>
          <domain:hostAttr>
            <domain:hostName>ns1.example.com</domain:hostName>
            <domain:hostAddr ip="v4">192.0.2.1</domain:hostAddr>
          </domain:hostAttr>
        </domain:ns>
        <domain:registrant>registrant-contact-id</domain:registrant>
        <domain:contact type="admin">admin-contact-id</domain:contact>
        <domain:contact type="tech">tech-contact-id</domain:contact>
        <domain:authInfo>
          <domain:pw>authorization-password</domain:pw>
        </domain:authInfo>
      </domain:create>
    </create>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>
\`\`\`

#### Renew Domain
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0"
     xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <renew>
      <domain:renew>
        <domain:name>example.com</domain:name>
        <domain:curExpDate>2024-12-31</domain:curExpDate>
        <domain:period unit="y">1</domain:period>
      </domain:renew>
    </renew>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>
\`\`\`

#### Transfer Domain
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0"
     xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <transfer op="request">
      <domain:transfer>
        <domain:name>example.com</domain:name>
        <domain:authInfo>
          <domain:pw>authorization-code</domain:pw>
        </domain:authInfo>
      </domain:transfer>
    </transfer>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>
\`\`\`

#### Update Domain Nameservers
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0"
     xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <update>
      <domain:update>
        <domain:name>example.com</domain:name>
        <domain:add>
          <domain:ns>
            <domain:hostAttr>
              <domain:hostName>ns3.example.com</domain:hostName>
              <domain:hostAddr ip="v4">192.0.2.3</domain:hostAddr>
            </domain:hostAttr>
          </domain:ns>
        </domain:add>
        <domain:rem>
          <domain:ns>
            <domain:hostAttr>
              <domain:hostName>ns4.example.com</domain:hostName>
            </domain:hostAttr>
          </domain:ns>
        </domain:rem>
      </domain:update>
    </update>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>
\`\`\`

### Contact Operations

#### Create Contact
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0"
     xmlns:contact="urn:ietf:params:xml:ns:contact-1.0">
  <command>
    <create>
      <contact:create>
        <contact:id>contact-123</contact:id>
        <contact:postalInfo type="loc">
          <contact:name>John Doe</contact:name>
          <contact:org>Example Inc</contact:org>
          <contact:addr>
            <contact:street>123 Main St</contact:street>
            <contact:city>Anytown</contact:city>
            <contact:sp>CA</contact:sp>
            <contact:pc>90210</contact:pc>
            <contact:cc>US</contact:cc>
          </contact:addr>
        </contact:postalInfo>
        <contact:voice>+1.5105555555</contact:voice>
        <contact:email>admin@example.com</contact:email>
      </contact:create>
    </create>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>
\`\`\`

## OpenSRS XML API

### Overview
OpenSRS provides XML-RPC API for domain operations. Widely used by resellers and enterprise customers.

### Authentication
\`\`\`bash
# OpenSRS credentials required:
# - Username
# - API Key
# - Domain (for IP whitelisting)

api_url="https://api.opensrs.com:55443"
username="your_username"
api_key="your_api_key"
\`\`\`

### Check Domain Availability
\`\`\`bash
curl -X POST https://api.opensrs.com:55443 \\
  -d '<?xml version="1.0"?>
<methodCall>
  <methodName>lookupDomain</methodName>
  <params>
    <param>
      <value>
        <struct>
          <member>
            <name>domain</name>
            <value><string>example.com</string></value>
          </member>
          <member>
            <name>registrant</name>
            <value><string>us</string></value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>' \\
  -H "Content-Type: text/xml"
\`\`\`

### Register Domain via OpenSRS
\`\`\`bash
curl -X POST https://api.opensrs.com:55443 \\
  -d '<?xml version="1.0"?>
<methodCall>
  <methodName>createDomain</methodName>
  <params>
    <param>
      <value>
        <struct>
          <member>
            <name>domain</name>
            <value><string>example.com</string></value>
          </member>
          <member>
            <name>period</name>
            <value><int>1</int></value>
          </member>
          <member>
            <name>nameserver</name>
            <value>
              <array>
                <data>
                  <value>
                    <struct>
                      <member>
                        <name>name</name>
                        <value><string>ns1.example.com</string></value>
                      </member>
                      <member>
                        <name>ipaddress</name>
                        <value><string>192.0.2.1</string></value>
                      </member>
                    </struct>
                  </value>
                </data>
              </array>
            </value>
          </member>
          <member>
            <name>registrant_name</name>
            <value><string>John Doe</string></value>
          </member>
          <member>
            <name>registrant_email</name>
            <value><string>admin@example.com</string></value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>'
\`\`\`

### Update DNS Records
\`\`\`bash
curl -X POST https://api.opensrs.com:55443 \\
  -d '<?xml version="1.0"?>
<methodCall>
  <methodName>updateDns</methodName>
  <params>
    <param>
      <value>
        <struct>
          <member>
            <name>domain</name>
            <value><string>example.com</string></value>
          </member>
          <member>
            <name>records</name>
            <value>
              <array>
                <data>
                  <value>
                    <struct>
                      <member>
                        <name>record_type</name>
                        <value><string>A</string></value>
                      </member>
                      <member>
                        <name>line_index</name>
                        <value><string>0</string></value>
                      </member>
                      <member>
                        <name>hostname</name>
                        <value><string>www</string></value>
                      </member>
                      <member>
                        <name>value</name>
                        <value><string>192.0.2.10</string></value>
                      </member>
                      <member>
                        <name>ttl</name>
                        <value><string>3600</string></value>
                      </member>
                    </struct>
                  </value>
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>'
\`\`\`

## GoDaddy API

### Authentication
\`\`\`bash
# GoDaddy API setup:
# 1. Get API key from https://developer.godaddy.com/keys
# 2. Get API secret
# 3. Make authenticated requests

API_KEY="your_api_key"
API_SECRET="your_api_secret"
\`\`\`

### Check Domain Availability
\`\`\`bash
curl -X GET "https://api.godaddy.com/v1/domains/available?domain=example.com" \\
  -H "Authorization: sso-key \${API_KEY}:\${API_SECRET}" \\
  -H "Content-Type: application/json"
\`\`\`

### Get Domain Details
\`\`\`bash
curl -X GET "https://api.godaddy.com/v1/domains/example.com" \\
  -H "Authorization: sso-key \${API_KEY}:\${API_SECRET}" \\
  -H "Content-Type: application/json"
\`\`\`

### Update Domain Nameservers
\`\`\`bash
curl -X PATCH "https://api.godaddy.com/v1/domains/example.com/nameservers" \\
  -H "Authorization: sso-key \${API_KEY}:\${API_SECRET}" \\
  -H "Content-Type: application/json" \\
  -d '[
    {
      "name": "ns1.example.com"
    },
    {
      "name": "ns2.example.com"
    }
  ]'
\`\`\`

### Get DNS Records
\`\`\`bash
curl -X GET "https://api.godaddy.com/v1/domains/example.com/records" \\
  -H "Authorization: sso-key \${API_KEY}:\${API_SECRET}" \\
  -H "Content-Type: application/json"
\`\`\`

### Create DNS Record
\`\`\`bash
curl -X POST "https://api.godaddy.com/v1/domains/example.com/records" \\
  -H "Authorization: sso-key \${API_KEY}:\${API_SECRET}" \\
  -H "Content-Type: application/json" \\
  -d '[
    {
      "type": "A",
      "name": "www",
      "data": "192.0.2.10",
      "ttl": 3600
    }
  ]'
\`\`\`

### Update DNS Record
\`\`\`bash
curl -X PUT "https://api.godaddy.com/v1/domains/example.com/records/A/www" \\
  -H "Authorization: sso-key \${API_KEY}:\${API_SECRET}" \\
  -H "Content-Type: application/json" \\
  -d '[
    {
      "data": "192.0.2.11",
      "ttl": 3600
    }
  ]'
\`\`\`

### Delete DNS Record
\`\`\`bash
curl -X DELETE "https://api.godaddy.com/v1/domains/example.com/records/A/www" \\
  -H "Authorization: sso-key \${API_KEY}:\${API_SECRET}" \\
  -H "Content-Type: application/json"
\`\`\`

## Namecheap API

### Authentication
\`\`\`bash
# Namecheap API setup:
# 1. Get API key from account settings
# 2. IP whitelist required
# 3. Use ApiUser and ApiKey parameters

API_USER="your_username"
API_KEY="your_api_key"
CLIENT_IP="your.ip.address"
\`\`\`

### Check Domain Availability
\`\`\`bash
curl -X GET "https://api.namecheap.com/api/batch/xml?ApiUser=\${API_USER}&ApiKey=\${API_KEY}&ClientIp=\${CLIENT_IP}&Command=namecheap.domains.check&DomainList=example.com"
\`\`\`

### Get Domain List
\`\`\`bash
curl -X GET "https://api.namecheap.com/api/batch/xml" \\
  -G --data-urlencode "ApiUser=\${API_USER}" \\
  --data-urlencode "ApiKey=\${API_KEY}" \\
  --data-urlencode "ClientIp=\${CLIENT_IP}" \\
  --data-urlencode "Command=namecheap.domains.getList" \\
  --data-urlencode "PageSize=100"
\`\`\`

### Get DNS Records
\`\`\`bash
curl -X GET "https://api.namecheap.com/api/batch/xml" \\
  -G --data-urlencode "ApiUser=\${API_USER}" \\
  --data-urlencode "ApiKey=\${API_KEY}" \\
  --data-urlencode "ClientIp=\${CLIENT_IP}" \\
  --data-urlencode "Command=namecheap.domains.dns.getHosts" \\
  --data-urlencode "DomainName=example.com" \\
  --data-urlencode "SLD=example" \\
  --data-urlencode "TLD=com"
\`\`\`

### Set DNS Records
\`\`\`bash
curl -X GET "https://api.namecheap.com/api/batch/xml" \\
  -G --data-urlencode "ApiUser=\${API_USER}" \\
  --data-urlencode "ApiKey=\${API_KEY}" \\
  --data-urlencode "ClientIp=\${CLIENT_IP}" \\
  --data-urlencode "Command=namecheap.domains.dns.setHosts" \\
  --data-urlencode "DomainName=example.com" \\
  --data-urlencode "SLD=example" \\
  --data-urlencode "TLD=com" \\
  --data-urlencode "HostName1=www" \\
  --data-urlencode "RecordType1=A" \\
  --data-urlencode "RecordAddress1=192.0.2.10" \\
  --data-urlencode "TTL1=3600"
\`\`\`

### Register Domain
\`\`\`bash
curl -X GET "https://api.namecheap.com/api/batch/xml" \\
  -G --data-urlencode "ApiUser=\${API_USER}" \\
  --data-urlencode "ApiKey=\${API_KEY}" \\
  --data-urlencode "ClientIp=\${CLIENT_IP}" \\
  --data-urlencode "Command=namecheap.domains.create" \\
  --data-urlencode "DomainName=example.com" \\
  --data-urlencode "Years=1" \\
  --data-urlencode "Nameserver=ns1.example.com,ns2.example.com" \\
  --data-urlencode "RegistrantFirstName=John" \\
  --data-urlencode "RegistrantLastName=Doe" \\
  --data-urlencode "RegistrantEmail=admin@example.com" \\
  --data-urlencode "RegistrantPhone=+1.5105555555" \\
  --data-urlencode "RegistrantOrganizationName=Example Inc" \\
  --data-urlencode "RegistrantAddress1=123 Main St" \\
  --data-urlencode "RegistrantCity=Anytown" \\
  --data-urlencode "RegistrantStateProvince=CA" \\
  --data-urlencode "RegistrantPostalCode=90210" \\
  --data-urlencode "RegistrantCountry=US"
\`\`\`

## Common Domain Operations

### Bulk Domain Check
\`\`\`bash
#!/bin/bash
# Check multiple domains

domains=("example.com" "example.net" "example.org")

for domain in "\${domains[@]}"; do
    # Using dig for quick check
    if dig +short \$domain | grep -q .; then
        echo "\$domain - ACTIVE"
    else
        echo "\$domain - NOT FOUND"
    fi
done
\`\`\`

### Bulk DNS Update
\`\`\`bash
#!/bin/bash
# Update DNS for multiple domains using Namecheap API

API_USER="your_username"
API_KEY="your_api_key"
CLIENT_IP="your.ip.address"

# CSV: domain,type,name,value,ttl
while IFS=, read domain type name value ttl; do
    curl -s -X GET "https://api.namecheap.com/api/batch/xml" \\
        -G --data-urlencode "ApiUser=\${API_USER}" \\
        --data-urlencode "ApiKey=\${API_KEY}" \\
        --data-urlencode "ClientIp=\${CLIENT_IP}" \\
        --data-urlencode "Command=namecheap.domains.dns.setHosts" \\
        --data-urlencode "DomainName=\${domain}" \\
        --data-urlencode "SLD=\${domain%.*}" \\
        --data-urlencode "TLD=\${domain##*.}" \\
        --data-urlencode "HostName1=\${name}" \\
        --data-urlencode "RecordType1=\${type}" \\
        --data-urlencode "RecordAddress1=\${value}" \\
        --data-urlencode "TTL1=\${ttl}"
done < domains.csv
\`\`\`

### Domain Status Monitoring
\`\`\`bash
#!/bin/bash
# Check domain expiration and registration status

domain="example.com"

# Using whois for registration info
whois \$domain | grep -E "Expir|Registrar|Status"

# Using dig for DNS resolution
echo "DNS Active: \$(dig +short \$domain | head -1)"

# Using GoDaddy API
curl -s -X GET "https://api.godaddy.com/v1/domains/\${domain}" \\
    -H "Authorization: sso-key \${API_KEY}:\${API_SECRET}" | jq '.expires'
\`\`\`

## WHOIS Privacy and Registrant Protection

### Privacy Options

#### OpenSRS Privacy
\`\`\`bash
curl -X POST https://api.opensrs.com:55443 \\
  -d '<?xml version="1.0"?>
<methodCall>
  <methodName>modifyDomain</methodName>
  <params>
    <param>
      <value>
        <struct>
          <member>
            <name>domain</name>
            <value><string>example.com</string></value>
          </member>
          <member>
            <name>whois_privacy</name>
            <value><string>Yes</string></value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>'
\`\`\`

#### GoDaddy Privacy
\`\`\`bash
curl -X PATCH "https://api.godaddy.com/v1/domains/example.com" \\
  -H "Authorization: sso-key \${API_KEY}:\${API_SECRET}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "privacy": true
  }'
\`\`\`

## Best Practices

### 1. API Key Management
- Store keys in environment variables or secure vaults
- Rotate keys regularly
- Use separate keys for test and production
- Monitor key usage for unauthorized access

### 2. Rate Limiting
- Implement backoff strategies
- Batch operations when possible
- Cache results to minimize API calls
- Monitor API rate limit headers

### 3. Error Handling
- Log all API responses
- Implement retry logic with exponential backoff
- Handle 4xx and 5xx errors gracefully
- Notify on critical failures

### 4. Domain Transfer
- Verify authorization code before transfer
- Check domain lock status
- Update nameservers post-transfer
- Verify DNS propagation

### 5. Security
- Use HTTPS for all API calls
- Validate SSL certificates
- Whitelist IP addresses if available
- Implement audit logging

## Troubleshooting

### Common Issues

#### Authentication Failures
- Verify API key and credentials
- Check IP whitelisting requirements
- Ensure correct endpoint format
- Review API documentation

#### Domain Not Found
- Verify domain name spelling
- Check domain ownership
- Confirm domain registrar
- Use whois to verify registration

#### DNS Changes Not Propagating
- Check TTL values (lower = faster)
- Allow time for DNS propagation (up to 48 hours)
- Query multiple nameservers
- Verify DNS records were created

## References
- EPP RFC 5730: https://tools.ietf.org/html/rfc5730
- OpenSRS API: https://www.opensrs.com/
- GoDaddy API: https://developer.godaddy.com/
- Namecheap API: https://www.namecheap.com/support/api/
- ICANN WHOIS: https://www.icann.org/
`;
