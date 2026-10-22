import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorMessage({ title = 'Ocurrió un error', message, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-rose-100 p-2 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-rose-900">{title}</h3>
          <p className="mt-1 text-sm text-rose-700 leading-relaxed">
            {message || 'No fue posible completar la solicitud. Verifique la conexión con el servidor.'}
          </p>
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-rose-700 transition"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar operación
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
