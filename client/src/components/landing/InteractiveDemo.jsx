import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, AlertTriangle, AlertCircle, ChevronDown, ArrowRight } from 'lucide-react';

const demoData = {
  phone: {
    label: "Phone Number",
    value: "+1 (555) 014-2088",
    score: 45,
    risk: "MEDIUM RISK",
    riskClass: "warning",
    signals: 7,
    evidence: 3,
    warnings: 2,
    positive: [
      { text: "Valid carrier assigned (AT&T Mobility)", icon: "check" },
      { text: "Line type validated as mobile", icon: "check" }
    ],
    review: [
      { text: "Recent porting activity detected within 14 days", icon: "alert" },
      { text: "No linked commercial directory records found", icon: "alert" }
    ],
    recommendation: "Exercise caution. Verify identity via secondary out-of-band channel."
  },
  email: {
    label: "Email Address",
    value: "security@example-demo.com",
    score: 82,
    risk: "LOW RISK",
    riskClass: "success",
    signals: 6,
    evidence: 4,
    warnings: 1,
    positive: [
      { text: "Domain is registered, active, and established", icon: "check" },
      { text: "Valid cryptographic MX, SPF & DKIM configured", icon: "check" },
      { text: "Not found in recent credential exposure databases", icon: "check" }
    ],
    review: [
      { text: "Domain registration age is under 1 year", icon: "alert" }
    ],
    recommendation: "Proceed with normal protocol caution."
  },
  website: {
    label: "Website URL",
    value: "https://paypaI-login-secure.xyz",
    score: 14,
    risk: "CRITICAL RISK",
    riskClass: "danger",
    signals: 8,
    evidence: 5,
    warnings: 4,
    positive: [
      { text: "Basic TLS/HTTPS encryption certificate active", icon: "check" }
    ],
    review: [
      { text: "Cyrillic homoglyph spoofing detected in domain string", icon: "danger" },
      { text: "Domain registered 4 days ago with anonymized WHOIS", icon: "danger" },
      { text: "Hosted on IP block flagged for credential harvesting", icon: "danger" }
    ],
    recommendation: "Block immediately. Do not submit credentials or tokens."
  },
  jobshield: {
    label: "Job Offer / Recruiter",
    value: "Remote Data Operations Specialist @ GlobalTech Corp",
    score: 22,
    risk: "HIGH RISK SCAM",
    riskClass: "danger",
    signals: 9,
    evidence: 6,
    warnings: 5,
    positive: [
      { text: "Brand name matches genuine Fortune 500 company", icon: "check" }
    ],
    review: [
      { text: "Recruiter domain registered 8 days ago (lookalike domain spoof)", icon: "danger" },
      { text: "Official ATS careers system has zero matching requisition ID", icon: "danger" },
      { text: "Unsolicited interview conducted exclusively via anonymous chat", icon: "danger" },
      { text: "Equipment advance fee / fake check deposit workflow detected", icon: "danger" }
    ],
    recommendation: "High-confidence employment fraud. Cease communication and report."
  },
  credential: {
    label: "Credential / Marksheet",
    value: "B.Sc Computer Science — Metro State University",
    score: 96,
    risk: "VERIFIED AUTHENTIC",
    riskClass: "success",
    signals: 11,
    evidence: 7,
    warnings: 0,
    positive: [
      { text: "PKCS#7 cryptographic digital signature verified (SHA-256)", icon: "check" },
      { text: "Statutory Higher Education Registry database matched", icon: "check" },
      { text: "Arithmetic mark calculations and CGPA 100% mathematically consistent", icon: "check" },
      { text: "Tamper-evident QR certificate verified against registrar key", icon: "check" }
    ],
    review: [
      { text: "Document structure conforms to official university master template", icon: "check" }
    ],
    recommendation: "Document integrity confirmed. Cryptographically authoritative credential."
  }
};

const stages = [
  "INPUT RECEIVED\nEntity captured into pipeline",
  "COLLECTING SIGNALS\nGathering carrier, DNS & statutory sources",
  "CORRELATING EVIDENCE\nAnalyzing protocol invariance & signatures",
  "ASSESSING RISK\nEvaluating deterministic trust indicators",
  "EVIDENCE LEDGER READY\nSynthesizing explainable investigation"
];

