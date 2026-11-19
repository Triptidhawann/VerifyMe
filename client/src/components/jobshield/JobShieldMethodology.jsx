import React from 'react';
import { 
  Building, 
  Briefcase, 
  Globe, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import './JobShield.css';

const JobShieldMethodology = ({ onBackToIntake }) => {
  return (
    <div className="js-panel js-methodology-card">
      <div className="js-methodology-header flex items-center justify-between">
        <div>
          <h2 className="js-methodology-title">JobShield Forensic Verification Methodology</h2>
          <p className="js-methodology-desc">
            How VerifyMe independently audits recruitment communications, matches public ATS boards, and classifies fraud.
          </p>
        </div>
        {onBackToIntake && (
          <button 
            type="button" 
            onClick={onBackToIntake}
            className="js-btn-secondary"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Intake</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {/* Pillar 1 */}
        <div className="js-methodology-pillar">
          <div className="js-pillar-title">
            <Building className="w-4 h-4 text-[#174C3C]" />
            <span>1. Authoritative Domain & Infrastructure Verification</span>
          </div>
          <p className="js-pillar-desc">
            VerifyMe resolves the claimed company root domain and checks authoritative DNS records. Recruiter sender emails are analyzed for exact corporate domain alignment or recognized subdomains. We validate Mail Exchange (MX) DNS records to verify if the sending domain can legitimately receive mail, preventing blind spoofing. Free webmail providers (@gmail.com, @yahoo.com) are flagged when used for enterprise recruitment.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="js-methodology-pillar">
          <div className="js-pillar-title">
            <Globe className="w-4 h-4 text-[#174C3C]" />
            <span>2. Deceptive Lookalike Domain Detection</span>
          </div>
          <p className="js-pillar-desc">
            Attackers frequently register domains that closely resemble real brands (e.g., <code>stripe-careers.com</code> or <code>m1crosoft.com</code>). JobShield applies Levenshtein edit distance analysis, character substitution algorithms, and recruitment affix checks to identify deceptive lookalike domains designed to deceive candidates.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="js-methodology-pillar">
          <div className="js-pillar-title">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>3. Live Public ATS Board Matching</span>
          </div>
          <p className="js-pillar-desc">
            JobShield directly queries live public Applicant Tracking System (ATS) endpoints—including Greenhouse, Lever, and Ashby—to cross-reference active job requisitions against the stated job title, location, and requisition ID. If an active requisition is found, it is recorded as an official verified fact with a direct link to the live listing.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="js-methodology-pillar">
          <div className="js-pillar-title">
            <Lock className="w-4 h-4 text-red-600" />
            <span>4. Recruitment Process Integrity & Red Flags</span>
          </div>
          <p className="js-pillar-desc">
            JobShield deterministically scans for high-risk exploitation tactics: advance payment demands (application, training, or badge fees), equipment purchase requests, cashier's check overpayment schemes, requests for online banking PINs/OTPs, immediate offers without interviews, and high-pressure artificial deadlines.
          </p>
        </div>

        {/* Pillar 5: Limitation Boundary */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase text-[10px] tracking-wide text-amber-800">Crucial Operational Boundary</span>
            A job listing not found on a public ATS board does <strong>NOT</strong> automatically prove an opportunity is fake. Many legitimate employers handle positions confidentially, use proprietary internal HR software, or retain third-party recruitment agencies. JobShield transparently isolates verified facts from unverified boundaries.
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobShieldMethodology;
