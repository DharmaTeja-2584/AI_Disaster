const { pool } = require('./index');

/**
 * AI Prediction Repository
 * Maps directly to table: ai_prediction
 * Columns: PREDICTION_ID, INCIDENT_ID, RISK_LEVEL, CONFIDENCE, SUGGESTED_ACTION, PREDICTION_TIME
 */

async function getNextPredictionId(connection) {
  const [rows] = await connection.query('SELECT COALESCE(MAX(PREDICTION_ID), 0) + 1 AS nextId FROM `ai_prediction` FOR UPDATE');
  return rows[0].nextId;
}

async function createPrediction({
  incidentId,
  riskLevel,
  confidence,
  suggestedAction,
  predictionTime = new Date(),
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const nextId = await getNextPredictionId(connection);

    await connection.execute(
      'INSERT INTO `ai_prediction` (PREDICTION_ID, INCIDENT_ID, RISK_LEVEL, CONFIDENCE, SUGGESTED_ACTION, PREDICTION_TIME) VALUES (?, ?, ?, ?, ?, ?)',
      [
        nextId,
        incidentId,
        riskLevel,
        confidence,
        suggestedAction,
        predictionTime,
      ]
    );

    await connection.commit();

    return {
      id: nextId,
      incidentId,
      riskLevel,
      confidence,
      suggestedAction,
      predictionTime,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findByIncidentId(incidentId) {
  const [rows] = await pool.execute(
    'SELECT PREDICTION_ID AS id, INCIDENT_ID AS incidentId, RISK_LEVEL AS riskLevel, CONFIDENCE AS confidence, SUGGESTED_ACTION AS suggestedAction, PREDICTION_TIME AS predictionTime FROM `ai_prediction` WHERE INCIDENT_ID = ? ORDER BY PREDICTION_TIME DESC',
    [incidentId]
  );
  return rows[0] || null;
}

async function findAllByIncidentId(incidentId) {
  const [rows] = await pool.execute(
    'SELECT PREDICTION_ID AS id, INCIDENT_ID AS incidentId, RISK_LEVEL AS riskLevel, CONFIDENCE AS confidence, SUGGESTED_ACTION AS suggestedAction, PREDICTION_TIME AS predictionTime FROM `ai_prediction` WHERE INCIDENT_ID = ? ORDER BY PREDICTION_TIME ASC',
    [incidentId]
  );
  return rows;
}

module.exports = {
  getNextPredictionId,
  createPrediction,
  findByIncidentId,
  findAllByIncidentId,
};
