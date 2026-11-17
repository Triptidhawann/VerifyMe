const { describe, it } = require('node:test');
const assert = require('node:assert');
const { getDeterministicSignals, generateDeterministicInterpretation } = require('../src/services/intelligenceEngine');

describe('Unified Risk Assessment & Scoring Regressions', () => {
  it('REGRESSION 1: Phone number format validity must not automatically equal "LOW RISK" (Score 85)', async () => {
    const res = await getDeterministicSignals('phone', '+14155552671');
    assert.strictEqual(res.formatValid, true);
    // Batch 3 Architecture: Technical Health is 100 (clean technical numbering format),
    // but Identity Status is strictly NOT VERIFIED and risk level is LIMITED VERIFICATION.
    assert.notStrictEqual(res.riskLevel, 'LOW RISK');
    assert.strictEqual(res.riskLevel, 'LIMITED VERIFICATION');
    assert.strictEqual(res.identityStatus, 'NOT VERIFIED');
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.technicalHealthScore, 100);
  });

  it('REGRESSION 2: Pure technical website checks must NOT grant false "LOW RISK" (Phishing Inversion Prevention)', async () => {
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

    // Batch 3 Architecture: Technical validation passes completely (score 100),
    // but reputation is explicitly NOT CHECKED, identity is NOT VERIFIED, and risk is LIMITED VERIFICATION.
    assert.strictEqual(res.technicalStatus, 'TECHNICAL CHECKS PASSED');
    assert.strictEqual(res.reputationStatus, 'NOT CHECKED');
    assert.strictEqual(res.threatAssessmentStatus, 'NOT CHECKED');
    assert.strictEqual(res.identityStatus, 'NOT VERIFIED');
    assert.strictEqual(res.riskLevel, 'LIMITED VERIFICATION');
    assert.notStrictEqual(res.riskLevel, 'LOW RISK');
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.technicalHealthScore, 100);
    assert.strictEqual(res.evidenceCompleteness, 75);
    assert.ok(res.limitations.some(l => l.includes('Domain reputation')));
  });

  it('REGRESSION 3: DMARC p=none must not be praised as "strict DMARC policy"', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.example.com', priority: 10 }],
      resolve4: async () => ['1.2.3.4'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name.startsWith('_dmarc.')) return [['v=DMARC1; p=none']];
        return [['v=spf1 ~all']];
      }
    };

    const res = await getDeterministicSignals('email', 'test@example.com', { dnsModule: mockDns });
    const hasFalseStrictSignal = res.signals.some(s => s.toLowerCase().includes('strict dmarc'));
    assert.strictEqual(hasFalseStrictSignal, false, 'DMARC p=none was incorrectly reported as strict!');
    assert.ok(res.warnings.some(w => w.includes('monitoring-only (p=none)')));
  });

  it('REGRESSION 4: Multiple SPF records must be flagged as RFC 7208 syntax errors', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.test.com', priority: 10 }],
      resolve4: async () => ['1.2.3.4'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name.startsWith('_dmarc.')) return [];
        return [['v=spf1 ip4:1.1.1.1 -all'], ['v=spf1 include:_spf.google.com ~all']];
      }
    };

    const res = await getDeterministicSignals('email', 'test@test.com', { dnsModule: mockDns });
    assert.ok(res.warnings.some(w => w.includes('Multiple SPF records')));
  });

  it('REGRESSION 5: SSRF private IPs, loopback, and metadata must receive elevated risk (Score <= 15)', async () => {
    const res = await getDeterministicSignals('website', 'http://169.254.169.254');
    assert.strictEqual(res.riskLevel, 'HIGH RISK');
    assert.ok(res.score <= 15);
  });

  it('Deterministic interpretation generates evidence-traceable explanations', () => {
    const mockData = {
      score: 70,
      riskLevel: 'MODERATE RISK',
      confidence: 65,
      signals: ['Conforms to valid national numbering plan', 'Standard E.164 representation'],
      warnings: ['No country calling code prefix was provided'],
      limitations: ['Caller identity cannot be confirmed from format alone']
    };

    const interpretation = generateDeterministicInterpretation(mockData, 'phone');
    assert.strictEqual(interpretation.source, 'deterministic');
    assert.ok(interpretation.summary.length > 0);
    assert.ok(interpretation.whyScore.length >= 1);
    assert.ok(interpretation.precautions.length >= 2);
    assert.ok(interpretation.recommendedAction.length > 0);
    assert.ok(interpretation.riskFactors.includes('No country calling code prefix was provided'));
  });

  it('Low-risk deterministic interpretations must not use overclaiming trust language', () => {
    const lowRiskPhone = {
      score: 85,
      riskLevel: 'LOW RISK',
      confidence: 80,
      signals: ['Format valid'],
      warnings: [],
      limitations: ['Caller identity cannot be confirmed']
    };
    const lowRiskEmail = {
      score: 88,
      riskLevel: 'LOW RISK',
      confidence: 85,
      signals: ['MX valid', 'SPF -all', 'DMARC p=reject'],
      warnings: [],
      limitations: ['Individual sender not authenticated']
    };
    const lowRiskWebsite = {
      score: 85,
      riskLevel: 'LOW RISK',
      confidence: 80,
      signals: ['HTTPS valid', 'TLS valid'],
      warnings: [],
      limitations: ['Organization identity unverified']
    };

    const interpPhone = generateDeterministicInterpretation(lowRiskPhone, 'phone');
    const interpEmail = generateDeterministicInterpretation(lowRiskEmail, 'email');
    const interpWeb = generateDeterministicInterpretation(lowRiskWebsite, 'website');

    // Forbidden overclaims
    const forbiddenPhrases = [
      'High Digital Trust',
      'Website infrastructure is verified',
      'caller is verified',
      'sender is verified',
      'identity is verified',
      'safe to trust'
    ];

    [interpPhone, interpEmail, interpWeb].forEach(interp => {
      const fullText = JSON.stringify(interp).toLowerCase();
      forbiddenPhrases.forEach(phrase => {
        assert.strictEqual(
          fullText.includes(phrase.toLowerCase()),
          false,
          `Found forbidden overclaim "${phrase}" in interpretation: ${JSON.stringify(interp)}`
        );
      });
    });

    // Check calibrated language
    assert.ok(interpWeb.summary.includes('technical reachability'));
    assert.ok(interpWeb.recommendedAction.includes('Technical checks passed'));
    assert.ok(interpEmail.summary.includes('Domain email configuration'));
    assert.ok(interpPhone.summary.includes('numbering plans'));
  });
});
