import React from 'react';

const ShelterCapacityGauge = ({ capacity, availableSpaces }) => {
  const cap = Number(capacity) || 0;
  const avail = Number(availableSpaces) || 0;
  const occupied = Math.max(0, cap - avail);
  const percentage = cap > 0 ? Math.min(100, Math.round((occupied / cap) * 100)) : 100;

  let color = 'bg-success';
  let textColor = 'text-success-light';
  if (avail <= 0) {
    color = 'bg-emergency';
    textColor = 'text-emergency-light';
  } else if (avail / cap <= 0.2) {
    color = 'bg-warning';
    textColor = 'text-warning-light';
  }

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-2xs font-mono">
        <span className="text-gray-400">Occupancy</span>
        <span className={`font-bold ${textColor}`}>{percentage}% ({occupied}/{cap})</span>
      </div>
      <div className="h-1.5 w-full bg-eoc-bg rounded-full overflow-hidden border border-eoc-border">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ShelterCapacityGauge;
