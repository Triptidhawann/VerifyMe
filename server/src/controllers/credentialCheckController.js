const admin = require('../config/firebase');
const { processCredentialDocument, CredentialProcessingError } = require('../services/credentialDocumentProcessor');
const { discoverIssuerIdentity } = require('../services/credentialIssuerDiscovery');
const { queryOfficialSources } = require('../services/credentialSourceRegistry');
const { inspectDocumentForensics } = require('../services/credentialForensics');
const { crossValidateCredential } = require('../services/credentialCrossValidator');
const { performCredentialAssessment } = require('../services/credentialAssessmentEngine');
const {
  saveDevInvestigation,
  getDevHistory,
  getDevInvestigation,
  deleteDevInvestigation
} = require('../services/credentialDevStore');

/**
 * @desc    Execute a full CredentialCheck forensic and statutory investigation
 * @route   POST /api/credentialcheck/investigate
 * @access  Private (Firebase Auth required)
 */
const investigateCredential = async (req, res, next) => {
  try {
    const {
      fileBase64,
      fileName,
      mimeType,
      documentCategory,
      issuerName,
      issuerWebsite,
      certificateNumber,
      candidateConsent
    } = req.body;

    if (!fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a certificate document (PDF, PNG, or JPEG).'
      });
    }

    // 1. Process Document: validate buffer, compute SHA-256, OCR/PDF parsing, QR scanning
    let processed;
    try {
      processed = await processCredentialDocument({
        fileBase64,
        fileName,
        mimeType,
        documentCategory,
        userSupplied: {
          issuerName,
          issuerWebsite,
          certificateNumber
        }
      });
    } catch (procErr) {
      return res.status(procErr.statusCode || 400).json({
        success: false,
        error: procErr.message,
        code: procErr.code || 'PROCESSING_ERROR'
      });
    }

    const {
      documentSha256,
      category,
      numPages,
      claimExtraction,
      pdfAnalysis,
      qrResult
    } = processed;

    // 2. Issuer Discovery Engine
    const issuerIdentity = await discoverIssuerIdentity({
      extractedOrgName: claimExtraction.fields?.issuingOrganization?.value || null,
      extractedWebsite: claimExtraction.fields?.verificationUrl?.value || null,
      extractedEmail: claimExtraction.fields?.contactEmail?.value || null,
      userSuppliedOrg: issuerName,
      userSuppliedWebsite: issuerWebsite
    });

    // 3. Official Source Registry & Modular Adapters
    const sourceResults = await queryOfficialSources({
      category,
      claims: claimExtraction,
      pdfAnalysis,
      issuerIdentity
    });

    // 4. Document Forensics Engine
    const forensics = inspectDocumentForensics({
      pdfAnalysis,
      qrResult,
      extractedClaims: claimExtraction,
      ccaSignatureResult: sourceResults.digitalSignatureResult
    });

    // 5. Credential Cross-Validation Engine
    const crossValidation = crossValidateCredential({
      extractedClaims: claimExtraction,
      issuerIdentity,
      officialSources: sourceResults.sourcesConsulted,
      pdfAnalysis,
      forensics
    });

    // 6. Deterministic Assessment Engine & Synthesis
    const assessment = await performCredentialAssessment({
      documentSha256,
      fileName: processed.fileName,
      category,
      numPages,
      extractedClaims: claimExtraction,
      pdfAnalysis,
      issuerIdentity,
      officialSources: sourceResults.sourcesConsulted,
      forensics,
      crossValidation
    });

    const serverTimestampIso = new Date().toISOString();

    // 7. Prepare Canonical Investigation Record (Strict privacy: NO raw files, NO Aadhaar)
    const investigationRecord = {
      category,
      fileName: processed.fileName,
      documentSha256,
      numPages,
      outcome: assessment.outcome,
      summary: assessment.summary,
      recommendedAction: assessment.recommendedAction,
      dimensions: assessment.dimensions,
      extractedFields: claimExtraction.fields,
      issuerIdentity: {
        queryOrg: issuerIdentity.queryOrg,
        queryDomain: issuerIdentity.queryDomain,
        officialDomainCandidate: issuerIdentity.primaryMatch ? issuerIdentity.primaryMatch.domain : null,
        identityStatus: issuerIdentity.identityStatus,
        confidenceReason: issuerIdentity.confidenceReason,
        isLookalike: issuerIdentity.isLookalike,
        domainAligned: issuerIdentity.domainAligned,
        findings: issuerIdentity.findings || [],
        matchedEntity: issuerIdentity.primaryMatch ? {
          legalName: issuerIdentity.primaryMatch.legalName,
          category: issuerIdentity.primaryMatch.category,
          domain: issuerIdentity.primaryMatch.domain
        } : null
      },
      forensicResults: {
        integrityStatus: forensics.integrityStatus,
        hasAnomalies: forensics.hasAnomalies,
        anomalies: forensics.anomalies,
        findings: forensics.findings,
        hasDigitalSignature: Boolean(pdfAnalysis?.hasDigitalSignature)
      },
      crossValidationResults: {
        consistencyStatus: crossValidation.consistencyStatus,
        fieldComparisons: crossValidation.fieldComparisons,
        arithmeticResult: crossValidation.arithmeticResult,
        exactMatchCount: crossValidation.exactMatchCount,
        partialMatchCount: crossValidation.partialMatchCount,
        mismatchCount: crossValidation.mismatchCount
      },
      sourcesConsulted: sourceResults.sourcesConsulted,
      checkpoints: assessment.checkpoints,
      technicalAudit: {
        documentSha256,
        fileName: processed.fileName,
        mimeType: processed.mimeType,
        sizeBytes: processed.sizeBytes,
        numPages,
        pdfMetadata: pdfAnalysis ? {
          creator: pdfAnalysis.metadata?.Creator || pdfAnalysis.metadata?.creator || null,
          producer: pdfAnalysis.metadata?.Producer || pdfAnalysis.metadata?.producer || null,
          creationDate: pdfAnalysis.metadata?.CreationDate || pdfAnalysis.metadata?.creationDate || null,
          modDate: pdfAnalysis.metadata?.ModDate || pdfAnalysis.metadata?.modDate || null,
          revisionCount: pdfAnalysis.revisionCount || 1,
          hasIncrementalUpdates: Boolean(pdfAnalysis.hasIncrementalUpdates),
          hasDigitalSignature: Boolean(pdfAnalysis.hasDigitalSignature),
          modifiedAfterCreation: Boolean(pdfAnalysis.modifiedAfterCreation)
        } : null,
        qrDetails: qrResult ? {
          detected: Boolean(qrResult.found),
          rawPayload: qrResult.data || null
        } : null,
        extractionEngine: processed.mimeType === 'application/pdf' ? 'pdf-parse native text extraction' : 'Tesseract.js OCR'
      },
      createdAtIso: serverTimestampIso
    };

    // 8. Authoritative Persistence (Firestore in production or credentialed environments; persistent local store in dev)
    const isMockDb = Boolean(req.firestoreDb || (req.app && req.app.get('firestoreDb')));
    const hasCredentials = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      isMockDb
    );

    if (!hasCredentials) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          error: 'Authoritative persistence to database is unavailable in this production environment.'
        });
      }

      // In local development, authoritatively persist to dev file store scoped strictly to user UID
      const savedRecord = saveDevInvestigation(req.user.uid, investigationRecord);

      return res.status(200).json({
        success: true,
        message: 'Credential investigation completed and recorded successfully.',
        investigation: savedRecord
      });
    }

    const firestoreDb = (req.app && req.app.get('firestoreDb')) || req.firestoreDb || admin.firestore();
    const userDocRef = firestoreDb.collection('users').doc(req.user.uid).collection('credentialcheck_investigations').doc();

    const firestoreServerTimestamp = (admin.firestore && admin.firestore.FieldValue && typeof admin.firestore.FieldValue.serverTimestamp === 'function')
      ? admin.firestore.FieldValue.serverTimestamp()
      : serverTimestampIso;

    try {
      await userDocRef.set({
        id: userDocRef.id,
        userId: req.user.uid,
        ...investigationRecord,
        createdAt: firestoreServerTimestamp
      });
    } catch (persistErr) {
      console.error('[CredentialCheck] Persistence failed:', persistErr.message || persistErr);
      return res.status(500).json({
        success: false,
        error: 'Investigation analysis succeeded, but authoritative persistence to database failed.',
        details: persistErr.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Credential investigation completed and recorded successfully.',
      investigation: {
        id: userDocRef.id,
        createdAt: serverTimestampIso,
        ...investigationRecord
      }
    });
  } catch (error) {
    console.error('[CredentialCheck] Error in investigation pipeline:', error);
    next(error);
  }
};

