import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  Globe, 
  ArrowRight,
  X,
  AlertCircle
} from 'lucide-react';
import { verifyEntity } from '../../services/verificationEngine';
import { auth } from '../../firebase/config';
import VerificationResult from './VerificationResult';
import VerifyMeLoader from '../auth/VerifyMeLoader';
import './VerificationWorkspace.css';

const TABS = [
  { 
    id: 'phone', 
    icon: Phone, 
    title: 'Phone Number', 
    label: 'Phone number',
    desc: 'Verify format, carrier & toll line risk',
    placeholder: 'Enter phone number (e.g. +1 415 555 2671 or 9915108159)',
    presets: ['9915108159', '+1 415 555 2671', '+44 20 7946 0958']
  },
  { 
    id: 'email', 
    icon: Mail, 
    title: 'Email Address', 
    label: 'Email address',
    desc: 'Verify domain, mail servers & anti-spoofing policies',
    placeholder: 'Enter email address (e.g. security@paypal.com)',
    presets: ['security@paypal.com', 'support@apple.com', 'billing@fast-verify.xyz']
  },
  { 
    id: 'website', 
    icon: Globe, 
    title: 'Website', 
    label: 'Website URL or domain',
    desc: 'Verify domain, HTTPS & security certificate integrity',
    placeholder: 'Enter website URL (e.g. https://google.com or brand-login.top)',
    presets: ['https://google.com', 'https://github.com', 'https://secure-login-appleid.top']
  }
];

const SCAN_STEPS = [
  'Checking technical signals',
  'Reviewing available evidence',
  'Preparing your result'
];

export const VerificationWorkspace = ({ onVerificationComplete }) => {
  const [activeTab, setActiveTab] = useState('phone');
  const [inputValue, setInputValue] = useState('');
  
  // 'idle' | 'analyzing' | 'result'
  const [viewState, setViewState] = useState('idle');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setInputValue('');
    setError('');
  };

  const handlePresetSelect = (preset) => {
    setInputValue(preset);
    setError('');
  };

  const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0];
  const ActiveIcon = activeTabData.icon;

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const trimmedInput = inputValue ? inputValue.trim() : '';
    if (!trimmedInput) {
      setError('Please provide an identifier to verify.');
      return;
    }

    setError('');
    setViewState('analyzing');
    setActiveStepIndex(0);

    // Dynamic rotating status indicator
    const stepInterval = setInterval(() => {
      setActiveStepIndex(prev => (prev + 1) % SCAN_STEPS.length);
    }, 750);

    try {
      let token = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const analysisResult = await verifyEntity({
        type: activeTab,
        value: trimmedInput,
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
      setError(err.message || 'Verification pipeline encountered a disruption. Please retry.');
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
    <div className="workspace-card-root">
      {viewState === 'idle' && (
        <div className="workspace-interactive-pane fadeIn">
          {/* Compact, elegant segmented verification selector */}
          <div className="workspace-type-selector" role="tablist" aria-label="Verification Target Selection">
            {TABS.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`workspace-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span className="workspace-tab-text">{tab.title}</span>
                </button>
              );
            })}
          </div>

          {/* Form Input Area */}
          <form className="workspace-input-form" onSubmit={handleVerify} noValidate>
            <div className="workspace-field-group">
              <label htmlFor="workspace-target-input" className="workspace-input-label">
                {activeTabData.label}
              </label>

              <div className="workspace-input-wrapper">
                <span className="workspace-input-leading-icon" aria-hidden="true">
                  <ActiveIcon className="w-5 h-5 text-[#94A098]" />
                </span>

                <input
                  id="workspace-target-input"
                  type={activeTab === 'email' ? 'email' : 'text'}
                  className="workspace-text-input"
                  placeholder={activeTabData.placeholder}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (error) setError('');
                  }}
                  autoComplete="off"
                />

                {inputValue && (
                  <button
                    type="button"
                    className="workspace-clear-btn"
                    onClick={() => setInputValue('')}
                    title="Clear input"
                    aria-label="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button 
                  type="submit" 
                  className="workspace-submit-btn"
                  disabled={!inputValue.trim()}
                >
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Presets / Examples */}
            <div className="workspace-presets-row">
              <span className="workspace-presets-label">Examples:</span>
              <div className="workspace-presets-list">
                {activeTabData.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="workspace-preset-chip"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="workspace-error-banner" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* VERIFYME LOADER / PROCESSING EXPERIENCE */}
      {viewState === 'analyzing' && (
        <div className="workspace-analyzing-pane fadeIn" role="status" aria-live="polite">
          <div className="analyzing-loader-box">
            <VerifyMeLoader size="lg" variant="mint" label="Analyzing target..." />
          </div>

          <div className="analyzing-content">
            <div className="analyzing-target-badge">
              <ActiveIcon className="w-3.5 h-3.5" />
              <span>{activeTabData.title}</span>
            </div>
            <h3 className="analyzing-target-value">{inputValue}</h3>
            <p className="analyzing-status-message">
              {SCAN_STEPS[activeStepIndex]}...
            </p>
          </div>
        </div>
      )}

      {/* VERIFICATION RESULT STATE */}
      {viewState === 'result' && result && (
        <VerificationResult result={result} onVerifyAnother={handleReset} />
      )}
    </div>
  );
};

export default VerificationWorkspace;
