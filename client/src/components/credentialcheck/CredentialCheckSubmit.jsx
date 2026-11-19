import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, 
  UploadCloud, 
  FileCheck, 
  Building2, 
  Globe, 
  Hash, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  X, 
  GraduationCap, 
  Award, 
  Briefcase, 
  BookOpen, 
  Scroll, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Search,
  Check
} from 'lucide-react';

const CATEGORIES = [
  { 
    id: 'AUTO', 
    label: 'Auto-Detect Category', 
    desc: 'Determined automatically via structural claim analysis',
    icon: Sparkles
  },
  { 
    id: 'INTERNSHIP', 
    label: 'Internship Certificate', 
    desc: 'Summer, industrial, or project internship letter',
    icon: Award
  },
  { 
    id: 'COURSE_COMPLETION', 
    label: 'Course Completion', 
    desc: 'Online platform, academy, or bootcamp certificate',
    icon: BookOpen
  },
  { 
    id: 'TRAINING', 
    label: 'Training Certificate', 
    desc: 'Vocational, industrial, or corporate workshop',
    icon: Scroll
  },
  { 
    id: 'EXPERIENCE', 
    label: 'Experience Letter', 
    desc: 'Relieving letter, work experience, service certificate',
    icon: Briefcase
  },
  { 
    id: 'ACADEMIC', 
    label: 'Academic Degree / Marksheet', 
    desc: 'University degree, diploma, semester grade card',
    icon: GraduationCap
  },
  { 
    id: 'PROFESSIONAL_CERTIFICATION', 
    label: 'Professional Certification', 
    desc: 'Licensing board or statutory charter credential',
    icon: ShieldCheck
  }
];

const PROCESSING_STAGES = [
  { label: 'Reading document buffer & verifying cryptographic integrity', detail: 'Computing SHA-256 hash & analyzing PDF object streams' },
  { label: 'Extracting credential details & structured claims', detail: 'Parsing candidate name, organization, dates & serial identifiers' },
  { label: 'Checking issuer information against statutory directories', detail: 'Querying MCA, UGC, AICTE & accredited institution registries' },
  { label: 'Examining document integrity & forensic markers', detail: 'Inspecting digital signature seals, optical QR codes & font anomalies' },
  { label: 'Synthesizing evidence-driven investigation report', detail: 'Formulating independent audit verdict and actionable next steps' }
];

