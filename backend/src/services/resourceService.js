const { pool } = require('../db');
const resourceRepository = require('../db/resourceRepository');
const resourceAllocationRepository = require('../db/resourceAllocationRepository');
const incidentRepository = require('../db/incidentRepository');
const { createError } = require('../middleware/errorHandler');

/**
 * Determine standard availability state based on quantity,
 * preserving explicit 'Unavailable' state.
 */
function computeAvailability(currentAvailability, newQuantity) {
  if (currentAvailability && currentAvailability.toLowerCase() === 'unavailable') {
    return 'Unavailable';
  }
  if (newQuantity <= 0) {
    return 'Depleted';
  }
  if (newQuantity <= 20) {
    return 'Low Stock';
  }
  return 'Available';
}

async function getResources(params = {}) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 50));
  const offset = (page - 1) * limit;

  const { resources, total } = await resourceRepository.findAll({
    search: params.search,
    category: params.category,
    availability: params.availability,
    location: params.location,
    sortBy: params.sortBy,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    resources,
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

async function getResourceById(id) {
  const resource = await resourceRepository.findById(id);
  if (!resource) {
    throw createError('Resource not found', 404);
  }
  return resource;
}

async function updateResourceStatus(id, status) {
  const validStatuses = ['Available', 'Low Stock', 'Depleted', 'Unavailable'];
  if (!status || !validStatuses.includes(status)) {
    throw createError(
      `Invalid status. Supported statuses: ${validStatuses.join(', ')}`,
      400
    );
  }

  const existing = await resourceRepository.findById(id);
  if (!existing) {
    throw createError('Resource not found', 404);
  }

  await resourceRepository.updateStatus(id, status);
  return await resourceRepository.findById(id);
}

async function getResourceMetrics() {
  return await resourceRepository.getMetrics();
}

/**
 * Transactional Resource Allocation
 * Allocates requested quantity to incident, decreasing stock atomically.
 */
async function allocateResource(incidentId, { resourceId, quantity }) {
  const parsedQuantity = parseInt(quantity, 10);
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    throw createError('Quantity must be a positive integer greater than zero.', 400);
  }

  if (!resourceId) {
    throw createError('resourceId is required.', 400);
  }

  // 1. Check incident exists
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    throw createError('Incident not found', 404);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 2. Lock and retrieve resource row
    const [rows] = await connection.execute(
      'SELECT RESOURCE_ID AS id, RESOURCE_NAME AS name, CATEGORY AS category, QUANTITY AS quantity, AVAILABILITY AS availability, LOCATION AS location FROM `resource` WHERE RESOURCE_ID = ? FOR UPDATE',
      [resourceId]
    );

    if (!rows[0]) {
      throw createError('Resource not found', 404);
    }

    const resource = rows[0];

    // 3. Validate resource availability
    if (resource.availability && resource.availability.toLowerCase() === 'unavailable') {
      throw createError(`Resource "${resource.name}" is currently unavailable for allocation.`, 400);
    }

    // 4. Validate sufficient stock
    if (parsedQuantity > resource.quantity) {
      throw createError(
        `Insufficient resource stock. Requested ${parsedQuantity} units but only ${resource.quantity} available.`,
        409
      );
    }

    const newQuantity = resource.quantity - parsedQuantity;
    const newAvailability = computeAvailability(resource.availability, newQuantity);

    // 5. Update resource stock
    await connection.execute(
      'UPDATE `resource` SET QUANTITY = ?, AVAILABILITY = ? WHERE RESOURCE_ID = ?',
      [newQuantity, newAvailability, resourceId]
    );

    // 6. Create resource allocation record
    const allocation = await resourceAllocationRepository.createAllocation(
      {
        incidentId,
        resourceId,
        quantity: parsedQuantity,
        assignedTime: new Date(),
        status: 'Allocated',
      },
      connection
    );

    await connection.commit();

    // Trigger shortage / depletion alert if applicable
    const alertService = require('./alertService');
    if (newQuantity === 0) {
      await alertService.createSystemAlertIfNeeded('RESOURCE_DEPLETED', {
        resourceName: resource.name,
        quantity: 0,
        location: resource.location,
      });
    } else if (newQuantity <= 20 || newAvailability === 'Low Stock') {
      await alertService.createSystemAlertIfNeeded('RESOURCE_LOW_STOCK', {
        resourceName: resource.name,
        quantity: newQuantity,
        location: resource.location,
      });
    }

    const auditService = require('./auditService');
    await auditService.recordAuditEvent({
      action: 'RESOURCE_ALLOCATED',
      entityType: 'resource_allocation',
      entityId: allocation.allocationId,
      details: `${parsedQuantity} units of "${resource.name}" allocated to Incident #${incidentId}`,
    });

    return {
      allocationId: allocation.allocationId,
      incidentId,
      resource: {
        resourceId: resource.id,
        resourceName: resource.name,
        category: resource.category,
        location: resource.location,
      },
      quantity: parsedQuantity,
      remainingStock: newQuantity,
      status: 'Allocated',
      assignedTime: allocation.assignedTime,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Transactional Resource Release
 * Returns allocated quantity back to inventory and marks allocation 'Released'.
 */
async function releaseResourceAllocation(allocationId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lock and retrieve allocation
    const [allocRows] = await connection.execute(
      'SELECT ALLOCATION_ID AS allocationId, INCIDENT_ID AS incidentId, RESOURCE_ID AS resourceId, QUANTITY AS quantity, STATUS AS status FROM `resource_allocation` WHERE ALLOCATION_ID = ? FOR UPDATE',
      [allocationId]
    );

    if (!allocRows[0]) {
      throw createError('Resource allocation record not found', 404);
    }

    const allocation = allocRows[0];

    if (allocation.status !== 'Allocated') {
      throw createError(
        `Allocation #${allocationId} cannot be released (current status: ${allocation.status}).`,
        409
      );
    }

    // 2. Lock and retrieve resource
    const [resRows] = await connection.execute(
      'SELECT RESOURCE_ID AS id, RESOURCE_NAME AS name, QUANTITY AS quantity, AVAILABILITY AS availability FROM `resource` WHERE RESOURCE_ID = ? FOR UPDATE',
      [allocation.resourceId]
    );

    if (!resRows[0]) {
      throw createError('Associated resource not found', 404);
    }

    const resource = resRows[0];
    const newQuantity = resource.quantity + allocation.quantity;
    const newAvailability = computeAvailability(resource.availability, newQuantity);

    // 3. Return stock to resource
    await connection.execute(
      'UPDATE `resource` SET QUANTITY = ?, AVAILABILITY = ? WHERE RESOURCE_ID = ?',
      [newQuantity, newAvailability, resource.id]
    );

    // 4. Mark allocation as Released
    await connection.execute(
      'UPDATE `resource_allocation` SET STATUS = ? WHERE ALLOCATION_ID = ?',
      ['Released', allocationId]
    );

    await connection.commit();

    const auditService = require('./auditService');
    await auditService.recordAuditEvent({
      action: 'RESOURCE_RELEASED',
      entityType: 'resource_allocation',
      entityId: allocationId,
      details: `${allocation.quantity} units of "${resource.name}" released back to inventory`,
    });

    return {
      allocationId,
      incidentId: allocation.incidentId,
      resourceId: resource.id,
      returnedQuantity: allocation.quantity,
      restoredStock: newQuantity,
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
  getResources,
  getResourceById,
  updateResourceStatus,
  getResourceMetrics,
  allocateResource,
  releaseResourceAllocation,
};
