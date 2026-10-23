import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Spinner — loading indicator
 */
const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return <Loader2 className={`animate-spin text-info ${sizeClass} ${className}`} />;
};

export default Spinner;
