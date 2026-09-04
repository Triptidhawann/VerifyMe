const Groq = require('groq-sdk');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');

let groq;
try {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_prevent_crash_if_not_set' });
} catch (e) {
  console.warn('Groq API Key missing. AI analysis will fail gracefully.');
}

// ---------------------------------------------------------
// HELPER: DNS CHECKS
// ---------------------------------------------------------
async function checkDomain(domain) {
  const result = { exists: false, hasMX: false, hasSPF: false, hasDMARC: false };
  try {
    const addresses = await dns.resolve(domain);
    if (addresses && addresses.length > 0) result.exists = true;
  } catch (e) {
    // If ENOTFOUND, the domain doesn't exist
    if (e.code !== 'ENODATA') return result;
  }
  
  if (!result.exists) return result; // Don't bother with MX if no A/AAAA/etc

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) result.hasMX = true;
  } catch (e) {}

  try {
    const txtRecords = await dns.resolveTxt(domain);
    for (const group of txtRecords) {
      const txt = group.join(' ');
      if (txt.includes('v=spf1')) result.hasSPF = true;
    }
  } catch (e) {}

  try {
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
    for (const group of dmarcRecords) {
      const txt = group.join(' ');
      if (txt.includes('v=DMARC1')) result.hasDMARC = true;
    }
  } catch (e) {}

  return result;
}

// ---------------------------------------------------------
// HELPER: HTTP REACHABILITY (SSRF Protected)
// ---------------------------------------------------------
async function checkHttp(urlToParse) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlToParse);
      
      // Basic SSRF Protection
      const forbiddenHostnames = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];
      if (forbiddenHostnames.includes(url.hostname)) {
        return resolve({ reachable: false, reason: 'Internal IP blocked for security' });
      }

      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const req = client.request(url, {
        method: 'HEAD',
        timeout: 3000,
        rejectUnauthorized: false // We just want to see if it responds
      }, (res) => {
        resolve({ reachable: true, status: res.statusCode });
      });

      req.on('error', (e) => {
        resolve({ reachable: false, reason: e.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ reachable: false, reason: 'Timeout' });
      });

      req.end();
    } catch (e) {
      resolve({ reachable: false, reason: 'Malformed URL' });
    }
  });
}

