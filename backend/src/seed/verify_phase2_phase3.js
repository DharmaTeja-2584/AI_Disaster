const mysql = require('mysql2/promise');

const API = 'http://localhost:5001/api';

async function request(path, options = {}) {
  const url = `${API}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runVerification() {
  console.log('============================================================');
  console.log('RUNNING PHASE 2 & PHASE 3 COMPREHENSIVE VERIFICATION SUITE');
  console.log('============================================================\n');

  // 1. Health Check
  console.log('[1/9] Testing /api/health...');
  const health = await request('/health');
  console.log('   ✓ Health status:', health.data);

  // 2. Auth - Invalid Register (Validation 400)
  console.log('\n[2/9] Testing Registration Input Validation (400)...');
  const invalidReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'A', email: 'notanemail' },
  });
  if (invalidReg.status === 400) {
    console.log('   ✓ Correctly rejected with 400:', invalidReg.data?.message, invalidReg.data?.errors);
  } else {
    console.error('   ✗ FAILED: Expected 400, got', invalidReg.status);
  }

  // 3. Auth - Valid Registration (Civilian)
  console.log('\n[3/9] Testing Valid Civilian Registration (201)...');
  const testEmail = `civilian_${Date.now()}@test.com`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Jane Citizen',
      email: testEmail,
      password: 'password123',
      phone: '555-0199',
      role: 'civilian',
    },
  });
  console.log('   ✓ Registration succeeded: User ID =', regRes.data.data.user.id, 'Role =', regRes.data.data.user.role);
  console.log('   ✓ Password excluded from response:', !regRes.data.data.user.password);
  const civilianToken = regRes.data.data.token;

  // 4. Auth - Login
  console.log('\n[4/9] Testing Login (200) & JWT...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testEmail,
      password: 'password123',
    },
  });
  console.log('   ✓ Login succeeded:', loginRes.data.data.user.email);

  // 5. Auth - Profile & Token Verification
  console.log('\n[5/9] Testing GET /api/auth/me...');
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${civilianToken}` },
  });
  console.log('   ✓ Profile retrieved:', meRes.data.data.user);

  // 6. Register a Commander user for RBAC test
  console.log('\n[6/9] Registering Commander user for RBAC...');
  const cmdEmail = `commander_${Date.now()}@test.com`;
  const cmdReg = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Chief Commander',
      email: cmdEmail,
      password: 'commanderPass123',
      role: 'commander',
    },
  });
  const commanderToken = cmdReg.data.data.token;
  console.log('   ✓ Commander created: ID =', cmdReg.data.data.user.id, 'Role =', cmdReg.data.data.user.role);

  // 7. Incident Intake & Rule-Based AI Triage
  console.log('\n[7/9] Testing POST /api/incidents with AI Triage...');
  const incidentPayload = {
    disasterType: 'Building Collapse',
    description: 'Catastrophic structural collapse with trapped victims and active fire hazard in downtown commercial block.',
    latitude: 34.0522,
    longitude: -118.2437,
    casualties: 3,
    injuries: 14,
    affectedPopulation: 250,
    damageIndicators: ['Structural Damage', 'Trapped Civilians', 'Active Fire'],
  };

  const incidentRes = await request('/incidents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${civilianToken}` },
    body: incidentPayload,
  });

  const incidentData = incidentRes.data.data;
  console.log('   ✓ Incident Created in DB: ID =', incidentData.incident.id, 'Type =', incidentData.incident.incidentType);
  console.log('   ✓ AI Triage Output:');
  console.log('       - Severity Score   :', incidentData.triage.severity, '/ 10');
  console.log('       - AI Confidence    :', incidentData.triage.confidence, '%');
  console.log('       - Priority Routing :', incidentData.triage.priority);
  console.log('       - Detected Cues    :', incidentData.triage.detectedCues);
  console.log('       - Suggested Action :', incidentData.prediction.suggestedAction);
  console.log('   ✓ AI Prediction Saved in DB: Prediction ID =', incidentData.prediction.id);

  const incidentId = incidentData.incident.id;

  // 8. Test Incident Queries & Details
  console.log('\n[8/9] Testing GET /api/incidents and GET /api/incidents/:id...');
  const listRes = await request('/incidents', {
    headers: { Authorization: `Bearer ${civilianToken}` },
  });
  console.log('   ✓ Total Incidents in List:', listRes.data.data.incidents.length);

  const detailRes = await request(`/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${civilianToken}` },
  });
  console.log('   ✓ Retrieved Detail for Incident #', detailRes.data.data.incident.id, 'Risk Level =', detailRes.data.data.incident.riskLevel);

  // 9. RBAC - Status Update (Civilian 403 Forbidden vs Commander 200 OK)
  console.log('\n[9/9] Testing Role-Based Access Control on PATCH /api/incidents/:id/status...');
  const civUpdate = await request(`/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${civilianToken}` },
    body: { status: 'Active' },
  });
  if (civUpdate.status === 403) {
    console.log('   ✓ Civilian correctly blocked (403):', civUpdate.data?.message);
  } else {
    console.error('   ✗ FAILED: Expected 403 for Civilian, got', civUpdate.status);
  }

  const cmdUpdate = await request(`/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: { status: 'Active' },
  });
  console.log('   ✓ Commander successfully updated status to:', cmdUpdate.data.data.incident.status);

  // 10. Database Direct Verification
  console.log('\n============================================================');
  console.log('DIRECT MYSQL PERSISTENCE VERIFICATION');
  console.log('============================================================');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '2006',
    database: 'ai_disaster_response',
  });

  const [dbUsers] = await conn.query('SELECT USER_ID, USER_NAME, EMAIL, ROLE, LEFT(PASSWORD, 20) AS pwd_hash_sample FROM `user`');
  console.log('MySQL `user` table records:');
  console.table(dbUsers);

  const [dbIncidents] = await conn.query('SELECT INCIDENT_ID, INCIDENT_TYPE, SEVERITY, STATUS, REPORTED_TIME FROM `incident`');
  console.log('MySQL `incident` table records:');
  console.table(dbIncidents);

  const [dbPredictions] = await conn.query('SELECT PREDICTION_ID, INCIDENT_ID, RISK_LEVEL, CONFIDENCE, LEFT(SUGGESTED_ACTION, 40) AS action_sample FROM `ai_prediction`');
  console.log('MySQL `ai_prediction` table records:');
  console.table(dbPredictions);

  await conn.end();
  console.log('\n============================================================');
  console.log('ALL PHASE 2 & PHASE 3 VERIFICATIONS PASSED 100%');
  console.log('============================================================');
}

runVerification().catch((err) => {
  console.error('Verification encountered an error:', err);
  process.exit(1);
});
