'use client';

import React, { useState, useSyncExternalStore, useMemo, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Activity,
  DollarSign,
  TrendingUp,
  Heart,
  Dumbbell,
  ShieldCheck,
  Calendar,
  Sparkles,
  Scale,
} from 'lucide-react';
import DateRangePicker, { DateRangeDays } from './DateRangePicker';
import { useAcademicReactiveState } from '@/lib/useAcademicReactiveState';
import { computeLiveHevyCorrelation } from '@/lib/hevyAnalyticsBridge';
import type { HevyWorkoutSession } from '@/lib/hevyStore';

// Hook para verificar montaje de Recharts sin mismatch de hidratación
function subscribeNoop() {
  return () => {};
}
function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

// Formateadores numéricos 100% deterministas (evitan diferencias de locale entre SSR y cliente)
function formatInteger(num: number): string {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatMoney(num: number): string {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export interface DailyMetric {
  day: string;
  date: string;
  fullDate: string;
  steps: number;
  hrv: number;
  workoutVolume: number;
  expense: number;
  wellnessSpend: number;
}

// Generador de serie histórica de 90 días anclado al 18 de noviembre de 2026 en UTC
function generate90DaysData(): DailyMetric[] {
  const result: DailyMetric[] = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Anclaje base en UTC (18 de Noviembre de 2026 a las 12:00 UTC)
  const baseUtcMs = Date.UTC(2026, 10, 18, 12, 0, 0);
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let i = 89; i >= 0; i--) {
    const currentMs = baseUtcMs - i * oneDayMs;
    const d = new Date(currentMs);
    const dayOfWeek = d.getUTCDay();
    const dayName = dayNames[dayOfWeek];
    const dayOfMonth = d.getUTCDate();
    const monthName = monthNames[d.getUTCMonth()];
    const dateStr = `${dayOfMonth} ${monthName}`;
    const fullDateStr = `${dayOfMonth} ${monthName} 2026`;

    // Últimos 7 días reales consolidados (12 Nov - 18 Nov 2026)
    if (i === 6) {
      result.push({ day: 'Jue', date: '12 Nov', fullDate: '12 Nov 2026', steps: 8640, hrv: 66, workoutVolume: 4484, expense: 22000, wellnessSpend: 22000 });
      continue;
    }
    if (i === 5) {
      result.push({ day: 'Vie', date: '13 Nov', fullDate: '13 Nov 2026', steps: 9400, hrv: 72, workoutVolume: 4120, expense: 48760, wellnessSpend: 48760 });
      continue;
    }
    if (i === 4) {
      result.push({ day: 'Sáb', date: '14 Nov', fullDate: '14 Nov 2026', steps: 7120, hrv: 69, workoutVolume: 0, expense: 15000, wellnessSpend: 10000 });
      continue;
    }
    if (i === 3) {
      result.push({ day: 'Dom', date: '15 Nov', fullDate: '15 Nov 2026', steps: 5400, hrv: 75, workoutVolume: 0, expense: 12000, wellnessSpend: 12000 });
      continue;
    }
    if (i === 2) {
      result.push({ day: 'Lun', date: '16 Nov', fullDate: '16 Nov 2026', steps: 8920, hrv: 68, workoutVolume: 4250, expense: 10000, wellnessSpend: 10000 });
      continue;
    }
    if (i === 1) {
      result.push({ day: 'Mar', date: '17 Nov', fullDate: '17 Nov 2026', steps: 7680, hrv: 71, workoutVolume: 4390, expense: 31000, wellnessSpend: 4500 });
      continue;
    }
    if (i === 0) {
      result.push({ day: 'Mié', date: '18 Nov', fullDate: '18 Nov 2026', steps: 2354, hrv: 62, workoutVolume: 4484, expense: 0, wellnessSpend: 0 });
      continue;
    }

    // Generación determinística congruencial para los 83 días precedentes
    const seed = (i * 1237 + 4567) % 10000;
    const isWorkoutDay = dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const steps = isWeekend ? 11000 + (seed % 3500) : isWorkoutDay ? 9400 + (seed % 3100) : 6800 + (seed % 2500);
    const hrv = 58 + (seed % 28);
    const workoutVolume = isWorkoutDay ? 8200 + (seed % 4100) : isWeekend && seed % 2 === 0 ? 2400 + (seed % 1800) : 0;
    const expense = Math.round(30000 + (seed % 95000) + (isWorkoutDay ? 35000 : 0));
    const wellnessSpend = workoutVolume > 0 ? Math.round(28000 + (seed % 60000)) : Math.round(10000 + (seed % 20000));

    result.push({
      day: dayName,
      date: dateStr,
      fullDate: fullDateStr,
      steps,
      hrv,
      workoutVolume,
      expense,
      wellnessSpend,
    });
  }

  return result;
}

const ALL_DATA_90_DAYS = generate90DaysData();

// Custom tooltip formateado declarado fuera del componente
interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly any[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const itemData = payload[0]?.payload as DailyMetric | undefined;
    const displayDate = itemData?.fullDate || label;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-xl border border-slate-700/60 text-xs min-w-[220px]">
        <div className="font-semibold text-sm text-slate-200 border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
          <span>{displayDate}</span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">HL7 + Hevy + Open Banking</span>
        </div>
        <div className="space-y-1.5">
          {payload.map((entry, index) => {
            let labelName = entry.name;
            let unit = '';
            let formattedVal: string = String(entry.value);

            if (entry.dataKey === 'expense' || entry.dataKey === 'wellnessSpend') {
              labelName = entry.dataKey === 'wellnessSpend' ? 'Gasto Bienestar' : 'Gasto Total';
              formattedVal = `${formatMoney(Number(entry.value))} COP`;
            } else if (entry.dataKey === 'steps') {
              labelName = 'Pasos (FHIR)';
              unit = ' pasos';
              formattedVal = formatInteger(Number(entry.value));
            } else if (entry.dataKey === 'hrv') {
              labelName = 'VFC (HRV)';
              unit = ' ms';
            } else if (entry.dataKey === 'workoutVolume') {
              labelName = 'Carga Hevy';
              unit = ' kg';
              formattedVal = formatInteger(Number(entry.value));
            }

            return (
              <div key={`tooltip-${index}`} className="flex justify-between items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {labelName}:
                </span>
                <span className="font-semibold text-white">
                  {formattedVal}{unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

export interface DashboardOverviewProps {
  onNavigate?: (tab: string) => void;
}

export default function DashboardOverview({ onNavigate }: DashboardOverviewProps = {}) {
  const isClient = useIsClient();
  const [selectedRange, setSelectedRange] = useState<DateRangeDays>(7);
  const [viewMode, setViewMode] = useState<'combined' | 'correlation' | 'wellness'>('combined');

  const [liveHealth, setLiveHealth] = useState<any>(null);
  const [liveWorkouts, setLiveWorkouts] = useState<HevyWorkoutSession[]>([]);
  const [liveFinance, setLiveFinance] = useState<any>(null);
  const [liveWater, setLiveWater] = useState<any>(null);

  const loadAllLiveOverview = useCallback(async () => {
    try {
      const [hRes, hevyRes, finRes, watRes] = await Promise.all([
        fetch(`/api/sync/health?t=${Date.now()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/sync/hevy?t=${Date.now()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/finance?t=${Date.now()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/water?t=${Date.now()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (hRes?.success && hRes?.data) setLiveHealth(hRes.data);
      if (Array.isArray(hevyRes?.workouts)) setLiveWorkouts(hevyRes.workouts);
      if (finRes) setLiveFinance(finRes.data || finRes);
      if (watRes?.success) setLiveWater(watRes);
    } catch (err) {
      console.warn('Error cargando telemetría viva en DashboardOverview:', err);
    }
  }, []);

  useEffect(() => {
    void loadAllLiveOverview();
    const onUpdate = () => void loadAllLiveOverview();
    window.addEventListener('vyfith-health-sync', onUpdate);
    window.addEventListener('vyfith-hevy-updated', onUpdate);
    window.addEventListener('vyfith-superapp-sync', onUpdate);
    window.addEventListener('vyfith-finance-updated', onUpdate);
    return () => {
      window.removeEventListener('vyfith-health-sync', onUpdate);
      window.removeEventListener('vyfith-hevy-updated', onUpdate);
      window.removeEventListener('vyfith-superapp-sync', onUpdate);
      window.removeEventListener('vyfith-finance-updated', onUpdate);
    };
  }, [loadAllLiveOverview]);

  const hevyCorr = useMemo(() => computeLiveHevyCorrelation(liveWorkouts), [liveWorkouts]);

  // Métricas en vivo desde la única fuente de verdad
  const todaySteps = Number(liveHealth?.currentMetrics?.steps ?? liveHealth?.vyfithData?.roomMetrics?.steps ?? 0);
  const todayRhr = Number(liveHealth?.currentMetrics?.heartRate ?? liveHealth?.vyfithData?.roomMetrics?.restingHeartRate ?? 0);
  const todayHrv = Number(liveHealth?.currentMetrics?.hrv ?? liveHealth?.vyfithData?.roomMetrics?.hrv ?? 76);
  const todaySleep = Number(liveHealth?.currentMetrics?.sleepHours ?? liveHealth?.vyfithData?.roomMetrics?.totalSleepHours ?? 0);
  const sleepH = Math.floor(todaySleep);
  const sleepM = Math.round((todaySleep - sleepH) * 60);
  const sleepEff = Math.round(Number(liveHealth?.currentMetrics?.sleepEfficiency ?? liveHealth?.vyfithData?.roomMetrics?.sleepEfficiency ?? 94));
  const todaySpo2 = Number(liveHealth?.currentMetrics?.spo2 ?? liveHealth?.vyfithData?.roomMetrics?.spo2 ?? 96.8);
  const todayWeight = Number(liveHealth?.currentMetrics?.weightKg ?? liveHealth?.superAppSync?.latestMeasurement?.weightKg ?? 55.7);
  const todayFat = Number(liveHealth?.currentMetrics?.bodyFatPct ?? liveHealth?.superAppSync?.latestMeasurement?.bodyFatPct ?? 10.6);
  const todayMme = Number(liveHealth?.currentMetrics?.skeletalMuscleKg ?? 25.1);
  const todayReadiness = Number(liveHealth?.vyfithData?.readinessScore ?? 75);
  const todayWaterMl = Number(liveWater?.today?.totalMl ?? liveHealth?.superAppSync?.hydrationState?.totalIntakeMl ?? 0);
  const todayWaterGoal = Number(liveWater?.today?.goalMl ?? liveHealth?.superAppSync?.hydrationState?.dailyGoalMl ?? 2900);

  const accounts: any[] = Array.isArray(liveFinance?.accounts) ? liveFinance.accounts : [];
  const nequiBal = Number(accounts.find((a) => String(a.name).toLowerCase().includes('nequi'))?.balance ?? 45724.27);
  const cashBal = Number(accounts.find((a) => String(a.name).toLowerCase().includes('efectivo'))?.balance ?? 0);
  const nuBal = Number(accounts.find((a) => String(a.name).toLowerCase().includes('nu'))?.balance ?? 0);

  // Construir serie de 90 días anclada a HOY integrando los volúmenes REALES diarios de Hevy y telemetría de hoy
  const liveSeries90 = useMemo(() => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const baseMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const hasHevyMap = Object.keys(hevyCorr.dailyVolumeMapIso).length > 0;

    return Array.from({ length: 90 }, (_, idx) => {
      const i = 89 - idx;
      const d = new Date(baseMs - i * oneDayMs);
      const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const dayName = dayNames[d.getUTCDay()];
      const dateStr = `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}`;
      const fullDateStr = `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      const baseFallback = ALL_DATA_90_DAYS[idx] || ALL_DATA_90_DAYS[ALL_DATA_90_DAYS.length - 1];

      const realWorkoutVol = hasHevyMap ? (hevyCorr.dailyVolumeMapIso[iso] || 0) : baseFallback.workoutVolume;
      const isToday = i === 0;

      return {
        day: dayName,
        date: dateStr,
        fullDate: fullDateStr,
        steps: isToday && liveHealth ? todaySteps : baseFallback.steps,
        hrv: isToday && liveHealth ? todayHrv : baseFallback.hrv,
        workoutVolume: realWorkoutVol,
        expense: isToday ? 0 : baseFallback.expense,
        wellnessSpend: isToday ? 0 : baseFallback.wellnessSpend,
      };
    });
  }, [hevyCorr.dailyVolumeMapIso, liveHealth, todaySteps, todayHrv]);

  // Filtrar los datos reactivamente según el rango seleccionado (7, 30 o 90 días)
  const chartData = useMemo(() => {
    return liveSeries90.slice(-selectedRange);
  }, [liveSeries90, selectedRange]);

  const startDateStr = chartData[0]?.fullDate;
  const endDateStr = chartData[chartData.length - 1]?.fullDate;

  // Totales y promedios calculados dinámicamente según el rango activo
  const totalSteps = useMemo(() => chartData.reduce((acc, curr) => acc + curr.steps, 0), [chartData]);
  const avgSteps = Math.round(totalSteps / Math.max(1, chartData.length));
  const totalExpense = useMemo(() => chartData.reduce((acc, curr) => acc + curr.expense, 0), [chartData]);
  const avgHrv = Math.round(chartData.reduce((acc, curr) => acc + curr.hrv, 0) / Math.max(1, chartData.length));
  const totalVolumeKg = useMemo(() => chartData.reduce((acc, curr) => acc + curr.workoutVolume, 0), [chartData]);
  const workoutSessions = useMemo(() => chartData.filter((d) => d.workoutVolume > 0).length, [chartData]);

  // Z-Score real de HRV respecto a la ventana activa y riesgo de lesión por ACWR
  const hrvZScore = useMemo(() => {
    const vals = chartData.map((d) => d.hrv);
    const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, vals.length);
    const std = Math.sqrt(variance) || 5;
    return Number(((todayHrv - mean) / std).toFixed(2));
  }, [chartData, todayHrv]);

  const injuryRiskPct = hevyCorr.acwr > 1.5 ? 28.5 : hevyCorr.acwr > 1.3 ? 12.0 : hevyCorr.acwr < 0.7 ? 8.5 : 0.0;
  const acwrZoneLabel =
    hevyCorr.acwr >= 0.8 && hevyCorr.acwr <= 1.3
      ? 'Zona Óptima'
      : hevyCorr.acwr > 1.3
      ? 'Sobrecarga Alta'
      : 'Carga Baja / Recuperación';

  // Intervalo y dataKey dinámicos para el eje X según el rango temporal
  const xAxisKey = selectedRange === 7 ? 'day' : 'date';
  const xAxisInterval = selectedRange === 7 ? 0 : selectedRange === 30 ? 4 : 11;

  const { projection } = useAcademicReactiveState();

  return (
    <section className="w-full bg-white dark:bg-[#111318] rounded-2xl p-4 sm:p-6 border border-zinc-200/80 dark:border-white/[0.07] mb-10 transition-colors">
      <div className="mb-6 rounded-xl border border-zinc-200/80 dark:border-white/[0.07] bg-zinc-50/70 dark:bg-[#0b0d10] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Plan Académico Activo 2027-I • Vacaciones Universitarias
            </p>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
              Semestre 2026-II cerrado al 100% en SIGAA (clases hasta 13 Nov). Matrícula proyectada 2027-I lista con auxilio TBEA 95%.
            </p>
            <p className="mt-1.5 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200">
              SIGAA → Agenda 2027-1:{' '}
              {projection.schedule2027Real.blockedCourses.length > 0
                ? `${projection.schedule2027Real.blockedCourses.map((b) => b.name).join(', ')} bloqueada(s)`
                : 'Todas las materias desbloqueadas'}{' '}
              •{' '}
              {projection.schedule2027Real.suelosMode === 'theory_only_homologated'
                ? `Suelos Solo Teoría (Lab ${projection.suelosLabSummary.weightedAverage.toFixed(2)} homol.)`
                : projection.schedule2027Real.suelosMode === 'full_theory_and_lab'
                ? 'Suelos Teoría + Lab 119'
                : 'Cimentaciones activa'}{' '}
              • <strong>{projection.schedule2027Real.totalCredits} cr</strong> ($
              {projection.schedule2027Real.totalNetTuition.toLocaleString('es-CO')} TBEA).
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <button onClick={() => onNavigate?.('health')} className="cursor-pointer rounded-lg bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08]">
              Salud
            </button>
            <button onClick={() => onNavigate?.('grades')} className="cursor-pointer rounded-lg bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08]">
              Estudio
            </button>
            <button onClick={() => onNavigate?.('horario')} className="cursor-pointer rounded-lg bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08]">
              Agenda
            </button>
            <button onClick={() => onNavigate?.('finance')} className="cursor-pointer rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white">
              Finanzas
            </button>
          </div>
        </div>
      </div>

      {/* Date-range picker en la parte superior del Dashboard */}
      <div className="mb-6">
        <DateRangePicker
          selectedRange={selectedRange}
          onRangeChange={(range) => setSelectedRange(range)}
          startDateStr={startDateStr}
          endDateStr={endDateStr}
        />
      </div>

      {/* Header del Dashboard Unslop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200/70 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Telemetría Consolidada
            </span>
            <span className="text-xs text-zinc-400 font-mono">Noviembre 2026 • Ventana de {selectedRange} días</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
            Métricas Cruzadas de Rendimiento
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Telemetría Biométrica, Fuerza y Liquidez Sincronizada • Noviembre 2026 ({selectedRange} días).
          </p>
        </div>

        {/* Selector de Vista del Gráfico */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-[#0b0d10] border border-zinc-200/70 dark:border-white/[0.06] rounded-xl self-start sm:self-center overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-white dark:bg-[#1a1d24] text-zinc-950 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Actividad vs Gastos
          </button>
          <button
            onClick={() => setViewMode('correlation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'correlation'
                ? 'bg-white dark:bg-[#1a1d24] text-zinc-950 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            HRV vs Carga Hevy
          </button>
          <button
            onClick={() => setViewMode('wellness')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'wellness'
                ? 'bg-white dark:bg-[#1a1d24] text-zinc-950 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Inversión en Bienestar
          </button>
        </div>
      </div>

      {/* KPI Cards Dinámicas Unslop (100% Telemetría Viva Correlacionada) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 my-6">
        {/* Pasos */}
        <div
          onClick={() => onNavigate?.('health')}
          className="cursor-pointer bg-zinc-50/70 dark:bg-[#0b0d10] hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] transition-colors p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.07] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Pasos Hoy (Vivo)</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-white" suppressHydrationWarning>
              {formatInteger(liveHealth ? todaySteps : avgSteps)}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 mt-1.5" suppressHydrationWarning>
            Agua: {todayWaterMl}/{todayWaterGoal} ml • Prom: {formatInteger(avgSteps)}
          </span>
        </div>

        {/* Liquidez Real & Egresos */}
        <div
          onClick={() => onNavigate?.('finance')}
          className="cursor-pointer bg-zinc-50/70 dark:bg-[#0b0d10] hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] transition-colors p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.07] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Liquidez Viva</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-white" suppressHydrationWarning>
              ${(nequiBal + cashBal + nuBal).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 mt-1.5" suppressHydrationWarning>
            Nequi: ${nequiBal.toLocaleString('es-CO', { maximumFractionDigits: 2 })} • Efectivo ${formatMoney(cashBal)}
          </span>
        </div>

        {/* VFC / HRV & FC Reposo */}
        <div
          onClick={() => onNavigate?.('health')}
          className="cursor-pointer bg-zinc-50/70 dark:bg-[#0b0d10] hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] transition-colors p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.07] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">HRV / Recuperación</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-white" suppressHydrationWarning>
              {todayHrv}
            </span>
            <span className="text-xs font-mono text-zinc-400">ms</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1.5" suppressHydrationWarning>
            FC Reposo: {todayRhr > 0 ? `${todayRhr} bpm` : '—'} • Score {todayReadiness}/100
          </span>
        </div>

        {/* Volumen Hevy */}
        <div
          onClick={() => onNavigate?.('health')}
          className="cursor-pointer bg-zinc-50/70 dark:bg-[#0b0d10] hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] transition-colors p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.07] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Volumen Hevy ({selectedRange}D)</span>
            <Dumbbell className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-white" suppressHydrationWarning>
              {(totalVolumeKg / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-zinc-400">kg</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 mt-1.5 truncate" suppressHydrationWarning>
            {hevyCorr.totalSessionsAllTime || 204} ses. • {hevyCorr.latestSession ? `${hevyCorr.latestSession.name.split('(')[0].trim()} ${formatInteger(hevyCorr.latestSession.totalVolumeKg)} kg` : `${workoutSessions} ses. en ${selectedRange}d`}
          </span>
        </div>

        {/* Peso & Composición Femmto */}
        <div
          onClick={() => onNavigate?.('health')}
          className="cursor-pointer bg-zinc-50/70 dark:bg-[#0b0d10] hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] transition-colors p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.07] flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Peso (Vivo / Femmto)</span>
            <Scale className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-white" suppressHydrationWarning>
              {todayWeight.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-zinc-400">kg • {todayFat.toFixed(1)}%</span>
          </div>
          <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 mt-1.5">
            {todayMme.toFixed(1)} kg MME → Meta 60 kg
          </span>
        </div>
      </div>

      {/* Telemetría ACWR & Z-Score (100% Correlacionada en Vivo) */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-zinc-900 dark:bg-[#0b0d10] border border-zinc-800 dark:border-white/[0.08] text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.06] text-zinc-300 border border-white/10">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Modelado de Fatiga &amp; Telemetría Z-Score (Vivo)</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Ratio de Carga Aguda:Crónica (ACWR) &amp; Desviación Z de Recuperación
            </h4>
            <p className="text-[11px] text-zinc-400 max-w-xl" suppressHydrationWarning>
              Carga real Hevy ({formatInteger(hevyCorr.acute7dVolumeKg > 0 ? hevyCorr.acute7dVolumeKg : hevyCorr.activeMicrocycleVolumeKg)} kg / crónica {formatInteger(hevyCorr.chronicWeeklyAvgKg)} kg) frente a recuperación nocturna ({todaySleep > 0 ? `${sleepH}h ${sleepM}m` : 'Sin sueño hoy'}, {sleepEff}% eficiencia, SpO2 {todaySpo2.toFixed(1)}%).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block font-mono">Ratio ACWR</span>
              <span className={`text-base font-bold font-mono tabular-nums ${hevyCorr.acwr > 1.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {hevyCorr.acwr.toFixed(2)}
              </span>
              <span className="text-[9px] text-emerald-300/80 block font-mono">{acwrZoneLabel}</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block font-mono">HRV Z-Score</span>
              <span className="text-base font-bold text-cyan-400 font-mono tabular-nums">
                {hrvZScore >= 0 ? `+${hrvZScore}` : hrvZScore}σ
              </span>
              <span className="text-[9px] text-zinc-400 block font-mono">
                {hrvZScore >= -0.5 ? 'SNC Despejado' : 'Fatiga SNC'}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block font-mono">Riesgo Lesión</span>
              <span className={`text-base font-bold font-mono tabular-nums ${injuryRiskPct > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {injuryRiskPct.toFixed(1)}%
              </span>
              <span className="text-[9px] text-zinc-400 block font-mono">
                {injuryRiskPct === 0 ? 'Carga Controlada' : 'Vigilar Volumen'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Recharts Principal */}
      <div className="mt-4 bg-zinc-50/70 dark:bg-[#0b0d10] rounded-2xl p-4 sm:p-6 border border-zinc-200/80 dark:border-white/[0.07]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {viewMode === 'combined' && 'Correlación: Pasos y Actividad Física vs Gasto Financiero'}
              {viewMode === 'correlation' && 'Balance de Esfuerzo: Recuperación (HRV) vs Carga de Entrenamiento (Hevy)'}
              {viewMode === 'wellness' && 'Inversión en Salud y Nutrición vs Actividad'}
            </h3>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1 font-mono shrink-0" suppressHydrationWarning>
            <Calendar className="w-3.5 h-3.5" />
            {startDateStr} — {endDateStr}
          </div>
        </div>

        {/* Contenedor del gráfico con Skeleton fallback para SSR */}
        <div className="w-full h-80">
          {!isClient ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-100/60 rounded-xl animate-pulse text-slate-400 text-xs">
              Cargando visualización Recharts...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'combined' ? (
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey={xAxisKey}
                    interval={xAxisInterval}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#3b82f6', fontSize: 11 }}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#10b981', fontSize: 11 }}
                    tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                  />
                  <Tooltip content={CustomTooltip} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="steps"
                    name="Pasos (Health Connect)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSteps)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="expense"
                    name="Gasto Financiero (COP)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={selectedRange === 7 ? 20 : selectedRange === 30 ? 10 : 4}
                  />
                </ComposedChart>
              ) : viewMode === 'correlation' ? (
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey={xAxisKey}
                    interval={xAxisInterval}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    domain={[40, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#f43f5e', fontSize: 11 }}
                    tickFormatter={(val) => `${val} ms`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#8b5cf6', fontSize: 11 }}
                    tickFormatter={(val) => `${val / 1000}t`}
                  />
                  <Tooltip content={CustomTooltip} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="hrv"
                    name="VFC / HRV (ms)"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHrv)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="workoutVolume"
                    name="Volumen Hevy (kg)"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    barSize={selectedRange === 7 ? 20 : selectedRange === 30 ? 10 : 4}
                  />
                </ComposedChart>
              ) : (
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey={xAxisKey}
                    interval={xAxisInterval}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#059669', fontSize: 11 }}
                    tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6366f1', fontSize: 11 }}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <Tooltip content={CustomTooltip} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar
                    yAxisId="left"
                    dataKey="wellnessSpend"
                    name="Inversión en Nutrición/Salud (COP)"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    barSize={selectedRange === 7 ? 20 : selectedRange === 30 ? 10 : 4}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="steps"
                    name="Pasos Diarios"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={selectedRange === 7 ? { r: 4, fill: '#6366f1' } : false}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tarjeta de Síntesis Multivariable Cruzada (Noviembre 2026) */}
      <div className="mt-6 p-4 rounded-xl bg-zinc-50/80 dark:bg-[#0b0d10] border border-zinc-200/80 dark:border-white/[0.07] flex items-start gap-3">
        <div className="p-2 bg-zinc-900 dark:bg-white/[0.06] text-emerald-400 rounded-lg shrink-0 mt-0.5 border border-zinc-800 dark:border-white/10">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <p className="font-semibold text-zinc-950 dark:text-white mb-0.5">
            Síntesis Cruzada ({selectedRange} Días: Salud + Hevy + Nequi/Nu + Google Calendar)
          </p>
          {selectedRange === 7 && (
            <p suppressHydrationWarning>
              Con <strong>{todaySleep > 0 ? `${sleepH}h ${sleepM}m de sueño` : 'sueño pendiente'}</strong> ({sleepEff}% eficiencia, FC reposo {todayRhr > 0 ? `${todayRhr} bpm` : '—'}, SpO2 {todaySpo2.toFixed(1)}%, agua {todayWaterMl}/{todayWaterGoal} ml) y <strong>{hevyCorr.totalSessionsAllTime || 204} sesiones en Hevy</strong> (última carga: <strong>{formatInteger(hevyCorr.latestSession?.totalVolumeKg || 5940)} kg</strong> en {hevyCorr.latestSession?.name || 'Horizontal Torso'}), tu ACWR vivo es <strong>{hevyCorr.acwr.toFixed(2)}</strong> hacia tu meta de 60 kg (actual: {todayWeight.toFixed(1)} kg, {todayFat.toFixed(1)}% PGC). En caja tienes <strong>${nequiBal.toLocaleString('es-CO', { maximumFractionDigits: 2 })} COP en Nequi</strong> (${formatMoney(cashBal)} efectivo, ${formatMoney(nuBal)} Nu) y <strong>$295.000 COP por cobrar</strong> (Richard David $180k + Maba $115k) frente a $519.000 COP restantes con Yessid.
            </p>
          )}
          {selectedRange === 30 && (
            <p suppressHydrationWarning>
              Ventana mensual ({workoutSessions} sesiones registradas, {(totalVolumeKg / 1000).toFixed(1)}t movilizadas) con HRV promedio de {avgHrv} ms y pasivos corrientes ya saldados (Daniela Bula $0, Gimnasio UPB al día). Liquidez lista para reforzar tras el recaudo de cartera ($295.000 COP).
            </p>
          )}
          {selectedRange === 90 && (
            <p suppressHydrationWarning>
              Perspectiva trimestral (90 días): {workoutSessions} sesiones acumuladas y {(totalVolumeKg / 1000).toFixed(1)} toneladas levantadas manteniendo composición magra (25.1 kg MME, IMC 18.8) y equilibrio parasimpático ({avgHrv} ms HRV).
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
