import React from 'react';
import { 
  Building, 
  Briefcase, 
  Globe, 
  Lock, 
  AlertTriangle, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import './JobShield.css';

export const JobShieldMethodology = ({ onBackToIntake }) => {
  return (
    <div className="js-methodology-root fadeIn">
      {/* Header */}
      <div className="js-methodology-header-block">
        <div className="js-methodology-header-content">
          <div className="flex items-center gap-2 mb-1">
            <span className="js-case-badge font-mono">SPECIFICATION // METHODOLOGY</span>
            <span className="js-meta-dot">•</span>
            <span className="font-mono text-xs text-[#737D76]">JOBSHIELD V2</span>
          </div>
          <h2 className="js-methodology-page-title">How JobShield Works</h2>
          <p className="js-methodology-desc">
            Learn how JobShield independently cross-references recruitment claims, authoritative corporate DNS, and live public ATS endpoints to classify fraud risk.
          </p>
        </div>

        {onBackToIntake && (
          <button 
            type="button" 
            onClick={onBackToIntake}
            className="js-methodology-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Intake</span>
          </button>
        )}
      </div>

      {/* Pillars Grid / Stack */}
      <div className="js-methodology-grid">
        {/* Pillar 1 */}
        <div className="js-methodology-card">
          <div className="js-methodology-card-header">
            <div className="js-methodology-icon-box">
              <Building className="w-5 h-5 text-[#2E7D5B]" />
            </div>
            <div>
              <span className="js-methodology-num font-mono">PILLAR 01</span>
              <h3 className="js-methodology-card-title">Authoritative Domain & Infrastructure Verification</h3>
            </div>
          </div>
          <p className="js-methodology-body">
            VerifyMe resolves the claimed company root domain and checks authoritative DNS records. Recruiter sender emails are analyzed for exact corporate domain alignment or recognized subdomains. We validate Mail Exchange (MX) DNS records to verify if the sending domain can legitimately receive mail, preventing blind spoofing. Free webmail providers (@gmail.com, @yahoo.com) are flagged when used for enterprise recruitment.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="js-methodology-card">
          <div className="js-methodology-card-header">
            <div className="js-methodology-icon-box">
              <Globe className="w-5 h-5 text-[#2E7D5B]" />
            </div>
            <div>
              <span className="js-methodology-num font-mono">PILLAR 02</span>
              <h3 className="js-methodology-card-title">Deceptive Lookalike Domain Detection</h3>
            </div>
          </div>
          <p className="js-methodology-body">
            Attackers frequently register domains that closely resemble real brands (e.g., <code>stripe-careers.com</code> or <code>m1crosoft.com</code>). JobShield applies Levenshtein edit distance analysis, character substitution algorithms, and recruitment affix checks to identify deceptive lookalike domains designed to deceive candidates.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="js-methodology-card">
          <div className="js-methodology-card-header">
            <div className="js-methodology-icon-box">
              <Briefcase className="w-5 h-5 text-[#2E7D5B]" />
            </div>
            <div>
              <span className="js-methodology-num font-mono">PILLAR 03</span>
              <h3 className="js-methodology-card-title">Live Public ATS Board Matching</h3>
            </div>
          </div>
          <p className="js-methodology-body">
            JobShield directly queries live public Applicant Tracking System (ATS) endpoints—including Greenhouse, Lever, Workable, and Ashby—to cross-reference active job requisitions against the stated job title, location, and requisition ID. If an active requisition is found, it is recorded as an official verified fact with a direct link to the live listing.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="js-methodology-card">
          <div className="js-methodology-card-header">
            <div className="js-methodology-icon-box">
              <Lock className="w-5 h-5 text-[#2E7D5B]" />
            </div>
            <div>
              <span className="js-methodology-num font-mono">PILLAR 04</span>
              <h3 className="js-methodology-card-title">Recruitment Process Integrity & Red Flags</h3>
            </div>
          </div>
          <p className="js-methodology-body">
            JobShield deterministically scans for high-risk exploitation tactics: advance payment demands (application, training, or badge fees), equipment purchase requests, cashier's check overpayment schemes, requests for online banking PINs/OTPs, immediate offers without interviews, and high-pressure artificial deadlines.
          </p>
        </div>
      </div>

      {/* Operational Boundary Banner */}
      <div className="js-boundary-callout" role="note">
        <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
        <div className="js-boundary-content">
          <span className="js-boundary-title font-mono">CRUCIAL OPERATIONAL BOUNDARY</span>
          <p className="js-boundary-text">
            A job listing not found on a public ATS board does <strong>NOT</strong> automatically prove an opportunity is fraudulent. Many legitimate employers handle positions confidentially, use proprietary internal HR software, or retain third-party recruitment agencies. JobShield transparently isolates verified facts from unverified boundaries, giving you objective evidence without false certainty.
          </p>
        </div>
      </div>

      {/* Footer Return */}
      {onBackToIntake && (
        <div className="js-methodology-footer">
          <button
            type="button"
            onClick={onBackToIntake}
            className="js-primary-submit-btn"
          >
            <span>Start an Investigation</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default JobShieldMethodology;
