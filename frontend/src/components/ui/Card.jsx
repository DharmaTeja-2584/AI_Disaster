import React from 'react';

/**
 * Card — dark surface container
 */
const Card = ({ children, className = '', noPadding = false }) => (
  <div className={`card ${noPadding ? '' : ''} ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', actions }) => (
  <div className={`card-header ${className}`}>
    <div className="flex-1">{children}</div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-sm font-semibold text-gray-200 ${className}`}>{children}</h3>
);

export const CardSubtitle = ({ children, className = '' }) => (
  <p className={`text-xs text-gray-500 mt-0.5 ${className}`}>{children}</p>
);

export default Card;
