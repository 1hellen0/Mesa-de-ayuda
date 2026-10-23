import React, { useState, useEffect } from 'react';
import { Menu, Plus, Search, Activity, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export function Navbar({ onMenuClick }) {
  const [serverOnline, setServerOnline] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const navigate = useNavigate();

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
    const interval = setInterval(checkServer, 30000);

    // Formatear fecha y hora actual en tiempo real en America/Costa_Rica
    const updateTime = () => {
      const now = new Date();
      try {
        const formatted = new Intl.DateTimeFormat('es-CR', {
          timeZone: 'America/Costa_Rica',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(now);
        setCurrentDateTime(formatted);
      } catch {
        setCurrentDateTime(now.toLocaleDateString('es-CR'));
      }
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tickets?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-[#E5E0D5] bg-[#FAF8F4]/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile trigger & Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 text-[#202C2A] hover:bg-[#EAE5DC] lg:hidden"
          aria-label="Abrir menú lateral"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Global Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C9B88]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tickets, clientes, etc..."
            className="w-full rounded-xl border border-[#DFD9CD] bg-[#F3F0E9] py-2 pl-10 pr-4 text-xs font-medium text-[#252A30] placeholder:text-[#8C9B88] focus:border-[#C49A6C] focus:bg-white focus:outline-none transition-all shadow-inner"
          />
        </form>
      </div>

      {/* Right: Date, Status, Agent Profile & Action */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Live Date Status */}
        <div className="hidden xl:flex flex-col text-right">
          <span className="text-[11px] font-semibold text-[#202C2A]">
            {currentDateTime || '22 oct 2026, 22:32'}
          </span>
          <span className="flex items-center justify-end gap-1 text-[10px] text-[#7A8C76]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Actualización en tiempo real
          </span>
        </div>

        {/* Backend health status badge */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
            serverOnline === true
              ? 'border-[#A9B8A5]/60 bg-[#E6EBE4] text-[#202C2A]'
              : serverOnline === false
              ? 'border-rose-300 bg-rose-50 text-rose-800'
              : 'border-[#DFD9CD] bg-[#F3F0E9] text-[#7A8C76]'
          }`}
          title={
            serverOnline === true
              ? 'Servidor Express conectado (puerto 3000)'
              : serverOnline === false
              ? 'Servidor Express fuera de línea'
              : 'Comprobando conexión...'
          }
        >
          <span
            className={`h-2 w-2 rounded-full ${
              serverOnline === true
                ? 'bg-emerald-600'
                : serverOnline === false
                ? 'bg-rose-500'
                : 'bg-amber-500'
            }`}
          />
          <span className="hidden md:inline font-mono">
            {serverOnline === true ? 'API Conectada' : serverOnline === false ? 'API Offline' : 'Comprobando...'}
          </span>
        </div>

        {/* Agent Profile Chip */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#DFD9CD]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#202C2A] text-white font-semibold text-xs border border-[#C49A6C]/40 shadow-xs">
            LF
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-[#202C2A] leading-tight">Laura Fernández</span>
            <span className="text-[10px] text-[#7A8C76] font-medium leading-tight">Agente Activa</span>
          </div>
        </div>

        {/* Primary CTA */}
        <Link
          to="/tickets/nuevo"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#202C2A] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2B3B38] border border-[#C49A6C]/40 hover:border-[#C49A6C] transition-all"
        >
          <Plus className="h-4 w-4 text-[#C49A6C]" />
          <span className="hidden sm:inline">Crear Ticket</span>
        </Link>
      </div>
    </header>
  );
}
