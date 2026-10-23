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
      nombre: agent.nombre,
      email: agent.email,
      area: agent.area,
      activo: agent.activo
    });
    setFormErrors({});
    setActionError(null);
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Ingrese un formato de correo válido.';
    }
    if (!formData.area) errors.area = 'Debe seleccionar un área válida.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      if (editingAgent) {
        await api.updateAgent(editingAgent.id, {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          area: formData.area,
          activo: Number(formData.activo)
        });
      } else {
        await api.createAgent({
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          area: formData.area,
          activo: Number(formData.activo)
        });
      }

      setModalOpen(false);
      refetch();
    } catch (err) {
      setActionError(err.message || 'Error al guardar el agente.');
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
    <div className="space-y-6">
      {/* Header editorial NEXORA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2DDD2] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C49A6C]">
            <Users className="h-3.5 w-3.5" />
            <span>Equipo de Operaciones</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#252A30] sm:text-3xl font-display">
            Gestión de Agentes
          </h1>
          <p className="mt-1 text-xs text-[#252A30]/65 sm:text-sm">
            Administre la plantilla de soporte técnico y sus áreas oficiales de asignación automática.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl border border-[#202C2A] bg-[#202C2A] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#151E1C] hover:border-[#C49A6C] transition"
        >
          <Plus className="h-4 w-4 text-[#A9B8A5]" />
          <span>Registrar Agente</span>
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
        <LoadingSpinner message="Consultando catálogo de agentes..." />
      ) : error ? (
        <ErrorMessage
          title="Error al cargar agentes"
          message={error}
          onRetry={refetch}
        />
      ) : !agents || agents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay agentes registrados"
          description="Añada agentes para habilitar la asignación automática por carga de trabajo."
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#202C2A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#151E1C] transition"
            >
              <Plus className="h-4 w-4 text-[#A9B8A5]" />
              <span>Registrar Agente</span>
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2DDD2] bg-[#F3F0E9]/70 text-[#252A30]/70">
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">ID</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Nombre del Agente</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Correo Electrónico</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Área Asignada</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F0E9]">
                {agents.map((agent) => {
                  const isActive = agent.activo === 1;

                  return (
                    <tr key={agent.id} className="hover:bg-[#F3F0E9]/40 transition">
                      <td className="py-3.5 px-4 font-bold text-[#202C2A]">#{agent.id}</td>
                      <td className="py-3.5 px-4 font-bold text-[#252A30]">
                        {agent.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-[#252A30]/70">{agent.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-[#202C2A]/10 px-2.5 py-1 text-xs font-semibold text-[#202C2A] border border-[#202C2A]/20">
                          {agent.area}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            isActive
                              ? 'bg-[#7C9A86]/20 text-[#202C2A] border-[#7C9A86]/40'
                              : 'bg-[#E2DDD2] text-[#252A30]/60 border-[#C9C3B6]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-[#7C9A86]' : 'bg-[#252A30]/40'
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
                            className="rounded-lg p-1.5 text-[#252A30]/60 hover:bg-[#F3F0E9] hover:text-[#202C2A] transition"
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
                            className="rounded-lg p-1.5 text-[#252A30]/60 hover:bg-rose-50 hover:text-rose-600 transition"
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

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151E1C]/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E2DDD2] bg-[#FFFFFF] p-6 shadow-2xl">
            <div className="border-b border-[#E2DDD2] pb-4 mb-5">
              <h3 className="text-lg font-bold text-[#252A30] font-display">
                {editingAgent ? `Editar Agente #${editingAgent.id}` : 'Registrar Nuevo Agente'}
              </h3>
              <p className="text-xs text-[#252A30]/60 mt-0.5">
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
                  className="w-full rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-3.5 py-2 text-xs text-[#252A30] shadow-xs focus:border-[#C49A6C] focus:outline-none focus:ring-1 focus:ring-[#C49A6C]"
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
                  placeholder="laura.fernandez@nexora.com"
                  className="w-full rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-3.5 py-2 text-xs text-[#252A30] shadow-xs focus:border-[#C49A6C] focus:outline-none focus:ring-1 focus:ring-[#C49A6C]"
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
                  className="w-full rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-3.5 py-2 text-xs text-[#252A30] shadow-xs focus:border-[#C49A6C] focus:outline-none focus:ring-1 focus:ring-[#C49A6C]"
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
                  <label className="inline-flex items-center gap-2 text-xs text-[#252A30] cursor-pointer">
                    <input
                      type="radio"
                      name="agentActivo"
                      checked={Number(formData.activo) === 1}
                      onChange={() => setFormData({ ...formData, activo: 1 })}
                      className="text-[#202C2A] focus:ring-[#C49A6C]"
                    />
                    <span>Activo (Disponible para auto-asignación)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-[#252A30] cursor-pointer">
                    <input
                      type="radio"
                      name="agentActivo"
                      checked={Number(formData.activo) === 0}
                      onChange={() => setFormData({ ...formData, activo: 0 })}
                      className="text-[#202C2A] focus:ring-[#C49A6C]"
                    />
                    <span>Inactivo</span>
                  </label>
                </div>
              </FormField>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#E2DDD2]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold text-[#252A30] hover:bg-[#F3F0E9] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#202C2A] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#151E1C] transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#A9B8A5]" />
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
