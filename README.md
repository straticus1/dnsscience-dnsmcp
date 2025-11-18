# DNS MCP Server

A comprehensive Model Context Protocol (MCP) server providing expert knowledge and tools for DNS administration. This server covers BIND, NSD, Unbound, DJBDNS, PowerDNS, DNS debugging tools, registrar APIs, DNSSEC, DANE, TLSA, and SSL certificates.

## Features

### Knowledge Base
Access comprehensive documentation for:
- **BIND** - ISC BIND DNS server configuration and management
- **NSD** - NLnet Labs authoritative DNS server
- **Unbound** - Validating recursive resolver with DNSSEC
- **DJBDNS** - Dan Bernstein's DNS suite (tinydns, dnscache)
- **PowerDNS** - Authoritative and Recursor with database backends
- **DNS Debugging Tools** - dig, drill, ldns, host, nslookup, kdig
- **Registrar APIs** - OpenSRS, GoDaddy, Namecheap, EPP protocol
- **DNSSEC** - Signing, validation, key management
- **DNS Record Types** - Complete reference for all record types (A, AAAA, MX, NS, TXT, SRV, CAA, TLSA, DNSKEY, DS, NSEC, SVCB, HTTPS, etc.)
- **DANE & TLSA** - DNS-based Authentication of Named Entities
- **OpenSSL & Certificates** - Certificate generation, management, and TLSA hash creation
- **Troubleshooting** - Common DNS issues and debugging strategies

### Tools
Execute DNS operations:
- **dns_query** - Perform DNS lookups (like dig) for any record type
- **analyze_zone** - Validate and analyze DNS zone files
- **validate_config** - Check DNS server configurations (BIND, NSD, Unbound, PowerDNS)
- **debug_dns** - Comprehensive DNS debugging with propagation checks
- **generate_config** - Create DNS server configuration files

## Installation

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Install Dependencies

```bash
cd /Users/ryan/development/afterdarksys.com/subdomains/dnsscience/dnsmcp
npm install
```

### Build

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

## Configuration in Claude Desktop

Add this server to your Claude Desktop configuration file:

### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Windows
Edit `%APPDATA%/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dns": {
      "command": "node",
      "args": [
        "C:\\path\\to\\dnsmcp\\dist\\index.js"
      ]
    }
  }
}
```

### Linux
Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dns": {
      "command": "node",
      "args": [
        "/home/user/path/to/dnsmcp/dist/index.js"
      ]
    }
  }
}
```

## Restart Claude Desktop

After adding the configuration, completely quit and restart Claude Desktop for the changes to take effect.

## Usage Examples

Once configured, you can use the DNS MCP server in Claude conversations:

### Access Knowledge Base

**"Show me how to configure BIND with DNSSEC"**
- Claude will access the BIND knowledge resource and provide detailed DNSSEC configuration

**"How do I create a TLSA record?"**
- Claude will reference the DANE/TLSA knowledge base

**"What are all the DNS record types?"**
- Claude will show the complete DNS record types reference

**"How do I generate an SSL certificate with OpenSSL?"**
- Claude will provide OpenSSL certificate generation commands

### Use DNS Tools

**"Query the MX records for example.com"**
```
Claude will use the dns_query tool to look up MX records
```

**"Analyze this zone file for errors"**
```
Claude will use the analyze_zone tool to validate zone syntax
```

**"Debug DNS issues for example.com"**
```
Claude will use the debug_dns tool to check delegation, DNSSEC, propagation
```

**"Generate a BIND configuration for authoritative DNS"**
```
Claude will use the generate_config tool to create a complete named.conf
```

**"Validate my Unbound configuration"**
```
Claude will use the validate_config tool to check for errors
```

## Testing the MCP Server

### Test with MCP Inspector

Install the MCP Inspector:

```bash
npm install -g @modelcontextprotocol/inspector
```

Run the inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a web interface where you can:
1. Browse available resources (knowledge base)
2. Test tools interactively
3. View server capabilities
4. Debug MCP protocol messages

### Manual Testing with Node

Create a test file `test-server.js`:

```javascript
import { spawn } from 'child_process';

const server = spawn('node', ['dist/index.js']);

