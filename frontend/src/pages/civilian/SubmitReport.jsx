import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { SeverityBadge, PriorityBadge } from '../../components/ui/Badge';
import StatusPill from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { createIncident } from '../../api/incidents';
import {
  AlertTriangle,
  Cpu,
  CheckCircle2,
  MapPin,
  Flame,
  Activity,
  Users,
  Eye,
  ArrowRight,
  Info,
} from 'lucide-react';

const DISASTER_TYPES = [
  'Earthquake',
  'Building Collapse',
  'Flood',
  'Wildfire',
  'Chemical Leak',
  'Tsunami',
  'Industrial Accident',
  'Tornado',
  'Hurricane',
  'Landslide',
  'Power Outage',
  'Minor Flood',
  'Other',
];

const DAMAGE_TAGS = [
  'Structural Damage',
  'Road Blocked',
  'Power Outage',
  'Toxic Fumes',
  'Trapped Civilians',
  'Water Submerged',
  'Active Fire',
];

const SubmitReport = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    disasterType: 'Building Collapse',
    description: 'Severe structural collapse with trapped victims and uncontrolled fire hazard.',
    latitude: 34.0522,
    longitude: -118.2437,
    casualties: 2,
    injuries: 8,
    affectedPopulation: 150,
    damageIndicators: ['Structural Damage', 'Trapped Civilians', 'Active Fire'],
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.disasterType) errs.disasterType = 'Please select a disaster type';
    if (!form.description || form.description.trim().length < 5) {
      errs.description = 'Description must be at least 5 characters';
    }
    if (form.latitude === '' || isNaN(form.latitude)) errs.latitude = 'Valid latitude is required';
    if (form.longitude === '' || isNaN(form.longitude)) errs.longitude = 'Valid longitude is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toggleDamageTag = (tag) => {
    setForm((prev) => {
      const exists = prev.damageIndicators.includes(tag);
      return {
        ...prev,
        damageIndicators: exists
          ? prev.damageIndicators.filter((t) => t !== tag)
          : [...prev.damageIndicators, tag],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        disasterType: form.disasterType,
        description: form.description.trim(),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        casualties: parseInt(form.casualties, 10) || 0,
        injuries: parseInt(form.injuries, 10) || 0,
        affectedPopulation: parseInt(form.affectedPopulation, 10) || 0,
        damageIndicators: form.damageIndicators,
      };

      const res = await createIncident(payload);
      setResult(res.data.data);
      toast.success('Disaster report submitted and AI triaged successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit disaster report.';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Submit Disaster Report">
      <PageHeader
        title="Submit Incident Report"
        subtitle="Citizen emergency intake with immediate rule-based AI triage and priority evaluation"
        breadcrumb="Civilian / Incident Intake"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Schema Notice */}
        <div className="alert-info-box flex items-start gap-2.5">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-gray-200">System Intake Operational Notice</p>
            <p className="text-gray-400">
              Your report is validated and processed through the <strong>Rule-Based AI Triage Engine</strong> to compute Severity (1–10), Confidence Score, and Priority routing.
              <em> Note: Incident and AI Prediction are persisted directly into MySQL. Casualties/Injuries parameters are evaluated in real-time by the AI engine.</em>
            </p>
          </div>
        </div>

        {/* AI Result Card */}
        {result && (
          <div className="card p-5 border-emergency/40 bg-gradient-to-r from-eoc-card to-eoc-surface animate-slide-in">
            <div className="flex items-center justify-between pb-3 border-b border-eoc-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-light" />
                <span className="font-bold text-gray-100 text-sm">
                  INCIDENT #{result.incident.id} REGISTERED &amp; TRIAGED
                </span>
              </div>
              <StatusPill status={result.incident.status || 'Reported'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="p-3 bg-eoc-bg rounded border border-eoc-border">
                <p className="text-2xs text-gray-500 uppercase tracking-widest">Calculated Severity</p>
                <div className="mt-1 flex items-center gap-2">
                  <SeverityBadge severity={result.triage.severity} />
                  <span className="text-xs text-gray-400">({result.triage.severity}/10)</span>
                </div>
              </div>

              <div className="p-3 bg-eoc-bg rounded border border-eoc-border">
                <p className="text-2xs text-gray-500 uppercase tracking-widest">AI Confidence Score</p>
                <div className="mt-1 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-info-light" />
                  <span className="text-sm font-bold text-info-light">{result.triage.confidence}%</span>
                </div>
              </div>

              <div className="p-3 bg-eoc-bg rounded border border-eoc-border">
                <p className="text-2xs text-gray-500 uppercase tracking-widest">Priority Routing</p>
                <div className="mt-1">
                  <PriorityBadge priority={result.triage.priority} />
                </div>
              </div>

              <div className="p-3 bg-eoc-bg rounded border border-eoc-border">
                <p className="text-2xs text-gray-500 uppercase tracking-widest">Prediction Record</p>
                <p className="text-xs text-gray-300 font-mono mt-1">ID: #{result.prediction.id}</p>
              </div>
            </div>

            {/* Detected Cues */}
            <div className="mt-4">
              <p className="text-2xs text-gray-400 uppercase tracking-wider mb-1.5">Detected Emergency Cues:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.triage.detectedCues && result.triage.detectedCues.length > 0 ? (
                  result.triage.detectedCues.map((cue, i) => (
                    <span key={i} className="badge bg-emergency/20 text-emergency-light border border-emergency/30 text-xs">
                      ⚡ {cue}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No specific critical keywords detected (standard evaluation).</span>
                )}
              </div>
            </div>

            {/* Recommended Action */}
            <div className="mt-4 p-3 bg-eoc-bg rounded border border-eoc-border">
              <p className="text-2xs text-gray-400 uppercase tracking-wider mb-1">Recommended Response Actions:</p>
              <p className="text-xs text-gray-200 leading-relaxed font-medium">
                {result.prediction.suggestedAction || 'Deploy standard first responder assessment unit.'}
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                Submit Another Report
              </Button>
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/civilian/my-reports')}>
                View in My Reports
              </Button>
            </div>
          </div>
        )}

        {/* Report Intake Form */}
        <Card>
          <CardHeader>
            <CardTitle>Disaster Intake Form</CardTitle>
            <CardSubtitle>Please provide accurate details for prompt dispatch and AI risk prioritization.</CardSubtitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Disaster Type */}
                <div className="form-group">
                  <label className="form-label" htmlFor="disasterType">Disaster Classification *</label>
                  <select
                    id="disasterType"
                    className={`form-select ${errors.disasterType ? 'border-emergency' : ''}`}
                    value={form.disasterType}
                    onChange={(e) => setForm({ ...form, disasterType: e.target.value })}
                  >
                    {DISASTER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.disasterType && <p className="form-error">{errors.disasterType}</p>}
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="latitude">Latitude *</label>
                    <input
                      id="latitude"
                      type="number"
                      step="any"
                      className={`form-input ${errors.latitude ? 'border-emergency' : ''}`}
                      placeholder="e.g. 34.0522"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    />
                    {errors.latitude && <p className="form-error">{errors.latitude}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="longitude">Longitude *</label>
                    <input
                      id="longitude"
                      type="number"
                      step="any"
                      className={`form-input ${errors.longitude ? 'border-emergency' : ''}`}
                      placeholder="e.g. -118.2437"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    />
                    {errors.longitude && <p className="form-error">{errors.longitude}</p>}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Incident Description (Keywords Trigger Rule-Based AI Triage) *
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className={`form-input ${errors.description ? 'border-emergency' : ''}`}
                  placeholder="Describe the incident, hazards, trapped victims, collapse, fire, flood, etc."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              {/* Triage Impact Indicators */}
              <div className="p-4 bg-eoc-surface rounded border border-eoc-border space-y-3">
                <p className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-warning-light" />
                  Impact Indicators (Scored by AI Engine)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="form-group">
                    <label className="form-label text-2xs" htmlFor="casualties">Confirmed Casualties</label>
                    <input
                      id="casualties"
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.casualties}
                      onChange={(e) => setForm({ ...form, casualties: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-2xs" htmlFor="injuries">Injured Persons</label>
                    <input
                      id="injuries"
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.injuries}
                      onChange={(e) => setForm({ ...form, injuries: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-2xs" htmlFor="affectedPopulation">Est. Affected Civilians</label>
                    <input
                      id="affectedPopulation"
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.affectedPopulation}
                      onChange={(e) => setForm({ ...form, affectedPopulation: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-2xs text-gray-400 mb-1.5">Damage Indicators (Click to Toggle):</p>
                  <div className="flex flex-wrap gap-2">
                    {DAMAGE_TAGS.map((tag) => {
                      const selected = form.damageIndicators.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleDamageTag(tag)}
                          className={`text-xs px-2.5 py-1 rounded transition-colors border ${
                            selected
                              ? 'bg-emergency/20 border-emergency text-emergency-light font-medium'
                              : 'bg-eoc-card border-eoc-border text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="danger"
                  size="lg"
                  loading={loading}
                  icon={AlertTriangle}
                  className="px-6"
                >
                  Submit Incident &amp; Run AI Triage
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
};

export default SubmitReport;
