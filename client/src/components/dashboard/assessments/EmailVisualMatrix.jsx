import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Mail,
  Server,
  ShieldCheck,
  Lock,
  UserCheck
} from 'lucide-react';
import './VisualAssessments.css';

const EmailVisualMatrix = ({ verification }) => {
  if (!verification) return null;

  const signals = verification.signals || [];
  const warnings = verification.warnings || [];
  const isFormatValid = verification.formatValid !== false;

  // 1. Domain & DNS
  const isNonExistent = warnings.some(w => w.toLowerCase().includes('does not exist') || w.toLowerCase().includes('nxdomain'));
  let domainStatus = 'passed';
  let domainLabel = 'Active';
  let domainDesc = 'Authoritative DNS resolution confirmed';
  if (!isFormatValid) {
    domainStatus = 'failed';
    domainLabel = 'Invalid Syntax';
    domainDesc = 'Email address fails RFC syntax standards';
  } else if (isNonExistent) {
    domainStatus = 'failed';
    domainLabel = 'NXDOMAIN';
    domainDesc = 'Domain does not exist or has no active DNS';
  }

  // 2. Mail Servers (MX)
  const hasMx = signals.some(s => s.toLowerCase().includes('mail exchange') || s.toLowerCase().includes('mx'));
  const lacksMx = warnings.some(w => w.toLowerCase().includes('lacks mx'));
  let mxStatus = 'passed';
  let mxLabel = 'Configured';
  let mxDesc = 'Mail exchange servers active and ready';
  if (lacksMx) {
    mxStatus = 'failed';
    mxLabel = 'Missing MX';
    mxDesc = 'Domain lacks MX records; cannot receive mail';
  } else if (!hasMx) {
    mxStatus = 'warning';
    mxLabel = 'Unconfirmed';
    mxDesc = 'MX records could not be validated';
  }

  // 3. SPF Policy
  const hasHardFail = signals.some(s => s.toLowerCase().includes('hardfail') || s.toLowerCase().includes('-all'));
  const hasSoftFail = signals.some(s => s.toLowerCase().includes('softfail') || s.toLowerCase().includes('~all'));
  const isPermissive = warnings.some(w => w.toLowerCase().includes('permissive qualifier') || w.toLowerCase().includes('+all'));
  const isPermError = warnings.some(w => w.toLowerCase().includes('spf policy error'));
  const lacksSpf = warnings.some(w => w.toLowerCase().includes('lacks spf'));
  let spfStatus = 'passed';
  let spfLabel = 'Configured';
  let spfDesc = 'SPF anti-spoofing policy active';
  if (hasHardFail) {
    spfStatus = 'passed';
    spfLabel = 'Strict (-all)';
    spfDesc = 'Unauthorized senders strictly rejected';
  } else if (hasSoftFail) {
    spfStatus = 'passed';
    spfLabel = 'SoftFail (~all)';
    spfDesc = 'Unauthorized senders flagged for spam filter';
  } else if (isPermissive) {
    spfStatus = 'warning';
    spfLabel = 'Permissive (+all)';
    spfDesc = 'Allows any server worldwide to send email';
  } else if (isPermError) {
    spfStatus = 'warning';
    spfLabel = 'Policy Error';
    spfDesc = 'SPF syntax error prevents strict enforcement';
  } else if (lacksSpf) {
    spfStatus = 'failed';
    spfLabel = 'Missing SPF';
    spfDesc = 'Domain lacks SPF spoofing protection';
  }

  // 4. DMARC Authentication
  const hasStrictDmarc = signals.some(s => s.toLowerCase().includes('strict dmarc') || s.toLowerCase().includes('p=reject'));
  const hasQuarantine = signals.some(s => s.toLowerCase().includes('p=quarantine'));
  const hasMonitoringDmarc = warnings.some(w => w.toLowerCase().includes('p=none') || w.toLowerCase().includes('monitoring-only'));
  const lacksDmarc = warnings.some(w => w.toLowerCase().includes('lacks dmarc'));
  let dmarcStatus = 'passed';
  let dmarcLabel = 'Active';
  let dmarcDesc = 'DMARC email authentication policy active';
  if (hasStrictDmarc) {
    dmarcStatus = 'passed';
    dmarcLabel = 'Strict (p=reject)';
    dmarcDesc = 'Unauthorized spoofed emails are rejected';
  } else if (hasQuarantine) {
    dmarcStatus = 'passed';
    dmarcLabel = 'Quarantine';
    dmarcDesc = 'Unauthorized emails are directed to spam';
  } else if (hasMonitoringDmarc) {
    dmarcStatus = 'warning';
    dmarcLabel = 'Monitoring (p=none)';
    dmarcDesc = 'Spoofed emails are neither rejected nor quarantined';
  } else if (lacksDmarc) {
    dmarcStatus = 'failed';
    dmarcLabel = 'Missing DMARC';
    dmarcDesc = 'Domain lacks DMARC authentication policy';
  }

  // 5. Mailbox Verification (Progressive boundary - explicitly unverified)
  const mailboxStatus = 'neutral';
  const mailboxLabel = 'Not Checked';
  const mailboxDesc = 'Domain infrastructure verified; individual mailbox not probed';

  const cards = [
    { title: 'Domain & DNS', status: domainStatus, label: domainLabel, desc: domainDesc, icon: Server },
    { title: 'Mail Routing (MX)', status: mxStatus, label: mxLabel, desc: mxDesc, icon: Mail },
    { title: 'SPF Protection', status: spfStatus, label: spfLabel, desc: spfDesc, icon: ShieldCheck },
    { title: 'DMARC Policy', status: dmarcStatus, label: dmarcLabel, desc: dmarcDesc, icon: Lock },
    { title: 'Mailbox Probe', status: mailboxStatus, label: mailboxLabel, desc: mailboxDesc, icon: UserCheck },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="visual-assessment-root">
      <div className="visual-section-header">
        <div className="visual-section-title-wrap">
          <Mail className="w-4 h-4 text-[#174C3C]" />
          <span className="visual-section-title">Email Infrastructure & Auth Matrix</span>
        </div>
        <span className="visual-section-subtitle">
          5-Point Domain Authentication Inspection
        </span>
      </div>

      <div className="email-matrix-grid">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={`matrix-${idx}`} className={`matrix-card ${card.status}`}>
              <div className="matrix-card-header">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="matrix-card-title">{card.title}</span>
                </div>
                <span className={`matrix-status-pill ${card.status}`}>
                  {getStatusIcon(card.status)}
                  <span>{card.label}</span>
                </span>
              </div>
              <p className="matrix-card-desc">{card.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmailVisualMatrix;
