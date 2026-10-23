import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Info,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { PriorityBadge } from '../tickets/TicketBadge';

/**
 * Componente Reutilizable de Panel de Recomendaciones de IA (DeepSeek / n8n)
 * Rediseñado con la identidad de NEXORA Intelligence Operations (Verde Pino, Bronce y Salvia)
 */
export function AiRecommendationPanel({
  recommendation,
  isLoading,
  error,
  onRetry,
  onApplyPriority,
  onApplyArea,
  onUseDraft,
  currentPriority,
  currentArea,
  mode = 'create' // 'create' | 'detail'
}) {
  const [copied, setCopied] = useState(false);
  const [priorityApplied, setPriorityApplied] = useState(false);
  const [areaApplied, setAreaApplied] = useState(false);

  // Copiar borrador al portapapeles
  const handleCopyDraft = async () => {
    if (!recommendation?.respuestaInicial) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(recommendation.respuestaInicial);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = recommendation.respuestaInicial;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      alert('No se pudo copiar automáticamente. Por favor seleccione y copie el texto manualmente.');
    }
  };

  const handleApplyPriority = () => {
    if (onApplyPriority && recommendation?.prioridadSugerida) {
      onApplyPriority(recommendation.prioridadSugerida);
      setPriorityApplied(true);
      setTimeout(() => setPriorityApplied(false), 3000);
    }
  };

  const handleApplyArea = () => {
    if (onApplyArea && recommendation?.areaSugerida) {
      onApplyArea(recommendation.areaSugerida);
      setAreaApplied(true);
      setTimeout(() => setAreaApplied(false), 3000);
    }
  };

  // 1. Estado de Carga
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#202C2A] p-6 text-white shadow-md animate-pulse">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#293735] text-[#C49A6C] border border-[#C49A6C]/40 shadow-xs">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Analizando ticket con DeepSeek AI Agent</span>
              <span className="inline-flex items-center rounded-full bg-[#C49A6C]/20 border border-[#C49A6C]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#C49A6C]">
                En proceso
              </span>
            </h4>
            <p className="text-xs text-[#A9B8A5] mt-0.5">
              Evaluando semántica, categorización de área, criticidad de SLA y propuesta de respuesta...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Estado de Error
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                No fue posible completar el análisis de IA
              </h4>
              <p className="mt-1 text-xs text-rose-700 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 shadow-xs hover:bg-rose-50 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reintentar</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Sin recomendación aún
  if (!recommendation) {
    return null;
  }

  // 4. Panel con recomendación exitosa
  const isPriorityAlreadyMatch = currentPriority === recommendation.prioridadSugerida;
  const isAreaAlreadyMatch = currentArea === recommendation.areaSugerida;

  return (
    <div className="rounded-2xl border border-[#354441] bg-[#202C2A] text-white p-6 shadow-xl space-y-5 animate-fade-in">
      {/* Encabezado y Badge de IA */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#354441] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#293735] text-[#C49A6C] border border-[#C49A6C]/40">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Recomendaciones de DeepSeek</span>
              <span className="font-mono text-[10px] text-[#A9B8A5]">deepseek-flash</span>
            </h3>
            <p className="text-[11px] text-[#A9B8A5]">
              Triaje asistido por agente de inteligencia artificial.
            </p>
          </div>
        </div>

        {/* Aviso de Revisión Humana Obligatoria */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C49A6C]/40 bg-[#16201E] px-3 py-1 text-[11px] font-semibold text-[#C49A6C] shadow-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-[#C49A6C] shrink-0" />
          <span>Requiere revisión humana (No persistido)</span>
        </div>
      </div>

      {/* Grid de Prioridad y Área Sugeridas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Tarjeta Prioridad Sugerida */}
        <div className="rounded-xl border border-[#354441] bg-[#293735] p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9B8A5] block mb-1.5">
              Prioridad Sugerida
            </span>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={recommendation.prioridadSugerida} />
              {isPriorityAlreadyMatch && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" /> Coincide con la actual
                </span>
              )}
            </div>
          </div>

          {mode === 'create' && onApplyPriority && (
            <div className="mt-4 pt-3 border-t border-[#354441] flex items-center justify-between">
              <span className="text-[11px] text-[#A9B8A5]">
                Actual: <strong className="capitalize text-white">{currentPriority || '—'}</strong>
              </span>
              <button
                type="button"
                onClick={handleApplyPriority}
                disabled={priorityApplied || isPriorityAlreadyMatch}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C49A6C]/40 bg-[#C49A6C] px-3 py-1 text-xs font-bold text-[#202C2A] hover:bg-[#DFC19E] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {priorityApplied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-900" />
                    <span>¡Aplicada!</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Aplicar prioridad</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tarjeta Área Sugerida */}
        <div className="rounded-xl border border-[#354441] bg-[#293735] p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9B8A5] block mb-1.5">
              Área de Atención Sugerida
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-[#A9B8A5]/40 bg-[#202C2A] px-2.5 py-1 text-xs font-bold text-white font-mono">
                {recommendation.areaSugerida}
              </span>
              {isAreaAlreadyMatch && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" /> Coincide con la actual
                </span>
              )}
            </div>
          </div>

          {mode === 'create' && onApplyArea && (
            <div className="mt-4 pt-3 border-t border-[#354441] flex items-center justify-between">
              <span className="text-[11px] text-[#A9B8A5]">
                Actual: <strong className="text-white">{currentArea || '—'}</strong>
              </span>
              <button
                type="button"
                onClick={handleApplyArea}
                disabled={areaApplied || isAreaAlreadyMatch}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C49A6C]/40 bg-[#C49A6C] px-3 py-1 text-xs font-bold text-[#202C2A] hover:bg-[#DFC19E] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {areaApplied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-900" />
                    <span>¡Aplicada!</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Aplicar área</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Justificación Técnica */}
      {recommendation.justificacion && (
        <div className="rounded-xl border border-[#354441] bg-[#293735]/60 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C49A6C] block mb-1">
            Justificación Técnica del Agente
          </span>
          <p className="text-xs text-[#A9B8A5] leading-relaxed">
            {recommendation.justificacion}
          </p>
        </div>
      )}

      {/* Borrador de Respuesta Inicial */}
      {recommendation.respuestaInicial && (
        <div className="rounded-xl border border-[#354441] bg-[#16201E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C49A6C]">
              Borrador de Respuesta Inicial al Cliente
            </span>
            <button
              type="button"
              onClick={handleCopyDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#354441] bg-[#202C2A] px-2.5 py-1 text-xs font-semibold text-[#A9B8A5] hover:text-white hover:border-[#C49A6C] transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar borrador</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-lg bg-[#202C2A]/80 p-3 text-xs text-white/90 leading-relaxed font-sans border border-[#354441]/60">
            "{recommendation.respuestaInicial}"
          </div>

          {onUseDraft && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => onUseDraft(recommendation.respuestaInicial)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C49A6C] hover:text-[#DFC19E] transition"
              >
                <span>Insertar en campo de respuesta</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