// ---------------------------------------------------------
// DETERMINISTIC ENGINE
// ---------------------------------------------------------
const getDeterministicSignals = async (type, normalizedInput) => {
  const signals = [];
  const warnings = [];
  const limitations = [];
  let formatValid = false;
  
  // Baseline score is Neutral (50). Not guilty until proven innocent, but not trusted either.
  let score = 50;
  // Confidence indicates how much evidence we actually gathered.
  let confidence = 0; 

  if (type === 'phone') {
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (phoneRegex.test(normalizedInput)) {
      formatValid = true;
      signals.push('Phone structure matches standard E.164 format');
      score += 10;
      confidence += 20; // Regex check
    } else {
      warnings.push('Phone format appears malformed or non-standard');
      score -= 30;
      confidence += 20; 
    }
    
    if (!normalizedInput.startsWith('+')) {
      warnings.push('Missing country code');
      score -= 10;
    } else {
      signals.push('Includes international country code');
      score += 5;
    }
    
    limitations.push('Phone carrier, location, and owner reputation could not be independently verified via external intelligence.');

  } else if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(normalizedInput)) {
      formatValid = true;
      signals.push('Email syntax is structurally valid');
      score += 5; // tiny boost for syntax
      confidence += 10;
      
      const parts = normalizedInput.split('@');
      const domain = parts[1];
      signals.push(`Target Domain: ${domain}`);
      
      const disposableDomains = ['tempmail.com', '10minutemail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com', 'yopmail.com'];
      if (disposableDomains.includes(domain)) {
        warnings.push('Known disposable/temporary email domain detected');
        score -= 40;
      }
      
      // Perform DNS checks
      const dnsResult = await checkDomain(domain);
      confidence += 40; // We did network checks
      
      if (dnsResult.exists) {
        signals.push('Domain exists and resolves via DNS');
        score += 5;
        
        if (dnsResult.hasMX) {
          signals.push('Domain is configured to receive email (MX records present)');
          score += 10;
        } else {
          warnings.push('Domain lacks email delivery configuration (No MX records)');
          score -= 30;
        }
        
        if (dnsResult.hasSPF) {
          signals.push('Domain has Sender Policy Framework (SPF) configured');
          score += 5;
        }
        
        if (dnsResult.hasDMARC) {
          signals.push('Domain has strict DMARC policy configured');
          score += 5;
        }
        
      } else {
        warnings.push('Domain does not exist or fails to resolve via DNS');
        score -= 40;
      }
      
    } else {
      warnings.push('Malformed email syntax');
      score -= 50;
      confidence += 50; // We are very confident it's broken
    }
    
    limitations.push('Email mailbox existence (SMTP verification) and external reputation data were unavailable.');

  } else if (type === 'website') {
    let urlToParse = normalizedInput.startsWith('http') ? normalizedInput : `https://${normalizedInput}`;
    let url;
    try {
      url = new URL(urlToParse);
      formatValid = true;
      signals.push('Valid URL structure');
      score += 5;
      confidence += 10;
      
      if (url.protocol === 'https:') {
        signals.push('HTTPS protocol requested');
        score += 5;
      } else {
        warnings.push('Unencrypted HTTP protocol used');
        score -= 30;
      }
      
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(url.hostname)) {
        warnings.push('Direct IP address used instead of domain name');
        score -= 30;
      }
      
      if (url.hostname.includes('xn--')) {
        warnings.push('Punycode domain detected (possible homograph attack)');
        score -= 20;
      }
      
      // Check HTTP Reachability
      const httpResult = await checkHttp(urlToParse);
      confidence += 40;
      
      if (httpResult.reachable) {
        signals.push(`Website is reachable (Status: ${httpResult.status})`);
        score += 10;
      } else {
        warnings.push(`Website failed to respond: ${httpResult.reason}`);
        score -= 30;
      }
      
    } catch (e) {
      warnings.push('Severely malformed URL syntax');
      score -= 50;
      confidence += 50;
    }
    
    limitations.push('VerifyMe has not cross-referenced this entity against global real-time malware or phishing threat databases.');
  }

  score = Math.max(0, Math.min(100, score));
  
  let riskLevel = "UNKNOWN";
  if (score >= 80) riskLevel = "LOW RISK";
  else if (score >= 60) riskLevel = "MODERATE RISK";
  else if (score >= 40) riskLevel = "SUSPICIOUS";
  else riskLevel = "HIGH RISK";

  return { formatValid, signals, warnings, limitations, score, confidence, riskLevel };
};

