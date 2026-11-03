import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Search, 
  AlertTriangle,
  ArrowRight,
  History,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import './HistoryPanel.css';

const HistoryPanel = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

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
        setError('Unable to load verification audit logs.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, refreshTrigger]);

  const stats = {
    total: history.length,
    lowRisk: history.filter(h => h.riskLevel === 'LOW RISK').length,
    moderateRisk: history.filter(h => h.riskLevel === 'MODERATE RISK').length,
    highRisk: history.filter(h => h.riskLevel === 'HIGH RISK').length,
  };

  const getRiskIcon = (level) => {
    if (level === 'LOW RISK') return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    if (level === 'HIGH RISK') return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    return <Shield className="w-5 h-5 text-amber-400" />;
  };

  const getTypeIcon = (type) => {
    if (type === 'phone') return <Phone className="w-3.5 h-3.5 text-slate-400" />;
    if (type === 'email') return <Mail className="w-3.5 h-3.5 text-slate-400" />;
    return <Globe className="w-3.5 h-3.5 text-slate-400" />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
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
      if (target.length > 5) {
        return `${target.slice(0, 3)}***${target.slice(-2)}`;
      }
    }
    return target;
  };

  const filteredHistory = filterType === 'all' 
    ? history 
    : history.filter(item => (item.type || '').toLowerCase() === filterType);

  if (loading) {
    return (
      <section className="history-panel-root">
        <div className="history-loading-box">
          <Activity className="w-5 h-5 text-indigo-400 animate-spin" />
          <span>Synchronizing audit telemetry...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="history-panel-root">
      <div className="history-top-header">
        <div className="history-title-group">
          <div className="history-icon-badge">
            <History className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="history-section-title">Recent Intelligence Audits</h2>
            <p className="history-section-desc">Encrypted activity record of scanned digital entities.</p>
          </div>
        </div>

        {/* Filter Pills */}
        {stats.total > 0 && (
          <div className="history-filter-pills">
            {['all', 'phone', 'email', 'website'].map(t => (
              <button
                key={t}
                type="button"
                className={`filter-btn ${filterType === t ? 'active' : ''}`}
                onClick={() => setFilterType(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Aggregate Stats Cards */}
      {stats.total > 0 && (
        <div className="history-stat-strip">
          <div className="stat-pill-card">
            <span className="stat-pill-num text-white">{stats.total}</span>
            <span className="stat-pill-label">Total Audits</span>
          </div>
          <div className="stat-pill-card">
            <span className="stat-pill-num text-emerald-400">{stats.lowRisk}</span>
            <span className="stat-pill-label">Verified Trust</span>
          </div>
          <div className="stat-pill-card">
            <span className="stat-pill-num text-amber-400">{stats.moderateRisk}</span>
            <span className="stat-pill-label">Review Advised</span>
          </div>
          <div className="stat-pill-card">
            <span className="stat-pill-num text-rose-400">{stats.highRisk}</span>
            <span className="stat-pill-label">Threats Flagged</span>
          </div>
        </div>
      )}

      {error ? (
        <div className="history-error-box">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : stats.total === 0 ? (
        <div className="history-empty-box">
          <div className="empty-radar-circle">
            <Search className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="empty-title">No Audit History Recorded</h3>
          <p className="empty-sub">
            Your telemetry and threat reports will automatically populate here after you conduct your first investigation.
          </p>
        </div>
      ) : (
        <div className="history-list-wrapper">
          <div className="history-items-grid">
            {filteredHistory.slice(0, 4).map(item => {
              const isLow = item.riskLevel === 'LOW RISK';
              const isHigh = item.riskLevel === 'HIGH RISK';
              const riskColor = isLow ? '#10B981' : (isHigh ? '#EF4444' : '#F59E0B');

              return (
                <div key={item.id} className="history-item-row">
                  <div className="item-risk-indicator">
                    {getRiskIcon(item.riskLevel)}
                  </div>

                  <div className="item-details-col">
                    <div className="item-target-text font-mono">
                      {maskTarget(item.type, item.targetValue || item.inputValue)}
                    </div>
                    <div className="item-sub-meta">
                      <span className="item-type-badge">
                        {getTypeIcon(item.type)}
                        <span>{(item.type || 'target').toUpperCase()}</span>
                      </span>
                      <span className="item-dot">•</span>
                      <span className="item-time">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="item-score-col" style={{ color: riskColor }}>
                    <span className="item-score-num">{item.score || 0}</span>
                    <span className="item-score-denom">/100</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {history.length > 4 && (
            <div className="history-view-all-wrap">
              <Link to="/history" className="history-view-all-btn">
                <span>View Complete Audit Log ({history.length})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default HistoryPanel;
