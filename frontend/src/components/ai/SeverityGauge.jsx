import React from 'react';

/**
 * SeverityGauge — visual 1-10 severity score gauge with color-coded segments
 */
const SeverityGauge = ({ severity = 1, showLabel = true, size = 'md' }) => {
  const num = Math.min(Math.max(Number(severity) || 1, 1), 10);
  const percentage = (num / 10) * 100;

  const color = num >= 7 ? 'text-emergency-light' : num >= 4 ? 'text-warning-light' : 'text-success-light';
  const bgColor = num >= 7 ? 'bg-emergency' : num >= 4 ? 'bg-warning' : 'bg-success';
  const label = num >= 7 ? 'HIGH SEVERITY' : num >= 4 ? 'MEDIUM SEVERITY' : 'LOW SEVERITY';

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-2xs">
          <span className="text-gray-400 font-semibold tracking-wider">{label}</span>
          <span className={`font-mono font-bold ${color}`}>{num} / 10</span>
        </div>
      )}

      {/* Segmented bar */}
      <div className="flex gap-1 h-2 w-full">
        {Array.from({ length: 10 }).map((_, i) => {
          const filled = i < num;
          let segmentColor = 'bg-eoc-muted/40';
          if (filled) {
            if (i >= 6) segmentColor = 'bg-emergency';
            else if (i >= 3) segmentColor = 'bg-warning';
            else segmentColor = 'bg-success';
          }
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all duration-300 ${segmentColor}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SeverityGauge;
