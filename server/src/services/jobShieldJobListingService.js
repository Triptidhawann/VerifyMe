const https = require('https');
const http = require('http');
const dns = require('dns').promises;
const { isPrivateOrInternalIP } = require('./intelligenceEngine');

// Well-known verified Applicant Tracking System (ATS) root domains (sorted by specificity/length)
const VERIFIED_ATS_DOMAINS = [
  'boards.greenhouse.io',
  'jobs.lever.co',
  'jobs.ashbyhq.com',
  'myworkdayjobs.com',
  'smartrecruiters.com',
  'greenhouse.io',
  'lever.co',
  'ashbyhq.com',
  'icims.com',
  'taleo.net',
  'workable.com',
  'bamboohr.com',
  'jobvite.com',
  'rippling.com'
];

/**
 * Normalizes a company name into candidate URL tokens / slugs.
 */
function deriveCompanyTokens(companyName, claimedDomain) {
  const tokens = new Set();

  if (claimedDomain) {
    // E.g. "stripe.com" -> "stripe"
    const domainSlug = claimedDomain.replace(/\.[a-z]{2,}(?:\.[a-z]{2,})?$/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (domainSlug) tokens.add(domainSlug);
  }

  if (companyName) {
    const cleaned = companyName
      .toLowerCase()
      .replace(/\b(inc|llc|ltd|corp|corporation|technologies|technology|software|solutions|services|group|holdings|co|company)\b/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
    if (cleaned && cleaned.length >= 2) tokens.add(cleaned);

    // Also with hyphens if multi-word
    const hyphenated = companyName
      .toLowerCase()
      .replace(/\b(inc|llc|ltd|corp|corporation|technologies|software|solutions|services|group|holdings|co)\b/gi, '')
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (hyphenated && hyphenated.length >= 2 && hyphenated !== cleaned) tokens.add(hyphenated);
  }

  return Array.from(tokens);
}

/**
 * Helper to safely perform HTTPS GET with timeout.
 */
function safeHttpsGetJson(url, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return reject(new Error('Invalid URL'));
    }

    const req = https.get(url, {
      headers: {
        'User-Agent': 'VerifyMe-JobShield/1.0 (Public Recruitment Verification)',
        'Accept': 'application/json'
      },
      timeout: timeoutMs
    }, (res) => {
      if (res.statusCode === 404) {
        res.resume();
        return resolve({ statusCode: 404, data: null });
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return resolve({ statusCode: res.statusCode, data: null });
      }

      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        raw += chunk;
        if (raw.length > 2 * 1024 * 1024) { // 2MB limit
          req.destroy();
          resolve({ statusCode: 200, data: null, error: 'Payload exceeded 2MB limit' });
        }
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (jsonErr) {
          resolve({ statusCode: res.statusCode, data: null, parseError: true });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 408, data: null, error: 'Request timed out' });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, data: null, error: err.message });
    });
  });
}

/**
 * Helper to evaluate title similarity.
 */
