import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  FileText,
  ChevronDown, 
  Download, 
  Share2, 
  RefreshCw, 
  Hash, 
  Briefcase, 
  AlertOctagon 
} from 'lucide-react';
import './JobShield.css';

export const JobShieldReport = ({ investigation, onNewInvestigation }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, VERIFIED, CONTRADICTIONS, SUSPICIOUS, UNVERIFIED
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const safeInvestigation = investigation || {};

  const {
    id = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    outcome = 'INSUFFICIENT EVIDENCE',
    summary = 'Investigation completed.',
    recommendedAction = 'Verify all information directly through authoritative corporate channels.',
    claims = {},
    verifiedFacts = [],
    contradictions = [],
    suspiciousIndicators = [],
    unverifiedItems = [],
    listingBestMatch = null,
    listingEvidence = [],
    recruiterInvestigation = {},
    sourcesConsulted = [],
    submissionType = 'text',
    createdAtIso = new Date().toISOString()
  } = safeInvestigation;

  const isVerified = outcome === 'VERIFIED THROUGH OFFICIAL SOURCES';
  const isLikely = outcome === 'LIKELY LEGITIMATE — SOME DETAILS UNVERIFIED';
  const isSuspicious = outcome === 'SUSPICIOUS — INCONSISTENCIES DETECTED';
  const isHighRisk = outcome === 'HIGH RISK — STRONG FRAUD INDICATORS';

  const getVerdictPresentation = () => {
    if (isVerified) {
      return {
        badgeText: 'VERIFIED OPPORTUNITY',
        code: 'OUTCOME // OFFICIAL_SOURCES_CONFIRMED',
        headline: 'Authentic Opportunity Verified',
        sub: 'Claims matched active corporate records and public ATS job listings.',
        icon: ShieldCheck,
        themeClass: 'verdict-verified',
        accentColor: '#2E7D5B',
        badgeBg: '#EFF8F3'
      };
    }
    if (isLikely) {
      return {
        badgeText: 'LIKELY LEGITIMATE',
        code: 'OUTCOME // PARTIAL_VERIFICATION',
        headline: 'Likely Legitimate Opportunity',
        sub: 'Primary corporate identity verified, though some listing specifics remain unconfirmed.',
        icon: ShieldCheck,
        themeClass: 'verdict-likely',
        accentColor: '#2E7D5B',
        badgeBg: '#EFF8F3'
      };
    }
    if (isHighRisk) {
      return {
        badgeText: 'HIGH RISK DETECTED',
        code: 'OUTCOME // STRONG_FRAUD_PATTERNS',
        headline: 'Critical Fraud Indicators Found',
        sub: 'Severe anomalies detected, including payment requests or unaligned communication domains.',
        icon: ShieldAlert,
        themeClass: 'verdict-threat',
        accentColor: '#D94E4E',
        badgeBg: '#FEF3F3'
      };
    }
    if (isSuspicious) {
      return {
        badgeText: 'SUSPICIOUS INCONSISTENCIES',
        code: 'OUTCOME // CONTRADICTIONS_DETECTED',
        headline: 'Inconsistencies Identified',
        sub: 'Material discrepancies were found between the recruiter claims and official employer infrastructure.',
        icon: AlertTriangle,
        themeClass: 'verdict-caution',
        accentColor: '#B45309',
        badgeBg: '#FEF3C7'
      };
    }
    return {
      badgeText: 'INSUFFICIENT EVIDENCE',
      code: 'OUTCOME // UNCONFIRMED_DATA',
      headline: "We couldn't establish whether this opportunity is legitimate.",
      sub: "Available public records and automated checks could not conclusively confirm or disprove this offer. Insufficient evidence does not automatically mean fraud, but requires extra direct verification.",
      icon: HelpCircle,
      themeClass: 'verdict-insufficient',
      accentColor: '#737D76',
      badgeBg: '#F4F7F4'
    };
  };

  const verdictConfig = getVerdictPresentation();
  const VerdictIcon = verdictConfig.icon;

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  // Compile unified sources
  const allSources = useMemo(() => {
    if (Array.isArray(sourcesConsulted) && sourcesConsulted.length > 0) {
      return sourcesConsulted;
    }
    const derived = [];
    if (Array.isArray(listingEvidence) && listingEvidence.length > 0) {
      for (const ev of listingEvidence) {
        derived.push({
          sourceName: ev.sourceName || 'ATS Job Board',
          category: 'Official ATS Source',
          sourceUrl: ev.sourceUrl || '#',
          queryScope: ev.whatWasChecked || 'ATS public vacancy index',
          status: ev.status === 'FOUND_EXACT' ? 'Active Requisition Verified' : (ev.status === 'FOUND_SIMILAR' ? 'Related Vacancy Located' : 'Position Not On Active Board')
        });
      }
    }
    if (claims.senderEmail) {
      const sDomain = claims.senderEmail.split('@')[1];
      derived.push({
        sourceName: `Authoritative DNS MX Query (@${sDomain})`,
        category: 'DNS infrastructure lookup',
        sourceUrl: `dns://${sDomain}`,
        queryScope: 'Mail routing and MX resource records',
        status: recruiterInvestigation.senderHasMx ? 'Active MX Records Resolved' : 'No MX Records Found'
      });
    }
    if (claims.claimedDomain) {
      derived.push({
        sourceName: `Corporate Domain Registry (${claims.claimedDomain})`,
        category: 'Official employer source',
        sourceUrl: `https://${claims.claimedDomain}`,
        queryScope: 'Corporate identity and TLS certificate verification',
        status: 'Authoritative Identity Established'
      });
    }
    return derived;
  }, [sourcesConsulted, listingEvidence, claims, recruiterInvestigation]);

  // Aggregate Findings for Structured Grouping
  const categorizedFindings = useMemo(() => {
    const list = [];

    // 1. Verified Facts
    verifiedFacts.forEach((vf, idx) => {
      list.push({
        id: `vf-${idx}`,
        group: 'VERIFIED',
        groupLabel: 'Verified Fact',
        title: vf.fact,
        detail: vf.detail,
        source: vf.source || 'Authoritative Source',
        sourceUrl: vf.sourceUrl || null,
        statusType: 'verified'
      });
    });

    // 2. Contradictions & Warnings
    contradictions.forEach((c, idx) => {
      list.push({
        id: `ct-${idx}`,
        group: 'CONTRADICTIONS',
        groupLabel: 'Contradiction',
        title: c.contradiction,
        detail: c.detail,
        source: c.source || 'Cross-Match Engine',
        statusType: 'contradiction'
      });
    });

    // 3. Suspicious Indicators
    suspiciousIndicators.forEach((s, idx) => {
      list.push({
        id: `sp-${idx}`,
        group: 'SUSPICIOUS',
        groupLabel: 'Suspicious Sign',
        title: s.indicator,
        detail: s.explanation,
        source: 'Fraud Pattern Detection',
        statusType: 'suspicious'
      });
    });

    // 4. Unverified Information
    unverifiedItems.forEach((u, idx) => {
      list.push({
        id: `uv-${idx}`,
        group: 'UNVERIFIED',
        groupLabel: 'Unverified Data',
        title: u.item,
        detail: u.detail,
        source: 'Investigation Boundary',
        statusType: 'unverified'
      });
    });

    return list;
  }, [verifiedFacts, contradictions, suspiciousIndicators, unverifiedItems]);

  const filteredFindings = useMemo(() => {
    if (activeTab === 'ALL') return categorizedFindings;
    return categorizedFindings.filter(f => f.group === activeTab);
  }, [categorizedFindings, activeTab]);

  const toggleFindingExpand = (fId) => {
    setExpandedFinding(prev => prev === fId ? null : fId);
  };

  const handleCopyReport = () => {
    const lines = [
      `=======================================================`,
      `VERIFYME JOBSHIELD — OPPORTUNITY INTELLIGENCE REPORT`,
      `=======================================================`,
      `Case ID: ${id}`,
      `Date: ${formatDate(createdAtIso)}`,
      `Submission Format: ${submissionType.toUpperCase()}`,
      `Outcome: ${outcome}`,
      ``,
      `STATED OPPORTUNITY:`,
      `• Job Title: ${claims.jobTitle || 'Unspecified'}`,
      `• Employer: ${claims.companyName || 'Unspecified'}`,
      `• Requisition ID: ${claims.jobId || 'N/A'}`,
      `• Stated Salary: ${claims.salary || 'N/A'}`,
      `• Recruiter Email: ${claims.senderEmail || 'N/A'}`,
      `• Corporate Domain: ${claims.claimedDomain || 'N/A'}`,
      ``,
      `SUMMARY:`,
      summary,
      ``,
      `RECOMMENDED ACTION:`,
      recommendedAction,
      ``,
      `FINDINGS BREAKDOWN:`,
      `• Verified Facts (${verifiedFacts.length})`,
      ...verifiedFacts.map(vf => `  - [VERIFIED] ${vf.fact}: ${vf.detail || ''}`),
      `• Contradictions (${contradictions.length})`,
      ...contradictions.map(c => `  - [CONTRADICTION] ${c.contradiction}: ${c.detail || ''}`),
      `• Suspicious Indicators (${suspiciousIndicators.length})`,
      ...suspiciousIndicators.map(s => `  - [SUSPICIOUS] ${s.indicator}: ${s.explanation || ''}`),
      `• Unverified Items (${unverifiedItems.length})`,
      ...unverifiedItems.map(u => `  - [UNVERIFIED] ${u.item}: ${u.detail || ''}`),
      ``,
      `=======================================================`,
      `VerifyMe JobShield • Autonomous Opportunity Intelligence`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const lines = [
      `VERIFYME JOBSHIELD CASE FILE #${id}`,
      `Generated: ${formatDate(createdAtIso)}`,
      `Assessment Outcome: ${outcome}`,
      `Target: ${claims.jobTitle || 'Position'} at ${claims.companyName || 'Company'}`,
      ``,
      `SUMMARY:`,
      summary,
      ``,
      `RECOMMENDED ACTION:`,
      recommendedAction,
      ``,
      `FINDINGS:`,
      ...categorizedFindings.map(f => `[${f.group}] ${f.title}: ${f.detail || ''}`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JobShield_Case_${id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Has available opportunity claims to display
  const hasClaims = claims.companyName || claims.jobTitle || claims.senderEmail || claims.claimedDomain || claims.salary || claims.jobId;

  return (
    <article className="js-report-root fadeIn" aria-label="JobShield Opportunity Intelligence Report">
      {/* 1. CASE HEADER */}
      <header className="js-case-header">
        <div className="js-case-meta-top">
          <div className="flex items-center gap-2">
            <span className="js-case-badge font-mono">CASE DOSSIER</span>
            <span className="js-meta-dot">•</span>
            <span className="js-case-id font-mono">
              <Hash className="w-3 h-3 inline mr-0.5" />
              {id}
            </span>
          </div>
          <div className="js-case-date font-mono">
            {formatDate(createdAtIso)} • {submissionType.toUpperCase()} SUBMISSION
          </div>
        </div>

        <div className="js-case-title-row">
          <div className="js-case-title-group">
            <div className="js-case-category-pill">
              <Briefcase className="w-3.5 h-3.5" />
              <span>OPPORTUNITY INVESTIGATION</span>
            </div>
            <h1 className="js-case-subject-title">
              {claims.jobTitle ? `${claims.jobTitle} ` : 'Recruitment Opportunity '}
              {claims.companyName ? `at ${claims.companyName}` : ''}
            </h1>
          </div>

          <div className="js-case-actions">
            <button 
              type="button" 
              className="js-action-btn"
              onClick={handleCopyReport}
              title="Copy audit report to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#2E7D5B]" />
                  <span className="text-[#2E7D5B]">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#737D76]" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button 
              type="button" 
              className="js-action-btn"
              onClick={handleDownloadFile}
              title="Download text dossier"
            >
              <Download className="w-4 h-4 text-[#737D76]" />
              <span>Export Dossier</span>
            </button>

            <button 
              type="button" 
              className="js-action-btn primary"
              onClick={onNewInvestigation}
              title="Start a new investigation"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Check</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN ASSESSMENT — VERDICT FIRST */}
      <section className={`js-verdict-banner ${verdictConfig.themeClass}`} aria-label="Investigation Verdict">
        <div className="js-verdict-rail" aria-hidden="true" />
        <div className="js-verdict-body">
          <div className="js-verdict-tag-row">
            <span 
              className="js-verdict-badge font-mono"
              style={{ color: verdictConfig.accentColor, backgroundColor: verdictConfig.badgeBg }}
            >
              <VerdictIcon className="w-3.5 h-3.5" />
              <span>{verdictConfig.badgeText}</span>
            </span>
            <span className="js-verdict-code font-mono">{verdictConfig.code}</span>
          </div>

          <h2 className="js-verdict-headline">
            {verdictConfig.headline}
          </h2>

          <p className="js-verdict-subtext">
            {verdictConfig.sub}
          </p>

          <p className="js-verdict-summary">
            {summary}
          </p>
        </div>
      </section>

      {/* 3. OPPORTUNITY PROFILE (EXTRACTED CLAIMS) */}
      {hasClaims && (
        <section className="js-profile-section" aria-label="Extracted Opportunity Profile">
          <div className="js-profile-header">
            <span className="js-profile-pretitle font-mono">OPPORTUNITY PROFILE</span>
            <h3 className="js-profile-title">Extracted Recruitment Parameters</h3>
          </div>

          <div className="js-profile-grid">
            {claims.companyName && (
              <div className="js-profile-item">
                <span className="js-profile-label">Employer</span>
                <span className="js-profile-val font-semibold">{claims.companyName}</span>
              </div>
            )}
            {claims.jobTitle && (
              <div className="js-profile-item">
                <span className="js-profile-label">Position</span>
                <span className="js-profile-val font-semibold">{claims.jobTitle}</span>
              </div>
            )}
            {claims.recruiterName && (
              <div className="js-profile-item">
                <span className="js-profile-label">Recruiter</span>
                <span className="js-profile-val">{claims.recruiterName}</span>
              </div>
            )}
            {claims.senderEmail && (
              <div className="js-profile-item">
                <span className="js-profile-label">Sender Email</span>
                <span className="js-profile-val font-mono">{claims.senderEmail}</span>
              </div>
            )}
            {claims.claimedDomain && (
              <div className="js-profile-item">
                <span className="js-profile-label">Claimed Domain</span>
                <span className="js-profile-val font-mono">{claims.claimedDomain}</span>
              </div>
            )}
            {claims.jobId && (
              <div className="js-profile-item">
                <span className="js-profile-label">Requisition ID</span>
                <span className="js-profile-val font-mono">{claims.jobId}</span>
              </div>
            )}
            {claims.salary && (
              <div className="js-profile-item">
                <span className="js-profile-label">Stated Compensation</span>
                <span className="js-profile-val">{claims.salary}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. COMPACT INVESTIGATION SUMMARY STRIP */}
      <section className="js-summary-strip" aria-label="Investigation Evidence Summary">
        <div className="js-summary-item">
          <span className="js-sum-num">{categorizedFindings.length}</span>
          <span className="js-sum-label">Checks Evaluated</span>
        </div>
        <div className="js-summary-item passed">
          <span className="js-sum-num">{verifiedFacts.length}</span>
          <span className="js-sum-label">Verified Facts</span>
        </div>
        <div className="js-summary-item caution">
          <span className="js-sum-num">{contradictions.length}</span>
          <span className="js-sum-label">Contradictions</span>
        </div>
        <div className="js-summary-item flagged">
          <span className="js-sum-num">{suspiciousIndicators.length}</span>
          <span className="js-sum-label">Suspicious Signs</span>
        </div>
        <div className="js-summary-item neutral">
          <span className="js-sum-num">{unverifiedItems.length}</span>
          <span className="js-sum-label">Unverified Items</span>
        </div>
        <div className="js-summary-item sources">
          <span className="js-sum-num">{allSources.length}</span>
          <span className="js-sum-label">Sources Consulted</span>
        </div>
      </section>

      {/* 5. INVESTIGATION FINDINGS (ORGANIZED GROUPS) */}
      <section className="js-findings-section" aria-label="Structured Findings">
        <div className="js-findings-header">
          <div>
            <span className="js-findings-pretitle font-mono">EVIDENCE DOSSIER</span>
            <h3 className="js-findings-title">Investigation Findings</h3>
          </div>

          {/* Group Filter Tabs */}
          <div className="js-findings-filter-tabs font-mono" role="tablist">
            {[
              { id: 'ALL', label: `ALL (${categorizedFindings.length})` },
              { id: 'VERIFIED', label: `VERIFIED (${verifiedFacts.length})` },
              { id: 'CONTRADICTIONS', label: `CONTRADICTIONS (${contradictions.length})` },
              { id: 'SUSPICIOUS', label: `SUSPICIOUS (${suspiciousIndicators.length})` },
              { id: 'UNVERIFIED', label: `UNVERIFIED (${unverifiedItems.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`js-filter-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <div className="js-findings-list">
          {filteredFindings.length === 0 ? (
            <div className="js-findings-empty">
              <span>No findings categorized under this filter.</span>
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const isExpanded = expandedFinding === finding.id;

              return (
                <div 
                  key={finding.id} 
                  className={`js-finding-row row-${finding.statusType} ${isExpanded ? 'is-open' : ''}`}
                  onClick={() => toggleFindingExpand(finding.id)}
                >
                  <div className="js-finding-icon-wrap">
                    {finding.statusType === 'verified' && <Check className="w-3.5 h-3.5 text-[#2E7D5B] stroke-[3]" />}
                    {finding.statusType === 'contradiction' && <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] stroke-[2.5]" />}
                    {finding.statusType === 'suspicious' && <AlertOctagon className="w-3.5 h-3.5 text-[#D94E4E] stroke-[2.5]" />}
                    {finding.statusType === 'unverified' && <HelpCircle className="w-3.5 h-3.5 text-[#94A098] stroke-[2.5]" />}
                  </div>

                  <div className="js-finding-content">
                    <div className="js-finding-top">
                      <span className={`js-finding-pill font-mono status-${finding.statusType}`}>
                        {finding.groupLabel.toUpperCase()}
                      </span>
                      <span className="js-finding-source font-mono">{finding.source}</span>
                    </div>

                    <h4 className="js-finding-headline">{finding.title}</h4>

                    {finding.detail && (
                      <p className="js-finding-detail">{finding.detail}</p>
                    )}

                    {isExpanded && (
                      <div className="js-finding-expanded-box fadeIn">
                        <div className="js-drawer-item font-mono">
                          <span className="js-drawer-lbl">SOURCE REFERENCE:</span>
                          <span className="js-drawer-val">{finding.source}</span>
                        </div>
                        {finding.sourceUrl && (
                          <div className="js-drawer-item font-mono">
                            <span className="js-drawer-lbl">DIRECT LINK:</span>
                            <a 
                              href={finding.sourceUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[#49B99A] underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>Official Listing</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        <div className="js-drawer-item font-mono">
                          <span className="js-drawer-lbl">AUDIT INTEGRITY:</span>
                          <span className="js-drawer-val">Independently corroborated public telemetry</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="js-finding-chevron">
                    <ChevronDown className={`w-4 h-4 text-[#737D76] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 6. RECOMMENDED NEXT STEPS */}
      {recommendedAction && (
        <section className="js-recommendation-section" aria-label="Action Advisory">
          <div className="js-rec-header font-mono">
            <span className="js-rec-badge">ACTION ADVISORY</span>
            <span className="js-rec-code">WHAT SHOULD YOU DO NEXT?</span>
          </div>

          <h3 className="js-rec-headline">Recommended Next Action</h3>

          <p className="js-rec-body">
            {recommendedAction}
          </p>

          <div className="js-rec-footer-note">
            <CheckCircle2 className="w-4 h-4 text-[#49B99A] shrink-0" />
            <span>Protect yourself: Never send money, purchase equipment, or share banking credentials prior to formal on-site or verified corporate onboarding.</span>
          </div>
        </section>
      )}

      {/* 7. TECHNICAL DETAILS & METHODOLOGY (COLLAPSIBLE) */}
      <section className="js-technical-diagnostics" aria-label="Advanced Technical Inspection">
        <button
          type="button"
          className="js-technical-toggle-btn"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          aria-expanded={showTechnicalDetails}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#737D76]" />
            <span className="font-semibold text-sm text-[#202923]">
              {showTechnicalDetails ? 'Hide Technical Diagnostics & Sources Consulted' : 'View Technical Diagnostics & Sources Consulted'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#737D76] transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechnicalDetails && (
          <div className="js-technical-drawer fadeIn">
            {/* Sources Consulted List */}
            <div className="js-tech-block">
              <h4 className="js-tech-heading font-mono">SOURCES CONSULTED ({allSources.length})</h4>
              <div className="js-sources-grid">
                {allSources.map((src, idx) => (
                  <div key={idx} className="js-source-card">
                    <div className="js-source-name font-mono">{src.sourceName}</div>
                    <div className="js-source-scope">{src.queryScope || src.category}</div>
                    <div className="js-source-status font-mono">{src.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ATS Match Details if available */}
            {listingBestMatch && (
              <div className="js-tech-block">
                <h4 className="js-tech-heading font-mono">ATS LISTING MATCH DETAILS</h4>
                <div className="js-source-card">
                  <div className="font-semibold text-sm text-[#202923]">{listingBestMatch.jobTitle}</div>
                  <div className="text-xs text-[#737D76]">{listingBestMatch.companyName} • {listingBestMatch.location || 'Remote'}</div>
                  {listingBestMatch.url && (
                    <a 
                      href={listingBestMatch.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs text-[#49B99A] underline inline-flex items-center gap-1 mt-1 font-mono"
                    >
                      <span>{listingBestMatch.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 8. REPORT FOOTNOTE */}
      <footer className="js-report-footer">
        <p className="js-footer-disclaimer font-mono">
          VERIFYME JOBSHIELD • INDEPENDENT RECRUITMENT AUTHENTICITY INTELLIGENCE • EVIDENCE-BASED TELEMETRY
        </p>
      </footer>
    </article>
  );
};

export default JobShieldReport;
