import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Briefcase, 
  ImageIcon, 
  LinkIcon, 
  Upload, 
  X, 
  AlertCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Building, 
  Globe, 
  Shield, 
  CheckCircle2, 
  Info,
  Layers,
  Lock,
  ArrowRight
} from 'lucide-react';
import './JobShield.css';

const INPUT_METHODS = [
  {
    id: 'text',
    name: 'Paste Email / Message',
    desc: 'Plaintext, RFC headers, or recruiter chat transcript',
    icon: FileText
  },
  {
    id: 'pdf',
    name: 'Upload PDF Offer Letter',
    desc: 'Formal PDF employment contract or letter (max 5MB)',
    icon: Briefcase
  },
  {
    id: 'image',
    name: 'Upload Screenshot',
    desc: 'Screenshot of email, chat, or job board (PNG, JPEG)',
    icon: ImageIcon
  },
  {
    id: 'url',
    name: 'Job Posting URL',
    desc: 'Direct career link or public job board posting',
    icon: LinkIcon
  }
];

const SAMPLE_PRESETS = {
  fraud: `From: Global Tech HR <careers.globaltech@gmail.com>
Reply-To: verify-payments@outlook.com
Subject: Urgent Job Offer - Remote Administrative Assistant

Dear Candidate,
Congratulations! Based on your resume review, you have been selected without interview for the position of Remote Administrative Assistant.
Your compensation will be $45.00/hour ($93,600/year).
Before starting work, you are required to purchase home office equipment (laptop and software package) from our approved vendor. A refundable registration fee of $250 must be transferred immediately via Zelle or Wire transfer.
Please respond within 24 hours to confirm acceptance.`,
  legit: `From: Recruiting Team <recruiting@stripe.com>
Reply-To: recruiting@stripe.com
Subject: Offer of Employment - Staff Software Engineer

Dear Alex,
We are excited to formally extend an offer of employment for the position of Staff Software Engineer at Stripe.
Requisition ID: STRIPE-89104
Location: Seattle, WA (Remote friendly)
Compensation: $210,000 per year base salary
Please review the complete requisition details on our career portal and submit your acceptance through the official onboarding dashboard.`
};

