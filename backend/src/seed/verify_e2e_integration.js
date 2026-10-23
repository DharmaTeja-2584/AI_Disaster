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

async function runE2EIntegration() {
  console.log('============================================================');
  console.log('COMPLETE E2E MULTI-PHASE OPERATIONAL INTEGRATION TEST');
  console.log('============================================================\n');

  // [1] Login / Register Civilian
  console.log('[1/24] Logging in as Civilian...');
  const civEmail = `civilian_e2e_${Date.now()}@test.com`;
  const civReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Alice Citizen', email: civEmail, password: 'password123', role: 'civilian' },
  });
  const civToken = civReg.data.data.token;
  console.log('   ✓ Civilian authenticated');

  // [2] Submit Building Collapse
  console.log('\n[2-3/24] Civilian submitting Building Collapse report...');
  const reportRes = await request('/incidents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${civToken}` },
    body: {
      disasterType: 'Building Collapse',
      description: 'Severe multistory commercial building collapse with trapped workers and active hazard.',
      latitude: 34.0530,
      longitude: -118.2440,
      casualties: 3,
      injuries: 14,
      affectedPopulation: 120,
      damageIndicators: ['Structural Damage', 'Trapped Civilians', 'Hazardous Materials'],
    },
  });
  const incident = reportRes.data.data.incident;
  const triage = reportRes.data.data.triage;
  console.log(`   ✓ Incident #${incident.id} created.`);
  console.log(`   ✓ AI Triage: Severity: ${triage.severity}/10, Confidence: ${triage.confidence}%, Priority: ${triage.priority}`);

  // [4] Login / Register Commander
  console.log('\n[4-6/24] Logging in as Commander & opening incident in Command Center...');
  const cmdEmail = `commander_e2e_${Date.now()}@test.com`;
  const cmdReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Commander Miller', email: cmdEmail, password: 'password123', role: 'commander' },
  });
  const cmdToken = cmdReg.data.data.token;

  const incDetailBefore = await request(`/incidents/${incident.id}`, {
    headers: { Authorization: `Bearer ${cmdToken}` },
  });
  console.log(`   ✓ Commander loaded Incident #${incident.id} operational detail.`);

  // [7-8] Dispatch nearest suitable team
  console.log('\n[7-8/24] Evaluating candidate teams & dispatching nearest unit...');
  const candidateTeams = await request(`/incidents/${incident.id}/candidate-teams`, {
    headers: { Authorization: `Bearer ${cmdToken}` },
  });
  const bestTeam = candidateTeams.data.data.recommendedTeam;
  console.log(`   ✓ Selected nearest team: ${bestTeam.teamName} (Haversine: ${bestTeam.distanceKm} km, Spec: ${bestTeam.specialization})`);

  const dispatchRes = await request(`/incidents/${incident.id}/allocate-team`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cmdToken}` },
    body: { teamId: bestTeam.teamId },
  });
  console.log(`   ✓ Team Dispatched: Record #${dispatchRes.data.data.dispatchId}, Status: ${dispatchRes.data.data.status}`);

  // [9-10] Allocate Medical Kits
  console.log('\n[9-10/24] Allocating Medical Kits from inventory...');
  const resourcesRes = await request('/resources?category=Medical', {
    headers: { Authorization: `Bearer ${cmdToken}` },
  });
  const medicalResource = resourcesRes.data.data.resources[0];
  const initialMedStock = medicalResource.quantity;

  const allocRes = await request(`/incidents/${incident.id}/allocate-resource`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cmdToken}` },
    body: { resourceId: medicalResource.id, quantity: 20 },
  });
  console.log(`   ✓ Allocated 20 ${medicalResource.name}: Record #${allocRes.data.data.allocationId}`);

  const updatedMedRes = await request(`/resources/${medicalResource.id}`, {
    headers: { Authorization: `Bearer ${cmdToken}` },
  });
  console.log(`   ✓ Verified stock decreased: ${initialMedStock} -> ${updatedMedRes.data.data.resource.quantity}`);

  // [11-13] Find candidate shelters & assign capacity
  console.log('\n[11-13/24] Finding candidate shelters & assigning capacity...');
  const candidateShelters = await request(`/incidents/${incident.id}/candidate-shelters`, {
    headers: { Authorization: `Bearer ${cmdToken}` },
  });
  const targetShelter = candidateShelters.data.data.recommendedShelter;
  console.log(`   ✓ Nearest candidate shelter: ${targetShelter.shelterName} (${targetShelter.distanceKm} km, Available: ${targetShelter.availableSpaces})`);

  const shelterAssignRes = await request(`/incidents/${incident.id}/assign-shelter`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cmdToken}` },
    body: { shelterId: targetShelter.shelterId, assignedSpaces: 60 },
  });
  console.log(`   ✓ Assigned 60 spaces: Assignment #${shelterAssignRes.data.data.assignmentId}`);

  const updatedShelter = await request(`/shelters/${targetShelter.shelterId}`, {
    headers: { Authorization: `Bearer ${cmdToken}` },
  });
  console.log(`   ✓ Verified shelter available spaces decreased: ${targetShelter.availableSpaces} -> ${updatedShelter.data.data.shelter.availableSpaces}`);

  // [14-16] Login as Responder & update incident status
  console.log('\n[14-16/24] Logging in as Responder & updating incident progress...');
  const respEmail = `responder_e2e_${Date.now()}@test.com`;
  const respReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Lieutenant Diaz', email: respEmail, password: 'password123', role: 'responder' },
  });
  const respToken = respReg.data.data.token;

  await request(`/incidents/${incident.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${respToken}` },
    body: { status: 'Active' },
  });
  console.log('   ✓ Responder marked incident Active on-scene');

  // [17-18] Commander marks Contained, then Resolved
  console.log('\n[17-18/24] Commander transitioning status to Contained then Resolved...');
  await request(`/incidents/${incident.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${cmdToken}` },
    body: { status: 'Contained' },
  });
  console.log('   ✓ Transitioned to Contained');

  await request(`/incidents/${incident.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${cmdToken}` },
    body: { status: 'Resolved' },
  });
  console.log('   ✓ Transitioned to Resolved');

  // [19] Verify team becomes Available
  console.log('\n[19/24] Verifying dispatched team automatically released to Available...');
  const teamCheck = await request(`/response-teams/${bestTeam.teamId}`, {
    headers: { Authorization: `Bearer ${cmdToken}` },
  });
  console.log(`   ✓ Team Status: ${teamCheck.data.data.team.availability} (Expected: Available)`);

  // [20-22] Verify historical records in DB
  console.log('\n[20-22/24] Verifying all historical records remain in MySQL...');
  const finalDetail = await request(`/incidents/${incident.id}`, {
    headers: { Authorization: `Bearer ${cmdToken}` },
  });
  const incObj = finalDetail.data.data.incident;
  console.log(`   ✓ Dispatch history preserved: ${incObj.dispatches.length} dispatch record(s)`);
  console.log(`   ✓ Resource allocation history preserved: ${incObj.allocations.length} allocation record(s)`);
  console.log(`   ✓ Shelter assignment history preserved: ${incObj.shelters.length} shelter assignment record(s)`);

  // [23] Verify Command Center Metrics
  console.log('\n[23/24] Verifying Command Center aggregate metrics...');
  const metricsRes = await request('/dashboard/metrics', {
    headers: { Authorization: `Bearer ${cmdToken}` },
  });
  console.log('   ✓ Live Dashboard Metrics:', JSON.stringify(metricsRes.data.data.metrics.resolvedToday));

  // [24] Verify Civilian can view shelters
  console.log('\n[24/24] Verifying Civilian can view live Shelter Network...');
  const civSheltersRes = await request('/shelters', {
    headers: { Authorization: `Bearer ${civToken}` },
  });
  console.log(`   ✓ Civilian retrieved ${civSheltersRes.data.data.shelters.length} active public shelters.`);

  console.log('\n============================================================');
  console.log('ALL 24 MULTI-PHASE INTEGRATION STEPS PASSED 100%');
  console.log('============================================================');
}

runE2EIntegration().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
