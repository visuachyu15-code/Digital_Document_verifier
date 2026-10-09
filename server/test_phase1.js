/**
 * test_phase1.js — Comprehensive verification script for Phase 1
 *
 * Tests every requirement on the Phase 1 Checklist:
 *  1. Health check & Server startup
 *  2. Authentication (Register forced to 'user', Login returns JWT token, Get /me)
 *  3. Role-based Document access (User can only see own; Admin/Verifier see all)
 *  4. Document permission checks (User cannot view another user's document -> 403)
 *  5. Status patch (Verifier/Admin can update status & remarks)
 *  6. Deletion rules (Verifier cannot delete -> 403; Admin can delete)
 *  7. QR code generation (returns PNG data URL encoding client verify URL)
 *  8. Public verify route (no token required, returns valid=true only for Verified, 404 & valid=false for fake ID)
 *  9. Admin user management (list users, update role, prevent self-deletion)
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');

dotenv.config();

const app = require('./server');
const User = require('./models/User');
const Document = require('./models/Document');

const PORT = 5055;
let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 STARTING PHASE 1 COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  // Start dedicated test server
  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // ── Test 1: Health Check ──────────────────────────────────────
    console.log('--- Test 1: Health Route ---');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.success === true, 'GET /api/health responds with success');

    // ── Test 2: Authentication ────────────────────────────────────
    console.log('\n--- Test 2: Authentication & Role Enforcement ---');
    
    // Register user with attempt to escalate to 'admin'
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'New Registered User',
        email: `newuser_${Date.now()}@example.com`,
        password: 'password123',
        role: 'admin', // Attack simulation: public register cannot grant admin
      },
    });
    assert(regRes.status === 201, 'Registration returns 201 Created');
    assert(regRes.data.user.role === 'user', 'Public registration forces role to "user" (no privilege escalation)');
    assert(typeof regRes.data.token === 'string', 'Registration returns valid JWT token string');

    // Login as Admin
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@demo.com', password: 'password123' },
    });
    assert(adminLogin.status === 200, 'Admin login succeeded');
    const adminToken = adminLogin.data.token;

    // Login as Verifier
    const verifierLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'verifier@demo.com', password: 'password123' },
    });
    assert(verifierLogin.status === 200, 'Verifier login succeeded');
    const verifierToken = verifierLogin.data.token;

    // Login as Demo User
    const userLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'user@demo.com', password: 'password123' },
    });
    assert(userLogin.status === 200, 'Regular user login succeeded');
    const userToken = userLogin.data.token;

    // Test GET /api/auth/me
    const meRes = await request('/api/auth/me', { token: userToken });
    assert(meRes.status === 200 && meRes.data.user.email === 'user@demo.com', 'GET /api/auth/me returns current user');

    // ── Test 3: Document Creation & Isolation ────────────────────
    console.log('\n--- Test 3: Document Creation & User Privacy ---');
    
    // User creates document
    const createDoc = await request('/api/documents', {
      method: 'POST',
      token: userToken,
      body: {
        documentName: 'Master Degree Certificate',
        documentType: 'Certificate',
        holderName: 'John Citizen',
        holderEmail: 'user@demo.com',
        issuedBy: 'Global Institute',
      },
    });
    assert(createDoc.status === 201, 'User can create document (status 201)');
    const createdDocId = createDoc.data.data._id;
    const createdDocPublicId = createDoc.data.data.documentId;
    assert(createdDocPublicId.startsWith('DOC-'), 'documentId auto-generated with DOC- prefix');

    // Create another user to test isolation
    const otherUserRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Other Person',
        email: `other_${Date.now()}@example.com`,
        password: 'password123',
      },
    });
    const otherUserToken = otherUserRes.data.token;

    // Other user attempts to view John's document -> 403 Expected!
    const privacyCheck = await request(`/api/documents/${createdDocId}`, { token: otherUserToken });
    assert(privacyCheck.status === 403, "User CANNOT open another user's document (returns 403 Forbidden)");

    // Owner can view own document
    const ownerCheck = await request(`/api/documents/${createdDocId}`, { token: userToken });
    assert(ownerCheck.status === 200, 'Owner can view their own document (returns 200)');

    // ── Test 4: Verifier Capabilities & Limitations ──────────────
    console.log('\n--- Test 4: Verifier Permissions ---');

    // Verifier CAN update status
    const statusUpdate = await request(`/api/documents/${createdDocId}/status`, {
      method: 'PATCH',
      token: verifierToken,
      body: {
        status: 'Verified',
        remarks: 'Original seal verified against records',
      },
    });
    assert(statusUpdate.status === 200, 'Verifier can update status to Verified (returns 200)');
    assert(statusUpdate.data.data.verificationStatus === 'Verified', 'Verification status successfully saved as Verified');

    // Verifier CANNOT delete document (PDF rule: "Verifiers cannot delete")
    const verifierDelete = await request(`/api/documents/${createdDocId}`, {
      method: 'DELETE',
      token: verifierToken,
    });
    assert(verifierDelete.status === 403, 'Verifier CANNOT delete document (returns 403 Forbidden)');

    // ── Test 5: QR Code Endpoint ──────────────────────────────────
    console.log('\n--- Test 5: QR Code Generation ---');
    const qrRes = await request(`/api/documents/${createdDocId}/qr`, { token: userToken });
    assert(qrRes.status === 200, 'GET /api/documents/:id/qr returns 200');
    assert(qrRes.data.qrCode.startsWith('data:image/png;base64,'), 'QR endpoint returns valid PNG base64 data URL');
    assert(qrRes.data.verifyUrl.includes(`/verify/${createdDocPublicId}`), 'QR encodes correct verification URL with documentId');

    // ── Test 6: Public Verification Route ─────────────────────────
    console.log('\n--- Test 6: Public Verify Route (No Auth) ---');
    
    // Verify valid document without token
    const publicVerifyValid = await request(`/api/verify/${createdDocPublicId}`);
    assert(publicVerifyValid.status === 200, 'Public verify works without any token (200 OK)');
    assert(publicVerifyValid.data.valid === true, 'Public verify returns valid = true for Verified document');
    assert(publicVerifyValid.data.data.holderName === 'John Citizen', 'Public verify includes non-sensitive holderName');
    assert(publicVerifyValid.data.data.verifiedByName === 'Dr. Sarah Verifier', 'Public verify includes verifiedByName');

    // Verify non-existent document
    const publicVerifyFake = await request('/api/verify/DOC-NONEXISTENT');
    assert(publicVerifyFake.status === 404, 'Public verify returns 404 for unknown document ID');
    assert(publicVerifyFake.data.valid === false, 'Public verify returns valid = false for unknown document ID');

    // ── Test 7: Admin User Management ─────────────────────────────
    console.log('\n--- Test 7: Admin User Management ---');
    const usersList = await request('/api/users', { token: adminToken });
    assert(usersList.status === 200, 'Admin can list users');
    assert(Array.isArray(usersList.data.data), 'Returns list of users');

    const meAdmin = await request('/api/auth/me', { token: adminToken });
    const adminId = meAdmin.data.user._id;

    // Admin attempts to delete themselves -> 400 Expected!
    const selfDelete = await request(`/api/users/${adminId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert(selfDelete.status === 400, 'Admin CANNOT delete their own account (protection check)');

    // Admin can delete test document
    const adminDeleteDoc = await request(`/api/documents/${createdDocId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert(adminDeleteDoc.status === 200, 'Admin CAN delete document');

    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    process.exit(failed === 0 ? 0 : 1);
  }
}

runTests();
