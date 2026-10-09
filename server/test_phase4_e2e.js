/**
 * Phase 4 — Full End-to-End Test Suite
 *
 * Tests every major flow: auth, CRUD, status, QR, public verify, user management,
 * charts, audit trail, and role-based access control.
 *
 * Run: node test_phase4_e2e.js
 */

const API = 'http://localhost:5000/api';

let adminToken, verifierToken, userToken;
let adminId, verifierId, userId;
let createdDocId, createdDocMongoId;
let newUserId, newUserToken;

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name} — ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

async function post(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
}

async function get(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  return { status: res.status, data: await res.json() };
}

async function put(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
}

async function patch(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
}

async function del(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  return { status: res.status, data: await res.json() };
}

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  PHASE 4 — FULL END-TO-END TEST SUITE');
  console.log('══════════════════════════════════════════════════\n');

  // ── 1. Health Check ─────────────────────────────────
  console.log('▸ Health Check');
  await test('API health endpoint responds', async () => {
    const { status, data } = await get(`${API}/health`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true);
  });

  // ── 2. Authentication ──────────────────────────────
  console.log('\n▸ Authentication');

  await test('Register a new user', async () => {
    const { status, data } = await post(`${API}/auth/register`, {
      name: 'Test User E2E', email: 'e2e@test.com', password: 'test1234'
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(data.token, 'No token returned');
    newUserToken = data.token;
    newUserId = data.user._id;
  });

  await test('Duplicate registration is rejected', async () => {
    const { status } = await post(`${API}/auth/register`, {
      name: 'Dup', email: 'e2e@test.com', password: 'test1234'
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('Login as admin', async () => {
    const { status, data } = await post(`${API}/auth/login`, {
      email: 'admin@demo.com', password: 'password123'
    });
    assert(status === 200);
    assert(data.token && data.user.role === 'admin');
    adminToken = data.token;
    adminId = data.user._id;
  });

  await test('Login as verifier', async () => {
    const { status, data } = await post(`${API}/auth/login`, {
      email: 'verifier@demo.com', password: 'password123'
    });
    assert(status === 200);
    assert(data.user.role === 'verifier');
    verifierToken = data.token;
    verifierId = data.user._id;
  });

  await test('Login as user', async () => {
    const { status, data } = await post(`${API}/auth/login`, {
      email: 'user@demo.com', password: 'password123'
    });
    assert(status === 200);
    assert(data.user.role === 'user');
    userToken = data.token;
    userId = data.user._id;
  });

  await test('Invalid login is rejected', async () => {
    const { status } = await post(`${API}/auth/login`, {
      email: 'admin@demo.com', password: 'wrongpassword'
    });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test('GET /me returns current user', async () => {
    const { status, data } = await get(`${API}/auth/me`, adminToken);
    assert(status === 200);
    assert(data.user.email === 'admin@demo.com');
  });

  await test('Unauthenticated request is rejected', async () => {
    const { status } = await get(`${API}/auth/me`);
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // ── 3. Document CRUD ──────────────────────────────
  console.log('\n▸ Document CRUD');

  await test('User creates a document', async () => {
    const { status, data } = await post(`${API}/documents`, {
      documentName: 'E2E Test Certificate',
      documentType: 'Certificate',
      holderName: 'John Test',
      holderEmail: 'john@test.com',
      issuedBy: 'E2E University',
      issueDate: '2025-06-15',
    }, userToken);
    assert(status === 201, `Expected 201, got ${status}`);
    assert(data.data.documentId.startsWith('DOC-'));
    createdDocId = data.data.documentId;
    createdDocMongoId = data.data._id;
  });

  await test('User can view own document', async () => {
    const { status, data } = await get(`${API}/documents/${createdDocMongoId}`, userToken);
    assert(status === 200);
    assert(data.data.documentName === 'E2E Test Certificate');
  });

  await test('User can edit own Pending document', async () => {
    const { status, data } = await put(`${API}/documents/${createdDocMongoId}`, {
      holderName: 'John Test Updated',
    }, userToken);
    assert(status === 200);
    assert(data.data.holderName === 'John Test Updated');
  });

  await test('Document list returns results', async () => {
    const { status, data } = await get(`${API}/documents`, adminToken);
    assert(status === 200);
    assert(data.count >= 1, 'Expected at least 1 document');
  });

  await test('Search by document ID works', async () => {
    const { status, data } = await get(`${API}/documents?search=${createdDocId}`, adminToken);
    assert(status === 200);
    assert(data.count >= 1);
  });

  await test('Filter by status works', async () => {
    const { status, data } = await get(`${API}/documents?status=Pending`, adminToken);
    assert(status === 200);
    assert(data.data.every(d => d.verificationStatus === 'Pending'));
  });

  await test('Stats endpoint returns counts', async () => {
    const { status, data } = await get(`${API}/documents/stats`, adminToken);
    assert(status === 200);
    assert(typeof data.stats.total === 'number');
    assert(typeof data.stats.pending === 'number');
  });

  await test('Charts endpoint returns aggregation data', async () => {
    const { status, data } = await get(`${API}/documents/charts`, adminToken);
    assert(status === 200);
    assert(Array.isArray(data.statusChart));
    assert(Array.isArray(data.typeChart));
  });

  // ── 4. QR Code ─────────────────────────────────────
  console.log('\n▸ QR Code Generation');

  await test('QR endpoint returns a data URL', async () => {
    const { status, data } = await get(`${API}/documents/${createdDocMongoId}/qr`, userToken);
    assert(status === 200);
    assert(data.qrCode.startsWith('data:image/png;base64,'));
    assert(data.verifyUrl.includes(createdDocId));
  });

  // ── 5. Status Management ───────────────────────────
  console.log('\n▸ Status Management');

  await test('Verifier can change status to Verified', async () => {
    const { status, data } = await patch(`${API}/documents/${createdDocMongoId}/status`, {
      status: 'Verified', remarks: 'Looks good — E2E test',
    }, verifierToken);
    assert(status === 200);
    assert(data.data.verificationStatus === 'Verified');
    assert(data.data.remarks === 'Looks good — E2E test');
  });

  await test('User cannot edit document after verification', async () => {
    const { status } = await put(`${API}/documents/${createdDocMongoId}`, {
      holderName: 'Should Fail',
    }, userToken);
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('User cannot delete document after verification', async () => {
    const { status } = await del(`${API}/documents/${createdDocMongoId}`, userToken);
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('Verifier cannot delete a document', async () => {
    const { status } = await del(`${API}/documents/${createdDocMongoId}`, verifierToken);
    assert(status === 403, `Expected 403, got ${status}`);
  });

  await test('Admin can revoke a document', async () => {
    const { status, data } = await patch(`${API}/documents/${createdDocMongoId}/status`, {
      status: 'Revoked', remarks: 'Revoking for E2E test',
    }, adminToken);
    assert(status === 200);
    assert(data.data.verificationStatus === 'Revoked');
  });

  // ── 6. Public Verification ─────────────────────────
  console.log('\n▸ Public Verification');

  await test('Public verify returns valid=false for Revoked doc', async () => {
    const { status, data } = await get(`${API}/verify/${createdDocId}`);
    assert(status === 200);
    assert(data.valid === false, 'Revoked document should be invalid');
    assert(data.data.verificationStatus === 'Revoked');
  });

  await test('Re-verify to Verified makes it valid', async () => {
    await patch(`${API}/documents/${createdDocMongoId}/status`, {
      status: 'Verified', remarks: 'Re-verified',
    }, adminToken);
    const { data } = await get(`${API}/verify/${createdDocId}`);
    assert(data.valid === true, 'Verified document should be valid');
  });

  await test('Fake document ID returns 404 with valid=false', async () => {
    const { status, data } = await get(`${API}/verify/DOC-ZZZZZZZZZZ`);
    assert(status === 404, `Expected 404, got ${status}`);
    assert(data.valid === false);
  });

  await test('Verification count increments', async () => {
    const { data } = await get(`${API}/verify/${createdDocId}`);
    assert(data.data.verificationCount >= 2, `Expected count >= 2, got ${data.data.verificationCount}`);
  });

  // ── 7. Audit Trail ─────────────────────────────────
  console.log('\n▸ Audit Trail');

  await test('Document has audit trail entries', async () => {
    const { data } = await get(`${API}/documents/${createdDocMongoId}`, adminToken);
    const trail = data.data.auditTrail;
    assert(Array.isArray(trail) && trail.length >= 3, `Expected >= 3 audit entries, got ${trail.length}`);
    const actions = trail.map(e => e.action);
    assert(actions.includes('CREATED'), 'Missing CREATED entry');
    assert(actions.includes('STATUS_CHANGED'), 'Missing STATUS_CHANGED entry');
  });

  // ── 8. Role-Based Access ───────────────────────────
  console.log('\n▸ Role-Based Access Control');

  await test('User cannot view another user\'s document', async () => {
    // Get a document created by admin
    const { data: listData } = await get(`${API}/documents`, adminToken);
    const adminDoc = listData.data.find(d => 
      d.createdBy && d.createdBy._id !== userId
    );
    if (adminDoc) {
      const { status } = await get(`${API}/documents/${adminDoc._id}`, newUserToken);
      assert(status === 403, `Expected 403 for other user's doc, got ${status}`);
    }
  });

  await test('User cannot access user management', async () => {
    const { status } = await get(`${API}/users`, userToken);
    assert(status === 403, `Expected 403, got ${status}`);
  });

  await test('Verifier cannot access user management', async () => {
    const { status } = await get(`${API}/users`, verifierToken);
    assert(status === 403, `Expected 403, got ${status}`);
  });

  // ── 9. User Management (Admin) ─────────────────────
  console.log('\n▸ User Management (Admin)');

  await test('Admin can list all users', async () => {
    const { status, data } = await get(`${API}/users`, adminToken);
    assert(status === 200);
    assert(data.count >= 3, `Expected >= 3 users, got ${data.count}`);
  });

  await test('Admin can change a user\'s role', async () => {
    const { status, data } = await patch(`${API}/users/${newUserId}/role`, {
      role: 'verifier'
    }, adminToken);
    assert(status === 200);
    assert(data.data.role === 'verifier');
  });

  await test('Admin cannot change own role', async () => {
    const { status } = await patch(`${API}/users/${adminId}/role`, {
      role: 'user'
    }, adminToken);
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('Admin cannot delete self', async () => {
    const { status } = await del(`${API}/users/${adminId}`, adminToken);
    assert(status === 400, `Expected 400, got ${status}`);
  });

  // ── 10. Cleanup ────────────────────────────────────
  console.log('\n▸ Cleanup');

  await test('Admin can delete the E2E test document', async () => {
    const { status } = await del(`${API}/documents/${createdDocMongoId}`, adminToken);
    assert(status === 200);
  });

  await test('Admin can delete the E2E test user', async () => {
    const { status } = await del(`${API}/users/${newUserId}`, adminToken);
    assert(status === 200);
  });

  await test('Deleted document returns 404', async () => {
    const { status } = await get(`${API}/documents/${createdDocMongoId}`, adminToken);
    assert(status === 404, `Expected 404, got ${status}`);
  });

  // ── Summary ────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('══════════════════════════════════════════════════');

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review the failures above.\n');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TESTS PASSED — Project is submission-ready!\n');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
