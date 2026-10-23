import React, { useState, useEffect } from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getDamageReports } from '../../api/damageReports';
import { FileText, RefreshCw, AlertTriangle, DollarSign, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const DAMAGE_COLORS = {
  Minor: 'bg-info-subtle text-info-light border-info/40',
  Moderate: 'bg-warning-subtle text-warning-light border-warning/40',
  Severe: 'bg-orange-950/40 text-orange-400 border-orange-500/40',
  Critical: 'bg-emergency-subtle text-emergency-light border-emergency/40',
};

const DamageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [damageLevel, setDamageLevel] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDamageReports({
        page,
        limit: 15,
        damageLevel: damageLevel !== 'All' ? damageLevel : undefined,
        search: search.trim() || undefined,
      });
      const payload = res.data?.data || res.data;
      setReports(payload.damageReports || []);
      setTotalPages(payload.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load damage assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, damageLevel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  return (
    <AppShell title="Damage Reports Hub">
      <PageHeader
        title="Field Damage Assessments"
        subtitle="On-scene structural integrity logs and casualty impact reports"
        breadcrumb="Responder / Damage Reports"
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Filters */}
        <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
            <Input
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
            <Button type="submit" size="sm" variant="secondary">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <div className="w-36">
              <Select
                value={damageLevel}
                onChange={(e) => {
                  setDamageLevel(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: 'All', label: 'All Severity' },
                  { value: 'Minor', label: 'Minor' },
                  { value: 'Moderate', label: 'Moderate' },
                  { value: 'Severe', label: 'Severe' },
                  { value: 'Critical', label: 'Critical' },
                ]}
                className="text-xs"
              />
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={fetchReports}
              title="Refresh Reports"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-emergency-subtle/30 border border-emergency/40 rounded text-xs text-emergency-light">
            {error}
          </div>
        )}

        {/* Reports Grid */}
        {loading ? (
          <div className="card p-12 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            Loading damage assessments from MySQL...
          </div>
        ) : reports.length === 0 ? (
          <div className="card p-12 text-center text-gray-500 text-xs">
            No damage reports logged in the database yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((dr) => {
              const badgeStyle = DAMAGE_COLORS[dr.damageLevel] || DAMAGE_COLORS.Moderate;
              return (
                <div key={dr.reportId} className="card p-4 space-y-3 bg-eoc-surface">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold uppercase tracking-wider border ${badgeStyle}`}
                    >
                      {dr.damageLevel} Damage
                    </span>

                    {dr.incidentId && (
                      <Link
                        to={`/commander/incidents/${dr.incidentId}`}
                        className="flex items-center gap-1 text-2xs font-mono text-cyan-400 hover:underline"
                      >
                        <Link2 className="w-3 h-3" />
                        Incident #{dr.incidentId}
                      </Link>
                    )}
                  </div>

                  <p className="text-xs text-gray-200 leading-relaxed">
                    {dr.description}
                  </p>

                  <div className="pt-2 border-t border-eoc-border/60 flex items-center justify-between text-2xs text-gray-400 font-mono">
                    <span className="flex items-center gap-1 text-success-light font-semibold">
                      <DollarSign className="w-3.5 h-3.5" />
                      Loss Est: ${Number(dr.estimatedLoss).toLocaleString()}
                    </span>

                    {dr.photo && (
                      <span className="text-gray-400 truncate max-w-[150px]">
                        Ref: {dr.photo}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
    </AppShell>
  );
};

export default DamageReports;
