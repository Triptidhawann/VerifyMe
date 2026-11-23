import React from 'react';
import { 
  Share2, 
  Check, 
  RefreshCw, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck,
  Hash
} from 'lucide-react';

/**
 * LedgerHeader — Refined editorial document header for the Evidence Ledger.
 * Establishes identity through typography, compact metadata, and clean dividers.
 */
export const LedgerHeader = ({ 
  targetType, 
  targetValue, 
  createdAt, 
  reportId, 
  onVerifyAnother, 
  onShareReport,
  copied 
}) => {
  const typeLower = (targetType || '').toLowerCase();
  
  const getTypeMeta = () => {
    switch (typeLower) {
      case 'phone':
        return { label: 'TELECOM IDENTITY', icon: Phone, code: 'TEL' };
      case 'email':
        return { label: 'EMAIL ENTITY', icon: Mail, code: 'EML' };
      case 'website':
        return { label: 'WEB DOMAIN / URL', icon: Globe, code: 'DOM' };
      default:
        return { label: 'DIGITAL IDENTIFIER', icon: ShieldCheck, code: 'IDN' };
    }
  };

  const typeMeta = getTypeMeta();
  const TypeIcon = typeMeta.icon;

  const formattedDate = (() => {
    if (!createdAt) return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  })();

  const auditId = reportId 
    ? (reportId.length > 12 ? reportId.slice(0, 10).toUpperCase() : reportId.toUpperCase())
    : `AUD-${Math.abs(targetValue.split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000)).toString(16).toUpperCase()}`;

  return (
    <header className="ledger-doc-header">
      {/* Top Ledger Metadata Strip */}
      <div className="ledger-meta-strip">
        <div className="ledger-meta-item">
          <span className="ledger-meta-tag">INVESTIGATION RECORD</span>
          <span className="ledger-meta-dot">•</span>
          <span className="ledger-ref-code font-mono">
            <Hash className="w-3 h-3 inline mr-0.5" />
            {auditId}
          </span>
        </div>

        <div className="ledger-meta-item">
          <span className="ledger-meta-label">TIMESTAMP:</span>
          <time className="ledger-meta-val font-mono">{formattedDate}</time>
        </div>
      </div>

      {/* Main Document Title & Action Row */}
      <div className="ledger-title-row">
        <div className="ledger-target-group">
          <div className="ledger-type-badge">
            <TypeIcon className="w-3.5 h-3.5" />
            <span>{typeMeta.label}</span>
          </div>

          <h1 className="ledger-target-value font-mono" title={targetValue}>
            {targetValue}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="ledger-actions-group">
          <button 
            type="button" 
            className="ledger-btn ledger-btn--ghost"
            onClick={onShareReport}
            title="Copy audit summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#2E7D5B]" />
                <span className="text-[#2E7D5B]">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#737D76]" />
                <span>Share Audit</span>
              </>
            )}
          </button>

          <button 
            type="button" 
            className="ledger-btn ledger-btn--mint"
            onClick={onVerifyAnother}
            title="Start new investigation"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Check</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default LedgerHeader;
