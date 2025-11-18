import { bindKnowledge } from './bind.js';
import { nsdKnowledge } from './nsd.js';
import { unboundKnowledge } from './unbound.js';
import { djbdnsKnowledge } from './djbdns.js';
import { powerdnsKnowledge } from './powerdns.js';
import { digKnowledge } from './dig.js';
import { registrarKnowledge } from './registrars.js';
import { dnssecKnowledge } from './dnssec.js';
import { troubleshootingKnowledge } from './troubleshooting-fixed.js';
import { dnsRecordsKnowledge } from './dns-records.js';
import { daneTlsaKnowledge } from './dane-tlsa.js';
import { opensslCertsKnowledge } from './openssl-certs.js';

export function getDnsKnowledge(topic: string): string | null {
  const knowledgeBase: Record<string, string> = {
    bind: bindKnowledge,
    nsd: nsdKnowledge,
    unbound: unboundKnowledge,
    djbdns: djbdnsKnowledge,
    powerdns: powerdnsKnowledge,
    dig: digKnowledge,
    registrars: registrarKnowledge,
    dnssec: dnssecKnowledge,
    troubleshooting: troubleshootingKnowledge,
    'dns-records': dnsRecordsKnowledge,
    'dane-tlsa': daneTlsaKnowledge,
    'openssl-certs': opensslCertsKnowledge,
  };

  return knowledgeBase[topic] || null;
}
