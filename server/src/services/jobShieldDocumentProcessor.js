const http = require('http');
const https = require('https');
const dns = require('dns').promises;
const net = require('net');
const { isPrivateOrInternalIP } = require('./intelligenceEngine');

const MAX_TEXT_BYTES = 100 * 1024; // 100 KB
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

class JobShieldProcessingError extends Error {
  constructor(message, code = 'PROCESSING_ERROR', statusCode = 400) {
    super(message);
    this.name = 'JobShieldProcessingError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Safely parse a PDF buffer into plain text.
 */
async function extractTextFromPdf(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new JobShieldProcessingError('PDF document buffer is empty.', 'EMPTY_DOCUMENT');
  }

  // Check PDF header signature: %PDF-
  if (buffer.length < 5 || buffer.toString('ascii', 0, 5) !== '%PDF-') {
    throw new JobShieldProcessingError('File is not a valid PDF document (missing %PDF- header).', 'INVALID_FILE_TYPE');
  }

  try {
    const pdf = require('pdf-parse');
    let text = '';
    
    // Support class-based export (v2+) or standard function export
    if (pdf.PDFParse) {
      const parser = new pdf.PDFParse({ data: buffer });
      await parser.load();
      text = await parser.getText();
      if (typeof parser.destroy === 'function') {
        parser.destroy();
      }
    } else if (typeof pdf === 'function') {
      const parsed = await pdf(buffer);
      text = parsed.text || '';
    } else {
      throw new Error('Unsupported pdf-parse export interface');
    }

    const cleanText = (text || '').trim();
    if (!cleanText || cleanText.length < 15) {
      throw new JobShieldProcessingError(
        'The submitted PDF contains no selectable text or is a scanned image. Please submit an OCR screenshot or paste the offer text.',
        'UNREADABLE_DOCUMENT'
      );
    }

    return cleanText;
  } catch (err) {
    if (err instanceof JobShieldProcessingError) throw err;
    if (err.name === 'PasswordException' || (err.message && err.message.toLowerCase().includes('password'))) {
      throw new JobShieldProcessingError('PDF is password-protected and cannot be analyzed.', 'PASSWORD_PROTECTED_PDF');
    }
    throw new JobShieldProcessingError(`Failed to extract text from PDF: ${err.message}`, 'PDF_EXTRACTION_FAILED');
  }
}

/**
 * Perform Optical Character Recognition (OCR) on an image buffer.
 */
async function extractTextFromImage(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new JobShieldProcessingError('Image buffer is empty.', 'EMPTY_DOCUMENT');
  }

  // Verify magic bytes: PNG (\x89PNG), JPEG (\xFF\xD8), WebP (RIFF....WEBP)
  const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isWebp = buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

  if (!isPng && !isJpeg && !isWebp) {
    throw new JobShieldProcessingError('File is not a supported image format. Please submit PNG, JPEG, or WebP.', 'INVALID_FILE_TYPE');
  }

  try {
    const Tesseract = require('tesseract.js');
    const result = await Tesseract.recognize(buffer, 'eng');
    const text = (result?.data?.text || '').trim();

    if (!text || text.length < 15) {
      throw new JobShieldProcessingError(
        'OCR was unable to extract legible text from this image. Ensure the screenshot is clear and in focus, or paste the text directly.',
        'UNREADABLE_DOCUMENT'
      );
    }

    return text;
  } catch (err) {
    if (err instanceof JobShieldProcessingError) throw err;
    throw new JobShieldProcessingError(`OCR extraction failed: ${err.message}`, 'OCR_FAILED');
  }
}

/**
 * Fetch and extract text from a job posting URL with SSRF protection.
 */
