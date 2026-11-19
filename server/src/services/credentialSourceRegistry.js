const { queryDigiLockerNad } = require('./credentialSourceAdapters/nadAdapter');
const { queryUgcRegistry } = require('./credentialSourceAdapters/ugcAdapter');
const { queryMcaRegistry } = require('./credentialSourceAdapters/mcaAdapter');
const { verifyDigitalSignatures } = require('./credentialSourceAdapters/ccaDigitalSignatureAdapter');
const { queryGstinRegistry } = require('./credentialSourceAdapters/gstinAdapter');
const { queryIssuerVerificationEndpoint } = require('./credentialSourceAdapters/issuerQrAdapter');

/**
 * Unified India-First Official Source Registry for CredentialCheck
 * Coordinates execution of all modular source adapters and normalizes outputs.
 */
async function queryOfficialSources({
  category,
  claims = {},
  pdfAnalysis = null,
  issuerIdentity = {}
}) {
  const sourcesConsulted = [];
  const fields = claims.fields || {};

  const orgName = fields.issuingOrganization?.value || issuerIdentity.queryOrg || null;
  const orgDomain = issuerIdentity.queryDomain || (issuerIdentity.primaryMatch ? issuerIdentity.primaryMatch.domain : null);
  const credId = fields.credentialId?.value || null;
  const verificationUrl = fields.verificationUrl?.value || (claims.fields?.qrData?.value && claims.fields?.qrData?.value.startsWith('http') ? claims.fields.qrData.value : null);
  const rollNumber = fields.rollNumber?.value || credId;
  const degreeName = fields.degreeName?.value || null;

  // 1. Digital Signature Verification (CCA Framework)
  const ccaResult = await verifyDigitalSignatures(pdfAnalysis);
  sourcesConsulted.push(ccaResult);

  // 2. Academic Registries (UGC & DigiLocker NAD) for Academic Certificates
  if (category === 'ACADEMIC' || (orgName && (orgName.toLowerCase().includes('university') || orgName.toLowerCase().includes('institute')))) {
    // UGC Statutory Registry lookup
    const ugcResult = await queryUgcRegistry({ institutionName: orgName });
    sourcesConsulted.push(ugcResult);

    // DigiLocker NAD adapter
    const nadResult = await queryDigiLockerNad({
      rollNumber,
      universityName: orgName,
      degreeName,
      consentObtained: false
    });
    sourcesConsulted.push(nadResult);
  }

  // 3. Corporate Registry (MCA) for Corporate Issuers (Internship, Experience, Training)
  const isCorporateCategory = category === 'INTERNSHIP' || category === 'EXPERIENCE' || category === 'TRAINING';
  if (isCorporateCategory || (orgName && (orgName.toLowerCase().includes('ltd') || orgName.toLowerCase().includes('pvt') || orgName.toLowerCase().includes('limited') || orgName.toLowerCase().includes('technologies')))) {
    const mcaResult = await queryMcaRegistry({ companyName: orgName });
    sourcesConsulted.push(mcaResult);
  }

  // 4. GSTIN Registry (if GSTIN present in text or metadata)
  const gstinMatch = (claims.rawText || '').match(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/);
  if (gstinMatch) {
    const gstinResult = await queryGstinRegistry({ gstin: gstinMatch[1] });
    sourcesConsulted.push(gstinResult);
  }

  // 5. Issuer Verification Portal & QR Endpoint
  if (verificationUrl) {
    const qrResult = await queryIssuerVerificationEndpoint({
      verificationUrl,
      claimedIssuerDomain: orgDomain,
      credentialId: credId
    });
    sourcesConsulted.push(qrResult);
  }

  return {
    sourcesConsulted,
    digitalSignatureResult: ccaResult,
    sourcesCount: sourcesConsulted.length
  };
}

module.exports = {
  queryOfficialSources
};
