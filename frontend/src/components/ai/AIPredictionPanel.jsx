import React from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../ui/Card';
import Badge, { PriorityBadge, SeverityBadge } from '../ui/Badge';
import SeverityGauge from './SeverityGauge';
import { Cpu, Activity, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

/**
 * AIPredictionPanel — renders AI Triage outputs retrieved directly from MySQL ai_prediction
 */
const AIPredictionPanel = ({
  predictionId,
  riskLevel = 'Medium',
  confidence = 75,
  suggestedAction = 'Dispatch standard field verification unit.',
  predictionTime,
  severity = 5,
  detectedCues = [],
}) => {
  const numConfidence = Number(confidence) || 0;

  return (
    <Card className="border-info/30 bg-gradient-to-br from-eoc-card via-eoc-card to-eoc-surface">
      <CardHeader
        actions={
          <div className="flex items-center gap-2">
            <span className="badge bg-info-subtle text-info-light border border-info/30 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              RULE-BASED AI TRIAGE
            </span>
            <PriorityBadge priority={riskLevel} />
          </div>
        }
      >
        <CardTitle className="flex items-center gap-2 text-sm text-gray-100">
          <ShieldAlert className="w-4 h-4 text-emergency-light" />
          AI Incident Intelligence Assessment
        </CardTitle>
        <CardSubtitle>Deterministic heuristic scoring derived from reported disaster cues</CardSubtitle>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded bg-eoc-bg border border-eoc-border">
            <p className="text-2xs text-gray-500 uppercase tracking-widest">Risk Level</p>
            <div className="mt-1 flex items-center gap-2">
              <PriorityBadge priority={riskLevel} />
            </div>
          </div>

          <div className="p-3 rounded bg-eoc-bg border border-eoc-border">
            <p className="text-2xs text-gray-500 uppercase tracking-widest">AI Confidence</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-info-light">{numConfidence}%</span>
              <span className="text-2xs text-gray-500">certainty</span>
            </div>
          </div>

          <div className="p-3 rounded bg-eoc-bg border border-eoc-border">
            <p className="text-2xs text-gray-500 uppercase tracking-widest">Prediction Record ID</p>
            <p className="text-xs font-mono text-gray-300 mt-1">
              {predictionId ? `#${predictionId}` : 'Generated at Intake'}
            </p>
          </div>
        </div>

        {/* Severity Gauge */}
        <div className="p-3 rounded bg-eoc-bg border border-eoc-border">
          <SeverityGauge severity={severity} />
        </div>

        {/* Suggested Action */}
        <div className="p-3.5 rounded bg-eoc-bg border border-eoc-border space-y-1.5">
          <p className="text-2xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-warning-light" />
            Recommended Operational Protocol:
          </p>
          <p className="text-xs text-gray-200 leading-relaxed font-medium">
            {suggestedAction || 'Deploy standard first responder assessment unit.'}
          </p>
        </div>

        {/* Prediction Timestamp */}
        {predictionTime && (
          <p className="text-2xs text-gray-500 font-mono text-right">
            Triaged at: {new Date(predictionTime).toLocaleString()}
          </p>
        )}
      </CardBody>
    </Card>
  );
};

export default AIPredictionPanel;
