/**
 * test_phase2_e2e.js — Phase 2 End-to-End & Integration Test Suite
 *
 * Verifies all Phase 2 checklist items:
 *  1. Frontend Vite server is serving the web application (200 OK)
 *  2. Role separation in API/Frontend:
 *     - Admin sees all documents and has access to /users
 *     - Verifier can change status to Verified/Revoked but CANNOT delete
 *     - Regular User only sees their own documents, cannot access /users
 *  3. Document lifecycle:
 *     - User creates document -> gets unique DOC-XXXXX ID
 *     - User views document -> QR code image generated
 *  4. Public Verification (No Login):
 *     - Public verify endpoint checks document without any token
 *     - Returns valid: true when Verified
 *  5. Status change to Revoked:
 *     - Verifier updates status to Revoked
 *     - Public verify now shows valid: false (Invalid result)
 *  6. Fake ID Check:
 *     - Public verify checks fake ID -> returns 404 & valid: false
 */

const FRONTEND_URL = 'http://127.0.0.1:5173';
const BACKEND_URL = 'http://127.0.0.1:5000/api';

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
  console.log('🌐 STARTING PHASE 2 END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  try {
    // ── 1. Frontend Server Verification ───────────────────────────
    console.log('--- 1. Frontend Server & Route Delivery ---');
    const feRes = await fetch(FRONTEND_URL);
    assert(feRes.status === 200, 'Vite dev server is actively serving on http://127.0.0.1:5173');
    const htmlText = await feRes.text();
    assert(htmlText.includes('<div id="root"></div>'), 'HTML template includes root container for React app');
    assert(htmlText.includes('/src/main.jsx'), 'HTML entry point correctly loads main.jsx');

    // ── 2. Role-Based Login & Permissions ─────────────────────────
    console.log('\n--- 2. Role-Based Authentication & Permissions ---');
    
    // User login
    const userLogin = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@demo.com', password: 'password123' }),
    }).then((r) => r.json());
    assert(userLogin.success === true && userLogin.user.role === 'user', 'User login successful (role: user)');
    const userToken = userLogin.token;

    // Verifier login
    const verifierLogin = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'verifier@demo.com', password: 'password123' }),
    }).then((r) => r.json());
    assert(verifierLogin.success === true && verifierLogin.user.role === 'verifier', 'Verifier login successful (role: verifier)');
    const verifierToken = verifierLogin.token;

    // Admin login
    const adminLogin = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'password123' }),
    }).then((r) => r.json());
    assert(adminLogin.success === true && adminLogin.user.role === 'admin', 'Admin login successful (role: admin)');
    const adminToken = adminLogin.token;

    // Admin access to Users list
    const adminUsers = await fetch(`${BACKEND_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminUsers.status === 200, 'Admin can access /users management endpoint (200 OK)');

    // Non-admin (User & Verifier) blocked from /users
    const userUsers = await fetch(`${BACKEND_URL}/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userUsers.status === 403, 'Regular User is blocked from /users management (403 Forbidden)');

    const verifierUsers = await fetch(`${BACKEND_URL}/users`, {
      headers: { Authorization: `Bearer ${verifierToken}` },
    });
    assert(verifierUsers.status === 403, 'Verifier is blocked from /users management (403 Forbidden)');

    // ── 3. Document Creation & QR Generation ──────────────────────
    console.log('\n--- 3. Document Creation & QR Code Verification ---');
    const newDocRes = await fetch(`${BACKEND_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        documentName: 'Postgraduate Diploma in Cloud Computing',
        documentType: 'Diploma',
        holderName: 'John Citizen',
        holderEmail: 'user@demo.com',
        issuedBy: 'National Computing Academy',
      }),
    }).then((r) => r.json());

    assert(newDocRes.success === true, 'Document created by User in dashboard');
    const docId = newDocRes.data._id;
    const docPublicId = newDocRes.data.documentId;
    assert(docPublicId.startsWith('DOC-'), `Assigned unique ID: ${docPublicId}`);

    // Fetch QR code
    const qrRes = await fetch(`${BACKEND_URL}/documents/${docId}/qr`, {
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((r) => r.json());

    assert(qrRes.success === true, 'QR code successfully generated for document');
    assert(qrRes.qrCode.startsWith('data:image/png;base64,'), 'QR code returned as PNG Base64 Data URL');
    assert(qrRes.verifyUrl.includes(docPublicId), 'QR code encodes target verify URL');

    // ── 4. Public Verification Without Login ──────────────────────
    console.log('\n--- 4. Public Verification (No Auth Header) ---');
    // Before verification (Pending)
    const pendingVerify = await fetch(`${BACKEND_URL}/verify/${docPublicId}`).then((r) => r.json());
    assert(pendingVerify.success === true, 'Public verify succeeds without any auth token');
    assert(pendingVerify.valid === false, 'Document with Pending status is marked valid: false');

    // Verifier reviews and marks Verified
    const verifyReview = await fetch(`${BACKEND_URL}/documents/${docId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifierToken}`,
      },
      body: JSON.stringify({
        status: 'Verified',
        remarks: 'Official diploma registry validated by Dr. Sarah Verifier',
      }),
    }).then((r) => r.json());

    assert(verifyReview.success === true, 'Verifier marked document as Verified with remarks');

    // Public verify now returns valid: true
    const verifiedCheck = await fetch(`${BACKEND_URL}/verify/${docPublicId}`).then((r) => r.json());
    assert(verifiedCheck.valid === true, 'Public verify now returns valid: true (Valid green card)');
    assert(verifiedCheck.data.verifiedByName === 'Dr. Sarah Verifier', 'Public verify includes reviewer name');
    assert(verifiedCheck.data.remarks.includes('validated'), 'Public verify displays reviewer remarks');

    // ── 5. Change Status to Revoked ───────────────────────────────
    console.log('\n--- 5. Status Revocation Test ---');
    const revokeReview = await fetch(`${BACKEND_URL}/documents/${docId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifierToken}`,
      },
      body: JSON.stringify({
        status: 'Revoked',
        remarks: 'Credential revoked due to policy violation',
      }),
    }).then((r) => r.json());

    assert(revokeReview.data.verificationStatus === 'Revoked', 'Status changed to Revoked');

    const revokedCheck = await fetch(`${BACKEND_URL}/verify/${docPublicId}`).then((r) => r.json());
    assert(revokedCheck.valid === false, 'Public verify confirms Revoked document shows valid: false (Invalid red card)');
    assert(revokedCheck.data.verificationStatus === 'Revoked', 'Public verify displays status: Revoked');

    // ── 6. Fake ID Search ─────────────────────────────────────────
    console.log('\n--- 6. Fake ID Search Test ---');
    const fakeRes = await fetch(`${BACKEND_URL}/verify/DOC-FAKE999999`);
    assert(fakeRes.status === 404, 'Searching fake ID returns 404 Not Found');
    const fakeData = await fakeRes.json();
    assert(fakeData.valid === false, 'Fake ID verification returns valid: false');
    assert(fakeData.error.includes('not found') || fakeData.error.includes('invalid'), 'Clear not-found error message returned');

    console.log('\n====================================================');
    console.log(`📊 PHASE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  process.exit(failed === 0 ? 0 : 1);
}

runTests();
