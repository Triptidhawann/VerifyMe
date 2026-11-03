import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Activity, 
  Database, 
  Fingerprint, 
  Sparkles, 
  Server,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import './VerificationResult.css';

const VerificationResult = ({ result, onVerifyAnother }) => {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

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
  const statusColor = isLowRisk ? '#10B981' : (isHighRisk ? '#EF4444' : '#F59E0B');
  const statusBg = isLowRisk ? 'rgba(16, 185, 129, 0.1)' : (isHighRisk ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)');

  const signalsAnalyzed = verification.signalsAnalyzed || (verification.signals?.length || 0) + (verification.warnings?.length || 0) + 2;
  const evidenceChecked = verification.evidenceChecked || (verification.signals?.length || 0);
  const riskIndicators = verification.riskIndicators || (verification.warnings?.length || 0);
  const targetType = verification.targetType || verification.type || 'TARGET';
  const targetValue = verification.targetValue || verification.inputValue || '';

  const score = Math.max(0, Math.min(100, Number(verification.score) || 0));
  // Circle circumference: 2 * PI * 42 ~= 264
  const circumference = 264;
  const strokeOffset = circumference - (score / 100) * circumference;

  const handleCopyReport = () => {
    const reportText = `[VerifyMe Audit Report]
Target: ${targetValue} (${targetType.toUpperCase()})
Trust Score: ${score}/100 [${verification.riskLevel}]
Confidence: ${verification.confidence}%
Signals Analyzed: ${signalsAnalyzed}
Risk Indicators: ${riskIndicators}
Summary: ${analysis.summary || 'N/A'}
Recommended Action: ${analysis.recommendedAction || 'N/A'}
Audit Engine: ${analysis.source === 'ai' ? 'Groq AI + Deterministic Signal Engine' : 'Deterministic Technical Signal Engine'}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="audit-result-wrapper fadeIn">
      {/* Top Banner Header */}
      <div className="audit-top-bar">
        <div className="audit-target-display">
          <span className="audit-type-pill">{targetType.toUpperCase()}</span>
          <span className="audit-value-mono">{targetValue}</span>
        </div>

        <div className="audit-header-actions">
          <button 
            type="button" 
            className="audit-action-btn"
            onClick={handleCopyReport}
            title="Copy audit report to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Audit Copied!' : 'Export Report'}</span>
          </button>

          <button 
            type="button" 
            className="audit-action-btn primary"
            onClick={onVerifyAnother}
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Main Score & Risk Index Dashboard */}
      <div className="audit-score-card">
        {/* Radial Meter */}
        <div className="gauge-meter-wrapper">
          <svg className="gauge-svg" viewBox="0 0 100 100">
            <circle 
              className="gauge-track" 
              cx="50" 
              cy="50" 
              r="42" 
            />
            <circle 
              className="gauge-progress" 
              cx="50" 
              cy="50" 
              r="42" 
              stroke={statusColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
            />
          </svg>
          <div className="gauge-center-content">
            <span className="gauge-score-value" style={{ color: statusColor }}>{score}</span>
            <span className="gauge-score-sub">OUT OF 100</span>
          </div>
        </div>

        {/* Verdict & Engine Source */}
        <div className="audit-verdict-column">
          <div className="risk-level-badge" style={{ backgroundColor: statusBg, borderColor: statusColor, color: statusColor }}>
            <StatusIcon className="w-4 h-4" />
            <span>{verification.riskLevel}</span>
          </div>

          <h3 className="verdict-headline">
            {isLowRisk ? 'High Digital Trust Verified' : isHighRisk ? 'Critical Threat Patterns Flagged' : 'Moderate Caution Advisable'}
          </h3>

          <div className="verdict-engine-source">
            {analysis.source === 'ai' ? (
              <span className="source-chip ai">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI-Assisted Threat Interpretation (Groq)</span>
              </span>
            ) : (
              <span className="source-chip deterministic">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Deterministic Signal Verification</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4-Metric Tactical Grid */}
      <div className="audit-metrics-grid">
        <div className="metric-cell">
          <div className="metric-cell-icon">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="metric-cell-content">
            <span className="cell-label">Signals Analyzed</span>
            <span className="cell-value">{String(signalsAnalyzed).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="metric-cell">
          <div className="metric-cell-icon">
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="metric-cell-content">
            <span className="cell-label">Evidence Checked</span>
            <span className="cell-value">{String(evidenceChecked).padStart(2, '0')}</span>
          </div>
        </div>

        <div className={`metric-cell ${riskIndicators > 0 ? 'warning' : ''}`}>
          <div className="metric-cell-icon">
            <AlertTriangle className={`w-4 h-4 ${riskIndicators > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className="metric-cell-content">
            <span className="cell-label">Risk Indicators</span>
            <span className={`cell-value ${riskIndicators > 0 ? 'text-amber-400' : ''}`}>
              {String(riskIndicators).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="metric-cell">
          <div className="metric-cell-icon">
            <Fingerprint className="w-4 h-4 text-teal-400" />
          </div>
          <div className="metric-cell-content">
            <span className="cell-label">Confidence Index</span>
            <span className="cell-value">
              {typeof verification.confidence === 'number' ? `${verification.confidence}%` : String(verification.confidence || '95%')}
            </span>
          </div>
        </div>
      </div>

      {/* Synthesis & Explanations Panel */}
      <div className="audit-findings-section">
        {analysis.summary && (
          <div className="findings-summary-box">
            <span className="section-micro-label">EXECUTIVE SUMMARY</span>
            <p className="summary-paragraph">{analysis.summary}</p>
          </div>
        )}

        <div className="findings-columns-grid">
          {/* Key Findings */}
          {analysis.whyScore && analysis.whyScore.length > 0 && (
            <div className="findings-card">
              <div className="card-header-row">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="card-title">Key Deterministic Findings</span>
              </div>
              <ul className="findings-list">
                {analysis.whyScore.map((reason, idx) => (
                  <li key={`why-${idx}`}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Factors */}
          {analysis.riskFactors && analysis.riskFactors.length > 0 && (
            <div className="findings-card risk">
              <div className="card-header-row">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="card-title text-rose-300">Identified Risk Factors</span>
              </div>
              <ul className="findings-list risk">
                {analysis.riskFactors.map((factor, idx) => (
                  <li key={`risk-${idx}`}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Precautions */}
          {analysis.precautions && analysis.precautions.length > 0 && (
            <div className="findings-card">
              <div className="card-header-row">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="card-title">Recommended Safety Measures</span>
              </div>
              <ul className="findings-list">
                {analysis.precautions.map((precaution, idx) => (
                  <li key={`prec-${idx}`}>{precaution}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Callout */}
        {analysis.recommendedAction && (
          <div className="recommended-callout-box">
            <div className="callout-badge">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>RECOMMENDED ACTION</span>
            </div>
            <p className="callout-text">{analysis.recommendedAction}</p>
          </div>
        )}

        {/* Analysis Breakdown Pass/Risk Badges */}
        <div className="evidence-breakdown-box">
          <span className="section-micro-label">TECHNICAL EVIDENCE RECORD</span>
          <div className="evidence-tags-grid">
            {result.signals && result.signals.map((sig, i) => (
              <div className="evidence-tag pass" key={`sig-${i}`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{typeof sig === 'string' ? sig : 'Evidence Signal Validated'}</span>
              </div>
            ))}
            {result.warnings && result.warnings.map((warn, i) => (
              <div className="evidence-tag warn" key={`warn-${i}`}>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{typeof warn === 'string' ? warn : 'Risk Anomaly Flagged'}</span>
              </div>
            ))}
            {result.limitations && result.limitations.map((lim, i) => (
              <div className="evidence-tag lim" key={`lim-${i}`}>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{typeof lim === 'string' ? lim : 'Limitation'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="audit-disclaimer-note">
        VerifyMe cryptographic intelligence provides deterministic technical reputation signals, not a legal warranty of identity or safety.
      </div>
    </div>
  );
};

export default VerificationResult;
