const admin = require('../config/firebase');
const { processJobShieldInput, JobShieldProcessingError } = require('../services/jobShieldDocumentProcessor');
const { extractRecruitmentClaims } = require('../services/jobShieldExtractor');
const { investigateJobListing } = require('../services/jobShieldJobListingService');
const { investigateSenderAndDomain, investigateProcessIntegrity } = require('../services/jobShieldRecruiterService');
const { performJobShieldAssessment } = require('../services/jobShieldAssessmentEngine');

/**
 * @desc    Execute a full JobShield recruitment fraud investigation
 * @route   POST /api/jobshield/investigate
 * @access  Private (Firebase Auth required)
 */
const investigateJob = async (req, res, next) => {
  try {
    const {
      submissionType,
      rawText,
      fileBase64,
      fileName,
      url,
      claimedCompany,
      claimedWebsite
    } = req.body;

    if (!submissionType) {
      return res.status(400).json({
        success: false,
        error: 'Please provide submissionType (text, pdf, image, or url).'
      });
    }

    // 1. Process Document/Input to extract plain text
    let processed;
    try {
      processed = await processJobShieldInput({
        submissionType,
        rawText,
        fileBase64,
        fileName,
        url,
        claimedCompany,
        claimedWebsite
      });
    } catch (procErr) {
      return res.status(procErr.statusCode || 400).json({
        success: false,
        error: procErr.message,
        code: procErr.code || 'PROCESSING_ERROR'
      });
    }

    // 2. Extract Structured Recruitment Claims (Deterministic + AI)
    const extractionResult = await extractRecruitmentClaims(processed.text, {
      claimedCompany,
      claimedWebsite
    });
    const claims = extractionResult.claims;

    // 3. Investigation Engine A: Official ATS Job Listing Verification
    const listingInvestigation = await investigateJobListing({
      companyName: claims.companyName,
      claimedDomain: claims.claimedDomain,
      jobTitle: claims.jobTitle,
      jobId: claims.jobId,
      applicationUrl: claims.applicationUrl
    });

    // 4. Investigation Engine B: Recruiter & Domain Verification
    const recruiterInvestigation = await investigateSenderAndDomain({
      senderEmail: claims.senderEmail,
      replyToEmail: claims.replyToEmail,
      claimedDomain: claims.claimedDomain,
      companyName: claims.companyName
    });

    // 5. Recruitment Process Integrity Verification
    const processInvestigation = investigateProcessIntegrity({
      paymentRequests: claims.paymentRequests,
      sensitiveDocRequests: claims.sensitiveDocRequests,
      urgencyTactics: claims.urgencyTactics
    });

    // 6. Evidence-Based Assessment
    const assessment = await performJobShieldAssessment({
      submissionType,
      extractedClaims: claims,
      listingInvestigation,
      recruiterInvestigation,
      processInvestigation
    });

    const serverTimestampIso = new Date().toISOString();

    // 7. Authoritative Persistence to Firestore
    // Document path: users/{uid}/jobshield_investigations/{investigationId}
    const isMockDb = Boolean(req.firestoreDb || (req.app && req.app.get('firestoreDb')));
    const hasCredentials = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      isMockDb
    );

    const investigationRecord = {
      submissionType,
      fileName: fileName || null,
      claimedCompany: claims.companyName || null,
      claimedDomain: claims.claimedDomain || null,
      jobTitle: claims.jobTitle || null,
      jobId: claims.jobId || null,
      senderEmail: claims.senderEmail || null,
      outcome: assessment.outcome,
      summary: assessment.summary,
      recommendedAction: assessment.recommendedAction,
      claims: assessment.claims,
      verifiedFacts: assessment.verifiedFacts,
      contradictions: assessment.contradictions,
      suspiciousIndicators: assessment.suspiciousIndicators,
      unverifiedItems: assessment.unverifiedItems,
      sourcesConsulted: assessment.sourcesConsulted || [],
      checkpoints: assessment.checkpoints || [],
      materialFindings: assessment.materialFindings,
      listingVerdict: listingInvestigation.listingVerdict,
      listingBestMatch: listingInvestigation.bestMatch,
      listingEvidence: listingInvestigation.evidence,
      senderDomainAligned: recruiterInvestigation.isDomainAligned,
      senderLookalike: recruiterInvestigation.isLookalikeDomain,
      processRedFlagsCount: processInvestigation.findings.length,
      createdAtIso: serverTimestampIso
    };

    if (!hasCredentials && process.env.NODE_ENV !== 'production') {
      console.warn(
        '\n⚠️ [VerifyMe JobShield Dev Notice] Firebase service account credentials not found in server/.env.\n' +
        '   Investigation completed successfully, but Firestore persistence was skipped in local dev.\n'
      );

      return res.status(200).json({
        success: true,
        message: 'Investigation completed successfully.',
        investigation: {
          id: 'js_dev_' + Date.now(),
          createdAt: serverTimestampIso,
          ...investigationRecord
        }
      });
    }

    const firestoreDb = (req.app && req.app.get('firestoreDb')) || req.firestoreDb || admin.firestore();
    const userJobShieldRef = firestoreDb.collection('users').doc(req.user.uid).collection('jobshield_investigations');
    const docRef = userJobShieldRef.doc();

    const firestoreServerTimestamp = (admin.firestore && admin.firestore.FieldValue && typeof admin.firestore.FieldValue.serverTimestamp === 'function')
      ? admin.firestore.FieldValue.serverTimestamp()
      : serverTimestampIso;

    try {
      await docRef.set({
        id: docRef.id,
        userId: req.user.uid,
        ...investigationRecord,
        createdAt: firestoreServerTimestamp
      });
    } catch (persistErr) {
      console.error('[JobShield] Authoritative persistence failed:', persistErr.message || persistErr);
      return res.status(500).json({
        success: false,
        error: 'Investigation analysis succeeded, but authoritative persistence to database failed.',
        details: persistErr.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'JobShield investigation completed and recorded successfully.',
      investigation: {
        id: docRef.id,
        createdAt: serverTimestampIso,
        ...investigationRecord
      }
    });

  } catch (error) {
    console.error('[JobShield] Error in investigation pipeline:', error);
    next(error);
  }
};

