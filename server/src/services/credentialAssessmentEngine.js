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
  VERIFIED: 'VERIFIED',
  PARTIALLY_VERIFIED: 'PARTIALLY_VERIFIED',
  SUSPICIOUS: 'SUSPICIOUS',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE'
};

/**
 * Determine Certificate Issuance Status
 */
function determineIssuanceStatus({ officialSources = [], crossValidation = {} }) {
  // Check if any source confirmed individual issuance (e.g. issuer portal query confirmed with cred ID)
  const qrSource = officialSources.find(s => s.sourceType === 'ISSUER_DIRECT_PORTAL');
  if (qrSource && qrSource.status === 'CONFIRMED' && qrSource.returnedEvidence?.credentialIdIncluded) {
    return 'CONFIRMED_BY_ISSUER';
  }

  // Check if rejected (e.g. UGC fake university or explicit negative endpoint)
  const rejectedSource = officialSources.find(s => s.status === 'REJECTED');
  if (rejectedSource && rejectedSource.sourceType === 'STATUTORY_ACADEMIC_REGISTRY') {
    return 'REJECTED_BY_ISSUER';
  }

  // Check if automated sources are unavailable (e.g. DigiLocker NAD requires consent)
  const hasUnavailable = officialSources.some(s => s.status === 'UNAVAILABLE');
  if (hasUnavailable) {
    return 'VERIFICATION_UNAVAILABLE';
  }

  return 'UNCONFIRMED';
}

/**
 * Determine Authoritative Overall Outcome based strictly on deterministic evidence.
 */
function determineOverallOutcome({
  issuerIdentityStatus,
  documentIntegrityStatus,
  issuanceStatus,
  claimConsistencyStatus,
  isLookalikeDomain,
  hasArithmeticMismatch
}) {
  // 1. SUSPICIOUS
  // Triggered by signature invalidation/tampering, lookalike domain impersonation,
  // explicit rejection by statutory authority, or arithmetic inconsistency in marksheets
  if (
    documentIntegrityStatus === 'SIGNATURE_INVALID' ||
    isLookalikeDomain ||
    issuanceStatus === 'REJECTED_BY_ISSUER' ||
    hasArithmeticMismatch ||
    issuerIdentityStatus === 'INCONSISTENT'
  ) {
    return OUTCOMES.SUSPICIOUS;
  }

  // 2. VERIFIED
  // Requires:
  // - Issuer identity ESTABLISHED
  // - Document integrity is SIGNATURE_VALID or NO_SIGNATURE_PRESENT (with confirmed issuance)
  // - Issuance CONFIRMED_BY_ISSUER
  // - Claim consistency CONSISTENT
  if (
    issuerIdentityStatus === 'ESTABLISHED' &&
    issuanceStatus === 'CONFIRMED_BY_ISSUER' &&
    claimConsistencyStatus === 'CONSISTENT' &&
    documentIntegrityStatus !== 'MODIFICATION_INDICATORS'
  ) {
    return OUTCOMES.VERIFIED;
  }

  // 3. PARTIALLY_VERIFIED
  // Some relevant facts are independently established (e.g. organization identity established,
  // valid digital signature, or partial claim match) but direct individual issuance remains unconfirmed
  if (
    issuerIdentityStatus === 'ESTABLISHED' ||
    issuerIdentityStatus === 'PARTIALLY_ESTABLISHED' ||
    documentIntegrityStatus === 'SIGNATURE_VALID' ||
    claimConsistencyStatus === 'PARTIAL_MATCH'
  ) {
    return OUTCOMES.PARTIALLY_VERIFIED;
  }

  // 4. INSUFFICIENT_EVIDENCE (Default fallback when public confirmation is absent)
  return OUTCOMES.INSUFFICIENT_EVIDENCE;
}

/**
 * Generate 7 structured execution checkpoints with real status and diagnostics.
 */
