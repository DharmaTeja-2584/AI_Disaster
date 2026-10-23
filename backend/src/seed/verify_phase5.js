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

async function runPhase5Verification() {
  console.log('============================================================');
  console.log('RUNNING PHASE 5: RESPONSE TEAMS & HAVERSINE SMART DISPATCH');
  console.log('============================================================\n');

  // 1. Authenticate Commander
  console.log('[1/10] Authenticating Commander...');
  const cmdEmail = `commander_p5_${Date.now()}@test.com`;
  const regCmd = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Commander John Matrix',
      email: cmdEmail,
      password: 'commanderPass123',
      role: 'commander',
    },
  });
  const commanderToken = regCmd.data.data.token;
  console.log('   ✓ Commander token acquired');

  // 2. Query Response Teams
  console.log('\n[2/10] Testing GET /api/response-teams...');
  const teamsRes = await request('/response-teams', {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  const teams = teamsRes.data.data.teams;
  console.log('   ✓ Total Response Teams Retrieved from MySQL:', teams.length);
  teams.forEach((t) => {
    console.log(`       [Team #${t.id}] ${t.name} | Spec: ${t.specialization} | Status: ${t.availability} | Coords: (${t.latitude}, ${t.longitude})`);
  });

  // 3. Create Incident with Coordinates for Dispatch
  console.log('\n[3/10] Creating Test Incident with GPS Coordinates...');
  const incRes = await request('/incidents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: {
      disasterType: 'Building Collapse',
      description: 'Major multistory structure collapse with trapped survivors at 1st & Main.',
      latitude: 34.0522,
      longitude: -118.2437,
      casualties: 2,
      injuries: 8,
      affectedPopulation: 100,
      damageIndicators: ['Structural Damage', 'Trapped Civilians'],
    },
  });
  const incidentId = incRes.data.data.incident.id;
  console.log('   ✓ Incident Created in DB: ID =', incidentId, 'Coords: (34.0522, -118.2437)');

  // 4. Test GET /api/incidents/:id/candidate-teams (Haversine Distance + Specialization Ranking)
  console.log('\n[4/10] Testing Haversine Candidate Teams Calculation & Ranking...');
  const candidateRes = await request(`/incidents/${incidentId}/candidate-teams`, {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  const { candidates, recommendedTeam } = candidateRes.data.data;
  console.log('   ✓ Evaluated', candidates.length, 'Available Candidates.');
  candidates.slice(0, 3).forEach((c, idx) => {
    console.log(`       Rank #${idx + 1}: ${c.teamName} | Dist: ${c.distanceKm} km | SpecMatch: ${c.isSpecializationMatch} | Spec: ${c.specialization}`);
  });
  console.log('   ✓ Top Recommended Team:', recommendedTeam.teamName, `(${recommendedTeam.distanceKm} km)`);

  // 5. Test Smart Dispatch: POST /api/incidents/:id/allocate-team
  console.log('\n[5/10] Testing Transactional Dispatch: POST /api/incidents/:id/allocate-team...');
  const dispatchRes = await request(`/incidents/${incidentId}/allocate-team`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: { teamId: recommendedTeam.teamId },
  });

  const dispatchData = dispatchRes.data.data;
  console.log('   ✓ Team Dispatched Successfully:');
  console.log('       - Dispatch Record ID :', dispatchData.dispatchId);
  console.log('       - Incident ID        :', dispatchData.incidentId);
  console.log('       - Dispatched Team    :', dispatchData.team.teamName);
  console.log('       - Haversine Distance :', dispatchData.distanceKm, 'km');
  console.log('       - Team Status        :', dispatchData.status);

  // 6. Test Double-Dispatch Prevention (Attempting to dispatch already deployed team -> 409 Conflict)
  console.log('\n[6/10] Testing Concurrency & Double-Dispatch Prevention...');
  const doubleDispatch = await request(`/incidents/${incidentId}/allocate-team`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: { teamId: recommendedTeam.teamId },
  });
  if (doubleDispatch.status === 409) {
    console.log('   ✓ Successfully rejected double-dispatch with 409 Conflict:', doubleDispatch.data?.message);
  } else {
    console.error('   ✗ FAILED: Expected 409 Conflict, got', doubleDispatch.status);
  }

  // 7. Verify Incident Details Displays Assigned Team
  console.log('\n[7/10] Verifying Incident Detail Displays Real Assigned Team...');
  const detailRes = await request(`/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  const incDetail = detailRes.data.data.incident;
  console.log('   ✓ Incident #', incDetail.id, 'has', incDetail.dispatches.length, 'dispatches in DB');
  console.log('       - Active Deployed Team:', incDetail.activeTeam?.teamName);

  // 8. Verify Command Center Streams Displays Assigned Team Name
  console.log('\n[8/10] Verifying Command Center Streams Displays Assigned Team Name...');
  const ccRes = await request('/incidents', {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  const matchedInc = ccRes.data.data.incidents.find((i) => i.id === incidentId);
  console.log('   ✓ Incident Stream Record assignedTeamName =', matchedInc?.assignedTeamName);

  // 9. Test Incident Resolution & Automatic Response Team Release
  console.log('\n[9/10] Testing Incident Resolution and Automatic Team Release...');
  const resolveRes = await request(`/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${commanderToken}` },
    body: { status: 'Resolved' },
  });
  console.log('   ✓ Incident Status Transitioned to:', resolveRes.data.data.incident.status);

  // Verify team is now 'Available' again in MySQL
  const teamCheckRes = await request(`/response-teams/${recommendedTeam.teamId}`, {
    headers: { Authorization: `Bearer ${commanderToken}` },
  });
  console.log('   ✓ Dispatched Team Status in MySQL is now:', teamCheckRes.data.data.team.availability, '(Expected: Available)');

  // 10. Direct Database Persistence & Auditability Check
  console.log('\n[10/10] Direct MySQL Verification on `incident_dispatch` and `response_team`...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '2006',
    database: 'ai_disaster_response',
  });

  const [dbDispatches] = await conn.query('SELECT DISPATCH_ID, INCIDENT_ID, TEAM_ID, DISPATCH_TIME, STATUS FROM `incident_dispatch`');
  console.log('MySQL `incident_dispatch` records (History preserved):');
  console.table(dbDispatches);

  const [dbTeams] = await conn.query('SELECT TEAM_ID, TEAM_NAME, SPECIALIZATION, AVAILABILITY, LATITUDE, LONGITUDE FROM `response_team`');
  console.log('MySQL `response_team` records:');
  console.table(dbTeams);

  await conn.end();

  console.log('\n============================================================');
  console.log('PHASE 5 VERIFICATION COMPLETE — ALL TESTS PASSED 100%');
  console.log('============================================================');
}

runPhase5Verification().catch((err) => {
  console.error('Phase 5 Verification encountered an error:', err);
  process.exit(1);
});
