const { z } = require('zod');

const createIncidentSchema = z.object({
  disasterType: z.string().min(2, 'Disaster type is required').max(50, 'Disaster type must not exceed 50 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters').max(255, 'Description must not exceed 255 characters'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  // Request-level AI triage indicators (used for scoring, not database table columns):
  casualties: z.coerce.number().min(0).optional().default(0),
  injuries: z.coerce.number().min(0).optional().default(0),
  affectedPopulation: z.coerce.number().min(0).optional().default(0),
  damageIndicators: z.array(z.string()).optional().default([]),
});

const updateStatusSchema = z.object({
  status: z.enum(['Reported', 'Triaged', 'Active', 'Contained', 'Resolved']),
});

module.exports = {
  createIncidentSchema,
  updateStatusSchema,
};
