import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  ArrowRight,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { StatusBadge, PriorityBadge } from '../components/tickets/TicketBadge';
import { SlaIndicator } from '../components/tickets/SlaIndicator';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { formatDate, parseDate } from '../utils/formatters';

export function DashboardPage() {
  const {
    data: summary,
    loading: loadingSummary,
    error: errorSummary,
    refetch: refetchSummary
  } = useFetch(() => api.getSummary(), []);

  const {
    data: recentTickets,
    loading: loadingTickets,
    error: errorTickets,
    refetch: refetchTickets
  } = useFetch(() => api.getTickets({ sortBy: 'fecha_creacion', order: 'desc', limit: 10 }), []);

  const counts = summary?.resumen_tickets || summary?.tickets_por_estado || {};
  const cumplimiento = summary?.cumplimiento_sla || {};
  const cargaAgentes = summary?.carga_por_agente || [];

  const abiertos = counts.abiertos ?? counts.abierto ?? 0;
  const enProgreso = counts.en_progreso ?? counts['en progreso'] ?? 0;
  const resueltos = counts.resueltos ?? counts.resuelto ?? 0;
  const cerrados = counts.cerrados ?? counts.cerrado ?? 0;
  const total = counts.total ?? counts.total_tickets ?? (abiertos + enProgreso + resueltos + cerrados);
  const totalActivos = abiertos + enProgreso;

  const ticketsList = Array.isArray(recentTickets?.tickets)
    ? recentTickets.tickets
    : Array.isArray(recentTickets)
    ? recentTickets
    : [];

  // Calcular tickets próximos a vencer (< 4h) y vencidos de forma precisa
  const { ticketsVencidos, ticketsEnRiesgo } = useMemo(() => {
    const now = Date.now();
    const active = ticketsList.filter(t => t.estado === 'abierto' || t.estado === 'en progreso');

    const vencidos = [];
    const enRiesgo = [];

    active.forEach(t => {
      const limitDate = parseDate(t.fecha_limite);
      if (!limitDate) return;
      const diffHoras = (limitDate.getTime() - now) / (1000 * 60 * 60);
      if (diffHoras < 0) {
        vencidos.push({ ...t, diffHoras });
      } else if (diffHoras <= 4) {
        enRiesgo.push({ ...t, diffHoras });
      }
    });

    return {
      ticketsVencidos: vencidos.sort((a, b) => a.diffHoras - b.diffHoras),
      ticketsEnRiesgo: enRiesgo.sort((a, b) => a.diffHoras - b.diffHoras)
    };
  }, [ticketsList]);

  if (loadingSummary || loadingTickets) {
    return <LoadingSpinner message="Sincronizando métricas con Centro de Operaciones NEXORA..." />;
  }

  if (errorSummary) {
    return (
      <ErrorMessage
        title="Error al cargar el Centro de Operaciones"
        message={errorSummary}
        onRetry={() => {
          refetchSummary();
          refetchTickets();
        }}
      />
    );
  }

  // Agentes totales activos calculando porcentaje de carga para el donut
  const totalTicketsEnCurso = cargaAgentes.reduce((acc, a) => acc + (a.tickets_en_curso || 0), 0) || 1;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. Header del Centro de Operaciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2DDD2] pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C49A6C]">
            Vista Ejecutiva en Tiempo Real
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202C2A] font-display">
            Centro de Operaciones
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#252A30]/65">
            Supervisión integral de incidentes, cumplimiento de SLA y distribución de agentes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tickets/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-[#202C2A] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs border border-[#202C2A] hover:bg-[#151E1C] hover:border-[#C49A6C] transition-all"
          >
            <Plus className="h-4 w-4 text-[#A9B8A5]" />
            <span>Crear Ticket</span>
          </Link>
        </div>
      </div>

      {/* 2. Cuatro Tarjetas Principales de Métricas (Estilo Nexora) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        
        {/* Abiertos */}
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-5 shadow-xs hover:border-[#C49A6C]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#252A30]/60">
              Abiertos
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#202C2A] font-display">
              {abiertos}
            </span>
            <span className="flex items-center text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              ↑ Pendientes
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#252A30]/60">Sin iniciar atención activa</p>
        </div>

        {/* En progreso */}
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-5 shadow-xs hover:border-[#C49A6C]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#252A30]/60">
              En progreso
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#202C2A] font-display">
              {enProgreso}
            </span>
            <span className="flex items-center text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              • En atención
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#252A30]/60">Asignados a agentes</p>
        </div>

        {/* Resueltos */}
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-5 shadow-xs hover:border-[#C49A6C]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#252A30]/60">
              Resueltos
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#202C2A] font-display">
              {resueltos}
            </span>
            <span className="flex items-center text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ✓ Solucionados
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#252A30]/60">Solución documentada</p>
        </div>

        {/* Cerrados */}
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-5 shadow-xs hover:border-[#C49A6C]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#252A30]/60">
              Cerrados
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#202C2A] text-[#C49A6C]">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#202C2A] font-display">
              {cerrados}
            </span>
            <span className="flex items-center text-[11px] font-semibold text-[#202C2A] bg-[#F3F0E9] px-2 py-0.5 rounded-full border border-[#E2DDD2]">
              Total final
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#252A30]/60">Trazabilidad archivada</p>
        </div>

      </div>

      {/* 3. Panel de Flujo de Tickets y Alertas de SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Flujo de Tickets + Distribución de Carga (8 columnas) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Card: Flujo de Tickets */}
          <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-[#202C2A] font-display">Flujo de tickets</h3>
                <p className="text-xs text-[#252A30]/60">Embudo operativo del ciclo de vida</p>
              </div>
              <span className="text-xs font-bold text-[#C49A6C] bg-[#F3F0E9] px-3 py-1 rounded-lg border border-[#E2DDD2]">
                {total} Tickets Registrados
              </span>
            </div>

            {/* Visual Stepper de Estados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
              {[
                { name: 'Abierto', count: abiertos, color: 'border-amber-300 bg-amber-50/50 text-amber-900', dot: 'bg-amber-500' },
                { name: 'En progreso', count: enProgreso, color: 'border-sky-300 bg-sky-50/50 text-sky-900', dot: 'bg-sky-500' },
                { name: 'Resuelto', count: resueltos, color: 'border-emerald-300 bg-emerald-50/50 text-emerald-900', dot: 'bg-emerald-500' },
                { name: 'Cerrado', count: cerrados, color: 'border-[#202C2A] bg-[#F3F0E9] text-[#202C2A]', dot: 'bg-[#202C2A]' }
              ].map((step, idx) => (
                <div key={idx} className={`rounded-xl border p-4 text-center ${step.color} shadow-xs`}>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={`h-2 w-2 rounded-full ${step.dot}`} />
                    <span className="text-xs font-bold">{step.name}</span>
                  </div>
                  <div className="text-2xl font-extrabold font-display mt-1">
                    {step.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Distribución de Carga por Agente (con Donut Chart) */}
          <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-[#202C2A] font-display">Distribución de carga</h3>
                <p className="text-xs text-[#252A30]/60">Agentes activos: {cargaAgentes.length}</p>
              </div>
              <Link to="/agentes" className="text-xs font-semibold text-[#C49A6C] hover:underline flex items-center gap-1">
                <span>Gestionar equipo</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Lista de Agentes con Barras */}
              <div className="md:col-span-8 space-y-4">
                {cargaAgentes.map((agent, idx) => {
                  const count = agent.tickets_en_curso || 0;
                  const pct = Math.round((count / totalTicketsEnCurso) * 100);

                  return (
                    <div key={agent.agente_id || idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#202C2A] text-white text-[10px] font-bold">
                            {agent.agente_nombre ? agent.agente_nombre.charAt(0) : 'A'}
                          </div>
                          <span className="font-semibold text-[#252A30]">{agent.agente_nombre}</span>
                          <span className="text-[10px] text-[#252A30]/50 font-normal">({agent.agente_area})</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-[#202C2A]">{count}</span>
                          <span className="text-[#252A30]/50">({pct}%)</span>
                        </div>
                      </div>

                      {/* Barra de progreso con color Nexora */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F0E9]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#202C2A] to-[#C49A6C] transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Donut Chart Visual SVG */}
              <div className="md:col-span-4 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-[#E2DDD2] pt-4 md:pt-0 pl-0 md:pl-4">
                <div className="relative flex items-center justify-center">
                  <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      className="text-[#F3F0E9]"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 1 */}
                    <path
                      className="text-[#202C2A]"
                      strokeDasharray="40, 100"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 2 */}
                    <path
                      className="text-[#C49A6C]"
                      strokeDasharray="30, 100"
                      strokeDashoffset="-40"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 3 */}
                    <path
                      className="text-[#A9B8A5]"
                      strokeDasharray="30, 100"
                      strokeDashoffset="-70"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-bold text-[#202C2A] font-display">{totalActivos}</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#252A30]/60">Activos</span>
                  </div>
                </div>
                <span className="text-[11px] text-[#252A30]/60 text-center mt-2 font-medium">
                  Carga Total Distribuida
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Columna Derecha: Alertas de SLA + Actividad Reciente (4 columnas) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Card: Alertas de SLA */}
          <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#202C2A] font-display">Alertas de SLA</h3>
              <Link to="/tickets" className="text-xs text-[#C49A6C] font-semibold hover:underline">
                Ver todos
              </Link>
            </div>

            <div className="space-y-3">
              {/* Alerta Próximos */}
              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">▲</span>
                  <div>
                    <p className="font-bold text-[#202C2A]">Tickets en riesgo</p>
                    <p className="text-[11px] text-[#252A30]/60">&le; 4h para vencer plazo</p>
                  </div>
                </div>
                <span className="font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {ticketsEnRiesgo.length} activos
                </span>
              </div>

              {/* Alerta Vencidos si existen */}
              {(counts.vencidos_activos > 0 || ticketsVencidos.length > 0) && (
                <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">!</span>
                    <div>
                      <p className="font-bold text-rose-900">Tickets vencidos</p>
                      <p className="text-[11px] text-rose-700">Plazo superado sin resolver</p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-900 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    {counts.vencidos_activos ?? ticketsVencidos.length} vencidos
                  </span>
                </div>
              )}

              {/* Cumplimiento SLA Promedio */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <p className="font-bold text-[#202C2A]">Cumplimiento global</p>
                    <p className="text-[11px] text-[#252A30]/60">Resolución a tiempo</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                  {cumplimiento.porcentaje_cumplimiento !== undefined ? `${cumplimiento.porcentaje_cumplimiento}%` : '100%'}
                </span>
              </div>

              {/* Políticas activas */}
              <div className="rounded-xl border border-[#E2DDD2] bg-[#F3F0E9]/60 p-3 text-[11px] text-[#252A30]/70">
                <p className="font-bold text-[#202C2A] mb-1">Ventanas de SLA oficiales:</p>
                <div className="flex justify-between border-b border-[#E2DDD2] py-0.5">
                  <span>Alta:</span> <strong className="text-rose-700 font-bold">4 horas</strong>
                </div>
                <div className="flex justify-between border-b border-[#E2DDD2] py-0.5">
                  <span>Media:</span> <strong className="text-[#C49A6C] font-bold">24 horas</strong>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Baja:</span> <strong className="text-[#202C2A] font-bold">72 horas</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Actividad Reciente */}
          <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#202C2A] font-display">Actividad reciente</h3>
              <Link to="/tickets" className="text-xs text-[#C49A6C] font-semibold hover:underline">
                Ver todos
              </Link>
            </div>

            <div className="space-y-3.5">
              {ticketsList.slice(0, 5).map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="flex items-start justify-between rounded-xl border border-[#E2DDD2]/80 p-3 hover:border-[#C49A6C] hover:bg-[#F3F0E9]/50 transition-all group"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#202C2A] group-hover:text-[#C49A6C]">
                        #{ticket.id}
                      </span>
                      <StatusBadge status={ticket.estado} />
                    </div>
                    <p className="text-xs font-semibold text-[#252A30] line-clamp-1 group-hover:text-[#202C2A]">
                      {ticket.titulo}
                    </p>
                    <p className="text-[10px] text-[#252A30]/50">
                      {ticket.cliente_nombre || 'Cliente'} · {ticket.area}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#252A30]/50 block">
                      {formatDate(ticket.fecha_creacion).split(' ')[0]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
