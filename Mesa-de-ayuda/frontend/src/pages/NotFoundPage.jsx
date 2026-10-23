import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6">
      <div className="rounded-3xl bg-[#202C2A]/10 p-6 text-[#202C2A] mb-6 shadow-xs border border-[#202C2A]/20">
        <HelpCircle className="h-16 w-16 stroke-[1.5] text-[#C49A6C]" />
      </div>

      <span className="rounded-full bg-[#E2DDD2] px-3 py-1 text-xs font-bold text-[#202C2A] tracking-wider uppercase">
        Error 404 — No Encontrado
      </span>

      <h1 className="mt-4 text-3xl font-bold text-[#252A30] tracking-tight sm:text-4xl font-display">
        Página no encontrada
      </h1>

      <p className="mt-2 max-w-md text-xs sm:text-sm text-[#252A30]/65 leading-relaxed">
        La ruta solicitada no existe o fue reubicada dentro de NEXORA Intelligence Operations.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-[#202C2A] bg-[#202C2A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#151E1C] hover:border-[#C49A6C] transition"
        >
          <ArrowLeft className="h-4 w-4 text-[#A9B8A5]" />
          <span>Ir al Centro de Operaciones</span>
        </Link>
        <Link
          to="/"
          className="rounded-xl border border-[#E2DDD2] bg-[#FFFFFF] px-4 py-2.5 text-xs font-semibold text-[#252A30] hover:bg-[#F3F0E9] transition"
        >
          Portal NEXORA
        </Link>
      </div>
    </div>
  );
}
