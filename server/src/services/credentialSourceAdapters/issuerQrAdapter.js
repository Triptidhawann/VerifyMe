const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const { isPrivateOrInternalIP } = require('../intelligenceEngine');

/**
 * Issuer-Specific Verification Portal & QR Endpoint Adapter
 * 
 * Securely evaluates verification URLs discovered in QR codes or certificate footers.
 * Enforces strict SSRF protections against internal network probing, DNS rebinding, and cloud metadata.
 */
async function queryIssuerVerificationEndpoint({ verificationUrl, claimedIssuerDomain = null, credentialId = null }) {
  const retrievalTimestamp = new Date().toISOString();

  if (!verificationUrl) {
    return {
      sourceName: 'Official Issuer Verification Endpoint',
      sourceType: 'ISSUER_DIRECT_PORTAL',
      sourceUrl: null,
      retrievalTimestamp,
      queryScope: 'Unspecified Endpoint',
      status: 'NOT_APPLICABLE',
      verificationMethod: 'PORTAL_DISCOVERY',
      returnedEvidence: null,
      limitations: 'Document contains no optical QR verification code or online validation URL.'
    };
  }

  // 1. URL Structure & Scheme Check
  let parsedUrl;
  try {
    parsedUrl = new URL(verificationUrl);
  } catch {
    return {
      sourceName: 'Official Issuer Verification Endpoint',
      sourceType: 'ISSUER_DIRECT_PORTAL',
      sourceUrl: verificationUrl,
      retrievalTimestamp,
      queryScope: verificationUrl,
      status: 'REJECTED',
      verificationMethod: 'URL_PARSING',
      returnedEvidence: { error: 'Malformed verification URL structure' },
      limitations: 'The verification endpoint extracted from the certificate is syntactically invalid.'
    };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      sourceName: 'Official Issuer Verification Endpoint',
      sourceType: 'ISSUER_DIRECT_PORTAL',
      sourceUrl: verificationUrl,
      retrievalTimestamp,
      queryScope: verificationUrl,
      status: 'REJECTED',
      verificationMethod: 'PROTOCOL_SECURITY_CHECK',
      returnedEvidence: { blockedProtocol: parsedUrl.protocol },
      limitations: `Unsafe URL protocol '${parsedUrl.protocol}' blocked by security sandbox.`
    };
  }

  // 2. SSRF Protection: Inspect Domain & IP
  const hostname = parsedUrl.hostname;

  if (isPrivateOrInternalIP(hostname)) {
    return {
      sourceName: 'Official Issuer Verification Endpoint',
      sourceType: 'ISSUER_DIRECT_PORTAL',
      sourceUrl: verificationUrl,
      retrievalTimestamp,
      queryScope: hostname,
      status: 'REJECTED',
      verificationMethod: 'SSRF_PROTECTION_GATE',
      returnedEvidence: { blockedHost: hostname, ssrfReason: 'Private or loopback IP address' },
      limitations: 'Verification URL points to private or internal infrastructure (SSRF prohibited).'
    };
  }

  // Resolve DNS to verify all IPs
  let resolvedIps = [];
  try {
    const rawLookup = await dns.lookup(hostname, { all: true });
    resolvedIps = Array.isArray(rawLookup) ? rawLookup : [rawLookup];
  } catch (dnsErr) {
    return {
      sourceName: 'Official Issuer Verification Endpoint',
      sourceType: 'ISSUER_DIRECT_PORTAL',
      sourceUrl: verificationUrl,
      retrievalTimestamp,
      queryScope: hostname,
      status: 'UNAVAILABLE',
      verificationMethod: 'AUTHORITATIVE_DNS_LOOKUP',
      returnedEvidence: { dnsError: dnsErr.message },
      limitations: `Verification host '${hostname}' could not be resolved via authoritative DNS.`
    };
  }

  for (const item of resolvedIps) {
    if (isPrivateOrInternalIP(item.address)) {
      return {
        sourceName: 'Official Issuer Verification Endpoint',
        sourceType: 'ISSUER_DIRECT_PORTAL',
        sourceUrl: verificationUrl,
        retrievalTimestamp,
        queryScope: hostname,
        status: 'REJECTED',
        verificationMethod: 'SSRF_PROTECTION_GATE',
        returnedEvidence: { blockedIp: item.address, ssrfReason: 'Resolved to private IP (DNS rebinding prevention)' },
        limitations: 'Host resolved to an internal IP address; outbound request blocked.'
      };
    }
  }

  // 3. Domain Alignment Check: Does QR URL belong to claimed issuer domain?
  let domainAligned = false;
  if (claimedIssuerDomain) {
    const cleanClaimed = claimedIssuerDomain.toLowerCase().replace(/^www\./, '');
    const cleanHost = hostname.toLowerCase().replace(/^www\./, '');
    domainAligned = cleanHost === cleanClaimed || cleanHost.endsWith('.' + cleanClaimed);
  }

  // 4. Safe HTTP Reachability Probe
  let httpProbe = { reachable: false, statusCode: null };
  try {
    const client = parsedUrl.protocol === 'https:' ? https : http;
    httpProbe = await new Promise((resolve) => {
      const req = client.get(
        parsedUrl,
        {
          timeout: 4000,
          headers: { 'User-Agent': 'VerifyMe-CredentialCheck-Probe/1.0' }
        },
        (res) => {
          resolve({ reachable: true, statusCode: res.statusCode });
          res.resume(); // consume response to free memory
        }
      );
      req.on('error', (e) => resolve({ reachable: false, error: e.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ reachable: false, error: 'Connection timed out' });
      });
    });
  } catch (probeErr) {
    httpProbe = { reachable: false, error: probeErr.message };
  }

  // Evaluate final status
  let status = 'INCONCLUSIVE';
  if (domainAligned && httpProbe.reachable && httpProbe.statusCode >= 200 && httpProbe.statusCode < 400) {
    status = 'CONFIRMED';
  } else if (!domainAligned && claimedIssuerDomain) {
    status = 'REJECTED';
  } else if (httpProbe.reachable) {
    status = 'PARTIALLY_CONFIRMED';
  } else {
    status = 'UNAVAILABLE';
  }

  return {
    sourceName: 'Official Issuer Verification Endpoint',
    sourceType: 'ISSUER_DIRECT_PORTAL',
    sourceUrl: verificationUrl,
    retrievalTimestamp,
    queryScope: `Endpoint: ${verificationUrl} | Claimed Domain: ${claimedIssuerDomain || 'N/A'}`,
    status,
    verificationMethod: 'SSRF_VALIDATED_REACHABILITY_PROBE',
    returnedEvidence: {
      url: verificationUrl,
      hostname,
      domainAligned,
      httpReachable: httpProbe.reachable,
      httpStatusCode: httpProbe.statusCode || null,
      credentialIdIncluded: credentialId ? verificationUrl.includes(credentialId) : false
    },
    limitations: domainAligned 
      ? 'Endpoint belongs to verified corporate domain and responded to active HTTP validation probe.'
      : (claimedIssuerDomain ? `Endpoint host '${hostname}' does not match claimed organization domain '${claimedIssuerDomain}'.` : 'No claimed organization domain available for cross-domain alignment.')
  };
}

module.exports = {
  queryIssuerVerificationEndpoint
};
