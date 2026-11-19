const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateDocumentBuffer,
  computeSha256,
  extractStructuredClaims,
  suggestCategory,
  analyzePdfStructureAndSignatures,
  CATEGORIES,
  CredentialProcessingError
} = require('../src/services/credentialDocumentProcessor');

const {
  discoverIssuerIdentity,
  detectLookalikeDomain,
  RECOGNIZED_INDIAN_ISSUERS
} = require('../src/services/credentialIssuerDiscovery');

const { queryUgcRegistry } = require('../src/services/credentialSourceAdapters/ugcAdapter');
const { queryMcaRegistry, CIN_REGEX } = require('../src/services/credentialSourceAdapters/mcaAdapter');
const { verifyDigitalSignatures } = require('../src/services/credentialSourceAdapters/ccaDigitalSignatureAdapter');
const { queryGstinRegistry } = require('../src/services/credentialSourceAdapters/gstinAdapter');
const { queryIssuerVerificationEndpoint } = require('../src/services/credentialSourceAdapters/issuerQrAdapter');
const { queryDigiLockerNad } = require('../src/services/credentialSourceAdapters/nadAdapter');

const { inspectDocumentForensics } = require('../src/services/credentialForensics');
const { crossValidateCredential } = require('../src/services/credentialCrossValidator');
const {
  determineOverallOutcome,
  determineIssuanceStatus,
  OUTCOMES
} = require('../src/services/credentialAssessmentEngine');

test('▶ CredentialCheck: Document Intake & Processing', async (t) => {
  await t.test('should validate valid PDF magic bytes (%PDF-)', () => {
    const validPdfBuffer = Buffer.from('%PDF-1.7\nSample content\n%%EOF');
    const result = validateDocumentBuffer(validPdfBuffer, 'application/pdf', 'degree.pdf');
    assert.equal(result.detectedType, 'application/pdf');
    assert.equal(result.sizeBytes, validPdfBuffer.length);
  });

  await t.test('should validate valid PNG magic bytes', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    const result = validateDocumentBuffer(pngBuffer, 'image/png', 'cert.png');
    assert.equal(result.detectedType, 'image/png');
  });

  await t.test('should validate valid JPEG magic bytes', () => {
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
    const result = validateDocumentBuffer(jpegBuffer, 'image/jpeg', 'cert.jpg');
    assert.equal(result.detectedType, 'image/jpeg');
  });

  await t.test('should reject invalid or unsupported files (missing magic bytes)', () => {
    const invalidBuffer = Buffer.from('Plain text fake certificate file');
    assert.throws(
      () => validateDocumentBuffer(invalidBuffer, 'text/plain', 'fake.txt'),
      (err) => err.code === 'INVALID_FILE_TYPE'
    );
  });

  await t.test('should reject oversized documents (> 10MB)', () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
    largeBuffer.write('%PDF-');
    assert.throws(
      () => validateDocumentBuffer(largeBuffer, 'application/pdf', 'huge.pdf'),
      (err) => err.code === 'FILE_TOO_LARGE'
    );
  });

  await t.test('should compute immutable SHA-256 fingerprint', () => {
    const sample = Buffer.from('%PDF-1.4 sample certificate document');
    const hash = computeSha256(sample);
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64);
  });

  await t.test('should auto-suggest categories accurately from document text', () => {
    assert.equal(suggestCategory('Semester Grade Card and Statement of Marks'), CATEGORIES.ACADEMIC);
    assert.equal(suggestCategory('Summer Internship Certificate awarded to Rahul'), CATEGORIES.INTERNSHIP);
    assert.equal(suggestCategory('Relieving and Experience Letter from HR'), CATEGORIES.EXPERIENCE);
    assert.equal(suggestCategory('Industrial Training Workshop on Cloud'), CATEGORIES.TRAINING);
    assert.equal(suggestCategory('Certified Professional Credential ID 9821'), CATEGORIES.PROFESSIONAL_CERTIFICATION);
  });

  await t.test('should extract structured fields across categories', () => {
    const academicText = `
      This is to certify that Rahul Sharma
      University of Delhi
      Degree of Bachelor of Technology
      Certificate No: DU-2023-89102
      Issued on: 15 June 2023
      Mathematics 85 100
      Physics 75 100
      Computer Science 90 100
      Total Marks: 250 / 300
    `;
    const extraction = extractStructuredClaims(academicText, CATEGORIES.ACADEMIC);
    assert.equal(extraction.fields.holderName.value, 'Rahul Sharma');
    assert.equal(extraction.fields.issuingOrganization.value, 'University of Delhi');
    assert.equal(extraction.fields.credentialId.value, 'DU-2023-89102');
    assert.equal(extraction.fields.academicMarksheet.arithmeticConsistent, true);
    assert.equal(extraction.fields.academicMarksheet.computedTotalObtained, 250);
  });
});

