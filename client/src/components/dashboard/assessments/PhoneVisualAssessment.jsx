import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Phone,
  MapPin,
  FileCheck,
  Radio,
  UserX
} from 'lucide-react';
import './VisualAssessments.css';

const PhoneVisualAssessment = ({ verification }) => {
  if (!verification) return null;

  const signals = verification.signals || [];
  const warnings = verification.warnings || [];
  const isFormatValid = verification.formatValid !== false;

  // 1. E.164 Number Syntax
  const syntaxStatus = isFormatValid ? 'passed' : 'failed';
  const syntaxLabel = isFormatValid ? 'Valid E.164' : 'Malformed';
  const syntaxDesc = isFormatValid 
    ? 'Standard E.164 international numbering representation'
    : 'Input is structurally invalid or incomplete';

  // 2. Region & Calling Code
  const countrySignal = signals.find(s => s.toLowerCase().includes('country calling code') || s.includes('(+'));
  const isAmbiguous = warnings.some(w => w.toLowerCase().includes('matches multiple'));
  let regionStatus = isFormatValid ? 'passed' : 'failed';
  let regionLabel = isFormatValid ? 'Identified' : 'Unknown';
  let regionDesc = countrySignal || 'Country calling code identified';
  if (isAmbiguous) {
    regionStatus = 'warning';
    regionLabel = 'Ambiguous';
    regionDesc = 'Matches multiple national numbering plans without context';
  } else if (!isFormatValid) {
    regionStatus = 'failed';
    regionLabel = 'Unidentified';
    regionDesc = 'Cannot identify destination country prefix';
  }

  // 3. National Numbering Plan
  const hasPlanIssue = warnings.some(w => w.toLowerCase().includes('digit count') || w.toLowerCase().includes('numbering rules'));
  const planStatus = isFormatValid && !hasPlanIssue ? 'passed' : 'failed';
  const planLabel = isFormatValid && !hasPlanIssue ? 'Compliant' : 'Invalid Plan';
  const planDesc = isFormatValid && !hasPlanIssue
    ? 'Complies with national length and allocation rules'
    : 'Fails authoritative numbering rules for the region';

  // 4. Line Type Classification
  const isPremium = warnings.some(w => w.toLowerCase().includes('premium-rate'));
  const isVoip = warnings.some(w => w.toLowerCase().includes('voip'));
  const isTollFree = signals.some(s => s.toLowerCase().includes('toll-free'));
  const isMobile = signals.some(s => s.toLowerCase().includes('mobile'));
  const isFixed = signals.some(s => s.toLowerCase().includes('landline') || s.toLowerCase().includes('fixed-line'));
  let lineStatus = isFormatValid ? 'passed' : 'failed';
  let lineLabel = 'Allocated';
  let lineDesc = 'Standard telecom network allocation';
  if (isPremium) {
    lineStatus = 'failed';
    lineLabel = 'Premium Rate';
    lineDesc = 'High toll charges (frequent vector for billing scams)';
  } else if (isVoip) {
    lineStatus = 'warning';
    lineLabel = 'Virtual VoIP';
    lineDesc = 'Easily provisioned anonymously online';
  } else if (isTollFree) {
    lineStatus = 'passed';
    lineLabel = 'Toll-Free';
    lineDesc = 'Toll-free organizational number format';
  } else if (isMobile) {
    lineStatus = 'passed';
    lineLabel = 'Mobile Line';
    lineDesc = 'Allocated to cellular mobile network';
  } else if (isFixed) {
    lineStatus = 'passed';
    lineLabel = 'Landline';
    lineDesc = 'Allocated to fixed-line PSTN network';
  }

  // 5. Caller & Subscriber Identity (Explicit boundary)
  const identityStatus = 'neutral';
  const identityLabel = 'Not Verified';
  const identityDesc = 'Number format is dialable; telecom subscriber identity is unrated';

  const cards = [
    { title: 'E.164 Syntax', status: syntaxStatus, label: syntaxLabel, desc: syntaxDesc, icon: FileCheck },
    { title: 'Calling Code & Region', status: regionStatus, label: regionLabel, desc: regionDesc, icon: MapPin },
    { title: 'Numbering Plan', status: planStatus, label: planLabel, desc: planDesc, icon: Radio },
    { title: 'Line Classification', status: lineStatus, label: lineLabel, desc: lineDesc, icon: Phone },
    { title: 'Subscriber Identity', status: identityStatus, label: identityLabel, desc: identityDesc, icon: UserX },
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
          <Phone className="w-4 h-4 text-[#174C3C]" />
          <span className="visual-section-title">Numbering Plan & Allocation Matrix</span>
        </div>
        <span className="visual-section-subtitle">
          5-Point Dialability & Allocation Check
        </span>
      </div>

      <div className="phone-matrix-grid">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={`phone-${idx}`} className={`phone-card ${card.status}`}>
              <div className="phone-card-header">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="phone-card-title">{card.title}</span>
                </div>
                <span className={`matrix-status-pill ${card.status}`}>
                  {getStatusIcon(card.status)}
                  <span>{card.label}</span>
                </span>
              </div>
              <p className="phone-card-desc">{card.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhoneVisualAssessment;
