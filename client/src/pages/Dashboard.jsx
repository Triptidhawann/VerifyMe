import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardNav from '../components/dashboard/DashboardNav';
import VerificationWorkspace from '../components/dashboard/VerificationWorkspace';
import HistoryPanel from '../components/dashboard/HistoryPanel';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Used to trigger a history refresh when a new verification completes
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleVerificationComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="dashboard-container">
      <DashboardNav />

      <main className="workspace container">
        <div className="workspace-hero">
          <div className="hero-greeting">Welcome back, {user?.displayName ? user.displayName.split(' ')[0] : 'User'}</div>
          <h1 className="hero-title">Digital Trust Workspace</h1>
          <p className="hero-subtitle">
            Investigate an unknown digital identity before you trust, respond, share, or click.
          </p>
        </div>

        {/* Modular Verification Workspace Component */}
        <VerificationWorkspace onVerificationComplete={handleVerificationComplete} />

        {/* Modular History Panel Component */}
        <HistoryPanel refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
};

export default Dashboard;
