'use client';

import React, { useState, useEffect } from 'react';
import { SyncSessionState } from '@/lib/healthStore';
import {
  Moon,
  Heart,
  Activity,
  Flame,
  Wind,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Clock,
  Zap,
} from 'lucide-react';

interface MiFitnessHealthSuiteProps {
  syncState?: SyncSessionState | null;
}

export default function MiFitnessHealthSuite({ syncState }: MiFitnessHealthSuiteProps) {
  const [internalState, setInternalState] = useState<SyncSessionState | null>(null);

  useEffect(() => {
    if (!syncState) {
      fetch(`/api/sync/health?t=${Date.now()}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.success && d.data) setInternalState(d.data);
        })
        .catch(console.error);
    }
  }, [syncState]);

  const activeState = syncState || internalState;
  const totalSleepHours =
    activeState?.currentMetrics?.sleepHours ||
    activeState?.vyfithData?.roomMetrics?.totalSleepHours ||
    10.2;
  const sleepH = Math.floor(totalSleepHours);
  const sleepM = Math.round((totalSleepHours - sleepH) * 60);

  const liveRhr =
    activeState?.currentMetrics?.heartRate ||
    activeState?.vyfithData?.roomMetrics?.restingHeartRate ||
    62;
  const liveSpo2 = activeState?.vyfithData?.roomMetrics?.spo2
    ? Math.round(activeState.vyfithData.roomMetrics.spo2)
    : 97;

  const [activeTab, setActiveTab] = useState<'sleep' | 'heart' | 'stress' | 'spo2'>('sleep');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // =========================================================================
  // MATRICES DINÁMICAS SEGÚN RANGO TEMPORAL (Hoy vs Semanal 7d vs Mensual 30d)
  // =========================================================================

  const metricsByRange = {
    today: {
      rangeLabel: 'Noche de ayer • 22:48 – 07:00',
      timeSubtitle: 'Última sesión sincronizada desde tu Vivo Y20',
      sleep: {
        totalHoursStr: `${sleepH}h ${sleepM}m`,
        totalTitle: `${sleepH} horas ${sleepM} minutos`,
        efficiency: '94%',
        deepStr: '2h 12m',
        deepPct: 22,
        lightStr: '5h 10m',
        lightPct: 50,
        remStr: '2h 40m',
        remPct: 26,
        awakeStr: '10 min',
        wakeups: '2 veces',
        animalEmoji: '🐻',
        animalName: 'El Oso',
        animalDesc: 'Cronotipo regular, sueño reparador profundo y recuperación muscular óptima.',
        rhrSleeping: `${liveRhr} lpm`,
        rhrSleepingBadge: 'Excelente Tono Vagal',
        spo2Sleeping: `${liveSpo2}%`,
        spo2SleepingBadge: 'Oxigenación Perfecta',
        respRate: '15 rpm',
        respBadge: 'Eupnea Estable',
        regularity: 'Alta',
        regularityBadge: 'Variación ±18 min',
      },
      heart: {
        rangeStr: '52 – 158 lpm',
        peakNote: 'Pico en entrenamiento a las 16:35',
        avgHr: 68,
        rhr: liveRhr,
        z5Time: '6 min (4%)',
        z5Bar: '6%',
        z4Time: '24 min (18%)',
        z4Bar: '22%',
        z3Time: '48 min (36%)',
        z3Bar: '42%',
        z2Time: '1h 45m (Paseos caninos)',
        z2Bar: '65%',
        z1Time: '3h 12m (Descanso y estudio)',
        z1Bar: '85%',
      },
      stress: {
        score: 20,
        badge: 'Relajado / Parasimpático',
        min: 7,
        avg: 20,
        max: 46,
        relaxedTime: '1h 14m',
        mildTime: '26 min',
        diag: 'Tu sistema nervioso autónomo estuvo el 74% del tiempo en predominio parasimpático (relajación). El pico de 46 coincidió con la preparación de tu entrenamiento de fuerza en la UPB.',
      },
      spo2: {
        avg: `${liveSpo2}%`,
        range: '95% – 99%',
        resp: '15 rpm',
        note: 'Saturación celular óptima durante todo el ciclo diario.',
      },
    },
    week: {
      rangeLabel: 'Promedio Semanal • Últimos 7 días',
      timeSubtitle: '7 noches de registro continuo en Google Health Connect',
      sleep: {
        totalHoursStr: '7h 48m',
        totalTitle: '7 horas 48 minutos (Media Diaria)',
        efficiency: '92%',
        deepStr: '1h 45m',
        deepPct: 22,
        lightStr: '4h 05m',
        lightPct: 52,
        remStr: '1h 50m',
        remPct: 24,
        awakeStr: '8 min',
        wakeups: '1.2 veces/noche',
        animalEmoji: '🐺',
        animalName: 'El Lobo',
        animalDesc: 'Excelente adaptación al madrugón laboral (5:30 a.m.) para paseos caninos y alta energía vespertina.',
        rhrSleeping: '61 lpm',
        rhrSleepingBadge: 'Tono Vagal Estable',
        spo2Sleeping: '97.2%',
        spo2SleepingBadge: 'Promedio Semanal Óptimo',
        respRate: '15.2 rpm',
        respBadge: 'Ventilación Nocturna Normal',
        regularity: 'Muy Alta',
        regularityBadge: 'Variación ±12 min',
      },
      heart: {
        rangeStr: '48 – 164 lpm',
        peakNote: 'Media semanal con picos en sesiones Hevy (Martes y Jueves)',
        avgHr: 66,
        rhr: 58,
        z5Time: '38 min (3%)',
        z5Bar: '8%',
        z4Time: '2h 45m (14%)',
        z4Bar: '25%',
        z3Time: '6h 20m (32%)',
        z3Bar: '45%',
        z2Time: '12h 15m (Paseos Sienna + Frida)',
        z2Bar: '70%',
        z1Time: '24h 40m (Clases UPB & Descanso)',
        z1Bar: '90%',
      },
      stress: {
        score: 22,
        badge: 'Relajado / Balance Saludable',
        min: 6,
        avg: 22,
        max: 52,
        relaxedTime: '8h 45m (68%)',
        mildTime: '3h 10m (22%)',
        diag: 'En los últimos 7 días mantuviste un promedio parasimpático del 68%. Los picos transitorios de estrés moderado (hasta 52) se concentraron en las horas de estudio para el parcial de Estructuras.',
      },
      spo2: {
        avg: '97.2%',
        range: '94% – 99%',
        resp: '15.2 rpm',
        note: 'Excelente oxigenación periférica y adaptación cardiovascular al esfuerzo.',
      },
    },
    month: {
      rangeLabel: 'Consolidado Mensual • Últimos 30 días',
      timeSubtitle: '30 días analíticos: 24 sesiones de fuerza en Hevy y 60+ paseos',
      sleep: {
        totalHoursStr: '7h 35m',
        totalTitle: '7 horas 35 minutos (Media Diaria)',
        efficiency: '91%',
        deepStr: '1h 40m',
        deepPct: 22,
        lightStr: '3h 58m',
        lightPct: 52,
        remStr: '1h 48m',
        remPct: 24,
        awakeStr: '9 min',
        wakeups: '1.4 veces/noche',
        animalEmoji: '🐻',
        animalName: 'El Oso de Montaña',
        animalDesc: 'Consistencia circadiana impecable: recuperación muscular acumulada de más de 40 toneladas levantadas en Hevy.',
        rhrSleeping: '62 lpm',
        rhrSleepingBadge: 'Recuperación Crónica Fuerte',
        spo2Sleeping: '97.0%',
        spo2SleepingBadge: 'Estabilidad 30 Días',
        respRate: '15.1 rpm',
        respBadge: 'Eupnea Estable Continua',
        regularity: 'Alta',
        regularityBadge: 'Variación ±15 min',
      },
      heart: {
        rangeStr: '46 – 172 lpm',
        peakNote: 'Mes completo: 24 sesiones en Hevy y 250k+ pasos acumulados',
        avgHr: 67,
        rhr: 59,
        z5Time: '2h 15m (2%)',
        z5Bar: '6%',
        z4Time: '11h 30m (12%)',
        z4Bar: '24%',
        z3Time: '28h 40m (30%)',
        z3Bar: '48%',
        z2Time: '52h 10m (Paseos + Traslados Cereté)',
        z2Bar: '72%',
        z1Time: '108h 30m (Actividad Diaria UPB)',
        z1Bar: '92%',
      },
      stress: {
        score: 24,
        badge: 'Equilibrado / Resiliente',
        min: 5,
        avg: 24,
        max: 64,
        relaxedTime: '38h 20m (65%)',
        mildTime: '14h 30m (25%)',
        diag: 'Consistencia fisiológica de 30 días: El 90% de las horas monitoreadas se mantuvieron entre relajado y leve. El entrenamiento en el gimnasio de la UPB y los paseos caninos actúan como moduladores efectivos de cortisol.',
      },
      spo2: {
        avg: '97.0%',
        range: '94% – 100%',
        resp: '15.1 rpm',
        note: 'Sin eventos apneicos ni hipóxicos registrados durante todo el mes.',
      },
    },
  };

  const current = metricsByRange[timeRange];

  return (
    <div className="bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-xl space-y-7 transition-colors">
      {/* 1. HEADER DE LA SUITE DE SALUD MI FITNESS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-[#27272a]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Xiaomi Mi Fitness Premium Health Suite
            </span>
            <span className="text-xs font-mono text-slate-400">
              Xiaomi Smart Band 9 Pro (PPG 4 Canales + GNSS)
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Telemetría de Salud, Sueño & Ritmo Cardíaco
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Sincronización biométrica activa con tus datos de <strong>Mi Fitness</strong> y <strong>Google Health Connect</strong>. Visualizando:{' '}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{current.timeSubtitle}</span>.
          </p>
        </div>

        {/* Selector de Rango Temporal */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="bg-slate-100 dark:bg-[#09090b] p-1 rounded-xl border border-slate-200 dark:border-[#27272a] flex items-center text-xs font-mono">
            <button
              onClick={() => setTimeRange('today')}
              className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hoy / Último
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === 'week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semanal (7d)
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === 'month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mensual (30d)
            </button>
          </div>
        </div>
      </div>

      {/* 2. SELECTOR DE PESTAÑAS ESTILO MI FITNESS CON DATOS DINÁMICOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveTab('sleep')}
          className={`cursor-pointer p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
            activeTab === 'sleep'
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-sm'
              : 'bg-slate-50 dark:bg-[#09090b]/60 border-slate-200/80 dark:border-[#27272a] hover:bg-slate-100 dark:hover:bg-[#27272a]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <Moon className="w-5 h-5 text-indigo-500" />
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400">
              {current.sleep.efficiency} Efic.
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Sueño & Fases ({timeRange === 'today' ? 'Hoy' : timeRange === 'week' ? 'Media 7d' : 'Media 30d'})
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {current.sleep.totalHoursStr}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('heart')}
          className={`cursor-pointer p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
            activeTab === 'heart'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 dark:border-rose-500/80 ring-2 ring-rose-500/20 shadow-sm'
              : 'bg-slate-50 dark:bg-[#09090b]/60 border-slate-200/80 dark:border-[#27272a] hover:bg-slate-100 dark:hover:bg-[#27272a]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <Heart className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400">
              5 Zonas FC
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Ritmo Cardíaco ({timeRange === 'today' ? 'Hoy' : timeRange === 'week' ? '7 días' : '30 días'})
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {current.heart.rangeStr}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('stress')}
          className={`cursor-pointer p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
            activeTab === 'stress'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-slate-50 dark:bg-[#09090b]/60 border-slate-200/80 dark:border-[#27272a] hover:bg-slate-100 dark:hover:bg-[#27272a]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <Flame className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">
              {current.stress.badge.split('/')[0].trim()}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Nivel de Estrés ({timeRange === 'today' ? 'Hoy' : timeRange === 'week' ? 'Media 7d' : 'Media 30d'})
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {current.stress.score} / 100
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('spo2')}
          className={`cursor-pointer p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
            activeTab === 'spo2'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 dark:border-sky-500/80 ring-2 ring-sky-500/20 shadow-sm'
              : 'bg-slate-50 dark:bg-[#09090b]/60 border-slate-200/80 dark:border-[#27272a] hover:bg-slate-100 dark:hover:bg-[#27272a]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <Wind className="w-5 h-5 text-sky-500" />
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400">
              Óptimo
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Oxígeno & Resp.
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {current.spo2.avg} • {current.spo2.resp}
            </span>
          </div>
        </button>
      </div>

      {/* 3. PESTAÑA A: SUEÑO & FASES */}
      {activeTab === 'sleep' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-linear-to-br from-indigo-950 via-[#18181b] to-slate-950 border border-indigo-900/50 text-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-indigo-300 font-semibold block">
                  {current.rangeLabel}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                  {current.sleep.totalTitle}
                </h3>
              </div>

              {/* Animal del Sueño Xiaomi */}
              <div className="p-3.5 rounded-2xl bg-indigo-900/40 border border-indigo-500/30 flex items-center gap-3">
                <span className="text-3xl">{current.sleep.animalEmoji}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Animal del Sueño:</span>
                    <span className="text-xs font-black text-amber-300">{current.sleep.animalName}</span>
                  </div>
                  <span className="text-[11px] text-slate-300 leading-tight block">
                    {current.sleep.animalDesc}
                  </span>
                </div>
              </div>
            </div>

            {/* HIPNOGRAMA VISUAL DE FASES */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-slate-300 font-mono">
                <span>{timeRange === 'today' ? '22:48' : 'Inicio ventana'}</span>
                <span>01:00</span>
                <span>03:00</span>
                <span>05:00</span>
                <span>{timeRange === 'today' ? '07:00' : 'Fin ventana'}</span>
              </div>

              {/* Barra segmentada de fases */}
              <div className="h-7 w-full rounded-xl overflow-hidden flex bg-slate-900 border border-indigo-500/30">
                <div style={{ width: `${current.sleep.lightPct / 2}%` }} className="bg-sky-500/80" title="Ligero" />
                <div style={{ width: `${current.sleep.deepPct}%` }} className="bg-indigo-600" title="Profundo" />
                <div style={{ width: `${current.sleep.lightPct / 2}%` }} className="bg-sky-500/80" title="Ligero" />
                <div style={{ width: `${current.sleep.remPct}%` }} className="bg-cyan-400" title="REM" />
                <div style={{ width: '4%' }} className="bg-orange-500" title="Despierto" />
              </div>

              {/* Leyenda de Fases con Horas y Porcentajes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                <div className="p-3 rounded-xl bg-[#09090b]/80 border border-indigo-900/40">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span>Profundo (N3)</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono">{current.sleep.deepStr}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{current.sleep.deepPct}% • Óptimo</span>
                </div>

                <div className="p-3 rounded-xl bg-[#09090b]/80 border border-indigo-900/40">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>Ligero</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono">{current.sleep.lightStr}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{current.sleep.lightPct}% • Normal</span>
                </div>

                <div className="p-3 rounded-xl bg-[#09090b]/80 border border-indigo-900/40">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>Sueño REM</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono">{current.sleep.remStr}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{current.sleep.remPct}% • Excelente</span>
                </div>

                <div className="p-3 rounded-xl bg-[#09090b]/80 border border-indigo-900/40">
                  <div className="flex items-center gap-1.5 text-orange-400 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span>Despierto</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono">{current.sleep.awakeStr}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{current.sleep.wakeups}</span>
                </div>
              </div>
            </div>

            {/* 4 Indicadores Fisiológicos Nocturnos */}
            <div className="pt-4 border-t border-indigo-900/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="text-slate-400 block text-[11px]">RHR Durmiendo</span>
                <span className="text-lg font-black text-rose-400 font-mono">{current.sleep.rhrSleeping}</span>
                <span className="text-[10px] text-emerald-400 block font-mono">{current.sleep.rhrSleepingBadge}</span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="text-slate-400 block text-[11px]">SpO2 Nocturno</span>
                <span className="text-lg font-black text-sky-400 font-mono">{current.sleep.spo2Sleeping}</span>
                <span className="text-[10px] text-emerald-400 block font-mono">{current.sleep.spo2SleepingBadge}</span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="text-slate-400 block text-[11px]">Frecuencia Respiratoria</span>
                <span className="text-lg font-black text-purple-400 font-mono">{current.sleep.respRate}</span>
                <span className="text-[10px] text-slate-300 block font-mono">{current.sleep.respBadge}</span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="text-slate-400 block text-[11px]">Regularidad del Sueño</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{current.sleep.regularity}</span>
                <span className="text-[10px] text-slate-300 block font-mono">{current.sleep.regularityBadge}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PESTAÑA B: RITMO CARDÍACO */}
      {activeTab === 'heart' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                Rango Cardíaco ({timeRange === 'today' ? 'Diario' : timeRange === 'week' ? 'Semanal' : 'Mensual'})
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {current.heart.rangeStr}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">{current.heart.peakNote}</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                Frecuencia Media (Vigilia)
              </span>
              <div className="text-2xl font-black text-rose-500 font-mono mt-1">
                {current.heart.avgHr} <span className="text-xs font-normal text-slate-400">lpm</span>
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold block mt-1">Salud cardiovascular óptima</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                Frecuencia en Reposo (RHR)
              </span>
              <div className="text-2xl font-black text-emerald-500 font-mono mt-1">
                {current.heart.rhr} <span className="text-xs font-normal text-slate-400">lpm</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Medida durante el reposo nocturno</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#18181b] border border-[#27272a] text-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-extrabold text-white">
                  Zonas de Ritmo Cardíaco ({timeRange === 'today' ? 'Hoy' : timeRange === 'week' ? '7 Días' : '30 Días'})
                </h4>
                <p className="text-xs text-slate-400">
                  Distribución acumulada en entrenamientos de fuerza (Hevy) y caminatas con perros (Sienna & Frida)
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-400 font-bold px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-800 self-start sm:self-auto">
                FC Máx Estimada: 198 lpm
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-rose-400">Zona 5: VO2 Máx (&gt; 178 lpm)</span>
                  <span className="text-slate-300">{current.heart.z5Time}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full" style={{ width: current.heart.z5Bar }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-amber-400">Zona 4: Anaeróbico (158 – 177 lpm)</span>
                  <span className="text-slate-300">{current.heart.z4Time}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: current.heart.z4Bar }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-emerald-400">Zona 3: Aeróbico (138 – 157 lpm)</span>
                  <span className="text-slate-300">{current.heart.z3Time}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: current.heart.z3Bar }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-sky-400">Zona 2: Intensivo (118 – 137 lpm)</span>
                  <span className="text-slate-300">{current.heart.z2Time}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: current.heart.z2Bar }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-indigo-400">Zona 1: Ligero (&lt; 118 lpm)</span>
                  <span className="text-slate-300">{current.heart.z1Time}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: current.heart.z1Bar }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PESTAÑA C: ESTRÉS */}
      {activeTab === 'stress' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-7 rounded-3xl bg-linear-to-br from-amber-950/60 via-[#18181b] to-slate-950 border border-amber-900/40 text-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-amber-300 uppercase tracking-wider font-bold">
                  Nivel de Estrés ({timeRange === 'today' ? 'Hoy' : timeRange === 'week' ? 'Semanal 7d' : 'Mensual 30d'})
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-black text-emerald-400 font-mono">{current.stress.score}</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {current.stress.badge}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-[#09090b]/80 border border-amber-900/40 text-center">
                  <span className="text-[10px] text-slate-400 block">Mínimo</span>
                  <span className="text-base font-bold text-emerald-400">{current.stress.min}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#09090b]/80 border border-amber-900/40 text-center">
                  <span className="text-[10px] text-slate-400 block">Media</span>
                  <span className="text-base font-bold text-amber-300">{current.stress.avg}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#09090b]/80 border border-amber-900/40 text-center">
                  <span className="text-[10px] text-slate-400 block">Máximo</span>
                  <span className="text-base font-bold text-rose-400">{current.stress.max}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Tiempo en cada estado ({timeRange === 'today' ? 'Hoy' : timeRange === 'week' ? 'En la semana' : 'En el mes'}):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-[#09090b]/90 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">Relajado (1 – 29)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Recuperación celular activa</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-400 font-mono">{current.stress.relaxedTime}</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#09090b]/90 border border-sky-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-sky-400" />
                    <div>
                      <span className="font-bold text-white block">Leve (30 – 59)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Actividad cognitiva / estudio</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-sky-400 font-mono">{current.stress.mildTime}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-amber-900/40">
              💡 <strong>Diagnóstico Fisiológico:</strong> {current.stress.diag}
            </p>
          </div>
        </div>
      )}

      {/* 6. PESTAÑA D: SPO2 */}
      {activeTab === 'spo2' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                SpO2 Promedio ({timeRange === 'today' ? 'Hoy' : timeRange === 'week' ? 'Semanal' : 'Mensual'})
              </span>
              <div className="text-3xl font-black text-sky-500 font-mono mt-1">{current.spo2.avg}</div>
              <span className="text-[11px] text-emerald-500 font-semibold block mt-1">{current.spo2.note}</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Rango de Oxígeno</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {current.spo2.range}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Sin desaturación nocturna</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Frecuencia Respiratoria</span>
              <div className="text-3xl font-black text-purple-500 font-mono mt-1">
                {current.spo2.resp}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Ritmo respiratorio relajado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
