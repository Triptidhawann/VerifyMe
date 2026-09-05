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
// DETERMINISTIC INTERPRETATION (FALLBACK)
// ---------------------------------------------------------
const generateDeterministicInterpretation = (deterministicData, type) => {
  const { riskLevel, warnings = [], signals = [] } = deterministicData;
  const risk = (riskLevel || '').toUpperCase();
  const isHighRisk = risk.includes('CRITICAL') || risk.includes('HIGH');
  const isModerateRisk = risk.includes('MODERATE') || risk.includes('SUSPICIOUS');

  let summary = "";
  let whyScore = [];
  let riskFactors = [...warnings];
  let precautions = [];
  let recommendedAction = "";

  if (isHighRisk) {
    summary = "The verification result contains warning indicators that reduce confidence in the target.";
    whyScore.push("Several technical signals indicate a high probability of risk.");
    if (warnings.length > 0) {
      whyScore.push(`Explicit warnings detected: ${warnings.join('; ')}.`);
    }

    if (type === 'email') {
      precautions = [
        "Do not open suspicious attachments.",
        "Do not provide credentials through email links.",
        "Treat the message as potentially unsafe."
      ];
      recommendedAction = "Independently verify the sender before interacting with the email.";
    } else if (type === 'phone') {
      precautions = [
        "Do not share OTPs, PINs, or financial information.",
        "Be cautious of urgent or threatening requests.",
        "Stop the interaction if pressure continues."
      ];
      recommendedAction = "Do not rely on the caller's identity alone. Independently verify the caller before taking any sensitive action.";
    } else {
      precautions = [
        "Do not enter credentials or payment information.",
        "Avoid downloading files from this domain.",
        "Check the domain spelling carefully."
      ];
      recommendedAction = "Do not interact with this website until it is independently verified.";
    }
  } else if (isModerateRisk) {
    summary = "The available verification signals show a mixed result. Some indicators are reassuring, but the available evidence is not strong enough to establish high confidence.";
    whyScore.push("Technical checks passed without explicit critical failures, but trust indicators are low.");
    if (warnings.length > 0) {
      whyScore.push(`Minor concerns noted: ${warnings.join('; ')}.`);
    }

    if (type === 'email') {
      precautions = [
        "Avoid sharing sensitive information.",
        "Verify the sender/domain independently.",
        "Confirm important claims using an official source."
      ];
      recommendedAction = "Verify the sender through an independent channel before sharing credentials or financial details.";
    } else if (type === 'phone') {
      precautions = [
        "Independently verify the caller's identity.",
        "Do not share sensitive information or OTPs.",
        "Look for additional evidence before taking action."
      ];
      recommendedAction = "Verify the caller through an independent channel before sharing sensitive information, OTPs, or financial details.";
    } else {
      precautions = [
        "Avoid entering sensitive information.",
        "Verify the organization through its official website.",
        "Look for additional security indicators."
      ];
      recommendedAction = "Independently verify the website and organization before entering credentials or payment information.";
    }
  } else {
    // LOW RISK
    summary = "The verification signals currently available do not show significant warning indicators. However, the available evidence should still be independently verified before making a sensitive decision.";
    whyScore.push("The target passed all available formatting and structural verification checks.");
    whyScore.push(`Confirmed positive signals: ${signals.length}.`);

    if (type === 'email') {
      precautions = [
        "Treat the score as an indicator, not absolute proof.",
        "Continue to use normal caution.",
        "Confirm the identity through an independent channel if the request is sensitive."
      ];
      recommendedAction = "Verify the sender before sharing sensitive information.";
    } else if (type === 'phone') {
      precautions = [
        "Treat the score as an indicator, not absolute proof.",
        "Continue to use normal caution.",
        "Confirm the identity through an independent channel if the request is sensitive."
      ];
      recommendedAction = "Independently verify the caller before sharing sensitive information.";
    } else {
      precautions = [
        "Treat the score as an indicator, not absolute proof.",
        "Continue to use normal caution.",
        "Confirm the identity through an independent channel if the request is sensitive."
      ];
      recommendedAction = "Verify the organization before entering sensitive information.";
    }
  }

  return {
    source: "deterministic",
    summary,
    whyScore,
    riskFactors,
    precautions,
    recommendedAction
  };
};

