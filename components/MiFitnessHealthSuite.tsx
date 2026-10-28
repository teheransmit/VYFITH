'use client';

import React, { useState } from 'react';
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

export default function MiFitnessHealthSuite() {
  const [activeTab, setActiveTab] = useState<'sleep' | 'heart' | 'stress' | 'spo2'>('sleep');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

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
            Arquitectura idéntica a la app <strong>Mi Fitness</strong> con tus métricas fisiológicas reales: hipnograma de sueño, zonas de FC (VO2 Máx), monitoreo de estrés continuo y animal del sueño.
          </p>
        </div>

        {/* Selector de Rango Temporal */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="bg-slate-100 dark:bg-[#09090b] p-1 rounded-xl border border-slate-200 dark:border-[#27272a] flex items-center text-xs font-mono">
            <button
              onClick={() => setTimeRange('today')}
              className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hoy / Último
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === 'week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semanal (7d)
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold transition-all ${
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

      {/* 2. SELECTOR DE PESTAÑAS ESTILO MI FITNESS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              94% Efic.
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Sueño & Fases</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">8h 12m</span>
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
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Ritmo Cardíaco</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">60 – 158 lpm</span>
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
              Relajado
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Nivel de Estrés</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">20 / 100</span>
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
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Oxígeno & Respiración</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">97% • 15 rpm</span>
          </div>
        </button>
      </div>

      {/* 3. PESTAÑA A: ARQUITECTURA DEL SUEÑO (HIPNOGRAMA + INDICADORES + ANIMAL DEL SUEÑO) */}
      {activeTab === 'sleep' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Tarjeta Hero de Sueño */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-indigo-950 via-[#18181b] to-slate-950 border border-indigo-900/50 text-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-indigo-300 font-semibold block">
                  Noche de ayer • 22:48 – 07:00
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                  8 horas 12 minutos
                </h3>
              </div>

              {/* Animal del Sueño Xiaomi */}
              <div className="p-3.5 rounded-2xl bg-indigo-900/40 border border-indigo-500/30 flex items-center gap-3">
                <span className="text-3xl">🐻</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Animal del Sueño:</span>
                    <span className="text-xs font-black text-amber-300">El Oso</span>
                  </div>
                  <span className="text-[11px] text-slate-300 leading-tight block">
                    Cronotipo regular, sueño reparador profundo y recuperación muscular óptima.
                  </span>
                </div>
              </div>
            </div>

            {/* HIPNOGRAMA VISUAL DE FASES (Idéntico a Mi Fitness) */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-slate-300 font-mono">
                <span>22:48</span>
                <span>01:00</span>
                <span>03:00</span>
                <span>05:00</span>
                <span>07:00</span>
              </div>

              {/* Barra segmentada de fases */}
              <div className="h-7 w-full rounded-xl overflow-hidden flex bg-slate-900 border border-indigo-500/30">
                <div style={{ width: '12%' }} className="bg-sky-500/80" title="Ligero: 12%" />
                <div style={{ width: '22%' }} className="bg-indigo-600" title="Profundo: 22%" />
                <div style={{ width: '16%' }} className="bg-sky-500/80" title="Ligero: 16%" />
                <div style={{ width: '26%' }} className="bg-cyan-400" title="REM: 26%" />
                <div style={{ width: '3%' }} className="bg-orange-500" title="Despierto: 3%" />
                <div style={{ width: '15%' }} className="bg-sky-500/80" title="Ligero: 15%" />
                <div style={{ width: '6%' }} className="bg-indigo-600" title="Profundo: 6%" />
              </div>

              {/* Leyenda de Fases con Horas y Porcentajes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                <div className="p-3 rounded-xl bg-[#09090b]/80 border border-indigo-900/40">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span>Profundo (N3)</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono">1h 48m</span>
                  <span className="text-[10px] text-slate-400 block font-mono">22% • Óptimo</span>
                </div>

                <div className="p-3 rounded-xl bg-[#09090b]/80 border border-indigo-900/40">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>Ligero</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono">4h 18m</span>
                  <span className="text-[10px] text-slate-400 block font-mono">52% • Normal</span>
                </div>

                <div className="p-3 rounded-xl bg-[#09090b]/80 border border-indigo-900/40">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>Sueño REM</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono">2h 06m</span>
                  <span className="text-[10px] text-slate-400 block font-mono">26% • Excelente</span>
                </div>

                <div className="p-3 rounded-xl bg-[#09090b]/80 border border-indigo-900/40">
                  <div className="flex items-center gap-1.5 text-orange-400 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span>Despierto</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono">14 min</span>
                  <span className="text-[10px] text-slate-400 block font-mono">2 despertares</span>
                </div>
              </div>
            </div>

            {/* 4 Indicadores Fisiológicos Nocturnos */}
            <div className="pt-4 border-t border-indigo-900/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="text-slate-400 block text-[11px]">RHR Durmiendo</span>
                <span className="text-lg font-black text-rose-400 font-mono">60 lpm</span>
                <span className="text-[10px] text-emerald-400 block font-mono">Excelente Tono Vagal</span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="text-slate-400 block text-[11px]">SpO2 Nocturno</span>
                <span className="text-lg font-black text-sky-400 font-mono">97%</span>
                <span className="text-[10px] text-emerald-400 block font-mono">Oxigenación Perfecta</span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="text-slate-400 block text-[11px]">Frecuencia Respiratoria</span>
                <span className="text-lg font-black text-purple-400 font-mono">15 rpm</span>
                <span className="text-[10px] text-slate-300 block font-mono">Eupnea Estable</span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="text-slate-400 block text-[11px]">Regularidad del Sueño</span>
                <span className="text-lg font-black text-emerald-400 font-mono">Alta</span>
                <span className="text-[10px] text-slate-300 block font-mono">Variación ±18 min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PESTAÑA B: RITMO CARDÍACO & LAS 5 ZONAS DE ENTRENAMIENTO */}
      {activeTab === 'heart' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header de Frecuencia Cardíaca */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Rango Diario</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                52 – 158 <span className="text-xs font-normal text-slate-400">lpm</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Pico en entrenamiento a las 16:35</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Frecuencia Media (Vigilia)</span>
              <div className="text-2xl font-black text-rose-500 font-mono mt-1">
                68 <span className="text-xs font-normal text-slate-400">lpm</span>
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold block mt-1">Salud cardiovascular óptima</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Frecuencia en Reposo (RHR)</span>
              <div className="text-2xl font-black text-emerald-500 font-mono mt-1">
                60 <span className="text-xs font-normal text-slate-400">lpm</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Medida durante el sueño quieto</span>
            </div>
          </div>

          {/* DESGLOSE DE LAS 5 ZONAS DE ENTRENAMIENTO ESTILO MI FITNESS */}
          <div className="p-6 rounded-3xl bg-[#18181b] border border-[#27272a] text-white space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-extrabold text-white">Zonas de Ritmo Cardíaco (Mi Fitness)</h4>
                <p className="text-xs text-slate-400">Distribución de tiempo por intensidad durante el día y el entrenamiento de fuerza</p>
              </div>
              <span className="text-xs font-mono text-indigo-400 font-bold px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-800">
                FC Máx Estimada: 198 lpm
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Zona 5: VO2 Máx */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-rose-400">Zona 5: VO2 Máx (&gt; 178 lpm)</span>
                  <span className="text-slate-300">6 min (4%)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full" style={{ width: '6%' }} />
                </div>
              </div>

              {/* Zona 4: Anaeróbico */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-amber-400">Zona 4: Anaeróbico (158 – 177 lpm)</span>
                  <span className="text-slate-300">24 min (18%)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '22%' }} />
                </div>
              </div>

              {/* Zona 3: Aeróbico */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-emerald-400">Zona 3: Aeróbico (138 – 157 lpm)</span>
                  <span className="text-slate-300">48 min (36%)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              {/* Zona 2: Intensivo / Quema de Grasa */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-sky-400">Zona 2: Intensivo (118 – 137 lpm)</span>
                  <span className="text-slate-300">1h 45m</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              {/* Zona 1: Ligero / Calentamiento */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-indigo-400">Zona 1: Ligero (&lt; 118 lpm)</span>
                  <span className="text-slate-300">3h 12m</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PESTAÑA C: MONITOREO CONTINUO DE ESTRÉS (HRV) */}
      {activeTab === 'stress' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Card Principal de Estrés */}
          <div className="p-6 sm:p-7 rounded-3xl bg-linear-to-br from-amber-950/60 via-[#18181b] to-slate-950 border border-amber-900/40 text-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-amber-300 uppercase tracking-wider font-bold">
                  Nivel de Estrés Diario (HRV)
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-black text-emerald-400 font-mono">20</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Relajado / Parasimpático
                  </span>
                </div>
              </div>

              {/* Rango Min, Max, Media de Santiago */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-[#09090b]/80 border border-amber-900/40 text-center">
                  <span className="text-[10px] text-slate-400 block">Mínimo</span>
                  <span className="text-base font-bold text-emerald-400">7</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#09090b]/80 border border-amber-900/40 text-center">
                  <span className="text-[10px] text-slate-400 block">Media</span>
                  <span className="text-base font-bold text-amber-300">20</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#09090b]/80 border border-amber-900/40 text-center">
                  <span className="text-[10px] text-slate-400 block">Máximo</span>
                  <span className="text-base font-bold text-rose-400">46</span>
                </div>
              </div>
            </div>

            {/* Desglose de Tiempo por Estados de Estrés (Datos Exactos de Santiago) */}
            <div className="pt-3 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Tiempo en cada estado de estrés:
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
                  <span className="text-base font-black text-emerald-400 font-mono">1h 14m</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#09090b]/90 border border-sky-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-sky-400" />
                    <div>
                      <span className="font-bold text-white block">Leve (30 – 59)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Actividad cognitiva / estudio</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-sky-400 font-mono">26 min</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-amber-900/40">
              💡 <strong>Diagnóstico Fisiológico:</strong> Tu sistema nervioso autónomo estuvo el 74% del tiempo en predominio parasimpático (relajación). El pico máximo de 46 coincidió con la preparación de tu entrenamiento de fuerza en la UPB.
            </p>
          </div>
        </div>
      )}

      {/* 6. PESTAÑA D: OXÍGENO EN SANGRE (SPO2) & RESPIRACIÓN */}
      {activeTab === 'spo2' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">SpO2 Promedio</span>
              <div className="text-3xl font-black text-sky-500 font-mono mt-1">97%</div>
              <span className="text-[11px] text-emerald-500 font-semibold block mt-1">Saturación celular óptima</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Rango de Oxígeno</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">95% – 99%</div>
              <span className="text-[11px] text-slate-400 block mt-1">Sin caídas hipóxicas nocturnas</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-200 dark:border-[#27272a]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Frecuencia Respiratoria</span>
              <div className="text-3xl font-black text-purple-500 font-mono mt-1">15 <span className="text-xs font-normal text-slate-400">rpm</span></div>
              <span className="text-[11px] text-slate-400 block mt-1">Respiración normal en reposo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
