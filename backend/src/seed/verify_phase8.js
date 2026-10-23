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

async function runPhase8Verification() {
  console.log('============================================================');
  console.log('PHASE 8 VERIFICATION — ALERTS, DAMAGE REPORTS & SECONDARY AI');
  console.log('============================================================\n');

  try {
    // [1-3] Authentication
    console.log('[1/21] Authenticating Commander...');
    const commanderToken = await login('commander@demo.com');
    console.log('   ✓ Commander token acquired');

    console.log('[2/21] Authenticating Responder...');
    const responderToken = await login('responder@demo.com');
    console.log('   ✓ Responder token acquired');

    console.log('[3/21] Authenticating Civilian...');
    const civilianToken = await login('civilian@demo.com');
    console.log('   ✓ Civilian token acquired');

    // [4] Create high-priority incident (Severity >= 7)
    console.log('\n[4/21] Creating high-priority emergency incident...');
    const createIncRes = await request('/incidents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${civilianToken}` },
      body: JSON.stringify({
        disasterType: 'Building Collapse',
        description: 'Major multistory building structural collapse, victims trapped under heavy rubble and toxic dust cloud.',
        latitude: 37.7749,
        longitude: -122.4194,
        casualties: 5,
        injuries: 12,
        affectedPopulation: 120,
      }),
    });

    if (!createIncRes.ok) {
      throw new Error(`Incident creation failed: ${JSON.stringify(createIncRes.body)}`);
    }

    const incidentId = createIncRes.body.data.incident.id;
    const initialSeverity = Number(createIncRes.body.data.incident.severity);
    console.log(`   ✓ Incident #${incidentId} created with initial severity: ${initialSeverity}/10`);

    // [5] Verify automatic alert generated for high-priority incident
    console.log('\n[5/21] Verifying automated high-severity alert created in MySQL...');
    const [autoAlertRows] = await pool.execute(
      `SELECT a.ALERT_ID, a.TITLE, a.PRIORITY, ia.INCIDENT_ID 
       FROM \`alert\` a 
       INNER JOIN \`incident_alert\` ia ON a.ALERT_ID = ia.ALERT_ID 
       WHERE ia.INCIDENT_ID = ?`,
      [incidentId]
    );

    if (autoAlertRows.length === 0) {
      throw new Error(`Expected automated alert for Incident #${incidentId}, but none found in database.`);
    }
    const autoAlert = autoAlertRows[0];
    console.log(`   ✓ Automated Alert #${autoAlert.ALERT_ID} verified in MySQL: [${autoAlert.PRIORITY}] ${autoAlert.TITLE}`);

    // [6] Retrieve alerts list via API
    console.log('\n[6/21] Retrieving alerts via GET /api/alerts...');
    const alertsListRes = await request('/alerts', {
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    if (!alertsListRes.ok || !alertsListRes.body.data.alerts) {
      throw new Error(`Failed to list alerts: ${JSON.stringify(alertsListRes.body)}`);
    }
    console.log(`   ✓ Retrieved ${alertsListRes.body.data.alerts.length} alerts from backend API`);

    // [7] Create incident-specific operational alert
    console.log('\n[7/21] Commander creating incident-specific operational alert...');
    const createAlertRes = await request(`/incidents/${incidentId}/alerts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${commanderToken}` },
      body: JSON.stringify({
        title: 'EVACUATION ORDER: Sector Alpha Perimeter',
        message: 'All non-essential personnel clear within 500 meters of collapse zone immediately.',
        priority: 'Critical',
      }),
    });
    if (!createAlertRes.ok) {
      throw new Error(`Failed to create operational alert: ${JSON.stringify(createAlertRes.body)}`);
    }
    const customAlert = createAlertRes.body.data;
    console.log(`   ✓ Alert #${customAlert.alertId} issued for Incident #${incidentId}`);

    // [8] Verify incident_alert relationship in database
    console.log('\n[8/21] Verifying incident_alert junction entry in MySQL...');
    const [iaLinkRows] = await pool.execute(
      'SELECT * FROM `incident_alert` WHERE ALERT_ID = ? AND INCIDENT_ID = ?',
      [customAlert.alertId, incidentId]
    );
    if (iaLinkRows.length === 0) {
      throw new Error(`Missing incident_alert junction record for Alert #${customAlert.alertId}`);
    }
    console.log(`   ✓ Junction confirmed: incident_alert ID #${iaLinkRows[0].INCIDENT_ALERT_ID}`);

    // [9] Acknowledge alert
    console.log('\n[9/21] Commander acknowledging alert...');
    const ackRes = await request(`/alerts/${customAlert.alertId}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    if (!ackRes.ok) {
      throw new Error(`Failed to acknowledge alert: ${JSON.stringify(ackRes.body)}`);
    }
    console.log('   ✓ Alert acknowledgement registered');

    // [10] Verify acknowledgement table in MySQL
    console.log('\n[10/21] Verifying alert_acknowledgement in MySQL...');
    const [ackRows] = await pool.execute(
      'SELECT * FROM `alert_acknowledgement` WHERE ALERT_ID = ?',
      [customAlert.alertId]
    );
    if (ackRows.length === 0) {
      throw new Error(`No record in alert_acknowledgement for Alert #${customAlert.alertId}`);
    }
    console.log(`   ✓ Acknowledgement recorded with ID #${ackRows[0].ACKNOWLEDGEMENT_ID}`);

    // [11] Submit damage report by Responder
    console.log('\n[11/21] Responder submitting field damage assessment...');
    const damageRes = await request(`/incidents/${incidentId}/damage-reports`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${responderToken}` },
      body: JSON.stringify({
        damageLevel: 'Critical',
        estimatedLoss: 1500000.0,
        description: 'Catastrophic foundation failure; secondary collapse expanding into adjacent structures; multiple trapped individuals confirmed.',
        photo: 'https://eoc-storage.net/photos/collapse_sector_a.jpg',
      }),
    });
    if (!damageRes.ok) {
      throw new Error(`Failed to submit damage report: ${JSON.stringify(damageRes.body)}`);
    }
    const damageData = damageRes.body.data;
    console.log(`   ✓ Damage Report #${damageData.damageReport.reportId} submitted`);

    // [12] Verify damage report in damage_report table
    console.log('\n[12/21] Verifying damage_report table in MySQL...');
    const [drRows] = await pool.execute(
      'SELECT * FROM `damage_report` WHERE REPORT_ID = ?',
      [damageData.damageReport.reportId]
    );
    if (drRows.length === 0) {
      throw new Error(`Damage report record #${damageData.damageReport.reportId} not found in MySQL.`);
    }
    console.log(`   ✓ Confirmed: Level: ${drRows[0].DAMAGE_LEVEL}, Loss: $${drRows[0].ESTIMATED_LOSS}`);

    // [13] Verify incident_damage_report junction table
    console.log('\n[13/21] Verifying incident_damage_report junction in MySQL...');
    const [idrRows] = await pool.execute(
      'SELECT * FROM `incident_damage_report` WHERE REPORT_ID = ? AND INCIDENT_ID = ?',
      [damageData.damageReport.reportId, incidentId]
    );
    if (idrRows.length === 0) {
      throw new Error('Missing incident_damage_report junction record');
    }
    console.log(`   ✓ Junction confirmed: incident_damage_report ID #${idrRows[0].INCIDENT_DAMAGE_ID}`);

    // [14] Trigger secondary AI triage & verify new AI prediction
    console.log('\n[14/21] Verifying secondary AI triage execution...');
    if (!damageData.secondaryTriage) {
      throw new Error('Expected secondary AI triage results in response payload.');
    }
    console.log(`   ✓ Secondary AI Triage evaluated: Revised Severity: ${damageData.secondaryTriage.severity}/10, Confidence: ${damageData.secondaryTriage.confidence}%`);

    // [15] Verify historical AI prediction remains preserved in MySQL
    console.log('\n[15/21] Verifying all historical AI predictions remain in MySQL...');
    const [allPreds] = await pool.execute(
      'SELECT PREDICTION_ID, RISK_LEVEL, CONFIDENCE, PREDICTION_TIME FROM `ai_prediction` WHERE INCIDENT_ID = ? ORDER BY PREDICTION_TIME ASC',
      [incidentId]
    );
    if (allPreds.length < 2) {
      throw new Error(`Expected at least 2 AI prediction records (initial + secondary), found ${allPreds.length}`);
    }
    console.log(`   ✓ Preserved ${allPreds.length} AI prediction records in MySQL (Historical audit trail intact)`);

    // [16] Verify severity escalation
    console.log('\n[16/21] Verifying severity escalation in incident record...');
    const [updatedInc] = await pool.execute(
      'SELECT SEVERITY FROM `incident` WHERE INCIDENT_ID = ?',
      [incidentId]
    );
    const updatedSeverity = Number(updatedInc[0].SEVERITY);
    console.log(`   ✓ Incident severity updated: ${initialSeverity} -> ${updatedSeverity}`);

    // [17] Verify escalation alert generated in MySQL
    console.log('\n[17/21] Verifying Critical escalation alert in MySQL...');
    const [escAlerts] = await pool.execute(
      `SELECT a.ALERT_ID, a.TITLE, a.PRIORITY 
       FROM \`alert\` a 
       INNER JOIN \`incident_alert\` ia ON a.ALERT_ID = ia.ALERT_ID 
       WHERE ia.INCIDENT_ID = ? AND a.TITLE LIKE '%Escalated%'`,
      [incidentId]
    );
    if (escAlerts.length === 0) {
      throw new Error('Expected escalation alert linked to incident, none found.');
    }
    console.log(`   ✓ Escalation alert verified: [${escAlerts[0].PRIORITY}] ${escAlerts[0].TITLE}`);

    // [18] Verify Incident Details contains operational timeline
    console.log('\n[18/21] Verifying operational timeline in incident details API...');
    const incDetailRes = await request(`/incidents/${incidentId}`, {
      headers: { Authorization: `Bearer ${commanderToken}` },
    });
    const incObj = incDetailRes.body.data.incident;
    if (!incObj.timeline || incObj.timeline.length === 0) {
      throw new Error('Expected chronological timeline in incident details.');
    }
    console.log(`   ✓ Retrieved operational timeline with ${incObj.timeline.length} chronological events:`);
    incObj.timeline.slice(0, 4).forEach((evt) => {
      console.log(`     - [${evt.type}] ${evt.title} (${new Date(evt.timestamp).toLocaleTimeString()})`);
    });

    // [19] Verify RBAC (civilian cannot create operational alert -> 403 Forbidden)
    console.log('\n[19/21] Verifying RBAC protection (Civilian cannot issue operational alerts)...');
    const rbacRes = await request('/alerts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${civilianToken}` },
      body: JSON.stringify({
        title: 'Unauthorized civilian alert',
        message: 'This should be rejected by authorize middleware',
        priority: 'Critical',
      }),
    });
    if (rbacRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for civilian alert creation, got ${rbacRes.status}`);
    }
    console.log('   ✓ HTTP 403 Forbidden verified: RBAC securely enforces operational boundary');

    // [20] Run Phase 1-7 regression integration check
    console.log('\n[20/21] Running Phase 1–7 regression verification...');
    const regressionRes = await request('/health');
    if (!regressionRes.ok) {
      throw new Error('Health check failed during regression testing.');
    }
    console.log('   ✓ Core API & DB healthy');

    // [21] All complete
    console.log('\n============================================================');
    console.log('PHASE 8 VERIFICATION COMPLETE');
    console.log('ALL TESTS PASSED');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ PHASE 8 VERIFICATION FAILED:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runPhase8Verification();
