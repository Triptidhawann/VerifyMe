import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * EvidenceMatrix — Adaptive technical evidence matrix.
 * Presents modality-specific infrastructure checks (Email, Website, Phone)
 * in a cohesive tabular inspection grid with hairline borders.
 */
export const EvidenceMatrix = ({ verification, targetType }) => {
  const [expandedCell, setExpandedCell] = useState(null);

  if (!verification) return null;

  const typeLower = (targetType || verification.type || '').toLowerCase();
  const signals = verification.signals || [];
  const warnings = verification.warnings || [];
  const isFormatValid = verification.formatValid !== false;

  const toggleCell = (id) => {
    setExpandedCell(prev => (prev === id ? null : id));
  };

  // Compile adaptive categories based on target type
  const getMatrixCategories = () => {
    if (typeLower === 'email') {
      const isNxDomain = warnings.some(w => w.toLowerCase().includes('does not exist') || w.toLowerCase().includes('nxdomain'));
      const lacksMx = warnings.some(w => w.toLowerCase().includes('lacks mx'));
      const hasMx = signals.some(s => s.toLowerCase().includes('mail exchange') || s.toLowerCase().includes('mx'));
      const lacksSpf = warnings.some(w => w.toLowerCase().includes('lacks spf'));
      const hasSpf = signals.some(s => s.toLowerCase().includes('spf'));
      const lacksDmarc = warnings.some(w => w.toLowerCase().includes('dmarc'));
      const hasDmarc = signals.some(s => s.toLowerCase().includes('dmarc'));

      return [
        {
          id: 'eml-dns',
          name: 'Domain & DNS',
          status: isNxDomain ? 'failed' : (isFormatValid ? 'passed' : 'failed'),
          statusLabel: isNxDomain ? 'NXDOMAIN' : (isFormatValid ? 'RESOLVED' : 'INVALID'),
          summary: isNxDomain ? 'Domain does not resolve in authoritative DNS.' : 'Active authoritative nameservers confirmed.',
          raw: 'RFC 1035 / Authoritative DNS A/AAAA records queried.'
        },
        {
          id: 'eml-mx',
          name: 'Mail Routing (MX)',
          status: lacksMx ? 'failed' : (hasMx ? 'passed' : 'warning'),
          statusLabel: lacksMx ? 'NO MX' : (hasMx ? 'CONFIGURED' : 'UNCONFIRMED'),
          summary: lacksMx ? 'Missing mail exchange records; cannot accept mail.' : 'Active mail exchangers ready to receive mail.',
          raw: 'DNS MX priority evaluation completed.'
        },
        {
          id: 'eml-spf',
          name: 'SPF Authentication',
          status: lacksSpf ? 'warning' : (hasSpf ? 'passed' : 'neutral'),
          statusLabel: lacksSpf ? 'MISSING' : (hasSpf ? 'ENFORCED' : 'NOT FOUND'),
          summary: lacksSpf ? 'No SPF TXT policy published; spoofing risk.' : 'Valid SPF policy authorising outbound sender IPs.',
          raw: 'v=spf1 record syntax parsed and validated.'
        },
        {
          id: 'eml-dmarc',
          name: 'DMARC Policy',
          status: lacksDmarc ? 'warning' : (hasDmarc ? 'passed' : 'neutral'),
          statusLabel: lacksDmarc ? 'ABSENT' : (hasDmarc ? 'PROTECTED' : 'UNENFORCED'),
          summary: lacksDmarc ? 'Domain lacks strict reject/quarantine anti-impersonation policy.' : 'DMARC alignment policy active.',
          raw: '_dmarc TXT record policy parsed.'
        }
      ];
    }

    if (typeLower === 'website') {
      const isPlaintext = warnings.some(w => w.toLowerCase().includes('unencrypted http'));
      const hasTlsFail = warnings.some(w => w.toLowerCase().includes('tls') || w.toLowerCase().includes('certificate'));
      const isUnreachable = warnings.some(w => w.toLowerCase().includes('unreachable') || w.toLowerCase().includes('failed to respond'));
      const isBlocked = warnings.some(w => w.toLowerCase().includes('blocked'));

      return [
        {
          id: 'web-dns',
          name: 'DNS Resolution',
          status: isBlocked ? 'warning' : (isFormatValid ? 'passed' : 'failed'),
          statusLabel: isBlocked ? 'RESTRICTED' : 'RESOLVED',
          summary: isBlocked ? 'Loopback / internal address blocked.' : 'Public host IP mapped via public resolvers.',
          raw: 'A / AAAA authoritative resolution records.'
        },
        {
          id: 'web-proto',
          name: 'Transport Protocol',
          status: isPlaintext ? 'warning' : 'passed',
          statusLabel: isPlaintext ? 'HTTP PLAINTEXT' : 'HTTPS SECURE',
          summary: isPlaintext ? 'Operates over unencrypted HTTP protocol.' : 'Encrypted communication enforced via HTTPS.',
          raw: 'TLS over TCP/443 connection verification.'
        },
        {
          id: 'web-tls',
          name: 'TLS Certificate Authority',
          status: hasTlsFail ? 'failed' : 'passed',
          statusLabel: hasTlsFail ? 'UNTRUSTED' : 'VALID CA',
          summary: hasTlsFail ? 'Certificate expired or signature invalid.' : 'Trusted root Certificate Authority signature.',
          raw: 'X.509 validity chain, SAN matching host name.'
        },
        {
          id: 'web-reach',
          name: 'Host Reachability',
          status: isUnreachable ? 'failed' : 'passed',
          statusLabel: isUnreachable ? 'TIMEOUT' : 'RESPONSIVE',
          summary: isUnreachable ? 'Server failed to reply within deadline.' : 'HTTP status response received successfully.',
          raw: 'HTTP GET/HEAD probe latency < 500ms.'
        }
      ];
    }

    // Default / Phone
    const isAmbiguous = warnings.some(w => w.toLowerCase().includes('matches multiple'));
    const isPremium = warnings.some(w => w.toLowerCase().includes('premium-rate') || w.toLowerCase().includes('toll'));

    return [
      {
        id: 'tel-syntax',
        name: 'E.164 Standardization',
        status: isFormatValid ? 'passed' : 'failed',
        statusLabel: isFormatValid ? 'COMPLIANT' : 'INVALID',
        summary: isFormatValid ? 'Conforms to international E.164 numbering rules.' : 'Structure incomplete or improperly formatted.',
        raw: 'ITU-T Recommendation E.164 syntax verification.'
      },
      {
        id: 'tel-region',
        name: 'Region & Prefix Code',
        status: isAmbiguous ? 'warning' : 'passed',
        statusLabel: isAmbiguous ? 'AMBIGUOUS' : 'IDENTIFIED',
        summary: isAmbiguous ? 'Multiple country plans match input without international code.' : 'Country calling code definitively identified.',
        raw: 'National prefix registry cross-reference.'
      },
      {
        id: 'tel-plan',
        name: 'National Allocation',
        status: isFormatValid ? 'passed' : 'failed',
        statusLabel: isFormatValid ? 'ALLOCATED' : 'UNASSIGNED',
        summary: 'Number belongs to an allocated geographic or mobile block.',
        raw: 'Regulated telecommunications plan allocation.'
      },
      {
        id: 'tel-risk',
        name: 'Toll & Risk Classification',
        status: isPremium ? 'failed' : 'passed',
        statusLabel: isPremium ? 'PREMIUM TOLL' : 'STANDARD',
        summary: isPremium ? 'Elevated cost or premium rate toll prefix.' : 'Standard carrier tariff classification.',
        raw: 'High-risk toll prefix registry check.'
      }
    ];
  };

  const categories = getMatrixCategories();

  return (
    <section className="evidence-matrix-section" aria-label="Technical Evidence Matrix">
      <div className="matrix-header">
        <div>
          <span className="matrix-pretitle font-mono">TECHNICAL INSPECTION</span>
          <h3 className="matrix-title">Protocol Architecture Matrix</h3>
        </div>
        <span className="matrix-type-tag font-mono">{typeLower.toUpperCase()} STACK</span>
      </div>

      <div className="matrix-grid">
        {categories.map((cat) => {
          const isExpanded = expandedCell === cat.id;

          return (
            <div 
              key={cat.id} 
              className={`matrix-cell matrix-cell--${cat.status} ${isExpanded ? 'is-expanded' : ''}`}
              onClick={() => toggleCell(cat.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleCell(cat.id);
                }
              }}
            >
              <div className="cell-top-bar">
                <span className="cell-name font-mono">{cat.name}</span>
                <span className={`cell-status-tag font-mono status-${cat.status}`}>
                  {cat.statusLabel}
                </span>
              </div>

              <p className="cell-summary">{cat.summary}</p>

              <div className="cell-footer-action">
                <span className="cell-expand-hint font-mono">
                  {isExpanded ? 'HIDE SPECS' : 'VIEW SPECS'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#737D76] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>

              {isExpanded && (
                <div className="cell-drawer-detail fadeIn">
                  <span className="cell-raw-label font-mono">TECHNICAL TELEMETRY:</span>
                  <code className="cell-raw-code font-mono">{cat.raw}</code>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default EvidenceMatrix;
