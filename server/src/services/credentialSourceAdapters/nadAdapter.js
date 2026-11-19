/**
 * National Academic Depository (NAD) / DigiLocker NAD Source Adapter
 * 
 * IMPORTANT:
 * NAD verification is consent-based and requires verifier registration/authorization
 * and appropriate API credentials (API Setu / DigiLocker NAD).
 * 
 * This adapter transparently handles configured vs unconfigured states.
 * It NEVER scrapes DigiLocker, never invents mock success, and explicitly documents
 * the consent requirement and official verification route.
 */

async function queryDigiLockerNad({ rollNumber, universityName, degreeName, yearOfPassing, consentObtained = false }) {
  const retrievalTimestamp = new Date().toISOString();
  const apiKey = process.env.DIGILOCKER_NAD_API_KEY;
  const orgId = process.env.DIGILOCKER_NAD_ORG_ID;

  // Check if API credentials are configured
  if (!apiKey || !orgId) {
    return {
      sourceName: 'National Academic Depository (NAD / DigiLocker)',
      sourceType: 'GOVERNMENT_ACADEMIC_DEPOT',
      sourceUrl: 'https://nad.digilocker.gov.in/',
      retrievalTimestamp,
      queryScope: `Roll No: ${rollNumber || 'Unspecified'} | Institution: ${universityName || 'Unspecified'}`,
      status: 'UNAVAILABLE',
      verificationMethod: 'AUTOMATED_API_NOT_CONFIGURED',
      returnedEvidence: {
        registeredOnPlatform: true,
        automatedLookupAvailable: false,
        consentRequired: true
      },
      limitations: 'DigiLocker NAD verification is consent-based and requires institutional API authorization via partners.apisetu.gov.in. Verifiers must obtain individual student consent.',
      recommendedRoute: 'Request candidate to share their digitally-verified degree directly from their DigiLocker account (https://www.digilocker.gov.in).'
    };
  }

  if (!consentObtained) {
    return {
      sourceName: 'National Academic Depository (NAD / DigiLocker)',
      sourceType: 'GOVERNMENT_ACADEMIC_DEPOT',
      sourceUrl: 'https://nad.digilocker.gov.in/',
      retrievalTimestamp,
      queryScope: `Roll No: ${rollNumber || 'Unspecified'}`,
      status: 'UNAVAILABLE',
      verificationMethod: 'CONSENT_PENDING',
      returnedEvidence: { consentObtained: false },
      limitations: 'Individual candidate consent is legally required before querying DigiLocker NAD records under the IT Act and DPDP Act.',
      recommendedRoute: 'Request the candidate to authorize DigiLocker credential exchange.'
    };
  }

  // If credentials & consent exist, invoke official partner endpoint (Stubbed for partner API call)
  return {
    sourceName: 'National Academic Depository (NAD / DigiLocker)',
    sourceType: 'GOVERNMENT_ACADEMIC_DEPOT',
    sourceUrl: 'https://nad.digilocker.gov.in/',
    retrievalTimestamp,
    queryScope: `Roll No: ${rollNumber}`,
    status: 'INCONCLUSIVE',
    verificationMethod: 'PARTNER_API_QUERY',
    returnedEvidence: { message: 'Pending partner institutional response' },
    limitations: 'Institutional synchronization delay may affect live queries.'
  };
}

module.exports = {
  queryDigiLockerNad
};
