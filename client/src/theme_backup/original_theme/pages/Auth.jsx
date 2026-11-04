import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import './Auth.css';

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup, resetPassword, loginWithGoogle, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup' | 'forgot'
  
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
  const [resetSuccess, setResetSuccess] = useState('');

  // Status & Visibility
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const cardRef = useRef(null);

  // Dynamic Card Sheen on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cardRef.current.style.setProperty('--mouse-x', `${x}px`);
      cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sync tab with URL
  useEffect(() => {
    if (location.pathname === '/signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('login');
    }
  }, [location.pathname]);

  // If user is already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
    setResetSuccess('');
    if (tab === 'login' || tab === 'signup') {
      window.history.pushState(null, '', `/${tab}`);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !signupEmail.trim() || !signupPassword || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(name.trim(), signupEmail.trim(), signupPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Failed to initialize account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');

    if (!resetEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(resetEmail.trim());
      setResetSuccess('Recovery instructions dispatched. Please check your inbox.');
    } catch (err) {
      setError(err || 'Failed to transmit reset email. Verify your address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-portal-root">
      {/* Background Visual Elements */}
      <div className="auth-mesh-grid" />
      <div className="auth-ambient-glow" />

      {/* Top Navigation */}
      <header className="auth-nav-bar">
        <Link to="/" className="auth-back-pill" title="Return to Home">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link to="/" className="auth-brand-logo">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <span>Verify<span className="text-indigo-400">Me</span></span>
        </Link>
        <div className="auth-status-chip">
          <span className="status-ping" />
          <span>Threat Engine v2.4 Active</span>
        </div>
      </header>

      {/* Main Interactive Auth Card */}
      <main className="auth-main-wrapper">
        <div ref={cardRef} className="auth-skeuo-card">
          <div className="card-ambient-sheen" />

          {/* Segmented Tab Switcher */}
          {activeTab !== 'forgot' && (
            <div className="auth-segmented-tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('signup')}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Error & Success Feedback */}
          {error && (
            <div className="auth-alert error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="auth-alert success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <div className="auth-pane fadeIn">
              <div className="auth-pane-header">
                <h2>Welcome Back</h2>
                <p>Sign in to your digital intelligence workspace.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="auth-fields-form">
                <div className="auth-input-group">
                  <label htmlFor="login-email">Email Address</label>
                  <div className="input-box">
                    <Mail className="input-icon" />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="name@organization.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <div className="label-with-action">
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => handleTabSwitch('forgot')}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="input-box">
                    <Lock className="input-icon" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-primary-btn"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner-dot" /> Authenticating...
                    </span>
                  ) : (
                    'Sign In to Workspace →'
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
              </div>

              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* TAB 2: SIGN UP */}
          {activeTab === 'signup' && (
            <div className="auth-pane fadeIn">
              <div className="auth-pane-header">
                <h2>Create Account</h2>
                <p>Equip yourself with automated digital verification.</p>
              </div>

              <form onSubmit={handleSignupSubmit} className="auth-fields-form">
                <div className="auth-input-group">
                  <label htmlFor="signup-name">Full Name</label>
                  <div className="input-box">
                    <User className="input-icon" />
                    <input
                      id="signup-name"
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="signup-email">Work or Personal Email</label>
                  <div className="input-box">
                    <Mail className="input-icon" />
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="jane@organization.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="auth-grid-row">
                  <div className="auth-input-group">
                    <label htmlFor="signup-password">Password</label>
                    <div className="input-box">
                      <Lock className="input-icon" />
                      <input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="eye-toggle"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        tabIndex={-1}
                      >
                        {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label htmlFor="confirm-password">Confirm</label>
                    <div className="input-box">
                      <Lock className="input-icon" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="eye-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-primary-btn"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner-dot" /> Provisioning Workspace...
                    </span>
                  ) : (
                    'Initialize Free Workspace →'
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>OR SIGN UP WITH</span>
              </div>

              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="auth-pane fadeIn">
              <div className="auth-pane-header">
                <h2>Reset Password</h2>
                <p>Enter your account email to receive cryptographic password recovery instructions.</p>
              </div>

              <form onSubmit={handleForgotSubmit} className="auth-fields-form">
                <div className="auth-input-group">
                  <label htmlFor="reset-email">Registered Email Address</label>
                  <div className="input-box">
                    <Mail className="input-icon" />
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="name@organization.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-primary-btn"
                >
                  {isSubmitting ? 'Transmitting Instructions...' : 'Send Recovery Link'}
                </button>

                <button
                  type="button"
                  className="auth-secondary-btn"
                  onClick={() => handleTabSwitch('login')}
                >
                  Return to Sign In
                </button>
              </form>
            </div>
          )}

          {/* Physical Skeuomorphic Security Badge */}
          <div className="auth-security-footer">
            <div className="footer-badge">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-Bit Encrypted Session</span>
            </div>
            <div className="footer-badge">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enterprise RBAC Guarded</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
