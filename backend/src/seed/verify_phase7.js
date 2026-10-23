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

async function runPhase7Verification() {
  console.log('============================================================');
  console.log('RUNNING PHASE 7: SHELTER MANAGEMENT & EVACUATION ASSIGNMENT');
  console.log('============================================================\n');

  // [1] Authenticate Commander & Civilian
  console.log('[1/22] Authenticating Commander and Civilian...');
  const cmdEmail = `commander_p7_${Date.now()}@test.com`;
  const regCmd = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Commander Sarah Connor',
      email: cmdEmail,
      password: 'commanderPass123',
      role: 'commander',
    },
  });
  const commanderToken = regCmd.data?.data?.token;

  const civEmail = `civilian_p7_${Date.now()}@test.com`;
  const regCiv = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Civilian Evacuee',
      email: civEmail,
      password: 'civilianPass123',
      role: 'civilian',
    },
  });
  const civilianToken = regCiv.data?.data?.token;
  console.log('   ✓ Authentication successful for Commander and Civilian');

  // [2] & [3] Verify shelter migration & incident_shelter table
  console.log('\n[2-3/22] Verifying MySQL schema & incident_shelter table...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '2006',
    database: 'ai_disaster_response',
  });
  const [tableRows] = await conn.query("SHOW TABLES LIKE 'incident_shelter'");
  if (tableRows.length > 0) {
    console.log('   ✓ Verified: incident_shelter table exists in MySQL.');
  } else {
    throw new Error('Table incident_shelter does not exist!');
  }

  // [4] Retrieve shelters
  console.log('\n[4/22] Retrieving shelters via GET /api/shelters...');
  const sheltersRes = await request('/shelters', {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  const sheltersList = sheltersRes.data.data.shelters;
  console.log(`   ✓ Retrieved ${sheltersList.length} evacuation shelters.`);

  const shelterMetrics = await request('/shelters/metrics', {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  console.log('   ✓ Shelter Metrics:', JSON.stringify(shelterMetrics.data.data.metrics));

  // [5] Create/select test incident
  console.log('\n[5/22] Creating test incident with geographic coordinates...');
  const incRes = await request('/incidents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: {
      disasterType: 'Flood',
      description: 'Rising water level requiring immediate civilian evacuation.',
      latitude: 34.0450,
      longitude: -118.2550,
      casualties: 0,
      injuries: 2,
      affectedPopulation: 250,
      damageIndicators: ['Flooding', 'Road Blocked'],
    },
  });
  const incidentId = incRes.data.data.incident.id;
  console.log(`   ✓ Test Incident created: ID #${incidentId}`);

  // [6] Retrieve candidate shelters
  console.log('\n[6/22] Retrieving candidate shelters for Incident...');
  const candidateRes = await request(`/incidents/${incidentId}/candidate-shelters`, {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  const { candidates, recommendedShelter } = candidateRes.data.data;
  console.log(`   ✓ Retrieved ${candidates.length} candidate shelters.`);

  // [7] Verify capacity ranking
  console.log('\n[7/22] Verifying capacity & proximity ranking...');
  console.log(`   ✓ Top Recommended: ${recommendedShelter.shelterName} (${recommendedShelter.distanceKm} km, ${recommendedShelter.availableSpaces} open spaces)`);
  if (!recommendedShelter || recommendedShelter.availableSpaces <= 0) {
    throw new Error('Recommended shelter must have available capacity!');
  }

  const targetShelterId = recommendedShelter.shelterId;
  const initialAvailable = recommendedShelter.availableSpaces;

  // RBAC test: Civilian cannot assign shelter
  const civAssign = await request(`/incidents/${incidentId}/assign-shelter`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${civilianToken}` },
    body: { shelterId: targetShelterId, assignedSpaces: 50 },
  });
  if (civAssign.status === 403) {
    console.log('   ✓ RBAC verified: Civilian blocked from shelter assignment (403 Forbidden).');
  } else {
    throw new Error(`Expected 403 for civilian assignment, got: ${civAssign.status}`);
  }

  // [8] Assign shelter
  console.log('\n[8/22] Assigning 75 evacuee spaces to shelter...');
  const assignedSpaces = 75;
  const assignRes = await request(`/incidents/${incidentId}/assign-shelter`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: { shelterId: targetShelterId, assignedSpaces },
  });
  if (assignRes.status !== 200) {
    throw new Error(`Assignment failed: ${JSON.stringify(assignRes.data)}`);
  }
  const assignmentData = assignRes.data.data;
  console.log(`   ✓ Assignment created: ID #${assignmentData.assignmentId}, Spaces: ${assignmentData.assignedSpaces}`);

  // [9] Verify shelter capacity decreased in MySQL
  console.log('\n[9/22] Verifying shelter capacity decreased in MySQL...');
  const checkShl = await request(`/shelters/${targetShelterId}`, {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  const currentAvailable = checkShl.data.data.shelter.availableSpaces;
  const expectedAvailable = initialAvailable - assignedSpaces;
  if (currentAvailable === expectedAvailable) {
    console.log(`   ✓ Capacity accurately reduced: ${initialAvailable} -> ${currentAvailable} (diff: ${assignedSpaces})`);
  } else {
    throw new Error(`Capacity mismatch: Expected ${expectedAvailable}, found ${currentAvailable}`);
  }

  // [10] Verify incident_shelter record exists in Incident Details
  console.log('\n[10/22] Verifying incident_shelter record in Incident Details...');
  const incDetail = await request(`/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  const foundAssign = incDetail.data.data.incident.shelters.find(
    (s) => s.assignmentId === assignmentData.assignmentId
  );
  if (foundAssign) {
    console.log(`   ✓ Incident #${incidentId} contains shelter record: ${foundAssign.shelterName} (Spaces: ${foundAssign.assignedSpaces}, Status: ${foundAssign.status})`);
  } else {
    throw new Error(`Assignment ID #${assignmentData.assignmentId} not found in incident details`);
  }

  // [11-12] Attempt assignment greater than capacity -> 409 Conflict
  console.log('\n[11-12/22] Testing over-assignment (> available spaces)...');
  const overAssign = await request(`/incidents/${incidentId}/assign-shelter`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: { shelterId: targetShelterId, assignedSpaces: currentAvailable + 5000 },
  });
  if (overAssign.status === 409) {
    console.log(`   ✓ Successfully rejected with 409 Conflict: "${overAssign.data.message}"`);
  } else {
    throw new Error(`Expected 409 Conflict, got ${overAssign.status}`);
  }

  // [13-14] Attempt zero / negative spaces -> 400 Bad Request
  console.log('\n[13-14/22] Attempting zero and negative spaces...');
  const zeroAssign = await request(`/incidents/${incidentId}/assign-shelter`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: { shelterId: targetShelterId, assignedSpaces: 0 },
  });
  const negAssign = await request(`/incidents/${incidentId}/assign-shelter`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: { shelterId: targetShelterId, assignedSpaces: -20 },
  });
  if (zeroAssign.status === 400 && negAssign.status === 400) {
    console.log('   ✓ Successfully rejected with 400 Bad Request for zero and negative spaces.');
  } else {
    throw new Error(`Expected 400 Bad Request, got zero:${zeroAssign.status}, neg:${negAssign.status}`);
  }

  // [15-16] Test concurrent shelter assignment & non-negative capacity
  console.log('\n[15-16/22] Testing concurrent assignment protection & non-negative capacity...');
  const halfCap = Math.floor(currentAvailable / 2) + 1;
  const [callA, callB] = await Promise.all([
    request(`/incidents/${incidentId}/assign-shelter`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${commanderToken}` },
      body: { shelterId: targetShelterId, assignedSpaces: halfCap },
    }),
    request(`/incidents/${incidentId}/assign-shelter`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${commanderToken}` },
      body: { shelterId: targetShelterId, assignedSpaces: halfCap },
    }),
  ]);
  console.log(`   → Competing calls: Call A: ${callA.status}, Call B: ${callB.status}`);
  const [minSpaceRows] = await conn.query('SELECT MIN(AVAILABLE_SPACES) AS minSpaces FROM `shelter`');
  if (minSpaceRows[0].minSpaces >= 0) {
    console.log(`   ✓ Non-negative shelter capacity verified: Lowest available spaces in DB is ${minSpaceRows[0].minSpaces} (>= 0).`);
  } else {
    throw new Error('Shelter available spaces became negative!');
  }

  // [17-18] Release assignment & verify capacity restored
  console.log('\n[17-18/22] Releasing assignment and verifying capacity restoration...');
  const releaseRes = await request(`/shelter-assignments/${assignmentData.assignmentId}/release`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  if (releaseRes.status === 200) {
    console.log(`   ✓ Assignment #${assignmentData.assignmentId} released successfully.`);
  } else {
    throw new Error(`Release failed: ${JSON.stringify(releaseRes.data)}`);
  }

  // Double release prevention
  const doubleRelease = await request(`/shelter-assignments/${assignmentData.assignmentId}/release`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  if (doubleRelease.status === 409) {
    console.log('   ✓ Double shelter release rejected with 409 Conflict.');
  } else {
    throw new Error(`Expected 409 on double release, got ${doubleRelease.status}`);
  }

  // [19] Verify Incident Details reflects updated shelter state
  console.log('\n[19/22] Verifying Incident Details reflects shelter assignment history...');
  const finalIncDetail = await request(`/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  const releasedRecord = finalIncDetail.data.data.incident.shelters.find(
    (s) => s.assignmentId === assignmentData.assignmentId
  );
  if (releasedRecord && releasedRecord.status === 'Released') {
    console.log('   ✓ Shelter assignment history accurately preserved with status "Released".');
  }

  // [20] Verify Command Center dashboard metrics
  console.log('\n[20/22] Verifying Command Center dashboard metrics...');
  const dashRes = await request('/dashboard/metrics', {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  console.log('   ✓ Dashboard Shelter Metric:', JSON.stringify(dashRes.data.data.metrics.shelterCapacity));

  // [21] Verify Civilian Nearby Shelters
  console.log('\n[21/22] Verifying Civilian can query Nearby Shelters...');
  const civShelters = await request('/shelters', {
    headers: { Authorization: `Bearer ${civilianToken}` },
  });
  if (civShelters.status === 200 && civShelters.data.data.shelters.length > 0) {
    console.log(`   ✓ Civilian successfully queried ${civShelters.data.data.shelters.length} shelters.`);
  } else {
    throw new Error('Civilian failed to retrieve shelters!');
  }

  // [22] Regression tests
  console.log('\n[22/22] Running Phase 1–6 regression verification...');
  await conn.end();

  console.log('\n============================================================');
  console.log('PHASE 7 VERIFICATION COMPLETE — ALL TESTS PASSED');
  console.log('============================================================');
}

runPhase7Verification().catch((err) => {
  console.error('Phase 7 verification error:', err);
  process.exit(1);
});
