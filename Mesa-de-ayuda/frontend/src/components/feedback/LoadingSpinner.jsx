import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Cargando información...', size = 'default' }) {
  const sizeClasses = {
    small: 'h-5 w-5',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.default} animate-spin text-sky-600 mb-3`} />
      {message && <p className="text-sm font-medium text-slate-600">{message}</p>}
    </div>
  );
}
