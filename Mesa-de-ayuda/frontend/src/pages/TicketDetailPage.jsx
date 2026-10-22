import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Building2,
  Calendar,
  MessageSquare,
  History,
  Send,
  Edit,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { StatusBadge, PriorityBadge } from '../components/tickets/TicketBadge';
import { SlaIndicator } from '../components/tickets/SlaIndicator';
import { StatusChangeModal } from '../components/forms/StatusChangeModal';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { formatDate } from '../utils/formatters';
import { HISTORY_EVENT_TYPES, TICKET_STATUS } from '../utils/constants';

export function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: ticket,
    loading,
    error,
    refetch
  } = useFetch(() => api.getTicketById(id), [id]);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [statusActionError, setStatusActionError] = useState(null);

  // Formulario de nuevo comentario
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [autorTipo, setAutorTipo] = useState('agente');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  if (loading) {
    return <LoadingSpinner message="Cargando detalles completos del ticket e historial..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Ticket no encontrado o error del servidor"
        message={error}
        onRetry={refetch}
      />
    );
  }

  if (!ticket) return null;

  // Manejar transición de estado
  const handleStatusSubmit = async (payload) => {
    setSubmittingStatus(true);
    setStatusActionError(null);
    try {
      await api.changeTicketStatus(ticket.id, payload);
      setStatusModalOpen(false);
      refetch(); // Refrescar ticket, historial y comentarios
    } catch (err) {
      setStatusActionError(err.message || 'No fue posible cambiar el estado');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Manejar creación de comentario
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setSubmittingComment(true);
    setCommentError(null);

    const autorId = autorTipo === 'agente' ? (ticket.agente_id || 1) : ticket.cliente_id;

    try {
      await api.addTicketComment(ticket.id, {
        autor_tipo: autorTipo,
        autor_id: autorId,
        contenido: nuevoComentario.trim()
      });
      setNuevoComentario('');
      refetch(); // Actualizar comentarios e historial
    } catch (err) {
      setCommentError(err.message || 'No fue posible publicar el comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const comentarios = Array.isArray(ticket.comentarios) ? ticket.comentarios : [];
  const historial = Array.isArray(ticket.historial) ? ticket.historial : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top back link and quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a la lista de tickets</span>
        </Link>

        <div className="flex items-center gap-3">
          {ticket.estado !== TICKET_STATUS.CERRADO && (
            <button
              type="button"
              onClick={() => {
                setStatusActionError(null);
                setStatusModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-sky-500 hover:to-indigo-500 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Cambiar Estado</span>
            </button>
          )}

          <Link
            to={`/tickets/${ticket.id}/editar`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </Link>
        </div>
      </div>

      {statusActionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <strong>Error en la transición:</strong> {statusActionError}
        </div>
      )}

      {/* Main Ticket Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-sky-600">Ticket #{ticket.id}</span>
              <PriorityBadge priority={ticket.prioridad} />
              <StatusBadge status={ticket.estado} />
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {ticket.area}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {ticket.titulo}
            </h1>
          </div>

          <div className="shrink-0">
            <SlaIndicator ticket={ticket} />
          </div>
        </div>

        {/* Descripción del incidente */}
        <div className="mt-6 rounded-xl bg-slate-50/70 p-4 border border-slate-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Descripción de la Solicitud
          </h2>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {ticket.descripcion}
          </p>
        </div>

        {/* Metadatos y contexto en columnas */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 pt-6 border-t border-slate-100 text-xs">
          {/* Cliente */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 font-semibold text-slate-500 mb-2">
              <Building2 className="h-4 w-4 text-sky-600" />
              <span>Cliente Solicitante</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{ticket.cliente_nombre || '—'}</p>
            <p className="text-slate-500 mt-0.5">{ticket.cliente_email || 'Sin email'}</p>
            {ticket.cliente_empresa && (
              <span className="mt-2 inline-block rounded bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                {ticket.cliente_empresa}
              </span>
            )}
          </div>

          {/* Agente */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 font-semibold text-slate-500 mb-2">
              <User className="h-4 w-4 text-indigo-600" />
              <span>Agente Asignado</span>
            </div>
            {ticket.agente_nombre ? (
              <>
                <p className="text-sm font-bold text-slate-800">{ticket.agente_nombre}</p>
                <p className="text-slate-500 mt-0.5">{ticket.agente_email}</p>
                <span className="mt-2 inline-block rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                  {ticket.area}
                </span>
              </>
            ) : (
              <p className="text-amber-600 italic">Sin agente asignado</p>
            )}
          </div>

          {/* Tiempos y SLA */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 font-semibold text-slate-500 mb-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>Fechas del Ciclo de Vida</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Creación:</span>
                <span className="font-semibold text-slate-800">{formatDate(ticket.fecha_creacion)}</span>
              </div>
              <div className="flex justify-between">
                <span>Límite SLA:</span>
                <span className="font-semibold text-slate-800">{formatDate(ticket.fecha_limite)}</span>
              </div>
              <div className="flex justify-between">
                <span>Resolución:</span>
                <span className="font-semibold text-slate-800">
                  {ticket.fecha_resolucion ? formatDate(ticket.fecha_resolucion) : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Two Columns: Comentarios and Historial */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Comentarios y Respuestas */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <MessageSquare className="h-5 w-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-800">
              Comentarios y Conversación ({comentarios.length})
            </h3>
          </div>

          {/* Comentarios Thread */}
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[460px] pr-2">
            {comentarios.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Aún no hay comentarios en este ticket.
              </div>
            ) : (
              comentarios.map((c) => {
                const isResolution = c.es_resolucion === 1;
                const isAgent = c.autor_tipo === 'agente';

                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl p-4 text-xs transition ${
                      isResolution
                        ? 'border-2 border-emerald-300 bg-emerald-50/70 shadow-xs'
                        : isAgent
                        ? 'border border-sky-100 bg-sky-50/40'
                        : 'border border-slate-100 bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {c.autor_nombre || (isAgent ? 'Agente de Soporte' : 'Cliente')}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            isAgent ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {c.autor_tipo}
                        </span>
                        {isResolution && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                            <CheckCircle2 className="h-3 w-3" />
                            Comentario de Resolución
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mt-1">
                      {c.contenido}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulario para agregar comentario */}
          {ticket.estado !== TICKET_STATUS.CERRADO && (
            <form onSubmit={handleCommentSubmit} className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Publicar como:</span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="autorTipo"
                      value="agente"
                      checked={autorTipo === 'agente'}
                      onChange={() => setAutorTipo('agente')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>Agente ({ticket.agente_nombre || 'Soporte'})</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="autorTipo"
                      value="cliente"
                      checked={autorTipo === 'cliente'}
                      onChange={() => setAutorTipo('cliente')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>Cliente ({ticket.cliente_nombre || 'Cliente'})</span>
                  </label>
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Escribe un mensaje o actualización técnica..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />

              {commentError && (
                <p className="text-xs text-rose-600 font-semibold">{commentError}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !nuevoComentario.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submittingComment ? 'Enviando...' : 'Publicar Comentario'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Historial Auditable de Cambios */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <History className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-800">
              Historial de Auditoría ({historial.length})
            </h3>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[580px] pr-2">
            {historial.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No hay eventos registrados en el historial.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {historial.map((h) => {
                  let badgeBg = 'bg-slate-100 text-slate-700';
                  let DotIcon = History;

                  if (h.tipo_evento === HISTORY_EVENT_TYPES.CREACION) {
                    badgeBg = 'bg-sky-100 text-sky-800';
                    DotIcon = FileCheck2;
                  } else if (h.tipo_evento === HISTORY_EVENT_TYPES.CAMBIO_ESTADO) {
                    badgeBg = 'bg-amber-100 text-amber-800';
                    DotIcon = CheckCircle2;
                  } else if (h.tipo_evento === HISTORY_EVENT_TYPES.CAMBIO_AGENTE) {
                    badgeBg = 'bg-indigo-100 text-indigo-800';
                    DotIcon = User;
                  } else if (h.tipo_evento === HISTORY_EVENT_TYPES.COMENTARIO_RESOLUCION) {
                    badgeBg = 'bg-emerald-100 text-emerald-800';
                    DotIcon = ShieldCheck;
                  }

                  return (
                    <div key={h.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-indigo-500 text-indigo-600 shadow-2xs">
                        <DotIcon className="h-3 w-3" />
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}>
                            {h.tipo_evento.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(h.created_at)}
                          </span>
                        </div>

                        <p className="font-semibold text-slate-800 mt-1">
                          {h.detalles || 'Evento del sistema'}
                        </p>

                        {(h.valor_anterior || h.valor_nuevo) && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 bg-white/80 rounded p-1.5 border border-slate-100">
                            <span className="line-through text-slate-400">
                              {h.valor_anterior || 'Ninguno'}
                            </span>
                            <span>&rarr;</span>
                            <span className="font-bold text-slate-800">
                              {h.valor_nuevo}
                            </span>
                          </div>
                        )}

                        {h.autor_nombre && (
                          <span className="text-[10px] text-slate-400 block mt-1.5">
                            Por: {h.autor_nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cambio de Estado */}
      <StatusChangeModal
        isOpen={statusModalOpen}
        ticket={ticket}
        onClose={() => setStatusModalOpen(false)}
        onSubmit={handleStatusSubmit}
        isLoading={submittingStatus}
      />
    </div>
  );
}
