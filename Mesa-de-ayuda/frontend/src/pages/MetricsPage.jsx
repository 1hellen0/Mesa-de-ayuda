import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  ChevronDown,
  RefreshCw,
  Ticket
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { formatRelativeTime, formatDate, TIMEZONE_CR } from '../utils/formatters';

export function MetricsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, ticketsRes] = await Promise.all([
        api.getSummary(),
        api.getTickets({ limit: 50 })
      ]);
      setSummary(summaryRes);
      setTickets(ticketsRes?.tickets || ticketsRes || []);
    } catch (err) {
      console.error('Error fetching metrics data:', err);
      setError(err.message || 'Error al cargar las métricas operativas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Consolidando métricas operativas de NEXORA..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Error al cargar métricas"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  const {
    resumen_tickets: counts = {},
    cumplimiento_sla: sla = {},
    tiempo_promedio_resolucion: avgTime = {}
  } = summary || {};

  const totalTickets = counts.total || tickets.length || 0;
  const abiertos = counts.abiertos || 0;
  const enProgreso = counts.en_progreso || 0;
  const resueltos = counts.resueltos || 0;
  const cerrados = counts.cerrados || 0;

  // Catálogo oficial estricto: Alta (4h), Media (24h), Baja (72h)
  const priorityCounts = tickets.reduce(
    (acc, t) => {
      const p = (t.prioridad || '').toLowerCase();
      if (p === 'alta') acc.alta++;
      else if (p === 'baja') acc.baja++;
      else acc.media++;
      return acc;
    },
    { alta: 0, media: 0, baja: 0 }
  );

  // Formato legible de horas promedio de resolución
  const horasPromedio = avgTime.horas_promedio || 1.4;
  const horas = Math.floor(horasPromedio);
  const minutos = Math.round((horasPromedio - horas) * 60);
  const formattedAvgTime = `${horas}h ${minutos < 10 ? '0' : ''}${minutos}m`;

  // Historial reciente ordenado por ID descendente
  const recentTickets = [...tickets]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  // SVG Donut calculation
  const safeTotal = totalTickets > 0 ? totalTickets : 1;
  const pctAbierto = (abiertos / safeTotal) * 100;
  const pctProgreso = (enProgreso / safeTotal) * 100;
  const pctResuelto = (resueltos / safeTotal) * 100;
  const pctCerrado = (cerrados / safeTotal) * 100;

  // SVG circumference: r = 40 => 2 * pi * 40 ≈ 251.32
  const c = 251.32;
  const strokeAbierto = (pctAbierto / 100) * c;
  const strokeProgreso = (pctProgreso / 100) * c;
  const strokeResuelto = (pctResuelto / 100) * c;
  const strokeCerrado = (pctCerrado / 100) * c;

  const offsetAbierto = 0;
  const offsetProgreso = -strokeAbierto;
  const offsetResuelto = -(strokeAbierto + strokeProgreso);
  const offsetCerrado = -(strokeAbierto + strokeProgreso + strokeResuelto);

  // Altura relativa para las 3 barras de prioridad oficiales
  const maxPriorityCount = Math.max(
    priorityCounts.alta || 1,
    priorityCounts.media || 1,
    priorityCounts.baja || 1,
    10
  );

  return (
    <div className="space-y-6">
      {/* Header editorial con selector de periodo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2DDD2] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C49A6C]">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Inteligencia Operacional</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#252A30] sm:text-3xl font-display">
            Métricas de Operación
          </h1>
          <p className="mt-1 text-xs text-[#252A30]/65 sm:text-sm">
            Rendimiento, tiempos de respuesta y cumplimiento del SLA evaluados según la fecha límite individual de cada ticket en Costa Rica ({TIMEZONE_CR}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Actualizar datos"
            className="flex items-center gap-2 rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-3.5 py-2 text-xs font-medium text-[#252A30] shadow-xs hover:border-[#C49A6C] transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#202C2A]" />
            <span>Sincronizar</span>
          </button>

          <div className="relative inline-flex items-center">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] pl-3.5 pr-8 py-2 text-xs font-medium text-[#252A30] shadow-xs hover:border-[#C49A6C] focus:outline-none focus:ring-1 focus:ring-[#C49A6C] cursor-pointer"
            >
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="all">Todo el registro histórico</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[#252A30]/60" />
          </div>
        </div>
      </div>

      {/* Grid Principal - 4 cuadrantes editoriales NEXORA */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Cuadrante 1: Tickets por estado (Donut Chart) */}
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E2DDD2]/60 pb-4 mb-5">
            <div>
              <h2 className="text-sm font-bold text-[#252A30] uppercase tracking-wider">
                Tickets por estado
              </h2>
              <p className="text-[11px] text-[#252A30]/60">Distribución global del flujo operativo</p>
            </div>
            <span className="rounded-full bg-[#F3F0E9] px-2.5 py-1 text-[11px] font-semibold text-[#202C2A]">
              Total: {totalTickets}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative flex items-center justify-center">
              <svg width="170" height="170" viewBox="0 0 100 100" className="-rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#F3F0E9"
                  strokeWidth="11"
                />
                {/* Abiertos */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#E49E4A"
                  strokeWidth="11"
                  strokeDasharray={`${strokeAbierto} ${c}`}
                  strokeDashoffset={offsetAbierto}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
                {/* En Progreso */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth="11"
                  strokeDasharray={`${strokeProgreso} ${c}`}
                  strokeDashoffset={offsetProgreso}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
                {/* Resueltos */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#7C9A86"
                  strokeWidth="11"
                  strokeDasharray={`${strokeResuelto} ${c}`}
                  strokeDashoffset={offsetResuelto}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
                {/* Cerrados */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#202C2A"
                  strokeWidth="11"
                  strokeDasharray={`${strokeCerrado} ${c}`}
                  strokeDashoffset={offsetCerrado}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-3xl font-extrabold tracking-tight text-[#252A30] font-display">
                  {totalTickets}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#252A30]/50">
                  Casos
                </span>
              </div>
            </div>

            {/* Leyenda y conteos detallados */}
            <div className="space-y-3 w-full sm:w-auto min-w-[170px]">
              <div className="flex items-center justify-between gap-4 border-b border-[#F3F0E9] pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E49E4A]" />
                  <span className="text-xs font-medium text-[#252A30]">Abiertos</span>
                </div>
                <span className="text-xs font-bold text-[#252A30]">{abiertos}</span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-[#F3F0E9] pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" />
                  <span className="text-xs font-medium text-[#252A30]">En progreso</span>
                </div>
                <span className="text-xs font-bold text-[#252A30]">{enProgreso}</span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-[#F3F0E9] pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#7C9A86]" />
                  <span className="text-xs font-medium text-[#252A30]">Resueltos</span>
                </div>
                <span className="text-xs font-bold text-[#252A30]">{resueltos}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#202C2A]" />
                  <span className="text-xs font-medium text-[#252A30]">Cerrados</span>
                </div>
                <span className="text-xs font-bold text-[#252A30]">{cerrados}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cuadrante 2: Tiempo de resolución */}
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2DDD2]/60 pb-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#252A30] uppercase tracking-wider">
                  Tiempo de resolución
                </h2>
                <p className="text-[11px] text-[#252A30]/60">Promedio global vs. ventanas de SLA por prioridad</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-[#202C2A] font-display">
                  {formattedAvgTime}
                </span>
                <span className="block text-[10px] text-[#C49A6C] font-semibold">
                  Promedio de resolución
                </span>
              </div>
            </div>

            {/* Smooth SVG Spline Chart */}
            <div className="relative pt-2">
              <svg viewBox="0 0 400 130" className="w-full h-32 overflow-visible">
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C9A86" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#7C9A86" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C49A6C" />
                    <stop offset="100%" stopColor="#202C2A" />
                  </linearGradient>
                </defs>

                {/* Area fill */}
                <path
                  d="M 10 90 Q 60 70, 110 85 T 210 55 T 310 75 T 390 60 L 390 120 L 10 120 Z"
                  fill="url(#curveGradient)"
                />

                {/* Smooth curve line */}
                <path
                  d="M 10 90 Q 60 70, 110 85 T 210 55 T 310 75 T 390 60"
                  fill="transparent"
                  stroke="url(#strokeGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data point dots */}
                <circle cx="10" cy="90" r="3.5" fill="#202C2A" />
                <circle cx="110" cy="85" r="3.5" fill="#202C2A" />
                <circle cx="210" cy="55" r="4" fill="#C49A6C" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="310" cy="75" r="3.5" fill="#202C2A" />
                <circle cx="390" cy="60" r="4.5" fill="#202C2A" stroke="#C49A6C" strokeWidth="2" />
              </svg>

              {/* Días en eje X */}
              <div className="flex justify-between text-[10px] font-semibold text-[#252A30]/50 pt-2 border-t border-[#F3F0E9]">
                <span>16/10</span>
                <span>17/10</span>
                <span>18/10</span>
                <span>19/10</span>
                <span>20/10</span>
                <span>21/10</span>
                <span>22/10</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F3F0E9] space-y-1.5 text-xs text-[#252A30]/70">
            <div className="flex items-center justify-between">
              <span>Umbrales oficiales:</span>
              <span className="font-semibold text-[#202C2A]">
                Alta: 4h &middot; Media: 24h &middot; Baja: 72h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cumplimiento SLA general:</span>
              <span className="font-bold text-[#202C2A]">
                {sla.porcentaje_cumplimiento || 100}% ({sla.resueltos_a_tiempo || 0} de {sla.total_evaluados || 0} evaluados a tiempo)
              </span>
            </div>
          </div>
        </div>

        {/* Cuadrante 3: Tickets por prioridad (Catálogo Oficial Estricto de 3 prioridades) */}
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E2DDD2]/60 pb-4 mb-5">
            <div>
              <h2 className="text-sm font-bold text-[#252A30] uppercase tracking-wider">
                Tickets por prioridad
              </h2>
              <p className="text-[11px] text-[#252A30]/60">Catálogo oficial: Alta (4h), Media (24h) y Baja (72h)</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 items-end h-44 pt-4 px-4">
            {/* Alta (4 horas) */}
            <div className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-sm font-bold text-[#252A30]">
                {priorityCounts.alta}
              </span>
              <div
                style={{
                  height: `${Math.max(18, (priorityCounts.alta / maxPriorityCount) * 100)}%`
                }}
                className="w-full max-w-[64px] rounded-t-lg bg-[#C49A6C] border-t-2 border-[#A87E50] transition-all duration-500"
              />
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#252A30] block">
                  Alta
                </span>
                <span className="text-[10px] text-rose-700 font-semibold block">
                  SLA 4h
                </span>
              </div>
            </div>

            {/* Media (24 horas) */}
            <div className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-sm font-bold text-[#252A30]">
                {priorityCounts.media}
              </span>
              <div
                style={{
                  height: `${Math.max(18, (priorityCounts.media / maxPriorityCount) * 100)}%`
                }}
                className="w-full max-w-[64px] rounded-t-lg bg-[#A9B8A5] border-t-2 border-[#7C9A86] transition-all duration-500"
              />
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#252A30] block">
                  Media
                </span>
                <span className="text-[10px] text-[#C49A6C] font-semibold block">
                  SLA 24h
                </span>
              </div>
            </div>

            {/* Baja (72 horas) */}
            <div className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-sm font-bold text-[#252A30]">
                {priorityCounts.baja}
              </span>
              <div
                style={{
                  height: `${Math.max(18, (priorityCounts.baja / maxPriorityCount) * 100)}%`
                }}
                className="w-full max-w-[64px] rounded-t-lg bg-[#E2DDD2] border-t-2 border-[#C9C3B6] transition-all duration-500"
              />
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#252A30] block">
                  Baja
                </span>
                <span className="text-[10px] text-[#7C9A86] font-semibold block">
                  SLA 72h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cuadrante 4: Historial reciente / Actividad */}
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E2DDD2]/60 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#252A30] uppercase tracking-wider">
                Historial reciente
              </h2>
              <p className="text-[11px] text-[#252A30]/60">Eventos y transiciones registradas en el sistema</p>
            </div>
            <Link
              to="/tickets"
              className="text-xs font-semibold text-[#202C2A] hover:text-[#C49A6C] transition flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#F3F0E9]">
            {recentTickets.map((t) => {
              const isClosed = t.estado === 'cerrado';
              const isResolved = t.estado === 'resuelto';
              const isInProgress = t.estado === 'en progreso';

              return (
                <Link
                  key={t.id}
                  to={`/tickets/${t.id}`}
                  className="group flex items-center justify-between py-3 hover:bg-[#F3F0E9]/50 px-2 rounded-lg transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isClosed
                          ? 'bg-[#202C2A] text-[#A9B8A5]'
                          : isResolved
                          ? 'bg-[#7C9A86]/20 text-[#202C2A]'
                          : isInProgress
                          ? 'bg-[#3B82F6]/15 text-[#2563EB]'
                          : 'bg-[#C49A6C]/20 text-[#A87E50]'
                      }`}
                    >
                      <Ticket className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#252A30] group-hover:text-[#202C2A] truncate">
                        Ticket #{t.id} <span className="font-normal text-[#252A30]/60">— {t.estado}</span>
                      </p>
                      <p className="text-[11px] text-[#252A30]/50 truncate">
                        {t.cliente_nombre || 'Cliente'} &middot; {t.titulo}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-[10px] font-medium text-[#252A30]/50 pl-2">
                    {formatRelativeTime(t.fecha_creacion)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
