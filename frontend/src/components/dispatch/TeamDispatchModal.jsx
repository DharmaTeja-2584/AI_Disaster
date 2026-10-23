import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge, { PriorityBadge } from '../ui/Badge';
import StatusPill from '../ui/StatusPill';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import { getCandidateTeams, allocateTeam } from '../../api/teams';
import { useToast } from '../ui/Toast';
import {
  Users,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  MapPin,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const TeamDispatchModal = ({ isOpen, onClose, incident, onDispatchSuccess }) => {
  const toast = useToast();
  const [candidates, setCandidates] = useState([]);
  const [recommendedTeam, setRecommendedTeam] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !incident) return;

    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCandidateTeams(incident.id);
        const list = res.data.data.candidates || [];
        setCandidates(list);
        const rec = res.data.data.recommendedTeam;
        setRecommendedTeam(rec);
        if (rec) {
          setSelectedTeamId(rec.teamId);
        } else if (list.length > 0) {
          setSelectedTeamId(list[0].teamId);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to calculate candidate response teams.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [isOpen, incident]);

  const handleDispatch = async () => {
    if (!selectedTeamId || !incident) return;

    setDispatching(true);
    try {
      const res = await allocateTeam(incident.id, selectedTeamId);
      const data = res.data.data;
      toast.success(
        `Team "${data.team.teamName}" dispatched to Incident #${incident.id} (${data.distanceKm} km away).`
      );
      if (onDispatchSuccess) {
        onDispatchSuccess(data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate and dispatch response team.');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Smart Dispatch — Incident #${incident?.id} (${incident?.incidentType})`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={dispatching}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            icon={Navigation}
            loading={dispatching}
            disabled={!selectedTeamId || candidates.length === 0}
            onClick={handleDispatch}
          >
            Deploy Selected Response Team
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Incident Context Header */}
        <div className="p-3 bg-eoc-bg rounded border border-eoc-border flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-400">Incident Type: </span>
            <strong className="text-gray-200">{incident?.incidentType}</strong>
            <span className="text-gray-400 ml-3">Severity: </span>
            <strong className="text-emergency-light">{incident?.severity}/10</strong>
          </div>
          <div className="flex items-center gap-1 font-mono text-2xs text-gray-400">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span>
              {Number(incident?.latitude).toFixed(3)}, {Number(incident?.longitude).toFixed(3)}
            </span>
          </div>
        </div>

        {/* Algorithm Summary Banner */}
        <div className="alert-info-box flex items-start gap-2.5 text-xs">
          <Radio className="w-4 h-4 mt-0.5 text-info-light flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-200">Haversine Great-Circle Geospatial Ranking</p>
            <p className="text-gray-400">
              The backend queries currently available response teams, calculates great-circle distance in kilometers,
              and flags primary specialization compatibility.
            </p>
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="space-y-2.5">
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
          </div>
        ) : error ? (
          <div className="p-4 bg-emergency-subtle border border-emergency/30 rounded text-xs text-emergency-light">
            {error}
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center bg-eoc-bg rounded border border-eoc-border text-xs text-gray-500">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-warning-light" />
            <p className="font-semibold text-gray-300">No Available Response Teams Found</p>
            <p className="mt-1">All registered teams are currently deployed or off-duty.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {candidates.map((team) => {
              const isSelected = selectedTeamId === team.teamId;
              const isRec = recommendedTeam?.teamId === team.teamId;

              return (
                <div
                  key={team.teamId}
                  onClick={() => setSelectedTeamId(team.teamId)}
                  className={`p-3.5 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-info/10 border-info shadow-panel'
                      : 'bg-eoc-bg border-eoc-border hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="selectedTeam"
                        checked={isSelected}
                        onChange={() => setSelectedTeamId(team.teamId)}
                        className="mt-1 accent-info cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-100 text-xs">{team.teamName}</span>
                          {isRec && (
                            <span className="badge bg-success-subtle text-success-light border border-success/30 text-2xs flex items-center gap-1 font-semibold">
                              <Sparkles className="w-2.5 h-2.5" />
                              RECOMMENDED NEAREST
                            </span>
                          )}
                          {team.isSpecializationMatch && (
                            <span className="badge bg-info-subtle text-info-light border border-info/30 text-2xs">
                              ✓ Specialization Match
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-2xs text-gray-400 mt-1 font-mono">
                          <span>Specialization: <strong className="text-gray-300">{team.specialization}</strong></span>
                          <span>Leader: {team.leader}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold font-mono text-info-light">
                        {team.distanceKm} km
                      </div>
                      <span className="text-2xs text-gray-500">Haversine dist</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TeamDispatchModal;
