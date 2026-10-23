import React from 'react';
import { Clock, User, Shield, Activity, FileText } from 'lucide-react';

const ACTION_COLORS = {
  USER_LOGIN: 'bg-blue-950/60 text-blue-300 border-blue-800',
  USER_REGISTERED: 'bg-blue-950/60 text-blue-300 border-blue-800',
  INCIDENT_CREATED: 'bg-cyan-950/60 text-cyan-300 border-cyan-800',
  INCIDENT_STATUS_CHANGED: 'bg-indigo-950/60 text-indigo-300 border-indigo-800',
  INCIDENT_RESOLVED: 'bg-success-subtle text-success-light border-success/40',
  TEAM_DISPATCHED: 'bg-purple-950/60 text-purple-300 border-purple-800',
  TEAM_RELEASED: 'bg-purple-950/40 text-purple-400 border-purple-800/60',
  RESOURCE_ALLOCATED: 'bg-warning-subtle text-warning-light border-warning/40',
  RESOURCE_RELEASED: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
  SHELTER_ASSIGNED: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
  SHELTER_RELEASED: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
  DAMAGE_REPORT_SUBMITTED: 'bg-emergency-subtle text-emergency-light border-emergency/40',
  ALERT_CREATED: 'bg-yellow-950/60 text-yellow-300 border-yellow-800',
  ALERT_ACKNOWLEDGED: 'bg-orange-950/60 text-orange-300 border-orange-800',
};

const AuditTable = ({ logs = [], loading = false }) => {
  if (loading) {
    return (
      <div className="card p-12 text-center text-xs text-gray-400">
        Loading system audit trail...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="card p-12 text-center text-xs text-gray-500">
        No audit events found matching current criteria.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-eoc-surface border-b border-eoc-border text-2xs uppercase tracking-wider text-gray-400">
              <th className="py-2.5 px-3 font-semibold">Timestamp</th>
              <th className="py-2.5 px-3 font-semibold">User</th>
              <th className="py-2.5 px-3 font-semibold">Action</th>
              <th className="py-2.5 px-3 font-semibold">Entity</th>
              <th className="py-2.5 px-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-eoc-border/50 text-gray-300">
            {logs.map((log) => {
              const badgeStyle = ACTION_COLORS[log.action] || 'bg-eoc-surface text-gray-400 border-gray-700';

              const timeStr = log.createdTime
                ? new Date(log.createdTime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : 'Recent';

              return (
                <tr key={log.auditId} className="hover:bg-eoc-surface/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-2xs text-gray-400 whitespace-nowrap">
                    {timeStr}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {log.userName ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-200">{log.userName}</span>
                        {log.userRole && (
                          <span className="text-2xs font-mono text-gray-500 uppercase">
                            ({log.userRole})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-2xs font-mono text-gray-500">System</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono font-semibold border ${badgeStyle}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-2xs font-mono text-gray-400 whitespace-nowrap">
                    {log.entityType ? (
                      <span>
                        {log.entityType}
                        {log.entityId ? ` #${log.entityId}` : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-2xs text-gray-300 max-w-md truncate">
                    {log.details || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTable;
