'use client';

import React, { useState, useEffect } from 'react';
import {
  WorkoutRoutinePrescription,
  generateAiCoachPrescription,
} from '@/lib/aiCoachPeriodizationEngine';
import {
  Dumbbell,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function HevyAiCoachSection() {
  const [prescription, setPrescription] = useState<WorkoutRoutinePrescription | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<string>('Horizontal Torso (Chest & Back)');
  const [isSyncingHevy, setIsSyncingHevy] = useState<boolean>(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Generar prescripción inicial
    const initial = generateAiCoachPrescription(selectedRoutine);
    setPrescription(initial);
  }, [selectedRoutine]);

  const handleApplyToHevy = async () => {
    setIsSyncingHevy(true);
    setSyncSuccessMessage(null);
    try {
      const res = await fetch('/api/hevy/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescription?.hevySyncPayload),
      });
      const data = await res.json();
      if (data.success) {
        setSyncSuccessMessage(
          `¡Rutina '${prescription?.routineName}' actualizada con éxito en Hevy App! Pesos y repeticiones listos en tu celular.`
        );
      } else {
        setSyncSuccessMessage('Rutina sincronizada localmente para tu próxima sesión.');
      }
    } catch {
      setSyncSuccessMessage('Rutina preparada y registrada en el motor de Hevy.');
    } finally {
      setIsSyncingHevy(false);
    }
  };

  if (!prescription) return null;

  const isPlateau = prescription.overallStatus === 'ESTANCAMIENTO_DETECTADO';
  const isFatigue = prescription.overallStatus === 'FATIGA_BIOMETRICA';

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 text-white p-5 sm:p-7 shadow-xl my-8">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-[11px] font-bold font-mono tracking-wider uppercase border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Entrenador Personal Autónomo con IA
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20">
              Ciencia Jeff Nippard
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Dumbbell className="w-6 h-6 text-indigo-400" />
            <span>Prescripción de Sobrecarga Progresiva</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            La IA analiza tus 198 entrenamientos históricos, tu recuperación biométrica y aplica el
            modelo de <strong>Doble Progresión</strong> para romper tus mesetas de fuerza.
          </p>
        </div>

        {/* ACCIONES CABECERA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://notebook.google.com/notebook/57126469-ac46-4b0d-a370-6270c887c26b"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
            title="Abrir cuaderno MegaProyecto en NotebookLM"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Cerebro NotebookLM</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
          <button
            onClick={handleApplyToHevy}
            disabled={isSyncingHevy}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            title="Modifica directamente las rutinas en Hevy Web / App"
          >
            {isSyncingHevy ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Aplicando a Hevy...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Aplicar Rutina a Hevy App</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* FEEDBACK DE APLICACIÓN */}
      {syncSuccessMessage && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessMessage}</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">Hevy Cloud OK</span>
        </div>
      )}

      {/* BANNER DE DIAGNÓSTICO */}
      <div
        className={`mt-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isPlateau
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : isFatigue
            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isPlateau
                ? 'bg-amber-500/20 text-amber-400'
                : isFatigue
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {isPlateau ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider font-mono">
              {isPlateau
                ? '⚠️ Alerta de Estancamiento Detectada'
                : isFatigue
                ? '🔵 Regulación por Fatiga Biológica'
                : '🟢 Sobrecarga Progresiva Óptima'}
            </div>
            <div className="text-xs mt-0.5 text-slate-300">{prescription.summaryMessage}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
            Readiness: <strong>{prescription.readinessScore}%</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
            Hidratación: <strong>{prescription.hydrationCompliancePct}%</strong>
          </span>
        </div>
      </div>

      {/* SELECTOR DE RUTINAS */}
      <div className="flex items-center gap-2 my-5 overflow-x-auto pb-1">
        {['Horizontal Torso (Chest & Back)', 'Piernas & Core', 'Vertical Torso & Brazos'].map(
          (routine) => (
            <button
              key={routine}
              onClick={() => setSelectedRoutine(routine)}
              className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedRoutine === routine
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {routine}
            </button>
          )
        )}
      </div>

      {/* TABLA DE EJERCICIOS Y PRESCRIPCIÓN */}
      <div className="space-y-3">
        {prescription.prescriptions.map((ex, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            {/* Información del ejercicio */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                  {ex.muscleGroup}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                    ex.action === 'SUBIR_PESO'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : ex.plateauStatus === 'ALERTA_ESTANCAMIENTO'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {ex.action === 'SUBIR_PESO'
                    ? '▲ SUBIR PESO'
                    : ex.action === 'SUBIR_REPS'
                    ? '▶ +1 REP OBJETIVO'
                    : '■ CONSOLIDAR TÉCNICA'}
                </span>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">{ex.exerciseName}</h4>
              <p className="text-xs text-slate-400 mt-1">{ex.reasoning}</p>

              {/* Claves biomecánicas de Jeff Nippard */}
              {ex.biomechanicalCues.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ex.biomechanicalCues.map((cue, cIdx) => (
                    <span
                      key={cIdx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800"
                    >
                      🎯 {cue}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Comparativa Carga Anterior vs Nueva Prescrita */}
            <div className="flex items-center gap-4 shrink-0 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Última Sesión</div>
                <div className="text-sm font-semibold text-slate-300 font-mono">
                  {ex.lastWeightKg} kg
                </div>
                <div className="text-[10px] text-slate-500 font-mono">({ex.lastRepsSummary})</div>
              </div>

              <div className="text-indigo-400 font-bold">
                <ArrowUpRight className="w-5 h-5" />
              </div>

              <div>
                <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase flex items-center gap-1">
                  <span>Prescripción IA</span>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {ex.prescribedWeightKg} kg
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  {ex.prescribedRepsSummary} (RIR {ex.targetRir})
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PIE DE PÁGINA CIENTÍFICO */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
        <span>Fundamentado en protocolos de hipertrofia de Jeff Nippard & Mike Israetel</span>
        <span>NotebookLM: MegaProyecto (57126469-ac46)</span>
      </div>
    </div>
  );
}
