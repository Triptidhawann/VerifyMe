import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import TrustVisual from './TrustVisual';

/**
 * BrandPanel — Left section introducing VerifyMe with clean aesthetics,
 * fresh mint accents, authentic typography, and understated trust visuals.
 */
export const BrandPanel = () => {
  return (
    <aside className="auth-brand-section" aria-label="VerifyMe Brand Information">
      {/* Top Header: Logo + Return to home link */}
      <div className="auth-brand-top">
        <Link to="/" className="auth-brand-logo-link" title="VerifyMe Home">
          <div className="auth-brand-icon-box">
            <ShieldCheck size={22} className="auth-brand-logo-icon" />
          </div>
          <span className="auth-brand-wordmark">VerifyMe</span>
        </Link>

        <Link to="/" className="auth-back-link" title="Return to home page">
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Narrative Content */}
      <div className="auth-brand-center">
        <div className="auth-brand-tag">
          <span className="auth-brand-tag-dot" />
          <span>Intelligent Verification Platform</span>
        </div>

        <h1 className="auth-brand-heading">
          Make every digital decision with confidence.
        </h1>

        <p className="auth-brand-description">
          Verify identities, investigate suspicious opportunities, and make informed decisions with intelligent verification.
        </p>

        {/* Visual trust element */}
        <div className="auth-brand-visual-container">
          <TrustVisual />
        </div>
      </div>

      {/* Understated Bottom Brand Statement */}
      <div className="auth-brand-bottom">
        <p className="auth-brand-statement">
          Digital trust. Backed by intelligence.
        </p>
      </div>
    </aside>
  );
};

export default BrandPanel;
