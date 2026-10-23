const { pool } = require('../db');
const { createIncident } = require('../services/incidentService');
const { recordAuditEvent } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/demo/status
 * Returns operational readiness & statistics for presentation demo mode
 */
const getDemoStatus = asyncHandler(async (req, res) => {
  const [incidents] = await pool.query('SELECT COUNT(*) AS count FROM `incident`');
  const [activeIncidents] = await pool.query("SELECT COUNT(*) AS count FROM `incident` WHERE STATUS != 'Resolved'");
  const [teams] = await pool.query('SELECT COUNT(*) AS count FROM `response_team`');
  const [availableTeams] = await pool.query("SELECT COUNT(*) AS count FROM `response_team` WHERE AVAILABILITY = 'Available'");
  const [resources] = await pool.query('SELECT COUNT(*) AS count FROM `resource`');
  const [shelters] = await pool.query('SELECT COUNT(*) AS count FROM `shelter`');
  const [alerts] = await pool.query('SELECT COUNT(*) AS count FROM `alert`');
  const [auditLogs] = await pool.query('SELECT COUNT(*) AS count FROM `audit_log`');

  return sendSuccess(res, {
    ready: true,
    scenarioName: 'Building Collapse — High Priority Emergency',
    status: 'Ready',
    metrics: {
      totalIncidents: incidents[0].count,
      activeIncidents: activeIncidents[0].count,
      totalTeams: teams[0].count,
      availableTeams: availableTeams[0].count,
      totalResources: resources[0].count,
      totalShelters: shelters[0].count,
      totalAlerts: alerts[0].count,
      totalAuditLogs: auditLogs[0].count,
    },
    demoAccounts: [
      { role: 'civilian', email: 'civilian@demo.com', label: 'Civilian Demo' },
      { role: 'responder', email: 'responder@demo.com', label: 'Field Responder Demo' },
      { role: 'commander', email: 'commander@demo.com', label: 'Incident Commander Demo' },
      { role: 'admin', email: 'admin@demo.com', label: 'System Administrator Demo' },
    ],
  }, 'Demo environment status retrieved.');
});

/**
 * POST /api/demo/load-scenario
 * Injects the canonical "Building Collapse — High Priority Emergency" scenario
 */
const loadBuildingCollapseScenario = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 1;

  const scenarioPayload = {
    disasterType: 'Building Collapse',
    description: 'Major structural collapse reported downtown. Multiple people trapped under concrete debris. Fire and severe structural damage expanding.',
    latitude: 34.0522,
    longitude: -118.2437,
    affectedPopulation: 150,
    casualties: 3,
    injuries: 12,
    damageIndicators: ['trapped', 'collapse', 'fire', 'structural damage'],
  };

  const result = await createIncident(scenarioPayload, userId);

  await recordAuditEvent({
    userId,
    action: 'DEMO_SCENARIO_LOADED',
    entityType: 'incident',
    entityId: result.incident.id,
    details: `Demo scenario "Building Collapse" loaded with severity ${result.triage.severity}/10 for presentation demonstration`,
  });

  return sendSuccess(res, {
    scenario: 'Building Collapse',
    incident: result.incident,
    prediction: result.prediction,
    triage: result.triage,
    message: 'Canonical Building Collapse high-priority scenario successfully loaded.',
  }, 'Scenario loaded successfully.', 201);
});

/**
 * POST /api/demo/reset
 * Resets response teams, resource stocks, and shelters to clean demo baselines
 */
const resetDemoBaseline = asyncHandler(async (req, res) => {
  const { confirm } = req.body;
  if (!confirm) {
    return sendError(res, 'Confirmation required to reset demo baseline (confirm: true).', 400);
  }

  // 1. Reset response teams availability to Available
  await pool.query("UPDATE `response_team` SET AVAILABILITY = 'Available'");

  // 2. Reset resource inventory to standard demonstration quantities
  const resourceResets = [
    { id: 1, qty: 150, avail: 'Available' },
    { id: 2, qty: 500, avail: 'Available' },
    { id: 3, qty: 350, avail: 'Available' },
    { id: 4, qty: 18, avail: 'Low Stock' },
    { id: 5, qty: 12, avail: 'Low Stock' },
    { id: 6, qty: 800, avail: 'Available' },
    { id: 7, qty: 65, avail: 'Available' },
    { id: 8, qty: 0, avail: 'Depleted' },
    { id: 9, qty: 5, avail: 'Low Stock' },
  ];
  for (const r of resourceResets) {
    await pool.execute('UPDATE `resource` SET QUANTITY = ?, AVAILABILITY = ? WHERE RESOURCE_ID = ?', [r.qty, r.avail, r.id]);
  }

  // 3. Reset shelter capacities
  const shelterResets = [
    { id: 1, avail: 1050 },
    { id: 2, avail: 520 },
    { id: 3, avail: 80 },
    { id: 4, avail: 0 },
    { id: 5, avail: 450 },
    { id: 6, avail: 280 },
  ];
  for (const s of shelterResets) {
    await pool.execute('UPDATE `shelter` SET AVAILABLE_SPACES = ? WHERE SHELTER_ID = ?', [s.avail, s.id]);
  }

  await recordAuditEvent({
    userId: req.user?.id,
    action: 'DEMO_ENVIRONMENT_RESET',
    entityType: 'system',
    entityId: null,
    details: 'Demo environment operational baselines (teams, resource stocks, shelter capacities) reset to pristine state',
  });

  return sendSuccess(res, {
    message: 'Operational resources, teams, and shelters have been reset to pristine baseline.',
  }, 'Demo environment reset complete.');
});

module.exports = {
  getDemoStatus,
  loadBuildingCollapseScenario,
  resetDemoBaseline,
};
