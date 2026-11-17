const { describe, it } = require('node:test');
const assert = require('node:assert');
const { getDeterministicSignals } = require('../src/services/intelligenceEngine');

describe('Phone Number Verification Pipeline', () => {
  it('should correctly validate international E.164 numbers with explicit + prefix', async () => {
    const res = await getDeterministicSignals('phone', '+14155552671');
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.signals.some(s => s.includes('US (+1)')));
    assert.ok(res.signals.some(s => s.includes('+1 415 555 2671')));
    assert.strictEqual(res.riskLevel, 'LIMITED VERIFICATION'); // Identity is unverified
    assert.strictEqual(res.score, 100);
  });

  it('should handle Indian 10-digit numbers with country code included without +', async () => {
    const res = await getDeterministicSignals('phone', '919915108159');
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.signals.some(s => s.includes('IN (+91)')));
    assert.ok(res.signals.some(s => s.includes('+91 99151 08159')));
  });

  it('should handle Indian 10-digit national local numbers when + is omitted', async () => {
    const res = await getDeterministicSignals('phone', '9915108159');
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.signals.some(s => s.includes('IN')));
    assert.ok(res.signals.some(s => s.includes('Interpreted under IN national numbering plan')));
  });

  it('should flag multi-region ambiguity when national format matches multiple countries without context', async () => {
    const res = await getDeterministicSignals('phone', '4155552671');
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.warnings.some(w => w.includes('matches multiple national numbering plans')));
    assert.ok(res.warnings.some(w => w.includes('US') && w.includes('IN')));
    assert.strictEqual(res.score, 85);
  });

  it('should resolve national format unambiguously when user provides country context', async () => {
    const res = await getDeterministicSignals('phone', '4155552671', { country: 'US' });
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.signals.some(s => s.includes('US (+1)')));
    assert.ok(!res.warnings.some(w => w.includes('matches multiple national numbering plans')));
    assert.strictEqual(res.score, 100);
  });

  it('should not accidentally parse national area codes as foreign country calling codes', async () => {
    // 4155552671 must NOT be parsed as Switzerland (+41)
    const res = await getDeterministicSignals('phone', '4155552671');
    assert.ok(!res.signals.some(s => s.includes('CH (+41)') || s.includes('Switzerland')));
  });

  it('should handle UK national numbers', async () => {
    const res = await getDeterministicSignals('phone', '+442079460958');
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.signals.some(s => s.includes('GB (+44)')));
    assert.ok(res.signals.some(s => s.includes('landline') || s.includes('fixed-line')));
  });

  it('should detect premium-rate numbers and penalize risk score', async () => {
    const res = await getDeterministicSignals('phone', '+19005550199');
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.warnings.some(w => w.includes('Premium-rate number detected')));
    assert.strictEqual(res.riskLevel, 'HIGH RISK');
    assert.ok(res.score <= 40);
  });

  it('should detect toll-free numbers and record limitations', async () => {
    const res = await getDeterministicSignals('phone', '+18005550199');
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.signals.some(s => s.includes('Toll-free')));
    assert.ok(res.limitations.some(l => l.includes('Toll-free numbers are frequently spoofed')));
  });

  it('should reject severely malformed or incomplete phone numbers', async () => {
    const res = await getDeterministicSignals('phone', '12345');
    assert.strictEqual(res.formatValid, false);
    assert.ok(res.warnings.some(w => w.includes('structurally invalid')));
    assert.strictEqual(res.technicalStatus, 'INVALID INPUT');
    assert.strictEqual(res.riskLevel, 'INVALID INPUT');
    assert.ok(res.score <= 30);
  });

  it('should clearly document limitations regarding carrier and caller identity', async () => {
    const res = await getDeterministicSignals('phone', '+14155552671');
    assert.ok(res.limitations.length >= 2);
    assert.ok(res.limitations.some(l => l.includes('does not prove who owns or is dialing')));
  });
});
