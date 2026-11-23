import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  Upload, 
  X, 
  AlertCircle, 
  ChevronDown, 
  Building, 
  Globe, 
  Hash, 
  GraduationCap, 
  Award, 
  Briefcase, 
  BookOpen, 
  Scroll, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  FileCheck2,
  Check,
  Info
} from 'lucide-react';
import VerifyMeLoader from '../auth/VerifyMeLoader';
import './CredentialCheck.css';

const CATEGORIES = [
  { 
    id: 'AUTO', 
    label: 'Auto-detect Category', 
    badge: 'Recommended',
    desc: 'Determined automatically via structural document analysis',
    icon: Sparkles
  },
  { 
    id: 'INTERNSHIP', 
    label: 'Internship Certificate', 
    desc: 'Summer, industrial, or project internship completion letter',
    icon: Award
  },
  { 
    id: 'COURSE_COMPLETION', 
    label: 'Course Completion', 
    desc: 'Online platform, technical academy, or bootcamp certificate',
    icon: BookOpen
  },
  { 
    id: 'TRAINING', 
    label: 'Training Certificate', 
    desc: 'Vocational, industrial, or corporate workshop credential',
    icon: Scroll
  },
  { 
    id: 'EXPERIENCE', 
    label: 'Experience Letter', 
    desc: 'Relieving letter, work tenure, or service certificate',
    icon: Briefcase
  },
  { 
    id: 'ACADEMIC', 
    label: 'Academic Degree / Marksheet', 
    desc: 'University degree, diploma, or semester marksheet',
    icon: GraduationCap
  },
  { 
    id: 'PROFESSIONAL_CERTIFICATION', 
    label: 'Professional Certification', 
    desc: 'Licensing board or statutory charter credential',
    icon: ShieldCheck
  }
];

