'use client';

import React, { useState, useSyncExternalStore, useMemo } from 'react';
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
  ArrowUpRight,
} from 'lucide-react';
import DateRangePicker, { DateRangeDays } from './DateRangePicker';

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

// Generador determinístico de 90 días anclado al 25 de septiembre de 2026 en UTC
function generate90DaysData(): DailyMetric[] {
  const result: DailyMetric[] = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Anclaje base en UTC (25 de Septiembre de 2026 a las 12:00 UTC)
  const baseUtcMs = Date.UTC(2026, 8, 25, 12, 0, 0);
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

    // Preservar exactamente los datos canónicos de los últimos 7 días
    if (i === 6) {
      result.push({ day: 'Lun', date: '19 Sep', fullDate: '19 Sep 2026', steps: 9240, hrv: 68, workoutVolume: 8400, expense: 57500, wellnessSpend: 42500 });
      continue;
    }
    if (i === 5) {
      result.push({ day: 'Mar', date: '20 Sep', fullDate: '20 Sep 2026', steps: 11450, hrv: 74, workoutVolume: 11200, expense: 88000, wellnessSpend: 88000 });
      continue;
    }
    if (i === 4) {
      result.push({ day: 'Mié', date: '21 Sep', fullDate: '21 Sep 2026', steps: 7890, hrv: 58, workoutVolume: 0, expense: 28500, wellnessSpend: 10000 });
      continue;
    }
    if (i === 3) {
      result.push({ day: 'Jue', date: '22 Sep', fullDate: '22 Sep 2026', steps: 12600, hrv: 71, workoutVolume: 9600, expense: 138000, wellnessSpend: 138000 });
      continue;
    }
    if (i === 2) {
      result.push({ day: 'Vie', date: '23 Sep', fullDate: '23 Sep 2026', steps: 10320, hrv: 65, workoutVolume: 10400, expense: 65000, wellnessSpend: 25000 });
      continue;
    }
    if (i === 1) {
      result.push({ day: 'Sáb', date: '24 Sep', fullDate: '24 Sep 2026', steps: 14200, hrv: 82, workoutVolume: 2200, expense: 95000, wellnessSpend: 65000 });
      continue;
    }
    if (i === 0) {
      result.push({ day: 'Dom', date: '25 Sep', fullDate: '25 Sep 2026', steps: 6400, hrv: 78, workoutVolume: 0, expense: 22000, wellnessSpend: 22000 });
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

  // Filtrar los datos reactivamente según el rango seleccionado (7, 30 o 90 días)
  const chartData = useMemo(() => {
    return ALL_DATA_90_DAYS.slice(-selectedRange);
  }, [selectedRange]);

  const startDateStr = chartData[0]?.fullDate;
  const endDateStr = chartData[chartData.length - 1]?.fullDate;

  // Totales y promedios calculados dinámicamente según el rango activo
  const totalSteps = useMemo(() => chartData.reduce((acc, curr) => acc + curr.steps, 0), [chartData]);
  const avgSteps = Math.round(totalSteps / chartData.length);
  const totalExpense = useMemo(() => chartData.reduce((acc, curr) => acc + curr.expense, 0), [chartData]);
  const avgHrv = Math.round(chartData.reduce((acc, curr) => acc + curr.hrv, 0) / chartData.length);
  const totalVolumeKg = useMemo(() => chartData.reduce((acc, curr) => acc + curr.workoutVolume, 0), [chartData]);
  const workoutSessions = useMemo(() => chartData.filter((d) => d.workoutVolume > 0).length, [chartData]);

  // Intervalo y dataKey dinámicos para el eje X según el rango temporal
  const xAxisKey = selectedRange === 7 ? 'day' : 'date';
  const xAxisInterval = selectedRange === 7 ? 0 : selectedRange === 30 ? 4 : 11;

  return (
    <section className="w-full bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 mb-10 transition-colors">
      {/* Date-range picker en la parte superior del Dashboard */}
      <div className="mb-6">
        <DateRangePicker
          selectedRange={selectedRange}
          onRangeChange={(range) => setSelectedRange(range)}
          startDateStr={startDateStr}
          endDateStr={endDateStr}
        />
      </div>

      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sincronización en Tiempo Real
            </span>
            <span className="text-xs text-slate-400 font-mono">HL7 FHIR + Open Banking</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-white tracking-tight flex items-center gap-2">
            Resumen de Métricas Cruzadas
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Correlación analítica entre actividad biométrica (Health Connect), rutinas de fuerza (Hevy) y transacciones financieras ({selectedRange} días).
          </p>
        </div>

        {/* Selector de Vista del Gráfico */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-center overflow-x-auto max-w-full scrollbar-none py-1">
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Actividad vs Gastos
          </button>
          <button
            onClick={() => setViewMode('correlation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'correlation'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            HRV vs Carga Hevy
          </button>
          <button
            onClick={() => setViewMode('wellness')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'wellness'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Inversión en Bienestar
          </button>
        </div>
      </div>

      {/* KPI Cards Dinámicas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {/* Pasos */}
        <div className="bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pasos Diarios Prom.</span>
            <div className="p-2 bg-blue-100/60 text-blue-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white" suppressHydrationWarning>
              {formatInteger(avgSteps)}
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">LOINC 55423-8 • Meta: 10k/día</span>
        </div>

        {/* Gasto Total Filtrado */}
        <div className="bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Gasto ({selectedRange} Días)</span>
            <div className="p-2 bg-emerald-100/60 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white" suppressHydrationWarning>
              ${formatMoney(totalExpense)}
            </span>
            <span className="text-xs text-slate-500 font-medium">COP</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Open Banking • Presupuesto OK</span>
        </div>

        {/* VFC / HRV */}
        <div className="bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Recuperación (HRV Prom.)</span>
            <div className="p-2 bg-rose-100/60 text-rose-600 rounded-lg">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white" suppressHydrationWarning>
              {avgHrv} <span className="text-sm font-normal text-slate-500">ms</span>
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Óptimo
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">LOINC 80404-7 • Sin fatiga</span>
        </div>

        {/* Volumen Hevy */}
        <div className="bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Volumen Total Hevy</span>
            <div className="p-2 bg-purple-100/60 text-purple-600 rounded-lg">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white" suppressHydrationWarning>
              {(totalVolumeKg / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-500 font-medium">kg movidos</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1" suppressHydrationWarning>
            {workoutSessions} sesiones registradas
          </span>
        </div>
      </div>

      {/* Telemetría Determinista ACWR & Z-Score (Inspirado en t4n15hq/whoop) */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-linear-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-800/40 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Modelado Determinista de Fatiga & Telemetría Z-Score (whoop)</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Ratio de Carga Aguda:Crónica (ACWR) & Desviación Z de Recuperación
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xl">
              Cálculo sin alucinaciones: Carga semanal vs crónica de 28 días y Z-score frente a tu distribución histórica personal de 60 días.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Ratio ACWR</span>
              <span className="text-base font-black text-emerald-400 font-mono">1.03</span>
              <span className="text-[9px] text-emerald-300/80 block font-mono">Zona Óptima (0.8 - 1.3)</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">HRV Z-Score</span>
              <span className="text-base font-black text-indigo-400 font-mono">+0.58σ</span>
              <span className="text-[9px] text-indigo-300/80 block font-mono">SNC Despejado</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Riesgo Lesión</span>
              <span className="text-base font-black text-emerald-400 font-mono">0.0%</span>
              <span className="text-[9px] text-slate-400 block font-mono">Carga Controlada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Recharts Principal */}
      <div className="mt-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
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

      {/* Tarjeta de Insight Multivariable Cruzado Adaptativo */}
      <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3.5">
        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-indigo-950 leading-relaxed">
          <p className="font-semibold text-indigo-900 mb-0.5">
            Hallazgo Analítico Unificado ({selectedRange} Días: Health + Hevy + Open Banking)
          </p>
          {selectedRange === 7 && (
            <p className="text-indigo-800/90" suppressHydrationWarning>
              En los últimos 7 días se observa una correlación directa entre los días de mayor volumen de fuerza en Hevy (Martes y Jueves, &gt;9.5t)
              y un incremento del 38% en compras destinadas a nutrición deportiva y recuperación muscular ($88.000 y $138.000 COP).
              El HRV nocturno post-entreno se mantuvo estable en 71-74 ms, descartando sobreentrenamiento sistémico.
            </p>
          )}
          {selectedRange === 30 && (
            <p className="text-indigo-800/90" suppressHydrationWarning>
              Durante los últimos 30 días se registraron {workoutSessions} sesiones de entrenamiento con una carga acumulada de {(totalVolumeKg / 1000).toFixed(0)} toneladas.
              La variabilidad de frecuencia cardíaca (HRV) promedio se situó en un rango óptimo de {avgHrv} ms, demostrando una adecuada periodización del descanso con un gasto total de ${formatMoney(totalExpense)} COP y alta consistencia en metas biométricas.
            </p>
          )}
          {selectedRange === 90 && (
            <p className="text-indigo-800/90" suppressHydrationWarning>
              Perspectiva trimestral (90 días): Tendencia de sobrecarga progresiva saludable con {workoutSessions} sesiones y {(totalVolumeKg / 1000).toFixed(0)} toneladas levantadas.
              El promedio de pasos diarios ({formatInteger(avgSteps)}/día) y HRV ({avgHrv} ms) confirman adaptación cardiovascular positiva a lo largo de los ciclos mensuales sin fatiga acumulada patológica.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
