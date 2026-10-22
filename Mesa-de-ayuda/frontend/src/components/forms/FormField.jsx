import React from 'react';

export function FormField({
  label,
  id,
  error,
  required = false,
  helpText,
  children
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {children}

      {error && (
        <p className="text-xs font-medium text-rose-600 animate-fade-in flex items-center gap-1 mt-1">
          <span>{error}</span>
        </p>
      )}

      {helpText && !error && (
        <p className="text-[11px] text-slate-400 mt-1">{helpText}</p>
      )}
    </div>
  );
}
