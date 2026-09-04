/**
 * VerifyMe Analysis Engine
 * Performs local deterministic analysis for Phone, Email, and URL.
 * Designed to be easily replaced with external API calls later.
 */

const analyzePhone = (phone) => {
  const signals = [];
  const warnings = [];
  let score = 100;

  // Basic normalization
  const normalized = phone.replace(/[\s-()]/g, '');
  
  if (!/^\+?[0-9]+$/.test(normalized)) {
    warnings.push("Contains invalid characters");
    score -= 40;
  } else {
    signals.push("Valid number format");
  }

  if (normalized.startsWith('+')) {
    signals.push("International format detected");
  } else {
    warnings.push("Missing country code");
    score -= 10;
  }

  if (normalized.length < 10) {
    warnings.push("Number appears suspiciously short");
    score -= 30;
  } else if (normalized.length > 15) {
    warnings.push("Number exceeds standard length");
    score -= 20;
  }

  let riskLevel = "LOW RISK";
  if (score < 50) riskLevel = "HIGH RISK";
  else if (score < 80) riskLevel = "MODERATE RISK";

  return {
    score: Math.max(0, score),
    riskLevel,
    confidence: "MEDIUM",
    signals,
    warnings,
    summary: score >= 80 
      ? "The phone number follows standard formatting structures with no obvious malicious patterns."
      : "The phone number exhibits formatting irregularities. Proceed with caution."
  };
};

const analyzeEmail = (email) => {
  const signals = [];
  const warnings = [];
  let score = 100;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(email)) {
    signals.push("Valid email syntax");
  } else {
    warnings.push("Malformed email syntax");
    score -= 50;
  }

  const parts = email.split('@');
  if (parts.length === 2) {
    const domain = parts[1].toLowerCase();
    signals.push(`Domain identified: ${domain}`);

    // Very basic disposable email check (placeholder for real API)
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'throwaway.com'];
    if (disposableDomains.includes(domain)) {
      warnings.push("Disposable email domain detected");
      score -= 60;
    }

    if (domain.split('.').length > 3) {
      warnings.push("Complex subdomain structure");
      score -= 15;
    }
  }

  let riskLevel = "LOW RISK";
  if (score < 50) riskLevel = "HIGH RISK";
  else if (score < 80) riskLevel = "MODERATE RISK";

  return {
    score: Math.max(0, score),
    riskLevel,
    confidence: "MEDIUM",
    signals,
    warnings,
    summary: score >= 80 
      ? "The email address appears structurally sound and uses a standard domain."
      : "The email address triggered risk indicators. Verification of sender identity is recommended."
  };
};

const analyzeUrl = (urlStr) => {
  const signals = [];
  const warnings = [];
  let score = 100;

  let url;
  let normalizedUrl = urlStr;
  
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  try {
    url = new URL(normalizedUrl);
    signals.push("Valid URL structure");
  } catch (e) {
    return {
      score: 10,
      riskLevel: "HIGH RISK",
      confidence: "HIGH",
      signals: [],
      warnings: ["Severely malformed URL"],
      summary: "The provided string cannot be parsed as a valid website address."
    };
  }

  if (url.protocol === 'https:') {
    signals.push("HTTPS enabled");
  } else {
    warnings.push("Unencrypted HTTP protocol used");
    score -= 30;
  }

  signals.push(`Host: ${url.hostname}`);

  // IP address instead of domain
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(url.hostname)) {
    warnings.push("Direct IP address used instead of domain name");
    score -= 40;
  }

  // Punycode / Homograph attack basic check
  if (url.hostname.includes('xn--')) {
    warnings.push("Punycode domain detected (possible homograph attack)");
    score -= 25;
  }

  let riskLevel = "LOW RISK";
  if (score < 50) riskLevel = "HIGH RISK";
  else if (score < 80) riskLevel = "MODERATE RISK";

  return {
    score: Math.max(0, score),
    riskLevel,
    confidence: "MEDIUM",
    signals,
    warnings,
    summary: score >= 80 
      ? "The URL uses secure protocols and standard formatting. No local threats detected."
      : "The URL exhibits suspicious structural patterns common in phishing or unsafe sites."
  };
};

export const verifyEntity = async ({ type, value, token }) => {
  if (!token) {
    throw new Error('Authentication required to perform verification.');
  }

  try {
    const response = await fetch('http://localhost:5000/api/verifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, input: value })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Verification failed on server');
    }

    return {
      type: data.verification.targetType,
      inputValue: data.verification.target,
      analyzedAt: new Date().toISOString(),
      ...data.verification
    };
  } catch (err) {
    console.error("Backend verification error:", err);
    throw new Error(err.message || 'Unable to reach the VerifyMe intelligence engine.');
  }
};
