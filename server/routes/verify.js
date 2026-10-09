const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const Document = require('../models/Document');
const upload = require('../middleware/upload');

// ── Rate Limiter (Feature 3.7: 30 requests per minute per IP) ───────────────
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    valid: false,
    error: 'Too many verification requests from this IP address. Please try again in 1 minute.',
  },
});

router.use(verifyLimiter);

/**
 * @route   GET /api/verify/:documentId
 * @desc    Public document verification endpoint (Supports auto expiry check)
 * @access  Public
 */
router.get('/:documentId', async (req, res, next) => {
  try {
    const { documentId } = req.params;

    // Search by documentId (e.g. DOC-XXXXXXXXXX) or fallback to _id
    let document;
    if (documentId.startsWith('DOC-')) {
      document = await Document.findOne({ documentId }).populate(
        'verifiedBy',
        'name'
      );
    } else {
      document = await Document.findById(documentId).populate(
        'verifiedBy',
        'name'
      );
    }

    if (!document) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Document not found or invalid document ID',
      });
    }

    // Increment public verification counter
    await Document.updateOne({ _id: document._id }, { $inc: { verificationCount: 1 } });

    // Feature 3.6: Expiry Date Evaluation
    const now = new Date();
    const isExpired = document.expiryDate && now > new Date(document.expiryDate);

    // Document is valid ONLY if status is Verified AND it is not expired
    const isValid = document.verificationStatus === 'Verified' && !isExpired;

    res.status(200).json({
      success: true,
      valid: isValid,
      isExpired: !!isExpired,
      data: {
        documentId: document.documentId,
        documentName: document.documentName,
        documentType: document.documentType,
        holderName: document.holderName,
        issuedBy: document.issuedBy,
        issueDate: document.issueDate,
        expiryDate: document.expiryDate,
        isExpired: !!isExpired,
        verificationStatus: isExpired ? 'Expired' : document.verificationStatus,
        remarks: document.remarks || '',
        verifiedByName: document.verifiedBy ? document.verifiedBy.name : null,
        verificationCount: (document.verificationCount || 0) + 1,
        hasFileHash: !!document.fileHash,
        fileName: document.fileName,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/verify/:documentId/check-file
 * @desc    Check uploaded file integrity against cryptographic SHA-256 hash (Feature 3.5)
 * @access  Public
 */
router.post('/:documentId/check-file', upload.single('file'), async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file to check its integrity.',
      });
    }

    let document;
    if (documentId.startsWith('DOC-')) {
      document = await Document.findOne({ documentId });
    } else {
      document = await Document.findById(documentId);
    }

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document record not found',
      });
    }

    if (!document.fileHash) {
      return res.status(400).json({
        success: false,
        error: 'No cryptographic file hash was originally registered for this document.',
      });
    }

    // Calculate SHA-256 hash of the uploaded file
    const computedHash = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    const isMatch = computedHash.toLowerCase() === document.fileHash.toLowerCase();

    res.status(200).json({
      success: true,
      match: isMatch,
      fileName: req.file.originalname,
      registeredFileName: document.fileName,
      computedHash,
      storedHash: document.fileHash,
      message: isMatch
        ? 'File integrity verified! SHA-256 cryptographic signature matches the original document.'
        : 'Integrity check failed! The uploaded file does not match the registered document hash (potential tampering or wrong file).',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
