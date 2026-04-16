import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();

  // Base pill badge styles
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border";

  switch (normalizedStatus) {
    case 'ACTIVE':
      return (
        <span className={`${baseClasses} bg-blue-500/20 text-blue-400 border-blue-500/30`}>
          {status}
        </span>
      );
    case 'FUNDED':
      return (
        <span className={`${baseClasses} bg-green-500/20 text-green-400 border-green-500/30`}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1.5" />
          {status}
        </span>
      );
    case 'OVERDUE':
      return (
        <span className={`${baseClasses} bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse`}>
          {status}
        </span>
      );
    case 'DEFAULTED':
      return (
        <span className={`${baseClasses} bg-red-500/20 text-red-500 border-red-500/30 animate-shake`}>
          {status}
        </span>
      );
    case 'SETTLED':
      return (
        <span className={`${baseClasses} bg-gray-500/20 text-gray-400 border-gray-500/30`}>
          {status}
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-gray-500/20 text-gray-400 border-gray-500/30`}>
          {status}
        </span>
      );
  }
}
