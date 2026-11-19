import React from 'react';
import { FileText, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

const CredentialCheckSupportedDocs = () => {
  const categories = [
    {
      title: 'Internship Certificates',
      id: 'INTERNSHIP',
      target: 'Summer interns, project trainees, university co-ops',
      whatIsChecked: [
        'Issuing corporate legal entity and MCA master registration status',
        'Corporate root domain reachability and lookalike domain detection',
        'Role, duration, start/end dates, and department consistency',
        'Physical or digital authorized signatory title and corporate footprint'
      ],
      forensics: 'Checks for consumer template generators, lookalike domains, and unroutable corporate domains.'
    },
    {
      title: 'Course Completion Certificates',
      id: 'COURSE_COMPLETION',
      target: 'Bootcamps, online learning platforms, skill academies',
      whatIsChecked: [
        'Academy or learning platform identity and registered domain',
        'Credential ID / certificate number presence and URL format',
        'Course title, completion date, and assessment status',
        'Embedded optical QR code destination safety and domain alignment'
      ],
      forensics: 'SSRF-protected live reachability probe of verification target URL.'
    },
    {
      title: 'Training Certificates',
      id: 'TRAINING',
      target: 'Vocational institutes, industrial training workshops, compliance certifications',
      whatIsChecked: [
        'Training organization identity and legal entity registration',
        'Training title, hours/duration, and instructor or director signatory',
        'Cryptographic PDF digital signature seal if digitally issued'
      ],
      forensics: 'Verification of PKCS#7 byte range and modification detection.'
    },
    {
      title: 'Experience Letters',
      id: 'EXPERIENCE',
      target: 'Employment relieving letters, service certificates, work verification letters',
      whatIsChecked: [
        'Employer corporate status in MCA company database',
        'Candidate designation / job title and tenure dates consistency',
        'Corporate letterhead metadata against consumer design software',
        'HR / Director signatory designation and contact domain'
      ],
      forensics: 'Flags Canva/Photoshop consumer design tools used on corporate letterheads.'
    },
    {
      title: 'Academic Degrees & Marksheets',
      id: 'ACADEMIC',
      target: 'University degrees, diplomas, semester marksheets, grade cards',
      whatIsChecked: [
        'Statutory recognition of university/institution under UGC gazette',
        'Verification against UGC Flagged / Fake Universities alerts',
        'DigiLocker NAD consent-based candidate verification routing',
        'Mathematical arithmetic consistency of subject marks vs grand totals'
      ],
      forensics: 'Full arithmetic validation: subject marks sum vs stated grand total and percentage.'
    },
    {
      title: 'Professional Certifications',
      id: 'PROFESSIONAL_CERTIFICATION',
      target: 'Licensing authorities, chartered boards, international IT certs',
      whatIsChecked: [
        'Certification body statutory or industry accreditation',
        'Credential ID, issue date, expiration/renewal date',
        'Active licensing board directory presence'
      ],
      forensics: 'Verification of embedded digital certificate chains and revocation flags.'
    }
  ];

  return (
    <div className="cc-card">
      <div className="cc-card-header">
        <div>
          <h2 className="cc-card-title">
            <FileText className="w-5 h-5 text-slate-800" />
            <span>Supported Document Categories & Forensic Parameters</span>
          </h2>
          <p className="cc-card-desc">
            Detailed breakdown of how CredentialCheck investigates each category of certificate or document.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
          6 Supported Categories
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {cat.id}
                </span>
                <span className="text-[11px] text-slate-500 italic">{cat.target}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{cat.title}</h3>

              <div className="space-y-1.5 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Investigated Claims:</span>
                {cat.whatIsChecked.map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
              <strong className="text-slate-800 block mb-0.5">Forensic Focus:</strong>
              <span>{cat.forensics}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CredentialCheckSupportedDocs;
