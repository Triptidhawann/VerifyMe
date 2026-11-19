import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle,
  Eye,
  Loader2
} from 'lucide-react';

const CredentialCheckHistory = ({ 
  history = [], 
  onSelectInvestigation, 
  onDeleteInvestigation,
  loading = false 
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
      return iso;
    }
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
    if (!window.confirm('Are you sure you want to delete this investigation record?')) return;
    setDeletingId(id);
    try {
      await onDeleteInvestigation(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="cc-card">
      <div className="cc-card-header">
        <div>
          <h2 className="cc-card-title">
            <History className="w-5 h-5 text-slate-800" />
            <span>Credential Investigation History</span>
          </h2>
          <p className="cc-card-desc">Audit activity record of analyzed certificates and credentials.</p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
          {history.length} Total Cases
        </span>
      </div>

      {/* Controls */}
      <div className="cc-history-controls">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by candidate, issuer, file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cc-search-input pl-8"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'ACADEMIC', 'INTERNSHIP', 'COURSE_COMPLETION', 'EXPERIENCE'].map(cat => (
            <button
              key={cat}
              type="button"
              className={`text-xs px-2.5 py-1 rounded-md font-bold border transition-colors ${selectedCategory === cat ? 'bg-[#174C3C] text-white border-[#0F3328]' : 'bg-[#FDFDFB] text-[#526056] border-[#DCE8DF] hover:bg-[#F6F5EF]'}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Case Management Table */}
      <div className="cc-table-wrapper">
        <table className="cc-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Case / File Name</th>
              <th style={{ width: '18%' }}>Candidate / Holder</th>
              <th style={{ width: '22%' }}>Issuing Organization</th>
              <th style={{ width: '14%' }}>Category</th>
              <th style={{ width: '12%' }}>Status</th>
              <th style={{ width: '12%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading investigation history...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                  No investigation cases located matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const holder = item.extractedFields?.holderName?.value || 'Unstated';
                const issuer = item.extractedFields?.issuingOrganization?.value || item.issuerIdentity?.queryOrg || 'Unstated';
                const isDel = deletingId === item.id;

                let badgeClass = 'unverified';
                if (item.outcome === 'VERIFIED') badgeClass = 'exact';
                else if (item.outcome === 'PARTIALLY_VERIFIED') badgeClass = 'partial';
                else if (item.outcome === 'SUSPICIOUS') badgeClass = 'mismatch';

                return (
                  <tr 
                    key={item.id} 
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => onSelectInvestigation(item)}
                  >
                    <td>
                      <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                        {item.fileName || 'Uploaded Document'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        ID: {item.id} • {formatDate(item.createdAt || item.createdAtIso)}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-slate-800">{holder}</span>
                    </td>
                    <td>
                      <span className="text-slate-800">{issuer}</span>
                    </td>
                    <td>
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        {(item.category || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`cc-match-badge ${badgeClass}`}>
                        {(item.outcome || 'INSUFFICIENT').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="cc-action-btn-sm"
                          onClick={() => onSelectInvestigation(item)}
                          title="Open Case File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          className="cc-action-btn-sm cc-action-btn-danger"
                          onClick={(e) => handleDelete(e, item.id)}
                          disabled={isDel}
                          title="Delete Case Record"
                        >
                          {isDel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CredentialCheckHistory;
