import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { SeverityBadge, PriorityBadge } from '../../components/ui/Badge';
import StatusPill from '../../components/ui/StatusPill';
import LoadingSkeleton, { SkeletonTable } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { getIncidents } from '../../api/incidents';
import { FileText, Plus, RefreshCw, Cpu, AlertTriangle, Info, MapPin } from 'lucide-react';

const MyReports = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getIncidents();
      setIncidents(res.data.data.incidents || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incident reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <AppShell title="My Disaster Reports" onRefresh={fetchReports}>
      <PageHeader
        title="My Disaster Reports"
        subtitle="Tracking civilian incidents, rule-based AI triage outputs, and operational statuses"
        breadcrumb="Civilian / My Reports"
        actions={
          <Link to="/civilian/submit">
            <Button variant="danger" size="sm" icon={Plus}>
              New Report
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Schema Notice */}
        <div className="alert-info-box flex items-start gap-2.5">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-gray-200">Database Relation Notice</p>
            <p className="text-gray-400">
              The current database schema stores all incidents in the <code>incident</code> table without an explicit <code>USER_ID</code> foreign key.
              Incidents below reflect active operational records triaged by the system.
            </p>
          </div>
        </div>

        {/* Content Table Card */}
        <Card>
          <CardHeader
            actions={
              <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchReports} disabled={loading}>
                Refresh
              </Button>
            }
          >
            <CardTitle>Logged Incident Reports ({incidents.length})</CardTitle>
            <CardSubtitle>Ordered by highest severity and latest report time</CardSubtitle>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-4">
                <SkeletonTable rows={5} cols={7} />
              </div>
            ) : error ? (
              <div className="p-8">
                <ErrorState message={error} onRetry={fetchReports} />
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={FileText}
                  title="No Incident Reports Found"
                  description="You haven't submitted any disaster reports yet. In an emergency, click below to report an event."
                  action={
                    <Link to="/civilian/submit">
                      <Button variant="danger" size="sm" icon={Plus}>
                        Submit Disaster Report
                      </Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Severity</th>
                      <th>AI Priority</th>
                      <th>Confidence</th>
                      <th>Status</th>
                      <th>Reported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((item) => (
                      <tr key={item.id}>
                        <td className="font-mono text-xs text-gray-400">#{item.id}</td>
                        <td className="font-semibold text-gray-200">{item.incidentType}</td>
                        <td className="text-xs text-gray-400">
                          <div className="flex items-center gap-1">
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
                          <PriorityBadge priority={item.riskLevel || (Number(item.severity) >= 7 ? 'High' : Number(item.severity) >= 4 ? 'Medium' : 'Low')} />
                        </td>
                        <td>
                          <div className="flex items-center gap-1 text-xs text-info-light font-mono">
                            <Cpu className="w-3 h-3" />
                            <span>{item.confidence ? `${item.confidence}%` : 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <StatusPill status={item.status || 'Reported'} />
                        </td>
                        <td className="text-xs text-gray-500">
                          {item.reportedTime ? new Date(item.reportedTime).toLocaleString() : 'Just now'}
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

export default MyReports;
