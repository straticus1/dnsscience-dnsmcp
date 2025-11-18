interface AnalysisResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  stats: {
    totalRecords: number;
    recordTypes: { [key: string]: number };
    soaCount: number;
    nsCount: number;
    ttlStats: { min: number; max: number; average: number };
  };
}

export function analyzeZoneFile(zoneContent: string, zoneName: string): string {
  const result: AnalysisResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    stats: {
      totalRecords: 0,
      recordTypes: {},
      soaCount: 0,
      nsCount: 0,
      ttlStats: { min: Infinity, max: 0, average: 0 },
    },
  };

  try {
    const lines = zoneContent.split('\n');
    const records: ZoneRecord[] = [];
    let ttlSum = 0;
    let ttlCount = 0;

    // Parse zone file
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip comments and empty lines
      if (!line || line.startsWith(';')) continue;

      // Check for multi-line records
      let recordLine = line;
      if (line.includes('(') && !line.includes(')')) {
        // Multi-line record
        let j = i + 1;
        while (j < lines.length && !lines[j].includes(')')) {
          recordLine += ' ' + lines[j].trim();
          j++;
        }
        if (j < lines.length) {
          recordLine += ' ' + lines[j].trim();
        }
      }

      // Remove parentheses for multi-line records
      recordLine = recordLine.replace(/[\(\)]/g, '');

      const record = parseZoneRecord(recordLine, zoneName);
      if (record) {
        records.push(record);
        result.stats.totalRecords++;

        // Track record types
        if (!result.stats.recordTypes[record.type]) {
          result.stats.recordTypes[record.type] = 0;
        }
        result.stats.recordTypes[record.type]++;

        // Track SOA and NS counts
        if (record.type === 'SOA') result.stats.soaCount++;
        if (record.type === 'NS') result.stats.nsCount++;

        // Track TTL statistics
        if (record.ttl !== undefined) {
          ttlSum += record.ttl;
          ttlCount++;
          result.stats.ttlStats.min = Math.min(result.stats.ttlStats.min, record.ttl);
          result.stats.ttlStats.max = Math.max(result.stats.ttlStats.max, record.ttl);
        }
      }
    }

    // Calculate average TTL
    if (ttlCount > 0) {
      result.stats.ttlStats.average = Math.round(ttlSum / ttlCount);
    } else {
      result.stats.ttlStats.min = 0;
    }

    // Validation checks
    validateZoneRecords(records, zoneName, result);

    // Format output
    return formatAnalysisOutput(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error analyzing zone file: ${errorMessage}`;
  }
}

interface ZoneRecord {
  name: string;
  ttl?: number;
  type: string;
  value: string;
  line: string;
}

function parseZoneRecord(line: string, zoneName: string): ZoneRecord | null {
  const parts = line.split(/\s+/);
  if (parts.length < 3) return null;

  let index = 0;
  let name = parts[index];
  let ttl: number | undefined;
  let type: string;
  let value: string;

  index++;

  // Check if next part is TTL (numeric)
  if (!isNaN(Number(parts[index]))) {
    ttl = parseInt(parts[index], 10);
    index++;
  }

  // Skip IN/CH/HS
  if (parts[index] && (parts[index] === 'IN' || parts[index] === 'CH' || parts[index] === 'HS')) {
    index++;
  }

  if (!parts[index]) return null;

  type = parts[index].toUpperCase();
  index++;

  value = parts.slice(index).join(' ');

  return {
    name,
    ttl,
    type,
    value,
    line,
  };
}

function validateZoneRecords(records: ZoneRecord[], zoneName: string, result: AnalysisResult): void {
  // Check for required SOA record
  if (result.stats.soaCount === 0) {
    result.errors.push('Missing SOA record - zone must have exactly one SOA record');
    result.isValid = false;
  } else if (result.stats.soaCount > 1) {
    result.errors.push(`Multiple SOA records found (${result.stats.soaCount}) - zone should have exactly one`);
    result.isValid = false;
  }

  // Check for required NS records
  if (result.stats.nsCount === 0) {
    result.errors.push('Missing NS records - zone must have at least one NS record at the zone apex');
    result.isValid = false;
  } else if (result.stats.nsCount < 2) {
    result.warnings.push('Only one NS record found - redundancy is recommended');
  }

  // Check for CNAME conflicts
  const cnameRecords = records.filter((r) => r.type === 'CNAME');
  const otherRecords = records.filter((r) => r.type !== 'CNAME');

  for (const cname of cnameRecords) {
    const conflicts = otherRecords.filter(
      (r) => r.name === cname.name && r.type !== 'CNAME'
    );
    if (conflicts.length > 0) {
      result.errors.push(
        `CNAME conflict at ${cname.name}: CNAME cannot coexist with other records`
      );
      result.isValid = false;
    }
  }

  // Check for invalid serial numbers in SOA
  const soaRecord = records.find((r) => r.type === 'SOA');
  if (soaRecord) {
    const soaParts = soaRecord.value.split(/\s+/);
    if (soaParts.length >= 3) {
      const serial = parseInt(soaParts[2], 10);
      if (isNaN(serial)) {
        result.errors.push('Invalid SOA serial number format');
        result.isValid = false;
      } else if (serial < 1 || serial > 4294967295) {
        result.warnings.push(`SOA serial ${serial} is outside recommended range (1-4294967295)`);
      }
    }
  }

  // Check for TTL issues
  if (result.stats.ttlStats.min === Infinity) {
    result.warnings.push('No explicit TTL values found - default TTL will be used');
  } else {
    if (result.stats.ttlStats.min === 0) {
      result.warnings.push('Zero TTL found - DNS entries will not be cached');
    }
    if (result.stats.ttlStats.max > 2592000) {
      result.warnings.push(`High TTL detected (${result.stats.ttlStats.max}s) - may slow down propagation of changes`);
    }
  }

  // Syntax validation
  for (const record of records) {
    if (!isValidRecordType(record.type)) {
      result.errors.push(`Invalid record type: ${record.type}`);
      result.isValid = false;
    }

    // Validate record-specific formats
    const validationError = validateRecordValue(record.type, record.value);
    if (validationError) {
      result.warnings.push(`${record.type} record validation: ${validationError}`);
    }
  }

  // Suggestions
  if (!records.some((r) => r.type === 'MX')) {
    result.suggestions.push('No MX records found - add MX records if this zone handles email');
  }

  if (!records.some((r) => r.type === 'AAAA')) {
    result.suggestions.push('No AAAA records found - consider adding IPv6 support');
  }

  if (!records.some((r) => r.type === 'CAA')) {
    result.suggestions.push('No CAA records found - add CAA records to restrict certificate issuance');
  }

  if (!records.some((r) => r.type === 'DNSKEY' || r.type === 'DS')) {
    result.suggestions.push('DNSSEC is not configured - consider enabling DNSSEC for security');
  }
}

function isValidRecordType(type: string): boolean {
  const validTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CNAME', 'PTR', 'SRV', 'CAA', 'TLSA', 'DNSKEY', 'DS', 'NSEC', 'NSEC3', 'RRSIG', 'SPF', 'AFSDB', 'DHCID', 'DLV'];
  return validTypes.includes(type);
}

function validateRecordValue(type: string, value: string): string | null {
  switch (type) {
    case 'A': {
      const ipMatch = /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
      return ipMatch ? null : 'Invalid IPv4 address format';
    }
    case 'AAAA': {
      const ipMatch = /^[0-9a-f:]+$/i.test(value);
      return ipMatch ? null : 'Invalid IPv6 address format';
    }
    case 'MX': {
      const parts = value.split(/\s+/);
      if (parts.length < 2) return 'MX record must have priority and exchange';
      return isNaN(Number(parts[0])) ? 'Invalid MX priority' : null;
    }
    case 'SOA': {
      const parts = value.split(/\s+/);
      if (parts.length < 7) return 'SOA record incomplete';
      return null;
    }
    default:
      return null;
  }
}

function formatAnalysisOutput(result: AnalysisResult): string {
  const lines: string[] = [];

  lines.push('=== DNS Zone File Analysis ===');
  lines.push('');

  if (result.isValid) {
    lines.push('Status: VALID');
  } else {
    lines.push('Status: INVALID');
  }
  lines.push('');

  if (result.errors.length > 0) {
    lines.push('ERRORS:');
    result.errors.forEach((err) => lines.push(`  - ${err}`));
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('WARNINGS:');
    result.warnings.forEach((warn) => lines.push(`  - ${warn}`));
    lines.push('');
  }

  if (result.suggestions.length > 0) {
    lines.push('SUGGESTIONS:');
    result.suggestions.forEach((sugg) => lines.push(`  - ${sugg}`));
    lines.push('');
  }

  lines.push('STATISTICS:');
  lines.push(`  Total Records: ${result.stats.totalRecords}`);
  lines.push(`  SOA Records: ${result.stats.soaCount}`);
  lines.push(`  NS Records: ${result.stats.nsCount}`);
  lines.push('');
  lines.push('Record Types:');
  Object.entries(result.stats.recordTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      lines.push(`    ${type}: ${count}`);
    });
  lines.push('');

  if (result.stats.ttlStats.min !== Infinity) {
    lines.push('TTL Statistics:');
    lines.push(`  Minimum: ${result.stats.ttlStats.min}s`);
    lines.push(`  Maximum: ${result.stats.ttlStats.max}s`);
    lines.push(`  Average: ${result.stats.ttlStats.average}s`);
  }

  return lines.join('\n');
}