/**
 * @desc    Get user's CredentialCheck investigation history
 * @route   GET /api/credentialcheck/history
 * @access  Private (Firebase Auth required)
 */
const getCredentialHistory = async (req, res, next) => {
  try {
    const isMockDb = Boolean(req.firestoreDb || (req.app && req.app.get('firestoreDb')));
    const hasCredentials = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      isMockDb
    );

    if (!hasCredentials) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          error: 'Database persistence is unavailable in production.'
        });
      }
      const history = getDevHistory(req.user.uid);
      return res.status(200).json({ success: true, history });
    }

    const firestoreDb = (req.app && req.app.get('firestoreDb')) || req.firestoreDb || admin.firestore();
    const snapshot = await firestoreDb
      .collection('users')
      .doc(req.user.uid)
      .collection('credentialcheck_investigations')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const history = [];
    snapshot.forEach(doc => {
      history.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('[CredentialCheck] Error fetching history:', error);
    next(error);
  }
};

/**
 * @desc    Get single CredentialCheck investigation record by ID
 * @route   GET /api/credentialcheck/investigations/:id
 * @access  Private (Firebase Auth required)
 */
const getCredentialInvestigation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isMockDb = Boolean(req.firestoreDb || (req.app && req.app.get('firestoreDb')));
    const hasCredentials = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      isMockDb
    );

    if (!hasCredentials) {
      const record = getDevInvestigation(req.user.uid, id);
      if (!record) {
        return res.status(404).json({
          success: false,
          error: 'Investigation record not found or access denied.'
        });
      }
      return res.status(200).json({
        success: true,
        investigation: record
      });
    }

    const firestoreDb = (req.app && req.app.get('firestoreDb')) || req.firestoreDb || admin.firestore();
    const docRef = firestoreDb.collection('users').doc(req.user.uid).collection('credentialcheck_investigations').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investigation record not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      investigation: { id: docSnap.id, ...docSnap.data() }
    });
  } catch (error) {
    console.error('[CredentialCheck] Error fetching record:', error);
    next(error);
  }
};

