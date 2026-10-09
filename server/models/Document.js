const mongoose = require('mongoose');
const crypto = require('crypto');

const documentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      unique: true,
      index: true,
    },
    documentName: {
      type: String,
      required: [true, 'Please provide the document name'],
      trim: true,
    },
    documentType: {
      type: String,
      required: [true, 'Please provide the document type (e.g., Certificate, Marksheet, ID Proof)'],
      trim: true,
    },
    holderName: {
      type: String,
      required: [true, 'Please provide the holder name'],
      trim: true,
    },
    holderEmail: {
      type: String,
      required: [true, 'Please provide the holder email'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    issuedBy: {
      type: String,
      required: [true, 'Please provide the issuing organization'],
      trim: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Please provide the issue date'],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileHash: {
      type: String,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected', 'Revoked'],
      default: 'Pending',
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
    auditTrail: [
      {
        action: {
          type: String,
          required: true,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        performedByName: {
          type: String,
          default: 'System',
        },
        details: {
          type: String,
          default: '',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate unique documentId if not provided (e.g. DOC-7F3A9C2B1D)
documentSchema.pre('save', function () {
  if (!this.documentId) {
    const randomHex = crypto.randomBytes(5).toString('hex').toUpperCase();
    this.documentId = `DOC-${randomHex}`;
  }
});

module.exports = mongoose.model('Document', documentSchema);
