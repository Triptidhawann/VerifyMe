import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Activity, Database, Fingerprint, Sparkles, Server } from 'lucide-react';
import './VerificationResult.css';

const VerificationResult = ({ result, onVerifyAnother }) => {
  if (!result) return null;

  // Use the new payload structure if available, otherwise fallback to root legacy fields
  const verification = result.verification || result;
  const analysis = result.analysis || {
    source: 'legacy',
    summary: result.summary,
    whyScore: result.whyThisScore ? [result.whyThisScore] : [],
    riskFactors: result.warnings || [],
    precautions: [],
    recommendedAction: result.recommendedAction
  };

  const isLowRisk = verification.riskLevel === 'LOW RISK';
  const isHighRisk = verification.riskLevel === 'HIGH RISK';
  
  const StatusIcon = isLowRisk ? ShieldCheck : (isHighRisk ? ShieldAlert : Shield);
  const statusColor = isLowRisk ? 'var(--success-color, #10b981)' : (isHighRisk ? 'var(--danger-color, #ef4444)' : 'var(--warning-color, #f59e0b)');

  // Extract precise metrics
  const signalsAnalyzed = verification.signalsAnalyzed || (verification.signals?.length || 0) + (verification.warnings?.length || 0) + 2;
  const evidenceChecked = verification.evidenceChecked || (verification.signals?.length || 0);
  const riskIndicators = verification.riskIndicators || (verification.warnings?.length || 0);
  const targetType = verification.targetType || verification.type || 'TARGET';
  const targetValue = verification.targetValue || verification.inputValue || '';

  return (
    <div className="result-container fadeIn">
      <div className="result-header-label">VERIFICATION RESULT</div>
      <div className="result-header">
        <div className="result-entity">
          <span className="entity-type">{targetType.toUpperCase()}</span>
          <span className="entity-value">{targetValue}</span>
        </div>
        
        <div className="result-score-badge" style={{ borderColor: statusColor, color: statusColor }}>
          <div className="score-main">
            <span className="score-value">{verification.score}</span>
            <span className="score-max">/100</span>
          </div>
          <div className="risk-label">
            <StatusIcon size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
            {verification.riskLevel}
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
              {typeof verification.confidence === 'number' ? `${verification.confidence}%` : String(verification.confidence || '0%').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="result-body">
        <div className="result-summary-panel">
          <h4>WHY THIS SCORE?</h4>
          
          <div className="analysis-source-indicator" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {analysis.source === 'ai' ? (
              <><Sparkles size={14} style={{ color: 'var(--primary-color)' }}/> AI-assisted interpretation</>
            ) : (
              <><Server size={14} /> Based on available verification signals</>
            )}
          </div>
          
          {analysis.summary && (
            <p style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '16px', fontSize: '1.05rem' }}>
              {analysis.summary}
            </p>
          )}
          
          {analysis.whyScore && analysis.whyScore.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Key Findings:</strong>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
                {analysis.whyScore.map((reason, i) => <li key={`why-${i}`}>{reason}</li>)}
              </ul>
            </div>
          )}
          
          {analysis.riskFactors && analysis.riskFactors.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--danger-color, #ef4444)' }}>Risk Factors:</strong>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
                {analysis.riskFactors.map((factor, i) => <li key={`risk-${i}`}>{factor}</li>)}
              </ul>
            </div>
          )}
          
          {analysis.precautions && analysis.precautions.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Precautions:</strong>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
                {analysis.precautions.map((precaution, i) => <li key={`prec-${i}`}>{precaution}</li>)}
              </ul>
            </div>
          )}
          
          {analysis.recommendedAction && (
            <div className="recommended-action-box" style={{ marginTop: '24px' }}>
              <strong>Recommended Action</strong>
              <span>{analysis.recommendedAction}</span>
            </div>
          )}
          
          <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            VerifyMe provides technical trust signals, not a guarantee of identity, legitimacy, or safety.
          </div>
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