/**
 * @desc    Delete a retained CredentialCheck investigation record
 * @route   DELETE /api/credentialcheck/investigations/:id
 * @access  Private (Firebase Auth required)
 */
const deleteCredentialInvestigation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isMockDb = Boolean(req.firestoreDb || (req.app && req.app.get('firestoreDb')));
    const hasCredentials = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      isMockDb
    );

    if (!hasCredentials) {
      const deleted = deleteDevInvestigation(req.user.uid, id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Record not found or already deleted.'
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Investigation record successfully deleted.'
      });
    }

    const firestoreDb = (req.app && req.app.get('firestoreDb')) || req.firestoreDb || admin.firestore();
    const docRef = firestoreDb.collection('users').doc(req.user.uid).collection('credentialcheck_investigations').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        error: 'Record not found or already deleted.'
      });
    }

    await docRef.delete();

    return res.status(200).json({
      success: true,
      message: 'Investigation record successfully deleted.'
    });
  } catch (error) {
    console.error('[CredentialCheck] Error deleting record:', error);
    next(error);
  }
};

/**
 * @desc    Get list of supported official verification sources and their capabilities
 * @route   GET /api/credentialcheck/sources
 * @access  Public / Authenticated
 */
const getVerificationSources = (req, res) => {
  res.status(200).json({
    success: true,
    sources: [
      {
        id: 'digilocker_nad',
        name: 'National Academic Depository (NAD / DigiLocker)',
        category: 'Academic Records',
        url: 'https://nad.digilocker.gov.in/',
        status: process.env.DIGILOCKER_NAD_API_KEY ? 'ACTIVE_PARTNER_API' : 'CONSENT_BASED_EXTERNAL_ROUTE',
        description: 'Statutory national depository for academic degrees, marks, and certificates. Requires individual candidate consent.'
      },
      {
        id: 'ugc_registry',
        name: 'University Grants Commission (UGC) Gazette & Recognition',
        category: 'Higher Education Institutional Recognition',
        url: 'https://www.ugc.gov.in/',
        status: 'ACTIVE_STATUTORY_INDEX',
        description: 'Authoritative statutory registry of Central, State, Deemed, Private universities and Institutes of National Importance.'
      },
      {
        id: 'mca_master_data',
        name: 'Ministry of Corporate Affairs (MCA21)',
        category: 'Corporate Identity & Registration',
        url: 'https://www.mcacdm.nic.in/company-master-details',
        status: 'ACTIVE_DIRECT_AND_PORTAL',
        description: 'Company master data, CIN status, incorporation dates, and registered office records under Companies Act.'
      },
      {
        id: 'cca_digital_signatures',
        name: 'Indian CCA Cryptographic Signature Framework',
        category: 'Document Integrity & PKCS#7 Sealed Certificates',
        url: 'https://cca.gov.in/',
        status: 'ACTIVE_CRYPTOGRAPHIC_VERIFICATION',
        description: 'Validates X.509 certificate chains and byte-range integrity against Indian Licensed CAs (eMudhra, Capricorn, nCode, IDsign, etc.).'
      },
      {
        id: 'gstin_taxpayer',
        name: 'Goods & Services Tax (GST) Registry',
        category: 'Statutory Taxpayer Verification',
        url: 'https://www.gst.gov.in/',
        status: 'ACTIVE_SYNTAX_AND_STATE_MAPPING',
        description: 'Validates 15-character GSTIN structure, state code allocation, and PAN reference.'
      },
      {
        id: 'issuer_qr_portals',
        name: 'Issuer-Specific Optical QR & Online Portals',
        category: 'Issuer Direct Verification',
        url: null,
        status: 'ACTIVE_SSRF_PROTECTED_PROBE',
        description: 'Resolves embedded QR code endpoints with DNS verification and anti-SSRF address pinning.'
      }
    ]
  });
};

module.exports = {
  investigateCredential,
  getCredentialHistory,
  getCredentialInvestigation,
  deleteCredentialInvestigation,
  getVerificationSources
};
