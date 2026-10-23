import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { allocateResource, getResources } from '../../api/resources';
import { getIncidents } from '../../api/incidents';
import { Package, Send, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

const ResourceAllocationModal = ({
  isOpen,
  onClose,
  preselectedIncident = null,
  preselectedResource = null,
  onAllocationSuccess,
}) => {
  const toast = useToast();

  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [incRes, resRes] = await Promise.all([
          getIncidents({ limit: 50 }),
          getResources({ limit: 100 }),
        ]);

        const incList = incRes.data.data.incidents || [];
        setIncidents(incList);

        const resList = (resRes.data.data.resources || []).filter(
          (r) => r.computedStatus !== 'Unavailable' && r.quantity > 0
        );
        setResources(resList);

        if (preselectedIncident) {
          setSelectedIncidentId(String(preselectedIncident.id));
        } else if (incList.length > 0) {
          setSelectedIncidentId(String(incList[0].id));
        }

        if (preselectedResource) {
          setSelectedResourceId(String(preselectedResource.id));
        } else if (resList.length > 0) {
          setSelectedResourceId(String(resList[0].id));
        }
      } catch (err) {
        toast.error('Failed to load incident or resource data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, preselectedIncident, preselectedResource, toast]);

  const selectedResource = resources.find((r) => String(r.id) === String(selectedResourceId));
  const availableStock = selectedResource ? selectedResource.quantity : 0;
  const numQuantity = parseInt(quantity, 10) || 0;
  const remainingStock = Math.max(0, availableStock - numQuantity);
  const isOverAllocated = numQuantity > availableStock;
  const isInvalidQuantity = numQuantity <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIncidentId || !selectedResourceId) {
      toast.error('Please select both an incident and a resource.');
      return;
    }
    if (isInvalidQuantity) {
      toast.error('Allocation quantity must be greater than zero.');
      return;
    }
    if (isOverAllocated) {
      toast.error(`Requested quantity exceeds available stock (${availableStock} units).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await allocateResource(selectedIncidentId, {
        resourceId: Number(selectedResourceId),
        quantity: numQuantity,
      });

      const resName = selectedResource?.name || 'Resource';
      toast.success(`${numQuantity} ${resName} allocated successfully.`);

      if (onAllocationSuccess) {
        onAllocationSuccess(res.data.data);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to allocate resource.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Allocate Emergency Resources"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            icon={Send}
            loading={submitting}
            disabled={loading || isOverAllocated || isInvalidQuantity || !selectedResource}
            onClick={handleSubmit}
          >
            Confirm Allocation
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Incident Selector */}
        <div>
          <label className="block text-2xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Target Incident:
          </label>
          {preselectedIncident ? (
            <div className="p-2.5 bg-eoc-bg rounded border border-eoc-border text-gray-200 font-medium">
              Incident #{preselectedIncident.id} — {preselectedIncident.incidentType} (Severity: {preselectedIncident.severity}/10)
            </div>
          ) : (
            <select
              className="form-select text-xs w-full"
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              disabled={loading || submitting}
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  #{inc.id} - {inc.incidentType} (Severity: {inc.severity}/10, {inc.status})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Resource Selector */}
        <div>
          <label className="block text-2xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Select Resource to Deploy:
          </label>
          <select
            className="form-select text-xs w-full"
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            disabled={loading || submitting}
          >
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name} — {res.category} ({res.quantity} in stock @ {res.location})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider">
              Allocation Quantity:
            </label>
            <span className="text-2xs text-gray-400 font-mono">
              Available: <strong className="text-success-light">{availableStock}</strong> units
            </span>
          </div>
          <input
            type="number"
            min="1"
            max={availableStock}
            className={`form-input text-sm font-mono w-full ${
              isOverAllocated ? 'border-emergency focus:border-emergency' : ''
            }`}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* Stock Breakdown HUD */}
        {selectedResource && (
          <div className="p-3 bg-eoc-bg rounded border border-eoc-border space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 bg-eoc-surface rounded border border-eoc-border">
                <span className="text-2xs text-gray-500 block uppercase">Available</span>
                <span className="text-sm font-bold text-gray-200">{availableStock}</span>
              </div>
              <div className="p-2 bg-eoc-surface rounded border border-eoc-border">
                <span className="text-2xs text-gray-500 block uppercase">Requested</span>
                <span className={`text-sm font-bold ${isOverAllocated ? 'text-emergency-light' : 'text-info-light'}`}>
                  {numQuantity}
                </span>
              </div>
              <div className="p-2 bg-eoc-surface rounded border border-eoc-border">
                <span className="text-2xs text-gray-500 block uppercase">Remaining</span>
                <span className={`text-sm font-bold ${remainingStock === 0 ? 'text-warning-light' : 'text-success-light'}`}>
                  {remainingStock}
                </span>
              </div>
            </div>

            {isOverAllocated && (
              <div className="flex items-center gap-1.5 text-2xs text-emergency-light font-semibold pt-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Requested quantity exceeds available inventory stock!</span>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default ResourceAllocationModal;
