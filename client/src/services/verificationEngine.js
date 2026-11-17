/**
 * VerifyMe Verification Engine Client
 * Handles authenticated API dispatching to the backend intelligence verification pipeline.
 */

const API_URL = import.meta.env.PROD ? '/.netlify/functions/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

export const verifyEntity = async ({ type, value, token }) => {
  if (!token) {
    throw new Error('Authentication required to perform verification.');
  }

  try {
    const response = await fetch(`${API_URL}/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, input: value })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const serverError = new Error(data.error || 'Verification failed on server');
      serverError.isServerError = true;
      throw serverError;
    }

    return {
      type: data.verification.targetType,
      inputValue: data.verification.target,
      analyzedAt: new Date().toISOString(),
      ...data.verification
    };
  } catch (err) {
    console.error("Backend verification error:", err.message);
    if (err.isServerError) {
      throw err; // Re-throw the actual server error message
    }
    // Only show this for actual network failures (e.g. connection refused)
    throw new Error('Unable to connect to the verification service. Please try again in a moment.');
  }
};
