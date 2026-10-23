const { pool } = require('../db');
const shelterRepository = require('../db/shelterRepository');
const incidentShelterRepository = require('../db/incidentShelterRepository');
const incidentRepository = require('../db/incidentRepository');
const { calculateDistance } = require('./haversineService');
const { createError } = require('../middleware/errorHandler');

/**
 * Deterministic service-level shelter coordinate mapping for Los Angeles metro
 */
const SHELTER_COORDINATES = {
  1: { latitude: 34.0407, longitude: -118.2690 }, // Downtown Arena
  2: { latitude: 34.2198, longitude: -118.4410 }, // North Valley
  3: { latitude: 34.0392, longitude: -118.4526 }, // Westside Civic
  4: { latitude: 33.7291, longitude: -118.2862 }, // Harbor District
  5: { latitude: 34.0345, longitude: -118.2098 }, // Eastside Athletic
  6: { latitude: 33.8271, longitude: -118.2912 }, // South Bay Transit
};

function getShelterCoordinates(shelterId) {
  return SHELTER_COORDINATES[shelterId] || { latitude: 34.0522, longitude: -118.2437 };
}

async function getShelters(params = {}) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 50));
  const offset = (page - 1) * limit;

  const { shelters, total } = await shelterRepository.findAll({
    search: params.search,
    location: params.location,
    availability: params.availability,
    limit,
    offset,
  });

  const enriched = shelters.map((s) => ({
    ...s,
    coordinates: getShelterCoordinates(s.id),
  }));

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    shelters: enriched,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

async function getShelterById(id) {
  const shelter = await shelterRepository.findById(id);
  if (!shelter) {
    throw createError('Shelter not found', 404);
  }
  return {
    ...shelter,
    coordinates: getShelterCoordinates(shelter.id),
  };
}

async function getShelterMetrics() {
  return await shelterRepository.getMetrics();
}

/**
 * Smart Candidate Shelter Routing
 * Calculates Haversine distance, checks available capacity, and ranks suitable shelters.
 */
async function getCandidateShelters(incidentId) {
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    throw createError('Incident not found', 404);
  }

  const { shelters } = await shelterRepository.findAll({ limit: 100 });
  const incLat = Number(incident.latitude);
  const incLon = Number(incident.longitude);

  const candidates = shelters.map((shelter) => {
    const coords = getShelterCoordinates(shelter.id);
    let distanceKm = 0;
    try {
      distanceKm = calculateDistance(incLat, incLon, coords.latitude, coords.longitude);
    } catch (e) {
      distanceKm = 999.0;
    }

    const hasCapacity = shelter.availableSpaces > 0;
    const occupancyRate = shelter.capacity > 0 
      ? Math.round(((shelter.capacity - shelter.availableSpaces) / shelter.capacity) * 100)
      : 100;

    return {
      shelterId: shelter.id,
      shelterName: shelter.name,
      location: shelter.location,
      capacity: shelter.capacity,
      availableSpaces: shelter.availableSpaces,
      occupancyRate,
      status: shelter.computedStatus,
      distanceKm,
      hasCapacity,
      coordinates: coords,
      // Ranking score: capacity priority, then proximity
      recommendationScore: (hasCapacity ? 100 : -100) - distanceKm,
    };
  });

  // Rank by suitability (sufficient capacity, shortest distance)
  candidates.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return {
    incident,
    candidates,
    recommendedShelter: candidates.find((c) => c.hasCapacity) || candidates[0] || null,
  };
}

/**
 * Transactional Shelter Capacity Assignment
 * Reserves spaces atomically with SELECT ... FOR UPDATE.
 */
