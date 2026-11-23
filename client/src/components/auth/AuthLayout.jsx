import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import BrandPanel from './BrandPanel';

/**
 * AuthLayout — Balanced split-screen layout shell.
 * Left section: Brand experience.
 * Right section: Authentication form area.
 */
export const AuthLayout = ({ children }) => {
  return (
    <main className="auth-split-layout">
      {/* Left Section: Brand Experience */}
      <BrandPanel />

      {/* Right Section: Authentication Experience */}
      <section className="auth-form-section" aria-label="Authentication Form Area">
        {/* Mobile Header (visible only on viewports where left panel is stacked/hidden) */}
        <div className="auth-mobile-bar">
          <Link to="/" className="auth-mobile-logo" title="VerifyMe Home">
            <div className="auth-brand-icon-box sm">
              <ShieldCheck size={18} className="auth-brand-logo-icon" />
            </div>
            <span className="auth-brand-wordmark">VerifyMe</span>
          </Link>
          <Link to="/" className="auth-mobile-back" title="Back to Home">
            <ArrowLeft size={14} />
            <span>Home</span>
          </Link>
        </div>

        {/* Centered Form Wrapper */}
        <div className="auth-form-card-container">
          {children}
        </div>
      </section>
    </main>
  );
};

export default AuthLayout;
