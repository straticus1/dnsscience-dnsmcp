# DNS MCP Server - Quick Start Guide

## Installation (5 minutes)

### Step 1: Install Dependencies
```bash
cd /Users/ryan/development/afterdarksys.com/subdomains/dnsscience/dnsmcp
npm install
```

### Step 2: Build the Project
```bash
npm run build
```

You should see the `dist/` directory created with compiled JavaScript files.

### Step 3: Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Add this configuration (create the file if it doesn't exist):

```json
{
  "mcpServers": {
    "dns": {
      "command": "node",
      "args": [
        "/Users/ryan/development/afterdarksys.com/subdomains/dnsscience/dnsmcp/dist/index.js"
      ]
    }
  }
}
```

**Important:** Use the FULL absolute path to the dist/index.js file!

### Step 4: Restart Claude Desktop

1. Quit Claude Desktop completely (not just close the window)
2. Open Claude Desktop again
3. Start a new conversation

## Testing the Server

### Test 1: Verify Server is Loaded

In Claude, type:
```
What DNS MCP resources are available?
```

Claude should list all the DNS knowledge resources (BIND, NSD, Unbound, etc.)

### Test 2: Access Knowledge Base

Try asking:
```
Show me how to configure BIND for DNSSEC
```

Claude will access the BIND knowledge resource and provide detailed DNSSEC configuration instructions.

### Test 3: Use DNS Tools

Try these queries:

**DNS Lookup:**
```
Query the MX records for google.com
```

**Zone Analysis:**
```
Analyze this zone file:
$TTL 86400
@   IN  SOA ns1.example.com. admin.example.com. (
        2024011701
        3600
        1800
        604800
        86400
)
@   IN  NS  ns1.example.com.
@   IN  A   192.0.2.1
www IN  A   192.0.2.10
```

**DNS Debugging:**
```
Debug DNS issues for cloudflare.com
```

**Generate Configuration:**
```
Generate a BIND authoritative server configuration for example.com with DNSSEC enabled
```

## Example Conversations

### Example 1: TLSA Record Creation

**You:** "I need to create a TLSA record for my web server. I have a certificate at /etc/ssl/cert.pem. What do I do?"

**Claude will:**
1. Access the DANE/TLSA knowledge base
2. Explain TLSA record format
3. Show OpenSSL commands to generate the hash
4. Provide the exact DNS record to add

### Example 2: Troubleshooting SERVFAIL

**You:** "My domain is returning SERVFAIL. How do I debug this?"

**Claude will:**
1. Access troubleshooting knowledge
2. List common SERVFAIL causes
3. Show debugging commands
4. Optionally use the dns_query and debug_dns tools to investigate

### Example 3: DNS Record Types

**You:** "What's the difference between CAA and TLSA records?"

**Claude will:**
1. Access DNS record types knowledge
2. Explain CAA (Certificate Authority Authorization)
3. Explain TLSA (TLS Association for DANE)
4. Show examples of both

## Troubleshooting

### Server Not Appearing

**Check 1: Verify config file exists**
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Check 2: Verify path is correct**
```bash
ls -la /Users/ryan/development/afterdarksys.com/subdomains/dnsscience/dnsmcp/dist/index.js
```

**Check 3: Test server directly**
```bash
node /Users/ryan/development/afterdarksys.com/subdomains/dnsscience/dnsmcp/dist/index.js
```

It should print: `DNS MCP Server running on stdio`

**Check 4: Use MCP Inspector**
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a web interface to test the server.

### Build Errors

If you get TypeScript errors:
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

## What You Can Do

### Knowledge Base Access (12 Topics)

1. **BIND** - ISC BIND configuration, zones, DNSSEC
2. **NSD** - NLnet Labs authoritative server
3. **Unbound** - Recursive resolver, DNSSEC validation
4. **DJBDNS** - TinyDNS, DNSCache
5. **PowerDNS** - Authoritative and Recursor, backends, API
6. **DNS Tools** - dig, drill, ldns, host, nslookup
7. **Registrars** - OpenSRS, GoDaddy, Namecheap, EPP
8. **DNSSEC** - Signing, validation, key management
9. **DNS Records** - All record types (A, AAAA, MX, NS, TXT, SRV, CAA, TLSA, etc.)
10. **DANE/TLSA** - Certificate pinning, TLSA records
11. **OpenSSL** - Certificate generation, CSR creation, testing
12. **Troubleshooting** - Common issues, debugging strategies

### DNS Tools (5 Tools)

1. **dns_query** - Perform DNS lookups for any record type
2. **analyze_zone** - Validate zone file syntax and best practices
3. **validate_config** - Check DNS server configurations
4. **debug_dns** - Comprehensive DNS debugging with propagation checks
5. **generate_config** - Create DNS server configuration files

## Example Use Cases

### Use Case 1: Setting up a New DNS Server

**Ask Claude:**
```
I want to set up an authoritative DNS server using BIND for my domain example.com.
I need DNSSEC enabled and rate limiting. Can you generate the configuration?
```

Claude will:
- Use the generate_config tool to create named.conf
- Reference BIND knowledge for best practices
- Show DNSSEC signing commands
- Provide zone file templates

### Use Case 2: DANE Implementation

**Ask Claude:**
```
Guide me through implementing DANE for my mail server mail.example.com
running on port 25. I already have a certificate.
```

Claude will:
- Reference DANE/TLSA knowledge
- Show OpenSSL commands to extract public key hash
- Generate the TLSA record
- Explain DNSSEC requirement
- Show testing commands

### Use Case 3: DNS Migration

**Ask Claude:**
```
I'm migrating from BIND to PowerDNS with a PostgreSQL backend.
What are the key differences I need to know?
```

Claude will:
- Compare BIND and PowerDNS knowledge bases
- Explain configuration differences
- Show PostgreSQL schema setup
- Provide migration steps
- Warn about potential issues

### Use Case 4: Certificate Management

**Ask Claude:**
```
How do I generate a self-signed certificate with SAN entries for
www.example.com, example.com, and mail.example.com, then create
TLSA records for all of them?
```

Claude will:
- Reference OpenSSL knowledge for certificate generation
- Show SAN configuration
- Generate TLSA hashes for each hostname
- Provide complete DNS records

## Tips for Best Results

1. **Be specific:** "Generate BIND config with DNSSEC" vs "help with DNS"
2. **Provide context:** Include error messages, configs, zone files
3. **Ask follow-ups:** Claude has deep knowledge - dig deeper!
4. **Use tools:** Ask Claude to "query" or "debug" to trigger tools
5. **Combine topics:** Claude can reference multiple knowledge bases

## Next Steps

1. ✅ Server installed and running
2. Try the example conversations above
3. Explore all 12 knowledge topics
4. Use the tools for real DNS operations
5. Ask Claude about any DNS topic you're working on!

## Getting Help

- **MCP Docs:** https://modelcontextprotocol.io/
- **Claude Desktop:** https://claude.ai/
- **DNS RFCs:** https://www.dns-rfc.org/
- **Issue tracking:** File issues in your git repository

---

**You're all set!** Start a conversation with Claude and ask any DNS question. The server provides comprehensive knowledge about all major DNS servers, tools, and protocols.
