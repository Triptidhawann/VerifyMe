import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('phone');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const tabs = [
    { 
      id: 'phone', 
      icon: '☎️', 
      title: 'Phone Number', 
      desc: 'Check an unknown caller',
      placeholder: 'Enter phone number (e.g. +1 555 123 4567)'
    },
    { 
      id: 'email', 
      icon: '✉️', 
      title: 'Email Address', 
      desc: 'Understand the sender',
      placeholder: 'Enter email address'
    },
    { 
      id: 'website', 
      icon: '🔗', 
      title: 'Website URL', 
      desc: 'Inspect before you click',
      placeholder: 'https://example.com'
    }
  ];

  const handleTabChange = (id) => {
    setActiveTab(id);
    setInputValue('');
    setError('');
    setSuccessMsg('');
  };

  const validateInput = () => {
    if (!inputValue.trim()) {
      return 'Please enter a value to verify.';
    }
    
    if (activeTab === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputValue)) {
        return 'Please enter a valid email address.';
      }
    }
    
    if (activeTab === 'website') {
      try {
        new URL(inputValue.startsWith('http') ? inputValue : `https://${inputValue}`);
      } catch (e) {
        return 'Please enter a valid website URL.';
      }
    }

    if (activeTab === 'phone') {
      // Basic check: must contain numbers
      if (!/\d/.test(inputValue)) {
        return 'Please enter a valid phone number containing digits.';
      }
    }

    return null;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Phase 4A: Hooking up the real POST endpoint to create the record
      const response = await api.postWithAuth('/verifications', {
        type: activeTab,
        input: inputValue
      }, token);

      if (response.success) {
        setSuccessMsg('Verification engine is being prepared. Your input is valid and securely logged for future analysis.');
        setInputValue('');
      } else {
        setError(response.message || 'Failed to submit verification.');
      }
    } catch (err) {
      setError(err || 'An error occurred connecting to the verification engine.');
    } finally {
      setLoading(false);
    }
  };

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Link to="/" className="logo">Verify<span>Me</span></Link>
          
          <div className="dash-nav-links">
            <span className="dash-link active">Verify</span>
            <span className="dash-link">History</span>
            <span className="dash-link">Profile</span>
          </div>

          <div>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="workspace container">
        <div className="workspace-header">
          <h1>Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}</h1>
          <p>Understand before you trust.</p>
        </div>

        {/* Verification Workspace */}
        <div className="verify-tool-card">
          <h2>What do you want to verify?</h2>
          
          <div className="verify-tabs">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={`verify-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <div className="tab-icon">{tab.icon}</div>
                <div className="tab-title">{tab.title}</div>
                <div className="tab-desc">{tab.desc}</div>
              </div>
            ))}
          </div>

          <form className="verify-form" onSubmit={handleVerify}>
            <div className="verify-input-group">
              <input
                type={activeTab === 'email' ? 'email' : 'text'}
                className="verify-input"
                placeholder={activeTabData.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <div className="error-message" style={{ textAlign: 'center' }}>{error}</div>}

            <button type="submit" className="btn verify-btn" disabled={loading}>
              {loading ? 'Submitting to engine...' : 'Verify →'}
            </button>

            {successMsg && (
              <div className="verify-status-msg">
                <strong>[DEVELOPMENT PREVIEW]</strong><br />
                {successMsg}
              </div>
            )}
          </form>
        </div>

        {/* History Section */}
        <section className="history-section">
          <h2>Recent Verification</h2>
          <div className="empty-history">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No verifications yet.</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto' }}>
              Your verification history will appear here after you check your first phone number, email, or website.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
