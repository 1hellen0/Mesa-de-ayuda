import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Ticket,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { StatusBadge, PriorityBadge } from '../components/tickets/TicketBadge';
import { SlaIndicator } from '../components/tickets/SlaIndicator';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { EmptyState } from '../components/feedback/EmptyState';
import { formatDate } from '../utils/formatters';
import { TICKET_STATUS, COMMON_AREAS } from '../utils/constants';

export function TicketsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('estado') || '');
  const [selectedPriority, setSelectedPriority] = useState(searchParams.get('prioridad') || '');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'fecha_creacion');
  const [order, setOrder] = useState(searchParams.get('order') || 'desc');

  // Consulta al backend
  const fetchTickets = () => {
    return api.getTickets({
      q: searchQuery.trim() || undefined,
      estado: selectedStatus || undefined,
      prioridad: selectedPriority || undefined,
      area: selectedArea || undefined,
      sortBy: sortBy || 'fecha_creacion',
      order: order || 'desc'
    });
  };

  const {
    data: tickets,
    loading,
    error,
    refetch
  } = useFetch(fetchTickets, [searchQuery, selectedStatus, selectedPriority, selectedArea, sortBy, order]);

  // Actualizar filtros
  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);

    if (key === 'estado') setSelectedStatus(value);
    if (key === 'prioridad') setSelectedPriority(value);
    if (key === 'area') setSelectedArea(value);
    if (key === 'sortBy') setSortBy(value);
    if (key === 'order') setOrder(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedArea('');
    setSortBy('fecha_creacion');
    setOrder('desc');
    setSearchParams({});
  };

  const statusTabs = [
    { label: 'Todos', value: '' },
    { label: 'Abiertos', value: TICKET_STATUS.ABIERTO },
    { label: 'En Progreso', value: TICKET_STATUS.EN_PROGRESO },
    { label: 'Resueltos', value: TICKET_STATUS.RESUELTO },
    { label: 'Cerrados', value: TICKET_STATUS.CERRADO }
  ];

  const totalTickets = Array.isArray(tickets) ? tickets.length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Gestión de Tickets
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Control de incidentes, cumplimiento de SLA y asignaciones.
          </p>
        </div>

        <Link
          to="/tickets/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-sky-500/20 hover:from-sky-500 hover:to-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Crear Ticket</span>
        </Link>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleFilterChange('estado', tab.value)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-sky-50 text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, descripción o cliente..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange('q', e.target.value);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={selectedPriority}
            onChange={(e) => handleFilterChange('prioridad', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta (4h)</option>
            <option value="media">Media (24h)</option>
            <option value="baja">Baja (72h)</option>
          </select>
        </div>

        {/* Area Filter */}
        <div>
          <select
            value={selectedArea}
            onChange={(e) => handleFilterChange('area', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">Todas las áreas</option>
            {COMMON_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="fecha_creacion">Fecha de Creación</option>
            <option value="fecha_limite">Fecha Límite (SLA)</option>
            <option value="prioridad">Prioridad</option>
            <option value="estado">Estado</option>
            <option value="id">ID</option>
          </select>

          <button
            type="button"
            onClick={() => handleFilterChange('order', order === 'asc' ? 'desc' : 'asc')}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title={`Orden: ${order === 'asc' ? 'Ascendente' : 'Descendente'}`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>

          {(searchQuery || selectedStatus || selectedPriority || selectedArea) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Total Count Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Mostrando <strong>{totalTickets}</strong> tickets encontrados</span>
      </div>

      {/* Main Table or Loading/Error */}
      {loading ? (
        <LoadingSpinner message="Consultando tickets desde la base de datos..." />
      ) : error ? (
        <ErrorMessage
          title="Error al consultar tickets"
          message={error}
          onRetry={refetch}
        />
      ) : totalTickets === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No se encontraron tickets"
          description="Intente modificar los criterios de búsqueda o cree un nuevo ticket en el sistema."
          action={
            <Link
              to="/tickets/nuevo"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition"
            >
              <Plus className="h-4 w-4" />
              Crear nuevo ticket
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Título e Incidencia</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Área</th>
                  <th className="py-3 px-4 font-semibold">Agente Asignado</th>
                  <th className="py-3 px-4 font-semibold">Prioridad</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold">SLA / Vencimiento</th>
                  <th className="py-3 px-4 font-semibold text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => {
                  const isOverdue = ticket.es_vencido === 1;

                  return (
                    <tr
                      key={ticket.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-700">#{ticket.id}</td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-bold text-slate-900 hover:text-sky-600 transition block truncate"
                        >
                          {ticket.titulo}
                        </Link>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {ticket.descripcion}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 block">
                          {ticket.cliente_nombre || '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {ticket.cliente_empresa || ticket.cliente_email || ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {ticket.area}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {ticket.agente_nombre ? (
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {ticket.agente_nombre}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {ticket.agente_email}
                            </span>
                          </div>
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
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Límite: {formatDate(ticket.fecha_limite)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-sky-600 transition"
                        >
                          <span>Ver</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