async function assignShelter(incidentId, { shelterId, assignedSpaces }) {
  const spaces = parseInt(assignedSpaces, 10);
  if (isNaN(spaces) || spaces <= 0) {
    throw createError('assignedSpaces must be a positive integer greater than zero.', 400);
  }

  if (!shelterId) {
    throw createError('shelterId is required.', 400);
  }

  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    throw createError('Incident not found', 404);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lock and inspect shelter
    const [rows] = await connection.execute(
      'SELECT SHELTER_ID AS id, SHELTER_NAME AS name, CAPACITY AS capacity, AVAILABLE_SPACES AS availableSpaces, LOCATION AS location FROM `shelter` WHERE SHELTER_ID = ? FOR UPDATE',
      [shelterId]
    );

    if (!rows[0]) {
      throw createError('Shelter not found', 404);
    }

    const shelter = rows[0];

    // 2. Validate sufficient capacity
    if (spaces > shelter.availableSpaces) {
      throw createError(
        `Shelter does not have enough capacity. Requested ${spaces} spaces but only ${shelter.availableSpaces} available.`,
        409
      );
    }

    const newAvailable = shelter.availableSpaces - spaces;

    // 3. Decrement available spaces
    await connection.execute(
      'UPDATE `shelter` SET AVAILABLE_SPACES = ? WHERE SHELTER_ID = ?',
      [newAvailable, shelterId]
    );

    // 4. Create incident_shelter assignment record
    const assignment = await incidentShelterRepository.createAssignment(
      {
        incidentId,
        shelterId,
        assignedSpaces: spaces,
        assignedTime: new Date(),
        status: 'Assigned',
      },
      connection
    );

    await connection.commit();

    // Trigger shelter capacity alerts if applicable
    const alertService = require('./alertService');
    if (newAvailable === 0) {
      await alertService.createSystemAlertIfNeeded('SHELTER_FULL', {
        shelterName: shelter.name,
        capacity: shelter.capacity,
        availableSpaces: 0,
        location: shelter.location,
      });
    } else if (newAvailable <= Math.floor(shelter.capacity * 0.15)) {
      await alertService.createSystemAlertIfNeeded('SHELTER_NEAR_CAPACITY', {
        shelterName: shelter.name,
        capacity: shelter.capacity,
        availableSpaces: newAvailable,
        location: shelter.location,
      });
    }

    const auditService = require('./auditService');
    await auditService.recordAuditEvent({
      action: 'SHELTER_ASSIGNED',
      entityType: 'incident_shelter',
      entityId: assignment.assignmentId,
      details: `${spaces} evacuee spaces assigned at "${shelter.name}" for Incident #${incidentId}`,
    });

    return {
      assignmentId: assignment.assignmentId,
      incidentId,
      shelter: {
        shelterId: shelter.id,
        shelterName: shelter.name,
        capacity: shelter.capacity,
        location: shelter.location,
      },
      assignedSpaces: spaces,
      remainingAvailableSpaces: newAvailable,
      status: 'Assigned',
      assignedTime: assignment.assignedTime,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Transactional Shelter Release
 * Returns assigned spaces back to shelter and marks assignment Released.
 */
async function releaseShelterAssignment(assignmentId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lock and inspect assignment
    const [assignRows] = await connection.execute(
      'SELECT ASSIGNMENT_ID AS assignmentId, INCIDENT_ID AS incidentId, SHELTER_ID AS shelterId, ASSIGNED_SPACES AS assignedSpaces, STATUS AS status FROM `incident_shelter` WHERE ASSIGNMENT_ID = ? FOR UPDATE',
      [assignmentId]
    );

    if (!assignRows[0]) {
      throw createError('Shelter assignment record not found', 404);
    }

    const assignment = assignRows[0];

    if (assignment.status !== 'Assigned') {
      throw createError(
        `Shelter assignment #${assignmentId} cannot be released (current status: ${assignment.status}).`,
        409
      );
    }

    // 2. Lock and inspect shelter
    const [shelterRows] = await connection.execute(
      'SELECT SHELTER_ID AS id, SHELTER_NAME AS name, CAPACITY AS capacity, AVAILABLE_SPACES AS availableSpaces FROM `shelter` WHERE SHELTER_ID = ? FOR UPDATE',
      [assignment.shelterId]
    );

    if (!shelterRows[0]) {
      throw createError('Associated shelter not found', 404);
    }

    const shelter = shelterRows[0];
    const newAvailable = Math.min(shelter.capacity, shelter.availableSpaces + assignment.assignedSpaces);

    // 3. Restore available spaces
    await connection.execute(
      'UPDATE `shelter` SET AVAILABLE_SPACES = ? WHERE SHELTER_ID = ?',
      [newAvailable, shelter.id]
    );

    // 4. Mark assignment as Released
    await connection.execute(
      'UPDATE `incident_shelter` SET STATUS = ? WHERE ASSIGNMENT_ID = ?',
      ['Released', assignmentId]
    );

    await connection.commit();

    const auditService = require('./auditService');
    await auditService.recordAuditEvent({
      action: 'SHELTER_RELEASED',
      entityType: 'incident_shelter',
      entityId: assignmentId,
      details: `${assignment.assignedSpaces} evacuee spaces released for "${shelter.name}"`,
    });

    return {
      assignmentId,
      incidentId: assignment.incidentId,
      shelterId: shelter.id,
      restoredSpaces: assignment.assignedSpaces,
      newAvailableSpaces: newAvailable,
      status: 'Released',
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getShelters,
  getShelterById,
  getShelterMetrics,
  getCandidateShelters,
  assignShelter,
  releaseShelterAssignment,
  getShelterCoordinates,
};
