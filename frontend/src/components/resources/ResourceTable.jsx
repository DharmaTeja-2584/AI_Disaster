import React from 'react';
import StatusPill from '../ui/StatusPill';
import Button from '../ui/Button';
import { Package, MapPin, AlertCircle, CheckCircle2, AlertTriangle, XCircle, Send } from 'lucide-react';

const ResourceTable = ({ resources, onSelectForAllocation, onStatusUpdate, loading }) => {
  const getStatusBadge = (res) => {
    const status = res.computedStatus || res.availability;
    switch (status) {
      case 'Available':
        return (
          <span className="badge bg-success-subtle text-success-light border border-success/30 text-2xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Available
          </span>
        );
      case 'Low Stock':
        return (
          <span className="badge bg-warning-subtle text-warning-light border border-warning/30 text-2xs flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3 h-3" /> Low Stock
          </span>
        );
      case 'Depleted':
        return (
          <span className="badge bg-emergency-subtle text-emergency-light border border-emergency/30 text-2xs flex items-center gap-1 font-semibold">
            <AlertCircle className="w-3 h-3" /> Depleted
          </span>
        );
      case 'Unavailable':
      default:
        return (
          <span className="badge bg-eoc-bg text-gray-400 border border-eoc-border text-2xs flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Unavailable
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
            <th>Resource Name</th>
            <th>Category</th>
            <th>Stock Quantity</th>
            <th>Operational Status</th>
            <th>Depot Location</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((res) => {
            const isDeployable = res.computedStatus !== 'Unavailable' && res.quantity > 0;
            return (
              <tr key={res.id} className="hover:bg-eoc-hover/80 transition-colors">
                <td className="font-mono text-xs text-gray-400">#{res.id}</td>
                <td>
                  <div className="font-semibold text-gray-100 text-xs flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-info-light flex-shrink-0" />
                    <span>{res.name}</span>
                  </div>
                </td>
                <td>
                  <span className="badge bg-eoc-bg text-info-light border border-info/30 text-2xs">
                    {res.category}
                  </span>
                </td>
                <td className="font-mono text-xs">
                  <span
                    className={`font-bold ${
                      res.quantity === 0
                        ? 'text-emergency-light'
                        : res.quantity <= 20
                        ? 'text-warning-light'
                        : 'text-success-light'
                    }`}
                  >
                    {res.quantity.toLocaleString()} units
                  </span>
                </td>
                <td>{getStatusBadge(res)}</td>
                <td className="text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span>{res.location || 'Central Depot'}</span>
                  </div>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onSelectForAllocation && (
                      <Button
                        variant={isDeployable ? 'danger' : 'ghost'}
                        size="sm"
                        disabled={!isDeployable}
                        icon={Send}
                        onClick={() => onSelectForAllocation(res)}
                      >
                        Allocate
                      </Button>
                    )}
                    {onStatusUpdate && (
                      <select
                        className="form-select text-2xs py-1 px-2 bg-eoc-bg border-eoc-border text-gray-300"
                        value={res.availability}
                        onChange={(e) => onStatusUpdate(res.id, e.target.value)}
                      >
                        <option value="Available">Set Available</option>
                        <option value="Low Stock">Set Low Stock</option>
                        <option value="Depleted">Set Depleted</option>
                        <option value="Unavailable">Set Unavailable</option>
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResourceTable;
