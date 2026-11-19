/**
 * Credential Cross-Validation Engine
 * 
 * Performs deterministic field-by-field cross-validation between extracted document claims
 * and independently corroborated external evidence from statutory registries, ATS records,
 * and cryptographic authorities.
 */

function crossValidateCredential({
  extractedClaims = {},
  issuerIdentity = {},
  officialSources = [],
  pdfAnalysis = null,
  forensics = {}
}) {
  const fields = extractedClaims.fields || {};
  const fieldComparisons = [];

  // Helper to record field validation
  const recordComparison = ({
    fieldLabel,
    claimedValue,
    verifiedValue,
    outcome, // EXACT_MATCH | PARTIAL_MATCH | MISMATCH | NOT_AVAILABLE | NOT_APPLICABLE
    sourceName,
    notes
  }) => {
    fieldComparisons.push({
      fieldLabel,
      claimedValue: claimedValue || 'Not extracted / Unstated',
      verifiedValue: verifiedValue || 'Not available from public source',
      outcome,
      sourceName: sourceName || 'Cross-Match Engine',
      notes: notes || ''
    });
  };

  // 1. Issuing Organization Comparison
  const claimedOrg = fields.issuingOrganization?.value || null;
  const officialOrg = issuerIdentity.primaryMatch ? issuerIdentity.primaryMatch.legalName : null;

  if (!claimedOrg) {
    recordComparison({
      fieldLabel: 'Issuing Organization',
      claimedValue: null,
      verifiedValue: officialOrg,
      outcome: 'NOT_AVAILABLE',
      sourceName: 'Official Statutory Registry',
      notes: 'No issuer name was identifiable in the document.'
    });
  } else if (officialOrg) {
    const isExact = claimedOrg.toLowerCase() === officialOrg.toLowerCase();
    const isPartial = claimedOrg.toLowerCase().includes(officialOrg.toLowerCase()) || 
                      officialOrg.toLowerCase().includes(claimedOrg.toLowerCase()) ||
                      (issuerIdentity.primaryMatch?.aliases || []).some(a => claimedOrg.toLowerCase().includes(a));
    
    if (isExact) {
      recordComparison({
        fieldLabel: 'Issuing Organization',
        claimedValue: claimedOrg,
        verifiedValue: officialOrg,
        outcome: 'EXACT_MATCH',
        sourceName: 'Statutory Registry Directory',
        notes: 'Claimed entity name matches official legal organization record.'
      });
    } else if (isPartial) {
      recordComparison({
        fieldLabel: 'Issuing Organization',
        claimedValue: claimedOrg,
        verifiedValue: officialOrg,
        outcome: 'PARTIAL_MATCH',
        sourceName: 'Statutory Registry Directory',
        notes: 'Claimed organization name matches known alias or common trade name of recognized entity.'
      });
    } else {
      recordComparison({
        fieldLabel: 'Issuing Organization',
        claimedValue: claimedOrg,
        verifiedValue: officialOrg,
        outcome: 'MISMATCH',
        sourceName: 'Statutory Registry Directory',
        notes: 'Discrepancy between stated organization name and registered legal entity name.'
      });
    }
  } else {
    recordComparison({
      fieldLabel: 'Issuing Organization',
      claimedValue: claimedOrg,
      verifiedValue: null,
      outcome: 'NOT_AVAILABLE',
      sourceName: 'Statutory Registry Directory',
      notes: 'Organization legal existence could not be confirmed in public central directory.'
    });
  }

  // 2. Issuer Domain Alignment
  const claimedDomain = issuerIdentity.queryDomain || null;
  const officialDomain = issuerIdentity.primaryMatch ? issuerIdentity.primaryMatch.domain : null;

  if (claimedDomain && officialDomain) {
    if (claimedDomain === officialDomain || claimedDomain.endsWith('.' + officialDomain)) {
      recordComparison({
        fieldLabel: 'Issuer Web Domain',
        claimedValue: claimedDomain,
        verifiedValue: officialDomain,
        outcome: 'EXACT_MATCH',
        sourceName: 'Authoritative DNS & Registry',
        notes: 'Digital domain matches official registered corporate web infrastructure.'
      });
    } else if (issuerIdentity.isLookalike) {
      recordComparison({
        fieldLabel: 'Issuer Web Domain',
        claimedValue: claimedDomain,
        verifiedValue: officialDomain,
        outcome: 'MISMATCH',
        sourceName: 'Domain Heuristics & DNS',
        notes: 'Critical lookalike/typosquatted domain detected imitating official issuer domain.'
      });
    } else {
      recordComparison({
        fieldLabel: 'Issuer Web Domain',
        claimedValue: claimedDomain,
        verifiedValue: officialDomain,
        outcome: 'MISMATCH',
        sourceName: 'Authoritative DNS & Registry',
        notes: `Domain '${claimedDomain}' is not recognized as official property of '${officialDomain}'.`
      });
    }
  } else if (claimedDomain) {
    recordComparison({
      fieldLabel: 'Issuer Web Domain',
      claimedValue: claimedDomain,
      verifiedValue: null,
      outcome: 'NOT_AVAILABLE',
      sourceName: 'Authoritative DNS & Registry',
      notes: 'No official benchmark domain available for comparison.'
    });
  } else {
    recordComparison({
      fieldLabel: 'Issuer Web Domain',
      claimedValue: null,
      verifiedValue: officialDomain,
      outcome: 'NOT_APPLICABLE',
      sourceName: 'Authoritative DNS & Registry',
      notes: 'No domain extracted from document.'
    });
  }

  // 3. Credential ID / Certificate Number
  const credId = fields.credentialId?.value || null;
  // Look for confirmation in officialSources (e.g. QR or portal probe)
  const qrSource = officialSources.find(s => s.sourceType === 'ISSUER_DIRECT_PORTAL');
  const qrEvidence = qrSource?.returnedEvidence;

  if (credId && qrEvidence?.credentialIdIncluded) {
    recordComparison({
      fieldLabel: 'Credential Identifier',
      claimedValue: credId,
      verifiedValue: `Present in validation endpoint (${qrEvidence.url.slice(0, 40)}...)`,
      outcome: 'EXACT_MATCH',
      sourceName: 'Issuer Verification Portal',
      notes: 'Certificate number is embedded in the issuer-validated QR routing target.'
    });
  } else if (credId) {
    recordComparison({
      fieldLabel: 'Credential Identifier',
      claimedValue: credId,
      verifiedValue: null,
      outcome: 'NOT_AVAILABLE',
      sourceName: 'Issuer Verification Registry',
      notes: 'Credential ID extracted from document, but live database lookup is unconfigured or consent-gated.'
    });
  } else {
    recordComparison({
      fieldLabel: 'Credential Identifier',
      claimedValue: null,
      verifiedValue: null,
      outcome: 'NOT_APPLICABLE',
      sourceName: 'Extraction Engine',
      notes: 'Certificate does not display a unique serial number or credential code.'
    });
  }

  // 4. Digital Signature & Signatory Seal
  const ccaSource = officialSources.find(s => s.sourceType === 'DIGITAL_SIGNATURE_FRAMEWORK');
  const ccaEvidence = ccaSource?.returnedEvidence;

  if (ccaEvidence?.hasDigitalSignature === false || !ccaEvidence) {
    recordComparison({
      fieldLabel: 'Digital Signature Integrity',
      claimedValue: fields.signatory?.value ? `Physical / Printed: ${fields.signatory.value}` : 'Unsigned / Scan',
      verifiedValue: 'No Cryptographic Signature Field',
      outcome: 'NOT_APPLICABLE',
      sourceName: 'Indian CCA Digital Signature Engine',
      notes: 'Document lacks PKCS#7 digital signature.'
    });
  } else if (ccaEvidence.alteredAfterSigning) {
    recordComparison({
      fieldLabel: 'Digital Signature Integrity',
      claimedValue: 'Sealed Digital PDF',
      verifiedValue: 'ALTERED_AFTER_SIGNING',
      outcome: 'MISMATCH',
      sourceName: 'Indian CCA Digital Signature Engine',
      notes: 'Tampering detected: Document bytes were altered or appended after digital signature was applied.'
    });
  } else if (ccaEvidence.cryptographicallyIntact) {
    recordComparison({
      fieldLabel: 'Digital Signature Integrity',
      claimedValue: 'Sealed Digital PDF',
      verifiedValue: ccaEvidence.caAuthority ? `CCA Licensed: ${ccaEvidence.caAuthority}` : 'Valid Digital Signature',
      outcome: 'EXACT_MATCH',
      sourceName: 'Indian CCA Digital Signature Engine',
      notes: 'Cryptographic byte-range integrity validated against licensed certifying authority.'
    });
  }

  // 5. Academic Marksheet Arithmetic Consistency Check
  let arithmeticResult = null;
  if (fields.academicMarksheet) {
    const am = fields.academicMarksheet;
    if (am.subjectCount > 0) {
      if (am.arithmeticConsistent) {
        arithmeticResult = {
          checked: true,
          consistent: true,
          subjectCount: am.subjectCount,
          computedTotalObtained: am.computedTotalObtained,
          computedTotalMax: am.computedTotalMax,
          percentage: am.computedTotalMax ? ((am.computedTotalObtained / am.computedTotalMax) * 100).toFixed(2) : null
        };
        recordComparison({
          fieldLabel: 'Marksheet Arithmetic',
          claimedValue: am.statedTotalObtained ? `Stated: ${am.statedTotalObtained}/${am.statedTotalMax}` : `${am.subjectCount} Subjects`,
          verifiedValue: `Sum: ${am.computedTotalObtained}/${am.computedTotalMax}`,
          outcome: 'EXACT_MATCH',
          sourceName: 'Mathematical Consistency Engine',
          notes: `Subject marks sum exactly equals stated grand total (${am.computedTotalObtained}/${am.computedTotalMax}).`
        });
      } else {
        arithmeticResult = {
          checked: true,
          consistent: false,
          subjectCount: am.subjectCount,
          statedTotalObtained: am.statedTotalObtained,
          computedTotalObtained: am.computedTotalObtained,
          statedTotalMax: am.statedTotalMax,
          computedTotalMax: am.computedTotalMax
        };
        recordComparison({
          fieldLabel: 'Marksheet Arithmetic',
          claimedValue: `Stated: ${am.statedTotalObtained}/${am.statedTotalMax}`,
          verifiedValue: `Actual Sum: ${am.computedTotalObtained}/${am.computedTotalMax}`,
          outcome: 'MISMATCH',
          sourceName: 'Mathematical Consistency Engine',
          notes: `Arithmetic inconsistency: Sum of individual subject marks (${am.computedTotalObtained}) does not equal stated grand total (${am.statedTotalObtained}).`
        });
      }
    }
  }

  // 6. Aggregate Claim Consistency Classification
  const mismatches = fieldComparisons.filter(f => f.outcome === 'MISMATCH');
  const exactMatches = fieldComparisons.filter(f => f.outcome === 'EXACT_MATCH');
  const partialMatches = fieldComparisons.filter(f => f.outcome === 'PARTIAL_MATCH');

  let consistencyStatus = 'INSUFFICIENT_EVIDENCE';
  if (mismatches.length > 0) {
    consistencyStatus = 'MATERIAL_MISMATCH';
  } else if (exactMatches.length >= 2) {
    consistencyStatus = 'CONSISTENT';
  } else if (exactMatches.length > 0 || partialMatches.length > 0) {
    consistencyStatus = 'PARTIAL_MATCH';
  }

  return {
    consistencyStatus, // CONSISTENT | PARTIAL_MATCH | MATERIAL_MISMATCH | INSUFFICIENT_EVIDENCE
    fieldComparisons,
    arithmeticResult,
    exactMatchCount: exactMatches.length,
    partialMatchCount: partialMatches.length,
    mismatchCount: mismatches.length
  };
}

module.exports = {
  crossValidateCredential
};
