'use client';

import React, { useState, useCallback } from 'react';
import {
  Activity,
  Brain,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Moon,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Sliders,
} from 'lucide-react';
import {
  AcademicMilestone,
  BiomedicalInputPayload,
  BiomedicalPrescriptionOutput,
  computeDeterministicBiomedicalAnalysis,
  DEFAULT_SANTIAGO_BIOMEDICAL_INPUT,
  MathematicalDiagnosticMetadata,
} from '@/lib/biomedicalEngine';

export default function BiomedicalIntelligencePanel() {
  const initialComputed = computeDeterministicBiomedicalAnalysis(DEFAULT_SANTIAGO_BIOMEDICAL_INPUT);

  const [inputState, setInputState] = useState<BiomedicalInputPayload>(
    initialComputed.normalizedInput
  );
  const [prescription, setPrescription] = useState<BiomedicalPrescriptionOutput>(
    initialComputed.prescription
  );
  const [diagnostics, setDiagnostics] = useState<MathematicalDiagnosticMetadata>(
    initialComputed.diagnostics
  );
  const [engineSource, setEngineSource] = useState<string>('Deterministic Mathematical Matrix');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const runBiomedicalEngine = useCallback(
    async (payloadToRun: BiomedicalInputPayload, useGemini = true) => {
      // Actualización determinista instantánea para respuesta en 0ms
      const localResult = computeDeterministicBiomedicalAnalysis(payloadToRun);
      setPrescription(localResult.prescription);
      setDiagnostics(localResult.diagnostics);

      try {
        setIsCalculating(true);
        const res = await fetch('/api/biomedical-engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payloadToRun, useGemini }),
        });
        if (res.ok) {
          const data = await res.json();
          const { _meta, ...strictPrescription } = data;
          if (strictPrescription && typeof strictPrescription.readinessScore === 'number') {
            setPrescription(strictPrescription as BiomedicalPrescriptionOutput);
          }
          if (_meta?.diagnostics) {
            setDiagnostics(_meta.diagnostics);
          }
          if (_meta?.engineSource) {
            setEngineSource(_meta.engineSource);
          }
        }
      } catch (err) {
        console.warn('Usando matriz matemática local:', err);
      } finally {
        setIsCalculating(false);
      }
    },
    []
  );

  const handlePresetScenario = (
    scenario: 'sweet_spot' | 'parciales_upb' | 'inhibicion_parasimpatica'
  ) => {
    let nextInput: BiomedicalInputPayload;

    if (scenario === 'sweet_spot') {
      nextInput = DEFAULT_SANTIAGO_BIOMEDICAL_INPUT;
    } else if (scenario === 'parciales_upb') {
      nextInput = {
        ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT,
        biometrics: {
          ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.biometrics,
          steps: 6400,
          restingHeartRate: 61,
          sleepMetrics: {
            totalSleepHours: 6.4,
            deepSleepHours: 1.4,
            remSleepHours: 1.2,
            lightSleepHours: 3.8,
            awakeMinutes: 28,
          },
        },
        workoutMetrics: {
          ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.workoutMetrics,
          lastWorkoutName: 'Push Day (Pectoral, Deltoides, Tríceps)',
          totalVolumeKg: 6850,
          rpeAverage: 8.5,
          acuteLoadSevenDaysKg: 31200,
          chronicLoadTwentyEightDaysKg: 94000,
        },
        academicContext: {
          ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.academicContext,
          studyHoursToday: 7.5,
          academicMilestone: 'Semana de Parciales',
        },
      };
    } else {
      // Escenario de Inhibición Parasimpática (RHR +5 bpm vs media 7d y Sueño Profundo < 1.3h + ACWR >= 1.5)
      nextInput = {
        ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT,
        biometrics: {
          ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.biometrics,
          steps: 12900,
          restingHeartRate: 65,
          rhrSevenDayMean: 59.5,
          sleepMetrics: {
            totalSleepHours: 5.8,
            deepSleepHours: 1.1,
            remSleepHours: 1.3,
            lightSleepHours: 3.4,
            awakeMinutes: 42,
          },
        },
        workoutMetrics: {
          ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.workoutMetrics,
          lastWorkoutName: 'Leg Day (Sentadilla Libre, Peso Muerto Rumano)',
          totalVolumeKg: 9400,
          rpeAverage: 9.4,
          acuteLoadSevenDaysKg: 38500,
          chronicLoadTwentyEightDaysKg: 98000,
        },
        academicContext: {
          ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.academicContext,
          studyHoursToday: 8.0,
          academicMilestone: 'Entrega Proyecto Final',
        },
      };
    }

    setInputState(nextInput);
    void runBiomedicalEngine(nextInput, true);
  };



  const acwrColor =
    prescription.biomedicalSummary.acwr >= 0.8 && prescription.biomedicalSummary.acwr <= 1.3
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : prescription.biomedicalSummary.acwr < 1.5
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <div className="rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 shadow-lg">
      {/* Encabezado Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Motor Biomédico, Fisiología del Ejercicio & Rendimiento UPB
            </span>
            <span className="text-xs font-mono text-slate-400">
              Xiaomi Smart Band 9 Pro • Hevy • UPB Montería (6.° Sem. Ing. Civil)
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Santiago Smit Teherán Mogollón — Matriz Fisiológica y Cognitiva
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            Correlación matemática de 3 ventanas temporales: Microciclo ACWR (7d), Regresión Lineal de RHR y Sueño REM en exámenes (30d), y Sinergia Biomecánica con Descargas (Deload) en cortes del 30% y 40% UPB (6m).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <button
            onClick={() => setShowSimulator((prev) => !prev)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showSimulator ? 'Ocultar Parámetros' : 'Simulador Fisiológico / UPB'}</span>
          </button>
          <button
            onClick={() => runBiomedicalEngine(inputState, true)}
            disabled={isCalculating}
            className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
            <span>Recalcular con IA</span>
          </button>
        </div>
      </div>

      {/* Escenarios Rápidos y Controles del Simulador */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1">
          Escenarios de Prueba:
        </span>
        <button
          onClick={() => handlePresetScenario('sweet_spot')}
          className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
        >
          1. Sweet Spot (ACWR 1.12 • RHR 58 bpm • N3 1.8h)
        </button>
        <button
          onClick={() => handlePresetScenario('parciales_upb')}
          className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
        >
          2. Semana de Parciales UPB (REM 1.2h &lt; 1.5h • Estructuras/Vías II)
        </button>
        <button
          onClick={() => handlePresetScenario('inhibicion_parasimpatica')}
          className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors"
        >
          3. Alerta Inhibición Parasimpática (RHR +5.5 bpm • N3 1.1h • ACWR 1.57)
        </button>
      </div>

      {showSimulator && (
        <div className="mt-5 p-5 rounded-2xl bg-slate-800/80 border border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              FC en Reposo (RHR Hoy - bpm)
            </label>
            <input
              type="number"
              value={inputState.biometrics.restingHeartRate}
              onChange={(e) =>
                setInputState((prev) => ({
                  ...prev,
                  biometrics: {
                    ...prev.biometrics,
                    restingHeartRate: Number(e.target.value) || 58,
                  },
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Sueño Profundo N3 (Horas)
            </label>
            <input
              type="number"
              step="0.1"
              value={inputState.biometrics.sleepMetrics.deepSleepHours}
              onChange={(e) =>
                setInputState((prev) => ({
                  ...prev,
                  biometrics: {
                    ...prev.biometrics,
                    sleepMetrics: {
                      ...prev.biometrics.sleepMetrics,
                      deepSleepHours: Number(e.target.value) || 1.5,
                    },
                  },
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Sueño REM Cognitivo (Horas)
            </label>
            <input
              type="number"
              step="0.1"
              value={inputState.biometrics.sleepMetrics.remSleepHours}
              onChange={(e) =>
                setInputState((prev) => ({
                  ...prev,
                  biometrics: {
                    ...prev.biometrics,
                    sleepMetrics: {
                      ...prev.biometrics.sleepMetrics,
                      remSleepHours: Number(e.target.value) || 1.8,
                    },
                  },
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Hito Académico (UPB Montería)
            </label>
            <select
              value={inputState.academicContext.academicMilestone}
              onChange={(e) =>
                setInputState((prev) => ({
                  ...prev,
                  academicContext: {
                    ...prev.academicContext,
                    academicMilestone: e.target.value as AcademicMilestone,
                  },
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="Normal">Normal</option>
              <option value="Semana de Parciales">Semana de Parciales</option>
              <option value="Entrega Proyecto Final">Entrega Proyecto Final</option>
            </select>
          </div>
        </div>
      )}

      {/* Alerta de Inhibición Parasimpática si se activa */}
      {diagnostics.parasympatheticInhibitionAlert && (
        <div className="mt-5 p-4 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="text-rose-100 block text-sm mb-0.5">
              ALERTA DE INHIBICIÓN PARASIMPÁTICA Y FATIGA DEL SNC DETECTADA
            </strong>
            La RHR diaria ({inputState.biometrics.restingHeartRate} bpm) se elevó{' '}
            <strong>+{diagnostics.rhrDeltaVs7dMean} bpm</strong> respecto a la media de 7 días con
            sueño profundo N3 en{' '}
            <strong>{inputState.biometrics.sleepMetrics.deepSleepHours}h (&lt; 1.3h)</strong>. Se
            restringe el entrenamiento de alto umbral motor hoy.
          </div>
        </div>
      )}

      {/* Resumen Biomédico y Métricas Matemáticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 mt-6">
        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80">
          <span className="text-[11px] font-mono uppercase text-slate-400 block">
            Readiness Global
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {prescription.readinessScore}{' '}
            <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-300 mt-1 block truncate">
            {prescription.readinessCategory}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80">
          <span className="text-[11px] font-mono uppercase text-slate-400 block">
            Ratio ACWR (7d / 28d)
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-extrabold text-white font-mono">
              {prescription.biomedicalSummary.acwr}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${acwrColor}`}>
              {prescription.biomedicalSummary.acwrStatus}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            Aguda: {diagnostics.acuteWeeklyLoadKg.toLocaleString('es-CO')} kg / Crónica:{' '}
            {diagnostics.chronicWeeklyAvgKg.toLocaleString('es-CO')} kg
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80">
          <span className="text-[11px] font-mono uppercase text-slate-400 block flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-sky-400" />
            Tendencia RHR (30d OLS)
          </span>
          <div className="text-sm font-bold text-sky-300 mt-1.5">
            {prescription.biomedicalSummary.rhrBaselineTrend}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            Pendiente: {diagnostics.olsSlope30dPerDay} bpm/día
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80">
          <span className="text-[11px] font-mono uppercase text-slate-400 block flex items-center gap-1">
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            Índice Calidad Sueño
          </span>
          <div className="text-xs font-bold text-purple-200 mt-1.5 leading-snug">
            {prescription.biomedicalSummary.sleepQualityIndex}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80">
          <span className="text-[11px] font-mono uppercase text-slate-400 block flex items-center gap-1">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            Recuperación del SNC
          </span>
          <div className="text-2xl font-extrabold text-indigo-300 mt-1 font-mono">
            {prescription.biomedicalSummary.cnsRecoveryPercentage}%
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Tono vagal y excitabilidad motora
          </span>
        </div>
      </div>

      {/* Prescripción de Gimnasio (Hevy / UPB Gym) y Prescripción Cognitiva (UPB Ing. Civil) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
        {/* Gimnasio */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span>Prescripción Biomecánica (Hevy / UPB Gym)</span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Target: {prescription.gymPrescription.tonnageTargetKg.toLocaleString('es-CO')} kg
              </span>
            </div>

            <div className="text-xs font-semibold text-white mb-2">
              Intensidad Prescrita:{' '}
              <span className="text-emerald-300 font-mono">
                {prescription.gymPrescription.intensityRecommendation}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/70 p-3.5 rounded-xl border border-slate-700/80 mb-3">
              {prescription.gymPrescription.physiologicalRationale}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/40">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1.5">
                  Grupos Recomendados
                </span>
                <div className="flex flex-wrap gap-1">
                  {prescription.gymPrescription.recommendedMuscleGroups.map((g, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[11px] font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-700/40">
                <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1.5">
                  Grupos en Descanso
                </span>
                <div className="flex flex-wrap gap-1">
                  {prescription.gymPrescription.groupsToRest.map((g, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 text-[11px] font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Académico y Cognitivo UPB Montería */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Prescripción Cognitiva (6.° Sem. Ing. Civil UPB)</span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {inputState.academicContext.academicMilestone}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/80">
                <span className="text-[10px] font-mono uppercase text-indigo-400 block mb-1">
                  Ancho de Banda Cognitivo (Cognitive Bandwidth)
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {prescription.academicCognitivePrescription.cognitiveBandwidth}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/80">
                <span className="text-[10px] font-mono uppercase text-sky-400 block mb-1">
                  Bloques de Enfoque Recomendados
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {prescription.academicCognitivePrescription.recommendedFocusBlocks}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/80">
                <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">
                  Mitigación de Estrés Neuroendocrino
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {prescription.academicCognitivePrescription.stressMitigation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proyecciones en las 3 Ventanas Temporales (7d, 30d, 6m) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>A. Microciclo (7 Días) — ACWR</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {prescription.temporalInsights.sevenDaysInsight}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mb-1.5">
            <Brain className="w-3.5 h-3.5" />
            <span>B. Mesociclo (30 Días) — RHR & REM</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {prescription.temporalInsights.thirtyDaysInsight}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>C. Macrociclo (6 Meses) — Cortes UPB</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {prescription.temporalInsights.sixMonthsProjection}
          </p>
        </div>
      </div>

      
    </div>
  );
}
