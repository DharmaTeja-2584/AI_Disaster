import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { SeverityBadge, PriorityBadge } from '../../components/ui/Badge';
import StatusPill from '../../components/ui/StatusPill';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import ErrorState from '../../components/ui/ErrorState';
import AIPredictionPanel from '../../components/ai/AIPredictionPanel';
import TeamDispatchModal from '../../components/dispatch/TeamDispatchModal';
import ResourceAllocationModal from '../../components/resources/ResourceAllocationModal';
import ShelterAssignmentModal from '../../components/shelters/ShelterAssignmentModal';
import SubmitDamageReportModal from '../../components/damage/SubmitDamageReportModal';
import OperationalTimeline from '../../components/timeline/OperationalTimeline';
import AlertBadge from '../../components/alerts/AlertBadge';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { getIncidentById, updateIncidentStatus } from '../../api/incidents';
import { releaseResourceAllocation } from '../../api/resources';
import { releaseShelterAssignment } from '../../api/shelters';
import {
  AlertTriangle,
  ArrowLeft,
  MapPin,
  Clock,
  Activity,
  Users,
  Package,
  Home,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Info,
  Navigation,
  Send,
  RotateCcw,
  Bell,
  DollarSign,
  Brain,
} from 'lucide-react';

const STATUS_LIFECYCLE = ['Reported', 'Triaged', 'Active', 'Contained', 'Resolved'];

