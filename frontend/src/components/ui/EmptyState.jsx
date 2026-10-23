import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — shown when data lists are empty
 */
const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description = '',
  action,
}) => (
  <div className="empty-state">
    <Icon className="empty-state-icon" />
    <p className="empty-state-title">{title}</p>
    {description && <p className="empty-state-description">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
