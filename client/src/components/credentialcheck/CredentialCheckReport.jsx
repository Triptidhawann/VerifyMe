import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertOctagon, 
  ArrowLeft,
  FileText,
  Building,
  Mail,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
  Hash,
  Calculator,
  User,
  PenTool,
  Globe,
  FileCheck2,
  Lock,
  Building2,
  CheckCircle2,
  Info
} from 'lucide-react';
import './CredentialCheck.css';

/**
 * VerifyMe CredentialCheck — Document Investigation Report
 * Enterprise-grade, evidence-driven credential intelligence interface.
 */
const CredentialCheckReport = ({ investigation, onNewInvestigation }) => {
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedCase, setCopiedCase] = useState(false);
  const [showTechnicalAudit, setShowTechnicalAudit] = useState(false);
  const [expandedSource, setExpandedSource] = useState(null);

  const safeInvestigation = investigation || {};

  const {
    id = 'CRED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    category = 'COURSE_COMPLETION',
    fileName = 'certificate.pdf',
    documentSha256 = '',
    numPages = 1,
    outcome = 'INSUFFICIENT_EVIDENCE',
    summary = 'Investigation completed.',
    recommendedAction = 'Verify directly through official issuer channels.',
    dimensions = {},
    extractedFields = {},
    issuerIdentity = {},
    forensicResults = {},
    crossValidationResults = {},
    sourcesConsulted = [],
    checkpoints = [],
    technicalAudit = null,
    createdAtIso = new Date().toISOString()
  } = safeInvestigation;

  const {
    issuerIdentityStatus = 'UNRESOLVED',
    documentIntegrityStatus = 'INCONCLUSIVE',
    issuanceStatus = 'UNCONFIRMED',
    claimConsistencyStatus = 'INSUFFICIENT_EVIDENCE'
  } = dimensions;

  const isVerified = outcome === 'VERIFIED';
  const isPartiallyVerified = outcome === 'PARTIALLY_VERIFIED';
  const isSuspicious = outcome === 'SUSPICIOUS';
  const isInsufficient = outcome === 'INSUFFICIENT_EVIDENCE';

  // Format date helper
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

  // 1. Dynamic Main Verdict Headline and 2-3 Core Reasons
  const verdictInfo = useMemo(() => {
    const reasons = [];
    let headline = '';

    const orgName = extractedFields.issuingOrganization?.value || issuerIdentity.queryOrg || 'the claimed issuer';
    const officialDomain = issuerIdentity.officialDomainCandidate || issuerIdentity.matchedEntity?.domain || null;
    const documentEmail = extractedFields.contactEmail?.value || null;
    const documentDomain = issuerIdentity.queryDomain || (documentEmail && documentEmail.includes('@') ? documentEmail.split('@')[1] : null);

    if (isSuspicious) {
      if (issuerIdentity.isLookalike) {
        headline = 'Potential issuer impersonation detected.';
        if (officialDomain && documentDomain) {
          reasons.push(
            `The certificate claims to be from ${orgName}, but the contact email or verification URL uses '${documentDomain}' instead of the identified official domain candidate '${officialDomain}'.`
          );
        } else {
          reasons.push(
            `The email domain or web address on the document appears to imitate the official domain of ${orgName}.`
          );
        }
        reasons.push(
          'Credential issuance has not been independently confirmed by an official registry or company records.'
        );
        if (!forensicResults.hasDigitalSignature) {
          reasons.push(
            'The document lacks an authorized cryptographic digital signature from a licensed Certifying Authority (CCA).'
          );
        }
      } else if (crossValidationResults.arithmeticResult && !crossValidationResults.arithmeticResult.consistent) {
        headline = 'Discrepancy detected in marks calculation.';
        const stated = crossValidationResults.arithmeticResult.discrepancy?.statedTotal ?? extractedFields.academicMarksheet?.statedTotalObtained ?? 'stated';
        const computed = crossValidationResults.arithmeticResult.discrepancy?.computedTotal ?? crossValidationResults.arithmeticResult.computedTotalObtained ?? 'computed';
        reasons.push(
          `The stated grand total on the document (${stated}) does not match the sum of individual subject marks (${computed}).`
        );
        reasons.push(
          'Numerical contradictions in score computation strongly indicate document alteration or manual template fabrication.'
        );
        reasons.push(
          'Individual academic records are unconfirmed through DigiLocker National Academic Depository (NAD).'
        );
      } else if (documentIntegrityStatus === 'SIGNATURE_INVALID') {
        headline = 'Cryptographic signature invalid or document modified.';
        reasons.push(
          'The digital signature embedded in the PDF failed integrity validation, indicating post-signing alteration.'
        );
        reasons.push(
          'The document cannot be treated as an authentic original in its present state.'
        );
        reasons.push(
          'Direct verification with the issuer registrar is required.'
        );
      } else if (forensicResults.anomalies && forensicResults.anomalies.length > 0) {
        headline = 'Document integrity anomalies detected.';
        reasons.push(
          forensicResults.anomalies[0].detail || 'Document metadata indicates potential post-creation alteration.'
        );
        reasons.push(
          'Direct credential issuance records could not be corroborated through official public channels.'
        );
      } else {
        headline = 'Inconsistencies detected during credential evaluation.';
        reasons.push(
          'Extracted claims contradict authoritative public records or fail domain alignment.'
        );
        reasons.push(
          'Individual certificate issuance remains unconfirmed.'
        );
      }
    } else if (isVerified) {
      headline = 'Credential authenticity independently corroborated.';
      reasons.push(
        `The issuing organization (${orgName}) is established in official statutory directories.`
      );
      if (issuanceStatus === 'CONFIRMED_BY_ISSUER') {
        reasons.push(
          'The certificate ID and credential claims were confirmed directly by the issuer verification endpoint.'
        );
      } else if (forensicResults.hasDigitalSignature) {
        reasons.push(
          'Cryptographic PKCS#7 digital signature is valid and chained to a recognized Certifying Authority.'
        );
      }
      reasons.push(
        'All extracted credential fields align with verified records without discrepancy.'
      );
    } else if (isPartiallyVerified) {
      headline = 'Issuing organization established; direct credential unconfirmed.';
      reasons.push(
        `The claimed issuer (${orgName}) was verified in recognized educational or corporate registries.`
      );
      reasons.push(
        'The document passed structural forensics with no tampering indicators detected.'
      );
      reasons.push(
        'Individual certificate issuance requires candidate authorization via DigiLocker NAD or direct employer inquiry.'
      );
    } else {
      // INSUFFICIENT_EVIDENCE
      headline = 'Public evidence insufficient to verify credential.';
      reasons.push(
        `The claimed issuing organization (${orgName}) is not cataloged in open statutory registries.`
      );
      reasons.push(
        'The document does not contain a verifiable cryptographic signature or authoritative public verification portal.'
      );
      reasons.push(
        'Direct inquiry with the issuing authority is necessary to confirm validity.'
      );
    }

    return { headline, reasons };
  }, [
    isSuspicious,
    isVerified,
    isPartiallyVerified,
    extractedFields,
    issuerIdentity,
    forensicResults,
    crossValidationResults,
    documentIntegrityStatus,
    issuanceStatus
  ]);

  // 2. Build the 9 Specific Credential Fields with Strict Verification States
  const credentialFields = useMemo(() => {
    const comparisons = crossValidationResults.fieldComparisons || [];
    const getComparison = (label) => comparisons.find(c => c.fieldLabel?.toLowerCase().includes(label.toLowerCase()));

    const officialDomain = issuerIdentity.officialDomainCandidate || issuerIdentity.matchedEntity?.domain || null;
    const isLookalike = Boolean(issuerIdentity.isLookalike);

    // 1. Candidate Name
    const holderVal = extractedFields.holderName?.value || null;
    const holderComp = getComparison('name') || getComparison('candidate');
    let holderState = 'NOT_AVAILABLE';
    let holderConfidence = extractedFields.holderName?.confidence ? `${Math.round(extractedFields.holderName.confidence * 100)}% confidence` : 'Text extraction';
    if (holderVal) {
      if (holderComp?.outcome === 'EXACT_MATCH') holderState = 'MATCHED';
      else if (holderComp?.outcome === 'MISMATCH') holderState = 'MISMATCHED';
      else holderState = 'UNVERIFIED';
    } else {
      holderConfidence = 'Not detected';
    }

    // 2. Claimed Issuer
    const issuerVal = extractedFields.issuingOrganization?.value || null;
    let issuerState = 'NOT_AVAILABLE';
    let issuerConfidence = extractedFields.issuingOrganization?.confidence ? `${Math.round(extractedFields.issuingOrganization.confidence * 100)}% confidence` : 'Directory match';
    if (issuerVal) {
      if (isLookalike || issuerIdentity.identityStatus === 'INCONSISTENT') {
        issuerState = 'MISMATCHED';
      } else if (issuerIdentity.identityStatus === 'ESTABLISHED' || issuerIdentity.matchedEntity) {
        issuerState = 'MATCHED';
      } else {
        issuerState = 'UNVERIFIED';
      }
    } else {
      issuerConfidence = 'Not detected';
    }

    // 3. Credential Title
    const titleVal = extractedFields.credentialTitle?.value || null;
    let titleState = 'NOT_AVAILABLE';
    let titleConfidence = 'Pattern extraction';
    if (titleVal) {
      titleState = isVerified ? 'MATCHED' : 'UNVERIFIED';
    } else {
      titleConfidence = 'Not detected';
    }

    // 4. Certificate ID
    const credIdVal = extractedFields.credentialId?.value || null;
    let credIdState = 'NOT_AVAILABLE';
    let credIdConfidence = extractedFields.credentialId?.confidence ? `${Math.round(extractedFields.credentialId.confidence * 100)}% confidence` : 'Regex pattern';
    if (credIdVal) {
      if (issuanceStatus === 'CONFIRMED_BY_ISSUER') credIdState = 'MATCHED';
      else if (issuanceStatus === 'REJECTED_BY_ISSUER') credIdState = 'MISMATCHED';
      else credIdState = 'UNVERIFIED';
    } else {
      credIdConfidence = 'Not detected';
    }

    // 5. Issue Date
    const issueDateVal = extractedFields.issueDate?.value || null;
    let issueDateState = 'NOT_AVAILABLE';
    let issueDateConfidence = 'Date parser';
    if (issueDateVal) {
      const dateComp = getComparison('date');
      if (dateComp?.outcome === 'EXACT_MATCH') issueDateState = 'MATCHED';
      else issueDateState = 'UNVERIFIED';
    } else {
      issueDateConfidence = 'Not detected';
    }

    // 6. Duration
    const durationVal = extractedFields.duration?.value || null;
    let durationState = 'NOT_AVAILABLE';
    let durationConfidence = 'Duration parser';
    if (durationVal) {
      durationState = 'UNVERIFIED';
    } else {
      durationConfidence = 'Not detected';
    }

    // 7. Signatory
    const signatoryVal = extractedFields.signatory?.value || null;
    let signatoryState = 'NOT_AVAILABLE';
    let signatoryConfidence = 'Signatory pattern';
    if (signatoryVal) {
      if (forensicResults.hasDigitalSignature) signatoryState = 'MATCHED';
      else signatoryState = 'UNVERIFIED';
    } else {
      signatoryConfidence = 'Not detected';
    }

    // 8. Contact Email
    const emailVal = extractedFields.contactEmail?.value || null;
    let emailState = 'NOT_AVAILABLE';
    let emailConfidence = 'Email parser';
    if (emailVal) {
      const emailDomain = emailVal.includes('@') ? emailVal.split('@')[1].toLowerCase().trim() : '';
      if (isLookalike || (officialDomain && emailDomain && emailDomain !== officialDomain && !emailDomain.endsWith('.' + officialDomain))) {
        emailState = 'MISMATCHED';
      } else if (officialDomain && emailDomain && (emailDomain === officialDomain || emailDomain.endsWith('.' + officialDomain))) {
        emailState = 'MATCHED';
      } else {
        emailState = 'UNVERIFIED';
      }
    } else {
      emailConfidence = 'Not detected';
    }

    // 9. Verification URL
    const urlVal = extractedFields.verificationUrl?.value || null;
    let urlState = 'NOT_AVAILABLE';
    let urlConfidence = 'URL / QR scan';
    if (urlVal) {
      const parsedDomain = urlVal.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase().trim();
      if (isLookalike || (officialDomain && parsedDomain && parsedDomain !== officialDomain && !parsedDomain.endsWith('.' + officialDomain))) {
        urlState = 'MISMATCHED';
      } else if (officialDomain && parsedDomain && (parsedDomain === officialDomain || parsedDomain.endsWith('.' + officialDomain))) {
        urlState = 'MATCHED';
      } else {
        urlState = 'UNVERIFIED';
      }
    } else {
      urlConfidence = 'Not detected';
    }

    return [
      {
        id: 'candidate_name',
        label: 'Candidate Name',
        icon: User,
        value: holderVal,
        confidence: holderConfidence,
        state: holderState,
        note: holderState === 'MATCHED' ? 'Corroborated by independent record' : (holderVal ? 'Extracted from document layer; uncorroborated' : 'Not stated on certificate')
      },
      {
        id: 'claimed_issuer',
        label: 'Claimed Issuer',
        icon: Building,
        value: issuerVal,
        confidence: issuerConfidence,
        state: issuerState,
        note: issuerState === 'MATCHED' ? `Matched official entity: ${issuerIdentity.matchedEntity?.legalName || issuerVal}` : (issuerState === 'MISMATCHED' ? 'Contradicts official registry records' : (issuerVal ? 'Unregistered or private entity' : 'Not stated on certificate'))
      },
      {
        id: 'credential_title',
        label: 'Credential Title',
        icon: Award,
        value: titleVal,
        confidence: titleConfidence,
        state: titleState,
        note: titleVal ? 'Extracted from document title' : 'Not explicitly titled'
      },
      {
        id: 'certificate_id',
        label: 'Certificate ID',
        icon: Hash,
        value: credIdVal,
        confidence: credIdConfidence,
        state: credIdState,
        note: credIdState === 'MATCHED' ? 'Confirmed by issuer verification endpoint' : (credIdVal ? 'Found on document; unconfirmed in public registry' : 'No credential identifier located')
      },
      {
        id: 'issue_date',
        label: 'Issue Date',
        icon: Calendar,
        value: issueDateVal,
        confidence: issueDateConfidence,
        state: issueDateState,
        note: issueDateVal ? 'Extracted date claim' : 'No date statement found'
      },
      {
        id: 'duration',
        label: 'Duration / Period',
        icon: Clock,
        value: durationVal,
        confidence: durationConfidence,
        state: durationState,
        note: durationVal ? 'Extracted completion timeframe' : 'Duration unstated'
      },
      {
        id: 'signatory',
        label: 'Signatory',
        icon: PenTool,
        value: signatoryVal,
        confidence: signatoryConfidence,
        state: signatoryState,
        note: signatoryState === 'MATCHED' ? 'Matches cryptographic certificate signer' : (signatoryVal ? 'Printed signatory; no signature verification' : 'No signatory name identified')
      },
      {
        id: 'contact_email',
        label: 'Contact Email',
        icon: Mail,
        value: emailVal,
        confidence: emailConfidence,
        state: emailState,
        note: emailState === 'MISMATCHED' ? `Differs from candidate domain '${officialDomain}'` : (emailState === 'MATCHED' ? 'Matches official domain' : (emailVal ? 'Unverified email domain' : 'No contact email printed'))
      },
      {
        id: 'verification_url',
        label: 'Verification URL',
        icon: Globe,
        value: urlVal,
        confidence: urlConfidence,
        state: urlState,
        note: urlState === 'MISMATCHED' ? `Does not belong to '${officialDomain}'` : (urlState === 'MATCHED' ? 'Official domain endpoint' : (urlVal ? 'Unconfirmed third-party portal' : 'No verification link or QR endpoint'))
      }
    ];
  }, [
    extractedFields,
    issuerIdentity,
    crossValidationResults,
    forensicResults,
    issuanceStatus,
    isVerified
  ]);

  // 3. Compile Red Flags and Warnings (Readable Investigation Cards)
  const redFlags = useMemo(() => {
    const cards = [];

    const officialDomain = issuerIdentity.officialDomainCandidate || issuerIdentity.matchedEntity?.domain || null;
    const documentEmail = extractedFields.contactEmail?.value || null;
    const documentUrl = extractedFields.verificationUrl?.value || null;
    const queryDomain = issuerIdentity.queryDomain || (documentEmail && documentEmail.includes('@') ? documentEmail.split('@')[1] : null);

    // Flag A: Domain Mismatch / Lookalike
    if (issuerIdentity.isLookalike) {
      cards.push({
        id: 'rf-domain-mismatch',
        severity: 'CRITICAL',
        heading: 'ISSUER DOMAIN MISMATCH',
        observed: `Document domain/email: ${documentEmail || queryDomain || 'Printed on document'} | Official domain candidate: ${officialDomain || 'Unidentified'}`,
        whyItMatters: 'The email domain or verification address printed on the certificate differs from the official domain associated with the claimed issuer.',
        action: 'Contact the organization using contact information obtained independently from its official website. Never rely on links or contact info printed on suspicious documents.'
      });
    } else if (issuerIdentity.identityStatus === 'INCONSISTENT') {
      cards.push({
        id: 'rf-issuer-inconsistent',
        severity: 'WARNING',
        heading: 'ISSUER IDENTITY INCONSISTENCY',
        observed: `Claimed issuer '${issuerIdentity.queryOrg}' contradicts official directory records.`,
        whyItMatters: 'The certificate claims affiliation with an organization that does not match recognized statutory listings.',
        action: 'Verify the existence and legal status of the entity via Ministry of Corporate Affairs or state university portals.'
      });
    }

    // Flag B: Marksheet Arithmetic Discrepancy
    if (crossValidationResults.arithmeticResult && !crossValidationResults.arithmeticResult.consistent) {
      const disc = crossValidationResults.arithmeticResult.discrepancy || {};
      const stated = disc.statedTotal ?? extractedFields.academicMarksheet?.statedTotalObtained ?? 'N/A';
      const computed = disc.computedTotal ?? crossValidationResults.arithmeticResult.computedTotalObtained ?? 'N/A';

      cards.push({
        id: 'rf-arithmetic-discrepancy',
        severity: 'CRITICAL',
        heading: 'MARKSHEET ARITHMETIC DISCREPANCY',
        observed: `Document states grand total marks: ${stated} | Calculated sum of subject marks: ${computed}`,
        whyItMatters: 'An internal numerical contradiction in marks computation indicates manual alteration, score tampering, or template fabrication.',
        action: 'Request an official marksheet directly through the university examination portal or verify via DigiLocker NAD.'
      });
    }

    // Flag C: Invalid Digital Signature
    if (documentIntegrityStatus === 'SIGNATURE_INVALID') {
      cards.push({
        id: 'rf-invalid-signature',
        severity: 'CRITICAL',
        heading: 'INVALID DIGITAL SIGNATURE',
        observed: 'Cryptographic digital signature attached to the PDF failed validation.',
        whyItMatters: 'An invalid digital signature indicates the document bytes were altered after the cryptographic seal was applied.',
        action: 'Do not accept this PDF file. Request an unedited, freshly signed copy directly from the issuing authority.'
      });
    }

    // Flag D: Forensic Tampering Anomalies
    if (forensicResults.anomalies && forensicResults.anomalies.length > 0) {
      forensicResults.anomalies.forEach((a, idx) => {
        cards.push({
          id: `rf-anomaly-${idx}`,
          severity: a.severity === 'HIGH' ? 'CRITICAL' : 'WARNING',
          heading: `DOCUMENT ANOMALY: ${a.title || 'Integrity Issue'}`,
          observed: a.detail,
          whyItMatters: 'Document metadata or structure shows signs of manual editing, layer alteration, or non-standard rendering.',
          action: 'Ask the candidate for an original digitally signed PDF or request institutional confirmation.'
        });
      });
    }

    // Flag E: Direct Issuance Unconfirmed (Informative card when no critical flags)
    if (issuanceStatus === 'UNCONFIRMED' && !isSuspicious) {
      cards.push({
        id: 'rf-unconfirmed-issuance',
        severity: 'ATTENTION',
        heading: 'DIRECT CREDENTIAL ISSUANCE UNCONFIRMED',
        observed: `Public verification registries could not independently confirm certificate ID '${extractedFields.credentialId?.value || 'N/A'}'.`,
        whyItMatters: 'A real organization existing does not prove that it issued this particular certificate. Public registries confirm organization identity, not private employee or student rosters.',
        action: 'Verify directly with the issuer\'s registrar or HR department, or request verification via DigiLocker.'
      });
    }

    return cards;
  }, [
    issuerIdentity,
    crossValidationResults,
    documentIntegrityStatus,
    forensicResults,
    issuanceStatus,
    isSuspicious,
    extractedFields
  ]);

  // 4. Verification Coverage: 4 Meaningful Dimensions (Replacing 6 KPI boxes & 7-stage pipeline)
  const coverageDimensions = useMemo(() => {
    // 1. Issuer Identity
    let idBadge = 'UNRESOLVED';
    let idColor = 'slate';
    let idDesc = 'Claimed entity is not found in open statutory directories.';
    if (issuerIdentityStatus === 'ESTABLISHED') {
      idBadge = 'ESTABLISHED';
      idColor = 'emerald';
      idDesc = `Corroborated in official registry: ${issuerIdentity.matchedEntity?.legalName || issuerIdentity.queryOrg}.`;
    } else if (issuerIdentityStatus === 'PARTIALLY_ESTABLISHED') {
      idBadge = 'PARTIALLY ESTABLISHED';
      idColor = 'slate';
      idDesc = 'Issuer matched partially in directory; statutory category pending confirmation.';
    } else if (issuerIdentityStatus === 'INCONSISTENT') {
      idBadge = 'INCONSISTENT';
      idColor = 'rose';
      idDesc = issuerIdentity.isLookalike ? 'Lookalike domain imitating legitimate organization.' : 'Claimed details contradict statutory records.';
    }

    // 2. Document Integrity
    let intBadge = 'NO DIGITAL SIGNATURE';
    let intColor = 'slate';
    let intDesc = 'No cryptographic signature field found (standard for scans/images).';
    if (documentIntegrityStatus === 'SIGNATURE_VALID') {
      intBadge = 'CRYPTOGRAPHICALLY SIGNED';
      intColor = 'emerald';
      intDesc = 'PKCS#7 signature valid and cryptographically intact.';
    } else if (documentIntegrityStatus === 'SIGNATURE_INVALID') {
      intBadge = 'SIGNATURE INVALID';
      intColor = 'rose';
      intDesc = 'Digital signature failed validation; document bytes were modified.';
    } else if (documentIntegrityStatus === 'MODIFICATION_INDICATORS') {
      intBadge = 'MODIFICATION DETECTED';
      intColor = 'amber';
      intDesc = 'Metadata or structure indicates post-creation editing.';
    }

    // 3. Credential Issuance
    let issBadge = 'UNCONFIRMED';
    let issColor = 'amber';
    let issDesc = 'Individual issuance records are not accessible in open public registries.';
    if (issuanceStatus === 'CONFIRMED_BY_ISSUER') {
      issBadge = 'CONFIRMED BY ISSUER';
      issColor = 'emerald';
      issDesc = 'Corroborated directly by authoritative issuer verification endpoint.';
    } else if (issuanceStatus === 'VERIFICATION_UNAVAILABLE') {
      issBadge = 'CONSENT REQUIRED';
      issColor = 'amber';
      issDesc = 'Verification requires candidate authorization via DigiLocker NAD.';
    } else if (issuanceStatus === 'REJECTED_BY_ISSUER') {
      issBadge = 'REJECTED BY ISSUER';
      issColor = 'rose';
      issDesc = 'Issuer portal or statutory authority explicitly rejected the credential.';
    }

    // 4. Claim Consistency
    let ccBadge = 'INSUFFICIENT DATA';
    let ccColor = 'slate';
    let ccDesc = 'Claims could not be cross-validated against independent registries.';
    if (crossValidationResults.arithmeticResult && !crossValidationResults.arithmeticResult.consistent) {
      ccBadge = 'ARITHMETIC DISCREPANCY';
      ccColor = 'rose';
      ccDesc = 'Total marks contradicted by computed sum of individual subjects.';
    } else if (claimConsistencyStatus === 'CONSISTENT') {
      ccBadge = 'ALL CLAIMS CONSISTENT';
      ccColor = 'emerald';
      ccDesc = `${crossValidationResults.exactMatchCount || 1} extracted claim(s) matched independent records.`;
    } else if (claimConsistencyStatus === 'MATERIAL_MISMATCH') {
      ccBadge = 'MATERIAL MISMATCH';
      ccColor = 'rose';
      ccDesc = `${crossValidationResults.mismatchCount || 1} claim(s) contradict independent evidence.`;
    } else if (claimConsistencyStatus === 'PARTIAL_MATCH') {
      ccBadge = 'PARTIAL MATCH';
      ccColor = 'emerald';
      ccDesc = 'Key claims match; secondary claims unconfirmed.';
    }

    return [
      {
        id: 'dim_issuer',
        title: 'Issuer Identity',
        icon: Building2,
        badge: idBadge,
        color: idColor,
        description: idDesc
      },
      {
        id: 'dim_integrity',
        title: 'Document Integrity',
        icon: FileCheck2,
        badge: intBadge,
        color: intColor,
        description: intDesc
      },
      {
        id: 'dim_issuance',
        title: 'Credential Issuance',
        icon: Award,
        badge: issBadge,
        color: issColor,
        description: issDesc
      },
      {
        id: 'dim_claims',
        title: 'Claim Consistency',
        icon: CheckCircle2,
        badge: ccBadge,
        color: ccColor,
        description: ccDesc
      }
    ];
  }, [
    issuerIdentityStatus,
    documentIntegrityStatus,
    issuanceStatus,
    claimConsistencyStatus,
    issuerIdentity,
    crossValidationResults
  ]);

  // Export Case File Handler
  const handleExportCase = () => {
    const lines = [
      `================================================================================`,
      `VERIFYME CREDENTIALCHECK — DOCUMENT INVESTIGATION REPORT`,
      `================================================================================`,
      `Case ID:                ${id}`,
      `Investigation Time:     ${formatDate(createdAtIso)}`,
      `Document Category:      ${category.replace(/_/g, ' ')}`,
      `File Name:              ${fileName}`,
      `SHA-256 Fingerprint:    ${documentSha256}`,
      `Overall Outcome:        ${outcome}`,
      ``,
      `--- MAIN VERDICT ---`,
      `Verdict: ${outcome}`,
      `Headline: ${verdictInfo.headline}`,
      `Primary Reasons:`,
      ...verdictInfo.reasons.map((r, i) => `  ${i + 1}. ${r}`),
      ``,
      `--- VERIFICATION COVERAGE (4 DIMENSIONS) ---`,
      `1. Issuer Identity:     ${dimensions.issuerIdentityStatus || 'UNRESOLVED'}`,
      `2. Document Integrity:  ${dimensions.documentIntegrityStatus || 'INCONCLUSIVE'}`,
      `3. Credential Issuance: ${dimensions.issuanceStatus || 'UNCONFIRMED'}`,
      `4. Claim Consistency:   ${dimensions.claimConsistencyStatus || 'INSUFFICIENT_EVIDENCE'}`,
      ``,
      `--- CREDENTIAL INFORMATION (9 FIELDS) ---`,
      ...credentialFields.map(f => `• ${f.label.padEnd(20)}: ${f.value || 'Not detected'} [${f.state}]`),
      ``,
      `--- RED FLAGS & INVESTIGATION FINDINGS (${redFlags.length}) ---`,
      ...(redFlags.length > 0 
        ? redFlags.map(rf => `[${rf.severity}] ${rf.heading}\n  Observed: ${rf.observed}\n  Why it matters: ${rf.whyItMatters}\n  Action: ${rf.action}`)
        : ['No material red flags identified. Standard zero-trust boundaries apply.']),
      ``,
      `--- RECOMMENDED NEXT STEPS ---`,
      `• Do not rely solely on contact information or verification links printed on the document.`,
      `• Visit the claimed organization's official website independently to obtain authentic contact channels.`,
      `• Ask the issuing organization registrar or HR department to verify the certificate ID directly.`,
      `• Request authorization through DigiLocker National Academic Depository (NAD) where applicable.`,
      ``,
      `--- SOURCES CONSULTED (${sourcesConsulted.length}) ---`,
      ...sourcesConsulted.map(s => `• ${s.sourceName} (${s.sourceType}) -> ${s.status}`),
      ``,
      `================================================================================`,
      `Authoritative forensic report generated by VerifyMe CredentialCheck Engine.`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedCase(true);
    setTimeout(() => setCopiedCase(false), 2000);
  };

  // Copy SHA-256 Helper
  const handleCopySha = () => {
    navigator.clipboard.writeText(documentSha256);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const markRows = extractedFields.academicMarksheet?.subjectRows || [];
  const arithmetic = crossValidationResults.arithmeticResult;

  // Render Verification State Badge for field table
  const renderVerificationBadge = (state) => {
    switch (state) {
      case 'MATCHED':
        return (
          <span className="cc-vstate-badge matched">
            <Check className="w-3 h-3" />
            <span>Matched against source</span>
          </span>
        );
      case 'MISMATCHED':
        return (
          <span className="cc-vstate-badge mismatched">
            <AlertTriangle className="w-3 h-3" />
            <span>Mismatched</span>
          </span>
        );
      case 'UNVERIFIED':
        return (
          <span className="cc-vstate-badge unverified">
            <HelpCircle className="w-3 h-3" />
            <span>Not independently verified</span>
          </span>
        );
      case 'NOT_AVAILABLE':
      default:
        return (
          <span className="cc-vstate-badge not-available">
            <span>Not available</span>
          </span>
        );
    }
  };

  if (!investigation) return null;

  return (
    <div className="cc-report-container">
      {/* 1. COMPACT CASE HEADER */}
      <div className="cc-report-header">
        <div className="cc-header-left">
          <button 
            type="button" 
            onClick={onNewInvestigation}
            className="cc-btn-ghost-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>New Investigation</span>
          </button>
          <div className="cc-divider-v" />
          <div className="cc-meta-group">
            <span className="cc-meta-label">Case ID</span>
            <span className="cc-case-id-pill">{id}</span>
          </div>
          <div className="cc-divider-v" />
          <div className="cc-meta-group">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="cc-meta-value">{formatDate(createdAtIso)}</span>
          </div>
          <span className="cc-category-badge">
            {category.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="cc-header-right">
          <button
            type="button"
            onClick={handleExportCase}
            className="cc-btn-secondary-sm"
            title="Copy structured forensic audit report to clipboard"
          >
            {copiedCase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCase ? 'Report Copied' : 'Export Case File'}</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION A: MAIN VERDICT BANNER */}
      <div className={`cc-verdict-banner ${outcome.toLowerCase()}`}>
        <div className="cc-verdict-banner-top">
          <div className="cc-verdict-status-lockup">
            <span className={`cc-verdict-pill ${outcome.toLowerCase()}`}>
              {isVerified && <ShieldCheck className="w-4 h-4" />}
              {isPartiallyVerified && <ShieldCheck className="w-4 h-4" />}
              {isSuspicious && <AlertOctagon className="w-4 h-4" />}
              {isInsufficient && <HelpCircle className="w-4 h-4" />}
              <span>{outcome.replace(/_/g, ' ')}</span>
            </span>
            <span className="cc-verdict-target">
              {extractedFields.holderName?.value 
                ? `${extractedFields.holderName.value} — ${extractedFields.issuingOrganization?.value || category.replace(/_/g, ' ')}`
                : (extractedFields.issuingOrganization?.value || 'Document Credential Investigation')}
            </span>
          </div>
          <span className="cc-verdict-doc-pill">
            {fileName}
          </span>
        </div>

        <h1 className="cc-verdict-headline">
          {verdictInfo.headline}
        </h1>

        <div className="cc-verdict-reasons-box">
          <span className="cc-reasons-title">Key Investigation Findings:</span>
          <ul className="cc-reasons-list">
            {verdictInfo.reasons.map((reason, idx) => (
              <li key={idx} className="cc-reason-item">
                <span className="cc-reason-bullet">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. SECTION D: VERIFICATION COVERAGE (4 MEANINGFUL CATEGORIES) */}
      <div className="cc-section-block">
        <div className="cc-section-header">
          <div>
            <h2 className="cc-section-title">
              <Layers className="w-4 h-4 text-slate-700" />
              <span>Verification Coverage</span>
            </h2>
            <p className="cc-section-desc">Independent statutory and forensic evaluation across four core dimensions.</p>
          </div>
        </div>

        <div className="cc-coverage-grid">
          {coverageDimensions.map(dim => {
            const Icon = dim.icon;
            return (
              <div key={dim.id} className="cc-coverage-card">
                <div className="cc-coverage-card-top">
                  <div className="flex items-center gap-2">
                    <div className="cc-coverage-icon-box">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="cc-coverage-name">{dim.title}</span>
                  </div>
                  <span className={`cc-coverage-badge ${dim.color}`}>
                    {dim.badge}
                  </span>
                </div>
                <p className="cc-coverage-desc">
                  {dim.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SECTION B: CREDENTIAL INFORMATION (CLEAN 9-FIELD TABLE) */}
      <div className="cc-section-block">
        <div className="cc-section-header">
          <div>
            <h2 className="cc-section-title">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Credential Information</span>
            </h2>
            <p className="cc-section-desc">Extracted document claims and independent verification states.</p>
          </div>
          <div className="cc-field-legend">
            <span className="cc-legend-item">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Matched source</span>
            </span>
            <span className="cc-legend-item">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              <span>Not independently verified</span>
            </span>
            <span className="cc-legend-item">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>Mismatched</span>
            </span>
          </div>
        </div>

        <div className="cc-table-card">
          <div className="overflow-x-auto">
            <table className="cc-field-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Credential Field</th>
                  <th style={{ width: '33%' }}>Extracted Value</th>
                  <th style={{ width: '22%' }}>Extraction Method</th>
                  <th style={{ width: '23%' }}>Verification State</th>
                </tr>
              </thead>
              <tbody>
                {credentialFields.map(field => {
                  const FieldIcon = field.icon;
                  const isPresent = Boolean(field.value);

                  return (
                    <tr key={field.id} className={!isPresent ? 'row-empty' : ''}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FieldIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-900 text-xs">{field.label}</span>
                        </div>
                      </td>
                      <td>
                        {isPresent ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-900 select-all">
                              {field.value}
                            </span>
                            {field.note && (
                              <span className="text-[11px] text-slate-500 mt-0.5">
                                {field.note}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Not stated on document
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-xs text-slate-600 font-mono">
                          {field.confidence}
                        </span>
                      </td>
                      <td>
                        {renderVerificationBadge(field.state)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. SECTION C: RED FLAGS & WARNINGS (INVESTIGATION CARDS) */}
      <div className="cc-section-block">
        <div className="cc-section-header">
          <div>
            <h2 className="cc-section-title">
              <AlertTriangle className="w-4 h-4 text-slate-700" />
              <span>Red Flags & Investigation Findings</span>
            </h2>
            <p className="cc-section-desc">Specific technical and institutional observations requiring review.</p>
          </div>
          <span className="text-xs text-slate-500">
            {redFlags.length} {redFlags.length === 1 ? 'finding' : 'findings'} documented
          </span>
        </div>

        {redFlags.length > 0 ? (
          <div className="cc-findings-stack">
            {redFlags.map(flag => (
              <div key={flag.id} className={`cc-finding-card ${flag.severity.toLowerCase()}`}>
                <div className="cc-finding-card-header">
                  <div className="flex items-center gap-2">
                    <span className={`cc-severity-badge ${flag.severity.toLowerCase()}`}>
                      {flag.severity}
                    </span>
                    <h3 className="cc-finding-heading">{flag.heading}</h3>
                  </div>
                </div>

                <div className="cc-finding-body">
                  <div className="cc-finding-field">
                    <span className="cc-finding-label">What was observed:</span>
                    <p className="cc-finding-text font-mono text-[12px] bg-slate-50 p-2 rounded border border-slate-200">
                      {flag.observed}
                    </p>
                  </div>

                  <div className="cc-finding-field">
                    <span className="cc-finding-label">Why it matters:</span>
                    <p className="cc-finding-text">
                      {flag.whyItMatters}
                    </p>
                  </div>

                  <div className="cc-finding-field">
                    <span className="cc-finding-label">What the user should do:</span>
                    <p className="cc-finding-action">
                      {flag.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cc-clean-finding-card">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">No Material Red Flags Detected</h3>
              <p className="text-xs text-slate-600 mt-1 mb-0 leading-relaxed">
                No lookalike domain patterns, arithmetic contradictions, or tampering markers were identified. Standard zero-trust institutional verification applies.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 6. SECTION E: ACADEMIC MARKSHEET ARITHMETIC ANALYSIS (IF APPLICABLE) */}
      {markRows.length > 0 && (
        <div className="cc-section-block">
          <div className="cc-section-header">
            <div>
              <h2 className="cc-section-title">
                <Calculator className="w-4 h-4 text-slate-700" />
                <span>Marksheet Subject-Level & Arithmetic Verification</span>
              </h2>
              <p className="cc-section-desc">Computed mathematical verification of individual subject marks against document total.</p>
            </div>
            <span className={`cc-vstate-badge ${arithmetic?.consistent ? 'matched' : 'mismatched'}`}>
              {arithmetic?.consistent ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              <span>{arithmetic?.consistent ? 'Arithmetic Consistent' : 'Arithmetic Inconsistency Flagged'}</span>
            </span>
          </div>

          <div className="cc-table-card">
            <table className="cc-field-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Subject / Course Unit</th>
                  <th style={{ width: '25%' }}>Marks Obtained</th>
                  <th style={{ width: '25%' }}>Maximum Marks</th>
                </tr>
              </thead>
              <tbody>
                {markRows.map((row, idx) => (
                  <tr key={`mark-${idx}`}>
                    <td className="font-semibold text-slate-900 text-xs">{row.subject}</td>
                    <td className="font-mono text-slate-800 text-xs">{row.marksObtained}</td>
                    <td className="font-mono text-slate-600 text-xs">{row.maxMarks}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td className="text-slate-900 text-xs">Computed Sum of Subject Marks</td>
                  <td className="font-mono text-[#174C3C] text-xs">{arithmetic?.computedTotalObtained}</td>
                  <td className="font-mono text-slate-700 text-xs">{arithmetic?.computedTotalMax}</td>
                </tr>
                {extractedFields.academicMarksheet?.statedTotalObtained !== null && (
                  <tr className="bg-slate-100 font-bold">
                    <td className="text-slate-900 text-xs">Stated Grand Total on Document</td>
                    <td className={`font-mono text-xs ${arithmetic?.consistent ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {extractedFields.academicMarksheet.statedTotalObtained}
                    </td>
                    <td className="font-mono text-slate-700 text-xs">{extractedFields.academicMarksheet.statedTotalMax}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. SECTION E: RECOMMENDED NEXT STEPS */}
      <div className="cc-section-block">
        <div className="cc-section-header">
          <div>
            <h2 className="cc-section-title">
              <Shield className="w-4 h-4 text-slate-700" />
              <span>Recommended Next Steps</span>
            </h2>
            <p className="cc-section-desc">Practical, actionable guidance based on this investigation's findings.</p>
          </div>
        </div>

        <div className="cc-next-steps-card">
          <div className="cc-step-item">
            <div className="cc-step-num">1</div>
            <div>
              <span className="cc-step-title">Do not rely solely on printed contact information</span>
              <p className="cc-step-desc">
                If the certificate contains contact emails or phone numbers, do not use them to verify authenticity. Fabricated certificates often print contacts controlled by unauthorized third parties.
              </p>
            </div>
          </div>

          <div className="cc-step-item">
            <div className="cc-step-num">2</div>
            <div>
              <span className="cc-step-title">
                {issuerIdentity.matchedEntity?.domain 
                  ? `Contact the organization independently at official domain ${issuerIdentity.matchedEntity.domain}`
                  : 'Contact the organization independently via official registry directory'}
              </span>
              <p className="cc-step-desc">
                Search for the organization's verified domain in state registries or accredited directories and contact their registrar, HR, or verification department directly.
              </p>
            </div>
          </div>

          <div className="cc-step-item">
            <div className="cc-step-num">3</div>
            <div>
              <span className="cc-step-title">Ask the issuer to confirm the Certificate ID directly</span>
              <p className="cc-step-desc">
                {extractedFields.credentialId?.value 
                  ? `Provide Certificate ID '${extractedFields.credentialId.value}' to the issuing authority and request written or portal confirmation.`
                  : 'Ask the candidate to provide an official student/employee registration number that the issuing organization can look up.'}
              </p>
            </div>
          </div>

          <div className="cc-step-item">
            <div className="cc-step-num">4</div>
            <div>
              <span className="cc-step-title">Request a digitally signed or DigiLocker-verifiable copy</span>
              <p className="cc-step-desc">
                Ask the candidate to share their certificate via DigiLocker National Academic Depository (https://digilocker.gov.in) or request a PDF signed with a recognized Certifying Authority (CCA) e-signature.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 8. SECTION F: TECHNICAL AUDIT LOG (PROGRESSIVE DISCLOSURE COLLAPSIBLE DRAWER) */}
      <div className="cc-audit-collapsible-wrapper">
        <button
          type="button"
          onClick={() => setShowTechnicalAudit(!showTechnicalAudit)}
          className="cc-audit-toggle-btn"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">Technical Audit Log & Forensic Provenance</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{showTechnicalAudit ? 'Hide Technical Details' : 'Show Technical Details'}</span>
            {showTechnicalAudit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTechnicalAudit && (
          <div className="cc-audit-body">
            {/* SHA-256 and File Provenance */}
            <div className="cc-audit-section">
              <span className="cc-audit-section-title">Cryptographic Document Fingerprint</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="cc-sha-box">{documentSha256}</code>
                <button
                  type="button"
                  onClick={handleCopySha}
                  className="cc-btn-ghost-sm"
                  title="Copy SHA-256 hash"
                >
                  {copiedSha ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSha ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-slate-600">
                <div>File: <strong className="text-slate-800">{fileName}</strong></div>
                <div>Pages: <strong className="text-slate-800">{numPages}</strong></div>
                <div>Category: <strong className="text-slate-800">{category}</strong></div>
                <div>Evaluated: <strong className="text-slate-800">{formatDate(createdAtIso)}</strong></div>
              </div>
            </div>

            {/* Forensic & PDF Structure Metadata */}
            <div className="cc-audit-section">
              <span className="cc-audit-section-title">Document Forensics & PDF Metadata</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Digital Signature (PKCS#7)</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">
                    {forensicResults.hasDigitalSignature ? 'Signature Field Present' : 'No Digital Signature Field'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Status: {documentIntegrityStatus}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">PDF Revisions & Updates</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">
                    {technicalAudit?.pdfMetadata?.revisionCount || 1} revision(s)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Incremental Updates: {technicalAudit?.pdfMetadata?.hasIncrementalUpdates ? 'Yes' : 'None detected'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">QR Code Forensic Scan</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">
                    {technicalAudit?.qrDetails?.detected ? 'QR Code Decoded' : 'No QR Code Detected'}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate block">
                    {technicalAudit?.qrDetails?.rawPayload ? `Payload: ${technicalAudit.qrDetails.rawPayload}` : 'No embedded QR data'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sources Consulted Matrix */}
            <div className="cc-audit-section">
              <span className="cc-audit-section-title">Sources Consulted ({sourcesConsulted.length})</span>
              <div className="overflow-x-auto mt-2">
                <table className="cc-audit-table">
                  <thead>
                    <tr>
                      <th>Source Name</th>
                      <th>Category</th>
                      <th>Query Scope</th>
                      <th>Result Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourcesConsulted.map((src, idx) => (
                      <tr key={`audit-src-${idx}`}>
                        <td className="font-semibold text-slate-900">
                          {src.sourceName}
                          {src.sourceUrl && (
                            <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#174C3C] hover:underline text-[10px] inline-flex items-center gap-0.5 ml-1.5 font-bold">
                              <span>Link</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>
                        <td className="text-slate-600">{src.sourceType.replace(/_/g, ' ')}</td>
                        <td className="text-slate-600">{src.queryScope}</td>
                        <td>
                          <span className={`cc-audit-pill ${src.status.toLowerCase()}`}>
                            {src.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Checkpoints Audit Pipeline */}
            {checkpoints.length > 0 && (
              <div className="cc-audit-section">
                <span className="cc-audit-section-title">Execution Pipeline Checkpoints ({checkpoints.length} Stages)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
                  {checkpoints.map((cp, idx) => (
                    <div key={cp.id} className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{idx + 1}. {cp.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${cp.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : (cp.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700')}`}>
                          {cp.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block">{cp.explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialCheckReport;
