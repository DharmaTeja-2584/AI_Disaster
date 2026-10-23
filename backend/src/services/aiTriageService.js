/**
 * Rule-Based AI/NLP Triage Engine
 *
 * NOTE: This is explicitly a deterministic, rule-based keyword & heuristic scoring engine,
 * NOT a trained machine-learning model.
 *
 * Scoring factors:
 *   - Critical Cues (weight: +4 per keyword, max +6)
 *   - Severe Cues (weight: +2 per keyword, max +4)
 *   - Moderate Cues (weight: +1 per keyword, max +2)
 *   - Casualties count (e.g. >0: +2 to +4)
 *   - Injuries count (e.g. >0: +1 to +2)
 *   - Affected population scale (e.g. >50: +1 to +2)
 *
 * Output:
 *   - severity: 1–10 (integer)
 *   - confidence: percentage decimal (e.g. 75.00 to 98.00)
 *   - priority: "High" (7-10) | "Medium" (4-6) | "Low" (1-3)
 *   - detectedCues: Array of detected string keywords
 *   - recommendedActions: Array of actionable operational recommendations
 *   - suggestedAction: Single string summary for DB storage
 */

const CRITICAL_CUES = [
  'collapse',
  'trapped',
  'explosion',
  'toxic',
  'chemical leak',
  'multiple casualties',
  'mass casualty',
  'submerged',
  'missing',
  'uncontrolled fire',
  'building destroyed',
];

const SEVERE_CUES = [
  'fire',
  'injured',
  'flood',
  'evacuation',
  'structural damage',
  'road blocked',
  'power outage',
  'hazard',
];

const MODERATE_CUES = [
  'minor damage',
  'isolated',
  'localized',
  'small fire',
];

const DISASTER_BASE_SCORES = {
  'Earthquake': 6,
  'Building Collapse': 7,
  'Tsunami': 8,
  'Chemical Leak': 7,
  'Wildfire': 6,
  'Flood': 5,
  'Industrial Accident': 5,
  'Tornado': 6,
  'Hurricane': 6,
  'Landslide': 5,
  'Power Outage': 3,
  'Minor Flood': 3,
  'Other': 4,
};

function evaluateTriage({
  disasterType = 'Other',
  description = '',
  casualties = 0,
  injuries = 0,
  affectedPopulation = 0,
  damageIndicators = [],
}) {
  const text = (description + ' ' + disasterType + ' ' + damageIndicators.join(' ')).toLowerCase();
  const detectedCues = [];

  let keywordScore = 0;
  let criticalCount = 0;
  let severeCount = 0;
  let moderateCount = 0;

  // 1. Critical Cues Matching
  for (const cue of CRITICAL_CUES) {
    if (text.includes(cue.toLowerCase())) {
      detectedCues.push(cue);
      criticalCount++;
    }
  }

  // 2. Severe Cues Matching
  for (const cue of SEVERE_CUES) {
    if (text.includes(cue.toLowerCase())) {
      detectedCues.push(cue);
      severeCount++;
    }
  }

  // 3. Moderate Cues Matching
  for (const cue of MODERATE_CUES) {
    if (text.includes(cue.toLowerCase())) {
      detectedCues.push(cue);
      moderateCount++;
    }
  }

  keywordScore += Math.min(criticalCount * 4, 6);
  keywordScore += Math.min(severeCount * 2, 4);
  keywordScore += Math.min(moderateCount * 1, 2);

  // 4. Base Disaster Weight
  const baseScore = DISASTER_BASE_SCORES[disasterType] || 4;

  // 5. Impact Metrics Scoring
  let impactScore = 0;
  const numCasualties = Number(casualties) || 0;
  const numInjuries = Number(injuries) || 0;
  const numAffected = Number(affectedPopulation) || 0;

  if (numCasualties > 10) impactScore += 4;
  else if (numCasualties > 0) impactScore += 3;

  if (numInjuries > 20) impactScore += 3;
  else if (numInjuries > 5) impactScore += 2;
  else if (numInjuries > 0) impactScore += 1;

  if (numAffected > 500) impactScore += 2;
  else if (numAffected > 50) impactScore += 1;

  // 6. Calculate Overall Severity (1 - 10)
  // Weighted blend: 35% base, 40% keyword, 25% impact
  let rawSeverity = Math.round(
    baseScore * 0.35 + (keywordScore > 0 ? keywordScore : baseScore) * 0.40 + impactScore * 0.25
  );

  // Boost if critical cues or casualties present
  if (criticalCount > 0 || numCasualties > 0) {
    rawSeverity = Math.max(rawSeverity, 7);
  }

  const severity = Math.min(Math.max(rawSeverity, 1), 10);

  // 7. Calculate Confidence (65.00% to 98.00%)
  // Confidence increases with the richness of inputs provided
  let confidenceScore = 70.0;
  if (detectedCues.length > 0) confidenceScore += Math.min(detectedCues.length * 4.5, 18.0);
  if (description.length > 50) confidenceScore += 5.0;
  if (numCasualties > 0 || numInjuries > 0 || numAffected > 0) confidenceScore += 5.0;
  confidenceScore = Math.min(confidenceScore, 98.0);
  const confidence = parseFloat(confidenceScore.toFixed(2));

  // 8. Determine Priority
  let priority = 'Low';
  if (severity >= 7) priority = 'High';
  else if (severity >= 4) priority = 'Medium';

  // 9. Generate Actionable Recommendations
  const recommendedActions = [];
  if (severity >= 7 || criticalCount > 0) {
    recommendedActions.push('Dispatch nearest Search & Rescue / Hazmat response team immediately');
    recommendedActions.push('Alert nearest emergency medical units and hospitals');
    recommendedActions.push('Establish incident perimeter and evaluate evacuation routes');
  } else if (severity >= 4) {
    recommendedActions.push('Dispatch field assessment unit to verify scene conditions');
    recommendedActions.push('Stage regional medical and food resource supplies');
    recommendedActions.push('Notify neighborhood shelters for standby reception');
  } else {
    recommendedActions.push('Monitor situation via local responders');
    recommendedActions.push('Issue standard citizen advisory bulletin');
  }

  if (text.includes('fire')) {
    recommendedActions.push('Deploy wildfire / structural fire containment teams');
  }
  if (text.includes('flood') || text.includes('submerged')) {
    recommendedActions.push('Deploy water rescue boats and barrier supplies');
  }
  if (text.includes('chemical') || text.includes('toxic')) {
    recommendedActions.push('Deploy Hazmat containment protocol and air monitoring units');
  }

  const suggestedAction = recommendedActions.slice(0, 2).join('; ').substring(0, 255);

  return {
    severity,
    confidence,
    priority,
    riskLevel: priority,
    detectedCues,
    recommendedActions,
    suggestedAction,
  };
}

