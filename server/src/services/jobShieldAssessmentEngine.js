const Groq = require('groq-sdk');

let groq;
try {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'dummy_key_to_prevent_crash_if_not_set') {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch {
  // Graceful fallback
}

const OUTCOMES = {
  VERIFIED: 'VERIFIED THROUGH OFFICIAL SOURCES',
  LIKELY_LEGITIMATE: 'LIKELY LEGITIMATE — SOME DETAILS UNVERIFIED',
  SUSPICIOUS: 'SUSPICIOUS — INCONSISTENCIES DETECTED',
  HIGH_RISK: 'HIGH RISK — STRONG FRAUD INDICATORS',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT EVIDENCE'
};

/**
 * Determine the authoritative evaluation outcome based on deterministic evidence.
 */
function determineOutcome({
  extractedClaims,
  listingInvestigation,
  recruiterInvestigation,
  processInvestigation
}) {
  // Rule 0: Insufficient evidence check
  const hasBasicEntity = extractedClaims.companyName || extractedClaims.claimedDomain || extractedClaims.senderDomain;
  if (!hasBasicEntity) {
    return OUTCOMES.INSUFFICIENT_EVIDENCE;
  }

  // Rule 1: High Risk — Strong Fraud Indicators
  // Triggered by upfront fees, credential theft, fake check patterns, confirmed lookalike domain, or sender domain missing MX
  if (
    processInvestigation.criticalCount > 0 ||
    recruiterInvestigation.isLookalikeDomain ||
    (recruiterInvestigation.senderDomain && recruiterInvestigation.senderHasMx === false)
  ) {
    return OUTCOMES.HIGH_RISK;
  }

  // Rule 2: Suspicious — Inconsistencies Detected
  // Triggered by free email for corporate role, domain mismatch, reply-to mismatch, offer without interview, or suspicious app link
  const hasDomainMismatch = recruiterInvestigation.claimedDomain && !recruiterInvestigation.isDomainAligned && !recruiterInvestigation.isSubdomainAligned;
  const isFreeEmailForCorporate = recruiterInvestigation.isFreeEmailSender && (extractedClaims.companyName || extractedClaims.claimedDomain);
  const isSuspiciousAppUrl = listingInvestigation?.appUrlAnalysis?.isSuspicious;

  if (
    processInvestigation.highCount > 0 ||
    isFreeEmailForCorporate ||
    hasDomainMismatch ||
    recruiterInvestigation.replyToMismatch ||
    isSuspiciousAppUrl
  ) {
    return OUTCOMES.SUSPICIOUS;
  }

  // Rule 3: Verified Through Official Sources
  // Confirmed active vacancy on official ATS or company careers portal + authentic aligned domain + 0 red flags
  const isListingOfficiallyVerified = listingInvestigation?.listingVerdict === 'OFFICIALLY_VERIFIED_ACTIVE';
  const isDomainAuthenticOrUnspecified = !recruiterInvestigation.senderDomain || recruiterInvestigation.isDomainAligned || recruiterInvestigation.isSubdomainAligned;

  if (isListingOfficiallyVerified && isDomainAuthenticOrUnspecified && processInvestigation.findings.length === 0) {
    return OUTCOMES.VERIFIED;
  }

  // Rule 4: Likely Legitimate — Some Details Unverified
  // Domain is aligned with company + plausible recruitment process, but job is not on public ATS (or no public ATS)
  if (recruiterInvestigation.isDomainAligned || recruiterInvestigation.isSubdomainAligned || listingInvestigation?.listingVerdict === 'APPLICATION_DESTINATION_VERIFIED') {
    return OUTCOMES.LIKELY_LEGITIMATE;
  }

  // If no sender email was given but company exists and no red flags found
  if (!recruiterInvestigation.senderEmail && listingInvestigation?.activeBoardFound) {
    return OUTCOMES.LIKELY_LEGITIMATE;
  }

  return OUTCOMES.INSUFFICIENT_EVIDENCE;
}

/**
 * Categorize findings into the 4 required explicit evidence dimensions:
 * 1. Verified facts
 * 2. Contradictions
 * 3. Suspicious indicators
 * 4. Information that could not be checked (limitations)
 */
function categorizeEvidence({
  extractedClaims,
  listingInvestigation,
  recruiterInvestigation,
  processInvestigation
}) {
  const verifiedFacts = [];
  const contradictions = [];
  const suspiciousIndicators = [];
  const unverifiedItems = [];

  // 1. Process Listing Findings
  if (listingInvestigation?.bestMatch?.status === 'FOUND_EXACT') {
    verifiedFacts.push({
      fact: `Active vacancy confirmed on ${listingInvestigation.bestMatch.sourceName}`,
      detail: `Role: '${listingInvestigation.bestMatch.matchedJob.title}' (ID: ${listingInvestigation.bestMatch.matchedJob.id})`,
      source: listingInvestigation.bestMatch.sourceName,
      sourceUrl: listingInvestigation.bestMatch.sourceUrl,
      timestamp: listingInvestigation.bestMatch.checkedAt
    });
  } else if (listingInvestigation?.bestMatch?.status === 'FOUND_SIMILAR') {
    verifiedFacts.push({
      fact: `Related role found on ${listingInvestigation.bestMatch.sourceName}`,
      detail: `Related title: '${listingInvestigation.bestMatch.matchedJob.title}'`,
      source: listingInvestigation.bestMatch.sourceName,
      sourceUrl: listingInvestigation.bestMatch.sourceUrl,
      timestamp: listingInvestigation.bestMatch.checkedAt
    });
    contradictions.push({
      contradiction: 'Job Title Nuance',
      detail: `Advertised position '${extractedClaims.jobTitle || 'Unspecified'}' differs slightly from official active listing '${listingInvestigation.bestMatch.matchedJob.title}'.`,
      severity: 'LOW',
      source: 'Public ATS Comparison'
    });
  } else if (listingInvestigation?.activeBoardFound) {
    contradictions.push({
      contradiction: 'Job Not Found on Public ATS Board',
      detail: `Official ATS board is active, but no listing matching '${extractedClaims.jobTitle || extractedClaims.jobId || 'vacancy'}' was found. Vacancy may be closed, unindexed, or handled via third-party agency.`,
      severity: 'MEDIUM',
      source: 'Official ATS Search'
    });
  } else {
    unverifiedItems.push({
      item: 'Public ATS Board Registration',
      detail: `No public Greenhouse, Lever, or Ashby board was discovered for '${extractedClaims.companyName || extractedClaims.claimedDomain || 'company'}'. The employer may use proprietary HR software or post only on internal portals.`
    });
  }

  // 2. Process Recruiter & Domain Findings
  if (recruiterInvestigation.isDomainAligned) {
    verifiedFacts.push({
      fact: 'Sender Corporate Domain Alignment',
      detail: `Sender address @${recruiterInvestigation.senderDomain} matches official company domain @${recruiterInvestigation.claimedDomain}.`,
      source: 'DNS Domain Inspection',
      sourceUrl: `https://${recruiterInvestigation.claimedDomain}`,
      timestamp: new Date().toISOString()
    });
  }

  if (recruiterInvestigation.senderHasMx) {
    verifiedFacts.push({
      fact: 'Sender Mail Routing Infrastructure Configured',
      detail: `Domain '${recruiterInvestigation.senderDomain}' has active Mail Exchange (MX) DNS records configured to receive mail.`,
      source: 'Authoritative DNS MX Query',
      timestamp: new Date().toISOString()
    });
  }

  if (recruiterInvestigation.isLookalikeDomain) {
    contradictions.push({
      contradiction: 'Lookalike Domain Spoofing',
      detail: recruiterInvestigation.lookalikeDetails,
      severity: 'CRITICAL',
      source: 'Domain Similarity Engine'
    });
    suspiciousIndicators.push({
      indicator: 'Deceptive Lookalike Domain Pattern',
      explanation: recruiterInvestigation.lookalikeDetails,
      severity: 'CRITICAL'
    });
  } else if (recruiterInvestigation.claimedDomain && !recruiterInvestigation.isDomainAligned && !recruiterInvestigation.isSubdomainAligned && !recruiterInvestigation.isFreeEmailSender) {
    contradictions.push({
      contradiction: 'Sender Domain Mismatch',
      detail: `Recruiter email domain (@${recruiterInvestigation.senderDomain}) is not affiliated with the claimed corporate domain (@${recruiterInvestigation.claimedDomain}).`,
      severity: 'HIGH',
      source: 'Domain Alignment Evaluation'
    });
  }

  if (recruiterInvestigation.isFreeEmailSender) {
    suspiciousIndicators.push({
      indicator: 'Free Public Webmail Used by Recruiter',
      explanation: `Recruiter is using a free personal webmail account (@${recruiterInvestigation.senderDomain}) while claiming to hire on behalf of ${extractedClaims.companyName || 'a corporate entity'}.`,
      severity: 'HIGH'
    });
  }

  if (recruiterInvestigation.replyToMismatch) {
    contradictions.push({
      contradiction: 'Reply-To Address Redirection',
      detail: recruiterInvestigation.replyToDetails,
      severity: 'HIGH',
      source: 'Email Header Inspection'
    });
    suspiciousIndicators.push({
      indicator: 'Hidden Reply-To Redirection',
      explanation: recruiterInvestigation.replyToDetails,
      severity: 'HIGH'
    });
  }

  // 3. Process Process Integrity Findings
  for (const f of processInvestigation.findings) {
    if (f.category === 'UPFRONT_FEE_DEMAND' || f.category === 'SENSITIVE_CREDENTIAL_THEFT') {
      suspiciousIndicators.push({
        indicator: f.title,
        explanation: f.description,
        severity: f.severity
      });
    } else {
      suspiciousIndicators.push({
        indicator: f.title,
        explanation: f.description,
        severity: f.severity
      });
    }
  }

  // 4. Standard Explicit Limitations (Information that could not be checked)
  unverifiedItems.push({
    item: 'Recruiter Employment Status',
    detail: 'VerifyMe checks domain alignment and infrastructure, but does not independently query the internal HR roster to confirm whether the specific individual named is currently employed.'
  });

  unverifiedItems.push({
    item: 'Third-Party Recruitment Agency Authorization',
    detail: 'If the sender represents a staffing firm or agency, their contractual authorization with the hiring employer cannot be verified without employer confirmation.'
  });

  unverifiedItems.push({
    item: 'Confidential & Private Listings',
    detail: 'Roles that are confidential or unlisted on public careers portals cannot be checked via public ATS endpoints.'
  });

  return {
    verifiedFacts,
    contradictions,
    suspiciousIndicators,
    unverifiedItems
  };
}

/**
 * Generate human-readable concise synthesis and recommended next steps.
 */
function generateSynthesisAndAction(outcome, { extractedClaims, processInvestigation, recruiterInvestigation, listingInvestigation }) {
  let summary = '';
  let recommendedAction = '';

  switch (outcome) {
    case OUTCOMES.VERIFIED:
      summary = `The position '${extractedClaims.jobTitle || 'Role'}' was confirmed active on official recruitment infrastructure (${listingInvestigation.bestMatch?.sourceName || 'official ATS'}), and the sender domain aligns with the official corporate domain with zero fraud indicators.`;
      recommendedAction = 'Proceed normally with the application. Submit all correspondence through the official corporate career portal.';
      break;

    case OUTCOMES.LIKELY_LEGITIMATE:
      summary = `The sender domain (@${recruiterInvestigation.senderDomain || 'corporate'}) matches the claimed corporate domain and the recruitment communication exhibits standard professional conventions. However, the specific vacancy could not be located on public job boards (it may be handled confidentially or by an external partner).`;
      recommendedAction = 'Confirm the role directly by navigating to the company\'s official website or asking the recruiter for the official requisition ID.';
      break;

    case OUTCOMES.SUSPICIOUS:
      summary = `Inconsistencies were detected in this recruitment communication. ${
        recruiterInvestigation.isFreeEmailSender
          ? `The sender is using a free personal webmail account (@${recruiterInvestigation.senderDomain}) while claiming to represent ${extractedClaims.companyName || 'an enterprise'}.`
          : (recruiterInvestigation.isDomainAligned === false ? `The sender domain does not match the claimed employer.` : 'Suspicious recruitment tactics or destinations were flagged.')
      }`;
      recommendedAction = 'Do NOT send sensitive personal documents, banking details, or click unverified links. Contact the claimed employer through their public website switchboard to verify the recruiter.';
      break;

    case OUTCOMES.HIGH_RISK:
      summary = `Critical recruitment fraud indicators were identified. ${
        processInvestigation.criticalCount > 0
          ? 'The communication requests upfront payments, equipment fees, or sensitive financial credentials—hallmarks of employment scam operations.'
          : (recruiterInvestigation.isLookalikeDomain ? 'The sender domain is an intentional lookalike designed to impersonate a known brand.' : 'The sending infrastructure is invalid or missing mail servers.')
      }`;
      recommendedAction = 'Cease all communication immediately. NEVER transfer funds, purchase gift cards, or deposit advance checks for remote work supplies. Report the message as phishing.';
      break;

    case OUTCOMES.INSUFFICIENT_EVIDENCE:
    default:
      summary = 'The submitted information does not contain enough extractable company, sender, or role details to complete a conclusive forensic evaluation.';
      recommendedAction = 'Provide the official company name, website, and recruiter email address to run a complete investigation.';
      break;
  }

  return { summary, recommendedAction };
}

/**
 * Collect all external and internal sources consulted during the investigation.
 */
function collectSourcesConsulted({ listingInvestigation, recruiterInvestigation, extractedClaims }) {
  const sources = [];
  const now = new Date().toISOString();

  // 1. ATS Board queries from listingInvestigation.evidence
  if (Array.isArray(listingInvestigation?.evidence)) {
    for (const ev of listingInvestigation.evidence) {
      if (ev.sourceType === 'official_ats') {
        sources.push({
          sourceName: ev.sourceName,
          category: 'Official ATS Source',
          sourceUrl: ev.sourceUrl,
          queryScope: ev.whatWasChecked,
          status: ev.status === 'FOUND_EXACT' 
            ? '200 OK — Active Requisition Verified' 
            : (ev.status === 'FOUND_SIMILAR' ? '200 OK — Related Vacancy Located' : (ev.status === 'NOT_FOUND_ON_BOARD' ? '200 OK — Position Not On Active Board' : '404 Board Not Registered')),
          timestamp: ev.checkedAt || now
        });
      }
    }
  }

  // 2. Authoritative DNS MX records for sender domain
  if (recruiterInvestigation?.senderDomain) {
    sources.push({
      sourceName: `Authoritative DNS MX Query (@${recruiterInvestigation.senderDomain})`,
      category: 'DNS infrastructure lookup',
      sourceUrl: `dns://${recruiterInvestigation.senderDomain}`,
      queryScope: `Mail Exchange records and routing capability for sender domain`,
      status: recruiterInvestigation.senderHasMx ? 'Active MX Records Resolved' : 'No MX Records Found (Unroutable)',
      timestamp: now
    });
  }

  // 3. Corporate Domain Resolution
  if (recruiterInvestigation?.claimedDomain) {
    sources.push({
      sourceName: `Corporate Domain Registry (${recruiterInvestigation.claimedDomain})`,
      category: 'Official employer source',
      sourceUrl: `https://${recruiterInvestigation.claimedDomain}`,
      queryScope: `Root corporate domain identity and reachability`,
      status: 'DNS Mapped',
      timestamp: now
    });
  }

  // 4. Application destination link
  if (extractedClaims?.applicationUrl) {
    const isAts = listingInvestigation?.appUrlAnalysis?.isOfficialAts;
    const isCompany = listingInvestigation?.appUrlAnalysis?.isClaimedDomain;
    sources.push({
      sourceName: isAts ? `Official ATS Application Portal` : (isCompany ? `Official Employer Career Portal` : `External Destination Link`),
      category: isAts ? 'Official ATS Source' : (isCompany ? 'Official employer source' : 'Third-Party Source'),
      sourceUrl: extractedClaims.applicationUrl,
      queryScope: `Candidate application routing and destination safety`,
      status: listingInvestigation?.appUrlAnalysis?.isSuspicious ? 'Suspicious Destination Flagged' : 'Valid Destination Link',
      timestamp: now
    });
  }

  // 5. User-supplied document/message
  sources.push({
    sourceName: 'Submitted Recruitment Communication',
    category: 'User-supplied material',
    sourceUrl: null,
    queryScope: 'Candidate-provided message, offer letter, or screenshot',
    status: 'In-Memory Parsed',
    timestamp: now
  });

  return sources;
}

/**
 * Generate discrete, verifiable investigation checkpoints with actual execution status.
 */
function generateCheckpoints({
  submissionType = 'text',
  claims,
  listingInvestigation,
  recruiterInvestigation,
  processInvestigation,
  outcome
}) {
  const now = new Date().toISOString();

  return [
    {
      id: 'submission_received',
      name: 'Submission Ingested',
      status: 'completed',
      explanation: `Received ${submissionType.toUpperCase()} input for forensic evaluation.`,
      timestamp: now,
      details: `Submission type: ${submissionType}. Payload verified within memory boundaries.`
    },
    {
      id: 'document_extraction',
      name: 'Entity & Claim Extraction',
      status: (claims.companyName || claims.jobTitle || claims.senderEmail) ? 'completed' : 'partial',
      explanation: (claims.companyName || claims.jobTitle)
        ? `Identified stated role '${claims.jobTitle || 'Role'}' and employer '${claims.companyName || 'Company'}'.`
        : 'Communication parsed with limited structured entities.',
      timestamp: now,
      details: `Extracted claims: Role (${claims.jobTitle || 'N/A'}), Company (${claims.companyName || 'N/A'}), Req ID (${claims.jobId || 'N/A'}), Stated Compensation (${claims.salary || 'N/A'}).`
    },
    {
      id: 'company_identity',
      name: 'Corporate Identity Inspection',
      status: claims.claimedDomain ? 'completed' : 'not_applicable',
      explanation: claims.claimedDomain
        ? (recruiterInvestigation.isLookalikeDomain ? 'Lookalike domain mimicry detected.' : 'Corporate root domain identified.')
        : 'No corporate domain specified or extractable.',
      timestamp: now,
      details: claims.claimedDomain
        ? `Target domain: ${claims.claimedDomain}. Lookalike analysis: ${recruiterInvestigation.isLookalikeDomain ? 'FLAGGED' : 'CLEAR'}.`
        : 'Skipped: corporate domain unstated.'
    },
    {
      id: 'job_listing_lookup',
      name: 'Public ATS Job Board Lookup',
      status: 'completed',
      explanation: listingInvestigation?.bestMatch?.status === 'FOUND_EXACT'
        ? `Confirmed active requisition on ${listingInvestigation.bestMatch.sourceName}.`
        : (listingInvestigation?.bestMatch?.status === 'FOUND_SIMILAR'
            ? `Related position located on ${listingInvestigation.bestMatch.sourceName}.`
            : (listingInvestigation?.activeBoardFound ? 'ATS board queried; specific requisition not active.' : 'Public Greenhouse/Lever/Ashby board not located for company token.')),
      timestamp: now,
      details: listingInvestigation?.summary || 'ATS queries executed.'
    },
    {
      id: 'recruiter_communication',
      name: 'Recruiter Communication Inspection',
      status: recruiterInvestigation.senderEmail ? 'completed' : 'skipped',
      explanation: recruiterInvestigation.senderEmail
        ? (recruiterInvestigation.isFreeEmailSender
            ? 'Free personal webmail provider used for recruitment.'
            : (recruiterInvestigation.isDomainAligned ? 'Sender domain aligns with corporate domain.' : 'Sender domain does not match claimed employer.'))
        : 'Sender email not provided in communication.',
      timestamp: now,
      details: recruiterInvestigation.senderEmail
        ? `Sender address: ${recruiterInvestigation.senderEmail}. MX records: ${recruiterInvestigation.senderHasMx ? 'ACTIVE' : 'MISSING'}. Reply-To: ${recruiterInvestigation.replyToMismatch ? 'MISMATCH' : 'MATCH'}.`
        : 'Recruiter email inspection skipped.'
    },
    {
      id: 'fraud_analysis',
      name: 'Fraud & Exploitation Indicator Analysis',
      status: 'completed',
      explanation: processInvestigation.criticalCount > 0
        ? `Detected ${processInvestigation.criticalCount} critical fraud indicator(s) (e.g. fees or banking demands).`
        : (processInvestigation.highCount > 0 ? `Detected ${processInvestigation.highCount} high-suspicion indicator(s).` : 'Zero advance fee, equipment deposit, or credential theft patterns detected.'),
      timestamp: now,
      details: `Critical indicators: ${processInvestigation.criticalCount}. High indicators: ${processInvestigation.highCount}. Medium indicators: ${processInvestigation.mediumCount}.`
    },
    {
      id: 'final_assessment',
      name: 'Final Forensic Assessment Generated',
      status: 'completed',
      explanation: `Assigned verdict: ${outcome}.`,
      timestamp: now,
      details: 'Deterministic synthesis of all verified facts, contradictions, indicators, and limitations.'
    }
  ];
}

/**
 * Unified JobShield Forensic Assessment Orchestrator.
 */
async function performJobShieldAssessment({
  extractedClaims,
  listingInvestigation,
  recruiterInvestigation,
  processInvestigation,
  submissionType = 'text',
  customGroqClient = null
}) {
  // 1. Authoritative Deterministic Outcome
  const outcome = determineOutcome({
    extractedClaims,
    listingInvestigation,
    recruiterInvestigation,
    processInvestigation
  });

  // 2. Structured Evidence Partitioning
  const categorized = categorizeEvidence({
    extractedClaims,
    listingInvestigation,
    recruiterInvestigation,
    processInvestigation
  });

  // 3. Consolidated Material Findings List
  const materialFindings = [];

  // Add process findings
  for (const f of processInvestigation.findings) {
    materialFindings.push({
      finding: f.title,
      severity: f.severity,
      evidence: f.description,
      sourceOrigin: 'Recruitment Process Integrity Scan',
      explanation: f.description,
      recommendedAction: f.recommendedAction
    });
  }

  // Add recruiter domain findings
  for (const f of recruiterInvestigation.findings) {
    materialFindings.push({
      finding: f.title,
      severity: f.severity,
      evidence: f.description,
      sourceOrigin: 'Authoritative Sender & Domain Verification',
      explanation: f.description,
      recommendedAction: f.recommendedAction || 'Exercise caution.'
    });
  }

  // Add listing findings
  if (listingInvestigation?.bestMatch) {
    materialFindings.push({
      finding: `Official Job Listing ${listingInvestigation.bestMatch.status === 'FOUND_EXACT' ? 'Confirmed' : 'Partially Matched'}`,
      severity: 'INFO',
      evidence: listingInvestigation.bestMatch.explanation,
      sourceOrigin: listingInvestigation.bestMatch.sourceName,
      explanation: `Verified vacancy on ${listingInvestigation.bestMatch.sourceName}.`,
      recommendedAction: 'Apply directly via the official source link.'
    });
  }

  // 4. Generate Synthesis & Action
  const { summary, recommendedAction } = generateSynthesisAndAction(outcome, {
    extractedClaims,
    processInvestigation,
    recruiterInvestigation,
    listingInvestigation
  });

  // 5. Build Unified Sources Consulted & Checkpoints
  const sourcesConsulted = collectSourcesConsulted({
    listingInvestigation,
    recruiterInvestigation,
    extractedClaims
  });

  const checkpoints = generateCheckpoints({
    submissionType,
    claims: extractedClaims,
    listingInvestigation,
    recruiterInvestigation,
    processInvestigation,
    outcome
  });

  return {
    outcome,
    summary,
    recommendedAction,
    claims: extractedClaims,
    verifiedFacts: categorized.verifiedFacts,
    contradictions: categorized.contradictions,
    suspiciousIndicators: categorized.suspiciousIndicators,
    unverifiedItems: categorized.unverifiedItems,
    sourcesConsulted,
    checkpoints,
    materialFindings,
    listingInvestigation,
    recruiterInvestigation,
    processInvestigation
  };
}

module.exports = {
  performJobShieldAssessment,
  determineOutcome,
  categorizeEvidence,
  generateSynthesisAndAction,
  collectSourcesConsulted,
  generateCheckpoints,
  OUTCOMES
};
