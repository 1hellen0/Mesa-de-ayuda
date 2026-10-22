import React from 'react';
import { UserCheck, ShieldAlert } from 'lucide-react';

export function AgentWorkloadChart({ agents = [] }) {
  if (!agents || agents.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm text-slate-500">
        No hay agentes activos registrados.
      </div>
    );
  }

  const maxTickets = Math.max(...agents.map((a) => a.tickets_en_curso || 0), 1);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-800">Carga Activa por Agente</h3>
          <p className="text-xs text-slate-500">Tickets en estado abierto o en progreso</p>
        </div>
        <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
          {agents.length} agentes activos
        </span>
      </div>

      <div className="space-y-4">
        {agents.map((agent, index) => {
          const count = agent.tickets_en_curso || 0;
          const percentage = Math.round((count / maxTickets) * 100);
          const isLeastLoaded = index === 0; // Backend ordena por tickets_en_curso ASC

          return (
            <div key={agent.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{agent.nombre}</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                    {agent.area}
                  </span>
                  {isLeastLoaded && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <UserCheck className="h-3 w-3" />
                      Prioridad de asignación
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-700">
                  {count} {count === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    count === 0
                      ? 'bg-slate-300'
                      : count >= 3
                      ? 'bg-amber-500'
                      : 'bg-sky-600'
                  }`}
                  style={{ width: `${Math.max(percentage, 6)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
