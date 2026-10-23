const { pool } = require('../db');
const incidentRepository = require('../db/incidentRepository');
const responseTeamRepository = require('../db/responseTeamRepository');
const incidentDispatchRepository = require('../db/incidentDispatchRepository');
const { calculateDistance } = require('./haversineService');
const { createError } = require('../middleware/errorHandler');

/**
 * Specialization Matching Map
 * Maps disaster types to primary matching team specializations.
 */
const SPECIALIZATION_MAP = {
  'Building Collapse': ['Urban Search & Rescue', 'Technical Rescue'],
  'Earthquake': ['Urban Search & Rescue', 'Technical Rescue', 'Medical Response'],
  'Chemical Leak': ['Hazmat'],
  'Industrial Accident': ['Hazmat', 'Technical Rescue'],
  'Flood': ['Flood Rescue'],
  'Tsunami': ['Flood Rescue', 'Urban Search & Rescue'],
  'Wildfire': ['Wildfire Response'],
  'Tornado': ['Urban Search & Rescue', 'Medical Response'],
  'Hurricane': ['Flood Rescue', 'Urban Search & Rescue'],
  'Landslide': ['Technical Rescue', 'Urban Search & Rescue'],
  'Power Outage': ['Technical Rescue'],
  'Other': ['Urban Search & Rescue', 'Medical Response'],
};

/**
 * Check if team specialization matches the incident type.
 */
function isSpecializationMatch(incidentType, teamSpecialization) {
  const preferred = SPECIALIZATION_MAP[incidentType] || [];
  const teamSpec = (teamSpecialization || '').toLowerCase();
  return preferred.some((p) => teamSpec.includes(p.toLowerCase()));
}

/**
 * Get candidate response teams ranked by distance & specialization match.
 */
async function getCandidateTeams(incidentId) {
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    throw createError('Incident not found', 404);
  }

  const availableTeams = await responseTeamRepository.findAvailable();
  if (!availableTeams || availableTeams.length === 0) {
    return {
      incident,
      candidates: [],
      message: 'No response teams currently available.',
    };
  }

  const incLat = Number(incident.latitude);
  const incLon = Number(incident.longitude);

  const candidates = availableTeams.map((team) => {
    let distanceKm = 0;
    try {
      distanceKm = calculateDistance(incLat, incLon, Number(team.latitude), Number(team.longitude));
    } catch (e) {
      distanceKm = 999.0;
    }

    const matchesSpec = isSpecializationMatch(incident.incidentType, team.specialization);

    return {
      teamId: team.id,
      teamName: team.name,
      leader: team.leader,
      specialization: team.specialization,
      availability: team.availability,
      latitude: team.latitude,
      longitude: team.longitude,
      distanceKm,
      isSpecializationMatch: matchesSpec,
      recommendationScore: (matchesSpec ? 100 : 0) - distanceKm,
    };
  });

  // Sort by recommendation (specialization match prioritized, then shortest distance)
  candidates.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return {
    incident,
    candidates,
    recommendedTeam: candidates[0] || null,
  };
}

/**
 * Allocate & Deploy a team to an incident within an atomic MySQL transaction.
 */
