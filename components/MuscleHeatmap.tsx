'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { initialHevySessions, HevyWorkoutSession } from '@/lib/hevyStore';
import {
  computeLiveHevyCorrelation,
  LiveHevyCorrelationSnapshot,
  LiveMuscleVolumeMetric,
} from '@/lib/hevyAnalyticsBridge';

export default function MuscleHeatmap() {
  const [selectedMuscle, setSelectedMuscle] = useState<LiveMuscleVolumeMetric['id']>('chest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<LiveHevyCorrelationSnapshot>(() =>
    computeLiveHevyCorrelation(initialHevySessions)
  );
  const [recoveryMeta, setRecoveryMeta] = useState<{
    readiness: number;
    sleepHours: number;
    waterPct: number;
  } | null>(null);

  const loadCorrelatedData = useCallback(async (showBanner = false) => {
    setIsRefreshing(true);
    try {
      const [hevyRes, healthRes, waterRes] = await Promise.all([
        fetch(`/api/sync/hevy?t=${Date.now()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/sync/health?t=${Date.now()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/water?t=${Date.now()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      ]);

      const workouts: HevyWorkoutSession[] =
        Array.isArray(hevyRes?.workouts) && hevyRes.workouts.length > 0
          ? hevyRes.workouts
          : initialHevySessions;

      const readiness = Number(healthRes?.data?.vyfithData?.readinessScore ?? 75);
      const sleepHours = Number(
        healthRes?.data?.currentMetrics?.sleepHours ??
          healthRes?.data?.vyfithData?.roomMetrics?.totalSleepHours ??
          7.4
      );
      const waterMl = Number(
        waterRes?.today?.totalMl ?? healthRes?.data?.superAppSync?.hydrationState?.totalIntakeMl ?? 0
      );
      const waterGoal = Number(
        waterRes?.today?.goalMl ?? healthRes?.data?.superAppSync?.hydrationState?.dailyGoalMl ?? 2900
      );
      const waterPct = waterGoal > 0 ? Math.round((waterMl / waterGoal) * 100) : 100;

      const computed = computeLiveHevyCorrelation(workouts, {
        readinessScore: readiness,
        sleepHours,
        hydrationPct: waterPct,
      });

      setSnapshot(computed);
      setRecoveryMeta({ readiness, sleepHours, waterPct });

      if (showBanner) {
        setSyncNotice(
          `Recalculado en vivo sobre ${computed.totalSessionsAllTime} sesiones reales de Hevy (${computed.activeMicrocycleSets} series • ${computed.activeMicrocycleVolumeKg.toLocaleString()} kg) cruzado con Readiness ${readiness}/100.`
        );
        setTimeout(() => setSyncNotice(null), 5000);
      }
    } catch (err) {
      console.warn('Error cargando correlación muscular viva:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCorrelatedData(false);
    const onUpdate = () => void loadCorrelatedData(false);
    window.addEventListener('vyfith-hevy-updated', onUpdate);
    window.addEventListener('vyfith-health-sync', onUpdate);
    window.addEventListener('vyfith-superapp-sync', onUpdate);
    return () => {
      window.removeEventListener('vyfith-hevy-updated', onUpdate);
      window.removeEventListener('vyfith-health-sync', onUpdate);
      window.removeEventListener('vyfith-superapp-sync', onUpdate);
    };
  }, [loadCorrelatedData]);

  const muscleVolumes = snapshot.muscleVolumes;
  const plateaus = snapshot.liftDiagnostics;
  const activeGroup = muscleVolumes[selectedMuscle] || muscleVolumes.chest;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
      {/* Header del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Motor de Hipertrofia Vivo • {snapshot.activeMicrocycleWindowLabel}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Mapa de Calor Muscular &amp; Detección de Estancamientos
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mt-0.5">
            Calculado desde tus <strong>{snapshot.totalSessionsAllTime} sesiones reales</strong> de Hevy y correlacionado con tu recuperación del teléfono
            {recoveryMeta ? ` (Readiness ${recoveryMeta.readiness}/100 • Sueño ${recoveryMeta.sleepHours.toFixed(1)}h • Agua ${recoveryMeta.waterPct}%)` : ''}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void loadCorrelatedData(true)}
            disabled={isRefreshing}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Recalculando...' : 'Recalcular en Vivo'}</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Contenido: Selector de Músculos & Diagnóstico */}
      <div className="space-y-6">
        {/* Visualizador Anatómico & Selector de Grupos Musculares */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Selecciona un grupo muscular para auditar:</span>
            </span>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Óptimo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Mantenimiento
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Bajo Estímulo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
            {Object.values(muscleVolumes).map((m) => {
              const isSelected = selectedMuscle === m.id;
              const shortLabels: Record<string, string> = {
                chest: 'Pectoral',
                back: 'Espalda',
                shoulders: 'Deltoides',
                triceps: 'Tríceps',
                biceps: 'Bíceps',
                quads: 'Cuádriceps',
                hamstrings: 'Femorales',
                calves: 'Pantorrillas',
              };
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMuscle(m.id)}
                  className={`cursor-pointer p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate">
                      {shortLabels[m.id] || m.name}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                    {m.sets} series • {m.volumeKg.toLocaleString()} kg
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalle del Músculo Seleccionado & Alertas de Plateau */}
        <div className="space-y-6">
          {/* Tarjeta de Diagnóstico del Músculo Activo */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                {activeGroup.name}
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {activeGroup.sets} Series Efectivas ({activeGroup.volumeKg.toLocaleString()} kg)
              </span>
            </div>

            {/* Barra de Rango MEV - MRV */}
            <div className="space-y-1.5 my-3">
              <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                <span>MEV: {activeGroup.mev} series</span>
                <span>MRV: {activeGroup.mrv} series máx</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (activeGroup.sets / Math.max(1, activeGroup.mrv)) * 100)}%`,
                    backgroundColor: activeGroup.color,
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              <strong>Último ejercicio real ({activeGroup.lastDateLabel}):</strong> {activeGroup.lastExercise}
            </p>
          </div>

          {/* Detector de Estancamientos (Plateau Detection) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Diagnóstico Real de Sobrecarga Progresiva (Hevy ↔ Recuperación)</span>
            </div>

            <div className="space-y-2.5">
              {plateaus.length === 0 ? (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  Sin ejercicios recientes cargados aún.
                </div>
              ) : (
                plateaus.map((p, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 text-xs transition-colors ${
                      p.type === 'warning'
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
                        : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-900 dark:text-white font-bold">{p.exercise}</strong>
                        <span className="font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                          {p.currentWeight}
                        </span>
                        <span className="font-mono text-[10px] opacity-80">
                          • 1RM est. {p.estimated1RmKg} kg
                        </span>
                      </div>

                      <div className="sm:text-right">
                        <span className="font-bold text-[11px] px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs break-words inline-block">
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] opacity-90 leading-relaxed">{p.detail}</p>
                    <div className="text-[11px] font-semibold bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 break-words">
                      {p.action}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
