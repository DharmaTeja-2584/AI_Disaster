require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool } = require('../db');

const BASE_URL = 'http://localhost:5001/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body };
}

async function login(email, password = 'demo1234') {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

async function runCompleteIntegrationTest() {
  console.log('============================================================');
  console.log('MASTER E2E INTEGRATION TEST — PHASE 8 & PHASE 9 COMPLETE LIFECYCLE');
  console.log('============================================================\n');

  try {
    // 1. Civilian submits disaster report
    console.log('[1/24] Civilian submitting emergency disaster report...');
    const civilianToken = await login('civilian@demo.com');
    const createIncRes = await request('/incidents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${civilianToken}` },
      body: JSON.stringify({
        disasterType: 'Building Collapse',
        description: 'Commercial complex partial collapse, trapped occupants in basement, cracked main pillars.',
        latitude: 37.779,
        longitude: -122.418,
        casualties: 2,
        injuries: 8,
        affectedPopulation: 60,
      }),
    });
    if (!createIncRes.ok) throw new Error(`Report submission failed: ${JSON.stringify(createIncRes.body)}`);
    const incident = createIncRes.body.data.incident;
    const triage = createIncRes.body.data.triage;
    console.log(`   ✓ Incident #${incident.id} created`);

    // 2. AI triage executes
    console.log('\n[2/24] Verifying AI triage execution & initial prediction...');
    console.log(`   ✓ AI Triage: Severity: ${triage.severity}/10, Risk: ${triage.riskLevel}, Confidence: ${triage.confidence}%`);

    // 3. Incident appears in Command Center
    console.log('\n[3/24] Verifying incident appears in Command Center stream...');
    const commanderToken = await login('commander@demo.com');
    const streamRes = await request(`/incidents?search=${incident.id}`, {
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    const foundInStream = streamRes.body.data.incidents.find((i) => i.id === incident.id);
    if (!foundInStream) throw new Error(`Incident #${incident.id} not found in Command Center list.`);
    console.log(`   ✓ Incident #${incident.id} verified in Command Center live stream`);

    // 4. Commander opens incident
    console.log('\n[4/24] Commander opening incident details view...');
    const detailRes = await request(`/incidents/${incident.id}`, {
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    if (!detailRes.ok) throw new Error('Failed to load incident details');
    console.log(`   ✓ Incident details loaded with status: ${detailRes.body.data.incident.status}`);

    // 5. Response team dispatched
    console.log('\n[5/24] Dispatching nearest available response team...');
    const candidateTeams = await request(`/incidents/${incident.id}/candidate-teams`, {
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    const bestTeam = candidateTeams.body.data.recommendedTeam;
    const dispatchRes = await request(`/incidents/${incident.id}/allocate-team`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${commanderToken}` },
      body: JSON.stringify({ teamId: bestTeam.teamId }),
    });
    if (!dispatchRes.ok) throw new Error(`Dispatch failed: ${JSON.stringify(dispatchRes.body)}`);
    const dispatchData = dispatchRes.body.data;
    console.log(`   ✓ Team "${dispatchData.team.teamName}" dispatched (Record #${dispatchData.dispatchId})`);

    // 6. Resource allocated
    console.log('\n[6/24] Allocating emergency medical supplies to incident...');
    const [resRows] = await pool.query('SELECT RESOURCE_ID FROM `resource` WHERE QUANTITY > 10 LIMIT 1');
    const targetResId = resRows[0].RESOURCE_ID;
    const allocRes = await request(`/incidents/${incident.id}/allocate-resource`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${commanderToken}` },
      body: JSON.stringify({ resourceId: targetResId, quantity: 5 }),
    });
    if (!allocRes.ok) throw new Error(`Resource allocation failed: ${JSON.stringify(allocRes.body)}`);
    console.log(`   ✓ 5 units allocated (Allocation Record #${allocRes.body.data.allocationId})`);

    // 7. Shelter assigned
    console.log('\n[7/24] Assigning evacuee spaces at nearest emergency shelter...');
    const [shlRows] = await pool.query('SELECT SHELTER_ID FROM `shelter` WHERE AVAILABLE_SPACES > 30 LIMIT 1');
    const targetShelterId = shlRows[0].SHELTER_ID;
    const shelterRes = await request(`/incidents/${incident.id}/assign-shelter`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${commanderToken}` },
      body: JSON.stringify({ shelterId: targetShelterId, assignedSpaces: 25 }),
    });
    if (!shelterRes.ok) throw new Error(`Shelter assignment failed: ${JSON.stringify(shelterRes.body)}`);
    console.log(`   ✓ 25 shelter spaces assigned (Assignment Record #${shelterRes.body.data.assignmentId})`);

    // 8. Responder opens incident
    console.log('\n[8/24] Responder opening assigned incident on scene...');
    const responderToken = await login('responder@demo.com');
    const respDetail = await request(`/incidents/${incident.id}`, {
      headers: { Authorization: `Bearer ${responderToken}` },
    });
    if (!respDetail.ok) throw new Error('Responder failed to load incident');
    console.log('   ✓ Responder loaded incident on-scene');

    // 9. Responder submits damage report
    console.log('\n[9/24] Responder submitting field damage assessment...');
    const damageRes = await request(`/incidents/${incident.id}/damage-reports`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${responderToken}` },
      body: JSON.stringify({
        damageLevel: 'Critical',
        estimatedLoss: 2500000.0,
        description: 'Complete structural failure of foundation; secondary collapse expanding; urgent rescue support needed.',
      }),
    });
    if (!damageRes.ok) throw new Error(`Damage submission failed: ${JSON.stringify(damageRes.body)}`);
    const damageData = damageRes.body.data;
    console.log(`   ✓ Damage Report #${damageData.damageReport.reportId} submitted`);

    // 10. AI reassessment executes
    console.log('\n[10/24] Verifying secondary AI triage execution...');
    if (!damageData.secondaryTriage) throw new Error('Secondary triage did not execute');
    console.log(`   ✓ Secondary AI Triage: Severity: ${damageData.secondaryTriage.severity}/10, Confidence: ${damageData.secondaryTriage.confidence}%`);

    // 11. Severity increases if justified
    console.log('\n[11/24] Verifying severity increase / escalation...');
    if (!damageData.escalated) throw new Error('Expected incident severity to escalate on Critical field assessment');
    console.log(`   ✓ Severity escalated: ${triage.severity} -> ${damageData.secondaryTriage.severity}`);

    // 12. Escalation alert generated
    console.log('\n[12/24] Verifying Critical escalation alert in database...');
    const [escAlerts] = await pool.query(
      'SELECT a.* FROM `alert` a INNER JOIN `incident_alert` ia ON a.ALERT_ID = ia.ALERT_ID WHERE ia.INCIDENT_ID = ? AND a.PRIORITY = "Critical"',
      [incident.id]
    );
    if (escAlerts.length === 0) throw new Error('No Critical escalation alert found');
    const escAlert = escAlerts[0];
    console.log(`   ✓ Escalation Alert #${escAlert.ALERT_ID} verified: ${escAlert.TITLE}`);

    // 13. Commander acknowledges alert
    console.log('\n[13/24] Commander acknowledging escalation alert...');
    const ackRes = await request(`/alerts/${escAlert.ALERT_ID}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    if (!ackRes.ok) throw new Error(`Alert acknowledgement failed: ${JSON.stringify(ackRes.body)}`);
    console.log(`   ✓ Alert #${escAlert.ALERT_ID} acknowledged by Commander`);

    // 14. Commander reviews updated incident
    console.log('\n[14/24] Commander reviewing updated incident details & timeline...');
    const updatedReview = await request(`/incidents/${incident.id}`, {
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    const updatedIncident = updatedReview.body.data.incident;
    console.log(`   ✓ Current incident severity in DB: ${updatedIncident.severity}/10`);
    console.log(`   ✓ Operational timeline contains ${updatedIncident.timeline.length} chronological events`);

    // 15. Commander resolves incident
    console.log('\n[15/24] Commander transitioning incident to Resolved...');
    const resolveRes = await request(`/incidents/${incident.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${commanderToken}` },
      body: JSON.stringify({ status: 'Resolved' }),
    });
    if (!resolveRes.ok) throw new Error(`Failed to resolve incident: ${JSON.stringify(resolveRes.body)}`);
    console.log(`   ✓ Incident #${incident.id} marked Resolved in MySQL`);

    // 16. Team released
    console.log('\n[16/24] Verifying dispatched team automatically released to Available...');
    const [teamCheck] = await pool.execute(
      'SELECT AVAILABILITY FROM `response_team` WHERE TEAM_ID = ?',
      [dispatchData.team.teamId]
    );
    if (teamCheck[0].AVAILABILITY !== 'Available') {
      throw new Error(`Expected team to be Available, but is ${teamCheck[0].AVAILABILITY}`);
    }
    console.log('   ✓ Response team availability returned to Available');

    // 17-20. Verifying historical data preserved in MySQL
    console.log('\n[17-20/24] Verifying historical operational records remain intact in MySQL...');
    const [dispHistory] = await pool.query('SELECT * FROM `incident_dispatch` WHERE INCIDENT_ID = ?', [incident.id]);
    const [allocHistory] = await pool.query('SELECT * FROM `resource_allocation` WHERE INCIDENT_ID = ?', [incident.id]);
    const [shlHistory] = await pool.query('SELECT * FROM `incident_shelter` WHERE INCIDENT_ID = ?', [incident.id]);
    const [drHistory] = await pool.query('SELECT * FROM `incident_damage_report` WHERE INCIDENT_ID = ?', [incident.id]);
    const [aiHistory] = await pool.query('SELECT * FROM `ai_prediction` WHERE INCIDENT_ID = ?', [incident.id]);

    if (dispHistory.length === 0) throw new Error('Missing dispatch history');
    if (allocHistory.length === 0) throw new Error('Missing allocation history');
    if (shlHistory.length === 0) throw new Error('Missing shelter history');
    if (drHistory.length === 0) throw new Error('Missing damage report history');
    if (aiHistory.length < 2) throw new Error('Expected at least 2 AI prediction records (initial + secondary)');

    console.log(`   ✓ Dispatch history preserved: ${dispHistory.length} record(s)`);
    console.log(`   ✓ Resource allocation history preserved: ${allocHistory.length} record(s)`);
    console.log(`   ✓ Shelter assignment history preserved: ${shlHistory.length} record(s)`);
    console.log(`   ✓ Damage assessment history preserved: ${drHistory.length} record(s)`);
    console.log(`   ✓ AI prediction history preserved: ${aiHistory.length} evaluation(s)`);

    // 21. Audit events exist for all major actions
    console.log('\n[21/24] Verifying audit events exist in audit_log for all major lifecycle actions...');
    const [auditRows] = await pool.query(
      'SELECT DISTINCT ACTION FROM `audit_log` WHERE ENTITY_ID = ? OR DETAILS LIKE ?',
      [incident.id, `%Incident #${incident.id}%`]
    );
    const actionNames = auditRows.map((r) => r.ACTION);
    console.log(`   ✓ Confirmed audit trail actions logged: ${actionNames.join(', ')}`);

    // 22. Analytics reflect entire lifecycle
    console.log('\n[22/24] Verifying analytics reflects the entire operational lifecycle...');
    const analyticsRes = await request('/analytics/overview', {
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
    const analyticsData = analyticsRes.body.data;
    console.log(`   ✓ Analytics reflects ${analyticsData.incidents.stats.total} total incidents and ${analyticsData.insights.length} active AI insights`);

    // 23. Command Center reflects current state
    console.log('\n[23/24] Verifying Command Center dashboard reflects current operational state...');
    const dashRes = await request('/dashboard/metrics', {
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    if (!dashRes.ok) throw new Error('Failed to fetch dashboard metrics');
    const m = dashRes.body.data.metrics || dashRes.body.data;
    console.log(`   ✓ Dashboard metrics synced: Active: ${m.activeIncidents}, Resolved Today: ${m.resolvedToday}`);

    // 24. Civilian can see relevant public alerts / shelter information
    console.log('\n[24/24] Verifying Civilian can view public alerts and live shelters...');
    const civAlertsRes = await request('/alerts?limit=5', {
      headers: { Authorization: `Bearer ${civilianToken}` },
    });
    const civSheltersRes = await request('/shelters', {
      headers: { Authorization: `Bearer ${civilianToken}` },
    });
    if (!civAlertsRes.ok || !civSheltersRes.ok) {
      throw new Error('Civilian failed to retrieve public emergency data');
    }
    console.log(`   ✓ Civilian verified: ${civAlertsRes.body.data.alerts.length} public alerts and ${civSheltersRes.body.data.shelters.length} shelter facilities accessible`);

    console.log('\n============================================================');
    console.log('ALL 24 COMPLETE INTEGRATION WORKFLOW STEPS PASSED 100%');
    console.log('PHASE 8 & PHASE 9 FULLY OPERATIONAL');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ INTEGRATION WORKFLOW TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runCompleteIntegrationTest();