async function extractTextFromUrl(targetUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    throw new JobShieldProcessingError('Invalid job posting URL provided.', 'INVALID_URL');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new JobShieldProcessingError('Only HTTP and HTTPS URLs are supported.', 'INVALID_PROTOCOL');
  }

  const hostname = parsedUrl.hostname;
  if (!hostname || hostname.length === 0) {
    throw new JobShieldProcessingError('Hostname is missing from URL.', 'INVALID_URL');
  }

  // SSRF Protection: Resolve hostname and verify against private/internal subnets
  let resolvedIps = [];
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    resolvedIps = addresses.map(a => a.address);
  } catch (dnsErr) {
    throw new JobShieldProcessingError(`Domain '${hostname}' could not be resolved in DNS.`, 'DNS_RESOLUTION_FAILURE');
  }

  if (!resolvedIps || resolvedIps.length === 0) {
    throw new JobShieldProcessingError(`No IP addresses found for '${hostname}'.`, 'DNS_RESOLUTION_FAILURE');
  }

  for (const ip of resolvedIps) {
    if (isPrivateOrInternalIP(ip)) {
      throw new JobShieldProcessingError(
        `Target host resolves to a restricted or private network address (${ip}). Request blocked.`,
        'SSRF_BLOCKED',
        403
      );
    }
  }

  const pinnedIp = resolvedIps[0];
  const isHttps = parsedUrl.protocol === 'https:';
  const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (isHttps ? 443 : 80);

  // Strict port check: only standard 80 and 443 permitted
  if (port !== 80 && port !== 443) {
    throw new JobShieldProcessingError(`Port ${port} is restricted. Only standard ports (80/443) are permitted.`, 'RESTRICTED_PORT', 403);
  }

  return new Promise((resolve, reject) => {
    const client = isHttps ? https : http;
    const options = {
      hostname: pinnedIp,
      port: port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Host': hostname,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VerifyMe-JobShield/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5'
      },
      servername: hostname, // SNI for HTTPS
      timeout: 6000
    };

    const req = client.request(options, (res) => {
      // Handle redirects up to 1 hop (if needed)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl;
        try {
          redirectUrl = new URL(res.headers.location, targetUrl).toString();
        } catch {
          return reject(new JobShieldProcessingError('Invalid redirect location received from server.', 'FETCH_FAILED'));
        }
        res.resume();
        return extractTextFromUrl(redirectUrl).then(resolve).catch(reject);
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new JobShieldProcessingError(`Job posting URL responded with HTTP ${res.statusCode}.`, 'FETCH_FAILED'));
      }

      let data = '';
      let receivedBytes = 0;

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        receivedBytes += Buffer.byteLength(chunk, 'utf8');
        if (receivedBytes > 500 * 1024) { // 500 KB HTML max
          req.destroy();
          return reject(new JobShieldProcessingError('Job posting page exceeds maximum allowed size (500 KB).', 'PAGE_TOO_LARGE'));
        }
        data += chunk;
      });

      res.on('end', () => {
        // Simple, robust HTML-to-text extraction
        // 1. Extract title
        const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // 2. Extract meta description
        const metaMatch = data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
        const description = metaMatch ? metaMatch[1].trim() : '';

        // 3. Remove script, style, nav, footer tags
        let cleanHtml = data
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();

        const combinedText = `[SOURCE URL]: ${targetUrl}\n${title ? `[PAGE TITLE]: ${title}\n` : ''}${description ? `[DESCRIPTION]: ${description}\n` : ''}\n${cleanHtml}`;
        
        if (cleanHtml.length < 30) {
          return reject(new JobShieldProcessingError('Could not extract readable job description content from this page.', 'UNREADABLE_DOCUMENT'));
        }

        resolve(combinedText);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new JobShieldProcessingError('Timed out connecting to the job posting URL.', 'ETIMEDOUT'));
    });

    req.on('error', (err) => {
      reject(new JobShieldProcessingError(`Failed to reach job posting URL: ${err.message}`, 'FETCH_FAILED'));
    });

    req.end();
  });
}

