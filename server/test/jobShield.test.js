const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  processJobShieldInput,
  extractTextFromPdf,
  extractTextFromImage,
  extractTextFromUrl,
  JobShieldProcessingError
} = require('../src/services/jobShieldDocumentProcessor');
const {
  extractDeterministicEntities,
  extractRecruitmentClaims
} = require('../src/services/jobShieldExtractor');
const {
  investigateJobListing,
  queryGreenhouse,
  queryLever,
  queryAshby,
  inspectApplicationUrl,
  deriveCompanyTokens
} = require('../src/services/jobShieldJobListingService');
const {
  investigateSenderAndDomain,
  investigateProcessIntegrity,
  detectLookalikeDomain,
  levenshteinDistance
} = require('../src/services/jobShieldRecruiterService');
const {
  performJobShieldAssessment,
  determineOutcome,
  categorizeEvidence,
  OUTCOMES
} = require('../src/services/jobShieldAssessmentEngine');

describe('JobShield: Document & Input Processing', () => {
  it('should accept and validate clean pasted text', async () => {
    const text = 'Dear Candidate, We are pleased to offer you the position of Senior Frontend Engineer at Stripe. Your annual salary will be $180,000.';
    const res = await processJobShieldInput({ submissionType: 'text', rawText: text });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.text, text);
    assert.strictEqual(res.metadata.submissionType, 'text');
    assert.strictEqual(res.metadata.wordCount > 5, true);
  });

  it('should reject text that is too brief or empty', async () => {
    await assert.rejects(
      async () => await processJobShieldInput({ submissionType: 'text', rawText: 'Hello' }),
      (err) => err instanceof JobShieldProcessingError && err.code === 'INSUFFICIENT_TEXT'
    );
  });

  it('should reject invalid PDF missing %PDF- magic bytes', async () => {
    const corruptBuffer = Buffer.from('NOT A PDF FILE');
    await assert.rejects(
      async () => await extractTextFromPdf(corruptBuffer),
      (err) => err instanceof JobShieldProcessingError && err.code === 'INVALID_FILE_TYPE'
    );
  });

  it('should reject invalid image format with unsupported magic bytes', async () => {
    const corruptBuffer = Buffer.from('NOT AN IMAGE FILE');
    await assert.rejects(
      async () => await extractTextFromImage(corruptBuffer),
      (err) => err instanceof JobShieldProcessingError && err.code === 'INVALID_FILE_TYPE'
    );
  });

  it('should block SSRF attempts targeting localhost or private IPs in URL mode', async () => {
    await assert.rejects(
      async () => await extractTextFromUrl('http://127.0.0.1:8080/careers/job'),
      (err) => err instanceof JobShieldProcessingError && (err.code === 'SSRF_BLOCKED' || err.code === 'RESTRICTED_PORT')
    );
  });
});

describe('JobShield: Entity & Claim Extraction', () => {
  it('should deterministically extract company, title, salary, email and req ID', () => {
    const emailSample = `
From: Jane Recruiter <recruiter@stripe.com>
Reply-To: careers@stripe.com
Subject: Job Offer - Senior Distributed Systems Engineer

Dear Alex,
We are excited to extend an offer from Stripe for the position: Senior Distributed Systems Engineer.
Requisition ID: STRIPE-7892
Employment: Full-time
Location: Seattle, WA (Remote friendly)
Compensation: $195,000 per year
Please review the offer details and contact us at +1 415-555-0199.
`;
    const claims = extractDeterministicEntities(emailSample);
    assert.strictEqual(claims.senderEmail, 'recruiter@stripe.com');
    assert.strictEqual(claims.replyToEmail, 'careers@stripe.com');
    assert.strictEqual(claims.senderDomain, 'stripe.com');
    assert.strictEqual(claims.isFreeEmailSender, false);
    assert.strictEqual(claims.jobId, 'STRIPE-7892');
    assert.strictEqual(claims.employmentType, 'Full-time');
    assert.strictEqual(claims.paymentRequests.length, 0);
  });

  it('should detect advance fee and equipment purchase red flags', () => {
    const scamText = `
Congratulations! You have been selected without interview for the Data Entry Clerk role.
You will earn $45/hr.
Before starting, you must pay a refundable registration fee of $250.
Additionally, you must purchase equipment from our approved vendor via wire transfer or gift card.
`;
    const claims = extractDeterministicEntities(scamText);
    assert.strictEqual(claims.paymentRequests.length >= 2, true);
    assert.strictEqual(claims.urgencyTactics.length >= 1, true); // selected without interview
  });

  it('should detect premature banking credentials and OTP demands', () => {
    const credentialTheftText = `
To finalize your employment, please send us the OTP sent to your phone and provide your bank login password for direct deposit setup.
`;
    const claims = extractDeterministicEntities(credentialTheftText);
    assert.strictEqual(claims.sensitiveDocRequests.length >= 2, true);
  });

  it('should gracefully fall back to deterministic extraction when Groq fails', async () => {
    const mockFailingGroq = {
      chat: {
        completions: {
          create: async () => { throw new Error('Groq rate limit exceeded'); }
        }
      }
    };
    const sample = 'From: hr@apple.com\nOffer for Software Engineer at Apple with compensation $150,000/yr.';
    const result = await extractRecruitmentClaims(sample, {}, mockFailingGroq);
    assert.strictEqual(result.source, 'deterministic_fallback');
    assert.strictEqual(result.claims.senderDomain, 'apple.com');
  });
});

