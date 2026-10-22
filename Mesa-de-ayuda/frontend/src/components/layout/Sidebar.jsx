import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  Building2,
  Clock,
  ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tickets', label: 'Tickets & SLA', icon: Ticket, end: false },
  { to: '/tickets/nuevo', label: 'Nuevo Ticket', icon: PlusCircle, end: false },
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
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-lg lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900">Mesa de Ayuda</h1>
            <p className="text-[11px] font-medium text-slate-400">SLA & Auditoría v1.0</p>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Módulos Principales
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-5 w-5 transition-colors ${
                          isActive ? 'text-sky-600' : 'text-slate-400'
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
          <div className="mt-8 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-indigo-50/50 p-4 text-xs text-slate-600 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-sky-900">
              <Clock className="h-4 w-4 text-sky-600" />
              <span>Políticas de SLA</span>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-[11px] text-slate-600">
              <li className="flex items-center justify-between">
                <span className="font-medium text-rose-700">Alta</span>
                <span className="font-semibold text-slate-700">4 horas</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-medium text-amber-700">Media</span>
                <span className="font-semibold text-slate-700">24 horas</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-medium text-emerald-700">Baja</span>
                <span className="font-semibold text-slate-700">72 horas</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 p-4 text-center">
          <p className="text-[11px] text-slate-400">
            Node.js + Express + SQLite
          </p>
        </div>
      </aside>
    </>
  );
}
