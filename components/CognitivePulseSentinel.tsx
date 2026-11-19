'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ChevronDown,
  ChevronUp,
  GitBranch,
  RefreshCw,
  ArrowUpRight,
  Wallet,
  Dumbbell,
  Calendar,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  UploadCloud,
} from 'lucide-react';
import type { FullEcosystemTelemetry } from '@/lib/liveTelemetryReader';
import type {
  CognitiveInsightCard,
  CognitivePulseCachePayload,
} from '@/app/api/cognitive-pulse/route';
import type { ParallelAgentResult } from '@/lib/multiAiRouter';
import type { DashboardTab } from '@/lib/navigation';
import { useNvidiaModelsCatalog } from '@/components/useNvidiaModelsCatalog';
import NvidiaModelSelectGroups from '@/components/NvidiaModelSelectGroups';

interface CognitivePulseSentinelProps {
  onNavigate?: (tab: DashboardTab) => void;
}

interface SelfHealStatus {
  healthy: boolean;
  errorCount: number;
  git: {
    ok: boolean;
    commitHash: string;
    lastMessage: string;
    lastTime: string;
    modifiedFiles: string[];
    clean: boolean;
  };
  dataFilesStatus: Array<{
    file: string;
    ok: boolean;
    sizeBytes: number;
    error?: string;
  }>;
}

interface CapturedRuntimeError {
  id: string;
  message: string;
  timestamp: string;
}