function titlesMatch(a, b) {
  if (!a || !b) return { exact: false, similar: false };
  const normA = a.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const normB = b.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  if (normA === normB) return { exact: true, similar: true };
  if (normA.includes(normB) || normB.includes(normA)) return { exact: false, similar: true };

  // Check token intersection
  const tokensA = new Set(normA.split(' ').filter(t => t.length > 2));
  const tokensB = new Set(normB.split(' ').filter(t => t.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return { exact: false, similar: false };

  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++;
  }
  const ratio = overlap / Math.min(tokensA.size, tokensB.size);
  return { exact: false, similar: ratio >= 0.7 };
}

/**
 * Adapter 1: Greenhouse Public Job Board API
 * Endpoint: https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs
 */
async function queryGreenhouse(companyToken, targetJobTitle, targetJobId) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(companyToken)}/jobs`;
  const checkedAt = new Date().toISOString();

  const response = await safeHttpsGetJson(url);

  if (response.statusCode === 404 || !response.data || !Array.isArray(response.data.jobs)) {
    return {
      sourceName: 'Greenhouse Public ATS Board',
      sourceUrl: url,
      sourceType: 'official_ats',
      status: 'BOARD_NOT_DISCOVERED',
      checkedAt,
      whatWasChecked: `Queried public Greenhouse job listings for board token '${companyToken}'.`,
      matchedJob: null,
      explanation: `No public Greenhouse job board registered under token '${companyToken}'.`
    };
  }

  const jobs = response.data.jobs;
  let exactMatch = null;
  let similarMatch = null;

  for (const j of jobs) {
    const jobIdStr = String(j.id || j.requisition_id || '');
    const title = j.title || '';
    
    // Check Requisition ID match
    if (targetJobId && jobIdStr && jobIdStr.toLowerCase() === targetJobId.toLowerCase()) {
      exactMatch = {
        id: jobIdStr,
        title: title,
        location: j.location?.name || 'Unspecified',
        url: j.absolute_url || url,
        updatedAt: j.updated_at
      };
      break;
    }

    // Check Title Match
    const match = titlesMatch(title, targetJobTitle);
    if (match.exact && !exactMatch) {
      exactMatch = {
        id: jobIdStr,
        title: title,
        location: j.location?.name || 'Unspecified',
        url: j.absolute_url || url,
        updatedAt: j.updated_at
      };
    } else if (match.similar && !similarMatch) {
      similarMatch = {
        id: jobIdStr,
        title: title,
        location: j.location?.name || 'Unspecified',
        url: j.absolute_url || url,
        updatedAt: j.updated_at
      };
    }
  }

  if (exactMatch) {
    return {
      sourceName: 'Greenhouse Public ATS Board',
      sourceUrl: exactMatch.url || url,
      sourceType: 'official_ats',
      status: 'FOUND_EXACT',
      checkedAt,
      whatWasChecked: `Retrieved ${jobs.length} active jobs on official Greenhouse board for '${companyToken}'.`,
      matchedJob: exactMatch,
      explanation: `Verified active vacancy '${exactMatch.title}' (ID: ${exactMatch.id}) on official company Greenhouse board.`
    };
  }

  if (similarMatch) {
    return {
      sourceName: 'Greenhouse Public ATS Board',
      sourceUrl: similarMatch.url || url,
      sourceType: 'official_ats',
      status: 'FOUND_SIMILAR',
      checkedAt,
      whatWasChecked: `Retrieved ${jobs.length} active jobs on official Greenhouse board for '${companyToken}'.`,
      matchedJob: similarMatch,
      explanation: `Found related active vacancy '${similarMatch.title}' (ID: ${similarMatch.id}) on official Greenhouse board.`
    };
  }

  return {
    sourceName: 'Greenhouse Public ATS Board',
    sourceUrl: url,
    sourceType: 'official_ats',
    status: 'NOT_FOUND_ON_BOARD',
    checkedAt,
    whatWasChecked: `Retrieved ${jobs.length} active jobs on official Greenhouse board for '${companyToken}'.`,
    matchedJob: null,
    explanation: `Official Greenhouse board is active with ${jobs.length} openings, but no listing matching '${targetJobTitle || targetJobId}' was found.`
  };
}

/**
 * Adapter 2: Lever Public Job Postings API
 * Endpoint: https://api.lever.co/v0/postings/{company}
 */
async function queryLever(companyToken, targetJobTitle, targetJobId) {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(companyToken)}`;
  const checkedAt = new Date().toISOString();

  const response = await safeHttpsGetJson(url);

  if (response.statusCode === 404 || !response.data || !Array.isArray(response.data)) {
    return {
      sourceName: 'Lever Public ATS Board',
      sourceUrl: url,
      sourceType: 'official_ats',
      status: 'BOARD_NOT_DISCOVERED',
      checkedAt,
      whatWasChecked: `Queried public Lever postings for company '${companyToken}'.`,
      matchedJob: null,
      explanation: `No public Lever postings board found for '${companyToken}'.`
    };
  }

  const jobs = response.data;
  let exactMatch = null;
  let similarMatch = null;

  for (const j of jobs) {
    const jobIdStr = String(j.id || '');
    const title = j.text || '';

    if (targetJobId && jobIdStr && jobIdStr.toLowerCase() === targetJobId.toLowerCase()) {
      exactMatch = {
        id: jobIdStr,
        title: title,
        location: j.categories?.location || 'Unspecified',
        url: j.hostedUrl || url,
        createdAt: j.createdAt
      };
      break;
    }

    const match = titlesMatch(title, targetJobTitle);
    if (match.exact && !exactMatch) {
      exactMatch = {
        id: jobIdStr,
        title: title,
        location: j.categories?.location || 'Unspecified',
        url: j.hostedUrl || url,
        createdAt: j.createdAt
      };
    } else if (match.similar && !similarMatch) {
      similarMatch = {
        id: jobIdStr,
        title: title,
        location: j.categories?.location || 'Unspecified',
        url: j.hostedUrl || url,
        createdAt: j.createdAt
      };
    }
  }

  if (exactMatch) {
    return {
      sourceName: 'Lever Public ATS Board',
      sourceUrl: exactMatch.url || url,
      sourceType: 'official_ats',
      status: 'FOUND_EXACT',
      checkedAt,
      whatWasChecked: `Retrieved ${jobs.length} active postings on official Lever board for '${companyToken}'.`,
      matchedJob: exactMatch,
      explanation: `Verified active vacancy '${exactMatch.title}' on official Lever board.`
    };
  }

  if (similarMatch) {
    return {
      sourceName: 'Lever Public ATS Board',
      sourceUrl: similarMatch.url || url,
      sourceType: 'official_ats',
      status: 'FOUND_SIMILAR',
      checkedAt,
      whatWasChecked: `Retrieved ${jobs.length} active postings on official Lever board for '${companyToken}'.`,
      matchedJob: similarMatch,
      explanation: `Found related active vacancy '${similarMatch.title}' on official Lever board.`
    };
  }

  return {
    sourceName: 'Lever Public ATS Board',
    sourceUrl: url,
    sourceType: 'official_ats',
    status: 'NOT_FOUND_ON_BOARD',
    checkedAt,
    whatWasChecked: `Retrieved ${jobs.length} active postings on official Lever board for '${companyToken}'.`,
    matchedJob: null,
    explanation: `Official Lever board has ${jobs.length} open positions, but none match '${targetJobTitle || targetJobId}'.`
  };
}

