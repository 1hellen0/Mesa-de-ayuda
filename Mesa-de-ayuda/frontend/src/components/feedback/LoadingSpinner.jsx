import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Cargando información...', size = 'default' }) {
  const sizeClasses = {
    small: 'h-5 w-5',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-[#252A30]/60">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.default} animate-spin text-[#C49A6C] mb-3`} />
      {message && <p className="text-sm font-medium text-[#202C2A]">{message}</p>}
    </div>
  );
}
