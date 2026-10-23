import React, { useState, useEffect } from 'react';
import { getAlerts, acknowledgeAlert } from '../../api/alerts';
import AlertCard from './AlertCard';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Search, RefreshCw, AlertCircle, AlertTriangle, Info, BellRing } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AlertCenter = ({ incidentId = null, canCreate = false, onCreateClick = null, canAcknowledge = undefined }) => {
  const { role } = useAuth();
  const allowAck = canAcknowledge !== undefined ? canAcknowledge : (role === 'responder');
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, warning: 0, info: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('All');
  const [acknowledged, setAcknowledged] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        priority: priority !== 'All' ? priority : undefined,
        acknowledged: acknowledged !== 'All' ? acknowledged : undefined,
        incidentId: incidentId || undefined,
      };

      const res = await getAlerts(params);
      const payload = res.data?.data || res.data;
      setAlerts(payload.alerts || []);
      setTotalPages(payload.pages || 1);
      if (payload.stats) {
        setStats(payload.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load emergency alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [page, priority, acknowledged, incidentId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAlertsData();
  };

  const handleAcknowledge = async (alertId) => {
    try {
      setAcknowledgingId(alertId);
      await acknowledgeAlert(alertId);
      // Update local state
      setAlerts((prev) =>
        prev.map((a) =>
          a.alertId === alertId
            ? { ...a, isAcknowledged: true, ackCount: (a.ackCount || 0) + 1 }
            : a
        )
      );
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to acknowledge alert.');
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* HUD Metrics if not scoped to a single incident */}
      {!incidentId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-3.5 border-l-4 border-l-emergency flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-wider text-gray-400 font-semibold">Critical Alerts</p>
              <h3 className="text-xl font-bold font-mono text-emergency-light mt-0.5">{stats.critical}</h3>
            </div>
            <AlertCircle className="w-6 h-6 text-emergency/60" />
          </div>

          <div className="card p-3.5 border-l-4 border-l-warning flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-wider text-gray-400 font-semibold">Warning Alerts</p>
              <h3 className="text-xl font-bold font-mono text-warning-light mt-0.5">{stats.warning}</h3>
            </div>
            <AlertTriangle className="w-6 h-6 text-warning/60" />
          </div>

          <div className="card p-3.5 border-l-4 border-l-info flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-wider text-gray-400 font-semibold">Information</p>
              <h3 className="text-xl font-bold font-mono text-info-light mt-0.5">{stats.info}</h3>
            </div>
            <Info className="w-6 h-6 text-info/60" />
          </div>

          <div className="card p-3.5 border-l-4 border-l-accent flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-wider text-gray-400 font-semibold">Pending Review</p>
              <h3 className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{stats.unread}</h3>
            </div>
            <BellRing className="w-6 h-6 text-cyan-400/60" />
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
          <Input
            placeholder="Search alerts by title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs"
          />
          <Button type="submit" size="sm" variant="secondary">
            <Search className="w-3.5 h-3.5" />
          </Button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-32">
            <Select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: 'All Priorities' },
                { value: 'Critical', label: 'Critical' },
                { value: 'Warning', label: 'Warning' },
                { value: 'Info', label: 'Info' },
              ]}
              className="text-xs"
            />
          </div>

          <div className="w-36">
            <Select
              value={acknowledged}
              onChange={(e) => {
                setAcknowledged(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: 'All Status' },
                { value: 'Unread', label: 'Unacknowledged' },
                { value: 'Acknowledged', label: 'Acknowledged' },
              ]}
              className="text-xs"
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={fetchAlertsData}
            title="Refresh Feed"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {canCreate && (
            <Button size="sm" variant="danger" onClick={onCreateClick}>
              + Issue Alert
            </Button>
          )}
        </div>
      </div>

      {/* Alerts Feed */}
      {error && (
        <div className="p-4 bg-emergency-subtle/30 border border-emergency/40 rounded text-xs text-emergency-light">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          Loading real-time alert feed...
        </div>
      ) : alerts.length === 0 ? (
        <div className="card p-12 text-center text-gray-500 text-xs">
          No operational alerts found matching current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alt) => (
            <AlertCard
              key={alt.alertId}
              alert={alt}
              onAcknowledge={handleAcknowledge}
              canAcknowledge={allowAck}
              isAcknowledging={acknowledgingId === alt.alertId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            <Button
              size="xs"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="xs"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCenter;
