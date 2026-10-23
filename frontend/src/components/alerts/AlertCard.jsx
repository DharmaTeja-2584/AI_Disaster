import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Link2, Clock } from 'lucide-react';
import AlertBadge from './AlertBadge';
import Button from '../ui/Button';

const PRIORITY_ICONS = {
  Critical: <AlertCircle className="w-5 h-5 text-emergency-light flex-shrink-0" />,
  Warning: <AlertTriangle className="w-5 h-5 text-warning-light flex-shrink-0" />,
  Info: <Info className="w-5 h-5 text-info-light flex-shrink-0" />,
};

const BORDER_ACCENTS = {
  Critical: 'border-l-4 border-l-emergency',
  Warning: 'border-l-4 border-l-warning',
  Info: 'border-l-4 border-l-info',
};

const AlertCard = ({
  alert,
  onAcknowledge,
  canAcknowledge = false,
  isAcknowledging = false,
}) => {
  const icon = PRIORITY_ICONS[alert.priority] || PRIORITY_ICONS.Info;
  const accent = BORDER_ACCENTS[alert.priority] || BORDER_ACCENTS.Info;

  const formattedTime = alert.alertTime
    ? new Date(alert.alertTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown time';

  return (
    <div
      className={`card p-4 transition-all hover:border-gray-600 ${accent} ${
        alert.isAcknowledged ? 'bg-eoc-surface/40 opacity-80' : 'bg-eoc-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5">{icon}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <AlertBadge priority={alert.priority} />

              {alert.incidentId && (
                <span className="inline-flex items-center gap-1 text-2xs font-mono text-gray-400 bg-eoc-bg px-2 py-0.5 rounded border border-eoc-border">
                  <Link2 className="w-3 h-3 text-cyan-400" />
                  Incident #{alert.incidentId}
                  {alert.incidentType && ` · ${alert.incidentType}`}
                </span>
              )}

              <span className="flex items-center gap-1 text-2xs text-gray-400 font-mono ml-auto">
                <Clock className="w-3 h-3" />
                {formattedTime}
              </span>
            </div>

            <h4 className="text-sm font-semibold text-gray-100 leading-tight">
              {alert.title}
            </h4>

            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed break-words">
              {alert.message}
            </p>

            <div className="mt-3 pt-2.5 border-t border-eoc-border/50 flex items-center justify-between text-2xs text-gray-400">
              <div className="flex items-center gap-2">
                {alert.isAcknowledged ? (
                  <span className="flex items-center gap-1 text-success-light font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Acknowledged ({alert.ackCount || 1})
                  </span>
                ) : (
                  <span className="text-warning-light font-medium">
                    Pending Acknowledgement
                  </span>
                )}
              </div>

              {canAcknowledge && !alert.isAcknowledged && (
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => onAcknowledge && onAcknowledge(alert.alertId)}
                  disabled={isAcknowledging}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Acknowledge
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
