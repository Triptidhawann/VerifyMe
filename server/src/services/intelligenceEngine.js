const Groq = require('groq-sdk');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const net = require('net');
const { parsePhoneNumberFromString } = require('libphonenumber-js');

let groq;
try {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'dummy_key_to_prevent_crash_if_not_set') {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch (e) {
  console.warn('Groq SDK initialization note: API Key missing or invalid. AI analysis will fail gracefully.');
}

// ---------------------------------------------------------
// HELPER: PROMISE TIMEOUT
// ---------------------------------------------------------
function withTimeout(promise, ms = 3500, errorMsg = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const err = new Error(errorMsg);
      err.code = 'ETIMEOUT';
      setTimeout(() => reject(err), ms);
    })
  ]);
}

// ---------------------------------------------------------
// HELPER: SSRF & PRIVATE IP CHECK
// ---------------------------------------------------------
function isPrivateOrInternalIP(ip) {
  if (!ip) return false;
  const cleanIp = (typeof ip === 'string' && ip.startsWith('[') && ip.endsWith(']'))
    ? ip.slice(1, -1)
    : ip;
  const family = net.isIP(cleanIp);
  if (!family) return false;

  if (family === 4) {
    const parts = cleanIp.split('.').map(Number);
    // 0.0.0.0/8 (Current network)
    if (parts[0] === 0) return true;
    // 10.0.0.0/8 (Private RFC 1918)
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (Loopback RFC 1122)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (Link-local RFC 3927)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12 (Private RFC 1918: 172.16.0.0 - 172.31.255.255)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private RFC 1918)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 100.64.0.0/10 (Carrier-grade NAT RFC 6598)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments RFC 6890)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;
    // 192.0.2.0/24 (TEST-NET-1 RFC 5737)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true;
    // 192.88.99.0/24 (6to4 Relay Anycast RFC 7526)
    if (parts[0] === 192 && parts[1] === 88 && parts[2] === 99) return true;
    // 198.18.0.0/15 (Benchmarking RFC 2544)
    if (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) return true;
    // 198.51.100.0/24 (TEST-NET-2 RFC 5737)
    if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true;
    // 203.0.113.0/24 (TEST-NET-3 RFC 5737)
    if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true;
    // 224.0.0.0/4 (Multicast RFC 5771)
    if (parts[0] >= 224 && parts[0] <= 239) return true;
    // 240.0.0.0/4 (Reserved RFC 1112) + 255.255.255.255
    if (parts[0] >= 240) return true;
    return false;
  }

  if (family === 6) {
    const normalized = cleanIp.toLowerCase();
    // Loopback / Unspecified
    if (normalized === '::1' || normalized === '::') return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1)
    if (normalized.startsWith('::ffff:')) {
      const v4 = normalized.slice(7);
      return isPrivateOrInternalIP(v4);
    }
    // IPv4/IPv6 translation (64:ff9b::/96)
    if (normalized.startsWith('64:ff9b::')) {
      const v4 = normalized.slice(9);
      return isPrivateOrInternalIP(v4);
    }
    // Discard-only prefix (100::/64 RFC 6666)
    if (normalized.startsWith('100::')) return true;
    // Documentation prefix (2001:db8::/32 RFC 3849)
    if (normalized.startsWith('2001:db8') || normalized.startsWith('2001:0db8')) return true;
    // Unique local address (fc00::/7 -> fc.. or fd..)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    // Link local (fe80::/10)
    if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
    // Multicast (ff00::/8)
    if (normalized.startsWith('ff')) return true;
    return false;
  }

  return false;
}