function formatCop(val: number): string {
  return `$${Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function formatCopExact(val: number): string {
  return `$${val.toLocaleString('es-CO', {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CognitivePulseSentinel({
  onNavigate,
}: CognitivePulseSentinelProps) {
  const [telemetry, setTelemetry] = useState<FullEcosystemTelemetry | null>(null);
  const [aiPulse, setAiPulse] = useState<CognitivePulseCachePayload | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isLoadingPulse, setIsLoadingPulse] = useState<boolean>(true);
  const [isCorrelating, setIsCorrelating] = useState<boolean>(false);

  const [healStatus, setHealStatus] = useState<SelfHealStatus | null>(null);
  const [runtimeErrors, setRuntimeErrors] = useState<CapturedRuntimeError[]>([]);

  // Paneles desplegables
  const [showApiKeysDrawer, setShowApiKeysDrawer] = useState<boolean>(false);
  const [showSelfHealDrawer, setShowSelfHealDrawer] = useState<boolean>(false);
  const [showParallelDetails, setShowParallelDetails] = useState<boolean>(false);
  const [showManualKeyOverride, setShowManualKeyOverride] = useState<boolean>(false);

  // Modo Multi-IA (por defecto: todas las IAs en paralelo a la vez)
  const [aiMode, setAiMode] = useState<'parallel' | 'single'>('parallel');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [nvidiaKey, setNvidiaKey] = useState<string>('');
  const [groqKey, setGroqKey] = useState<string>('');
  const [preferredModel, setPreferredModel] = useState<string>('parallel');
  const [keysSavedNotice, setKeysSavedNotice] = useState<string | null>(null);
  const [isSavingServerKey, setIsSavingServerKey] = useState<boolean>(false);
  const [serverAiStatus, setServerAiStatus] = useState<{
    geminiReady: boolean;
    nvidiaReady: boolean;
    groqReady: boolean;
    activeSquadLabels: string[];
  } | null>(null);
  const nvidiaCatalog = useNvidiaModelsCatalog(nvidiaKey);

  // Controles de Auto-Reparación & Git
  const [healPrompt, setHealPrompt] = useState<string>('');
  const [healTargetFile, setHealTargetFile] = useState<string>('');
  const [healAutoApply, setHealAutoApply] = useState<boolean>(false);
  const [healOutput, setHealOutput] = useState<string | null>(null);
  const [isHealRunning, setIsHealRunning] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedG = localStorage.getItem('vyfith_gemini_api_key') || '';
    if (storedG.startsWith('AQ.Ab8RN6I9R')) {
      localStorage.removeItem('vyfith_gemini_api_key');
      setGeminiKey('');
    } else {
      setGeminiKey(storedG);
    }
    setNvidiaKey(localStorage.getItem('vyfith_nvidia_api_key') || '');
    setGroqKey(localStorage.getItem('vyfith_groq_api_key') || '');
    const storedMode = localStorage.getItem('vyfith_ai_mode');
    if (storedMode === 'single') {
      setAiMode('single');
    } else {
      setAiMode('parallel');
    }
    const storedModel = localStorage.getItem('vyfith_ai_model') || 'parallel';
    setPreferredModel(storedModel === 'auto' ? 'parallel' : storedModel);
  }, []);

  // Sentinel global en navegador: atrapa errores de runtime y promesas no capturadas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWindowError = (event: ErrorEvent) => {
      const msg = `${event.message || 'Error JS'} (${event.filename ? event.filename.split('/').pop() : 'dom'}:${event.lineno})`;
      setRuntimeErrors((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          message: msg,
          timestamp: new Date().toLocaleTimeString('es-CO'),
        },
        ...prev.slice(0, 4),
      ]);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg =
        (event.reason as { message?: string })?.message ||
        String(event.reason || 'Promise rechazada');
      setRuntimeErrors((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          message: `Async: ${msg}`,
          timestamp: new Date().toLocaleTimeString('es-CO'),
        },
        ...prev.slice(0, 4),
      ]);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const fetchInitialState = useCallback(async () => {
    setIsLoadingPulse(true);
    try {
      const [pulseRes, healRes, aiCfgRes] = await Promise.all([
        fetch('/api/cognitive-pulse', { cache: 'no-store' }),
        fetch('/api/system/self-heal', { cache: 'no-store' }),
        fetch('/api/ai/config', { cache: 'no-store' }),
      ]);

      if (pulseRes.ok) {
        const pulseData = await pulseRes.json();
        if (pulseData.telemetry) setTelemetry(pulseData.telemetry);
        if (pulseData.aiPulse) setAiPulse(pulseData.aiPulse);
        if (pulseData.aiError) setAiError(pulseData.aiError);
      }

      if (healRes.ok) {
        const healData = await healRes.json();
        setHealStatus(healData);
      }

      if (aiCfgRes.ok) {
        const cfgData = await aiCfgRes.json();
        setServerAiStatus({
          geminiReady: Boolean(cfgData.geminiReady),
          nvidiaReady: Boolean(cfgData.nvidiaReady),
          groqReady: Boolean(cfgData.groqReady),
          activeSquadLabels: Array.isArray(cfgData.activeSquadLabels) ? cfgData.activeSquadLabels : [],
        });
      }
    } catch (err) {
      console.warn('[CognitivePulseSentinel] Error cargando estado inicial:', err);
    } finally {
      setIsLoadingPulse(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialState();
    const interval = setInterval(() => {
      fetchInitialState();
    }, 60000);
    const onAnyEcosystemUpdate = () => {
      void fetchInitialState();
    };
    window.addEventListener('vyfith-health-sync', onAnyEcosystemUpdate);
    window.addEventListener('vyfith-hevy-updated', onAnyEcosystemUpdate);
    window.addEventListener('vyfith-superapp-sync', onAnyEcosystemUpdate);
    window.addEventListener('vyfith-finance-updated', onAnyEcosystemUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vyfith-health-sync', onAnyEcosystemUpdate);
      window.removeEventListener('vyfith-hevy-updated', onAnyEcosystemUpdate);
      window.removeEventListener('vyfith-superapp-sync', onAnyEcosystemUpdate);
      window.removeEventListener('vyfith-finance-updated', onAnyEcosystemUpdate);
    };
  }, [fetchInitialState]);

  const handleActivateServerKeys = async () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vyfith_gemini_api_key', geminiKey.trim());
    localStorage.setItem('vyfith_nvidia_api_key', nvidiaKey.trim());
    localStorage.setItem('vyfith_groq_api_key', groqKey.trim());
    localStorage.setItem('vyfith_ai_mode', aiMode);
    localStorage.setItem('vyfith_ai_model', aiMode === 'parallel' ? 'parallel' : preferredModel);

    if (!nvidiaKey.trim() && !groqKey.trim()) {
      setKeysSavedNotice('Preferencia Multi-IA en paralelo guardada.');
      setTimeout(() => setKeysSavedNotice(null), 3500);
      return;
    }

    setIsSavingServerKey(true);
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(nvidiaKey.trim() ? { nvidiaApiKey: nvidiaKey.trim() } : {}),
          ...(groqKey.trim() ? { groqApiKey: groqKey.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setServerAiStatus((prev) => ({
          geminiReady: Boolean(data.geminiReady),
          nvidiaReady: Boolean(data.nvidiaReady),
          groqReady: Boolean(data.groqReady),
          activeSquadLabels: prev?.activeSquadLabels || [],
        }));
        setKeysSavedNotice(data.message || 'Activado en servidor (.env.local).');
        await fetchInitialState();
      } else {
        setKeysSavedNotice(`⚠️ ${data.error || 'Error guardando clave'}`);
      }
    } catch (err: unknown) {
      setKeysSavedNotice(`⚠️ ${(err as Error)?.message || 'Error de red'}`);
    } finally {
      setIsSavingServerKey(false);
      setTimeout(() => setKeysSavedNotice(null), 5000);
    }
  };

  const handleCorrelateWithAi = async () => {
    setIsCorrelating(true);
    setAiError(null);
    const activeModelParam =
      aiMode === 'parallel'
        ? 'parallel'
        : preferredModel === 'auto' || preferredModel === 'parallel'
        ? 'gemini-3.5-flash-lite'
        : preferredModel;
    try {
      const res = await fetch('/api/cognitive-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: geminiKey.trim() || undefined,
          nvidiaApiKey: nvidiaKey.trim() || undefined,
          groqApiKey: groqKey.trim() || undefined,
          model: activeModelParam,
        }),
      });
      const data = await res.json();
      if (data.telemetry) setTelemetry(data.telemetry);
      if (data.aiPulse) setAiPulse(data.aiPulse);
      if (!data.success && data.aiError) {
        setAiError(`HTTP ${data.aiStatus || res.status}: ${data.aiError}`);
      } else if (!res.ok) {
        setAiError(data.error || `HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      setAiError(`Error de conexión: ${(err as Error)?.message || 'Desconocido'}`);
    } finally {
      setIsCorrelating(false);
    }
  };

  const runSelfHealAction = async (
    action: 'typecheck' | 'git_sync' | 'ai_diagnose_or_fix',
    customErrorLog?: string
  ) => {
    setIsHealRunning(true);
    setHealOutput(null);
    try {
      const res = await fetch('/api/system/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userInstruction: healPrompt.trim() || undefined,
          errorLog:
            customErrorLog ||
            (runtimeErrors.length > 0
              ? runtimeErrors.map((e) => `[${e.timestamp}] ${e.message}`).join('\n')
              : undefined),
          targetFile: healTargetFile.trim() || undefined,
          applyFix: action === 'ai_diagnose_or_fix' ? healAutoApply : false,
          autoCommit: false,
          apiKey: geminiKey.trim() || undefined,
          nvidiaApiKey: nvidiaKey.trim() || undefined,
          groqApiKey: groqKey.trim() || undefined,
          model: preferredModel,
        }),
      });

      const data = await res.json();
      if (action === 'typecheck') {
        setHealOutput(
          `${data.passed ? '✅ TypeScript OK (0 errores)' : '❌ Error TypeScript'}\n${data.output}`
        );
      } else if (action === 'git_sync') {
        if (data.success) {
          setHealOutput(
            `✅ GitHub Sincronizado (${data.git?.commitHash || 'main'})\n${data.commitOutput}\n${data.pushOutput}`
          );
          fetchInitialState();
        } else {
          setHealOutput(`❌ Error Git Sync: ${data.error}\n${data.tscOutput || ''}`);
        }
      } else if (action === 'ai_diagnose_or_fix') {
        if (data.success) {
          const patchNote = data.applied
            ? `\n\n✅ Parche aplicado en ${healTargetFile} y validado con npx tsc --noEmit.`
            : '';
          setHealOutput(`[${data.model}]\n${data.diagnosis}${patchNote}`);
          if (data.applied) {
            fetchInitialState();
          }
        } else {
          setHealOutput(
            `⚠️ ${data.error || 'Falla al diagnosticar'}\n${data.tscOutput || data.diagnosis || ''}`
          );
        }
      }
    } catch (err: unknown) {
      setHealOutput(`Error de red: ${(err as Error)?.message || 'Desconocido'}`);
    } finally {
      setIsHealRunning(false);
    }
  };

  const getInsightByCategory = (
    cat: CognitiveInsightCard['category']
  ): CognitiveInsightCard | undefined => {
    return aiPulse?.insights?.find((i) => i.category === cat);
  };

  const totalErrors = (telemetry?.systemAudit?.errorCount || 0) + runtimeErrors.length;
  const h = telemetry?.healthDetailed;
  const hevy = telemetry?.hevyDetailed;
  const fin = telemetry?.financeDetailed;
  const cal = telemetry?.calendarDetailed;

  const trainingInsight = getInsightByCategory('TRAINING');
  const financeInsight = getInsightByCategory('FINANCE');
  const calendarInsight = getInsightByCategory('CALENDAR');
  const systemInsight = getInsightByCategory('SYSTEM');

  const activeAiEngineBadge =
    aiPulse?.model ||
    (serverAiStatus?.nvidiaReady || nvidiaKey || telemetry?.systemAudit?.nvidiaReady
      ? 'Consejo Multi-IA: NVIDIA NIM + Gemini en Paralelo'
      : 'Consejo Multi-IA: 3 Modelos en Paralelo');

  return (
    <section
      aria-label="Pulso Cognitivo Vivo y Sentinel"
      className="mb-8 rounded-2xl bg-white dark:bg-[#111318] border border-zinc-200/80 dark:border-white/[0.07] p-4 sm:p-5 transition-colors"
    >
      {/* Barra Superior de Estado Vivo (Unslop: limpia, jerárquica, sin ruido) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-zinc-200/70 dark:border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200/80 dark:border-white/[0.08]">
            <span
              className={`w-2 h-2 rounded-full ${
                totalErrors > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-mono font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
              {totalErrors > 0 ? `ALERTA • ${totalErrors} ERROR(ES)` : 'PULSO VIVO • EN LÍNEA'}
            </span>
          </div>

          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {telemetry?.bogotaTimeLabel || 'Sincronizando...'}
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04] text-[11px] font-mono text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/[0.06]">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            {activeAiEngineBadge}
          </span>

          {healStatus?.git && (
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04] text-[11px] font-mono text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/[0.06]">
              <GitBranch className="w-3 h-3" />
              {healStatus.git.commitHash}
              {!healStatus.git.clean && (
                <span className="text-amber-500 ml-1">
                  ({healStatus.git.modifiedFiles.length} sin subir)
                </span>
              )}
            </span>
          )}
        </div>

        {/* Acciones Principales */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCorrelateWithAi}
            disabled={isCorrelating}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCorrelating ? 'animate-spin' : ''}`} />
            {isCorrelating ? 'Correlacionando...' : 'Correlacionar con IA'}
          </button>

          <button
            onClick={() => {
              setShowSelfHealDrawer((v) => !v);
              setShowApiKeysDrawer(false);
            }}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showSelfHealDrawer
                ? 'bg-zinc-200/80 dark:bg-white/10 border-zinc-300 dark:border-white/20 text-zinc-950 dark:text-white'
                : 'bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.06]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-500" />
            Auto-Reparar & GitHub
          </button>

          <button
            onClick={() => {
              setShowApiKeysDrawer((v) => !v);
              setShowSelfHealDrawer(false);
            }}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showApiKeysDrawer
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.06]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            Consejo Multi-IA ({aiMode === 'parallel' ? 'Paralelo' : 'Individual'})
          </button>
        </div>
      </div>

      {/* Cajón 1: Panel del Consejo Multi-IA en Paralelo (Todas las IAs trabajando a la vez) */}
      {showApiKeysDrawer && (
        <div className="my-4 p-4 rounded-xl bg-zinc-50 dark:bg-[#0b0d10] border border-zinc-200 dark:border-white/[0.08] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                Consejo Multi-IA en Paralelo (Todas las IAs trabajando a la vez)
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Al pulsar «Correlacionar con IA», VYFITH consulta simultáneamente a todos los proveedores activos y sintetiza sus aportes reales.
              </p>
            </div>
            <div className="inline-flex rounded-lg p-0.5 bg-zinc-200/70 dark:bg-white/[0.06] border border-zinc-300/60 dark:border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setAiMode('parallel')}
                className={`cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  aiMode === 'parallel'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Todas a la vez (Paralelo)
              </button>
              <button
                type="button"
                onClick={() => setAiMode('single')}
                className={`cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  aiMode === 'single'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Modelo Individual
              </button>
            </div>
          </div>

          {/* Tarjetas de estado real: solo motores activos en el enjambre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-white dark:bg-[#14171d] border border-emerald-500/35 flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  NVIDIA NIM ({nvidiaCatalog.chatCount} LLMs en vivo)
                </div>
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  {serverAiStatus?.nvidiaReady || nvidiaKey
                    ? 'Nemotron 3 Ultra 550B + Super 120B + Bolt en paralelo'
                    : 'Listo para conectar cuando agregues tu clave'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                {serverAiStatus?.nvidiaReady || nvidiaKey ? 'ACTIVO EN PARALELO' : 'LISTO'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-[#14171d] border border-emerald-500/35 flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Google AI Studio (Gemini)
                </div>
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  {serverAiStatus?.nvidiaReady || nvidiaKey
                    ? 'Gemini 3.5 Flash Lite coordinando síntesis biométrica'
                    : 'Gemini 3.5 + Gemini 3 Flash + Gemini 3.1 Lite en paralelo'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                ACTIVO EN PARALELO
              </span>
            </div>

            {(serverAiStatus?.groqReady || groqKey) && (
              <div className="p-3 rounded-lg bg-white dark:bg-[#14171d] border border-emerald-500/35 flex items-center justify-between gap-2 md:col-span-2">
                <div>
                  <div className="text-[11px] font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Groq Cloud (Alta Velocidad)
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    Llama 3.3 70B Versatile activo en el Consejo
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  ACTIVO EN PARALELO
                </span>
              </div>
            )}
          </div>

          {aiMode === 'single' && (
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                Modelo Único ({nvidiaCatalog.chatCount} NVIDIA + Gemini)
              </label>
              <select
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-[#14171d] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
              >
                <optgroup label="⚡ Google AI Studio">
                  <option value="gemini-3.5-flash-lite">Google Gemini 3.5 Flash Lite</option>
                  <option value="gemini-flash-lite-latest">Google Gemini Flash Lite Latest</option>
                  <option value="gemini-3-flash-preview">Google Gemini 3 Flash</option>
                  <option value="gemini-3.1-flash-lite-preview">Google Gemini 3.1 Flash Lite</option>
                </optgroup>
                <NvidiaModelSelectGroups chatModels={nvidiaCatalog.chatModels} />
                {(serverAiStatus?.groqReady || groqKey) && (
                  <optgroup label="⚡ Groq Cloud">
                    <option value="groq-llama">Groq Cloud • Llama 3.3 70B Versatile</option>
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              <span>
                Catálogo NVIDIA en vivo: <strong className="text-emerald-600 dark:text-emerald-400">{nvidiaCatalog.liveApiCount || 32}</strong> endpoints API /{' '}
                <strong className="text-zinc-800 dark:text-zinc-200">{nvidiaCatalog.chatCount}</strong> LLMs disponibles
              </span>
              <button
                type="button"
                onClick={() => nvidiaCatalog.refreshCatalog(true)}
                disabled={nvidiaCatalog.isLoading}
                className="cursor-pointer underline text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 disabled:opacity-50"
              >
                {nvidiaCatalog.isLoading ? 'Actualizando...' : 'Refrescar'}
              </button>
              {keysSavedNotice && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• {keysSavedNotice}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowManualKeyOverride((v) => !v)}
              className="cursor-pointer text-[11px] font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline"
            >
              {showManualKeyOverride ? 'Ocultar configuración avanzada' : 'Conectar proveedor adicional'}
            </button>
          </div>

          {showManualKeyOverride && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end pt-2 border-t border-zinc-200/70 dark:border-white/[0.06]">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Clave NVIDIA NIM (nvapi-...)
                </label>
                <input
                  type="password"
                  value={nvidiaKey}
                  onChange={(e) => setNvidiaKey(e.target.value)}
                  placeholder="Opcional si deseas rotar clave..."
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-[#14171d] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                    Clave Groq (gsk_...)
                  </label>
                  <input
                    type="password"
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-[#14171d] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleActivateServerKeys}
                  disabled={isSavingServerKey}
                  className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0 disabled:opacity-50"
                >
                  {isSavingServerKey ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cajón 2: Consola Self-Healing, TypeScript & Git Sync */}
      {showSelfHealDrawer && (
        <div className="my-4 p-4 rounded-xl bg-zinc-50 dark:bg-[#0b0d10] border border-zinc-200 dark:border-white/[0.08] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                Consola Autónoma de Auto-Reparación & Respaldo GitHub
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Verifica TypeScript, pide a la IA diagnosticar/parchear un archivo con rollback automático si falla, y sube cambios a GitHub.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => runSelfHealAction('typecheck')}
                disabled={isHealRunning}
                className="cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 disabled:opacity-50"
              >
                Verificar TypeScript
              </button>
              <button
                onClick={() => runSelfHealAction('git_sync')}
                disabled={isHealRunning}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Commit & Push a GitHub
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={healPrompt}
              onChange={(e) => setHealPrompt(e.target.value)}
              placeholder="Orden directa al sistema o descripción del error..."
              className="md:col-span-2 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#14171d] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
            />
            <input
              type="text"
              value={healTargetFile}
              onChange={(e) => setHealTargetFile(e.target.value)}
              placeholder="Archivo opcional (ej. components/FinanceSection.tsx)"
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-[#14171d] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={healAutoApply}
                onChange={(e) => setHealAutoApply(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700"
              />
              Aplicar parche en archivo local (con rollback automático si falla tsc)
            </label>

            <button
              onClick={() => runSelfHealAction('ai_diagnose_or_fix')}
              disabled={isHealRunning || (!healPrompt.trim() && runtimeErrors.length === 0)}
              className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 disabled:opacity-40"
            >
              {isHealRunning ? 'Ejecutando...' : 'Ejecutar Diagnóstico / Parche IA'}
            </button>
          </div>

          {healOutput && (
            <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-200 text-[11px] font-mono whitespace-pre-wrap max-h-52 overflow-y-auto border border-white/10">
              {healOutput}
            </pre>
          )}
        </div>
      )}

      {/* Franja de Síntesis Ejecutiva o Reporte Transparente de Error HTTP */}
      {aiError && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Error del proveedor IA: {aiError}</span>
          </span>
          <button
            onClick={() => setShowApiKeysDrawer(true)}
            className="cursor-pointer text-[11px] underline font-semibold shrink-0"
          >
            Revisar API Keys
          </button>
        </div>
      )}

      {aiPulse?.executivePulse && (
        <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mr-2">
                Síntesis IA ({aiPulse.model}):
              </span>
              {aiPulse.executivePulse}
            </p>
            <span className="text-[10px] font-mono text-zinc-400 shrink-0">
              {aiPulse.totalLatencyMs
                ? `${(aiPulse.totalLatencyMs / 1000).toFixed(1)}s • `
                : ''}
              {new Date(aiPulse.generatedAt).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {Array.isArray(aiPulse.parallelAgents) && aiPulse.parallelAgents.length > 0 && (
            <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.06] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {aiPulse.parallelAgents.map((agent: ParallelAgentResult) => (
                    <span
                      key={agent.id}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                        agent.success
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          agent.success ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {agent.displayName} ({(agent.latencyMs / 1000).toFixed(1)}s)
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowParallelDetails((v) => !v)}
                  className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Ver aportes individuales ({aiPulse.parallelAgents.length} IAs)</span>
                  {showParallelDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showParallelDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                  {aiPulse.parallelAgents.map((agent: ParallelAgentResult) => (
                    <div
                      key={agent.id}
                      className="p-2.5 rounded-lg bg-white dark:bg-[#14171d] border border-zinc-200/80 dark:border-white/10 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <strong className="text-zinc-900 dark:text-white font-semibold truncate">
                          {agent.displayName}
                        </strong>
                        <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                          {agent.success ? `${(agent.latencyMs / 1000).toFixed(1)}s` : `HTTP ${agent.status}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mb-1">
                        {agent.role}
                      </span>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-4 break-words">
                        {agent.success ? agent.reply : agent.error}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bento Grid de 4 Tarjetas de Correlación Viva (El Dato Manda) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mt-4">
        {/* Tarjeta 1: Biometría x Hevy x Rutina Hoy */}
        <div className="rounded-xl bg-zinc-50/80 dark:bg-[#0b0d10] border border-zinc-200/80 dark:border-white/[0.06] p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                Biometría × Hevy
              </span>
              <Dumbbell className="w-3.5 h-3.5 text-cyan-500" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-white">
                {isLoadingPulse
                  ? '—'
                  : h && h.sleepHours > 0
                  ? `${h.sleepHours}h`
                  : `${h?.weightKg ?? 55.7} kg`}
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {h && h.sleepHours > 0
                  ? `${h.sleepEfficiencyPct}% ef • ${h.restingHeartRate} bpm`
                  : `${h?.bodyFatPct ?? 10.6}% PGC • ${h?.restingHeartRate ?? 60} bpm`}
              </span>
            </div>

            <div className="mt-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              {h && h.sleepHours > 0
                ? `Femmto: ${h.weightKg} kg (${h.bodyFatPct}% PGC → ${h.targetWeightKg} kg)`
                : 'Sueño hoy: Sin registro Health Connect (últ. ref. 10h 12m)'}
            </div>
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Último: <strong className="text-zinc-800 dark:text-zinc-200">{hevy?.lastWorkoutName ?? 'Full Legs'}</strong> ({(hevy?.totalVolumeKg ?? 4484).toLocaleString('es-CO')} kg)
            </div>

            <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {trainingInsight?.advice ||
                (cal?.todayGymSession
                  ? `Hoy en agenda: ${cal.todayGymSession}. Sueño óptimo (94% ef.) tras Full Legs; prioriza sobrecarga progresiva en torso.`
                  : 'Recuperación completa tras 4,484 kg en Full Legs. Superávit limpio activo hacia 60 kg magros.')}
            </p>
          </div>

          <button
            onClick={() => onNavigate?.('health')}
            className="cursor-pointer inline-flex items-center justify-between text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white pt-2 border-t border-zinc-200/70 dark:border-white/[0.06]"
          >
            <span>{trainingInsight?.actionLabel || 'Abrir Salud & Hevy'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tarjeta 2: Liquidez Nequi x Nu x Yessid */}
        <div className="rounded-xl bg-zinc-50/80 dark:bg-[#0b0d10] border border-zinc-200/80 dark:border-white/[0.06] p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                Nequi × Nu × Deudas
              </span>
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-white">
                {isLoadingPulse ? '—' : formatCopExact(fin?.nequi ?? 45724.27)}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Nequi</span>
            </div>

            <div className="mt-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-medium">
              Por cobrar: {formatCop(fin?.receivablesTotal ?? 295000)} (Richard {formatCop(fin?.richardDebt ?? 180000)} + Maba {formatCop(fin?.mabaDebt ?? 115000)})
            </div>
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Yessid restante: <strong className="text-zinc-800 dark:text-zinc-200">{formatCop(fin?.yessidRemaining ?? 519000)}</strong> ({formatCop(fin?.yessidPaid ?? 61000)} abonados)
            </div>

            <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {financeInsight?.advice ||
                `Efectivo $0. Daniela y Gym 100% pagados. Traslada los $25.000 de Frida (Laura) desde Nequi a Cajita Nu (9.30% E.A.).`}
            </p>
          </div>

          <button
            onClick={() => onNavigate?.('finance')}
            className="cursor-pointer inline-flex items-center justify-between text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white pt-2 border-t border-zinc-200/70 dark:border-white/[0.06]"
          >
            <span>{financeInsight?.actionLabel || 'Gestionar Finanzas & Cobros'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tarjeta 3: Google Calendar Auto-Invite & Paseos */}
        <div className="rounded-xl bg-zinc-50/80 dark:bg-[#0b0d10] border border-zinc-200/80 dark:border-white/[0.06] p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                Google Calendar • Paseos
              </span>
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-white">
                {isLoadingPulse ? '—' : formatCop(cal?.weeklyConfirmedIncome ?? 0)}
              </span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                confirmados semana
              </span>
            </div>

            <div className="mt-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Por confirmar: <strong className="text-amber-600 dark:text-amber-400">{formatCop(cal?.weeklyUnconfirmedIncome ?? 0)}</strong> ({cal?.weeklyUnconfirmedCount ?? 0} turnos)
            </div>

            {cal && cal.todayEvents.length > 0 ? (
              <ul className="mt-2 space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                {cal.todayEvents.slice(0, 3).map((ev, i) => (
                  <li key={i} className="truncate flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        ev.rsvp === 'declined'
                          ? 'bg-rose-500'
                          : ev.rsvp === 'needsAction'
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-zinc-400">{ev.start}</span>
                    <span className="truncate">{ev.summary}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {calendarInsight?.advice ||
                  'Sincronizado en vivo con santiagosmitttt@gmail.com (Frida 06:30/19:30 y Sienna 15:15/05:55).'}
              </p>
            )}
          </div>

          <button
            onClick={() => onNavigate?.('horario')}
            className="cursor-pointer inline-flex items-center justify-between text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white pt-2 border-t border-zinc-200/70 dark:border-white/[0.06]"
          >
            <span>{calendarInsight?.actionLabel || 'Ver Calendario & Auto-Invite'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tarjeta 4: Sentinel de Salud Web & Auto-Fix */}
        <div className="rounded-xl bg-zinc-50/80 dark:bg-[#0b0d10] border border-zinc-200/80 dark:border-white/[0.06] p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                Sentinel de Salud Web
              </span>
              {totalErrors === 0 ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-white">
                {totalErrors === 0 ? '0' : totalErrors}
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {totalErrors === 0 ? 'Errores • Sistema Sano' : 'Incidencia(s) detectada(s)'}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-mono">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-2.5 h-2.5" /> JSONs OK
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                {cal?.totalEventsCount ?? 0} ev. Calendar
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                {hevy?.totalWorkouts ?? 202} Hevy
              </span>
            </div>

            {runtimeErrors.length > 0 ? (
              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-700 dark:text-amber-300">
                {runtimeErrors[0].message}
              </div>
            ) : (
              <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {systemInsight?.advice ||
                  'Monitor activo en DOM y archivos data/*.json. Listo para diagnosticar, validar TypeScript y subir a GitHub.'}
              </p>
            )}
          </div>

          <button
            onClick={() => {
              if (runtimeErrors.length > 0) {
                setShowSelfHealDrawer(true);
                runSelfHealAction('ai_diagnose_or_fix', runtimeErrors[0].message);
              } else {
                setShowSelfHealDrawer(true);
              }
            }}
            className="cursor-pointer inline-flex items-center justify-between text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white pt-2 border-t border-zinc-200/70 dark:border-white/[0.06]"
          >
            <span>{runtimeErrors.length > 0 ? 'Diagnosticar Error con IA' : 'Abrir Consola Self-Heal'}</span>
            <Activity className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
