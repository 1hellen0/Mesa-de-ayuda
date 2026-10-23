import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  title = '¿Está seguro de realizar esta acción?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  const confirmBtnStyles = {
    danger: 'bg-rose-700 hover:bg-rose-800 text-white shadow-xs focus:ring-rose-500',
    primary: 'bg-[#202C2A] hover:bg-[#151E1C] text-white shadow-xs focus:ring-[#C49A6C]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151E1C]/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#FFFFFF] p-6 shadow-2xl border border-[#E2DDD2]">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#252A30]/50 hover:bg-[#F3F0E9] hover:text-[#252A30] transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`rounded-xl p-3 ${variant === 'danger' ? 'bg-rose-50 text-rose-700' : 'bg-[#202C2A]/10 text-[#202C2A]'}`}>
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#252A30] font-display">{title}</h3>
            <p className="mt-2 text-xs text-[#252A30]/70 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#E2DDD2]">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold text-[#252A30] hover:bg-[#F3F0E9] transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2 ${confirmBtnStyles[variant] || confirmBtnStyles.danger}`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
