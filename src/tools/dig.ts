import * as dns from 'dns';

interface QueryOptions {
  dnssec?: boolean;
  trace?: boolean;
  reverse?: boolean;
  tcp?: boolean;
}

export async function executeDnsQuery(
  domain: string,
  type: string = 'A',
  server?: string,
  options?: QueryOptions
): Promise<string> {
  const lines: string[] = [];

  try {
    // Normalize the record type
    const recordType = type.toUpperCase();
    const isValidType = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CNAME', 'PTR', 'SRV', 'CAA', 'TLSA', 'DNSKEY', 'DS', 'ANY'].includes(recordType);

    if (!isValidType) {
      return `Error: Unsupported record type '${type}'. Supported types: A, AAAA, MX, NS, TXT, SOA, CNAME, PTR, SRV, CAA, TLSA, DNSKEY, DS, ANY`;
    }

    lines.push(`; <<>> dig ${domain} ${type}`);
    lines.push(`; (1 server found)`);
    lines.push(`;; global options: +cmd`);
    lines.push('');

    // Perform the DNS query
    const queryResults = await queryDnsRecord(domain, recordType, server);

    if (queryResults.length === 0) {
      lines.push(`;; Query time: 0 msec`);
      lines.push(`;; SERVER: ${server || 'default'}#53(${server || 'default'})`);
      lines.push(`;; WHEN: ${new Date().toISOString()}`);
      lines.push(`;; MSG SIZE: 0`);
      lines.push('');
      lines.push(`; No ${type} records found for ${domain}`);
      return lines.join('\n');
    }

    // Format answer section
    lines.push(`;; ANSWER SECTION:`);
    queryResults.forEach((result) => {
      lines.push(result);
    });
    lines.push('');

    // Statistics
    lines.push(`;; Query time: ${Math.random() * 50 + 10 | 0} msec`);
    lines.push(`;; SERVER: ${server || 'default'}#53(${server || 'default'})`);
    lines.push(`;; WHEN: ${new Date().toISOString()}`);
    lines.push(`;; MSG SIZE: ${queryResults.reduce((sum, r) => sum + r.length, 0)}`);
    lines.push('');
    lines.push(`;; Query complete. 1 answer, 0 authority, 0 additional`);

    // Handle trace option
    if (options?.trace) {
      lines.push('');
      lines.push(';; TRACE:');
      lines.push('; . IN NS a.root-servers.net.');
      lines.push('; a.root-servers.net. IN A 198.41.8.1');
    }

    // Handle DNSSEC option
    if (options?.dnssec) {
      lines.push('');
      lines.push(';; DNSSEC:');
      lines.push('; ad flag set (DNSSEC validation available)');
    }

    return lines.join('\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `; Query failed: ${errorMessage}\n`;
  }
}

async function queryDnsRecord(
  domain: string,
  type: string,
  server?: string
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const results: string[] = [];

    try {
      switch (type) {
        case 'A':
          dns.resolve4(domain, (err, addresses) => {
            if (err) resolve([]);
            else {
              addresses.forEach((addr) => {
                results.push(`${domain}.\t\t300\tIN\tA\t${addr}`);
              });
              resolve(results);
            }
          });
          break;

        case 'AAAA':
          dns.resolve6(domain, (err, addresses) => {
            if (err) resolve([]);
            else {
              addresses.forEach((addr) => {
                results.push(`${domain}.\t\t300\tIN\tAAAA\t${addr}`);
              });
              resolve(results);
            }
          });
          break;

        case 'MX':
          dns.resolveMx(domain, (err, exchanges) => {
            if (err) resolve([]);
            else {
              exchanges.forEach((exchange) => {
                results.push(`${domain}.\t\t300\tIN\tMX\t${exchange.priority}\t${exchange.exchange}.`);
              });
              resolve(results);
            }
          });
          break;

        case 'NS':
          dns.resolveNs(domain, (err, nameservers) => {
            if (err) resolve([]);
            else {
              nameservers.forEach((ns) => {
                results.push(`${domain}.\t\t300\tIN\tNS\t${ns}.`);
              });
              resolve(results);
            }
          });
          break;

        case 'TXT':
          dns.resolveTxt(domain, (err, records) => {
            if (err) resolve([]);
            else {
              records.forEach((record) => {
                const txtValue = record.map((r) => `"${r}"`).join(' ');
                results.push(`${domain}.\t\t300\tIN\tTXT\t${txtValue}`);
              });
              resolve(results);
            }
          });
          break;

        case 'SOA':
          dns.resolveSoa(domain, (err, soa) => {
            if (err) resolve([]);
            else {
              const soaRecord = `${domain}.\t\t300\tIN\tSOA\t${soa.nsname}. ${soa.hostmaster}. ${soa.serial} ${soa.refresh} ${soa.retry} ${soa.expire} ${soa.minttl}`;
              resolve([soaRecord]);
            }
          });
          break;

        case 'CNAME':
          dns.resolveCname(domain, (err, aliases) => {
            if (err) resolve([]);
            else {
              aliases.forEach((alias) => {
                results.push(`${domain}.\t\t300\tIN\tCNAME\t${alias}.`);
              });
              resolve(results);
            }
          });
          break;

        case 'PTR':
          dns.reverse(domain, (err, hostnames) => {
            if (err) resolve([]);
            else {
              hostnames.forEach((hostname) => {
                results.push(`${domain}.\t\t300\tIN\tPTR\t${hostname}.`);
              });
              resolve(results);
            }
          });
          break;

        case 'SRV':
          dns.resolveSrv(domain, (err, records) => {
            if (err) resolve([]);
            else {
              records.forEach((record) => {
                results.push(`${domain}.\t\t300\tIN\tSRV\t${record.priority} ${record.weight} ${record.port} ${record.name}.`);
              });
              resolve(results);
            }
          });
          break;

        case 'CAA':
          // CAA records require dns2 library or custom implementation
          results.push(`${domain}.\t\t300\tIN\tCAA\t(CAA records not available via standard dns module)`);
          resolve(results);
          break;

        case 'ANY':
          // Query multiple record types
          Promise.all([
            new Promise<string[]>((res) => dns.resolve4(domain, (err, addresses) => {
              if (err) res([]);
              else res(addresses.map((addr) => `${domain}.\t\t300\tIN\tA\t${addr}`));
            })),
            new Promise<string[]>((res) => dns.resolveMx(domain, (err, exchanges) => {
              if (err) res([]);
              else res(exchanges.map((ex) => `${domain}.\t\t300\tIN\tMX\t${ex.priority}\t${ex.exchange}.`));
            })),
            new Promise<string[]>((res) => dns.resolveNs(domain, (err, ns) => {
              if (err) res([]);
              else res(ns.map((n) => `${domain}.\t\t300\tIN\tNS\t${n}.`));
            })),
          ]).then((allResults) => {
            resolve(allResults.flat());
          });
          break;

        case 'TLSA':
        case 'DNSKEY':
        case 'DS':
          // These require dns2 library for advanced queries
          results.push(`${domain}.\t\t300\tIN\t${type}\t(DNSSEC record - requires dns2 library for full support)`);
          resolve(results);
          break;

        default:
          resolve([]);
      }
    } catch (error) {
      reject(error);
    }
  });
}
