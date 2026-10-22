import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { FormField } from '../components/forms/FormField';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { ConfirmModal } from '../components/feedback/ConfirmModal';
import { EmptyState } from '../components/feedback/EmptyState';
import { COMMON_AREAS } from '../utils/constants';

export function AgentsPage() {
  const {
    data: agents,
    loading,
    error,
    refetch
  } = useFetch(() => api.getAgents(), []);

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null); // null = crear, obj = editar
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    area: COMMON_AREAS[0],
    activo: 1
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Modal Confirmar Eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreateModal = () => {
    setEditingAgent(null);
    setFormData({
      nombre: '',
      email: '',
      area: COMMON_AREAS[0],
      activo: 1
    });
    setFormErrors({});
    setActionError(null);
    setModalOpen(true);
  };

  const openEditModal = (agent) => {
    setEditingAgent(agent);
    setFormData({
      nombre: agent.nombre || '',
      email: agent.email || '',
      area: agent.area || COMMON_AREAS[0],
      activo: agent.activo !== undefined ? agent.activo : 1
    });
    setFormErrors({});
    setActionError(null);
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!formData.nombre.trim() || formData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Ingrese un correo electrónico válido.';
    }
    if (!formData.area.trim()) {
      errors.area = 'El área es requerida.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);

    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (editingAgent) {
        await api.updateAgent(editingAgent.id, {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          area: formData.area.trim(),
          activo: Number(formData.activo)
        });
      } else {
        await api.createAgent({
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          area: formData.area.trim(),
          activo: Number(formData.activo)
        });
      }

      setModalOpen(false);
      refetch();
    } catch (err) {
      setActionError(err.message || 'Error al procesar la operación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!agentToDelete) return;
    setIsDeleting(true);
    setActionError(null);

    try {
      await api.deleteAgent(agentToDelete.id);
      setDeleteModalOpen(false);
      setAgentToDelete(null);
      refetch();
    } catch (err) {
      setDeleteModalOpen(false);
      setActionError(
        `${err.message}. Para proteger la trazabilidad de tickets históricos, se recomienda desactivar al agente (activo = 0) en lugar de eliminarlo físicamente.`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Gestión de Agentes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administre la plantilla de soporte técnico y sus áreas de especialidad.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-sky-500/20 hover:from-sky-500 hover:to-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Agente</span>
        </button>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-rose-900">Aviso del Sistema:</strong>
              <p className="mt-0.5 leading-relaxed">{actionError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Consultando directorio de agentes..." />
      ) : error ? (
        <ErrorMessage
          title="Error al consultar agentes"
          message={error}
          onRetry={refetch}
        />
      ) : !agents || agents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay agentes registrados"
          description="Cree el primer agente para habilitar la asignación automática de tickets por área."
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Agente</span>
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Nombre del Agente</th>
                  <th className="py-3 px-4 font-semibold">Correo Electrónico</th>
                  <th className="py-3 px-4 font-semibold">Área Asignada</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => {
                  const isActive = agent.activo === 1;

                  return (
                    <tr key={agent.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-700">#{agent.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {agent.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{agent.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
                          {agent.area}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(agent)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-sky-600 transition"
                            title="Editar agente"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAgentToDelete(agent);
                              setDeleteModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Eliminar agente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Agente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAgent ? `Editar Agente #${editingAgent.id}` : 'Registrar Nuevo Agente'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Los agentes activos son elegibles para la asignación automática de tickets.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Nombre Completo"
                id="agent-nombre"
                required
                error={formErrors.nombre}
              >
                <input
                  type="text"
                  id="agent-nombre"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: null });
                  }}
                  placeholder="Ej: Laura Fernández"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </FormField>

              <FormField
                label="Correo Electrónico"
                id="agent-email"
                required
                error={formErrors.email}
              >
                <input
                  type="email"
                  id="agent-email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                  }}
                  placeholder="laura.fernandez@soporte.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </FormField>

              <FormField
                label="Área Asignada"
                id="agent-area"
                required
                error={formErrors.area}
              >
                <select
                  id="agent-area"
                  value={formData.area}
                  onChange={(e) => {
                    setFormData({ ...formData, area: e.target.value });
                    if (formErrors.area) setFormErrors({ ...formErrors, area: null });
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  {COMMON_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Estado Operativo"
                id="agent-activo"
              >
                <div className="flex items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="agentActivo"
                      checked={Number(formData.activo) === 1}
                      onChange={() => setFormData({ ...formData, activo: 1 })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>Activo (Disponible para auto-asignación)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="agentActivo"
                      checked={Number(formData.activo) === 0}
                      onChange={() => setFormData({ ...formData, activo: 0 })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>Inactivo</span>
                  </label>
                </div>
              </FormField>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:from-sky-500 hover:to-indigo-500 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isSubmitting ? 'Guardando...' : editingAgent ? 'Guardar Cambios' : 'Crear Agente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="¿Eliminar agente del sistema?"
        message={`¿Está seguro de eliminar a ${agentToDelete?.nombre}? Si el agente tiene tickets asignados en curso o históricos, la base de datos rechazará la eliminación física (409 Conflict) para proteger la auditoría.`}
        confirmText="Eliminar Agente"
        cancelText="Conservar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAgentToDelete(null);
        }}
      />
    </div>
  );
}