// ---------------------------------------------------------
// GROQ AI INTERPRETATION
// ---------------------------------------------------------
const callGroqAPI = async (type, normalizedInput, deterministicData) => {
  const systemPrompt = `You are the explanation layer of VerifyMe, a Digital Trust Intelligence platform.
You are NOT the source of truth. You must only interpret the verification evidence supplied to you by the backend.

CRITICAL RULES:
1. Never invent facts, reputation information, database results, security incidents, ownership, or threat intelligence.
2. Never assume that valid syntax means trustworthy. Valid syntax ONLY means the format is correct.
3. Distinguish clearly between VALID, VERIFIED, TRUSTED, UNVERIFIED, SUSPICIOUS, HIGH RISK.
4. If external intelligence or reputation data is unavailable, explicitly state that the assessment is limited.
5. Do not claim that an email mailbox exists unless mailbox existence was actually verified.
6. Do not claim that a phone number belongs to a person unless ownership was actually verified.
7. Do not claim that a website is safe merely because it uses HTTPS or responds to a ping.
8. Explain why the numerical score was produced based ONLY on the supplied evidence.

Always output ONLY valid JSON matching this schema exactly:
{
  "summary": "Brief 2-sentence explanation of what the evidence suggests about the target",
  "whyThisScore": "A clear explanation of why this specific score (out of 100) was given, pointing out positive and negative signals",
  "verdict": "One short sentence final verdict (e.g., 'Entity appears valid but lacks reputation history.')",
  "recommendedAction": "Actionable, cautious advice for the user based on the risk level"
}`;

  const userPrompt = `
Analyze this target:
Target Type: ${type}
Target Value: ${normalizedInput}

Calculated Score: ${deterministicData.score}/100
Risk Level: ${deterministicData.riskLevel}
Evidence Confidence: ${deterministicData.confidence}%

Validation Status: ${deterministicData.formatValid ? 'Valid Format' : 'Invalid Format'}
Positive Signals Checked: ${JSON.stringify(deterministicData.signals)}
Negative Warnings/Risks: ${JSON.stringify(deterministicData.warnings)}
Known Limitations: ${JSON.stringify(deterministicData.limitations)}
External Threat Intelligence: UNAVAILABLE

Return your JSON assessment now.`;

  // Dynamically discover which models the user's specific account has access to
  const getAvailableModel = async () => {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` }
      });
      const data = await response.json();
      
      if (data && data.data) {
        const availableModels = data.data.map(m => m.id);
        console.log("[GROQ] Account has access to models:", availableModels.join(", "));
        
        // Priority list
        const preferences = [
          'llama-3.3-70b-versatile', 
          'llama-3.1-8b-instant', 
          'llama3-8b-8192', 
          'llama3-70b-8192'
        ];
        
        for (const pref of preferences) {
          if (availableModels.includes(pref)) {
            return pref;
          }
        }
        
        // If preferred models aren't available, pick the first Llama model they have access to
        const anyLlama = availableModels.find(m => m.toLowerCase().includes('llama'));
        if (anyLlama) return anyLlama;
      }
    } catch (e) {
      console.warn("[GROQ] Failed to fetch available models", e.message);
    }
    // Absolute last resort
    return 'llama3-8b-8192';
  };

  const makeGroqRequest = async (retries = 2) => {
    try {
      console.log('[GROQ] Request started');
      console.log(`[GROQ] API key configured: ${!!process.env.GROQ_API_KEY}`);
      
      // Get a guaranteed working model for this specific account
      const targetModel = await getAvailableModel();
      console.log(`[GROQ] Selected Model: ${targetModel}`);
      
      console.log(`[GROQ] Endpoint: https://api.groq.com/openai/v1/chat/completions`);
      console.log(`[GROQ] Request started at: ${new Date().toISOString()}`);
      
      // Implement a race condition for a 8-second timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          const timeoutErr = new Error('Groq request timed out');
          timeoutErr.status = 408;
          reject(timeoutErr);
        }, 8000)
      );

      const groqPromise = groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: targetModel,
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const chatCompletion = await Promise.race([groqPromise, timeoutPromise]);
      console.log(`[GROQ] Response status: 200`);
      console.log(`[GROQ] Parsed successfully: true`);

      return JSON.parse(chatCompletion.choices[0].message.content);
    } catch (err) {
      console.error(`[GROQ] Error status: ${err.status || 'unknown'}`);
      console.error(`[GROQ] Error message: ${err.message}`);

      // Retry on rate limit, timeout, or server errors, but NOT on auth errors
      const isRetryable = err.message.includes('timed out') || 
                          err.status === 429 || 
                          (err.status >= 500 && err.status <= 599);

      if (isRetryable && retries > 0) {
        console.log(`[GROQ] Retrying Groq request... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return makeGroqRequest(retries - 1);
      }
      
      throw err; // Let the outer catch handle the final fallback
    }
  };

  try {
    return await makeGroqRequest();
  } catch (err) {
    console.log(`[GROQ] Final failure reached. Forwarding error to UI.`);
    // Fallback if Groq completely fails, now WITH the exact error message for debugging
    return {
      summary: `AI interpretation failed: ${err.message}`,
      whyThisScore: `Error Code: ${err.status || 'Unknown'}. Please ensure GROQ_API_KEY is valid and the model is supported.`,
      verdict: "AI Analysis Incomplete.",
      recommendedAction: "Fix the Groq integration error shown above."
    };
  }
};

const performVerification = async (type, normalizedInput) => {
  // 1. Gather deterministic evidence
  const deterministicData = await getDeterministicSignals(type, normalizedInput);
  
  // 2. Call AI Interpretation
  const aiResult = await callGroqAPI(type, normalizedInput, deterministicData);

  // 3. Combine into final structure
  return {
    score: deterministicData.score,
    riskLevel: deterministicData.riskLevel,
    confidence: deterministicData.confidence,
    summary: aiResult.summary,
    whyThisScore: aiResult.whyThisScore || "N/A",
    verdict: aiResult.verdict,
    recommendedAction: aiResult.recommendedAction,
    signals: deterministicData.signals,
    warnings: deterministicData.warnings,
    limitations: deterministicData.limitations,
    analysisType: "deterministic + AI"
  };
};

module.exports = { performVerification };
