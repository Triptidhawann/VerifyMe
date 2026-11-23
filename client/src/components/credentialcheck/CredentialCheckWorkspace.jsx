import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileCheck2, 
  FileUp, 
  History, 
  FileText, 
  Layers, 
  ArrowLeft,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import './CredentialCheck.css';

const CredentialCheckWorkspace = ({ 
  currentTab, 
  onSelectTab, 
  children,
  historyCount = 0,
  user,
  logout,
  isSubmitting = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const userInitial = user?.displayName 
    ? user.displayName.charAt(0).toUpperCase() 
    : (user?.email?.charAt(0).toUpperCase() || 'U');
  const userFirst = user?.displayName 
    ? user.displayName.split(' ')[0] 
    : (user?.email?.split('@')[0] || 'User');

  return (
    <div className="cc-app-shell">
      {/* Top Application Header Bar */}
      <header className="cc-header-bar">
        <div className="cc-header-container">
          {/* Brand & Module Lockup */}
          <div className="cc-brand-lockup">
            <Link to="/dashboard" className="cc-main-logo" title="Back to VerifyMe Dashboard">
              <div className="cc-logo-icon-box">
                <ShieldCheck className="w-5 h-5 text-[#49B99A]" />
              </div>
              <span className="cc-brand-text">Verify<span className="brand-accent">Me</span></span>
            </Link>

            <span className="cc-brand-separator" aria-hidden="true">/</span>

            <button 
              type="button" 
              className="cc-module-pill" 
              onClick={() => handleTabClick('investigate')}
              title="CredentialCheck Home"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#2E7D5B]" />
              <span>CredentialCheck</span>
              <span className="cc-module-tag font-mono">DOCUMENT INTELLIGENCE</span>
            </button>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="cc-center-nav" aria-label="CredentialCheck Navigation">
            <button
              type="button"
              className={`cc-nav-tab ${currentTab === 'investigate' ? 'active' : ''}`}
              onClick={() => handleTabClick('investigate')}
            >
              <FileUp className="w-4 h-4" />
              <span>New Investigation</span>
            </button>

            <button
              type="button"
              className={`cc-nav-tab ${currentTab === 'history' ? 'active' : ''}`}
              onClick={() => handleTabClick('history')}
            >
              <History className="w-4 h-4" />
              <span>Case History</span>
              {historyCount > 0 && (
                <span className="cc-counter-pill font-mono">{historyCount}</span>
              )}
            </button>

            <button
              type="button"
              className={`cc-nav-tab ${currentTab === 'supported' ? 'active' : ''}`}
              onClick={() => handleTabClick('supported')}
            >
              <FileText className="w-4 h-4" />
              <span>Supported Documents</span>
            </button>

            <button
              type="button"
              className={`cc-nav-tab ${currentTab === 'sources' ? 'active' : ''}`}
              onClick={() => handleTabClick('sources')}
            >
              <Layers className="w-4 h-4" />
              <span>Verification Sources</span>
            </button>
          </nav>

          {/* Right Status & Account Controls */}
          <div className="cc-right-controls">
            <div className="cc-engine-status" title="Document investigation pipeline ready">
              <span className={`cc-status-dot ${isSubmitting ? 'is-pulsing' : ''}`} />
              <span className="cc-status-text font-mono">
                {isSubmitting ? 'ANALYZING...' : 'ONLINE'}
              </span>
            </div>

            <Link to="/dashboard" className="cc-return-btn" title="Return to VerifyMe Workspace">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">VerifyMe</span>
            </Link>

            {user && (
              <div className="cc-user-pill">
                <div className="cc-user-avatar">
                  {userInitial}
                </div>
                <span className="cc-user-name hidden md:inline">{userFirst}</span>
              </div>
            )}

            {logout && (
              <button
                type="button"
                onClick={logout}
                className="cc-logout-btn"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="cc-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="cc-mobile-drawer fadeIn">
            <div className="cc-mobile-links">
              <button
                type="button"
                className={`cc-mobile-link ${currentTab === 'investigate' ? 'active' : ''}`}
                onClick={() => handleTabClick('investigate')}
              >
                <FileUp className="w-4 h-4" />
                <span>New Investigation</span>
              </button>

              <button
                type="button"
                className={`cc-mobile-link ${currentTab === 'history' ? 'active' : ''}`}
                onClick={() => handleTabClick('history')}
              >
                <History className="w-4 h-4" />
                <span>Case History ({historyCount})</span>
              </button>

              <button
                type="button"
                className={`cc-mobile-link ${currentTab === 'supported' ? 'active' : ''}`}
                onClick={() => handleTabClick('supported')}
              >
                <FileText className="w-4 h-4" />
                <span>Supported Documents</span>
              </button>

              <button
                type="button"
                className={`cc-mobile-link ${currentTab === 'sources' ? 'active' : ''}`}
                onClick={() => handleTabClick('sources')}
              >
                <Layers className="w-4 h-4" />
                <span>Verification Sources</span>
              </button>

              <Link
                to="/dashboard"
                className="cc-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to VerifyMe Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Workspace Body */}
      <main className="cc-workspace-container">
        {children}
      </main>
    </div>
  );
};

export default CredentialCheckWorkspace;
