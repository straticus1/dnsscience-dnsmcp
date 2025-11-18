#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getDnsKnowledge } from './knowledge/index.js';
import { executeDnsQuery } from './tools/dig.js';
import { analyzeZoneFile } from './tools/zone-analyzer.js';
import { validateDnsConfig } from './tools/config-validator.js';
import { debugDnsIssue } from './tools/dns-debugger.js';

const server = new Server(
  {
    name: 'dns-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// List available resources (DNS knowledge base)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'dns://knowledge/bind',
        name: 'BIND DNS Server Knowledge',
        description: 'Comprehensive knowledge about ISC BIND, configuration, troubleshooting, and best practices',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/nsd',
        name: 'NSD Authoritative DNS Server',
        description: 'NLnet Labs NSD configuration, zone management, and optimization',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/unbound',
        name: 'Unbound Recursive Resolver',
        description: 'Unbound DNS resolver configuration, DNSSEC, and caching strategies',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/djbdns',
        name: 'DJBDNS/TinyDNS',
        description: 'Dan Bernstein\'s DNS software suite including tinydns, dnscache',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/powerdns',
        name: 'PowerDNS',
        description: 'PowerDNS Authoritative and Recursor, database backends, API',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/dig',
        name: 'DNS Debugging Tools',
        description: 'dig, drill, ldns-tools, host, nslookup - query and debugging',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/registrars',
        name: 'Domain Registrars & APIs',
        description: 'OpenSRS, GoDaddy, Namecheap, and registrar API integration',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/dnssec',
        name: 'DNSSEC Implementation',
        description: 'DNSSEC signing, validation, key management, and troubleshooting',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/troubleshooting',
        name: 'DNS Troubleshooting Guide',
        description: 'Common DNS issues, debugging strategies, and resolution steps',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/dns-records',
        name: 'Complete DNS Record Types',
        description: 'All DNS record types: A, AAAA, MX, NS, TXT, SRV, CAA, TLSA, DNSKEY, NSEC, SVCB, HTTPS, and more',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/dane-tlsa',
        name: 'DANE and TLSA Records',
        description: 'DANE protocol, TLSA record configuration, certificate pinning, OpenSSL hash generation',
        mimeType: 'text/plain',
      },
      {
        uri: 'dns://knowledge/openssl-certs',
        name: 'OpenSSL and SSL/TLS Certificates',
        description: 'Certificate generation, CSR creation, key management, testing, TLSA hash generation, troubleshooting',
        mimeType: 'text/plain',
      },
    ],
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri.toString();
  const topic = uri.replace('dns://knowledge/', '');

  const knowledge = getDnsKnowledge(topic);

  if (!knowledge) {
    throw new Error(`Unknown DNS knowledge topic: ${topic}`);
  }

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: 'text/plain',
        text: knowledge,
      },
    ],
  };
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'dns_query',
        description: 'Execute DNS queries (like dig) with various record types and options. Supports A, AAAA, MX, NS, TXT, SOA, CNAME, PTR, SRV, CAA, DNSKEY, DS, NSEC, NSEC3, and more.',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'Domain name to query',
            },
            type: {
              type: 'string',
              description: 'Record type (A, AAAA, MX, NS, TXT, SOA, CNAME, PTR, SRV, CAA, ANY, etc.)',
              default: 'A',
            },
            server: {
              type: 'string',
              description: 'DNS server to query (optional, defaults to system resolver)',
            },
            options: {
              type: 'object',
              description: 'Additional query options',
              properties: {
                dnssec: { type: 'boolean', description: 'Request DNSSEC records' },
                trace: { type: 'boolean', description: 'Trace delegation path' },
                reverse: { type: 'boolean', description: 'Reverse lookup (PTR)' },
                tcp: { type: 'boolean', description: 'Use TCP instead of UDP' },
              },
            },
          },
          required: ['domain'],
        },
      },
      {
        name: 'analyze_zone',
        description: 'Analyze a DNS zone file for errors, best practices, and optimization opportunities. Checks SOA records, NS records, DNSSEC, and common misconfigurations.',
        inputSchema: {
          type: 'object',
          properties: {
            zoneContent: {
              type: 'string',
              description: 'DNS zone file content to analyze',
            },
            zoneName: {
              type: 'string',
              description: 'Zone name (e.g., example.com)',
            },
          },
          required: ['zoneContent', 'zoneName'],
        },
      },
      {
        name: 'validate_config',
        description: 'Validate DNS server configuration files (BIND named.conf, NSD nsd.conf, Unbound unbound.conf, PowerDNS pdns.conf). Checks syntax, security, and best practices.',
        inputSchema: {
          type: 'object',
          properties: {
            serverType: {
              type: 'string',
              enum: ['bind', 'nsd', 'unbound', 'powerdns', 'djbdns'],
              description: 'DNS server type',
            },
            configContent: {
              type: 'string',
              description: 'Configuration file content',
            },
          },
          required: ['serverType', 'configContent'],
        },
      },
      {
        name: 'debug_dns',
        description: 'Comprehensive DNS debugging tool. Analyzes DNS issues, checks propagation, validates DNSSEC, tests resolution paths, and provides troubleshooting recommendations.',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'Domain to debug',
            },
            issue: {
              type: 'string',
              description: 'Description of the issue (optional)',
            },
            checkDnssec: {
              type: 'boolean',
              description: 'Check DNSSEC validation',
              default: true,
            },
            checkPropagation: {
              type: 'boolean',
              description: 'Check DNS propagation across multiple servers',
              default: true,
            },
          },
          required: ['domain'],
        },
      },
      {
        name: 'generate_config',
        description: 'Generate DNS server configuration files based on requirements. Supports BIND, NSD, Unbound, PowerDNS with security best practices.',
        inputSchema: {
          type: 'object',
          properties: {
            serverType: {
              type: 'string',
              enum: ['bind', 'nsd', 'unbound', 'powerdns'],
              description: 'DNS server type',
            },
            configType: {
              type: 'string',
              enum: ['authoritative', 'recursive', 'both'],
              description: 'Server role',
            },
            zones: {
              type: 'array',
              items: { type: 'string' },
              description: 'Zone names to configure (optional)',
            },
            options: {
              type: 'object',
              properties: {
                dnssec: { type: 'boolean', description: 'Enable DNSSEC' },
                ratelimit: { type: 'boolean', description: 'Enable rate limiting' },
                logging: { type: 'string', enum: ['minimal', 'standard', 'verbose'] },
              },
            },
          },
          required: ['serverType', 'configType'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [{ type: 'text', text: 'Error: No arguments provided' }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'dns_query': {
        const result = await executeDnsQuery(
          args.domain as string,
          args.type as string,
          args.server as string | undefined,
          args.options as any
        );
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'analyze_zone': {
        const result = analyzeZoneFile(
          args.zoneContent as string,
          args.zoneName as string
        );
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'validate_config': {
        const result = validateDnsConfig(
          args.serverType as string,
          args.configContent as string
        );
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'debug_dns': {
        const result = await debugDnsIssue(
          args.domain as string,
          args.issue as string | undefined,
          args.checkDnssec as boolean,
          args.checkPropagation as boolean
        );
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'generate_config': {
        const { generateConfig } = await import('./tools/config-generator.js');
        const result = generateConfig(
          args.serverType as string,
          args.configType as string,
          args.zones as string[] | undefined,
          args.options as any
        );
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DNS MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
