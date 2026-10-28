'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Activity,
  Plus,
  RefreshCw,
  Scale,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  User,
  Sparkles,
  CheckCircle2,
  FileText,
  Flame,
  Dumbbell,
  AlertCircle,
  X,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  FemmtoDataState,
  FemmtoWeightRecord,
  INITIAL_FEMMTO_STATE,
  INITIAL_FEMMTO_RECORDS,
  createFemmtoEntry,
} from '@/lib/femmtoStore';

interface FemmtoBodyCompositionSuiteProps {
  initialData?: FemmtoDataState;
  onDataUpdated?: (newData: FemmtoDataState) => void;
}

export default function FemmtoBodyCompositionSuite({
  initialData,
  onDataUpdated,
}: FemmtoBodyCompositionSuiteProps) {
  const [dataState, setDataState] = useState<FemmtoDataState>(initialData || INITIAL_FEMMTO_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySortOrder, setHistorySortOrder] = useState<'desc' | 'asc'>('desc');

  // Form State para Nuevo Pesaje
  const [newWeight, setNewWeight] = useState<string>('55.7');
  const [newMme, setNewMme] = useState<string>('25.1');
  const [newFatPct, setNewFatPct] = useState<string>('10.6');
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newTime, setNewTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Cargar datos reales desde /api/sync/health
  const refreshFemmtoData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetch(`/api/sync/health?t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.femmtoData) {
          setDataState(json.data.femmtoData);
          if (onDataUpdated) onDataUpdated(json.data.femmtoData);
        } else if (json.data.currentMetrics?.weightKg) {
          // Si no hay femmtoData completa pero sí currentMetrics, actualizar peso en latest
          setDataState((prev) => ({
            ...prev,
            latest: {
              ...prev.latest,
              weight: { ...prev.latest.weight, value: json.data.currentMetrics.weightKg },
              bodyFatPct: { ...prev.latest.bodyFatPct, value: json.data.currentMetrics.bodyFatPct || prev.latest.bodyFatPct.value },
              skeletalMuscle: { ...prev.latest.skeletalMuscle, value: json.data.currentMetrics.skeletalMuscleKg || prev.latest.skeletalMuscle.value },
              bmi: { ...prev.latest.bmi, value: json.data.currentMetrics.bmi || prev.latest.bmi.value },
            },
          }));
        }
        if (!silent) {
          setSyncStatusMsg('✅ Datos de Báscula Femmto sincronizados en tiempo real.');
          setTimeout(() => setSyncStatusMsg(null), 4000);
        }
      }
    } catch (err) {
      console.error('Error al sincronizar Báscula Femmto:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshFemmtoData(true);
  }, []);

  // Enviar nuevo pesaje al endpoint y persistir
  const handleSaveNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeight);
    const m = parseFloat(newMme);
    const f = parseFloat(newFatPct);

    if (isNaN(w) || isNaN(m) || isNaN(f)) {
      alert('Por favor introduce valores numéricos válidos.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/sync/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_femmto_record',
          weightKg: w,
          skeletalMuscleKg: m,
          bodyFatPct: f,
          date: newDate,
          time: newTime,
        }),
      });
      const resJson = await res.json();

      if (resJson.success && resJson.data?.femmtoData) {
        setDataState(resJson.data.femmtoData);
        if (onDataUpdated) onDataUpdated(resJson.data.femmtoData);
        setSyncStatusMsg(`✅ Nuevo pesaje de ${w} kg guardado y sincronizado con éxito.`);
      } else {
        // Fallback local optimista
        const localEntry = createFemmtoEntry({
          weightKg: w,
          skeletalMuscleKg: m,
          bodyFatPct: f,
          date: newDate,
          time: newTime,
        });
        setDataState((prev) => ({
          ...prev,
          user: { ...prev.user, lastMeasurementDateTime: `${newDate} ${newTime}` },
          latest: {
            ...prev.latest,
            weight: { ...prev.latest.weight, value: localEntry.weightKg },
            skeletalMuscle: { ...prev.latest.skeletalMuscle, value: localEntry.skeletalMuscleKg },
            bodyFatPct: { ...prev.latest.bodyFatPct, value: localEntry.bodyFatPct },
            bmi: { ...prev.latest.bmi, value: localEntry.bmi },
          },
          history: [localEntry, ...prev.history],
        }));
        setSyncStatusMsg(`✅ Pesaje de ${w} kg registrado localmente.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err) {
      console.error('Error registrando pesaje:', err);
      alert('Error de conexión al guardar pesaje.');
    } finally {
      setIsLoading(false);
    }
  };

  // Historial ordenado cronológicamente para los gráficos (izq -> der)
  const chartData = useMemo(() => {
    return [...dataState.history].reverse().map((item) => ({
      ...item,
      label: item.date,
      peso: item.weightKg,
      mme: item.skeletalMuscleKg,
      mgc: item.bodyFatPct,
    }));
  }, [dataState.history]);

  // Historial filtrado para la tabla
  const filteredHistory = useMemo(() => {
    let list = [...dataState.history];
    if (searchTerm.trim()) {
      list = list.filter(
        (rec) =>
          rec.date.includes(searchTerm) ||
          rec.time.includes(searchTerm) ||
          rec.weightKg.toString().includes(searchTerm)
      );
    }
    if (historySortOrder === 'asc') {
      return list.reverse();
    }
    return list;
  }, [dataState.history, searchTerm, historySortOrder]);

  const latestRec = dataState.history[0] || INITIAL_FEMMTO_RECORDS[INITIAL_FEMMTO_RECORDS.length - 1];

  // Helper para dibujar la barra horizontal con rangos Bajo | Normal | Exceso
  const renderRangeBar = (
    label: string,
    unit: string,
    val: number,
    ticks: number[],
    normalMin: number,
    normalMax: number,
    minScale: number,
    maxScale: number
  ) => {
    const rangeSpan = maxScale - minScale;
    const clampedVal = Math.max(minScale, Math.min(maxScale, val));
    const pct = ((clampedVal - minScale) / rangeSpan) * 100;

    const normalLeftPct = Math.max(0, ((normalMin - minScale) / rangeSpan) * 100);
    const normalRightPct = Math.min(100, ((normalMax - minScale) / rangeSpan) * 100);
    const normalWidthPct = normalRightPct - normalLeftPct;

    const isBajo = val < normalMin;
    const isExceso = val > normalMax;
    const isNormal = !isBajo && !isExceso;

    return (
      <div className="py-2.5 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {label} <span className="font-normal text-slate-400">({unit})</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isNormal
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                  : isBajo
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isNormal ? 'Normal' : isBajo ? 'Bajo' : 'Exceso'}
            </span>
            <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
              {val.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Header de Zonas Bajo / Normal / Exceso */}
        <div className="flex text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
          <div style={{ width: `${normalLeftPct}%` }} className="text-left">
            Bajo
          </div>
          <div style={{ width: `${normalWidthPct}%` }} className="text-center text-teal-600 dark:text-teal-400 font-extrabold">
            Normal
          </div>
          <div style={{ width: `${100 - normalRightPct}%` }} className="text-right">
            Exceso
          </div>
        </div>

        {/* Pista de Barra con Rango Normal sombreado */}
        <div className="relative w-full h-4 bg-slate-200/80 dark:bg-slate-700/60 rounded-md overflow-hidden">
          {/* Zona Normal Sombreada */}
          <div
            className="absolute top-0 bottom-0 bg-teal-500/20 dark:bg-teal-400/20 border-x border-teal-500/40"
            style={{ left: `${normalLeftPct}%`, width: `${normalWidthPct}%` }}
          />

          {/* Barra Negra Sólida de Valor (Estilo Femmto Oficial) */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-slate-900 dark:bg-slate-100 rounded-sm transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Escala con Ticks Numéricos (Fiel a la Báscula Femmto) */}
        <div className="relative w-full h-4 text-[9px] font-mono text-slate-400 mt-1 select-none">
          {ticks.map((tick) => {
            const tickPct = ((tick - minScale) / rangeSpan) * 100;
            if (tickPct < 0 || tickPct > 100) return null;
            return (
              <span
                key={tick}
                className="absolute -translate-x-1/2"
                style={{ left: `${tickPct}%` }}
              >
                {tick}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* =========================================================================
          1. HEADER FEMMTO CON PALETA INSTITUCIONAL TEAL (#387B8E / #468294)
      ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#2c6575] via-[#387b8e] to-[#488e9f] text-white p-6 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-black tracking-tight lowercase text-white drop-shadow-xs font-mono">
                femmto
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs border border-white/30">
                Báscula de Bioimpedancia
              </span>
            </div>
            <p className="text-teal-100 text-xs sm:text-sm max-w-xl">
              Informe oficial de composición corporal por impedancia bioeléctrica tetrapolar.
              Sincronizado directamente con Google Health Connect y Vivo Y20.
            </p>
          </div>

          {/* Ficha Técnica de Usuario (Header Femmto) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-black/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-xs text-center shrink-0">
            <div className="p-2 border-r border-white/10 last:border-r-0">
              <div className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">ID</div>
              <div className="font-bold text-white truncate max-w-[110px]" title={dataState.user.name}>
                {dataState.user.name}
              </div>
            </div>
            <div className="p-2 border-r border-white/10 last:border-r-0">
              <div className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">Altura</div>
              <div className="font-mono font-bold text-white">{dataState.user.heightCm} cm</div>
            </div>
            <div className="p-2 border-r border-white/10 last:border-r-0">
              <div className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">Edad</div>
              <div className="font-mono font-bold text-white">{dataState.user.age}</div>
            </div>
            <div className="p-2 border-r border-white/10 last:border-r-0">
              <div className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">Género</div>
              <div className="font-bold text-white">{dataState.user.gender}</div>
            </div>
            <div className="p-2 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">Fecha / hora</div>
              <div className="font-mono font-bold text-white text-[11px]">
                {dataState.user.lastMeasurementDateTime}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Rápidas */}
        <div className="relative z-10 pt-4 mt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-teal-100 font-mono text-[11px]">
              27 registros históricos sincronizados (01/Ago — 28/Oct)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700" />
              <span>Registrar Pesaje</span>
            </button>
            <button
              onClick={() => refreshFemmtoData(false)}
              disabled={isLoading}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800/80 hover:bg-teal-800 text-white border border-white/20 font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sincronizar Báscula</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta Notificación */}
      {syncStatusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{syncStatusMsg}</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">Actualizado</span>
        </div>
      )}

      {/* =========================================================================
          2. ANÁLISIS DE COMPOSICIÓN CORPORAL (TABLA ESCALONADA FEMMTO)
      ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Análisis de Composición corporal</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Desglose jerárquico multicompartimental: Agua + Proteína = Masa Magra; + Minerales = Masa Libre de Grasa; + Grasa = Peso Total.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/70 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
            Tetrapolar 50 kHz
          </span>
        </div>

        {/* Tabla Jerárquica con Brackets y Agregaciones */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 border border-slate-200 dark:border-slate-700">Componente</th>
                <th className="py-3 px-4 border border-slate-200 dark:border-slate-700 text-center">Valores (Rango)</th>
                <th className="py-3 px-4 border border-slate-200 dark:border-slate-700 text-center">Total agua corporal</th>
                <th className="py-3 px-4 border border-slate-200 dark:border-slate-700 text-center">Masa corporal magra</th>
                <th className="py-3 px-4 border border-slate-200 dark:border-slate-700 text-center">Masa libre de grasa</th>
                <th className="py-3 px-4 border border-slate-200 dark:border-slate-700 text-center bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300">
                  Peso
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {/* Fila 1: Agua Corporal */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                  Total de agua corporal <span className="text-slate-400 font-normal">(L)</span>
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{dataState.latest.water.value}</div>
                  <div className="font-mono text-[10px] text-slate-400">({dataState.latest.water.rangeMin} - {dataState.latest.water.rangeMax})</div>
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center font-mono font-extrabold text-teal-600 dark:text-teal-400 text-sm">
                  {dataState.latest.water.value}
                </td>
                <td rowSpan={2} className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center bg-slate-50/60 dark:bg-slate-800/40 align-middle">
                  <div className="font-mono font-extrabold text-slate-900 dark:text-white text-base">
                    {dataState.latest.leanBodyMass.value}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    ({dataState.latest.leanBodyMass.rangeMin} - {dataState.latest.leanBodyMass.rangeMax})
                  </div>
                  <div className="text-[9px] text-teal-600 dark:text-teal-400 font-bold uppercase mt-1">Agua + Proteína</div>
                </td>
                <td rowSpan={3} className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center bg-slate-100/50 dark:bg-slate-800/60 align-middle">
                  <div className="font-mono font-extrabold text-slate-900 dark:text-white text-base">
                    {dataState.latest.fatFreeMass.value}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">( - )</div>
                  <div className="text-[9px] text-teal-600 dark:text-teal-400 font-bold uppercase mt-1">Magra + Minerales</div>
                </td>
                <td rowSpan={4} className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center bg-teal-50/70 dark:bg-teal-950/40 align-middle">
                  <div className="font-mono font-black text-2xl text-teal-700 dark:text-teal-300">
                    {dataState.latest.weight.value}
                  </div>
                  <div className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                    ({dataState.latest.weight.rangeMin} - {dataState.latest.weight.rangeMax})
                  </div>
                  <div className="text-[10px] text-teal-800 dark:text-teal-300 font-bold uppercase mt-1">
                    Peso Oficial (Kg)
                  </div>
                </td>
              </tr>

              {/* Fila 2: Proteína */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                  Proteína <span className="text-slate-400 font-normal">(Kg)</span>
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{dataState.latest.protein.value}</div>
                  <div className="font-mono text-[10px] text-slate-400">({dataState.latest.protein.rangeMin} - {dataState.latest.protein.rangeMax})</div>
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center text-slate-300 dark:text-slate-600">
                  —
                </td>
              </tr>

              {/* Fila 3: Minerales */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                  Minerales <span className="text-slate-400 font-normal">(Kg)</span>
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{dataState.latest.minerals.value}</div>
                  <div className="font-mono text-[10px] text-slate-400">({dataState.latest.minerals.rangeMin} - {dataState.latest.minerals.rangeMax})</div>
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center text-slate-300 dark:text-slate-600">
                  —
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center text-slate-300 dark:text-slate-600">
                  —
                </td>
              </tr>

              {/* Fila 4: Grasa Corporal */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                  Masa de grasa corporal <span className="text-slate-400 font-normal">(Kg)</span>
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{dataState.latest.fatMass.value}</div>
                  <div className="font-mono text-[10px] text-slate-400">({dataState.latest.fatMass.rangeMin} - {dataState.latest.fatMass.rangeMax})</div>
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center text-slate-300 dark:text-slate-600">
                  —
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center text-slate-300 dark:text-slate-600">
                  —
                </td>
                <td className="py-3 px-4 border border-slate-200 dark:border-slate-800 text-center text-slate-300 dark:text-slate-600">
                  —
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          3. ANÁLISIS DE MASA MUSCULAR Y OBESIDAD (BARRAS MULTI-ESCALA)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 2: Masa Muscular */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Análisis de Masa muscular</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Báscula Femmto
            </span>
          </div>

          <div className="space-y-1">
            {renderRangeBar(
              'Peso',
              'Kg',
              dataState.latest.weight.value,
              [35, 45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145],
              54.7,
              74.0,
              35,
              145
            )}

            {renderRangeBar(
              'MME (Masa muscular esquelética)',
              'Kg',
              dataState.latest.skeletalMuscle.value,
              [5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71],
              23.0,
              35.0,
              5,
              71
            )}

            {renderRangeBar(
              'Masa de grasa corporal',
              'Kg',
              dataState.latest.fatMass.value,
              [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40],
              4.1,
              11.8,
              0,
              40
            )}
          </div>
        </div>

        {/* Card 3: Obesidad & Grasa */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Análisis de Obesidad</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Báscula Femmto
            </span>
          </div>

          <div className="space-y-1">
            {renderRangeBar(
              'IMC (Índice de masa corporal)',
              'Kg/m²',
              dataState.latest.bmi.value,
              [11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55],
              18.5,
              24.9,
              11,
              55
            )}

            {renderRangeBar(
              'PGC (Porcentaje de grasa corporal)',
              '%',
              dataState.latest.bodyFatPct.value,
              [0, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70],
              10.0,
              20.0,
              0,
              70
            )}
          </div>

          {/* Tarjeta de Recomendación Atlética */}
          <div className="mt-4 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Diagnóstico Antropométrico Oficial:</span>
              <p className="text-[11px] text-teal-800 dark:text-teal-300/90 mt-0.5 leading-relaxed">
                Con <strong>55.7 kg</strong> y <strong>10.6% de grasa</strong> (5.9 kg de grasa corporal total), tu estado físico es <strong>atlético magro de alta definición</strong>. La meta física es mantener el porcentaje de grasa entre 10% y 12% mientras se progresa de 55.7 kg a <strong>60.0 kg</strong> mediante sobrecarga progresiva en Hevy y superávit calórico limpio.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. GRÁFICOS DE EVOLUCIÓN TEMPORAL (PESO vs MME & GRASA CORPORAL)
      ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-8">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Evolución Temporal: Peso (kg) y Masa Muscular Esquelética MME (kg)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Serie continua de 27 pesajes. Eje izquierdo: Peso (kg) [Celeste] • Eje derecho: MME (kg) [Azul oscuro].
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5 text-sky-500">
                <span className="w-3 h-1.5 bg-[#6baed6] rounded-xs" />
                <span>Peso (kg)</span>
              </span>
              <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                <span className="w-3 h-1.5 bg-[#2b4c7e] rounded-xs" />
                <span>MME (kg)</span>
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  height={40}
                />
                {/* Eje Izquierdo: Peso (51 a 57 kg exacto a Femmto) */}
                <YAxis
                  yAxisId="left"
                  domain={[51, 57]}
                  ticks={[51, 52, 53, 54, 55, 56, 57]}
                  tick={{ fontSize: 10, fill: '#0284c7' }}
                  tickFormatter={(v) => `${v}`}
                />
                {/* Eje Derecho: MME (23.0 a 27.0 kg exacto a Femmto) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[23.0, 27.0]}
                  ticks={[23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0]}
                  tick={{ fontSize: 10, fill: '#1e3a8a' }}
                  tickFormatter={(v) => v.toFixed(1)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as any;
                      return (
                        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs font-mono border border-slate-700">
                          <div className="font-bold text-teal-400 mb-1">{d.date} a las {d.time}</div>
                          <div className="text-sky-300">Peso: {d.peso} kg</div>
                          <div className="text-indigo-300">MME: {d.mme} kg</div>
                          <div className="text-slate-400">Grasa: {d.mgc}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Línea Peso: Celeste #6baed6 */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="peso"
                  stroke="#6baed6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6baed6' }}
                  activeDot={{ r: 5 }}
                />
                {/* Línea MME: Azul oscuro #2b4c7e */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="mme"
                  stroke="#2b4c7e"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2b4c7e' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Masa de Grasa Corporal (%) */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Masa de grasa corporal (%) / PGC</span>
              </h3>
              <p className="text-xs text-slate-400">
                Eje Y: 6% a 12% de grasa corporal. Manteniéndose consistentemente en rango magro atlético.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              Último: {latestRec.bodyFatPct}%
            </span>
          </div>

          <div className="h-52 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  height={40}
                />
                <YAxis
                  domain={[6, 12]}
                  ticks={[6, 7, 8, 9, 10, 11, 12]}
                  tick={{ fontSize: 10, fill: '#334155' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as any;
                      return (
                        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-xs font-mono border border-slate-700">
                          <div className="font-bold text-teal-400">{d.date} a las {d.time}</div>
                          <div className="text-slate-200 mt-1">Grasa Corporal: <strong>{d.mgc}%</strong></div>
                          <div className="text-slate-400">Peso: {d.peso} kg</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mgc"
                  stroke="#1c3b57"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#1c3b57' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. TABLA DE HISTORIAL COMPLETO (PAGE 2 DEL PDF DE FEMMTO)
      ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Historial de Mediciones (Página 2 Femmto)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registro completo de pesajes capturados por la báscula de bioimpedancia con fecha, hora, MME y % de grasa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar fecha o peso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={() => setHistorySortOrder(historySortOrder === 'desc' ? 'asc' : 'desc')}
              className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {historySortOrder === 'desc' ? 'Más recientes primero ↓' : 'Más antiguos primero ↑'}
            </button>
          </div>
        </div>

        {/* Tabla Oficial */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#468294] text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Hora</th>
                <th className="py-3 px-4 text-center">Peso (kg)</th>
                <th className="py-3 px-4 text-center">MME (kg)</th>
                <th className="py-3 px-4 text-center">MGC (%)</th>
                <th className="py-3 px-4 text-right">IMC Calculado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredHistory.map((row, idx) => {
                const isLatest = idx === 0 && historySortOrder === 'desc';
                return (
                  <tr
                    key={row.id || idx}
                    className={`transition-colors ${
                      isLatest
                        ? 'bg-teal-50/70 dark:bg-teal-950/40 font-bold'
                        : idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/50 dark:bg-slate-800/40'
                    } hover:bg-teal-50/30 dark:hover:bg-teal-950/20`}
                  >
                    <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {isLatest && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                      <span>{row.date}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{row.time}</td>
                    <td className="py-2.5 px-4 text-center font-extrabold text-slate-900 dark:text-white">
                      {row.weightKg.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-4 text-center text-teal-700 dark:text-teal-300 font-bold">
                      {row.skeletalMuscleKg.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-700 dark:text-slate-300">
                      {row.bodyFatPct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400">
                      {row.bmi ? row.bmi.toFixed(2) : (row.weightKg / (1.72 * 1.72)).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resumen Estadístico al pie */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Peso Mínimo</div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">52.6 kg (28/Ago)</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Peso Máximo</div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">56.0 kg (15/Sep)</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Promedio Serie</div>
            <div className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">54.9 kg • 25.0 kg MME</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Grasa Promedio</div>
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">9.8% PGC</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. MODAL: REGISTRAR NUEVO PESAJE / SINCRONIZAR
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Registrar Pesaje Femmto
                </h3>
                <p className="text-xs text-slate-500">
                  Ingresa las métricas capturadas por tu báscula inteligente.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveNewRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Fecha (DD/MM)
                  </label>
                  <input
                    type="text"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Hora (HH:mm)
                  </label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Peso Total (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-3 py-2 text-base font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    MME Músculo (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newMme}
                    onChange={(e) => setNewMme(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Grasa Corporal (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newFatPct}
                    onChange={(e) => setNewFatPct(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div>
                  IMC estimado: <strong>{((parseFloat(newWeight) || 55.7) / (1.72 * 1.72)).toFixed(2)} kg/m²</strong>
                </div>
                <div>
                  Masa libre de grasa estimada:{' '}
                  <strong>
                    {(
                      (parseFloat(newWeight) || 55.7) *
                      (1 - (parseFloat(newFatPct) || 10.6) / 100)
                    ).toFixed(1)}{' '}
                    kg
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Guardando...' : 'Guardar Pesaje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
