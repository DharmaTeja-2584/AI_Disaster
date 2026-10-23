import React from 'react';

const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full bg-eoc-bg border border-eoc-border rounded px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
};

export default Input;
