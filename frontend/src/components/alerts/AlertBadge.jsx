import React from 'react';

const PRIORITY_STYLES = {
  Critical: 'bg-emergency-subtle text-emergency-light border-emergency/40',
  Warning: 'bg-warning-subtle text-warning-light border-warning/40',
  Info: 'bg-info-subtle text-info-light border-info/40',
};

const AlertBadge = ({ priority = 'Info', className = '' }) => {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Info;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold uppercase tracking-wider border ${style} ${className}`}
    >
      {priority}
    </span>
  );
};

export default AlertBadge;