/**
 * Adapter 3: Ashby Public Job Board API
 * Endpoint: https://api.ashbyhq.com/posting-api/job-board/{organization}
 */
async function queryAshby(companyToken, targetJobTitle, targetJobId) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(companyToken)}`;
  const checkedAt = new Date().toISOString();

  const response = await safeHttpsGetJson(url);

  if (response.statusCode === 404 || !response.data || !Array.isArray(response.data.jobs)) {
    return {
      sourceName: 'Ashby Public ATS Board',
      sourceUrl: url,
      sourceType: 'official_ats',
      status: 'BOARD_NOT_DISCOVERED',
      checkedAt,
      whatWasChecked: `Queried public Ashby job board for organization '${companyToken}'.`,
      matchedJob: null,
      explanation: `No public Ashby board found for '${companyToken}'.`
    };
  }

  const jobs = response.data.jobs;
  let exactMatch = null;
  let similarMatch = null;

  for (const j of jobs) {
    const jobIdStr = String(j.id || '');
    const title = j.title || '';

    if (targetJobId && jobIdStr && jobIdStr.toLowerCase() === targetJobId.toLowerCase()) {
      exactMatch = {
        id: jobIdStr,
        title: title,
        location: j.location || 'Unspecified',
        url: j.jobUrl || url
      };
      break;
    }

    const match = titlesMatch(title, targetJobTitle);
    if (match.exact && !exactMatch) {
      exactMatch = {
        id: jobIdStr,
        title: title,
        location: j.location || 'Unspecified',
        url: j.jobUrl || url
      };
    } else if (match.similar && !similarMatch) {
      similarMatch = {
        id: jobIdStr,
        title: title,
        location: j.location || 'Unspecified',
        url: j.jobUrl || url
      };
    }
  }

  if (exactMatch) {
    return {
      sourceName: 'Ashby Public ATS Board',
      sourceUrl: exactMatch.url || url,
      sourceType: 'official_ats',
      status: 'FOUND_EXACT',
      checkedAt,
      whatWasChecked: `Retrieved ${jobs.length} active openings on official Ashby board for '${companyToken}'.`,
      matchedJob: exactMatch,
      explanation: `Verified active vacancy '${exactMatch.title}' on official Ashby board.`
    };
  }

  if (similarMatch) {
    return {
      sourceName: 'Ashby Public ATS Board',
      sourceUrl: similarMatch.url || url,
      sourceType: 'official_ats',
      status: 'FOUND_SIMILAR',
      checkedAt,
      whatWasChecked: `Retrieved ${jobs.length} active openings on official Ashby board for '${companyToken}'.`,
      matchedJob: similarMatch,
      explanation: `Found related active vacancy '${similarMatch.title}' on official Ashby board.`
    };
  }

  return {
    sourceName: 'Ashby Public ATS Board',
    sourceUrl: url,
    sourceType: 'official_ats',
    status: 'NOT_FOUND_ON_BOARD',
    checkedAt,
    whatWasChecked: `Retrieved ${jobs.length} active openings on official Ashby board for '${companyToken}'.`,
    matchedJob: null,
    explanation: `Official Ashby board has ${jobs.length} open positions, but none match '${targetJobTitle || targetJobId}'.`
  };
}

/**
 * Adapter 4: Application URL Destination Inspector
 */
function inspectApplicationUrl(applicationUrl, claimedDomain) {
  if (!applicationUrl) {
    return {
      isOfficialAts: false,
      isClaimedDomain: false,
      isSuspicious: false,
      details: 'No application link provided in recruitment communication.'
    };
  }

  try {
    const u = new URL(applicationUrl);
    const hostname = u.hostname.toLowerCase().replace(/^www\./, '');

    // 1. Check if hostname matches any known verified ATS
    const matchedAts = VERIFIED_ATS_DOMAINS.find(ats => hostname === ats || hostname.endsWith(`.${ats}`));
    if (matchedAts) {
      return {
        isOfficialAts: true,
        isClaimedDomain: false,
        isSuspicious: false,
        atsDomain: matchedAts,
        url: applicationUrl,
        details: `Application URL redirects directly to verified official recruitment ATS: ${matchedAts}`
      };
    }

    // 2. Check if hostname matches claimed company domain
    if (claimedDomain) {
      const cleanClaimed = claimedDomain.toLowerCase().replace(/^www\./, '');
      if (hostname === cleanClaimed || hostname.endsWith(`.${cleanClaimed}`)) {
        return {
          isOfficialAts: false,
          isClaimedDomain: true,
          isSuspicious: false,
          url: applicationUrl,
          details: `Application URL points directly to official company domain: ${claimedDomain}`
        };
      }
    }

    // 3. Check for suspicious redirectors, URL shorteners, or free forms
    const SUSPICIOUS_DESTINATIONS = [
      'bit.ly', 'tinyurl.com', 'forms.gle', 'docs.google.com', 'form.jotform.com',
      'typeform.com', 't.me', 'wa.me', 'surveyhero.com', 'surveymonkey.com'
    ];
    const isSuspicious = SUSPICIOUS_DESTINATIONS.some(s => hostname === s || hostname.endsWith(`.${s}`));
    if (isSuspicious) {
      return {
        isOfficialAts: false,
        isClaimedDomain: false,
        isSuspicious: true,
        url: applicationUrl,
        details: `Application destination uses third-party form/shortener/chat (${hostname}) rather than official corporate career infrastructure.`
      };
    }

    return {
      isOfficialAts: false,
      isClaimedDomain: false,
      isSuspicious: false,
      url: applicationUrl,
      details: `Application destination is an external domain (${hostname}).`
    };
  } catch {
    return {
      isOfficialAts: false,
      isClaimedDomain: false,
      isSuspicious: true,
      details: 'Application URL is malformed or invalid.'
    };
  }
}

/**
 * Main Job Listing Investigation Orchestrator.
 * Queries official ATS adapters and correlates findings.
 */
async function investigateJobListing({ companyName, claimedDomain, jobTitle, jobId, applicationUrl }) {
  const tokens = deriveCompanyTokens(companyName, claimedDomain);
  const evidence = [];
  let bestMatch = null;
  let activeBoardFound = false;

  // 1. Inspect Application URL
  const appUrlAnalysis = inspectApplicationUrl(applicationUrl, claimedDomain);
  evidence.push({
    sourceName: 'Application Destination Link',
    sourceUrl: applicationUrl || 'N/A',
    sourceType: 'user_provided',
    status: appUrlAnalysis.isOfficialAts || appUrlAnalysis.isClaimedDomain
      ? 'APPLICATION_URL_OFFICIAL'
      : (appUrlAnalysis.isSuspicious ? 'APPLICATION_URL_SUSPICIOUS' : 'APPLICATION_URL_EXTERNAL'),
    checkedAt: new Date().toISOString(),
    whatWasChecked: 'Verified destination hostname against trusted ATS roots and claimed company domain.',
    matchedJob: null,
    explanation: appUrlAnalysis.details
  });

  // 2. Query Public ATS Adapters for each candidate company token
  for (const token of tokens) {
    if (bestMatch?.status === 'FOUND_EXACT') break;

    // Greenhouse
    const ghResult = await queryGreenhouse(token, jobTitle, jobId);
    if (ghResult.status !== 'BOARD_NOT_DISCOVERED') {
      activeBoardFound = true;
      evidence.push(ghResult);
      if (ghResult.status === 'FOUND_EXACT') {
        bestMatch = ghResult;
        break;
      }
      if (ghResult.status === 'FOUND_SIMILAR' && (!bestMatch || bestMatch.status !== 'FOUND_SIMILAR')) {
        bestMatch = ghResult;
      }
    }

    // Lever
    const leverResult = await queryLever(token, jobTitle, jobId);
    if (leverResult.status !== 'BOARD_NOT_DISCOVERED') {
      activeBoardFound = true;
      evidence.push(leverResult);
      if (leverResult.status === 'FOUND_EXACT') {
        bestMatch = leverResult;
        break;
      }
      if (leverResult.status === 'FOUND_SIMILAR' && (!bestMatch || bestMatch.status !== 'FOUND_SIMILAR')) {
        bestMatch = leverResult;
      }
    }

    // Ashby
    const ashbyResult = await queryAshby(token, jobTitle, jobId);
    if (ashbyResult.status !== 'BOARD_NOT_DISCOVERED') {
      activeBoardFound = true;
      evidence.push(ashbyResult);
      if (ashbyResult.status === 'FOUND_EXACT') {
        bestMatch = ashbyResult;
        break;
      }
      if (ashbyResult.status === 'FOUND_SIMILAR' && (!bestMatch || bestMatch.status !== 'FOUND_SIMILAR')) {
        bestMatch = ashbyResult;
      }
    }
  }

  // Determine overall listing verification verdict
  let listingVerdict = 'INSUFFICIENT_DATA';
  let summary = '';

  if (bestMatch?.status === 'FOUND_EXACT') {
    listingVerdict = 'OFFICIALLY_VERIFIED_ACTIVE';
    summary = `Active job listing confirmed on ${bestMatch.sourceName} (${bestMatch.matchedJob.title}).`;
  } else if (bestMatch?.status === 'FOUND_SIMILAR') {
    listingVerdict = 'PARTIALLY_MATCHED_SIMILAR';
    summary = `Related position found on ${bestMatch.sourceName} (${bestMatch.matchedJob.title}), but specific title/ID differs.`;
  } else if (activeBoardFound) {
    listingVerdict = 'OFFICIAL_BOARD_CHECKED_NOT_FOUND';
    summary = `Official ATS board was queried and active listings were found, but this specific vacancy was not located. Note: Vacancies may be confidential, recently closed, or handled via external agencies.`;
  } else if (appUrlAnalysis.isOfficialAts || appUrlAnalysis.isClaimedDomain) {
    listingVerdict = 'APPLICATION_DESTINATION_VERIFIED';
    summary = `Job posting directly links to official corporate or ATS career portal.`;
  } else {
    listingVerdict = 'NO_OFFICIAL_PUBLIC_ATS_FOUND';
    summary = `No public Greenhouse, Lever, or Ashby board was discovered for '${companyName || claimedDomain || 'company'}'. The employer may use proprietary HR systems, an unindexed ATS, or post exclusively on private job portals.`;
  }

  return {
    listingVerdict,
    summary,
    bestMatch,
    evidence,
    appUrlAnalysis,
    activeBoardFound,
    searchedTokens: tokens
  };
}

module.exports = {
  investigateJobListing,
  queryGreenhouse,
  queryLever,
  queryAshby,
  inspectApplicationUrl,
  deriveCompanyTokens,
  VERIFIED_ATS_DOMAINS
};
