'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Clock,
  Layers,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Calendar,
  Activity,
} from 'lucide-react';
import { HevyProAnalyticsSummary, RadarAxis } from '@/lib/hevyProEngine';
import HevyBodyDistribution from './HevyBodyDistribution';

export default function HevyProAnalyticsSuite() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('7d');
  const [analytics, setAnalytics] = useState<HevyProAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('chest');

  const loadAnalytics = (p: '7d' | '30d' | '90d' | '1y') => {
    setIsLoading(true);
    fetch(`/api/sync/hevy-pro?period=${p}&t=${Date.now()}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.analytics) {
          setAnalytics(d.analytics);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAnalytics(period);
  }, [period]);

  // Coordenadas del Radar Hexagonal (Centro: 150, 150, Radio máx: 100)
  // 6 Ejes en orden: Espalda (0°), Pecho (60°), Core (120°), Hombros (180°), Brazos (240°), Piernas (300°)
  const radarAxes: RadarAxis[] = ['Espalda', 'Pecho', 'Core', 'Hombros', 'Brazos', 'Piernas'];
  const centerX = 160;
  const centerY = 150;
  const maxRadius = 95;

  const maxSetsValue = analytics
    ? Math.max(...analytics.radar.map((r) => Math.max(r.currentSets, r.previousSets, 20)))
    : 25;

  const getAxisCoords = (index: number, valueRatio: number) => {
    const angle = (index * 60 - 90) * (Math.PI / 180);
    const r = Math.max(0.08, Math.min(1.0, valueRatio)) * maxRadius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
  };

  const currentPolygonPoints = radarAxes
    .map((axis, i) => {
      const item = analytics?.radar.find((r) => r.axis === axis);
      const ratio = (item?.currentSets || 12) / maxSetsValue;
      const { x, y } = getAxisCoords(i, ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const previousPolygonPoints = radarAxes
    .map((axis, i) => {
      const item = analytics?.radar.find((r) => r.axis === axis);
      const ratio = (item?.previousSets || 10) / maxSetsValue;
      const { x, y } = getAxisCoords(i, ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="bg-[#0B0B0E] border border-[#262630] rounded-3xl p-6 sm:p-8 text-white space-y-7 shadow-2xl transition-colors">
      {/* 1. HEADER HEVY PRO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#262630]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0088FF]/15 text-[#38BDF8] border border-[#0088FF]/30 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#0088FF]" />
              Hevy PRO Desbloqueado • Analítica Muscular & Radar
            </span>
            <span className="text-xs font-mono text-slate-400">
              Ponderación Primaria (1.0) / Secundaria (0.5) • 1RM Brzycki & Epley
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Distribución Muscular & Estadísticas Avanzadas
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Visualización comparativa del estímulo neuromuscular acumulado en el Gimnasio UPB y rutinas de sobrecarga.
          </p>
        </div>

        {/* Selector de Rango Temporal */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="bg-[#16161D] p-1 rounded-xl border border-[#262630] flex items-center text-xs font-mono">
            {(['7d', '30d', '90d', '1y'] as const).map((p) => {
              const labels = {
                '7d': 'Últimos 7 días',
                '30d': '30 días',
                '90d': '90 días',
                '1y': 'Año',
              };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                    period === p
                      ? 'bg-[#0088FF] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => loadAnalytics(period)}
            className="p-2 rounded-xl bg-[#16161D] border border-[#262630] hover:text-[#0088FF] text-slate-400 cursor-pointer transition-all"
            title="Recargar analítica"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0088FF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. MOSAICO CENTRAL: RADAR HEXAGONAL (IZQ) & 4 TARJETAS CON DELTAS (DER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* GRÁFICO DE RADAR HEXAGONAL HEVY PRO (lg:col-span-6) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#16161D] border border-[#262630] flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-[#38BDF8] font-bold">Distribución de los Músculos</span>
            {/* Leyenda Actual vs Anterior */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#0088FF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0088FF]" />
                <span>Actual</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6B7280]" />
                <span>Anterior</span>
              </span>
            </div>
          </div>

          <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
            <svg viewBox="0 0 320 300" className="w-full h-full overflow-visible">
              {/* Telaraña / Concéntricos */}
              {[0.25, 0.5, 0.75, 1.0].map((ringRatio, rIdx) => {
                const ringPoints = radarAxes
                  .map((_, i) => {
                    const { x, y } = getAxisCoords(i, ringRatio);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={rIdx}
                    points={ringPoints}
                    fill="none"
                    stroke="#262630"
                    strokeWidth="1"
                    strokeDasharray={rIdx < 3 ? '2 2' : 'none'}
                  />
                );
              })}

              {/* Ejes Radiales desde el Centro */}
              {radarAxes.map((_, i) => {
                const { x, y } = getAxisCoords(i, 1.0);
                return (
                  <line
                    key={i}
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke="#262630"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Polígono Periodo Anterior (Gris #6B7280 con opacidad) */}
              <polygon
                points={previousPolygonPoints}
                fill="#6B7280"
                fillOpacity="0.22"
                stroke="#6B7280"
                strokeWidth="2"
                strokeDasharray="3 3"
              />

              {/* Polígono Periodo Actual (Azul Eléctrico #0088FF con glow) */}
              <polygon
                points={currentPolygonPoints}
                fill="#0088FF"
                fillOpacity="0.4"
                stroke="#0088FF"
                strokeWidth="2.5"
                className="transition-all duration-500"
              />

              {/* Vértices del Polígono Actual */}
              {radarAxes.map((axis, i) => {
                const item = analytics?.radar.find((r) => r.axis === axis);
                const ratio = (item?.currentSets || 12) / maxSetsValue;
                const { x, y } = getAxisCoords(i, ratio);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#38BDF8"
                    stroke="#0B0B0E"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Etiquetas de los 6 Ejes */}
              {radarAxes.map((axis, i) => {
                const { x, y } = getAxisCoords(i, 1.18);
                const item = analytics?.radar.find((r) => r.axis === axis);
                return (
                  <g key={i}>
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {axis}
                    </text>
                    <text
                      x={x}
                      y={y + 11}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#38BDF8"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      {item ? `${item.currentSets}s` : '0s'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <span className="text-[11px] text-slate-400 font-mono mt-1 text-center">
            Ponderación Hevy PRO: Músculo primario = 1.0 serie • Secundario = 0.5 series
          </span>
        </div>

        {/* 4 TARJETAS CON DELTAS COMPARATIVOS (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Tarjeta 1: Entrenamientos */}
            <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[#0088FF]" />
                  <span>Entrenamientos</span>
                </span>
                {analytics?.cards.workouts && (
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      analytics.cards.workouts.isPositive ? 'text-[#10B981]' : 'text-rose-400'
                    }`}
                  >
                    {analytics.cards.workouts.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{analytics.cards.workouts.deltaPct}%</span>
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white font-mono">
                  {analytics?.cards.workouts.currentDisplay || '4'}
                </span>
                <span className="text-xs text-slate-500 font-mono block mt-0.5">
                  vs. {analytics?.cards.workouts.previousDisplay || '3'} anterior
                </span>
              </div>
            </div>

            {/* Tarjeta 2: Duración */}
            <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Duración</span>
                </span>
                {analytics?.cards.duration && (
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      analytics.cards.duration.isPositive ? 'text-[#10B981]' : 'text-rose-400'
                    }`}
                  >
                    {analytics.cards.duration.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{analytics.cards.duration.deltaPct}%</span>
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white font-mono">
                  {analytics?.cards.duration.currentDisplay || '4h 32min'}
                </span>
                <span className="text-xs text-slate-500 font-mono block mt-0.5">
                  vs. {analytics?.cards.duration.previousDisplay || '3h 50min'} anterior
                </span>
              </div>
            </div>

            {/* Tarjeta 3: Volumen Total */}
            <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Volumen Total</span>
                </span>
                {analytics?.cards.volume && (
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      analytics.cards.volume.isPositive ? 'text-[#10B981]' : 'text-rose-400'
                    }`}
                  >
                    {analytics.cards.volume.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{analytics.cards.volume.deltaPct}%</span>
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white font-mono">
                  {analytics?.cards.volume.currentDisplay || '15,400 kg'}
                </span>
                <span className="text-xs text-slate-500 font-mono block mt-0.5">
                  vs. {analytics?.cards.volume.previousDisplay || '13,500 kg'} anterior
                </span>
              </div>
            </div>

            {/* Tarjeta 4: Series Totales */}
            <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Series Totales</span>
                </span>
                {analytics?.cards.sets && (
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      analytics.cards.sets.isPositive ? 'text-[#10B981]' : 'text-rose-400'
                    }`}
                  >
                    {analytics.cards.sets.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{analytics.cards.sets.deltaPct}%</span>
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white font-mono">
                  {analytics?.cards.sets.currentDisplay || '76 series'}
                </span>
                <span className="text-xs text-slate-500 font-mono block mt-0.5">
                  vs. {analytics?.cards.sets.previousDisplay || '65 series'} anterior
                </span>
              </div>
            </div>
          </div>

          {/* RECUENTO DE SERIES POR GRUPO MUSCULAR (PRO) CON UMBRAL DE HIPERTROFIA */}
          <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white">
                Series Semanales por Músculo (Rango Óptimo 10–20 series)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">MEV / MAV / MRV</span>
            </div>

            <div className="space-y-2 text-xs">
              {(analytics?.radar || []).map((item) => {
                const pct = Math.min(100, (item.currentSets / 25) * 100);
                const isOptimal = item.currentSets >= 10 && item.currentSets <= 22;
                return (
                  <div key={item.axis} className="space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-300 font-semibold">{item.axis}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{item.currentSets} series</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md ${
                            isOptimal
                              ? 'bg-[#10B981]/20 text-[#10B981]'
                              : item.currentSets < 10
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.statusLabel.split('(')[0].trim()}
                        </span>
                      </div>
                    </div>
                    {/* Barra de Progreso de Series */}
                    <div className="h-2 w-full rounded-full bg-[#0B0B0E] overflow-hidden flex">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOptimal ? 'bg-[#0088FF]' : item.currentSets < 10 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DISTRIBUCIÓN CORPORAL ANATÓMICA HEVY PRO (ESTILO HEVY OFICIAL) */}
      <div className="pt-2">
        <HevyBodyDistribution />
      </div>

      {/* 4. TOP EJERCICIOS Y RÉCORDS PERSONALES (1RM PRO) */}
      <div className="pt-2">
        <div className="p-6 rounded-2xl bg-[#16161D] border border-[#262630] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Ejercicios Principales & Progresión de 1RM</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Fórmula Compuesta Epley / Brzycki</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(analytics?.topExercises || []).map((ex, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#262630] hover:border-[#0088FF] transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{ex.esTitle || ex.name}</span>
                    {ex.isPr && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black font-mono shrink-0">
                        PR 🔥
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0088FF]/15 text-[#38BDF8] font-mono">
                      {ex.muscleGroup}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {ex.totalSets} series • {ex.totalVolumeKg.toLocaleString()} kg
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">1RM</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {ex.estimated1RM} kg
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#262630] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Auditado directamente desde Hevy Workouts CSV / API.</span>
            <span className="text-[#38BDF8] font-bold">100% Hevy PRO Desbloqueado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
