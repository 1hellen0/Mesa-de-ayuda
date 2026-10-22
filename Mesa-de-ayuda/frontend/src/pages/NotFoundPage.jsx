import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6 animate-fade-in">
      <div className="rounded-3xl bg-sky-50 p-6 text-sky-600 mb-6 shadow-xs border border-sky-100">
        <HelpCircle className="h-16 w-16 stroke-[1.5]" />
      </div>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 tracking-wider">
        ERROR 404
      </span>

      <h1 className="mt-4 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
        Página no encontrada
      </h1>

      <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
        La ruta solicitada no existe o fue reubicada dentro del sistema de la mesa de ayuda.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-sky-500 hover:to-indigo-500 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Dashboard</span>
        </Link>
        <Link
          to="/tickets"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Ver Tickets
        </Link>
      </div>
    </div>
  );
}
