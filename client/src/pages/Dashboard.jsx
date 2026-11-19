import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardNav from '../components/dashboard/DashboardNav';
import VerificationWorkspace from '../components/dashboard/VerificationWorkspace';
import HistoryPanel from '../components/dashboard/HistoryPanel';
import { ShieldCheck, Zap, Activity, Database, Briefcase, ArrowRight, FileCheck2 } from 'lucide-react';
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
      {/* Ambient Forest Warm Grid */}
      <div className="dash-mesh-grid" />
      <div className="dash-ambient-glow" />

      <DashboardNav />

      <main className="dash-main-viewport">
        {/* Workspace Hero Header */}
        <section className="dash-hero-banner">
          <div className="hero-status-pill">
            <span className="live-dot" />
            <span>Autonomous Intelligence Node • India & Global</span>
          </div>

          <h1 className="dash-hero-title">
            Digital Trust Workspace
          </h1>

          <p className="dash-hero-description">
            Welcome, <span className="text-[#174C3C] font-bold">{userName}</span>. Inspect an unknown digital entity, phone number, email sender, or domain before you engage, respond, click, or authenticate.
          </p>

          {/* Telemetry Strip */}
          <div className="dash-telemetry-strip">
            <div className="telemetry-card">
              <div className="telemetry-icon">
                <Zap className="w-4 h-4 text-[#174C3C]" />
              </div>
              <div className="telemetry-info">
                <span className="telemetry-label">Analysis Engine</span>
                <span className="telemetry-val">Deterministic + Groq AI</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">
                <Activity className="w-4 h-4 text-[#15803D]" />
              </div>
              <div className="telemetry-info">
                <span className="telemetry-label">Median Latency</span>
                <span className="telemetry-val">0.18s Response</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">
                <Database className="w-4 h-4 text-[#174C3C]" />
              </div>
              <div className="telemetry-info">
                <span className="telemetry-label">Protocol Coverage</span>
                <span className="telemetry-val">E.164 • SPF • DMARC • DNS</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
              </div>
              <div className="telemetry-info">
                <span className="telemetry-label">Engine Reliability</span>
                <span className="telemetry-val">Fail-Safe Fallback Enabled</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Launch Callouts Grid */}
        <section className="dash-features-grid">
          {/* JobShield Callout */}
          <Link 
            to="/jobshield" 
            className="feature-callout-card group"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="feature-icon-box">
                  <Briefcase className="w-5 h-5 text-[#C7D99A]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="feature-badge">RECRUITMENT DEFENSE</span>
                    <span className="feature-title">JobShield: Recruitment & Offer Fraud Investigation</span>
                  </div>
                  <p className="feature-desc">
                    Investigate suspicious job offers, recruiter domains, and independently verify vacancies on Greenhouse, Lever & Ashby public ATS boards.
                  </p>
                </div>
              </div>
              <div className="feature-action-link">
                <span>Launch JobShield</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* CredentialCheck Callout */}
          <Link 
            to="/credentialcheck" 
            className="feature-callout-card group"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="feature-icon-box">
                  <FileCheck2 className="w-5 h-5 text-[#C7D99A]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="feature-badge">INDIA-FIRST CREDENTIALS</span>
                    <span className="feature-title">CredentialCheck: Document Intelligence & Verification</span>
                  </div>
                  <p className="feature-desc">
                    Forensically analyze certificates, marksheets, degrees & internship letters with DigiLocker NAD, MCA & corporate registries.
                  </p>
                </div>
              </div>
              <div className="feature-action-link">
                <span>Launch CredentialCheck</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
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
