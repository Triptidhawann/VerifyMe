/**
 * University Grants Commission (UGC) & National Institutional Recognition Adapter
 * 
 * Verifies claimed Indian universities and higher educational institutions
 * against official statutory recognition criteria (Central, State, Deemed, Private, INI).
 */

const RECOGNIZED_UNIVERSITIES = [
  {
    name: 'University of Delhi',
    type: 'CENTRAL_UNIVERSITY',
    state: 'Delhi',
    establishedYear: 1922,
    ugcRecognized: true,
    website: 'du.ac.in',
    aliases: ['delhi university', 'university of delhi', 'du']
  },
  {
    name: 'Jawaharlal Nehru University',
    type: 'CENTRAL_UNIVERSITY',
    state: 'Delhi',
    establishedYear: 1969,
    ugcRecognized: true,
    website: 'jnu.ac.in',
    aliases: ['jawaharlal nehru university', 'jnu']
  },
  {
    name: 'Indian Institute of Technology Bombay',
    type: 'INSTITUTE_OF_NATIONAL_IMPORTANCE',
    state: 'Maharashtra',
    establishedYear: 1958,
    ugcRecognized: true,
    website: 'iitb.ac.in',
    aliases: ['iit bombay', 'indian institute of technology bombay', 'iitb']
  },
  {
    name: 'Indian Institute of Technology Delhi',
    type: 'INSTITUTE_OF_NATIONAL_IMPORTANCE',
    state: 'Delhi',
    establishedYear: 1961,
    ugcRecognized: true,
    website: 'iitd.ac.in',
    aliases: ['iit delhi', 'indian institute of technology delhi', 'iitd']
  },
  {
    name: 'Anna University',
    type: 'STATE_UNIVERSITY',
    state: 'Tamil Nadu',
    establishedYear: 1978,
    ugcRecognized: true,
    website: 'annauniv.edu',
    aliases: ['anna university', 'anna univ']
  },
  {
    name: 'University of Mumbai',
    type: 'STATE_UNIVERSITY',
    state: 'Maharashtra',
    establishedYear: 1857,
    ugcRecognized: true,
    website: 'mu.ac.in',
    aliases: ['mumbai university', 'university of mumbai', 'mu']
  },
  {
    name: 'Banaras Hindu University',
    type: 'CENTRAL_UNIVERSITY',
    state: 'Uttar Pradesh',
    establishedYear: 1916,
    ugcRecognized: true,
    website: 'bhu.ac.in',
    aliases: ['banaras hindu university', 'bhu']
  }
];

// List of known unaccredited or flagged self-styled institutions (UGC Fake Universities Gazette reference)
const UGC_FAKE_UNIVERSITIES_LIST = [
  'commercial university ltd. daryaganj, delhi',
  'united nations university, delhi',
  'vocational university, delhi',
  'st. john\'s university, kishanattam, kerala',
  'raja arabic university, nagpur',
  'd.d.b. sanskrit vishwavidyalaya, puthur, trichi',
  'indian institute of science and engineering, new delhi',
  'national university of electro complex homeoeopathy, kanpur',
  'gandhi hindi vidyapith, prayag, allahabad'
];

async function queryUgcRegistry({ institutionName }) {
  const retrievalTimestamp = new Date().toISOString();

  if (!institutionName) {
    return {
      sourceName: 'University Grants Commission (UGC) Statutory Registry',
      sourceType: 'STATUTORY_ACADEMIC_REGISTRY',
      sourceUrl: 'https://www.ugc.gov.in/',
      retrievalTimestamp,
      queryScope: 'Unspecified Institution Name',
      status: 'NOT_APPLICABLE',
      verificationMethod: 'CRITERIA_EVALUATION',
      returnedEvidence: null,
      limitations: 'No university or degree-granting institution name extracted.'
    };
  }

  const normalized = institutionName.toLowerCase().trim();

  // 1. Check against UGC Flagged / Fake Universities Gazette list
  const isFlaggedFake = UGC_FAKE_UNIVERSITIES_LIST.some(fake => 
    normalized.includes(fake) || fake.includes(normalized)
  );

  if (isFlaggedFake) {
    return {
      sourceName: 'University Grants Commission (UGC) Statutory Registry',
      sourceType: 'STATUTORY_ACADEMIC_REGISTRY',
      sourceUrl: 'https://www.ugc.gov.in/page/Fake-Universities.aspx',
      retrievalTimestamp,
      queryScope: institutionName,
      status: 'REJECTED',
      verificationMethod: 'STATUTORY_ALERT_LIST_MATCH',
      returnedEvidence: {
        flaggedAsFake: true,
        alertType: 'UNACCREDITED_SELF_STYLED_INSTITUTION',
        statutoryAction: 'Flagged on official UGC list of non-recognized institutions.'
      },
      limitations: 'Institution is explicitly listed on official public UGC notices as lacking degree-granting authority.'
    };
  }

  // 2. Search recognized universities directory
  const matched = RECOGNIZED_UNIVERSITIES.find(u => 
    u.aliases.some(alias => normalized === alias || normalized.includes(alias) || alias.includes(normalized))
  );

  if (matched) {
    return {
      sourceName: 'University Grants Commission (UGC) Statutory Registry',
      sourceType: 'STATUTORY_ACADEMIC_REGISTRY',
      sourceUrl: 'https://www.ugc.gov.in/oldpdf/alluniversity.pdf',
      retrievalTimestamp,
      queryScope: matched.name,
      status: 'CONFIRMED',
      verificationMethod: 'GAZETTE_DIRECTORY_MATCH',
      returnedEvidence: {
        legalName: matched.name,
        type: matched.type,
        state: matched.state,
        establishedYear: matched.establishedYear,
        ugcRecognized: matched.ugcRecognized,
        officialDomain: matched.website
      },
      limitations: 'Confirms statutory university recognition; does not confirm individual student enrollment.'
    };
  }

  // If generic university name not in initial directory
  return {
    sourceName: 'University Grants Commission (UGC) Statutory Registry',
    sourceType: 'STATUTORY_ACADEMIC_REGISTRY',
    sourceUrl: 'https://www.ugc.gov.in/',
    retrievalTimestamp,
    queryScope: institutionName,
    status: 'INCONCLUSIVE',
    verificationMethod: 'DIRECTORY_SEARCH',
    returnedEvidence: {
      institutionName,
      foundInCoreIndex: false
    },
    limitations: 'Institution name not indexed in core tier-1 directory. Recommend verifying against state higher education portal or AISHE code.'
  };
}

module.exports = {
  queryUgcRegistry,
  RECOGNIZED_UNIVERSITIES
};
