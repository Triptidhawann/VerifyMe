import React, { useState } from 'react';
import { Phone, Mail, Link as LinkIcon, Shield, Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { verifyEntity } from '../../services/verificationEngine';
import { db, auth } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import VerificationResult from './VerificationResult';
import './VerificationWorkspace.css';

const tabs = [
  { 
    id: 'phone', 
    icon: Phone, 
    title: 'Phone Number', 
    desc: 'Check an unknown caller',
    placeholder: 'Enter phone number (e.g. +1 555 123 4567)'
  },
  { 
    id: 'email', 
    icon: Mail, 
    title: 'Email Address', 
    desc: 'Understand the sender',
    placeholder: 'Enter email address'
  },
  { 
    id: 'website', 
    icon: LinkIcon, 
    title: 'Website URL', 
    desc: 'Inspect before you click',
    placeholder: 'https://example.com'
  }
];

const VerificationWorkspace = ({ onVerificationComplete }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('phone');
  const [inputValue, setInputValue] = useState('');
  
  // States: 'idle', 'analyzing', 'result'
  const [viewState, setViewState] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const activeTabData = tabs.find(t => t.id === activeTab);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setInputValue('');
    setError('');
    setViewState('idle');
    setResult(null);
  };

  const validateInput = () => {
    if (!inputValue.trim()) return 'Please enter a value to verify.';
    
    if (activeTab === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputValue)) return 'Please enter a valid email address.';
    }
    
    if (activeTab === 'website') {
      try {
        new URL(inputValue.startsWith('http') ? inputValue : `https://${inputValue}`);
      } catch (e) {
        return 'Please enter a valid website URL.';
      }
    }

    if (activeTab === 'phone') {
      if (!/\d/.test(inputValue)) return 'Please enter a valid phone number containing digits.';
    }

    return null;
  };

  const saveToHistory = async (analysisResult) => {
    if (!user) return;
    try {
      const verificationsRef = collection(db, 'users', user.uid, 'verifications');
      await addDoc(verificationsRef, {
        ...analysisResult,
        createdAt: serverTimestamp()
      });
      // Notify parent to refresh history
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (err) {
      console.error("Failed to save verification to history:", err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    setViewState('analyzing');

    try {
      let token = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const analysisResult = await verifyEntity({
        type: activeTab,
        value: inputValue,
        token
      });
      
      setResult(analysisResult);
      setViewState('result');
      
      // Fire and forget save
      saveToHistory(analysisResult);
      
    } catch (err) {
      setError(err.message || 'An error occurred connecting to the verification engine. Please try again.');
      setViewState('idle');
    }
  };

  const handleReset = () => {
    setViewState('idle');
    setInputValue('');
    setResult(null);
  };

  return (
    <div className="verify-tool-card">
      {viewState === 'idle' && (
        <>
          <div className="workspace-section-label">INVESTIGATION TYPE</div>
          
          <div className="verify-tabs">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <div 
                  key={tab.id}
                  className={`verify-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <div className="tab-icon"><Icon size={20} /></div>
                  <div className="tab-title">{tab.title}</div>
                </div>
              );
            })}
          </div>

          <form className="verify-form" onSubmit={handleVerify}>
            <div className="workspace-section-label" style={{ marginTop: '2rem' }}>TARGET</div>
            <div className="verify-input-group">
              <input
                type={activeTab === 'email' ? 'email' : 'text'}
                className="verify-input"
                placeholder={activeTabData.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            {error && (
              <div className="verify-error">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn verify-btn">
              Analyze Intelligence →
            </button>
          </form>
        </>
      )}

      {viewState === 'analyzing' && (
        <div className="analyzing-state">
          <div className="scanner-container">
            <div className="security-ring pulse"></div>
            <Search className="search-icon scanning" size={32} />
          </div>
          <h3>Analyzing Entity</h3>
          <p className="analyzing-value">{inputValue}</p>
          
          <div className="analysis-steps">
            <div className="step processing">Extracting signals...</div>
            <div className="step pending">Evaluating risk indicators...</div>
            <div className="step pending">Synthesizing intelligence...</div>
          </div>
        </div>
      )}

      {viewState === 'result' && result && (
        <VerificationResult result={result} onVerifyAnother={handleReset} />
      )}
    </div>
  );
};

export default VerificationWorkspace;
