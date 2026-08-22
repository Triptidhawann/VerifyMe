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

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signup, resetPassword, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Password Visibility State
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ... (keep useEffects) ...

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Failed to sign in with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    if (activeTab === tab) return;
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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await resetPassword(resetEmail);
      // Show success message inside error div for now
      setError('Password reset instructions sent. Please check your email.');
    } catch (err) {
      setError(err || 'Failed to send reset instructions');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Carousel Logic
  const tabs = ['signup', 'login', 'forgot'];
  const activeIndex = tabs.indexOf(activeTab);

  const getCardClass = (tabName) => {
    const tabIndex = tabs.indexOf(tabName);
    const diff = tabIndex - activeIndex;
    if (diff === 0) return 'card-center';
    if (diff === -1) return 'card-left';
    if (diff === 1) return 'card-right';
    if (diff < -1) return 'card-hidden-left';
    if (diff > 1) return 'card-hidden-right';
    return '';
  };

  return (
    <div className="auth-stack-container">
      {/* Ambient Background Elements */}
      <div className="auth-bg-grid"></div>
      <div className="auth-bg-glow"></div>
      
      {/* Top Left Back Button (Matching the Reference) */}
      <Link to="/" className="auth-big-back">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </Link>

      {/* Large Central Header */}
      <div className="auth-main-header">
        <div className="auth-tagline">Introducing</div>
        <h1 className="auth-big-title">VerifyMe</h1>
        <p className="auth-sub-title">The world's most advanced verification engine,<br/>powered by AI Trust Signals.</p>
      </div>

      {/* 3D Stacked Cards Wrapper */}
      <div className="card-stack-wrapper">
        
        {/* ========================================= */}
        {/* CARD 1: SIGN UP (Index 0) */}
        {/* ========================================= */}
        <div className={`premium-auth-card ${getCardClass('signup')}`}>
          {activeTab !== 'signup' && <div className="card-click-overlay" onClick={() => handleTabSwitch('signup')}></div>}
          
          <div className="card-header">
            <div className="card-logo">Verify<span>Me</span></div>
            <h2>Create account</h2>
            <p>Start investigating digital trust.</p>
          </div>
          
          {error && activeTab === 'signup' && <div className="premium-error">{error}</div>}

          <form onSubmit={handleSignupSubmit} className="premium-form">
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" disabled={isSubmitting} />
            </div>

            <div className="form-group">
              <label htmlFor="signupEmail">Email address</label>
              <input type="email" id="signupEmail" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="name@company.com" disabled={isSubmitting} />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signupPassword">Password</label>
                <div className="input-with-icon">
                  <input type={showSignupPassword ? "text" : "password"} id="signupPassword" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="••••••••" disabled={isSubmitting} />
                  <button type="button" className="btn-toggle-pass" onClick={() => setShowSignupPassword(!showSignupPassword)} tabIndex="-1">
                    {showSignupPassword ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm</label>
                <div className="input-with-icon">
                  <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={isSubmitting} />
                  <button type="button" className="btn-toggle-pass" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex="-1">
                    {showConfirmPassword ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
                  </button>
                </div>
              </div>
            </div>
            
            <button type="submit" className="btn-primary-auth" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Profile...' : 'Continue'}
            </button>

            <div className="auth-separator">
              <span>OR</span>
            </div>
            
            <button type="button" className="btn-secondary-auth" onClick={handleGoogleLogin} disabled={isSubmitting}>
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="card-footer">
            <span>Already have an account?</span>
            <button type="button" className="btn-link" onClick={() => handleTabSwitch('login')}>Sign in</button>
          </div>
        </div>

        {/* ========================================= */}
        {/* CARD 2: LOGIN (Index 1) */}
        {/* ========================================= */}
        <div className={`premium-auth-card ${getCardClass('login')}`}>
          {activeTab !== 'login' && <div className="card-click-overlay" onClick={() => handleTabSwitch('login')}></div>}
          
          <div className="card-header">
            <div className="card-logo">Verify<span>Me</span></div>
            <h2>Sign in to VerifyMe</h2>
            <p>Log in to continue to your workspace.</p>
          </div>
          
          {error && activeTab === 'login' && <div className="premium-error">{error}</div>}

          <form onSubmit={handleLoginSubmit} className="premium-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" disabled={isSubmitting} />
            </div>
            
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <button type="button" className="forgot-link" onClick={() => handleTabSwitch('forgot')}>Forgot password?</button>
              </div>
              <div className="input-with-icon">
                <input type={showLoginPassword ? "text" : "password"} id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={isSubmitting} />
                <button type="button" className="btn-toggle-pass" onClick={() => setShowLoginPassword(!showLoginPassword)} tabIndex="-1">
                  {showLoginPassword ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn-primary-auth" disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating...' : 'Continue'}
            </button>
            
            <div className="auth-separator">
              <span>OR</span>
            </div>
            
            <button type="button" className="btn-secondary-auth" onClick={handleGoogleLogin} disabled={isSubmitting}>
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="card-footer">
            <span>Don't have an account?</span>
            <button type="button" className="btn-link" onClick={() => handleTabSwitch('signup')}>Sign up</button>
          </div>
        </div>

        {/* ========================================= */}
        {/* CARD 3: FORGOT PASSWORD (Index 2) */}
        {/* ========================================= */}
        <div className={`premium-auth-card ${getCardClass('forgot')}`}>
          {activeTab !== 'forgot' && <div className="card-click-overlay" onClick={() => handleTabSwitch('forgot')}></div>}
          
          <div className="card-header">
            <div className="card-logo">Verify<span>Me</span></div>
            <h2>Reset Password</h2>
            <p>We'll send you instructions to recover your account.</p>
          </div>
          
          {error && activeTab === 'forgot' && <div className="premium-error">{error}</div>}

          <form onSubmit={handleForgotSubmit} className="premium-form">
            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
              <label htmlFor="resetEmail">Email address</label>
              <input type="email" id="resetEmail" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="name@company.com" disabled={isSubmitting} />
            </div>
            
            <button type="submit" className="btn-primary-auth">
              Send Reset Link
            </button>
          </form>

          <div className="card-footer">
            <span>Remember your password?</span>
            <button type="button" className="btn-link" onClick={() => handleTabSwitch('login')}>Sign in</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