const JobShieldIntake = ({ onSubmit, isSubmitting, error }) => {
  const [activeMethod, setActiveMethod] = useState('text');
  const [rawText, setRawText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [claimedCompany, setClaimedCompany] = useState('');
  const [claimedWebsite, setClaimedWebsite] = useState('');
  const [showOptionalContext, setShowOptionalContext] = useState(false);
  const [localError, setLocalError] = useState('');

  const fileInputRef = useRef(null);

  const handleMethodSelect = (id) => {
    setActiveMethod(id);
    setLocalError('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLocalError('File size exceeds the 5 MB limit.');
      return;
    }

    if (activeMethod === 'pdf' && file.type !== 'application/pdf') {
      setLocalError('Please select a valid PDF file.');
      return;
    }

    if (activeMethod === 'image' && !file.type.startsWith('image/')) {
      setLocalError('Please select an image file (PNG, JPEG, WebP).');
      return;
    }

    setLocalError('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
      if (activeMethod === 'image') {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileBase64('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadPreset = (type) => {
    setActiveMethod('text');
    setRawText(SAMPLE_PRESETS[type]);
    if (type === 'fraud') {
      setClaimedCompany('Global Tech');
      setClaimedWebsite('');
    } else {
      setClaimedCompany('Stripe');
      setClaimedWebsite('stripe.com');
    }
    setLocalError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (activeMethod === 'text') {
      if (!rawText.trim() || rawText.trim().length < 20) {
        setLocalError('Please paste the recruitment communication (at least 20 characters).');
        return;
      }
    } else if (activeMethod === 'pdf') {
      if (!selectedFile || !fileBase64) {
        setLocalError('Please choose a PDF document to upload.');
        return;
      }
    } else if (activeMethod === 'image') {
      if (!selectedFile || !fileBase64) {
        setLocalError('Please choose a screenshot image to upload.');
        return;
      }
    } else if (activeMethod === 'url') {
      if (!urlInput.trim()) {
        setLocalError('Please enter a job posting URL.');
        return;
      }
      try {
        new URL(urlInput.startsWith('http') ? urlInput.trim() : `https://${urlInput.trim()}`);
      } catch {
        setLocalError('Please enter a valid HTTP or HTTPS URL.');
        return;
      }
    }

    onSubmit({
      submissionType: activeMethod,
      rawText: activeMethod === 'text' ? rawText.trim() : undefined,
      fileBase64: (activeMethod === 'pdf' || activeMethod === 'image') ? fileBase64 : undefined,
      fileName: selectedFile?.name,
      url: activeMethod === 'url' ? urlInput.trim() : undefined,
      claimedCompany: claimedCompany.trim() || undefined,
      claimedWebsite: claimedWebsite.trim() || undefined
    });
  };

  const displayError = localError || error;

  return (
    <div className="js-split-grid">
      {/* LEFT COLUMN: Case Submission */}
      <div className="js-panel">
        <div className="js-panel-header">
          <div className="js-panel-title-group">
            <h2 className="js-panel-title">Case Submission</h2>
          </div>
          <span className="js-panel-subtitle">Stage materials for investigation</span>
        </div>

        <div className="js-panel-body">
          <form onSubmit={handleSubmit}>
            {/* Input Method Selector (Vertical / 2x2 Grid) */}
            <div className="js-method-selector">
              {INPUT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = activeMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    className={`js-method-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleMethodSelect(method.id)}
                  >
                    <div className="js-method-icon-wrap">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="js-method-text">
                      <span className="js-method-name">{method.name}</span>
                      <span className="js-method-desc">{method.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Input Mode 1: Text Editor */}
            {activeMethod === 'text' && (
              <div className="js-editor-container">
                <textarea
                  className="js-editor-textarea"
                  placeholder="Paste the full recruitment email, headers, job offer text, or recruiter chat message here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="js-editor-footer">
                  <span>{rawText.length} characters</span>
                  <div className="js-preset-links">
                    <span>Quick presets:</span>
                    <button type="button" className="js-preset-btn" onClick={() => loadPreset('fraud')}>
                      Sample Fraud Offer
                    </button>
                    <span>•</span>
                    <button type="button" className="js-preset-btn" onClick={() => loadPreset('legit')}>
                      Sample Legitimate Offer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input Mode 2: PDF Dropzone */}
            {activeMethod === 'pdf' && (
              <div>
                {!selectedFile ? (
                  <div
                    className="js-dropzone-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="js-dropzone-icon">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="js-dropzone-primary-text">Click or drag & drop PDF offer letter</div>
                    <div className="js-dropzone-sub-text">PDF format, up to 5 MB. In-memory text extraction.</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="js-file-staged-card">
                    <div className="js-file-staged-left">
                      <Briefcase className="w-5 h-5 text-[#174C3C]" />
                      <div>
                        <div className="js-file-staged-name">{selectedFile.name}</div>
                        <div className="js-file-staged-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="js-file-remove-btn"
                      onClick={handleRemoveFile}
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Input Mode 3: Screenshot Dropzone */}
            {activeMethod === 'image' && (
              <div>
                {!selectedFile ? (
                  <div
                    className="js-dropzone-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="js-dropzone-icon">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="js-dropzone-primary-text">Click or drag & drop screenshot</div>
                    <div className="js-dropzone-sub-text">PNG, JPEG, WebP (up to 5 MB). Optical Character Recognition (OCR).</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {imagePreview && (
                      <div className="js-image-preview-wrap">
                        <img src={imagePreview} alt="Screenshot preview" className="js-image-preview-img" />
                      </div>
                    )}
                    <div className="js-file-staged-card">
                      <div className="js-file-staged-left">
                        <ImageIcon className="w-5 h-5 text-[#174C3C]" />
                        <div>
                          <div className="js-file-staged-name">{selectedFile.name}</div>
                          <div className="js-file-staged-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="js-file-remove-btn"
                        onClick={handleRemoveFile}
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Mode 4: Job Posting URL */}
            {activeMethod === 'url' && (
              <div>
                <input
                  type="url"
                  className="js-text-field"
                  placeholder="https://company.com/careers/job-requisition-id"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isSubmitting}
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  VerifyMe will fetch the target page using SSRF-hardened network connectors and extract the vacancy details.
                </span>
              </div>
            )}

            {/* Optional Context Accordion */}
            <div className="mt-3">
              <button
                type="button"
                className="js-context-toggle"
                onClick={() => setShowOptionalContext(!showOptionalContext)}
              >
                {showOptionalContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>Optional Context: Specify Claimed Company Name or Official Domain</span>
              </button>

              {showOptionalContext && (
                <div className="js-context-fields-grid">
                  <div className="js-field-group">
                    <label className="js-field-label">Claimed Company Name</label>
                    <input
                      type="text"
                      className="js-text-field"
                      placeholder="e.g. Stripe, Acme Corp, Airbnb"
                      value={claimedCompany}
                      onChange={(e) => setClaimedCompany(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="js-field-group">
                    <label className="js-field-label">Official Company Website</label>
                    <input
                      type="text"
                      className="js-text-field"
                      placeholder="e.g. stripe.com"
                      value={claimedWebsite}
                      onChange={(e) => setClaimedWebsite(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {displayError && (
              <div className="js-alert-error">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{displayError}</span>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="js-submit-btn"
              disabled={isSubmitting}
            >
              <Search className="w-4 h-4" />
              <span>{isSubmitting ? 'Investigating Case File...' : 'Investigate Recruitment'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Investigation Scope */}
      <div className="js-panel">
        <div className="js-panel-header">
          <div className="js-panel-title-group">
            <Shield className="w-4 h-4 text-slate-700" />
            <h2 className="js-panel-title">Investigation Scope & Grounding</h2>
          </div>
          <span className="js-panel-subtitle">Available checks</span>
        </div>

        <div className="js-panel-body">
          {/* Explanatory callout */}
          <div className="js-scope-explainer">
            <Info className="w-4 h-4 text-[#174C3C] shrink-0 mt-0.5" />
            <span>
              Verification depends on available independent evidence. A missing public listing does not automatically mean an opportunity is fraudulent.
            </span>
          </div>

          <div className="js-scope-groups">
            {/* Group 1: Corporate Identity */}
            <div className="js-scope-group-card">
              <div className="js-scope-group-header">
                <span className="js-scope-group-title">
                  <span className="js-scope-group-number">1</span>
                  Corporate Identity Verification
                </span>
                <Building className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="js-scope-check-list">
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Authoritative company root domain resolution</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Official company website reachability & HTTPS</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Domain similarity & typo-squatting detection (e.g. <code>stripe-careers.com</code>)</span>
                </div>
              </div>
            </div>

            {/* Group 2: Job Listing Verification */}
            <div className="js-scope-group-card">
              <div className="js-scope-group-header">
                <span className="js-scope-group-title">
                  <span className="js-scope-group-number">2</span>
                  Job Listing Verification
                </span>
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="js-scope-check-list">
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Public ATS job board query (Greenhouse, Lever, Ashby)</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Job title, location, and requisition ID cross-matching</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Application destination classification (official ATS vs third-party form)</span>
                </div>
              </div>
            </div>

            {/* Group 3: Recruiter Communication */}
            <div className="js-scope-group-card">
              <div className="js-scope-group-header">
                <span className="js-scope-group-title">
                  <span className="js-scope-group-number">3</span>
                  Recruiter Communication Integrity
                </span>
                <Globe className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="js-scope-check-list">
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Sender email domain alignment with claimed corporate entity</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Free public webmail detection (<code>@gmail.com</code>, <code>@yahoo.com</code>)</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Reply-To address mismatch and response redirection</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Authoritative DNS Mail Exchange (MX) routing validation</span>
                </div>
              </div>
            </div>

            {/* Group 4: Fraud Indicators */}
            <div className="js-scope-group-card">
              <div className="js-scope-group-header">
                <span className="js-scope-group-title">
                  <span className="js-scope-group-number">4</span>
                  Fraud & Exploitation Indicators
                </span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="js-scope-check-list">
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Advance fees (registration, interview, training, or deposit)</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Equipment purchase or fake check / wire reimbursement schemes</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Premature credential requests (online banking passwords, OTPs, SSN)</span>
                </div>
                <div className="js-scope-check-item">
                  <span className="js-scope-check-bullet" />
                  <span>Guaranteed offers without interview & artificial urgency tactics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobShieldIntake;
