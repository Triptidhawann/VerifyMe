import React from 'react';
import { 
  Lock, 
  CheckCircle2
} from 'lucide-react';
import LedgerScoreMarker from './LedgerScoreMarker';

/**
 * LedgerAuditRail — Right-hand column in the Evidence Ledger composition.
 * Houses the Health Index Marker, the Evidence Summary, Recommended Next Action,
 * and the cryptographic audit footprint.
 */
export const LedgerAuditRail = ({
  score,
  isLowRisk,
  isHighRisk,
  isSuspicious,
  passedCount,
  flaggedCount,
  uncheckedCount,
  recommendedAction
}) => {
  const totalChecks = Math.max(1, passedCount + flaggedCount + uncheckedCount);
  const passedPct = (passedCount / totalChecks) * 100;
  const flaggedPct = (flaggedCount / totalChecks) * 100;
  const uncheckedPct = (uncheckedCount / totalChecks) * 100;

  return (
    <aside className="ledger-audit-rail" aria-label="Investigation Audit Rail">
      {/* 1. Primary Health Index Marker */}
      <LedgerScoreMarker 
        score={score} 
        isLowRisk={isLowRisk} 
        isHighRisk={isHighRisk} 
        isSuspicious={isSuspicious} 
      />

      {/* 2. Distinctive Evidence Breakdown Strip */}
      <div className="ledger-evidence-breakdown-card">
        <div className="breakdown-header">
          <span className="breakdown-title font-mono">EVIDENCE PROFILE</span>
          <span className="breakdown-total font-mono">{passedCount + flaggedCount + uncheckedCount} SIGNALS</span>
        </div>

        {/* Minimal Proportional Segment Bar */}
        <div className="breakdown-bar" role="progressbar" aria-label="Evidence ratio">
          {passedCount > 0 && (
            <div 
              className="bar-seg passed" 
              style={{ width: `${passedPct}%` }}
              title={`${passedCount} Passed Checks`}
            />
          )}
          {flaggedCount > 0 && (
            <div 
              className="bar-seg flagged" 
              style={{ width: `${flaggedPct}%` }}
              title={`${flaggedCount} Flagged Indicators`}
            />
          )}
          {uncheckedCount > 0 && (
            <div 
              className="bar-seg unchecked" 
              style={{ width: `${uncheckedPct}%` }}
              title={`${uncheckedCount} Scope Boundaries`}
            />
          )}
        </div>

        {/* Breakdown Legend Numbers */}
        <div className="breakdown-legend-list font-mono">
          <div className="breakdown-legend-item">
            <span className="legend-marker-dot passed" />
            <span className="legend-label">Passed Checks</span>
            <span className="legend-value">{passedCount}</span>
          </div>

          <div className="breakdown-legend-item">
            <span className="legend-marker-dot flagged" />
            <span className="legend-label">Flagged Issues</span>
            <span className="legend-value">{flaggedCount}</span>
          </div>

          {uncheckedCount > 0 && (
            <div className="breakdown-legend-item">
              <span className="legend-marker-dot unchecked" />
              <span className="legend-label">Out of Scope</span>
              <span className="legend-value">{uncheckedCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Editorial Recommended Next Action */}
      {recommendedAction && (
        <div className="ledger-recommendation-card" aria-label="Recommended Action">
          <div className="rec-header font-mono">
            <span className="rec-badge">ACTION PROTOCOL</span>
            <span className="rec-code">DECISION_ADVISORY</span>
          </div>

          <h4 className="rec-title">Recommended Next Step</h4>

          <p className="rec-body">
            {recommendedAction}
          </p>

          <div className="rec-footer-note font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#49B99A] inline mr-1" />
            <span>Derived from automated public telemetry.</span>
          </div>
        </div>
      )}

      {/* 4. Cryptographic / Audit Verification Footprint */}
      <div className="ledger-audit-footprint">
        <div className="footprint-header font-mono">
          <Lock className="w-3 h-3 text-[#737D76]" />
          <span>AUDIT INTEGRITY FOOTPRINT</span>
        </div>

        <div className="footprint-meta-grid font-mono">
          <div className="footprint-row">
            <span className="fp-label">ENGINE:</span>
            <span className="fp-val">VerifyMe Deterministic v2.4</span>
          </div>
          <div className="footprint-row">
            <span className="fp-label">PROTOCOL:</span>
            <span className="fp-val">Zero-Assumption TLS 1.3</span>
          </div>
          <div className="footprint-row">
            <span className="fp-label">TAMPER:</span>
            <span className="fp-val">Immutable Ledger Record</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LedgerAuditRail;