/**
 * Unified Document and Input Processing Facade.
 *
 * @param {Object} input
 * @param {'text'|'pdf'|'image'|'url'} input.submissionType
 * @param {string} [input.rawText] - For pasted message/email
 * @param {string} [input.fileBase64] - Base64 encoded file data
 * @param {string} [input.fileName] - Original uploaded filename
 * @param {string} [input.url] - For job posting URL
 * @param {string} [input.claimedCompany] - Optional user override
 * @param {string} [input.claimedWebsite] - Optional user override
 */
async function processJobShieldInput({
  submissionType,
  rawText,
  fileBase64,
  fileName,
  url,
  claimedCompany,
  claimedWebsite
}) {
  if (!submissionType) {
    throw new JobShieldProcessingError('submissionType is required (text, pdf, image, or url).', 'MISSING_SUBMISSION_TYPE');
  }

  let extractedText = '';
  let metadata = {
    submissionType,
    processedAt: new Date().toISOString(),
    fileName: fileName || null,
    sourceUrl: null,
    claimedCompany: claimedCompany ? claimedCompany.trim() : null,
    claimedWebsite: claimedWebsite ? claimedWebsite.trim() : null
  };

  switch (submissionType) {
    case 'text': {
      if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        throw new JobShieldProcessingError('Please provide the recruitment email or message text.', 'EMPTY_INPUT');
      }
      const trimmed = rawText.trim();
      if (Buffer.byteLength(trimmed, 'utf8') > MAX_TEXT_BYTES) {
        throw new JobShieldProcessingError(`Pasted text exceeds maximum size limit of ${MAX_TEXT_BYTES / 1024} KB.`, 'PAYLOAD_TOO_LARGE');
      }
      if (trimmed.length < 20) {
        throw new JobShieldProcessingError('Submitted text is too brief to analyze. Please provide the complete message or offer letter.', 'INSUFFICIENT_TEXT');
      }
      extractedText = trimmed;
      break;
    }

    case 'pdf': {
      if (!fileBase64 || typeof fileBase64 !== 'string') {
        throw new JobShieldProcessingError('Please provide the PDF document data.', 'MISSING_FILE_DATA');
      }
      const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length > MAX_FILE_BYTES) {
        throw new JobShieldProcessingError(`Uploaded PDF exceeds maximum allowed size of ${MAX_FILE_BYTES / (1024 * 1024)} MB.`, 'FILE_TOO_LARGE');
      }
      extractedText = await extractTextFromPdf(buffer);
      break;
    }

    case 'image': {
      if (!fileBase64 || typeof fileBase64 !== 'string') {
        throw new JobShieldProcessingError('Please provide the screenshot image data.', 'MISSING_FILE_DATA');
      }
      const cleanBase64 = fileBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length > MAX_FILE_BYTES) {
        throw new JobShieldProcessingError(`Uploaded image exceeds maximum allowed size of ${MAX_FILE_BYTES / (1024 * 1024)} MB.`, 'FILE_TOO_LARGE');
      }
      extractedText = await extractTextFromImage(buffer);
      break;
    }

    case 'url': {
      if (!url || typeof url !== 'string' || !url.trim()) {
        throw new JobShieldProcessingError('Please provide the job posting URL.', 'EMPTY_URL');
      }
      const trimmedUrl = url.trim();
      extractedText = await extractTextFromUrl(trimmedUrl);
      metadata.sourceUrl = trimmedUrl;
      break;
    }

    default:
      throw new JobShieldProcessingError(`Unsupported submissionType: '${submissionType}'. Must be text, pdf, image, or url.`, 'INVALID_SUBMISSION_TYPE');
  }

  metadata.charCount = extractedText.length;
  metadata.wordCount = extractedText.split(/\s+/).filter(Boolean).length;

  return {
    success: true,
    text: extractedText,
    metadata
  };
}

module.exports = {
  processJobShieldInput,
  extractTextFromPdf,
  extractTextFromImage,
  extractTextFromUrl,
  JobShieldProcessingError,
  MAX_FILE_BYTES,
  MAX_TEXT_BYTES
};
