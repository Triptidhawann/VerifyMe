import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardNav from '../components/dashboard/DashboardNav';
import VerificationWorkspace from '../components/dashboard/VerificationWorkspace';
import HistoryPanel from '../components/dashboard/HistoryPanel';
import { ShieldCheck, Zap, Activity, Database, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleVerificationComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const userName = user?.displayName ? user.displayName.split(' ')[0] : 'Analyst';

  return (
    <div className="dash-root-container">
      {/* Ambient Atmospheric Mesh */}
      <div className="dash-mesh-grid" />
      <div className="dash-ambient-glow" />

      <DashboardNav />

      <main className="dash-main-viewport">
        {/* Workspace Hero Header */}
        <section className="dash-hero-banner">
          <div className="hero-status-pill">
            <span className="live-dot" />
            <span>Autonomous Intelligence Node #01</span>
          </div>

          <h1 className="dash-hero-title">
            Digital Trust Workspace
          </h1>

          <p className="dash-hero-description">
            Welcome, <span className="text-white font-semibold">{userName}</span>. Inspect an unknown digital entity, sender, or domain before you engage, respond, click, or authenticate.
          </p>

          {/* Quick Telemetry Strip */}
          <div className="dash-telemetry-strip">
            <div className="telemetry-card">
              <div className="telemetry-icon">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="telemetry-info">
                <span className="telemetry-label">Analysis Pipeline</span>
                <span className="telemetry-val">Deterministic + Groq AI</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="telemetry-info">
                <span className="telemetry-label">Median Latency</span>
                <span className="telemetry-val">0.18s Response</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <div className="telemetry-info">
                <span className="telemetry-label">Protocol Coverage</span>
                <span className="telemetry-val">E.164 • SPF • DMARC • DNS</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="telemetry-info">
                <span className="telemetry-label">Engine Reliability</span>
                <span className="telemetry-val">Fail-Safe Fallback Enabled</span>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Interactive Workspace */}
        <section className="dash-workspace-section">
          <VerificationWorkspace onVerificationComplete={handleVerificationComplete} />
        </section>

        {/* Audit Log / History Panel */}
        <section className="dash-history-section">
          <HistoryPanel refreshTrigger={refreshTrigger} />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
