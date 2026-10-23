import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { getCandidateShelters, assignShelter } from '../../api/shelters';
import { getIncidents } from '../../api/incidents';
import { Home, MapPin, AlertTriangle, Sparkles, Navigation, Users, ChevronDown } from 'lucide-react';

const ShelterAssignmentModal = ({
  isOpen,
  onClose,
  incident = null,
  preselectedIncident = null,
  preselectedShelter = null,
  onAssignmentSuccess,
}) => {
  const toast = useToast();

  const [incidentsList, setIncidentsList] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(incident || preselectedIncident || null);
  const [candidates, setCandidates] = useState([]);
  const [recommendedShelter, setRecommendedShelter] = useState(null);
  const [selectedShelterId, setSelectedShelterId] = useState(null);
  const [spaces, setSpaces] = useState(25);
  const [loading, setLoading] = useState(false);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 1. Sync or load incident
  useEffect(() => {
    if (!isOpen) {
      setCandidates([]);
      setError(null);
      return;
    }

    const initialIncident = incident || preselectedIncident;
    if (initialIncident) {
      setSelectedIncident(initialIncident);
      return;
    }

    // No incident passed — fetch active incidents
    const loadIncidents = async () => {
      setLoadingIncidents(true);
      setError(null);
      try {
        const res = await getIncidents({ limit: 50 });
        const list = res.data?.data?.incidents || [];
        setIncidentsList(list);
        if (list.length > 0) {
          // Preselect first unresolved incident or first available incident
          const activeFirst = list.find((i) => i.status !== 'Resolved') || list[0];
          setSelectedIncident(activeFirst);
        } else {
          setSelectedIncident(null);
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to load incident stream for shelter routing.');
        setLoading(false);
      } finally {
        setLoadingIncidents(false);
      }
    };

    loadIncidents();
  }, [isOpen, incident, preselectedIncident]);

  // 2. Load candidate shelters once an incident is resolved
  useEffect(() => {
    if (!isOpen || !selectedIncident?.id) {
      if (!selectedIncident && !loadingIncidents) {
        setLoading(false);
      }
      return;
    }

    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCandidateShelters(selectedIncident.id);
        const list = res.data?.data?.candidates || [];
        setCandidates(list);
        const rec = res.data?.data?.recommendedShelter;
        setRecommendedShelter(rec);

        if (preselectedShelter) {
          setSelectedShelterId(preselectedShelter.id || preselectedShelter.shelterId);
        } else if (rec) {
          setSelectedShelterId(rec.shelterId);
        } else if (list.length > 0) {
          setSelectedShelterId(list[0].shelterId);
        } else {
          setSelectedShelterId(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to calculate candidate shelters for this incident.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [isOpen, selectedIncident, preselectedShelter]);

  const selectedShelter = candidates.find((c) => c.shelterId === selectedShelterId);
  const availableSpaces = selectedShelter ? selectedShelter.availableSpaces : 0;
  const numSpaces = parseInt(spaces, 10) || 0;
  const remainingSpaces = Math.max(0, availableSpaces - numSpaces);
  const isOverCapacity = numSpaces > availableSpaces;
  const isInvalid = numSpaces <= 0;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedShelterId || !selectedIncident) return;
    if (isInvalid) {
      toast.error('Assigned spaces must be greater than zero.');
      return;
    }
    if (isOverCapacity) {
      toast.error(`Requested ${numSpaces} spaces exceeds available capacity (${availableSpaces} spaces).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await assignShelter(selectedIncident.id, {
        shelterId: selectedShelterId,
        assignedSpaces: numSpaces,
      });

      const sName = selectedShelter?.shelterName || 'Shelter';
      toast.success(`${numSpaces} evacuee spaces reserved at "${sName}" for Incident #${selectedIncident.id}.`);

      if (onAssignmentSuccess) {
        onAssignmentSuccess(res.data?.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign shelter capacity.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFixedIncident = Boolean(incident || preselectedIncident);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Evacuation Shelter Assignment — ${
        selectedIncident ? `Incident #${selectedIncident.id}` : 'Select Incident'
      }`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            icon={Home}
            loading={submitting}
            disabled={
              loading ||
              loadingIncidents ||
              isOverCapacity ||
              isInvalid ||
              !selectedShelterId ||
              !selectedIncident
            }
            onClick={handleAssign}
          >
            Confirm Shelter Assignment
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Incident Selector or Fixed Incident HUD */}
        {!isFixedIncident ? (
          <div>
            <label className="block text-2xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Select Target Incident for Evacuation:
            </label>
            {loadingIncidents ? (
              <div className="h-9 bg-eoc-bg rounded border border-eoc-border animate-pulse" />
            ) : incidentsList.length === 0 ? (
              <div className="p-3 bg-warning-subtle text-warning-light rounded border border-warning/30 text-xs">
                No active incidents found in the system requiring shelter evacuation.
              </div>
            ) : (
              <select
                className="w-full bg-eoc-bg border border-eoc-border rounded px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-info"
                value={selectedIncident?.id || ''}
                onChange={(e) => {
                  const targetId = Number(e.target.value);
                  const found = incidentsList.find((i) => i.id === targetId);
                  if (found) setSelectedIncident(found);
                }}
              >
                {incidentsList.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    #{inc.id} — {inc.incidentType} (Severity: {inc.severity}/10 · {inc.status})
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : null}

        {/* Selected Incident Summary Banner */}
        {selectedIncident && (
          <div className="p-3 bg-eoc-bg rounded border border-eoc-border flex items-center justify-between">
            <div>
              <span className="text-gray-400">Target Incident: </span>
              <strong className="text-gray-200">
                #{selectedIncident.id} — {selectedIncident.incidentType}
              </strong>
              <span className="text-gray-400 ml-3">Severity: </span>
              <strong className="text-emergency-light">{selectedIncident.severity}/10</strong>
            </div>
            <div className="flex items-center gap-1 font-mono text-2xs text-gray-400">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span>
                {isNaN(Number(selectedIncident.latitude))
                  ? '0.000'
                  : Number(selectedIncident.latitude).toFixed(3)}
                ,{' '}
                {isNaN(Number(selectedIncident.longitude))
                  ? '0.000'
                  : Number(selectedIncident.longitude).toFixed(3)}
              </span>
            </div>
          </div>
        )}

        {/* Input spaces */}
        <div>
          <label className="block text-2xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Evacuee Spaces to Reserve:
          </label>
          <input
            type="number"
            min="1"
            max={availableSpaces > 0 ? availableSpaces : undefined}
            className={`w-full bg-eoc-bg border rounded px-3 py-2 text-sm font-mono text-gray-100 focus:outline-none ${
              isOverCapacity
                ? 'border-emergency focus:border-emergency'
                : 'border-eoc-border focus:border-info'
            }`}
            value={spaces}
            onChange={(e) => setSpaces(e.target.value)}
            disabled={submitting || !selectedIncident}
          />
        </div>

        {/* Candidate List */}
        <div>
          <label className="block text-2xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Candidate Evacuation Shelters (Ranked by Proximity &amp; Capacity):
          </label>

          {loading ? (
            <div className="space-y-2">
              <div className="h-16 bg-eoc-bg rounded border border-eoc-border animate-pulse" />
              <div className="h-16 bg-eoc-bg rounded border border-eoc-border animate-pulse" />
            </div>
          ) : error ? (
            <div className="p-4 bg-emergency-subtle border border-emergency/30 rounded text-xs text-emergency-light">
              {error}
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-6 text-center bg-eoc-bg rounded border border-eoc-border text-gray-500">
              No candidate evacuation shelters found with available capacity.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {candidates.map((shelter) => {
                const isSelected = selectedShelterId === shelter.shelterId;
                const isRec = recommendedShelter?.shelterId === shelter.shelterId;
                const hasCapacity = shelter.availableSpaces > 0;

                return (
                  <div
                    key={shelter.shelterId}
                    onClick={() => hasCapacity && setSelectedShelterId(shelter.shelterId)}
                    className={`p-3 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-info/10 border-info shadow-panel'
                        : hasCapacity
                        ? 'bg-eoc-bg border-eoc-border hover:border-gray-600'
                        : 'bg-eoc-bg/40 border-eoc-border opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="selectedShelter"
                          checked={isSelected}
                          disabled={!hasCapacity}
                          onChange={() => setSelectedShelterId(shelter.shelterId)}
                          className="mt-1 accent-info cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-100 text-xs">
                              {shelter.shelterName}
                            </span>
                            {isRec && (
                              <span className="badge bg-success-subtle text-success-light border border-success/30 text-2xs flex items-center gap-1 font-semibold">
                                <Sparkles className="w-2.5 h-2.5" />
                                RECOMMENDED NEAREST
                              </span>
                            )}
                            <span
                              className={`badge text-2xs ${
                                shelter.status === 'Available'
                                  ? 'bg-success-subtle text-success-light border border-success/30'
                                  : shelter.status === 'Near Capacity'
                                  ? 'bg-warning-subtle text-warning-light border border-warning/30'
                                  : 'bg-emergency-subtle text-emergency-light border border-emergency/30'
                              }`}
                            >
                              {shelter.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-2xs text-gray-400 mt-1 font-mono">
                            <span>Location: {shelter.location}</span>
                            <span>
                              Available:{' '}
                              <strong className="text-gray-200">
                                {shelter.availableSpaces}
                              </strong>{' '}
                              / {shelter.capacity}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold font-mono text-info-light">
                          {shelter.distanceKm} km
                        </div>
                        <span className="text-2xs text-gray-500">Haversine</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Space Breakdown HUD */}
        {selectedShelter && (
          <div className="p-3 bg-eoc-bg rounded border border-eoc-border space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 bg-eoc-surface rounded border border-eoc-border">
                <span className="text-2xs text-gray-500 block uppercase">Available</span>
                <span className="text-sm font-bold text-gray-200">{availableSpaces}</span>
              </div>
              <div className="p-2 bg-eoc-surface rounded border border-eoc-border">
                <span className="text-2xs text-gray-500 block uppercase">Requested</span>
                <span
                  className={`text-sm font-bold ${
                    isOverCapacity ? 'text-emergency-light' : 'text-info-light'
                  }`}
                >
                  {numSpaces}
                </span>
              </div>
              <div className="p-2 bg-eoc-surface rounded border border-eoc-border">
                <span className="text-2xs text-gray-500 block uppercase">Remaining</span>
                <span
                  className={`text-sm font-bold ${
                    remainingSpaces === 0 ? 'text-emergency-light' : 'text-success-light'
                  }`}
                >
                  {remainingSpaces}
                </span>
              </div>
            </div>

            {isOverCapacity && (
              <div className="flex items-center gap-1.5 text-2xs text-emergency-light font-semibold pt-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Requested evacuee spaces exceed available shelter capacity!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShelterAssignmentModal;
