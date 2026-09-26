'use client';

import React, { useState } from 'react';
import {
  Dumbbell,
  TrendingUp,
  Clock,
  Upload,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { initialHevySessions, HevyWorkoutSession } from '@/lib/hevyStore';

export default function HevyWorkoutsSection() {
  const [sessions] = useState<HevyWorkoutSession[]>(initialHevySessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialHevySessions[0].id);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const totalWeeklyVolume = sessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
  const totalWeeklySets = sessions.reduce((acc, s) => acc + s.totalSets, 0);

  const handleSimulateCsvUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }, 1000);
  };

  return (
    <section id="hevy-workouts-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <Dumbbell className="w-3.5 h-3.5 text-rose-600" />
              Hevy App API & Export CSV
            </span>
            <span className="text-xs font-mono text-slate-400">Pilar 2: Hipertrofia & Fuerza</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Entrenamientos Hevy (Fuerza & Volumen)
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Registro detallado de cargas, series efectivas, RPE y tonelaje levantado. Se cruza con tu Readiness Score para prevenir sobreentrenamiento y estancamiento.
          </p>
        </div>

        {/* Botón Subir CSV de Hevy */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateCsvUpload}
            disabled={isUploading}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
            <span>{isUploading ? 'Procesando CSV...' : 'Importar CSV de Hevy'}</span>
          </button>
        </div>
      </div>

      {uploadSuccess && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡CSV de Hevy importado con éxito! Se sincronizaron 2 nuevas sesiones de entrenamiento.</span>
        </div>
      )}

      {/* Métricas Principales de Hevy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Volumen Semanal</span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">
            {totalWeeklyVolume.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Series Efectivas</span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">
            {totalWeeklySets} <span className="text-xs font-normal text-slate-500">sets</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">RPE Promedio</span>
          <div className="text-xl font-extrabold text-amber-600 mt-0.5">
            8.4 <span className="text-xs font-normal text-slate-500">/ 10</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Sobrecarga Progresiva</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +4.8%
          </div>
        </div>
      </div>

      {/* Selector de Sesiones y Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Sesiones Recientes */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Sesiones Recientes</span>
          {sessions.map((sess) => {
            const isSelected = sess.id === selectedSession.id;
            return (
              <div
                key={sess.id}
                onClick={() => setSelectedSessionId(sess.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200'
                    : 'bg-slate-50/60 border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{sess.name}</h4>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {sess.durationMinutes} min
                  </span>
                  <span>•</span>
                  <span>{sess.totalVolumeKg.toLocaleString()} kg</span>
                  <span>•</span>
                  <span>{sess.totalSets} series</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desglose de Ejercicios de la Sesión Seleccionada */}
        <div className="lg:col-span-2 bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{selectedSession.name}</h4>
              <span className="text-xs text-slate-500">Desglose de series efectivas y esfuerzo (RPE)</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
              {selectedSession.totalVolumeKg.toLocaleString()} kg levantados
            </span>
          </div>

          <div className="space-y-4">
            {selectedSession.exercises.map((ex, idx) => (
              <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">{ex.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {ex.muscleGroup}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ex.sets.map((s) => (
                    <div
                      key={s.setNumber}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-mono"
                    >
                      <span className="text-slate-400">Set {s.setNumber}:</span>{' '}
                      <strong className="text-slate-900">{s.weightKg}kg</strong> x {s.reps} reps{' '}
                      <span className="text-amber-600 font-semibold">@{s.rpe}</span>
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
