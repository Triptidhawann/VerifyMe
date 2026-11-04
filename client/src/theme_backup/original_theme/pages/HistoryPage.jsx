import React from 'react';
import DashboardNav from '../components/dashboard/DashboardNav';
import ExpandedHistory from '../components/dashboard/ExpandedHistory';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css'; // Reusing dashboard layout

const HistoryPage = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <DashboardNav />
      
      <main className="workspace container">
        <div className="workspace-hero">
          <h1 className="hero-title">Intelligence History</h1>
          <p className="hero-subtitle">Review and analyze your past investigations.</p>
        </div>

        <ExpandedHistory />
      </main>
    </div>
  );
};

export default HistoryPage;
