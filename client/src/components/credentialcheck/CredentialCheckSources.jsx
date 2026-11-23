import React from 'react';
import { ExternalLink } from 'lucide-react';
import './CredentialCheck.css';

export const CredentialCheckSources = () => {
  const sources = [
    {
      name: 'National Academic Depository (NAD / DigiLocker)',
      statutoryRole: 'Government of India Academic Depository',
      url: 'https://nad.digilocker.gov.in/',
      description: 'Official national online storehouse of academic awards (degrees, diplomas, certificates, marksheets) duly digitized and lodged by academic institutions, boards, and eligibility assessment bodies.',
      integrationType: 'Consent-Based Authorized Partner Connector',
      status: 'AVAILABLE VIA CANDIDATE CONSENT ROUTE',
      notes: 'Requires individual student consent in accordance with the IT Act (2000) and DPDP Act. We never scrape DigiLocker.'
    },
    {
      name: 'University Grants Commission (UGC) Statutory Registry',
      statutoryRole: 'Higher Education Regulatory Body',
      url: 'https://www.ugc.gov.in/',
      description: 'Statutory database of accredited Central Universities, State Universities, Deemed Universities, State Private Universities, and flagged unaccredited institutions.',
      integrationType: 'Public Gazette Directory & Statutory List Lookup',
      status: 'ACTIVE STATUTORY DIRECTORY',
      notes: 'Corroborates statutory degree-granting authority and flags institutions on the UGC Fake Universities gazette.'
    },
    {
      name: 'Ministry of Corporate Affairs (MCA21)',
      statutoryRole: 'Corporate & Company Registrar',
      url: 'https://www.mcacdm.nic.in/company-master-details',
      description: 'Authoritative company master data, Corporate Identification Number (CIN) status, incorporation dates, and registered office records under the Companies Act.',
      integrationType: 'Enterprise Master Registry with Manual Portal Fallback',
      status: 'ACTIVE ENTERPRISE SNAPSHOT & MANUAL ROUTE',
      notes: 'Public MCA lookup is protected by CAPTCHAs. Direct scraping is disabled by project security policy; manual lookup URLs are generated for unindexed corporate entities.'
    },
    {
      name: 'Controller of Certifying Authorities (CCA India)',
      statutoryRole: 'Digital Signature Regulatory Authority',
      url: 'https://cca.gov.in/',
      description: 'Regulates Indian Licensed Certifying Authorities (CAs) issuing digital signature certificates under the Information Technology Act, 2000.',
      integrationType: 'PKCS#7 X.509 Cryptographic Chain & Byte-Range Verification',
      status: 'ACTIVE CRYPTOGRAPHIC VALIDATION',
      notes: 'Directly validates PDF digital signature fields against licensed Indian CAs (eMudhra, Capricorn, (n)Code, IDsign, VSign, CDAC, NIC).'
    },
    {
      name: 'Goods & Services Tax (GST) Taxpayer Registry',
      statutoryRole: 'Department of Revenue Taxpayer Database',
      url: 'https://www.gst.gov.in/',
      description: 'Statutory validation of 15-character GSTIN structure, state code mapping, entity type, and PAN reference.',
      integrationType: 'Syntax, Checksum, and State Code Verification',
      status: 'ACTIVE STATUTORY SPECIFICATION',
      notes: 'Format and state territory validation active; live trade name lookup directs users to official GST portal.'
    },
    {
      name: 'Issuer-Specific Optical QR & Online Portals',
      statutoryRole: 'Direct Issuing Authority Verification Endpoint',
      url: null,
      description: 'Embedded optical barcodes and issuer URLs on certificates pointing to unique online verification records.',
      integrationType: 'Anti-SSRF Protected HTTP Probe with Address Pinning',
      status: 'ACTIVE LIVE PROBE',
      notes: 'Strictly blocks private/internal IPs, loopback, and metadata endpoints. Evaluates domain alignment with claimed corporate identity.'
    }
  ];

  return (
    <div className="cc-methodology-root fadeIn">
      <div className="cc-methodology-header-block">
        <div className="cc-methodology-header-content">
          <div className="flex items-center gap-2 mb-1">
            <span className="cc-case-badge font-mono">SPECIFICATION // DIRECTORIES</span>
            <span className="cc-meta-dot">•</span>
            <span className="font-mono text-xs text-[#737D76]">AUTHORITATIVE REGISTRIES</span>
          </div>
          <h1 className="cc-methodology-page-title">Official & Statutory Verification Sources</h1>
          <p className="cc-methodology-desc">
            VerifyMe cross-references credentials with authoritative public gazettes, statutory registries, cryptographic root authorities, and authorized student depository gateways.
          </p>
        </div>
      </div>

      <div className="cc-sources-detailed-grid">
        {sources.map((src, idx) => (
          <div key={idx} className="cc-source-detailed-card">
            <div className="cc-source-card-top">
              <div>
                <span className="cc-source-role-badge font-mono">{src.statutoryRole}</span>
                <h3 className="cc-source-card-title">{src.name}</h3>
              </div>
              {src.url && (
                <a 
                  href={src.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="cc-source-link-btn"
                  title="Visit official portal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <p className="cc-source-desc">{src.description}</p>

            <div className="cc-source-meta-rows font-mono">
              <div className="cc-meta-row">
                <span className="cc-meta-k">INTEGRATION:</span>
                <span className="cc-meta-v">{src.integrationType}</span>
              </div>
              <div className="cc-meta-row">
                <span className="cc-meta-k">OPERATIONAL STATUS:</span>
                <span className="cc-meta-v text-[#2E7D5B] font-bold">{src.status}</span>
              </div>
            </div>

            <div className="cc-source-notes">
              <span className="cc-notes-lbl font-mono">OPERATIONAL BOUNDARY:</span>
              <p className="cc-notes-p">{src.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CredentialCheckSources;
