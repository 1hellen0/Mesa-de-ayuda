import React from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { MetricCard } from '../components/metrics/MetricCard';
import { AgentWorkloadChart } from '../components/metrics/AgentWorkloadChart';
import { StatusBadge, PriorityBadge } from '../components/tickets/TicketBadge';
import { SlaIndicator } from '../components/tickets/SlaIndicator';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { formatDate } from '../utils/formatters';

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
  } = useFetch(() => api.getTickets({ sortBy: 'fecha_creacion', order: 'desc' }), []);

  if (loadingSummary && loadingTickets) {
    return <LoadingSpinner message="Cargando métricas e indicadores de la mesa de ayuda..." />;
  }

  if (errorSummary) {
    return (
      <ErrorMessage
        title="Error al cargar el resumen del sistema"
        message={errorSummary}
        onRetry={() => {
          refetchSummary();
          refetchTickets();
        }}
      />
    );
  }

  const porEstado = summary?.tickets_por_estado || {};
  const cumplimiento = summary?.cumplimiento_sla || {};
  const tiempoPromedio = summary?.tiempo_promedio_resolucion || {};
  const cargaAgentes = summary?.carga_por_agente || [];

  const ticketsVencidosActivos = porEstado.vencidos_activos || 0;
  const ticketsList = Array.isArray(recentTickets) ? recentTickets.slice(0, 5) : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Panel de Control y SLA
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitoreo en tiempo real de tickets, tiempos de respuesta y carga operativa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tickets/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-sky-500/20 hover:from-sky-500 hover:to-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Ticket</span>
          </Link>
        </div>
      </div>

      {/* Alerta si hay tickets vencidos activos */}
      {ticketsVencidosActivos > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-rose-800">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900">
                Atención: Hay {ticketsVencidosActivos} {ticketsVencidosActivos === 1 ? 'ticket vencido' : 'tickets vencidos'} que requieren intervención inmediata.
              </p>
              <p className="text-xs text-rose-700">
                Tickets en curso cuya fecha límite ha expirado según el acuerdo de nivel de servicio (SLA).
              </p>
            </div>
          </div>
          <Link
            to="/tickets?estado=abierto"
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition shrink-0"
          >
            Ver pendientes
          </Link>
        </div>
      )}

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Tickets"
          value={porEstado.total || 0}
          subtitle="Registrados históricamente"
          icon={Ticket}
          variant="neutral"
        />
        <MetricCard
          title="Abiertos"
          value={porEstado.abiertos || 0}
          subtitle="Pendientes de asignación/atención"
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="En Progreso"
          value={porEstado.en_progreso || 0}
          subtitle="Con agente activo asignado"
          icon={TrendingUp}
          variant="primary"
        />
        <MetricCard
          title="Resueltos / Cerrados"
          value={(porEstado.resueltos || 0) + (porEstado.cerrados || 0)}
          subtitle={`${porEstado.resueltos || 0} resueltos, ${porEstado.cerrados || 0} cerrados`}
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Vencidos Activos"
          value={ticketsVencidosActivos}
          subtitle="Fuera del plazo de SLA"
          icon={AlertTriangle}
          variant={ticketsVencidosActivos > 0 ? 'danger' : 'neutral'}
        />
      </div>

      {/* SLA and Performance Analytics Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cumplimiento del SLA */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Indicador de Calidad
              </span>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Cumplimiento de SLA</h3>
            <p className="mt-1 text-xs text-slate-500">
              Porcentaje de tickets resueltos antes del vencimiento.
            </p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-emerald-600 tracking-tight">
                {cumplimiento.porcentaje_cumplimiento !== undefined ? `${cumplimiento.porcentaje_cumplimiento}%` : '—'}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                ({cumplimiento.resueltos_a_tiempo || 0} de {cumplimiento.total_evaluados || 0} resueltos)
              </span>
            </div>

            {/* SLA Progress Bar */}
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${Math.min(cumplimiento.porcentaje_cumplimiento || 0, 100)}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>A tiempo: <strong className="text-emerald-700">{cumplimiento.resueltos_a_tiempo || 0}</strong></span>
              <span>Fuera de plazo: <strong className="text-rose-700">{cumplimiento.resueltos_tarde || 0}</strong></span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 text-center font-mono">
            {cumplimiento.formula || '(resueltos_a_tiempo / total) * 100'}
          </div>
        </div>

        {/* Tiempo Promedio de Resolución */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Velocidad Operativa
              </span>
              <Clock className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tiempo de Resolución</h3>
            <p className="mt-1 text-xs text-slate-500">
              Diferencia promedio entre creación y resolución real.
            </p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-sky-600 tracking-tight">
                {tiempoPromedio.horas_promedio || 0}
              </span>
              <span className="text-base font-semibold text-slate-600">horas</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[11px] font-medium text-slate-500 block">Mínimo</span>
                <span className="text-base font-bold text-slate-800">
                  {tiempoPromedio.horas_minimo || 0} h
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[11px] font-medium text-slate-500 block">Máximo</span>
                <span className="text-base font-bold text-slate-800">
                  {tiempoPromedio.horas_maximo || 0} h
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 text-center font-mono">
            {tiempoPromedio.formula || 'AVG(fecha_resolucion - fecha_creacion)'}
          </div>
        </div>

        {/* Carga Activa por Agente */}
        <AgentWorkloadChart agents={cargaAgentes} />
      </div>

      {/* Recent Tickets Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tickets Recientes</h3>
            <p className="text-xs text-slate-500">Últimos casos registrados en el sistema</p>
          </div>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
          >
            <span>Ver todos los tickets</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {ticketsList.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No hay tickets registrados en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500">
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Título</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Agente Asignado</th>
                  <th className="py-3 px-4 font-semibold">Prioridad</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold">SLA</th>
                  <th className="py-3 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ticketsList.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-700">#{ticket.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {ticket.titulo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{ticket.cliente_nombre || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {ticket.agente_nombre ? (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          {ticket.agente_nombre}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={ticket.prioridad} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ticket.estado} />
                    </td>
                    <td className="py-3.5 px-4">
                      <SlaIndicator ticket={ticket} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
                      >
                        Detalle
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
