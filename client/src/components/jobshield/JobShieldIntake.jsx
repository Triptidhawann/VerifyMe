import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Briefcase, 
  ImageIcon, 
  LinkIcon, 
  Upload, 
  X, 
  AlertCircle, 
  ChevronDown, 
  Building, 
  Globe, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import VerifyMeLoader from '../auth/VerifyMeLoader';
import './JobShield.css';

const INPUT_METHODS = [
  {
    id: 'text',
    name: 'Email / Message',
    badge: 'Text',
    desc: 'Paste email, offer text or recruiter message',
    icon: FileText
  },
  {
    id: 'pdf',
    name: 'PDF Offer Letter',
    badge: 'PDF',
    desc: 'Upload formal offer letter or contract',
    icon: Briefcase
  },
  {
    id: 'image',
    name: 'Screenshot',
    badge: 'Image',
    desc: 'Upload screenshot of email or message',
    icon: ImageIcon
  },
  {
    id: 'url',
    name: 'Job Posting URL',
    badge: 'Web',
    desc: 'Link to public career listing',
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

export const JobShieldIntake = ({ onSubmit, isSubmitting, error, onOpenMethodology }) => {
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
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  const handleMethodSelect = (id) => {
    setActiveMethod(id);
    setLocalError('');
  };

  const processFile = (file) => {
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
      setLocalError('Please select a valid image file (PNG, JPEG, WebP).');
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
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
    <div className="js-intake-root fadeIn">
      {/* Page Introduction */}
      <div className="js-intake-header">
        <h2 className="js-intake-title">Check a job opportunity.</h2>
        <p className="js-intake-subtitle">
          Share the offer, recruiter message or job listing. We'll examine the available evidence and help you understand the risks.
        </p>
      </div>

      {/* Main Submission Workspace Card */}
      <div className="js-workspace-card">
        {/* Input Method Selector */}
        <div className="js-method-selector" role="tablist" aria-label="Submission method selector">
          {INPUT_METHODS.map((method) => {
            const Icon = method.icon;
            const isActive = activeMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`js-method-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleMethodSelect(method.id)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="js-method-name">{method.name}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} noValidate className="js-intake-form">
          {/* METHOD 1: TEXT / EMAIL / MESSAGE */}
          {activeMethod === 'text' && (
            <div className="js-input-pane fadeIn">
              <div className="js-field-header">
                <label htmlFor="js-text-content" className="js-field-label">
                  Recruitment Communication or Offer Text
                </label>
                <span className="js-char-counter font-mono">
                  {rawText.length} characters
                </span>
              </div>

              <textarea
                id="js-text-content"
                className="js-textarea"
                rows={9}
                placeholder="Paste the recruiter's email, message, offer letter text, or interview invitation here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                disabled={isSubmitting}
              />

              {/* Quick Sample Presets */}
              <div className="js-presets-row">
                <span className="js-presets-label font-mono">TEST SAMPLES:</span>
                <button
                  type="button"
                  className="js-preset-chip"
                  onClick={() => loadPreset('fraud')}
                  disabled={isSubmitting}
                >
                  <Sparkles className="w-3 h-3 text-[#D94E4E]" />
                  <span>Suspicious Offer Sample</span>
                </button>
                <button
                  type="button"
                  className="js-preset-chip"
                  onClick={() => loadPreset('legit')}
                  disabled={isSubmitting}
                >
                  <Sparkles className="w-3 h-3 text-[#2E7D5B]" />
                  <span>Legitimate Corporate Offer</span>
                </button>
              </div>
            </div>
          )}

          {/* METHOD 2: PDF UPLOAD */}
          {activeMethod === 'pdf' && (
            <div className="js-input-pane fadeIn">
              <label className="js-field-label">
                Upload PDF Employment Contract or Offer Letter
              </label>

              {!selectedFile ? (
                <div 
                  className={`js-dropzone ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="js-dropzone-icon-box">
                    <Upload className="w-6 h-6 text-[#49B99A]" />
                  </div>
                  <div className="js-dropzone-content">
                    <p className="js-dropzone-primary-text">
                      <span className="text-[#49B99A] font-semibold underline">Click to upload</span> or drag and drop PDF file
                    </p>
                    <p className="js-dropzone-sub-text">
                      Formal PDF offer letters, agreements, or contracts (up to 5 MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="js-file-selected-card">
                  <div className="js-file-info">
                    <div className="js-file-icon-box">
                      <FileCheck2 className="w-5 h-5 text-[#2E7D5B]" />
                    </div>
                    <div>
                      <div className="js-file-name font-mono">{selectedFile.name}</div>
                      <div className="js-file-meta">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="js-file-remove-btn"
                    onClick={handleRemoveFile}
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* METHOD 3: SCREENSHOT UPLOAD */}
          {activeMethod === 'image' && (
            <div className="js-input-pane fadeIn">
              <label className="js-field-label">
                Upload Screenshot (Email, Chat, or Job Portal)
              </label>

              {!selectedFile ? (
                <div 
                  className={`js-dropzone ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="js-dropzone-icon-box">
                    <ImageIcon className="w-6 h-6 text-[#49B99A]" />
                  </div>
                  <div className="js-dropzone-content">
                    <p className="js-dropzone-primary-text">
                      <span className="text-[#49B99A] font-semibold underline">Click to upload</span> or drag and drop image
                    </p>
                    <p className="js-dropzone-sub-text">
                      PNG, JPEG, WebP screenshots of emails, LinkedIn chats or job posts (up to 5 MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="js-image-preview-card">
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Selected Screenshot" 
                      className="js-image-preview-thumb" 
                    />
                  )}
                  <div className="js-image-meta-wrap">
                    <div className="js-file-name font-mono">{selectedFile.name}</div>
                    <div className="js-file-meta">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Screenshot staged
                    </div>
                    <button
                      type="button"
                      className="js-file-remove-btn mt-2"
                      onClick={handleRemoveFile}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove screenshot</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* METHOD 4: JOB POSTING URL */}
          {activeMethod === 'url' && (
            <div className="js-input-pane fadeIn">
              <label htmlFor="js-url-field" className="js-field-label">
                Job Posting URL or Career Link
              </label>

              <div className="js-url-input-wrap">
                <LinkIcon className="js-url-icon w-4 h-4 text-[#94A098]" />
                <input
                  id="js-url-field"
                  type="url"
                  className="js-url-input"
                  placeholder="https://company.greenhouse.io/jobs/12345 or https://stripe.com/jobs"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isSubmitting}
                />
                {urlInput && (
                  <button
                    type="button"
                    className="js-clear-icon-btn"
                    onClick={() => setUrlInput('')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="js-field-hint">
                Supports Greenhouse, Lever, Workable, Ashby, and company career domains.
              </span>
            </div>
          )}

          {/* OPTIONAL CONTEXT (EXPANDABLE) */}
          <div className="js-optional-context-box">
            <button
              type="button"
              className="js-optional-toggle"
              onClick={() => setShowOptionalContext(!showOptionalContext)}
              aria-expanded={showOptionalContext}
            >
              <span className="font-semibold text-sm">Add more details (optional)</span>
              <ChevronDown className={`w-4 h-4 text-[#737D76] transition-transform ${showOptionalContext ? 'rotate-180' : ''}`} />
            </button>

            {showOptionalContext && (
              <div className="js-optional-fields-grid fadeIn">
                <div className="js-optional-field">
                  <label htmlFor="claimed-company" className="js-sub-label">
                    Claimed Employer / Company Name
                  </label>
                  <div className="js-field-inner">
                    <Building className="w-4 h-4 text-[#94A098] shrink-0" />
                    <input
                      id="claimed-company"
                      type="text"
                      placeholder="e.g. Stripe, Apple, Acme Global"
                      value={claimedCompany}
                      onChange={(e) => setClaimedCompany(e.target.value)}
                      disabled={isSubmitting}
                      className="js-sub-input"
                    />
                  </div>
                </div>

                <div className="js-optional-field">
                  <label htmlFor="claimed-website" className="js-sub-label">
                    Official Corporate Website
                  </label>
                  <div className="js-field-inner">
                    <Globe className="w-4 h-4 text-[#94A098] shrink-0" />
                    <input
                      id="claimed-website"
                      type="text"
                      placeholder="e.g. stripe.com or apple.com"
                      value={claimedWebsite}
                      onChange={(e) => setClaimedWebsite(e.target.value)}
                      disabled={isSubmitting}
                      className="js-sub-input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="js-error-banner" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="js-submit-action-wrap">
            <button
              type="submit"
              disabled={isSubmitting}
              className="js-primary-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <VerifyMeLoader size="sm" variant="white" label="Analyzing opportunity..." />
                  <span>Investigating Opportunity...</span>
                </>
              ) : (
                <>
                  <span>Investigate Opportunity</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Subtle Bottom Methodology Link */}
      {onOpenMethodology && (
        <div className="js-intake-footer-note">
          <HelpCircle className="w-4 h-4 text-[#737D76]" />
          <span>Learn how JobShield audits domain alignment, fraud heuristics & ATS listings.</span>
          <button
            type="button"
            className="js-methodology-link"
            onClick={onOpenMethodology}
          >
            How it works →
          </button>
        </div>
      )}
    </div>
  );
};

export default JobShieldIntake;