/**
 * Secondary AI Triage: Evaluates revised severity after on-scene damage assessment
 * Extends existing rule-based engine deterministically.
 */
function evaluateSecondaryTriage({ incident, damageReports = [], latestReport = null }) {
  const incidentDesc = incident?.description || incident?.DESCRIPTION || '';
  const incidentType = incident?.incidentType || incident?.INCIDENT_TYPE || 'Other';
  const initialSeverity = Number(incident?.severity || incident?.SEVERITY || 5);

  const allDamageDescs = damageReports.map((d) => d.description || d.DESCRIPTION || '').join(' ');
  const latestDesc = latestReport?.description || '';
  const combinedDesc = `${incidentDesc} ${allDamageDescs} ${latestDesc}`.trim();

  const levels = damageReports.map((d) => d.damageLevel || d.DAMAGE_LEVEL || 'Minor');
  if (latestReport?.damageLevel) levels.push(latestReport.damageLevel);

  let damageWeight = 0;
  if (levels.includes('Critical')) damageWeight = 4;
  else if (levels.includes('Severe')) damageWeight = 3;
  else if (levels.includes('Moderate')) damageWeight = 1;

  const baseTriage = evaluateTriage({
    disasterType: incidentType,
    description: combinedDesc,
    damageIndicators: levels,
  });

  let reassessedSeverity = Math.max(initialSeverity, baseTriage.severity);
  if (damageWeight === 4) {
    reassessedSeverity = Math.max(reassessedSeverity, 9);
  } else if (damageWeight === 3) {
    reassessedSeverity = Math.max(reassessedSeverity, 7);
  } else if (damageWeight === 1 && reassessedSeverity < 5) {
    reassessedSeverity = Math.max(reassessedSeverity, 5);
  }
  reassessedSeverity = Math.min(Math.max(reassessedSeverity, 1), 10);

  // Field assessment adds +5% on-scene verification confidence, capped at 98.0%
  const verifiedConfidence = Math.min(parseFloat((baseTriage.confidence + 5.0).toFixed(2)), 98.0);

  let riskLevel = 'Low';
  if (reassessedSeverity >= 7) riskLevel = 'High';
  else if (reassessedSeverity >= 4) riskLevel = 'Medium';

  const isEscalated = reassessedSeverity > initialSeverity;

  const recommendedActions = [...baseTriage.recommendedActions];
  if (isEscalated) {
    recommendedActions.unshift(`ESCALATED: Severity increased from ${initialSeverity} to ${reassessedSeverity}. Immediate Command Center review required.`);
  }

  const suggestedAction = recommendedActions.slice(0, 2).join('; ').substring(0, 255);

  return {
    severity: reassessedSeverity,
    previousSeverity: initialSeverity,
    confidence: verifiedConfidence,
    priority: riskLevel,
    riskLevel,
    isEscalated,
    detectedCues: baseTriage.detectedCues,
    recommendedActions,
    suggestedAction,
  };
}

module.exports = {
  evaluateTriage,
  evaluateSecondaryTriage,
  CRITICAL_CUES,
  SEVERE_CUES,
  MODERATE_CUES,
};
