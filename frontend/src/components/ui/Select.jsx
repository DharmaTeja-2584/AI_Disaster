import React from 'react';

const Select = ({ options = [], className = '', children, ...props }) => {
  return (
    <select
      className={`w-full bg-eoc-bg border border-eoc-border rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {options && options.length > 0
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-eoc-surface text-gray-200">
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
};

export default Select;
