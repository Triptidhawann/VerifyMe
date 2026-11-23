import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import CredentialCheckWorkspace from '../components/credentialcheck/CredentialCheckWorkspace';
import CredentialCheckSubmit from '../components/credentialcheck/CredentialCheckSubmit';
import CredentialCheckReport from '../components/credentialcheck/CredentialCheckReport';
import CredentialCheckHistory from '../components/credentialcheck/CredentialCheckHistory';
import CredentialCheckSources from '../components/credentialcheck/CredentialCheckSources';
import CredentialCheckSupportedDocs from '../components/credentialcheck/CredentialCheckSupportedDocs';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { 
  investigateCredentialDocument, 
  deleteCredentialRecord,
  fetchCredentialHistory,
  fetchCredentialInvestigation
} from '../services/credentialCheckService';

const CredentialCheckPage = () => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('investigate'); // 'investigate' | 'history' | 'supported' | 'sources' | 'report'
  const [activeInvestigation, setActiveInvestigation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  // Function to load authoritative investigation history via authenticated API
  const refreshHistory = useCallback(async () => {
    if (!user) {
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const items = await fetchCredentialHistory(token);
        setHistory(items);
      }
    } catch (err) {
      console.warn('[CredentialCheck] History fetch notice:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  // Restore active investigation on page refresh / load
  useEffect(() => {
    const restoreSession = async () => {
      const savedCaseId = sessionStorage.getItem('cc_active_case_id');
      if (savedCaseId && user && auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          const doc = await fetchCredentialInvestigation(savedCaseId, token);
          if (doc) {
            setActiveInvestigation(doc);
            setCurrentTab('report');
          }
        } catch (err) {
          console.warn('[CredentialCheck] Could not restore active case:', err.message);
          sessionStorage.removeItem('cc_active_case_id');
        }
      }
    };
    restoreSession();
  }, [user]);

  // Subscribe to user's CredentialCheck investigations with authenticated API fallback
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
        collection(db, 'users', user.uid, 'credentialcheck_investigations'),
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
        () => {
          // If Firestore client listener is blocked by cloud rules, rely authoritatively on backend API
          console.info('[CredentialCheck] Live snapshot unavailable, using authoritative API endpoint.');
          refreshHistory();
        }
      );
    } catch {
      refreshHistory();
    }

    return () => unsubscribe();
  }, [user, refreshHistory]);

  const handleRunInvestigation = async (payload) => {
    setIsSubmitting(true);
    setSubmissionError('');

    try {
      let token = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      if (!token) {
        throw new Error('Please sign in to your VerifyMe account to perform credential investigations.');
      }

      const result = await investigateCredentialDocument({
        ...payload,
        token
      });

      setActiveInvestigation(result);
      if (result.id) {
        sessionStorage.setItem('cc_active_case_id', result.id);
      }
      setCurrentTab('report');
      refreshHistory();
    } catch (err) {
      setSubmissionError(err.message || 'Credential investigation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCase = async (id) => {
    let token = null;
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    }
    if (!token) return;

    await deleteCredentialRecord(id, token);
    setHistory(prev => prev.filter(item => item.id !== id));
    if (activeInvestigation && activeInvestigation.id === id) {
      sessionStorage.removeItem('cc_active_case_id');
      setActiveInvestigation(null);
      setCurrentTab('history');
    }
  };

  const handleSelectCase = (caseItem) => {
    setActiveInvestigation(caseItem);
    if (caseItem.id) {
      sessionStorage.setItem('cc_active_case_id', caseItem.id);
    }
    setCurrentTab('report');
  };

  const handleNewInvestigation = () => {
    sessionStorage.removeItem('cc_active_case_id');
    setActiveInvestigation(null);
    setSubmissionError('');
    setCurrentTab('investigate');
  };

  return (
    <CredentialCheckWorkspace
      currentTab={currentTab}
      onSelectTab={(tab) => {
        if (tab === 'investigate') handleNewInvestigation();
        else {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
      historyCount={history.length}
      user={user}
      logout={logout}
      isSubmitting={isSubmitting}
    >
      {currentTab === 'investigate' && (
        <CredentialCheckSubmit 
          onSubmit={handleRunInvestigation}
          loading={isSubmitting}
          error={submissionError}
        />
      )}

      {currentTab === 'report' && activeInvestigation && (
        <ErrorBoundary 
          onReset={() => handleSelectCase(activeInvestigation.id || activeInvestigation._id)}
          onBack={handleNewInvestigation}
        >
          <CredentialCheckReport
            investigation={activeInvestigation}
            onNewInvestigation={handleNewInvestigation}
          />
        </ErrorBoundary>
      )}

      {currentTab === 'history' && (
        <CredentialCheckHistory 
          history={history}
          onSelectInvestigation={handleSelectCase}
          onDeleteInvestigation={handleDeleteCase}
          loading={loadingHistory}
        />
      )}

      {currentTab === 'sources' && (
        <CredentialCheckSources />
      )}

      {currentTab === 'supported' && (
        <CredentialCheckSupportedDocs />
      )}
    </CredentialCheckWorkspace>
  );
};

export default CredentialCheckPage;
