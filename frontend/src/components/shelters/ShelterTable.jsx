import React from 'react';
import ShelterCapacityGauge from './ShelterCapacityGauge';
import Button from '../ui/Button';
import { Home, MapPin, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';

const ShelterTable = ({ shelters, onSelectForAssignment }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return (
          <span className="badge bg-success-subtle text-success-light border border-success/30 text-2xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Available
          </span>
        );
      case 'Near Capacity':
        return (
          <span className="badge bg-warning-subtle text-warning-light border border-warning/30 text-2xs flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3 h-3" /> Near Capacity
          </span>
        );
      case 'Full':
      default:
        return (
          <span className="badge bg-emergency-subtle text-emergency-light border border-emergency/30 text-2xs flex items-center gap-1 font-semibold">
            <AlertCircle className="w-3 h-3" /> Full
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Shelter Name</th>
            <th>Depot Location</th>
            <th>Capacity</th>
            <th>Available Spaces</th>
            <th className="w-48">Occupancy</th>
            <th>Status</th>
            {onSelectForAssignment && <th className="text-right">Action</th>}
          </tr>
        </thead>
        <tbody>
          {shelters.map((s) => {
            const hasSpaces = s.availableSpaces > 0;
            return (
              <tr key={s.id} className="hover:bg-eoc-hover/80 transition-colors">
                <td className="font-mono text-xs text-gray-400">#{s.id}</td>
                <td>
                  <div className="font-semibold text-gray-100 text-xs flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-success-light flex-shrink-0" />
                    <span>{s.name}</span>
                  </div>
                </td>
                <td className="text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span>{s.location}</span>
                  </div>
                </td>
                <td className="font-mono text-xs text-gray-300">{s.capacity.toLocaleString()}</td>
                <td className="font-mono text-xs">
                  <span
                    className={`font-bold ${
                      s.availableSpaces === 0
                        ? 'text-emergency-light'
                        : s.availableSpaces / s.capacity <= 0.2
                        ? 'text-warning-light'
                        : 'text-success-light'
                    }`}
                  >
                    {s.availableSpaces.toLocaleString()}
                  </span>
                </td>
                <td>
                  <ShelterCapacityGauge
                    capacity={s.capacity}
                    availableSpaces={s.availableSpaces}
                  />
                </td>
                <td>{getStatusBadge(s.computedStatus)}</td>
                {onSelectForAssignment && (
                  <td className="text-right">
                    <Button
                      variant={hasSpaces ? 'danger' : 'ghost'}
                      size="sm"
                      disabled={!hasSpaces}
                      onClick={() => onSelectForAssignment(s)}
                    >
                      Assign
                    </Button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ShelterTable;
