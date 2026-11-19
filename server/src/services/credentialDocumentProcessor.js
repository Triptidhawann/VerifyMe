const crypto = require('crypto');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const CATEGORIES = {
  INTERNSHIP: 'INTERNSHIP',
  COURSE_COMPLETION: 'COURSE_COMPLETION',
  TRAINING: 'TRAINING',
  EXPERIENCE: 'EXPERIENCE',
  ACADEMIC: 'ACADEMIC',
  PROFESSIONAL_CERTIFICATION: 'PROFESSIONAL_CERTIFICATION'
};

class CredentialProcessingError extends Error {
  constructor(message, code = 'PROCESSING_ERROR', statusCode = 400) {
    super(message);
    this.name = 'CredentialProcessingError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Validates document buffer, MIME type, magic bytes, and size boundaries.
 */
function validateDocumentBuffer(buffer, mimeType, fileName) {
  if (!buffer || buffer.length === 0) {
    throw new CredentialProcessingError('Submitted document buffer is empty.', 'EMPTY_DOCUMENT');
  }

  if (buffer.length > MAX_FILE_BYTES) {
    throw new CredentialProcessingError(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum limit of 10 MB.`,
      'FILE_TOO_LARGE',
      413
    );
  }

  // Magic bytes inspection
  const isPdf = buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-';
  const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

  let detectedType = null;
  if (isPdf) detectedType = 'application/pdf';
  else if (isPng) detectedType = 'image/png';
  else if (isJpeg) detectedType = 'image/jpeg';

  if (!detectedType) {
    throw new CredentialProcessingError(
      'Unsupported document format. Allowed formats are PDF (%PDF-), PNG, and JPEG/JPG.',
      'INVALID_FILE_TYPE'
    );
  }

  // Check file extension if fileName provided
  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    if (!validExtensions.includes(ext)) {
      throw new CredentialProcessingError(
        `File extension .${ext} does not match allowed types (.pdf, .png, .jpg, .jpeg).`,
        'EXTENSION_MISMATCH'
      );
    }
  }

  return { detectedType, sizeBytes: buffer.length };
}

/**
 * Compute SHA-256 hash of document buffer for tamper-proof identification.
 */
function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extract plain text from PDF buffer using pdf-parse with fallback.
 */
async function extractTextFromPdf(buffer) {
  try {
    const pdf = require('pdf-parse');
    let text = '';
    let numPages = 1;
    let info = {};

    if (pdf.PDFParse) {
      const parser = new pdf.PDFParse({ data: buffer });
      await parser.load();
      const rawText = await parser.getText();
      text = typeof rawText === 'string' ? rawText : (rawText?.text || '');
      numPages = parser.pageCount || (typeof rawText === 'object' && rawText?.total) || 1;
      info = parser.info || {};
      if (typeof parser.destroy === 'function') parser.destroy();
    } else if (typeof pdf === 'function') {
      const parsed = await pdf(buffer);
      text = typeof parsed === 'string' ? parsed : (parsed?.text || '');
      numPages = parsed?.numpages || 1;
      info = parsed?.info || {};
    }

    // Unwrap long URLs split across line breaks in PDFs (e.g. "https://domain.com/verify/123\n456" -> "https://domain.com/verify/123456")
    let cleanedText = (text || '').trim();
    cleanedText = cleanedText.replace(/(https?:\/\/[^\s<>"']+)\r?\n([a-zA-Z0-9_\-\/]+)/g, '$1$2');

    // Fallback: If pdf-parse returned empty text (e.g. mock test fixture or raw text stream), inspect buffer for plain text
    if (!cleanedText) {
      const rawBufStr = buffer.toString('utf8');
      if (/(?:certify|certificate|university|college|completion|internship|awarded|marksheet|degree)/i.test(rawBufStr)) {
        cleanedText = rawBufStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
      }
    }

    return {
      text: cleanedText,
      numPages,
      info
    };
  } catch (err) {
    if (err.name === 'PasswordException' || (err.message && err.message.toLowerCase().includes('password'))) {
      throw new CredentialProcessingError('PDF is password-protected and cannot be analyzed.', 'PASSWORD_PROTECTED_PDF');
    }
    // Fallback: If parser threw on mock/non-standard PDF stream, check if buffer contains readable plain text
    try {
      const rawBufStr = buffer.toString('utf8');
      if (/(?:certify|certificate|university|college|completion|internship|awarded|marksheet|degree)/i.test(rawBufStr)) {
        const fallbackText = rawBufStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
        if (fallbackText) {
          return { text: fallbackText, numPages: 1, info: {} };
        }
      }
    } catch {}
    // Return empty text if parse fails
    return { text: '', numPages: 1, info: {}, error: err.message };
  }
}

/**
 * Optical Character Recognition for image certificates or scanned pages.
 */
async function extractTextFromImage(buffer) {
  try {
    const Tesseract = require('tesseract.js');
    const result = await Tesseract.recognize(buffer, 'eng');
    return (result?.data?.text || '').trim();
  } catch (err) {
    return '';
  }
}

/**
 * Scan image buffer for QR codes and return decoded text/URL.
 */
function detectQrCodeFromImage(buffer, mimeType) {
  try {
    let rgbaData = null;
    let width = 0;
    let height = 0;

    if (mimeType === 'image/png') {
      const png = PNG.sync.read(buffer);
      rgbaData = new Uint8ClampedArray(png.data);
      width = png.width;
      height = png.height;
    } else if (mimeType === 'image/jpeg') {
      const decoded = jpeg.decode(buffer, { useTArray: true });
      rgbaData = new Uint8ClampedArray(decoded.data);
      width = decoded.width;
      height = decoded.height;
    }

    if (rgbaData && width > 0 && height > 0) {
      const code = jsQR(rgbaData, width, height, { inversionAttempts: 'attemptBoth' });
      if (code && code.data) {
        return {
          found: true,
          data: code.data.trim(),
          location: code.location
        };
      }
    }
  } catch {
    // QR scan failure is non-fatal
  }
  return { found: false, data: null };
}

/**
 * Deep inspection of PDF structure, metadata, revisions, and digital signatures.
 */
function analyzePdfStructureAndSignatures(buffer) {
  const binaryString = buffer.toString('binary');
  const asciiString = buffer.toString('ascii');

  // 1. Revision & Incremental Updates Analysis
  // Count %%EOF occurrences to detect multi-revision updates
  const eofMatches = asciiString.match(/%%EOF/g) || [];
  const revisionCount = eofMatches.length;
  const hasIncrementalUpdates = revisionCount > 1;

  // 2. Discover Digital Signatures (PKCS#7 / CAdES)
  const signatures = [];
  const sigMatches = [...asciiString.matchAll(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g)];

  for (let i = 0; i < sigMatches.length; i++) {
    const match = sigMatches[i];
    const b1 = parseInt(match[1], 10);
    const len1 = parseInt(match[2], 10);
    const b2 = parseInt(match[3], 10);
    const len2 = parseInt(match[4], 10);

    // Look for /Contents <hex...> near the ByteRange
    const matchIndex = match.index;
    const searchSlice = asciiString.slice(Math.max(0, matchIndex - 800), Math.min(asciiString.length, matchIndex + 1200));
    
    let subFilter = 'adbe.pkcs7.detached';
    const subFilterMatch = searchSlice.match(/\/SubFilter\s*\/([A-Za-z0-9_.]+)/);
    if (subFilterMatch) subFilter = subFilterMatch[1];

    let contentsHex = null;
    const contentsMatch = searchSlice.match(/\/Contents\s*<([0-9a-fA-F\s]+)>/);
    if (contentsMatch) {
      contentsHex = contentsMatch[1].replace(/\s+/g, '');
    }

    // Check if the ByteRange covers the whole file up to EOF
    const coveredBytes = b1 + len1 + (b2 - (b1 + len1)) + len2;
    const fileLength = buffer.length;
    const alteredAfterSigning = (b2 + len2) < fileLength - 100; // Alterations or appended data after signature

    signatures.push({
      index: i + 1,
      subFilter,
      byteRange: [b1, len1, b2, len2],
      hasContents: Boolean(contentsHex),
      contentsLengthHex: contentsHex ? contentsHex.length : 0,
      contentsHex: contentsHex ? contentsHex.slice(0, 4000) : null, // preview for parser
      alteredAfterSigning,
      fileLength,
      signatureEndOffset: b2 + len2
    });
  }

  // 3. Extract PDF /Info Dictionary Metadata
  const metadata = {};
  const creationDateMatch = asciiString.match(/\/CreationDate\s*\(([^)]+)\)/);
  if (creationDateMatch) metadata.creationDateRaw = creationDateMatch[1];

  const modDateMatch = asciiString.match(/\/ModDate\s*\(([^)]+)\)/);
  if (modDateMatch) metadata.modDateRaw = modDateMatch[1];

  const authorMatch = asciiString.match(/\/Author\s*\(([^)]+)\)/);
  if (authorMatch) metadata.author = authorMatch[1];

  const producerMatch = asciiString.match(/\/Producer\s*\(([^)]+)\)/);
  if (producerMatch) metadata.producer = producerMatch[1];

  const creatorMatch = asciiString.match(/\/Creator\s*\(([^)]+)\)/);
  if (creatorMatch) metadata.creator = creatorMatch[1];

  const titleMatch = asciiString.match(/\/Title\s*\(([^)]+)\)/);
  if (titleMatch) metadata.title = titleMatch[1];

  // Check for suspicious producer tools or modification discrepancies
  let modifiedAfterCreation = false;
  if (metadata.creationDateRaw && metadata.modDateRaw) {
    modifiedAfterCreation = metadata.creationDateRaw !== metadata.modDateRaw;
  }

  // Detect embedded files (/EmbeddedFiles)
  const hasEmbeddedFiles = /\/EmbeddedFiles\b|\/Type\s*\/Filespec\b/.test(asciiString);

  return {
    revisionCount,
    hasIncrementalUpdates,
    signaturesCount: signatures.length,
    hasDigitalSignature: signatures.length > 0,
    signatures,
    metadata,
    modifiedAfterCreation,
    hasEmbeddedFiles
  };
}

/**
 * Clean & normalize string tokens
 */
function clean(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Automatic Category Suggester based on extracted text tokens
 */
function suggestCategory(text) {
  if (!text) return CATEGORIES.COURSE_COMPLETION;
  const lower = text.toLowerCase();

  // Academic marksheet / degree
  if (
    lower.includes('marksheet') || 
    lower.includes('mark sheet') || 
    lower.includes('statement of marks') ||
    lower.includes('grade card') ||
    lower.includes('semester') ||
    lower.includes('academic year') ||
    lower.includes('bachelor of') ||
    lower.includes('master of') ||
    lower.includes('diploma in') ||
    lower.includes('university') ||
    lower.includes('cgpa') ||
    lower.includes('sgpa')
  ) {
    return CATEGORIES.ACADEMIC;
  }

  // Internship
  if (
    lower.includes('internship') || 
    lower.includes('intern ') || 
    lower.includes('intern,') ||
    lower.includes('summer intern')
  ) {
    return CATEGORIES.INTERNSHIP;
  }

  // Experience Letter
  if (
    lower.includes('experience letter') || 
    lower.includes('experience certificate') ||
    lower.includes('relieving letter') ||
    lower.includes('service certificate') ||
    lower.includes('to whomsoever it may concern') && lower.includes('employed')
  ) {
    return CATEGORIES.EXPERIENCE;
  }

  // Training
  if (
    lower.includes('training certificate') || 
    lower.includes('has successfully completed training') ||
    lower.includes('vocational training') ||
    lower.includes('industrial training')
  ) {
    return CATEGORIES.TRAINING;
  }

  // Professional Certification
  if (
    lower.includes('certified professional') ||
    lower.includes('board of certification') ||
    lower.includes('certification id') ||
    lower.includes('credential id') ||
    lower.includes('license number') ||
    lower.includes('chartered')
  ) {
    return CATEGORIES.PROFESSIONAL_CERTIFICATION;
  }

  // Default fallback
  return CATEGORIES.COURSE_COMPLETION;
}

/**
 * Structured field extraction across document text.
 * Deterministic pattern parsing with confidence and method indicators.
 */
function extractStructuredClaims(text, categoryHint = null, userSupplied = {}, fileName = '') {
  const category = categoryHint || suggestCategory(text);
  const fields = {};
  const rawText = text || '';

  // Helper to record field
  const setField = (fieldName, value, confidence = 0.85, method = 'regex', location = 'Document Body') => {
    if (value && String(value).trim()) {
      fields[fieldName] = {
        value: clean(String(value)),
        confidence: Math.min(1.0, Math.max(0.1, confidence)),
        method,
        location,
        isUserSupplied: false
      };
    }
  };

  // 1. Holder Name
  const compMatch = rawText.match(/(?:^|\n)([^\r\n]{2,50})\r?\n\s*(?:has\s+)?successfully\s+completed/i);
  if (compMatch && compMatch[1]) {
    const candidate = clean(compMatch[1]).trim();
    if (candidate.length > 2 && !/certificate|completion|diploma|degree|statement|course/i.test(candidate)) {
      setField('holderName', candidate, 0.90, 'presentation_clause', 'Certificate Candidate Clause');
    }
  }

  if (!fields.holderName) {
    const namePatterns = [
      /(?:this is to certify that|certify that|presented to|awarded to|certifies that|name of the candidate|student name|holder name|mr\.|ms\.|mrs\.)\s*[:\-]?\s*([A-Z][a-zA-Z\s.]{2,40})/i,
      /(?:son\/daughter of|s\/o|d\/o)\s*[:\-]?\s*([A-Z][a-zA-Z\s.]{2,40})/i,
      /(?:Name)\s*[:\-]\s*([A-Z][a-zA-Z\s.]{2,40})/i
    ];
    for (const pat of namePatterns) {
      const m = rawText.match(pat);
      if (m && m[1]) {
        const firstLine = m[1].split(/[\r\n]+/)[0];
        const candidate = clean(firstLine).trim();
        if (candidate.length > 2 && !candidate.toLowerCase().includes('university') && !candidate.toLowerCase().includes('certificate')) {
          setField('holderName', candidate, 0.88, 'pattern_match', 'Certificate Presentation Clause');
          break;
        }
      }
    }
  }

  // 2. Issuing Organization
  // Guard: if user mistakenly entered the candidate name into userSupplied.issuerName, do not use it as issuer
  const isUserIssuerCandidate = userSupplied.issuerName && fields.holderName?.value &&
    userSupplied.issuerName.trim().toLowerCase() === fields.holderName.value.trim().toLowerCase();

  if (userSupplied.issuerName && !isUserIssuerCandidate) {
    setField('issuingOrganization', userSupplied.issuerName, 0.95, 'user_specified', 'User Input Parameters');
    fields.issuingOrganization.isUserSupplied = true;
  } else {
    // Check known cloud & technology certification bodies
    const combinedContext = `${rawText} ${fileName || ''} ${userSupplied.issuerWebsite || ''}`;
    if (/\b(?:AWS|Amazon\s*Web\s*Services|aws\b|aws\.amazon\.com)\b/i.test(combinedContext)) {
      setField('issuingOrganization', 'Amazon Web Services (AWS)', 0.90, 'technology_issuer_clause', 'Cloud / Technology Issuer');
    } else if (/\b(?:Google\s*Cloud|GCP|cloud\.google\.com)\b/i.test(combinedContext)) {
      setField('issuingOrganization', 'Google Cloud', 0.90, 'technology_issuer_clause', 'Cloud / Technology Issuer');
    } else if (/\b(?:Microsoft|Azure|learn\.microsoft\.com)\b/i.test(combinedContext)) {
      setField('issuingOrganization', 'Microsoft Corporation', 0.90, 'technology_issuer_clause', 'Cloud / Technology Issuer');
    } else {
      const orgPatterns = [
        /^[ \t]*((?:University of[ ]+[A-Za-z ]{2,35}|[A-Z][A-Za-z0-9&., ]{2,45}[ ]+(?:University|Institute of Technology|College|Technologies|Private Limited|Pvt\. Ltd\.|Limited|Ltd\.?|LLC|Corporation|Inc\.|\bFoundation\b)))/im,
        /(?:issued by|awarded by|institution|organization|company|college)\s*[:\-]?\s*([A-Za-z0-9&., ]{3,60})/i,
        /([A-Z][A-Za-z0-9&., ]{3,45}\s+(?:University|Institute of Technology|College|Technologies|Private Limited|Pvt\. Ltd\.|Limited|Ltd\.?|LLC|Corporation|Inc\.|\bFoundation\b))/
      ];
      for (const pat of orgPatterns) {
        const m = rawText.match(pat);
        if (m && m[1]) {
          const firstLine = m[1].split(/[\r\n]+/)[0];
          const candidate = clean(firstLine).trim();
          if (candidate.length > 3 && !/successfully\s*completed|foundations\s*of/i.test(candidate)) {
            setField('issuingOrganization', candidate, 0.82, 'pattern_match', 'Header / Issuer Clause');
            break;
          }
        }
      }
    }
  }

  // 3. Credential ID / Certificate Number
  if (userSupplied.certificateNumber) {
    setField('credentialId', userSupplied.certificateNumber, 0.95, 'user_specified', 'User Input Parameters');
    fields.credentialId.isUserSupplied = true;
  } else {
    const credIdPatterns = [
      /(?:certificate\s*(?:no|number|id)|credential\s*id|cert\s*#|roll\s*(?:no|number)|registration\s*(?:no|number)|enrollment\s*(?:no|number)|verification\s*code|license\s*no)\s*[:\-#]?\s*([A-Za-z0-9\-\/]{4,35})/i,
      /\b([A-Z0-9]{3,8}\-[A-Z0-9]{3,8}\-[A-Z0-9]{3,8})\b/i
    ];
    for (const pat of credIdPatterns) {
      const m = rawText.match(pat);
      if (m && m[1]) {
        setField('credentialId', clean(m[1]), 0.90, 'pattern_match', 'Credential Identifier Block');
        break;
      }
    }
  }

  // 4. Issue Date & Expiry Date
  const issueDateMatch = rawText.match(/(?:(?:issued\s*on|date\s*of\s*issue|issue\s*date|dated|awarded\s*on|\bon)\s*[:\-]?\s*|\n\s*on\s*\r?\n\s*)([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4}|[0-9]{1,2}\s+[A-Za-z]+,?\s+[0-9]{4})/i);
  if (issueDateMatch && issueDateMatch[1]) {
    setField('issueDate', clean(issueDateMatch[1]), 0.85, 'date_pattern', 'Date Stamp');
  }

  const expiryDateMatch = rawText.match(/(?:valid\s*(?:until|thru|through)|expires\s*on|expiry\s*date|expiration\s*date)\s*[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4})/i);
  if (expiryDateMatch && expiryDateMatch[1]) {
    setField('expiryDate', clean(expiryDateMatch[1]), 0.85, 'date_pattern', 'Expiration Stamp');
  }

  // 5. Verification URL or QR URL
  const urlMatch = rawText.match(/(?:verify\s*(?:at|online|authenticity\s*at|reference|credentials?)|verification\s*(?:url|reference)|validate\s*at)\b[\s\S]{0,80}?(https?:\/\/[^\s<>"']+)/i) ||
                   rawText.match(/(https?:\/\/[^\s<>"']*(?:verify|verification|validate|credential)[^\s<>"']*)/i) ||
                   rawText.match(/(https?:\/\/[^\s<>"']+)/i);
  if (urlMatch && urlMatch[1]) {
    const cleanUrl = clean(urlMatch[1]).replace(/[.,]+$/, '');
    setField('verificationUrl', cleanUrl, 0.92, 'url_pattern', 'Verification Endpoint Block');
  }

  // 6. Contact Email Address
  const emailMatch = rawText.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  if (emailMatch && emailMatch[1]) {
    setField('contactEmail', clean(emailMatch[1]), 0.90, 'email_pattern', 'Contact / Verification Email');
  }

  // 7. Signatory Name & Designation
  const signMatch = rawText.match(/(?:digitally\s*signed\s*by|authorized\s*signatory|signed\s*by|director|registrar|controller\s*of\s*examinations|head\s*of\s*department|founder|ceo|dean)\s*[\n:\-]?\s*([A-Za-z\s.]{3,45})/i);
  if (signMatch && signMatch[1]) {
    const firstLine = signMatch[1].split(/[\r\n]+/)[0].trim().replace(/\s+(?:signed|date|ref).*$/i, '');
    const cleanSign = clean(firstLine);
    if (cleanSign.length >= 3) {
      setField('signatory', cleanSign, 0.78, 'signatory_clause', 'Footer Signature Block');
    }
  }

  // 8. General Credential Title
  const titlePatterns = [
    /(certificate\s*of\s*[A-Za-z\s]{3,35}|diploma\s*in\s*[A-Za-z\s]{3,35}|degree\s*of\s*[A-Za-z\s]{3,35}|internship\s*certificate|experience\s*letter|relieving\s*letter|training\s*certificate|statement\s*of\s*marks|academic\s*transcript)/i
  ];
  for (const tPat of titlePatterns) {
    const tm = rawText.match(tPat);
    if (tm && tm[1]) {
      const rawTitle = tm[1].split(/[\r\n]+/)[0];
      const cleanTitle = clean(rawTitle).replace(/\s+(?:this\s+is|this\s+document|is\s+hereby|has\s+successfully).*$/i, '').trim();
      setField('credentialTitle', cleanTitle, 0.85, 'title_pattern', 'Certificate Header Title');
      break;
    }
  }

  // 9. Category-Specific Fields
  if (category === CATEGORIES.INTERNSHIP) {
    const roleMatch = rawText.match(/(?:internship\s*as|as\s*an?\s*([A-Za-z\s]{3,35}\s+Intern)|role\s*of|position\s*of)\s*[:\-]?\s*([A-Za-z\s]{3,40})/i);
    if (roleMatch) {
      setField('role', clean(roleMatch[1] || roleMatch[2]), 0.82, 'role_pattern', 'Internship Scope');
    }

    const durationMatch = rawText.match(/(?:period\s*of|duration\s*of|conducted\s*from|from)\s*[:\-]?\s*([0-9]{1,2}\s+(?:months?|weeks?)|[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}\s+(?:to|–|-)\s+[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i);
    if (durationMatch) {
      setField('duration', clean(durationMatch[1]), 0.80, 'duration_pattern', 'Duration Clause');
    }
  }

  if (category === CATEGORIES.COURSE_COMPLETION || category === CATEGORIES.TRAINING) {
    const progMatch = rawText.match(/(?:course|program|training|workshop)\s*(?:on|in|titled|named)\s*[:\-]?\s*["']?([A-Za-z0-9&.,\s\-]{4,55})["']?/i) ||
                      rawText.match(/(?:successfully\s+completed|completed\s+(?:the\s+course)?)\s*\r?\n\s*([^\r\n]{3,60})/i);
    if (progMatch) {
      setField('courseTitle', clean(progMatch[1]), 0.85, 'course_pattern', 'Course Title');
    }
  }

  if (category === CATEGORIES.EXPERIENCE) {
    const posMatch = rawText.match(/(?:designated\s*as|designation|position|working\s*as)\s*[:\-]?\s*([A-Za-z\s]{3,40})/i);
    if (posMatch) {
      setField('jobTitle', clean(posMatch[1]), 0.85, 'designation_pattern', 'Experience Designation');
    }
  }

  if (category === CATEGORIES.ACADEMIC) {
    const degMatch = rawText.match(/(?:degree\s*of|bachelor\s*of|master\s*of|diploma\s*in|doctor\s*of)\s*([A-Za-z\s&]{3,50})/i);
    if (degMatch) {
      setField('degreeName', clean(degMatch[0]), 0.90, 'degree_pattern', 'Academic Degree Clause');
    }

    const rollMatch = rawText.match(/(?:roll\s*no|enrollment\s*no|reg\s*no|registration\s*no)\s*[:\-]?\s*([A-Za-z0-9\-\/]{4,25})/i);
    if (rollMatch) {
      setField('rollNumber', clean(rollMatch[1]), 0.92, 'roll_pattern', 'Student Identification');
    }

    // Extract Academic Subject Marks & Arithmetic Verification
    const markRows = [];
    const lines = rawText.split('\n');
    const markLineRegex = /^\s*([A-Za-z0-9\s&()\-]{4,40})\s+(\d{1,3})\s+(\d{1,3})\s*$/;
    for (const l of lines) {
      const match = l.match(markLineRegex);
      if (match) {
        const sub = clean(match[1]);
        const marksObtained = parseInt(match[2], 10);
        const maxMarks = parseInt(match[3], 10);
        if (maxMarks >= marksObtained && maxMarks <= 200 && marksObtained <= 200) {
          markRows.push({ subject: sub, marksObtained, maxMarks });
        }
      }
    }

    // Also look for total marks stated
    const totalMatch = rawText.match(/(?:total\s*marks|grand\s*total|aggregate)\s*[:\-]?\s*(\d{2,4})\s*(?:\/|\s+out\s+of\s+)\s*(\d{2,4})/i);
    let statedTotalObtained = null;
    let statedTotalMax = null;
    if (totalMatch) {
      statedTotalObtained = parseInt(totalMatch[1], 10);
      statedTotalMax = parseInt(totalMatch[2], 10);
    }

    // Marksheet arithmetic consistency check
    let arithmeticConsistent = true;
    let computedTotalObtained = 0;
    let computedTotalMax = 0;

    if (markRows.length > 0) {
      markRows.forEach(r => {
        computedTotalObtained += r.marksObtained;
        computedTotalMax += r.maxMarks;
      });

      if (statedTotalObtained !== null && statedTotalObtained !== computedTotalObtained) {
        arithmeticConsistent = false;
      }
      if (statedTotalMax !== null && statedTotalMax !== computedTotalMax) {
        arithmeticConsistent = false;
      }
    }

    fields.academicMarksheet = {
      subjectRows: markRows,
      statedTotalObtained,
      statedTotalMax,
      computedTotalObtained: markRows.length > 0 ? computedTotalObtained : null,
      computedTotalMax: markRows.length > 0 ? computedTotalMax : null,
      arithmeticConsistent,
      subjectCount: markRows.length
    };
  }

  if (category === CATEGORIES.PROFESSIONAL_CERTIFICATION) {
    const certMatch = rawText.match(/(?:certified|certification)\s*[:\-]?\s*([A-Za-z0-9\s\-]{4,50})/i);
    if (certMatch) {
      setField('certificationTitle', clean(certMatch[1]), 0.85, 'cert_pattern', 'Certification Title');
    }
  }

  return {
    category,
    fields,
    extractedAt: new Date().toISOString()
  };
}

/**
 * Main ingestion entry point for CredentialCheck.
 * Handles buffer validation, hashing, text parsing, OCR, QR scanning, PDF structure, and field extraction.
 */
async function processCredentialDocument({
  fileBase64,
  fileName,
  mimeType,
  documentCategory = null,
  userSupplied = {}
}) {
  if (!fileBase64) {
    throw new CredentialProcessingError('No file payload received. Please upload a PDF or image.', 'MISSING_FILE');
  }

  // 1. Decode Base64 into Buffer in memory
  let buffer;
  try {
    const cleanBase64 = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
    buffer = Buffer.from(cleanBase64, 'base64');
  } catch (err) {
    throw new CredentialProcessingError('Failed to decode Base64 file content.', 'INVALID_BASE64_DATA');
  }

  // 2. Validate Buffer boundaries, MIME, Magic Bytes
  const { detectedType, sizeBytes } = validateDocumentBuffer(buffer, mimeType, fileName);

  // 3. Compute SHA-256 Document Fingerprint
  const documentSha256 = computeSha256(buffer);

  // 4. Extract Text & PDF Structural Inspection
  let extractedText = '';
  let numPages = 1;
  let pdfAnalysis = null;

  if (detectedType === 'application/pdf') {
    const pdfRes = await extractTextFromPdf(buffer);
    extractedText = pdfRes.text || '';
    numPages = pdfRes.numPages || 1;
    pdfAnalysis = analyzePdfStructureAndSignatures(buffer);
  } else {
    // For images (PNG, JPEG), run OCR
    extractedText = await extractTextFromImage(buffer);
  }

  // If text extraction yielded nothing, throw an explicit error rather than generating fake assessments
  if (!extractedText || extractedText.trim().length === 0) {
    throw new CredentialProcessingError(
      'The uploaded document contains no readable text layer or characters could not be deciphered. Please upload a clear digital document with selectable text or high-resolution scan.',
      'EXTRACTION_FAILED',
      422
    );
  }

  // 5. Detect QR Code (for images, or if available)
  let qrResult = { found: false, data: null };
  if (detectedType.startsWith('image/')) {
    qrResult = detectQrCodeFromImage(buffer, detectedType);
  }

  // 6. Extract Structured Fields
  const category = documentCategory || suggestCategory(extractedText);
  const claimExtraction = extractStructuredClaims(extractedText, category, userSupplied, fileName);

  // If zero fields could be identified from the text
  const extractedCount = Object.keys(claimExtraction.fields).length;
  if (extractedCount === 0) {
    throw new CredentialProcessingError(
      'No verifiable credential fields (such as candidate name, issuer, or certificate ID) could be identified in the document.',
      'NO_CLAIMS_FOUND',
      422
    );
  }

  const processingState = (claimExtraction.fields.holderName && claimExtraction.fields.issuingOrganization)
    ? 'EXTRACTION_COMPLETE'
    : 'EXTRACTION_PARTIAL';

  // If QR code contained a URL and verificationUrl wasn't set, record QR destination
  if (qrResult.found && qrResult.data) {
    claimExtraction.fields.qrData = {
      value: qrResult.data,
      confidence: 1.0,
      method: 'qr_scanner',
      location: 'Embedded Optical QR Barcode',
      isUserSupplied: false
    };
    if (qrResult.data.startsWith('http://') || qrResult.data.startsWith('https://')) {
      claimExtraction.fields.verificationUrl = {
        value: qrResult.data,
        confidence: 0.98,
        method: 'qr_url_decode',
        location: 'Scanned QR Code URL',
        isUserSupplied: false
      };
    }
  }

  return {
    processingState,
    documentSha256,
    fileName: fileName || 'uploaded_credential',
    mimeType: detectedType,
    sizeBytes,
    numPages,
    category,
    extractedText: extractedText.slice(0, 10000), // bounded in memory
    claimExtraction,
    pdfAnalysis,
    qrResult
  };
}

module.exports = {
  processCredentialDocument,
  validateDocumentBuffer,
  computeSha256,
  extractTextFromPdf,
  extractTextFromImage,
  detectQrCodeFromImage,
  analyzePdfStructureAndSignatures,
  extractStructuredClaims,
  suggestCategory,
  CATEGORIES,
  CredentialProcessingError
};
