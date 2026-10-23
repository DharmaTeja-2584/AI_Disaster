import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { SeverityBadge, PriorityBadge } from '../../components/ui/Badge';
import StatusPill from '../../components/ui/StatusPill';
import { SkeletonCard, SkeletonTable } from '../../components/ui/LoadingSkeleton';
import { getIncidents } from '../../api/incidents';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  Plus,
  Radio,
  FileText,
  Home,
  Bell,
  Cpu,
  ShieldCheck,
  ArrowRight,
  MapPin,
} from 'lucide-react';

const CivilianDashboard = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await getIncidents({ limit: 5 });
      setIncidents(res.data.data.incidents || []);
    } catch (err) {
      console.error('Error fetching civilian dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalCount = incidents.length;
  const highPriorityCount = incidents.filter(
    (i) => Number(i.severity) >= 7 || i.riskLevel === 'High'
  ).length;
  const activeCount = incidents.filter(
    (i) => i.status === 'Active' || i.status === 'Reported' || i.status === 'Triaged'
  ).length;

  return (
    <AppShell title="Civilian Dashboard" onRefresh={fetchDashboardData}>
      <PageHeader
        title={`Welcome, ${user?.name || 'Citizen'}`}
        subtitle="AI Disaster Coordination Portal — Live Emergency Reporting & Community Safety Hub"
        breadcrumb="Civilian / Dashboard"
        actions={
          <Link to="/civilian/submit">
            <Button variant="danger" size="sm" icon={Plus}>
              Report Disaster
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Quick Action Emergency Alert Banner */}
        <div className="card p-4 border-emergency/30 bg-emergency/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-emergency/20 border border-emergency/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-emergency-light" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-100">Experiencing or witnessing an emergency?</p>
              <p className="text-xs text-gray-400">
                Submit an instant disaster intake report to trigger immediate Rule-Based AI triage and priority dispatch.
              </p>
            </div>
          </div>
          <Link to="/civilian/submit">
            <Button variant="danger" size="md" icon={Plus}>
              Submit Incident Report
            </Button>
          </Link>
        </div>

        {/* Metric Cards */}
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
                <p className="metric-value text-gray-100">{totalCount}</p>
                <p className="metric-label">Total System Incidents</p>
              </div>

              <div className="metric-card border-emergency/30">
                <p className="metric-value text-emergency-light">{highPriorityCount}</p>
                <p className="metric-label">High Priority Emergencies</p>
              </div>

              <div className="metric-card border-warning/30">
                <p className="metric-value text-warning-light">{activeCount}</p>
                <p className="metric-label">Active / Triaged Incidents</p>
              </div>

              <div className="metric-card border-success/30">
                <div className="flex items-center gap-2">
                  <span className="live-dot" />
                  <p className="metric-value text-success-light">Online</p>
                </div>
                <p className="metric-label">AI Triage Status</p>
              </div>
            </>
          )}
        </div>

        {/* Quick Links & Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/civilian/submit" className="block">
            <Card className="hover:border-info/40 transition-colors h-full">
              <CardBody className="flex items-start gap-3">
                <div className="p-2.5 rounded bg-info-subtle border border-info/20 text-info-light">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">Submit Disaster Report</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Provide location coordinates, description, and hazard tags for AI evaluation.
                  </p>
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link to="/civilian/my-reports" className="block">
            <Card className="hover:border-warning/40 transition-colors h-full">
              <CardBody className="flex items-start gap-3">
                <div className="p-2.5 rounded bg-warning-subtle border border-warning/20 text-warning-light">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">Track Incident Status</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    View triaged incident reports, confidence scores, and real-time statuses.
                  </p>
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link to="/civilian/shelters" className="block">
            <Card className="hover:border-success/40 transition-colors h-full">
              <CardBody className="flex items-start gap-3">
                <div className="p-2.5 rounded bg-success-subtle border border-success/20 text-success-light">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">Emergency Shelters</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Locate nearby evacuation shelters with active capacity and status indicators.
                  </p>
                </div>
              </CardBody>
            </Card>
          </Link>
        </div>

        {/* Recent Incidents Table */}
        <Card>
          <CardHeader
            actions={
              <Link to="/civilian/my-reports">
                <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                  View All
                </Button>
              </Link>
            }
          >
            <CardTitle>Recent Emergency Reports</CardTitle>
            <CardSubtitle>Latest triaged incidents processed by the system</CardSubtitle>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-4">
                <SkeletonTable rows={3} cols={6} />
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No incidents reported yet. All systems operational.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Disaster Type</th>
                      <th>Severity</th>
                      <th>AI Priority</th>
                      <th>Confidence</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.slice(0, 5).map((item) => (
                      <tr key={item.id}>
                        <td className="font-mono text-xs text-gray-400">#{item.id}</td>
                        <td className="font-semibold text-gray-200">{item.incidentType}</td>
                        <td>
                          <SeverityBadge severity={item.severity} />
                        </td>
                        <td>
                          <PriorityBadge priority={item.riskLevel || (Number(item.severity) >= 7 ? 'High' : Number(item.severity) >= 4 ? 'Medium' : 'Low')} />
                        </td>
                        <td className="text-xs font-mono text-info-light">
                          {item.confidence ? `${item.confidence}%` : 'N/A'}
                        </td>
                        <td>
                          <StatusPill status={item.status || 'Reported'} />
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

export default CivilianDashboard;
