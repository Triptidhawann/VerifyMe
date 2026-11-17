const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  performVerification,
  generateRiskInterpretation,
  generateDeterministicInterpretation
} = require('../src/services/intelligenceEngine');

describe('AI Integration and Fallback Architecture', () => {
  it('should bypass AI calls for structurally invalid inputs and use deterministic fallback', async () => {
    let aiCalled = false;
    const mockGroq = {
      chat: {
        completions: {
          create: async () => {
            aiCalled = true;
            return { choices: [{ message: { content: '{}' } }] };
          }
        }
      }
    };

    const invalidData = {
      formatValid: false,
      score: 15,
      riskLevel: 'HIGH RISK',
      confidence: 95,
      signals: [],
      warnings: ['Malformed syntax'],
      limitations: []
    };

    const result = await generateRiskInterpretation('email', 'bad-email', invalidData, mockGroq);
    assert.strictEqual(aiCalled, false, 'AI was invoked for an invalid input when it should have been bypassed!');
    assert.strictEqual(result.source, 'deterministic');
    assert.ok(result.summary.length > 0);
  });

  it('should gracefully fall back when Groq API times out or throws an error', async () => {
    const mockFailingGroq = {
      chat: {
        completions: {
          create: async () => {
            const err = new Error('Groq rate limit exceeded');
            err.status = 429;
            throw err;
          }
        }
      }
    };

    const validData = {
      formatValid: true,
      score: 75,
      riskLevel: 'MODERATE RISK',
      confidence: 80,
      signals: ['Valid format'],
      warnings: [],
      limitations: ['Identity unverified']
    };

    const result = await generateRiskInterpretation('phone', '+14155552671', validData, mockFailingGroq);
    assert.strictEqual(result.source, 'deterministic');
    assert.ok(result.precautions.length > 0);
    assert.ok(result.recommendedAction.length > 0);
  });

  it('should gracefully fall back when Groq returns malformed non-JSON response', async () => {
    const mockBadJsonGroq = {
      chat: {
        completions: {
          create: async () => {
            return {
              choices: [{ message: { content: 'Sorry, I cannot format this as JSON.' } }]
            };
          }
        }
      }
    };

    const validData = {
      formatValid: true,
      score: 80,
      riskLevel: 'LOW RISK',
      confidence: 85,
      signals: ['Valid domain'],
      warnings: [],
      limitations: []
    };

    const result = await generateRiskInterpretation('email', 'test@example.com', validData, mockBadJsonGroq);
    assert.strictEqual(result.source, 'deterministic');
  });

  it('should accept and return structured AI response when Groq succeeds', async () => {
    const aiPayload = {
      summary: "AI verified that the domain is properly configured with active mail records.",
      whyScore: ["Valid MX records", "Strict SPF"],
      riskFactors: [],
      precautions: ["Exercise standard caution with sensitive attachments."],
      recommendedAction: "The domain infrastructure is confirmed."
    };

    const mockWorkingGroq = {
      chat: {
        completions: {
          create: async () => {
            return {
              choices: [{ message: { content: JSON.stringify(aiPayload) } }]
            };
          }
        }
      }
    };

    const validData = {
      formatValid: true,
      score: 85,
      riskLevel: 'LOW RISK',
      confidence: 85,
      signals: ['Valid domain', 'MX configured'],
      warnings: [],
      limitations: []
    };

    const result = await generateRiskInterpretation('email', 'test@example.com', validData, mockWorkingGroq);
    assert.strictEqual(result.source, 'ai');
    assert.strictEqual(result.summary, aiPayload.summary);
    assert.deepStrictEqual(result.precautions, aiPayload.precautions);
  });

  it('performVerification preserves all frontend and controller contract fields', async () => {
    const result = await performVerification('phone', '+14155552671');
    assert.strictEqual(result.success, true);
    assert.ok(result.verification);
    assert.strictEqual(typeof result.verification.score, 'number');
    assert.strictEqual(typeof result.verification.riskLevel, 'string');
    assert.strictEqual(typeof result.verification.confidence, 'number');
    assert.ok(Array.isArray(result.verification.signals));
    assert.ok(Array.isArray(result.verification.warnings));
    assert.ok(Array.isArray(result.verification.limitations));
    assert.ok(result.analysis);
    assert.ok(result.summary);
    assert.ok(result.whyThisScore);
    assert.ok(result.recommendedAction);
  });
});
