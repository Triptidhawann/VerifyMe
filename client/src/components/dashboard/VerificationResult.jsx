import React, { useState } from 'react';
import { 
  Server, 
  ChevronDown 
} from 'lucide-react';
import LedgerHeader from './ledger/LedgerHeader';
import LedgerVerdict from './ledger/LedgerVerdict';
import EvidenceTrail from './ledger/EvidenceTrail';
import EvidenceMatrix from './ledger/EvidenceMatrix';
import LedgerAuditRail from './ledger/LedgerAuditRail';
import ProgressiveDisclosure from './assessments/ProgressiveDisclosure';
import './VerificationResult.css';

export const VerificationResult = ({ result, onVerifyAnother }) => {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!result) return null;

  const verification = result?.verification || result || {};
  const score = Math.max(0, Math.min(100, Number(verification.score ?? verification.technicalHealthScore) || 0));

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

  const technicalStatus = verification.technicalStatus || 
    (verification.riskLevel === 'LOW RISK' ? 'TECHNICAL CHECKS PASSED' : 
    (verification.riskLevel === 'HIGH RISK' ? 'TECHNICAL ISSUES DETECTED' : 'TECHNICAL CHECKS PASSED'));
    
  const isInvalidInput = technicalStatus === 'INVALID INPUT' || verification.riskLevel === 'INVALID INPUT';
  const isTechnicalPass = technicalStatus === 'TECHNICAL CHECKS PASSED';
  const isLowRisk = verification.riskLevel === 'LOW RISK';
  const isSuspicious = verification.riskLevel === 'SUSPICIOUS' || verification.riskLevel === 'LIMITED VERIFICATION';
  const isHighRisk = verification.riskLevel === 'HIGH RISK' || technicalStatus === 'CONFIRMED THREAT';

  const signals = verification.signals || [];
  const warnings = verification.warnings || [];
  const limitations = verification.limitations || [];

  const passedCount = signals.length;
  const flaggedCount = warnings.length;
  const uncheckedCount = limitations.length;

  const getHumanReadableExplanation = () => {
    if (isInvalidInput) {
      return 'The entered identifier is structurally incomplete or invalid. Please check the formatting.';
    }

    if (isWebsite) {
      if (technicalStatus === 'TRANSPORT SECURITY WEAKNESS') {
        return 'This website operates over unencrypted HTTP. Data entered on this site can be intercepted by third parties.';
      }
      if (technicalStatus === 'CERTIFICATE VALIDATION FAILURE') {
        return 'The website failed security certificate (TLS) verification. The certificate is expired, invalid, or untrusted.';
      }
      if (technicalStatus === 'REACHABILITY FAILURE') {
        return 'The server did not respond to reachability queries. The domain or website may be down or non-existent.';
      }
      if (isHighRisk) {
        return 'Critical security issues or potential threats were flagged for this website. Avoid entering credentials or interacting.';
      }
      if (isTechnicalPass || isLowRisk) {
        return 'The website passed all baseline connection and security checks (DNS, HTTPS, and valid certificate). Technical infrastructure is in good standing.';
      }
      return 'Basic connectivity was established, but some configuration aspects could not be fully verified.';
    }

    if (isEmail) {
      if (technicalStatus === 'DNS RESOLUTION FAILURE') {
        return 'The email domain does not have active mail servers (MX) configured. Mail sent to this address will fail.';
      }
      if (technicalStatus === 'AUTHENTICATION POLICY WEAKNESS') {
        return 'The domain can receive mail, but lacks a strict DMARC anti-spoofing policy. Senders could potentially be forged.';
      }
      if (isTechnicalPass || isLowRisk) {
        return 'The domain has active mail servers and valid anti-spoofing security records in place.';
      }
      return 'The email syntax is valid, but the email domain has configuration gaps.';
    }

    if (isPhone) {
      if (technicalStatus === 'SUSPICIOUS INDICATOR') {
        return 'This number belongs to a premium-rate toll prefix associated with elevated charges or telemarketing.';
      }
      if (warnings.some(w => w.toLowerCase().includes('matches multiple'))) {
        return 'This number matches multiple country numbering plans. Include a country code (+1, +44, +91) for exact verification.';
      }
      if (isTechnicalPass || isLowRisk) {
        return 'This number follows standard regional and international numbering rules and belongs to an active telephone plan.';
      }
      return 'This phone number has incomplete formatting or cannot be verified against official registries.';
    }

    return analysis.summary || 'All automated technical checks completed.';
  };

  const handleShareReport = () => {
    const reportText = `[VerifyMe Investigation Ledger]
Record: ${targetValue} (${targetType.toUpperCase()})
Status: ${isLowRisk || isTechnicalPass ? 'BASELINE_VERIFIED' : (isHighRisk ? 'HIGH_RISK_FLAGGED' : 'CAUTION_LIMITED')}
Health Index: ${score}/100
Passed Signals: ${passedCount}
Flagged Warnings: ${flaggedCount}
Summary: ${analysis.summary || getHumanReadableExplanation()}
Recommended Protocol: ${analysis.recommendedAction || 'None specified'}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="evidence-ledger-root fadeIn" aria-label="Evidence Ledger Verification Document">
      {/* 1. EDITORIAL DOCUMENT HEADER */}
      <LedgerHeader 
        targetType={targetType}
        targetValue={targetValue}
        createdAt={result.createdAt || result.analyzedAt}
        reportId={result.id}
        onVerifyAnother={onVerifyAnother}
        onShareReport={handleShareReport}
        copied={copied}
      />

      {/* 2. ASYMMETRIC 2-COLUMN LEDGER COMPOSITION */}
      <div className="ledger-asymmetric-grid">
        {/* LEFT COLUMN: PRIMARY INVESTIGATION DOSSIER */}
        <div className="ledger-main-column">
          {/* Signature Verdict Block */}
          <LedgerVerdict 
            isLowRisk={isLowRisk}
            isTechnicalPass={isTechnicalPass}
            isHighRisk={isHighRisk}
            isSuspicious={isSuspicious}
            isInvalidInput={isInvalidInput}
            explanationText={getHumanReadableExplanation()}
          />

          {/* Signature Vertical Evidence Trail */}
          <EvidenceTrail 
            signals={signals}
            warnings={warnings}
            limitations={limitations}
          />

          {/* Adaptive Protocol Architecture Matrix */}
          <EvidenceMatrix 
            verification={verification}
            targetType={targetType}
          />

          {/* Advanced Technical Diagnostic Logs (Collapsible) */}
          <section className="ledger-collapsible-section" aria-label="Diagnostic Audit Logs">
            <button
              type="button"
              className="ledger-collapsible-toggle"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              aria-expanded={showTechnicalDetails}
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#737D76]" />
                <span className="font-mono text-sm font-semibold text-[#202923]">
                  {showTechnicalDetails ? 'COLLAPSE DIAGNOSTIC AUDIT LOGS' : 'VIEW RAW DIAGNOSTIC AUDIT LOGS'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#737D76] transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
            </button>

            {showTechnicalDetails && (
              <div className="ledger-collapsible-body fadeIn">
                <ProgressiveDisclosure 
                  whyScore={analysis.whyScore || []}
                  riskFactors={analysis.riskFactors || []}
                  signals={signals}
                  warnings={warnings}
                  limitations={limitations}
                />
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: STICKY AUDIT RAIL */}
        <div className="ledger-side-column">
          <LedgerAuditRail 
            score={score}
            isLowRisk={isLowRisk}
            isHighRisk={isHighRisk}
            isSuspicious={isSuspicious}
            passedCount={passedCount}
            flaggedCount={flaggedCount}
            uncheckedCount={uncheckedCount}
            recommendedAction={analysis.recommendedAction}
          />
        </div>
      </div>

      {/* 3. DOCUMENT FOOTNOTE */}
      <footer className="ledger-document-footer">
        <p className="ledger-footer-text font-mono">
          CONFIDENTIAL INVESTIGATION DOSSIER • GENERATED BY VERIFYME PROTOCOL ENGINE • DETERMINISTIC TELEMETRY ONLY
        </p>
      </footer>
    </article>
  );
};

export default VerificationResult;
