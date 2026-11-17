const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  getDeterministicSignals,
  isPrivateOrInternalIP,
  checkHttp,
  generateDeterministicInterpretation,
  performVerification
} = require('../src/services/intelligenceEngine');

describe('Website Verification Pipeline', () => {
  it('should verify IP addresses against private / internal subnets (SSRF protection)', () => {
    // Loopback
    assert.strictEqual(isPrivateOrInternalIP('127.0.0.1'), true);
    assert.strictEqual(isPrivateOrInternalIP('127.0.0.2'), true);
    // RFC 1918 Private
    assert.strictEqual(isPrivateOrInternalIP('10.0.0.1'), true);
    assert.strictEqual(isPrivateOrInternalIP('10.255.255.255'), true);
    assert.strictEqual(isPrivateOrInternalIP('172.16.0.1'), true);
    assert.strictEqual(isPrivateOrInternalIP('172.31.255.255'), true);
    assert.strictEqual(isPrivateOrInternalIP('192.168.1.1'), true);
    // Link-local / Cloud metadata
    assert.strictEqual(isPrivateOrInternalIP('169.254.169.254'), true);
    // IPv6 Loopback & mapped
    assert.strictEqual(isPrivateOrInternalIP('::1'), true);
    assert.strictEqual(isPrivateOrInternalIP('::ffff:127.0.0.1'), true);
    // Public IPs
    assert.strictEqual(isPrivateOrInternalIP('8.8.8.8'), false);
    assert.strictEqual(isPrivateOrInternalIP('142.250.190.46'), false);
    assert.strictEqual(isPrivateOrInternalIP('1.1.1.1'), false);
  });

  it('should block localhost and private IP hosts before making requests (SSRF)', async () => {
    const resLocalhost = await getDeterministicSignals('website', 'http://localhost:8080');
    assert.strictEqual(resLocalhost.riskLevel, 'HIGH RISK');
    assert.ok(resLocalhost.warnings.some(w => w.includes('blocked by security filter')));

    const resPrivate = await getDeterministicSignals('website', 'http://192.168.1.1');
    assert.strictEqual(resPrivate.riskLevel, 'HIGH RISK');
    assert.ok(resPrivate.warnings.some(w => w.includes('blocked by security filter')));

    const resMetadata = await getDeterministicSignals('website', 'http://169.254.169.254/latest/meta-data');
    assert.strictEqual(resMetadata.riskLevel, 'HIGH RISK');
    assert.ok(resMetadata.warnings.some(w => w.includes('blocked by security filter')));
  });

  it('should block DNS rebinding attempts pointing to internal addresses', async () => {
    const mockDns = {
      lookup: async () => ({ address: '127.0.0.1', family: 4 })
    };

    const httpRes = await checkHttp('http://rebind-test.example.com', { dnsModule: mockDns });
    assert.strictEqual(httpRes.reachable, false);
    assert.strictEqual(httpRes.blocked, true);
    assert.ok(httpRes.reason.includes('resolves to private/internal IP address'));
  });

  it('should evaluate reachable HTTPS website as technical pass without false LOW RISK trust inversion', async () => {
    const mockDns = {
      lookup: async () => ({ address: '142.250.190.46', family: 4 })
    };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = {
          statusCode: 200,
          headers: {},
          resume: () => {}
        };
        setTimeout(() => cb(res), 5);
        return {
          on: () => {},
          end: () => {}
        };
      }
    };

    const res = await getDeterministicSignals('website', 'https://google.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(res.formatValid, true);
    assert.strictEqual(res.technicalStatus, 'TECHNICAL CHECKS PASSED');
    assert.strictEqual(res.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.riskLevel, 'LIMITED VERIFICATION');
    assert.notStrictEqual(res.riskLevel, 'LOW RISK');
    assert.notStrictEqual(res.riskLevel, 'MODERATE RISK');
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.technicalHealthScore, 100);
    assert.ok(res.signals.some(s => s.includes('TLS/SSL certificate verified')));
    assert.ok(res.signals.some(s => s.includes('Website is reachable')));
    assert.ok(res.limitations.some(l => l.includes('Domain reputation')));
  });

  it('should flag TLS certificate failures and penalize score', async () => {
    const mockDns = {
      lookup: async () => ({ address: '93.184.216.34', family: 4 })
    };
    const mockHttps = {
      request: (url, opts, cb) => {
        const handlers = {};
        const req = {
          on: (event, handler) => { handlers[event] = handler; },
          end: () => {
            if (opts.rejectUnauthorized) {
              const certError = new Error('certificate has expired');
              certError.code = 'CERT_HAS_EXPIRED';
              setTimeout(() => handlers.error?.(certError), 5);
            } else {
              // unverified succeeds to confirm server is up
              const res = { statusCode: 200, headers: {}, resume: () => {} };
              setTimeout(() => cb(res), 5);
            }
          }
        };
        return req;
      }
    };

    const res = await getDeterministicSignals('website', 'https://expired-cert.example.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(res.formatValid, true);
    assert.ok(res.warnings.some(w => w.includes('TLS/SSL certificate validation failed')));
    assert.ok(res.score <= 50, `Expected penalized score <= 50, got ${res.score}`);
    assert.ok(res.riskLevel === 'HIGH RISK' || res.riskLevel === 'SUSPICIOUS');
  });

  it('should detect unencrypted HTTP protocol', async () => {
    const mockDns = {
      lookup: async () => ({ address: '93.184.216.35', family: 4 })
    };
    const mockHttp = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'http://unencrypted-site.example.com', {
      dnsModule: mockDns,
      httpModule: mockHttp
    });

    assert.ok(res.warnings.some(w => w.includes('Unencrypted HTTP protocol requested')));
    assert.strictEqual(res.technicalStatus, 'TRANSPORT SECURITY WEAKNESS');
    assert.ok(res.score <= 50);
  });

  it('should detect Punycode homograph domain patterns', async () => {
    const res = await getDeterministicSignals('website', 'https://xn--pple-43d.com', {
      dnsModule: { lookup: async () => ({ address: '93.184.216.36', family: 4 }) },
      httpsModule: { request: (u, o, cb) => { cb({ statusCode: 200, headers: {}, resume: () => {} }); return { on: () => {}, end: () => {} }; } }
    });
    assert.ok(res.warnings.some(w => w.includes('Punycode internationalized domain detected')));
  });

  it('should recognize HTTP redirect upgrade to HTTPS', async () => {
    const mockDns = {
      lookup: async () => ({ address: '93.184.216.37', family: 4 })
    };
    const mockHttp = {
      request: (url, opts, cb) => {
        const res = {
          statusCode: 301,
          headers: { location: 'https://example.com/' },
          resume: () => {}
        };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = {
          statusCode: 200,
          headers: {},
          resume: () => {}
        };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'http://example.com', {
      dnsModule: mockDns,
      httpModule: mockHttp,
      httpsModule: mockHttps
    });

    assert.ok(res.signals.some(s => s.includes('Automatically upgrades unencrypted HTTP requests to secure HTTPS')));
  });

  it('should block redirects attempting SSRF to private IP addresses or localhost', async () => {
    let callCount = 0;
    const mockDns = {
      lookup: async (hostname) => {
        callCount++;
        if (hostname === 'public-site.com') {
          return { address: '93.184.216.34', family: 4 };
        }
        // Redirect target resolves to internal cloud metadata
        return { address: '169.254.169.254', family: 4 };
      }
    };

    const mockHttp = {
      request: (url, opts, cb) => {
        const res = {
          statusCode: 302,
          headers: { location: 'http://169.254.169.254/latest/meta-data/' },
          resume: () => {}
        };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'http://public-site.com', {
      dnsModule: mockDns,
      httpModule: mockHttp
    });

    assert.ok(res.warnings.some(w => w.includes('internal/private network address') || w.includes('SSRF')));
  });

  it('should pin connection to validated IP to prevent TOCTOU DNS rebinding', async () => {
    let capturedLookup = null;
    const mockDns = {
      lookup: async () => ({ address: '93.184.216.34', family: 4 })
    };
    const mockHttps = {
      request: (url, opts, cb) => {
        capturedLookup = opts.lookup;
        const res = {
          statusCode: 200,
          headers: {},
          resume: () => {}
        };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    await getDeterministicSignals('website', 'https://example.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.ok(typeof capturedLookup === 'function', 'Custom pinned lookup was registered');
    // Verify pinned lookup returns the validated IP and ignores caller-supplied hostname
    let resolvedIp = null;
    capturedLookup('attacker-rebinding.com', {}, (err, address) => {
      resolvedIp = address;
    });
    assert.strictEqual(resolvedIp, '93.184.216.34', 'Connection was pinned to the pre-validated IP');
  });

  it('should handle unreachable websites gracefully without crashing', async () => {
    const mockDns = {
      lookup: async () => {
        const err = new Error('getaddrinfo ENOTFOUND fake-unreachable.xyz');
        err.code = 'ENOTFOUND';
        throw err;
      }
    };

    const res = await getDeterministicSignals('website', 'https://fake-unreachable.xyz', {
      dnsModule: mockDns
    });

    assert.strictEqual(res.formatValid, true);
    assert.ok(res.warnings.some(w => w.includes('Website failed to respond')));
    assert.ok(res.score <= 35);
  });

  // --------------------------------------------------------------------------
  // BATCH 1.5: WEBSITE VERDICT & SCORING REDESIGN TESTS
  // --------------------------------------------------------------------------

  it('WEBSITE TEST 1: Valid HTTPS with no threat intelligence integration', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'https://example.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(res.technicalStatus, 'TECHNICAL CHECKS PASSED');
    assert.strictEqual(res.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.riskLevel, 'LIMITED VERIFICATION');
    assert.notStrictEqual(res.riskLevel, 'LOW RISK');
    assert.notStrictEqual(res.riskLevel, 'MODERATE RISK');
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.technicalHealthScore, 100);
  });

  it('WEBSITE TEST 2: Valid HTTPS with an actual TLS failure', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        if (opts.rejectUnauthorized) {
          const req = {
            on: (event, handler) => {
              if (event === 'error') {
                const err = new Error('certificate has expired');
                err.code = 'CERT_HAS_EXPIRED';
                setTimeout(() => handler(err), 5);
              }
            },
            end: () => {}
          };
          return req;
        } else {
          const res = { statusCode: 200, headers: {}, resume: () => {} };
          setTimeout(() => cb(res), 5);
          return { on: () => {}, end: () => {} };
        }
      }
    };

    const res = await getDeterministicSignals('website', 'https://expired-cert.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(res.technicalStatus, 'CERTIFICATE VALIDATION FAILURE');
    assert.strictEqual(res.riskLevel, 'SUSPICIOUS');
    assert.ok(res.warnings.some(w => w.includes('TLS/SSL certificate validation failed')));

    const interp = generateDeterministicInterpretation(res, 'website');
    assert.ok(interp.summary.includes('TLS certificate validation failed'));
  });

  it('WEBSITE TEST 3: HTTP-only website', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttp = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'http://unencrypted.com', {
      dnsModule: mockDns,
      httpModule: mockHttp
    });

    assert.strictEqual(res.technicalStatus, 'TRANSPORT SECURITY WEAKNESS');
    assert.ok(res.warnings.some(w => w.includes('Unencrypted HTTP protocol requested')));

    const interp = generateDeterministicInterpretation(res, 'website');
    assert.ok(interp.summary.includes('unencrypted HTTP connection'));
  });

  it('WEBSITE TEST 4: Reputation unchecked state explicitly preserved', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'https://unrated-clean.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(res.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.identityStatus, 'NOT VERIFIED');
    assert.ok(res.limitations.some(l => l.includes('Domain reputation and threat intelligence: NOT CHECKED')));
  });

  it('WEBSITE TEST 5: Threat indicators detected only when actual evidence exists', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    // Punycode lookalike domain
    const resPunycode = await getDeterministicSignals('website', 'https://xn--pple-43d.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(resPunycode.threatAssessmentStatus, 'THREAT INDICATORS DETECTED');
    assert.ok(resPunycode.threatIndicators.some(t => t.includes('Punycode')));

    // Clean domain (Rule A: unconfigured provider means threat assessment is NOT CHECKED)
    const resClean = await getDeterministicSignals('website', 'https://apple.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(resClean.threatAssessmentStatus, 'NOT CHECKED');
    assert.strictEqual(resClean.threatIndicators.length, 0);
  });

  it('WEBSITE TEST 6: Zero threat indicators with reputation unchecked must NOT mean clean/safe', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'https://potential-phish.xyz', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(res.threatIndicators.length, 0);
    assert.strictEqual(res.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.riskLevel, 'LIMITED VERIFICATION');
  });

  it('WEBSITE TEST 7: Deterministic explanations match the actual check results', async () => {
    // 7A: Clean HTTPS
    const cleanInterp = generateDeterministicInterpretation({
      formatValid: true,
      warnings: [],
      signals: ['Valid URL', 'HTTPS', 'TLS verified', 'Reachable'],
      score: 65,
      riskLevel: 'LIMITED VERIFICATION'
    }, 'website');
    assert.ok(cleanInterp.summary.includes('Transport encryption and server reachability were verified'));
    assert.ok(cleanInterp.summary.includes('not evaluated'));

    // 7B: TLS failure
    const tlsInterp = generateDeterministicInterpretation({
      formatValid: true,
      warnings: ['TLS/SSL certificate validation failed: CERT_HAS_EXPIRED'],
      signals: ['Valid URL'],
      score: 30,
      riskLevel: 'SUSPICIOUS'
    }, 'website');
    assert.ok(tlsInterp.summary.includes('TLS certificate validation failed'));

    // 7C: Plaintext HTTP
    const httpInterp = generateDeterministicInterpretation({
      formatValid: true,
      warnings: ['Unencrypted HTTP protocol requested (data transmission is unencrypted)'],
      signals: ['Valid URL'],
      score: 35,
      riskLevel: 'SUSPICIOUS'
    }, 'website');
    assert.ok(httpInterp.summary.includes('unencrypted HTTP connection'));

    // 7D: Unreachable
    const unreachInterp = generateDeterministicInterpretation({
      formatValid: true,
      warnings: ['Website failed to respond: Unreachable'],
      signals: ['Valid URL'],
      score: 30,
      riskLevel: 'HIGH RISK'
    }, 'website');
    assert.ok(unreachInterp.summary.includes('failed to respond to network reachability queries'));
  });

  it('WEBSITE TEST 8: API response and frontend interpretation remain consistent in performVerification', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await performVerification('website', 'https://example.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.verification);
    assert.strictEqual(res.verification.technicalScore, 100);
    assert.strictEqual(res.verification.technicalHealthScore, 100);
    assert.strictEqual(res.verification.technicalStatus, 'TECHNICAL CHECKS PASSED');
    assert.strictEqual(res.verification.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.verification.identityStatus, 'NOT VERIFIED');
    assert.strictEqual(res.verification.threatAssessmentStatus, 'NOT CHECKED');
    assert.strictEqual(res.verification.riskLevel, 'LIMITED VERIFICATION');
    assert.strictEqual(res.technicalStatus, 'TECHNICAL CHECKS PASSED');
  });

  // ==========================================================================
  // BATCH 1.6: THREAT INTELLIGENCE & API CONTRACT REGRESSIONS (TESTS 10-16)
  // ==========================================================================

  it('BATCH 1.6 TEST 10: No threat provider configured (Rule A)', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'https://example-rule-a.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
      // threatProvider deliberately omitted
    });

    assert.strictEqual(res.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.threatAssessmentStatus, 'NOT CHECKED');
    assert.strictEqual(res.technicalStatus, 'TECHNICAL CHECKS PASSED');
    assert.strictEqual(res.riskLevel, 'LIMITED VERIFICATION');
    assert.notStrictEqual(res.riskLevel, 'LOW RISK');
  });

  it('BATCH 1.6 TEST 11: Provider queried successfully with no findings (Rule B)', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };
    const mockThreatProvider = async () => ({
      hasThreat: false,
      threats: [],
      status: 'CLEAN'
    });

    const res = await getDeterministicSignals('website', 'https://example-rule-b.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps,
      threatProvider: mockThreatProvider
    });

    assert.strictEqual(res.reputationStatus, 'CHECKED');
    assert.strictEqual(res.threatAssessmentStatus, 'NO KNOWN THREATS DETECTED');
    assert.strictEqual(res.technicalStatus, 'TECHNICAL CHECKS PASSED');
    assert.strictEqual(res.riskLevel, 'LOW RISK');
    assert.ok(res.score >= 80);
  });

  it('BATCH 1.6 TEST 12: Provider returns actual threat evidence (Rule C)', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };
    const mockThreatProvider = async () => ({
      hasThreat: true,
      threats: ['PHISHING_CAMPAIGN'],
      details: 'Active credential harvesting campaign detected'
    });

    const res = await getDeterministicSignals('website', 'https://example-rule-c.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps,
      threatProvider: mockThreatProvider
    });

    assert.strictEqual(res.reputationStatus, 'CHECKED');
    assert.strictEqual(res.threatAssessmentStatus, 'THREAT INDICATORS DETECTED');
    assert.strictEqual(res.riskLevel, 'HIGH RISK');
    assert.ok(res.score <= 20);
    assert.ok(res.warnings.some(w => w.includes('Threat intelligence alert')));
  });

  it('BATCH 1.6 TEST 13: Provider request fails (Rule D)', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };
    const mockThreatProvider = async () => {
      const err = new Error('Threat intelligence upstream network error');
      err.code = 'ETIMEDOUT';
      throw err;
    };

    const res = await getDeterministicSignals('website', 'https://example-rule-d.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps,
      threatProvider: mockThreatProvider
    });

    assert.strictEqual(res.reputationStatus, 'UNAVAILABLE');
    assert.strictEqual(res.threatAssessmentStatus, 'CHECK FAILED');
    assert.ok(res.warnings.some(w => w.includes('External threat intelligence query failed')));
  });

  it('BATCH 1.6 TEST 14: Frontend status and audit export remain consistent', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await performVerification('website', 'https://audit-export-test.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    // Check parity between verification sub-object and top-level response
    assert.strictEqual(res.verification.technicalStatus, res.technicalStatus);
    assert.strictEqual(res.verification.reputationStatus, res.reputationStatus);
    assert.strictEqual(res.verification.threatAssessmentStatus, res.threatAssessmentStatus);
    assert.strictEqual(res.verification.identityStatus, res.identityStatus);
    assert.strictEqual(res.verification.riskLevel, res.riskLevel);

    // Verify format expected by export report
    const exportData = {
      target: res.verification.targetValue,
      technicalStatus: res.verification.technicalStatus,
      reputationStatus: res.verification.reputationStatus,
      threatAssessmentStatus: res.verification.threatAssessmentStatus,
      identityStatus: res.verification.identityStatus
    };
    assert.strictEqual(exportData.technicalStatus, 'TECHNICAL CHECKS PASSED');
    assert.strictEqual(exportData.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(exportData.threatAssessmentStatus, 'NOT CHECKED');
    assert.strictEqual(exportData.identityStatus, 'NOT VERIFIED');
  });

  it('BATCH 1.6 TEST 15: Existing phone and email response contracts remain intact', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mx.test.com', priority: 10 }],
      resolve4: async () => ['1.2.3.4'],
      resolve6: async () => [],
      resolveTxt: async () => [['v=spf1 -all']]
    };

    const emailRes = await performVerification('email', 'user@test.com', { dnsModule: mockDns });
    assert.strictEqual(emailRes.success, true);
    assert.ok(emailRes.verification);
    assert.ok(emailRes.analysis);
    assert.strictEqual(emailRes.verification.targetType, 'email');
    assert.strictEqual(typeof emailRes.verification.score, 'number');
    assert.ok(Array.isArray(emailRes.verification.signals));
    assert.ok(Array.isArray(emailRes.verification.warnings));
    assert.ok(Array.isArray(emailRes.verification.limitations));

    const phoneRes = await performVerification('phone', '+12025550123');
    assert.strictEqual(phoneRes.success, true);
    assert.ok(phoneRes.verification);
    assert.ok(phoneRes.analysis);
    assert.strictEqual(phoneRes.verification.targetType, 'phone');
    assert.strictEqual(typeof phoneRes.verification.score, 'number');
    assert.ok(Array.isArray(phoneRes.verification.signals));
    assert.ok(Array.isArray(phoneRes.verification.warnings));
    assert.ok(Array.isArray(phoneRes.verification.limitations));
  });

  it('BATCH 1.6 TEST 16: Legacy website riskLevel cannot produce misleading website risk badges', () => {
    // Simulate the frontend badge evaluation function from VerificationResult.jsx
    const evaluateBadge = (verification, isWebsite, isTechnicalPass, isHighRisk) => {
      if (isWebsite) {
        if (verification.reputationStatus === 'CHECKED' && verification.threatAssessmentStatus === 'NO KNOWN THREATS DETECTED') {
          return verification.riskLevel || 'LOW RISK';
        }
        if (isTechnicalPass) return 'TECHNICAL CHECKS PASSED';
        if (isHighRisk) return 'HIGH RISK';
        if (verification.riskLevel === 'SUSPICIOUS') return 'SUSPICIOUS';
        return verification.technicalStatus || 'LIMITED VERIFICATION';
      }
      return verification.technicalStatus || verification.riskLevel;
    };

    // Case 1: Unrated website with technical pass and legacy riskLevel: 'LOW RISK'
    const legacyLowRiskWebsite = {
      technicalStatus: 'TECHNICAL CHECKS PASSED',
      reputationStatus: 'NOT CHECKED',
      threatAssessmentStatus: 'NOT CHECKED',
      riskLevel: 'LOW RISK'
    };
    const badge1 = evaluateBadge(legacyLowRiskWebsite, true, true, false);
    assert.strictEqual(badge1, 'TECHNICAL CHECKS PASSED', 'Must not display LOW RISK when reputation is NOT CHECKED');

    // Case 2: Unrated website with legacy riskLevel: 'MODERATE RISK'
    const legacyModRiskWebsite = {
      technicalStatus: 'TECHNICAL CHECKS PASSED',
      reputationStatus: 'NOT CHECKED',
      threatAssessmentStatus: 'NOT CHECKED',
      riskLevel: 'MODERATE RISK'
    };
    const badge2 = evaluateBadge(legacyModRiskWebsite, true, true, false);
    assert.strictEqual(badge2, 'TECHNICAL CHECKS PASSED', 'Must not display MODERATE RISK when reputation is NOT CHECKED');

    // Case 3: Checked website with verified clean reputation
    const verifiedCleanWebsite = {
      technicalStatus: 'TECHNICAL CHECKS PASSED',
      reputationStatus: 'CHECKED',
      threatAssessmentStatus: 'NO KNOWN THREATS DETECTED',
      riskLevel: 'LOW RISK'
    };
    const badge3 = evaluateBadge(verifiedCleanWebsite, true, true, false);
    assert.strictEqual(badge3, 'LOW RISK', 'Can display LOW RISK only when reputation is CHECKED and clean');
  });
});
