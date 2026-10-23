import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * ErrorState — shown on API/data fetch errors
 */
const ErrorState = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) => (
  <div className="empty-state">
    <AlertTriangle className="empty-state-icon text-emergency" />
    <p className="empty-state-title">Error</p>
    <p className="empty-state-description max-w-xs">{message}</p>
    {onRetry && (
      <div className="mt-4">
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      </div>
    )}
  </div>
);

export default ErrorState;
