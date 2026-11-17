const { describe, it } = require('node:test');
const assert = require('node:assert');
const { 
  getDeterministicSignals, 
  generateDeterministicInterpretation,
  performVerification 
} = require('../src/services/intelligenceEngine');

describe('Batch 3: Scoring Architecture, Risk Classification & Result Credibility Overhaul', () => {

  // =========================================================================
  // TARGET 1: https://google.com
  // =========================================================================
  it('TARGET 1: https://google.com achieves 100/100 technical health score with unrated reputation', async () => {
    const mockDns = { lookup: async () => ({ address: '142.250.190.46', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'https://google.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    // Dimension A: Technical Health Score (No artificial 65 cap)
    assert.strictEqual(res.formatValid, true);
    assert.strictEqual(res.technicalHealthScore, 100);
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.technicalStatus, 'TECHNICAL CHECKS PASSED');

    // Dimension B: Trust & Threat Intelligence Assessment
    assert.strictEqual(res.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.threatAssessmentStatus, 'NOT CHECKED');
    assert.strictEqual(res.identityStatus, 'NOT VERIFIED');
    assert.strictEqual(res.threatIndicators.length, 0);
    assert.strictEqual(res.riskLevel, 'LIMITED VERIFICATION');

    // Dimension C: Evidence Completeness (Completeness 75% does NOT cap score at 75)
    assert.strictEqual(res.evidenceCompleteness, 75);
    assert.strictEqual(res.confidence, 75);

    // Objective explanation
    const interp = generateDeterministicInterpretation(res, 'website');
    assert.ok(interp.summary.includes('technical reachability confirmed'));
    assert.ok(interp.whyScore.some(w => w.includes('verified CA TLS certificate')));
    assert.ok(interp.whyScore.some(w => w.includes('External reputation')));
  });

  // =========================================================================
  // TARGET 2: https://neverssl.com / http://neverssl.com
  // =========================================================================
  it('TARGET 2: Plaintext HTTP website flags TRANSPORT SECURITY WEAKNESS with calibrated score ~45', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.34', family: 4 }) };
    const mockHttp = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res = await getDeterministicSignals('website', 'http://neverssl.com', {
      dnsModule: mockDns,
      httpModule: mockHttp
    });

    assert.strictEqual(res.formatValid, true);
    assert.strictEqual(res.technicalStatus, 'TRANSPORT SECURITY WEAKNESS');
    assert.strictEqual(res.score, 45);
    assert.strictEqual(res.technicalHealthScore, 45);
    assert.strictEqual(res.riskLevel, 'SUSPICIOUS');
    assert.ok(res.warnings.some(w => w.includes('Unencrypted HTTP protocol requested')));

    const interp = generateDeterministicInterpretation(res, 'website');
    assert.ok(interp.summary.includes('unencrypted HTTP connection'));
    assert.ok(interp.precautions.some(p => p.includes('credentials') || p.includes('unencrypted')));
  });

  it('TARGET 2B: Expired/Invalid TLS flags CERTIFICATE VALIDATION FAILURE with calibrated score ~45', async () => {
    const mockDns = { lookup: async () => ({ address: '93.184.216.35', family: 4 }) };
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
              const res = { statusCode: 200, headers: {}, resume: () => {} };
              setTimeout(() => cb(res), 5);
            }
          }
        };
        return req;
      }
    };

    const res = await getDeterministicSignals('website', 'https://neverssl.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(res.technicalStatus, 'CERTIFICATE VALIDATION FAILURE');
    assert.strictEqual(res.score, 45);
    assert.strictEqual(res.riskLevel, 'SUSPICIOUS');
    assert.ok(res.warnings.some(w => w.includes('TLS/SSL certificate validation failed')));
  });

  // =========================================================================
  // TARGET 3: +919876543210
  // =========================================================================
  it('TARGET 3: +919876543210 receives 100/100 technical health with identity strictly unverified', async () => {
    const res = await getDeterministicSignals('phone', '+919876543210');

    // Technical Dimension (No artificial 70 cap)
    assert.strictEqual(res.formatValid, true);
    assert.strictEqual(res.technicalHealthScore, 100);
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.technicalStatus, 'TECHNICAL CHECKS PASSED');

    // Trust / Identity Dimension
    assert.strictEqual(res.identityStatus, 'NOT VERIFIED');
    assert.strictEqual(res.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.threatAssessmentStatus, 'NOT CHECKED');
    assert.strictEqual(res.threatIndicators.length, 0);
    assert.strictEqual(res.riskLevel, 'LIMITED VERIFICATION');

    // Evidence Completeness
    assert.strictEqual(res.evidenceCompleteness, 65);
    assert.strictEqual(res.confidence, 65);

    // Interpretation accuracy
    const interp = generateDeterministicInterpretation(res, 'phone');
    assert.ok(interp.summary.includes('conforms to authoritative national and international (E.164) numbering plans'));
    assert.ok(interp.whyScore.some(w => w.includes('Live telecom subscriber identity')));
  });

  // =========================================================================
  // TARGET 4: 123
  // =========================================================================
  it('TARGET 4: 123 is classified as INVALID INPUT (not a malicious attack or threat indicator)', async () => {
    const res = await getDeterministicSignals('phone', '123');

    // Dimension A: Format is invalid, low technical score
    assert.strictEqual(res.formatValid, false);
    assert.strictEqual(res.technicalStatus, 'INVALID INPUT');
    assert.strictEqual(res.riskLevel, 'INVALID INPUT');
    assert.strictEqual(res.score, 15);
    assert.strictEqual(res.technicalHealthScore, 15);

    // Crucial: NOT classified as High Risk or malicious threat indicator
    assert.strictEqual(res.threatIndicators.length, 0);
    assert.strictEqual(res.threatAssessmentStatus, 'NO KNOWN THREATS DETECTED');
    assert.strictEqual(res.reputationStatus, 'NOT APPLICABLE');
    assert.strictEqual(res.evidenceCompleteness, 100);

    // User-friendly interpretation explains incomplete input, not scam threat
    const interp = generateDeterministicInterpretation(res, 'phone');
    assert.ok(interp.summary.includes('structurally incomplete'));
    assert.ok(interp.precautions.some(p => p.includes('missing characters, digits, or syntax errors')));
    assert.ok(!interp.summary.toLowerCase().includes('critical security threat'));
  });

  // =========================================================================
  // TARGET 5: test@gmail.com
  // =========================================================================
  it('TARGET 5: test@gmail.com scores 88/100 with accurate DMARC p=none monitoring notation', async () => {
    const mockDns = {
      resolveMx: async () => [
        { exchange: 'gmail-smtp-in.l.google.com', priority: 5 },
        { exchange: 'alt1.gmail-smtp-in.l.google.com', priority: 10 }
      ],
      resolve4: async () => ['142.250.190.26'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name.startsWith('_dmarc.')) {
          return [['v=DMARC1; p=none; sp=quarantine; rua=mailto:mailauth-reports@google.com']];
        }
        if (name === '_spf.google.com') {
          return [['v=spf1 include:_netblocks.google.com ~all']];
        }
        if (name === '_netblocks.google.com') {
          return [['v=spf1 ip4:172.217.0.0/19 ~all']];
        }
        return [['v=spf1 redirect=_spf.google.com']];
      }
    };

    const res = await getDeterministicSignals('email', 'test@gmail.com', { dnsModule: mockDns });

    // Technical score: 20 (syntax) + 20 (DNS) + 25 (MX) + 18 (SPF) + 5 (DMARC p=none) = 88
    assert.strictEqual(res.formatValid, true);
    assert.strictEqual(res.score, 88);
    assert.strictEqual(res.technicalHealthScore, 88);
    assert.strictEqual(res.technicalStatus, 'AUTHENTICATION POLICY WEAKNESS');

    // Identity unverified
    assert.strictEqual(res.identityStatus, 'NOT VERIFIED');
    assert.strictEqual(res.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.threatIndicators.length, 0);
    assert.strictEqual(res.evidenceCompleteness, 75);

    // Monitoring-only warning present
    assert.ok(res.warnings.some(w => w.includes('monitoring-only (p=none)')));
  });

  // =========================================================================
  // TARGET 6: test@example.com
  // =========================================================================
  it('TARGET 6: test@example.com flags missing MX records with calibrated score ~40', async () => {
    const mockDns = {
      resolveMx: async () => {
        const err = new Error('queryMx ENODATA example.com');
        err.code = 'ENODATA';
        throw err;
      },
      resolve4: async () => ['93.184.216.34'],
      resolve6: async () => [],
      resolveTxt: async () => []
    };

    const res = await getDeterministicSignals('email', 'test@example.com', { dnsModule: mockDns });

    assert.strictEqual(res.formatValid, true);
    assert.strictEqual(res.technicalStatus, 'DNS RESOLUTION FAILURE');
    assert.strictEqual(res.score, 40);
    assert.strictEqual(res.technicalHealthScore, 40);
    assert.ok(res.warnings.some(w => w.includes('Domain lacks MX records')));

    const interp = generateDeterministicInterpretation(res, 'email');
    assert.ok(interp.summary.includes('cannot receive mail due to missing or failed DNS mail exchange'));
  });

  // =========================================================================
  // UNIFIED VERIFICATION PIPELINE CONTRACT
  // =========================================================================
  it('Unified verification pipeline exposes all Batch 3 assessment dimensions', async () => {
    const mockDns = { lookup: async () => ({ address: '142.250.190.46', family: 4 }) };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const result = await performVerification('website', 'https://google.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.verification.technicalHealthScore, 100);
    assert.strictEqual(result.verification.score, 100);
    assert.strictEqual(result.verification.technicalStatus, 'TECHNICAL CHECKS PASSED');
    assert.strictEqual(result.verification.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(result.verification.identityStatus, 'NOT VERIFIED');
    assert.strictEqual(result.verification.threatAssessmentStatus, 'NOT CHECKED');
    assert.strictEqual(result.verification.evidenceCompleteness, 75);
    assert.strictEqual(result.verification.confidence, 75);
    assert.deepStrictEqual(result.verification.threatIndicators, []);
  });
});
