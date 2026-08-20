import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Auth = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup State
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Determine initial tab based on route
    if (location.pathname === '/signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('login');
    }
  }, [location.pathname]);
  
  useEffect(() => {
    // If user is already logged in, redirect immediately
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError(''); // Clear errors when switching
    // Update URL without refreshing to match state
    window.history.pushState(null, '', `/${tab}`);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !signupEmail || !signupPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(name, signupEmail, signupPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-split-container">
      {/* LEFT SIDE: Visual */}
      <div className="auth-visual-side">
        <Link to="/" className="logo" style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
          Verify<span>Me</span>
        </Link>
        
        <div className="auth-visual-content animate-fade-up">
          <div className="auth-mock-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
                VM
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Verification Engine</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status: Active</div>
              </div>
              <div style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                SECURE
              </div>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: 'var(--accent-primary)' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>Identity Signals connected</span>
              <span>100%</span>
            </div>
          </div>

          <h1 className="auth-visual-title">
            Your trust journey <br/><span>starts here.</span>
          </h1>
          <p className="auth-visual-subtitle">
            Verify identities, inspect links, and make evidence-based decisions before you trust.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="auth-form-side">
        <Link to="/" className="back-link">← Back to Home</Link>
        
        <div className="auth-form-header">
          <h2>Welcome Back</h2>
          <p>Ready to continue your verification quest?</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('login')}
            type="button"
          >
            Login
          </button>
          <button 
            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('signup')}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="animate-fade-up">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label htmlFor="password">Password</label>
                <a href="#" style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
            
            <button type="submit" className="btn" disabled={isSubmitting} style={{ width: '100%', padding: '1rem' }}>
              {isSubmitting ? 'Authenticating...' : 'Enter Platform'}
            </button>
          </form>
        ) : (
          /* SIGNUP FORM */
          <form onSubmit={handleSignupSubmit} className="animate-fade-up">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="signupEmail">Email Address</label>
              <input
                type="email"
                id="signupEmail"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signupPassword">Password</label>
              <input
                type="password"
                id="signupPassword"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="•••••••• (Min 6 chars)"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
            
            <button type="submit" className="btn" disabled={isSubmitting} style={{ width: '100%', padding: '1rem' }}>
              {isSubmitting ? 'Creating Profile...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
