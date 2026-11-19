const dns = require('dns').promises;
const { isPrivateOrInternalIP } = require('./intelligenceEngine');

// Pre-compiled directory of recognized Indian educational, corporate, and statutory institutions
const RECOGNIZED_INDIAN_ISSUERS = [
  {
    legalName: 'Indian Institute of Technology Bombay',
    brandName: 'IIT Bombay',
    domain: 'iitb.ac.in',
    category: 'INSTITUTE_OF_NATIONAL_IMPORTANCE',
    statutoryBody: 'Ministry of Education, Govt of India',
    country: 'India',
    aliases: ['iit bombay', 'indian institute of technology bombay', 'iitb']
  },
  {
    legalName: 'Indian Institute of Technology Delhi',
    brandName: 'IIT Delhi',
    domain: 'iitd.ac.in',
    category: 'INSTITUTE_OF_NATIONAL_IMPORTANCE',
    statutoryBody: 'Ministry of Education, Govt of India',
    country: 'India',
    aliases: ['iit delhi', 'indian institute of technology delhi', 'iitd']
  },
  {
    legalName: 'University of Delhi',
    brandName: 'Delhi University',
    domain: 'du.ac.in',
    category: 'CENTRAL_UNIVERSITY',
    statutoryBody: 'University Grants Commission (UGC)',
    country: 'India',
    aliases: ['university of delhi', 'delhi university', 'du']
  },
  {
    legalName: 'Jawaharlal Nehru University',
    brandName: 'JNU',
    domain: 'jnu.ac.in',
    category: 'CENTRAL_UNIVERSITY',
    statutoryBody: 'University Grants Commission (UGC)',
    country: 'India',
    aliases: ['jawaharlal nehru university', 'jnu']
  },
  {
    legalName: 'Anna University',
    brandName: 'Anna University',
    domain: 'annauniv.edu',
    category: 'STATE_UNIVERSITY',
    statutoryBody: 'University Grants Commission (UGC)',
    country: 'India',
    aliases: ['anna university', 'annauniv']
  },
  {
    legalName: 'Tata Consultancy Services Limited',
    brandName: 'TCS',
    domain: 'tcs.com',
    category: 'PUBLIC_LIMITED_COMPANY',
    statutoryBody: 'Ministry of Corporate Affairs (MCA)',
    country: 'India',
    aliases: ['tata consultancy services', 'tcs', 'tata consultancy services limited']
  },
  {
    legalName: 'Infosys Limited',
    brandName: 'Infosys',
    domain: 'infosys.com',
    category: 'PUBLIC_LIMITED_COMPANY',
    statutoryBody: 'Ministry of Corporate Affairs (MCA)',
    country: 'India',
    aliases: ['infosys', 'infosys limited', 'infosys technologies']
  },
  {
    legalName: 'Wipro Limited',
    brandName: 'Wipro',
    domain: 'wipro.com',
    category: 'PUBLIC_LIMITED_COMPANY',
    statutoryBody: 'Ministry of Corporate Affairs (MCA)',
    country: 'India',
    aliases: ['wipro', 'wipro limited']
  },
  {
    legalName: 'Coursera Inc.',
    brandName: 'Coursera',
    domain: 'coursera.org',
    category: 'GLOBAL_LEARNING_PLATFORM',
    statutoryBody: 'Accredited Higher Ed Partner Platform',
    country: 'United States',
    aliases: ['coursera', 'coursera inc']
  },
  {
    legalName: 'Udemy, Inc.',
    brandName: 'Udemy',
    domain: 'udemy.com',
    category: 'GLOBAL_LEARNING_PLATFORM',
    statutoryBody: 'Online Course Marketplace',
    country: 'United States',
    aliases: ['udemy', 'udemy inc']
  },
  {
    legalName: 'Amazon Web Services, Inc.',
    brandName: 'Amazon Web Services (AWS)',
    domain: 'aws.amazon.com',
    category: 'GLOBAL_CLOUD_AND_TECH_PROVIDER',
    statutoryBody: 'Official Cloud Certification & Training Provider',
    country: 'United States',
    aliases: ['aws', 'amazon web services', 'aws training and certification', 'aws skill builder', 'amazon web services inc']
  },
  {
    legalName: 'Google LLC',
    brandName: 'Google Cloud',
    domain: 'cloud.google.com',
    category: 'GLOBAL_CLOUD_AND_TECH_PROVIDER',
    statutoryBody: 'Official Cloud Certification & Training Provider',
    country: 'United States',
    aliases: ['google cloud', 'gcp', 'google cloud skills boost', 'google cloud platform', 'google']
  },
  {
    legalName: 'Microsoft Corporation',
    brandName: 'Microsoft Learn',
    domain: 'learn.microsoft.com',
    category: 'GLOBAL_CLOUD_AND_TECH_PROVIDER',
    statutoryBody: 'Official Technical Certification Provider',
    country: 'United States',
    aliases: ['microsoft', 'microsoft learn', 'microsoft certified', 'azure']
  }
];

