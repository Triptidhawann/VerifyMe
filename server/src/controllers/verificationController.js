const admin = require('../config/firebase');
const { normalizeInput } = require('../services/verificationService');
const { performVerification } = require('../services/intelligenceEngine');

/**
 * @desc    Create a new verification request and authoritatively persist the audit log
 * @route   POST /api/verifications
 * @access  Private (Authenticated Firebase session required)
 */
const createVerification = async (req, res, next) => {
  try {
    const { type, input } = req.body;

    // 1. Validate request parameters
    if (!type || !input) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both type and input for verification.'
      });
    }

    const validTypes = ['phone', 'email', 'website'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid verification type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // 2. Normalize input strictly
    const normalizedInput = normalizeInput(type, input);
    if (!normalizedInput) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input format provided.'
      });
    }

    // 3. User session verification
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized: Authenticated session is required to perform verification.'
      });
    }

    // 4. Perform authoritative deterministic & AI verification
    // Note: Any client-supplied scores, riskLevels, verdicts, or timestamps are ignored
    const analysisResult = await performVerification(type, normalizedInput);

    const serverTimestampIso = new Date().toISOString();

    // 5. Authoritatively persist to Firestore via Firebase Admin SDK
    // Document path: users/{uid}/verifications/{verificationId}
    const isMockDb = Boolean(req.firestoreDb || (req.app && req.app.get('firestoreDb')));
    const hasCredentials = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      isMockDb
    );

    // In local development without service account credentials, return the live verification result
    // to unblock developer testing rather than attempting an unauthenticated gRPC connection that crashes Node
    if (!hasCredentials && process.env.NODE_ENV !== 'production') {
      console.warn(
        '\n⚠️ [VerifyMe Dev Notice] Firebase service account credentials not found in server/.env.\n' +
        '   Verification engine executed successfully, but Firestore history persistence was skipped.\n' +
        '   To persist history, add GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT to server/.env.\n'
      );

      return res.status(200).json({
        success: true,
        message: 'Verification completed (Database persistence skipped in dev: missing service account credentials).',
        warning: 'Database persistence skipped in dev: configure FIREBASE_SERVICE_ACCOUNT in server/.env',
        verification: {
          id: 'dev_' + Date.now(),
          createdAt: serverTimestampIso,
          targetType: type,
          target: input,
          normalizedTarget: normalizedInput,
          ...analysisResult
        }
      });
    }

    const firestoreDb = (req.app && req.app.get('firestoreDb')) || req.firestoreDb || admin.firestore();
    const userVerificationsRef = firestoreDb.collection('users').doc(req.user.uid).collection('verifications');
    const docRef = userVerificationsRef.doc();

    const firestoreServerTimestamp = (admin.firestore && admin.firestore.FieldValue && typeof admin.firestore.FieldValue.serverTimestamp === 'function')
      ? admin.firestore.FieldValue.serverTimestamp()
      : serverTimestampIso;

    const recordToPersist = {
      id: docRef.id,
      type: type,
      targetType: type,
      target: input,
      targetValue: input,
      inputValue: input,
      normalizedTarget: normalizedInput,
      score: analysisResult.verification.score,
      technicalHealthScore: analysisResult.verification.technicalHealthScore || analysisResult.verification.score,
      technicalScore: analysisResult.verification.technicalScore,
      technicalStatus: analysisResult.verification.technicalStatus,
      reputationStatus: analysisResult.verification.reputationStatus,
      identityStatus: analysisResult.verification.identityStatus,
      threatAssessmentStatus: analysisResult.verification.threatAssessmentStatus,
      threatIndicators: analysisResult.verification.threatIndicators || [],
      riskLevel: analysisResult.verification.riskLevel,
      evidenceCompleteness: analysisResult.verification.evidenceCompleteness || analysisResult.verification.confidence,
      confidence: analysisResult.verification.confidence,
      signalsAnalyzed: analysisResult.verification.signalsAnalyzed,
      evidenceChecked: analysisResult.verification.evidenceChecked,
      riskIndicators: analysisResult.verification.riskIndicators,
      signals: analysisResult.verification.signals || [],
      warnings: analysisResult.verification.warnings || [],
      limitations: analysisResult.verification.limitations || [],
      summary: analysisResult.summary || analysisResult.analysis?.summary || '',
      whyThisScore: analysisResult.whyThisScore || '',
      recommendedAction: analysisResult.recommendedAction || analysisResult.analysis?.recommendedAction || '',
      verification: analysisResult.verification,
      analysis: analysisResult.analysis,
      createdAt: firestoreServerTimestamp,
      createdAtIso: serverTimestampIso
    };

    try {
      await docRef.set(recordToPersist);
    } catch (persistErr) {
      console.error('[VerifyMe] Authoritative persistence failed:', persistErr.message || persistErr);

      return res.status(500).json({
        success: false,
        error: 'Verification analysis succeeded, but authoritative persistence to database failed.',
        details: persistErr.message
      });
    }

    // 6. Return response to frontend preserving contract
    return res.status(200).json({
      success: true,
      message: 'Verification request processed and recorded successfully.',
      verification: {
        id: docRef.id,
        createdAt: serverTimestampIso,
        targetType: type,
        target: input,
        normalizedTarget: normalizedInput,
        ...analysisResult
      }
    });

  } catch (error) {
    console.error('[VerifyMe] Error in verification request:', error);
    next(error);
  }
};

module.exports = {
  createVerification
};
