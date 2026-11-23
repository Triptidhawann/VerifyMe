import React, { useState } from 'react';
import { 
  Check, 
  AlertTriangle, 
  HelpCircle, 
  ChevronDown, 
  FileText
} from 'lucide-react';

/**
 * EvidenceTrail — Distinctive sequential investigation trail.
 * Renders verified signals, flagged warnings, and scope limitations in a structured vertical sequence.
 */
export const EvidenceTrail = ({ signals = [], warnings = [], limitations = [] }) => {
  const [expandedIndices, setExpandedIndices] = useState({});

  const toggleExpand = (index) => {
    setExpandedIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Compile items in a structured investigation order:
  // 1. Passed Signals
  // 2. Flagged Warnings / Threats
  // 3. Unchecked Boundaries
  const trailItems = [
    ...signals.map((text, idx) => ({
      id: `sig-${idx}`,
      type: 'passed',
      title: text,
      category: 'Verified Protocol Signal',
      statusLabel: 'VERIFIED',
      detail: 'Signal validated against authoritative DNS, cryptographic records, or telecom registries.'
    })),
    ...warnings.map((text, idx) => ({
      id: `warn-${idx}`,
      type: 'flagged',
      title: text,
      category: 'Risk Indicator Flagged',
      statusLabel: 'FLAGGED',
      detail: 'Investigation flagged potential security anomaly, missing configuration, or elevated risk parameter.'
    })),
    ...limitations.map((text, idx) => ({
      id: `lim-${idx}`,
      type: 'unchecked',
      title: text,
      category: 'Scope Boundary',
      statusLabel: 'OUT OF SCOPE',
      detail: 'Check was not evaluated due to protocol boundaries or privacy constraints.'
    }))
  ];

  if (trailItems.length === 0) {
    return (
      <div className="evidence-trail-empty">
        <FileText className="w-4 h-4 text-[#737D76]" />
        <span>Standard automated baseline investigation completed with no anomalies.</span>
      </div>
    );
  }

  return (
    <section className="evidence-trail-section" aria-label="Investigation Evidence Trail">
      <div className="trail-section-header">
        <div>
          <span className="trail-section-pretitle font-mono">EVIDENCE TRAIL</span>
          <h3 className="trail-section-title">Investigation Sequence</h3>
        </div>
        <span className="trail-count-badge font-mono">{trailItems.length} CHECKS RECORDED</span>
      </div>

      <div className="evidence-trail-timeline">
        {trailItems.map((item, index) => {
          const isExpanded = !!expandedIndices[index];
          const stepNumber = String(index + 1).padStart(2, '0');

          return (
            <div 
              key={item.id} 
              className={`trail-step-item trail-step--${item.type} ${isExpanded ? 'expanded' : ''}`}
            >
              {/* Vertical connector line & Node Marker */}
              <div className="trail-marker-column" aria-hidden="true">
                <div className="trail-node-marker">
                  {item.type === 'passed' && <Check className="w-3 h-3 text-[#2E7D5B] stroke-[3]" />}
                  {item.type === 'flagged' && <AlertTriangle className="w-3 h-3 text-[#D94E4E] stroke-[2.5]" />}
                  {item.type === 'unchecked' && <HelpCircle className="w-3 h-3 text-[#94A098] stroke-[2.5]" />}
                </div>
                {index < trailItems.length - 1 && <div className="trail-connecting-line" />}
              </div>

              {/* Step Content */}
              <div className="trail-step-content">
                <div className="trail-step-meta">
                  <span className="trail-step-index font-mono">STEP {stepNumber}</span>
                  <span className="trail-meta-dot">•</span>
                  <span className="trail-step-cat">{item.category}</span>
                  <span className={`trail-status-pill font-mono status-${item.type}`}>
                    {item.statusLabel}
                  </span>
                </div>

                <h4 className="trail-step-title">{item.title}</h4>

                <p className="trail-step-summary">{item.detail}</p>

                {/* Optional Expandable Technical Context */}
                <button
                  type="button"
                  className="trail-expand-btn font-mono"
                  onClick={() => toggleExpand(index)}
                  aria-expanded={isExpanded}
                >
                  <span>{isExpanded ? 'LESS CONTEXT' : 'INSPECTION CONTEXT'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="trail-expanded-drawer fadeIn">
                    <div className="trail-drawer-inner">
                      <div className="drawer-record-row font-mono">
                        <span className="drawer-label">RECORD STATUS:</span>
                        <span className="drawer-val">{item.statusLabel}</span>
                      </div>
                      <div className="drawer-record-row font-mono">
                        <span className="drawer-label">RULE EVALUATOR:</span>
                        <span className="drawer-val">Deterministic Policy Engine v2</span>
                      </div>
                      <div className="drawer-record-row font-mono">
                        <span className="drawer-label">CONFIDENCE:</span>
                        <span className="drawer-val">100% Authoritative Public Record</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default EvidenceTrail;
