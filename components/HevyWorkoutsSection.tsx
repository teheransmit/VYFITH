'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Dumbbell,
  Clock,
  TrendingUp,
  Check,
  MessageSquare,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Flame,
  Search,
  Award,
  Layers,
  ArrowUpRight,
  Share2,
  Heart,
  Calendar,
  Sparkles,
  Bot,
  BookOpen,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Watch,
  Activity,
  Link2,
  Unlink,
  Zap,
} from 'lucide-react';
import {
  initialHevySessions,
  HevyWorkoutSession,
  WatchExerciseSession,
} from '@/lib/hevyStore';
import {
  generateAiCoachPrescription,
  WorkoutRoutinePrescription,
  ExercisePrescription,
} from '@/lib/aiCoachPeriodizationEngine';
import { findKnownRoutine, translateExerciseTitle } from '@/lib/hevyDateParser';

export default function HevyWorkoutsSection() {
  const [sessions, setSessions] = useState<HevyWorkoutSession[]>(initialHevySessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialHevySessions[0]?.id || ''
  );
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllWorkoutsModal, setShowAllWorkoutsModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(3);
  const [isSyncingHevy, setIsSyncingHevy] = useState(false);
  const [isConnectingBrowser, setIsConnectingBrowser] = useState(false);
  const [syncActionResult, setSyncActionResult] = useState<{
    syncedToHevy: boolean;
    savedLocally?: boolean;
    method?: string;
    requiresLogin?: boolean;
    routineUrl?: string;
    editUrl?: string;
    message: string;
    modifiedCount?: number;
  } | null>(null);
  const [syncStatusInfo, setSyncStatusInfo] = useState<{
    sourceUsed: string;
    addedCount: number;
    requiresBrowserAuth: boolean;
    hasProApiKey: boolean;
    browserBridgeAuthenticated: boolean;
    remoteWorkoutCount?: number | null;
    pendingRemoteDiff?: number;
    lastSyncAt?: string | null;
    warning?: string;
  } | null>(null);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [watchSessions, setWatchSessions] = useState<WatchExerciseSession[]>([]);
  const [isFusingWatch, setIsFusingWatch] = useState(false);
  const [fusionMessage, setFusionMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);
  const [showManualWatchLink, setShowManualWatchLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watchFileInputRef = useRef<HTMLInputElement>(null);

  const fusedWorkoutsCount = useMemo(
    () => sessions.filter((s) => Boolean(s.watchBiometrics)).length,
    [sessions]
  );

  const formatOffsetLabel = (sec: number): string => {
    if (sec === 0) return '0s (exacto)';
    const abs = Math.abs(sec);
    const sign = sec < 0 ? '-' : '+';
    if (abs < 60) return `${sign}${abs}s`;
    const mins = Math.floor(abs / 60);
    const rem = abs % 60;
    return rem > 0 ? `${sign}${mins}m ${rem}s` : `${sign}${mins}m`;
  };

  const cleanHevyWarning = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    const stripped = raw
      .replace(/\x1b\[[0-9;]*m/g, '')
      .replace(/\[\d+m/g, '')
      .trim();
    if (
      /Abriendo en una sesi/i.test(stripped) ||
      /existing browser session/i.test(stripped) ||
      /Target page, context or browser has been closed/i.test(stripped) ||
      /launchPersistentContext/i.test(stripped)
    ) {
      return 'La ventana de Chrome de Hevy Web se cerró o ya estaba abierta en segundo plano. Pulsa «Conectar Hevy Web» una sola vez e inicia sesión.';
    }
    return stripped.split(/Browser logs:|Call log:|\r?\n/)[0].trim().slice(0, 240);
  };

  // Cargar entrenamientos desde API real (/api/sync/hevy). Si live=true, extrae desde Hevy Web/API.
  const refreshWorkouts = async (live = false) => {
    if (isConnectingBrowser && live) return;
    setIsLoadingWorkouts(true);
    try {
      const res = await fetch(`/api/sync/hevy${live ? '?live=1' : ''}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.workouts && Array.isArray(data.workouts) && data.workouts.length > 0) {
          setSessions(data.workouts);
          setSelectedSessionId((prev) => {
            if (!prev || data.addedCount > 0 || !data.workouts.some((w: any) => w.id === prev)) {
              return data.workouts[0].id;
            }
            return prev;
          });
          window.dispatchEvent(new CustomEvent('vyfith-hevy-updated'));
        }
        if (Array.isArray(data.watchSessions)) {
          setWatchSessions(data.watchSessions);
        }
        setSyncStatusInfo({
          sourceUsed: data.sourceUsed || 'local_cache',
          addedCount: data.addedCount || 0,
          requiresBrowserAuth: Boolean(data.requiresBrowserAuth),
          hasProApiKey: Boolean(data.hasProApiKey),
          browserBridgeAuthenticated: Boolean(data.browserBridgeAuthenticated),
          remoteWorkoutCount: typeof data.remoteWorkoutCount === 'number' ? data.remoteWorkoutCount : null,
          pendingRemoteDiff: typeof data.pendingRemoteDiff === 'number' ? data.pendingRemoteDiff : 0,
          lastSyncAt: data.syncMeta?.lastSyncAt || null,
          warning: cleanHevyWarning(data.warning),
        });
      }
    } catch (e) {
      console.warn('Error consultando /api/sync/hevy:', e);
    } finally {
      setIsLoadingWorkouts(false);
    }
  };

  useEffect(() => {
    refreshWorkouts(false);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !isConnectingBrowser) {
        refreshWorkouts(false);
      }
    };
    const onExternalUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      if (detail?.fromCloudBridge && !isConnectingBrowser) {
        refreshWorkouts(false);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('vyfith-hevy-updated', onExternalUpdate);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('vyfith-hevy-updated', onExternalUpdate);
    };
  }, [isConnectingBrowser]);

  const handleAutoFuseWatch = async () => {
    if (isFusingWatch) return;
    setIsFusingWatch(true);
    setFusionMessage(null);
    try {
      const res = await fetch('/api/sync/hevy/fuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_fuse' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.workouts) && data.workouts.length > 0) {
          setSessions(data.workouts);
        }
        if (Array.isArray(data.watchSessions)) {
          setWatchSessions(data.watchSessions);
        }
        setFusionMessage({
          type: data.newlyFusedCount > 0 || data.fusedWorkoutsCount > 0 ? 'success' : 'info',
          text: data.message || 'Sincronización con sesiones del reloj completada.',
        });
      } else {
        setFusionMessage({
          type: 'error',
          text: data.error || `Error HTTP ${res.status} al fusionar con reloj.`,
        });
      }
    } catch (err: any) {
      setFusionMessage({
        type: 'error',
        text: `Error de red al fusionar reloj: ${err?.message || 'desconocido'}`,
      });
    } finally {
      setIsFusingWatch(false);
    }
  };

  const handleManualFuseWatch = async (hevyWorkoutId: string, watchSessionId: string) => {
    setIsFusingWatch(true);
    setFusionMessage(null);
    try {
      const res = await fetch('/api/sync/hevy/fuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'manual_fuse', hevyWorkoutId, watchSessionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.workouts)) setSessions(data.workouts);
        if (Array.isArray(data.watchSessions)) setWatchSessions(data.watchSessions);
        setShowManualWatchLink(false);
        setFusionMessage({
          type: 'success',
          text: data.message || 'Sesión del reloj fusionada manualmente.',
        });
      } else {
        setFusionMessage({
          type: 'error',
          text: data.error || 'No se pudo vincular la sesión del reloj.',
        });
      }
    } catch (err: any) {
      setFusionMessage({
        type: 'error',
        text: `Error vinculando reloj: ${err?.message || 'desconocido'}`,
      });
    } finally {
      setIsFusingWatch(false);
    }
  };

  const handleUnfuseWatch = async (hevyWorkoutId: string) => {
    setIsFusingWatch(true);
    setFusionMessage(null);
    try {
      const res = await fetch('/api/sync/hevy/fuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unfuse', hevyWorkoutId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.workouts)) setSessions(data.workouts);
        setFusionMessage({ type: 'info', text: data.message || 'Sesión desvinculada.' });
      }
    } finally {
      setIsFusingWatch(false);
    }
  };

  const handleWatchFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsFusingWatch(true);
    setFusionMessage(null);
    try {
      const content = await file.text();
      const res = await fetch('/api/sync/hevy/fuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ingest_watch_sessions',
          fileContent: content,
          filename: file.name,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.workouts)) setSessions(data.workouts);
        if (Array.isArray(data.watchSessions)) setWatchSessions(data.watchSessions);
        setFusionMessage({
          type: 'success',
          text: data.message || 'Archivo del reloj importado y fusionado.',
        });
      } else {
        setFusionMessage({
          type: 'error',
          text: data.error || 'Formato de archivo del reloj no reconocido.',
        });
      }
    } catch (err: any) {
      setFusionMessage({
        type: 'error',
        text: `Error leyendo archivo del reloj: ${err?.message || 'desconocido'}`,
      });
    } finally {
      setIsFusingWatch(false);
      if (watchFileInputRef.current) watchFileInputRef.current.value = '';
    }
  };

  const selectedSession =
    sessions.find((s) => s.id === selectedSessionId) || sessions[0] || initialHevySessions[0];

  // Prescripción y análisis del Entrenador Personal IA calculada sobre las sesiones VIVAS
  const coachPrescription = useMemo(() => {
    try {
      return generateAiCoachPrescription(selectedSession.name, { workouts: sessions });
    } catch (e) {
      return null;
    }
  }, [selectedSession.name, sessions]);

  const handleConnectHevyBrowser = async () => {
    if (isConnectingBrowser || isLoadingWorkouts) return;
    setIsConnectingBrowser(true);
    setUploadSuccess(null);
    setSyncStatusInfo((prev) => ({
      sourceUsed: prev?.sourceUsed || 'local_cache',
      addedCount: prev?.addedCount || 0,
      requiresBrowserAuth: true,
      hasProApiKey: Boolean(prev?.hasProApiKey),
      browserBridgeAuthenticated: false,
      remoteWorkoutCount: prev?.remoteWorkoutCount ?? null,
      pendingRemoteDiff: prev?.pendingRemoteDiff ?? 0,
      lastSyncAt: prev?.lastSyncAt || null,
      warning: 'Se abrió la ventana independiente del navegador en hevy.com/login. Inicia sesión allí y el CSV se descargará e importará solo al terminar.',
    }));
    try {
      const res = await fetch('/api/sync/hevy/browser-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login' }),
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        if (Array.isArray(data.workouts) && data.workouts.length > 0) {
          setSessions(data.workouts);
          setSelectedSessionId(data.workouts[0].id);
          window.dispatchEvent(new CustomEvent('vyfith-hevy-updated'));
          setUploadSuccess(
            `Conectado a Hevy Web (${data.accountName || '@teheransmit'}) • ${data.workouts.length} entrenamientos sincronizados (+${data.addedCount || 0} nuevos).`
          );
          setSyncStatusInfo((prev) => ({
            sourceUsed: 'hevy_web_live_export',
            addedCount: data.addedCount || 0,
            requiresBrowserAuth: false,
            hasProApiKey: Boolean(prev?.hasProApiKey),
            browserBridgeAuthenticated: true,
            remoteWorkoutCount: typeof data.remoteWorkoutCount === 'number' ? data.remoteWorkoutCount : data.workouts.length,
            pendingRemoteDiff: typeof data.pendingRemoteDiff === 'number' ? data.pendingRemoteDiff : 0,
            lastSyncAt: new Date().toISOString(),
            warning: undefined,
          }));
        } else {
          await refreshWorkouts(true);
        }
      } else {
        const errMsg =
          cleanHevyWarning(data?.error) ||
          `Error HTTP ${res.status} conectando el puente Chrome Hevy Web.`;
        setSyncStatusInfo((prev) => ({
          sourceUsed: prev?.sourceUsed || 'local_cache',
          addedCount: prev?.addedCount || 0,
          requiresBrowserAuth: true,
          hasProApiKey: Boolean(prev?.hasProApiKey),
          browserBridgeAuthenticated: false,
          remoteWorkoutCount: prev?.remoteWorkoutCount ?? null,
          pendingRemoteDiff: prev?.pendingRemoteDiff ?? 0,
          lastSyncAt: prev?.lastSyncAt || null,
          warning: errMsg,
        }));
      }
    } catch (err: any) {
      setSyncStatusInfo((prev) => ({
        sourceUsed: prev?.sourceUsed || 'local_cache',
        addedCount: prev?.addedCount || 0,
        requiresBrowserAuth: true,
        hasProApiKey: Boolean(prev?.hasProApiKey),
        browserBridgeAuthenticated: false,
        remoteWorkoutCount: prev?.remoteWorkoutCount ?? null,
        pendingRemoteDiff: prev?.pendingRemoteDiff ?? 0,
        lastSyncAt: prev?.lastSyncAt || null,
        warning: `Error de red al conectar con Hevy Web: ${err?.message || 'desconocido'}`,
      }));
    } finally {
      setIsConnectingBrowser(false);
    }
  };

  const handleApplyToHevy = async () => {
    if (!coachPrescription) return;
    setIsSyncingHevy(true);
    setSyncActionResult(null);
    try {
      const payload = coachPrescription.prescriptions.map((p) => ({
        exerciseName: p.exerciseName,
        esTitle: translateExerciseTitle(p.exerciseName),
        suggestedWeightKg: p.prescribedWeightKg,
        suggestedWeightLbs: Math.round((p.prescribedWeightKg / 0.45359237) * 10) / 10,
        targetReps: p.prescribedRepsSummary,
        note: `VYFITH AI Coach: ${p.prescribedWeightKg} kg (${p.prescribedRepsSummary}) • RIR ${p.targetRir}`,
      }));

      const res = await fetch('/api/hevy/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineTitle: coachPrescription.routineName,
          hevySyncPayload: payload,
          prescriptions: coachPrescription.prescriptions,
        }),
      });
      const data = await res.json();
      setSyncActionResult({
        syncedToHevy: Boolean(data.syncedToHevy),
        savedLocally: Boolean(data.savedLocally),
        method: data.method,
        requiresLogin: Boolean(data.requiresLogin),
        routineUrl: data.routineUrl || findKnownRoutine(coachPrescription.routineName)?.routineUrl,
        editUrl: data.editUrl || findKnownRoutine(coachPrescription.routineName)?.editUrl,
        message: data.message || data.error || 'Respuesta sin confirmación de Hevy.',
        modifiedCount: Array.isArray(data.modifiedExercises) ? data.modifiedExercises.length : 0,
      });
    } catch (err: any) {
      setSyncActionResult({
        syncedToHevy: false,
        message: `Error de red al aplicar cargas: ${err?.message || 'desconocido'}`,
      });
    } finally {
      setIsSyncingHevy(false);
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatWeight = (kg: number, lbs?: number) => {
    if (unit === 'lbs') {
      const val = lbs ?? Math.round(kg * 2.20462 * 10) / 10;
      return `${val.toLocaleString()} lbs`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  const formatVolume = (kg: number, lbs?: number) => {
    if (unit === 'lbs') {
      const val = lbs ?? Math.round(kg * 2.20462);
      return `${val.toLocaleString()} lbs`;
    }
    return `${Math.round(kg).toLocaleString()} kg`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(null);

    try {
      const text = await file.text();
      const res = await fetch('/api/sync/hevy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.workouts && Array.isArray(data.workouts) && data.workouts.length > 0) {
          setSessions(data.workouts);
          setSelectedSessionId(data.workouts[0].id);
          window.dispatchEvent(new CustomEvent('vyfith-hevy-updated'));
          setUploadSuccess(
            `CSV sincronizado: ${data.addedCount || 0} nuevas sesiones agregadas (${data.totalCount || data.workouts.length} totales).`
          );
        } else {
          setUploadSuccess(`CSV procesado (${data.sessionsCount || 0} sesiones detectadas).`);
        }
      } else {
        const err = await res.json();
        alert(`Error al procesar CSV: ${err.error || 'Formato no reconocido'}`);
      }
    } catch (err: any) {
      alert(`Error al leer archivo: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadSuccess(null), 6000);
    }
  };

  const getMuscleBadgeColor = (group: string) => {
    switch (group) {
      case 'Pecho':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Espalda':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'Piernas':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Hombros':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Brazos':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getRpeBadgeColor = (rpe?: number) => {
    if (!rpe) return 'text-slate-400 bg-slate-800/40 border-slate-700';
    if (rpe >= 9.5) return 'text-rose-400 bg-rose-950/70 border-rose-800';
    if (rpe >= 8.5) return 'text-amber-400 bg-amber-950/70 border-amber-800';
    return 'text-emerald-400 bg-emerald-950/70 border-emerald-800';
  };

  return (
    <section id="hevy-workouts-section" className="w-full space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP BAR DESCOMPRIMIDA: PERFIL ATLETA + SELECTOR DE UNIDADES (IDÉNTICO A HEVY WEB) */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-7 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-[#27272a]">
          {/* Perfil del Atleta */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400 p-0.5 shrink-0 shadow-lg">
              <div className="w-full h-full bg-[#18181b] rounded-2xl flex items-center justify-center font-black text-base tracking-wider text-white">
                ST
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#18181b]" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Santiago Smit Teheran Mogollon
                </h3>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#27272a] text-slate-300 border border-[#3f3f46]">
                  @teheransmit
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                <span className="text-slate-300 font-bold">{sessions.length} Entrenamientos</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Gimnasio UPB Montería (Turno 4:00 PM)</span>
              </div>
            </div>
          </div>

          {/* Acciones & Toggle KG/LBS */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            {/* Toggle KG / LBS */}
            <div className="bg-[#09090b] p-1 rounded-xl border border-[#27272a] flex items-center text-xs font-mono shadow-inner">
              <button
                onClick={() => setUnit('kg')}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-black transition-all ${
                  unit === 'kg'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                onClick={() => setUnit('lbs')}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-black transition-all ${
                  unit === 'lbs'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                LBS
              </button>
            </div>

            {/* Sincronizar en Vivo desde Hevy Web / API PRO */}
            <button
              onClick={() => refreshWorkouts(true)}
              disabled={isLoadingWorkouts || isConnectingBrowser}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all shadow-xs disabled:opacity-50"
              title="Extrae y sincroniza en vivo todos los entrenamientos recientes desde Hevy Web o Hevy API PRO"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWorkouts ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isLoadingWorkouts ? 'Sincronizando...' : 'Sync en Vivo'}</span>
            </button>

            {/* Fusionar Hevy con Xiaomi Smart Band 9 Pro (Health Connect / Firestore) */}
            <button
              onClick={handleAutoFuseWatch}
              disabled={isFusingWatch}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-500/30 transition-all shadow-xs disabled:opacity-50"
              title="Fusiona automáticamente tus entrenamientos de Hevy con las sesiones de tu Xiaomi Smart Band 9 Pro por fecha y hora de inicio/fin"
            >
              <Watch className={`w-3.5 h-3.5 ${isFusingWatch ? 'animate-pulse text-cyan-400' : ''}`} />
              <span>
                {isFusingWatch
                  ? 'Fusionando...'
                  : fusedWorkoutsCount > 0
                  ? `Fusionar Reloj (${fusedWorkoutsCount})`
                  : 'Fusionar Reloj'}
              </span>
            </button>

            {!syncStatusInfo?.hasProApiKey && !syncStatusInfo?.browserBridgeAuthenticated && (
              <button
                onClick={handleConnectHevyBrowser}
                disabled={isConnectingBrowser || isLoadingWorkouts}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all shadow-xs disabled:opacity-50"
                title="Inicia sesión 1 sola vez en la ventana dedicada de Hevy; después VYFITH sincronizará solo automáticamente cada vez que detecte un entrenamiento nuevo (sin Antigravity ni tokens)."
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isConnectingBrowser ? 'Esperando Login...' : 'Conectar Hevy Web'}</span>
              </button>
            )}
            {!syncStatusInfo?.hasProApiKey && syncStatusInfo?.browserBridgeAuthenticated && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30"
                title="VYFITH descargará automáticamente cada nuevo entrenamiento sin abrir ventanas ni usar Antigravity"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Sync Hevy Web Activo</span>
              </span>
            )}

            {/* Subir workouts.csv */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold rounded-xl border border-[#3f3f46] transition-all shadow-xs disabled:opacity-50"
              title="Importar archivo workouts.csv de Hevy"
            >
              <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Procesando...' : 'Subir CSV'}</span>
            </button>

            {/* Abrir Hevy Web */}
            <a
              href="https://hevy.com/user/teheransmit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition-all shadow-xs"
            >
              <span>Hevy Web</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{uploadSuccess}</span>
          </div>
        )}

        {fusionMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 ${
              fusionMessage.type === 'success'
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
                : fusionMessage.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                : 'bg-slate-900/80 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Watch className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium break-words">{fusionMessage.text}</span>
            </div>
            <button
              onClick={() => setFusionMessage(null)}
              className="cursor-pointer px-2 py-0.5 rounded bg-black/30 hover:bg-black/50 text-xs font-bold shrink-0"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        )}

        {syncStatusInfo && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              syncStatusInfo.requiresBrowserAuth || syncStatusInfo.warning
                ? 'bg-amber-950/40 border-amber-800/70 text-amber-200'
                : 'bg-[#09090b]/80 border-[#27272a] text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {syncStatusInfo.requiresBrowserAuth || syncStatusInfo.warning ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="break-words">
                {syncStatusInfo.warning ? (
                  cleanHevyWarning(syncStatusInfo.warning)
                ) : (
                  <>
                    Fuente activa: <strong className="text-white">{syncStatusInfo.sourceUsed}</strong>
                    {syncStatusInfo.addedCount > 0 && ` (+${syncStatusInfo.addedCount} nuevos agregados)`}
                    {typeof syncStatusInfo.remoteWorkoutCount === 'number' && (
                      syncStatusInfo.pendingRemoteDiff && syncStatusInfo.pendingRemoteDiff > 0 ? (
                        <span className="ml-1.5 text-amber-300 font-bold">
                          • Hevy Web tiene {syncStatusInfo.remoteWorkoutCount} entrenamientos (faltan {syncStatusInfo.pendingRemoteDiff} nuevos)
                        </span>
                      ) : (
                        <span className="ml-1.5 text-emerald-300 font-bold">
                          • {sessions.length}/{syncStatusInfo.remoteWorkoutCount} al día con Hevy Web ✅
                        </span>
                      )
                    )}
                    {syncStatusInfo.hasProApiKey
                      ? ' • API Hevy PRO activa'
                      : syncStatusInfo.browserBridgeAuthenticated
                      ? ' • Puente Chromium Hevy Web conectado'
                      : ' • Cuenta Hevy Free (vigilando Descargas/Drive y CSV)'}
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-slate-400">
              {syncStatusInfo.lastSyncAt && (
                <span>Sync: {new Date(syncStatusInfo.lastSyncAt).toLocaleTimeString('es-CO')}</span>
              )}
              {syncStatusInfo.requiresBrowserAuth && (
                <button
                  onClick={handleConnectHevyBrowser}
                  disabled={isConnectingBrowser || isLoadingWorkouts}
                  className="cursor-pointer px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {isConnectingBrowser ? 'Esperando Login...' : 'Iniciar Sesión 1 Vez'}
                </button>
              )}
              {syncStatusInfo.warning && (
                <button
                  onClick={() =>
                    setSyncStatusInfo((prev) =>
                      prev ? { ...prev, warning: undefined, requiresBrowserAuth: false } : prev
                    )
                  }
                  className="cursor-pointer px-2 py-0.5 rounded bg-amber-900/50 hover:bg-amber-800/70 text-amber-200 font-bold"
                  title="Cerrar aviso"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. TIMELINE HORIZONTAL DE ENTRENAMIENTOS (CERO COMPRESIÓN) */}
        <div className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sesiones Recientes</span>
            </span>

            <button
              onClick={() => setShowAllWorkoutsModal(true)}
              className="cursor-pointer text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Ver todos los {sessions.length} entrenamientos</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Carrusel Horizontal de Píldoras de Sesión */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {sessions.slice(0, 10).map((sess) => {
              const isSelected = sess.id === selectedSession.id;
              const dateLabel = sess.date.includes(',') ? sess.date.split(',')[0] : sess.date;

              return (
                <button
                  key={sess.id}
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={`cursor-pointer px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all border text-left flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/30'
                      : 'bg-[#09090b]/80 text-slate-300 border-[#27272a] hover:bg-[#27272a] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold">{sess.name}</span>
                    {sess.watchBiometrics && (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}
                        title={`Fusionado con ${sess.watchBiometrics.watchDevice}`}
                      >
                        <Watch className="w-2.5 h-2.5" />
                        <span>
                          {sess.watchBiometrics.avgHeartRateBpm
                            ? `${sess.watchBiometrics.avgHeartRateBpm} bpm`
                            : 'Reloj'}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                    {dateLabel} • {formatVolume(sess.totalVolumeKg, sess.totalVolumeLbs)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. TARJETA PRINCIPAL DEL ENTRENAMIENTO ACTIVO (ANCHO COMPLETO - FORMATO HEVY POST) */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 text-white space-y-7 shadow-2xl">
        {/* Cabezote del Entrenamiento */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{selectedSession.date}</span>
              {selectedSession.startTimeLocal && selectedSession.endTimeLocal
                ? ` (${selectedSession.startTimeLocal} – ${selectedSession.endTimeLocal})`
                : ''}
            </span>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
              <Dumbbell className="w-3 h-3 text-rose-500" />
              <span>UPB Gym 4:00 PM</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {selectedSession.name}
          </h2>
        </div>

        {/* Barra de 4 Métricas Clave de Hevy */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-[#27272a]">
          <div className="p-4 rounded-2xl bg-[#09090b]/70 border border-[#27272a]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tiempo</span>
            <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{selectedSession.durationMinutes} min</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09090b]/70 border border-[#27272a]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Volumen Total</span>
            <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-rose-500" />
              <span>{formatVolume(selectedSession.totalVolumeKg, selectedSession.totalVolumeLbs)}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09090b]/70 border border-[#27272a]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Series Totales</span>
            <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>{selectedSession.totalSets} sets</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09090b]/70 border border-[#27272a]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">RPE Promedio</span>
            <div className="text-xl font-black text-amber-400 font-mono mt-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{selectedSession.rpeAverage ? selectedSession.rpeAverage.toFixed(1) : '8.5'} / 10</span>
            </div>
          </div>
        </div>

        {/* 3.0. FUSIÓN BIOMÉTRICA HEVY + RELOJ XIAOMI SMART BAND 9 PRO */}
        <input
          type="file"
          ref={watchFileInputRef}
          onChange={handleWatchFileImport}
          accept=".csv,.json"
          className="hidden"
        />
        {selectedSession.watchBiometrics ? (
          (() => {
            const wb = selectedSession.watchBiometrics!;
            const hrZones = wb.hrZoneMinutes;
            const totalZoneMins = hrZones
              ? hrZones.z1 + hrZones.z2 + hrZones.z3 + hrZones.z4 + hrZones.z5
              : 0;
            const confLabel =
              wb.matchConfidence === 'exact'
                ? `Emparejamiento Exacto • ${wb.overlapPct}% solapamiento`
                : wb.matchConfidence === 'high'
                ? `Alta Confianza • ${wb.overlapPct}% solapamiento`
                : wb.matchConfidence === 'manual'
                ? 'Vinculación Manual'
                : `Emparejamiento Temporal • ${wb.overlapPct}%`;

            return (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/55 via-[#0b1018] to-rose-950/35 border border-cyan-500/35 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                      <Watch className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                          Fusión Reloj + Hevy • {wb.watchDevice}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                          {confLabel}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-300 mt-1 break-words">
                        Sesión reloj: <strong className="text-cyan-200">{wb.watchTitle}</strong> ({wb.watchStartTime}–{wb.watchEndTime}, {wb.watchDurationMinutes} min) • Δ inicio: <strong className="text-white">{formatOffsetLabel(wb.startOffsetSeconds)}</strong> • Δ fin: <strong className="text-white">{formatOffsetLabel(wb.endOffsetSeconds)}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnfuseWatch(selectedSession.id)}
                    disabled={isFusingWatch}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#09090b]/80 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 text-xs font-bold border border-slate-700 hover:border-rose-500/40 transition-all shrink-0 self-start sm:self-center"
                    title="Desvincular datos del reloj de este entrenamiento"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Desvincular</span>
                  </button>
                </div>

                {/* 4 KPIs Cardiovasculares Fusionados */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#09090b]/75 border border-cyan-500/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      <span>FC Promedio</span>
                    </span>
                    <div className="text-lg font-black text-rose-300 font-mono mt-1">
                      {wb.avgHeartRateBpm !== null ? `${wb.avgHeartRateBpm} bpm` : 'Sin dato'}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {wb.minHeartRateBpm !== null ? `Mín: ${wb.minHeartRateBpm} bpm` : wb.watchSource}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#09090b]/75 border border-cyan-500/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3 h-3 text-amber-400" />
                      <span>FC Máxima</span>
                    </span>
                    <div className="text-lg font-black text-amber-300 font-mono mt-1">
                      {wb.maxHeartRateBpm !== null ? `${wb.maxHeartRateBpm} bpm` : 'Sin dato'}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {wb.maxHeartRateBpm !== null
                        ? `${Math.round((wb.maxHeartRateBpm / 199) * 100)}% FCmáx (21 años)`
                        : 'Pico cardíaco'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#09090b]/75 border border-cyan-500/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span>Calorías Reloj</span>
                    </span>
                    <div className="text-lg font-black text-orange-300 font-mono mt-1">
                      {wb.caloriesBurned !== null ? `${wb.caloriesBurned} kcal` : 'Sin dato'}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {wb.kcalPerMinute !== null ? `${wb.kcalPerMinute} kcal/min` : 'Gasto activo'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#09090b]/75 border border-cyan-500/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>Carga Cardíaca</span>
                    </span>
                    <div className="text-lg font-black text-cyan-300 font-mono mt-1">
                      {wb.cardiacLoadIndex !== null ? `TRIMP ${wb.cardiacLoadIndex}` : 'Sin dato'}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {wb.kgPerKcal !== null ? `${wb.kgPerKcal} kg movidos/kcal` : 'Estrés cardiovascular'}
                    </span>
                  </div>
                </div>

                {/* Zonas de Frecuencia Cardíaca (si Health Connect trajo muestras HR) */}
                {hrZones && totalZoneMins > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Distribución Real de Zonas Cardíacas ({wb.hrSampleCount || 0} muestras del reloj)</span>
                      <span>
                        Z1 {hrZones.z1}m • Z2 {hrZones.z2}m • Z3 {hrZones.z3}m • Z4 {hrZones.z4}m • Z5 {hrZones.z5}m
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
                      {[
                        { val: hrZones.z1, color: 'bg-slate-400', label: 'Z1' },
                        { val: hrZones.z2, color: 'bg-sky-400', label: 'Z2' },
                        { val: hrZones.z3, color: 'bg-emerald-400', label: 'Z3' },
                        { val: hrZones.z4, color: 'bg-amber-400', label: 'Z4' },
                        { val: hrZones.z5, color: 'bg-rose-500', label: 'Z5' },
                      ].map((z) =>
                        z.val > 0 ? (
                          <div
                            key={z.label}
                            style={{ width: `${(z.val / totalZoneMins) * 100}%` }}
                            className={`${z.color} h-full`}
                            title={`${z.label}: ${z.val} min`}
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="p-4 rounded-2xl bg-[#09090b]/80 border border-[#27272a] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                  <Watch className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white">
                      Fusión Reloj (Xiaomi Smart Band 9 Pro) — Sin sesión emparejada para esta fecha
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {watchSessions.length} sesiones del reloj archivadas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Ventana Hevy:{' '}
                    <span className="font-mono text-slate-300">
                      {selectedSession.date}
                      {selectedSession.startTimeLocal && selectedSession.endTimeLocal
                        ? ` (${selectedSession.startTimeLocal}–${selectedSession.endTimeLocal}, ${selectedSession.durationMinutes} min)`
                        : ''}
                    </span>
                    . Cuando sincronizas VYFITH Android (con historial de 60 días de Health Connect), cualquier sesión iniciada a la par se fusiona automáticamente con tolerancia de desfase al finalizar.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleAutoFuseWatch}
                  disabled={isFusingWatch}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFusingWatch ? 'animate-spin' : ''}`} />
                  <span>Buscar en Nube</span>
                </button>
                <button
                  onClick={() => setShowManualWatchLink((v) => !v)}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-slate-200 text-xs font-bold border border-[#3f3f46] transition-all"
                >
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vincular Manual ({watchSessions.length})</span>
                </button>
                <button
                  onClick={() => watchFileInputRef.current?.click()}
                  disabled={isFusingWatch}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-slate-300 text-xs font-bold border border-[#27272a] transition-all"
                  title="Importar exportación CSV/JSON de Mi Fitness o Health Connect"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Importar Reloj</span>
                </button>
              </div>
            </div>

            {showManualWatchLink && (
              <div className="pt-3 border-t border-[#27272a] space-y-2">
                <div className="text-[11px] font-bold text-slate-300">
                  Sesiones reales registradas en tu Xiaomi Smart Band 9 Pro / Health Connect:
                </div>
                {watchSessions.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    Todavía no hay sesiones del reloj descargadas. Pulsa «Buscar en Nube» o abre VYFITH Android actualizado en tu Vivo Y20 y toca Sincronizar para subir el historial de los últimos 60 días.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {watchSessions.map((ws) => (
                      <div
                        key={ws.id}
                        className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">
                            {ws.title} ({ws.durationMinutes} min)
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {ws.dateIso} • {ws.startTimeText}–{ws.endTimeText}
                            {ws.avgHeartRateBpm ? ` • ${Math.round(ws.avgHeartRateBpm)} bpm` : ''}
                            {ws.caloriesBurned > 0 ? ` • ${ws.caloriesBurned} kcal` : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => handleManualFuseWatch(selectedSession.id, ws.id)}
                          disabled={isFusingWatch}
                          className="cursor-pointer px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold shrink-0 transition-colors"
                        >
                          Fusionar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3.1. ENTRENADOR PERSONAL IA INTEGRADO EN HEVY APP (JEFF NIPPARD SCIENCE) */}
        {coachPrescription && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-[#18181b] to-purple-950/40 border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                      <span>Entrenador Personal IA • Análisis de Rutina</span>
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                      Jeff Nippard Science
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recomendaciones de sobrecarga progresiva y táctica calculadas para {selectedSession.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://notebook.google.com/notebook/57126469-ac46-4b0d-a370-6270c887c26b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#09090b]/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                  title="Abrir cuaderno MegaProyecto en NotebookLM"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>NotebookLM</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <button
                  onClick={handleApplyToHevy}
                  disabled={isSyncingHevy}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                  title="Aplica los nuevos pesos y repeticiones a tu Hevy App"
                >
                  {isSyncingHevy ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Aplicar Cargas a Hevy App</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {syncActionResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  syncActionResult.syncedToHevy
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/35 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {syncActionResult.syncedToHevy ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{syncActionResult.message}</p>
                    {!syncActionResult.syncedToHevy && (
                      <p className="text-[11px] text-amber-300/80">
                        Sin API Key de Hevy PRO ni sesión web en Chrome conectada, VYFITH no puede modificar tus rutinas en los servidores de Hevy de forma remota sin mentirte.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {syncActionResult.requiresLogin && (
                    <button
                      onClick={handleConnectHevyBrowser}
                      disabled={isConnectingBrowser}
                      className="cursor-pointer px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
                    >
                      {isConnectingBrowser ? 'Conectando...' : 'Conectar Chrome Hevy'}
                    </button>
                  )}
                  {(syncActionResult.editUrl || syncActionResult.routineUrl) && (
                    <a
                      href={syncActionResult.editUrl || syncActionResult.routineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] border border-slate-600"
                    >
                      <span>{syncActionResult.syncedToHevy ? 'Ver en Hevy' : 'Editar en Hevy Web'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* DIAGNÓSTICO EN PROSA PERSONALIZADO PARA SANTIAGO */}
            <div className="p-4 rounded-xl bg-[#09090b]/80 border border-slate-800 text-xs leading-relaxed space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Cómo mejorar tu entrenamiento en estos días:</span>
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    Readiness: <strong className="text-white">{coachPrescription.readinessScore}%</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    Agua: <strong className="text-white">{coachPrescription.hydrationCompliancePct}%</strong>
                  </span>
                </div>
              </div>
              <p className="text-slate-300 text-xs leading-normal">
                {coachPrescription.summaryMessage} Para los entrenamientos de estos días, la estrategia es <strong>Doble Progresión</strong>: no aumentes los kilos en la barra hasta que no completes con técnica estricta todas las series en el límite superior de repeticiones con <strong>RIR 1–2</strong> (dejando 1 a 2 repeticiones en reserva para disipar la fatiga central). En los ejercicios con badge <em>«Subir Reps»</em>, enfócate en ganar esa repetición extra en tus dos primeras series.
              </p>
            </div>
          </div>
        )}

        {/* GRILLA RESPONSIVA MULTICOLUMNA DE EJERCICIOS (BENTO GRID 2-3 COLUMNAS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 items-start">
          {selectedSession.exercises.map((exercise, exIdx) => {
            const muscleColor = getMuscleBadgeColor(exercise.muscleGroup);
            const exPrescription = coachPrescription?.prescriptions.find(
              (p) => p.exerciseName.toLowerCase().trim() === exercise.name.toLowerCase().trim()
            );

            return (
              <div
                key={exIdx}
                className="bg-[#09090b]/90 border border-[#27272a] rounded-2xl p-4 sm:p-5 text-white space-y-3.5 shadow-sm flex flex-col justify-between h-full hover:border-[#3f3f46] transition-all"
              >
                <div>
                  {/* Encabezado del Ejercicio */}
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold border ${muscleColor} shadow-inner shrink-0`}>
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-black text-white tracking-tight truncate" title={exercise.name}>
                          {exercise.name}
                        </h4>
                        {exercise.esTitle && (
                          <span className="text-[11px] text-slate-400 block font-medium truncate" title={exercise.esTitle}>
                            {exercise.esTitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${muscleColor}`}>
                      {exercise.muscleGroup}
                    </span>
                  </div>

                  {/* RECOMENDACIÓN IA INDIVIDUAL PARA ESTE EJERCICIO */}
                  {exPrescription && (
                    <div className={`p-2.5 rounded-xl border mb-3 text-xs ${
                      exPrescription.action === 'SUBIR_PESO'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : exPrescription.action === 'SUBIR_REPS'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : exPrescription.action === 'DESCARGA_TECNICA'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                    }`}>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>IA Coach: {
                            exPrescription.action === 'SUBIR_PESO' ? '🟢 Subir Peso' :
                            exPrescription.action === 'SUBIR_REPS' ? '🟡 Doble Progresión (+1 Rep)' :
                            exPrescription.action === 'DESCARGA_TECNICA' ? '🟠 Descarga Técnica' :
                            '🔵 Consolidar Carga'
                          }</span>
                        </span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                          RIR {exPrescription.targetRir}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-white">
                        Próxima sesión: <span className="text-emerald-400 font-extrabold">{exPrescription.prescribedWeightKg} kg</span> ({exPrescription.prescribedRepsSummary})
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        {exPrescription.reasoning}
                      </p>
                      {exPrescription.biomechanicalCues.length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-slate-400 flex items-center gap-1">
                          <span className="font-semibold text-cyan-400 shrink-0">Técnica:</span>
                          <span className="truncate">{exPrescription.biomechanicalCues.slice(0, 2).join(' • ')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nota Personal de Santiago (Callout Idéntico a Hevy) */}
                  {exercise.notes && (
                    <div className="p-3 rounded-xl bg-[#18181b] border-l-4 border-amber-500 text-xs text-slate-300 flex items-start gap-2 shadow-inner my-2">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-snug italic text-[11px]">
                        "{exercise.notes}"
                      </p>
                    </div>
                  )}

                  {/* TABLA DE SERIES OPTIMIZADA PARA GRILLA MULTICOLUMNA */}
                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-[#27272a] pb-2">
                          <th className="py-2 px-1.5 w-9 text-center">SET</th>
                          <th className="py-2 px-2">PESO ({unit.toUpperCase()})</th>
                          <th className="py-2 px-2">REPS</th>
                          <th className="py-2 px-1 text-center">RPE</th>
                          <th className="py-2 px-1 text-right">OK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a]/70">
                        {exercise.sets.map((set, sIdx) => {
                          const isWarmup = set.isWarmup || set.indicator === 'warmup';
                          const rpeColor = getRpeBadgeColor(set.rpe);

                          return (
                            <tr
                              key={sIdx}
                              className={`transition-colors ${
                                isWarmup ? 'bg-amber-500/5' : 'hover:bg-[#18181b]/60'
                              }`}
                            >
                              {/* SET BADGE (W para Warmup o 1, 2, 3...) */}
                              <td className="py-2.5 px-1.5 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-black shadow-xs ${
                                    isWarmup
                                      ? 'bg-amber-500/25 text-amber-400 border border-amber-500/50'
                                      : 'bg-[#27272a] text-slate-200 border border-[#3f3f46]'
                                  }`}
                                >
                                  {isWarmup ? 'W' : set.setNumber}
                                </span>
                              </td>

                              {/* PESO */}
                              <td className="py-2.5 px-2">
                                {set.durationSeconds ? (
                                  <span className="text-slate-300 font-bold text-xs">
                                    {Math.floor(set.durationSeconds / 60)}m {set.durationSeconds % 60}s
                                  </span>
                                ) : (
                                  <span className="text-white font-extrabold text-xs">
                                    {formatWeight(set.weightKg, set.weightLbs)}
                                  </span>
                                )}
                              </td>

                              {/* REPETICIONES */}
                              <td className="py-2.5 px-2">
                                {set.reps > 0 ? (
                                  <span className="text-white font-extrabold text-xs">
                                    {set.reps}{' '}
                                    <span className="text-[10px] text-slate-400 font-normal">reps</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-normal">—</span>
                                )}
                              </td>

                              {/* RPE */}
                              <td className="py-2.5 px-1 text-center">
                                {set.rpe ? (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black border ${rpeColor}`}>
                                    @{set.rpe}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>

                              {/* CHECK HEVY */}
                              <td className="py-2.5 px-1 text-right">
                                <span className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. BARRA SOCIAL INFERIOR DE HEVY (LIKE, COMENTARIOS, COMPARTIR) */}
        <div className="pt-6 border-t border-[#27272a] flex items-center justify-between flex-wrap gap-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setLiked(!liked);
                setLikesCount(liked ? likesCount - 1 : likesCount + 1);
              }}
              className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                liked
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-[#27272a] text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likesCount} Me gusta</span>
            </button>

            <button
              onClick={() => alert('Entrenamiento verificado y respaldado en la base de datos de VYFITH.')}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#27272a] text-slate-300 hover:text-white transition-all"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>Comentarios (0)</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Enlace del entrenamiento copiado al portapapeles');
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#27272a] text-slate-300 hover:text-white transition-all"
            >
              <Share2 className="w-4 h-4 text-slate-400" />
              <span>Compartir</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            Identificador Hevy: {selectedSession.id} • {selectedSession.watchBiometrics ? 'Fusionado con Reloj' : 'Sincronizado'}
          </span>
        </div>
      </div>

      {/* MODAL / OVERLAY: LISTA COMPLETA DE LOS 198 ENTRENAMIENTOS */}
      {showAllWorkoutsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-2xl w-full p-6 text-white space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div>
                <h3 className="text-lg font-black text-white">Historial de Entrenamientos Hevy</h3>
                <span className="text-xs text-slate-400">Total: {sessions.length} entrenamientos registrados</span>
              </div>
              <button
                onClick={() => setShowAllWorkoutsModal(false)}
                className="cursor-pointer px-3 py-1.5 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-xs font-bold text-slate-300"
              >
                Cerrar (✕)
              </button>
            </div>

            {/* Buscador interno */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre de rutina o fecha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#09090b] border border-[#27272a] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Lista scrolleable completa */}
            <div className="overflow-y-auto space-y-2 pr-1 divide-y divide-[#27272a]/60">
              {filteredSessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => {
                    setSelectedSessionId(sess.id);
                    setShowAllWorkoutsModal(false);
                  }}
                  className="py-3 px-3 rounded-xl hover:bg-[#27272a]/60 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{sess.name}</h4>
                      {sess.watchBiometrics && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                          <Watch className="w-2.5 h-2.5" />
                          <span>
                            {sess.watchBiometrics.avgHeartRateBpm
                              ? `${sess.watchBiometrics.avgHeartRateBpm} bpm`
                              : 'Reloj'}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {sess.date}
                      {sess.startTimeLocal && sess.endTimeLocal
                        ? ` (${sess.startTimeLocal}–${sess.endTimeLocal})`
                        : ''}
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-300">
                    <span className="block font-bold text-rose-400">
                      {formatVolume(sess.totalVolumeKg, sess.totalVolumeLbs)}
                    </span>
                    <span className="text-[10px] text-slate-500">{sess.durationMinutes} min • {sess.totalSets} sets</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