test('▶ CredentialCheck: Issuer Discovery Engine', async (t) => {
  await t.test('should identify recognized Indian enterprise entity', async () => {
    const res = await discoverIssuerIdentity({
      extractedOrgName: 'Tata Consultancy Services Limited',
      extractedWebsite: 'tcs.com'
    });
    assert.equal(res.identityStatus, 'ESTABLISHED');
    assert.equal(res.primaryMatch?.legalName, 'Tata Consultancy Services Limited');
    assert.equal(res.domainAligned, true);
  });

  await t.test('should identify recognized Indian Central University', async () => {
    const res = await discoverIssuerIdentity({
      extractedOrgName: 'University of Delhi',
      extractedWebsite: 'du.ac.in'
    });
    assert.equal(res.identityStatus, 'ESTABLISHED');
    assert.equal(res.primaryMatch?.legalName, 'University of Delhi');
    assert.equal(res.primaryMatch?.category, 'CENTRAL_UNIVERSITY');
  });

  await t.test('should detect lookalike / typosquatted impersonation domain', () => {
    const isLookalike1 = detectLookalikeDomain('tcs-careers-portal.com', 'tcs.com');
    const isLookalike2 = detectLookalikeDomain('infosyss.com', 'infosys.com');
    assert.equal(isLookalike2, true);
  });

  await t.test('should flag ambiguous organization names without fake selection', async () => {
    const res = await discoverIssuerIdentity({
      extractedOrgName: 'Apex Global Training Solutions',
      extractedWebsite: null
    });
    assert.notEqual(res.identityStatus, 'ESTABLISHED');
    assert.equal(res.primaryMatch, null);
  });
});

test('▶ CredentialCheck: Statutory Registries & Adapters', async (t) => {
  await t.test('UGC Registry: should confirm recognized central university', async () => {
    const res = await queryUgcRegistry({ institutionName: 'University of Delhi' });
    assert.equal(res.status, 'CONFIRMED');
    assert.equal(res.returnedEvidence?.ugcRecognized, true);
  });

  await t.test('UGC Registry: should explicitly reject unaccredited/fake university from gazette alert list', async () => {
    const res = await queryUgcRegistry({ institutionName: 'Commercial University Ltd. Daryaganj, Delhi' });
    assert.equal(res.status, 'REJECTED');
    assert.equal(res.returnedEvidence?.flaggedAsFake, true);
  });

  await t.test('DigiLocker NAD: should return UNAVAILABLE with consent requirement when API unconfigured', async () => {
    const res = await queryDigiLockerNad({ rollNumber: 'DU-8921', universityName: 'Delhi University', consentObtained: false });
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.returnedEvidence?.consentRequired, true);
  });

  await t.test('MCA Registry: should validate valid CIN syntax and known corporate issuer', async () => {
    assert.equal(CIN_REGEX.test('L22210MH1995PLC084781'), true);
    const res = await queryMcaRegistry({ companyName: 'Tata Consultancy Services Limited', cin: 'L22210MH1995PLC084781' });
    assert.equal(res.status, 'CONFIRMED');
    assert.equal(res.returnedEvidence?.status, 'ACTIVE');
  });

  await t.test('MCA Registry: should return UNAVAILABLE with manual lookup route without scraping CAPTCHA', async () => {
    const res = await queryMcaRegistry({ companyName: 'Random Unknown Private Enterprise Pvt Ltd' });
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.returnedEvidence?.automatedAccessGated, true);
    assert.ok(res.manualVerificationUrl);
  });

  await t.test('GSTIN Registry: should validate 15-character statutory format and state mapping', async () => {
    // 27 (Maharashtra) + AAPCS1234F + 1 + Z + 5
    const res = await queryGstinRegistry({ gstin: '27AAPCS1234F1Z5' });
    assert.equal(res.status, 'PARTIALLY_CONFIRMED');
    assert.equal(res.returnedEvidence?.stateName, 'Maharashtra');
  });

  await t.test('GSTIN Registry: should reject invalid GSTIN syntax', async () => {
    const res = await queryGstinRegistry({ gstin: 'INVALID_GSTIN_123' });
    assert.equal(res.status, 'REJECTED');
  });
});

