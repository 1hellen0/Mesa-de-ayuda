import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { FormField } from '../components/forms/FormField';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { ConfirmModal } from '../components/feedback/ConfirmModal';
import { EmptyState } from '../components/feedback/EmptyState';
import { formatDate } from '../utils/formatters';

export function ClientsPage() {
  const {
    data: clients,
    loading,
    error,
    refetch
  } = useFetch(() => api.getClients(), []);

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    empresa: '',
    telefono: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Modal Confirmar Eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      nombre: '',
      email: '',
      empresa: '',
      telefono: ''
    });
    setFormErrors({});
    setActionError(null);
    setModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      nombre: client.nombre,
      email: client.email,
      empresa: client.empresa || '',
      telefono: client.telefono || ''
    });
    setFormErrors({});
    setActionError(null);
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre o razón social es obligatorio.';
    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Ingrese un formato de correo electrónico válido.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          empresa: formData.empresa.trim() || null,
          telefono: formData.telefono.trim() || null
        });
      } else {
        await api.createClient({
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          empresa: formData.empresa.trim() || null,
          telefono: formData.telefono.trim() || null
        });
      }

      setModalOpen(false);
      refetch();
    } catch (err) {
      setActionError(err.message || 'Error al guardar el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    setActionError(null);

    try {
      await api.deleteClient(clientToDelete.id);
      setDeleteModalOpen(false);
      setClientToDelete(null);
      refetch();
    } catch (err) {
      setDeleteModalOpen(false);
      setActionError(
        `${err.message}. Los clientes que tienen tickets registrados no pueden ser eliminados para no dejar solicitudes huérfanas.`
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
            <Building2 className="h-3.5 w-3.5" />
            <span>Directorio Corporativo</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#252A30] sm:text-3xl font-display">
            Gestión de Clientes
          </h1>
          <p className="mt-1 text-xs text-[#252A30]/65 sm:text-sm">
            Directorio de cuentas corporativas y usuarios solicitantes vinculados a la mesa de operaciones.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl border border-[#202C2A] bg-[#202C2A] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#151E1C] hover:border-[#C49A6C] transition"
        >
          <Plus className="h-4 w-4 text-[#A9B8A5]" />
          <span>Registrar Cliente</span>
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
        <LoadingSpinner message="Consultando directorio de clientes..." />
      ) : error ? (
        <ErrorMessage
          title="Error al consultar clientes"
          message={error}
          onRetry={refetch}
        />
      ) : !clients || clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hay clientes registrados"
          description="Cree un cliente para asociarle reportes de soporte y tickets de servicio."
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#202C2A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#151E1C] transition"
            >
              <Plus className="h-4 w-4 text-[#A9B8A5]" />
              <span>Registrar Cliente</span>
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
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Nombre / Contacto</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Empresa</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Correo Electrónico</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Teléfono</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Registrado</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F0E9]">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#F3F0E9]/40 transition">
                    <td className="py-3.5 px-4 font-bold text-[#202C2A]">#{client.id}</td>
                    <td className="py-3.5 px-4 font-bold text-[#252A30]">
                      {client.nombre}
                    </td>
                    <td className="py-3.5 px-4">
                      {client.empresa ? (
                        <span className="rounded-md bg-[#202C2A]/10 px-2 py-0.5 text-xs font-semibold text-[#202C2A] border border-[#202C2A]/20">
                          {client.empresa}
                        </span>
                      ) : (
                        <span className="text-[#252A30]/40 italic">No especificada</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#252A30]/70">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-[#252A30]/40" />
                        {client.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#252A30]/70">
                      {client.telefono ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-[#252A30]/40" />
                          {client.telefono}
                        </span>
                      ) : (
                        <span className="text-[#252A30]/40">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#252A30]/50">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(client)}
                          className="rounded-lg p-1.5 text-[#252A30]/60 hover:bg-[#F3F0E9] hover:text-[#202C2A] transition"
                          title="Editar cliente"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setClientToDelete(client);
                            setDeleteModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-[#252A30]/60 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                {editingClient ? `Editar Cliente #${editingClient.id}` : 'Registrar Nuevo Cliente'}
              </h3>
              <p className="text-xs text-[#252A30]/60 mt-0.5">
                Los clientes pueden solicitar tickets en las diferentes áreas de soporte.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Nombre Completo o Razón Social"
                id="client-nombre"
                required
                error={formErrors.nombre}
              >
                <input
                  type="text"
                  id="client-nombre"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: null });
                  }}
                  placeholder="Ej: Distribuidora Global"
                  className="w-full rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-3.5 py-2 text-xs text-[#252A30] shadow-xs focus:border-[#C49A6C] focus:outline-none focus:ring-1 focus:ring-[#C49A6C]"
                />
              </FormField>

              <FormField
                label="Correo Electrónico"
                id="client-email"
                required
                error={formErrors.email}
              >
                <input
                  type="email"
                  id="client-email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                  }}
                  placeholder="soporte@empresa.com"
                  className="w-full rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-3.5 py-2 text-xs text-[#252A30] shadow-xs focus:border-[#C49A6C] focus:outline-none focus:ring-1 focus:ring-[#C49A6C]"
                />
              </FormField>

              <FormField
                label="Empresa / Organización"
                id="client-empresa"
              >
                <input
                  type="text"
                  id="client-empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Ej: Distribuidora Global S.A."
                  className="w-full rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-3.5 py-2 text-xs text-[#252A30] shadow-xs focus:border-[#C49A6C] focus:outline-none focus:ring-1 focus:ring-[#C49A6C]"
                />
              </FormField>

              <FormField
                label="Teléfono de Contacto"
                id="client-telefono"
              >
                <input
                  type="text"
                  id="client-telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: +506 2222-1111"
                  className="w-full rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-3.5 py-2 text-xs text-[#252A30] shadow-xs focus:border-[#C49A6C] focus:outline-none focus:ring-1 focus:ring-[#C49A6C]"
                />
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
                  <span>{isSubmitting ? 'Guardando...' : editingClient ? 'Guardar Cambios' : 'Crear Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="¿Eliminar cliente del sistema?"
        message={`¿Está seguro de eliminar a ${clientToDelete?.nombre}? Si el cliente tiene tickets de soporte registrados, la base de datos rechazará la eliminación (409 Conflict) para proteger la integridad de los datos.`}
        confirmText="Eliminar Cliente"
        cancelText="Conservar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setClientToDelete(null);
        }}
      />
    </div>
  );
}
