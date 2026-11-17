const { describe, it } = require('node:test');
const assert = require('node:assert');
const { getDeterministicSignals, checkDomain, evaluateSpfPolicy } = require('../src/services/intelligenceEngine');

describe('Email Verification Pipeline', () => {
  it('should reject malformed email syntax', async () => {
    const res = await getDeterministicSignals('email', 'not-an-email');
    assert.strictEqual(res.formatValid, false);
    assert.ok(res.warnings.some(w => w.includes('Malformed email address syntax')));
    assert.strictEqual(res.technicalStatus, 'INVALID INPUT');
    assert.strictEqual(res.riskLevel, 'INVALID INPUT');
    assert.ok(res.score <= 20);
  });

  it('should detect disposable email domains and assign elevated risk', async () => {
    // Mock DNS for disposable domain so it resolves
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.tempmail.com', priority: 10 }],
      resolve4: async () => ['192.0.2.1'],
      resolve6: async () => [],
      resolveTxt: async () => []
    };

    const res = await getDeterministicSignals('email', 'user@tempmail.com', { dnsModule: mockDns });
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.warnings.some(w => w.includes('temporary/disposable email service')));
    assert.strictEqual(res.riskLevel, 'HIGH RISK');
    assert.ok(res.score <= 25);
  });

  it('should correctly interpret strict SPF (-all) and strict DMARC (p=reject)', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.secure-corp.com', priority: 10 }],
      resolve4: async () => ['198.51.100.1'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name.startsWith('_dmarc.')) {
          return [['v=DMARC1; p=reject; rua=mailto:dmarc@secure-corp.com']];
        }
        return [['v=spf1 ip4:198.51.100.0/24 -all']];
      }
    };

    const res = await getDeterministicSignals('email', 'audit@secure-corp.com', { dnsModule: mockDns });
    assert.strictEqual(res.formatValid, true);
    assert.strictEqual(res.riskLevel, 'LOW RISK');
    assert.strictEqual(res.score, 100);
    assert.ok(res.signals.some(s => s.includes('Strict DMARC policy configured (p=reject)')));
    assert.ok(res.signals.some(s => s.includes('HardFail/Strict')));
  });

  it('should NOT classify DMARC p=none as strict', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.monitor-only.com', priority: 10 }],
      resolve4: async () => ['198.51.100.2'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name.startsWith('_dmarc.')) {
          return [['v=DMARC1; p=none; rua=mailto:reports@monitor-only.com']];
        }
        return [['v=spf1 include:_spf.google.com ~all']];
      }
    };

    const res = await getDeterministicSignals('email', 'info@monitor-only.com', { dnsModule: mockDns });
    assert.strictEqual(res.formatValid, true);
    assert.ok(!res.signals.some(s => s.includes('strict DMARC policy')));
    assert.ok(res.warnings.some(w => w.includes('monitoring-only (p=none)')));
  });

  it('should detect RFC 7208 violation when multiple SPF records exist', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.broken-spf.com', priority: 10 }],
      resolve4: async () => ['198.51.100.3'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name.startsWith('_dmarc.')) return [];
        return [
          ['v=spf1 ip4:1.1.1.1 -all'],
          ['v=spf1 include:_spf.salesforce.com ~all']
        ];
      }
    };

    const res = await getDeterministicSignals('email', 'contact@broken-spf.com', { dnsModule: mockDns });
    assert.ok(res.warnings.some(w => w.includes('Multiple SPF records detected on domain (violates RFC 7208')));
  });

  it('should flag permissive SPF (+all) as a security vulnerability', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.open-sender.com', priority: 10 }],
      resolve4: async () => ['198.51.100.4'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name.startsWith('_dmarc.')) return [];
        return [['v=spf1 +all']];
      }
    };

    const res = await getDeterministicSignals('email', 'user@open-sender.com', { dnsModule: mockDns });
    assert.ok(res.warnings.some(w => w.includes('Permissive qualifier (+all)')));
  });

  it('should correctly handle domain with MX records even if A record throws ENODATA', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.mx-only.com', priority: 10 }],
      resolve4: async () => {
        const err = new Error('No address');
        err.code = 'ENODATA';
        throw err;
      },
      resolve6: async () => [],
      resolveTxt: async () => [['v=spf1 ~all']]
    };

    const domainResult = await checkDomain('mx-only.com', mockDns);
    assert.strictEqual(domainResult.exists, true);
    assert.strictEqual(domainResult.hasMX, true);
    assert.strictEqual(domainResult.mxRecords.length, 1);
  });

  it('should handle non-existent domains (NXDOMAIN / ENOTFOUND)', async () => {
    const mockDns = {
      resolveMx: async () => {
        const err = new Error('Domain not found');
        err.code = 'ENOTFOUND';
        throw err;
      },
      resolve4: async () => {
        const err = new Error('Domain not found');
        err.code = 'ENOTFOUND';
        throw err;
      },
      resolve6: async () => [],
      resolveTxt: async () => []
    };

    const res = await getDeterministicSignals('email', 'nobody@nonexistent-domain-test-xyz.com', { dnsModule: mockDns });
    assert.strictEqual(res.formatValid, true);
    assert.ok(res.warnings.some(w => w.includes('Domain does not exist or has no active DNS records')));
    assert.strictEqual(res.riskLevel, 'HIGH RISK');
  });

  it('should handle DNS query timeouts gracefully', async () => {
    const mockDns = {
      resolveMx: async () => {
        const err = new Error('DNS query timed out');
        err.code = 'ETIMEOUT';
        throw err;
      },
      resolve4: async () => {
        const err = new Error('DNS query timed out');
        err.code = 'ETIMEOUT';
        throw err;
      },
      resolve6: async () => [],
      resolveTxt: async () => []
    };

    const res = await getDeterministicSignals('email', 'admin@timeout-domain.com', { dnsModule: mockDns });
    assert.ok(res.warnings.some(w => w.includes('DNS lookup timed out') || w.includes('does not exist')));
  });

  it('should document that domain validation does not prove sender authenticity', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.test.com', priority: 10 }],
      resolve4: async () => ['1.2.3.4'],
      resolve6: async () => [],
      resolveTxt: async () => []
    };
    const res = await getDeterministicSignals('email', 'info@test.com', { dnsModule: mockDns });
    assert.ok(res.limitations.some(l => l.includes('not the authenticity of any individual email message')));
  });

  it('should recursively evaluate redirect= to strict -all policy', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.delegated.com', priority: 10 }],
      resolve4: async () => ['1.2.3.4'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name === 'delegated.com') return [['v=spf1 redirect=_spf.target.com']];
        if (name === '_spf.target.com') return [['v=spf1 ip4:10.20.30.0/24 -all']];
        return [];
      }
    };
    const res = await getDeterministicSignals('email', 'user@delegated.com', { dnsModule: mockDns });
    assert.ok(res.signals.some(s => s.includes('delegates SPF policy to _spf.target.com')));
    assert.ok(res.signals.some(s => s.includes('Strict SPF hardfail qualifier (-all)')));
  });

  it('should recursively evaluate redirect= to permissive +all and flag vulnerability', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.open.com', priority: 10 }],
      resolve4: async () => ['1.2.3.4'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name === 'open.com') return [['v=spf1 redirect=_spf.open.com']];
        if (name === '_spf.open.com') return [['v=spf1 +all']];
        return [];
      }
    };
    const res = await getDeterministicSignals('email', 'admin@open.com', { dnsModule: mockDns });
    assert.ok(res.warnings.some(w => w.includes('Permissive qualifier (+all) authorizes any sender worldwide')));
    assert.ok(res.score <= 50);
  });

  it('should detect SPF redirect loops and produce PermError', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.loop.com', priority: 10 }],
      resolve4: async () => ['1.2.3.4'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name === 'loop.com') return [['v=spf1 redirect=loop-target.com']];
        if (name === 'loop-target.com') return [['v=spf1 redirect=loop.com']];
        return [];
      }
    };
    const res = await getDeterministicSignals('email', 'test@loop.com', { dnsModule: mockDns });
    assert.ok(res.warnings.some(w => w.includes('SPF policy error') && w.includes('loop detected')));
  });

  it('should produce PermError when redirect target is missing', async () => {
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.missing-target.com', priority: 10 }],
      resolve4: async () => ['1.2.3.4'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        if (name === 'missing-target.com') return [['v=spf1 redirect=nonexistent.invalid']];
        const err = new Error('Not found');
        err.code = 'ENOTFOUND';
        throw err;
      }
    };
    const res = await getDeterministicSignals('email', 'test@missing-target.com', { dnsModule: mockDns });
    assert.ok(res.warnings.some(w => w.includes('SPF policy error') || w.includes('No SPF record published')));
  });

  it('should produce PermError when RFC 7208 10-lookup limit is exceeded', async () => {
    let callCount = 0;
    const mockDns = {
      resolveMx: async () => [{ exchange: 'mail.limit.com', priority: 10 }],
      resolve4: async () => ['1.2.3.4'],
      resolve6: async () => [],
      resolveTxt: async (name) => {
        callCount++;
        // Chains redirects 1 -> 2 -> 3 ... > 10
        return [[`v=spf1 redirect=hop${callCount}.limit.com`]];
      }
    };
    const res = await getDeterministicSignals('email', 'test@limit.com', { dnsModule: mockDns });
    assert.ok(res.warnings.some(w => w.includes('DNS lookup limit (10) exceeded')));
  });

  // --------------------------------------------------------------------------
  // BATCH 1.5: SPF PROTOCOL & STATIC INSPECTION REGRESSION TESTS
  // --------------------------------------------------------------------------

  it('SPF TEST 1: should NOT detect false loop on valid diamond / shared dependency graph', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'company.com') return [['v=spf1 include:vendor-a.com include:vendor-b.com -all']];
        if (name === 'vendor-a.com') return [['v=spf1 include:_spf.shared-infra.com ~all']];
        if (name === 'vendor-b.com') return [['v=spf1 include:_spf.shared-infra.com ~all']];
        if (name === '_spf.shared-infra.com') return [['v=spf1 ip4:198.51.100.1 ~all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('company.com', mockDns);
    assert.strictEqual(res.status, 'Valid');
    assert.strictEqual(res.qualifierStatus, 'HardFail');
  });

  it('SPF TEST 2: should detect direct circular dependency (A -> B -> A)', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'company.com') return [['v=spf1 include:vendor-a.com -all']];
        if (name === 'vendor-a.com') return [['v=spf1 include:company.com ~all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('company.com', mockDns);
    assert.strictEqual(res.status, 'PermError');
    assert.ok(res.reason.includes('loop detected'));
  });

  it('SPF TEST 3: should detect multi-domain circular dependency (A -> B -> C -> A)', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'company.com') return [['v=spf1 include:vendor-a.com -all']];
        if (name === 'vendor-a.com') return [['v=spf1 include:vendor-b.com ~all']];
        if (name === 'vendor-b.com') return [['v=spf1 include:company.com ~all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('company.com', mockDns);
    assert.strictEqual(res.status, 'PermError');
    assert.ok(res.reason.includes('loop detected'));
  });

  it('SPF TEST 4: should preserve original mechanism order and skip lookups after terminal all', async () => {
    let queriedBroken = false;
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'primary.com') return [['v=spf1 -all include:broken.invalid']];
        if (name === 'broken.invalid') {
          queriedBroken = true;
          return [];
        }
        return [];
      }
    };
    const res = await evaluateSpfPolicy('primary.com', mockDns);
    assert.strictEqual(res.status, 'Valid');
    assert.strictEqual(res.qualifierStatus, 'HardFail');
    assert.strictEqual(queriedBroken, false, 'Mechanisms after terminal all must not trigger lookups');
    assert.strictEqual(res.hasMechanismsAfterAll, true);
  });

  it('SPF TEST 5: should preserve mechanism qualifiers (+, -, ~, ?)', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'qual-test.com') return [['v=spf1 ~include:inc.com ?all']];
        if (name === 'inc.com') return [['v=spf1 ip4:10.0.0.1 -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('qual-test.com', mockDns);
    assert.strictEqual(res.status, 'Valid');
    assert.strictEqual(res.qualifierStatus, 'Neutral');
    assert.strictEqual(res.inspectedDependencies[0].qualifier, '~');
  });

  it('SPF TEST 6: should produce PermError when include target domain publishes no SPF record', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'missing-inc.com') return [['v=spf1 include:no-spf.com -all']];
        if (name === 'no-spf.com') return [];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('missing-inc.com', mockDns);
    assert.strictEqual(res.status, 'PermError');
    assert.ok(res.reason.includes('publishes no SPF record'));
  });

  it('SPF TEST 7: should produce PermError when included target publishes multiple SPF records', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'parent.com') return [['v=spf1 include:multi-spf.com -all']];
        if (name === 'multi-spf.com') return [['v=spf1 ip4:1.1.1.1 -all'], ['v=spf1 ip4:2.2.2.2 -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('parent.com', mockDns);
    assert.strictEqual(res.status, 'PermError');
    assert.ok(res.reason.includes('Multiple SPF records detected on domain'));
  });

  it('SPF TEST 8: should produce PermError when redirect target publishes no SPF record', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'redir.com') return [['v=spf1 redirect=no-spf-target.com']];
        if (name === 'no-spf-target.com') return [];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('redir.com', mockDns);
    assert.strictEqual(res.status, 'PermError');
    assert.ok(res.reason.includes('RFC 7208 Section 6.1 PermError'));
  });

  it('SPF TEST 9: should produce PermError when multiple redirect modifiers exist in a single record', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'multi-redir.com') return [['v=spf1 redirect=target1.com redirect=target2.com']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('multi-redir.com', mockDns);
    assert.strictEqual(res.status, 'PermError');
    assert.ok(res.reason.includes('Multiple redirect modifiers'));
  });

  it('SPF TEST 10: should count a, mx, ptr, exists, include, redirect towards DNS lookup quota', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'lookups.com') return [['v=spf1 a mx ptr exists:test.com include:inc.com -all']];
        if (name === 'inc.com') return [['v=spf1 -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('lookups.com', mockDns);
    assert.strictEqual(res.status, 'Valid');
    assert.ok(res.lookupsCount >= 5, `Expected lookupsCount >= 5, got ${res.lookupsCount}`);
  });

  it('SPF TEST 11: ip4 and ip6 mechanisms must NOT consume DNS lookup budget', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'ip-only.com') return [['v=spf1 ip4:10.0.0.1 ip4:10.0.0.2 ip6:2001:db8::1 -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('ip-only.com', mockDns);
    assert.strictEqual(res.status, 'Valid');
    assert.strictEqual(res.lookupsCount, 0, 'ip4 and ip6 must not increment lookup counter');
  });

  it('SPF TEST 12: should produce PermError when DNS lookup limit (10) is exceeded by terms', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'ten-limit.com') return [['v=spf1 a:1.com a:2.com a:3.com a:4.com a:5.com a:6.com a:7.com a:8.com a:9.com a:10.com a:11.com -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('ten-limit.com', mockDns);
    assert.strictEqual(res.status, 'PermError');
    assert.ok(res.reason.includes('DNS lookup limit (10) exceeded'));
  });

  it('SPF TEST 13: should produce PermError when void DNS lookup limit (2) is exceeded', async () => {
    const mockDns = {
      resolveTxt: async () => {
        const err = new Error('NXDOMAIN');
        err.code = 'ENOTFOUND';
        throw err;
      }
    };
    const state = { lookups: 0, voidLookups: 0 };
    await evaluateSpfPolicy('void1.invalid', mockDns, state);
    await evaluateSpfPolicy('void2.invalid', mockDns, state);
    const res3 = await evaluateSpfPolicy('void3.invalid', mockDns, state);
    assert.strictEqual(res3.status, 'PermError');
    assert.ok(res3.reason.includes('void DNS lookup limit (2) exceeded'));
  });

  it('SPF TEST 14: DNS timeout or SERVFAIL should produce TempError, not PermError', async () => {
    const mockDnsTimeout = {
      resolveTxt: async () => {
        const err = new Error('DNS query timed out');
        err.code = 'ETIMEOUT';
        throw err;
      }
    };
    const resTimeout = await evaluateSpfPolicy('timeout.com', mockDnsTimeout);
    assert.strictEqual(resTimeout.status, 'TempError');

    const mockDnsServfail = {
      resolveTxt: async () => {
        const err = new Error('Server failure');
        err.code = 'SERVFAIL';
        throw err;
      }
    };
    const resServfail = await evaluateSpfPolicy('servfail.com', mockDnsServfail);
    assert.strictEqual(resServfail.status, 'TempError');
  });

  it('SPF TEST 15: static inspection explicitly reports isPolicyInspectionOnly and authenticationEvaluated: false', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'static-check.com') return [['v=spf1 ip4:1.2.3.4 -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('static-check.com', mockDns);
    assert.strictEqual(res.status, 'Valid');
    assert.strictEqual(res.isPolicyInspectionOnly, true);
    assert.strictEqual(res.authenticationEvaluated, false);
    assert.ok(res.messageAuthentication.includes('NOT EVALUATED'));
  });

  // ==========================================================================
  // BATCH 1.6: SPF STATIC INSPECTION & DNS ACCOUNTING REGRESSION SUITE (TESTS 1-9)
  // ==========================================================================

  it('BATCH 1.6 SPF TEST 1: Static inspection of a mechanism followed by include and -all', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'test-domain.com') return [['v=spf1 a include:partner-relay.net -all']];
        if (name === 'partner-relay.net') return [['v=spf1 ip4:198.51.100.1 ~all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('test-domain.com', mockDns);
    assert.strictEqual(res.status, 'Valid');
    assert.strictEqual(res.authenticationEvaluated, false);
    assert.strictEqual(res.isPolicyInspectionOnly, true);
    // Preserves order: a, include, all
    assert.strictEqual(res.inspectedMechanisms[0].type, 'a');
    assert.strictEqual(res.inspectedMechanisms[1].type, 'include');
    assert.strictEqual(res.inspectedMechanisms[2].type, 'all');
    // Does not claim that any mechanism matched or that -all was executed
    assert.strictEqual(res.inspectedMechanisms[0].matched, undefined);
    assert.strictEqual(res.inspectedMechanisms[1].matched, undefined);
    assert.strictEqual(res.staticDnsDependenciesInspected.includes('partner-relay.net'), true);
  });

  it('BATCH 1.6 SPF TEST 2: No claim that a mechanism actually matched without a sender IP', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'no-ip-match.com') return [['v=spf1 ip4:192.0.2.1 mx include:inc.org -all']];
        if (name === 'inc.org') return [['v=spf1 ip4:192.0.2.2 -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('no-ip-match.com', mockDns);
    assert.strictEqual(res.authenticationEvaluated, false);
    assert.strictEqual(res.messageAuthentication, 'NOT EVALUATED (Requires connecting SMTP IP and envelope sender)');
    for (const mech of res.inspectedMechanisms) {
      assert.strictEqual(mech.matched, undefined);
      assert.strictEqual(mech.isMatch, undefined);
    }
  });

  it('BATCH 1.6 SPF TEST 3: Redirect modifier inspected without asserting message-level execution', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'redirect-policy.com') return [['v=spf1 ip4:192.0.2.1 redirect=_spf.target.com']];
        if (name === '_spf.target.com') return [['v=spf1 ip4:198.51.100.1 -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('redirect-policy.com', mockDns);
    assert.strictEqual(res.isRedirected, true);
    assert.strictEqual(res.redirectTarget, '_spf.target.com');
    assert.strictEqual(
      res.redirectExecutionMessageLevel,
      'CONDITIONAL (Executes at message time only if no preceding mechanism matches)'
    );
    assert.strictEqual(res.authenticationEvaluated, false);
  });

  it('BATCH 1.6 SPF TEST 4: Shared dependency graph remains valid', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'root.org') return [['v=spf1 include:branch1.org include:branch2.org -all']];
        if (name === 'branch1.org') return [['v=spf1 include:common-service.org ~all']];
        if (name === 'branch2.org') return [['v=spf1 include:common-service.org ~all']];
        if (name === 'common-service.org') return [['v=spf1 ip4:203.0.113.1 -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('root.org', mockDns);
    assert.strictEqual(res.status, 'Valid');
    assert.strictEqual(res.qualifierStatus, 'HardFail');
    assert.strictEqual(res.lookupLimitAssessment, 'WITHIN_LIMITS');
  });

  it('BATCH 1.6 SPF TEST 5: Circular dependency remains rejected', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'cycle-a.com') return [['v=spf1 include:cycle-b.com -all']];
        if (name === 'cycle-b.com') return [['v=spf1 include:cycle-c.com -all']];
        if (name === 'cycle-c.com') return [['v=spf1 include:cycle-a.com -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('cycle-a.com', mockDns);
    assert.strictEqual(res.status, 'PermError');
    assert.ok(res.reason.includes('loop detected'));
  });

  it('BATCH 1.6 SPF TEST 6: DNS-querying mechanisms are distinguished from non-querying mechanisms', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'dns-querying.com') return [['v=spf1 a mx ptr exists:chk.com include:sub.com -all']];
        if (name === 'sub.com') return [['v=spf1 ip4:1.2.3.4 ip6:2001:db8::1 -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('dns-querying.com', mockDns);
    assert.strictEqual(res.status, 'Valid');
    // a(1) + mx(1) + ptr(1) + exists(1) + include(1) = 5 DNS lookup terms
    // sub.com has ip4, ip6 which do NOT consume lookups
    assert.strictEqual(res.potentialDnsLookupTerms, 5);
  });

  it('BATCH 1.6 SPF TEST 7: Static potential lookup counts are not mislabeled as actual message lookup counts', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'counting.com') return [['v=spf1 a mx include:sub.com -all']];
        if (name === 'sub.com') return [['v=spf1 a -all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('counting.com', mockDns);
    assert.strictEqual(typeof res.potentialDnsLookupTerms, 'number');
    assert.strictEqual(res.potentialDnsLookupTerms, 4); // a, mx, include, sub:a
    // Crucial: actual message lookup count cannot be known without runtime IP evaluation
    assert.strictEqual(res.messageLookupCountEvaluated, null);
    assert.strictEqual(res.lookupLimitAssessment, 'WITHIN_LIMITS');
  });

  it('BATCH 1.6 SPF TEST 8: DNS timeout and SERVFAIL remain transient errors', async () => {
    const mockTimeout = {
      resolveTxt: async () => {
        const err = new Error('DNS Timeout');
        err.code = 'ETIMEOUT';
        throw err;
      }
    };
    const resTimeout = await evaluateSpfPolicy('timeout-test.org', mockTimeout);
    assert.strictEqual(resTimeout.status, 'TempError');
    assert.notStrictEqual(resTimeout.status, 'PermError');

    const mockServfail = {
      resolveTxt: async () => {
        const err = new Error('DNS Server Failure');
        err.code = 'SERVFAIL';
        throw err;
      }
    };
    const resServfail = await evaluateSpfPolicy('servfail-test.org', mockServfail);
    assert.strictEqual(resServfail.status, 'TempError');
    assert.notStrictEqual(resServfail.status, 'PermError');
  });

  it('BATCH 1.6 SPF TEST 9: SPF authentication remains explicitly NOT EVALUATED', async () => {
    const mockDns = {
      resolveTxt: async (name) => {
        if (name === 'eval-boundaries.com') return [['v=spf1 ip4:10.0.0.1/24 ~all']];
        return [];
      }
    };
    const res = await evaluateSpfPolicy('eval-boundaries.com', mockDns);
    assert.strictEqual(res.status, 'Valid');
    assert.strictEqual(res.authenticationEvaluated, false);
    assert.strictEqual(res.isPolicyInspectionOnly, true);
    assert.ok(res.messageAuthentication.includes('NOT EVALUATED'));
    assert.strictEqual(res.messageLookupCountEvaluated, null);
  });
});
