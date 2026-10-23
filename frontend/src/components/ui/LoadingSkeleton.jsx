import React from 'react';

/**
 * LoadingSkeleton — shimmer placeholders for loading states
 */
const LoadingSkeleton = ({ className = '', height = 'h-4', width = 'w-full' }) => (
  <div className={`skeleton ${height} ${width} ${className}`} />
);

/**
 * SkeletonRow — table row placeholder
 */
export const SkeletonRow = ({ cols = 6 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-3 py-2.5">
        <LoadingSkeleton height="h-4" width={i === 0 ? 'w-20' : 'w-full'} />
      </td>
    ))}
  </tr>
);

/**
 * SkeletonCard — metric card placeholder
 */
export const SkeletonCard = () => (
  <div className="metric-card flex flex-col gap-3">
    <LoadingSkeleton height="h-3" width="w-1/2" />
    <LoadingSkeleton height="h-8" width="w-1/3" />
    <LoadingSkeleton height="h-3" width="w-2/3" />
  </div>
);

/**
 * SkeletonTable — full table placeholder
 */
export const SkeletonTable = ({ rows = 5, cols = 6 }) => (
  <table className="data-table">
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </tbody>
  </table>
);

export default LoadingSkeleton;
