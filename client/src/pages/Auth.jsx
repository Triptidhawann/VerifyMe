import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  User, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Check 
} from 'lucide-react';

import AuthLayout from '../components/auth/AuthLayout';
import FormField from '../components/auth/FormField';
import PasswordInput from '../components/auth/PasswordInput';
import GoogleButton from '../components/auth/GoogleButton';
import AuthButton from '../components/auth/AuthButton';
import './Auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup, resetPassword, loginWithGoogle, user } = useAuth();

  // Active view: 'login' | 'signup' | 'forgot'
  const [activeTab, setActiveTab] = useState('login');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Form submission & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Sync tab with URL on mount or location change
  useEffect(() => {
    if (location.pathname === '/signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('login');
    }
  }, [location.pathname]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Tab switching with URL synchronization
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setAuthError('');
    setFieldErrors({});
    setResetSuccess('');
    if (tab === 'login' || tab === 'signup') {
      window.history.pushState(null, '', `/${tab}`);
    }
  };

  // Clear errors when user edits inputs
  const clearError = (fieldName) => {
    if (authError) setAuthError('');
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  // Sign In submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const errors = {};

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      errors.loginEmail = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.loginEmail = 'Please enter a valid email address.';
    }

    if (!loginPassword) {
      errors.loginPassword = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await login(trimmedEmail, loginPassword);
      navigate('/dashboard');
    } catch (err) {
      setAuthError(typeof err === 'string' ? err : 'Unable to sign in. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const errors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    }

    const trimmedEmail = signupEmail.trim();
    if (!trimmedEmail) {
      errors.signupEmail = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.signupEmail = 'Please enter a valid email address.';
    }

    if (!signupPassword) {
      errors.signupPassword = 'Password is required.';
    } else if (signupPassword.length < 6) {
      errors.signupPassword = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (signupPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreeTerms) {
      errors.agreeTerms = 'Please acknowledge the terms to proceed.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await signup(trimmedName, trimmedEmail, signupPassword);
      navigate('/dashboard');
    } catch (err) {
      setAuthError(typeof err === 'string' ? err : 'Unable to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google SSO
  const handleGoogleLogin = async () => {
    setAuthError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setAuthError(typeof err === 'string' ? err : 'Google sign-in was cancelled or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password submission
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setResetSuccess('');
    const errors = {};

    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail) {
      errors.resetEmail = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.resetEmail = 'Please enter a valid email address.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await resetPassword(trimmedEmail);
      setResetSuccess('Recovery instructions dispatched. Please check your inbox.');
    } catch (err) {
      setAuthError(typeof err === 'string' ? err : 'Failed to send reset link. Verify your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live validation helpers for signup
  const isPasswordValidLength = signupPassword.length >= 6;
  const doPasswordsMatch = Boolean(
    signupPassword && confirmPassword && signupPassword === confirmPassword
  );

  return (
    <AuthLayout>
      {/* Segmented Tab Switcher (Sign In vs Create Account) */}
      {activeTab !== 'forgot' && (
        <div className="auth-tab-nav" role="tablist" aria-label="Authentication modes">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'login'}
            aria-controls="auth-login-panel"
            className={`auth-tab-item ${activeTab === 'login' ? 'is-active' : ''}`}
            onClick={() => handleTabSwitch('login')}
          >
            <span>Sign In</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'signup'}
            aria-controls="auth-signup-panel"
            className={`auth-tab-item ${activeTab === 'signup' ? 'is-active' : ''}`}
            onClick={() => handleTabSwitch('signup')}
          >
            <span>Create Account</span>
          </button>
        </div>
      )}

      {/* General Alert Messages */}
      {authError && (
        <div className="auth-banner auth-banner--error" role="alert">
          <AlertCircle size={18} className="auth-banner-icon" />
          <span className="auth-banner-text">{authError}</span>
        </div>
      )}

      {resetSuccess && (
        <div className="auth-banner auth-banner--success" role="status">
          <CheckCircle2 size={18} className="auth-banner-icon" />
          <span className="auth-banner-text">{resetSuccess}</span>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: SIGN IN
          ===================================================================== */}
      {activeTab === 'login' && (
        <div id="auth-login-panel" role="tabpanel" className="auth-form-view">
          <header className="auth-view-header">
            <h2 className="auth-view-title">Welcome back</h2>
            <p className="auth-view-subtitle">Enter your credentials to access your verification workspace.</p>
          </header>

          {/* Continue with Google */}
          <GoogleButton
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            loading={isSubmitting}
            text="Continue with Google"
          />

          {/* Divider */}
          <div className="auth-divider" role="separator">
            <span className="auth-divider-label">or continue with email</span>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleLoginSubmit} noValidate className="auth-form">
            <FormField
              id="login-email"
              label="Email address"
              type="email"
              placeholder="name@organization.com"
              icon={Mail}
              value={loginEmail}
              onChange={(e) => {
                setLoginEmail(e.target.value);
                clearError('loginEmail');
              }}
              required
              autoComplete="email"
              disabled={isSubmitting}
              error={fieldErrors.loginEmail}
            />

            <PasswordInput
              id="login-password"
              label="Password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
                clearError('loginPassword');
              }}
              required
              autoComplete="current-password"
              disabled={isSubmitting}
              error={fieldErrors.loginPassword}
              headerAction={
                <button
                  type="button"
                  className="auth-header-link"
                  onClick={() => handleTabSwitch('forgot')}
                  tabIndex={0}
                >
                  Forgot password?
                </button>
              }
            />

            <AuthButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign In
            </AuthButton>
          </form>

          {/* Footer switcher */}
          <footer className="auth-view-footer">
            <span className="auth-view-footer-text">Don't have an account?</span>
            <button
              type="button"
              className="auth-link-action"
              onClick={() => handleTabSwitch('signup')}
            >
              Create Account
            </button>
          </footer>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: CREATE ACCOUNT (SIGN UP)
          ===================================================================== */}
      {activeTab === 'signup' && (
        <div id="auth-signup-panel" role="tabpanel" className="auth-form-view">
          <header className="auth-view-header">
            <h2 className="auth-view-title">Create your account</h2>
            <p className="auth-view-subtitle">Start verifying identities and making confident decisions.</p>
          </header>

          {/* Continue with Google */}
          <GoogleButton
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            loading={isSubmitting}
            text="Continue with Google"
          />

          {/* Divider */}
          <div className="auth-divider" role="separator">
            <span className="auth-divider-label">or register with email</span>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSignupSubmit} noValidate className="auth-form">
            <FormField
              id="signup-name"
              label="Full name"
              type="text"
              placeholder="Alex Morgan"
              icon={User}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError('name');
              }}
              required
              autoComplete="name"
              disabled={isSubmitting}
              error={fieldErrors.name}
            />

            <FormField
              id="signup-email"
              label="Email address"
              type="email"
              placeholder="name@organization.com"
              icon={Mail}
              value={signupEmail}
              onChange={(e) => {
                setSignupEmail(e.target.value);
                clearError('signupEmail');
              }}
              required
              autoComplete="email"
              disabled={isSubmitting}
              error={fieldErrors.signupEmail}
            />

            <PasswordInput
              id="signup-password"
              label="Password"
              placeholder="••••••••"
              value={signupPassword}
              onChange={(e) => {
                setSignupPassword(e.target.value);
                clearError('signupPassword');
              }}
              required
              autoComplete="new-password"
              disabled={isSubmitting}
              error={fieldErrors.signupPassword}
              requirements={
                signupPassword.length > 0 ? (
                  <div className={`auth-requirement-pill ${isPasswordValidLength ? 'met' : ''}`}>
                    <span className="auth-requirement-icon">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <span>At least 6 characters</span>
                  </div>
                ) : null
              }
            />

            <PasswordInput
              id="confirm-password"
              label="Confirm password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError('confirmPassword');
              }}
              required
              autoComplete="new-password"
              disabled={isSubmitting}
              error={fieldErrors.confirmPassword}
              requirements={
                confirmPassword.length > 0 ? (
                  <div className={`auth-requirement-pill ${doPasswordsMatch ? 'met' : 'unmet'}`}>
                    <span className="auth-requirement-icon">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <span>{doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                  </div>
                ) : null
              }
            />

            {/* Terms Acknowledgement */}
            <div className={`auth-checkbox-group ${fieldErrors.agreeTerms ? 'has-error' : ''}`}>
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    clearError('agreeTerms');
                  }}
                  disabled={isSubmitting}
                  className="auth-checkbox"
                />
                <span className="auth-checkbox-custom" aria-hidden="true">
                  {agreeTerms && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="auth-checkbox-text">
                  I agree to VerifyMe's <span className="auth-inline-highlight">Terms of Service</span> and{' '}
                  <span className="auth-inline-highlight">Privacy Policy</span>.
                </span>
              </label>
              {fieldErrors.agreeTerms && (
                <div className="auth-field-error" role="alert">
                  <AlertCircle size={14} className="auth-field-error-icon" />
                  <span>{fieldErrors.agreeTerms}</span>
                </div>
              )}
            </div>

            <AuthButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Account
            </AuthButton>
          </form>

          {/* Footer switcher */}
          <footer className="auth-view-footer">
            <span className="auth-view-footer-text">Already have an account?</span>
            <button
              type="button"
              className="auth-link-action"
              onClick={() => handleTabSwitch('login')}
            >
              Sign In
            </button>
          </footer>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: FORGOT PASSWORD
          ===================================================================== */}
      {activeTab === 'forgot' && (
        <div id="auth-forgot-panel" role="tabpanel" className="auth-form-view">
          <header className="auth-view-header">
            <h2 className="auth-view-title">Reset your password</h2>
            <p className="auth-view-subtitle">Enter your registered email to receive password reset instructions.</p>
          </header>

          <form onSubmit={handleForgotSubmit} noValidate className="auth-form">
            <FormField
              id="reset-email"
              label="Registered email address"
              type="email"
              placeholder="name@organization.com"
              icon={Mail}
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                clearError('resetEmail');
              }}
              required
              autoComplete="email"
              disabled={isSubmitting}
              error={fieldErrors.resetEmail}
            />

            <AuthButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Send Reset Link
            </AuthButton>

            <button
              type="button"
              className="auth-back-to-login-btn"
              onClick={() => handleTabSwitch('login')}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              <span>Return to Sign In</span>
            </button>
          </form>
        </div>
      )}

      {/* Security Footnote */}
      <div className="auth-security-footnote">
        <div className="auth-security-item">
          <span className="auth-security-dot" />
          <span>TLS 1.3 Encrypted</span>
        </div>
        <div className="auth-security-divider">•</div>
        <div className="auth-security-item">
          <span className="auth-security-dot" />
          <span>Deterministic Verification</span>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Auth;
