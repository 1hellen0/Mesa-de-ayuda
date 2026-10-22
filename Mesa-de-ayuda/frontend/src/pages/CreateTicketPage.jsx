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
  RefreshCw
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

    // Validación previa: título y descripción no pueden estar vacíos
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

    // Obtener datos del cliente si ya fue seleccionado
    const selectedClient = Array.isArray(clients)
      ? clients.find((c) => String(c.id) === String(formData.cliente_id))
      : null;

    setAiLoading(true);

    try {
      const response = await aiService.analyzeTicket({
        titulo: tituloTrimmed,
        descripcion: descTrimmed,
        clienteNombre: selectedClient?.nombre || 'Cliente solicitante',
        empresa: selectedClient?.empresa || null,
        area: formData.area,
        prioridad: formData.prioridad
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

  // Aplicación manual e independiente de sugerencias
  const handleApplyPriority = (suggestedPriority) => {
    if (suggestedPriority) {
      setFormData((prev) => ({ ...prev, prioridad: suggestedPriority }));
    }
  };

  const handleApplyArea = (suggestedArea) => {
    if (suggestedArea) {
      setFormData((prev) => ({ ...prev, area: suggestedArea }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const errors = validate();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const created = await api.createTicket({
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        cliente_id: Number(formData.cliente_id),
        area: formData.area,
        prioridad: formData.prioridad
      });

      // Redirigir directamente al detalle del ticket recién creado
      navigate(`/tickets/${created.id}`);
    } catch (err) {
      setServerError(err.message || 'No fue posible registrar el ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const slaDuration = SLA_HOURS[formData.prioridad] || 24;

  if (loadingClients) {
    return <LoadingSpinner message="Cargando directorio de clientes..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a la lista de tickets</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-5 mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
              Registrar Nuevo Ticket
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              El sistema calculará automáticamente la fecha límite del SLA y asignará al agente disponible con menor carga operativa.
            </p>
          </div>

          {/* Botón superior de Análisis con IA */}
          <button
            type="button"
            id="btn-analizar-ia-top"
            onClick={handleAnalyzeWithAi}
            disabled={aiLoading || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-50 shrink-0"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Analizar con IA</span>
              </>
            )}
          </button>
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
              placeholder="Ej: Falla de autenticación en pasarela de pagos"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Nivel de Prioridad y SLA <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  id: TICKET_PRIORITY.ALTA,
                  label: 'Alta',
                  hours: 4,
                  desc: 'Incidentes críticos con impacto operativo',
                  borderActive: 'border-rose-500 bg-rose-50/50 text-rose-900',
                  badge: 'bg-rose-100 text-rose-800'
                },
                {
                  id: TICKET_PRIORITY.MEDIA,
                  label: 'Media',
                  hours: 24,
                  desc: 'Consultas regulares y fallas parciales',
                  borderActive: 'border-amber-500 bg-amber-50/50 text-amber-900',
                  badge: 'bg-amber-100 text-amber-800'
                },
                {
                  id: TICKET_PRIORITY.BAJA,
                  label: 'Baja',
                  hours: 72,
                  desc: 'Solicitudes menores o requerimientos informativos',
                  borderActive: 'border-emerald-500 bg-emerald-50/50 text-emerald-900',
                  badge: 'bg-emerald-100 text-emerald-800'
                }
              ].map((p) => {
                const isSelected = formData.prioridad === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, prioridad: p.id })}
                    className={`rounded-xl border p-3.5 text-left transition flex flex-col justify-between ${
                      isSelected
                        ? `${p.borderActive} ring-2 ring-sky-500/20 shadow-xs font-semibold`
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{p.label}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${p.badge}`}>
                        {p.hours} horas
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SLA Preview Info Card */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 flex items-center gap-3 text-xs text-sky-900">
            <Clock className="h-5 w-5 text-sky-600 shrink-0" />
            <div>
              <p className="font-semibold">
                Plazo de SLA calculado: {slaDuration} horas desde la creación.
              </p>
              <p className="text-[11px] text-sky-700 mt-0.5">
                Al enviar el formulario, el ticket avanzará de forma automática a 'en progreso' al asignarse al agente con menor carga del área de {formData.area}.
              </p>
            </div>
          </div>

          {/* Descripción */}
          <FormField
            label="Detalle Completo del Problema"
            id="ticket-descripcion"
            required
            error={formErrors.descripcion}
            helpText="Especifique los pasos para reproducir o los detalles técnicos relevantes (mínimo 5 caracteres)."
          >
            <textarea
              id="ticket-descripcion"
              rows={4}
              value={formData.descripcion}
              onChange={(e) => {
                setFormData({ ...formData, descripcion: e.target.value });
                if (formErrors.descripcion) setFormErrors({ ...formErrors, descripcion: null });
              }}
              placeholder="Describa el incidente con toda la información necesaria..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </FormField>

          {/* Barra de llamada a IA complementaria junto a la descripción */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-950">
                  ¿Desea sugerencias automáticas de prioridad, área y respuesta?
                </p>
                <p className="text-[11px] text-indigo-700">
                  El agente inteligente de DeepSeek analizará el texto sin alterar el formulario a menos que usted lo decida.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-analizar-ia-inline"
              onClick={handleAnalyzeWithAi}
              disabled={aiLoading || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Analizando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Analizar con IA</span>
                </>
              )}
            </button>
          </div>

          {/* Panel de Recomendaciones de IA (se muestra durante carga, error o recomendación) */}
          {(aiLoading || aiError || aiRecommendation) && (
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
          )}

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/tickets"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-sky-500/20 hover:from-sky-500 hover:to-indigo-500 transition disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Registrando Ticket...' : 'Crear Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicketPage;
