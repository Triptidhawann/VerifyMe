/**
 * VerifyMe CredentialCheck Service
 * Client for India-First credential intelligence, document forensics, and statutory verification.
 */

const API_URL = import.meta.env.PROD 
  ? '/.netlify/functions/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

export const investigateCredentialDocument = async ({
  fileBase64,
  fileName,
  mimeType,
  documentCategory,
  issuerName,
  issuerWebsite,
  certificateNumber,
  candidateConsent,
  token
}) => {
  if (!token) {
    throw new Error('Authentication required to perform CredentialCheck investigation.');
  }

  try {
    const response = await fetch(`${API_URL}/credentialcheck/investigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fileBase64,
        fileName,
        mimeType,
        documentCategory,
        issuerName,
        issuerWebsite,
        certificateNumber,
        candidateConsent
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(data.error || 'Credential investigation failed on server.');
      err.isServerError = true;
      err.code = data.code;
      throw err;
    }

    return data.investigation;
  } catch (err) {
    console.error('[CredentialCheck Client Error]:', err.message);
    if (err.isServerError) {
      throw err;
    }
    throw new Error('Unable to connect to the CredentialCheck investigation service. Please try again.');
  }
};

export const fetchCredentialHistory = async (token) => {
  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/credentialcheck/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.history || [];
  } catch (err) {
    console.warn('[CredentialCheck] Error fetching history:', err.message);
    return [];
  }
};

export const fetchCredentialInvestigation = async (id, token) => {
  if (!token) throw new Error('Authentication required.');

  const response = await fetch(`${API_URL}/credentialcheck/investigations/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch investigation');
  return data.investigation;
};

export const deleteCredentialRecord = async (id, token) => {
  if (!token) throw new Error('Authentication required.');

  const response = await fetch(`${API_URL}/credentialcheck/investigations/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete record');
  return true;
};

export const fetchVerificationSources = async () => {
  try {
    const response = await fetch(`${API_URL}/credentialcheck/sources`, {
      method: 'GET'
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.sources || [];
  } catch (err) {
    console.warn('[CredentialCheck] Error fetching sources:', err.message);
    return [];
  }
};
