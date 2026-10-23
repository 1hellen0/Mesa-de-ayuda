import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Ticket,
  ChevronRight,
  RotateCcw,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { StatusBadge, PriorityBadge } from '../components/tickets/TicketBadge';
import { SlaIndicator } from '../components/tickets/SlaIndicator';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { EmptyState } from '../components/feedback/EmptyState';
import { formatDate } from '../utils/formatters';
import { TICKET_STATUS, TICKET_PRIORITY, TICKET_AREAS } from '../utils/constants';

export function TicketsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('estado') || '');
  const [selectedPriority, setSelectedPriority] = useState(searchParams.get('prioridad') || '');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Consulta al backend
  const fetchTickets = () => {
    return api.getTickets({
      q: searchQuery.trim() || undefined,
      estado: selectedStatus || undefined,
      prioridad: selectedPriority || undefined,
      area: selectedArea || undefined,
      sortBy: 'fecha_creacion',
      order: 'desc'
    });
  };

  const {
    data: tickets,
    loading,
    error,
    refetch
  } = useFetch(fetchTickets, [searchQuery, selectedStatus, selectedPriority, selectedArea]);

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
    setCurrentPage(1);

    if (key === 'estado') setSelectedStatus(value);
    if (key === 'prioridad') setSelectedPriority(value);
    if (key === 'area') setSelectedArea(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedArea('');
    setSearchParams({});
    setCurrentPage(1);
  };

  const ticketsList = Array.isArray(tickets) ? tickets : [];
  const totalTickets = ticketsList.length;

  // Paginación en cliente para renderizar exactamente como en el mockup
  const totalPages = Math.ceil(totalTickets / itemsPerPage) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return ticketsList.slice(start, start + itemsPerPage);
  }, [ticketsList, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. Header estilo Nexora */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DFD9CD] pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C49A6C]">
            Registro Centralizado
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202C2A]">
            Tickets
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#7A8C76]">
            Gestiona y da seguimiento a las solicitudes de soporte y acuerdos de servicio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tickets/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-[#202C2A] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm border border-[#C49A6C]/40 hover:bg-[#2B3B38] hover:border-[#C49A6C] transition-all"
          >
            <Plus className="h-4 w-4 text-[#C49A6C]" />
            <span>Crear Ticket</span>
          </Link>
        </div>
      </div>

      {/* 2. Barra de Filtros Refinada (Estilo Imagen Mockup) */}
      <div className="rounded-2xl border border-[#DFD9CD] bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Búsqueda */}
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A8C76]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, cliente o ID..."
              className="w-full rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] py-2 pl-10 pr-4 text-xs font-medium text-[#252A30] placeholder:text-[#7A8C76] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Filtro Estado */}
          <div className="sm:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              aria-label="Filtrar por estado"
              className="w-full rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] py-2 px-3 text-xs font-semibold text-[#252A30] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value={TICKET_STATUS.ABIERTO}>Abierto</option>
              <option value={TICKET_STATUS.EN_PROGRESO}>En Progreso</option>
              <option value={TICKET_STATUS.RESUELTO}>Resuelto</option>
              <option value={TICKET_STATUS.CERRADO}>Cerrado</option>
            </select>
          </div>

          {/* Filtro Prioridad */}
          <div className="sm:col-span-2">
            <select
              value={selectedPriority}
              onChange={(e) => handleFilterChange('prioridad', e.target.value)}
              aria-label="Filtrar por prioridad"
              className="w-full rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] py-2 px-3 text-xs font-semibold text-[#252A30] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="">Todas las prioridades</option>
              <option value={TICKET_PRIORITY.ALTA}>Alta (4h)</option>
              <option value={TICKET_PRIORITY.MEDIA}>Media (24h)</option>
              <option value={TICKET_PRIORITY.BAJA}>Baja (72h)</option>
            </select>
          </div>

          {/* Filtro Área */}
          <div className="sm:col-span-2">
            <select
              value={selectedArea}
              onChange={(e) => handleFilterChange('area', e.target.value)}
              aria-label="Filtrar por área"
              className="w-full rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] py-2 px-3 text-xs font-semibold text-[#252A30] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="">Todas las áreas</option>
              {TICKET_AREAS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          <div className="sm:col-span-1 flex justify-end">
            {(searchQuery || selectedStatus || selectedPriority || selectedArea) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center justify-center p-2 rounded-xl text-[#7A8C76] hover:bg-[#F3F0E9] hover:text-[#202C2A] transition-all"
                title="Limpiar filtros"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. Contenedor de la Tabla */}
      {loading ? (
        <LoadingSpinner message="Consultando tickets en la base de datos de NEXORA..." />
      ) : error ? (
        <ErrorMessage
          title="Error al cargar el listado de tickets"
          message={error}
          onRetry={refetch}
        />
      ) : totalTickets === 0 ? (
        <EmptyState
          title="No se encontraron tickets con los criterios especificados"
          message="Intenta modificar la búsqueda o los filtros aplicados para visualizar otros registros."
          actionText="Crear primer ticket"
          actionTo="/tickets/nuevo"
        />
      ) : (
        <div className="rounded-2xl border border-[#DFD9CD] bg-white shadow-sm overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Encabezado */}
              <thead>
                <tr className="border-b border-[#DFD9CD] bg-[#FAF8F4] text-[11px] font-bold uppercase tracking-wider text-[#7A8C76]">
                  <th scope="col" className="py-3.5 pl-6 pr-3">ID</th>
                  <th scope="col" className="py-3.5 px-3">Título</th>
                  <th scope="col" className="py-3.5 px-3">Cliente</th>
                  <th scope="col" className="py-3.5 px-3">Estado</th>
                  <th scope="col" className="py-3.5 px-3">Prioridad</th>
                  <th scope="col" className="py-3.5 px-3">Agente</th>
                  <th scope="col" className="py-3.5 px-3">SLA</th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right">Creado</th>
                </tr>
              </thead>

              {/* Filas */}
              <tbody className="divide-y divide-[#DFD9CD]/60">
                {paginatedTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-[#FAF8F4]/80 transition-colors group cursor-pointer"
                  >
                    {/* ID */}
                    <td className="py-4 pl-6 pr-3 font-mono font-bold text-[#202C2A] whitespace-nowrap">
                      <Link to={`/tickets/${t.id}`} className="hover:text-[#C49A6C] flex items-center gap-1">
                        <span>#{t.id}</span>
                      </Link>
                    </td>

                    {/* Título y Área */}
                    <td className="py-4 px-3 max-w-xs sm:max-w-md">
                      <Link to={`/tickets/${t.id}`} className="block">
                        <span className="font-bold text-[#202C2A] group-hover:text-[#C49A6C] transition-colors line-clamp-1">
                          {t.titulo}
                        </span>
                        <span className="text-[10px] text-[#7A8C76] font-medium">
                          {t.area}
                        </span>
                      </Link>
                    </td>

                    {/* Cliente */}
                    <td className="py-4 px-3 text-[#252A30] font-medium whitespace-nowrap">
                      {t.cliente_nombre || 'Cliente'}
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <StatusBadge status={t.estado} />
                    </td>

                    {/* Prioridad */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <PriorityBadge priority={t.prioridad} />
                    </td>

                    {/* Agente Asignado */}
                    <td className="py-4 px-3 text-[#252A30] whitespace-nowrap">
                      {t.agente_nombre ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#202C2A] text-white text-[9px] font-bold">
                            {t.agente_nombre[0]}
                          </div>
                          <span className="font-medium text-xs text-[#202C2A]">{t.agente_nombre}</span>
                        </div>
                      ) : (
                        <span className="text-[#7A8C76] italic">Sin asignar</span>
                      )}
                    </td>

                    {/* SLA Indicator */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <SlaIndicator ticket={t} />
                    </td>

                    {/* Fecha de Creación */}
                    <td className="py-4 pl-3 pr-6 text-right text-[11px] font-mono text-[#7A8C76] whitespace-nowrap">
                      {formatDate(t.fecha_creacion)}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between border-t border-[#DFD9CD] bg-[#FAF8F4] px-6 py-3.5 text-xs text-[#7A8C76]">
            <div>
              Mostrando <span className="font-bold text-[#202C2A]">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-bold text-[#202C2A]">{Math.min(currentPage * itemsPerPage, totalTickets)}</span> de{' '}
              <span className="font-bold text-[#202C2A]">{totalTickets}</span> tickets
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#DFD9CD] bg-white text-[#202C2A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F3F0E9] transition-all"
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-[#202C2A] text-white shadow-xs'
                      : 'border border-[#DFD9CD] bg-white text-[#202C2A] hover:bg-[#F3F0E9]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#DFD9CD] bg-white text-[#202C2A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F3F0E9] transition-all"
              >
                &gt;
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
