import React from 'react';
import DashboardNav from '../components/dashboard/DashboardNav';
import ExpandedHistory from '../components/dashboard/ExpandedHistory';
import './Dashboard.css';

const HistoryPage = () => {

  return (
    <div className="dash-root-container">
      <DashboardNav />
      
      <main className="dash-main-viewport">
        <div className="dash-hero-banner" style={{ textAlign: 'left', margin: '0 0 2rem 0' }}>
          <h1 className="dash-hero-title">Verification History</h1>
          <p className="dash-hero-description">Review and inspect your past verification audits.</p>
        </div>

        <ExpandedHistory />
      </main>
    </div>
  );
};

export default HistoryPage;