const CredentialCheckSubmit = ({ onSubmit, loading, error }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [fileError, setFileError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('AUTO');
  const [issuerName, setIssuerName] = useState('');
  const [issuerWebsite, setIssuerWebsite] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [candidateConsent, setCandidateConsent] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Staged loading progress state
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (loading) {
      setActiveStageIndex(0);
      interval = setInterval(() => {
        setActiveStageIndex(prev => {
          if (prev < PROCESSING_STAGES.length - 1) return prev + 1;
          return prev;
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
      setFileError('Failed to read document buffer.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setFileBase64('');
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
    if (!fileBase64 || !selectedFile) {
      setFileError('Please select or drop a certificate document before submitting.');
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

  // PROCESSING / LOADING VIEW
  if (loading) {
    return (
      <div className="cc-card cc-processing-card animate-fade-in">
        <div className="cc-processing-header">
          <div className="cc-processing-spinner-box">
            <div className="cc-spinner-ring" />
            <Search className="w-6 h-6 text-[#174C3C] animate-pulse" />
          </div>
          <div>
            <span className="cc-processing-badge">Forensic Investigation Active</span>
            <h2 className="cc-processing-title">{selectedFile?.name || 'Document Verification'}</h2>
            <p className="cc-processing-sub">
              Executing multi-dimensional verification across institutional registries & cryptographic checks
            </p>
          </div>
        </div>

        <div className="cc-processing-stages-list">
          {PROCESSING_STAGES.map((stage, idx) => {
            const isDone = idx < activeStageIndex;
            const isCurrent = idx === activeStageIndex;
            return (
              <div 
                key={idx}
                className={`cc-stage-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="cc-stage-indicator">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                  ) : isCurrent ? (
                    <div className="cc-stage-pulse-dot" />
                  ) : (
                    <div className="cc-stage-pending-dot" />
                  )}
                </div>
                <div className="cc-stage-text-group">
                  <span className="cc-stage-label">{stage.label}</span>
                  <span className="cc-stage-detail">{stage.detail}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="cc-entry-container animate-fade-in">
      {/* Workspace Introduction */}
      <div className="cc-intro-banner">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="cc-pill-tag">India-First Credential Intelligence</span>
            <span className="text-xs text-[#526056] font-medium">• Statutory MCA, UGC & DigiLocker Corroboration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202923] tracking-tight">
            Document Forensics & Credential Verification
          </h1>
          <p className="text-sm text-[#526056] max-w-2xl leading-relaxed">
            Upload an academic degree, marksheet, internship letter, course completion certificate, or experience document. Verify issuer legitimacy, document tampering, and claim consistency.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
          <div>
            <strong>Investigation Error:</strong> {error}
          </div>
        </div>
      )}

      {fileError && (
        <div className="p-3.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <div>{fileError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* SECTION 1: INTERACTIVE DRAG & DROP SURFACE */}
        <div className="cc-surface-card">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#202923]">
              1. Upload Credential Document
            </label>
            <span className="text-xs text-[#7E8D82]">PDF, PNG, JPEG • Max 10 MB</span>
          </div>

          {!selectedFile ? (
            <div 
              className={`cc-dropzone-box ${dragActive ? 'dragging' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => e.target.files && handleFileProcess(e.target.files[0])}
                className="hidden" 
              />
              <div className="cc-dropzone-icon">
                <UploadCloud className="w-8 h-8 text-[#174C3C]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#202923]">
                  Click to select a file <span className="font-normal text-[#526056]">or drag and drop here</span>
                </p>
                <p className="text-xs text-[#7E8D82] mt-1">
                  Supports digital certificates, scanned marksheets & academic transcripts
                </p>
              </div>
            </div>
          ) : (
            <div className="cc-selected-file-card">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="cc-file-avatar">
                  <FileText className="w-5 h-5 text-[#174C3C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#202923] truncate">
                    {selectedFile.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold text-[#15803D] bg-[#EAF6ED] px-2 py-0.5 rounded border border-[#A7D8B4]">
                      Ready for analysis
                    </span>
                    <span className="text-xs text-[#7E8D82] font-mono">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="cc-remove-file-btn"
                title="Remove and select another file"
              >
                <X className="w-4 h-4" />
                <span>Replace</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: DOCUMENT CATEGORY SELECTION */}
        <div className="cc-surface-card">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#202923]">
              2. Select Document Category
            </label>
            <span className="text-xs text-[#7E8D82]">Tailors cross-validation rules</span>
          </div>

          <div className="cc-categories-grid">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`cc-category-tile ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="cc-tile-icon-box">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="cc-tile-body">
                    <div className="flex items-center justify-between gap-1">
                      <span className="cc-tile-title">{cat.label}</span>
                      {isSelected && (
                        <span className="cc-tile-check">
                          <Check className="w-3 h-3 text-[#174C3C]" />
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

        {/* SECTION 3: OPTIONAL ISSUER / CONTEXT PARAMETERS (COLLAPSIBLE) */}
        <div className="cc-surface-card">
          <button
            type="button"
            className="w-full flex items-center justify-between text-left py-1"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#202923] block">
                3. Optional Context Parameters
              </span>
              <span className="text-xs text-[#7E8D82] block mt-0.5">
                Helps disambiguate organization registries if document text is degraded
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#174C3C]">
              <span>{showOptionalFields ? 'Hide parameters' : 'Provide optional details'}</span>
              {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showOptionalFields && (
            <div className="cc-optional-inputs-pane animate-fade-in pt-3 mt-2 border-t border-[#DCE8DF]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#526056] block mb-1">
                    Claimed Issuer (Company/College)
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. AWS or Infosys"
                      value={issuerName}
                      onChange={(e) => setIssuerName(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#526056] block mb-1">
                    Official Website / Domain
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. aws.amazon.com or infosys.com"
                      value={issuerWebsite}
                      onChange={(e) => setIssuerWebsite(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#526056] block mb-1">
                    Certificate / Roll / ID Number
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. INFY-INT-2026-88421"
                      value={certificateNumber}
                      onChange={(e) => setCertificateNumber(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: CANDIDATE CONSENT CONFIRMATION */}
        <div className="p-3.5 bg-[#FDFDFB] border border-[#DCE8DF] rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-[#202923]">
            <input 
              type="checkbox"
              checked={candidateConsent}
              onChange={(e) => setCandidateConsent(e.target.checked)}
              className="mt-0.5 rounded text-[#174C3C] focus:ring-[#174C3C]"
            />
            <div>
              <span className="font-bold text-[#202923] block">
                Candidate Consent for Statutory & Institutional Verification
              </span>
              <span className="text-[#526056] text-[11px] block leading-relaxed mt-0.5">
                I confirm that candidate authorization has been obtained for verifying academic or statutory records through DigiLocker NAD and official registrar channels in accordance with the IT Act (2000) and Digital Personal Data Protection Act (DPDP).
              </span>
            </div>
          </label>
        </div>

        {/* SUBMIT ACTION BUTTON */}
        <div>
          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="cc-btn-execute"
          >
            <ShieldCheck className="w-5 h-5 text-[#C7D99A]" />
            <span>Begin Forensic & Statutory Investigation</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CredentialCheckSubmit;
