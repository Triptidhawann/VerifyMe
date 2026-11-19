/**
 * VerifyMe JobShield Service
 * Client for the recruitment authenticity and fraud investigation engine.
 */

const API_URL = import.meta.env.PROD 
  ? '/.netlify/functions/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

export const investigateRecruitment = async ({
  submissionType,
  rawText,
  fileBase64,
  fileName,
  url,
  claimedCompany,
  claimedWebsite,
  token
}) => {
  if (!token) {
    throw new Error('Authentication required to perform JobShield investigation.');
  }

  try {
    const response = await fetch(`${API_URL}/jobshield/investigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        submissionType,
        rawText,
        fileBase64,
        fileName,
        url,
        claimedCompany,
        claimedWebsite
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(data.error || 'JobShield investigation failed on server.');
      err.isServerError = true;
      err.code = data.code;
      throw err;
    }

    return data.investigation;
  } catch (err) {
    console.error('[JobShield Client Error]:', err.message);
    if (err.isServerError) {
      throw err;
    }
    throw new Error('Unable to connect to the JobShield investigation service. Please try again.');
  }
};

export const fetchJobShieldHistory = async (token) => {
  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/jobshield/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.history || [];
  } catch (err) {
    console.warn('[JobShield] Error fetching history:', err.message);
    return [];
  }
};
