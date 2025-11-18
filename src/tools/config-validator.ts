interface ValidationResult {
  serverType: string;
  isValid: boolean;
  syntaxErrors: string[];
  securityIssues: string[];
  deprecatedOptions: string[];
  suggestions: string[];
  sections: { [key: string]: string[] };
}

export function validateDnsConfig(serverType: string, configContent: string): string {
  const result: ValidationResult = {
    serverType: serverType.toLowerCase(),
    isValid: true,
    syntaxErrors: [],
    securityIssues: [],
    deprecatedOptions: [],
    suggestions: [],
    sections: {},
  };

  try {
    switch (result.serverType) {
      case 'bind':
        validateBindConfig(configContent, result);
        break;
      case 'nsd':
        validateNsdConfig(configContent, result);
        break;
      case 'unbound':
        validateUnboundConfig(configContent, result);
        break;
      case 'powerdns':
        validatePowerDnsConfig(configContent, result);
        break;
      case 'djbdns':
        validateDjbDnsConfig(configContent, result);
        break;
      default:
        return `Error: Unknown server type '${serverType}'. Supported types: bind, nsd, unbound, powerdns, djbdns`;
    }

    return formatValidationOutput(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error validating config: ${errorMessage}`;
  }
}

function validateBindConfig(content: string, result: ValidationResult): void {
  const lines = content.split('\n');
  let braceCount = 0;
  let currentSection = '';
  const configuredZones: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('//') || line.startsWith('#')) continue;

    // Track braces
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;

    // Check for required statements
    if (line.startsWith('options')) {
      currentSection = 'options';
      if (!result.sections['options']) result.sections['options'] = [];
      result.sections['options'].push(line);
    } else if (line.startsWith('zone')) {
      const match = line.match(/zone\s+"([^"]+)"/);
      if (match) configuredZones.push(match[1]);
    } else if (line.startsWith('logging')) {
      currentSection = 'logging';
    }

    // Check for deprecated options
    if (line.includes('rrset-order')) {
      result.deprecatedOptions.push('rrset-order - deprecated in BIND 9.9+');
    }
    if (line.includes('slave')) {
      result.deprecatedOptions.push('slave keyword - use secondary instead');
    }

    // Security checks
    if (line.includes('allow-transfer') && line.includes('any')) {
      result.securityIssues.push('allow-transfer set to any - restricts zone transfers for security');
    }
    if (line.includes('recursion') && line.includes('yes') && !line.includes('allow-recursion')) {
      result.securityIssues.push('recursion enabled without allow-recursion restriction - can lead to open resolver attacks');
    }
    if (line.includes('allow-query') && line.includes('any')) {
      result.securityIssues.push('allow-query set to any - consider restricting query sources');
    }
    if (line.includes('dnssec-validation') && line.includes('no')) {
      result.suggestions.push('DNSSEC validation is disabled - enable for better security');
    }
  }

  // Check brace balance
  if (braceCount !== 0) {
    result.syntaxErrors.push(`Unbalanced braces: ${braceCount > 0 ? 'missing closing braces' : 'missing opening braces'}`);
    result.isValid = false;
  }

  // Check for required sections
  if (!result.sections['options'] || result.sections['options'].length === 0) {
    result.suggestions.push('No options section found - add options block for configuration');
  }

  if (configuredZones.length === 0) {
    result.suggestions.push('No zones configured - add zone statements for your domains');
  }

  // Add security suggestions
  if (!content.includes('dnssec-enable')) {
    result.suggestions.push('DNSSEC not enabled - consider enabling for security');
  }

  result.suggestions.push('Consider using BIND 9.18+ for latest security fixes');
}

function validateNsdConfig(content: string, result: ValidationResult): void {
  const lines = content.split('\n');
  let inServerSection = false;
  let inZoneSection = false;
  const configuredZones: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;

    // Track sections
    if (trimmed === 'server:') {
      inServerSection = true;
      inZoneSection = false;
    } else if (trimmed === 'zone:') {
      inZoneSection = true;
      inServerSection = false;
    }

    // Check for required options
    if (inServerSection) {
      if (trimmed.startsWith('ip-address:')) {
        if (!result.sections['server']) result.sections['server'] = [];
        result.sections['server'].push(trimmed);
      }
    }

    if (inZoneSection) {
      if (trimmed.startsWith('name:')) {
        const match = trimmed.match(/name:\s*([^\s]+)/);
        if (match) configuredZones.push(match[1]);
      }
    }

    // Security checks
    if (trimmed.includes('provide-xfr') && trimmed.includes('0.0.0.0/0')) {
      result.securityIssues.push('Zone transfer allowed from any host - restrict to your secondaries');
    }

    if (trimmed.includes('allow-notify') && trimmed.includes('0.0.0.0/0')) {
      result.securityIssues.push('NOTIFY allowed from any host - restrict to your primaries');
    }

    // Check for deprecated options (NSD-specific)
    if (trimmed.includes('tcp:')) {
      result.deprecatedOptions.push('tcp option - NSD now auto-enables TCP');
    }
  }

  if (configuredZones.length === 0) {
    result.suggestions.push('No zones configured - add zone sections');
  }

  result.suggestions.push('Ensure zonefiles exist at configured paths');
}

function validateUnboundConfig(content: string, result: ValidationResult): void {
  const lines = content.split('\n');
  const sections = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;

    // Extract section names
    const sectionMatch = trimmed.match(/^(\w+):/);
    if (sectionMatch) {
      sections.add(sectionMatch[1]);
    }

    // Security checks
    if (trimmed.includes('interface:') && trimmed.includes('0.0.0.0')) {
      if (!result.sections['interface']) result.sections['interface'] = [];
      result.sections['interface'].push(trimmed);
    }

    if (trimmed.includes('access-control') && trimmed.includes('allow')) {
      if (trimmed.includes('0.0.0.0/0')) {
        result.securityIssues.push('access-control allows from 0.0.0.0/0 - publicly accessible');
      }
    }

    if (trimmed.includes('edns-buffer-size') && trimmed.includes('512')) {
      result.suggestions.push('EDNS buffer size set to 512 - consider increasing to 1280+ for DNSSEC');
    }

    // Check for DNSSEC settings
    if (trimmed.includes('dnssec-validation:') && trimmed.includes('no')) {
      result.suggestions.push('DNSSEC validation disabled - enable for security');
    }

    // Check for rate limiting
    if (!content.includes('ratelimit')) {
      result.suggestions.push('No rate limiting configured - consider adding rate-limit');
    }
  }

  // Check for required sections
  if (!sections.has('server')) {
    result.syntaxErrors.push('Missing server: section');
    result.isValid = false;
  }

  if (!sections.has('forward-zone') && !sections.has('stub-zone')) {
    result.suggestions.push('No forward-zone or stub-zone configured');
  }

  result.suggestions.push('Ensure log-file has appropriate permissions (usually Unbound runs as unbound user)');
}

function validatePowerDnsConfig(content: string, result: ValidationResult): void {
  const lines = content.split('\n');
  const configuredZones: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;

    // Extract configuration options
    const optMatch = trimmed.match(/^([a-z0-9-]+)=(.+)$/i);
    if (optMatch) {
      const [, key, value] = optMatch;

      if (key === 'zone') {
        configuredZones.push(value);
      }

      // Security checks
      if (key === 'allow-recursion' && value.includes('0.0.0.0/0')) {
        result.securityIssues.push('Recursion allowed from any source - restrict this');
      }

      if (key === 'allow-axfr-ips' && (value.includes('0.0.0.0/0') || value === '0.0.0.0/0')) {
        result.securityIssues.push('Zone transfers allowed from any IP - restrict to your secondaries');
      }

      if (key === 'api' && value.includes('yes')) {
        if (!content.includes('api-key')) {
          result.securityIssues.push('API enabled without api-key - add api-key for security');
        }
      }

      if (!result.sections[key]) {
        result.sections[key] = [];
      }
      result.sections[key].push(`${key}=${value}`);
    }

    // Check for deprecated options
    if (trimmed.startsWith('launch=')) {
      if (trimmed.includes('gmysql')) {
        result.suggestions.push('gmysql backend - ensure MySQL/MariaDB backend is properly configured');
      }
    }
  }

  if (configuredZones.length === 0) {
    result.suggestions.push('No zones configured - add zone= entries or use database backend');
  }

  if (!content.includes('api=')) {
    result.suggestions.push('API not configured - enable for easier zone management');
  }

  result.suggestions.push('Ensure database backend is properly initialized and accessible');
}

function validateDjbDnsConfig(content: string, result: ValidationResult): void {
  // DJBDNS uses a different configuration format (tinydns data format)
  const lines = content.split('\n');
  let recordCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Count records
    if (trimmed.match(/^[.+&|%^@=]/)) {
      recordCount++;
      const recordType = trimmed.charAt(0);

      // Validate record format based on first character
      switch (recordType) {
        case '.':
          // NS record format: .fqdn:ip:x:ttl:timestamp:loc
          if (!trimmed.includes(':')) {
            result.syntaxErrors.push(`Invalid NS record format: ${trimmed.substring(0, 50)}`);
            result.isValid = false;
          }
          break;
        case '+':
          // A record format: +fqdn:ip:ttl:timestamp:loc
          if (!trimmed.match(/^\+[^:]+:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
            result.suggestions.push(`A record may have invalid format: ${trimmed.substring(0, 50)}`);
          }
          break;
        case '@':
          // MX record format: @fqdn:ip:mx:ttl:timestamp:loc
          if (!trimmed.includes(':')) {
            result.syntaxErrors.push(`Invalid MX record format: ${trimmed.substring(0, 50)}`);
            result.isValid = false;
          }
          break;
      }
    }
  }

  if (recordCount === 0) {
    result.syntaxErrors.push('No DNS records found in tinydns data file');
    result.isValid = false;
  }

  result.suggestions.push('Ensure tinydns data file is compiled with tinydns-data before use');
  result.suggestions.push('Test with dnstracesoa to verify zone data');
}

function formatValidationOutput(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push(`=== ${result.serverType.toUpperCase()} Configuration Validation ===`);
  lines.push('');

  if (result.isValid) {
    lines.push('Status: VALID');
  } else {
    lines.push('Status: INVALID');
  }
  lines.push('');

  if (result.syntaxErrors.length > 0) {
    lines.push('SYNTAX ERRORS:');
    result.syntaxErrors.forEach((err) => lines.push(`  - ${err}`));
    lines.push('');
  }

  if (result.securityIssues.length > 0) {
    lines.push('SECURITY ISSUES:');
    result.securityIssues.forEach((issue) => lines.push(`  - ${issue}`));
    lines.push('');
  }

  if (result.deprecatedOptions.length > 0) {
    lines.push('DEPRECATED OPTIONS:');
    result.deprecatedOptions.forEach((opt) => lines.push(`  - ${opt}`));
    lines.push('');
  }

  if (result.suggestions.length > 0) {
    lines.push('SUGGESTIONS:');
    result.suggestions.forEach((sugg) => lines.push(`  - ${sugg}`));
    lines.push('');
  }

  if (Object.keys(result.sections).length > 0) {
    lines.push('DETECTED SECTIONS:');
    Object.entries(result.sections).forEach(([section, items]) => {
      lines.push(`  ${section}: ${items.length} item(s)`);
    });
  }

  return lines.join('\n');
}