server.stdout.on('data', (data) => {
  console.log('Server output:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Send a test request
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'resources/list',
  params: {}
};

server.stdin.write(JSON.stringify(request) + '\n');

setTimeout(() => {
  server.kill();
}, 5000);
```

Run the test:

```bash
node test-server.js
```

### Test DNS Query Tool

You can test the tools directly by importing them:

```javascript
import { executeDnsQuery } from './dist/tools/dig.js';

const result = await executeDnsQuery('example.com', 'A');
console.log(result);
```

### Test Zone Analyzer

```javascript
import { analyzeZoneFile } from './dist/tools/zone-analyzer.js';

const zoneContent = `
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
`;

const result = analyzeZoneFile(zoneContent, 'example.com');
console.log(result);
```

## Development

### Watch Mode

For development with auto-rebuild:

```bash
npm run dev
```

### Project Structure

```
dnsmcp/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── knowledge/            # Knowledge base modules
│   │   ├── index.ts          # Knowledge dispatcher
│   │   ├── bind.ts           # BIND knowledge
│   │   ├── nsd.ts            # NSD knowledge
│   │   ├── unbound.ts        # Unbound knowledge
│   │   ├── djbdns.ts         # DJBDNS knowledge
│   │   ├── powerdns.ts       # PowerDNS knowledge
│   │   ├── dig.ts            # DNS debugging tools
│   │   ├── registrars.ts     # Registrar APIs
│   │   ├── dnssec.ts         # DNSSEC knowledge
│   │   ├── dns-records.ts    # All DNS record types
│   │   ├── dane-tlsa.ts      # DANE and TLSA
│   │   ├── openssl-certs.ts  # OpenSSL and certificates
│   │   └── troubleshooting.ts # Troubleshooting guide
│   └── tools/                # DNS tools
│       ├── dig.ts            # DNS query tool
│       ├── zone-analyzer.ts  # Zone file analyzer
│       ├── config-validator.ts # Config validator
│       ├── dns-debugger.ts   # DNS debugger
│       └── config-generator.ts # Config generator
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Real-World Use Cases

### 1. DNSSEC Deployment
Ask Claude: "Help me set up DNSSEC for my domain using BIND"
- Provides key generation commands
- Shows signing configuration
- Explains DS record submission to registrar

### 2. DANE/TLSA Implementation
Ask Claude: "How do I implement DANE for my mail server?"
- Shows certificate generation
- Explains TLSA record formats
- Provides OpenSSL hash commands
- Shows how to test DANE validation

### 3. DNS Migration
Ask Claude: "I'm migrating from BIND to PowerDNS, what do I need to know?"
- Compares configuration syntax
- Shows zone file conversion
- Explains backend setup
- Provides migration checklist

### 4. Troubleshooting
Ask Claude: "My domain returns SERVFAIL, help me debug it"
- Uses debug_dns tool to check delegation
- Validates DNSSEC chain
- Checks nameserver responses
- Provides actionable recommendations

### 5. Zone File Validation
Ask Claude: "Check this zone file for errors: [paste zone file]"
- Validates SOA records
- Checks for CNAME conflicts
- Verifies NS records
- Suggests improvements

## Troubleshooting

### Server Not Appearing in Claude

1. **Check the config file location**
   ```bash
   # macOS
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Verify the path is absolute**
   - Must be full path to dist/index.js
   - Use forward slashes (/) even on Windows in JSON

3. **Restart Claude Desktop completely**
   - Quit from menu (not just close window)
   - Reopen Claude Desktop

4. **Check build succeeded**
   ```bash
   npm run build
   ls -la dist/index.js
   ```

### Server Crashes

Check stderr output in Claude Desktop Developer Tools:
- Help > Developer > Toggle Developer Tools (on macOS)
- Look for error messages in the Console tab

### TypeScript Errors

```bash
npm run build
# Fix any TypeScript errors reported
```

### Testing Connection

Use the MCP Inspector to verify the server works:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Contributing

This DNS MCP server is designed to be comprehensive and up-to-date with DNS best practices. To contribute:

1. Add knowledge to relevant files in `src/knowledge/`
2. Update tools in `src/tools/`
3. Follow existing TypeScript patterns
4. Test with MCP Inspector before submitting

## Resources

- **MCP Documentation**: https://modelcontextprotocol.io/
- **MCP SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **DNS RFCs**: https://www.dns-rfc.org/
- **BIND Documentation**: https://bind9.readthedocs.io/
- **DNSSEC Guide**: https://www.internetsociety.org/deploy360/dnssec/

## License

MIT License - See LICENSE file for details

## Author

DNS Science - Professional DNS solutions and expertise

## Version

1.0.0 - Initial release with comprehensive DNS knowledge and tools
