'use client';

import React, { useState, useRef } from 'react';
import {
  Dumbbell,
  TrendingUp,
  Clock,
  Upload,
  CheckCircle2,
  ChevronRight,
  Info,
  ExternalLink,
  KeyRound,
  FileSpreadsheet,
} from 'lucide-react';
import { initialHevySessions, HevyWorkoutSession } from '@/lib/hevyStore';

export default function HevyWorkoutsSection() {
  const [sessions, setSessions] = useState<HevyWorkoutSession[]>(initialHevySessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialHevySessions[0]?.id || ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSession =
    sessions.find((s) => s.id === selectedSessionId) || sessions[0] || initialHevySessions[0];
  const totalWeeklyVolume = sessions.slice(0, 7).reduce((acc, s) => acc + s.totalVolumeKg, 0);
  const totalWeeklySets = sessions.slice(0, 7).reduce((acc, s) => acc + s.totalSets, 0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(null);

    try {
      const text = await file.text();
      const res = await fetch('/api/sync/hevy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.workouts && Array.isArray(data.workouts) && data.workouts.length > 0) {
          setSessions((prev) => [...data.workouts, ...prev]);
          setSelectedSessionId(data.workouts[0].id);
          setUploadSuccess(`¡Se importaron ${data.workouts.length} entrenamientos desde ${file.name}!`);
        } else {
          setUploadSuccess(`CSV procesado (${data.sessionsCount || 0} sesiones detectadas).`);
        }
      } else {
        const err = await res.json();
        alert(`Error al procesar CSV: ${err.error || 'Formato no reconocido'}`);
      }
    } catch (err: any) {
      alert(`Error al leer archivo: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadSuccess(null), 6000);
    }
  };

  return (
    <section id="hevy-workouts-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10 transition-colors">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
              <Dumbbell className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Hevy Workouts API & Export CSV
            </span>
            <span className="text-xs font-mono text-slate-400">Pilar 2: Hipertrofia & Fuerza (4:00 PM)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-mono">
              {sessions.length} Entrenamientos en Base de Datos
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Entrenamientos Hevy (Fuerza & Volumen)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Registro detallado de cargas, series efectivas, RPE y tonelaje levantado. Se cruza con el sueño de la Xiaomi Band 9 Pro y las horas de estudio UPB para calcular el ACWR.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            title="Sube tu archivo workouts.csv exportado desde la app o web de Hevy"
          >
            <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
            <span>{isUploading ? 'Procesando CSV...' : 'Subir workouts.csv'}</span>
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>{showGuide ? 'Ocultar Guía' : '¿Cómo sacar datos de Hevy?'}</span>
          </button>
        </div>
      </div>

      {/* Guía Explicativa de Extracción de Datos de Hevy */}
      {showGuide && (
        <div className="mt-4 p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 text-xs space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              3 Formas de Exportar o Sincronizar tus Entrenamientos de Hevy
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center font-mono text-[10px]">1</span>
                Desde la Web (Recomendado)
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Entra a <a href="https://hevy.com/settings" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold inline-flex items-center gap-0.5">hevy.com/settings <ExternalLink className="w-2.5 h-2.5" /></a>, baja hasta <em>Export Data</em> y descarga el archivo <code>workouts.csv</code>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center font-mono text-[10px]">2</span>
                Desde la App Hevy (Android)
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                En tu Vivo Y20: Abre Hevy $\to$ Perfil $\to$ Ajustes (engranaje) $\to$ <em>Exportar e Importar</em> $\to$ <em>Exportar datos CSV</em>. Se guarda en Descargas.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                API Oficial (Hevy Pro)
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Si cuentas con Hevy Pro, genera tu clave en <a href="https://hevy.com/settings?developer" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold inline-flex items-center gap-0.5">hevy.com/settings?developer <ExternalLink className="w-2.5 h-2.5" /></a> para sincronización automática en la nube.
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadSuccess && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Métricas Principales de Hevy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Volumen Semanal</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
            {totalWeeklyVolume.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kg</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Series Efectivas (7d)</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
            {totalWeeklySets} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">sets</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">RPE Promedio</span>
          <div className="text-xl font-extrabold text-amber-600 mt-0.5">
            {selectedSession?.rpeAverage?.toFixed(1) || '8.5'} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ 10</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sobrecarga Progresiva</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +4.8%
          </div>
        </div>
      </div>

      {/* Selector de Sesiones y Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Sesiones Recientes */}
        <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1.5 scrollbar-thin">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Historial de Sesiones ({sessions.length})
          </span>
          {sessions.map((sess) => {
            const isSelected = sess.id === selectedSession.id;
            return (
              <div
                key={sess.id}
                onClick={() => setSelectedSessionId(sess.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{sess.name}</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-mono">{sess.date}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {sess.durationMinutes} min
                  </span>
                  <span>•</span>
                  <span>{sess.totalVolumeKg?.toLocaleString()} kg</span>
                  <span>•</span>
                  <span>{sess.totalSets} series</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desglose de Ejercicios de la Sesión Seleccionada */}
        <div className="lg:col-span-2 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedSession.name}</h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">Desglose de series efectivas y esfuerzo (RPE) • {selectedSession.date}</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 dark:border dark:border-rose-800/60 text-rose-700 dark:text-rose-300">
              {selectedSession.totalVolumeKg?.toLocaleString()} kg levantados
            </span>
          </div>

          <div className="space-y-4">
            {selectedSession.exercises?.map((ex, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{ex.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                    {ex.muscleGroup}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ex.sets?.map((s) => (
                    <div
                      key={s.setNumber}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-700 text-[11px] font-mono"
                    >
                      <span className="text-slate-400 dark:text-slate-500">Set {s.setNumber}:</span>{' '}
                      <strong className="text-slate-900 dark:text-slate-100">{s.weightKg}kg</strong> x {s.reps} reps{' '}
                      {s.rpe ? <span className="text-amber-600 dark:text-amber-400 font-semibold">@{s.rpe}</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