// ---------------------------------------------------------
// HELPER: STANDARDS-COMPLIANT SPF EVALUATOR (RFC 7208)
// Note: Performs static SPF policy inspection on DNS records.
// Actual SPF authentication requires connecting IP & envelope sender.
// ---------------------------------------------------------
async function evaluateSpfPolicy(domain, dnsModule = dns, state = { lookups: 0, voidLookups: 0 }, callStack = new Set()) {
  const commonFields = (extra = {}) => ({
    lookupsCount: state.lookups,
    potentialDnsLookupTerms: state.lookups,
    voidLookupsCount: state.voidLookups,
    messageLookupCountEvaluated: null,
    lookupLimitAssessment: state.lookups > 10 ? 'EXCEEDED' : 'WITHIN_LIMITS',
    voidLookupAssessment: state.voidLookups > 2 ? 'EXCEEDED' : 'WITHIN_LIMITS',
    staticDnsDependenciesInspected: [],
    isPolicyInspectionOnly: true,
    authenticationEvaluated: false,
    messageAuthentication: "NOT EVALUATED (Requires connecting SMTP IP and envelope sender)",
    ...extra
  });

  const normalizedDomain = (domain || '').toLowerCase().trim();
  if (!normalizedDomain) {
    return commonFields({ status: 'PermError', reason: 'Empty domain specified in SPF policy' });
  }

  // Active recursion call-stack tracking (detects true circular cycles without blocking shared diamond dependencies)
  if (callStack.has(normalizedDomain)) {
    return commonFields({
      status: 'PermError',
      reason: `SPF redirect/include loop detected on domain (${normalizedDomain}). Active evaluation path: ${Array.from(callStack).join(' -> ')} -> ${normalizedDomain}`
    });
  }
  const nextStack = new Set(callStack);
  nextStack.add(normalizedDomain);

  let txtRecords;
  try {
    txtRecords = await withTimeout(dnsModule.resolveTxt(normalizedDomain), 3000);
  } catch (e) {
    if (e.code === 'ETIMEOUT') {
      return commonFields({ status: 'TempError', reason: 'DNS query timed out querying SPF TXT records' });
    }
    if (e.code === 'SERVFAIL') {
      return commonFields({ status: 'TempError', reason: 'DNS server failure (SERVFAIL) querying SPF TXT records' });
    }
    if (e.code === 'ENOTFOUND' || e.code === 'NODATA' || e.code === 'ENODATA') {
      state.voidLookups++;
      if (state.voidLookups > 2) {
        return commonFields({
          status: 'PermError',
          reason: 'RFC 7208 void DNS lookup limit (2) exceeded during SPF evaluation',
          voidLookupAssessment: 'EXCEEDED'
        });
      }
      return commonFields({ status: 'None', reason: 'No SPF record published (NXDOMAIN/NODATA)' });
    }
    return commonFields({ status: 'TempError', reason: `DNS resolution error (${e.code || e.message})` });
  }

  if (!txtRecords || txtRecords.length === 0) {
    state.voidLookups++;
    if (state.voidLookups > 2) {
      return commonFields({
        status: 'PermError',
        reason: 'RFC 7208 void DNS lookup limit (2) exceeded during SPF evaluation',
        voidLookupAssessment: 'EXCEEDED'
      });
    }
    return commonFields({ status: 'None', reason: 'No TXT records published' });
  }

  const spfRecords = [];
  for (const group of txtRecords) {
    const txt = Array.isArray(group) ? group.join('') : String(group);
    if (txt.startsWith('v=spf1 ') || txt === 'v=spf1') {
      spfRecords.push(txt);
    }
  }

  if (spfRecords.length === 0) {
    state.voidLookups++;
    if (state.voidLookups > 2) {
      return commonFields({
        status: 'PermError',
        reason: 'RFC 7208 void DNS lookup limit (2) exceeded during SPF evaluation',
        voidLookupAssessment: 'EXCEEDED'
      });
    }
    return commonFields({ status: 'None', reason: 'No SPF record published' });
  }

  // RFC 7208 Section 3.2: A domain MUST NOT publish multiple SPF records
  if (spfRecords.length > 1) {
    return commonFields({
      status: 'PermError',
      rawRecord: spfRecords[0],
      recordsCount: spfRecords.length,
      reason: 'Multiple SPF records detected on domain (violates RFC 7208 Section 3.2; causes authentication PermError)'
    });
  }

  const rawSpf = spfRecords[0];
  const rawTokens = rawSpf.split(/\s+/).slice(1); // skip 'v=spf1'

  // Parse SPF tokens into an ordered representation preserving mechanisms, qualifiers, arguments, and modifiers
  const orderedMechanisms = [];
  const redirectModifiers = [];
  let expModifier = null;

  for (const rawToken of rawTokens) {
    if (!rawToken) continue;
    const eqIdx = rawToken.indexOf('=');
    if (eqIdx !== -1) {
      // Modifier: name=value
      const modName = rawToken.slice(0, eqIdx).toLowerCase();
      const modValue = rawToken.slice(eqIdx + 1).trim();
      if (modName === 'redirect') {
        redirectModifiers.push(modValue);
      } else if (modName === 'exp') {
        expModifier = modValue;
      }
      continue;
    }

    // Mechanism: [qualifier]name[:value][/cidr]
    let qualifier = '+';
    let mechBody = rawToken;
    const firstChar = rawToken[0];
    if (firstChar === '+' || firstChar === '-' || firstChar === '~' || firstChar === '?') {
      qualifier = firstChar;
      mechBody = rawToken.slice(1);
    }

    const colonIdx = mechBody.indexOf(':');
    const slashIdx = mechBody.indexOf('/');
    let mechType = mechBody.toLowerCase();
    let mechTarget = null;

    if (colonIdx !== -1) {
      mechType = mechBody.slice(0, colonIdx).toLowerCase();
      mechTarget = mechBody.slice(colonIdx + 1);
    } else if (slashIdx !== -1) {
      mechType = mechBody.slice(0, slashIdx).toLowerCase();
      mechTarget = mechBody.slice(slashIdx);
    }

    orderedMechanisms.push({
      raw: rawToken,
      qualifier,
      type: mechType,
      target: mechTarget
    });
  }

  // RFC 7208 Section 6.1: Multiple redirect modifiers in a single record are a PermError
  if (redirectModifiers.length > 1) {
    return commonFields({
      status: 'PermError',
      rawRecord: rawSpf,
      reason: 'Multiple redirect modifiers detected in SPF record (violates RFC 7208 Section 6.1)'
    });
  }

  // Check for empty redirect modifier target
  if (redirectModifiers.length === 1 && !redirectModifiers[0]) {
    return commonFields({
      status: 'PermError',
      rawRecord: rawSpf,
      reason: 'Empty redirect modifier target in SPF record'
    });
  }

  // Evaluate mechanisms strictly in their original left-to-right order
  const inspectedMechanisms = [];
  const inspectedDependencies = [];
  let terminalAll = null;
  let hasUnreachableMechanismsAfterAll = false;

  for (let i = 0; i < orderedMechanisms.length; i++) {
    const mech = orderedMechanisms[i];

    if (terminalAll) {
      hasUnreachableMechanismsAfterAll = true;
      // RFC 7208: Mechanisms appearing after 'all' are unreachable; do not perform DNS lookups
      inspectedMechanisms.push({ ...mech, unreachable: true });
      continue;
    }

    inspectedMechanisms.push(mech);

    if (mech.type === 'all') {
      terminalAll = {
        qualifier: mech.qualifier,
        rawToken: mech.raw
      };
      continue;
    }

    // DNS lookup budget accounting per RFC 7208 Section 4.6.4:
    // Mechanisms that cause DNS lookups: include, a, mx, ptr, exists
    // (ip4 and ip6 do NOT cause DNS lookups)
    if (['include', 'a', 'mx', 'ptr', 'exists'].includes(mech.type)) {
      state.lookups++;
      if (state.lookups > 10) {
        return commonFields({
          status: 'PermError',
          reason: 'RFC 7208 DNS lookup limit (10) exceeded during SPF evaluation',
          rawRecord: rawSpf,
          lookupLimitAssessment: 'EXCEEDED',
          staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target)
        });
      }
    }

    if (mech.type === 'include') {
      if (!mech.target) {
        return commonFields({
          status: 'PermError',
          reason: 'Malformed include mechanism with missing domain target',
          rawRecord: rawSpf,
          staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target)
        });
      }

      const incTarget = mech.target.trim();
      const incResult = await evaluateSpfPolicy(incTarget, dnsModule, state, nextStack);

      if (incResult.status === 'PermError') {
        return commonFields({
          status: 'PermError',
          reason: `Included domain (${incTarget}) resulted in PermError: ${incResult.reason}`,
          rawRecord: rawSpf,
          includeTarget: incTarget,
          staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target)
        });
      }

      if (incResult.status === 'TempError') {
        return commonFields({
          status: 'TempError',
          reason: `Included domain (${incTarget}) transient DNS error: ${incResult.reason}`,
          rawRecord: rawSpf,
          includeTarget: incTarget,
          staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target)
        });
      }

      if (incResult.status === 'None') {
        return commonFields({
          status: 'PermError',
          reason: `Included domain (${incTarget}) publishes no SPF record (RFC 7208 Section 5.2 PermError)`,
          rawRecord: rawSpf,
          includeTarget: incTarget,
          staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target)
        });
      }

      inspectedDependencies.push({
        type: 'include',
        target: incTarget,
        qualifier: mech.qualifier,
        result: incResult
      });
    }
  }

  // Evaluate redirect modifier per RFC 7208 Section 6.1:
  // "The 'redirect' modifier MUST NOT be processed until all mechanisms have been evaluated...
  // If an 'all' mechanism is present in the record, the 'redirect' modifier has no effect."
  const redirectTarget = redirectModifiers.length === 1 ? redirectModifiers[0] : null;

  if (redirectTarget && !terminalAll) {
    state.lookups++;
    if (state.lookups > 10) {
      return commonFields({
        status: 'PermError',
        reason: 'RFC 7208 DNS lookup limit (10) exceeded during SPF evaluation',
        rawRecord: rawSpf,
        lookupLimitAssessment: 'EXCEEDED',
        staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target)
      });
    }

    const redirectedResult = await evaluateSpfPolicy(redirectTarget, dnsModule, state, nextStack);
    if (redirectedResult.status === 'None') {
      return commonFields({
        status: 'PermError',
        reason: `SPF redirect target domain (${redirectTarget}) publishes no SPF record or does not exist (RFC 7208 Section 6.1 PermError)`,
        rawRecord: rawSpf,
        redirectTarget,
        staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target).concat([redirectTarget])
      });
    }
    if (redirectedResult.status === 'PermError') {
      return commonFields({
        status: 'PermError',
        reason: `SPF redirect target domain (${redirectTarget}) returned PermError: ${redirectedResult.reason}`,
        rawRecord: rawSpf,
        redirectTarget,
        staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target).concat([redirectTarget])
      });
    }
    if (redirectedResult.status === 'TempError') {
      return commonFields({
        status: 'TempError',
        reason: `SPF redirect target domain (${redirectTarget}) transient DNS error: ${redirectedResult.reason}`,
        rawRecord: rawSpf,
        redirectTarget,
        staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target).concat([redirectTarget])
      });
    }

    return commonFields({
      ...redirectedResult,
      isRedirected: true,
      redirectTarget,
      redirectExecutionMessageLevel: "CONDITIONAL (Executes at message time only if no preceding mechanism matches)",
      rawRecord: rawSpf,
      parentDomain: normalizedDomain,
      inspectedMechanisms,
      inspectedDependencies,
      staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target).concat([redirectTarget])
    });
  }

  // If terminal all was present
  if (terminalAll) {
    const qualifierMap = {
      '-': { label: '-all (HardFail/Strict)', status: 'HardFail' },
      '~': { label: '~all (SoftFail)', status: 'SoftFail' },
      '?': { label: '?all (Neutral)', status: 'Neutral' },
      '+': { label: '+all (Pass/Permissive)', status: 'Pass' }
    };
    const qInfo = qualifierMap[terminalAll.qualifier] || { label: `${terminalAll.qualifier}all`, status: 'Neutral' };

    return commonFields({
      status: 'Valid',
      qualifier: qInfo.label,
      qualifierStatus: qInfo.status,
      rawRecord: rawSpf,
      inspectedMechanisms,
      inspectedDependencies,
      staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target),
      hasIncludes: inspectedDependencies.length > 0,
      hasMechanismsAfterAll: hasUnreachableMechanismsAfterAll,
      redirectExecutionMessageLevel: redirectTarget ? "CONDITIONAL (Executes at message time only if no preceding mechanism matches)" : null
    });
  }

  // RFC 7208 Section 4.7: If neither all nor redirect is specified, default is Neutral (?all)
  return commonFields({
    status: 'Valid',
    qualifier: '?all (Neutral/Implicit)',
    qualifierStatus: 'Neutral',
    rawRecord: rawSpf,
    inspectedMechanisms,
    inspectedDependencies,
    staticDnsDependenciesInspected: inspectedDependencies.map(d => d.target),
    hasIncludes: inspectedDependencies.length > 0,
    redirectExecutionMessageLevel: null
  });
}

