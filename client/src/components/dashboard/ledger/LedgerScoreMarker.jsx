import React from 'react';

/**
 * LedgerScoreMarker — Editorial Health Index replacing generic circular progress rings.
 * Features large numerical typography, a precision tiered calibration rule, and a clear disclaimer.
 */
export const LedgerScoreMarker = ({ score }) => {
  // Clamp score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));

  const getTierLabel = () => {
    if (normalizedScore >= 80) return { label: 'VERIFIED TIER', color: '#2E7D5B' };
    if (normalizedScore >= 50) return { label: 'CAUTION TIER', color: '#B45309' };
    return { label: 'CRITICAL TIER', color: '#D94E4E' };
  };

  const tier = getTierLabel();

  return (
    <div className="ledger-score-widget" aria-label="Technical Health Score">
      <div className="score-widget-top">
        <span className="score-widget-label font-mono">TECHNICAL HEALTH INDEX</span>
        <span className="score-tier-badge font-mono" style={{ color: tier.color }}>
          {tier.label}
        </span>
      </div>

      {/* Large Numerical Typography */}
      <div className="score-numerical-row">
        <span className="score-big-number font-mono">{normalizedScore}</span>
        <div className="score-denom-group">
          <span className="score-denom font-mono">/100</span>
          <span className="score-denom-caption">Signal Rating</span>
        </div>
      </div>

      {/* Precision Calibration Rule */}
      <div className="score-calibration-container">
        <div className="score-calibration-bar">
          <div className="calib-zone calib-critical" title="0-49: Critical Risk" />
          <div className="calib-zone calib-caution" title="50-79: Caution" />
          <div className="calib-zone calib-verified" title="80-100: Verified" />

          {/* Indicator Marker */}
          <div 
            className="score-marker-pin"
            style={{ left: `${normalizedScore}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Ticks & Labels */}
        <div className="score-ticks-row font-mono">
          <span>0</span>
          <span>50</span>
          <span>80</span>
          <span>100</span>
        </div>
      </div>

      {/* Technical Disclaimer Note */}
      <p className="score-disclaimer-note">
        Evaluated strictly against technical signals and protocol responses. A high score does not guarantee commercial legitimacy.
      </p>
    </div>
  );
};

export default LedgerScoreMarker;
