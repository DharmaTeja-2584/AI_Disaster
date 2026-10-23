import React, { useState, useEffect } from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import ShelterCapacityGauge from '../../components/shelters/ShelterCapacityGauge';
import { SkeletonCard } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import { getShelters } from '../../api/shelters';
import { Home, MapPin, Users, Info, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';

const NearbyShelters = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchShelters = async () => {
    setLoading(true);
    try {
      const res = await getShelters();
      setShelters(res.data.data.shelters || []);
    } catch (err) {
      console.error('Failed to load shelters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  return (
    <AppShell title="Nearby Shelters" onRefresh={fetchShelters}>
      <PageHeader
        title="Designated Evacuation Shelters"
        subtitle="Public evacuation and disaster relief facilities with live space availability"
        breadcrumb="Civilian / Shelters"
        actions={
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchShelters} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="alert-info-box flex items-start gap-2.5">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-gray-200">Public Emergency Notice</p>
            <p className="text-gray-400">
              Shelter capacities are updated live as evacuees are assigned by emergency personnel. If a facility reaches capacity, proceed to the nearest available center.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : shelters.length === 0 ? (
          <EmptyState
            icon={Home}
            title="No Shelters Registered"
            description="No municipal shelters are currently registered in the database."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shelters.map((shelter) => (
              <Card key={shelter.id}>
                <CardHeader actions={<StatusPill status={shelter.computedStatus} />}>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Home className="w-4 h-4 text-info-light" />
                    {shelter.name}
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{shelter.location}</span>
                  </div>

                  <ShelterCapacityGauge
                    capacity={shelter.capacity}
                    availableSpaces={shelter.availableSpaces}
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-eoc-border text-2xs font-mono">
                    <span>Total Bed Capacity: <strong className="text-gray-200">{shelter.capacity}</strong></span>
                    <span>Available Spaces: <strong className="text-success-light">{shelter.availableSpaces}</strong></span>
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

export default NearbyShelters;
