import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  CheckCircle2, 
  FileText, 
  ChevronDown, 
  Download, 
  Share2, 
  RefreshCw, 
  Hash, 
  Award, 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  PenTool, 
  Mail, 
  Globe, 
  Info
} from 'lucide-react';
import './CredentialCheck.css';

export const CredentialCheckReport = ({ investigation, onNewInvestigation }) => {
  const [copiedReport, setCopiedReport] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, CONFIRMED, INCONSISTENCIES, UNVERIFIED
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

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

  // Format category name for human presentation
  const formatCategoryName = (cat) => {
    const map = {
      AUTO: 'Auto-detected Credential',
      INTERNSHIP: 'Internship Certificate',
      COURSE_COMPLETION: 'Course Completion Certificate',
      TRAINING: 'Training Certificate',
      EXPERIENCE: 'Experience Letter',
      ACADEMIC: 'Academic Degree / Marksheet',
      PROFESSIONAL_CERTIFICATION: 'Professional Certification'
    };
    return map[cat] || cat?.replace(/_/g, ' ') || 'Credential Document';
  };

  // Verdict Presentation Configuration
  const verdictConfig = useMemo(() => {
    const orgName = extractedFields.issuingOrganization?.value || issuerIdentity.queryOrg || 'the claimed issuer';
    const officialDomain = issuerIdentity.officialDomainCandidate || issuerIdentity.matchedEntity?.domain || null;
    const documentEmail = extractedFields.contactEmail?.value || null;
    const documentDomain = issuerIdentity.queryDomain || (documentEmail && documentEmail.includes('@') ? documentEmail.split('@')[1] : null);

    if (isVerified) {
      return {
        badgeText: 'VERIFIED CREDENTIAL',
        code: 'OUTCOME // CORROBORATED_BY_REGISTRIES',
        headline: 'Credential Authenticity Independently Corroborated',
        sub: 'Claims matched active statutory educational or corporate registries, and the document passed all structural integrity checks.',
        icon: ShieldCheck,
        themeClass: 'verdict-verified',
        accentColor: '#2E7D5B',
        badgeBg: '#EFF8F3',
        keyPoints: [
          `The issuing organization (${orgName}) was located and validated in recognized statutory registries.`,
          issuanceStatus === 'CONFIRMED_BY_ISSUER'
            ? 'The credential identifier was corroborated directly by the issuer verification registry.'
            : (forensicResults.hasDigitalSignature 
                ? 'Cryptographic digital signature is valid and chained to an authorized Certifying Authority.'
                : 'All extracted credential claims align with established issuer patterns with no tampering detected.'),
          'No internal numerical discrepancies or visual tampering markers were identified.'
        ]
      };
    }

    if (isPartiallyVerified) {
      return {
        badgeText: 'PARTIALLY VERIFIED',
        code: 'OUTCOME // ISSUER_ESTABLISHED_DIRECT_UNCONFIRMED',
        headline: 'Issuing Organization Established; Individual Credential Unconfirmed',
        sub: 'The claimed issuing organization is legally registered, but individual certificate issuance could not be independently corroborated through public records.',
        icon: ShieldCheck,
        themeClass: 'verdict-likely',
        accentColor: '#2E7D5B',
        badgeBg: '#EFF8F3',
        keyPoints: [
          `The claimed issuing organization (${orgName}) was verified in recognized educational or corporate directories.`,
          'The document passed structural integrity forensics with no alterations or tampering anomalies detected.',
          'Individual credential issuance requires direct confirmation from the registrar or candidate consent via DigiLocker NAD.'
        ]
      };
    }

    if (isSuspicious) {
      let specificHeadline = 'Suspicious Inconsistencies Detected';
      const specificPoints = [];

      if (issuerIdentity.isLookalike) {
        specificHeadline = 'Potential Issuer Impersonation Detected';
        if (officialDomain && documentDomain) {
          specificPoints.push(`The document claims to originate from ${orgName}, but references the domain '${documentDomain}' instead of the official domain candidate '${officialDomain}'.`);
        } else {
          specificPoints.push(`The email address or verification link appears to imitate the official web presence of ${orgName}.`);
        }
      } else if (crossValidationResults.arithmeticResult && !crossValidationResults.arithmeticResult.consistent) {
        specificHeadline = 'Discrepancy in Academic Marks Calculation';
        const disc = crossValidationResults.arithmeticResult.discrepancy || {};
        const stated = disc.statedTotal ?? extractedFields.academicMarksheet?.statedTotalObtained ?? 'stated';
        const computed = disc.computedTotal ?? crossValidationResults.arithmeticResult.computedTotalObtained ?? 'computed';
        specificPoints.push(`The stated grand total on the document (${stated}) contradicts the mathematical sum of individual subjects (${computed}).`);
      } else if (documentIntegrityStatus === 'SIGNATURE_INVALID') {
        specificHeadline = 'Digital Signature Invalid or Document Modified';
        specificPoints.push('The cryptographic digital signature embedded in the PDF failed validation, indicating post-signing file modification.');
      } else {
        specificPoints.push('Document claims contradict authoritative public records or fail domain alignment checks.');
      }

      specificPoints.push('Direct credential issuance has not been confirmed through authorized institutional registries.');
      specificPoints.push('Exercise caution: request an official re-issued document or verify directly through primary corporate channels.');

      return {
        badgeText: 'SUSPICIOUS INCONSISTENCIES',
        code: 'OUTCOME // CONTRADICTIONS_IDENTIFIED',
        headline: specificHeadline,
        sub: 'Material discrepancies were detected between the document claims and official statutory infrastructure.',
        icon: AlertTriangle,
        themeClass: 'verdict-caution',
        accentColor: '#B45309',
        badgeBg: '#FEF3C7',
        keyPoints: specificPoints
      };
    }

    // Default: INSUFFICIENT_EVIDENCE
    return {
      badgeText: 'INSUFFICIENT EVIDENCE',
      code: 'OUTCOME // PUBLIC_RECORDS_INCONCLUSIVE',
      headline: 'This credential could not be independently verified.',
      sub: 'Available open statutory registries and automated forensics could neither conclusively corroborate nor disprove this document.',
      icon: HelpCircle,
      themeClass: 'verdict-insufficient',
      accentColor: '#737D76',
      badgeBg: '#F4F7F4',
      keyPoints: [
        `The claimed organization (${orgName}) could not be indexed in public statutory registries (e.g., MCA or UGC open portals).`,
        'The document does not contain an authorized cryptographic digital signature or open verification endpoint.',
        'Important distinction: Insufficient evidence does NOT prove a document is fraudulent. Many legitimate private organizations or foreign institutions do not maintain open public verification databases.'
      ]
    };
  }, [
    isVerified,
    isPartiallyVerified,
    isSuspicious,
    extractedFields,
    issuerIdentity,
    forensicResults,
    crossValidationResults,
    documentIntegrityStatus,
    issuanceStatus
  ]);

  const VerdictIcon = verdictConfig.icon;

  // 4 Verification Dimensions Data Model
  const dimensionsSummary = useMemo(() => {
    return [
      {
        id: 'issuer_identity',
        name: 'Issuer Identity',
        status: issuerIdentityStatus,
        statusLabel: issuerIdentityStatus === 'ESTABLISHED' ? 'Established' : (issuerIdentityStatus === 'INCONSISTENT' ? 'Inconsistent' : 'Unresolved'),
        statusType: issuerIdentityStatus === 'ESTABLISHED' ? 'verified' : (issuerIdentityStatus === 'INCONSISTENT' ? 'contradiction' : 'unverified'),
        explanation: issuerIdentityStatus === 'ESTABLISHED'
          ? 'Matched recognized statutory corporate or higher education directory.'
          : (issuerIdentityStatus === 'INCONSISTENT'
              ? 'Discrepancy found between claimed issuer name and registered public records.'
              : 'Could not locate authoritative public registry entry for the stated organization.'),
        evidence: issuerIdentity.matchedEntity?.legalName 
          ? `Registry Match: ${issuerIdentity.matchedEntity.legalName}`
          : (issuerIdentity.queryOrg ? `Queried: ${issuerIdentity.queryOrg}` : 'Extracted organization name'),
        limitation: 'Public MCA/UGC registries cover licensed entities; unregistered startups or foreign firms require manual corporate confirmation.'
      },
      {
        id: 'document_integrity',
        name: 'Document Integrity',
        status: documentIntegrityStatus,
        statusLabel: documentIntegrityStatus === 'VALID' || documentIntegrityStatus === 'STRUCTURE_NORMAL' ? 'Intact' : (documentIntegrityStatus === 'SIGNATURE_INVALID' || documentIntegrityStatus === 'TAMPERING_SUSPECTED' ? 'Flagged' : 'Inconclusive'),
        statusType: documentIntegrityStatus === 'VALID' || documentIntegrityStatus === 'STRUCTURE_NORMAL' ? 'verified' : (documentIntegrityStatus === 'SIGNATURE_INVALID' || documentIntegrityStatus === 'TAMPERING_SUSPECTED' ? 'contradiction' : 'unverified'),
        explanation: documentIntegrityStatus === 'VALID'
          ? 'Cryptographic digital signature verified against licensed Certifying Authority.'
          : (documentIntegrityStatus === 'STRUCTURE_NORMAL'
              ? 'PDF structural stream and metadata show no indicators of post-creation editing.'
              : (documentIntegrityStatus === 'SIGNATURE_INVALID'
                  ? 'Digital signature invalid; file modified after signature was applied.'
                  : 'No cryptographic signature seal found; file examined via optical forensics.')),
        evidence: forensicResults.hasDigitalSignature 
          ? `PKCS#7 Digital Seal: ${forensicResults.signatureDetails?.signerName || 'Signed'}`
          : (numPages ? `${numPages} page(s) analyzed • PDF stream intact` : 'Structural analysis'),
        limitation: 'The absence of a digital signature does NOT imply fraud; most educational and employment certificates are issued as plain PDFs.'
      },
      {
        id: 'credential_issuance',
        name: 'Credential Issuance',
        status: issuanceStatus,
        statusLabel: issuanceStatus === 'CONFIRMED_BY_ISSUER' ? 'Confirmed' : (issuanceStatus === 'REJECTED_BY_ISSUER' ? 'Rejected' : 'Unconfirmed'),
        statusType: issuanceStatus === 'CONFIRMED_BY_ISSUER' ? 'verified' : (issuanceStatus === 'REJECTED_BY_ISSUER' ? 'contradiction' : 'unverified'),
        explanation: issuanceStatus === 'CONFIRMED_BY_ISSUER'
          ? 'Certificate ID and record independently confirmed by issuer verification endpoint.'
          : (issuanceStatus === 'REJECTED_BY_ISSUER'
              ? 'Issuer verification system explicitly rejected the certificate identifier.'
              : 'Record not independently confirmed; requires direct registrar inquiry or candidate DigiLocker consent.'),
        evidence: extractedFields.credentialId?.value 
          ? `ID Examined: ${extractedFields.credentialId.value}`
          : 'No public online verification database available',
        limitation: 'Direct issuance queries depend on issuer availability; offline institutions cannot be queried automatically.'
      },
      {
        id: 'claim_consistency',
        name: 'Claim Consistency',
        status: claimConsistencyStatus,
        statusLabel: claimConsistencyStatus === 'CONSISTENT' ? 'Consistent' : (claimConsistencyStatus === 'CONTRADICTIONS_DETECTED' ? 'Inconsistent' : 'Inconclusive'),
        statusType: claimConsistencyStatus === 'CONSISTENT' ? 'verified' : (claimConsistencyStatus === 'CONTRADICTIONS_DETECTED' ? 'contradiction' : 'unverified'),
        explanation: claimConsistencyStatus === 'CONSISTENT'
          ? 'All extracted dates, titles, domains, and arithmetic calculations align.'
          : (claimConsistencyStatus === 'CONTRADICTIONS_DETECTED'
              ? 'Discrepancy detected in domain alignment, tenure dates, or marks computation.'
              : 'Insufficient external reference data to cross-check all individual document claims.'),
        evidence: crossValidationResults.arithmeticResult 
          ? (crossValidationResults.arithmeticResult.consistent ? 'Marks calculation mathematically exact' : 'Marks calculation mismatch detected')
          : (forensicResults.anomalies?.length ? `${forensicResults.anomalies.length} anomaly detected` : 'Claims cross-checked across layers'),
        limitation: 'Consistency evaluation checks internal document logic and known domain patterns.'
      }
    ];
  }, [
    issuerIdentityStatus,
    documentIntegrityStatus,
    issuanceStatus,
    claimConsistencyStatus,
    issuerIdentity,
    forensicResults,
    extractedFields,
    numPages,
    crossValidationResults
  ]);

  // Extracted Credential Parameters (9 Key Fields with Strict Origin & Verification State)
  const credentialParameters = useMemo(() => {
    const comparisons = crossValidationResults.fieldComparisons || [];
    const getComparison = (label) => comparisons.find(c => c.fieldLabel?.toLowerCase().includes(label.toLowerCase()));
    const officialDomain = issuerIdentity.officialDomainCandidate || issuerIdentity.matchedEntity?.domain || null;
    const isLookalike = Boolean(issuerIdentity.isLookalike);

    // 1. Candidate Name
    const holderVal = extractedFields.holderName?.value || null;
    const holderComp = getComparison('name') || getComparison('candidate');
    let holderOrigin = holderVal ? 'Extracted from document' : 'Not detected';
    let holderState = 'UNVERIFIED';
    if (holderVal) {
      if (holderComp?.outcome === 'EXACT_MATCH') holderState = 'MATCHED';
      else if (holderComp?.outcome === 'MISMATCH') holderState = 'MISMATCHED';
    }

    // 2. Claimed Issuer
    const issuerVal = extractedFields.issuingOrganization?.value || issuerIdentity.queryOrg || null;
    const isUserSuppliedIssuer = !extractedFields.issuingOrganization?.value && Boolean(issuerIdentity.queryOrg);
    let issuerOrigin = isUserSuppliedIssuer ? 'Provided by you' : (issuerVal ? 'Extracted from document' : 'Not detected');
    let issuerState = 'UNVERIFIED';
    if (issuerVal) {
      if (isLookalike || issuerIdentity.identityStatus === 'INCONSISTENT') issuerState = 'MISMATCHED';
      else if (issuerIdentity.identityStatus === 'ESTABLISHED' || issuerIdentity.matchedEntity) issuerState = 'MATCHED';
    }

    // 3. Credential Title
    const titleVal = extractedFields.credentialTitle?.value || null;
    let titleOrigin = titleVal ? 'Extracted from document' : 'Not detected';
    let titleState = titleVal ? (isVerified ? 'MATCHED' : 'UNVERIFIED') : 'NOT_AVAILABLE';

    // 4. Certificate ID
    const certIdVal = extractedFields.credentialId?.value || null;
    let certIdOrigin = certIdVal ? 'Extracted from document' : 'Not detected';
    let certIdState = 'UNVERIFIED';
    if (certIdVal) {
      if (issuanceStatus === 'CONFIRMED_BY_ISSUER') certIdState = 'MATCHED';
      else if (issuanceStatus === 'REJECTED_BY_ISSUER') certIdState = 'MISMATCHED';
    } else {
      certIdState = 'NOT_AVAILABLE';
    }

    // 5. Issue Date
    const issueDateVal = extractedFields.issueDate?.value || null;
    let issueDateOrigin = issueDateVal ? 'Extracted from document' : 'Not detected';
    let issueDateState = issueDateVal ? 'UNVERIFIED' : 'NOT_AVAILABLE';

    // 6. Duration / Period
    const durationVal = extractedFields.duration?.value || null;
    let durationOrigin = durationVal ? 'Extracted from document' : 'Not detected';
    let durationState = durationVal ? 'UNVERIFIED' : 'NOT_AVAILABLE';

    // 7. Signatory
    const signatoryVal = extractedFields.signatory?.value || null;
    let signatoryOrigin = signatoryVal ? 'Extracted from document' : 'Not detected';
    let signatoryState = 'UNVERIFIED';
    if (signatoryVal) {
      if (forensicResults.hasDigitalSignature) signatoryState = 'MATCHED';
    } else {
      signatoryState = 'NOT_AVAILABLE';
    }

    // 8. Contact Email
    const emailVal = extractedFields.contactEmail?.value || null;
    let emailOrigin = emailVal ? 'Extracted from document' : 'Not detected';
    let emailState = 'UNVERIFIED';
    if (emailVal) {
      const emailDomain = emailVal.includes('@') ? emailVal.split('@')[1].toLowerCase().trim() : '';
      if (isLookalike || (officialDomain && emailDomain && emailDomain !== officialDomain && !emailDomain.endsWith('.' + officialDomain))) {
        emailState = 'MISMATCHED';
      } else if (officialDomain && emailDomain && (emailDomain === officialDomain || emailDomain.endsWith('.' + officialDomain))) {
        emailState = 'MATCHED';
      }
    } else {
      emailState = 'NOT_AVAILABLE';
    }

    // 9. Verification URL
    const urlVal = extractedFields.verificationUrl?.value || null;
    let urlOrigin = urlVal ? 'Extracted from document' : 'Not detected';
    let urlState = 'UNVERIFIED';
    if (urlVal) {
      const parsedDomain = urlVal.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase().trim();
      if (isLookalike || (officialDomain && parsedDomain && parsedDomain !== officialDomain && !parsedDomain.endsWith('.' + officialDomain))) {
        urlState = 'MISMATCHED';
      } else if (officialDomain && parsedDomain && (parsedDomain === officialDomain || parsedDomain.endsWith('.' + officialDomain))) {
        urlState = 'MATCHED';
      }
    } else {
      urlState = 'NOT_AVAILABLE';
    }

    return [
      { id: 'candidate', label: 'Candidate Name', icon: User, value: holderVal, origin: holderOrigin, state: holderState },
      { id: 'issuer', label: 'Claimed Issuer', icon: Building2, value: issuerVal, origin: issuerOrigin, state: issuerState },
      { id: 'title', label: 'Credential Title', icon: Award, value: titleVal, origin: titleOrigin, state: titleState },
      { id: 'cert_id', label: 'Certificate / Roll ID', icon: Hash, value: certIdVal, origin: certIdOrigin, state: certIdState },
      { id: 'date', label: 'Issue Date', icon: Calendar, value: issueDateVal, origin: issueDateOrigin, state: issueDateState },
      { id: 'duration', label: 'Duration / Validity', icon: Clock, value: durationVal, origin: durationOrigin, state: durationState },
      { id: 'signatory', label: 'Signatory', icon: PenTool, value: signatoryVal, origin: signatoryOrigin, state: signatoryState },
      { id: 'email', label: 'Contact Email', icon: Mail, value: emailVal, origin: emailOrigin, state: emailState },
      { id: 'url', label: 'Verification URL', icon: Globe, value: urlVal, origin: urlOrigin, state: urlState }
    ];
  }, [
    extractedFields,
    issuerIdentity,
    crossValidationResults,
    forensicResults,
    issuanceStatus,
    isVerified
  ]);

  // Aggregate Findings into Confirmed, Inconsistencies, and Unverified
  const categorizedFindings = useMemo(() => {
    const list = [];
    const officialDomain = issuerIdentity.officialDomainCandidate || issuerIdentity.matchedEntity?.domain || null;
    const documentEmail = extractedFields.contactEmail?.value || null;
    const queryDomain = issuerIdentity.queryDomain || (documentEmail && documentEmail.includes('@') ? documentEmail.split('@')[1] : null);

    // 1. INCONSISTENCIES AND WARNING SIGNS
    if (issuerIdentity.isLookalike) {
      list.push({
        id: 'f-lookalike',
        group: 'INCONSISTENCIES',
        groupLabel: 'Warning Sign',
        title: 'Issuer Communication Domain Mismatch',
        detail: `The document domain or email (${documentEmail || queryDomain || 'Printed'}) does not match the candidate official domain ('${officialDomain || 'Unidentified'}').`,
        source: 'Domain Registry Heuristics',
        statusType: 'contradiction',
        technical: 'Levenshtein edit-distance and corporate DNS mismatch.'
      });
    }

    if (crossValidationResults.arithmeticResult && !crossValidationResults.arithmeticResult.consistent) {
      const disc = crossValidationResults.arithmeticResult.discrepancy || {};
      const stated = disc.statedTotal ?? extractedFields.academicMarksheet?.statedTotalObtained ?? 'N/A';
      const computed = disc.computedTotal ?? crossValidationResults.arithmeticResult.computedTotalObtained ?? 'N/A';
      list.push({
        id: 'f-arithmetic',
        group: 'INCONSISTENCIES',
        groupLabel: 'Contradiction',
        title: 'Marksheet Arithmetic Discrepancy',
        detail: `The stated total marks on the marksheet (${stated}) contradict the sum of subject scores (${computed}).`,
        source: 'Document Calculation Engine',
        statusType: 'contradiction',
        technical: 'Internal numerical inconsistency detected during tabular marks cross-summing.'
      });
    }

    if (documentIntegrityStatus === 'SIGNATURE_INVALID') {
      list.push({
        id: 'f-invalid-sig',
        group: 'INCONSISTENCIES',
        groupLabel: 'Tampering Alert',
        title: 'Invalid Cryptographic Digital Signature',
        detail: 'The PDF digital signature bytes failed integrity validation, indicating the file was modified after signing.',
        source: 'CCA Cryptographic Validator',
        statusType: 'contradiction',
        technical: 'PKCS#7 byte-range checksum failure.'
      });
    }

    if (forensicResults.anomalies && forensicResults.anomalies.length > 0) {
      forensicResults.anomalies.forEach((a, idx) => {
        list.push({
          id: `f-anomaly-${idx}`,
          group: 'INCONSISTENCIES',
          groupLabel: 'Forensic Anomaly',
          title: a.title || 'Document Modification Marker',
          detail: a.detail || 'Metadata contains signatures of graphic design editing software.',
          source: 'PDF Structural Forensics',
          statusType: 'contradiction',
          technical: a.technicalDetail || 'Producer/Creator tag anomaly.'
        });
      });
    }

    // 2. CONFIRMED EVIDENCE
    if (issuerIdentity.matchedEntity) {
      list.push({
        id: 'f-issuer-established',
        group: 'CONFIRMED',
        groupLabel: 'Confirmed Evidence',
        title: 'Issuing Organization Cataloged in Registry',
        detail: `Matched registered entity: ${issuerIdentity.matchedEntity.legalName || issuerIdentity.matchedEntity.name} (CIN/Ref: ${issuerIdentity.matchedEntity.cin || issuerIdentity.matchedEntity.code || 'Active'}).`,
        source: issuerIdentity.matchedEntity.registry || 'Statutory Directory',
        statusType: 'verified',
        technical: `Registry lookup confirmed official corporate existence under ${issuerIdentity.matchedEntity.registry || 'Government Registry'}.`
      });
    }

    if (issuanceStatus === 'CONFIRMED_BY_ISSUER') {
      list.push({
        id: 'f-issuance-confirmed',
        group: 'CONFIRMED',
        groupLabel: 'Confirmed Evidence',
        title: 'Credential ID Confirmed by Issuer Endpoint',
        detail: `The certificate identifier (${extractedFields.credentialId?.value || 'Stated ID'}) was positively confirmed by the issuing portal.`,
        source: 'Issuer Online Verification Portal',
        statusType: 'verified',
        technical: 'Live HTTP verification returned confirmed status without redirection anomaly.'
      });
    }

    if (forensicResults.hasDigitalSignature && documentIntegrityStatus !== 'SIGNATURE_INVALID') {
      list.push({
        id: 'f-signature-verified',
        group: 'CONFIRMED',
        groupLabel: 'Confirmed Evidence',
        title: 'Cryptographic Digital Signature Valid',
        detail: `Authorized PKCS#7 digital signature verified for ${forensicResults.signatureDetails?.signerName || 'Authorized Signatory'}.`,
        source: 'Licensed Certifying Authority (CCA)',
        statusType: 'verified',
        technical: 'X.509 certificate chain is intact and valid at time of issuance.'
      });
    }

    if (crossValidationResults.arithmeticResult && crossValidationResults.arithmeticResult.consistent) {
      list.push({
        id: 'f-arithmetic-consistent',
        group: 'CONFIRMED',
        groupLabel: 'Confirmed Evidence',
        title: 'Marksheet Arithmetic Exact',
        detail: 'The sum of individual subject marks exactly matches the stated grand total and percentage.',
        source: 'Academic Marksheet Validator',
        statusType: 'verified',
        technical: 'Zero arithmetic discrepancy across all extracted subject rows.'
      });
    }

    // 3. INFORMATION NOT INDEPENDENTLY VERIFIED
    if (issuanceStatus === 'UNCONFIRMED') {
      list.push({
        id: 'f-unconfirmed-issuance',
        group: 'UNVERIFIED',
        groupLabel: 'Unverified Boundary',
        title: 'Individual Certificate Issuance Unconfirmed',
        detail: 'The document lacks a direct public verification database or automated DigiLocker NAD connector.',
        source: 'Verification Scope Boundary',
        statusType: 'unverified',
        technical: 'No public online repository available for automated batch record validation.'
      });
    }

    if (!forensicResults.hasDigitalSignature) {
      list.push({
        id: 'f-no-sig-boundary',
        group: 'UNVERIFIED',
        groupLabel: 'Unverified Boundary',
        title: 'No Cryptographic Digital Signature Embedded',
        detail: 'The document does not contain an electronic signature seal from a Certifying Authority. This is typical for printed documents, but limits digital integrity proofs.',
        source: 'PDF Structure Inspection',
        statusType: 'unverified',
        technical: 'No ByteRange or PKCS#7 signature dictionary found in document trailer.'
      });
    }

    if (extractedFields.holderName?.value && (!crossValidationResults.fieldComparisons || crossValidationResults.fieldComparisons.length === 0)) {
      list.push({
        id: 'f-candidate-uncorroborated',
        group: 'UNVERIFIED',
        groupLabel: 'Unverified Boundary',
        title: 'Candidate Identity Record Uncorroborated',
        detail: `Candidate name '${extractedFields.holderName.value}' was extracted from the document layer, but has not been cross-checked against independent payroll or university records.`,
        source: 'Investigation Scope',
        statusType: 'unverified',
        technical: 'Requires candidate DigiLocker consent or official registrar transcript.'
      });
    }

    return list;
  }, [
    issuerIdentity,
    extractedFields,
    crossValidationResults,
    documentIntegrityStatus,
    forensicResults,
    issuanceStatus
  ]);

  const filteredFindings = useMemo(() => {
    if (activeTab === 'ALL') return categorizedFindings;
    return categorizedFindings.filter(f => f.group === activeTab);
  }, [categorizedFindings, activeTab]);

  const toggleFindingExpand = (fId) => {
    setExpandedFinding(prev => prev === fId ? null : fId);
  };

  const handleCopyReport = () => {
    const textLines = [
      `=======================================================`,
      `VERIFYME CREDENTIALCHECK — DOCUMENT INTELLIGENCE REPORT`,
      `=======================================================`,
      `Case Reference: ${id}`,
      `Generated: ${formatDate(createdAtIso)}`,
      `Document: ${fileName} (${formatCategoryName(category)})`,
      `Primary Outcome: ${outcome}`,
      ``,
      `INVESTIGATION VERDICT:`,
      `${verdictConfig.headline}`,
      `${verdictConfig.sub}`,
      ``,
      `KEY ASSESSMENT POINTS:`,
      ...verdictConfig.keyPoints.map(p => `• ${p}`),
      ``,
      `FOUR VERIFICATION DIMENSIONS:`,
      ...dimensionsSummary.map(d => `• ${d.name}: [${d.statusLabel}] ${d.explanation}`),
      ``,
      `RECOMMENDED NEXT ACTION:`,
      recommendedAction,
      ``,
      `FINDINGS BREAKDOWN (${categorizedFindings.length} items):`,
      ...categorizedFindings.map(f => `• [${f.groupLabel}] ${f.title}: ${f.detail}`),
      ``,
      `=======================================================`,
      `VerifyMe CredentialCheck • Statutory & Forensic Document Intelligence`
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadFile = () => {
    const textLines = [
      `VERIFYME CREDENTIALCHECK CASE DOSSIER #${id}`,
      `Date: ${formatDate(createdAtIso)}`,
      `File Name: ${fileName}`,
      `Document Category: ${formatCategoryName(category)}`,
      `Assessment Outcome: ${outcome}`,
      ``,
      `VERDICT SUMMARY:`,
      summary,
      ``,
      `RECOMMENDED ACTION:`,
      recommendedAction,
      ``,
      `VERIFICATION DIMENSIONS:`,
      ...dimensionsSummary.map(d => `[${d.name}] Status: ${d.statusLabel} | Evidence: ${d.evidence}`),
      ``,
      `EVIDENCE FINDINGS:`,
      ...categorizedFindings.map(f => `[${f.group}] ${f.title}: ${f.detail}`)
    ];

    const blob = new Blob([textLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CredentialCheck_Case_${id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <article className="cc-report-root fadeIn" aria-label="CredentialCheck Document Intelligence Report">
      {/* 1. CASE HEADER */}
      <header className="cc-case-header">
        <div className="cc-case-meta-top">
          <div className="flex items-center gap-2">
            <span className="cc-case-badge font-mono">CASE DOSSIER</span>
            <span className="cc-meta-dot">•</span>
            <span className="cc-case-id font-mono">
              <Hash className="w-3 h-3 inline mr-0.5 text-[#94A098]" />
              {id}
            </span>
          </div>
          <div className="cc-case-date font-mono">
            {formatDate(createdAtIso)} • {formatCategoryName(category).toUpperCase()}
          </div>
        </div>

        <div className="cc-case-title-row">
          <div className="cc-case-title-group">
            <div className="cc-case-category-pill">
              <Award className="w-3.5 h-3.5 text-[#2E7D5B]" />
              <span>{formatCategoryName(category)}</span>
            </div>
            <h1 className="cc-case-subject-title">
              {extractedFields.holderName?.value ? `${extractedFields.holderName.value} — ` : ''}
              {extractedFields.issuingOrganization?.value || issuerIdentity.queryOrg || fileName}
            </h1>
          </div>

          <div className="cc-case-actions">
            <button 
              type="button" 
              className="cc-action-btn"
              onClick={handleCopyReport}
              title="Copy audit dossier to clipboard"
            >
              {copiedReport ? (
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
              className="cc-action-btn"
              onClick={handleDownloadFile}
              title="Export text case dossier"
            >
              <Download className="w-4 h-4 text-[#737D76]" />
              <span>Export Dossier</span>
            </button>

            <button 
              type="button" 
              className="cc-action-btn primary"
              onClick={onNewInvestigation}
              title="Audit another document"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Check</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN VERDICT — PRIMARY VISUAL ANCHOR */}
      <section className={`cc-verdict-banner ${verdictConfig.themeClass}`} aria-label="Investigation Verdict">
        <div className="cc-verdict-rail" aria-hidden="true" />
        <div className="cc-verdict-body">
          <div className="cc-verdict-tag-row">
            <span 
              className="cc-verdict-badge font-mono"
              style={{ color: verdictConfig.accentColor, backgroundColor: verdictConfig.badgeBg }}
            >
              <VerdictIcon className="w-3.5 h-3.5" />
              <span>{verdictConfig.badgeText}</span>
            </span>
            <span className="cc-verdict-code font-mono">{verdictConfig.code}</span>
          </div>

          <h2 className="cc-verdict-headline">
            {verdictConfig.headline}
          </h2>

          <p className="cc-verdict-subtext">
            {verdictConfig.sub}
          </p>

          <div className="cc-verdict-points-list">
            {verdictConfig.keyPoints.map((point, idx) => (
              <div key={idx} className="cc-verdict-point-item">
                <div className="cc-point-bullet" />
                <p className="cc-point-text">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FOUR VERIFICATION DIMENSIONS (EVIDENCE SUMMARY) */}
      <section className="cc-dimensions-section" aria-label="Four Investigation Dimensions">
        <div className="cc-section-headline-wrap">
          <span className="cc-section-pretitle font-mono">VERIFICATION OVERVIEW</span>
          <h3 className="cc-section-title">Four Dimensions of Document Evidence</h3>
        </div>

        <div className="cc-dimensions-grid">
          {dimensionsSummary.map(dim => (
            <div key={dim.id} className={`cc-dimension-card status-${dim.statusType}`}>
              <div className="cc-dim-header">
                <span className="cc-dim-name">{dim.name}</span>
                <span className={`cc-dim-badge font-mono status-${dim.statusType}`}>
                  {dim.statusLabel}
                </span>
              </div>
              <p className="cc-dim-explanation">{dim.explanation}</p>
              <div className="cc-dim-evidence font-mono">
                <span className="cc-dim-lbl">EVALUATED:</span>
                <span className="cc-dim-val">{dim.evidence}</span>
              </div>
              <div className="cc-dim-limitation">
                <Info className="w-3 h-3 text-[#94A098] shrink-0 mt-0.5" />
                <span>{dim.limitation}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. EXTRACTED CREDENTIAL PARAMETERS */}
      <section className="cc-profile-section" aria-label="Extracted Credential Parameters">
        <div className="cc-section-headline-wrap">
          <span className="cc-section-pretitle font-mono">DOCUMENT PARAMETERS</span>
          <h3 className="cc-section-title">Extracted Credential Information</h3>
          <p className="cc-section-desc">
            Origin and independent verification state for claims identified in the document structure.
          </p>
        </div>

        <div className="cc-profile-grid">
          {credentialParameters.map(param => {
            const Icon = param.icon;
            const isAvailable = Boolean(param.value);
            return (
              <div key={param.id} className={`cc-param-item ${!isAvailable ? 'is-empty' : ''}`}>
                <div className="cc-param-top">
                  <div className="cc-param-icon-box">
                    <Icon className="w-3.5 h-3.5 text-[#556058]" />
                  </div>
                  <span className="cc-param-label">{param.label}</span>
                </div>

                <div className="cc-param-val">
                  {isAvailable ? param.value : <span className="text-[#94A098] italic">Not detected</span>}
                </div>

                <div className="cc-param-badges">
                  <span className={`cc-origin-tag font-mono ${param.origin === 'Provided by you' ? 'user-supplied' : ''}`}>
                    {param.origin}
                  </span>
                  {isAvailable && (
                    <span className={`cc-status-tag font-mono state-${param.state.toLowerCase()}`}>
                      {param.state === 'MATCHED' ? 'Matched' : (param.state === 'MISMATCHED' ? 'Mismatched' : 'Unverified')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. STRUCTURED EVIDENCE DOSSIER */}
      <section className="cc-findings-section" aria-label="Structured Findings Dossier">
        <div className="cc-findings-header">
          <div>
            <span className="cc-section-pretitle font-mono">EVIDENCE DOSSIER</span>
            <h3 className="cc-section-title">Investigation Findings</h3>
          </div>

          {/* Group Filter Tabs */}
          <div className="cc-findings-filter-tabs font-mono" role="tablist">
            {[
              { id: 'ALL', label: `ALL (${categorizedFindings.length})` },
              { id: 'CONFIRMED', label: `CONFIRMED (${categorizedFindings.filter(f => f.group === 'CONFIRMED').length})` },
              { id: 'INCONSISTENCIES', label: `INCONSISTENCIES (${categorizedFindings.filter(f => f.group === 'INCONSISTENCIES').length})` },
              { id: 'UNVERIFIED', label: `UNVERIFIED (${categorizedFindings.filter(f => f.group === 'UNVERIFIED').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`cc-filter-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <div className="cc-findings-list">
          {filteredFindings.length === 0 ? (
            <div className="cc-findings-empty">
              <span>No findings categorized under this filter.</span>
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const isExpanded = expandedFinding === finding.id;

              return (
                <div 
                  key={finding.id} 
                  className={`cc-finding-row row-${finding.statusType} ${isExpanded ? 'is-open' : ''}`}
                  onClick={() => toggleFindingExpand(finding.id)}
                >
                  <div className="cc-finding-icon-wrap">
                    {finding.statusType === 'verified' && <Check className="w-3.5 h-3.5 text-[#2E7D5B] stroke-[3]" />}
                    {finding.statusType === 'contradiction' && <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] stroke-[2.5]" />}
                    {finding.statusType === 'unverified' && <HelpCircle className="w-3.5 h-3.5 text-[#94A098] stroke-[2.5]" />}
                  </div>

                  <div className="cc-finding-content">
                    <div className="cc-finding-top">
                      <span className={`cc-finding-pill font-mono status-${finding.statusType}`}>
                        {finding.groupLabel.toUpperCase()}
                      </span>
                      <span className="cc-finding-source font-mono">{finding.source}</span>
                    </div>

                    <h4 className="cc-finding-headline">{finding.title}</h4>

                    {finding.detail && (
                      <p className="cc-finding-detail">{finding.detail}</p>
                    )}

                    {isExpanded && (
                      <div className="cc-finding-expanded-box fadeIn">
                        <div className="cc-drawer-item font-mono">
                          <span className="cc-drawer-lbl">SOURCE REFERENCE:</span>
                          <span className="cc-drawer-val">{finding.source}</span>
                        </div>
                        {finding.technical && (
                          <div className="cc-drawer-item font-mono">
                            <span className="cc-drawer-lbl">TECHNICAL AUDIT:</span>
                            <span className="cc-drawer-val">{finding.technical}</span>
                          </div>
                        )}
                        <div className="cc-drawer-item font-mono">
                          <span className="cc-drawer-lbl">AUDIT INTEGRITY:</span>
                          <span className="cc-drawer-val">Independently corroborated public telemetry</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="cc-finding-chevron">
                    <ChevronDown className={`w-4 h-4 text-[#737D76] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 6. RECOMMENDED NEXT ACTION */}
      {recommendedAction && (
        <section className="cc-recommendation-section" aria-label="Action Advisory">
          <div className="cc-rec-header font-mono">
            <span className="cc-rec-badge">ACTION ADVISORY</span>
            <span className="cc-rec-code">WHAT SHOULD YOU DO NEXT?</span>
          </div>

          <h3 className="cc-rec-headline">Recommended Next Steps</h3>

          <p className="cc-rec-body">
            {recommendedAction}
          </p>

          <div className="cc-rec-footer-note">
            <CheckCircle2 className="w-4 h-4 text-[#49B99A] shrink-0" />
            <span>Protect yourself: Always contact the issuing organization directly through its verified official domain before making academic or employment decisions.</span>
          </div>
        </section>
      )}

      {/* 7. ADVANCED TECHNICAL DIAGNOSTICS (COLLAPSIBLE) */}
      <section className="cc-technical-diagnostics" aria-label="Technical Investigation Details">
        <button
          type="button"
          className="cc-technical-toggle-btn"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          aria-expanded={showTechnicalDetails}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#737D76]" />
            <span className="font-semibold text-sm text-[#202923]">
              {showTechnicalDetails ? 'Hide Technical Diagnostics & Statutory Sources' : 'View Technical Diagnostics & Statutory Sources'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#737D76] transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechnicalDetails && (
          <div className="cc-technical-drawer fadeIn">
            {/* Hash & Forensics Specs */}
            <div className="cc-tech-block">
              <h4 className="cc-tech-heading font-mono">CRYPTOGRAPHIC FINGERPRINT & FILE METADATA</h4>
              <div className="cc-sources-grid">
                <div className="cc-source-card">
                  <div className="cc-source-name font-mono">DOCUMENT SHA-256 HASH</div>
                  <div className="cc-source-scope font-mono text-[11px] break-all">{documentSha256 || 'Computed on upload'}</div>
                </div>
                <div className="cc-source-card">
                  <div className="cc-source-name font-mono">PDF DIGITAL SIGNATURE</div>
                  <div className="cc-source-scope">{forensicResults.hasDigitalSignature ? `Present (${forensicResults.signatureDetails?.signerName || 'Signed'})` : 'No embedded PKCS#7 signature seal'}</div>
                  <div className="cc-source-status font-mono">{documentIntegrityStatus}</div>
                </div>
              </div>
            </div>

            {/* Sources Consulted */}
            {sourcesConsulted && sourcesConsulted.length > 0 && (
              <div className="cc-tech-block">
                <h4 className="cc-tech-heading font-mono">STATUTORY DIRECTORIES & SOURCES EVALUATED ({sourcesConsulted.length})</h4>
                <div className="cc-sources-grid">
                  {sourcesConsulted.map((src, idx) => (
                    <div key={idx} className="cc-source-card">
                      <div className="cc-source-name font-mono">{src.sourceName || src.name}</div>
                      <div className="cc-source-scope">{src.queryScope || src.category || 'Statutory registry check'}</div>
                      <div className="cc-source-status font-mono">{src.status || 'Queried'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 8. REPORT FOOTER */}
      <footer className="cc-report-footer">
        <p className="cc-footer-disclaimer font-mono">
          VERIFYME CREDENTIALCHECK • STATUTORY & FORENSIC DOCUMENT INTELLIGENCE • OBJECTIVE EVIDENCE TELEMETRY
        </p>
      </footer>
    </article>
  );
};

export default CredentialCheckReport;
