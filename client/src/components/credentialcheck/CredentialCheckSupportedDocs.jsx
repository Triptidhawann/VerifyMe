import React from 'react';
import { CheckCircle2, Award, BookOpen, Scroll, Briefcase, GraduationCap, ShieldCheck } from 'lucide-react';
import './CredentialCheck.css';

export const CredentialCheckSupportedDocs = () => {
  const categories = [
    {
      title: 'Internship Certificates',
      id: 'INTERNSHIP',
      icon: Award,
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
      icon: BookOpen,
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
      icon: Scroll,
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
      icon: Briefcase,
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
      icon: GraduationCap,
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
      icon: ShieldCheck,
      target: 'Licensing authorities, chartered boards, international IT certs',
      whatIsChecked: [
        'Certification body statutory or industry accreditation',
        'License / credential serial number syntax and checksum',
        'Expiration / validity period and renewal standing',
        'Authorized issuing body digital verification endpoint'
      ],
      forensics: 'Digital signature validation against licensed CAs and anti-tamper optical checks.'
    }
  ];

  return (
    <div className="cc-methodology-root fadeIn">
      <div className="cc-methodology-header-block">
        <div className="cc-methodology-header-content">
          <div className="flex items-center gap-2 mb-1">
            <span className="cc-case-badge font-mono">SPECIFICATION // SCOPE</span>
            <span className="cc-meta-dot">•</span>
            <span className="font-mono text-xs text-[#737D76]">DOCUMENT COVERAGE</span>
          </div>
          <h1 className="cc-methodology-page-title">Supported Document Categories</h1>
          <p className="cc-methodology-desc">
            CredentialCheck applies specialized forensic rules, statutory registries, and arithmetic consistency tests tailored to each document classification.
          </p>
        </div>
      </div>

      <div className="cc-supported-docs-grid">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <div key={cat.id} className="cc-supported-doc-card">
              <div className="cc-supported-card-header">
                <div className="cc-supported-icon-box">
                  <Icon className="w-5 h-5 text-[#2E7D5B]" />
                </div>
                <div>
                  <span className="cc-supported-cat-tag font-mono">{cat.id}</span>
                  <h3 className="cc-supported-card-title">{cat.title}</h3>
                </div>
              </div>

              <div className="cc-supported-target font-mono">
                <span className="cc-target-lbl">TYPICAL SCOPE:</span>
                <span className="cc-target-val">{cat.target}</span>
              </div>

              <div className="cc-supported-checklist">
                <span className="cc-checklist-lbl font-mono">VERIFICATION PARAMETERS:</span>
                <ul className="cc-checklist-ul">
                  {cat.whatIsChecked.map((chk, idx) => (
                    <li key={idx} className="cc-checklist-li">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#49B99A] shrink-0 mt-0.5" />
                      <span>{chk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="cc-supported-forensics">
                <span className="cc-forensics-lbl font-mono">FORENSIC CHECKS:</span>
                <p className="cc-forensics-p">{cat.forensics}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CredentialCheckSupportedDocs;
