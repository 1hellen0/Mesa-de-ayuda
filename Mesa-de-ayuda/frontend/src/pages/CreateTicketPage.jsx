import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Clock,
  Building2,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  RefreshCw,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { aiService } from '../services/aiService';
import { useFetch } from '../hooks/useFetch';
import { FormField } from '../components/forms/FormField';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { AiRecommendationPanel } from '../components/ai/AiRecommendationPanel';
import { TICKET_PRIORITY, COMMON_AREAS, SLA_HOURS } from '../utils/constants';

export function CreateTicketPage() {
  const navigate = useNavigate();

  // Consultar clientes disponibles para el selector
  const {
    data: clients,
    loading: loadingClients,
    error: errorClients
  } = useFetch(() => api.getClients(), []);

  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    cliente_id: '',
    area: COMMON_AREAS[0],
    prioridad: TICKET_PRIORITY.MEDIA
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para el análisis con IA (n8n + DeepSeek)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  const validate = () => {
    const errors = {};
    if (!formData.titulo.trim() || formData.titulo.trim().length < 3) {
      errors.titulo = 'El título debe tener al menos 3 caracteres.';
    }
    if (!formData.descripcion.trim() || formData.descripcion.trim().length < 5) {
      errors.descripcion = 'La descripción debe tener al menos 5 caracteres.';
    }
    if (!formData.cliente_id) {
      errors.cliente_id = 'Debe seleccionar un cliente existente.';
    }
    if (!formData.area) {
      errors.area = 'Debe seleccionar un área de atención.';
    }
    if (!formData.prioridad) {
      errors.prioridad = 'Debe seleccionar la prioridad del ticket.';
    }
    return errors;
  };

  // Manejador para solicitar análisis con IA a n8n
  const handleAnalyzeWithAi = async () => {
    setAiError(null);

    const tituloTrimmed = formData.titulo.trim();
    const descTrimmed = formData.descripcion.trim();

    if (!tituloTrimmed || tituloTrimmed.length < 3) {
      setFormErrors((prev) => ({
        ...prev,
        titulo: 'Complete el título (mínimo 3 caracteres) antes de solicitar análisis con IA.'
      }));
      setAiError('Para solicitar el análisis con IA, el título debe tener al menos 3 caracteres.');
      return;
    }

    if (!descTrimmed || descTrimmed.length < 5) {
      setFormErrors((prev) => ({
        ...prev,
        descripcion: 'Complete la descripción (mínimo 5 caracteres) antes de solicitar análisis con IA.'
      }));
      setAiError('Para solicitar el análisis con IA, la descripción debe tener al menos 5 caracteres.');
      return;
    }

    const selectedClient = Array.isArray(clients)
      ? clients.find((c) => String(c.id) === String(formData.cliente_id))
      : null;

    setAiLoading(true);

    try {
      const payload = {
        titulo: tituloTrimmed,
        descripcion: descTrimmed,
        clienteNombre: selectedClient?.nombre || 'Cliente',
        empresa: selectedClient?.empresa || null,
        area: formData.area || null,
        prioridad: formData.prioridad || null
      };

      const result = await aiService.analyzeTicket(payload);
      setAiRecommendation(result);
    } catch (err) {
      setAiError(err.message || 'No se pudo comunicar con el agente de IA de DeepSeek.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyPriority = (sugPriority) => {
    if (sugPriority) {
      setFormData((prev) => ({ ...prev, prioridad: sugPriority }));
      if (formErrors.prioridad) setFormErrors((prev) => ({ ...prev, prioridad: null }));
    }
  };

  const handleApplyArea = (sugArea) => {
    if (sugArea) {
      setFormData((prev) => ({ ...prev, area: sugArea }));
      if (formErrors.area) setFormErrors((prev) => ({ ...prev, area: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        cliente_id: Number(formData.cliente_id),
        area: formData.area,
        prioridad: formData.prioridad
      };

      const created = await api.createTicket(payload);
      navigate(`/tickets/${created.id}`);
    } catch (err) {
      setServerError(err.message || 'Error inesperado al crear el ticket en el backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingClients) {
    return <LoadingSpinner message="Preparando formulario de registro..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Breadcrumb / Navegación */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#7A8C76]">
        <Link to="/tickets" className="hover:text-[#202C2A] transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a Tickets</span>
        </Link>
        <span>/</span>
        <span className="text-[#202C2A]">Nuevo Ticket</span>
      </div>

      {/* Contenedor Principal */}
      <div className="rounded-2xl border border-[#DFD9CD] bg-white p-6 sm:p-8 shadow-sm">
        
        {/* Encabezado del Formulario */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#DFD9CD] pb-5 mb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C49A6C]">
              Ingreso de Incidencia
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#202C2A] mt-0.5">
              Registrar Nuevo Ticket
            </h1>
            <p className="text-xs text-[#7A8C76] mt-1">
              El sistema asignará automáticamente el agente del área con menor carga activa.
            </p>
          </div>

          {/* Botón de Análisis con DeepSeek */}
          <button
            type="button"
            id="btn-analizar-ia-top"
            onClick={handleAnalyzeWithAi}
            disabled={aiLoading || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#202C2A] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm border border-[#C49A6C]/40 hover:bg-[#2B3B38] hover:border-[#C49A6C] transition disabled:opacity-50 shrink-0"
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
        </div>

        {/* Panel de IA si está cargando, con error o con recomendación */}
        <div className="mb-6">
          <AiRecommendationPanel
            recommendation={aiRecommendation}
            isLoading={aiLoading}
            error={aiError}
            onRetry={handleAnalyzeWithAi}
            onApplyPriority={handleApplyPriority}
            onApplyArea={handleApplyArea}
            currentPriority={formData.prioridad}
            currentArea={formData.area}
            mode="create"
          />
        </div>

        {serverError && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-rose-900">No se pudo crear el ticket:</strong>
              <p className="mt-0.5 leading-relaxed">{serverError}</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Título */}
          <FormField
            label="Título de la Incidencia"
            id="ticket-titulo"
            required
            error={formErrors.titulo}
            helpText="Resuma claramente el problema o requerimiento (mínimo 3 caracteres)."
          >
            <input
              type="text"
              id="ticket-titulo"
              value={formData.titulo}
              onChange={(e) => {
                setFormData({ ...formData, titulo: e.target.value });
                if (formErrors.titulo) setFormErrors({ ...formErrors, titulo: null });
              }}
              placeholder="Ej: Falla en pasarela de pagos al confirmar transacción"
              className="w-full rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] px-4 py-2.5 text-xs font-medium text-[#252A30] placeholder:text-[#7A8C76] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all"
            />
          </FormField>

          {/* Cliente & Área en dos columnas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Cliente */}
            <FormField
              label="Cliente Solicitante"
              id="ticket-cliente"
              required
              error={formErrors.cliente_id}
            >
              <select
                id="ticket-cliente"
                value={formData.cliente_id}
                onChange={(e) => {
                  setFormData({ ...formData, cliente_id: e.target.value });
                  if (formErrors.cliente_id) setFormErrors({ ...formErrors, cliente_id: null });
                }}
                className="w-full rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] px-4 py-2.5 text-xs font-semibold text-[#252A30] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all cursor-pointer"
              >
                <option value="">-- Seleccione un cliente --</option>
                {Array.isArray(clients) &&
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.empresa ? `(${c.empresa})` : ''} - {c.email}
                    </option>
                  ))}
              </select>
            </FormField>

            {/* Área */}
            <FormField
              label="Área de Atención"
              id="ticket-area"
              required
              error={formErrors.area}
              helpText="Determina la cuadrilla de agentes que evaluará el sistema."
            >
              <select
                id="ticket-area"
                value={formData.area}
                onChange={(e) => {
                  setFormData({ ...formData, area: e.target.value });
                  if (formErrors.area) setFormErrors({ ...formErrors, area: null });
                }}
                className="w-full rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] px-4 py-2.5 text-xs font-semibold text-[#252A30] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all cursor-pointer"
              >
                {COMMON_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Selector de Prioridad con previsualización del SLA */}
          <div>
            <label className="block text-xs font-bold text-[#202C2A] mb-2 uppercase tracking-wider">
              Nivel de Prioridad y SLA <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  id: TICKET_PRIORITY.ALTA,
                  label: 'Alta',
                  hours: 4,
                  desc: 'Incidentes críticos con impacto operativo directo',
                  borderActive: 'border-rose-400 bg-rose-50/70 text-rose-900',
                  badge: 'bg-rose-100 text-rose-800'
                },
                {
                  id: TICKET_PRIORITY.MEDIA,
                  label: 'Media',
                  hours: 24,
                  desc: 'Fallas no bloqueantes o consultas regulares',
                  borderActive: 'border-[#C49A6C] bg-[#FAF8F4] text-[#202C2A]',
                  badge: 'bg-[#C49A6C]/20 text-[#202C2A]'
                },
                {
                  id: TICKET_PRIORITY.BAJA,
                  label: 'Baja',
                  hours: 72,
                  desc: 'Dudas generales, solicitudes o requerimientos informativos',
                  borderActive: 'border-[#A9B8A5] bg-[#E6EBE4]/60 text-[#202C2A]',
                  badge: 'bg-[#A9B8A5]/30 text-[#202C2A]'
                }
              ].map((p) => {
                const isSelected = formData.prioridad === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, prioridad: p.id })}
                    className={`rounded-xl border p-4 text-left transition flex flex-col justify-between ${
                      isSelected
                        ? `${p.borderActive} ring-2 ring-[#C49A6C]/30 shadow-xs font-semibold`
                        : 'border-[#DFD9CD] bg-[#FAF8F4] hover:bg-white text-[#252A30]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{p.label}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${p.badge}`}>
                        SLA {p.hours}h
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-[#7A8C76] leading-relaxed">
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>
            {formErrors.prioridad && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.prioridad}</p>
            )}
          </div>

          {/* Descripción */}
          <FormField
            label="Descripción Detallada"
            id="ticket-descripcion"
            required
            error={formErrors.descripcion}
            helpText="Explique los pasos para reproducir o los detalles específicos del incidente (mínimo 5 caracteres)."
          >
            <textarea
              id="ticket-descripcion"
              rows={5}
              value={formData.descripcion}
              onChange={(e) => {
                setFormData({ ...formData, descripcion: e.target.value });
                if (formErrors.descripcion) setFormErrors({ ...formErrors, descripcion: null });
              }}
              placeholder="Describa el problema detalladamente..."
              className="w-full rounded-xl border border-[#DFD9CD] bg-[#FAF8F4] px-4 py-3 text-xs font-medium text-[#252A30] placeholder:text-[#7A8C76] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all leading-relaxed"
            />
          </FormField>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFD9CD]">
            <Link
              to="/tickets"
              className="rounded-xl border border-[#DFD9CD] bg-white px-5 py-2.5 text-xs font-bold text-[#7A8C76] hover:bg-[#FAF8F4] hover:text-[#202C2A] transition"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#202C2A] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm border border-[#C49A6C]/50 hover:bg-[#2B3B38] hover:border-[#C49A6C] transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#C49A6C]" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-[#C49A6C]" />
                  <span>Registrar Ticket</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
