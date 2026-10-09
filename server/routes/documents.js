const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const qrcode = require('qrcode');
const Document = require('../models/Document');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @route   GET /api/documents/stats
 * @desc    Get document counts per status
 * @access  Private (all authenticated roles)
 */
router.get('/stats', protect, async (req, res, next) => {
  try {
    const filter = {};
    // Regular users only see stats for their own documents
    if (req.user.role === 'user') {
      filter.createdBy = req.user._id;
    }

    const [total, pending, verified, rejected, revoked] = await Promise.all([
      Document.countDocuments(filter),
      Document.countDocuments({ ...filter, verificationStatus: 'Pending' }),
      Document.countDocuments({ ...filter, verificationStatus: 'Verified' }),
      Document.countDocuments({ ...filter, verificationStatus: 'Rejected' }),
      Document.countDocuments({ ...filter, verificationStatus: 'Revoked' }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        verified,
        rejected,
        revoked,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/documents/charts
 * @desc    Get chart aggregation data by status and by type
 * @access  Private (all authenticated roles)
 */
router.get('/charts', protect, async (req, res, next) => {
  try {
    const match = {};
    if (req.user.role === 'user') {
      match.createdBy = req.user._id;
    }

    // Status aggregation
    const statusData = await Document.aggregate([
      { $match: match },
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
    ]);

    // Type aggregation
    const typeData = await Document.aggregate([
      { $match: match },
      { $group: { _id: '$documentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const statusColors = {
      Verified: '#059669',
      Pending: '#d97706',
      Rejected: '#dc2626',
      Revoked: '#4b5563',
    };

    const formattedStatus = statusData.map((item) => ({
      name: item._id,
      value: item.count,
      color: statusColors[item._id] || '#0f3d75',
    }));

    const formattedType = typeData.map((item) => ({
      type: item._id || 'Other',
      count: item.count,
    }));

    res.status(200).json({
      success: true,
      statusChart: formattedStatus,
      typeChart: formattedType,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/documents
 * @desc    Create a new document (supports optional file upload with SHA-256 hashing)
 * @access  Private (all authenticated roles)
 */
router.post('/', protect, upload.single('file'), async (req, res, next) => {
  try {
    const {
      documentName,
      documentType,
      holderName,
      holderEmail,
      issuedBy,
      issueDate,
      expiryDate,
      verificationStatus,
      remarks,
    } = req.body;

    let fileName = null;
    let fileHash = null;

    if (req.file) {
      fileName = req.file.originalname;
      fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    }

    // Admins and Verifiers can set initial status (e.g. Verified) directly upon creation
    const initialStatus =
      (req.user.role === 'admin' || req.user.role === 'verifier') && verificationStatus
        ? verificationStatus
        : 'Pending';

    const document = await Document.create({
      documentName,
      documentType,
      holderName,
      holderEmail,
      issuedBy,
      issueDate: issueDate || Date.now(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      fileName,
      fileHash,
      createdBy: req.user._id,
      verificationStatus: initialStatus,
      verifiedBy: initialStatus !== 'Pending' ? req.user._id : null,
      remarks: remarks || '',
      auditTrail: [
        {
          action: 'CREATED',
          performedBy: req.user._id,
          performedByName: req.user.name,
          details: fileHash
            ? `Document registered with status ${initialStatus} and file "${fileName}" (SHA-256: ${fileHash.substring(0, 12)}...)`
            : `Document registered with status ${initialStatus}`,
          timestamp: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/documents
 * @desc    Get list of documents with search and filters
 * @access  Private (all roles: admin/verifier see all; user sees only own)
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, status, type } = req.query;
    let query = {};

    // Role-based scoping: normal users only see their own documents
    if (req.user.role === 'user') {
      query.createdBy = req.user._id;
    }

    // Filter by verification status
    if (status && status !== 'All') {
      query.verificationStatus = status;
    }

    // Filter by document type
    if (type && type !== 'All') {
      query.documentType = type;
    }

    // Search query across ID, documentName, holderName, issuedBy
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { documentId: regex },
        { documentName: regex },
        { holderName: regex },
        { issuedBy: regex },
      ];
    }

    const documents = await Document.find(query)
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/documents/:id/qr
 * @desc    Get QR code for document verification URL as PNG Data URL
 * @access  Private (Admin & verifier see all; user sees only own)
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Support lookup by MongoDB _id or custom documentId (e.g. DOC-XXXXX)
    let document;
    if (id.startsWith('DOC-')) {
      document = await Document.findOne({ documentId: id })
        .populate('createdBy', 'name email role')
        .populate('verifiedBy', 'name email role');
    } else {
      document = await Document.findById(id)
        .populate('createdBy', 'name email role')
        .populate('verifiedBy', 'name email role');
    }

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    // Role check: User cannot view other people's documents
    if (
      req.user.role === 'user' &&
      document.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this document',
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/documents/:id/qr
 * @desc    Get QR code PNG data URL for document verification
 * @access  Private (Admin & Verifier see all; user sees own)
 */
router.get('/:id/qr', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    let document;
    if (id.startsWith('DOC-')) {
      document = await Document.findOne({ documentId: id });
    } else {
      document = await Document.findById(id);
    }

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    // Role check: user can only get QR for own document
    if (
      req.user.role === 'user' &&
      document.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access QR for this document',
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify/${document.documentId}`;

    // Generate PNG Data URL
    const qrDataUrl = await qrcode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#1e3a8a', // Deep blue brand color
        light: '#ffffff',
      },
    });

    res.status(200).json({
      success: true,
      documentId: document.documentId,
      verifyUrl,
      qrCode: qrDataUrl,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/documents/:id
 * @desc    Update a document
 * @access  Private (admin can edit any; user can edit own only if Pending)
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    // Role checks
    if (req.user.role === 'user') {
      if (document.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to edit this document',
        });
      }

      if (document.verificationStatus !== 'Pending') {
        return res.status(400).json({
          success: false,
          error: 'Cannot edit document after it has been reviewed (status is no longer Pending)',
        });
      }
    } else if (req.user.role === 'verifier') {
      // Verifiers should use PATCH /:id/status to review
      return res.status(403).json({
        success: false,
        error: 'Verifiers can only change document verification status',
      });
    }

    const {
      documentName,
      documentType,
      holderName,
      holderEmail,
      issuedBy,
      issueDate,
    } = req.body;

    if (documentName) document.documentName = documentName;
    if (documentType) document.documentType = documentType;
    if (holderName) document.holderName = holderName;
    if (holderEmail) document.holderEmail = holderEmail;
    if (issuedBy) document.issuedBy = issuedBy;
    if (issueDate) document.issueDate = issueDate;

    document.auditTrail.push({
      action: 'UPDATED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: 'Document metadata updated',
      timestamp: new Date(),
    });

    await document.save();

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a document
 * @access  Private (admin can delete any; verifier cannot delete; user can delete own only if Pending)
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    // Rule: Verifiers cannot delete documents
    if (req.user.role === 'verifier') {
      return res.status(403).json({
        success: false,
        error: 'Verifiers are not allowed to delete documents',
      });
    }

    // Rule: User can only delete own document while still Pending
    if (req.user.role === 'user') {
      if (document.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this document',
        });
      }

      if (document.verificationStatus !== 'Pending') {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete document after it has been reviewed (status is no longer Pending)',
        });
      }
    }

    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/documents/:id/status
 * @desc    Update document verification status & remarks
 * @access  Private (Admin & Verifier only)
 */
router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'verifier'),
  async (req, res, next) => {
    try {
      const { status, remarks } = req.body;

      const validStatuses = ['Pending', 'Verified', 'Rejected', 'Revoked'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }

      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }

      const oldStatus = document.verificationStatus;
      document.verificationStatus = status;
      if (remarks !== undefined) {
        document.remarks = remarks;
      }
      document.verifiedBy = req.user._id;

      document.auditTrail.push({
        action: 'STATUS_CHANGED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        details: `Status changed from ${oldStatus} to ${status}${remarks ? ' ("' + remarks + '")' : ''}`,
        timestamp: new Date(),
      });

      await document.save();

      const populatedDoc = await Document.findById(document._id)
        .populate('createdBy', 'name email role')
        .populate('verifiedBy', 'name email role');

      res.status(200).json({
        success: true,
        data: populatedDoc,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
