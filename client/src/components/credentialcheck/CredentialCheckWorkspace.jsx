import React from 'react';
import { 
  FileCheck2, 
  History, 
  FileText, 
  Layers, 
  ArrowLeft,
  Shield,
  FileUp,
  CheckCircle2,
  Clock
} from 'lucide-react';
import './CredentialCheck.css';

const CredentialCheckWorkspace = ({ 
  currentTab, 
  onSelectTab, 
  children,
  historyCount = 0 
}) => {
  return (
    <div className="cc-app-shell">
      {/* Top Professional Navigation Bar */}
      <header className="cc-top-navbar">
        <div className="flex items-center gap-4">
          <div className="cc-brand-lockup">
            <div className="cc-brand-icon-box">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="cc-brand-title">
              <span>CredentialCheck</span>
              <span className="cc-brand-badge">India-First Intelligence</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="cc-nav-tabs">
          <button
            type="button"
            className={`cc-nav-tab ${currentTab === 'investigate' ? 'active' : ''}`}
            onClick={() => onSelectTab('investigate')}
          >
            <FileUp className="w-4 h-4" />
            <span>New Investigation</span>
          </button>

          <button
            type="button"
            className={`cc-nav-tab ${currentTab === 'history' ? 'active' : ''}`}
            onClick={() => onSelectTab('history')}
          >
            <History className="w-4 h-4" />
            <span>Investigation History {historyCount > 0 && `(${historyCount})`}</span>
          </button>

          <button
            type="button"
            className={`cc-nav-tab ${currentTab === 'supported' ? 'active' : ''}`}
            onClick={() => onSelectTab('supported')}
          >
            <FileText className="w-4 h-4" />
            <span>Supported Documents</span>
          </button>

          <button
            type="button"
            className={`cc-nav-tab ${currentTab === 'sources' ? 'active' : ''}`}
            onClick={() => onSelectTab('sources')}
          >
            <Layers className="w-4 h-4" />
            <span>Verification Sources</span>
          </button>
        </nav>

        {/* Back to VerifyMe Primary Suite */}
        <div>
          <a href="/" className="cc-btn-back-home" title="Return to VerifyMe Multi-Entity Dashboard">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>VerifyMe Suite</span>
          </a>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="cc-workspace-container">
        {children}
      </main>
    </div>
  );
};

export default CredentialCheckWorkspace;
