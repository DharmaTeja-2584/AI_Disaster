import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { submitDamageReport } from '../../api/damageReports';
import { AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const SubmitDamageReportModal = ({
  isOpen,
  onClose,
  incident,
  onSuccess,
}) => {
  const [damageLevel, setDamageLevel] = useState('Moderate');
  const [estimatedLoss, setEstimatedLoss] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Damage description is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await submitDamageReport(incident.id, {
        damageLevel,
        estimatedLoss: estimatedLoss ? parseFloat(estimatedLoss) : 0,
        description: description.trim(),
        photo: photo.trim() || null,
      });

      const payload = res.data?.data || res.data;
      setResult(payload);
      if (onSuccess) {
        onSuccess(payload);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit field damage report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setResult(null);
    setDescription('');
    setEstimatedLoss('');
    setDamageLevel('Moderate');
    setPhoto('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={`Field Damage Assessment — Incident #${incident?.id}`}
    >
      {result ? (
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-success-subtle/30 border border-success/40 rounded space-y-2">
            <div className="flex items-center gap-2 text-success-light font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Damage Report #{result.damageReport?.reportId} Submitted
            </div>
            <p className="text-gray-300">
              Field damage data committed to MySQL database.
            </p>
          </div>

          {result.secondaryTriage && (
            <div className="p-4 bg-eoc-bg border border-eoc-border rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">Secondary AI Triage Reassessment:</span>
                <span className="font-mono text-2xs bg-cyan-950/60 px-2 py-0.5 rounded text-cyan-300 border border-cyan-800">
                  Confidence: {result.secondaryTriage.confidence}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span>Revised Severity: <strong className="text-gray-100 font-mono">{result.secondaryTriage.severity}/10</strong></span>
                <span>Risk Level: <strong className="text-gray-100">{result.secondaryTriage.riskLevel}</strong></span>
              </div>
              {result.escalated && (
                <div className="p-2.5 bg-emergency-subtle border border-emergency/40 rounded text-emergency-light font-semibold">
                  ⚠️ Incident severity escalated! Critical command alert broadcasted.
                </div>
              )}
              <p className="text-gray-400 text-2xs italic pt-1">
                Suggested Action: {result.secondaryTriage.suggestedAction}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={handleResetAndClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-emergency-subtle/30 border border-emergency/40 rounded text-emergency-light">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Damage Level *
              </label>
              <Select
                value={damageLevel}
                onChange={(e) => setDamageLevel(e.target.value)}
                options={[
                  { value: 'Minor', label: 'Minor' },
                  { value: 'Moderate', label: 'Moderate' },
                  { value: 'Severe', label: 'Severe' },
                  { value: 'Critical', label: 'Critical' },
                ]}
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Estimated Loss (USD)
              </label>
              <Input
                type="number"
                placeholder="e.g. 75000"
                value={estimatedLoss}
                onChange={(e) => setEstimatedLoss(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">
              Field Damage Description &amp; Scene Observations *
            </label>
            <textarea
              className="w-full bg-eoc-bg border border-eoc-border rounded p-2.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              rows={4}
              placeholder="Describe structural collapse, trapped individuals, hazardous material spread, utility damage..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">
              Photo URL / Visual Reference Reference (Optional)
            </label>
            <Input
              placeholder="https://example.com/photos/scene_damage_1.jpg"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleResetAndClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={submitting}>
              {submitting ? 'Submitting & Reassessing...' : 'Submit Assessment'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default SubmitDamageReportModal;
