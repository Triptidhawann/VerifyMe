import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Shield, ShieldAlert, ShieldCheck, Activity, Search, AlertTriangle } from 'lucide-react';
import './HistoryPanel.css';

const HistoryPanel = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    const q = query(
      collection(db, 'users', user.uid, 'verifications'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const results = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });
        setHistory(results);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching history:", err);
        setError('Unable to load verification history.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const stats = {
    total: history.length,
    lowRisk: history.filter(h => h.riskLevel === 'LOW RISK').length,
    moderateRisk: history.filter(h => h.riskLevel === 'MODERATE RISK').length,
    highRisk: history.filter(h => h.riskLevel === 'HIGH RISK').length,
  };

  const getRiskIcon = (level) => {
    if (level === 'LOW RISK') return <ShieldCheck size={18} style={{ color: '#10b981' }} />;
    if (level === 'HIGH RISK') return <ShieldAlert size={18} style={{ color: '#ef4444' }} />;
    return <Shield size={18} style={{ color: '#f59e0b' }} />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    // Handle Firebase Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskTarget = (type, target) => {
    if (!target) return '';
    if (type === 'email') {
      const parts = target.split('@');
      if (parts.length === 2) {
        return `${parts[0].charAt(0)}***@${parts[1]}`;
      }
    }
    if (type === 'phone') {
      if (target.length > 4) {
        return `${target.slice(0, 3)}***${target.slice(-2)}`;
      }
    }
    return target; // Leave website or short inputs unmasked
  };

  if (loading) {
    return (
      <section className="history-section">
        <div className="history-loading">
          <Activity className="spinning" size={24} />
          <span>Loading intelligence history...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="history-section">
      <div className="history-header">
        <h2>Intelligence History</h2>
      </div>

      {stats.total > 0 && (
        <div className="history-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Checks</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.lowRisk}</span>
            <span className="stat-label">Low Risk</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.moderateRisk}</span>
            <span className="stat-label">Review Req.</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--danger)' }}>{stats.highRisk}</span>
            <span className="stat-label">High Risk</span>
          </div>
        </div>
      )}

      {error ? (
        <div className="history-error">
          <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
          <div>{error}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Please try again.</div>
        </div>
      ) : stats.total === 0 ? (
        <div className="empty-history">
          <div className="empty-icon-wrapper">
            <Search size={32} />
          </div>
          <h3 style={{ textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.05em' }}>No investigations yet</h3>
          <p>Your verification intelligence will appear here after your first investigation.</p>
        </div>
      ) : (
        <>
          <div className="history-list">
            {history.slice(0, 3).map(item => (
              <div key={item.id} className="history-card">
                <div className="history-card-icon">
                  {getRiskIcon(item.riskLevel)}
                </div>
                <div className="history-card-main">
                  <div className="history-card-title">{maskTarget(item.type, item.inputValue)}</div>
                  <div className="history-card-meta">
                    <span className="type-badge">{item.type.toUpperCase()}</span>
                    <span className="date">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
                <div className="history-card-score">
                  <span className="score">{item.score}</span>
                  <span className="max">/100</span>
                </div>
              </div>
            ))}
          </div>
          
          {history.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <a href="/history" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
                View Full History →
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default HistoryPanel;
