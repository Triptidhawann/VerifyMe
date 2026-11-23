import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

/**
 * LedgerVerdict — Distinctive signature verdict component for the Evidence Ledger.
 * Uses asymmetric structure, bold editorial typography, and clear protocol status codes.
 */
export const LedgerVerdict = ({ 
  isLowRisk, 
  isTechnicalPass, 
  isHighRisk, 
  isSuspicious, 
  isInvalidInput,
  explanationText
}) => {
  // Determine verdict configuration
  const getVerdictConfig = () => {
    if (isInvalidInput) {
      return {
        statusText: 'MALFORMED_INPUT',
        code: 'PROTOCOL // REJECTED_SYNTAX',
        title: 'Input Structure Invalid',
        icon: AlertCircle,
        themeClass: 'verdict-invalid'
      };
    }
    if (isHighRisk) {
      return {
        statusText: 'HIGH_RISK_DETECTED',
        code: 'PROTOCOL // ELEVATED_SECURITY_RISK',
        title: 'Critical Risk Factors Flagged',
        icon: ShieldAlert,
        themeClass: 'verdict-threat'
      };
    }
    if (isSuspicious) {
      return {
        statusText: 'LIMITED_VERIFICATION',
        code: 'PROTOCOL // EXERCISE_CAUTION',
        title: 'Proceed with Caution',
        icon: AlertTriangle,
        themeClass: 'verdict-caution'
      };
    }
    if (isLowRisk || isTechnicalPass) {
      return {
        statusText: 'BASELINE_VERIFIED',
        code: 'PROTOCOL // CHECKS_PASSED',
        title: 'Technical Baseline Verified',
        icon: ShieldCheck,
        themeClass: 'verdict-passed'
      };
    }
    return {
      statusText: 'MODERATE_CONFIDENCE',
      code: 'PROTOCOL // STANDARD_AUDIT',
      title: 'Audit Complete with Observations',
      icon: Shield,
      themeClass: 'verdict-caution'
    };
  };

  const config = getVerdictConfig();
  const StatusIcon = config.icon;

  return (
    <section className={`ledger-verdict-box ${config.themeClass}`} aria-label="Investigation Primary Verdict">
      {/* Decorative vertical accent bar */}
      <div className="verdict-accent-rail" aria-hidden="true" />

      <div className="verdict-body-content">
        {/* Protocol Classification Tag */}
        <div className="verdict-tag-row">
          <div className="verdict-status-pill">
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono">{config.statusText}</span>
          </div>
          <span className="verdict-protocol-code font-mono">{config.code}</span>
        </div>

        {/* Primary Verdict Headline */}
        <h2 className="verdict-title">
          {config.title}
        </h2>

        {/* Narrative Explanation */}
        <p className="verdict-narrative">
          {explanationText}
        </p>

        {/* Subtext Context Disclaimer */}
        <div className="verdict-context-note">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#49B99A] shrink-0" />
          <span>Automated deterministic assessment based on public protocol signals.</span>
        </div>
      </div>
    </section>
  );
};

export default LedgerVerdict;