// ---------------------------------------------------------
// HELPER: DNS & EMAIL CHECKS (RFC 5321, RFC 7208, RFC 7489)
// ---------------------------------------------------------
async function checkDomain(domain, dnsModule = dns) {
  const result = {
    exists: false,
    hasMX: false,
    mxRecords: [],
    hasAddress: false,
    hasSPF: false,
    spfRecord: null,
    spfQualifier: null,
    spfIssues: [],
    spfEvaluation: null,
    hasDMARC: false,
    dmarcRecord: null,
    dmarcPolicy: null,
    dmarcSubdomainPolicy: null,
    dmarcPercentage: null,
    dmarcError: null,
    dnsError: null
  };

  // 1. Resolve MX records first (the primary record for email exchange)
  try {
    const mx = await withTimeout(dnsModule.resolveMx(domain), 3500);
    if (mx && mx.length > 0) {
      result.hasMX = true;
      result.exists = true;
      result.mxRecords = mx;
    }
  } catch (e) {
    if (e.code === 'ETIMEOUT') {
      result.dnsError = 'ETIMEOUT';
    } else if (e.code === 'SERVFAIL') {
      result.dnsError = 'SERVFAIL';
    } else if (e.code !== 'ENODATA' && e.code !== 'ENOTFOUND') {
      result.dnsError = e.code || e.message;
    }
  }

  // 2. Resolve Address records (A/AAAA) for domain existence fallback
  try {
    const aRecords = await withTimeout(dnsModule.resolve4(domain), 3000);
    if (aRecords && aRecords.length > 0) {
      result.exists = true;
      result.hasAddress = true;
    }
  } catch (e) {
    if (!result.exists) {
      try {
        const aaaa = await withTimeout(dnsModule.resolve6(domain), 2000);
        if (aaaa && aaaa.length > 0) {
          result.exists = true;
          result.hasAddress = true;
        }
      } catch (err) {}
    }
  }

  // If domain does not exist in DNS at all, return early
  if (!result.exists) {
    return result;
  }

  // 3. Standards-compliant SPF policy evaluation (RFC 7208)
  try {
    const spfEval = await evaluateSpfPolicy(domain, dnsModule);
    result.spfEvaluation = spfEval;

    if (spfEval.status === 'Valid') {
      result.hasSPF = true;
      result.spfRecord = spfEval.rawRecord;
      result.spfQualifier = spfEval.qualifier;
    } else if (spfEval.status === 'PermError') {
      result.hasSPF = false;
      result.spfIssues.push(spfEval.reason);
    } else if (spfEval.status === 'TempError') {
      result.hasSPF = false;
      result.spfIssues.push(`SPF transient DNS error: ${spfEval.reason}`);
    }
  } catch (e) {
    result.spfIssues.push(`SPF evaluation unexpected failure: ${e.message}`);
  }

  // 4. Resolve DMARC (_dmarc.<domain> per RFC 7489)
  try {
    const dmarcRecords = await withTimeout(dnsModule.resolveTxt(`_dmarc.${domain}`), 3000);
    for (const group of dmarcRecords) {
      const txt = Array.isArray(group) ? group.join('') : String(group);
      if (txt.startsWith('v=DMARC1') || txt.includes('v=DMARC1')) {
        result.hasDMARC = true;
        result.dmarcRecord = txt;

        // Parse policy: p=reject | p=quarantine | p=none
        const pMatch = txt.match(/\bp=([a-zA-Z]+)\b/);
        if (pMatch) {
          result.dmarcPolicy = pMatch[1].toLowerCase();
        }
        const spMatch = txt.match(/\bsp=([a-zA-Z]+)\b/);
        if (spMatch) {
          result.dmarcSubdomainPolicy = spMatch[1].toLowerCase();
        }
        const pctMatch = txt.match(/\bpct=(\d+)\b/);
        if (pctMatch) {
          result.dmarcPercentage = parseInt(pctMatch[1], 10);
        }
        break;
      }
    }
  } catch (e) {
    if (e.code === 'ETIMEOUT') {
      result.dmarcError = 'ETIMEOUT';
    } else if (e.code === 'SERVFAIL') {
      result.dmarcError = 'SERVFAIL';
    } else if (e.code !== 'ENODATA' && e.code !== 'ENOTFOUND') {
      result.dmarcError = e.code || e.message;
    }
  }

  return result;
}

// ---------------------------------------------------------
// HELPER: HTTP REACHABILITY & TLS VERIFICATION (SSRF Protected & Connection-Pinned)
// ---------------------------------------------------------
async function checkHttp(urlToParse, options = {}) {
  const dnsModule = options.dnsModule || dns;
  const httpModule = options.httpModule || http;
  const httpsModule = options.httpsModule || https;
  const maxRedirects = 3;

  let currentUrlStr = urlToParse;
  let redirectsFollowed = 0;
  let redirectHistory = [];
  let isHttpsUpgraded = false;

  while (redirectsFollowed <= maxRedirects) {
    let url;
    try {
      url = new URL(currentUrlStr);
    } catch (e) {
      return { reachable: false, reason: 'Malformed URL syntax' };
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { reachable: false, reason: `Unsupported protocol (${url.protocol})` };
    }

    // Port Restriction Check: Only ports 80 and 443 permitted initially
    const explicitPort = url.port ? parseInt(url.port, 10) : null;
    const targetPort = explicitPort !== null ? explicitPort : (url.protocol === 'https:' ? 443 : 80);
    if (targetPort !== 80 && targetPort !== 443) {
      return {
        reachable: false,
        blocked: true,
        reason: `Destination port ${targetPort} is blocked. Only standard web ports (80, 443) are permitted for security.`
      };
    }

    // SSRF Check 1: Hostname literal check
    const forbiddenHostnames = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', 'metadata.google.internal', 'instance-data', '::1', '[::1]'];
    const hostnameLower = url.hostname.toLowerCase();
    if (forbiddenHostnames.includes(hostnameLower) || hostnameLower.endsWith('.local') || hostnameLower.endsWith('.internal') || hostnameLower.endsWith('.localhost')) {
      return { reachable: false, blocked: true, reason: 'Internal IP/hostname blocked for security (SSRF prevention)' };
    }

    // SSRF Check 2: If hostname is an IP literal, check directly
    const cleanHostname = (hostnameLower.startsWith('[') && hostnameLower.endsWith(']'))
      ? hostnameLower.slice(1, -1)
      : hostnameLower;
    if (isPrivateOrInternalIP(cleanHostname)) {
      return { reachable: false, blocked: true, reason: 'Private/loopback IP address blocked for security (SSRF prevention)' };
    }

    // SSRF Check 3: Resolve domain to IP and check ALL resolved addresses (prevents DNS rebinding and dual-stack bypass)
    let validatedIp;
    let validatedFamily;
    try {
      let lookupResults;
      const raw = await withTimeout(dnsModule.lookup(url.hostname, { all: true }), 3000);
      if (Array.isArray(raw)) {
        lookupResults = raw;
      } else if (raw && raw.address) {
        lookupResults = [raw];
      } else {
        return { reachable: false, reason: `DNS lookup returned no address for ${url.hostname}` };
      }

      if (lookupResults.length === 0) {
        return { reachable: false, reason: `DNS lookup returned empty address list for ${url.hostname}` };
      }

      // Check EVERY resolved address — reject if ANY answer is private/internal
      for (const item of lookupResults) {
        if (!item.address || isPrivateOrInternalIP(item.address)) {
          return {
            reachable: false,
            blocked: true,
            reason: `Domain resolves to private/internal IP address (${item.address || 'unknown'}) (SSRF / DNS rebinding blocked)`
          };
        }
      }

      // All addresses are verified public; pin connection to first public address
      validatedIp = lookupResults[0].address;
      validatedFamily = lookupResults[0].family || (net.isIP(validatedIp));
    } catch (e) {
      if (e.code === 'ETIMEOUT') {
        return { reachable: false, reason: 'DNS resolution timed out' };
      }
      return { reachable: false, reason: `Domain DNS lookup failed (${e.code || e.message})` };
    }

    // Pinned lookup: Prevents TOCTOU DNS rebinding by pinning socket connection to validated IP
    const pinnedLookup = (hostname, opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      if (opts && opts.all) {
        callback(null, [{ address: validatedIp, family: validatedFamily }]);
      } else {
        callback(null, validatedIp, validatedFamily);
      }
    };

    // Execute HTTP/HTTPS connection
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? httpsModule : httpModule;

    const executeRequest = (method, rejectUnauthorized = true) => {
      return new Promise((reqResolve) => {
        let isResolved = false;
        const complete = (val) => {
          if (!isResolved) {
            isResolved = true;
            reqResolve(val);
          }
        };

        try {
          const req = client.request(url, {
            method,
            timeout: 4000,
            rejectUnauthorized,
            lookup: pinnedLookup,
            headers: {
              'User-Agent': 'VerifyMe-Bot/1.0 (Digital Trust Verification Engine)'
            }
          }, (res) => {
            const statusCode = res.statusCode;
            const locationHeader = res.headers.location || null;
            res.resume(); // consume response body to free socket
            complete({
              reachable: true,
              status: statusCode,
              locationHeader,
              tlsValid: isHttps ? rejectUnauthorized : null
            });
          });

          req.on('error', (err) => {
            const isTlsCertError = isHttps && (
              err.code === 'CERT_HAS_EXPIRED' ||
              err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
              err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
              err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
              (err.message && (err.message.includes('certificate') || err.message.includes('self-signed')))
            );

            complete({
              reachable: false,
              reason: err.message,
              errorCode: err.code,
              isTlsError: isTlsCertError
            });
          });

          req.on('timeout', () => {
            req.destroy();
            complete({ reachable: false, reason: 'Connection timed out' });
          });

          req.end();
        } catch (err) {
          complete({ reachable: false, reason: err.message });
        }
      });
    };

    // First try: HEAD request with strict TLS certificate verification
    let res = await executeRequest('HEAD', true);

    // If TLS verification failed specifically, re-check unverified to distinguish dead server vs invalid cert
    if (!res.reachable && res.isTlsError) {
      const unauthRes = await executeRequest('HEAD', false);
      if (unauthRes.reachable) {
        return {
          reachable: true,
          status: unauthRes.status,
          redirectLocation: redirectHistory.length > 0 ? redirectHistory[redirectHistory.length - 1] : null,
          tlsValid: false,
          tlsError: res.reason
        };
      }
      return {
        reachable: false,
        reason: res.reason,
        tlsValid: false,
        tlsError: res.reason
      };
    }

    // If server returned 403 or 405 to HEAD, retry with a lightweight GET (common with CDNs/WAFs)
    if (res.reachable && (res.status === 403 || res.status === 405)) {
      const getRes = await executeRequest('GET', true);
      if (getRes.reachable && getRes.status !== 403 && getRes.status !== 405) {
        res = getRes;
      }
    }

    // Check if response is a redirect (301, 302, 303, 307, 308)
    const isRedirect = res.reachable && (res.status >= 300 && res.status < 400) && res.locationHeader;

    if (isRedirect && redirectsFollowed < maxRedirects) {
      let nextUrl;
      try {
        nextUrl = new URL(res.locationHeader, url);
      } catch (e) {
        return {
          reachable: true,
          status: res.status,
          redirectLocation: res.locationHeader,
          tlsValid: res.tlsValid,
          redirectError: 'Invalid redirect target URL'
        };
      }

      // Check protocol upgrade
      if (url.protocol === 'http:' && nextUrl.protocol === 'https:') {
        isHttpsUpgraded = true;
      }

      redirectHistory.push(nextUrl.href);
      currentUrlStr = nextUrl.href;
      redirectsFollowed++;
      // Loop continues with nextUrl, which will undergo full SSRF, private IP, and DNS checks!
      continue;
    }

    // Return final reachability response
    return {
      reachable: res.reachable,
      status: res.status,
      reason: res.reason,
      tlsValid: res.tlsValid,
      tlsError: res.tlsError,
      redirectLocation: redirectHistory.length > 0 ? redirectHistory[redirectHistory.length - 1] : null,
      isHttpsUpgraded: isHttpsUpgraded || (url.protocol === 'https:' && urlToParse.startsWith('http://'))
    };
  }

  return { reachable: false, reason: 'Exceeded maximum redirect hops (possible redirect loop)' };
}