describe('JobShield: Public ATS Job Listing Verification', () => {
  it('should derive candidate company slugs from corporate names', () => {
    const tokens = deriveCompanyTokens('Stripe, Inc.', 'stripe.com');
    assert.strictEqual(tokens.includes('stripe'), true);
  });

  it('should inspect application URLs against verified ATS domains', () => {
    const ghUrl = 'https://boards.greenhouse.io/stripe/jobs/56789';
    const analysis = inspectApplicationUrl(ghUrl, 'stripe.com');
    assert.strictEqual(analysis.isOfficialAts, true);
    assert.strictEqual(analysis.atsDomain, 'boards.greenhouse.io');
    assert.strictEqual(analysis.isSuspicious, false);
  });

  it('should flag suspicious application destinations (e.g. Google Forms or shorteners)', () => {
    const formUrl = 'https://forms.gle/xyzFakeForm123';
    const analysis = inspectApplicationUrl(formUrl, 'company.com');
    assert.strictEqual(analysis.isSuspicious, true);
    assert.strictEqual(analysis.isOfficialAts, false);
  });

  it('should query Greenhouse public board and report accurate status', async () => {
    // Non-existent board token returns BOARD_NOT_DISCOVERED
    const res = await queryGreenhouse('non_existent_company_token_999999', 'Software Engineer', '123');
    assert.strictEqual(res.sourceType, 'official_ats');
    assert.strictEqual(res.status, 'BOARD_NOT_DISCOVERED');
  });
});

describe('JobShield: Recruiter & Sender Domain Verification', () => {
  it('should calculate Levenshtein distance correctly', () => {
    assert.strictEqual(levenshteinDistance('stripe', 'stripe'), 0);
    assert.strictEqual(levenshteinDistance('stripe', 'stripes'), 1);
    assert.strictEqual(levenshteinDistance('stripe', 'str1pe'), 1);
  });

  it('should detect lookalike phishing domains with recruitment affixes', () => {
    const lookalike1 = detectLookalikeDomain('stripe-careers.com', 'stripe.com');
    assert.strictEqual(lookalike1.isLookalike, true);
    assert.strictEqual(lookalike1.reason.includes('mimics company domain'), true);

    const lookalike2 = detectLookalikeDomain('google-jobs.com', 'google.com');
    assert.strictEqual(lookalike2.isLookalike, true);
  });

  it('should detect typo-squatting lookalike domains', () => {
    const typo = detectLookalikeDomain('str1pe.com', 'stripe.com');
    assert.strictEqual(typo.isLookalike, true);
  });

  it('should flag corporate recruiters using free public webmail', async () => {
    const res = await investigateSenderAndDomain({
      senderEmail: 'google.hiring.team@gmail.com',
      claimedDomain: 'google.com',
      companyName: 'Google'
    });
    assert.strictEqual(res.isFreeEmailSender, true);
    assert.strictEqual(res.isDomainAligned, false);
    const freeEmailFinding = res.findings.find(f => f.category === 'FREE_EMAIL_RECRUITER');
    assert.strictEqual(Boolean(freeEmailFinding), true);
  });

  it('should recognize authentic corporate domain alignment and subdomains', async () => {
    const res = await investigateSenderAndDomain({
      senderEmail: 'jane@careers.amazon.com',
      claimedDomain: 'amazon.com',
      companyName: 'Amazon'
    });
    assert.strictEqual(res.isDomainAligned, true);
    assert.strictEqual(res.isSubdomainAligned, true);
  });
});

