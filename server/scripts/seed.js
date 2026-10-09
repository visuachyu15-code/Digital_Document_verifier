/**
 * seed.js — Database seeder script
 *
 * Clears existing collections and creates:
 *  - 1 Admin user
 *  - 1 Verifier user
 *  - 1 Regular user
 *  - 4 Sample documents with statuses: Verified, Pending, Rejected, Revoked
 *
 * Run with: npm run seed
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');
const Document = require('../models/Document');

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/document-verifier';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected.');

    // ── 1. Clear existing collections ─────────────────────────────────────
    console.log('Clearing old data...');
    await User.deleteMany({});
    await Document.deleteMany({});
    console.log('Collections cleared.');

    // ── 2. Create demo users ──────────────────────────────────────────────
    console.log('Creating demo users...');

    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@demo.com',
      password: 'password123',
      role: 'admin',
    });

    const verifier = await User.create({
      name: 'Dr. Sarah Verifier',
      email: 'verifier@demo.com',
      password: 'password123',
      role: 'verifier',
    });

    const user = await User.create({
      name: 'John Citizen',
      email: 'user@demo.com',
      password: 'password123',
      role: 'user',
    });

    console.log('Users created.');

    // ── 3. Create 4 sample documents with 4 different statuses ────────────
    console.log('Creating sample documents...');

    // Document 1: VERIFIED
    const docVerified = await Document.create({
      documentName: 'Bachelor of Computer Science Degree',
      documentType: 'Certificate',
      holderName: 'John Citizen',
      holderEmail: 'user@demo.com',
      issuedBy: 'State Technical University',
      issueDate: new Date('2024-06-15'),
      verificationStatus: 'Verified',
      remarks: 'Original registry verified with university registrar office.',
      verifiedBy: verifier._id,
      createdBy: user._id,
    });

    // Document 2: PENDING
    const docPending = await Document.create({
      documentName: 'Senior Secondary School Marksheet',
      documentType: 'Marksheet',
      holderName: 'John Citizen',
      holderEmail: 'user@demo.com',
      issuedBy: 'Central Board of Education',
      issueDate: new Date('2022-05-20'),
      verificationStatus: 'Pending',
      remarks: 'Awaiting review by certified verifier.',
      createdBy: user._id,
    });

    // Document 3: REJECTED
    const docRejected = await Document.create({
      documentName: 'National ID Proof Document',
      documentType: 'ID Proof',
      holderName: 'John Citizen',
      holderEmail: 'user@demo.com',
      issuedBy: 'National Identity Department',
      issueDate: new Date('2023-01-10'),
      verificationStatus: 'Rejected',
      remarks: 'Submitted copy is illegible and missing official stamp.',
      verifiedBy: verifier._id,
      createdBy: user._id,
    });

    // Document 4: REVOKED
    const docRevoked = await Document.create({
      documentName: 'Certified Cloud Architect Credential',
      documentType: 'Certificate',
      holderName: 'John Citizen',
      holderEmail: 'user@demo.com',
      issuedBy: 'Cloud Computing Institute',
      issueDate: new Date('2023-09-01'),
      verificationStatus: 'Revoked',
      remarks: 'Certification revoked due to expiration of prerequisite license.',
      verifiedBy: admin._id,
      createdBy: user._id,
    });

    console.log('\n======================================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');

    console.log('\n🔑 DEMO LOGIN CREDENTIALS:');
    console.table([
      { Role: 'Admin', Email: 'admin@demo.com', Password: 'password123' },
      { Role: 'Verifier', Email: 'verifier@demo.com', Password: 'password123' },
      { Role: 'User', Email: 'user@demo.com', Password: 'password123' },
    ]);

    console.log('\n📄 SAMPLE DOCUMENTS:');
    console.table([
      {
        Status: 'Verified (Valid: YES)',
        ID: docVerified.documentId,
        Document: docVerified.documentName,
      },
      {
        Status: 'Pending (Valid: NO)',
        ID: docPending.documentId,
        Document: docPending.documentName,
      },
      {
        Status: 'Rejected (Valid: NO)',
        ID: docRejected.documentId,
        Document: docRejected.documentName,
      },
      {
        Status: 'Revoked (Valid: NO)',
        ID: docRevoked.documentId,
        Document: docRevoked.documentName,
      },
    ]);

    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during database seed:', err);
    process.exit(1);
  }
};

seedDatabase();
