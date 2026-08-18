import { useState } from 'react';
import './VerificationWidget.css';

const VerificationWidget = () => {
  const [activeTab, setActiveTab] = useState('phone');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const tabs = [
    { id: 'phone', label: '☎ Phone', placeholder: '+1 (555) 000-0000' },
    { id: 'email', label: '✉ Email', placeholder: 'someone@example.com' },
    { id: 'website', label: '◉ Website', placeholder: 'https://example.com' }
  ];

  const handleTabChange = (id) => {
    setActiveTab(id);
    setInputValue('');
    setResult(null);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setResult(null);

    // Mock API call delay
    setTimeout(() => {
      setLoading(false);
      setResult('Verification engine coming in Phase 4. Placeholder result only.');
    }, 1500);
  };

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="widget-container animate-fade-up delay-200">
      <div className="widget-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`widget-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form className="widget-form" onSubmit={handleVerify}>
        <div className="widget-input-wrapper">
          <input
            type={activeTab === 'email' ? 'email' : 'text'}
            className="widget-input"
            placeholder={activeTabData.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn widget-btn" disabled={loading || !inputValue.trim()}>
          {loading ? (
            <><span className="spinner"></span> Analyzing...</>
          ) : (
            'Verify →'
          )}
        </button>

        {result && (
          <div className="widget-result">
            <strong>{activeTabData.label.split(' ')[1]} Analysis:</strong> <br />
            {result}
          </div>
        )}
      </form>
    </div>
  );
};

export default VerificationWidget;
