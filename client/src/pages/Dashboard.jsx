import React, { useState } from 'react';
import DashboardNav from '../components/dashboard/DashboardNav';
import VerificationWorkspace from '../components/dashboard/VerificationWorkspace';
import HistoryPanel from '../components/dashboard/HistoryPanel';
import VerificationResult from '../components/dashboard/VerificationResult';
import './Dashboard.css';

const Dashboard = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedAudit, setSelectedAudit] = useState(null);

  const handleVerificationComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleInspectAudit = (item) => {
    setSelectedAudit(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearSelectedAudit = () => {
    setSelectedAudit(null);
  };

  return (
    <div className="dash-root-container">
      <DashboardNav />

      <main className="dash-main-viewport">
        {/* Workspace Introduction Header */}
        <header className="dash-intro-banner">
          <h1 className="dash-intro-title">
            Your digital trust workspace.
          </h1>
          <p className="dash-intro-subtitle">
            Check phone numbers, email addresses and websites before you interact with them.
          </p>
        </header>

        {/* Verification Workspace or Inspected Audit Report */}
        <section className="dash-workspace-section" aria-label="Verification Workspace">
          {selectedAudit ? (
            <div className="dash-inspected-card fadeIn">
              <div className="dash-inspected-header">
                <span className="dash-inspected-tag">Audit Record View</span>
                <button
                  type="button"
                  className="dash-back-workspace-btn"
                  onClick={handleClearSelectedAudit}
                >
                  ← Back to Live Verification
                </button>
              </div>
              <VerificationResult 
                result={selectedAudit} 
                onVerifyAnother={handleClearSelectedAudit} 
              />
            </div>
          ) : (
            <VerificationWorkspace onVerificationComplete={handleVerificationComplete} />
          )}
        </section>

        {/* Recent Verification Activity Panel */}
        <section className="dash-history-section" aria-label="Recent Verification Activity">
          <HistoryPanel 
            refreshTrigger={refreshTrigger} 
            onInspectAudit={handleInspectAudit}
          />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
