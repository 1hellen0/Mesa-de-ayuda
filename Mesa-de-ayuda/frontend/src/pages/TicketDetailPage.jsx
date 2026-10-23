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
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { aiService } from '../services/aiService';
import { useFetch } from '../hooks/useFetch';
import { StatusBadge, PriorityBadge } from '../components/tickets/TicketBadge';
import { SlaIndicator } from '../components/tickets/SlaIndicator';
import { StatusChangeModal } from '../components/forms/StatusChangeModal';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { AiRecommendationPanel } from '../components/ai/AiRecommendationPanel';
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

  // Estado para el análisis con IA (n8n + DeepSeek)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  if (loading) {
    return <LoadingSpinner message="Consultando trazabilidad e historial en NEXORA..." />;
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

  // Manejador para solicitar análisis con IA del ticket existente
  const handleAnalyzeTicketWithAi = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await aiService.analyzeTicket({
        titulo: ticket.titulo,
        descripcion: ticket.descripcion,
        clienteNombre: ticket.cliente_nombre || 'Cliente',
        empresa: ticket.cliente_empresa || null,
        area: ticket.area,
        prioridad: ticket.prioridad
      });

      if (response?.ok && response?.data) {
        setAiRecommendation(response.data);
        setAiError(null);
      } else {
        setAiError('El servicio de IA no devolvió un resultado válido.');
      }
    } catch (err) {
      setAiError(err.message || 'No fue posible completar el análisis con el servicio de IA.');
    } finally {
      setAiLoading(false);
    }
  };

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

  // Stepper lifecycle status calculation
  const isAbierto = true;
  const isEnProgreso = ticket.estado === 'en progreso' || ticket.estado === 'resuelto' || ticket.estado === 'cerrado';
  const isResuelto = ticket.estado === 'resuelto' || ticket.estado === 'cerrado';
  const isCerrado = ticket.estado === 'cerrado';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. Breadcrumbs & Acciones Principales */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DFD9CD] pb-4">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A8C76] hover:text-[#202C2A] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a la lista de tickets</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botón de Análisis con DeepSeek */}
          <button
            type="button"
            id="btn-analizar-ticket-ia"
            onClick={handleAnalyzeTicketWithAi}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#202C2A] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm border border-[#C49A6C]/40 hover:bg-[#2B3B38] hover:border-[#C49A6C] transition disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-[#C49A6C]" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-[#C49A6C]" />
                <span>Analizar con IA</span>
              </>
            )}
          </button>

          {ticket.estado !== TICKET_STATUS.CERRADO && (
            <button
              type="button"
              onClick={() => {
                setStatusActionError(null);
                setStatusModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C49A6C] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#202C2A] shadow-sm hover:bg-[#DFC19E] transition"
            >
              <CheckCircle2 className="h-4 w-4 text-[#202C2A]" />
              <span>Cambiar Estado</span>
            </button>
          )}

          <Link
            to={`/tickets/${ticket.id}/editar`}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DFD9CD] bg-white px-3.5 py-2 text-xs font-bold text-[#202C2A] shadow-2xs hover:bg-[#FAF8F4] transition"
          >
            <Edit className="h-4 w-4 text-[#7A8C76]" />
            <span>Editar</span>
          </Link>
        </div>
      </div>

      {statusActionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <strong>Error en la transición:</strong> {statusActionError}
        </div>
      )}

      {/* 2. Tarjeta Insignia Principal de Información del Ticket */}
      <div className="rounded-2xl border border-[#DFD9CD] bg-white p-6 sm:p-7 shadow-sm">
        
        {/* Cabecera del ticket */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-[#DFD9CD] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-extrabold text-[#C49A6C] bg-[#202C2A] px-2.5 py-0.5 rounded-lg border border-[#C49A6C]/30">
                Ticket #{ticket.id}
              </span>
              <PriorityBadge priority={ticket.prioridad} />
              <StatusBadge status={ticket.estado} />
              <span className="rounded-md bg-[#FAF8F4] border border-[#DFD9CD] px-2.5 py-0.5 text-xs font-bold text-[#202C2A]">
                {ticket.area}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#202C2A]">
              {ticket.titulo}
            </h1>
          </div>

          <div className="shrink-0">
            <SlaIndicator ticket={ticket} />
          </div>
        </div>

        {/* Stepper Visual de la Línea de Tiempo del Ciclo de Vida */}
        <div className="py-6 border-b border-[#DFD9CD]">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A8C76] mb-3">
            Línea de Tiempo del Ciclo de Vida
          </div>

          <div className="relative flex items-center justify-between">
            <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-[#DFD9CD] z-0" />

            {[
              { label: 'Creado', time: formatDate(ticket.fecha_creacion), active: isAbierto },
              { label: 'En progreso', time: isEnProgreso ? 'Asignado' : 'Pendiente', active: isEnProgreso },
              { label: 'Resuelto', time: ticket.fecha_resolucion ? formatDate(ticket.fecha_resolucion) : 'Pendiente', active: isResuelto },
              { label: 'Cerrado', time: isCerrado ? 'Archivado' : 'Pendiente', active: isCerrado }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                  step.active
                    ? 'bg-[#202C2A] border-[#C49A6C] text-[#C49A6C]'
                    : 'bg-[#F3F0E9] border-[#DFD9CD] text-[#7A8C76]'
                }`}>
                  <CheckCircle2 className={`h-4 w-4 ${step.active ? 'text-[#C49A6C]' : 'text-transparent'}`} />
                </div>
                <span className={`mt-1 text-[10px] font-bold ${step.active ? 'text-[#202C2A]' : 'text-[#7A8C76]'}`}>
                  {step.label}
                </span>
                <span className="text-[9px] font-mono text-[#7A8C76] text-center max-w-[80px] truncate">
                  {step.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Descripción de la solicitud */}
        <div className="mt-6 rounded-xl bg-[#FAF8F4] p-5 border border-[#DFD9CD]">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A8C76] mb-2">
            Descripción de la Solicitud
          </h2>
          <p className="text-xs sm:text-sm text-[#252A30] leading-relaxed whitespace-pre-wrap font-medium">
            {ticket.descripcion}
          </p>
        </div>

        {/* Metadatos en 3 columnas */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 pt-6 border-t border-[#DFD9CD] text-xs">
          
          {/* Cliente */}
          <div className="rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] p-4">
            <div className="flex items-center gap-2 font-bold text-[#7A8C76] mb-2 uppercase tracking-wider text-[10px]">
              <Building2 className="h-3.5 w-3.5 text-[#C49A6C]" />
              <span>Cliente Solicitante</span>
            </div>
            <p className="text-sm font-bold text-[#202C2A]">{ticket.cliente_nombre || '—'}</p>
            <p className="text-[#7A8C76] mt-0.5 text-xs">{ticket.cliente_email || 'Sin email'}</p>
            {ticket.cliente_empresa && (
              <span className="mt-2 inline-block rounded-md bg-[#202C2A] px-2 py-0.5 text-[10px] font-bold text-[#C49A6C]">
                {ticket.cliente_empresa}
              </span>
            )}
          </div>

          {/* Agente */}
          <div className="rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] p-4">
            <div className="flex items-center gap-2 font-bold text-[#7A8C76] mb-2 uppercase tracking-wider text-[10px]">
              <User className="h-3.5 w-3.5 text-[#C49A6C]" />
              <span>Agente Asignado</span>
            </div>
            {ticket.agente_nombre ? (
              <>
                <p className="text-sm font-bold text-[#202C2A]">{ticket.agente_nombre}</p>
                <p className="text-[#7A8C76] mt-0.5 text-xs">{ticket.agente_email}</p>
                <span className="mt-2 inline-block rounded-md bg-[#E6EBE4] px-2 py-0.5 text-[10px] font-bold text-[#202C2A]">
                  {ticket.area}
                </span>
              </>
            ) : (
              <p className="text-amber-700 italic">Sin agente asignado</p>
            )}
          </div>

          {/* Tiempos y SLA */}
          <div className="rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] p-4">
            <div className="flex items-center gap-2 font-bold text-[#7A8C76] mb-2 uppercase tracking-wider text-[10px]">
              <Calendar className="h-3.5 w-3.5 text-[#C49A6C]" />
              <span>Fechas del Ciclo de Vida</span>
            </div>
            <div className="space-y-1 text-xs text-[#252A30]">
              <div className="flex justify-between">
                <span className="text-[#7A8C76]">Creación:</span>
                <span className="font-semibold font-mono">{formatDate(ticket.fecha_creacion)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8C76]">Límite SLA:</span>
                <span className="font-semibold font-mono text-[#C49A6C]">{formatDate(ticket.fecha_limite)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8C76]">Resolución:</span>
                <span className="font-semibold font-mono">
                  {ticket.fecha_resolucion ? formatDate(ticket.fecha_resolucion) : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Panel de Recomendaciones de IA en Detalle de Ticket */}
      {(aiLoading || aiError || aiRecommendation) && (
        <AiRecommendationPanel
          recommendation={aiRecommendation}
          isLoading={aiLoading}
          error={aiError}
          onRetry={handleAnalyzeTicketWithAi}
          onUseDraft={(draftText) => {
            setNuevoComentario(draftText);
            const commentInput = document.getElementById('ticket-nuevo-comentario');
            if (commentInput) {
              commentInput.focus();
              commentInput.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          currentPriority={ticket.prioridad}
          currentArea={ticket.area}
          mode="detail"
        />
      )}

      {/* 4. Columnas: Conversación / Comentarios e Historial de Auditoría */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Comentarios y Conversación */}
        <div className="rounded-2xl border border-[#DFD9CD] bg-white p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DFD9CD]">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-[#C49A6C]" />
              <h3 className="text-base font-bold text-[#202C2A]">
                Comentarios ({comentarios.length})
              </h3>
            </div>
            <span className="text-[10px] text-[#7A8C76] font-mono">Registro de comunicación</span>
          </div>

          {/* Thread de comentarios */}
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[460px] pr-2">
            {comentarios.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7A8C76] italic">
                Aún no hay comentarios registrados en este ticket.
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
                        ? 'border-2 border-[#A9B8A5] bg-[#E6EBE4]/60 shadow-xs'
                        : isAgent
                        ? 'border border-[#DFD9CD] bg-[#FAF8F4]'
                        : 'border border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#202C2A]">
                          {c.autor_nombre || (isAgent ? 'Agente de Soporte' : 'Cliente')}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            isAgent ? 'bg-[#202C2A] text-white' : 'bg-[#DFD9CD] text-[#202C2A]'
                          }`}
                        >
                          {c.autor_tipo}
                        </span>
                        {isResolution && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            Comentario de Resolución
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#7A8C76]">
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p className="text-[#252A30] whitespace-pre-wrap leading-relaxed mt-1 font-medium">
                      {c.contenido}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulario para agregar comentario */}
          {ticket.estado !== TICKET_STATUS.CERRADO && (
            <form onSubmit={handleCommentSubmit} className="mt-6 pt-4 border-t border-[#DFD9CD] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#202C2A]">Publicar como:</span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1 text-[#202C2A] cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="autorTipo"
                      value="agente"
                      checked={autorTipo === 'agente'}
                      onChange={() => setAutorTipo('agente')}
                      className="text-[#202C2A] focus:ring-[#C49A6C]"
                    />
                    <span>Agente ({ticket.agente_nombre || 'Soporte'})</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-[#202C2A] cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="autorTipo"
                      value="cliente"
                      checked={autorTipo === 'cliente'}
                      onChange={() => setAutorTipo('cliente')}
                      className="text-[#202C2A] focus:ring-[#C49A6C]"
                    />
                    <span>Cliente ({ticket.cliente_nombre || 'Cliente'})</span>
                  </label>
                </div>
              </div>

              <textarea
                id="ticket-nuevo-comentario"
                rows={3}
                placeholder="Escribe un mensaje o actualización técnica..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="w-full rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] p-3 text-xs text-[#202C2A] placeholder:text-[#7A8C76] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all"
              />

              {commentError && (
                <p className="text-xs text-rose-600 font-semibold">{commentError}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !nuevoComentario.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#202C2A] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm border border-[#C49A6C]/40 hover:bg-[#2B3B38] transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5 text-[#C49A6C]" />
                  <span>{submittingComment ? 'Publicando...' : 'Publicar Comentario'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Historial de Auditoría Trazable */}
        <div className="rounded-2xl border border-[#DFD9CD] bg-white p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DFD9CD]">
            <div className="flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-[#C49A6C]" />
              <h3 className="text-base font-bold text-[#202C2A]">
                Historial de Auditoría ({historial.length})
              </h3>
            </div>
            <span className="text-[10px] text-[#7A8C76] font-mono">Inmutable en SQLite</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2">
            {historial.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7A8C76] italic">
                No hay eventos históricos registrados para este ticket.
              </div>
            ) : (
              historial.map((h, idx) => (
                <div key={h.id || idx} className="relative pl-6 border-l-2 border-[#C49A6C]/40 pb-4 last:pb-0">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[#C49A6C]" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#202C2A] capitalize">
                      {h.tipo_evento?.replace('_', ' ') || 'Evento'}
                    </span>
                    <span className="text-[10px] font-mono text-[#7A8C76]">
                      {formatDate(h.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-[#252A30] mt-1 leading-relaxed">
                    {h.detalles || `Cambio de ${h.campo || 'valor'}: ${h.valor_anterior || '—'} → ${h.valor_nuevo || '—'}`}
                  </p>

                  {h.autor_nombre && (
                    <span className="text-[10px] text-[#7A8C76] mt-0.5 block">
                      Por: <strong>{h.autor_nombre}</strong>
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal para Cambiar Estado (Resolución obligatoria con comentario) */}
      <StatusChangeModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        ticket={ticket}
        onSubmit={handleStatusSubmit}
        isSubmitting={submittingStatus}
      />

    </div>
  );
}
