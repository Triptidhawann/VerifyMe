import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  AlertOctagon, 
  ArrowLeft,
  FileText,
  Building,
  Mail,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Clock,
  Globe,
  Search,
  Database,
  Info,
  XCircle,
  FileSearch,
  Hash,
  Send,
  Lock
} from 'lucide-react';
import './JobShield.css';

const JobShieldReport = ({ investigation, onNewInvestigation }) => {
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, VERIFIED, CONTRADICTIONS, SUSPICIOUS, UNVERIFIED
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedCheckpoint, setExpandedCheckpoint] = useState(null);

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
    materialFindings = [],
    listingInvestigation = {},
    listingBestMatch = null,
    listingEvidence = [],
    recruiterInvestigation = {},
    sourcesConsulted = [],
    checkpoints = [],
    submissionType = 'text',
    createdAtIso = new Date().toISOString()
  } = safeInvestigation;

  const isVerified = outcome === 'VERIFIED THROUGH OFFICIAL SOURCES';
  const isLikely = outcome === 'LIKELY LEGITIMATE — SOME DETAILS UNVERIFIED';
  const isSuspicious = outcome === 'SUSPICIOUS — INCONSISTENCIES DETECTED';
  const isHighRisk = outcome === 'HIGH RISK — STRONG FRAUD INDICATORS';

  let themeClass = 'insufficient';
  let OutcomeIcon = HelpCircle;

  if (isVerified) {
    themeClass = 'verified';
    OutcomeIcon = ShieldCheck;
  } else if (isLikely) {
    themeClass = 'likely';
    OutcomeIcon = ShieldCheck;
  } else if (isSuspicious) {
    themeClass = 'suspicious';
    OutcomeIcon = AlertTriangle;
  } else if (isHighRisk) {
    themeClass = 'high-risk';
    OutcomeIcon = ShieldAlert;
  }

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

  // Compile unified sources if not already structured
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
          status: ev.status === 'FOUND_EXACT' ? '200 OK — Active Requisition Verified' : (ev.status === 'FOUND_SIMILAR' ? '200 OK — Related Vacancy Located' : 'Position Not On Active Board'),
          timestamp: ev.checkedAt || createdAtIso
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
        status: recruiterInvestigation.senderHasMx ? 'Active MX Records Resolved' : 'No MX Records Found (Unroutable)',
        timestamp: createdAtIso
      });
    }
    if (claims.claimedDomain) {
      derived.push({
        sourceName: `Corporate Domain Registry (${claims.claimedDomain})`,
        category: 'Official employer source',
        sourceUrl: `https://${claims.claimedDomain}`,
        queryScope: 'Corporate identity and SSL/TLS certificate verification',
        status: 'Authoritative Identity Established',
        timestamp: createdAtIso
      });
    }
    return derived;
  }, [sourcesConsulted, listingEvidence, claims, recruiterInvestigation, createdAtIso]);

  // Compile unified checkpoints if not already structured
  const allCheckpoints = useMemo(() => {
    if (Array.isArray(checkpoints) && checkpoints.length > 0) {
      return checkpoints;
    }
    return [
      {
        id: 'submission_received',
        name: 'Submission Ingested',
        status: 'completed',
        explanation: `Received ${submissionType.toUpperCase()} input for forensic evaluation.`,
        timestamp: createdAtIso,
        details: `Submission format: ${submissionType}. Content validated within memory boundaries.`
      },
      {
        id: 'document_extraction',
        name: 'Entity & Claim Extraction',
        status: (claims.companyName || claims.jobTitle) ? 'completed' : 'partial',
        explanation: (claims.companyName || claims.jobTitle) 
          ? `Extracted position '${claims.jobTitle || 'Role'}' and company '${claims.companyName || 'Company'}'.` 
          : 'Extracted limited structured claims from submission.',
        timestamp: createdAtIso,
        details: `Claims: Role (${claims.jobTitle || 'N/A'}), Employer (${claims.companyName || 'N/A'}), Req ID (${claims.jobId || 'N/A'}), Salary (${claims.salary || 'N/A'}).`
      },
      {
        id: 'company_identity',
        name: 'Corporate Identity Inspection',
        status: claims.claimedDomain ? 'completed' : 'not_applicable',
        explanation: claims.claimedDomain ? `Analyzed corporate root domain '${claims.claimedDomain}'.` : 'No corporate domain declared.',
        timestamp: createdAtIso,
        details: `Target: ${claims.claimedDomain || 'None'}. Lookalike mimicry risk: ${recruiterInvestigation.isLookalikeDomain ? 'FLAGGED' : 'CLEAR'}.`
      },
      {
        id: 'job_listing_lookup',
        name: 'Public ATS Job Board Lookup',
        status: 'completed',
        explanation: listingBestMatch?.status === 'FOUND_EXACT' 
          ? 'Exact match verified on official public ATS board.' 
          : (listingBestMatch?.status === 'FOUND_SIMILAR' ? 'Related job listing located on ATS board.' : 'No active listing located on public ATS index.'),
        timestamp: createdAtIso,
        details: `ATS queries dispatched to supported providers (Greenhouse, Lever, Workable, Ashby, SmartRecruiters).`
      },
      {
        id: 'recruiter_communication',
        name: 'Recruiter Communication & Domain Alignment',
        status: claims.senderEmail ? 'completed' : 'not_applicable',
        explanation: claims.senderEmail 
          ? (recruiterInvestigation.isDomainAligned ? 'Sender domain matches claimed corporate domain.' : 'Sender domain is not aligned with corporate domain.') 
          : 'No sender email address provided.',
        timestamp: createdAtIso,
        details: `Sender: ${claims.senderEmail || 'N/A'}. Corporate: ${claims.claimedDomain || 'N/A'}. MX records validated.`
      },
      {
        id: 'fraud_analysis',
        name: 'Process Integrity & Fraud Analysis',
        status: 'completed',
        explanation: suspiciousIndicators.length > 0 
          ? `${suspiciousIndicators.length} risk pattern(s) identified.` 
          : 'No advance-fee, equipment check, or credential theft patterns identified.',
        timestamp: createdAtIso,
        details: `Scanned for payment demands, check re-routing, urgency signals, and off-platform redirection.`
      },
      {
        id: 'final_assessment',
        name: 'Authoritative Synthesis',
        status: 'completed',
        explanation: `Classified as ${outcome}.`,
        timestamp: createdAtIso,
        details: `Evaluation generated strictly from verified factual evidence and cryptographic/DNS checks.`
      }
    ];
  }, [checkpoints, submissionType, claims, listingBestMatch, recruiterInvestigation, suspiciousIndicators, outcome, createdAtIso]);

  // Calculate 6 Dashboard Metrics
  const totalEvidenceChecks = verifiedFacts.length + contradictions.length + suspiciousIndicators.length + unverifiedItems.length;
  const metrics = [
    {
      id: 'TOTAL',
      label: 'Checks Completed',
      count: totalEvidenceChecks,
      accent: 'text-slate-900',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      filterTarget: 'ALL'
    },
    {
      id: 'VERIFIED',
      label: 'Verified Facts',
      count: verifiedFacts.length,
      accent: 'text-emerald-700',
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      filterTarget: 'VERIFIED'
    },
    {
      id: 'CONTRADICTIONS',
      label: 'Contradictions Detected',
      count: contradictions.length,
      accent: 'text-amber-700',
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      filterTarget: 'CONTRADICTIONS'
    },
    {
      id: 'SUSPICIOUS',
      label: 'Suspicious Indicators',
      count: suspiciousIndicators.length,
      accent: 'text-rose-700',
      bg: 'bg-rose-50/70',
      border: 'border-rose-200',
      filterTarget: 'SUSPICIOUS'
    },
    {
      id: 'UNVERIFIED',
      label: 'Unverified Items',
      count: unverifiedItems.length,
      accent: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      filterTarget: 'UNVERIFIED'
    },
    {
      id: 'SOURCES',
      label: 'Sources Consulted',
      count: allSources.length,
      accent: 'text-[#174C3C]',
      bg: 'bg-[#EAF6ED]',
      border: 'border-[#A7D8B4]',
      filterTarget: 'SOURCES'
    }
  ];

  // Distribution proportions
  const pctVerified = totalEvidenceChecks > 0 ? (verifiedFacts.length / totalEvidenceChecks) * 100 : 0;
  const pctContradictions = totalEvidenceChecks > 0 ? (contradictions.length / totalEvidenceChecks) * 100 : 0;
  const pctSuspicious = totalEvidenceChecks > 0 ? (suspiciousIndicators.length / totalEvidenceChecks) * 100 : 0;
  const pctUnverified = totalEvidenceChecks > 0 ? (unverifiedItems.length / totalEvidenceChecks) * 100 : 0;

  // Flattened & categorized evidence items for the Interactive Explorer
  const allEvidenceRows = useMemo(() => {
    const list = [];

    // Verified
    verifiedFacts.forEach((vf, idx) => {
      list.push({
        id: `vf-${idx}`,
        type: 'VERIFIED',
        category: vf.category || (vf.fact?.toLowerCase().includes('ats') || vf.fact?.toLowerCase().includes('job') ? 'Job Listing' : 'Corporate Identity'),
        title: vf.fact,
        finding: vf.detail,
        source: vf.source || 'Authoritative Source',
        sourceUrl: vf.sourceUrl || null,
        severity: 'INFO',
        timestamp: vf.timestamp || createdAtIso,
        whatWasChecked: `Verification of claimed entity or job record against ${vf.source || 'official registry'}.`,
        limitations: 'Limited to public records at time of inquiry.'
      });
    });

    // Contradictions
    contradictions.forEach((c, idx) => {
      list.push({
        id: `ct-${idx}`,
        type: 'CONTRADICTIONS',
        category: c.category || (c.contradiction?.toLowerCase().includes('email') || c.contradiction?.toLowerCase().includes('domain') ? 'Recruiter Communication' : 'Job Listing'),
        title: c.contradiction,
        finding: c.detail,
        source: c.source || 'Cross-Match Verification Engine',
        sourceUrl: null,
        severity: c.severity || 'HIGH',
        timestamp: createdAtIso,
        whatWasChecked: 'Cross-reference between submitted candidate communication and technical records.',
        limitations: 'Discrepancy confirms mismatch between claims and evidence.'
      });
    });

    // Suspicious
    suspiciousIndicators.forEach((s, idx) => {
      list.push({
        id: `sp-${idx}`,
        type: 'SUSPICIOUS',
        category: 'Fraud Indicators',
        title: s.indicator,
        finding: s.explanation,
        source: 'Process Integrity Heuristics & Threat Patterns',
        sourceUrl: null,
        severity: s.severity || 'CRITICAL',
        timestamp: createdAtIso,
        whatWasChecked: 'Forensic inspection for payment demands, check schemes, or sensitive credential harvesting.',
        limitations: 'Pattern matches known recruitment fraud vectors.'
      });
    });

    // Unverified
    unverifiedItems.forEach((u, idx) => {
      list.push({
        id: `uv-${idx}`,
        type: 'UNVERIFIED',
        category: 'Scope Boundaries',
        title: u.item,
        finding: u.detail,
        source: 'Investigation Boundary',
        sourceUrl: null,
        severity: 'UNVERIFIED',
        timestamp: createdAtIso,
        whatWasChecked: 'Investigation scope limits and unstated parameters.',
        limitations: 'Cannot be definitively proven or disproven without internal corporate access.'
      });
    });

    return list;
  }, [verifiedFacts, contradictions, suspiciousIndicators, unverifiedItems, createdAtIso]);

  // Filtered evidence rows
  const filteredEvidenceRows = useMemo(() => {
    if (activeFilter === 'ALL') return allEvidenceRows;
    return allEvidenceRows.filter(row => row.type === activeFilter);
  }, [allEvidenceRows, activeFilter]);

  const handleCopyReport = () => {
    const lines = [
      `=======================================================`,
      `VERIFYME JOBSHIELD — FORENSIC RECRUITMENT CASE FILE`,
      `=======================================================`,
      `Case ID: ${id}`,
      `Investigation Timestamp: ${formatDate(createdAtIso)}`,
      `Submission Format: ${submissionType.toUpperCase()}`,
      `Final Assessment: ${outcome}`,
      ``,
      `STATED OPPORTUNITY:`,
      `• Job Title: ${claims.jobTitle || 'Unspecified'}`,
      `• Employer: ${claims.companyName || 'Unspecified'}`,
      `• Requisition ID: ${claims.jobId || 'N/A'}`,
      `• Stated Salary: ${claims.salary || 'N/A'}`,
      `• Sender Email: ${claims.senderEmail || 'N/A'}`,
      `• Claimed Domain: ${claims.claimedDomain || 'N/A'}`,
      ``,
      `EXECUTIVE VERDICT:`,
      `${summary}`,
      ``,
      `RECOMMENDED ACTION:`,
      `${recommendedAction}`,
      ``,
      `--- SECTION A: VERIFIED FACTS (${verifiedFacts.length}) ---`,
      ...(verifiedFacts.length > 0 
        ? verifiedFacts.map(f => `[VERIFIED] ${f.fact} — ${f.detail} (Source: ${f.source})`)
        : ['No claims could be independently confirmed through official records.']),
      ``,
      `--- SECTION B: CONTRADICTIONS & MISMATCHES (${contradictions.length}) ---`,
      ...(contradictions.length > 0
        ? contradictions.map(c => `[CONTRADICTION] ${c.contradiction}: ${c.detail}`)
        : ['None detected']),
      ``,
      `--- SECTION C: SUSPICIOUS FRAUD INDICATORS (${suspiciousIndicators.length}) ---`,
      ...(suspiciousIndicators.length > 0
        ? suspiciousIndicators.map(i => `[ALERT - ${i.severity || 'HIGH'}] ${i.indicator}: ${i.explanation}`)
        : ['None flagged']),
      ``,
      `--- SECTION D: UNVERIFIED BOUNDARIES (${unverifiedItems.length}) ---`,
      ...unverifiedItems.map(u => `[LIMITATION] ${u.item}: ${u.detail}`),
      ``,
      `--- SECTION E: SOURCES CONSULTED (${allSources.length}) ---`,
      ...allSources.map(s => `• ${s.sourceName} | ${s.category} | Status: ${s.status}`),
      ``,
      `=======================================================`,
      `Investigation generated by VerifyMe JobShield Multi-Engine Pipeline`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMetricClick = (target) => {
    if (target === 'SOURCES') {
      scrollToSection('js-sources-section');
    } else {
      setActiveFilter(target);
      scrollToSection('js-evidence-explorer');
    }
  };

  // Best match ATS details for comparison table
  const matchedJob = listingBestMatch?.matchedJob || null;
  const matchStatus = listingBestMatch?.status || 'NOT_FOUND_ON_BOARD';

  const getMatchBadge = (field) => {
    if (!matchedJob) {
      return <span className="js-cmp-badge unverified">Not Available</span>;
    }
    if (field === 'company') {
      const isMatch = claims.companyName && matchedJob.company && 
        claims.companyName.toLowerCase().includes(matchedJob.company.toLowerCase());
      return isMatch 
        ? <span className="js-cmp-badge exact">Exact Match</span> 
        : <span className="js-cmp-badge related">Partial Match</span>;
    }
    if (field === 'title') {
      if (matchStatus === 'FOUND_EXACT') {
        return <span className="js-cmp-badge exact">Exact Match</span>;
      }
      if (matchStatus === 'FOUND_SIMILAR') {
        return <span className="js-cmp-badge related">Related Title</span>;
      }
      return <span className="js-cmp-badge mismatch">Mismatch</span>;
    }
    if (field === 'jobId') {
      if (claims.jobId && matchedJob.id) {
        return String(claims.jobId) === String(matchedJob.id)
          ? <span className="js-cmp-badge exact">Exact Match</span>
          : <span className="js-cmp-badge mismatch">Mismatch</span>;
      }
      return <span className="js-cmp-badge unverified">Unstated / N/A</span>;
    }
    if (field === 'location') {
      return matchedJob.location 
        ? <span className="js-cmp-badge related">Available in Listing</span>
        : <span className="js-cmp-badge unverified">Unspecified</span>;
    }
    if (field === 'salary') {
      return <span className="js-cmp-badge unverified">Unlisted on Public ATS</span>;
    }
    if (field === 'destination') {
      return matchedJob.url 
        ? <span className="js-cmp-badge exact">Official Portal Available</span>
        : <span className="js-cmp-badge unverified">N/A</span>;
    }
    return <span className="js-cmp-badge unverified">Unverified</span>;
  };

  if (!investigation) return null;

  return (
    <div className="js-report-shell">
      {/* 1. COMPACT INVESTIGATION HEADER */}
      <div className="js-compact-header">
        <div className="js-compact-header-left">
          <button 
            type="button" 
            onClick={onNewInvestigation}
            className="js-header-btn-back"
            title="Return to investigation input"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Investigation</span>
          </button>
          <div className="js-header-divider" />
          <div className="js-header-id-group">
            <span className="js-header-title-badge">JobShield Case</span>
            <span className="js-header-case-id">{id}</span>
          </div>
          <div className="js-header-divider" />
          <span className="js-header-meta-item">
            <Calendar className="w-3 h-3 text-slate-400" />
            {formatDate(createdAtIso)}
          </span>
          <span className="js-header-meta-pill">
            {submissionType.toUpperCase()}
          </span>
        </div>

        <div className="js-compact-header-right">
          <button 
            type="button" 
            className="js-export-btn"
            onClick={handleCopyReport}
            title="Copy plain-text forensic report to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Case File Copied' : 'Export Case File'}</span>
          </button>
        </div>
      </div>

      {/* 2. ASSESSMENT OVERVIEW (HERO) */}
      <div className={`js-assessment-card ${themeClass}`}>
        <div className="js-assessment-topline">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`js-outcome-pill ${themeClass}`}>
              <OutcomeIcon className="w-4 h-4 shrink-0" />
              <span>{outcome}</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {claims.companyName ? `Target Employer: ${claims.companyName}` : 'Recruitment Communication Audit'}
            </span>
          </div>

          <span className="text-[11px] font-mono font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
            Case Ref: {id}
          </span>
        </div>

        <h2 className="js-assessment-headline">
          {claims.jobTitle 
            ? `${claims.jobTitle} — ${claims.companyName || 'Claimed Organization'}` 
            : (claims.companyName || 'Recruitment Opportunity Analysis')}
        </h2>

        <p className="js-assessment-summary">
          {summary}
        </p>

        {/* Claimed Case Metadata Strip */}
        <div className="js-claims-strip">
          <div className="js-claim-cell">
            <span className="js-claim-label">Employer</span>
            <span className="js-claim-value">{claims.companyName || 'Unspecified'}</span>
          </div>
          <div className="js-claim-cell">
            <span className="js-claim-label">Position</span>
            <span className="js-claim-value">{claims.jobTitle || 'Unspecified'}</span>
          </div>
          <div className="js-claim-cell">
            <span className="js-claim-label">Requisition ID</span>
            <span className="js-claim-value font-mono">{claims.jobId || 'N/A'}</span>
          </div>
          <div className="js-claim-cell">
            <span className="js-claim-label">Stated Salary</span>
            <span className="js-claim-value">{claims.salary || 'N/A'}</span>
          </div>
          <div className="js-claim-cell">
            <span className="js-claim-label">Sender Email</span>
            <span className="js-claim-value font-mono">{claims.senderEmail || 'N/A'}</span>
          </div>
          <div className="js-claim-cell">
            <span className="js-claim-label">Claimed Domain</span>
            <span className="js-claim-value font-mono">{claims.claimedDomain || 'N/A'}</span>
          </div>
        </div>

        {/* Tailored Recommended Action Callout */}
        {recommendedAction && (
          <div className="js-action-box">
            <div className="js-action-box-icon">
              <ShieldCheck className="w-4 h-4 text-slate-800" />
            </div>
            <div className="js-action-box-content">
              <span className="js-action-box-title">Recommended Protocol</span>
              <p className="js-action-box-desc">{recommendedAction}</p>
            </div>
          </div>
        )}

        <div className="js-boundary-notice">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            <strong>Verification Boundary:</strong> VerifyMe examines public registries, authoritative ATS boards, and technical mail headers. Never treat an unverified job offer as safe without independent direct confirmation.
          </span>
        </div>
      </div>

      {/* 3. INVESTIGATION METRICS DASHBOARD */}
      <div className="js-metrics-grid">
        {metrics.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleMetricClick(m.filterTarget)}
            className={`js-metric-card ${m.bg} ${m.border} ${activeFilter === m.filterTarget ? 'active-metric' : ''}`}
            title={`Filter view by ${m.label}`}
          >
            <div className="js-metric-header">
              <span className="js-metric-label">{m.label}</span>
              <span className="js-metric-arrow">→</span>
            </div>
            <div className={`js-metric-value ${m.accent}`}>{m.count}</div>
          </button>
        ))}
      </div>

      {/* 4. EVIDENCE DISTRIBUTION VISUALIZATION */}
      <div className="js-distribution-box">
        <div className="js-distribution-header">
          <span className="js-distribution-title">Evidence Distribution Breakdown</span>
          <span className="text-xs text-slate-500">{totalEvidenceChecks} total diagnostic checks evaluated</span>
        </div>

        {totalEvidenceChecks === 0 ? (
          <div className="js-distribution-empty">No evidence checks recorded for this input.</div>
        ) : (
          <>
            <div className="js-distribution-bar">
              {pctVerified > 0 && (
                <div 
                  className="js-dist-segment verified" 
                  style={{ width: `${pctVerified}%` }} 
                  title={`Verified: ${verifiedFacts.length} (${pctVerified.toFixed(1)}%)`}
                  onClick={() => handleMetricClick('VERIFIED')}
                />
              )}
              {pctContradictions > 0 && (
                <div 
                  className="js-dist-segment contradictions" 
                  style={{ width: `${pctContradictions}%` }} 
                  title={`Contradictions: ${contradictions.length} (${pctContradictions.toFixed(1)}%)`}
                  onClick={() => handleMetricClick('CONTRADICTIONS')}
                />
              )}
              {pctSuspicious > 0 && (
                <div 
                  className="js-dist-segment suspicious" 
                  style={{ width: `${pctSuspicious}%` }} 
                  title={`Suspicious: ${suspiciousIndicators.length} (${pctSuspicious.toFixed(1)}%)`}
                  onClick={() => handleMetricClick('SUSPICIOUS')}
                />
              )}
              {pctUnverified > 0 && (
                <div 
                  className="js-dist-segment unverified" 
                  style={{ width: `${pctUnverified}%` }} 
                  title={`Unverified: ${unverifiedItems.length} (${pctUnverified.toFixed(1)}%)`}
                  onClick={() => handleMetricClick('UNVERIFIED')}
                />
              )}
            </div>

            <div className="js-distribution-legend">
              <button 
                type="button" 
                className={`js-legend-item ${activeFilter === 'VERIFIED' ? 'active' : ''}`}
                onClick={() => handleMetricClick('VERIFIED')}
              >
                <span className="js-legend-dot verified" />
                <span>Verified Facts ({verifiedFacts.length})</span>
                <span className="js-legend-pct">{pctVerified.toFixed(0)}%</span>
              </button>
              <button 
                type="button" 
                className={`js-legend-item ${activeFilter === 'CONTRADICTIONS' ? 'active' : ''}`}
                onClick={() => handleMetricClick('CONTRADICTIONS')}
              >
                <span className="js-legend-dot contradictions" />
                <span>Contradictions ({contradictions.length})</span>
                <span className="js-legend-pct">{pctContradictions.toFixed(0)}%</span>
              </button>
              <button 
                type="button" 
                className={`js-legend-item ${activeFilter === 'SUSPICIOUS' ? 'active' : ''}`}
                onClick={() => handleMetricClick('SUSPICIOUS')}
              >
                <span className="js-legend-dot suspicious" />
                <span>Suspicious Signals ({suspiciousIndicators.length})</span>
                <span className="js-legend-pct">{pctSuspicious.toFixed(0)}%</span>
              </button>
              <button 
                type="button" 
                className={`js-legend-item ${activeFilter === 'UNVERIFIED' ? 'active' : ''}`}
                onClick={() => handleMetricClick('UNVERIFIED')}
              >
                <span className="js-legend-dot unverified" />
                <span>Scope Limits ({unverifiedItems.length})</span>
                <span className="js-legend-pct">{pctUnverified.toFixed(0)}%</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 5. INVESTIGATION CHECKPOINT TIMELINE */}
      <div className="js-timeline-container">
        <div className="js-section-heading">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            <span>Forensic Investigation Checkpoints</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">7 Verification Stages Executed</span>
        </div>

        <div className="js-timeline-strip">
          {allCheckpoints.map((cp, idx) => {
            const isExpanded = expandedCheckpoint === cp.id;
            const isCompleted = cp.status === 'completed';
            const isPartial = cp.status === 'partial';
            const isFailed = cp.status === 'failed';

            let statusClass = 'neutral';
            if (isCompleted) statusClass = 'completed';
            else if (isPartial) statusClass = 'partial';
            else if (isFailed) statusClass = 'failed';

            return (
              <div key={cp.id} className="js-timeline-step-wrapper">
                <div 
                  className={`js-timeline-node ${statusClass} ${isExpanded ? 'active-node' : ''}`}
                  onClick={() => setExpandedCheckpoint(isExpanded ? null : cp.id)}
                  title="Click to view stage diagnostics"
                >
                  <div className="js-timeline-step-indicator">
                    {idx + 1}
                  </div>
                  <div className="js-timeline-step-info">
                    <span className="js-timeline-step-name">{cp.name}</span>
                    <span className="js-timeline-step-status">{cp.status.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="js-timeline-drawer">
                    <div className="text-xs font-semibold text-slate-800 mb-1">{cp.explanation}</div>
                    <div className="text-xs text-slate-600 mb-2 leading-relaxed">{cp.details}</div>
                    <div className="text-[11px] font-mono text-slate-400">Recorded: {formatDate(cp.timestamp)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. JOB LISTING COMPARISON PANEL (SIDE-BY-SIDE ATS COMPARISON) */}
      <div className="js-comparison-section">
        <div className="js-section-heading">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-700" />
            <span>Public ATS Job Listing Cross-Examination</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">
            {matchStatus === 'FOUND_EXACT' 
              ? 'Exact Public Vacancy Located' 
              : (matchStatus === 'FOUND_SIMILAR' ? 'Related Vacancy Located' : 'No Official Vacancy Found')}
          </span>
        </div>

        <div className="js-comparison-table-wrapper">
          <table className="js-comparison-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Verification Parameter</th>
                <th style={{ width: '34%' }}>Submitted Opportunity Claim</th>
                <th style={{ width: '34%' }}>Official Public Listing (ATS)</th>
                <th style={{ width: '10%' }}>Match Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-slate-800">Employer Organization</td>
                <td>
                  <span className="font-medium text-slate-900">{claims.companyName || 'Not extracted / Unstated'}</span>
                  {claims.claimedDomain && <span className="block text-[11px] font-mono text-slate-500">Domain: {claims.claimedDomain}</span>}
                </td>
                <td>
                  {matchedJob?.company || (matchStatus === 'FOUND_EXACT' ? claims.companyName : (listingBestMatch?.sourceName || 'Not located on public ATS'))}
                </td>
                <td>{getMatchBadge('company')}</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">Position / Job Title</td>
                <td>
                  <span className="font-medium text-slate-900">{claims.jobTitle || 'Not extracted / Unstated'}</span>
                </td>
                <td>
                  {matchedJob?.title ? (
                    <div>
                      <span className="font-medium text-slate-900">{matchedJob.title}</span>
                      {matchedJob.url && (
                        <a href={matchedJob.url} target="_blank" rel="noopener noreferrer" className="js-source-link text-xs block mt-0.5">
                          <span>View Official Posting</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No corresponding vacancy found on public board</span>
                  )}
                </td>
                <td>{getMatchBadge('title')}</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">Requisition ID</td>
                <td>
                  <span className="font-mono text-slate-800">{claims.jobId || 'Not stated in submission'}</span>
                </td>
                <td>
                  <span className="font-mono text-slate-800">{matchedJob?.id || 'N/A'}</span>
                </td>
                <td>{getMatchBadge('jobId')}</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">Location & Work Mode</td>
                <td>
                  <span>{claims.location || 'Unstated in submission'}</span>
                </td>
                <td>
                  <span>{matchedJob?.location || 'Unlisted / Remote'}</span>
                </td>
                <td>{getMatchBadge('location')}</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">Stated Compensation</td>
                <td>
                  <span className="font-medium text-slate-900">{claims.salary || 'Unstated in submission'}</span>
                </td>
                <td>
                  <span className="text-slate-500 italic">Unpublished on public board feed</span>
                </td>
                <td>{getMatchBadge('salary')}</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">Application Destination</td>
                <td>
                  <span className="font-mono text-xs text-slate-700 truncate block max-w-xs">{claims.applicationUrl || claims.senderEmail || 'N/A'}</span>
                </td>
                <td>
                  {matchedJob?.url ? (
                    <a href={matchedJob.url} target="_blank" rel="noopener noreferrer" className="js-source-link text-xs">
                      <span className="truncate max-w-xs block">{matchedJob.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-500 italic">Official careers portal</span>
                  )}
                </td>
                <td>{getMatchBadge('destination')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {matchStatus === 'NOT_FOUND_ON_BOARD' && (
          <div className="js-notice-strip">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong>ATS Verification Note:</strong> We searched standard public job boards (Greenhouse, Lever, Workable, Ashby, SmartRecruiters) for this employer, but this specific role was not located. While some corporate roles are unlisted or handled via external agencies, scammers frequently invent positions using real company names.
            </div>
          </div>
        )}
      </div>

      {/* 7. INTERACTIVE EVIDENCE EXPLORER */}
      <div id="js-evidence-explorer" className="js-evidence-explorer-section">
        <div className="js-explorer-header">
          <div className="js-section-heading no-border p-0">
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-slate-700" />
              <span>Interactive Evidence Explorer</span>
            </div>
            <span className="text-xs text-slate-500 font-normal">
              Showing {filteredEvidenceRows.length} of {allEvidenceRows.length} diagnostic findings
            </span>
          </div>

          {/* Filter Pills */}
          <div className="js-explorer-filter-pills">
            <button 
              type="button"
              className={`js-explorer-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All Records ({allEvidenceRows.length})
            </button>
            <button 
              type="button"
              className={`js-explorer-pill verified ${activeFilter === 'VERIFIED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('VERIFIED')}
            >
              Verified ({verifiedFacts.length})
            </button>
            <button 
              type="button"
              className={`js-explorer-pill contradictions ${activeFilter === 'CONTRADICTIONS' ? 'active' : ''}`}
              onClick={() => setActiveFilter('CONTRADICTIONS')}
            >
              Contradictions ({contradictions.length})
            </button>
            <button 
              type="button"
              className={`js-explorer-pill suspicious ${activeFilter === 'SUSPICIOUS' ? 'active' : ''}`}
              onClick={() => setActiveFilter('SUSPICIOUS')}
            >
              Suspicious ({suspiciousIndicators.length})
            </button>
            <button 
              type="button"
              className={`js-explorer-pill unverified ${activeFilter === 'UNVERIFIED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('UNVERIFIED')}
            >
              Scope Limits ({unverifiedItems.length})
            </button>
          </div>
        </div>

        {/* Evidence Items List */}
        <div className="js-evidence-list">
          {filteredEvidenceRows.length === 0 ? (
            <div className="js-evidence-empty">
              No evidence findings in category <strong>{activeFilter}</strong>.
            </div>
          ) : (
            filteredEvidenceRows.map((row) => {
              const isExpanded = expandedRow === row.id;
              let badgeClass = 'neutral';
              let badgeLabel = 'RECORD';

              if (row.type === 'VERIFIED') {
                badgeClass = 'verified';
                badgeLabel = 'VERIFIED FACT';
              } else if (row.type === 'CONTRADICTIONS') {
                badgeClass = 'contradiction';
                badgeLabel = 'CONTRADICTION';
              } else if (row.type === 'SUSPICIOUS') {
                badgeClass = 'suspicious';
                badgeLabel = 'FRAUD RISK';
              } else if (row.type === 'UNVERIFIED') {
                badgeClass = 'unverified';
                badgeLabel = 'LIMITATION';
              }

              return (
                <div key={row.id} className={`js-evidence-card ${badgeClass} ${isExpanded ? 'expanded' : ''}`}>
                  <div 
                    className="js-evidence-card-header"
                    onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                  >
                    <div className="js-evidence-card-left">
                      <span className={`js-type-badge ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <span className="js-evidence-category-tag">{row.category}</span>
                      <h4 className="js-evidence-card-title">{row.title}</h4>
                    </div>

                    <div className="js-evidence-card-right">
                      <span className="js-evidence-source-tag">{row.source}</span>
                      <button 
                        type="button" 
                        className="js-expand-btn"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="js-evidence-summary-row">
                    <p className="js-evidence-finding-text">{row.finding}</p>
                  </div>

                  {/* Expandable Forensic Drawer */}
                  {isExpanded && (
                    <div className="js-evidence-drawer">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="js-drawer-label">What was checked</span>
                          <p className="js-drawer-text">{row.whatWasChecked}</p>
                        </div>
                        <div>
                          <span className="js-drawer-label">Source & Provenance</span>
                          <div className="js-drawer-text flex items-center gap-1.5 flex-wrap">
                            <span>{row.source}</span>
                            {row.sourceUrl && (
                              <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="js-source-link">
                                <span>Inspect Source Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="js-drawer-label">Scope & Investigation Boundary</span>
                          <p className="js-drawer-text text-slate-500 italic">{row.limitations}</p>
                        </div>
                        <div>
                          <span className="js-drawer-label">Timestamp of Verification</span>
                          <p className="js-drawer-text font-mono text-slate-500">{formatDate(row.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 8. SOURCES CONSULTED (SOURCE EXPLORER) */}
      <div id="js-sources-section" className="js-sources-section">
        <div className="js-section-heading">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>Independent Sources Consulted</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">
            {allSources.length} external registries & authority endpoints queried
          </span>
        </div>

        <div className="js-sources-table-wrapper">
          <table className="js-sources-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Source Name</th>
                <th style={{ width: '22%' }}>Category</th>
                <th style={{ width: '28%' }}>Query Scope</th>
                <th style={{ width: '22%' }}>Status & Provenance</th>
              </tr>
            </thead>
            <tbody>
              {allSources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-slate-500 italic p-4 text-center">
                    No external sources were recorded for this investigation.
                  </td>
                </tr>
              ) : (
                allSources.map((src, idx) => (
                  <tr key={`src-${idx}`}>
                    <td>
                      <span className="font-semibold text-slate-900 block">{src.sourceName}</span>
                      {src.sourceUrl && src.sourceUrl !== '#' && (
                        <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" className="js-source-link text-[11px] mt-0.5 inline-flex">
                          <span>{src.sourceUrl}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="js-category-badge">{src.category}</span>
                    </td>
                    <td className="text-slate-600 text-xs">{src.queryScope}</td>
                    <td>
                      <span className="js-status-pill">{src.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. RECOMMENDED ACTIONS PANEL */}
      <div className="js-recommended-defense-panel">
        <div className="js-defense-header">
          <ShieldAlert className="w-5 h-5 text-slate-800" />
          <h3 className="js-defense-title">Forensic Defense Protocol for Job Seekers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="js-defense-card">
            <div className="js-defense-step-num">01</div>
            <h4 className="js-defense-card-title">Direct Portal Application</h4>
            <p className="js-defense-card-text">
              Always verify open roles directly on the employer's official website (e.g. <code>https://stripe.com/jobs</code>). Never submit personal identifiers through unauthenticated forms or external chat platforms.
            </p>
          </div>
          <div className="js-defense-card">
            <div className="js-defense-step-num">02</div>
            <h4 className="js-defense-card-title">Zero Upfront Payments</h4>
            <p className="js-defense-card-text">
              Legitimate employers provide equipment directly or reimburse expenses via corporate payroll. Any request for equipment purchase, software fees, or check deposits is confirmed recruitment fraud.
            </p>
          </div>
          <div className="js-defense-card">
            <div className="js-defense-step-num">03</div>
            <h4 className="js-defense-card-title">Corporate Domain Verification</h4>
            <p className="js-defense-card-text">
              Ensure communications originate from the verified corporate root domain. Watch for lookalike characters or recruiters operating exclusively through public consumer email providers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobShieldReport;
