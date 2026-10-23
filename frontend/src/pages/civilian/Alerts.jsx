import React, { useState, useEffect } from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import AlertBadge from '../../components/alerts/AlertBadge';
import { getAlerts } from '../../api/alerts';
import { AlertTriangle, Bell, Clock, RefreshCw } from 'lucide-react';

const CivilianAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPublicAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAlerts({ limit: 20 });
      const payload = res.data?.data || res.data;
      setAlerts(payload.alerts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load public emergency advisories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicAlerts();
  }, []);

  return (
    <AppShell title="Emergency Bulletins">
      <PageHeader
        title="Public Emergency Bulletins"
        subtitle="Broadcast notifications, severe hazard warnings, and safety advisories"
        breadcrumb="Civilian / Alerts"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Real-time public safety bulletins issued by Incident Command.
          </p>
          <button
            onClick={fetchPublicAlerts}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Bulletins
          </button>
        </div>

        {error && (
          <div className="p-4 bg-emergency-subtle/30 border border-emergency/40 rounded text-xs text-emergency-light">
            {error}
          </div>
        )}

        {loading ? (
          <div className="card p-12 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            Loading active emergency broadcasts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="card p-12 text-center text-gray-500 text-xs">
            No active emergency advisories in your sector. All systems normal.
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card
                key={alert.alertId}
                className={`border-l-4 ${
                  alert.priority === 'Critical'
                    ? 'border-l-emergency'
                    : alert.priority === 'Warning'
                    ? 'border-l-warning'
                    : 'border-l-info'
                }`}
              >
                <CardHeader
                  actions={<AlertBadge priority={alert.priority} />}
                >
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-100">
                    <AlertTriangle className="w-4 h-4 text-warning-light" />
                    {alert.title}
                  </CardTitle>
                </CardHeader>
                <CardBody className="text-xs text-gray-300 space-y-2">
                  <p className="leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-1 text-2xs text-gray-500 font-mono pt-1">
                    <Clock className="w-3 h-3" />
                    Issued: {alert.alertTime ? new Date(alert.alertTime).toLocaleString() : 'Recent'}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default CivilianAlerts;