// ---------------------------------------------------------
// DETERMINISTIC SIGNAL EXTRACTION
// ---------------------------------------------------------
const getDeterministicSignals = async (type, normalizedInput, options = {}) => {
  const signals = [];
  const warnings = [];
  const limitations = [];
  let formatValid = false;
  let score = 50;
  let confidence = 50;
  let spfEvaluation = null;
  let providerResult = null;
  let providerError = null;

  if (type === 'phone') {
    let parsed = null;
    let interpretationNote = null;
    let isAmbiguous = false;
    let candidateMatches = [];

    // 1. If starts with '+', parse directly with international detection
    if (normalizedInput.startsWith('+')) {
      parsed = parsePhoneNumberFromString(normalizedInput);
    } else if (options.defaultRegion || options.country) {
      // 2. If caller provided explicit region context, use it
      const explicitRegion = (options.defaultRegion || options.country).toUpperCase();
      const natParsed = parsePhoneNumberFromString(normalizedInput, explicitRegion);
      if (natParsed && natParsed.isValid()) {
        parsed = natParsed;
        interpretationNote = `Parsed under user-specified region (${explicitRegion}).`;
      }
    } else {
      // 3. If digit count > 10, check if international dialing code was included without '+' (e.g. '919915108159', '442079460958')
      if (normalizedInput.length > 10) {
        const withPlus = parsePhoneNumberFromString('+' + normalizedInput);
        if (withPlus && withPlus.isValid()) {
          parsed = withPlus;
          interpretationNote = `Includes country calling code (+${withPlus.countryCallingCode}) without explicit '+' prefix.`;
        }
      }

      // 4. Evaluate candidate national numbering plans ('US', 'GB', 'IN') without heuristic bias
      if (!parsed) {
        const candidateRegions = ['US', 'GB', 'IN'];
        for (const reg of candidateRegions) {
          const natParsed = parsePhoneNumberFromString(normalizedInput, reg);
          if (natParsed && natParsed.isValid()) {
            candidateMatches.push({ reg, parsed: natParsed, type: natParsed.getType() });
          }
        }

        if (candidateMatches.length === 1) {
          parsed = candidateMatches[0].parsed;
          interpretationNote = `Interpreted under ${parsed.country} national numbering plan (country calling code was omitted).`;
        } else if (candidateMatches.length > 1) {
          // Multi-region ambiguity: number matches multiple national plans without dialing code
          isAmbiguous = true;
          const matchedList = candidateMatches.map(m => m.reg);
          parsed = candidateMatches[0].parsed;
          interpretationNote = `National-format input without country calling code matches multiple national numbering plans (${matchedList.join(', ')}). Regional context required for unambiguous identification.`;
        } else {
          parsed = null;
        }
      }
    }

    if (parsed && parsed.isValid()) {
      formatValid = true;
      const region = parsed.country || 'Unknown';
      const lineType = parsed.getType(); // 'MOBILE', 'FIXED_LINE', 'TOLL_FREE', 'PREMIUM_RATE', 'VOIP'
      const callingCode = parsed.countryCallingCode || '';

      signals.push(`Conforms to valid national numbering plan for country/region: ${region} (+${callingCode})`);
      signals.push(`Standard E.164 representation: ${parsed.formatInternational()}`);

      if (interpretationNote) {
        if (isAmbiguous) {
          warnings.push(interpretationNote);
        } else {
          signals.push(interpretationNote);
        }
      } else {
        signals.push('Explicit international dialing prefix (+) provided');
      }

      // Authoritative Technical Health Score for phone structure:
      // Evaluates E.164 syntax, valid country code, national numbering plan, and line type allocation.
      // A fully valid international number with explicit + starts at 100/100 technical health.
      score = 100;
      confidence = isAmbiguous ? 50 : 65;

      if (isAmbiguous) {
        score -= 15; // Penalty for multi-region format ambiguity
      }

      // Line Type analysis
      if (lineType === 'PREMIUM_RATE') {
        warnings.push('Premium-rate number detected (associated with high toll charges, automated billing, or telemarketing scams)');
        score = 30; // Elevated threat
      } else if (lineType === 'VOIP') {
        warnings.push('Virtual VoIP line type detected (easily provisioned anonymously online; frequent vector for caller impersonation)');
        score -= 15;
      } else if (lineType === 'TOLL_FREE') {
        signals.push('Toll-free organizational number format');
        limitations.push('Toll-free numbers are frequently spoofed in customer service caller ID impersonation attempts.');
        score -= 5;
      } else if (lineType === 'MOBILE') {
        signals.push('Allocated as mobile telephone line');
      } else if (lineType === 'FIXED_LINE') {
        signals.push('Allocated as landline / fixed-line telephone number');
      }

      if (!normalizedInput.startsWith('+') && !isAmbiguous && !options.defaultRegion && !options.country) {
        warnings.push('No country calling code prefix was provided; destination country was inferred');
        score -= 10;
      }
    } else {
      formatValid = false;
      const isPossible = parsed && parsed.isPossible();
      if (isPossible) {
        warnings.push('Phone number has valid digit count but fails authoritative numbering rules for the region');
        score = 25;
      } else {
        warnings.push('Phone number is structurally invalid or does not match any known national numbering plan');
        score = 15;
      }
      confidence = 100; // Structural format validation is complete
    }

    limitations.push('A valid number format proves that the number is technically dialable, but does not prove who owns or is dialing from it.');
    limitations.push('Phone verification evaluates numbering plan format and regional allocation. Live telecom subscriber identity, active network registration, and live spam reputation are NOT CHECKED.');

  } else if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (emailRegex.test(normalizedInput)) {
      formatValid = true;
      signals.push('Email syntax complies with RFC structural standards');

      const parts = normalizedInput.split('@');
      const domain = parts[1];
      signals.push(`Target Domain: ${domain}`);

      // Expanded disposable domains detector
      const disposableDomains = [
        'tempmail.com', '10minutemail.com', 'throwaway.com', 'mailinator.com',
        'guerrillamail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
        'guerrillamailblock.com', 'getairmail.com', 'fakemailgenerator.com',
        'dispostable.com', 'mohmal.com', 'emailondeck.com', 'temp-mail.org',
        'burnermail.io', 'dropmail.me', 'crazymailing.com', 'maildrop.cc', 'inboxkitten.com'
      ];

      const isDisposable = disposableDomains.includes(domain);
      if (isDisposable) {
        warnings.push(`Known temporary/disposable email service detected (${domain})`);
      }

      // Authoritative DNS Checks
      const dnsResult = await checkDomain(domain, options.dnsModule);
      spfEvaluation = dnsResult.spfEvaluation || null;

      if (dnsResult.dnsError === 'ETIMEOUT') {
        warnings.push('DNS lookup timed out while querying authoritative mail servers');
        limitations.push('DNS queries timed out; authoritative mail configuration could not be verified.');
        score = 40;
        confidence = 40;
      } else if (!dnsResult.exists) {
        warnings.push('Domain does not exist or has no active DNS records (NXDOMAIN)');
        score = 20;
        confidence = 90;
      } else {
        confidence = 85;
        signals.push('Domain exists and resolves via authoritative DNS');

        if (dnsResult.hasMX) {
          signals.push(`Domain has valid mail exchange (MX) servers configured (${dnsResult.mxRecords.length} record${dnsResult.mxRecords.length > 1 ? 's' : ''})`);
        } else {
          warnings.push('Domain lacks MX records; cannot receive standard email delivery');
        }

        // SPF evaluation via standards-compliant RFC 7208 evaluator
        const spf = dnsResult.spfEvaluation;
        if (spf) {
          if (spf.status === 'PermError') {
            warnings.push(`SPF policy error: ${spf.reason}`);
          } else if (spf.status === 'TempError') {
            warnings.push(`SPF evaluation deferred due to transient DNS error: ${spf.reason}`);
          } else if (spf.status === 'None') {
            warnings.push('Domain lacks SPF (Sender Policy Framework) spoofing protection record');
          } else if (spf.status === 'Valid') {
            if (spf.isRedirected) {
              signals.push(`Domain delegates SPF policy to ${spf.redirectTarget} (effective policy: ${spf.qualifier})`);
            } else {
              signals.push(`Domain publishes SPF record with qualifier: ${spf.qualifier}`);
            }

            if (spf.qualifierStatus === 'Pass') {
              warnings.push('Permissive qualifier (+all) authorizes any sender worldwide (security vulnerability)');
            } else if (spf.qualifierStatus === 'HardFail') {
              signals.push('Strict SPF hardfail qualifier (-all) configured - unauthorized senders are rejected');
            }
          }
        } else if (dnsResult.hasSPF) {
          signals.push(`Domain publishes SPF record: ${dnsResult.spfQualifier || 'configured'}`);
        } else {
          warnings.push('Domain lacks SPF (Sender Policy Framework) spoofing protection record');
        }

        // DMARC
        if (dnsResult.hasDMARC) {
          if (dnsResult.dmarcPolicy === 'reject') {
            signals.push('Strict DMARC policy configured (p=reject) - unauthorized spoofed emails are rejected by receiving servers');
          } else if (dnsResult.dmarcPolicy === 'quarantine') {
            signals.push('DMARC quarantine policy configured (p=quarantine) - unauthorized emails are directed to spam');
          } else if (dnsResult.dmarcPolicy === 'none') {
            warnings.push('DMARC policy is set to monitoring-only (p=none) - spoofed emails are neither rejected nor quarantined');
          } else {
            signals.push(`DMARC record published (policy: ${dnsResult.dmarcPolicy || 'unspecified'})`);
          }
        } else {
          warnings.push('Domain lacks DMARC email authentication policy record');
        }

        // Authoritative Technical Health Score for email domain infrastructure:
        // Evaluates RFC syntax, DNS resolution, MX records, SPF, and DMARC.
        let emailScore = 20; // Valid RFC email syntax
        if (dnsResult.exists) emailScore += 20; // Domain exists and resolves via DNS
        if (dnsResult.hasMX) emailScore += 25; // Valid MX records configured

        // SPF scoring
        if (spf) {
          if (spf.status === 'Valid') {
            if (spf.qualifierStatus === 'HardFail') emailScore += 20;
            else if (spf.qualifierStatus === 'SoftFail') emailScore += 18;
            else if (spf.qualifierStatus === 'Neutral') emailScore += 10;
            else if (spf.qualifierStatus === 'Pass') emailScore -= 15;
          } else if (spf.status === 'PermError') {
            emailScore -= 15; // PermError penalty, 0 positive policy points
          } else if (spf.status === 'None') {
            // No SPF points
          }
        } else if (dnsResult.hasSPF) {
          emailScore += 15;
        }

        // DMARC scoring
        if (dnsResult.hasDMARC) {
          if (dnsResult.dmarcPolicy === 'reject') emailScore += 15;
          else if (dnsResult.dmarcPolicy === 'quarantine') emailScore += 10;
          else if (dnsResult.dmarcPolicy === 'none') emailScore += 5; // Monitoring-only
        }

        if (isDisposable) {
          emailScore = Math.min(emailScore - 40, 25);
        }

        score = emailScore;
      }
    } else {
      formatValid = false;
      warnings.push('Malformed email address syntax (does not conform to RFC standards)');
      score = 15;
      confidence = 100;
    }

    limitations.push('Mailbox-level existence (SMTP recipient verification) was not performed.');
    limitations.push('SPF and DMARC checks perform domain policy inspection only, not message authentication evaluation (which requires live SMTP connecting IP, envelope sender, and cryptographic DKIM verification).');
    limitations.push('DNS security checks verify domain infrastructure configuration, not the authenticity of any individual email message or author.');

  } else if (type === 'website') {
    let urlToParse = normalizedInput.startsWith('http://') || normalizedInput.startsWith('https://')
      ? normalizedInput
      : `https://${normalizedInput}`;
    let url;
    providerResult = null;
    providerError = null;
    try {
      url = new URL(urlToParse);
      formatValid = true;
      signals.push('Valid URL structure and syntax');

      const isHttps = url.protocol === 'https:';
      if (isHttps) {
        signals.push('HTTPS secure transport protocol requested');
      } else {
        warnings.push('Unencrypted HTTP protocol requested (data transmission is unencrypted)');
      }

      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(url.hostname)) {
        warnings.push('Direct IP address used as website host instead of a registered domain name');
      }

      if (url.hostname.includes('xn--')) {
        warnings.push('Punycode internationalized domain detected (possible homograph/lookalike attack vector)');
      }

      // Check HTTP Reachability, Port & TLS
      const httpResult = await checkHttp(urlToParse, options);
      confidence = 75;

      // Check external threat intelligence if provider is configured
      if (options.threatProvider) {
        try {
          if (typeof options.threatProvider === 'function') {
            providerResult = await options.threatProvider(urlToParse, url);
          } else if (typeof options.threatProvider.checkThreats === 'function') {
            providerResult = await options.threatProvider.checkThreats(urlToParse, url);
          } else if (typeof options.threatProvider.lookup === 'function') {
            providerResult = await options.threatProvider.lookup(urlToParse, url);
          }
        } catch (err) {
          providerError = err;
        }
      }

      if (httpResult.blocked) {
        warnings.push(`Target blocked by security filter: ${httpResult.reason}`);
        score = 10;
        confidence = 95;
      } else if (httpResult.reachable) {
        signals.push(`Website is reachable and responding (HTTP ${httpResult.status})`);

        if (httpResult.redirectLocation) {
          signals.push(`Website responds with redirect to: ${httpResult.redirectLocation}`);
          if (url.protocol === 'http:' && httpResult.redirectLocation.startsWith('https://')) {
            signals.push('Automatically upgrades unencrypted HTTP requests to secure HTTPS');
          }
        }

        if (httpResult.tlsValid === true) {
          signals.push('TLS/SSL certificate verified by trusted Certificate Authority');
        } else if (httpResult.tlsValid === false) {
          warnings.push(`TLS/SSL certificate validation failed: ${httpResult.tlsError || 'Untrusted or expired certificate'}`);
        }

        // Authoritative Technical Health Score for website:
        // Evaluates URL syntax, host reachability, HTTPS transport, and valid CA TLS.
        let webScore = 15; // valid URL syntax
        if (httpResult.reachable) webScore += 25; // server is live and responding

        if (isHttps) {
          webScore += 25; // HTTPS secure transport requested
        } else if (url.protocol === 'http:' && httpResult.redirectLocation?.startsWith('https://')) {
          webScore += 20; // Good security practice: auto-upgrade to HTTPS
        } else {
          webScore += 5; // Plaintext HTTP without upgrade
        }

        if (httpResult.tlsValid === true) {
          webScore += 35; // TLS/SSL certificate verified by trusted CA
        } else if (httpResult.tlsValid === false) {
          webScore -= 20; // Invalid/expired TLS certificate penalty
        }

        if (ipRegex.test(url.hostname)) webScore -= 25; // Direct IP host penalty
        if (url.hostname.includes('xn--')) webScore -= 25; // Punycode lookalike penalty

        score = webScore;
      } else {
        warnings.push(`Website failed to respond: ${httpResult.reason || 'Unreachable'}`);
        score = 35;
      }
    } catch (e) {
      formatValid = false;
      warnings.push('Malformed URL syntax (unable to parse as a valid web destination)');
      score = 15;
      confidence = 100;
    }

    limitations.push('Technical HTTPS and TLS checks confirm channel encryption only, not organizational authenticity or freedom from phishing/malware.');
    limitations.push('Domain reputation and threat intelligence: NOT CHECKED (External blocklists and domain registration age were not evaluated in this technical check; website legitimacy is unrated). Technical verification score evaluates network and transport security (DNS, TLS, HTTP) only.');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const technicalHealthScore = score;
  const technicalScore = score;

  let technicalStatus = "TECHNICAL CHECKS PASSED";
  let reputationStatus = "NOT CHECKED";
  let identityStatus = "NOT VERIFIED";
  let threatAssessmentStatus = "NOT CHECKED";
  let riskLevel = "UNKNOWN";
  let evidenceCompleteness = 75;

  if (type === 'website') {
    evidenceCompleteness = 75; // Technical evaluated; reputation unrated

    const isBlocked = warnings.some(w => w.toLowerCase().includes('blocked'));
    const isUnreachable = warnings.some(w => w.toLowerCase().includes('failed to respond') || w.toLowerCase().includes('unreachable'));
    const hasTlsFailure = warnings.some(w => w.toLowerCase().includes('tls') || w.toLowerCase().includes('certificate'));
    const isPlaintextHttp = warnings.some(w => w.toLowerCase().includes('unencrypted http'));
    const hasLocalThreatIndicators = warnings.some(w => w.toLowerCase().includes('punycode') || w.toLowerCase().includes('direct ip'));

    if (!formatValid) {
      technicalStatus = "INVALID INPUT";
      riskLevel = "INVALID INPUT";
      reputationStatus = "NOT APPLICABLE";
      threatAssessmentStatus = "NO KNOWN THREATS DETECTED";
      evidenceCompleteness = 100;
    } else if (isBlocked) {
      technicalStatus = "BLOCKED BY SECURITY POLICY";
      threatAssessmentStatus = "THREAT INDICATORS DETECTED";
      riskLevel = "HIGH RISK";
      reputationStatus = "NOT CHECKED";
      evidenceCompleteness = 95;
    } else if (hasLocalThreatIndicators) {
      technicalStatus = "SUSPICIOUS INDICATOR";
      threatAssessmentStatus = "THREAT INDICATORS DETECTED";
      riskLevel = "HIGH RISK";
      reputationStatus = "NOT CHECKED";
      evidenceCompleteness = 85;
    } else if (hasTlsFailure) {
      technicalStatus = "CERTIFICATE VALIDATION FAILURE";
      threatAssessmentStatus = "NOT CHECKED";
      riskLevel = "SUSPICIOUS";
      reputationStatus = "NOT CHECKED";
      evidenceCompleteness = 75;
    } else if (isPlaintextHttp) {
      technicalStatus = "TRANSPORT SECURITY WEAKNESS";
      threatAssessmentStatus = "NOT CHECKED";
      riskLevel = "SUSPICIOUS";
      reputationStatus = "NOT CHECKED";
      evidenceCompleteness = 75;
    } else if (isUnreachable) {
      technicalStatus = "REACHABILITY FAILURE";
      threatAssessmentStatus = "NOT CHECKED";
      riskLevel = "LIMITED VERIFICATION";
      reputationStatus = "NOT CHECKED";
      evidenceCompleteness = 50;
    } else {
      technicalStatus = "TECHNICAL CHECKS PASSED";
    }

    if (providerError) {
      // Rule D: Threat intelligence request failed
      reputationStatus = "UNAVAILABLE";
      threatAssessmentStatus = "CHECK FAILED";
      warnings.push(`External threat intelligence query failed: ${providerError.message || providerError}`);
      if (formatValid && !isBlocked && !hasLocalThreatIndicators) {
        riskLevel = "LIMITED VERIFICATION";
      }
    } else if (providerResult) {
      // External provider was queried
      evidenceCompleteness = 100; // Both technical & reputation evaluated
      reputationStatus = "CHECKED";
      const hasProviderThreat = providerResult.hasThreat === true || 
        (Array.isArray(providerResult.threats) && providerResult.threats.length > 0) ||
        (providerResult.status && String(providerResult.status).toUpperCase() === 'MALICIOUS');

      if (hasProviderThreat || hasLocalThreatIndicators || isBlocked) {
        // Rule C: Actual threat evidence found
        threatAssessmentStatus = "THREAT INDICATORS DETECTED";
        reputationStatus = "CHECKED";
        riskLevel = "HIGH RISK";
        score = Math.min(score, 20);
        const detail = providerResult.details || (Array.isArray(providerResult.threats) ? providerResult.threats.join(', ') : 'Known threat detected by intelligence provider');
        warnings.push(`Threat intelligence alert: ${detail}`);
      } else {
        // Rule B: Queried successfully, no findings
        threatAssessmentStatus = "NO KNOWN THREATS DETECTED";
        reputationStatus = "CHECKED";
        if (technicalStatus === "TECHNICAL CHECKS PASSED") {
          riskLevel = "LOW RISK";
          score = Math.min(100, Math.max(score, 85));
        } else if (hasTlsFailure || isPlaintextHttp) {
          riskLevel = "SUSPICIOUS";
        } else {
          riskLevel = "LIMITED VERIFICATION";
        }
      }
    } else if (formatValid && !isBlocked && !hasLocalThreatIndicators) {
      // Rule A: Threat intelligence not configured
      reputationStatus = "NOT CHECKED";
      threatAssessmentStatus = "NOT CHECKED";
      if (technicalStatus === "TECHNICAL CHECKS PASSED") {
        riskLevel = "LIMITED VERIFICATION";
      }
    }
  } else if (type === 'email') {
    evidenceCompleteness = 75; // Domain infrastructure checked, mailbox unverified

    const isDisposable = warnings.some(w => w.toLowerCase().includes('disposable'));
    const isNonExistent = warnings.some(w => w.toLowerCase().includes('does not exist') || w.toLowerCase().includes('nxdomain') || w.toLowerCase().includes('dns lookup timed out'));
    const hasMxIssue = warnings.some(w => w.toLowerCase().includes('lacks mx'));
    const hasAuthWeakness = warnings.some(w => w.toLowerCase().includes('p=none') || w.toLowerCase().includes('permissive qualifier') || w.toLowerCase().includes('lacks dmarc') || w.toLowerCase().includes('lacks spf') || w.toLowerCase().includes('spf policy error'));

    if (!formatValid) {
      technicalStatus = "INVALID INPUT";
      riskLevel = "INVALID INPUT";
      reputationStatus = "NOT APPLICABLE";
      threatAssessmentStatus = "NO KNOWN THREATS DETECTED";
      evidenceCompleteness = 100;
    } else if (isDisposable) {
      technicalStatus = "SUSPICIOUS INDICATOR";
      reputationStatus = "CONFIRMED THREAT";
      threatAssessmentStatus = "THREAT INDICATORS DETECTED";
      riskLevel = "HIGH RISK";
    } else if (isNonExistent) {
      technicalStatus = "DNS RESOLUTION FAILURE";
      reputationStatus = "NOT CHECKED";
      threatAssessmentStatus = "NO KNOWN THREATS DETECTED";
      riskLevel = "HIGH RISK";
    } else if (hasMxIssue) {
      technicalStatus = "DNS RESOLUTION FAILURE";
      reputationStatus = "NOT CHECKED";
      threatAssessmentStatus = "NO KNOWN THREATS DETECTED";
      riskLevel = "SUSPICIOUS";
    } else if (hasAuthWeakness) {
      technicalStatus = "AUTHENTICATION POLICY WEAKNESS";
      reputationStatus = "NOT CHECKED";
      threatAssessmentStatus = "NO KNOWN THREATS DETECTED";
      riskLevel = "LIMITED VERIFICATION";
    } else {
      technicalStatus = "TECHNICAL CHECKS PASSED";
      reputationStatus = "NOT CHECKED";
      threatAssessmentStatus = "NO KNOWN THREATS DETECTED";
      riskLevel = "LOW RISK";
    }
  } else if (type === 'phone') {
    evidenceCompleteness = 65; // Format verified, subscriber identity unverified

    const isPremiumRate = warnings.some(w => w.toLowerCase().includes('premium-rate'));

    if (!formatValid) {
      technicalStatus = "INVALID INPUT";
      riskLevel = "INVALID INPUT";
      reputationStatus = "NOT APPLICABLE";
      threatAssessmentStatus = "NO KNOWN THREATS DETECTED";
      evidenceCompleteness = 100;
    } else if (isPremiumRate) {
      technicalStatus = "SUSPICIOUS INDICATOR";
      reputationStatus = "NOT CHECKED";
      threatAssessmentStatus = "THREAT INDICATORS DETECTED";
      riskLevel = "HIGH RISK";
    } else {
      technicalStatus = "TECHNICAL CHECKS PASSED";
      reputationStatus = "NOT CHECKED";
      threatAssessmentStatus = "NOT CHECKED";
      riskLevel = "LIMITED VERIFICATION";
    }
  }

  confidence = evidenceCompleteness;

  const threatIndicators = warnings.filter(w => 
    w.toLowerCase().includes('blocked') ||
    w.toLowerCase().includes('punycode') ||
    w.toLowerCase().includes('disposable') ||
    w.toLowerCase().includes('premium-rate') ||
    w.toLowerCase().includes('direct ip') ||
    w.toLowerCase().includes('threat intelligence alert')
  );

  return {
    formatValid,
    signals,
    warnings,
    limitations,
    score,
    technicalHealthScore,
    technicalScore,
    technicalStatus,
    reputationStatus,
    identityStatus,
    threatAssessmentStatus,
    threatIndicators,
    evidenceCompleteness,
    confidence,
    riskLevel,
    spfEvaluation
  };
};

