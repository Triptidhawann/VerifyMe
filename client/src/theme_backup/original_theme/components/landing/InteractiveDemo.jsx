import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
      { text: "Valid carrier assigned", icon: "check" },
      { text: "Line type is mobile", icon: "check" }
    ],
    review: [
      { text: "Recent porting activity detected", icon: "alert" },
      { text: "No linked public records found", icon: "alert" }
    ],
    recommendation: "Exercise caution. Verify identity via secondary channel."
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
      { text: "Domain is registered and active", icon: "check" },
      { text: "Valid MX records configured", icon: "check" },
      { text: "Not found in recent breaches", icon: "check" }
    ],
    review: [
      { text: "Domain age is under 1 year", icon: "alert" }
    ],
    recommendation: "Proceed with normal caution."
  },
  website: {
    label: "Website URL",
    value: "https://example-demo.com",
    score: 18,
    risk: "HIGH RISK",
    riskClass: "danger",
    signals: 8,
    evidence: 5,
    warnings: 4,
    positive: [
      { text: "HTTPS configured", icon: "check" }
    ],
    review: [
      { text: "Domain registered in the last 7 days", icon: "danger" },
      { text: "Hidden WHOIS registration", icon: "danger" },
      { text: "Associated with known phishing IP block", icon: "danger" }
    ],
    recommendation: "Block immediately. Do not interact."
  }
};

const stages = [
  "INPUT RECEIVED\nEntity captured",
  "COLLECTING SIGNALS\nGathering available evidence",
  "CORRELATING EVIDENCE\nComparing related signals",
  "ASSESSING RISK\nEvaluating trust indicators",
  "ASSESSMENT READY\nGenerating explainable report"
];

const InteractiveDemo = () => {
  const [activeTab, setActiveTab] = useState('email');
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
    if (type === 'check') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
    if (type === 'alert') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
    if (type === 'danger') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger-color, #EF4444)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
  };

  return (
    <div className="interactive-demo-container">
      
      <div className="demo-grid">
        
        {/* COLUMN 1: INPUT */}
        <div className="demo-panel input-panel">
          <div className="demo-header">
            <span className="demo-badge">Interactive Demo</span>
          </div>
          
          <div className="demo-tabs">
            <button className={`demo-tab ${activeTab === 'phone' ? 'active' : ''}`} onClick={() => handleTabChange('phone')} disabled={analysisState === 'analyzing'}>Phone</button>
            <button className={`demo-tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => handleTabChange('email')} disabled={analysisState === 'analyzing'}>Email</button>
            <button className={`demo-tab ${activeTab === 'website' ? 'active' : ''}`} onClick={() => handleTabChange('website')} disabled={analysisState === 'analyzing'}>Website</button>
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
            {analysisState === 'analyzing' ? 'Analyzing...' : 'Analyze'}
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
            {analysisState === 'idle' && <div className="stage-text"><strong>AWAITING INPUT</strong><span>Select entity and analyze</span></div>}
            {analysisState === 'analyzing' && (
              <div className="stage-text animate-fade-in" key={analysisStage}>
                <strong>{stages[analysisStage].split('\n')[0]}</strong>
                <span>{stages[analysisStage].split('\n')[1]}</span>
              </div>
            )}
            {analysisState === 'result' && <div className="stage-text"><strong>ANALYSIS COMPLETE</strong><span>Result generated</span></div>}
          </div>
        </div>

        {/* COLUMN 3: RESULT */}
        <div className={`demo-panel result-panel ${analysisState === 'result' ? 'visible' : 'hidden'}`}>
          <div className="result-header">
            <h4>VERIFICATION RESULT</h4>
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
              <svg className={showWhy ? 'rotated' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
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
                <h5>REVIEW SIGNALS</h5>
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
          
          <button className="btn-reset" onClick={handleReset}>Run another analysis</button>
        </div>
      </div>
      
      <div className="demo-curious-cta">
        <p>Have something you don't fully trust?</p>
        <Link to="/signup" className="btn">Run a real verification →</Link>
      </div>
    </div>
  );
};

export default InteractiveDemo;