test('▶ CredentialCheck: Document Forensics & CCA Digital Signatures', async (t) => {
  await t.test('should identify altered PDF after digital signature', async () => {
    const mockPdfAnalysis = {
      hasDigitalSignature: true,
      signatures: [{
        subFilter: 'adbe.pkcs7.detached',
        byteRange: [0, 1000, 2000, 3000],
        fileLength: 6000,
        signatureEndOffset: 5000,
        alteredAfterSigning: true,
        contentsHex: null
      }]
    };
    const cca = await verifyDigitalSignatures(mockPdfAnalysis);
    assert.equal(cca.status, 'REJECTED');
    assert.equal(cca.signatureOutcome, 'SIGNATURE_INVALID');
  });

  await t.test('should gracefully handle non-digitally signed document without calling it fraud', async () => {
    const mockPdfAnalysis = {
      hasDigitalSignature: false,
      signatures: []
    };
    const cca = await verifyDigitalSignatures(mockPdfAnalysis);
    assert.equal(cca.status, 'NOT_APPLICABLE');
    assert.equal(cca.signatureOutcome, 'NO_SIGNATURE_PRESENT');

    const forensics = inspectDocumentForensics({
      pdfAnalysis: mockPdfAnalysis,
      ccaSignatureResult: cca
    });
    assert.equal(forensics.integrityStatus, 'NO_SIGNATURE_PRESENT');
    assert.equal(forensics.hasInvalidSignature, false);
  });

  await t.test('should flag consumer design tool metadata (e.g. Canva) for academic/corporate certificates', () => {
    const mockPdfAnalysis = {
      metadata: {
        producer: 'Canva PDF Generator',
        creator: 'Canva Design App',
        creationDateRaw: 'D:20230601',
        modDateRaw: 'D:20230602'
      },
      hasIncrementalUpdates: false,
      revisionCount: 1,
      modifiedAfterCreation: true
    };
    const forensics = inspectDocumentForensics({
      pdfAnalysis: mockPdfAnalysis,
      ccaSignatureResult: null
    });
    assert.equal(forensics.integrityStatus, 'MODIFICATION_INDICATORS');
    assert.ok(forensics.anomalies.some(a => a.title.includes('Design/Modification Software')));
  });
});

test('▶ CredentialCheck: Anti-SSRF Protection on Verification Endpoints', async (t) => {
  await t.test('should block private/internal IP endpoints in verification URLs', async () => {
    const res1 = await queryIssuerVerificationEndpoint({ verificationUrl: 'http://127.0.0.1:8080/verify?id=123' });
    assert.equal(res1.status, 'REJECTED');
    assert.equal(res1.verificationMethod, 'SSRF_PROTECTION_GATE');

    const res2 = await queryIssuerVerificationEndpoint({ verificationUrl: 'http://10.0.0.5/verify' });
    assert.equal(res2.status, 'REJECTED');

    const res3 = await queryIssuerVerificationEndpoint({ verificationUrl: 'http://169.254.169.254/latest/meta-data' });
    assert.equal(res3.status, 'REJECTED');
  });

  await t.test('should reject non-HTTP dangerous schemes (e.g. file://, gopher://)', async () => {
    const res = await queryIssuerVerificationEndpoint({ verificationUrl: 'file:///etc/passwd' });
    assert.equal(res.status, 'REJECTED');
  });
});