// ---------------------------------------------------------
// GROQ AI INTERPRETATION
// ---------------------------------------------------------
const generateRiskInterpretation = async (type, normalizedInput, deterministicData) => {
  const fallback = generateDeterministicInterpretation(deterministicData, type);

  if (!process.env.GROQ_API_KEY) {
    console.log('[GROQ] No API key found. Using deterministic fallback.');
    return fallback;
  }

  const prompt = `You are the explanation layer of VerifyMe. 
Explain this deterministic verification result.
Target Type: ${type}
Target Value: ${normalizedInput}
Score: ${deterministicData.score}/100
Risk Level: ${deterministicData.riskLevel}
Signals Analyzed: ${JSON.stringify(deterministicData.signals)}
Warnings: ${JSON.stringify(deterministicData.warnings)}

CRITICAL RULES:
1. DO NOT change the score or risk level. You are only explaining why the technical checks resulted in them.
2. Produce target-aware precautions (email vs phone vs website).
3. Do not invent external reputation facts not present in the signals or warnings arrays.
4. Provide the exact JSON structure requested.

Return valid JSON exactly matching this schema:
{
  "summary": "1-2 sentence overview of the risk",
  "whyScore": ["reason 1", "reason 2"],
  "riskFactors": ["factor 1", "factor 2"],
  "precautions": ["precaution 1", "precaution 2", "precaution 3"],
  "recommendedAction": "1 clear sentence of advice"
}`;

  const makeGroqRequest = async (retries = 1) => {
    try {
      const targetModel = process.env.GROQ_MODEL || 'llama3-8b-8192';
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => { const e = new Error('Timeout'); e.status = 408; reject(e); }, 8000)
      );

      const payload = {
        messages: [{ role: 'user', content: prompt }],
        model: targetModel,
        temperature: 0.1
      };

      // Only attempt JSON mode if the model explicitly supports it without crashing
      if (targetModel.includes('3.1') || targetModel.includes('3.3')) {
        payload.response_format = { type: "json_object" };
      }

      const chatCompletion = await Promise.race([
        groq.chat.completions.create(payload),
        timeoutPromise
      ]);

      const contentString = chatCompletion.choices[0].message.content;
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(contentString);
      } catch (e) {
        const cleanedString = contentString.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedJson = JSON.parse(cleanedString);
      }

      if (!parsedJson || !Array.isArray(parsedJson.precautions)) {
        throw new Error("Malformed JSON missing required arrays.");
      }

      return {
        source: "ai",
        summary: parsedJson.summary || fallback.summary,
        whyScore: Array.isArray(parsedJson.whyScore) ? parsedJson.whyScore : fallback.whyScore,
        riskFactors: Array.isArray(parsedJson.riskFactors) ? parsedJson.riskFactors : fallback.riskFactors,
        precautions: parsedJson.precautions,
        recommendedAction: parsedJson.recommendedAction || fallback.recommendedAction
      };
    } catch (err) {
      console.error(`[GROQ_ERROR] provider=groq stage=request status=${err.status || 'unknown'} fallback=deterministic`);
      
      const isRetryable = err.message.includes('Timeout') || err.status === 429 || (err.status >= 500 && err.status <= 599);
      if (isRetryable && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return makeGroqRequest(retries - 1);
      }
      return fallback;
    }
  };

  return await makeGroqRequest();
};

const performVerification = async (type, normalizedInput) => {
  // 1. Gather deterministic evidence
  const deterministicData = await getDeterministicSignals(type, normalizedInput);
  
  // 2. Generate analysis (AI or Deterministic)
  const analysis = await generateRiskInterpretation(type, normalizedInput, deterministicData);

  // 3. Return the exact unified contract requested by the frontend
  return {
    success: true,
    verification: {
      score: deterministicData.score,
      riskLevel: deterministicData.riskLevel,
      targetType: type,
      targetValue: normalizedInput,
      signalsAnalyzed: deterministicData.signals.length + deterministicData.warnings.length,
      evidenceChecked: deterministicData.signals.length,
      riskIndicators: deterministicData.warnings.length,
      confidence: deterministicData.confidence,
      signals: deterministicData.signals,
      warnings: deterministicData.warnings,
      limitations: deterministicData.limitations
    },
    analysis: analysis,
    
    // Spread for legacy backwards compatibility during transition
    ...deterministicData,
    summary: analysis.summary,
    whyThisScore: analysis.whyScore.join(' '),
    recommendedAction: analysis.recommendedAction
  };
};

module.exports = { performVerification };
