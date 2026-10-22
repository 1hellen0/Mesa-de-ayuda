import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { VALID_TRANSITIONS, TICKET_STATUS } from '../../utils/constants';
import { FormField } from './FormField';

export function StatusChangeModal({
  isOpen,
  ticket,
  onClose,
  onSubmit,
  isLoading
}) {
  if (!isOpen || !ticket) return null;

  const validTransitions = VALID_TRANSITIONS[ticket.estado] || [];
  const [selectedStatus, setSelectedStatus] = useState(validTransitions[0] || '');
  const [comentario, setComentario] = useState('');
  const [validationError, setValidationError] = useState('');

  const isResolving = selectedStatus === TICKET_STATUS.RESUELTO;

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedStatus) {
      setValidationError('Debe seleccionar un estado válido.');
      return;
    }

    if (isResolving && (!comentario || comentario.trim().length < 3)) {
      setValidationError('Para marcar un ticket como resuelto, es obligatorio registrar un comentario de resolución descriptivo.');
      return;
    }

    onSubmit({
      estado: selectedStatus,
      comentario: comentario.trim() || undefined,
      autor_id: ticket.agente_id || 1
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900">Actualizar Estado del Ticket</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ticket #{ticket.id}: {ticket.titulo}
          </p>
        </div>

        {validTransitions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
            Este ticket se encuentra en estado <strong>{ticket.estado}</strong> y no admite más transiciones.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Estado actual vs nuevo */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
              <span className="font-semibold text-slate-500">Estado actual:</span>
              <span className="font-bold text-slate-800 uppercase tracking-wide">{ticket.estado}</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="font-semibold text-slate-500">Nuevo:</span>
              <span className="font-bold text-sky-700 uppercase tracking-wide">{selectedStatus}</span>
            </div>

            <FormField
              label="Seleccionar Nuevo Estado"
              id="nuevo-estado"
              required
            >
              <select
                id="nuevo-estado"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setValidationError('');
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                {validTransitions.map((status) => (
                  <option key={status} value={status}>
                    {status.toUpperCase()}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Comentario de resolución obligatorio si el estado es 'resuelto' */}
            {isResolving && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <FormField
                  label="Comentario de Resolución Obligatorio"
                  id="comentario-resolucion"
                  required
                  error={validationError}
                  helpText="La política del sistema exige documentar la solución aplicada para auditoría e historial."
                >
                  <textarea
                    id="comentario-resolucion"
                    rows={3}
                    value={comentario}
                    onChange={(e) => {
                      setComentario(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="Describa la solución técnica o el procedimiento aplicado..."
                    className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </FormField>
              </div>
            )}

            {!isResolving && (
              <FormField
                label="Nota o motivo del cambio (opcional)"
                id="comentario-opcional"
              >
                <textarea
                  id="comentario-opcional"
                  rows={2}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Observaciones adicionales sobre este cambio de estado..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </FormField>
            )}

            {validationError && !isResolving && (
              <p className="text-xs font-semibold text-rose-600">{validationError}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:from-sky-500 hover:to-indigo-500 transition disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isLoading ? 'Actualizando...' : 'Confirmar Transición'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
