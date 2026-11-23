import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle,
  FileText,
  Briefcase,
  ImageIcon,
  LinkIcon,
  FolderOpen,
  PlusCircle,
  Hash
} from 'lucide-react';
import './JobShield.css';

export const JobShieldHistory = ({ history = [], loading = false, onSelectCase, onStartNew }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const filtered = history.filter((item) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const company = (item.claims?.companyName || item.claimedCompany || '').toLowerCase();
      const title = (item.claims?.jobTitle || item.jobTitle || '').toLowerCase();
      const id = (item.id || '').toLowerCase();
      if (!company.includes(q) && !title.includes(q) && !id.includes(q)) {
        return false;
      }
    }

    // Outcome filter
    if (outcomeFilter !== 'all') {
      if (outcomeFilter === 'verified' && item.outcome !== 'VERIFIED THROUGH OFFICIAL SOURCES') return false;
      if (outcomeFilter === 'likely' && item.outcome !== 'LIKELY LEGITIMATE — SOME DETAILS UNVERIFIED') return false;
      if (outcomeFilter === 'suspicious' && item.outcome !== 'SUSPICIOUS — INCONSISTENCIES DETECTED') return false;
      if (outcomeFilter === 'high-risk' && item.outcome !== 'HIGH RISK — STRONG FRAUD INDICATORS') return false;
    }

    return true;
  });

  const getOutcomeTag = (outcome) => {
    if (outcome === 'VERIFIED THROUGH OFFICIAL SOURCES') {
      return { class: 'verified', label: 'VERIFIED', icon: ShieldCheck };
    }
    if (outcome === 'LIKELY LEGITIMATE — SOME DETAILS UNVERIFIED') {
      return { class: 'likely', label: 'LIKELY LEGITIMATE', icon: ShieldCheck };
    }
    if (outcome === 'SUSPICIOUS — INCONSISTENCIES DETECTED') {
      return { class: 'suspicious', label: 'SUSPICIOUS', icon: AlertTriangle };
    }
    if (outcome === 'HIGH RISK — STRONG FRAUD INDICATORS') {
      return { class: 'high-risk', label: 'HIGH RISK', icon: ShieldAlert };
    }
    return { class: 'insufficient', label: 'INSUFFICIENT', icon: HelpCircle };
  };

  const getSubmissionIcon = (type) => {
    if (type === 'pdf') return <Briefcase className="w-3.5 h-3.5 text-[#737D76]" />;
    if (type === 'image') return <ImageIcon className="w-3.5 h-3.5 text-[#737D76]" />;
    if (type === 'url') return <LinkIcon className="w-3.5 h-3.5 text-[#737D76]" />;
    return <FileText className="w-3.5 h-3.5 text-[#737D76]" />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    try {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="js-history-root fadeIn">
      {/* Header */}
      <div className="js-intake-header">
        <h2 className="js-intake-title">Investigation Records</h2>
        <p className="js-intake-subtitle">
          Review, export, and cross-reference previously analyzed recruitment opportunities and verdicts.
        </p>
      </div>

      <div className="js-history-container">
        {/* Controls Bar: Search & Filter Pills */}
        <div className="js-history-controls-card">
          <div className="js-search-input-wrap">
            <Search className="js-search-icon w-4 h-4 text-[#94A098]" />
            <input
              type="text"
              className="js-history-search-input"
              placeholder="Search by Case ID, role title, employer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="js-history-filter-pills font-mono" role="tablist">
            {[
              { id: 'all', label: `ALL (${history.length})` },
              { id: 'verified', label: 'VERIFIED' },
              { id: 'likely', label: 'LIKELY' },
              { id: 'suspicious', label: 'SUSPICIOUS' },
              { id: 'high-risk', label: 'HIGH RISK' }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                role="tab"
                aria-selected={outcomeFilter === pill.id}
                className={`js-filter-pill ${outcomeFilter === pill.id ? 'active' : ''}`}
                onClick={() => setOutcomeFilter(pill.id)}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* History Table / Records List */}
        {loading ? (
          <div className="js-history-loading">
            <div className="js-loading-pulse-dot" />
            <span className="font-mono text-xs text-[#737D76]">Retrieving investigation history...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="js-history-empty">
            <div className="js-empty-icon-wrap">
              <FolderOpen className="w-6 h-6 text-[#49B99A]" />
            </div>
            <h3 className="js-empty-title">No investigation records found</h3>
            <p className="js-empty-desc">
              {searchQuery || outcomeFilter !== 'all' 
                ? 'Try adjusting your search criteria or resetting filters.' 
                : 'You have not submitted any recruitment communications or offers for investigation yet.'}
            </p>
            {onStartNew && (
              <button 
                type="button" 
                onClick={onStartNew}
                className="js-empty-cta-btn"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start New Investigation</span>
              </button>
            )}
          </div>
        ) : (
          <div className="js-table-wrapper">
            <table className="js-history-table">
              <thead>
                <tr>
                  <th style={{ width: '16%' }}>Case ID</th>
                  <th style={{ width: '34%' }}>Opportunity / Employer</th>
                  <th style={{ width: '14%' }}>Format</th>
                  <th style={{ width: '18%' }}>Assessment</th>
                  <th style={{ width: '10%' }}>Date</th>
                  <th style={{ width: '8%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const tag = getOutcomeTag(item.outcome);
                  const TagIcon = tag.icon;
                  return (
                    <tr 
                      key={item.id}
                      onClick={() => onSelectCase(item)}
                      className="js-table-row-clickable"
                    >
                      <td>
                        <span className="js-case-id-tag font-mono">
                          <Hash className="w-3 h-3 inline text-[#94A098] mr-0.5" />
                          {item.id ? item.id.slice(0, 10) : 'INV-CASE'}
                        </span>
                      </td>
                      <td>
                        <div className="js-cell-title">
                          {item.claims?.jobTitle || item.jobTitle || 'Unspecified Role'}
                        </div>
                        <div className="js-cell-subtitle">
                          {item.claims?.companyName || item.claimedCompany || 'Unspecified Employer'}
                        </div>
                      </td>
                      <td>
                        <span className="js-format-pill font-mono">
                          {getSubmissionIcon(item.submissionType)}
                          <span>{item.submissionType || 'text'}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`js-outcome-badge ${tag.class} font-mono`}>
                          <TagIcon className="w-3 h-3 shrink-0" />
                          <span>{tag.label}</span>
                        </span>
                      </td>
                      <td className="js-date-cell font-mono">
                        {formatDate(item.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(item);
                          }}
                          className="js-review-link"
                          title="Open Case Dossier"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobShieldHistory;
