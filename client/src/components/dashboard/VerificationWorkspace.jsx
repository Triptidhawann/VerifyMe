import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  X,
  Server
} from 'lucide-react';
import { verifyEntity } from '../../services/verificationEngine';
import { auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import VerificationResult from './VerificationResult';
import './VerificationWorkspace.css';

const TABS = [
  { 
    id: 'phone', 
    icon: Phone, 
    title: 'Phone Number', 
    badge: 'E.164 Plan & Type',
    desc: 'Inspect number format, regional numbering plan & line-type risks',
    placeholder: 'Enter phone number (e.g. 9915108159 or +1 415 555 2671)',
    presets: ['9915108159', '+1 415 555 2671', '+44 20 7946 0958']
  },
  { 
    id: 'email', 
    icon: Mail, 
    title: 'Email Address', 
    badge: 'DNS • MX • DMARC',
    desc: 'Inspect domain DNS, mail exchange records & anti-spoofing policies',
    placeholder: 'Enter email address (e.g. security@paypal.com)',
    presets: ['security@paypal.com', 'support@apple.com', 'billing@fast-verify.xyz']
  },
  { 
    id: 'website', 
    icon: Globe, 
    title: 'Website Domain', 
    badge: 'DNS • TLS • Reachability',
    desc: 'Inspect domain DNS, TLS certificate validity & HTTP reachability',
    placeholder: 'Enter URL (e.g. https://google.com or secure-login-bank.top)',
    presets: ['https://google.com', 'https://github.com', 'https://secure-login-appleid.top']
  }
];

const SCAN_STEPS = [
  'Extracting deterministic network signals...',
  'Resolving authoritative registries & infrastructure records...',
  'Evaluating risk indicators & anomaly thresholds...',
  'Synthesizing AI threat interpretation...'
];

const VerificationWorkspace = ({ onVerificationComplete }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('phone');
  const [inputValue, setInputValue] = useState('');
  
  // 'idle' | 'analyzing' | 'result'
  const [viewState, setViewState] = useState('idle');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const cardRef = useRef(null);

  // Dynamic card sheen following cursor
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cardRef.current.style.setProperty('--mouse-x', `${x}px`);
      cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    const node = cardRef.current;
    if (node) {
      node.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      if (node) {
        node.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setInputValue('');
    setError('');
  };

  const handlePresetSelect = (preset) => {
    setInputValue(preset);
  };

  const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0];

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue || !inputValue.trim()) {
      setError('Please provide an identifier to verify.');
      return;
    }

    setError('');
    setViewState('analyzing');
    setActiveStepIndex(0);

    // Staged step progression
    const stepInterval = setInterval(() => {
      setActiveStepIndex(prev => {
        if (prev < SCAN_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      let token = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const analysisResult = await verifyEntity({
        type: activeTab,
        value: inputValue.trim(),
        token
      });
      
      clearInterval(stepInterval);
      setResult(analysisResult);
      setViewState('result');
      
      if (onVerificationComplete) {
        onVerificationComplete();
      }
      
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Verification pipeline encountered a connectivity disruption. Please retry.');
      setViewState('idle');
    }
  };

  const handleReset = () => {
    setViewState('idle');
    setInputValue('');
    setResult(null);
    setError('');
  };

  return (
    <div ref={cardRef} className="workspace-card-root">
      <div className="workspace-ambient-sheen" />

      {viewState === 'idle' && (
        <div className="workspace-interactive-pane fadeIn">
          {/* Target Tabs Selection */}
          <div className="workspace-tabs-header">
            <span className="workspace-micro-label">SELECT TARGET VECTOR</span>
            <div className="target-tabs-grid">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`target-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <div className="tab-icon-wrapper">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="tab-meta">
                      <div className="tab-meta-title-row">
                        <span className="tab-title-text">{tab.title}</span>
                        <span className="tab-badge">{tab.badge}</span>
                      </div>
                      <span className="tab-desc-text">{tab.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Input Area */}
          <form className="workspace-input-form" onSubmit={handleVerify}>
            <div className="workspace-form-top">
              <span className="workspace-micro-label">INPUT IDENTIFIER</span>
              
              {/* Quick Fill Presets */}
              <div className="quick-presets-row">
                <span className="presets-label">Quick Samples:</span>
                {activeTabData.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-chip"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="workspace-input-container">
              <div className="input-target-icon">
                {activeTab === 'phone' && <Phone className="w-5 h-5 text-[#174C3C]" />}
                {activeTab === 'email' && <Mail className="w-5 h-5 text-[#174C3C]" />}
                {activeTab === 'website' && <Globe className="w-5 h-5 text-[#174C3C]" />}
              </div>

              <input
                type={activeTab === 'email' ? 'email' : 'text'}
                className="target-text-input"
                placeholder={activeTabData.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />

              {inputValue && (
                <button
                  type="button"
                  className="input-clear-btn"
                  onClick={() => setInputValue('')}
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button type="submit" className="workspace-submit-btn">
                <span>Analyze Entity</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {error && (
              <div className="workspace-error-banner">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#B45309]" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Feature highlights bar */}
          <div className="workspace-feature-strip">
            <div className="feature-pill">
              <ShieldCheck className="w-4 h-4 text-[#15803D]" />
              <span>Full E.164 National/International Invariance</span>
            </div>
            <div className="feature-pill">
              <Server className="w-4 h-4 text-[#174C3C]" />
              <span>Authoritative DNS & MX Querying</span>
            </div>
            <div className="feature-pill">
              <Zap className="w-4 h-4 text-[#174C3C]" />
              <span>Deterministic Fail-Safe Fallbacks</span>
            </div>
          </div>
        </div>
      )}

      {/* SCANNING / ANALYZING STATE */}
      {viewState === 'analyzing' && (
        <div className="workspace-analyzing-pane fadeIn">
          <div className="radar-scanner-wrapper">
            <div className="radar-ring r1" />
            <div className="radar-ring r2" />
            <div className="radar-ring r3" />
            <div className="radar-sweep" />
            <div className="radar-core-icon">
              <Search className="w-8 h-8 text-[#174C3C] animate-pulse" />
            </div>
          </div>

          <div className="analyzing-header-info">
            <span className="analyzing-pill">Telemetry Scan in Progress</span>
            <h3 className="analyzing-target-text">{inputValue}</h3>
            <p className="analyzing-target-sub">
              Executing multi-stage deterministic signal extraction & threat synthesis...
            </p>
          </div>

          <div className="scan-steps-progress">
            {SCAN_STEPS.map((step, idx) => {
              const isDone = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              return (
                <div 
                  key={idx} 
                  className={`scan-step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="step-indicator">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    ) : (
                      <span className="step-dot" />
                    )}
                  </div>
                  <span className="step-text">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESULT STATE */}
      {viewState === 'result' && result && (
        <VerificationResult result={result} onVerifyAnother={handleReset} />
      )}
    </div>
  );
};

export default VerificationWorkspace;
