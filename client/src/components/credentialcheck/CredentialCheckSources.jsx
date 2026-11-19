import React from 'react';
import { Layers, ExternalLink, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

const CredentialCheckSources = () => {
  const sources = [
    {
      name: 'National Academic Depository (NAD / DigiLocker)',
      statutoryRole: 'Government of India Academic Depository',
      url: 'https://nad.digilocker.gov.in/',
      description: 'Official national online storehouse of academic awards (degrees, diplomas, certificates, marksheets) duly digitized and lodged by academic institutions / boards / eligibility assessment bodies.',
      integrationType: 'Consent-Based Authorized Partner Connector',
      status: 'AVAILABLE VIA CANDIDATE CONSENT ROUTE',
      notes: 'Requires individual student consent in accordance with the IT Act and DPDP Act. We never scrape DigiLocker.'
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
      description: 'Authoritative company master data, CIN status, incorporation dates, and registered office records under the Companies Act.',
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
    <div className="cc-card">
      <div className="cc-card-header">
        <div>
          <h2 className="cc-card-title">
            <Layers className="w-5 h-5 text-slate-800" />
            <span>Official & Statutory Verification Sources</span>
          </h2>
          <p className="cc-card-desc">
            India-First directory of authoritative registries, cryptographic frameworks, and official verification routes.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
          6 Integrated Adapters
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src, idx) => (
          <div key={`source-${idx}`} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#174C3C]">{src.statutoryRole}</span>
                <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {src.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{src.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-2">{src.description}</p>
              
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded border border-slate-200">
                <strong className="text-slate-700 block mb-0.5">Integration Architecture:</strong>
                <span>{src.integrationType}</span>
                <span className="block mt-1 text-slate-400 italic">{src.notes}</span>
              </div>
            </div>

            {src.url && (
              <div className="pt-2 border-t border-slate-200">
                <a 
                  href={src.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-[#174C3C] hover:underline inline-flex items-center gap-1 font-bold"
                >
                  <span>Visit Statutory Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CredentialCheckSources;
