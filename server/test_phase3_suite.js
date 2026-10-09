/**
 * test_phase3_suite.js — Comprehensive verification suite for Phase 3
 */

const crypto = require('crypto');

const BASE_URL = 'http://127.0.0.1:5000/api';

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
  console.log('🚀 STARTING PHASE 3 COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  try {
    // ── 1. Auth Setup ─────────────────────────────────────────────
    console.log('--- 1. Authenticating Demo Users ---');
    const userLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@demo.com', password: 'password123' }),
    }).then((r) => r.json());
    const userToken = userLogin.token;

    const verifierLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'verifier@demo.com', password: 'password123' }),
    }).then((r) => r.json());
    const verifierToken = verifierLogin.token;

    assert(!!userToken && !!verifierToken, 'Tokens acquired for user and verifier');

    // ── 2. Feature 3.4: Dashboard Charts Aggregation Endpoint ─────
    console.log('\n--- 2. Feature 3.4: Dashboard Analytics Aggregation ---');
    const chartsRes = await fetch(`${BASE_URL}/documents/charts`, {
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((r) => r.json());

    assert(chartsRes.success === true, 'GET /api/documents/charts returned 200 OK');
    assert(Array.isArray(chartsRes.statusChart), 'statusChart array returned for donut visualization');
    assert(Array.isArray(chartsRes.typeChart), 'typeChart array returned for bar chart visualization');
    console.log('     Status counts:', chartsRes.statusChart.map((s) => `${s.name}: ${s.value}`).join(', '));

    // ── 3. Feature 3.5: File Attachment & SHA-256 Hashing ─────────
    console.log('\n--- 3. Feature 3.5: File Upload & SHA-256 Hash Integrity ---');

    // Prepare simulated authentic document file
    const authenticFileContent = 'CONFIDENTIAL OFFICIAL UNIVERSITY CERTIFICATE 2026';
    const authenticFileBuffer = Buffer.from(authenticFileContent);
    const expectedSha256 = crypto.createHash('sha256').update(authenticFileBuffer).digest('hex');

    // Create document with file upload (multipart/form-data)
    const formData = new FormData();
    formData.append('documentName', 'Advanced Artificial Intelligence Certificate');
    formData.append('documentType', 'Certificate');
    formData.append('holderName', 'John Citizen');
    formData.append('holderEmail', 'user@demo.com');
    formData.append('issuedBy', 'DeepMind Academy');
    formData.append(
      'file',
      new Blob([authenticFileBuffer], { type: 'application/pdf' }),
      'certificate_official.pdf'
    );

    const docCreateRes = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: formData,
    }).then((r) => r.json());

    assert(docCreateRes.success === true, 'Document created with attached file');
    const docId = docCreateRes.data._id;
    const docPublicId = docCreateRes.data.documentId;
    assert(docCreateRes.data.fileHash === expectedSha256, `SHA-256 hash automatically computed and stored: ${expectedSha256.substring(0, 16)}...`);
    assert(docCreateRes.data.fileName === 'certificate_official.pdf', 'Original filename preserved in document record');

    // Verifier reviews document
    await fetch(`${BASE_URL}/documents/${docId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifierToken}`,
      },
      body: JSON.stringify({
        status: 'Verified',
        remarks: 'Digital signature and registry confirmed',
      }),
    });

    // Test A: Check file integrity with the EXACT authentic file -> MUST MATCH
    const testMatchForm = new FormData();
    testMatchForm.append(
      'file',
      new Blob([authenticFileBuffer], { type: 'application/pdf' }),
      'my_downloaded_copy.pdf'
    );

    const matchRes = await fetch(`${BASE_URL}/verify/${docPublicId}/check-file`, {
      method: 'POST',
      body: testMatchForm,
    }).then((r) => r.json());

    assert(matchRes.success === true, 'Integrity check endpoint responded successfully');
    assert(matchRes.match === true, 'Authentic file hash MATCHES stored master signature (match: true)');

    // Test B: Check file integrity with a TAMPERED file -> MUST FAIL MATCH
    const tamperedContent = 'CONFIDENTIAL OFFICIAL UNIVERSITY CERTIFICATE 2026 - MODIFIED GRADE A+';
    const tamperedBuffer = Buffer.from(tamperedContent);
    const testTamperForm = new FormData();
    testTamperForm.append(
      'file',
      new Blob([tamperedBuffer], { type: 'application/pdf' }),
      'tampered_copy.pdf'
    );

    const tamperRes = await fetch(`${BASE_URL}/verify/${docPublicId}/check-file`, {
      method: 'POST',
      body: testTamperForm,
    }).then((r) => r.json());

    assert(tamperRes.match === false, 'Tampered file hash correctly DETECTS forgery/modification (match: false)');

    // ── 4. Feature 3.3: Audit Trail & Scan Counter ────────────────
    console.log('\n--- 4. Feature 3.3: Historical Audit Trail & View Counter ---');

    // Fetch document details as verifier
    const docDetailRes = await fetch(`${BASE_URL}/documents/${docId}`, {
      headers: { Authorization: `Bearer ${verifierToken}` },
    }).then((r) => r.json());

    assert(Array.isArray(docDetailRes.data.auditTrail), 'Document contains auditTrail array');
    assert(docDetailRes.data.auditTrail.length >= 2, `Audit trail recorded ${docDetailRes.data.auditTrail.length} events (CREATED, STATUS_CHANGED)`);

    const hasCreatedLog = docDetailRes.data.auditTrail.some((l) => l.action === 'CREATED');
    const hasStatusLog = docDetailRes.data.auditTrail.some((l) => l.action === 'STATUS_CHANGED');
    assert(hasCreatedLog && hasStatusLog, 'Audit trail logs both CREATED and STATUS_CHANGED events with user attribution');

    // Public verify counter test
    const initialVerify = await fetch(`${BASE_URL}/verify/${docPublicId}`).then((r) => r.json());
    const count1 = initialVerify.data.verificationCount;

    const secondVerify = await fetch(`${BASE_URL}/verify/${docPublicId}`).then((r) => r.json());
    const count2 = secondVerify.data.verificationCount;

    assert(count2 === count1 + 1, `Public verification counter incremented on view (${count1} -> ${count2})`);

    // ── 5. Feature 3.6: Expiry Date Auto-Evaluation ───────────────
    console.log('\n--- 5. Feature 3.6: Expiry Date Evaluation ---');
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Yesterday

    const expiredDoc = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        documentName: 'Expired Medical Clearance Permit',
        documentType: 'License',
        holderName: 'John Citizen',
        holderEmail: 'user@demo.com',
        issuedBy: 'Health Licensing Board',
        issueDate: '2023-01-01',
        expiryDate: pastDate,
      }),
    }).then((r) => r.json());

    // Mark verified
    await fetch(`${BASE_URL}/documents/${expiredDoc.data._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${verifierToken}` },
      body: JSON.stringify({ status: 'Verified', remarks: 'Passed initial check' }),
    });

    // Public verify of expired document
    const expiredVerify = await fetch(`${BASE_URL}/verify/${expiredDoc.data.documentId}`).then((r) => r.json());
    assert(expiredVerify.isExpired === true, 'Document past expiryDate is flagged isExpired: true');
    assert(expiredVerify.valid === false, 'Expired document is automatically marked valid: false (Invalid)');
    assert(expiredVerify.data.verificationStatus === 'Expired', 'Status dynamically displays as Expired on verify portal');

    // ── 6. Feature 3.7: Rate Limiting Verification ────────────────
    console.log('\n--- 6. Feature 3.7: Rate Limiter on Public Verify ---');
    const rateLimitCheck = await fetch(`${BASE_URL}/verify/${docPublicId}`);
    const remaining = rateLimitCheck.headers.get('ratelimit-remaining') || rateLimitCheck.headers.get('x-ratelimit-remaining');
    assert(rateLimitCheck.status === 200, 'Public verify responds within rate limit');
    assert(remaining !== null, 'Rate limit headers present on public verify endpoint');

    console.log('\n====================================================');
    console.log(`📊 PHASE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  process.exit(failed === 0 ? 0 : 1);
}

runTests();
