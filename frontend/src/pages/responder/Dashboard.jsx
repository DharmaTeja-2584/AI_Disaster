import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { SeverityBadge, PriorityBadge } from '../../components/ui/Badge';
import StatusPill from '../../components/ui/StatusPill';
import LoadingSkeleton, { SkeletonCard, SkeletonTable } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import { getIncidents, updateIncidentStatus } from '../../api/incidents';
import { getResponseTeams } from '../../api/teams';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  Radio,
  Users,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Clock,
  ShieldCheck,
  Activity,
  Cpu,
  ArrowRight,
} from 'lucide-react';

const ResponderDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [incidents, setIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, teamsRes] = await Promise.all([
        getIncidents({ limit: 10 }),
        getResponseTeams(),
      ]);
      setIncidents(incRes.data.data.incidents || []);
      setTeams(teamsRes.data.data.teams || []);
    } catch (err) {
      console.error('Failed to load responder dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeIncidents = incidents.filter(
    (i) => i.status === 'Active' || i.status === 'Reported' || i.status === 'Triaged'
  );
  const highPriority = incidents.filter(
    (i) => Number(i.severity) >= 7 || i.riskLevel === 'High'
  );
  const deployedTeams = teams.filter((t) => t.availability?.toLowerCase() === 'deployed');

  const handleQuickStatusUpdate = async (incidentId, newStatus) => {
    try {
      await updateIncidentStatus(incidentId, newStatus);
      toast.success(`Incident #${incidentId} updated to ${newStatus}.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <AppShell title="Responder Operations Hub" onRefresh={fetchData}>
      <PageHeader
        title="Field Responder Operations Hub"
        subtitle={`Tactical On-Scene Response Center — Logged in as ${user?.name || 'Field Responder'} (Unit Operational)`}
        breadcrumb="Responder / Tactical HUD"
        actions={
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchData} disabled={loading}>
            Refresh Feed
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* ── Operational Metric Cards ──────────────────────────────────── */}
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
              <div className="metric-card border-warning/40 bg-warning-subtle/20">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase tracking-widest font-semibold">Active Incidents</span>
                  <Radio className="w-4 h-4 text-warning-light" />
                </div>
                <p className="metric-value text-warning-light mt-2">{activeIncidents.length}</p>
                <p className="metric-label">Assigned for immediate response</p>
              </div>

              <div className="metric-card border-emergency/40 bg-emergency-subtle/20">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase tracking-widest font-semibold">Critical Threats</span>
                  <AlertTriangle className="w-4 h-4 text-emergency-light" />
                </div>
                <p className="metric-value text-emergency-light mt-2">{highPriority.length}</p>
                <p className="metric-label">High Severity (Score ≥ 7/10)</p>
              </div>

              <div className="metric-card border-info/40 bg-info-subtle/20">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase tracking-widest font-semibold">Deployed Strike Teams</span>
                  <Users className="w-4 h-4 text-info-light" />
                </div>
                <p className="metric-value text-info-light mt-2">{deployedTeams.length}</p>
                <p className="metric-label">Units currently on mission</p>
              </div>

              <div className="metric-card border-success/30 bg-success-subtle/20">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase tracking-widest font-semibold">Responder Readiness</span>
                  <CheckCircle2 className="w-4 h-4 text-success-light" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="live-dot" />
                  <p className="metric-value text-success-light">Active Duty</p>
                </div>
                <p className="metric-label">Field comms connected</p>
              </div>
            </>
          )}
        </div>

        {/* ── Active Assigned Incidents Table ───────────────────────────── */}
        <Card>
          <CardHeader
            actions={
              <Link to="/responder/incidents">
                <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                  View All Field Incidents
                </Button>
              </Link>
            }
          >
            <CardTitle>Active Field Incident Assignments ({activeIncidents.length})</CardTitle>
            <CardSubtitle>Real-time incidents requiring tactical containment, triage, or resolution</CardSubtitle>
          </CardHeader>

          <CardBody className="p-0">
            {loading ? (
              <div className="p-4">
                <SkeletonTable rows={4} cols={7} />
              </div>
            ) : activeIncidents.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={CheckCircle2}
                  title="No Active Emergency Deployments"
                  description="All reported incidents are currently contained or resolved. Standing by for dispatch."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Disaster Type</th>
                      <th>GPS Coordinates</th>
                      <th>Severity</th>
                      <th>AI Priority</th>
                      <th>Assigned Unit</th>
                      <th>Status</th>
                      <th className="text-right">Tactical Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeIncidents.map((item) => (
                      <tr key={item.id} className="hover:bg-eoc-hover/80 transition-colors">
                        <td className="font-mono text-xs font-bold text-gray-300">#{item.id}</td>
                        <td>
                          <p className="font-semibold text-gray-100 text-xs">{item.incidentType}</p>
                          <p className="text-2xs text-gray-500 line-clamp-1 max-w-[220px]">
                            {item.description}
                          </p>
                        </td>
                        <td className="text-xs text-gray-400 font-mono">
                          <div className="flex items-center gap-1 text-2xs">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span>
                              {Number(item.latitude).toFixed(3)}, {Number(item.longitude).toFixed(3)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <SeverityBadge severity={item.severity} />
                        </td>
                        <td>
                          <PriorityBadge
                            priority={
                              item.riskLevel ||
                              (Number(item.severity) >= 7
                                ? 'High'
                                : Number(item.severity) >= 4
                                ? 'Medium'
                                : 'Low')
                            }
                          />
                        </td>
                        <td>
                          {item.assignedTeamName ? (
                            <span className="badge bg-info-subtle text-info-light border border-info/30 text-2xs font-semibold">
                              🛡️ {item.assignedTeamName}
                            </span>
                          ) : (
                            <span className="badge bg-eoc-bg text-gray-500 border border-eoc-border text-2xs">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td>
                          <StatusPill status={item.status || 'Reported'} />
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status !== 'Contained' && item.status !== 'Resolved' && (
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => handleQuickStatusUpdate(item.id, 'Contained')}
                              >
                                Contain
                              </Button>
                            )}
                            {item.status !== 'Resolved' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleQuickStatusUpdate(item.id, 'Resolved')}
                              >
                                Resolve
                              </Button>
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
    </AppShell>
  );
};

export default ResponderDashboard;
