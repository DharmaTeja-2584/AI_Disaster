import React, { useState, useEffect } from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import AuditTable from '../../components/audit/AuditTable';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getAuditLogs } from '../../api/audit';
import { Search, RefreshCw, Download, ShieldCheck, Filter } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAuditLogs({
        page,
        limit: 20,
        search: search.trim() || undefined,
        action: action !== 'All' ? action : undefined,
      });

      const payload = res.data?.data || res.data;
      setLogs(payload.logs || []);
      setTotal(payload.total || 0);
      setTotalPages(payload.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = ['Audit ID', 'Timestamp', 'User Name', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = logs.map((l) => [
      l.auditId,
      l.createdTime ? new Date(l.createdTime).toISOString() : '',
      `"${l.userName || 'System'}"`,
      `"${l.userRole || ''}"`,
      `"${l.action}"`,
      `"${l.entityType || ''}"`,
      l.entityId || '',
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eoc_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell title="System Audit Logs">
      <PageHeader
        title="Emergency Operations System Audit Trail"
        subtitle="Cryptographically verified activity ledger and operational accountability logs"
        breadcrumb="Admin / Audit Logs"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-5">
        {/* Control Bar */}
        <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
            <Input
              placeholder="Search audit details or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
            <Button type="submit" size="sm" variant="secondary">
              <Search className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-48">
              <Select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: 'All', label: 'All Operations' },
                  { value: 'INCIDENT_CREATED', label: 'Incident Created' },
                  { value: 'INCIDENT_STATUS_CHANGED', label: 'Status Changed' },
                  { value: 'TEAM_DISPATCHED', label: 'Team Dispatched' },
                  { value: 'TEAM_RELEASED', label: 'Team Released' },
                  { value: 'RESOURCE_ALLOCATED', label: 'Resource Allocated' },
                  { value: 'RESOURCE_RELEASED', label: 'Resource Released' },
                  { value: 'SHELTER_ASSIGNED', label: 'Shelter Assigned' },
                  { value: 'SHELTER_RELEASED', label: 'Shelter Released' },
                  { value: 'DAMAGE_REPORT_SUBMITTED', label: 'Damage Report' },
                  { value: 'ALERT_CREATED', label: 'Alert Created' },
                  { value: 'ALERT_ACKNOWLEDGED', label: 'Alert Acknowledged' },
                  { value: 'USER_LOGIN', label: 'User Login' },
                  { value: 'USER_REGISTERED', label: 'User Registered' },
                ]}
                className="text-xs"
              />
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={fetchLogs}
              title="Refresh Logs"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-emergency-subtle/30 border border-emergency/40 rounded text-xs text-emergency-light">
            {error}
          </div>
        )}

        {/* Audit Table */}
        <AuditTable logs={logs} loading={loading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
            <span>
              Showing page {page} of {totalPages} ({total} total audit records)
            </span>
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
    </AppShell>
  );
};

export default AuditLogs;
