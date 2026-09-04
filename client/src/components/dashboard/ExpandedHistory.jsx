import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { Shield, ShieldAlert, ShieldCheck, Activity, Search, Filter, Phone, Mail, Link as LinkIcon } from 'lucide-react';
import VerificationResult from './VerificationResult';
import './ExpandedHistory.css';

const ExpandedHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filterType, setFilterType] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedItem, setSelectedItem] = useState(null);

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

  let filteredHistory = history.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterRisk !== 'all') {
      if (filterRisk === 'low' && item.riskLevel !== 'LOW RISK') return false;
      if (filterRisk === 'medium' && item.riskLevel !== 'MODERATE RISK') return false;
      if (filterRisk === 'high' && item.riskLevel !== 'HIGH RISK') return false;
    }
    if (searchQuery) {
      if (!item.inputValue.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  if (sortOrder === 'oldest') {
    filteredHistory = [...filteredHistory].reverse();
  }

  const getRiskIcon = (level) => {
    if (level === 'LOW RISK') return <ShieldCheck size={20} style={{ color: '#10b981' }} />;
    if (level === 'HIGH RISK') return <ShieldAlert size={20} style={{ color: '#ef4444' }} />;
    return <Shield size={20} style={{ color: '#f59e0b' }} />;
  };

  const getTypeIcon = (type) => {
    if (type === 'phone') return <Phone size={16} />;
    if (type === 'email') return <Mail size={16} />;
    if (type === 'website') return <LinkIcon size={16} />;
    return null;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedItem) {
    return (
      <div className="history-detail-view">
        <button className="btn btn-secondary back-btn" onClick={() => setSelectedItem(null)}>
          ← Back to History
        </button>
        <div className="history-detail-timestamp">
          Analyzed on {formatDate(selectedItem.createdAt)}
        </div>
        <VerificationResult result={selectedItem} onVerifyAnother={() => setSelectedItem(null)} />
      </div>
    );
  }

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

  return (
    <div className="expanded-history">
      <div className="history-filters">
        <div className="filter-group search-group" style={{ flex: 1 }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search targets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="history-search-input"
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="website">Website</option>
          </select>
        </div>
        <div className="filter-group">
          <Shield size={18} />
          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
            <option value="all">All Risks</option>
            <option value="low">Low Risk</option>
            <option value="medium">Moderate Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
        <div className="filter-group">
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="history-loading" style={{ minHeight: '400px' }}>
          <Activity className="spinning" size={24} />
          <span>Loading intelligence history...</span>
        </div>
      ) : error ? (
        <div className="history-error">{error}</div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-history" style={{ minHeight: '400px' }}>
          <div className="empty-icon-wrapper">
            <Search size={48} />
          </div>
          <h3 style={{ textTransform: 'uppercase', fontSize: '1.125rem', letterSpacing: '0.05em' }}>
            {history.length === 0 ? "No investigations yet" : "No results found"}
          </h3>
          <p>
            {history.length === 0 
              ? "Your verification intelligence will appear here after your first investigation."
              : "No investigations match your current filters."}
          </p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Risk</th>
                <th>Target</th>
                <th>Type</th>
                <th>Score</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(item => (
                <tr key={item.id} onClick={() => setSelectedItem(item)} className="history-row">
                  <td className="risk-cell">
                    <div className="risk-badge" data-risk={item.riskLevel}>
                      {getRiskIcon(item.riskLevel)}
                      <span className="risk-text">{item.riskLevel}</span>
                    </div>
                  </td>
                  <td className="target-cell">{maskTarget(item.type, item.inputValue)}</td>
                  <td className="type-cell">
                    <div className="type-badge-inline">
                      {getTypeIcon(item.type)}
                      {item.type.toUpperCase()}
                    </div>
                  </td>
                  <td className="score-cell">
                    <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>{item.score}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/100</span>
                  </td>
                  <td className="date-cell">{formatDate(item.createdAt)}</td>
                  <td className="action-cell">
                    <button className="view-link">View Analysis</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpandedHistory;