const IncidentDetails = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isShelterModalOpen, setIsShelterModalOpen] = useState(false);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getIncidentById(id);
      setIncident(res.data.data.incident);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incident details from database.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleStatusChange = async (newStatus) => {
    if (!incident || incident.status === newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await updateIncidentStatus(id, newStatus);
      setIncident((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Incident #${id} operational status transitioned to "${newStatus}".`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update operational status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReleaseAllocation = async (allocationId) => {
    try {
      await releaseResourceAllocation(allocationId);
      toast.success(`Resource allocation #${allocationId} released back to inventory.`);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release allocation.');
    }
  };

  const handleReleaseShelterAssignment = async (assignmentId) => {
    try {
      await releaseShelterAssignment(assignmentId);
      toast.success(`Shelter assignment #${assignmentId} released.`);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release shelter assignment.');
    }
  };

  const isOperationalRole = role === 'commander' || role === 'admin' || role === 'responder';

  return (
    <AppShell title={`Incident #${id} Details`} onRefresh={fetchDetails}>
      <PageHeader
        title={`Incident #${id} — Operations Inspection`}
        subtitle="Operational triage, AI assessment review, and incident lifecycle management"
        breadcrumb="Commander / Incidents / Detail"
        actions={
          <Link to="/commander/command-center">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              Back to Command Center
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="skeleton h-64 w-full" />
              <div className="skeleton h-64 w-full" />
            </div>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDetails} />
        ) : incident ? (
          <>
            {/* ── Top Overview Banner ──────────────────────────────────── */}
            <div className="card p-5 border-l-4 border-l-emergency">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-mono text-xs font-bold text-gray-400">
                      INCIDENT #{incident.id}
                    </span>
                    <SeverityBadge severity={incident.severity} />
                    <PriorityBadge
                      priority={
                        incident.riskLevel ||
                        (Number(incident.severity) >= 7
                          ? 'High'
                          : Number(incident.severity) >= 4
                          ? 'Medium'
                          : 'Low')
                      }
                    />
                    <StatusPill status={incident.status || 'Reported'} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-100">{incident.incidentType}</h2>
                  <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
                    {incident.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 text-xs text-gray-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>
                      {Number(incident.latitude).toFixed(4)}, {Number(incident.longitude).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{new Date(incident.reportedTime).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Status Lifecycle Pipeline ────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-warning-light" />
                  Incident Operational Lifecycle
                </CardTitle>
                <CardSubtitle>
                  {isOperationalRole
                    ? 'Click a status state to update the incident in MySQL'
                    : 'Current operational stage (View-Only)'}
                </CardSubtitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-5 gap-2">
                  {STATUS_LIFECYCLE.map((stage, idx) => {
                    const isCurrent = incident.status === stage;
                    const stageIndex = STATUS_LIFECYCLE.indexOf(incident.status || 'Reported');
                    const isPast = stageIndex >= idx;

                    return (
                      <button
                        key={stage}
                        disabled={!isOperationalRole || updatingStatus}
                        onClick={() => handleStatusChange(stage)}
                        className={`p-3 rounded text-center transition-all border ${
                          isCurrent
                            ? 'bg-emergency/20 border-emergency text-emergency-light font-bold shadow-panel scale-[1.02]'
                            : isPast
                            ? 'bg-eoc-surface border-success/30 text-success-light'
                            : 'bg-eoc-bg border-eoc-border text-gray-500 hover:text-gray-300'
                        } ${!isOperationalRole ? 'cursor-default' : 'cursor-pointer hover:border-info/50'}`}
                      >
                        <div className="text-2xs uppercase tracking-widest text-gray-500 mb-1">
                          Stage {idx + 1}
                        </div>
                        <div className="text-xs font-semibold">{stage}</div>
                        {isCurrent && (
                          <div className="mt-1 flex justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emergency animate-pulse-slow" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* ── AI Triage Panel ──────────────────────────────────────── */}
            <AIPredictionPanel
              predictionId={incident.predictionId}
              riskLevel={
                incident.riskLevel ||
                (Number(incident.severity) >= 7
                  ? 'High'
                  : Number(incident.severity) >= 4
                  ? 'Medium'
                  : 'Low')
              }
              confidence={incident.confidence || 94.0}
              suggestedAction={incident.suggestedAction}
              predictionTime={incident.predictionTime}
              severity={incident.severity}
            />

            {/* ── Operational Sections Grid ────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Response Team Section (Haversine Smart Dispatch) */}
              <Card className="border-eoc-border">
                <CardHeader
                  actions={
                    <span className="badge bg-info-subtle text-info-light border border-info/30 text-2xs">
                      Haversine Dispatch
                    </span>
                  }
                >
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-info-light" />
                    Response Team Assignment
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-3">
                  {incident.dispatches && incident.dispatches.length > 0 ? (
                    <div className="space-y-2">
                      {incident.dispatches.map((d) => (
                        <div
                          key={d.dispatchId}
                          className="p-3 bg-eoc-bg rounded border border-eoc-border space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-100 text-xs">{d.teamName}</span>
                            <StatusPill status={d.status || 'Deployed'} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-2xs text-gray-400 font-mono">
                            <span>Specialization: <strong className="text-gray-300">{d.specialization}</strong></span>
                            <span>Leader: {d.leader}</span>
                          </div>
                          <div className="text-2xs text-gray-500 font-mono">
                            Dispatched: {new Date(d.dispatchTime).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-eoc-bg rounded border border-eoc-border text-xs text-gray-500 italic">
                      No response team dispatched to this incident yet.
                    </div>
                  )}

                  {isOperationalRole && incident.status !== 'Resolved' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Navigation}
                      onClick={() => setIsDispatchModalOpen(true)}
                      className="w-full justify-center"
                    >
                      Allocate &amp; Dispatch Team
                    </Button>
                  )}
                </CardBody>
              </Card>

              {/* 2. Resource Allocation Section (Live MySQL data from resource_allocation) */}
              <Card className="border-eoc-border">
                <CardHeader
                  actions={
                    <span className="badge bg-warning-subtle text-warning-light border border-warning/30 text-2xs">
                      Live Inventory
                    </span>
                  }
                >
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-warning-light" />
                    Resource Allocations ({incident.allocations?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-3">
                  {incident.allocations && incident.allocations.length > 0 ? (
                    <div className="space-y-2">
                      {incident.allocations.map((alloc) => (
                        <div
                          key={alloc.allocationId}
                          className="p-2.5 bg-eoc-bg rounded border border-eoc-border flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-200">{alloc.resourceName}</span>
                              <span className="text-2xs text-gray-500">({alloc.category})</span>
                            </div>
                            <div className="text-2xs text-gray-400 font-mono mt-0.5">
                              Assigned: {alloc.assignedTime ? new Date(alloc.assignedTime).toLocaleTimeString() : 'Recent'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-info-light font-bold">Qty: {alloc.quantity}</span>
                            <StatusPill status={alloc.status || 'Allocated'} />
                            {isOperationalRole && alloc.status === 'Allocated' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={RotateCcw}
                                onClick={() => handleReleaseAllocation(alloc.allocationId)}
                                title="Release allocation back to inventory"
                              >
                                Release
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-eoc-bg rounded border border-eoc-border text-xs text-gray-500 italic">
                      No resources allocated to this incident yet.
                    </div>
                  )}

                  {isOperationalRole && incident.status !== 'Resolved' && (
                    <Button
                      variant="warning"
                      size="sm"
                      icon={Send}
                      onClick={() => setIsResourceModalOpen(true)}
                      className="w-full justify-center"
                    >
                      Allocate Emergency Supplies
                    </Button>
                  )}
                </CardBody>
              </Card>

              {/* 3. Shelter Evacuation Section (Live MySQL data from incident_shelter) */}
              <Card className="border-eoc-border">
                <CardHeader
                  actions={
                    <span className="badge bg-success-subtle text-success-light border border-success/30 text-2xs">
                      Live Intake
                    </span>
                  }
                >
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Home className="w-4 h-4 text-success-light" />
                    Shelter Assignments ({incident.shelters?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-3">
                  {incident.shelters && incident.shelters.length > 0 ? (
                    <div className="space-y-2">
                      {incident.shelters.map((shl) => (
                        <div
                          key={shl.assignmentId}
                          className="p-2.5 bg-eoc-bg rounded border border-eoc-border flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-gray-200">{shl.shelterName}</div>
                            <div className="text-2xs text-gray-400 font-mono mt-0.5">
                              {shl.location} • Assigned: {shl.assignedTime ? new Date(shl.assignedTime).toLocaleTimeString() : 'Recent'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-success-light font-bold">Spaces: {shl.assignedSpaces}</span>
                            <StatusPill status={shl.status || 'Assigned'} />
                            {isOperationalRole && shl.status === 'Assigned' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={RotateCcw}
                                onClick={() => handleReleaseShelterAssignment(shl.assignmentId)}
                                title="Release evacuee spaces"
                              >
                                Release
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-eoc-bg rounded border border-eoc-border text-xs text-gray-500 italic">
                      No evacuation shelters assigned to this incident yet.
                    </div>
                  )}

                  {isOperationalRole && incident.status !== 'Resolved' && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={Home}
                      onClick={() => setIsShelterModalOpen(true)}
                      className="w-full justify-center"
                    >
                      Assign Evacuation Shelter
                    </Button>
                  )}
                </CardBody>
              </Card>

              {/* 4. Field Damage Reports Section */}
              <Card className="border-eoc-border">
                <CardHeader
                  actions={
                    <span className="badge bg-emergency-subtle text-emergency-light border border-emergency/30 text-2xs">
                      Live MySQL
                    </span>
                  }
                >
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-emergency-light" />
                    Field Damage Assessments ({incident.damageReports?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-3">
                  {incident.damageReports && incident.damageReports.length > 0 ? (
                    <div className="space-y-2">
                      {incident.damageReports.map((dr) => (
                        <div
                          key={dr.reportId}
                          className="p-2.5 bg-eoc-bg rounded border border-eoc-border space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-emergency-light">
                              {dr.damageLevel} Damage
                            </span>
                            <span className="font-mono text-success-light font-bold text-2xs">
                              Est. Loss: ${Number(dr.estimatedLoss).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-300 text-2xs leading-relaxed">
                            {dr.description}
                          </p>
                          {dr.photo && (
                            <p className="text-2xs text-gray-500 font-mono">
                              Photo Ref: {dr.photo}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-eoc-bg rounded border border-eoc-border text-xs text-gray-500 italic">
                      No field damage reports logged yet.
                    </div>
                  )}

                  {isOperationalRole && incident.status !== 'Resolved' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={FileText}
                      onClick={() => setIsDamageModalOpen(true)}
                      className="w-full justify-center"
                    >
                      Submit Field Damage Assessment
                    </Button>
                  )}
                </CardBody>
              </Card>

              {/* 5. Incident Operational Alerts */}
              <Card className="border-eoc-border">
                <CardHeader
                  actions={
                    <span className="badge bg-warning-subtle text-warning-light border border-warning/30 text-2xs">
                      Live Broadcasts
                    </span>
                  }
                >
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Bell className="w-4 h-4 text-warning-light" />
                    Incident Alerts ({incident.alerts?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-2">
                  {incident.alerts && incident.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {incident.alerts.map((alt) => (
                        <div
                          key={alt.alertId}
                          className="p-2.5 bg-eoc-bg rounded border border-eoc-border space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-200">
                              {alt.title}
                            </span>
                            <AlertBadge priority={alt.priority} />
                          </div>
                          <p className="text-gray-300 text-2xs">{alt.message}</p>
                          <p className="text-2xs text-gray-500 font-mono">
                            {alt.alertTime ? new Date(alt.alertTime).toLocaleString() : 'Recent'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-eoc-bg rounded border border-eoc-border text-xs text-gray-500 italic">
                      No alerts linked to this incident.
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* 6. AI Triage History (Preserving all predictions) */}
              <Card className="border-eoc-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Brain className="w-4 h-4 text-purple-400" />
                    AI Triage &amp; Reassessment History ({incident.predictions?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-2">
                  {incident.predictions && incident.predictions.length > 0 ? (
                    <div className="space-y-2">
                      {incident.predictions.map((p, idx) => (
                        <div
                          key={p.predictionId}
                          className="p-2.5 bg-eoc-bg rounded border border-eoc-border flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-200">
                                {idx === 0 ? 'Initial Triage' : `Secondary Reassessment #${idx}`}
                              </span>
                              <span className="badge bg-purple-950/60 text-purple-300 border border-purple-800 text-2xs">
                                Risk: {p.riskLevel}
                              </span>
                            </div>
                            <div className="text-2xs text-gray-400 font-mono mt-0.5">
                              Confidence: {p.confidence}% • {p.predictionTime ? new Date(p.predictionTime).toLocaleTimeString() : 'Initial'}
                            </div>
                          </div>
                          <div className="text-2xs text-gray-400 max-w-xs truncate italic">
                            {p.suggestedAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-eoc-bg rounded border border-eoc-border text-xs text-gray-500 italic">
                      No AI prediction history available.
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* ── Operational Timeline ─────────────────────────────────── */}
            <Card className="border-eoc-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Chronological Operational Timeline
                </CardTitle>
                <CardSubtitle>
                  Real database event log derived from incident intake, AI triage, response dispatches, and field assessments
                </CardSubtitle>
              </CardHeader>
              <CardBody>
                <OperationalTimeline timeline={incident.timeline || []} />
              </CardBody>
            </Card>

            {/* Team Dispatch Modal */}
            <TeamDispatchModal
              isOpen={isDispatchModalOpen}
              onClose={() => setIsDispatchModalOpen(false)}
              incident={incident}
              onDispatchSuccess={() => fetchDetails()}
            />

            {/* Resource Allocation Modal */}
            <ResourceAllocationModal
              isOpen={isResourceModalOpen}
              onClose={() => setIsResourceModalOpen(false)}
              preselectedIncident={incident}
              onAllocationSuccess={() => fetchDetails()}
            />

            {/* Shelter Assignment Modal */}
            <ShelterAssignmentModal
              isOpen={isShelterModalOpen}
              onClose={() => setIsShelterModalOpen(false)}
              incident={incident}
              onAssignmentSuccess={() => fetchDetails()}
            />

            {/* Field Damage Assessment Modal */}
            <SubmitDamageReportModal
              isOpen={isDamageModalOpen}
              onClose={() => setIsDamageModalOpen(false)}
              incident={incident}
              onSuccess={() => {
                fetchDetails();
                toast.success('Field damage assessment submitted & secondary AI triage executed.');
              }}
            />
          </>
        ) : null}
      </div>
    </AppShell>
  );
};

export default IncidentDetails;
