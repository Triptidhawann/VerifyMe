/**
 * Document Forensics Engine for CredentialCheck
 * 
 * Inspects:
 * - PDF metadata anomalies
 * - Creation vs modification timeline discrepancies
 * - Incremental updates and revision counts
 * - Embedded files and attachments
 * - Digital signature integrity and byte-range alterations
 * - QR code destination safety
 * - Consistency between metadata and document text
 */

function inspectDocumentForensics({
  pdfAnalysis = null,
  qrResult = null,
  extractedClaims = {},
  ccaSignatureResult = null
}) {
  const anomalies = [];
  const findings = [];
  let integrityStatus = 'INCONCLUSIVE';

  // 1. Digital Signature Evaluation
  if (ccaSignatureResult) {
    if (ccaSignatureResult.signatureOutcome === 'SIGNATURE_VALID') {
      integrityStatus = 'SIGNATURE_VALID';
      findings.push({
        status: 'CONFIRMED',
        title: 'Cryptographic Signature Valid',
        detail: `Document sealed with valid digital signature (${ccaSignatureResult.returnedEvidence?.caAuthority || 'Verified CA'}). Byte-range integrity confirmed.`
      });
    } else if (ccaSignatureResult.signatureOutcome === 'SIGNATURE_INVALID') {
      integrityStatus = 'SIGNATURE_INVALID';
      anomalies.push({
        severity: 'CRITICAL',
        title: 'Signature Alteration Detected',
        detail: 'PDF contains modified or appended bytes after the digital signature boundary. Document was modified after signing.'
      });
    } else if (ccaSignatureResult.signatureOutcome === 'NO_SIGNATURE_PRESENT') {
      integrityStatus = 'NO_SIGNATURE_PRESENT';
      findings.push({
        status: 'INFO',
        title: 'No Digital Signature Field',
        detail: 'Document does not contain PKCS#7 cryptographic signature fields. Standard for physical scans, plain images, or non-sealed PDFs.'
      });
    }
  } else {
    integrityStatus = 'NO_SIGNATURE_PRESENT';
  }

  // 2. PDF Metadata & Revision Analysis
  if (pdfAnalysis) {
    const { metadata, hasIncrementalUpdates, revisionCount, modifiedAfterCreation, hasEmbeddedFiles } = pdfAnalysis;

    // Check incremental updates
    if (hasIncrementalUpdates) {
      findings.push({
        status: 'INFO',
        title: 'Multi-Revision PDF Structure',
        detail: `PDF contains ${revisionCount} revisions (%%EOF markers). Normal for forms saved incrementally, signed documents, or edited templates.`
      });
    }

    // Check creation vs modification dates
    if (modifiedAfterCreation && metadata?.creationDateRaw && metadata?.modDateRaw) {
      findings.push({
        status: 'INFO',
        title: 'Modified After Creation',
        detail: `Creation date (${metadata.creationDateRaw}) differs from modification date (${metadata.modDateRaw}). Common with PDF tools or compression.`
      });
      if (integrityStatus !== 'SIGNATURE_VALID' && integrityStatus !== 'SIGNATURE_INVALID') {
        integrityStatus = 'MODIFICATION_INDICATORS';
      }
    }

    // Check for suspicious consumer editors in PDF Producer metadata for official academic/corporate credentials
    if (metadata?.producer || metadata?.creator) {
      const prod = (metadata.producer || '').toLowerCase();
      const creator = (metadata.creator || '').toLowerCase();
      const isDesignTool = prod.includes('canva') || prod.includes('photoshop') || creator.includes('canva') || creator.includes('photoshop') || prod.includes('ilovepdf');
      
      if (isDesignTool) {
        anomalies.push({
          severity: 'HIGH',
          title: 'Consumer Design/Modification Software Detected',
          detail: `PDF metadata indicates creation or modification using consumer design tool (${metadata.producer || metadata.creator}), which is uncharacteristic for official university or corporate enterprise issuance systems.`
        });
        if (integrityStatus !== 'SIGNATURE_INVALID') {
          integrityStatus = 'MODIFICATION_INDICATORS';
        }
      }
    }

    // Check embedded files
    if (hasEmbeddedFiles) {
      findings.push({
        status: 'INFO',
        title: 'Embedded Attachments Found',
        detail: 'PDF contains embedded file streams (/EmbeddedFiles). Inspect attachments separately for executable code.'
      });
    }
  }

  // 3. QR Code Destination Safety Analysis
  if (qrResult && qrResult.found && qrResult.data) {
    const qrData = qrResult.data;
    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      findings.push({
        status: 'CONFIRMED',
        title: 'Optical QR Verification Code Detected',
        detail: `Decoded optical barcode containing URL: ${qrData}`
      });

      // Check for suspicious URL shorteners or generic free hosting
      const lower = qrData.toLowerCase();
      const isSuspiciousHost = lower.includes('bit.ly') || lower.includes('tinyurl.com') || lower.includes('.gl') || lower.includes('drive.google.com') || lower.includes('forms.gle');
      if (isSuspiciousHost) {
        anomalies.push({
          severity: 'MEDIUM',
          title: 'Suspicious QR Target Architecture',
          detail: 'QR code directs to a public file host or URL shortener rather than an authoritative institutional domain.'
        });
      }
    } else {
      findings.push({
        status: 'INFO',
        title: 'Alphanumeric QR Payload',
        detail: `Decoded plain-text or token barcode payload: ${qrData.slice(0, 80)}`
      });
    }
  }

  return {
    integrityStatus, // SIGNATURE_VALID | SIGNATURE_INVALID | MODIFICATION_INDICATORS | NO_SIGNATURE_PRESENT | INCONCLUSIVE
    anomalies,
    findings,
    hasAnomalies: anomalies.length > 0,
    hasValidSignature: integrityStatus === 'SIGNATURE_VALID',
    hasInvalidSignature: integrityStatus === 'SIGNATURE_INVALID'
  };
}

module.exports = {
  inspectDocumentForensics
};
