interface ConfigOptions {
  dnssec?: boolean;
  ratelimit?: boolean;
  logging?: 'minimal' | 'standard' | 'verbose';
}

export function generateConfig(
  serverType: string,
  configType: string,
  zones?: string[],
  options?: ConfigOptions
): string {
  const type = serverType.toLowerCase();
  const role = configType.toLowerCase();

  try {
    switch (type) {
      case 'bind':
        return generateBindConfig(role, zones, options);
      case 'nsd':
        return generateNsdConfig(role, zones, options);
      case 'unbound':
        return generateUnboundConfig(role, zones, options);
      case 'powerdns':
        return generatePowerDnsConfig(role, zones, options);
      default:
        return `Error: Unknown server type '${type}'. Supported: bind, nsd, unbound, powerdns`;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error generating config: ${errorMessage}`;
  }
}

function generateBindConfig(
  role: string,
  zones?: string[],
  options?: ConfigOptions
): string {
  const lines: string[] = [];

  lines.push('// BIND 9 Configuration File');
  lines.push('// Generated configuration - customize as needed');
  lines.push('');

  // Include additional config files
  lines.push('include "/etc/bind/named.conf.local";');
  lines.push('include "/etc/bind/named.conf.default-zones";');
  lines.push('');

  // ACL definitions
  lines.push('acl internals {');
  lines.push('  127.0.0.1;');
  lines.push('  ::1;');
  lines.push('  // Add your trusted networks here');
  lines.push('};');
  lines.push('');

  // Options block
  lines.push('options {');
  lines.push('  directory "/var/cache/bind";');
  lines.push('  listen-on port 53 { 127.0.0.1; };');
  lines.push('  listen-on-v6 port 53 { ::1; };');
  lines.push('');

  if (role === 'recursive' || role === 'both') {
    lines.push('  recursion yes;');
    lines.push('  allow-recursion { internals; };');
    lines.push('  allow-query { any; };');
  } else {
    lines.push('  recursion no;');
    lines.push('  allow-query { any; };');
  }

  lines.push('');

  // DNSSEC
  if (options?.dnssec) {
    lines.push('  dnssec-enable yes;');
    lines.push('  dnssec-validation auto;');
  } else {
    lines.push('  dnssec-enable yes;');
    lines.push('  dnssec-validation no;');
  }

  lines.push('');

  // Zone transfers
  lines.push('  allow-transfer { none; };  // Configure for secondary servers');
  lines.push('  notify yes;');
  lines.push('  also-notify { };  // Add secondary server IPs');
  lines.push('');

  // Rate limiting
  if (options?.ratelimit) {
    lines.push('  rate-limit {');
    lines.push('    responses-per-second 5;');
    lines.push('    window 5;');
    lines.push('  };');
    lines.push('');
  }

  // Logging
  if (options?.logging === 'verbose') {
    lines.push('  log-queries yes;');
  }

  lines.push('};');
  lines.push('');

  // Zone definitions
  if (zones && zones.length > 0) {
    lines.push('// Zone definitions');
    zones.forEach((zone) => {
      lines.push(`zone "${zone}" {`);
      if (role === 'authoritative' || role === 'both') {
        lines.push(`  type master;`);
        lines.push(`  file "/etc/bind/zones/db.${zone}";`);
      } else {
        lines.push(`  type slave;`);
        lines.push(`  masters { <primary_ip>; };`);
        lines.push(`  file "/var/cache/bind/db.${zone}";`);
      }
      lines.push('};');
    });
  }

  return lines.join('\n');
}

function generateNsdConfig(
  role: string,
  zones?: string[],
  options?: ConfigOptions
): string {
  const lines: string[] = [];

  lines.push('# NSD Configuration File');
  lines.push('# Generated configuration - customize as needed');
  lines.push('');

  lines.push('server:');
  lines.push('  # Server identity');
  lines.push('  identity "NSD"');
  lines.push('  version "NSD"');
  lines.push('');

  lines.push('  # Listening interfaces');
  lines.push('  ip-address: 127.0.0.1');
  lines.push('  ip-address: ::1');
  lines.push('');

  lines.push('  # Port');
  lines.push('  port: 53');
  lines.push('');

  if (role === 'authoritative' || role === 'both') {
    lines.push('  # Authoritative server configuration');
    lines.push('  hide-version: yes');
  }

  lines.push('');

  if (options?.logging === 'verbose') {
    lines.push('  log-time-ascii: yes');
  }

  lines.push('');

  // Zone definitions
  if (zones && zones.length > 0) {
    lines.push('zone:');
    zones.forEach((zone) => {
      lines.push(`  name: ${zone}`);
      lines.push(`  zonefile: "/etc/nsd/${zone}.zone"`);
      lines.push(`  notify: <secondary_ip> NOKEY`);
      lines.push(`  provide-xfr: <secondary_ip> NOKEY`);
    });
  }

  return lines.join('\n');
}

function generateUnboundConfig(
  role: string,
  zones?: string[],
  options?: ConfigOptions
): string {
  const lines: string[] = [];

  lines.push('# Unbound Configuration File');
  lines.push('# Generated configuration - customize as needed');
  lines.push('');

  lines.push('server:');
  lines.push('  # Network interfaces');
  lines.push('  interface: 127.0.0.1');
  lines.push('  interface: ::1');
  lines.push('  port: 53');
  lines.push('');

  if (role === 'recursive' || role === 'both') {
    lines.push('  # Recursive resolver');
    lines.push('  access-control: 127.0.0.0/8 allow');
    lines.push('  access-control: ::1/128 allow');
    lines.push('  access-control: 0.0.0.0/0 deny');
    lines.push('');
  }

  lines.push('  # Performance');
  lines.push('  num-threads: 2');
  lines.push('  msg-buffer-size: 65552');
  lines.push('  msg-cache-size: 4m');
  lines.push('  rrset-cache-size: 8m');
  lines.push('');

  if (options?.dnssec) {
    lines.push('  # DNSSEC');
    lines.push('  dnssec-validation: auto');
    lines.push('  root-hints: "/usr/share/dns/root.hints"');
    lines.push('');
  }

  lines.push('  # Logging');
  if (options?.logging === 'verbose') {
    lines.push('  verbosity: 2');
  } else if (options?.logging === 'minimal') {
    lines.push('  verbosity: 0');
  } else {
    lines.push('  verbosity: 1');
  }

  lines.push('');

  if (options?.ratelimit) {
    lines.push('  # Rate limiting');
    lines.push('  ratelimit: 1000');
    lines.push('');
  }

  // Forward zones
  if (zones && zones.length > 0 && role !== 'authoritative') {
    lines.push('forward-zone:');
    lines.push('  name: "."');
    lines.push('  forward-addr: 8.8.8.8');
    lines.push('  forward-addr: 8.8.4.4');
    lines.push('');

    zones.forEach((zone) => {
      lines.push('forward-zone:');
      lines.push(`  name: "${zone}"`);
      lines.push('  forward-addr: 127.0.0.1@53');
    });
  }

  return lines.join('\n');
}

function generatePowerDnsConfig(
  role: string,
  zones?: string[],
  options?: ConfigOptions
): string {
  const lines: string[] = [];

  lines.push('# PowerDNS Configuration');
  lines.push('# Generated configuration - customize as needed');
  lines.push('');

  lines.push('# Server');
  lines.push('daemon=yes');
  lines.push('guardian=yes');
  lines.push('local-port=5300');
  lines.push('local-address=127.0.0.1');
  lines.push('');

  lines.push('# Logging');
  if (options?.logging === 'verbose') {
    lines.push('loglevel=6');
  } else if (options?.logging === 'minimal') {
    lines.push('loglevel=3');
  } else {
    lines.push('loglevel=4');
  }

  lines.push('');

  if (role === 'authoritative' || role === 'both') {
    lines.push('# Authoritative server');
    lines.push('master=yes');
    lines.push('slave=no');
    lines.push('');
  } else {
    lines.push('# Recursive server');
    lines.push('master=no');
    lines.push('slave=no');
    lines.push('recursor=127.0.0.1:5301');
    lines.push('');
  }

  lines.push('# Backend');
  lines.push('launch=bind');
  lines.push('bind-config=/etc/powerdns/bind.conf');
  lines.push('');

  if (options?.dnssec) {
    lines.push('# DNSSEC');
    lines.push('dnssec=yes');
    lines.push('');
  }

  if (options?.ratelimit) {
    lines.push('# Rate limiting');
    lines.push('out-of-zone-additional-processing=no');
    lines.push('');
  }

  lines.push('# API');
  lines.push('api=yes');
  lines.push('api-key=changeme');
  lines.push('api-readonly=no');

  return lines.join('\n');
}

export function generateZoneFile(
  zoneName: string,
  primaryNs: string = 'ns1.example.com',
  adminEmail: string = 'admin.example.com',
  options?: ConfigOptions
): string {
  const lines: string[] = [];
  const serial = Math.floor(Date.now() / 1000);

  lines.push(`; Zone file for ${zoneName}`);
  lines.push(`; Generated: ${new Date().toISOString()}`);
  lines.push('');

  lines.push(`$ORIGIN ${zoneName}.`);
  lines.push('$TTL 3600');
  lines.push('');

  // SOA record
  lines.push('; SOA record');
  lines.push(`@  IN  SOA  ${primaryNs}. ${adminEmail}. (`);
  lines.push(`           ${serial}  ; Serial`);
  lines.push('           3600     ; Refresh');
  lines.push('           1800     ; Retry');
  lines.push('           604800   ; Expire');
  lines.push('           300 )    ; Minimum TTL');
  lines.push('');

  // NS records
  lines.push('; NS records');
  lines.push(`@  IN  NS  ${primaryNs}.`);
  lines.push('@  IN  NS  ns2.example.com.');
  lines.push('');

  // A records
  lines.push('; A records');
  lines.push('@           IN  A      192.0.2.1');
  lines.push('www         IN  A      192.0.2.1');
  lines.push('mail        IN  A      192.0.2.2');
  lines.push('');

  // MX records
  lines.push('; MX records');
  lines.push('@           IN  MX  10 mail.example.com.');
  lines.push('');

  // CNAME records
  lines.push('; CNAME records');
  lines.push('alias       IN  CNAME  www');
  lines.push('');

  // CAA records
  lines.push('; CAA records');
  lines.push('@           IN  CAA  0 issue "letsencrypt.org"');
  lines.push('');

  // TXT/SPF records
  lines.push('; TXT/SPF records');
  lines.push('@           IN  TXT  "v=spf1 mx -all"');
  lines.push('_dmarc      IN  TXT  "v=DMARC1; p=none;"');
  lines.push('');

  // Optional: DNSSEC records
  if (options?.dnssec) {
    lines.push('; DNSSEC records (would be added by DNSSEC signing)');
    lines.push('; DNSKEY, DS, RRSIG records would appear here');
    lines.push('');
  }

  lines.push(`; End of zone file for ${zoneName}`);

  return lines.join('\n');
}
