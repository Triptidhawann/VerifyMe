import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { investigateRecruitment, fetchJobShieldHistory } from '../services/jobShieldService';
import JobShieldIntake from '../components/jobshield/JobShieldIntake';
import JobShieldReport from '../components/jobshield/JobShieldReport';
import JobShieldHistory from '../components/jobshield/JobShieldHistory';
import JobShieldMethodology from '../components/jobshield/JobShieldMethodology';
import { 
  ShieldCheck, 
  PlusCircle, 
  FolderOpen, 
  HelpCircle, 
  ArrowLeft, 
  Menu, 
  X, 
  LogOut,
  Briefcase
} from 'lucide-react';
import '../components/jobshield/JobShield.css';

export const JobShieldPage = () => {
  const { user, logout } = useAuth();

  // Navigation views: 'intake' | 'report' | 'history' | 'methodology'
  const [currentView, setCurrentView] = useState('intake');
  const [activeInvestigation, setActiveInvestigation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refresh history via backend API
  const refreshHistory = useCallback(async () => {
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
  }, [user]);

  // Subscribe to user's JobShield investigations with backend API fallback
  useEffect(() => {
    if (!user) {
      setLoadingHistory(false);
      return;
    }

    refreshHistory();

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
          console.info('[JobShield] Live snapshot notice (' + (err.code || err.message) + '), using backend API.');
          refreshHistory();
        }
      );
    } catch {
      refreshHistory();
    }

    return () => unsubscribe();
  }, [user, refreshHistory]);

  const handleStartNew = () => {
    setActiveInvestigation(null);
    setSubmissionError('');
    setCurrentView('intake');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCase = (caseItem) => {
    setActiveInvestigation(caseItem);
    setCurrentView('report');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmissionError(err.message || 'Investigation pipeline encountered an unexpected disruption. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitial = user?.displayName 
    ? user.displayName.charAt(0).toUpperCase() 
    : (user?.email?.charAt(0).toUpperCase() || 'U');
  const userFirst = user?.displayName 
    ? user.displayName.split(' ')[0] 
    : (user?.email?.split('@')[0] || 'User');

  return (
    <div className="js-app-shell">
      {/* Top Application Header */}
      <header className="js-header-bar">
        <div className="js-header-container">
          {/* Brand & Module Lockup */}
          <div className="js-brand-lockup">
            <Link to="/dashboard" className="js-main-logo" title="Back to VerifyMe Dashboard">
              <div className="js-logo-icon-box">
                <ShieldCheck className="w-5 h-5 text-[#49B99A]" />
              </div>
              <span className="js-brand-text">Verify<span className="brand-accent">Me</span></span>
            </Link>

            <span className="js-brand-separator" aria-hidden="true">/</span>

            <button 
              type="button" 
              className="js-module-pill" 
              onClick={handleStartNew}
              title="JobShield Home"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#2E7D5B]" />
              <span>JobShield</span>
              <span className="js-module-tag font-mono">INTELLIGENCE</span>
            </button>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="js-center-nav" aria-label="JobShield Navigation">
            <button
              type="button"
              className={`js-nav-tab ${currentView === 'intake' && !activeInvestigation ? 'active' : ''}`}
              onClick={handleStartNew}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Investigation</span>
            </button>

            <button
              type="button"
              className={`js-nav-tab ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => handleViewChange('history')}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Case History</span>
              {history.length > 0 && (
                <span className="js-counter-pill font-mono">{history.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`js-nav-tab ${currentView === 'methodology' ? 'active' : ''}`}
              onClick={() => handleViewChange('methodology')}
            >
              <HelpCircle className="w-4 h-4" />
              <span>How JobShield Works</span>
            </button>
          </nav>

          {/* Right Status & Account Controls */}
          <div className="js-right-controls">
            <div className="js-engine-status" title="Investigation pipeline ready">
              <span className={`js-status-dot ${isSubmitting ? 'is-pulsing' : ''}`} />
              <span className="js-status-text font-mono">
                {isSubmitting ? 'ANALYZING...' : 'ONLINE'}
              </span>
            </div>

            <Link to="/dashboard" className="js-return-btn" title="Return to VerifyMe Workspace">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">VerifyMe</span>
            </Link>

            <div className="js-user-pill">
              <div className="js-user-avatar">
                {userInitial}
              </div>
              <span className="js-user-name hidden md:inline">{userFirst}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="js-logout-btn"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="js-mobile-toggle"
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
          <div className="js-mobile-drawer fadeIn">
            <div className="js-mobile-links">
              <button
                type="button"
                className={`js-mobile-link ${currentView === 'intake' ? 'active' : ''}`}
                onClick={handleStartNew}
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Investigation</span>
              </button>

              <button
                type="button"
                className={`js-mobile-link ${currentView === 'history' ? 'active' : ''}`}
                onClick={() => handleViewChange('history')}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Case History ({history.length})</span>
              </button>

              <button
                type="button"
                className={`js-mobile-link ${currentView === 'methodology' ? 'active' : ''}`}
                onClick={() => handleViewChange('methodology')}
              >
                <HelpCircle className="w-4 h-4" />
                <span>How JobShield Works</span>
              </button>

              <Link
                to="/dashboard"
                className="js-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to VerifyMe Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Investigation Workspace Viewport */}
      <main className="js-main-viewport">
        {currentView === 'intake' && (
          <JobShieldIntake 
            onSubmit={handleRunInvestigation}
            isSubmitting={isSubmitting}
            error={submissionError}
            onOpenMethodology={() => handleViewChange('methodology')}
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
  );
};

export default JobShieldPage;
