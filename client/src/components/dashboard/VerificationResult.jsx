import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  RefreshCw, 
  Sparkles, 
  Server,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import WebsiteVisualJourney from './assessments/WebsiteVisualJourney';
import EmailVisualMatrix from './assessments/EmailVisualMatrix';
import PhoneVisualAssessment from './assessments/PhoneVisualAssessment';
import ProgressiveDisclosure from './assessments/ProgressiveDisclosure';
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

  const targetType = verification.targetType || verification.type || 'TARGET';
  const targetValue = verification.targetValue || verification.inputValue || '';
  const typeLower = (targetType || '').toLowerCase();
  const isWebsite = typeLower === 'website';
  const isEmail = typeLower === 'email';
  const isPhone = typeLower === 'phone';

  const technicalStatus = verification.technicalStatus || (verification.riskLevel === 'LOW RISK' ? 'TECHNICAL CHECKS PASSED' : (verification.riskLevel === 'HIGH RISK' ? 'TECHNICAL ISSUES DETECTED' : 'TECHNICAL CHECKS PASSED'));
  const isInvalidInput = technicalStatus === 'INVALID INPUT' || verification.riskLevel === 'INVALID INPUT';
  const isTechnicalPass = technicalStatus === 'TECHNICAL CHECKS PASSED';
  const isLowRisk = verification.riskLevel === 'LOW RISK';
  const isHighRisk = verification.riskLevel === 'HIGH RISK' || technicalStatus === 'CONFIRMED THREAT';
  
  let StatusIcon = Shield;
  let statusColor = '#B45309';
  let statusBg = '#FEF3C7';
  let statusBorder = '#FDE68A';

  if (isInvalidInput) {
    StatusIcon = AlertCircle;
    statusColor = '#526056';
    statusBg = '#F6F5EF';
    statusBorder = '#DCE8DF';
  } else if (isTechnicalPass || isLowRisk) {
    StatusIcon = ShieldCheck;
    statusColor = '#15803D';
    statusBg = '#EAF6ED';
    statusBorder = '#A7D8B4';
  } else if (isHighRisk) {
    StatusIcon = ShieldAlert;
    statusColor = '#DC2626';
    statusBg = '#FEE2E2';
    statusBorder = '#FECACA';
  }

  const signalsAnalyzed = verification.signalsAnalyzed ?? ((verification.signals?.length || 0) + (verification.warnings?.length || 0));
  const riskIndicators = verification.riskIndicators ?? (verification.warnings?.length || 0);

  const score = Math.max(0, Math.min(100, Number(verification.score ?? verification.technicalHealthScore) || 0));
  // Circle circumference: 2 * PI * 42 ~= 264
  const circumference = 264;
  const strokeOffset = circumference - (score / 100) * circumference;

  const getVerdictHeadline = () => {
    if (isInvalidInput) {
      return 'Invalid Input — Incomplete Format';
    }
    if (technicalStatus === 'TRANSPORT SECURITY WEAKNESS') {
      return 'Transport Security Weakness — Unencrypted HTTP';
    }
    if (technicalStatus === 'CERTIFICATE VALIDATION FAILURE') {
      return 'Certificate Validation Failure — Untrusted TLS';
    }
    if (technicalStatus === 'REACHABILITY FAILURE') {
      return 'Host Reachability Failure — Server Unresponsive';
    }
    if (technicalStatus === 'DNS RESOLUTION FAILURE') {
      return 'DNS Resolution Failure — Mail Server Missing';
    }
    if (technicalStatus === 'AUTHENTICATION POLICY WEAKNESS') {
      return 'Authentication Policy Weakness — Partial Enforcement';
    }
    if (technicalStatus === 'SUSPICIOUS INDICATOR') {
      return 'Suspicious Format Indicator Detected';
    }

    if (isWebsite) {
      if (verification.reputationStatus === 'CHECKED' && verification.threatAssessmentStatus === 'NO KNOWN THREATS DETECTED') {
        return 'Verified Low Threat — Technical Checks Passed';
      }
      if (isTechnicalPass) return 'Technical Baseline Passed — Reputation Unrated';
      if (isHighRisk || verification.riskLevel === 'SUSPICIOUS') return 'Technical Security Issues Flagged';
      return 'Technical Verification Incomplete';
    }
    if (isEmail) {
      if (isTechnicalPass || isLowRisk) return 'Domain Email Infrastructure Configured';
      return 'Limited Verification — Exercise Caution';
    }
    if (isPhone) {
      if (isTechnicalPass || isLowRisk) return 'Valid Numbering Plan Format — Caller Identity Unverified';
      return 'Limited Verification — Exercise Caution';
    }
    if (isLowRisk || isTechnicalPass) {
      return 'Technical Checks Passed';
    }
    if (isHighRisk || verification.riskLevel === 'SUSPICIOUS') {
      return 'Critical Technical Risks Flagged';
    }
    return 'Limited Verification — Exercise Caution';
  };

  const getHumanReadableExplanation = () => {
    if (isInvalidInput) {
      return 'The entered identifier is structurally incomplete or invalid. Please provide a complete, properly formatted value to evaluate technical security.';
    }

    if (isWebsite) {
      if (technicalStatus === 'TRANSPORT SECURITY WEAKNESS') {
        return 'The website operates over an unencrypted HTTP connection. Sensitive data transmitted to this server may be intercepted or modified in transit.';
      }
      if (technicalStatus === 'CERTIFICATE VALIDATION FAILURE') {
        return 'The website failed TLS certificate verification. The certificate is either expired, self-signed, or untrusted by public certificate authorities.';
      }
      if (technicalStatus === 'REACHABILITY FAILURE') {
        return 'The server failed to respond to network reachability queries. Confirm whether the domain and web server are currently online.';
      }
      if (isHighRisk || verification.riskLevel === 'HIGH RISK' || technicalStatus === 'CONFIRMED THREAT') {
        return 'Critical technical or security vulnerabilities were identified on this endpoint. Proceed with extreme caution.';
      }
      if (isTechnicalPass || isLowRisk) {
        return 'The website responded successfully and passed all technical connection-security checks (DNS, HTTPS, and valid TLS). However, its organizational identity and potential threat reputation were not independently evaluated.';
      }
      return 'Basic connectivity was established, but some configuration aspects could not be fully verified.';
    }

    if (isEmail) {
      if (technicalStatus === 'DNS RESOLUTION FAILURE') {
        return 'The domain does not have active mail exchange (MX) servers configured. Emails sent to this domain will bounce or fail delivery.';
      }
      if (technicalStatus === 'AUTHENTICATION POLICY WEAKNESS') {
        return 'The domain can receive email and publishes an SPF record, but its DMARC policy is set to monitoring-only (p=none). Spoofed emails are not blocked at the gateway.';
      }
      if (isTechnicalPass || isLowRisk) {
        return 'The domain has active mail exchange servers and publishes anti-spoofing policies. However, this verifies domain infrastructure only and does not prove the authenticity of individual message senders.';
      }
      return 'The email format is valid, but the domain email infrastructure has configuration gaps or could not be completely validated.';
    }

    if (isPhone) {
      if (technicalStatus === 'SUSPICIOUS INDICATOR') {
        return 'This number is allocated in a premium-rate toll prefix associated with elevated toll charges and telemarketing billing schemes.';
      }
      const isAmbiguous = (verification.warnings || []).some(w => w.toLowerCase().includes('matches multiple'));
      if (isAmbiguous) {
        return 'This number matches multiple national numbering plans without international prefix context. Please include a country code (+1, +44, +91) for exact verification.';
      }
      if (isTechnicalPass || isLowRisk) {
        return 'This number conforms to authoritative national and international (E.164) numbering plans. However, format validity alone does not verify who owns the number or who is placing the call.';
      }
      return 'This phone number has incomplete formatting or cannot be verified against authoritative numbering registries.';
    }

    return analysis.summary || 'Technical protocol checks completed.';
  };

  const getBadgeLabel = () => {
    if (isInvalidInput) return 'INVALID INPUT';
    return technicalStatus || verification.riskLevel || 'TECHNICAL CHECKS PASSED';
  };

  const completenessDisplay = typeof verification.evidenceCompleteness === 'number'
    ? `${verification.evidenceCompleteness}%`
    : (typeof verification.confidence === 'number' ? `${verification.confidence}%` : String(verification.confidence || '75%'));

  const handleCopyReport = () => {
    const reportText = `[VerifyMe Audit Report]
Target: ${targetValue} (${targetType.toUpperCase()})
Technical Health Score: ${score}/100
Technical Status: ${technicalStatus}
Reputation Status: ${verification.reputationStatus || 'NOT CHECKED'}
Threat Assessment: ${verification.threatAssessmentStatus || 'NOT CHECKED'}
Threat Indicators: ${riskIndicators}
Identity Verification: ${verification.identityStatus || 'NOT VERIFIED'}
Evidence Completeness: ${completenessDisplay}
Signals Analyzed: ${signalsAnalyzed}
Summary: ${analysis.summary || getHumanReadableExplanation()}
Recommended Action: ${analysis.recommendedAction || 'N/A'}
Audit Engine: ${analysis.source === 'ai' ? 'Groq AI + Deterministic Signal Engine' : 'Deterministic Technical Signal Engine'}

--- DETERMINISTIC FINDINGS ---
${((analysis.whyScore && analysis.whyScore.length > 0) ? analysis.whyScore : (verification.signals || [])).map(s => `• ${s}`).join('\n') || 'None recorded'}

--- IDENTIFIED RISK FACTORS ---
${((analysis.riskFactors && analysis.riskFactors.length > 0) ? analysis.riskFactors : (verification.warnings || [])).map(w => `! ${w}`).join('\n') || 'None recorded'}

--- SCOPE BOUNDARIES & LIMITATIONS ---
${(verification.limitations || []).map(l => `? ${l}`).join('\n') || 'None recorded'}`;

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
            {copied ? <Check className="w-4 h-4 text-[#15803D]" /> : <Copy className="w-4 h-4" />}
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

      {/* Main Score & Risk Index Dashboard (Instant Verdict Hero) */}
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
            <span className="gauge-score-sub">HEALTH SCORE</span>
          </div>
        </div>

        {/* Verdict & Context */}
        <div className="audit-verdict-column">
          <div className="verdict-badges-row">
            <div className="risk-level-badge" style={{ backgroundColor: statusBg, borderColor: statusBorder, color: statusColor }}>
              <StatusIcon className="w-4 h-4" />
              <span>{getBadgeLabel()}</span>
            </div>

            <div className="status-dimension-pill">
              <span className="pill-meta-label">REPUTATION:</span>
              <span className="pill-meta-val">{verification.reputationStatus || 'NOT CHECKED'}</span>
            </div>

            <div className="status-dimension-pill">
              <span className="pill-meta-label">THREATS:</span>
              <span className="pill-meta-val">{verification.threatAssessmentStatus || 'NOT CHECKED'}</span>
            </div>

            <div className="status-dimension-pill">
              <span className="pill-meta-label">IDENTITY:</span>
              <span className="pill-meta-val">{verification.identityStatus || 'NOT VERIFIED'}</span>
            </div>

            <div className="status-dimension-pill">
              <span className="pill-meta-label">COMPLETENESS:</span>
              <span className="pill-meta-val">{completenessDisplay}</span>
            </div>
          </div>

          <h3 className="verdict-headline">
            {getVerdictHeadline()}
          </h3>

          <p className="verdict-human-summary">
            {getHumanReadableExplanation()}
          </p>

          <div className="verdict-engine-source">
            {analysis.source === 'ai' ? (
              <span className="source-chip ai">
                <Sparkles className="w-3.5 h-3.5 text-[#174C3C]" />
                <span>AI Threat Interpretation (Groq)</span>
              </span>
            ) : (
              <span className="source-chip deterministic">
                <Server className="w-3.5 h-3.5 text-[#526056]" />
                <span>Deterministic Signal Verification</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Assessment Overview (Modality-Specific) */}
      <div className="visual-assessment-container">
        {isWebsite && <WebsiteVisualJourney verification={verification} />}
        {isEmail && <EmailVisualMatrix verification={verification} />}
        {isPhone && <PhoneVisualAssessment verification={verification} />}
      </div>

      {/* Prominent Recommended Action */}
      {analysis.recommendedAction && (
        <div className="recommended-action-hero">
          <div className="recommended-action-badge">
            <ShieldCheck className="w-4 h-4 text-[#174C3C]" />
            <span>RECOMMENDED NEXT STEP</span>
          </div>
          <p className="recommended-action-text">{analysis.recommendedAction}</p>
        </div>
      )}

      {/* Progressive Disclosure (Collapsible Audit Accordions) */}
      <ProgressiveDisclosure 
        whyScore={analysis.whyScore || []}
        riskFactors={analysis.riskFactors || []}
        signals={verification.signals || []}
        warnings={verification.warnings || []}
        limitations={verification.limitations || []}
      />

      {/* Disclaimer */}
      <div className="audit-disclaimer-note">
        VerifyMe provides deterministic technical protocol validation and infrastructure checks. Technical validity does not verify individual identity, organization authenticity, or caller/sender legitimacy.
      </div>
    </div>
  );
};

export default VerificationResult;
