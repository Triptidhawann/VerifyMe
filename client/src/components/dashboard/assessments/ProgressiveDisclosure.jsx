import React, { useState } from 'react';
import { 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Layers, 
  FileText, 
  ShieldAlert,
  Sliders
} from 'lucide-react';
import './VisualAssessments.css';

const ProgressiveDisclosure = ({ 
  whyScore = [], 
  riskFactors = [], 
  signals = [], 
  warnings = [], 
  limitations = [] 
}) => {
  const [openSections, setOpenSections] = useState({
    findings: false,
    evidence: false,
    limitations: false
  });

  const allOpen = openSections.findings && openSections.evidence && openSections.limitations;

  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleAll = () => {
    const nextState = !allOpen;
    setOpenSections({
      findings: nextState,
      evidence: nextState,
      limitations: nextState
    });
  };

  const totalFindings = (whyScore?.length || 0) + (riskFactors?.length || 0);
  const totalEvidence = (signals?.length || 0) + (warnings?.length || 0);
  const totalLimitations = limitations?.length || 0;

  return (
    <div className="progressive-disclosure-root">
      <div className="progressive-toolbar">
        <span className="progressive-toolbar-label">
          Detailed Evidence & Technical Audit Record
        </span>
        <button 
          type="button" 
          className="progressive-toggle-all-btn"
          onClick={toggleAll}
        >
          {allOpen ? 'Collapse All Details' : 'Expand All Details'}
        </button>
      </div>

      {/* Accordion 1: Key Findings & Score Factors */}
      {totalFindings > 0 && (
        <div className="accordion-item">
          <button 
            type="button" 
            className="accordion-header"
            onClick={() => toggleSection('findings')}
            aria-expanded={openSections.findings}
          >
            <div className="accordion-title-group">
              <div className="accordion-icon-wrap">
                <FileText className="w-4 h-4 text-[#174C3C]" />
              </div>
              <span className="accordion-title">Why This Result Was Generated</span>
              <span className="accordion-badge">{totalFindings} observations</span>
            </div>
            <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.findings ? 'open' : ''}`} />
          </button>

          {openSections.findings && (
            <div className="accordion-body fadeIn">
              <div className="findings-columns-grid">
                {whyScore && whyScore.length > 0 && (
                  <div className="findings-card">
                    <div className="card-header-row">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="card-title">Contributing Deterministic Factors</span>
                    </div>
                    <ul className="findings-list">
                      {whyScore.map((reason, idx) => (
                        <li key={`why-${idx}`}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {riskFactors && riskFactors.length > 0 && (
                  <div className="findings-card risk">
                    <div className="card-header-row">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span className="card-title text-rose-300">Identified Risk Factors</span>
                    </div>
                    <ul className="findings-list risk">
                      {riskFactors.map((factor, idx) => (
                        <li key={`risk-${idx}`}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accordion 2: Detailed Technical Evidence Record */}
      {totalEvidence > 0 && (
        <div className="accordion-item">
          <button 
            type="button" 
            className="accordion-header"
            onClick={() => toggleSection('evidence')}
            aria-expanded={openSections.evidence}
          >
            <div className="accordion-title-group">
              <div className="accordion-icon-wrap">
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="accordion-title">Technical Evidence Record</span>
              <span className="accordion-badge">
                {signals.length} passed, {warnings.length} flagged
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.evidence ? 'open' : ''}`} />
          </button>

          {openSections.evidence && (
            <div className="accordion-body fadeIn">
              <div className="evidence-tags-grid">
                {signals.map((sig, i) => (
                  <div className="evidence-tag pass" key={`sig-${i}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{typeof sig === 'string' ? sig : 'Evidence Signal Validated'}</span>
                  </div>
                ))}
                {warnings.map((warn, i) => (
                  <div className="evidence-tag warn" key={`warn-${i}`}>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{typeof warn === 'string' ? warn : 'Risk Anomaly Flagged'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accordion 3: Audit Scope & Unverified Limitations */}
      {totalLimitations > 0 && (
        <div className="accordion-item">
          <button 
            type="button" 
            className="accordion-header"
            onClick={() => toggleSection('limitations')}
            aria-expanded={openSections.limitations}
          >
            <div className="accordion-title-group">
              <div className="accordion-icon-wrap">
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <span className="accordion-title">Scope Boundaries & Limitations</span>
              <span className="accordion-badge">{totalLimitations} boundary disclosures</span>
            </div>
            <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.limitations ? 'open' : ''}`} />
          </button>

          {openSections.limitations && (
            <div className="accordion-body fadeIn">
              <div className="evidence-tags-grid">
                {limitations.map((lim, i) => (
                  <div className="evidence-tag lim" key={`lim-${i}`}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{typeof lim === 'string' ? lim : 'Limitation'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressiveDisclosure;
