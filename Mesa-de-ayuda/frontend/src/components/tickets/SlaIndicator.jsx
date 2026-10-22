import React from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getSlaInfo } from '../../utils/formatters';

export function SlaIndicator({ ticket, showIcon = true }) {
  const slaInfo = getSlaInfo(ticket);

  let Icon = Clock;
  if (slaInfo.isOverdue) Icon = AlertTriangle;
  else if (ticket.estado === 'resuelto' || ticket.estado === 'cerrado') Icon = CheckCircle2;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${slaInfo.badgeClass}`}
      title={`Fecha límite: ${ticket.fecha_limite}`}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{slaInfo.text}</span>
    </span>
  );
}
