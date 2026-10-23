import React from 'react';
import {
  Clock,
  AlertCircle,
  Brain,
  Navigation,
  Package,
  Home,
  FileText,
  Bell,
  CheckCircle2,
} from 'lucide-react';

const EVENT_CONFIG = {
  REPORTED: {
    icon: <AlertCircle className="w-4 h-4 text-cyan-400" />,
    border: 'border-cyan-500/40',
    dot: 'bg-cyan-500',
  },
  AI_TRIAGE: {
    icon: <Brain className="w-4 h-4 text-purple-400" />,
    border: 'border-purple-500/40',
    dot: 'bg-purple-500',
  },
  AI_REASSESSMENT: {
    icon: <Brain className="w-4 h-4 text-pink-400" />,
    border: 'border-pink-500/40',
    dot: 'bg-pink-500',
  },
  DISPATCH: {
    icon: <Navigation className="w-4 h-4 text-blue-400" />,
    border: 'border-blue-500/40',
    dot: 'bg-blue-500',
  },
  RESOURCE: {
    icon: <Package className="w-4 h-4 text-warning-light" />,
    border: 'border-warning/40',
    dot: 'bg-warning',
  },
  SHELTER: {
    icon: <Home className="w-4 h-4 text-success-light" />,
    border: 'border-success/40',
    dot: 'bg-success',
  },
  DAMAGE_REPORT: {
    icon: <FileText className="w-4 h-4 text-emergency-light" />,
    border: 'border-emergency/40',
    dot: 'bg-emergency',
  },
  ALERT: {
    icon: <Bell className="w-4 h-4 text-yellow-400" />,
    border: 'border-yellow-500/40',
    dot: 'bg-yellow-400',
  },
};

const OperationalTimeline = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-4 bg-eoc-bg rounded border border-eoc-border text-xs text-gray-500 italic">
        No operational timeline events recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-eoc-border">
      {timeline.map((item, idx) => {
        const config = EVENT_CONFIG[item.type] || {
          icon: <Clock className="w-4 h-4 text-gray-400" />,
          border: 'border-gray-600',
          dot: 'bg-gray-500',
        };

        const timeStr = item.timestamp
          ? new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '—';

        return (
          <div key={idx} className="relative flex items-start gap-3">
            {/* Dot marker */}
            <div
              className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-eoc-surface ${config.dot}`}
            />

            <div
              className={`flex-1 p-3 bg-eoc-bg rounded border ${config.border} space-y-1 text-xs`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-semibold text-gray-200">
                  {config.icon}
                  <span>{item.title}</span>
                </div>
                <span className="text-2xs text-gray-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeStr}
                </span>
              </div>
              <p className="text-gray-300 text-2xs leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OperationalTimeline;