// ---------------------------------------------------------
// DETERMINISTIC INTERPRETATION (FALLBACK & LOCAL LOGIC)
// ---------------------------------------------------------
const generateDeterministicInterpretation = (deterministicData, type) => {
  const {
    riskLevel,
    technicalStatus,
    warnings = [],
    signals = [],
    limitations = [],
    score
  } = deterministicData;

  const risk = (riskLevel || '').toUpperCase();
  const techStatus = (technicalStatus || '').toUpperCase();
  const isHighRisk = risk.includes('HIGH');
  const isSuspicious = risk.includes('SUSPICIOUS');
  const isModerateRisk = risk.includes('MODERATE');
  const isLimitedVerification = risk.includes('LIMITED') || risk.includes('UNRATED');
  const isLowRisk = risk.includes('LOW');

  let summary = "";
  let whyScore = [];
  let riskFactors = [...warnings];
  let precautions = [];
  let recommendedAction = "";

  // 1. Structurally Invalid Input
  if (deterministicData.formatValid === false || risk === 'INVALID INPUT' || techStatus === 'INVALID INPUT') {
    summary = `The provided ${type} identifier is structurally incomplete or does not conform to authoritative formatting standards.`;
    whyScore.push(`Input syntax could not be parsed as a valid ${type} identifier.`);
    precautions = [
      `Check the input for missing characters, digits, or syntax errors.`,
      `Provide a complete, properly formatted ${type} identifier.`
    ];
    recommendedAction = `Verify the input and submit a complete, standard ${type} value to perform analysis.`;

    return {
      source: "deterministic",
      summary,
      whyScore,
      riskFactors,
      precautions,
      recommendedAction
    };
  }

  // 2. Modality-Specific Technical Interpretations
  if (type === 'website') {
    const isBlocked = warnings.some(w => w.toLowerCase().includes('blocked'));
    const isUnreachable = warnings.some(w => w.toLowerCase().includes('failed to respond') || w.toLowerCase().includes('unreachable'));
    const hasTlsFailure = warnings.some(w => w.toLowerCase().includes('tls') || w.toLowerCase().includes('certificate'));
    const isPlaintextHttp = warnings.some(w => w.toLowerCase().includes('unencrypted http'));
    const hasPunycode = warnings.some(w => w.toLowerCase().includes('punycode'));
    const hasIpHost = warnings.some(w => w.toLowerCase().includes('direct ip'));

    if (isBlocked) {
      summary = "The website was blocked by security filtering due to internal or prohibited network destinations.";
      whyScore.push(`Target address blocked: ${warnings.find(w => w.toLowerCase().includes('blocked')) || 'Security policy violation'}.`);
      precautions = [
        "Do not route requests to internal or private IP destinations.",
        "Verify destination hostname syntax and target accessibility."
      ];
      recommendedAction = "Do not interact with or route traffic to this blocked network destination.";
    } else if (hasTlsFailure || techStatus === 'CERTIFICATE VALIDATION FAILURE') {
      summary = "TLS certificate validation failed. The connection could not be verified as securely configured.";
      whyScore.push("The website presented an invalid, self-signed, or expired TLS/SSL certificate.");
      precautions = [
        "Do not enter passwords, payment details, or personal data on this site.",
        "Avoid accepting browser security certificate exceptions."
      ];
      recommendedAction = "Do not enter passwords, payment details, or personal data on this site.";
    } else if (isPlaintextHttp || techStatus === 'TRANSPORT SECURITY WEAKNESS') {
      summary = "The website uses an unencrypted HTTP connection. Information exchanged with the server is exposed to interception or tampering.";
      whyScore.push("Plaintext HTTP protocol was requested and no automatic secure upgrade to HTTPS occurred.");
      precautions = [
        "Avoid transmitting credentials or sensitive personal information over unencrypted HTTP.",
        "Verify whether the site operator maintains a secure HTTPS version."
      ];
      recommendedAction = "Avoid transmitting credentials or sensitive data over this unencrypted connection.";
    } else if (isUnreachable || techStatus === 'REACHABILITY FAILURE') {
      summary = "The website failed to respond to network reachability queries.";
      whyScore.push(`Server connection could not be established: ${warnings.find(w => w.toLowerCase().includes('failed to respond')) || 'Unreachable'}.`);
      precautions = [
        "Confirm whether the server or host domain is currently active.",
        "Check domain DNS configuration for proper routing."
      ];
      recommendedAction = "Verify the website domain name and check whether the host server is currently online.";
    } else if (hasPunycode || hasIpHost) {
      summary = "Website URL structure exhibits suspicious formatting patterns (such as internationalized lookalikes or direct IP addressing).";
      whyScore.push(warnings.join('; '));
      precautions = [
        "Carefully inspect the domain spelling for homoglyph / lookalike characters.",
        "Do not provide credentials if the domain differs from the genuine organization name."
      ];
      recommendedAction = "Verify the exact domain name carefully for potential homograph or impersonation attempts.";
    } else {
      // Technical checks passed! Factual statement: transport verified, reputation unchecked.
      summary = "Transport encryption and server reachability were verified (technical reachability confirmed). Domain reputation, registration history, and external threat intelligence were not evaluated.";
      whyScore.push("Passed valid URL syntax, authoritative DNS resolution, and verified CA TLS certificate checks.");
      whyScore.push("External reputation, domain registration age, and threat intelligence were not checked.");
      precautions = [
        "Technical validity confirms transport encryption, not the legitimacy or intent of the website operator.",
        "Verify the organization via an independent, established contact channel before submitting credentials or payment information.",
        "Check that the address bar matches the intended organization domain name exactly."
      ];
      recommendedAction = "Technical checks passed; independently verify the organization's identity and site content before sharing sensitive information.";
    }
  } else if (type === 'email') {
    const isDisposable = warnings.some(w => w.toLowerCase().includes('disposable'));
    const isNonExistent = warnings.some(w => w.toLowerCase().includes('does not exist') || w.toLowerCase().includes('nxdomain'));
    const hasMxIssue = warnings.some(w => w.toLowerCase().includes('lacks mx'));

    if (isDisposable) {
      summary = "Known temporary or disposable email service detected. Temporary domains are frequently utilized for throwaway accounts or fraudulent activities.";
      whyScore.push("Target email domain matches known public disposable email provider list.");
      precautions = [
        "Do not treat accounts registered with disposable emails as verified users.",
        "Require permanent, verifiable corporate or personal email addresses."
      ];
      recommendedAction = "Reject registration or treat communications with elevated suspicion.";
    } else if (isNonExistent || hasMxIssue || techStatus === 'DNS RESOLUTION FAILURE') {
      summary = "The domain email infrastructure cannot receive mail due to missing or failed DNS mail exchange (MX) records.";
      whyScore.push("Domain does not publish valid mail exchange (MX) records required for standard email delivery.");
      precautions = [
        "Emails sent to this address will fail or bounce.",
        "Verify domain spelling and registration status."
      ];
      recommendedAction = "Confirm the correct email domain before sending communications or trusting this address.";
    } else if (techStatus === 'AUTHENTICATION POLICY WEAKNESS') {
      summary = "Domain mail servers are active, but email authentication policies (SPF/DMARC) have configuration weaknesses.";
      whyScore.push("Domain lacks strict anti-spoofing enforcement (such as monitoring-only DMARC p=none or missing records).");
      if (warnings.length > 0) {
        whyScore.push(`Policy observations: ${warnings.join('; ')}.`);
      }
      precautions = [
        "Independently verify unexpected or high-stakes email requests through secondary channels.",
        "Check sender address spelling carefully."
      ];
      recommendedAction = "Verify unexpected requests via secondary channels; domain does not enforce strict sender rejection.";
    } else {
      // Technical checks passed!
      summary = "Domain email configuration and authentication records (MX, SPF, DMARC) are published with no technical risk indicators detected. Individual mailbox existence and message sender identity remain unverified.";
      whyScore.push("Authoritative mail exchange (MX) servers and email authentication records (SPF, DMARC) are configured.");
      whyScore.push("Mailbox-level existence and individual message sender identity were not checked.");
      precautions = [
        "Domain records confirm mail server setup, but do not authenticate individual message senders.",
        "Continue standard caution for requests involving funds, passwords, or personal data."
      ];
      recommendedAction = "Domain email infrastructure is configured; verify individual sender identity independently as domain records do not authenticate individual senders.";
    }
  } else if (type === 'phone') {
    const isPremiumRate = warnings.some(w => w.toLowerCase().includes('premium-rate'));
    const isVoip = warnings.some(w => w.toLowerCase().includes('voip'));

    if (isPremiumRate || techStatus === 'SUSPICIOUS INDICATOR') {
      summary = "Premium-rate telephone number detected. Premium numbers incur elevated toll charges and are associated with automated billing or telemarketing schemes.";
      whyScore.push("Allocated in high-toll premium rate national number prefix.");
      precautions = [
        "Do not return calls to unknown premium-rate numbers to avoid toll charges.",
        "Verify destination charges with your telecom provider before calling."
      ];
      recommendedAction = "Do not return missed calls or interact with unknown premium-rate numbers.";
    } else {
      // Valid phone
      summary = "Phone number format conforms to authoritative national and international (E.164) numbering plans. Caller identity and active network registration remain unverified.";
      whyScore.push("Passed international E.164 syntax, valid national length, and numbering plan allocation checks.");
      whyScore.push("Live telecom subscriber identity and network registration were not checked.");
      if (isVoip) {
        whyScore.push("Allocated as a virtual VoIP line (can be provisioned online without verified subscriber identification).");
      }
      precautions = [
        "Technical numbering format is valid, but does not prove who is placing the call.",
        "Verify caller identity before taking sensitive financial or security actions."
      ];
      recommendedAction = "Number format is valid; verify caller identity independently before taking sensitive actions as formatting does not verify caller identity.";
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
const generateRiskInterpretation = async (type, normalizedInput, deterministicData, groqClient = groq) => {
  const fallback = generateDeterministicInterpretation(deterministicData, type);

  // If input was structurally invalid, do not waste an LLM call; deterministic fallback is already exact!
  if (!deterministicData.formatValid) {
    return fallback;
  }

  const effectiveGroq = groqClient || groq;
  const apiKey = process.env.GROQ_API_KEY;
  // If neither an injected groq client nor a configured API key is present, use fallback
  if (!effectiveGroq || (!groqClient && (!apiKey || apiKey === 'dummy_key_to_prevent_crash_if_not_set'))) {
    return fallback;
  }

  const prompt = `You are the explanation layer of VerifyMe. 
Explain this deterministic verification result based solely on the provided evidence.

Target Type: ${type}
Target Value: ${normalizedInput}
Technical Health Score: ${deterministicData.score}/100
Technical Status: ${deterministicData.technicalStatus}
Reputation Status: ${deterministicData.reputationStatus}
Threat Assessment: ${deterministicData.threatAssessmentStatus}
Identity Status: ${deterministicData.identityStatus}
Evidence Completeness: ${deterministicData.evidenceCompleteness || deterministicData.confidence}%
Verified Signals: ${JSON.stringify(deterministicData.signals)}
Identified Risk Warnings: ${JSON.stringify(deterministicData.warnings)}
Unverified Limitations: ${JSON.stringify(deterministicData.limitations)}

CRITICAL RULES:
1. DO NOT change or invent a new score or risk level.
2. Explain specifically how the verified signals and risk warnings contributed to the result.
3. Clearly acknowledge the unverified limitations (e.g. valid phone format does not prove caller identity; valid email domain does not prove message author; HTTPS does not verify organization legitimacy).
4. Do NOT invent external facts (e.g., do not invent breach histories, owner names, or blacklists not provided).
5. STRICT LANGUAGE RULES:
   - NEVER use overclaiming language such as 'High Digital Trust', 'Fully Verified', 'Safe', or 'Legitimate Entity'.
   - Do NOT claim 'Website infrastructure is verified' or that a website's business/identity is verified — state only that technical reachability, DNS, and TLS checks passed.
   - Do NOT claim caller identity is verified — state only that the numbering format conforms to national/international plans.
   - Do NOT claim an individual sender or message is authenticated — state only that domain-level records (MX/SPF/DMARC) are configured.
   - Use precise evidence-based phrases: 'Technical Checks Passed', 'No Technical Risk Indicators Detected', 'Limited Verification — Exercise Caution'.
6. Produce practical, target-aware precautions.

Return valid JSON matching this schema:
{
  "summary": "1-2 sentence objective summary",
  "whyScore": ["key reason 1", "key reason 2"],
  "riskFactors": ["factor 1", "factor 2"],
  "precautions": ["precaution 1", "precaution 2", "precaution 3"],
  "recommendedAction": "1 clear sentence of actionable advice"
}`;

  const makeGroqRequest = async (retries = 1) => {
    try {
      const targetModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

      const timeoutPromise = new Promise((_, reject) => {
        const e = new Error('Timeout');
        e.status = 408;
        setTimeout(() => reject(e), 8000);
      });

      const payload = {
        messages: [{ role: 'user', content: prompt }],
        model: targetModel,
        temperature: 0.1,
        response_format: { type: "json_object" }
      };

      const chatCompletion = await Promise.race([
        effectiveGroq.chat.completions.create(payload),
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
      console.error(`[GROQ_ERROR] provider=groq stage=request status=${err.status || 'unknown'} fallback=deterministic message=${err.message}`);

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

// ---------------------------------------------------------
// UNIFIED VERIFICATION PIPELINE ENTRY POINT
// ---------------------------------------------------------
const performVerification = async (type, normalizedInput, options = {}) => {
  // 1. Gather deterministic evidence
  const deterministicData = await getDeterministicSignals(type, normalizedInput, options);

  // 2. Generate analysis (AI or Deterministic Fallback)
  const analysis = await generateRiskInterpretation(type, normalizedInput, deterministicData, options.groqClient || groq);

  // 3. Return the exact unified contract expected by controllers and frontend
  return {
    success: true,
    verification: {
      score: deterministicData.score,
      technicalHealthScore: deterministicData.technicalHealthScore,
      technicalScore: deterministicData.technicalScore,
      technicalStatus: deterministicData.technicalStatus,
      reputationStatus: deterministicData.reputationStatus,
      identityStatus: deterministicData.identityStatus,
      threatAssessmentStatus: deterministicData.threatAssessmentStatus,
      threatIndicators: deterministicData.threatIndicators,
      evidenceCompleteness: deterministicData.evidenceCompleteness,
      riskLevel: deterministicData.riskLevel,
      targetType: type,
      targetValue: normalizedInput,
      signalsAnalyzed: deterministicData.signals.length + deterministicData.warnings.length,
      evidenceChecked: deterministicData.signals.length,
      riskIndicators: deterministicData.warnings.length,
      confidence: deterministicData.confidence,
      signals: deterministicData.signals,
      warnings: deterministicData.warnings,
      limitations: deterministicData.limitations,
      spfEvaluation: deterministicData.spfEvaluation
    },
    analysis: analysis,

    // Spread for backwards compatibility
    ...deterministicData,
    technicalHealthScore: deterministicData.technicalHealthScore,
    technicalScore: deterministicData.technicalScore,
    technicalStatus: deterministicData.technicalStatus,
    reputationStatus: deterministicData.reputationStatus,
    identityStatus: deterministicData.identityStatus,
    threatAssessmentStatus: deterministicData.threatAssessmentStatus,
    threatIndicators: deterministicData.threatIndicators,
    evidenceCompleteness: deterministicData.evidenceCompleteness,
    spfEvaluation: deterministicData.spfEvaluation,
    summary: analysis.summary,
    whyThisScore: Array.isArray(analysis.whyScore) ? analysis.whyScore.join(' ') : (analysis.whyScore || ''),
    recommendedAction: analysis.recommendedAction
  };
};

module.exports = {
  performVerification,
  getDeterministicSignals,
  generateDeterministicInterpretation,
  generateRiskInterpretation,
  checkDomain,
  checkHttp,
  isPrivateOrInternalIP,
  evaluateSpfPolicy
};