/**
 * Check if a domain looks like a lookalike / typosquatting domain
 */
function detectLookalikeDomain(claimedDomain, referenceDomain) {
  if (!claimedDomain || !referenceDomain) return false;
  const c = claimedDomain.toLowerCase().replace(/^www\./, '');
  const r = referenceDomain.toLowerCase().replace(/^www\./, '');
  if (c === r) return false;

  // Levenshtein distance on base domain names
  const cName = c.split('.')[0];
  const rName = r.split('.')[0];

  if (Math.abs(cName.length - rName.length) > 3) return false;

  // Simple edit distance
  let diff = 0;
  const minLen = Math.min(cName.length, rName.length);
  for (let i = 0; i < minLen; i++) {
    if (cName[i] !== rName[i]) diff++;
  }
  diff += Math.abs(cName.length - rName.length);

  return diff === 1 || diff === 2;
}

/**
 * Perform Authoritative DNS check on claimed domain
 */
async function inspectDomainReachability(domain) {
  if (!domain) return { resolved: false, reason: 'No domain provided' };
  try {
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    if (isPrivateOrInternalIP(cleanDomain)) {
      return { resolved: false, blocked: true, reason: 'Domain is private / internal IP' };
    }

    const addresses = await dns.lookup(cleanDomain, { all: true });
    if (!addresses || addresses.length === 0) {
      return { resolved: false, reason: 'No DNS records found' };
    }

    // Check for private IPs in lookup answers
    for (const addr of addresses) {
      if (isPrivateOrInternalIP(addr.address)) {
        return { resolved: false, blocked: true, reason: `Resolves to internal IP ${addr.address}` };
      }
    }

    return { resolved: true, addresses: addresses.map(a => a.address) };
  } catch (err) {
    return { resolved: false, reason: err.message };
  }
}

/**
 * Discover the claimed issuer identity from extracted document signals and user parameters.
 */
