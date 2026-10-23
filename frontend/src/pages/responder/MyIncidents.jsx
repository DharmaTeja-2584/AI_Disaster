import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SeverityBadge, PriorityBadge } from '../../components/ui/Badge';
import StatusPill from '../../components/ui/StatusPill';
import LoadingSkeleton, { SkeletonTable } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import { getIncidents, updateIncidentStatus } from '../../api/incidents';
import { useToast } from '../../components/ui/Toast';
import {
  AlertTriangle,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Radio,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const MyIncidents = () => {
  const toast = useToast();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIncidents({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: search.trim() || undefined,
        limit: 50,
      });
      setIncidents(res.data.data.incidents || []);
    } catch (err) {
      toast.error('Failed to load field incident assignments.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, toast]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      await updateIncidentStatus(incidentId, newStatus);
      toast.success(`Incident #${incidentId} status transitioned to ${newStatus}.`);
      fetchIncidents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <AppShell title="Field Incident Assignments" onRefresh={fetchIncidents}>
      <PageHeader
        title="Field Incident Assignments"
        subtitle="Manage on-scene lifecycle status transitions and tactical response updates"
        breadcrumb="Responder / Incident Assignments"
        actions={
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchIncidents} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Card>
          <div className="p-4 border-b border-eoc-border space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Field Operations Feed ({incidents.length})</CardTitle>
                <CardSubtitle>All active, contained, and triaged disaster deployments</CardSubtitle>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  className="form-input pl-9 text-xs"
                  placeholder="Search by ID, type, description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-gray-400 uppercase whitespace-nowrap">Filter Status:</span>
                <select
                  className="form-select text-xs py-1.5"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Reported">Reported</option>
                  <option value="Triaged">Triaged</option>
                  <option value="Active">Active</option>
                  <option value="Contained">Contained</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          <CardBody className="p-0">
            {loading ? (
              <div className="p-4">
                <SkeletonTable rows={5} cols={7} />
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={ShieldCheck}
                  title="No Incidents Match Filter"
                  description="Adjust filter criteria or search terms to inspect other field incidents."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type &amp; Description</th>
                      <th>Coordinates</th>
                      <th>Severity</th>
                      <th>Priority</th>
                      <th>Assigned Unit</th>
                      <th>Status</th>
                      <th className="text-right">Lifecycle Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((item) => (
                      <tr key={item.id} className="hover:bg-eoc-hover/80 transition-colors">
                        <td className="font-mono text-xs font-bold text-gray-300">#{item.id}</td>
                        <td>
                          <p className="font-semibold text-gray-100 text-xs">{item.incidentType}</p>
                          <p className="text-2xs text-gray-500 line-clamp-1 max-w-[240px]">
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
                          <div className="flex items-center justify-end gap-1">
                            {item.status !== 'Active' && item.status !== 'Contained' && item.status !== 'Resolved' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleStatusChange(item.id, 'Active')}
                              >
                                Deploy / Active
                              </Button>
                            )}
                            {item.status !== 'Contained' && item.status !== 'Resolved' && (
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => handleStatusChange(item.id, 'Contained')}
                              >
                                Contain
                              </Button>
                            )}
                            {item.status !== 'Resolved' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleStatusChange(item.id, 'Resolved')}
                              >
                                Resolve
                              </Button>
                            )}
                            {item.status === 'Resolved' && (
                              <span className="text-2xs text-success-light font-semibold">✓ Closed</span>
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

export default MyIncidents;
