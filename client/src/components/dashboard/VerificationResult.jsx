import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Activity, Database, Fingerprint } from 'lucide-react';
import './VerificationResult.css';

const VerificationResult = ({ result, onVerifyAnother }) => {
  if (!result) return null;

  const isLowRisk = result.riskLevel === 'LOW RISK';
  const isHighRisk = result.riskLevel === 'HIGH RISK';
  
  const StatusIcon = isLowRisk ? ShieldCheck : (isHighRisk ? ShieldAlert : Shield);
  const statusColor = isLowRisk ? 'var(--success-color, #10b981)' : (isHighRisk ? 'var(--danger-color, #ef4444)' : 'var(--warning-color, #f59e0b)');

  // Count metrics based on the result arrays
  const signalsAnalyzed = result.signals.length + result.warnings.length + 2; // +2 base deterministic rules
  const evidenceChecked = result.signals.length;
  const riskIndicators = result.warnings.length;

  return (
    <div className="result-container fadeIn">
      <div className="result-header-label">VERIFICATION RESULT</div>
      <div className="result-header">
        <div className="result-entity">
          <span className="entity-type">{result.type.toUpperCase()} TARGET</span>
          <span className="entity-value">{result.inputValue}</span>
        </div>
        
        <div className="result-score-badge" style={{ borderColor: statusColor, color: statusColor }}>
          <div className="score-main">
            <span className="score-value">{result.score}</span>
            <span className="score-max">/100</span>
          </div>
          <div className="risk-label">
            <StatusIcon size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
            {result.riskLevel}
          </div>
        </div>
      </div>

      {/* Intelligence Metrics Row */}
      <div className="intelligence-metrics">
        <div className="metric-box">
          <Activity size={16} />
          <div className="metric-data">
            <span className="metric-label">SIGNALS ANALYZED</span>
            <span className="metric-value">{signalsAnalyzed.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="metric-box">
          <Database size={16} />
          <div className="metric-data">
            <span className="metric-label">EVIDENCE CHECKED</span>
            <span className="metric-value">{evidenceChecked.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="metric-box" style={{ color: riskIndicators > 0 ? 'var(--warning)' : 'inherit' }}>
          <AlertCircle size={16} />
          <div className="metric-data">
            <span className="metric-label">RISK INDICATORS</span>
            <span className="metric-value">{riskIndicators.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="metric-box">
          <Fingerprint size={16} />
          <div className="metric-data">
            <span className="metric-label">CONFIDENCE</span>
            <span className="metric-value">
              {typeof result.confidence === 'number' ? `${result.confidence}%` : String(result.confidence || '0%').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="result-body">
        <div className="result-summary-panel">
          <h4>WHY THIS SCORE?</h4>
          {result.verdict && <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.05rem' }}>{result.verdict}</p>}
          {result.whyThisScore && <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>{result.whyThisScore}</p>}
          <p style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
          
          {result.recommendedAction && (
            <div className="recommended-action-box">
              <strong>Recommended Action</strong>
              <span>{result.recommendedAction}</span>
            </div>
          )}
        </div>

        <div className="result-panel full-width">
          <h4>ANALYSIS BREAKDOWN</h4>
          <div className="analysis-grid">
            {result.signals && result.signals.map((sig, i) => (
              <div className="analysis-item" key={`sig-${i}`}>
                <span className="analysis-key">Evidence Checked</span>
                <span className="analysis-val success"><CheckCircle2 size={14}/> PASS</span>
              </div>
            ))}
            {result.warnings && result.warnings.map((warn, i) => (
              <div className="analysis-item" key={`warn-${i}`}>
                <span className="analysis-key">Risk Indicator</span>
                <span className="analysis-val warning"><AlertCircle size={14}/> RISK</span>
              </div>
            ))}
            {result.limitations && result.limitations.map((lim, i) => (
              <div className="analysis-item" key={`lim-${i}`}>
                <span className="analysis-key">Limitation</span>
                <span className="analysis-val neutral">UNAVAILABLE</span>
              </div>
            ))}
          </div>
          <div className="analysis-disclaimer">
            The above analysis is based on available public signals and deterministic patterns. Absence of evidence does not guarantee absolute safety.
          </div>
        </div>
      </div>

      <div className="result-actions">
        <button className="btn btn-secondary" onClick={onVerifyAnother}>
          <RefreshCw size={16} /> New Investigation
        </button>
      </div>
    </div>
  );
};

export default VerificationResult;