test('▶ CredentialCheck: Cross-Validation & Marksheet Arithmetic', async (t) => {
  await t.test('should flag arithmetic inconsistency in academic marksheet', () => {
    const mockClaims = {
      fields: {
        academicMarksheet: {
          subjectCount: 3,
          computedTotalObtained: 210,
          computedTotalMax: 300,
          statedTotalObtained: 280, // False total stated!
          statedTotalMax: 300,
          arithmeticConsistent: false
        }
      }
    };
    const cross = crossValidateCredential({
      extractedClaims: mockClaims,
      issuerIdentity: {},
      officialSources: [],
      forensics: {}
    });
    assert.equal(cross.consistencyStatus, 'MATERIAL_MISMATCH');
    assert.equal(cross.mismatchCount, 1);
    assert.equal(cross.arithmeticResult.consistent, false);
  });

  await t.test('should confirm arithmetic consistency when subject marks add up', () => {
    const mockClaims = {
      fields: {
        academicMarksheet: {
          subjectCount: 3,
          computedTotalObtained: 240,
          computedTotalMax: 300,
          statedTotalObtained: 240,
          statedTotalMax: 300,
          arithmeticConsistent: true
        }
      }
    };
    const cross = crossValidateCredential({
      extractedClaims: mockClaims,
      issuerIdentity: {},
      officialSources: [],
      forensics: {}
    });
    assert.equal(cross.arithmeticResult.consistent, true);
    assert.ok(cross.fieldComparisons.some(f => f.fieldLabel === 'Marksheet Arithmetic' && f.outcome === 'EXACT_MATCH'));
  });
});

test('▶ CredentialCheck: Authoritative Outcome Rules', async (t) => {
  await t.test('Rule 1: Should flag SUSPICIOUS if digital signature altered after signing', () => {
    const outcome = determineOverallOutcome({
      issuerIdentityStatus: 'ESTABLISHED',
      documentIntegrityStatus: 'SIGNATURE_INVALID',
      issuanceStatus: 'UNCONFIRMED',
      claimConsistencyStatus: 'CONSISTENT',
      isLookalikeDomain: false,
      hasArithmeticMismatch: false
    });
    assert.equal(outcome, OUTCOMES.SUSPICIOUS);
  });

  await t.test('Rule 2: Should flag SUSPICIOUS if marksheet arithmetic fails', () => {
    const outcome = determineOverallOutcome({
      issuerIdentityStatus: 'ESTABLISHED',
      documentIntegrityStatus: 'NO_SIGNATURE_PRESENT',
      issuanceStatus: 'UNCONFIRMED',
      claimConsistencyStatus: 'MATERIAL_MISMATCH',
      isLookalikeDomain: false,
      hasArithmeticMismatch: true
    });
    assert.equal(outcome, OUTCOMES.SUSPICIOUS);
  });

  await t.test('Rule 3: Company existing + plain PDF must NOT grant false VERIFIED (Zero-Trust)', () => {
    const outcome = determineOverallOutcome({
      issuerIdentityStatus: 'ESTABLISHED',
      documentIntegrityStatus: 'NO_SIGNATURE_PRESENT',
      issuanceStatus: 'UNCONFIRMED',
      claimConsistencyStatus: 'PARTIAL_MATCH',
      isLookalikeDomain: false,
      hasArithmeticMismatch: false
    });
    assert.equal(outcome, OUTCOMES.PARTIALLY_VERIFIED);
    assert.notEqual(outcome, OUTCOMES.VERIFIED);
  });

  await t.test('Rule 4: VERIFIED requires issuer confirmation and consistent claims', () => {
    const outcome = determineOverallOutcome({
      issuerIdentityStatus: 'ESTABLISHED',
      documentIntegrityStatus: 'SIGNATURE_VALID',
      issuanceStatus: 'CONFIRMED_BY_ISSUER',
      claimConsistencyStatus: 'CONSISTENT',
      isLookalikeDomain: false,
      hasArithmeticMismatch: false
    });
    assert.equal(outcome, OUTCOMES.VERIFIED);
  });

  await t.test('Rule 5: INSUFFICIENT_EVIDENCE when public confirmation is absent', () => {
    const outcome = determineOverallOutcome({
      issuerIdentityStatus: 'UNRESOLVED',
      documentIntegrityStatus: 'NO_SIGNATURE_PRESENT',
      issuanceStatus: 'UNCONFIRMED',
      claimConsistencyStatus: 'INSUFFICIENT_EVIDENCE',
      isLookalikeDomain: false,
      hasArithmeticMismatch: false
    });
    assert.equal(outcome, OUTCOMES.INSUFFICIENT_EVIDENCE);
  });
});
