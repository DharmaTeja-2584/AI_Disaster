import React from 'react';

/**
 * Badge — severity and status labeling.
 * variants: high | medium | low | info | neutral | critical | success
 */
const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variantClass = {
    high:     'badge-high',
    medium:   'badge-medium',
    low:      'badge-low',
    info:     'badge-info',
    neutral:  'badge-neutral',
    critical: 'badge-high',
    success:  'badge-low',
    warning:  'badge-medium',
  }[variant] || 'badge-neutral';

  return (
    <span className={`${variantClass} ${className}`}>
      {children}
    </span>
  );
};

/**
 * SeverityBadge — maps numeric severity 1–10 to badge variant
 */
export const SeverityBadge = ({ severity, className = '' }) => {
  const num = Number(severity);
  const variant = num >= 7 ? 'high' : num >= 4 ? 'medium' : 'low';
  const label   = num >= 7 ? 'High'  : num >= 4 ? 'Medium'  : 'Low';
  return (
    <Badge variant={variant} className={className}>
      {label} {num}/10
    </Badge>
  );
};

/**
 * PriorityBadge — maps priority string
 */
export const PriorityBadge = ({ priority, className = '' }) => {
  const variant = {
    High:   'high',
    Medium: 'medium',
    Low:    'low',
  }[priority] || 'neutral';

  return (
    <Badge variant={variant} className={className}>
      {priority}
    </Badge>
  );
};

export default Badge;