/**
 * @desc    Get user's JobShield investigation history
 * @route   GET /api/jobshield/history
 * @access  Private (Firebase Auth required)
 */
const getJobShieldHistory = async (req, res, next) => {
  try {
    const isMockDb = Boolean(req.firestoreDb || (req.app && req.app.get('firestoreDb')));
    const hasCredentials = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      isMockDb
    );

    if (!hasCredentials && process.env.NODE_ENV !== 'production') {
      return res.status(200).json({
        success: true,
        history: []
      });
    }

    const firestoreDb = (req.app && req.app.get('firestoreDb')) || req.firestoreDb || admin.firestore();
    const snapshot = await firestoreDb
      .collection('users')
      .doc(req.user.uid)
      .collection('jobshield_investigations')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const history = [];
    snapshot.forEach(doc => {
      history.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error('[JobShield] Error fetching history:', error);
    next(error);
  }
};

/**
 * @desc    Get a single JobShield investigation by ID
 * @route   GET /api/jobshield/investigations/:id
 * @access  Private (Firebase Auth required)
 */
const getJobShieldInvestigation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const firestoreDb = (req.app && req.app.get('firestoreDb')) || req.firestoreDb || admin.firestore();
    const docRef = firestoreDb.collection('users').doc(req.user.uid).collection('jobshield_investigations').doc(id);
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
    console.error('[JobShield] Error fetching investigation:', error);
    next(error);
  }
};

module.exports = {
  investigateJob,
  getJobShieldHistory,
  getJobShieldInvestigation
};
