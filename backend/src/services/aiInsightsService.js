/**
 * AI Insights Engine
 * Evaluates real operational database metrics to generate actionable, human-readable insights.
 * Explicitly a deterministic analytical reasoning engine, not predictive crystal-ball forecasting.
 */

function generateInsights({
  incidents,
  resources,
  teams,
  shelters,
  alerts,
  damage,
  ai,
}) {
  const insights = [];

  // 1. Incident Severity & Load Assessment
  if (incidents?.stats) {
    const { total, active, highPriority } = incidents.stats;
    if (total > 0) {
      const highRatio = (highPriority / total) * 100;
      if (highRatio >= 40) {
        insights.push({
          type: 'SEVERITY_ALERT',
          level: 'Critical',
          title: 'High-Severity Concentration Detected',
          description: `${highPriority} of ${total} recorded incidents (${highRatio.toFixed(1)}%) are rated High Priority (Severity ≥ 7). Heavy tactical asset commitment required.`,
        });
      } else {
        insights.push({
          type: 'INCIDENT_LOAD',
          level: 'Info',
          title: 'Operational Incident Distribution',
          description: `Currently tracking ${active} active incidents across regional emergency sectors with ${highPriority} high-priority zones.`,
        });
      }
    }
  }

  // 2. Resource Inventory & Shortage Findings
  if (resources) {
    if (resources.depletedCount > 0) {
      insights.push({
        type: 'RESOURCE_DEPLETION',
        level: 'Critical',
        title: 'Critical Supply Depletion',
        description: `${resources.depletedCount} resource type(s) have reached 0 available inventory units. Immediate replenishment orders recommended.`,
      });
    } else if (resources.lowStockCount > 0) {
      insights.push({
        type: 'RESOURCE_SHORTAGE',
        level: 'Warning',
        title: 'Low Stock Advisory',
        description: `${resources.lowStockCount} supply item(s) are at or below safety reserves (≤ 20 units). Restocking recommended.`,
      });
    }

    if (resources.topAllocated && resources.topAllocated.length > 0) {
      const top = resources.topAllocated[0];
      if (top.allocatedQuantity > 0) {
        insights.push({
          type: 'RESOURCE_DEMAND',
          level: 'Info',
          title: 'Highest Demand Operational Asset',
          description: `"${top.name}" is the most utilized resource (${top.allocatedQuantity} units allocated, ${top.utilizationPct || 0}% utilization).`,
        });
      }
    }
  }

  // 3. Response Team Fleet Utilization
  if (teams) {
    if (teams.utilizationRate >= 75) {
      insights.push({
        type: 'FLEET_STRESS',
        level: 'Warning',
        title: 'High Response Team Utilization',
        description: `Fleet utilization is at ${teams.utilizationRate}% with ${teams.deployedTeams} of ${teams.totalTeams} specialized units currently deployed in the field.`,
      });
    } else {
      insights.push({
        type: 'FLEET_STATUS',
        level: 'Info',
        title: 'Response Fleet Readiness',
        description: `${teams.availableTeams} of ${teams.totalTeams} response teams are available for immediate dispatch routing.`,
      });
    }
  }

  // 4. Shelter Evacuation Capacity
  if (shelters) {
    if (shelters.fullShelters > 0) {
      insights.push({
        type: 'SHELTER_FULL',
        level: 'Critical',
        title: 'Shelter Saturation',
        description: `${shelters.fullShelters} evacuation shelter(s) are at 100% maximum capacity. Reroute evacuees to adjacent facilities immediately.`,
      });
    } else if (shelters.nearCapacityShelters > 0) {
      insights.push({
        type: 'SHELTER_CAPACITY',
        level: 'Warning',
        title: 'Reception Capacity Alert',
        description: `${shelters.nearCapacityShelters} shelter(s) have dropped below 15% remaining capacity. Overall network occupancy is at ${shelters.occupancyRate}%.`,
      });
    }
  }

  // 5. AI Triage Confidence & Escalation Frequency
  if (ai) {
    if (ai.reassessedIncidents > 0) {
      insights.push({
        type: 'AI_REASSESSMENT',
        level: 'Info',
        title: 'Field Triage Dynamics',
        description: `${ai.reassessedIncidents} incident(s) underwent secondary on-scene AI reassessment following responder damage evaluations.`,
      });
    }

    if (ai.averageConfidence) {
      if (ai.averageConfidence < 75) {
        insights.push({
          type: 'AI_CONFIDENCE',
          level: 'Warning',
          title: 'Triage Rule Confidence Threshold',
          description: `Average AI evaluation confidence is ${ai.averageConfidence}%. Additional on-scene responder data recommended to enrich rule evaluations.`,
        });
      } else {
        insights.push({
          type: 'AI_CONFIDENCE',
          level: 'Info',
          title: 'High Triage Consensus',
          description: `AI triage rules operating with an average confidence of ${ai.averageConfidence}% across ${ai.totalPredictions} evaluation records.`,
        });
      }
    }
  }

  return insights;
}

module.exports = {
  generateInsights,
};