async function allocateTeam(incidentId, requestedTeamId = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verify Incident Exists
    const [incRows] = await connection.execute(
      'SELECT INCIDENT_ID AS id, INCIDENT_TYPE AS incidentType, LATITUDE AS latitude, LONGITUDE AS longitude, STATUS AS status FROM `incident` WHERE INCIDENT_ID = ? FOR UPDATE',
      [incidentId]
    );
    if (!incRows[0]) {
      throw createError('Incident not found', 404);
    }
    const incident = incRows[0];

    // 2. Select Team (Either requested or auto-selected nearest available)
    let selectedTeamId = requestedTeamId;

    if (!selectedTeamId) {
      const candidatesData = await getCandidateTeams(incidentId);
      if (!candidatesData.recommendedTeam) {
        throw createError('No available response teams found to dispatch.', 400);
      }
      selectedTeamId = candidatesData.recommendedTeam.teamId;
    }

    // 3. Lock and Verify Team is Available
    const [teamRows] = await connection.execute(
      'SELECT TEAM_ID AS id, TEAM_NAME AS name, LEADER AS leader, SPECIALIZATION AS specialization, AVAILABILITY AS availability, LATITUDE AS latitude, LONGITUDE AS longitude FROM `response_team` WHERE TEAM_ID = ? FOR UPDATE',
      [selectedTeamId]
    );

    if (!teamRows[0]) {
      throw createError('Response team not found', 404);
    }

    const team = teamRows[0];
    if (team.availability.toLowerCase() !== 'available') {
      throw createError(`Response team "${team.name}" is already ${team.availability}. Cannot dispatch.`, 409);
    }

    // 4. Calculate Distance
    let distanceKm = 0;
    try {
      distanceKm = calculateDistance(
        Number(incident.latitude),
        Number(incident.longitude),
        Number(team.latitude),
        Number(team.longitude)
      );
    } catch (e) {
      distanceKm = 0.0;
    }

    // 5. Create Incident Dispatch Record
    const dispatch = await incidentDispatchRepository.createDispatch(
      {
        incidentId,
        teamId: selectedTeamId,
        dispatchTime: new Date(),
        status: 'Deployed',
      },
      connection
    );

    // 6. Update Team Status to 'Deployed'
    await connection.execute(
      'UPDATE `response_team` SET AVAILABILITY = ? WHERE TEAM_ID = ?',
      ['Deployed', selectedTeamId]
    );

    // 7. Update Incident Status to 'Active' if it was 'Reported' or 'Triaged'
    if (incident.status === 'Reported' || incident.status === 'Triaged') {
      await connection.execute(
        'UPDATE `incident` SET STATUS = ? WHERE INCIDENT_ID = ?',
        ['Active', incidentId]
      );
    }

    await connection.commit();

    const auditService = require('./auditService');
    await auditService.recordAuditEvent({
      action: 'TEAM_DISPATCHED',
      entityType: 'incident_dispatch',
      entityId: dispatch.dispatchId,
      details: `Team "${team.name}" dispatched to Incident #${incidentId} (${distanceKm.toFixed(2)} km away)`,
    });

    return {
      incidentId,
      dispatchId: dispatch.dispatchId,
      team: {
        teamId: team.id,
        teamName: team.name,
        leader: team.leader,
        specialization: team.specialization,
      },
      distanceKm,
      status: 'Deployed',
      dispatchTime: dispatch.dispatchTime,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Release all teams currently deployed to an incident (triggered upon resolution).
 */
async function releaseTeamsForIncident(incidentId, connection = pool) {
  // Find all active dispatches for this incident
  const [activeDispatches] = await connection.execute(
    'SELECT TEAM_ID AS teamId FROM `incident_dispatch` WHERE INCIDENT_ID = ? AND STATUS = ?',
    [incidentId, 'Deployed']
  );

  if (activeDispatches.length === 0) return 0;

  // Mark dispatches as 'Released'
  await connection.execute(
    'UPDATE `incident_dispatch` SET STATUS = ? WHERE INCIDENT_ID = ? AND STATUS = ?',
    ['Released', incidentId, 'Deployed']
  );

    for (const d of activeDispatches) {
    await connection.execute(
      'UPDATE `response_team` SET AVAILABILITY = ? WHERE TEAM_ID = ?',
      ['Available', d.teamId]
    );
  }

  const auditService = require('./auditService');
  await auditService.recordAuditEvent({
    action: 'TEAM_RELEASED',
    entityType: 'incident_dispatch',
    entityId: incidentId,
    details: `${activeDispatches.length} deployed team(s) released for Incident #${incidentId}`,
  });

  return activeDispatches.length;
}

module.exports = {
  getCandidateTeams,
  allocateTeam,
  releaseTeamsForIncident,
  isSpecializationMatch,
};
