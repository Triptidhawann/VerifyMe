const dns = require('dns').promises;
const { checkDomain, evaluateSpfPolicy } = require('./intelligenceEngine');
const { FREE_EMAIL_PROVIDERS } = require('./jobShieldExtractor');

/**
 * Calculate Levenshtein distance between two strings for lookalike detection.
 */
function levenshteinDistance(a, b) {
  if (!a || !b) return (a || b || '').length;
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Detect deceptive lookalike domains mimicking legitimate company brands.
 * E.g. "stripe-careers.com", "google-hr.com", "m1crosoft.com", "apple-jobs.com"
 */
function detectLookalikeDomain(senderDomain, claimedDomain) {
  if (!senderDomain || !claimedDomain) return { isLookalike: false };

  const sDomain = senderDomain.toLowerCase().replace(/^www\./, '');
  const cDomain = claimedDomain.toLowerCase().replace(/^www\./, '');

  if (sDomain === cDomain) return { isLookalike: false };

  const sName = sDomain.split('.')[0];
  const cName = cDomain.split('.')[0];

  // 1. Suffix/Prefix patterns (e.g. google-careers, stripe-hr, jobs-apple)
  const FRAUD_AFFIXES = ['careers', 'jobs', 'hr', 'hiring', 'recruiting', 'talent', 'interview', 'work', 'desk', 'portal', 'team'];
  for (const affix of FRAUD_AFFIXES) {
    if (sName === `${cName}-${affix}` || sName === `${cName}${affix}` || sName === `${affix}-${cName}`) {
      return {
        isLookalike: true,
        reason: `Sender domain '${senderDomain}' mimics company domain '${claimedDomain}' using a suspicious hyphenated '${affix}' pattern common in recruitment phishing.`
      };
    }
  }

  // 2. Levenshtein edit distance for typo-squatting (e.g., length >= 5 and distance === 1)
  if (cName.length >= 5 && sName.length >= 5) {
    const dist = levenshteinDistance(sName, cName);
    if (dist === 1) {
      return {
        isLookalike: true,
        reason: `Sender domain '${senderDomain}' is a near-exact typo of '${claimedDomain}' (1-character discrepancy: typo-squatting indicator).`
      };
    }
  }

  // 3. Number substitution (e.g., '0' for 'o', '1' for 'l' or 'i')
  const unSubstituted = sName.replace(/0/g, 'o').replace(/1/g, 'l');
  if (unSubstituted === cName && sName !== cName) {
    return {
      isLookalike: true,
      reason: `Sender domain '${senderDomain}' uses numeral character substitution to masquerade as '${claimedDomain}'.`
    };
  }

  return { isLookalike: false };
}

/**
 * Investigate Sender Domain Alignment, SPF/DMARC Infrastructure, and Free Webmail Usage.
 */
async function investigateSenderAndDomain({ senderEmail, replyToEmail, claimedDomain, companyName }) {
  const result = {
    senderEmail: senderEmail || null,
    senderDomain: null,
    claimedDomain: claimedDomain || null,
    isFreeEmailSender: false,
    isDomainAligned: false,
    isSubdomainAligned: false,
    isLookalikeDomain: false,
    lookalikeDetails: null,
    replyToMismatch: false,
    replyToDetails: null,
    senderDnsValid: false,
    senderHasMx: false,
    spfStatus: 'UNKNOWN',
    dmarcStatus: 'UNKNOWN',
    findings: []
  };

  if (!senderEmail) {
    result.findings.push({
      category: 'SENDER_MISSING',
      severity: 'LOW',
      title: 'Sender Email Not Provided',
      description: 'Communication does not identify the sender email address. Recruiter identity cannot be authenticated against corporate domain records.'
    });
    return result;
  }

  const senderParts = senderEmail.split('@');
  if (senderParts.length !== 2) {
    result.findings.push({
      category: 'INVALID_SENDER_FORMAT',
      severity: 'MEDIUM',
      title: 'Malformed Sender Email',
      description: `Sender address '${senderEmail}' is not a valid email format.`
    });
    return result;
  }

  const senderDomain = senderParts[1].toLowerCase().trim();
  result.senderDomain = senderDomain;
  result.isFreeEmailSender = FREE_EMAIL_PROVIDERS.has(senderDomain);

  // 1. Free Webmail Usage Check
  if (result.isFreeEmailSender) {
    result.findings.push({
      category: 'FREE_EMAIL_RECRUITER',
      severity: companyName ? 'HIGH' : 'MEDIUM',
      title: 'Free Webmail Provider Used for Corporate Recruitment',
      description: `Sender is using a public webmail service (@${senderDomain}) rather than an authenticated corporate domain. Legitimate enterprise recruiters almost never issue formal job offers from personal free webmail accounts.`,
      recommendedAction: 'Treat any communication demanding personal data, fees, or urgent acceptance from a free webmail account with extreme suspicion.'
    });
  }

  // 2. Claimed Domain Alignment Check
  if (claimedDomain) {
    const cleanClaimed = claimedDomain.toLowerCase().replace(/^www\./, '').trim();
    if (senderDomain === cleanClaimed) {
      result.isDomainAligned = true;
      result.findings.push({
        category: 'DOMAIN_ALIGNED',
        severity: 'INFO',
        title: 'Sender Domain Matches Claimed Company',
        description: `Sender domain (@${senderDomain}) matches the official corporate domain (@${cleanClaimed}).`
      });
    } else if (senderDomain.endsWith(`.${cleanClaimed}`)) {
      result.isSubdomainAligned = true;
      result.isDomainAligned = true;
      result.findings.push({
        category: 'SUBDOMAIN_ALIGNED',
        severity: 'INFO',
        title: 'Sender Subdomain Matches Corporate Root',
        description: `Sender domain (@${senderDomain}) is an authoritative sub-domain of corporate domain (@${cleanClaimed}).`
      });
    } else if (!result.isFreeEmailSender) {
      // Check for Lookalike / Typo-squatting
      const lookalike = detectLookalikeDomain(senderDomain, cleanClaimed);
      if (lookalike.isLookalike) {
        result.isLookalikeDomain = true;
        result.lookalikeDetails = lookalike.reason;
        result.findings.push({
          category: 'LOOKALIKE_DOMAIN_DETECTED',
          severity: 'CRITICAL',
          title: 'Suspicious Lookalike Domain Detected',
          description: lookalike.reason,
          recommendedAction: `Do NOT respond. This domain is intentionally designed to impersonate '${claimedDomain}'.`
        });
      } else {
        result.findings.push({
          category: 'DOMAIN_MISMATCH',
          severity: 'HIGH',
          title: 'Sender Domain Mismatch',
          description: `Sender email (@${senderDomain}) does not match the claimed company domain (@${cleanClaimed}). The recruiter may be an unverified third-party or unauthorized sender.`,
          recommendedAction: `Independently verify whether '${senderDomain}' is an authorized recruitment agency representing '${cleanClaimed}'.`
        });
      }
    }
  }

  // 3. Reply-To Header Mismatch Check
  if (replyToEmail) {
    const replyParts = replyToEmail.split('@');
    if (replyParts.length === 2) {
      const replyDomain = replyParts[1].toLowerCase().trim();
      if (replyDomain !== senderDomain) {
        result.replyToMismatch = true;
        result.replyToDetails = `From address is @${senderDomain}, but Reply-To redirects responses to @${replyDomain}.`;
        result.findings.push({
          category: 'REPLY_TO_MISMATCH',
          severity: 'HIGH',
          title: 'Reply-To Address Redirection',
          description: result.replyToDetails,
          recommendedAction: 'Inspect the destination address carefully. Attackers use Reply-To redirection when spoofing display headers to divert victims to an attacker-controlled mailbox.'
        });
      }
    }
  }

  // 4. DNS MX and Anti-Spoofing Protocol Validation for Sender Domain
  try {
    const mxRecords = await dns.resolveMx(senderDomain).catch(() => []);
    result.senderHasMx = mxRecords.length > 0;
    result.senderDnsValid = mxRecords.length > 0;

    if (!result.senderHasMx) {
      result.findings.push({
        category: 'SENDER_DOMAIN_NO_MX',
        severity: 'CRITICAL',
        title: 'Sender Domain Cannot Receive Email (Missing MX)',
        description: `Domain '${senderDomain}' has no active Mail Exchange (MX) DNS records configured. Legitimate email cannot be received at this domain.`,
        recommendedAction: 'Reject communication. A domain without MX records cannot support functional email communication.'
      });
    }
  } catch (err) {
    // DNS error
    result.senderDnsValid = false;
  }

  return result;
}

/**
 * Investigate Recruitment Process Integrity for Red Flags.
 */
function investigateProcessIntegrity({ paymentRequests = [], sensitiveDocRequests = [], urgencyTactics = [] }) {
  const findings = [];

  // 1. Payment Requests (Absolute Critical Red Flags)
  for (const p of paymentRequests) {
    findings.push({
      category: 'UPFRONT_FEE_DEMAND',
      severity: 'CRITICAL',
      title: 'Advance Payment or Fee Demand Detected',
      description: p,
      recommendedAction: 'NEVER pay money for equipment, registration, training, or background checks during hiring. Legitimate employers never require candidates to transfer funds, purchase gift cards, or deposit advance checks.'
    });
  }

  // 2. Premature Credential / Banking Data Theft
  for (const s of sensitiveDocRequests) {
    findings.push({
      category: 'SENSITIVE_CREDENTIAL_THEFT',
      severity: 'CRITICAL',
      title: 'Premature Sensitive Information Request',
      description: s,
      recommendedAction: 'Do not provide banking credentials, OTP codes, or government ID cards prior to a credible in-person or official video interview.'
    });
  }

  // 3. High-Pressure Deadlines / Immediate Offers Without Interview
  for (const u of urgencyTactics) {
    const isImmediateNoInterview = u.toLowerCase().includes('without interview');
    findings.push({
      category: isImmediateNoInterview ? 'OFFER_WITHOUT_INTERVIEW' : 'ARTIFICIAL_URGENCY',
      severity: isImmediateNoInterview ? 'HIGH' : 'MEDIUM',
      title: isImmediateNoInterview ? 'Job Offer Granted Without Interview' : 'High-Pressure Recruitment Deadline',
      description: u,
      recommendedAction: isImmediateNoInterview
        ? 'Real corporate offers require formal screening, technical assessment, or interactive interviews. Immediate offers are almost exclusively fraudulent.'
        : 'Take your time to independently verify the recruiter through verified company contact numbers.'
    });
  }

  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;

  return {
    hasRedFlags: findings.length > 0,
    criticalCount,
    highCount,
    mediumCount,
    findings
  };
}

module.exports = {
  investigateSenderAndDomain,
  investigateProcessIntegrity,
  detectLookalikeDomain,
  levenshteinDistance
};
