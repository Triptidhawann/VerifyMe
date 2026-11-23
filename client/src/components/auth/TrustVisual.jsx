import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

/**
 * TrustVisual — A refined, lightweight vector visual depicting digital trust and verification.
 * Follows the Fresh Mint + White visual direction: light surfaces, subtle mint details,
 * uncluttered geometry, and zero dark photographic textures.
 */
export const TrustVisual = () => {
  return (
    <div className="trust-visual-wrapper" aria-hidden="true">
      {/* Background soft geometric detail */}
      <div className="trust-visual-bg-circle" />

      {/* Main Verification Card */}
      <div className="trust-card-primary">
        <div className="trust-card-header">
          <div className="trust-badge-icon-box">
            <ShieldCheck size={22} className="trust-badge-icon" />
          </div>
          <div className="trust-badge-text-group">
            <div className="trust-badge-title-row">
              <span className="trust-badge-title">Verification Protocol</span>
              <span className="trust-status-pill">Active</span>
            </div>
            <span className="trust-badge-subtitle">Autonomous Trust Engine</span>
          </div>
        </div>

        {/* Verification Checkpoints */}
        <div className="trust-checkpoints-list">
          <div className="trust-checkpoint-item completed">
            <span className="trust-checkpoint-icon">
              <Check size={12} strokeWidth={3} />
            </span>
            <span className="trust-checkpoint-label">Deterministic Identity Check</span>
            <span className="trust-checkpoint-tag">Pass</span>
          </div>

          <div className="trust-checkpoint-item completed">
            <span className="trust-checkpoint-icon">
              <Check size={12} strokeWidth={3} />
            </span>
            <span className="trust-checkpoint-label">Multi-Vector Opportunity Analysis</span>
            <span className="trust-checkpoint-tag">Verified</span>
          </div>

          <div className="trust-checkpoint-item completed">
            <span className="trust-checkpoint-icon">
              <Check size={12} strokeWidth={3} />
            </span>
            <span className="trust-checkpoint-label">Zero-Assumption Threat Detection</span>
            <span className="trust-checkpoint-tag">Protected</span>
          </div>
        </div>

        {/* Bottom Metrics Row */}
        <div className="trust-card-footer">
          <div className="trust-metric">
            <span className="trust-metric-val">99.9%</span>
            <span className="trust-metric-name">Precision Rate</span>
          </div>
          <div className="trust-metric-divider" />
          <div className="trust-metric">
            <span className="trust-metric-val">&lt; 150ms</span>
            <span className="trust-metric-name">Latency</span>
          </div>
          <div className="trust-metric-divider" />
          <div className="trust-metric">
            <span className="trust-metric-val">TLS 1.3</span>
            <span className="trust-metric-name">Encryption</span>
          </div>
        </div>
      </div>

      {/* Secondary Floating Trust Pill */}
      <div className="trust-floating-pill">
        <div className="trust-pill-dot" />
        <span className="trust-pill-text">Zero-trust architecture enabled</span>
      </div>
    </div>
  );
};

export default TrustVisual;
