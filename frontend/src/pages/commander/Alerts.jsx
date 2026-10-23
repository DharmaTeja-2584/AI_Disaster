import React, { useState } from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import AlertCenter from '../../components/alerts/AlertCenter';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { createAlert } from '../../api/alerts';
import { useAuth } from '../../context/AuthContext';
import { Bell, AlertTriangle } from 'lucide-react';

const CommanderAlerts = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('Critical');
  const [incidentId, setIncidentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setSubmitError('Title and message are required.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      await createAlert({
        title: title.trim(),
        message: message.trim(),
        priority,
        incidentId: incidentId.trim() ? Number(incidentId.trim()) : undefined,
      });

      setShowModal(false);
      setTitle('');
      setMessage('');
      setPriority('Critical');
      setIncidentId('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to issue alert.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title={isAdmin ? 'Emergency Broadcasts & Alert Oversight' : 'Emergency Broadcast & Alert Center'}>
      <PageHeader
        title={isAdmin ? 'Emergency Operations Alert Oversight' : 'Emergency Operations Alert Center'}
        subtitle={
          isAdmin
            ? 'System-wide broadcast management, incident escalation warnings, and advisory oversight — Authenticated as System Administrator'
            : 'Operational broadcasts, hazard escalations, and tactical advisories — Authenticated as Incident Commander'
        }
        breadcrumb={`${isAdmin ? 'Admin' : 'Commander'} / Alert Center`}
      />

      <div className="p-6 max-w-7xl mx-auto">
        <AlertCenter
          key={refreshKey}
          canCreate={true}
          onCreateClick={() => setShowModal(true)}
        />
      </div>

      {/* Issue Alert Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title="Issue Operational Broadcast Alert"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 bg-emergency-subtle/30 border border-emergency/40 rounded text-emergency-light">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-gray-300 font-semibold mb-1">
              Alert Title *
            </label>
            <Input
              placeholder="e.g. FLASH FLOOD WARNING: Sector 4 Evacuation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Priority Level *
              </label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={[
                  { value: 'Critical', label: 'Critical (Red)' },
                  { value: 'Warning', label: 'Warning (Orange)' },
                  { value: 'Info', label: 'Info (Blue)' },
                ]}
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Link Incident ID (Optional)
              </label>
              <Input
                type="number"
                placeholder="e.g. 19"
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">
              Alert Broadcast Message *
            </label>
            <textarea
              className="w-full bg-eoc-bg border border-eoc-border rounded p-2.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              rows={4}
              placeholder="Detailed emergency instruction, evacuation corridors, or operational directives..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={submitting}>
              {submitting ? 'Broadcasting...' : 'Broadcast Alert'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};

export default CommanderAlerts;
