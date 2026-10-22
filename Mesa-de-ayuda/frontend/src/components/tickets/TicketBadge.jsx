import React from 'react';
import { getStatusConfig, getPriorityConfig } from '../../utils/formatters';

export function StatusBadge({ status }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const config = getPriorityConfig(priority);

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${config.badgeClass}`}
    >
      {config.label}
    </span>
  );
}
