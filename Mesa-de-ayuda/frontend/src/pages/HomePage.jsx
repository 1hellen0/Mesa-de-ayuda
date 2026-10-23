import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  UserCheck,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  ArrowUpRight,
  Cpu,
  Database,
  Workflow,
  Lock,
  ChevronRight,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { NexoraLogo } from '../components/common/NexoraLogo';
import { api } from '../services/api';

export function HomePage() {
  const [stats, setStats] = useState({
    total: 42,
    abiertos: 2,
    enProgreso: 31,
    resueltos: 1,
    cerrados: 8,
    cumplimientoSla: 95.5
  });

  useEffect(() => {
    // Cargar métricas reales si el backend está activo
    api.getSummary()
      .then(res => {
        if (res && res.data) {
          const s = res.data;
          setStats({
            total: s.total_tickets || 42,
            abiertos: s.por_estado?.abierto || 2,
            enProgreso: s.por_estado?.['en progreso'] || 31,
            resueltos: s.por_estado?.resuelto || 1,
            cerrados: s.por_estado?.cerrado || 8,
            cumplimientoSla: s.cumplimiento_sla || 95.5
          });
        }
      })
      .catch(() => {
        // Fallback a los datos reales registrados
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#252A30] font-sans antialiased selection:bg-[#C49A6C]/30 selection:text-[#202C2A]">
      
      {/* 1. Header / Navbar de Nexora */}
      <header className="sticky top-0 z-50 w-full border-b border-[#354441]/50 bg-[#202C2A]/90 px-6 py-4 backdrop-blur-md transition-all sm:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="transition-opacity hover:opacity-90">
            <NexoraLogo variant="light" size="default" />
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#A9B8A5] md:flex">
            <a href="#solucion" className="hover:text-white transition-colors">Problema & Solución</a>
            <a href="#capacidades" className="hover:text-white transition-colors">Capacidades</a>
            <a href="#ciclo-vida" className="hover:text-white transition-colors">Ciclo de Vida</a>
            <a href="#tecnologia" className="hover:text-white transition-colors">Tecnología</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C49A6C] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#202C2A] shadow-md hover:bg-[#DFC19E] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Acceder al sistema</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section Cinematográfico */}
      <section className="relative overflow-hidden bg-[#202C2A] text-white">
        {/* Imagen ambiental de fondo con overlay elegante */}
        <div className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity">
          <img
            src="/assets/nexora_hero_bg.jpg"
            alt="Nexora Operations Ambient"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#202C2A] via-[#202C2A]/95 to-[#202C2A]/75" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 sm:px-12 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            {/* Columna Izquierda: Mensaje y Titular */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C49A6C]/40 bg-[#16201E]/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C49A6C] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C49A6C] animate-pulse" />
                Plataforma de Mesa de Ayuda Inteligente
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                El caos operativo <br />
                <span className="text-[#C49A6C]">termina aquí.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#A9B8A5] font-normal leading-relaxed max-w-xl">
                NEXORA transforma las solicitudes de soporte en procesos inteligentes: analiza cada incidencia, distribuye el trabajo, supervisa los SLA y mantiene la trazabilidad hasta la resolución.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C49A6C] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#202C2A] shadow-lg hover:bg-[#DFC19E] transition-all hover:scale-[1.02]"
                >
                  <span>Acceder al sistema</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Link>

                <a
                  href="#solucion"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#A9B8A5]/40 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm hover:border-[#C49A6C] hover:bg-white/10 transition-all"
                >
                  <span>Conocer la solución</span>
                </a>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Insignia con el Caso Real del Ticket #42 */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl border border-white/10 bg-[#151E1C]/80 p-6 sm:p-7 shadow-2xl backdrop-blur-xl animate-fade-in">
                
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#202C2A] border border-[#C49A6C]/50 text-[#C49A6C]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">Ticket #42</span>
                        <span className="text-[10px] text-[#A9B8A5] font-mono">• Caso Real Verificado</span>
                      </div>
                      <p className="text-xs font-semibold text-[#A9B8A5]">Distribuidora Global</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#A9B8A5]/20 px-3 py-1 text-[11px] font-bold text-[#A9B8A5] border border-[#A9B8A5]/30">
                    Cerrado
                  </span>
                </div>

                {/* Título de la incidencia real */}
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-wider text-[#C49A6C] font-semibold">Incidencia reportada</p>
                  <p className="text-sm font-semibold text-white/95 mt-0.5">
                    "Problema con el sistema de datos — pasarela de pagos no procesa transacciones"
                  </p>
                </div>

                {/* Línea de tiempo visual del flujo de estados de #42 */}
                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-[#A9B8A5] mb-2">
                    <span className="uppercase tracking-wider">Flujo de Trazabilidad</span>
                    <span className="font-mono text-[#C49A6C]">SLA Cumplido (5m vs 24h)</span>
                  </div>

                  <div className="relative flex items-center justify-between">
                    {/* Línea conectora */}
                    <div className="absolute left-2 right-2 top-3 h-0.5 bg-gradient-to-r from-[#A9B8A5] via-[#C49A6C] to-emerald-400 z-0" />

                    {[
                      { label: 'Creado', time: '22:21', active: true },
                      { label: 'IA Triaje', time: '22:21', active: true },
                      { label: 'Asignado', time: '22:22', active: true },
                      { label: 'Atención', time: '22:22', active: true },
                      { label: 'Resuelto', time: '22:26', active: true },
                      { label: 'Cerrado', time: '22:32', active: true },
                    ].map((step, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#202C2A] border-2 border-[#C49A6C] text-[#C49A6C] shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 fill-[#C49A6C] text-[#202C2A]" />
                        </div>
                        <span className="mt-1.5 text-[9px] font-bold text-white text-center leading-tight">
                          {step.label}
                        </span>
                        <span className="text-[8px] font-mono text-[#A9B8A5]">
                          {step.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subpanel integrado: Recomendación de DeepSeek */}
                <div className="mt-6 rounded-xl border border-[#C49A6C]/30 bg-[#202C2A]/90 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#C49A6C]" />
                      <span className="text-xs font-bold text-white tracking-wide">
                        Recomendación de DeepSeek IA
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A9B8A5]">deepseek-flash</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#A9B8A5]">Área sugerida:</span>
                      <p className="font-semibold text-white">Soporte Técnico</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A9B8A5]">Prioridad sugerida:</span>
                      <p className="font-semibold text-[#C49A6C]">Media (SLA 24h)</p>
                    </div>
                  </div>
                  <div className="mt-2 border-t border-white/5 pt-2">
                    <p className="text-[11px] text-[#A9B8A5]/90 italic">
                      "Agente asignado por menor carga: Laura Fernández (5 tickets activos)."
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Sección: Un problema, una solución */}
      <section id="solucion" className="py-20 bg-[#F3F0E9] border-b border-[#DFD9CD]">
        <div className="mx-auto max-w-7xl px-6 sm:px-12">
          
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C49A6C]">
              Diagnóstico Operativo
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#202C2A]">
              Un problema, una solución
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#252A30]/80 leading-relaxed">
              El soporte tradicional genera retrasos, supera los tiempos de atención y dificulta la visibilidad. NEXORA convierte ese caos en un proceso claro, automatizado y trazable.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* El Problema */}
            <div className="rounded-2xl border border-rose-200/80 bg-white/70 p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-6 text-rose-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 font-bold text-xs">!</span>
                <h3 className="font-bold text-base uppercase tracking-wider">El problema convencional</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <div className="h-2 w-2 rounded-full bg-rose-500 mb-2" />
                  <p className="font-bold text-xs text-[#202C2A]">Solicitudes dispersas</p>
                  <p className="text-[11px] text-slate-600 mt-1">Canales desconectados y sin formato común.</p>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <div className="h-2 w-2 rounded-full bg-rose-500 mb-2" />
                  <p className="font-bold text-xs text-[#202C2A]">Asignación manual</p>
                  <p className="text-[11px] text-slate-600 mt-1">Dependencia de triage humano y cuellos de botella.</p>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <div className="h-2 w-2 rounded-full bg-rose-500 mb-2" />
                  <p className="font-bold text-xs text-[#202C2A]">Riesgo de incumplir SLA</p>
                  <p className="text-[11px] text-slate-600 mt-1">Tiempos olvidados y sin alertas de expiración.</p>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <div className="h-2 w-2 rounded-full bg-rose-500 mb-2" />
                  <p className="font-bold text-xs text-[#202C2A]">Poca visibilidad</p>
                  <p className="text-[11px] text-slate-600 mt-1">Falta de auditoría e historial cronológico.</p>
                </div>
              </div>
            </div>

            {/* La Solución Nexora */}
            <div className="rounded-2xl border border-[#354441] bg-[#202C2A] p-7 text-white shadow-xl">
              <div className="flex items-center gap-2.5 mb-6 text-[#C49A6C]">
                <ShieldCheck className="h-6 w-6" />
                <h3 className="font-bold text-base uppercase tracking-wider text-white">La solución NEXORA</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#354441] bg-[#293735] p-4">
                  <div className="h-2 w-2 rounded-full bg-[#C49A6C] mb-2" />
                  <p className="font-bold text-xs text-white">Gestión centralizada</p>
                  <p className="text-[11px] text-[#A9B8A5] mt-1">Un solo catálogo unificado para toda la empresa.</p>
                </div>

                <div className="rounded-xl border border-[#354441] bg-[#293735] p-4">
                  <div className="h-2 w-2 rounded-full bg-[#C49A6C] mb-2" />
                  <p className="font-bold text-xs text-white">Asignación automática</p>
                  <p className="text-[11px] text-[#A9B8A5] mt-1">Cálculo determinista por menor carga activa.</p>
                </div>

                <div className="rounded-xl border border-[#354441] bg-[#293735] p-4">
                  <div className="h-2 w-2 rounded-full bg-[#C49A6C] mb-2" />
                  <p className="font-bold text-xs text-white">Control de SLA</p>
                  <p className="text-[11px] text-[#A9B8A5] mt-1">Cálculo estricto según prioridad: 4h, 24h y 72h.</p>
                </div>

                <div className="rounded-xl border border-[#354441] bg-[#293735] p-4">
                  <div className="h-2 w-2 rounded-full bg-[#C49A6C] mb-2" />
                  <p className="font-bold text-xs text-white">Trazabilidad completa</p>
                  <p className="text-[11px] text-[#A9B8A5] mt-1">Historial inmutable y comentario obligatorio.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Sección: Capacidades Inteligentes (Bento Grid) */}
      <section id="capacidades" className="py-24 bg-[#202C2A] text-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#354441] pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C49A6C]">
                Tecnología que trabaja para tu equipo
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Capacidades inteligentes
              </h2>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A9B8A5] hover:text-[#C49A6C] transition-colors"
            >
              <span>Ver centro de operaciones</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Bento 1: DeepSeek */}
            <div className="rounded-2xl border border-[#354441] bg-[#293735]/70 p-6 hover:border-[#C49A6C]/50 transition-all hover:translate-y-[-2px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#202C2A] text-[#C49A6C] border border-[#C49A6C]/30 mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">Análisis con DeepSeek</h3>
              <p className="mt-2 text-xs text-[#A9B8A5] leading-relaxed">
                Comprende el contexto semántico de cada ticket y sugiere clasificación de área, prioridad y borradores cordiales sin alterar la base de datos.
              </p>
            </div>

            {/* Bento 2: Asignación Automática */}
            <div className="rounded-2xl border border-[#354441] bg-[#293735]/70 p-6 hover:border-[#C49A6C]/50 transition-all hover:translate-y-[-2px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#202C2A] text-[#C49A6C] border border-[#C49A6C]/30 mb-4">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">Asignación automática</h3>
              <p className="mt-2 text-xs text-[#A9B8A5] leading-relaxed">
                Distribuye el trabajo equitativamente según la carga activa de los agentes disponibles en el área requerida, con desempate determinista.
              </p>
            </div>

            {/* Bento 3: Control de SLA */}
            <div className="rounded-2xl border border-[#354441] bg-[#293735]/70 p-6 hover:border-[#C49A6C]/50 transition-all hover:translate-y-[-2px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#202C2A] text-[#C49A6C] border border-[#C49A6C]/30 mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">Control de SLA</h3>
              <p className="mt-2 text-xs text-[#A9B8A5] leading-relaxed">
                Monitorea los tiempos de respuesta según la prioridad: 4 horas para Alta, 24 horas para Media y 72 horas para Baja.
              </p>
            </div>

            {/* Bento 4: Comentarios y Resolución */}
            <div className="rounded-2xl border border-[#354441] bg-[#293735]/70 p-6 hover:border-[#C49A6C]/50 transition-all hover:translate-y-[-2px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#202C2A] text-[#C49A6C] border border-[#C49A6C]/30 mb-4">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">Comentarios y resolución</h3>
              <p className="mt-2 text-xs text-[#A9B8A5] leading-relaxed">
                Exige obligatoriamente un comentario explicativo para resolver un ticket, ejecutando la actualización en una transacción atómica.
              </p>
            </div>

            {/* Bento 5: Historial de Auditoría */}
            <div className="rounded-2xl border border-[#354441] bg-[#293735]/70 p-6 hover:border-[#C49A6C]/50 transition-all hover:translate-y-[-2px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#202C2A] text-[#C49A6C] border border-[#C49A6C]/30 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">Historial de auditoría</h3>
              <p className="mt-2 text-xs text-[#A9B8A5] leading-relaxed">
                Registra cada cambio de estado, reasignación y nota con fecha exacta y autor responsable en una tabla inmutable.
              </p>
            </div>

            {/* Bento 6: Métricas de Operación */}
            <div className="rounded-2xl border border-[#354441] bg-[#293735]/70 p-6 hover:border-[#C49A6C]/50 transition-all hover:translate-y-[-2px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#202C2A] text-[#C49A6C] border border-[#C49A6C]/30 mb-4">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">Métricas de operación</h3>
              <p className="mt-2 text-xs text-[#A9B8A5] leading-relaxed">
                Visibilidad del rendimiento del equipo mediante consultas SQL agregadas que calculan tasas de cumplimiento y carga por agente.
              </p>
            </div>

          </div>

          {/* Callout Editorial */}
          <div className="mt-12 rounded-2xl border border-[#C49A6C]/40 bg-gradient-to-r from-[#1E2A28] to-[#293735] p-8 text-center sm:text-left sm:flex items-center justify-between gap-6">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                "Más que un sistema de tickets, es una plataforma de operaciones inteligentes."
              </p>
              <p className="text-xs text-[#A9B8A5] mt-1">
                Construido sobre estándares empresariales con cero deuda técnica y contratos estrictos.
              </p>
            </div>
            <Link
              to="/tickets/nuevo"
              className="mt-4 sm:mt-0 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#C49A6C] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#202C2A] hover:bg-[#DFC19E] transition-all"
            >
              <span>Crear Ticket Ahora</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. Sección: El ciclo de vida de un ticket & Arquitectura */}
      <section id="ciclo-vida" className="py-24 bg-[#F3F0E9] border-b border-[#DFD9CD]">
        <div className="mx-auto max-w-7xl px-6 sm:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Ciclo de vida */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C49A6C]">
                  Flujo de Estados Estricto
                </span>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-[#202C2A]">
                  El ciclo de vida de un ticket
                </h2>
                <p className="text-xs sm:text-sm text-[#252A30]/80 mt-1">
                  Cada etapa está diseñada para ser más rápida, transparente y eficiente.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                {[
                  {
                    num: '01',
                    name: 'Abierto',
                    desc: 'El ticket se registra, calcula SLA y se analiza con IA.',
                    color: 'border-amber-400 bg-amber-50/80 text-amber-900'
                  },
                  {
                    num: '02',
                    name: 'En progreso',
                    desc: 'Se asigna al agente activo de menor carga de trabajo.',
                    color: 'border-sky-400 bg-sky-50/80 text-sky-900'
                  },
                  {
                    num: '03',
                    name: 'Resuelto',
                    desc: 'Se confirma solución con comentario obligatorio.',
                    color: 'border-emerald-400 bg-emerald-50/80 text-emerald-900'
                  },
                  {
                    num: '04',
                    name: 'Cerrado',
                    desc: 'El caso queda archivado y documentado con trazabilidad.',
                    color: 'border-[#202C2A] bg-[#202C2A] text-white'
                  }
                ].map((stage, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 shadow-sm flex flex-col justify-between ${stage.color}`}
                  >
                    <div>
                      <span className="font-mono text-xs font-bold opacity-60">{stage.num}</span>
                      <h4 className="font-bold text-sm mt-1">{stage.name}</h4>
                    </div>
                    <p className="text-[11px] opacity-80 mt-3 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arquitectura Tecnológica */}
            <div id="tecnologia" className="lg:col-span-5 rounded-2xl border border-[#DFD9CD] bg-white p-7 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C49A6C]">
                Arquitectura
              </span>
              <h3 className="text-xl font-bold text-[#202C2A] mt-1">
                Tecnología que lo hace posible
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Una arquitectura desacoplada, moderna y confiable.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3.5">
                {[
                  { name: 'React', sub: 'Interfaz de usuario', icon: '⚛️' },
                  { name: 'Vite', sub: 'Desarrollo ultra rápido', icon: '⚡' },
                  { name: 'Express', sub: 'API REST transaccional', icon: '🚀' },
                  { name: 'SQLite', sub: 'Persistencia inmutable', icon: '💾' },
                  { name: 'n8n', sub: 'Orquestación de workflows', icon: '🔄' },
                  { name: 'DeepSeek', sub: 'Inferencia IA flash', icon: '🧠' }
                ].map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#FAF8F4] p-3 text-left"
                  >
                    <span className="text-lg">{tech.icon}</span>
                    <div>
                      <p className="font-bold text-xs text-[#202C2A]">{tech.name}</p>
                      <p className="text-[10px] text-[#7A8C76]">{tech.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. Banner Panorámico Final con Paisaje de Montaña */}
      <section className="relative overflow-hidden bg-[#16201E] text-white py-20">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
          <img
            src="/assets/nexora_mountain_bg.jpg"
            alt="Nexora Mountains"
            className="h-full w-full object-cover object-bottom"
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#16201E] via-[#16201E]/80 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C49A6C]">
            Claridad y Rigor Operativo
          </p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Cada incidencia tiene un recorrido. <br className="hidden sm:inline" />
            Cada acción deja evidencia.
          </h2>
          <p className="mt-4 text-sm text-[#A9B8A5] max-w-xl mx-auto">
            NEXORA. Inteligencia aplicada al soporte empresarial.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C49A6C] px-8 py-4 text-xs font-bold uppercase tracking-wider text-[#202C2A] shadow-xl hover:bg-[#DFC19E] transition-all hover:scale-105"
            >
              <span>Acceder al sistema</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer de Nexora */}
      <footer className="border-t border-[#354441] bg-[#202C2A] py-8 text-xs text-[#A9B8A5]">
        <div className="mx-auto max-w-7xl px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <NexoraLogo variant="light" size="small" />
          <p className="text-[11px] text-[#A9B8A5]/70">
            NEXORA Intelligence Operations © 2026. Mesa de Ayuda con SLA e Historial.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="hover:text-white transition-colors">Centro de Operaciones</Link>
            <Link to="/tickets" className="hover:text-white transition-colors">Tickets</Link>
            <Link to="/metricas" className="hover:text-white transition-colors">Métricas</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
