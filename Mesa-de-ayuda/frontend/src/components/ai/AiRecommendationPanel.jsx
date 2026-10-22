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
 *
 * Muestra el estado del análisis, la advertencia de revisión humana obligatoria,
 * la justificación técnica, las sugerencias de prioridad y área con aplicación independiente,
 * y el borrador de respuesta inicial copiable.
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
        // Fallback para navegadores antiguos
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
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-6 shadow-xs animate-pulse">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              <span>Analizando ticket con AI Agent (DeepSeek)</span>
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                En curso
              </span>
            </h4>
            <p className="text-xs text-indigo-700/80 mt-0.5">
              Evaluando semántica, estimación de impacto, cuadrilla de atención y borrador de cortesía...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Estado de Error
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 shadow-xs">
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 shadow-2xs hover:bg-rose-50 transition"
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
    <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 p-6 shadow-sm space-y-5 animate-fade-in">
      {/* Encabezado y Badge de IA */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-indigo-100/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Recomendaciones del AI Agent (DeepSeek)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Clasificación asistida por triaje inteligente.
            </p>
          </div>
        </div>

        {/* Aviso de Revisión Humana Obligatoria */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 shadow-2xs">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>Requiere revisión humana (No persistido)</span>
        </div>
      </div>

      {/* Grid de Prioridad y Área Sugeridas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Tarjeta Prioridad Sugerida */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Prioridad Sugerida
            </span>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={recommendation.prioridadSugerida} />
              {isPriorityAlreadyMatch && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" /> Coincide con la actual
                </span>
              )}
            </div>
          </div>

          {mode === 'create' && onApplyPriority && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Actual: <strong className="capitalize">{currentPriority || '—'}</strong>
              </span>
              <button
                type="button"
                onClick={handleApplyPriority}
                disabled={priorityApplied || isPriorityAlreadyMatch}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50"
              >
                {priorityApplied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
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
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Área de Atención Sugerida
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800">
                {recommendation.areaSugerida}
              </span>
              {isAreaAlreadyMatch && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" /> Coincide con la actual
                </span>
              )}
            </div>
          </div>

          {mode === 'create' && onApplyArea && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Actual: <strong>{currentArea || '—'}</strong>
              </span>
              <button
                type="button"
                onClick={handleApplyArea}
                disabled={areaApplied || isAreaAlreadyMatch}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50"
              >
                {areaApplied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
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
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Justificación Técnica de la IA
        </span>
        <p className="text-xs text-slate-700 leading-relaxed">
          {recommendation.justificacion}
        </p>
      </div>

      {/* Borrador de Respuesta Inicial */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Borrador de Respuesta Inicial Sugerido
          </span>

          <div className="flex items-center gap-2">
            {mode === 'detail' && onUseDraft && (
              <button
                type="button"
                onClick={() => onUseDraft(recommendation.respuestaInicial)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <ArrowRight className="h-3 w-3 text-sky-600" />
                <span>Cargar en respuesta</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyDraft}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar al portapapeles</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50/80 p-3.5 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
          {recommendation.respuestaInicial}
        </div>
      </div>

      {/* Pie Informativo de Seguridad e Inmutabilidad */}
      <div className="rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-2.5 flex items-center gap-2 text-[11px] text-slate-600">
        <Info className="h-4 w-4 text-slate-400 shrink-0" />
        <p>
          Las sugerencias de la IA <strong>no modifican la base de datos</strong> automáticamente. La creación o edición del ticket requiere confirmación explícita mediante los endpoints del backend.
        </p>
      </div>
    </div>
  );
}

export default AiRecommendationPanel;
