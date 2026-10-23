import React from 'react';

/**
 * PageHeader — consistent page-level header used on all pages
 */
const PageHeader = ({ title, subtitle, actions, breadcrumb }) => (
  <div className="page-header">
    <div>
      {breadcrumb && (
        <p className="text-2xs text-gray-600 uppercase tracking-widest mb-0.5">{breadcrumb}</p>
      )}
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && (
      <div className="flex items-center gap-2">
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;
