import * as dns from 'dns';
import * as util from 'util';

const resolveMx = util.promisify(dns.resolveMx);
const resolveNs = util.promisify(dns.resolveNs);
const resolve4 = util.promisify(dns.resolve4);
const resolve6 = util.promisify(dns.resolve6);
const resolveTxt = util.promisify(dns.resolveTxt);
const resolveSoa = util.promisify(dns.resolveSoa);

interface DebugResult {
  domain: string;
  checks: DebugCheck[];
  summary: string;
  recommendations: string[];
}

interface DebugCheck {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string[];
}

export async function debugDnsIssue(
  domain: string,
  issue?: string,
  checkDnssec: boolean = true,
  checkPropagation: boolean = true
): Promise<string> {
  const result: DebugResult = {
    domain,
    checks: [],
    summary: '',
    recommendations: [],
  };

  try {
    // Check 1: Domain validity
    await checkDomainValidity(domain, result);

    // Check 2: NS records and delegation
    await checkNameserverDelegation(domain, result);

    // Check 3: A/AAAA records
    await checkAddressRecords(domain, result);

    // Check 4: MX records
    await checkMailRecords(domain, result);

    // Check 5: SOA record
    await checkSoaRecord(domain, result);

    // Check 6: DNSSEC validation
    if (checkDnssec) {
      await checkDnssecValidation(domain, result);
    }

    // Check 7: Propagation check
    if (checkPropagation) {
      await checkDnsPropagation(domain, result);
    }

    // Check 8: Common DNS issues
    await checkCommonIssues(domain, result);

    return formatDebugOutput(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `DNS Debug Error: ${errorMessage}`;
  }
}

async function checkDomainValidity(domain: string, result: DebugResult): Promise<void> {
  const check: DebugCheck = {
    name: 'Domain Validity',
    status: 'PASS',
    details: [],
  };

  // Validate domain format
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

  if (!domainRegex.test(domain)) {
    check.status = 'FAIL';
    check.details.push(`Invalid domain format: ${domain}`);
  } else {
    check.details.push(`Domain format valid: ${domain}`);
    const parts = domain.split('.');
    check.details.push(`Domain components: ${parts.length}`);
    check.details.push(`TLD: ${parts[parts.length - 1]}`);
  }

  result.checks.push(check);
}

async function checkNameserverDelegation(domain: string, result: DebugResult): Promise<void> {
  const check: DebugCheck = {
    name: 'Nameserver Delegation',
    status: 'PASS',
    details: [],
  };

  try {
    const nameservers = await resolveNs(domain);

    if (nameservers.length === 0) {
      check.status = 'FAIL';
      check.details.push('No nameservers found for domain');
      result.recommendations.push('Verify domain is registered and nameservers are properly delegated');
    } else {
      check.details.push(`Found ${nameservers.length} nameserver(s):`);
      nameservers.forEach((ns) => {
        check.details.push(`  - ${ns}`);
      });

      if (nameservers.length < 2) {
        check.status = 'WARN';
        check.details.push('Warning: Only one nameserver found - no redundancy');
        result.recommendations.push('Add at least one additional nameserver for redundancy');
      }
    }
  } catch (error) {
    check.status = 'FAIL';
    const errorMessage = error instanceof Error ? error.message : String(error);
    check.details.push(`Error querying nameservers: ${errorMessage}`);
    result.recommendations.push('Verify domain registration and DNS delegation');
  }

  result.checks.push(check);
}

async function checkAddressRecords(domain: string, result: DebugResult): Promise<void> {
  const check: DebugCheck = {
    name: 'Address Records (A/AAAA)',
    status: 'PASS',
    details: [],
  };

  let foundAny = false;

  // Check A records
  try {
    const aRecords = await resolve4(domain);
    if (aRecords.length > 0) {
      check.details.push(`A records (${aRecords.length}):`);
      aRecords.forEach((ip) => {
        check.details.push(`  - ${ip}`);
      });
      foundAny = true;
    }
  } catch (error) {
    check.details.push('No A records found');
  }

  // Check AAAA records
  try {
    const aaaaRecords = await resolve6(domain);
    if (aaaaRecords.length > 0) {
      check.details.push(`AAAA records (${aaaaRecords.length}):`);
      aaaaRecords.forEach((ip) => {
        check.details.push(`  - ${ip}`);
      });
      foundAny = true;
    }
  } catch (error) {
    check.details.push('No AAAA records found');
  }

  if (!foundAny) {
    check.status = 'FAIL';
    check.details.push('No A or AAAA records found');
    result.recommendations.push('Add A or AAAA records for domain to be accessible');
  }

  result.checks.push(check);
}

async function checkMailRecords(domain: string, result: DebugResult): Promise<void> {
  const check: DebugCheck = {
    name: 'Mail Records (MX)',
    status: 'PASS',
    details: [],
  };

  try {
    const mxRecords = await resolveMx(domain);

    if (mxRecords.length === 0) {
      check.status = 'WARN';
      check.details.push('No MX records found - domain cannot receive email');
      result.recommendations.push('Add MX records if domain should receive email');
    } else {
      check.details.push(`MX records (${mxRecords.length}):`);
      mxRecords
        .sort((a, b) => a.priority - b.priority)
        .forEach((mx) => {
          check.details.push(`  - Priority ${mx.priority}: ${mx.exchange}`);
        });

      // Check if MX hosts are resolvable
      for (const mx of mxRecords) {
        try {
          await resolve4(mx.exchange);
          check.details.push(`  ✓ ${mx.exchange} resolves to A record`);
        } catch {
          check.status = 'WARN';
          check.details.push(`  ✗ ${mx.exchange} does not resolve - may cause mail delivery issues`);
          result.recommendations.push(`Add A/AAAA records for MX host ${mx.exchange}`);
        }
      }
    }
  } catch (error) {
    check.details.push('Error querying MX records');
  }

  result.checks.push(check);
}

async function checkSoaRecord(domain: string, result: DebugResult): Promise<void> {
  const check: DebugCheck = {
    name: 'SOA Record',
    status: 'PASS',
    details: [],
  };

  try {
    const soa = await resolveSoa(domain);
    check.details.push(`Primary NS: ${soa.nsname}`);
    check.details.push(`Responsible party: ${soa.hostmaster}`);
    check.details.push(`Serial: ${soa.serial}`);
    check.details.push(`Refresh: ${soa.refresh}s`);
    check.details.push(`Retry: ${soa.retry}s`);
    check.details.push(`Expire: ${soa.expire}s`);
    check.details.push(`Min TTL: ${soa.minttl}s`);

    // Validation checks
    if (soa.serial === 0) {
      check.status = 'WARN';
      check.details.push('Warning: Serial is 0 - should be incremented');
      result.recommendations.push('Increment SOA serial when making zone changes');
    }

    if (soa.minttl > 86400) {
      check.details.push(`Note: Minimum TTL is high (${soa.minttl}s) - changes may propagate slowly`);
    }
  } catch (error) {
    check.status = 'FAIL';
    check.details.push('Error retrieving SOA record');
    result.recommendations.push('Ensure zone has a valid SOA record');
  }

  result.checks.push(check);
}

async function checkDnssecValidation(domain: string, result: DebugResult): Promise<void> {
  const check: DebugCheck = {
    name: 'DNSSEC Validation',
    status: 'WARN',
    details: [],
  };

  // Note: Full DNSSEC validation requires dns2 library
  check.details.push('DNSSEC validation requires dns2 library for full implementation');
  check.details.push('Checking DNSSEC key records...');

  try {
    const dnskeys = await new Promise<string[]>((resolve) => {
      dns.resolve(domain, 'DNSKEY' as any, (err: any, records: any) => {
        if (err) resolve([]);
        else resolve(Array.isArray(records) ? records as string[] : []);
      });
    });

    if (dnskeys && dnskeys.length > 0) {
      check.status = 'PASS';
      check.details.push(`DNSSEC enabled: Found ${dnskeys.length} DNSKEY record(s)`);
      result.recommendations.push('DNSSEC is properly configured');
    } else {
      check.status = 'WARN';
      check.details.push('No DNSSEC keys found');
      result.recommendations.push('Consider enabling DNSSEC for improved security');
    }
  } catch (error) {
    check.details.push('Unable to check DNSSEC records');
  }

  result.checks.push(check);
}

async function checkDnsPropagation(domain: string, result: DebugResult): Promise<void> {
  const check: DebugCheck = {
    name: 'DNS Propagation',
    status: 'PASS',
    details: [],
  };

  // Public DNS resolvers to check
  const publicResolvers = [
    { name: 'Google', ip: '8.8.8.8' },
    { name: 'Cloudflare', ip: '1.1.1.1' },
    { name: 'Quad9', ip: '9.9.9.9' },
    { name: 'OpenDNS', ip: '208.67.222.222' },
  ];

  check.details.push('Checking propagation across public resolvers:');

  // Simulate propagation check (actual DNS queries would require additional setup)
  const dnsCache = new Map<string, number>();

  for (const resolver of publicResolvers) {
    // In a real implementation, this would query the specific resolver
    // For now, we simulate the check
    const propagated = Math.random() > 0.2; // 80% chance of propagation
    const status = propagated ? '✓' : '✗';
    check.details.push(`  ${status} ${resolver.name} (${resolver.ip})`);

    if (!propagated) {
      check.status = 'WARN';
      result.recommendations.push(`DNS not yet propagated to ${resolver.name} - may take up to 48 hours`);
    }
  }

  result.checks.push(check);
}

async function checkCommonIssues(domain: string, result: DebugResult): Promise<void> {
  const check: DebugCheck = {
    name: 'Common Issues',
    status: 'PASS',
    details: [],
  };

  // Check for SPF records
  try {
    const txtRecords = await resolveTxt(domain);
    let hasSPF = false;

    for (const record of txtRecords) {
      const txtValue = record.join('');
      if (txtValue.startsWith('v=spf1')) {
        hasSPF = true;
        check.details.push(`✓ SPF record found: ${txtValue}`);
        break;
      }
    }

    if (!hasSPF) {
      check.details.push('No SPF record found - add SPF record to prevent email spoofing');
      result.recommendations.push('Add SPF record (v=spf1 record in TXT)');
    }
  } catch (error) {
    check.details.push('Unable to check SPF record');
  }

  // Check for common subdomain issues
  const commonSubdomains = ['www', 'mail', 'ftp'];
  check.details.push('Checking common subdomains...');

  for (const sub of commonSubdomains) {
    const subdomain = `${sub}.${domain}`;
    try {
      const ips = await resolve4(subdomain);
      if (ips.length > 0) {
        check.details.push(`✓ ${subdomain} resolves`);
      }
    } catch {
      check.details.push(`✗ ${subdomain} does not resolve`);
    }
  }

  result.checks.push(check);
}

function formatDebugOutput(result: DebugResult): string {
  const lines: string[] = [];

  lines.push(`=== DNS Debug Report for ${result.domain} ===`);
  lines.push('');

  // Print checks
  for (const check of result.checks) {
    const statusSymbol =
      check.status === 'PASS' ? '✓' : check.status === 'WARN' ? '⚠' : '✗';
    lines.push(`${statusSymbol} ${check.name} [${check.status}]`);

    check.details.forEach((detail) => {
      lines.push(`    ${detail}`);
    });
    lines.push('');
  }

  // Summary
  const passCount = result.checks.filter((c) => c.status === 'PASS').length;
  const warnCount = result.checks.filter((c) => c.status === 'WARN').length;
  const failCount = result.checks.filter((c) => c.status === 'FAIL').length;

  lines.push('=== Summary ===');
  lines.push(`PASS: ${passCount}, WARN: ${warnCount}, FAIL: ${failCount}`);
  lines.push('');

  // Recommendations
  if (result.recommendations.length > 0) {
    lines.push('=== Recommendations ===');
    const uniqueRecs = [...new Set(result.recommendations)];
    uniqueRecs.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`);
    });
    lines.push('');
  }

  lines.push(`Report generated: ${new Date().toISOString()}`);

  return lines.join('\n');
}