async function discoverIssuerIdentity({
  extractedOrgName = null,
  extractedDomain = null,
  extractedWebsite = null,
  extractedEmail = null,
  extractedEmailDomain = null,
  userSuppliedOrg = null,
  userSuppliedWebsite = null
}) {
  const emailDomain = extractedEmailDomain || (extractedEmail && extractedEmail.includes('@') ? extractedEmail.split('@')[1].toLowerCase().trim() : null);
  const queryOrg = (userSuppliedOrg || extractedOrgName || '').trim();
  let queryDomain = (userSuppliedWebsite || extractedWebsite || extractedDomain || emailDomain || '').trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .toLowerCase();

  const findings = [];
  const candidateMatches = [];

  // 1. Search Pre-compiled recognized registry
  let primaryMatch = null;
  const normalizedQuery = queryOrg.toLowerCase();

  if (normalizedQuery) {
    for (const issuer of RECOGNIZED_INDIAN_ISSUERS) {
      const isAliasMatch = issuer.aliases.some(alias => 
        normalizedQuery === alias || 
        normalizedQuery.includes(alias) || 
        alias.includes(normalizedQuery)
      );

      if (isAliasMatch) {
        candidateMatches.push(issuer);
      }
    }
  }

  // Exact or closest match
  if (candidateMatches.length === 1) {
    primaryMatch = candidateMatches[0];
  } else if (candidateMatches.length > 1) {
    // If domain also supplied, match by domain
    if (queryDomain) {
      primaryMatch = candidateMatches.find(c => c.domain === queryDomain) || null;
    }
  }

  // 2. Evaluate Domain Alignment & Lookalikes
  let isLookalike = false;
  let domainAligned = false;

  if (primaryMatch && queryDomain) {
    if (queryDomain === primaryMatch.domain || queryDomain.endsWith('.' + primaryMatch.domain)) {
      domainAligned = true;
      findings.push({
        status: 'CONFIRMED',
        detail: `Claimed domain '${queryDomain}' matches official root domain for ${primaryMatch.legalName}.`
      });
    } else {
      isLookalike = detectLookalikeDomain(queryDomain, primaryMatch.domain);
      if (isLookalike) {
        findings.push({
          status: 'WARNING',
          detail: `Domain '${queryDomain}' appears to be a lookalike / typosquatted imitation of official domain '${primaryMatch.domain}'.`
        });
      } else {
        findings.push({
          status: 'MISMATCH',
          detail: `Domain '${queryDomain}' does not belong to official infrastructure of '${primaryMatch.legalName}' (${primaryMatch.domain}).`
        });
      }
    }
  }

  // If email domain differs from primary domain
  if (primaryMatch && emailDomain && emailDomain !== queryDomain) {
    const isEmailLookalike = detectLookalikeDomain(emailDomain, primaryMatch.domain);
    if (isEmailLookalike) {
      isLookalike = true;
      findings.push({
        status: 'WARNING',
        detail: `Contact email domain '@${emailDomain}' is a typosquatted / lookalike domain imitating official domain '${primaryMatch.domain}'.`
      });
    }
  }

  // 3. DNS reachability check
  let domainReachability = { resolved: false, reason: 'Unspecified' };
  const targetDomain = queryDomain || (primaryMatch ? primaryMatch.domain : null);
  if (targetDomain) {
    domainReachability = await inspectDomainReachability(targetDomain);
  }

  // 4. Determine Issuer Identity Status
  let identityStatus = 'UNRESOLVED';
  let confidenceReason = '';

  if (primaryMatch && (domainAligned || !queryDomain)) {
    identityStatus = 'ESTABLISHED';
    confidenceReason = `Matched known authoritative registry entity: ${primaryMatch.legalName} (${primaryMatch.category}).`;
  } else if (primaryMatch && isLookalike) {
    identityStatus = 'INCONSISTENT';
    confidenceReason = `Entity resembles '${primaryMatch.legalName}', but associated domain '${queryDomain}' exhibits lookalike impersonation markers.`;
  } else if (primaryMatch && !domainAligned) {
    identityStatus = 'PARTIALLY_ESTABLISHED';
    confidenceReason = `Organization '${primaryMatch.legalName}' is recognized, but submitted digital properties do not align with official domain.`;
  } else if (queryOrg && domainReachability.resolved) {
    identityStatus = 'PARTIALLY_ESTABLISHED';
    confidenceReason = `Organization '${queryOrg}' possesses active registered domain '${targetDomain}', but official accreditation is not indexed in public tier.`;
  } else if (queryOrg) {
    identityStatus = 'UNRESOLVED';
    confidenceReason = `Organization name '${queryOrg}' was extracted, but no independent public registration records were located.`;
  } else {
    identityStatus = 'UNRESOLVED';
    confidenceReason = 'No verifiable organization name or corporate domain was identifiable in the credential document.';
  }

  return {
    queryOrg,
    queryDomain: targetDomain,
    identityStatus, // ESTABLISHED | PARTIALLY_ESTABLISHED | INCONSISTENT | UNRESOLVED
    confidenceReason,
    isLookalike,
    domainAligned,
    primaryMatch,
    candidateMatches: candidateMatches.map(c => ({
      legalName: c.legalName,
      brandName: c.brandName,
      domain: c.domain,
      category: c.category,
      statutoryBody: c.statutoryBody
    })),
    domainReachability,
    findings
  };
}

module.exports = {
  discoverIssuerIdentity,
  detectLookalikeDomain,
  inspectDomainReachability,
  RECOGNIZED_INDIAN_ISSUERS
};
