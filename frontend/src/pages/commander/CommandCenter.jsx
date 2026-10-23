import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { SeverityBadge, PriorityBadge } from '../../components/ui/Badge';
import StatusPill from '../../components/ui/StatusPill';
import { SkeletonCard, SkeletonTable } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { getDashboardMetrics } from '../../api/dashboard';
import { getIncidents } from '../../api/incidents';
import { loadDemoScenario } from '../../api/demo';
import {
  Radio,
  AlertTriangle,
  Users,
  Package,
  Home,
  Cpu,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  ArrowUpDown,
  TrendingUp,
  Bell,
  Activity,
  Flame,
} from 'lucide-react';

const CommandCenter = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Metrics State
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Incidents State
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('severity_desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Dashboard Metrics
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const res = await getDashboardMetrics();
      setMetrics(res.data.data.metrics);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Fetch Incidents List
  const fetchIncidents = useCallback(async () => {
    setIncidentsLoading(true);
    setError(null);
    try {
      const res = await getIncidents({
        search: debouncedSearch,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        sortBy,
        page,
        limit: 10,
      });

      const data = res.data.data;
      setIncidents(data.incidents || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
      setLastRefreshTime(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch incident reports from database.');
    } finally {
      setIncidentsLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, sortBy, page]);

  // Initial load and refetch on filter change
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const [scenarioLoading, setScenarioLoading] = useState(false);

  const handleInjectDemoScenario = async () => {
    setScenarioLoading(true);
    try {
      const res = await loadDemoScenario();
      toast.success('Building Collapse high-priority scenario injected into Command Center!');
      fetchMetrics();
      fetchIncidents();
      const incId = res.data?.data?.incident?.id;
      if (incId) {
        navigate(`/commander/incidents/${incId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to inject demo scenario.');
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleRefreshAll = () => {
    fetchMetrics();
    fetchIncidents();
    toast.info('Command Center operational feed refreshed.');
  };

  return (
    <AppShell title="Emergency Command Center" onRefresh={handleRefreshAll}>
      <PageHeader
        title="Emergency Operations Command Center"
        subtitle={`Live Coordination HUD — Logged in as ${user?.name || 'Commander'} (${user?.role?.toUpperCase()})`}
        breadcrumb="Commander / Operations HUD"
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-2xs text-gray-400 bg-eoc-surface px-2.5 py-1 rounded border border-eoc-border">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>Synced: {lastRefreshTime.toLocaleTimeString()}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={Flame}
              loading={scenarioLoading}
              onClick={handleInjectDemoScenario}
              title="Inject Building Collapse high-priority scenario for demonstration"
            >
              Demo Scenario
            </Button>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={handleRefreshAll}>
              Refresh Feed
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* ── 1. Metric HUD (8 Compact Emergency Cards) ────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {metricsLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="metric-card p-3 flex flex-col justify-between">
                <div className="skeleton h-3 w-1/2 mb-2" />
                <div className="skeleton h-6 w-3/4" />
              </div>
            ))
          ) : metrics ? (
            <>
              {/* 1. High Priority */}
              <div className="metric-card p-3 border-emergency/40 bg-emergency-subtle/30">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase font-semibold">High Priority</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-emergency-light" />
                </div>
                <p className="text-xl font-bold font-mono text-emergency-light mt-1">
                  {metrics.highPriorityIncidents}
                </p>
              </div>

              {/* 2. Active Incidents */}
              <div className="metric-card p-3 border-warning/40 bg-warning-subtle/30">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase font-semibold">Active Inc.</span>
                  <Radio className="w-3.5 h-3.5 text-warning-light" />
                </div>
                <p className="text-xl font-bold font-mono text-warning-light mt-1">
                  {metrics.activeIncidents}
                </p>
              </div>

              {/* 3. Teams Deployed */}
              <div className="metric-card p-3 border-info/40 bg-info-subtle/30">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase font-semibold">Deployed</span>
                  <Users className="w-3.5 h-3.5 text-info-light" />
                </div>
                <p className="text-xl font-bold font-mono text-info-light mt-1">
                  {metrics.teamsDeployed}
                </p>
              </div>

              {/* 4. Teams Available */}
              <div className="metric-card p-3 border-success/40 bg-success-subtle/30">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase font-semibold">Teams Avail</span>
                  <Users className="w-3.5 h-3.5 text-success-light" />
                </div>
                <p className="text-xl font-bold font-mono text-success-light mt-1">
                  {metrics.teamsAvailable}
                </p>
              </div>

              {/* 5. Shelter Capacity */}
              <div className="metric-card p-3 border-eoc-border">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase font-semibold">Shelter Avail</span>
                  <Home className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <p className="text-xl font-bold font-mono text-gray-200 mt-1">
                  {metrics.shelterCapacity.available}
                </p>
              </div>

              {/* 6. Critical Resources */}
              <div className="metric-card p-3 border-warning/30">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase font-semibold">Low Stock</span>
                  <Package className="w-3.5 h-3.5 text-warning-light" />
                </div>
                <p className="text-xl font-bold font-mono text-warning-light mt-1">
                  {metrics.criticalResources}
                </p>
              </div>

              {/* 7. AI Confidence */}
              <div className="metric-card p-3 border-info/30">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase font-semibold">AI Conf.</span>
                  <Cpu className="w-3.5 h-3.5 text-info-light" />
                </div>
                <p className="text-xl font-bold font-mono text-info-light mt-1">
                  {metrics.aiConfidence}%
                </p>
              </div>

              {/* 8. Resolved Today */}
              <div className="metric-card p-3 border-success/30">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-gray-400 uppercase font-semibold">Resolved</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-light" />
                </div>
                <p className="text-xl font-bold font-mono text-success-light mt-1">
                  {metrics.resolvedToday}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Quick Operations Subsystems Bar */}
        <div className="flex items-center justify-between gap-2 p-2.5 bg-eoc-surface rounded border border-eoc-border text-xs flex-wrap">
          <div className="flex items-center gap-2 text-gray-400 font-semibold text-2xs uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Operational Subsystems:
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/commander/analytics"
              className="px-2.5 py-1 bg-eoc-bg hover:bg-eoc-border/60 text-cyan-400 rounded border border-cyan-800/60 font-medium transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-3 h-3" />
              View Analytics
            </Link>
            <Link
              to="/commander/alerts"
              className="px-2.5 py-1 bg-eoc-bg hover:bg-eoc-border/60 text-emergency-light rounded border border-emergency/40 font-medium transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-3 h-3" />
              View Alerts
            </Link>
            <Link
              to="/commander/resources"
              className="px-2.5 py-1 bg-eoc-bg hover:bg-eoc-border/60 text-warning-light rounded border border-warning/40 font-medium transition-colors flex items-center gap-1.5"
            >
              <Package className="w-3 h-3" />
              View Resources
            </Link>
            <Link
              to="/commander/shelters"
              className="px-2.5 py-1 bg-eoc-bg hover:bg-eoc-border/60 text-success-light rounded border border-success/40 font-medium transition-colors flex items-center gap-1.5"
            >
              <Home className="w-3 h-3" />
              View Shelters
            </Link>
            <Link
              to="/commander/teams"
              className="px-2.5 py-1 bg-eoc-bg hover:bg-eoc-border/60 text-blue-400 rounded border border-blue-500/40 font-medium transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3 h-3" />
              View Teams
            </Link>
          </div>
        </div>

        {/* ── 2. Active Incidents Data Table Card ───────────────────────── */}
        <Card>
          {/* Header & Controls Bar */}
          <div className="p-4 border-b border-eoc-border space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emergency animate-pulse-slow" />
                  Live Incident Stream ({pagination.total} Records)
                </CardTitle>
                <CardSubtitle>
                  Real-time emergency operational triage stream — default sorted by highest severity
                </CardSubtitle>
              </div>

              <Link to="/civilian/submit">
                <Button variant="danger" size="sm">
                  + Intake New Incident
                </Button>
              </Link>
            </div>

            {/* Filter / Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  className="form-input pl-9 text-xs"
                  placeholder="Search by ID, type, description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-gray-400 uppercase whitespace-nowrap">Status:</span>
                <select
                  className="form-select text-xs py-1.5"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Reported">Reported</option>
                  <option value="Triaged">Triaged</option>
                  <option value="Active">Active</option>
                  <option value="Contained">Contained</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-gray-400 uppercase whitespace-nowrap">Priority:</span>
                <select
                  className="form-select text-xs py-1.5"
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High (7-10)</option>
                  <option value="Medium">Medium (4-6)</option>
                  <option value="Low">Low (1-3)</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-gray-400 uppercase whitespace-nowrap">Sort:</span>
                <select
                  className="form-select text-xs py-1.5"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="severity_desc">Highest Severity First</option>
                  <option value="severity_asc">Lowest Severity First</option>
                  <option value="confidence_desc">AI Confidence (High to Low)</option>
                  <option value="time_desc">Newest Reported First</option>
                  <option value="time_asc">Oldest Reported First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <CardBody className="p-0">
            {incidentsLoading ? (
              <div className="p-4">
                <SkeletonTable rows={6} cols={8} />
              </div>
            ) : error ? (
              <div className="p-8">
                <ErrorState message={error} onRetry={fetchIncidents} />
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Radio}
                  title="No Incidents Match Filters"
                  description="Try clearing search keywords or switching filters to display all logged incidents."
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('All');
                        setPriorityFilter('All');
                      }}
                    >
                      Clear Filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Disaster Type</th>
                      <th>Location</th>
                      <th>Severity</th>
                      <th>AI Priority</th>
                      <th>Confidence</th>
                      <th>Assigned Team</th>
                      <th>Status</th>
                      <th>Reported</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((item) => (
                      <tr key={item.id} className="hover:bg-eoc-hover/80 transition-colors">
                        <td className="font-mono text-xs font-bold text-gray-300">#{item.id}</td>
                        <td>
                          <p className="font-semibold text-gray-100 text-xs">{item.incidentType}</p>
                          <p className="text-2xs text-gray-500 line-clamp-1 max-w-[220px]">
                            {item.description}
                          </p>
                        </td>
                        <td className="text-xs text-gray-400">
                          <div className="flex items-center gap-1 font-mono text-2xs">
                            <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
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
                          <div className="flex items-center gap-1 text-xs font-mono text-info-light">
                            <Cpu className="w-3 h-3" />
                            <span>{item.confidence ? `${item.confidence}%` : 'N/A'}</span>
                          </div>
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
                        <td className="text-2xs text-gray-500 font-mono whitespace-nowrap">
                          {item.reportedTime ? new Date(item.reportedTime).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="text-right">
                          <Link to={`/commander/incidents/${item.id}`}>
                            <Button variant="ghost" size="sm" icon={Eye}>
                              Inspect
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-3 border-t border-eoc-border flex items-center justify-between text-xs text-gray-400">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    icon={ChevronLeft}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    icon={ChevronRight}
                    iconPosition="right"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
};

export default CommandCenter;
