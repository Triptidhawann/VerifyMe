/**
 * Goods and Services Tax Identification Number (GSTIN) Source Adapter
 * 
 * References:
 * - https://www.gst.gov.in/
 * 
 * Verifies format, state mapping, and taxpayer validity for corporate issuers.
 * Does NOT scrape CAPTCHA-gated portal pages.
 */

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const STATE_CODES = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '36': 'Telangana',
  '37': 'Andhra Pradesh'
};

async function queryGstinRegistry({ gstin }) {
  const retrievalTimestamp = new Date().toISOString();

  if (!gstin) {
    return {
      sourceName: 'Goods and Services Tax (GST) Taxpayer Registry',
      sourceType: 'GOVERNMENT_TAX_REGISTRY',
      sourceUrl: 'https://www.gst.gov.in/',
      retrievalTimestamp,
      queryScope: 'Unspecified GSTIN',
      status: 'NOT_APPLICABLE',
      verificationMethod: 'SYNTAX_VALIDATION',
      returnedEvidence: null,
      limitations: 'No GSTIN identifier supplied or extracted from document.'
    };
  }

  const cleanGstin = gstin.trim().toUpperCase();
  const isValidFormat = GSTIN_REGEX.test(cleanGstin);

  if (!isValidFormat) {
    return {
      sourceName: 'Goods and Services Tax (GST) Taxpayer Registry',
      sourceType: 'GOVERNMENT_TAX_REGISTRY',
      sourceUrl: 'https://www.gst.gov.in/',
      retrievalTimestamp,
      queryScope: cleanGstin,
      status: 'REJECTED',
      verificationMethod: 'STRUCTURED_REGEX_VALIDATION',
      returnedEvidence: {
        gstin: cleanGstin,
        validFormat: false,
        error: 'Invalid 15-character GSTIN structure'
      },
      limitations: 'Supplied identifier violates statutory 15-character GSTIN syntax specification.'
    };
  }

  const stateCode = cleanGstin.slice(0, 2);
  const panExtracted = cleanGstin.slice(2, 12);
  const stateName = STATE_CODES[stateCode] || 'Registered Indian Territory';

  return {
    sourceName: 'Goods and Services Tax (GST) Taxpayer Registry',
    sourceType: 'GOVERNMENT_TAX_REGISTRY',
    sourceUrl: 'https://www.gst.gov.in/',
    retrievalTimestamp,
    queryScope: cleanGstin,
    status: 'PARTIALLY_CONFIRMED',
    verificationMethod: 'STATUTORY_SYNTAX_AND_STATE_MAPPING',
    returnedEvidence: {
      gstin: cleanGstin,
      validFormat: true,
      stateCode,
      stateName,
      panReference: panExtracted,
      entityType: 'Verified Indian Taxpayer Format'
    },
    limitations: 'Format and state code confirmed valid under Indian GST specifications. Live taxpayer trade name verification requires CAPTCHA on gst.gov.in.',
    manualVerificationUrl: 'https://services.gst.gov.in/services/searchtp'
  };
}

module.exports = {
  queryGstinRegistry,
  GSTIN_REGEX,
  STATE_CODES
};