describe('JobShield: Evidence-Based Assessment Outcomes', () => {
  it('should classify advance fee demand as HIGH RISK — STRONG FRAUD INDICATORS', async () => {
    const assessment = await performJobShieldAssessment({
      extractedClaims: {
        companyName: 'Acme Corp',
        jobTitle: 'Remote Assistant',
        senderEmail: 'recruiter@acme-careers.com',
        paymentRequests: ['Mandatory $150 registration fee'],
        sensitiveDocRequests: [],
        urgencyTactics: []
      },
      listingInvestigation: { listingVerdict: 'NO_OFFICIAL_PUBLIC_ATS_FOUND', evidence: [] },
      recruiterInvestigation: {
        senderDomain: 'acme-careers.com',
        claimedDomain: 'acme.com',
        isLookalikeDomain: true,
        lookalikeDetails: 'Lookalike domain mimicking acme.com',
        findings: []
      },
      processInvestigation: {
        criticalCount: 1,
        highCount: 0,
        findings: [{
          category: 'UPFRONT_FEE_DEMAND',
          severity: 'CRITICAL',
          title: 'Advance Payment Demanded',
          description: 'Candidate instructed to pay registration fee'
        }]
      }
    });

    assert.strictEqual(assessment.outcome, OUTCOMES.HIGH_RISK);
    assert.strictEqual(assessment.suspiciousIndicators.length >= 1, true);
    assert.strictEqual(assessment.recommendedAction.includes('NEVER transfer funds'), true);
  });

  it('should classify corporate free webmail as SUSPICIOUS — INCONSISTENCIES DETECTED', async () => {
    const assessment = await performJobShieldAssessment({
      extractedClaims: {
        companyName: 'Microsoft',
        jobTitle: 'Cloud Architect',
        senderEmail: 'msft_jobs@gmail.com',
        paymentRequests: [],
        sensitiveDocRequests: [],
        urgencyTactics: []
      },
      listingInvestigation: { listingVerdict: 'NO_OFFICIAL_PUBLIC_ATS_FOUND', evidence: [] },
      recruiterInvestigation: {
        senderDomain: 'gmail.com',
        claimedDomain: 'microsoft.com',
        isFreeEmailSender: true,
        isDomainAligned: false,
        findings: [{
          category: 'FREE_EMAIL_RECRUITER',
          severity: 'HIGH',
          title: 'Free Webmail Provider',
          description: 'Personal webmail used'
        }]
      },
      processInvestigation: { criticalCount: 0, highCount: 1, findings: [] }
    });

    assert.strictEqual(assessment.outcome, OUTCOMES.SUSPICIOUS);
  });

  it('should classify confirmed official ATS listing with aligned domain as VERIFIED THROUGH OFFICIAL SOURCES', async () => {
    const assessment = await performJobShieldAssessment({
      extractedClaims: {
        companyName: 'Stripe',
        jobTitle: 'Backend Engineer',
        senderEmail: 'recruiting@stripe.com',
        claimedDomain: 'stripe.com',
        paymentRequests: [],
        sensitiveDocRequests: [],
        urgencyTactics: []
      },
      listingInvestigation: {
        listingVerdict: 'OFFICIALLY_VERIFIED_ACTIVE',
        bestMatch: {
          status: 'FOUND_EXACT',
          sourceName: 'Greenhouse Public ATS Board',
          sourceUrl: 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs',
          checkedAt: new Date().toISOString(),
          matchedJob: { id: '4567', title: 'Backend Engineer' }
        },
        evidence: []
      },
      recruiterInvestigation: {
        senderDomain: 'stripe.com',
        claimedDomain: 'stripe.com',
        isDomainAligned: true,
        isSubdomainAligned: false,
        senderHasMx: true,
        findings: []
      },
      processInvestigation: { criticalCount: 0, highCount: 0, findings: [] }
    });

    assert.strictEqual(assessment.outcome, OUTCOMES.VERIFIED);
    assert.strictEqual(assessment.verifiedFacts.length >= 1, true);
  });

  it('should classify unresolvable entity as INSUFFICIENT EVIDENCE', async () => {
    const outcome = determineOutcome({
      extractedClaims: { companyName: null, claimedDomain: null, senderDomain: null },
      listingInvestigation: {},
      recruiterInvestigation: {},
      processInvestigation: { criticalCount: 0, highCount: 0, findings: [] }
    });
    assert.strictEqual(outcome, OUTCOMES.INSUFFICIENT_EVIDENCE);
  });
});
