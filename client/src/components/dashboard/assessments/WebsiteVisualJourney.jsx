import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldAlert, 
  HelpCircle,
  Globe,
  ArrowRight
} from 'lucide-react';
import './VisualAssessments.css';

const WebsiteVisualJourney = ({ verification }) => {
  if (!verification) return null;

  const signals = verification.signals || [];
  const warnings = verification.warnings || [];
  const isFormatValid = verification.formatValid !== false;

  // 1. URL Syntax
  const urlStatus = isFormatValid ? 'passed' : 'failed';
  const urlLabel = isFormatValid ? 'Valid Format' : 'Malformed';
  const urlDetail = isFormatValid ? 'Complies with standard URI structure' : 'Cannot parse destination URI';

  // 2. DNS Resolution
  const isBlocked = warnings.some(w => w.toLowerCase().includes('blocked'));
  const hasDnsFailure = warnings.some(w => w.toLowerCase().includes('dns') && w.toLowerCase().includes('fail')) || !isFormatValid;
  let dnsStatus = 'passed';
  let dnsLabel = 'Resolved';
  let dnsDetail = 'Authoritative public IP mapped';
  if (isBlocked) {
    dnsStatus = 'blocked';
    dnsLabel = 'Blocked';
    dnsDetail = 'Internal/loopback IP blocked (SSRF)';
  } else if (hasDnsFailure) {
    dnsStatus = 'failed';
    dnsLabel = 'DNS Failed';
    dnsDetail = 'Domain could not be resolved';
  }

  // 3. Transport Protocol
  const isPlaintextHttp = warnings.some(w => w.toLowerCase().includes('unencrypted http'));
  const isUpgraded = signals.some(s => s.toLowerCase().includes('upgrades unencrypted http') || s.toLowerCase().includes('auto-upgrade'));
  let transportStatus = 'passed';
  let transportLabel = 'HTTPS';
  let transportDetail = 'Encrypted HTTPS protocol';
  if (isUpgraded) {
    transportStatus = 'passed';
    transportLabel = 'Auto-Upgraded';
    transportDetail = 'HTTP request auto-upgrades to HTTPS';
  } else if (isPlaintextHttp) {
    transportStatus = 'warning';
    transportLabel = 'Plaintext HTTP';
    transportDetail = 'Unencrypted data transmission';
  }

  // 4. TLS Certificate
  const hasTlsFailure = warnings.some(w => w.toLowerCase().includes('tls') || w.toLowerCase().includes('certificate'));
  const hasTlsPass = signals.some(s => s.toLowerCase().includes('tls') || s.toLowerCase().includes('certificate'));
  let tlsStatus = 'passed';
  let tlsLabel = 'CA Verified';
  let tlsDetail = 'Trusted Certificate Authority';
  if (hasTlsFailure) {
    tlsStatus = 'failed';
    tlsLabel = 'Untrusted / Expired';
    tlsDetail = 'Certificate validation failed';
  } else if (isPlaintextHttp && !hasTlsPass) {
    tlsStatus = 'neutral';
    tlsLabel = 'Not Requested';
    tlsDetail = 'No TLS certificate on plaintext HTTP';
  }

  // 5. HTTP Reachability
  const isUnreachable = warnings.some(w => w.toLowerCase().includes('failed to respond') || w.toLowerCase().includes('unreachable'));
  let reachStatus = 'passed';
  let reachLabel = 'Reachable';
  let reachDetail = 'Server responded successfully';
  if (isBlocked) {
    reachStatus = 'neutral';
    reachLabel = 'Skipped';
    reachDetail = 'Pre-emptively blocked by security policy';
  } else if (isUnreachable) {
    reachStatus = 'failed';
    reachLabel = 'Unreachable';
    reachDetail = 'Connection timed out or refused';
  }

  // 6. Threat Intelligence & Reputation
  const hasThreatIndicators = verification.threatAssessmentStatus === 'THREAT INDICATORS DETECTED' || (verification.threatIndicators && verification.threatIndicators.length > 0);
  const isCleanFeed = verification.threatAssessmentStatus === 'NO KNOWN THREATS DETECTED' && verification.reputationStatus === 'CHECKED';
  let threatStatus = 'neutral';
  let threatLabel = 'Not Checked';
  let threatDetail = 'External threat database not evaluated';
  if (hasThreatIndicators) {
    threatStatus = 'failed';
    threatLabel = 'Threat Detected';
    threatDetail = 'Target matched threat feed indicators';
  } else if (isCleanFeed) {
    threatStatus = 'passed';
    threatLabel = 'Clean Feed';
    threatDetail = 'Zero threats reported by provider';
  }

  const steps = [
    { number: '01', title: 'URL Syntax', status: urlStatus, label: urlLabel, detail: urlDetail },
    { number: '02', title: 'DNS Resolution', status: dnsStatus, label: dnsLabel, detail: dnsDetail },
    { number: '03', title: 'Transport Protocol', status: transportStatus, label: transportLabel, detail: transportDetail },
    { number: '04', title: 'TLS Certificate', status: tlsStatus, label: tlsLabel, detail: tlsDetail },
    { number: '05', title: 'Reachability', status: reachStatus, label: reachLabel, detail: reachDetail },
    { number: '06', title: 'Threat Intelligence', status: threatStatus, label: threatLabel, detail: threatDetail },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'blocked':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="visual-assessment-root">
      <div className="visual-section-header">
        <div className="visual-section-title-wrap">
          <Globe className="w-4 h-4 text-[#174C3C]" />
          <span className="visual-section-title">Connection & Security Journey</span>
        </div>
        <span className="visual-section-subtitle">
          6-Stage Protocol Verification Pipeline
        </span>
      </div>

      <div className="website-journey-grid">
        {steps.map((step, idx) => (
          <div key={`step-${idx}`} className={`journey-step-card ${step.status}`}>
            <div className="step-card-top">
              <span className="step-number-badge">{step.number}</span>
              <div className="step-status-icon-wrap">
                {getStatusIcon(step.status)}
              </div>
            </div>

            <div className="step-card-body">
              <span className="step-title">{step.title}</span>
              <span className={`step-status-tag ${step.status}`}>
                {step.label}
              </span>
              <p className="step-detail-text">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebsiteVisualJourney;