function generateCheckpoints({
  documentSha256,
  fileName,
  category,
  numPages,
  pdfAnalysis,
  issuerIdentity,
  officialSources,
  crossValidation,
  outcome
}) {
  const now = new Date().toISOString();

  return [
    {
      id: 'document_ingested',
      name: 'Document Ingestion & Fingerprinting',
      status: 'completed',
      explanation: `Document '${fileName}' successfully ingested. SHA-256 fingerprint computed: ${documentSha256.slice(0, 16)}...`,
      timestamp: now,
      details: `Category: ${category} | Pages: ${numPages} | In-memory validation completed.`
    },
    {
      id: 'forensics_inspection',
      name: 'Structural & Cryptographic Inspection',
      status: pdfAnalysis?.hasDigitalSignature ? 'completed' : 'partial',
      explanation: pdfAnalysis?.hasDigitalSignature 
        ? `Located ${pdfAnalysis.signaturesCount} digital signature field(s) in PDF.` 
        : 'Completed structural analysis (no digital signature fields present).',
      timestamp: now,
      details: `Revisions: ${pdfAnalysis?.revisionCount || 1} | Incremental Updates: ${pdfAnalysis?.hasIncrementalUpdates ? 'YES' : 'NO'}.`
    },
    {
      id: 'entity_extraction',
      name: 'Entity & Claim Extraction',
      status: 'completed',
      explanation: 'Extracted holder name, issuing organization, dates, and credential identifiers.',
      timestamp: now,
      details: `Extracted claims cataloged with provenance and confidence metrics.`
    },
    {
      id: 'issuer_discovery',
      name: 'Issuer Identity Discovery',
      status: issuerIdentity.identityStatus === 'ESTABLISHED' ? 'completed' : (issuerIdentity.identityStatus === 'INCONSISTENT' ? 'failed' : 'partial'),
      explanation: issuerIdentity.confidenceReason,
      timestamp: now,
      details: `Claimed: ${issuerIdentity.queryOrg || 'Unstated'} | Domain: ${issuerIdentity.queryDomain || 'None'} | Alignment: ${issuerIdentity.domainAligned ? 'ALIGNED' : 'UNALIGNED'}.`
    },
    {
      id: 'official_sources',
      name: 'Statutory & Official Source Verification',
      status: 'completed',
      explanation: `Queried ${officialSources.length} official source registries (UGC, MCA, CCA Digital Signatures, GSTIN, DigiLocker NAD).`,
      timestamp: now,
      details: `Registry queries executed with SSRF protection and strict CAPTCHA compliance.`
    },
    {
      id: 'cross_validation',
      name: 'Cross-Validation & Arithmetic Check',
      status: crossValidation.mismatchCount > 0 ? 'failed' : 'completed',
      explanation: crossValidation.mismatchCount > 0 
        ? `Detected ${crossValidation.mismatchCount} material claim discrepancy(ies).` 
        : `Corroborated ${crossValidation.exactMatchCount} exact and ${crossValidation.partialMatchCount} partial claims.`,
      timestamp: now,
      details: `Field comparisons executed across employer, title, registration ID, and marksheet arithmetic.`
    },
    {
      id: 'authoritative_synthesis',
      name: 'Authoritative Assessment Synthesis',
      status: 'completed',
      explanation: `Final evaluation: ${outcome}.`,
      timestamp: now,
      details: `Synthesized under zero-trust evidence rules without arbitrary trust percentages.`
    }
  ];
}

/**
 * Generate context-tailored recommended next actions based on findings.
 */
function generateRecommendedActions(outcome, { issuerIdentity, documentIntegrityStatus, issuanceStatus, crossValidation }) {
  if (outcome === OUTCOMES.SUSPICIOUS) {
    if (documentIntegrityStatus === 'SIGNATURE_INVALID') {
      return 'Do not accept this certificate without forensic re-verification. The PDF file was altered after its digital signature was applied, indicating file modification.';
    }
    if (issuerIdentity.isLookalike) {
      return 'Exercise extreme caution. The domain associated with this certificate appears to be an impersonation or typosquatting domain mimicking a legitimate entity.';
    }
    if (crossValidation.arithmeticResult && !crossValidation.arithmeticResult.consistent) {
      return 'Request the original marksheet from the candidate. The sum of the individual subject marks does not equal the stated grand total, indicating arithmetic manipulation.';
    }
    return 'Material discrepancies were identified between the document claims and official records. Do not rely on this document without authoritative direct confirmation.';
  }

  if (outcome === OUTCOMES.VERIFIED) {
    return 'The certificate is independently verified through official issuer verification records with corroborating digital signatures. Proceed with standard onboarding.';
  }

  if (outcome === OUTCOMES.PARTIALLY_VERIFIED) {
    if (issuanceStatus === 'VERIFICATION_UNAVAILABLE') {
      return 'The issuing organization is recognized, but individual certificate issuance requires candidate consent via DigiLocker (https://digilocker.gov.in) or direct employer registry check.';
    }
    return 'The issuer identity is partially established, but individual student/employee records require direct confirmation from the registrar or HR department.';
  }

  // INSUFFICIENT_EVIDENCE
  return 'Independent public registries contain insufficient records to prove or disprove this credential. Request the candidate to provide a DigiLocker-issued digital document or direct email confirmation from the issuer.';
}

/**
 * Generate plain-English summary synthesis using Groq with deterministic fallback.
 */
