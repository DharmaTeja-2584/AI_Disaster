import React from 'react';

const ShelterCard = ({ title, value, label, icon: Icon, colorClass, borderClass, bgClass }) => {
  return (
    <div className={`metric-card ${borderClass || ''} ${bgClass || ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xs text-gray-400 uppercase tracking-widest font-semibold">{title}</span>
        {Icon && <Icon className={`w-4 h-4 ${colorClass || 'text-gray-400'}`} />}
      </div>
      <p className={`metric-value mt-2 ${colorClass || 'text-gray-100'}`}>{value}</p>
      {label && <p className="metric-label">{label}</p>}
    </div>
  );
};

export default ShelterCard;
