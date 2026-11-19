import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle,
  FileText,
  Briefcase,
  ImageIcon,
  LinkIcon,
  FolderOpen
} from 'lucide-react';
import './JobShield.css';

const JobShieldHistory = ({ history = [], loading = false, onSelectCase, onStartNew }) => {
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
    if (type === 'pdf') return <Briefcase className="w-3.5 h-3.5 text-slate-500" />;
    if (type === 'image') return <ImageIcon className="w-3.5 h-3.5 text-slate-500" />;
    if (type === 'url') return <LinkIcon className="w-3.5 h-3.5 text-slate-500" />;
    return <FileText className="w-3.5 h-3.5 text-slate-500" />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="js-panel">
      <div className="js-panel-header">
        <div className="js-panel-title-group">
          <FolderOpen className="w-4 h-4 text-slate-700" />
          <h2 className="js-panel-title">Case Management History</h2>
        </div>
        <span className="js-panel-subtitle">{history.length} investigation record(s)</span>
      </div>

      <div className="js-panel-body">
        {/* Search and Filters Bar */}
        <div className="js-history-controls">
          <div className="relative">
            <input
              type="text"
              className="js-history-search-input"
              placeholder="Search by case ID, title, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="js-history-filter-pills">
            <button
              type="button"
              className={`js-filter-pill ${outcomeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setOutcomeFilter('all')}
            >
              All Cases
            </button>
            <button
              type="button"
              className={`js-filter-pill ${outcomeFilter === 'verified' ? 'active' : ''}`}
              onClick={() => setOutcomeFilter('verified')}
            >
              Verified
            </button>
            <button
              type="button"
              className={`js-filter-pill ${outcomeFilter === 'likely' ? 'active' : ''}`}
              onClick={() => setOutcomeFilter('likely')}
            >
              Likely Legitimate
            </button>
            <button
              type="button"
              className={`js-filter-pill ${outcomeFilter === 'suspicious' ? 'active' : ''}`}
              onClick={() => setOutcomeFilter('suspicious')}
            >
              Suspicious
            </button>
            <button
              type="button"
              className={`js-filter-pill ${outcomeFilter === 'high-risk' ? 'active' : ''}`}
              onClick={() => setOutcomeFilter('high-risk')}
            >
              High Risk
            </button>
          </div>
        </div>

        {/* History Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading case records from secure database...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-md">
            <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No matching investigation records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || outcomeFilter !== 'all' 
                ? 'Try adjusting your search criteria or filter pills.' 
                : 'You have not submitted any recruitment communications for investigation yet.'}
            </p>
            {onStartNew && (
              <button 
                type="button" 
                onClick={onStartNew}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
              >
                <span>Stage New Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <table className="js-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Case ID</th>
                <th style={{ width: '35%' }}>Opportunity / Employer</th>
                <th style={{ width: '12%' }}>Submission</th>
                <th style={{ width: '18%' }}>Assessment Outcome</th>
                <th style={{ width: '12%' }}>Date</th>
                <th style={{ width: '8%', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const tag = getOutcomeTag(item.outcome);
                const TagIcon = tag.icon;
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.id ? item.id.slice(0, 12) : 'INV-CASE'}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900 truncate">
                        {item.claims?.jobTitle || item.jobTitle || 'Unspecified Role'}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate">
                        {item.claims?.companyName || item.claimedCompany || 'Unspecified Employer'}
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 capitalize">
                        {getSubmissionIcon(item.submissionType)}
                        <span>{item.submissionType || 'text'}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`js-outcome-badge ${tag.class} text-[10px]`}>
                        <TagIcon className="w-3 h-3" />
                        <span>{tag.label}</span>
                      </span>
                    </td>
                    <td className="text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => onSelectCase(item)}
                        className="text-xs font-bold text-[#174C3C] hover:text-[#0F3328] inline-flex items-center gap-0.5"
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
        )}
      </div>
    </div>
  );
};

export default JobShieldHistory;
