import React, { useState, useEffect } from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getAnalyticsOverview, getRiskHotspots } from '../../api/analytics';
import {
  Activity,
  AlertTriangle,
  Brain,
  Users,
  Package,
  Home,
  RefreshCw,
  Download,
  MapPin,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const SEVERITY_COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Low, Medium, High

const Analytics = () => {
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, hotspotsRes] = await Promise.all([
        getAnalyticsOverview({ period }),
        getRiskHotspots(),
      ]);

      setData(overviewRes.data?.data || overviewRes.data);
      setHotspots(hotspotsRes.data?.data || hotspotsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load disaster intelligence data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleExportCSV = () => {
    if (!data) return;

    const headers = ['Category', 'Metric', 'Value'];
    const rows = [
      ['Incidents', 'Total Incidents', data.incidents?.stats?.total || 0],
      ['Incidents', 'Active Incidents', data.incidents?.stats?.active || 0],
      ['Incidents', 'Resolved Incidents', data.incidents?.stats?.resolved || 0],
      ['Incidents', 'High Priority', data.incidents?.stats?.highPriority || 0],
      ['Resources', 'Total Types', data.resources?.totalTypes || 0],
      ['Resources', 'Available Quantity', data.resources?.availableQuantity || 0],
      ['Resources', 'Allocated Quantity', data.resources?.totalAllocatedQuantity || 0],
      ['Teams', 'Total Teams', data.teams?.totalTeams || 0],
      ['Teams', 'Deployed Teams', data.teams?.deployedTeams || 0],
      ['Teams', 'Fleet Utilization %', data.teams?.utilizationRate || 0],
      ['Shelters', 'Total Shelters', data.shelters?.totalShelters || 0],
      ['Shelters', 'Capacity Occupancy %', data.shelters?.occupancyRate || 0],
      ['AI Triage', 'Average Confidence %', data.ai?.averageConfidence || 0],
    ];

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `disaster_intelligence_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const severityPieData = data?.incidents?.stats
    ? [
        { name: 'Low (1-3)', value: data.incidents.stats.lowPriority },
        { name: 'Medium (4-6)', value: data.incidents.stats.mediumPriority },
        { name: 'High (7-10)', value: data.incidents.stats.highPriority },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <AppShell title="Disaster Intelligence Center">
      <PageHeader
        title="Disaster Intelligence &amp; Operational Analytics"
        subtitle="Real-time multi-agency situational awareness, resource utilization, and decision-support intelligence"
        breadcrumb="Commander / Intelligence Center"
        actions={
          <div className="flex items-center gap-2">
            <div className="w-36">
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                ]}
                className="text-xs"
              />
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={fetchAnalytics}
              disabled={loading}
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportCSV}
              disabled={!data}
              title="Export Intelligence Summary"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="p-4 bg-emergency-subtle/30 border border-emergency/40 rounded text-xs text-emergency-light">
            {error}
          </div>
        )}

        {/* ── 1. Top HUD Metrics ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="card p-3 border-l-4 border-l-cyan-500">
            <p className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Total Incidents</p>
            <h4 className="text-xl font-bold font-mono text-gray-100 mt-0.5">
              {data?.incidents?.stats?.total ?? '—'}
            </h4>
            <p className="text-2xs text-gray-500 mt-1">
              Active: <span className="text-cyan-400 font-mono">{data?.incidents?.stats?.active ?? 0}</span>
            </p>
          </div>

          <div className="card p-3 border-l-4 border-l-emergency">
            <p className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">High Priority</p>
            <h4 className="text-xl font-bold font-mono text-emergency-light mt-0.5">
              {data?.incidents?.stats?.highPriority ?? '—'}
            </h4>
            <p className="text-2xs text-gray-500 mt-1">Severity ≥ 7</p>
          </div>

          <div className="card p-3 border-l-4 border-l-purple-500">
            <p className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Avg AI Confidence</p>
            <h4 className="text-xl font-bold font-mono text-purple-300 mt-0.5">
              {data?.ai?.averageConfidence ? `${data.ai.averageConfidence}%` : '—'}
            </h4>
            <p className="text-2xs text-gray-500 mt-1">
              Evaluations: <span className="font-mono text-gray-400">{data?.ai?.totalPredictions ?? 0}</span>
            </p>
          </div>

          <div className="card p-3 border-l-4 border-l-blue-500">
            <p className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Team Deployment</p>
            <h4 className="text-xl font-bold font-mono text-blue-400 mt-0.5">
              {data?.teams?.deployedTeams ?? 0}
              <span className="text-xs text-gray-500 font-normal"> / {data?.teams?.totalTeams ?? 0}</span>
            </h4>
            <p className="text-2xs text-gray-500 mt-1 font-mono">
              {data?.teams?.utilizationRate ?? 0}% Fleet Load
            </p>
          </div>

          <div className="card p-3 border-l-4 border-l-warning">
            <p className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Supply Reserves</p>
            <h4 className="text-xl font-bold font-mono text-warning-light mt-0.5">
              {data?.resources?.availableQuantity ? data.resources.availableQuantity.toLocaleString() : '—'}
            </h4>
            <p className="text-2xs text-gray-500 mt-1">
              Low Stock: <span className="text-warning-light font-mono">{data?.resources?.lowStockCount ?? 0}</span>
            </p>
          </div>

          <div className="card p-3 border-l-4 border-l-success">
            <p className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Shelter Occupancy</p>
            <h4 className="text-xl font-bold font-mono text-success-light mt-0.5">
              {data?.shelters?.occupancyRate ? `${data.shelters.occupancyRate}%` : '0%'}
            </h4>
            <p className="text-2xs text-gray-500 mt-1">
              Free: <span className="text-success-light font-mono">{data?.shelters?.availableSpaces?.toLocaleString() ?? 0}</span>
            </p>
          </div>
        </div>

        {/* ── 2. AI Intelligence & Decision Support Panel ──────────────── */}
        <Card className="border-cyan-500/30">
          <CardHeader
            actions={
              <span className="badge bg-cyan-950/60 text-cyan-300 border border-cyan-800 text-2xs font-mono">
                Real MySQL Rule Intelligence
              </span>
            }
          >
            <CardTitle className="flex items-center gap-2 text-sm text-gray-100">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              AI Operational Insights &amp; Decision-Support Findings
            </CardTitle>
            <CardSubtitle>
              Deterministic heuristic findings derived from current emergency incidents, supply levels, and shelter loads
            </CardSubtitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {data?.insights && data.insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.insights.map((ins, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border text-xs space-y-1 ${
                      ins.level === 'Critical'
                        ? 'bg-emergency-subtle/30 border-emergency/40 text-emergency-light'
                        : ins.level === 'Warning'
                        ? 'bg-warning-subtle/30 border-warning/40 text-warning-light'
                        : 'bg-eoc-bg border-eoc-border text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>{ins.title}</span>
                      <span className="text-2xs uppercase tracking-wider opacity-80 font-mono">
                        [{ins.level}]
                      </span>
                    </div>
                    <p className="text-2xs text-gray-300 leading-relaxed">
                      {ins.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-eoc-bg rounded border border-eoc-border text-xs text-gray-500 italic">
                All operational metrics currently within nominal baseline parameters.
              </div>
            )}
          </CardBody>
        </Card>

        {/* ── 3. Charts Grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Incident Inflow &amp; Resolution Trends
              </CardTitle>
            </CardHeader>
            <CardBody>
              {data?.incidents?.trends && data.incidents.trends.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.incidents.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="reported" name="Reported" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-gray-500">
                  No time-series trends available for this period.
                </div>
              )}
            </CardBody>
          </Card>

          {/* Severity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning-light" />
                Severity Level Distribution
              </CardTitle>
            </CardHeader>
            <CardBody>
              {severityPieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        fontSize={11}
                      >
                        {severityPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-gray-500">
                  No incident severity records found.
                </div>
              )}
            </CardBody>
          </Card>

          {/* Incidents by Disaster Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Incidents by Disaster Category
              </CardTitle>
            </CardHeader>
            <CardBody>
              {data?.incidents?.byType && data.incidents.byType.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.incidents.byType}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="type" stroke="#9ca3af" fontSize={10} interval={0} angle={-25} textAnchor="end" height={50} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px' }} />
                      <Bar dataKey="count" name="Incidents" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-gray-500">
                  No category data available.
                </div>
              )}
            </CardBody>
          </Card>

          {/* Resource Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Package className="w-4 h-4 text-warning-light" />
                Resource Allocation &amp; Safety Stock
              </CardTitle>
            </CardHeader>
            <CardBody>
              {data?.resources?.topAllocated && data.resources.topAllocated.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.resources.topAllocated}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} interval={0} angle={-20} textAnchor="end" height={45} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="allocatedQuantity" name="Allocated" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="remainingStock" name="Available Stock" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-gray-500">
                  No resource allocation records found.
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ── 4. Geographic Risk Hotspots / Incident Map ──────────────── */}
        <Card className="border-eoc-border">
          <CardHeader
            actions={
              <span className="badge bg-eoc-bg text-gray-400 border border-eoc-border text-2xs font-mono">
                {hotspots.length} Geographic Incident Nodes
              </span>
            }
          >
            <CardTitle className="flex items-center gap-2 text-sm text-gray-100">
              <MapPin className="w-4 h-4 text-emergency-light" />
              Incident Geographic Hotspots &amp; Tactical Coordinates
            </CardTitle>
            <CardSubtitle>
              Spatial overview of emergency coordinates, severity classification, and operational containment status
            </CardSubtitle>
          </CardHeader>
          <CardBody>
            {hotspots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                {hotspots.map((h) => {
                  const isHigh = Number(h.severity) >= 7;
                  const isMed = Number(h.severity) >= 4 && Number(h.severity) < 7;
                  const badgeColor = isHigh
                    ? 'border-emergency/60 bg-emergency-subtle/30 text-emergency-light'
                    : isMed
                    ? 'border-warning/60 bg-warning-subtle/30 text-warning-light'
                    : 'border-success/60 bg-success-subtle/30 text-success-light';

                  return (
                    <div
                      key={h.id}
                      className="p-3 bg-eoc-bg rounded border border-eoc-border space-y-1.5 text-xs hover:border-gray-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-200">
                          #{h.id} {h.type}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-mono font-bold border ${badgeColor}`}>
                          Sev {h.severity}/10
                        </span>
                      </div>
                      <p className="text-2xs text-gray-400 font-mono">
                        ({Number(h.lat).toFixed(4)}, {Number(h.lng).toFixed(4)}) • Status: <span className="text-gray-300 font-semibold">{h.status}</span>
                      </p>
                      <p className="text-2xs text-gray-300 truncate">
                        {h.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-gray-500">
                No incident coordinate records found in database.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
};

export default Analytics;
