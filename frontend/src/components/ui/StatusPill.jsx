import React from 'react';

/**
 * StatusPill — color-coded status indicator for Teams, Shelters, Incidents
 */
const StatusPill = ({ status, className = '' }) => {
  const normalized = status?.toLowerCase().replace(/[\s_-]/g, '');

  const map = {
    available:    'status-available',
    deployed:     'status-deployed',
    active:       'status-active',
    resolved:     'status-resolved',
    reported:     'status-reported',
    triaged:      'status-triaged',
    contained:    'status-contained',
    offduty:      'status-offduty',
    full:         'status-full',
    nearcapacity: 'status-nearCapacity',
    closed:       'status-full',
    lowstock:     'badge-medium',
    depleted:     'badge-high',
    unavailable:  'badge-neutral',
  };

  const dotMap = {
    available:    'bg-green-500',
    deployed:     'bg-blue-500',
    active:       'bg-red-500',
    resolved:     'bg-green-500',
    reported:     'bg-yellow-500',
    triaged:      'bg-orange-500',
    contained:    'bg-blue-400',
    offduty:      'bg-gray-500',
    full:         'bg-red-500',
    nearcapacity: 'bg-orange-500',
  };

  const pillClass = map[normalized] || 'status-pill text-gray-400';
  const dotClass  = dotMap[normalized] || 'bg-gray-500';

  return (
    <span className={`${pillClass} ${className}`}>
      <span className={`status-dot ${dotClass}`} />
      {status}
    </span>
  );
};

export default StatusPill;
