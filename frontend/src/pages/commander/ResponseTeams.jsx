import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import LoadingSkeleton, { SkeletonCard, SkeletonTable } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { getResponseTeams, updateResponseTeamStatus, allocateTeam } from '../../api/teams';
import { getIncidents } from '../../api/incidents';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Radio,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  LifeBuoy,
  Send,
} from 'lucide-react';

const ResponseTeams = () => {
  const { role } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [specializationFilter, setSpecializationFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Dispatch to Incident Modal State
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedTeamForDispatch, setSelectedTeamForDispatch] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getResponseTeams({
        availability: availabilityFilter !== 'All' ? availabilityFilter : undefined,
        specialization: specializationFilter !== 'All' ? specializationFilter : undefined,
      });
      setTeams(res.data.data.teams || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch response teams.');
    } finally {
      setLoading(false);
    }
  }, [availabilityFilter, specializationFilter]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Fetch active incidents for dispatch modal
  const handleOpenDispatchModal = async (team = null) => {
    setSelectedTeamForDispatch(team);
    setDispatchModalOpen(true);
    setIncidentsLoading(true);
    try {
      const res = await getIncidents({ limit: 50 });
      const activeList = (res.data?.data?.incidents || []).filter(
        (i) => i.status !== 'Resolved'
      );
      setIncidents(activeList);
      if (activeList.length > 0) {
        setSelectedIncidentId(String(activeList[0].id));
      }
    } catch (err) {
      toast.error('Failed to load active incidents for dispatch.');
    } finally {
      setIncidentsLoading(false);
    }
  };

  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (!selectedIncidentId) {
      toast.warning('Please select an active incident.');
      return;
    }
    const targetTeamId = selectedTeamForDispatch?.id;
    if (!targetTeamId) {
      toast.warning('Please select a response team to dispatch.');
      return;
    }

    setDispatchSubmitting(true);
    try {
      await allocateTeam(selectedIncidentId, targetTeamId);
      toast.success(
        `Team "${selectedTeamForDispatch.name}" dispatched to Incident #${selectedIncidentId}!`
      );
      setDispatchModalOpen(false);
      setSelectedTeamForDispatch(null);
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch response team.');
    } finally {
      setDispatchSubmitting(false);
    }
  };

  const handleStatusToggle = async (teamId, currentStatus) => {
    const nextStatus =
      currentStatus === 'Available'
        ? 'Off-duty'
        : currentStatus === 'Off-duty'
        ? 'Available'
        : 'Available';

    try {
      await updateResponseTeamStatus(teamId, nextStatus);
      toast.success(`Team #${teamId} status changed to ${nextStatus}.`);
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update team availability.');
    }
  };

  const filteredTeams = teams.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.leader?.toLowerCase().includes(q) ||
      t.specialization?.toLowerCase().includes(q)
    );
  });

  const totalCount = teams.length;
  const availableCount = teams.filter((t) => t.availability?.toLowerCase() === 'available').length;
  const deployedCount = teams.filter((t) => t.availability?.toLowerCase() === 'deployed').length;
  const offDutyCount = teams.filter((t) => t.availability?.toLowerCase() === 'off-duty').length;

  const isAdmin = role === 'admin';

  return (
    <AppShell
      title={isAdmin ? 'Fleet & Strike Unit Administration' : 'Response Teams Management'}
      onRefresh={fetchTeams}
    >
      <PageHeader
        title={
          isAdmin
            ? 'Response Fleet Administration & Deployment'
            : 'Emergency Response Teams & Tactical Dispatch'
        }
        subtitle={
          isAdmin
            ? `Administrative oversight, fleet readiness, and cross-incident dispatch — Authenticated as System Administrator`
            : `Manage field strike units, monitor live availability, and deploy teams to active incidents — Authenticated as Incident Commander`
        }
        breadcrumb={`${isAdmin ? 'Admin' : 'Commander'} / Response Teams`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              icon={Radio}
              onClick={() => handleOpenDispatchModal(null)}
              disabled={availableCount === 0}
            >
              Dispatch Unit to Incident
            </Button>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchTeams} disabled={loading}>
              Refresh Units
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* ── Metric Summary Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-500 uppercase tracking-widest font-semibold">Total Strike Units</span>
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <p className="metric-value text-gray-100 mt-2">{totalCount}</p>
                <p className="metric-label">Registered Response Units</p>
              </div>

              <div className="metric-card border-success/30 bg-success-subtle/20">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase tracking-widest font-semibold">Available for Dispatch</span>
                  <CheckCircle2 className="w-4 h-4 text-success-light" />
                </div>
                <p className="metric-value text-success-light mt-2">{availableCount}</p>
                <p className="metric-label">Ready for immediate deployment</p>
              </div>

              <div className="metric-card border-info/30 bg-info-subtle/20">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase tracking-widest font-semibold">Currently Deployed</span>
                  <Radio className="w-4 h-4 text-info-light" />
                </div>
                <p className="metric-value text-info-light mt-2">{deployedCount}</p>
                <p className="metric-label">Active on incident scenes</p>
              </div>

              <div className="metric-card border-warning/30 bg-warning-subtle/20">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase tracking-widest font-semibold">Off-Duty Reserve</span>
                  <Activity className="w-4 h-4 text-warning-light" />
                </div>
                <p className="metric-value text-warning-light mt-2">{offDutyCount}</p>
                <p className="metric-label">Available on recall standby</p>
              </div>
            </>
          )}
        </div>

        {/* ── Filter / Search Bar ────────────────────────────────────────── */}
        <Card>
          <div className="p-4 border-b border-eoc-border bg-eoc-surface/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by team name, leader, or specialization..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-9 text-xs w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Availability:</span>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="select text-xs py-1"
                >
                  <option value="All">All Units</option>
                  <option value="Available">Available</option>
                  <option value="Deployed">Deployed</option>
                  <option value="Off-duty">Off-duty</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Specialization:</span>
                <select
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  className="select text-xs py-1"
                >
                  <option value="All">All Specialties</option>
                  <option value="Urban Search & Rescue">Urban Search &amp; Rescue</option>
                  <option value="Hazmat">Hazmat</option>
                  <option value="Flood Rescue">Flood Rescue</option>
                  <option value="Wildfire Response">Wildfire Response</option>
                  <option value="Medical Response">Medical Response</option>
                  <option value="Technical Rescue">Technical Rescue</option>
                </select>
              </div>
            </div>
          </div>

          <CardBody className="p-0">
            {loading ? (
              <div className="p-4">
                <SkeletonTable rows={5} cols={7} />
              </div>
            ) : error ? (
              <div className="p-8">
                <ErrorState message={error} onRetry={fetchTeams} />
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Users}
                  title="No Response Teams Found"
                  description="Try clearing search filters to see all registered response teams."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Team Name</th>
                      <th>Specialization</th>
                      <th>Leader</th>
                      <th>Base Coordinates</th>
                      <th>Assigned Incident</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team) => (
                      <tr key={team.id} className="hover:bg-eoc-hover/80 transition-colors">
                        <td className="font-mono text-xs text-gray-400">#{team.id}</td>
                        <td className="font-semibold text-gray-200 text-xs">{team.name}</td>
                        <td>
                          <span className="badge bg-eoc-bg text-info-light border border-info/30 text-xs">
                            {team.specialization}
                          </span>
                        </td>
                        <td className="text-xs text-gray-300">{team.leader}</td>
                        <td className="text-xs text-gray-400 font-mono">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span>
                              {Number(team.latitude).toFixed(4)}, {Number(team.longitude).toFixed(4)}
                            </span>
                          </div>
                        </td>
                        <td>
                          {team.assignedIncidentId ? (
                            <Link
                              to={`/commander/incidents/${team.assignedIncidentId}`}
                              className="text-xs text-info-light hover:underline font-mono"
                            >
                              Incident #{team.assignedIncidentId}
                            </Link>
                          ) : (
                            <span className="text-2xs text-gray-600 italic">None</span>
                          )}
                        </td>
                        <td>
                          <StatusPill status={team.availability} />
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {team.availability === 'Available' ? (
                              <>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={Send}
                                  onClick={() => handleOpenDispatchModal(team)}
                                  title="Dispatch this unit to an active incident"
                                >
                                  Dispatch
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusToggle(team.id, team.availability)}
                                >
                                  Set Off-duty
                                </Button>
                              </>
                            ) : team.availability === 'Off-duty' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusToggle(team.id, team.availability)}
                              >
                                Set Available
                              </Button>
                            ) : (
                              <span className="text-2xs text-emergency-light font-semibold px-2 py-1 bg-emergency-subtle/30 rounded border border-emergency/20">
                                Deployed on Scene
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── MODAL: DISPATCH UNIT TO INCIDENT ──────────────────────────────── */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title={
          selectedTeamForDispatch
            ? `Dispatch: ${selectedTeamForDispatch.name}`
            : 'Dispatch Unit to Active Incident'
        }
      >
        <form onSubmit={handleConfirmDispatch} className="space-y-4">
          <p className="text-xs text-gray-400">
            {isAdmin
              ? 'Administrator dispatch authority — assigning unit deployment to an active emergency.'
              : 'Commander tactical dispatch — deploying specialized strike unit to operational incident.'}
          </p>

          {!selectedTeamForDispatch && (
            <Select
              label="Select Available Strike Unit"
              value={selectedTeamForDispatch?.id ? String(selectedTeamForDispatch.id) : ''}
              onChange={(e) => {
                const found = teams.find((t) => String(t.id) === e.target.value);
                setSelectedTeamForDispatch(found || null);
              }}
              options={[
                { value: '', label: '-- Choose Available Team --' },
                ...teams
                  .filter((t) => t.availability === 'Available')
                  .map((t) => ({
                    value: String(t.id),
                    label: `${t.name} (${t.specialization})`,
                  })),
              ]}
              required
            />
          )}

          {selectedTeamForDispatch && (
            <div className="p-3 bg-eoc-surface rounded border border-eoc-border space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-200">{selectedTeamForDispatch.name}</span>
                <span className="badge badge-success text-2xs">{selectedTeamForDispatch.availability}</span>
              </div>
              <p className="text-gray-400 text-2xs">Leader: {selectedTeamForDispatch.leader}</p>
              <p className="text-info-light text-2xs">Specialization: {selectedTeamForDispatch.specialization}</p>
            </div>
          )}

          {incidentsLoading ? (
            <p className="text-xs text-gray-500 italic">Loading active incidents...</p>
          ) : incidents.length === 0 ? (
            <div className="p-3 bg-warning-subtle text-warning-light rounded text-xs">
              No active incidents currently need dispatch.
            </div>
          ) : (
            <Select
              label="Select Active Incident Target"
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              options={incidents.map((inc) => ({
                value: String(inc.id),
                label: `Incident #${inc.id} — ${inc.incidentType} (Severity ${inc.severity}/10, Status: ${inc.status})`,
              }))}
              required
            />
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-eoc-border">
            <Button variant="ghost" size="sm" onClick={() => setDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Send}
              loading={dispatchSubmitting}
              type="submit"
              disabled={!selectedTeamForDispatch || incidents.length === 0}
            >
              Confirm Deployment
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};

export default ResponseTeams;
