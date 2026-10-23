import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ResourceCard from '../../components/resources/ResourceCard';
import ResourceTable from '../../components/resources/ResourceTable';
import ResourceAllocationModal from '../../components/resources/ResourceAllocationModal';
import { SkeletonCard, SkeletonTable } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { getResources, getResourceMetrics, updateResourceStatus } from '../../api/resources';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  Layers,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Send,
  CheckCircle2,
} from 'lucide-react';

const Resources = () => {
  const { role } = useAuth();
  const toast = useToast();
  const isAdmin = role === 'admin';

  const [resources, setResources] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('id_asc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedResourceForAllocation, setSelectedResourceForAllocation] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resRes, metricsRes] = await Promise.all([
        getResources({
          search: search.trim() || undefined,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          availability: availabilityFilter !== 'All' ? availabilityFilter : undefined,
          sortBy,
          page,
          limit: 15,
        }),
        getResourceMetrics(),
      ]);

      setResources(resRes.data.data.resources || []);
      setPagination(resRes.data.data.pagination || { total: 0, totalPages: 1 });
      setMetrics(metricsRes.data.data.metrics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory resources.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, availabilityFilter, sortBy, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (resourceId, newStatus) => {
    try {
      await updateResourceStatus(resourceId, newStatus);
      toast.success(`Resource #${resourceId} status updated to ${newStatus}.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update resource status.');
    }
  };

  const handleSelectForAllocation = (res) => {
    setSelectedResourceForAllocation(res);
    setAllocationModalOpen(true);
  };

  return (
    <AppShell
      title={isAdmin ? 'Logistics Inventory & Stockpile Governance' : 'Resource Inventory Management'}
      onRefresh={fetchData}
    >
      <PageHeader
        title={
          isAdmin
            ? 'Logistics Inventory & Supply Stockpiles'
            : 'Resource Inventory & Allocation Hub'
        }
        subtitle={
          isAdmin
            ? 'Administrative stockpile governance, inventory levels, and incident allocations — Authenticated as System Administrator'
            : 'Live MySQL inventory stock, automated low-stock warnings, and atomic incident deployment — Authenticated as Incident Commander'
        }
        breadcrumb={`${isAdmin ? 'Admin' : 'Commander'} / Resource Management`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              icon={Send}
              onClick={() => {
                setSelectedResourceForAllocation(null);
                setAllocationModalOpen(true);
              }}
            >
              Allocate to Incident
            </Button>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchData} disabled={loading}>
              Refresh Stock
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
              <ResourceCard
                title="Total Resource Types"
                value={metrics?.totalTypes || 0}
                label={`${(metrics?.totalQuantity || 0).toLocaleString()} total units in depot`}
                icon={Layers}
                colorClass="text-gray-100"
              />
              <ResourceCard
                title="Available Stock"
                value={metrics?.availableCount || 0}
                label="Healthy supply ready for dispatch"
                icon={CheckCircle2}
                colorClass="text-success-light"
                borderClass="border-success/30"
                bgClass="bg-success-subtle/20"
              />
              <ResourceCard
                title="Low Stock Warning"
                value={metrics?.lowStockCount || 0}
                label="Stock ≤ 20 units (Restock needed)"
                icon={AlertTriangle}
                colorClass="text-warning-light"
                borderClass="border-warning/30"
                bgClass="bg-warning-subtle/20"
              />
              <ResourceCard
                title="Depleted Supplies"
                value={metrics?.depletedCount || 0}
                label="Stock depleted (0 units remaining)"
                icon={AlertCircle}
                colorClass="text-emergency-light"
                borderClass="border-emergency/30"
                bgClass="bg-emergency-subtle/20"
              />
            </>
          )}
        </div>

        {/* ── Inventory Table Card ──────────────────────────────────────── */}
        <Card>
          <div className="p-4 border-b border-eoc-border space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Depot Inventory ({pagination.total})</CardTitle>
                <CardSubtitle>Track, inspect, and deploy emergency relief assets</CardSubtitle>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  className="form-input pl-9 text-xs"
                  placeholder="Search item, category, location..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-gray-400 uppercase whitespace-nowrap">Category:</span>
                <select
                  className="form-select text-xs py-1.5"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All Categories</option>
                  <option value="Medical">Medical</option>
                  <option value="Food & Water">Food &amp; Water</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Shelter Supplies">Shelter Supplies</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-gray-400 uppercase whitespace-nowrap">Status:</span>
                <select
                  className="form-select text-xs py-1.5"
                  value={availabilityFilter}
                  onChange={(e) => {
                    setAvailabilityFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available (&gt;20)</option>
                  <option value="Low Stock">Low Stock (≤20)</option>
                  <option value="Depleted">Depleted (0)</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

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
                  <option value="id_asc">ID (Ascending)</option>
                  <option value="quantity_desc">Quantity (Highest First)</option>
                  <option value="quantity_asc">Quantity (Lowest First)</option>
                  <option value="name_asc">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          <CardBody className="p-0">
            {loading ? (
              <div className="p-4">
                <SkeletonTable rows={6} cols={7} />
              </div>
            ) : error ? (
              <div className="p-8">
                <ErrorState message={error} onRetry={fetchData} />
              </div>
            ) : resources.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Package}
                  title="No Resources Found"
                  description="No items match your active filter criteria. Try adjusting the search or category filters."
                />
              </div>
            ) : (
              <ResourceTable
                resources={resources}
                onSelectForAllocation={handleSelectForAllocation}
                onStatusUpdate={handleStatusUpdate}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Allocation Modal */}
      <ResourceAllocationModal
        isOpen={allocationModalOpen}
        onClose={() => {
          setAllocationModalOpen(false);
          setSelectedResourceForAllocation(null);
        }}
        preselectedResource={selectedResourceForAllocation}
        onAllocationSuccess={() => {
          fetchData();
        }}
      />
    </AppShell>
  );
};

export default Resources;