const InteractiveDemo = () => {
  const [activeTab, setActiveTab] = useState('jobshield');
  const [analysisState, setAnalysisState] = useState('idle'); // idle, analyzing, result
  const [analysisStage, setAnalysisStage] = useState(0);
  const [showWhy, setShowWhy] = useState(false);

  const currentData = demoData[activeTab];

  useEffect(() => {
    let timer;
    if (analysisState === 'analyzing') {
      if (analysisStage < stages.length - 1) {
        timer = setTimeout(() => {
          setAnalysisStage(prev => prev + 1);
        }, 800);
      } else {
        timer = setTimeout(() => {
          setAnalysisState('result');
        }, 800);
      }
    }
    return () => clearTimeout(timer);
  }, [analysisState, analysisStage]);

  const handleAnalyze = () => {
    setAnalysisState('analyzing');
    setAnalysisStage(0);
    setShowWhy(false);
  };

  const handleReset = () => {
    setAnalysisState('idle');
    setAnalysisStage(0);
    setShowWhy(false);
  };

  const handleTabChange = (tab) => {
    if (analysisState !== 'analyzing') {
      setActiveTab(tab);
      setAnalysisState('idle');
      setShowWhy(false);
    }
  };

  const renderIcon = (type) => {
    if (type === 'check') return <Check className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0 mt-0.5" strokeWidth={3} />;
    if (type === 'alert') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
    if (type === 'danger') return <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />;
    return null;
  };

  return (
    <div className="interactive-demo-container">
      
      <div className="demo-grid">
        
        {/* COLUMN 1: INPUT */}
        <div className="demo-panel input-panel">
          <div className="demo-header">
            <span className="demo-badge">Live Interactive Simulator</span>
          </div>
          
          <div className="demo-tabs flex-wrap">
            <button className={`demo-tab ${activeTab === 'jobshield' ? 'active' : ''}`} onClick={() => handleTabChange('jobshield')} disabled={analysisState === 'analyzing'}>Job Offer</button>
            <button className={`demo-tab ${activeTab === 'credential' ? 'active' : ''}`} onClick={() => handleTabChange('credential')} disabled={analysisState === 'analyzing'}>Credential</button>
            <button className={`demo-tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => handleTabChange('email')} disabled={analysisState === 'analyzing'}>Email</button>
            <button className={`demo-tab ${activeTab === 'website' ? 'active' : ''}`} onClick={() => handleTabChange('website')} disabled={analysisState === 'analyzing'}>Website</button>
            <button className={`demo-tab ${activeTab === 'phone' ? 'active' : ''}`} onClick={() => handleTabChange('phone')} disabled={analysisState === 'analyzing'}>Phone</button>
          </div>
          
          <div className="demo-input-group">
            <label>{currentData.label}</label>
            <div className="demo-input-fake">{currentData.value}</div>
          </div>
          
          <button 
            className={`btn btn-full ${analysisState !== 'idle' ? 'btn-disabled' : ''}`} 
            onClick={handleAnalyze}
            disabled={analysisState !== 'idle'}
          >
            {analysisState === 'analyzing' ? 'Synthesizing...' : 'Run Simulation'}
          </button>
        </div>

        {/* COLUMN 2: ENGINE */}
        <div className="demo-panel engine-panel">
          <div className={`engine-visualization ${analysisState === 'analyzing' ? 'active' : ''}`}>
            <div className="engine-line line-in">
               <div className="line-particle"></div>
            </div>
            
            <div className="engine-core-node">
              <div className="engine-rings">
                <div className="ering ering-1"></div>
                <div className="ering ering-2"></div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="engine-shield"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            
            <div className="engine-line line-out">
               <div className="line-particle"></div>
            </div>
          </div>
          
          <div className="engine-status-text">
            {analysisState === 'idle' && <div className="stage-text"><strong>AWAITING INPUT</strong><span>Select vector and run simulation</span></div>}
            {analysisState === 'analyzing' && (
              <div className="stage-text animate-fade-in" key={analysisStage}>
                <strong>{stages[analysisStage].split('\n')[0]}</strong>
                <span>{stages[analysisStage].split('\n')[1]}</span>
              </div>
            )}
            {analysisState === 'result' && <div className="stage-text"><strong>ANALYSIS COMPLETE</strong><span>Evidence Ledger generated</span></div>}
          </div>
        </div>

        {/* COLUMN 3: RESULT */}
        <div className={`demo-panel result-panel ${analysisState === 'result' ? 'visible' : 'hidden'}`}>
          <div className="result-header">
            <h4>EVIDENCE LEDGER REPORT</h4>
            <span className="result-entity">{currentData.value}</span>
          </div>
          
          <div className="result-score-block">
            <div className="score-label">TRUST ASSESSMENT</div>
            <div className={`score-value ${currentData.riskClass}`}>{currentData.score}<span className="score-max">/100</span></div>
            <div className={`score-risk ${currentData.riskClass}`}>{currentData.risk}</div>
          </div>
          
          <div className="result-stats">
            <div className="stat"><span>SIGNALS</span><strong>{currentData.signals}</strong></div>
            <div className="stat"><span>EVIDENCE</span><strong>{currentData.evidence}</strong></div>
            <div className="stat"><span>WARNINGS</span><strong>{currentData.warnings}</strong></div>
          </div>
          
          <div className="result-explainable">
            <button className="btn-expand" onClick={() => setShowWhy(!showWhy)}>
              Why this result? 
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showWhy ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`expandable-content ${showWhy ? 'open' : ''}`}>
              <div className="evidence-group">
                <h5>POSITIVE SIGNALS</h5>
                {currentData.positive.map((item, i) => (
                  <div key={`pos-${i}`} className="evidence-item">
                    {renderIcon(item.icon)}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="evidence-group">
                <h5>INVESTIGATION FINDINGS</h5>
                {currentData.review.map((item, i) => (
                  <div key={`rev-${i}`} className="evidence-item">
                    {renderIcon(item.icon)}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="result-recommendation">
            <h5>RECOMMENDATION</h5>
            <p>{currentData.recommendation}</p>
          </div>
          
          <button className="btn-reset" onClick={handleReset}>Run another simulation</button>
        </div>
      </div>
      
      <div className="demo-curious-cta">
        <p>Have an unknown contact, job offer, or document you don't fully trust?</p>
        <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#49B99A] hover:bg-[#3ea88b] text-white font-semibold text-sm transition-all shadow-md shadow-[#49B99A]/20 hover:-translate-y-0.5">
          <span>Run a real verification</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default InteractiveDemo;
