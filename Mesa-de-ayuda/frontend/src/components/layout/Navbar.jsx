import React, { useState, useEffect } from 'react';
import { Menu, Plus, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export function Navbar({ onMenuClick }) {
  const [serverOnline, setServerOnline] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        await api.checkHealth();
        if (isMounted) setServerOnline(true);
      } catch {
        if (isMounted) setServerOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 30000); // comprobar cada 30 segundos
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Abrir menú lateral"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
            Panel de Operaciones
          </span>
          <h2 className="text-base font-bold text-slate-800 hidden sm:block">
            Mesa de Ayuda con SLA e Historial
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Backend health status badge */}
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${
            serverOnline === true
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : serverOnline === false
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
          title={
            serverOnline === true
              ? 'Servidor Express conectado (puerto 3000)'
              : serverOnline === false
              ? 'Servidor Express fuera de línea'
              : 'Verificando conexión...'
          }
        >
          <span
            className={`h-2 w-2 rounded-full ${
              serverOnline === true
                ? 'bg-emerald-500 animate-pulse'
                : serverOnline === false
                ? 'bg-rose-500'
                : 'bg-slate-400'
            }`}
          />
          <Activity className="h-3.5 w-3.5 opacity-70" />
          <span className="hidden md:inline">
            {serverOnline === true ? 'API Conectada' : serverOnline === false ? 'API Desconectada' : 'Comprobando...'}
          </span>
        </div>

        {/* CTA Crear Ticket */}
        <Link
          to="/tickets/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-500/20 hover:from-sky-500 hover:to-indigo-500 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Crear Ticket</span>
        </Link>
      </div>
    </header>
  );
}
