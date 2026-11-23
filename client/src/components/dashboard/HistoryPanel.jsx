import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  History,
  Phone,
  Mail,
  Globe,
  Search
} from 'lucide-react';
import VerifyMeLoader from '../auth/VerifyMeLoader';
import './HistoryPanel.css';

export const HistoryPanel = ({ refreshTrigger, onInspectAudit }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
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
  }, [user, refreshTrigger]);

  const total = history.length;
  const lowRisk = history.filter(h => h.riskLevel === 'LOW RISK' || h.technicalStatus === 'TECHNICAL CHECKS PASSED').length;
  const moderateRisk = history.filter(h => h.riskLevel === 'MODERATE RISK' || h.riskLevel === 'LIMITED VERIFICATION' || h.riskLevel === 'SUSPICIOUS').length;
  const highRisk = history.filter(h => h.riskLevel === 'HIGH RISK' || h.technicalStatus === 'CONFIRMED THREAT').length;

  const getRiskDetails = (level, techStatus) => {
    if (level === 'LOW RISK' || techStatus === 'TECHNICAL CHECKS PASSED') {
      return {
        icon: ShieldCheck,
        label: 'Passed',
        color: '#2E7D5B',
        bg: '#EFF8F3',
        border: '#CDE8D8'
      };
    }
    if (level === 'HIGH RISK' || techStatus === 'CONFIRMED THREAT') {
      return {
        icon: ShieldAlert,
        label: 'High Risk',
        color: '#D94E4E',
        bg: '#FEF3F3',
        border: '#FCDCDC'
      };
    }
    if (level === 'INVALID INPUT' || techStatus === 'INVALID INPUT') {
      return {
        icon: AlertTriangle,
        label: 'Invalid',
        color: '#737D76',
        bg: '#F4F7F4',
        border: '#E7EEE9'
      };
    }
    return {
      icon: Shield,
      label: 'Caution',
      color: '#B45309',
      bg: '#FEF3C7',
      border: '#FDE68A'
    };
  };

  const getTypeIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'phone') return Phone;
    if (t === 'email') return Mail;
    return Globe;
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
    const t = (type || '').toLowerCase();
    if (t === 'email') {
      const parts = target.split('@');
      if (parts.length === 2) {
        return `${parts[0].charAt(0)}***@${parts[1]}`;
      }
    }
    if (t === 'phone') {
      if (target.length > 6) {
        return `${target.slice(0, 3)}***${target.slice(-3)}`;
      }
    }
    return target;
  };

  const filteredHistory = filterType === 'all' 
    ? history 
    : history.filter(item => (item.type || '').toLowerCase() === filterType);

  if (loading) {
    return (
      <div className="history-card-root">
        <div className="history-loading-state">
          <VerifyMeLoader size="md" variant="mint" label="Loading verifications..." />
          <span className="history-loading-text">Loading verification activity...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="history-card-root">
      {/* Header with Title and Filter Buttons */}
      <div className="history-header-bar">
        <div className="history-title-wrap">
          <div className="history-icon-box">
            <History className="w-4 h-4 text-[#49B99A]" />
          </div>
          <div>
            <h2 className="history-heading">Recent Verification Activity</h2>
            <p className="history-subheading">Past checks and security assessments.</p>
          </div>
        </div>

        {total > 0 && (
          <div className="history-filter-strip" role="tablist" aria-label="Filter verification types">
            {['all', 'phone', 'email', 'website'].map(t => (
              <button
                key={t}
                type="button"
                className={`history-filter-btn ${filterType === t ? 'active' : ''}`}
                onClick={() => setFilterType(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Aggregate Counts Strip */}
      {total > 0 && (
        <div className="history-metric-bar">
          <div className="metric-pill">
            <span className="metric-num">{total}</span>
            <span className="metric-label">Total Checks</span>
          </div>
          <div className="metric-pill passed">
            <span className="metric-num">{lowRisk}</span>
            <span className="metric-label">Passed</span>
          </div>
          <div className="metric-pill caution">
            <span className="metric-num">{moderateRisk}</span>
            <span className="metric-label">Caution</span>
          </div>
          <div className="metric-pill flagged">
            <span className="metric-num">{highRisk}</span>
            <span className="metric-label">High Risk</span>
          </div>
        </div>
      )}

      {error ? (
        <div className="history-error-state">
          <AlertTriangle className="w-4 h-4 text-[#D94E4E]" />
          <span>{error}</span>
        </div>
      ) : total === 0 ? (
        /* Empty State */
        <div className="history-empty-state">
          <div className="history-empty-icon-circle">
            <Search className="w-5 h-5 text-[#49B99A]" />
          </div>
          <h3 className="history-empty-title">No verifications recorded yet</h3>
          <p className="history-empty-description">
            Your verification history and threat reports will appear here once you analyze a phone number, email address, or website.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="history-empty-state">
          <p className="history-empty-description">
            No verification records matching the "{filterType}" filter.
          </p>
        </div>
      ) : (
        /* Items List */
        <div className="history-items-container">
          <div className="history-rows-list">
            {filteredHistory.slice(0, 5).map(item => {
              const risk = getRiskDetails(item.riskLevel, item.technicalStatus);
              const RiskIcon = risk.icon;
              const TypeIcon = getTypeIcon(item.type);
              const targetStr = item.targetValue || item.inputValue || item.target || '';
              const scoreVal = item.score ?? item.technicalHealthScore ?? 0;

              return (
                <div 
                  key={item.id} 
                  className="history-row"
                  onClick={() => {
                    if (onInspectAudit) onInspectAudit(item);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (onInspectAudit) onInspectAudit(item);
                    }
                  }}
                >
                  <div className="history-row-left">
                    <div 
                      className="history-risk-badge" 
                      style={{ backgroundColor: risk.bg, color: risk.color, borderColor: risk.border }}
                      title={`Status: ${risk.label}`}
                    >
                      <RiskIcon className="w-4 h-4" />
                    </div>

                    <div className="history-row-details">
                      <div className="history-row-target">
                        {maskTarget(item.type, targetStr)}
                      </div>
                      <div className="history-row-meta">
                        <span className="history-type-tag">
                          <TypeIcon className="w-3 h-3" />
                          <span>{(item.type || 'target').toUpperCase()}</span>
                        </span>
                        <span className="history-dot">•</span>
                        <span className="history-time">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="history-row-right">
                    <div 
                      className="history-status-chip"
                      style={{ backgroundColor: risk.bg, color: risk.color, borderColor: risk.border }}
                    >
                      {risk.label}
                    </div>

                    <div className="history-score-tag">
                      <span className="score-num" style={{ color: risk.color }}>{scoreVal}</span>
                      <span className="score-denom">/100</span>
                    </div>

                    <button 
                      type="button" 
                      className="history-inspect-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onInspectAudit) onInspectAudit(item);
                      }}
                      title="Inspect full report"
                      aria-label="Inspect full report"
                    >
                      <span>Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {history.length > 5 && (
            <div className="history-footer-wrap">
              <Link to="/history" className="history-view-all-link">
                <span>View Complete Verification History ({history.length})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
