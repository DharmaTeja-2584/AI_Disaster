import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ShelterCard from '../../components/shelters/ShelterCard';
import ShelterTable from '../../components/shelters/ShelterTable';
import ShelterAssignmentModal from '../../components/shelters/ShelterAssignmentModal';
import { SkeletonCard, SkeletonTable } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { getShelters, getShelterMetrics } from '../../api/shelters';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Users,
} from 'lucide-react';

const Shelters = () => {
  const { role } = useAuth();
  const toast = useToast();
  const isAdmin = role === 'admin';

  const [shelters, setShelters] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedShelterForAssign, setSelectedShelterForAssign] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shlRes, metRes] = await Promise.all([
        getShelters({
          search: search.trim() || undefined,
          availability: availabilityFilter !== 'All' ? availabilityFilter : undefined,
          limit: 50,
        }),
        getShelterMetrics(),
      ]);

      setShelters(shlRes.data.data.shelters || []);
      setMetrics(metRes.data.data.metrics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load evacuation shelter network.');
    } finally {
      setLoading(false);
    }
  }, [search, availabilityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectForAssignment = (shelter) => {
    setSelectedShelterForAssign(shelter);
    setAssignmentModalOpen(true);
  };

  return (
    <AppShell
      title={isAdmin ? 'Evacuation Facility & Shelter Administration' : 'Evacuation Shelters Management'}
      onRefresh={fetchData}
    >
      <PageHeader
        title={
          isAdmin
            ? 'Evacuation Facility Oversight & Shelter Governance'
            : 'Evacuation Shelter Network & Capacity Hub'
        }
        subtitle={
          isAdmin
            ? 'Administrative facility oversight, municipal safety quotas, and emergency evacuation routing — Authenticated as System Administrator'
            : 'Live municipal shelter capacities, occupancy gauges, and intelligent incident evacuation routing — Authenticated as Incident Commander'
        }
        breadcrumb={`${isAdmin ? 'Admin' : 'Commander'} / Evacuation Shelters`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              icon={Home}
              onClick={() => {
                setSelectedShelterForAssign(null);
                setAssignmentModalOpen(true);
              }}
            >
              Assign Shelter to Incident
            </Button>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchData} disabled={loading}>
              Refresh Network
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* ── Metric Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading && !metrics ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <ShelterCard
                title="Total Evacuation Centers"
                value={metrics?.totalShelters || 0}
                label={`${(metrics?.totalCapacity || 0).toLocaleString()} total bed capacity`}
                icon={Home}
                colorClass="text-gray-100"
              />
              <ShelterCard
                title="Available Shelters"
                value={metrics?.availableCount || 0}
                label={`${(metrics?.availableSpaces || 0).toLocaleString()} open spaces available`}
                icon={CheckCircle2}
                colorClass="text-success-light"
                borderClass="border-success/30"
                bgClass="bg-success-subtle/20"
              />
              <ShelterCard
                title="Near Capacity"
                value={metrics?.nearCapacityCount || 0}
                label="≤ 20% remaining capacity"
                icon={AlertTriangle}
                colorClass="text-warning-light"
                borderClass="border-warning/30"
                bgClass="bg-warning-subtle/20"
              />
              <ShelterCard
                title="Full / At Max Capacity"
                value={metrics?.fullCount || 0}
                label="0 available spaces remaining"
                icon={AlertCircle}
                colorClass="text-emergency-light"
                borderClass="border-emergency/30"
                bgClass="bg-emergency-subtle/20"
              />
            </>
          )}
        </div>

        {/* ── Shelter Network Table Card ────────────────────────────────── */}
        <Card>
          <div className="p-4 border-b border-eoc-border space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Designated Evacuation Shelters ({shelters.length})</CardTitle>
                <CardSubtitle>Regional intake centers, facilities, and current available beds</CardSubtitle>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  className="form-input pl-9 text-xs"
                  placeholder="Search shelter name, street address, district..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-gray-400 uppercase whitespace-nowrap">Filter Status:</span>
                <select
                  className="form-select text-xs py-1.5"
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <option value="All">All Availabilities</option>
                  <option value="Available">Available (&gt; 20%)</option>
                  <option value="Near Capacity">Near Capacity (≤ 20%)</option>
                  <option value="Full">Full (0 spaces)</option>
                </select>
              </div>
            </div>
          </div>

          <CardBody className="p-0">
            {loading ? (
              <div className="p-4">
                <SkeletonTable rows={5} cols={7} />
              </div>
            ) : error ? (
              <div className="p-8">
                <ErrorState message={error} onRetry={fetchData} />
              </div>
            ) : shelters.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Home}
                  title="No Evacuation Shelters Found"
                  description="Adjust filter criteria or search terms to inspect municipal shelter facilities."
                />
              </div>
            ) : (
              <ShelterTable
                shelters={shelters}
                onSelectForAssignment={handleSelectForAssignment}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Assignment Modal */}
      <ShelterAssignmentModal
        isOpen={assignmentModalOpen}
        preselectedShelter={selectedShelterForAssign}
        onClose={() => {
          setAssignmentModalOpen(false);
          setSelectedShelterForAssign(null);
        }}
        onAssignmentSuccess={() => {
          fetchData();
        }}
      />
    </AppShell>
  );
};

export default Shelters;
