import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BarChart3,
  Users,
  Building2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { NexoraLogo } from '../common/NexoraLogo';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/tickets', label: 'Tickets', icon: Ticket, end: false },
  { to: '/tickets/nuevo', label: 'Crear Ticket', icon: PlusCircle, end: false },
  { to: '/metricas', label: 'Métricas', icon: BarChart3, end: false },
  { to: '/agentes', label: 'Agentes', icon: Users, end: false },
  { to: '/clientes', label: 'Clientes', icon: Building2, end: false },
];

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#151E1C]/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-[#354441] bg-[#202C2A] text-white shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex h-20 items-center justify-between border-b border-[#2D3C39] px-6">
          <Link to="/" className="group transition-opacity hover:opacity-95">
            <NexoraLogo variant="light" size="default" />
          </Link>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A9B8A5]/70">
            Navegación
          </div>
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#2B3B38] text-white font-semibold border-l-2 border-[#C49A6C] shadow-xs'
                        : 'text-[#A9B8A5] hover:bg-[#273634] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-4.5 w-4.5 transition-colors ${
                          isActive ? 'text-[#C49A6C]' : 'text-[#A9B8A5]/80'
                        }`}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* SLA Rule Card */}
          <div className="mt-8 rounded-2xl border border-[#354441] bg-[#1B2624]/90 p-4 text-xs text-[#A9B8A5] shadow-inner">
            <div className="flex items-center justify-between font-semibold text-white">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#C49A6C]" />
                <span className="tracking-wide">Control de SLA</span>
              </div>
              <span className="text-[10px] rounded bg-[#C49A6C]/20 px-1.5 py-0.5 text-[#C49A6C] font-mono">
                Estricto
              </span>
            </div>
            <ul className="mt-3 space-y-2 text-[11px]">
              <li className="flex items-center justify-between border-b border-[#293835] pb-1.5">
                <span className="font-medium text-rose-300">Alta</span>
                <span className="font-semibold text-white font-mono">4 horas</span>
              </li>
              <li className="flex items-center justify-between border-b border-[#293835] pb-1.5">
                <span className="font-medium text-[#C49A6C]">Media</span>
                <span className="font-semibold text-white font-mono">24 horas</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-medium text-[#A9B8A5]">Baja</span>
                <span className="font-semibold text-white font-mono">72 horas</span>
              </li>
            </ul>
          </div>

          {/* Quick link to Homepage */}
          <div className="mt-6">
            <Link
              to="/"
              className="flex items-center justify-between rounded-xl border border-[#354441]/60 px-3.5 py-2.5 text-xs font-medium text-[#A9B8A5] hover:border-[#C49A6C]/50 hover:bg-[#263533] hover:text-white transition-all"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C49A6C]" />
                <span>Ver Portada Nexora</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#A9B8A5]" />
            </Link>
          </div>
        </div>

        {/* Footer info: Sistema en línea */}
        <div className="border-t border-[#2D3C39] p-4 bg-[#1B2624]/60">
          <div className="flex items-center justify-between text-xs text-[#A9B8A5]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-slate-300">Sistema en línea</span>
            </div>
            <span className="text-[10px] font-mono text-[#A9B8A5]/60">v2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