export const CredentialCheckSubmit = ({ onSubmit, loading, error }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [fileError, setFileError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('AUTO');
  const [issuerName, setIssuerName] = useState('');
  const [issuerWebsite, setIssuerWebsite] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [candidateConsent, setCandidateConsent] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileProcess = (file) => {
    setFileError(null);
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds the 10 MB maximum limit.');
      return;
    }

    // Validate format
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(file.type) && !['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
      setFileError('Invalid file format. Please upload a PDF, PNG, or JPEG/JPG document.');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.onerror = () => {
      setFileError('Failed to read document buffer. Please try selecting the file again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setFileBase64('');
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFileError(null);

    if (!fileBase64 || !selectedFile) {
      setFileError('Please select or drop a credential document before submitting.');
      return;
    }

    onSubmit({
      fileBase64,
      fileName: selectedFile.name,
      mimeType: selectedFile.type || 'application/pdf',
      documentCategory: selectedCategory === 'AUTO' ? null : selectedCategory,
      issuerName: issuerName.trim() || null,
      issuerWebsite: issuerWebsite.trim() || null,
      certificateNumber: certificateNumber.trim() || null,
      candidateConsent
    });
  };

  return (
    <div className="cc-intake-root fadeIn">
      {/* 1. Page Introduction */}
      <div className="cc-intake-header">
        <h1 className="cc-intake-title">Verify a document. Understand what it proves.</h1>
        <p className="cc-intake-subtitle">
          Examine certificates, academic records and experience documents for issuer legitimacy, document integrity and claim consistency.
        </p>
      </div>

      {/* 2. Main Submission Workspace Card */}
      <div className="cc-workspace-card">
        <form onSubmit={handleSubmit} noValidate className="cc-intake-form">
          {/* SECTION A: DOCUMENT UPLOAD AREA */}
          <div className="cc-form-section">
            <div className="cc-section-header">
              <label className="cc-section-label">
                Upload Credential Document
              </label>
              <span className="cc-section-hint font-mono">
                PDF, PNG, JPEG • Max 10 MB
              </span>
            </div>

            {!selectedFile ? (
              <div 
                className={`cc-dropzone ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Upload document area"
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => e.target.files && handleFileProcess(e.target.files[0])}
                  className="hidden" 
                />
                <div className="cc-dropzone-icon-box">
                  <Upload className="w-6 h-6 text-[#49B99A]" />
                </div>
                <div className="cc-dropzone-content">
                  <p className="cc-dropzone-primary-text">
                    <span className="text-[#49B99A] font-semibold underline">Click to upload</span> or drag and drop document
                  </p>
                  <p className="cc-dropzone-sub-text">
                    Digital certificates, scanned academic marksheets, or employment letters
                  </p>
                </div>
              </div>
            ) : (
              <div className="cc-file-selected-card fadeIn">
                <div className="cc-file-info">
                  <div className="cc-file-icon-box">
                    <FileCheck2 className="w-5 h-5 text-[#2E7D5B]" />
                  </div>
                  <div>
                    <div className="cc-file-name font-mono">{selectedFile.name}</div>
                    <div className="cc-file-meta">
                      <span className="cc-ready-badge font-mono">Ready for analysis</span>
                      <span className="cc-file-size font-mono">{formatFileSize(selectedFile.size)}</span>
                      <span className="cc-file-type font-mono uppercase">{selectedFile.type?.split('/')[1] || 'PDF'}</span>
                    </div>
                  </div>
                </div>
                <div className="cc-file-actions">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cc-file-action-btn"
                    title="Choose a different file"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="cc-file-action-btn danger"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: DOCUMENT CATEGORY SELECTION */}
          <div className="cc-form-section">
            <div className="cc-section-header">
              <label className="cc-section-label">
                Document Category
              </label>
              <span className="cc-section-hint">
                Selects tailored forensic and directory cross-match rules
              </span>
            </div>

            <div className="cc-categories-grid" role="radiogroup" aria-label="Document Category Selection">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`cc-category-tile ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <div className="cc-tile-icon-box">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="cc-tile-body">
                      <div className="cc-tile-title-row">
                        <span className="cc-tile-title">{cat.label}</span>
                        {cat.badge && (
                          <span className="cc-tile-badge font-mono">{cat.badge}</span>
                        )}
                        {isSelected && (
                          <span className="cc-tile-check">
                            <Check className="w-3.5 h-3.5 text-[#2E7D5B] stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="cc-tile-desc">{cat.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION C: OPTIONAL CONTEXT (EXPANDABLE) */}
          <div className="cc-optional-context-box">
            <button
              type="button"
              className="cc-optional-toggle"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              aria-expanded={showOptionalFields}
            >
              <div className="flex flex-col text-left">
                <span className="font-semibold text-sm text-[#202923]">Add document details (optional)</span>
                <span className="text-xs text-[#737D76]">
                  Helps disambiguate organization registries if document scan is low-contrast
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#737D76] transition-transform ${showOptionalFields ? 'rotate-180' : ''}`} />
            </button>

            {showOptionalFields && (
              <div className="cc-optional-fields-pane fadeIn">
                <div className="cc-context-notice">
                  <Info className="w-4 h-4 text-[#737D76] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#556058] leading-relaxed">
                    <strong>Note:</strong> Any information supplied here helps cross-reference official directories, but is <em>not</em> treated as independently verified simply because it was entered.
                  </p>
                </div>

                <div className="cc-optional-fields-grid">
                  <div className="cc-optional-field">
                    <label htmlFor="cc-claimed-issuer" className="cc-sub-label">
                      Claimed Issuer (Company or Institution)
                    </label>
                    <div className="cc-field-inner">
                      <Building className="w-4 h-4 text-[#94A098] shrink-0" />
                      <input 
                        id="cc-claimed-issuer"
                        type="text"
                        placeholder="e.g. AWS, Infosys, or Delhi University"
                        value={issuerName}
                        onChange={(e) => setIssuerName(e.target.value)}
                        disabled={loading}
                        className="cc-sub-input"
                      />
                    </div>
                  </div>

                  <div className="cc-optional-field">
                    <label htmlFor="cc-claimed-website" className="cc-sub-label">
                      Official Website or Domain
                    </label>
                    <div className="cc-field-inner">
                      <Globe className="w-4 h-4 text-[#94A098] shrink-0" />
                      <input 
                        id="cc-claimed-website"
                        type="text"
                        placeholder="e.g. aws.amazon.com or infosys.com"
                        value={issuerWebsite}
                        onChange={(e) => setIssuerWebsite(e.target.value)}
                        disabled={loading}
                        className="cc-sub-input"
                      />
                    </div>
                  </div>

                  <div className="cc-optional-field">
                    <label htmlFor="cc-cert-number" className="cc-sub-label">
                      Certificate / Roll / ID Number
                    </label>
                    <div className="cc-field-inner">
                      <Hash className="w-4 h-4 text-[#94A098] shrink-0" />
                      <input 
                        id="cc-cert-number"
                        type="text"
                        placeholder="e.g. INFY-INT-2026-88421"
                        value={certificateNumber}
                        onChange={(e) => setCertificateNumber(e.target.value)}
                        disabled={loading}
                        className="cc-sub-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION D: CANDIDATE CONSENT */}
          <div className="cc-consent-card">
            <label className="cc-consent-label">
              <input 
                type="checkbox"
                checked={candidateConsent}
                onChange={(e) => setCandidateConsent(e.target.checked)}
                disabled={loading}
                className="cc-consent-checkbox"
              />
              <div className="cc-consent-text">
                <span className="cc-consent-title">
                  Candidate Consent for Statutory & Institutional Verification
                </span>
                <span className="cc-consent-desc">
                  I confirm that candidate authorization has been obtained for verifying academic or statutory records through DigiLocker NAD and official registrar channels in accordance with the Information Technology Act (2000) and the Digital Personal Data Protection Act (DPDP).
                </span>
              </div>
            </label>
          </div>

          {/* Error Banners */}
          {(fileError || error) && (
            <div className="cc-error-banner fadeIn" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{fileError || error}</span>
            </div>
          )}

          {/* SECTION E: PRIMARY SUBMISSION ACTION */}
          <div className="cc-submit-action-wrap">
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="cc-primary-submit-btn"
            >
              {loading ? (
                <>
                  <VerifyMeLoader size="sm" variant="white" label="Analyzing document..." />
                  <span>Analyzing Document...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#C7D99A]" />
                  <span>Analyse Document</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Subtle Footer Note */}
      <div className="cc-intake-footer-note">
        <ShieldCheck className="w-4 h-4 text-[#737D76]" />
        <span>Document integrity is audited using SHA-256 hash validation, optical QR analysis, and statutory registries without altering source bytes.</span>
      </div>
    </div>
  );
};

export default CredentialCheckSubmit;
