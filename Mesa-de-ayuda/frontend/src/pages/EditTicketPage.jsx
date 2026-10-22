import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { FormField } from '../components/forms/FormField';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { TICKET_PRIORITY, COMMON_AREAS } from '../utils/constants';

export function EditTicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: ticket,
    loading: loadingTicket,
    error: errorTicket
  } = useFetch(() => api.getTicketById(id), [id]);

  const {
    data: agents,
    loading: loadingAgents
  } = useFetch(() => api.getAgents(), []);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    area: '',
    prioridad: '',
    agente_id: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setFormData({
        titulo: ticket.titulo || '',
        descripcion: ticket.descripcion || '',
        area: ticket.area || '',
        prioridad: ticket.prioridad || '',
        agente_id: ticket.agente_id ? String(ticket.agente_id) : ''
      });
    }
  }, [ticket]);

  if (loadingTicket || loadingAgents) {
    return <LoadingSpinner message="Cargando información del ticket..." />;
  }

  if (errorTicket) {
    return (
      <ErrorMessage
        title="Error al cargar ticket"
        message={errorTicket}
      />
    );
  }

  const validate = () => {
    const errors = {};
    if (!formData.titulo.trim() || formData.titulo.trim().length < 3) {
      errors.titulo = 'El título debe tener al menos 3 caracteres.';
    }
    if (!formData.descripcion.trim() || formData.descripcion.trim().length < 5) {
      errors.descripcion = 'La descripción debe tener al menos 5 caracteres.';
    }
    if (!formData.area) {
      errors.area = 'El área es requerida.';
    }
    if (!formData.prioridad) {
      errors.prioridad = 'La prioridad es requerida.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        area: formData.area,
        prioridad: formData.prioridad,
        agente_id: formData.agente_id ? Number(formData.agente_id) : null
      };

      await api.updateTicket(id, payload);
      navigate(`/tickets/${id}`);
    } catch (err) {
      setServerError(err.message || 'Error al actualizar el ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <Link
          to={`/tickets/${id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al detalle del Ticket #{id}</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Ticket #{id}
          </span>
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl mt-1">
            Editar Parámetros del Ticket
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Modifique los campos permitidos. Reasignar el agente registrará un evento de trazabilidad en el historial.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-rose-900">No se pudo actualizar:</strong>
              <p className="mt-0.5 leading-relaxed">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Título"
            id="edit-titulo"
            required
            error={formErrors.titulo}
          >
            <input
              type="text"
              id="edit-titulo"
              value={formData.titulo}
              onChange={(e) => {
                setFormData({ ...formData, titulo: e.target.value });
                if (formErrors.titulo) setFormErrors({ ...formErrors, titulo: null });
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Área"
              id="edit-area"
              required
              error={formErrors.area}
            >
              <select
                id="edit-area"
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

            <FormField
              label="Prioridad"
              id="edit-prioridad"
              required
              error={formErrors.prioridad}
            >
              <select
                id="edit-prioridad"
                value={formData.prioridad}
                onChange={(e) => {
                  setFormData({ ...formData, prioridad: e.target.value });
                  if (formErrors.prioridad) setFormErrors({ ...formErrors, prioridad: null });
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value={TICKET_PRIORITY.ALTA}>Alta (4h)</option>
                <option value={TICKET_PRIORITY.MEDIA}>Media (24h)</option>
                <option value={TICKET_PRIORITY.BAJA}>Baja (72h)</option>
              </select>
            </FormField>
          </div>

          {/* Reasignar Agente */}
          <FormField
            label="Reasignar Agente Responsable"
            id="edit-agente"
            helpText="Cambiar de agente creará un evento auditable en el historial."
          >
            <select
              id="edit-agente"
              value={formData.agente_id}
              onChange={(e) => setFormData({ ...formData, agente_id: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">-- Sin asignar --</option>
              {Array.isArray(agents) &&
                agents
                  .filter((a) => a.activo === 1)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} ({a.area}) - {a.email}
                    </option>
                  ))}
            </select>
          </FormField>

          <FormField
            label="Descripción"
            id="edit-descripcion"
            required
            error={formErrors.descripcion}
          >
            <textarea
              id="edit-descripcion"
              rows={4}
              value={formData.descripcion}
              onChange={(e) => {
                setFormData({ ...formData, descripcion: e.target.value });
                if (formErrors.descripcion) setFormErrors({ ...formErrors, descripcion: null });
              }}
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to={`/tickets/${id}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-sky-500 hover:to-indigo-500 transition disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
