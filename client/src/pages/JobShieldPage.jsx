import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { investigateRecruitment, fetchJobShieldHistory } from '../services/jobShieldService';
import JobShieldIntake from '../components/jobshield/JobShieldIntake';
import JobShieldReport from '../components/jobshield/JobShieldReport';
import JobShieldHistory from '../components/jobshield/JobShieldHistory';
import JobShieldMethodology from '../components/jobshield/JobShieldMethodology';
import { 
  Shield, 
  ShieldCheck, 
  PlusCircle, 
  FolderOpen, 
  HelpCircle, 
  ArrowLeft, 
  Menu, 
  X, 
  ExternalLink,
  Activity,
  User,
  LogOut
} from 'lucide-react';
import '../components/jobshield/JobShield.css';

const JobShieldPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation views: 'intake' | 'report' | 'history' | 'methodology'
  const [currentView, setCurrentView] = useState('intake');
  const [activeInvestigation, setActiveInvestigation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Refresh history via authoritative backend API
  const refreshHistory = async () => {
    if (!user) {
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const items = await fetchJobShieldHistory(token);
        if (Array.isArray(items) && items.length > 0) {
          setHistory(items);
        }
      }
    } catch (err) {
      console.warn('[JobShield] History fetch notice:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Subscribe to user's JobShield investigations with backend API fallback
  useEffect(() => {
    if (!user) {
      setLoadingHistory(false);
      return;
    }

    refreshHistory();

    // Also attempt real-time Firestore onSnapshot listener if client permissions permit
    let unsubscribe = () => {};
    try {
      const q = query(
        collection(db, 'users', user.uid, 'jobshield_investigations'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const results = [];
          snapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
          });
          setHistory(results);
          setLoadingHistory(false);
        },
        (err) => {
          // If Firestore client listener is blocked by rules or unindexed, rely on backend API
          console.info('[JobShield] Live snapshot notice (' + (err.code || err.message) + '), using authoritative API endpoint.');
          refreshHistory();
        }
      );
    } catch {
      refreshHistory();
    }

    return () => unsubscribe();
  }, [user]);

  const handleStartNew = () => {
    setActiveInvestigation(null);
    setSubmissionError('');
    setCurrentView('intake');
    setMobileSidebarOpen(false);
  };

  const handleSelectCase = (caseItem) => {
    setActiveInvestigation(caseItem);
    setCurrentView('report');
    setMobileSidebarOpen(false);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setMobileSidebarOpen(false);
  };

  const handleRunInvestigation = async (submissionPayload) => {
    setIsSubmitting(true);
    setSubmissionError('');

    try {
      let token = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const result = await investigateRecruitment({
        ...submissionPayload,
        token
      });

      setActiveInvestigation(result);
      if (result) {
        setHistory((prev) => [result, ...prev.filter((item) => item.id !== result.id)]);
      }
      setCurrentView('report');
      refreshHistory();
    } catch (err) {
      setSubmissionError(err.message || 'Investigation pipeline encountered an unexpected disruption.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');
  const userFirst = user?.displayName ? user.displayName.split(' ')[0] : (user?.email?.split('@')[0] || 'Analyst');

  return (
    <div className="js-app-shell">
      {/* LEFT SIDEBAR (Dedicated Enterprise Shell) */}
      <aside className={`js-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        {/* Brand Lockup */}
        <div className="js-sidebar-brand">
          <Link to="/jobshield" className="js-brand-lockup" onClick={handleStartNew}>
            <div className="js-brand-icon-box">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="js-brand-title">
                <span>JobShield</span>
                <span className="js-brand-badge">Ops</span>
              </div>
            </div>
          </Link>
          <button 
            type="button" 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="js-sidebar-nav">
          <span className="js-nav-section-label">Case Management</span>

          <button
            type="button"
            className={`js-nav-item ${currentView === 'intake' && !activeInvestigation ? 'active' : ''}`}
            onClick={handleStartNew}
          >
            <div className="js-nav-item-left">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>New Investigation</span>
            </div>
          </button>

          <button
            type="button"
            className={`js-nav-item ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => handleViewChange('history')}
          >
            <div className="js-nav-item-left">
              <FolderOpen className="w-4 h-4" />
              <span>Case History</span>
            </div>
            {history.length > 0 && (
              <span className="js-nav-counter">{history.length}</span>
            )}
          </button>

          <div className="js-sidebar-divider" />

          <span className="js-nav-section-label">Documentation</span>

          <button
            type="button"
            className={`js-nav-item ${currentView === 'methodology' ? 'active' : ''}`}
            onClick={() => handleViewChange('methodology')}
          >
            <div className="js-nav-item-left">
              <HelpCircle className="w-4 h-4" />
              <span>How Verification Works</span>
            </div>
          </button>

          <div className="js-sidebar-divider" />

          <span className="js-nav-section-label">Platform</span>

          <Link
            to="/dashboard"
            className="js-nav-item"
          >
            <div className="js-nav-item-left">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to VerifyMe</span>
            </div>
          </Link>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="js-sidebar-footer">
          <div className="js-user-brief">
            <div className="js-user-avatar">
              {userInitial}
            </div>
            <div className="js-user-meta">
              <span className="js-user-name">{userFirst}</span>
              <span className="js-user-role">Fraud Analyst</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={logout}
            className="text-slate-400 hover:text-red-400 transition-colors p-1"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE VIEWPORT */}
      <div className="js-main-content">
        {/* Top Application Bar */}
        <header className="js-top-bar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="js-mobile-nav-toggle md:hidden"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="js-top-bar-left">
              <h1 className="js-workspace-title">Recruitment Investigation</h1>
              <p className="js-workspace-subtitle">
                Analyze job offers, recruiter communications and employment opportunities using independently sourced evidence.
              </p>
            </div>
          </div>

          <div className="js-top-bar-right">
            <div className="js-status-indicator">
              <span className={`js-status-dot ${isSubmitting ? 'pulsing' : ''}`} />
              <span>{isSubmitting ? 'Investigating case file...' : 'Ready for investigation'}</span>
            </div>
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="js-workspace-canvas">
          {currentView === 'intake' && (
            <JobShieldIntake 
              onSubmit={handleRunInvestigation}
              isSubmitting={isSubmitting}
              error={submissionError}
            />
          )}

          {currentView === 'report' && activeInvestigation && (
            <JobShieldReport 
              investigation={activeInvestigation}
              onNewInvestigation={handleStartNew}
            />
          )}

          {currentView === 'history' && (
            <JobShieldHistory 
              history={history}
              loading={loadingHistory}
              onSelectCase={handleSelectCase}
              onStartNew={handleStartNew}
            />
          )}

          {currentView === 'methodology' && (
            <JobShieldMethodology 
              onBackToIntake={handleStartNew}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default JobShieldPage;