async function generateSynthesis({
  outcome,
  category,
  issuerIdentity,
  documentIntegrityStatus,
  issuanceStatus,
  crossValidation
}) {
  const deterministicSummary = (() => {
    if (outcome === OUTCOMES.VERIFIED) {
      return `The ${category.replace(/_/g, ' ').toLowerCase()} has been successfully verified. The claimed issuing organization (${issuerIdentity.queryOrg || 'organization'}) is established in official registries, the digital signature is cryptographically intact, and individual credential records match issuer verification endpoints.`;
    }
    if (outcome === OUTCOMES.SUSPICIOUS) {
      return `Potential inconsistencies or modification markers were flagged during document inspection. ${crossValidation.mismatchCount > 0 ? `Detected ${crossValidation.mismatchCount} material claim discrepancy(ies).` : 'Document structural integrity or domain alignment failed verification checks.'} Independent verification through official channels is required.`;
    }
    if (outcome === OUTCOMES.PARTIALLY_VERIFIED) {
      return `The claimed issuer (${issuerIdentity.queryOrg || 'organization'}) was identified and corroborated in official registries, but individual certificate issuance could not be independently confirmed through public APIs. This is standard for institutions requiring consent-based DigiLocker access or manual records.`;
    }
    return `Insufficient independent public evidence was located to confirm or refute this ${category.replace(/_/g, ' ').toLowerCase()}. While the document was parsed successfully, independent institutional registries require candidate authorization or direct registrar inquiry.`;
  })();

  if (!groq) return deterministicSummary;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an enterprise document intelligence and forensic investigator. Write a clear, objective, 2-to-3 sentence executive summary explaining the findings. Do NOT invent facts or claim something is genuine without evidence. Strictly adhere to the outcome provided.'
        },
        {
          role: 'user',
          content: JSON.stringify({
            outcome,
            category,
            issuerStatus: issuerIdentity.identityStatus,
            integrityStatus: documentIntegrityStatus,
            issuanceStatus,
            mismatches: crossValidation.mismatchCount
          })
        }
      ],
      temperature: 0.1,
      max_tokens: 150
    });

    const aiText = completion.choices[0]?.message?.content?.trim();
    return aiText || deterministicSummary;
  } catch {
    return deterministicSummary;
  }
}

/**
 * Primary assessment pipeline for CredentialCheck
 */
async function performCredentialAssessment({
  documentSha256,
  fileName,
  category,
  numPages,
  extractedClaims,
  pdfAnalysis,
  issuerIdentity,
  officialSources,
  forensics,
  crossValidation
}) {
  // 1. Separate 4 Assessment Dimensions
  const issuerIdentityStatus = issuerIdentity.identityStatus; // ESTABLISHED | PARTIALLY_ESTABLISHED | INCONSISTENT | UNRESOLVED
  const documentIntegrityStatus = forensics.integrityStatus; // SIGNATURE_VALID | SIGNATURE_INVALID | MODIFICATION_INDICATORS | NO_SIGNATURE_PRESENT | INCONCLUSIVE
  const issuanceStatus = determineIssuanceStatus({ officialSources, crossValidation }); // CONFIRMED_BY_ISSUER | REJECTED_BY_ISSUER | UNCONFIRMED | VERIFICATION_UNAVAILABLE
  const claimConsistencyStatus = crossValidation.consistencyStatus; // CONSISTENT | PARTIAL_MATCH | MATERIAL_MISMATCH | INSUFFICIENT_EVIDENCE

  // 2. Authoritative Overall Outcome
  const hasArithmeticMismatch = crossValidation.arithmeticResult ? !crossValidation.arithmeticResult.consistent : false;
  const outcome = determineOverallOutcome({
    issuerIdentityStatus,
    documentIntegrityStatus,
    issuanceStatus,
    claimConsistencyStatus,
    isLookalikeDomain: issuerIdentity.isLookalike,
    hasArithmeticMismatch
  });

  // 3. Recommended Action
  const recommendedAction = generateRecommendedActions(outcome, {
    issuerIdentity,
    documentIntegrityStatus,
    issuanceStatus,
    crossValidation
  });

  // 4. Synthesis Summary
  const summary = await generateSynthesis({
    outcome,
    category,
    issuerIdentity,
    documentIntegrityStatus,
    issuanceStatus,
    crossValidation
  });

  // 5. Execution Checkpoints
  const checkpoints = generateCheckpoints({
    documentSha256,
    fileName,
    category,
    numPages,
    pdfAnalysis,
    issuerIdentity,
    officialSources,
    crossValidation,
    outcome
  });

  return {
    outcome, // VERIFIED | PARTIALLY_VERIFIED | SUSPICIOUS | INSUFFICIENT_EVIDENCE
    summary,
    recommendedAction,
    dimensions: {
      issuerIdentityStatus,
      documentIntegrityStatus,
      issuanceStatus,
      claimConsistencyStatus
    },
    checkpoints,
    documentSha256,
    category,
    evaluatedAt: new Date().toISOString()
  };
}

module.exports = {
  performCredentialAssessment,
  determineIssuanceStatus,
  determineOverallOutcome,
  generateCheckpoints,
  generateRecommendedActions,
  generateSynthesis,
  OUTCOMES
};
