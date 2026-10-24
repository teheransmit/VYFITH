'use client';

import React, { useState } from 'react';
import {
  Dumbbell,
  Flame,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
  Upload,
  RefreshCw,
} from 'lucide-react';

interface MuscleGroupVolume {
  id: string;
  name: string;
  sets: number;
  mev: number; // Minimum Effective Volume
  mrv: number; // Maximum Recoverable Volume
  status: 'optimal' | 'maintenance' | 'under' | 'over';
  color: string;
  lastExercise: string;
}

export default function MuscleHeatmap() {
  const [selectedMuscle, setSelectedMuscle] = useState<string>('chest');
  const [isSimulatingCsv, setIsSimulatingCsv] = useState(false);
  const [csvNotice, setCsvNotice] = useState<string | null>(null);

  const muscleVolumes: Record<string, MuscleGroupVolume> = {
    chest: {
      id: 'chest',
      name: 'Pectoral (Pecho)',
      sets: 16,
      mev: 10,
      mrv: 20,
      status: 'optimal',
      color: '#10B981', // Verde
      lastExercise: 'Press Banca con Barra 65 kg (4 series)',
    },
    back: {
      id: 'back',
      name: 'Espalda & Dorsales',
      sets: 18,
      mev: 12,
      mrv: 22,
      status: 'optimal',
      color: '#10B981',
      lastExercise: 'Jalón al Pecho 75 kg & Remo con Mancuerna (4 series)',
    },
    shoulders: {
      id: 'shoulders',
      name: 'Deltoides (Hombros)',
      sets: 12,
      mev: 8,
      mrv: 18,
      status: 'optimal',
      color: '#10B981',
      lastExercise: 'Press Militar Mancuernas 22 kg & Elevaciones Laterales',
    },
    triceps: {
      id: 'triceps',
      name: 'Tríceps (Prioridad)',
      sets: 14,
      mev: 8,
      mrv: 16,
      status: 'optimal',
      color: '#10B981',
      lastExercise: 'Press Francés 30 kg & Extensiones en Polea',
    },
    biceps: {
      id: 'biceps',
      name: 'Bíceps & Braquial',
      sets: 10,
      mev: 8,
      mrv: 16,
      status: 'maintenance',
      color: '#F59E0B', // Ámbar
      lastExercise: 'Curl Inclinado con Mancuernas 14 kg',
    },
    quads: {
      id: 'quads',
      name: 'Cuádriceps',
      sets: 12,
      mev: 10,
      mrv: 18,
      status: 'optimal',
      color: '#10B981',
      lastExercise: 'Sentadilla Profunda 80 kg & Prensa 45°',
    },
    hamstrings: {
      id: 'hamstrings',
      name: 'Femorales / Isquios',
      sets: 10,
      mev: 8,
      mrv: 16,
      status: 'maintenance',
      color: '#F59E0B',
      lastExercise: 'Peso Muerto Rumano 70 kg',
    },
    calves: {
      id: 'calves',
      name: 'Pantorrillas',
      sets: 8,
      mev: 8,
      mrv: 16,
      status: 'maintenance',
      color: '#60A5FA', // Azul
      lastExercise: 'Elevación de Talones en Máquina 60 kg',
    },
  };

  const plateaus = [
    {
      exercise: 'Sentadilla Profunda (Barra)',
      currentWeight: '80.0 kg',
      status: 'Estancamiento Detectado',
      detail: '2 sesiones consecutivas sin aumento de repeticiones en 80 kg.',
      action: 'Micro-carga de +1.25 kg o semana de descarga (Deload) al 80% del volumen.',
      type: 'warning',
    },
    {
      exercise: 'Press de Banca Plano',
      currentWeight: '65.0 kg',
      status: 'Progresión Óptima',
      detail: 'RPE 8.0 completado con 4x8 limpio.',
      action: 'Aumentar a 67.5 kg (+2.5 kg) en la próxima sesión en el Gimnasio UPB.',
      type: 'success',
    },
    {
      exercise: 'Press Militar con Mancuernas',
      currentWeight: '22.0 kg / mancuerna',
      status: 'Rango de Hipertrofia',
      detail: 'Serie efectiva al fallo técnico (RIR 1).',
      action: 'Mantener peso y consolidar 10-12 repeticiones limpias.',
      type: 'optimal',
    },
  ];

  const handleSimulateHevyCsv = () => {
    setIsSimulatingCsv(true);
    setTimeout(() => {
      setIsSimulatingCsv(false);
      setCsvNotice('¡Parser de LiftShift procesó 48 series y 14.280 kg desde Hevy CSV con éxito!');
      setTimeout(() => setCsvNotice(null), 5000);
    }, 1200);
  };

  const activeGroup = muscleVolumes[selectedMuscle] || muscleVolumes.chest;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
      {/* Header del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Motor de Hipertrofia • Inspirado en LiftShift (aree6)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Mapa de Calor Muscular & Detección de Estancamientos
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mt-0.5">
            Análisis anatómico de volumen semanal (MEV vs MRV), series efectivas y recomendaciones algorítmicas de sobrecarga progresiva sin pagar Hevy Pro.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateHevyCsv}
            disabled={isSimulatingCsv}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <Upload className={`w-3.5 h-3.5 ${isSimulatingCsv ? 'animate-bounce' : ''}`} />
            <span>{isSimulatingCsv ? 'Analizando CSV...' : 'Parser Local Hevy CSV'}</span>
          </button>
        </div>
      </div>

      {csvNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{csvNotice}</span>
        </div>
      )}

      {/* Contenido: Silueta Anatómica & Selector de Músculos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visualizador Anatómico (Silueta Vectorial) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Selecciona un grupo muscular para auditar:</span>
          </span>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            {Object.values(muscleVolumes).map((m) => {
              const isSelected = selectedMuscle === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMuscle(m.id)}
                  className={`cursor-pointer p-2 sm:p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate">
                      {m.name}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                    {m.sets} series / sem
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 w-full flex items-center justify-around text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Óptimo (MEV-MRV)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Mantenimiento
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Recuperación
            </span>
          </div>
        </div>

        {/* Detalle del Músculo Seleccionado & Alertas de Plateau */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tarjeta de Diagnóstico del Músculo Activo */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                {activeGroup.name}
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {activeGroup.sets} Series Efectivas
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
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (activeGroup.sets / activeGroup.mrv) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              <strong>Último ejercicio registrado:</strong> {activeGroup.lastExercise}
            </p>
          </div>

          {/* Detector de Estancamientos (Plateau Detection) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Diagnóstico de Sobrecarga Progresiva & Levantamientos Principales</span>
            </div>

            <div className="space-y-2.5">
              {plateaus.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    p.type === 'warning'
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white font-bold">{p.exercise}</strong>
                      <span className="font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                        {p.currentWeight}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-1">{p.detail}</p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="font-bold block text-[11px]">{p.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
