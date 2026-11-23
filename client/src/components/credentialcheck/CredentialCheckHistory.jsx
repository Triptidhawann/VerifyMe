import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle,
  FolderOpen,
  PlusCircle,
  Hash,
  Award
} from 'lucide-react';
import './CredentialCheck.css';

export const CredentialCheckHistory = ({ 
  history = [], 
  onSelectInvestigation, 
  onDeleteInvestigation,
  loading = false,
  onStartNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const formatCategoryName = (cat) => {
    const map = {
      AUTO: 'Auto-detected',
      INTERNSHIP: 'Internship',
      COURSE_COMPLETION: 'Course',
      TRAINING: 'Training',
      EXPERIENCE: 'Experience',
      ACADEMIC: 'Academic',
      PROFESSIONAL_CERTIFICATION: 'Certification'
    };
    return map[cat] || cat?.replace(/_/g, ' ') || 'Document';
  };

  const getOutcomeTag = (outcome) => {
    if (outcome === 'VERIFIED') {
      return { class: 'verified', label: 'VERIFIED', icon: ShieldCheck };
    }
    if (outcome === 'PARTIALLY_VERIFIED') {
      return { class: 'likely', label: 'PARTIAL', icon: ShieldCheck };
    }
    if (outcome === 'SUSPICIOUS') {
      return { class: 'suspicious', label: 'SUSPICIOUS', icon: AlertTriangle };
    }
    return { class: 'insufficient', label: 'INSUFFICIENT', icon: HelpCircle };
  };

  const filtered = history.filter(item => {
    const matchesSearch = 
      (item.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.extractedFields?.issuingOrganization?.value || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.extractedFields?.holderName?.value || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this investigation record?')) return;
    setDeletingId(id);
    try {
      await onDeleteInvestigation(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="cc-history-root fadeIn">
      {/* Header */}
      <div className="cc-intake-header">
        <h1 className="cc-intake-title">Investigation Records</h1>
        <p className="cc-intake-subtitle">
          Review, export, and cross-reference previously analyzed credentials, academic records, and investigation dossiers.
        </p>
      </div>

      <div className="cc-history-container">
        {/* Controls Card: Search & Filter Pills */}
        <div className="cc-history-controls-card">
          <div className="cc-search-input-wrap">
            <Search className="cc-search-icon w-4 h-4 text-[#94A098]" />
            <input
              type="text"
              className="cc-history-search-input"
              placeholder="Search by case ID, candidate, issuer, or file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="cc-history-filter-pills font-mono" role="tablist">
            {[
              { id: 'ALL', label: `ALL (${history.length})` },
              { id: 'ACADEMIC', label: 'ACADEMIC' },
              { id: 'INTERNSHIP', label: 'INTERNSHIP' },
              { id: 'COURSE_COMPLETION', label: 'COURSE' },
              { id: 'EXPERIENCE', label: 'EXPERIENCE' }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === pill.id}
                className={`cc-filter-pill ${selectedCategory === pill.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(pill.id)}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* History Table / Records List */}
        {loading ? (
          <div className="cc-history-loading">
            <div className="cc-loading-pulse-dot" />
            <span className="font-mono text-xs text-[#737D76]">Retrieving credential records...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="cc-history-empty">
            <div className="cc-empty-icon-wrap">
              <FolderOpen className="w-6 h-6 text-[#49B99A]" />
            </div>
            <h3 className="cc-empty-title">No investigation records found</h3>
            <p className="cc-empty-desc">
              {searchTerm || selectedCategory !== 'ALL' 
                ? 'Try adjusting your search criteria or resetting filters.' 
                : 'You have not submitted any credentials or certificates for investigation yet.'}
            </p>
            {onStartNew && (
              <button 
                type="button" 
                onClick={onStartNew}
                className="cc-empty-cta-btn"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start New Investigation</span>
              </button>
            )}
          </div>
        ) : (
          <div className="cc-table-wrapper">
            <table className="cc-history-table">
              <thead>
                <tr>
                  <th style={{ width: '16%' }}>Case Reference</th>
                  <th style={{ width: '34%' }}>Credential / Issuer</th>
                  <th style={{ width: '14%' }}>Category</th>
                  <th style={{ width: '16%' }}>Assessment</th>
                  <th style={{ width: '10%' }}>Date</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const tag = getOutcomeTag(item.outcome);
                  const TagIcon = tag.icon;
                  const candidate = item.extractedFields?.holderName?.value || null;
                  const issuer = item.extractedFields?.issuingOrganization?.value || item.fileName || 'Unspecified Issuer';

                  return (
                    <tr 
                      key={item.id}
                      onClick={() => onSelectInvestigation(item)}
                      className="cc-table-row-clickable"
                    >
                      <td>
                        <span className="cc-case-id-tag font-mono">
                          <Hash className="w-3 h-3 inline text-[#94A098] mr-0.5" />
                          {item.id ? item.id.slice(0, 10) : 'CRED-CASE'}
                        </span>
                      </td>
                      <td>
                        <div className="cc-cell-title">
                          {candidate ? `${candidate}` : issuer}
                        </div>
                        <div className="cc-cell-subtitle">
                          {candidate ? `${issuer} • ${item.fileName}` : item.fileName}
                        </div>
                      </td>
                      <td>
                        <span className="cc-format-pill font-mono">
                          <Award className="w-3.5 h-3.5 text-[#737D76]" />
                          <span>{formatCategoryName(item.category)}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`cc-outcome-badge ${tag.class} font-mono`}>
                          <TagIcon className="w-3 h-3 shrink-0" />
                          <span>{tag.label}</span>
                        </span>
                      </td>
                      <td className="cc-date-cell font-mono">
                        {formatDate(item.createdAt || item.createdAtIso)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onSelectInvestigation(item)}
                            className="cc-review-link"
                            title="Open Investigation Dossier"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, item.id)}
                            disabled={deletingId === item.id}
                            className="cc-delete-btn"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

export default CredentialCheckHistory;
