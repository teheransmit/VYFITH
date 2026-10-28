'use client';

import React, { useState, useRef } from 'react';
import {
  Dumbbell,
  Clock,
  TrendingUp,
  Check,
  MessageSquare,
  Upload,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Flame,
  Search,
  Award,
  Layers,
  ArrowUpRight,
  Share2,
} from 'lucide-react';
import { initialHevySessions, HevyWorkoutSession, HevyExercise } from '@/lib/hevyStore';

export default function HevyWorkoutsSection() {
  const [sessions, setSessions] = useState<HevyWorkoutSession[]>(initialHevySessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialHevySessions[0]?.id || ''
  );
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSession =
    sessions.find((s) => s.id === selectedSessionId) || sessions[0] || initialHevySessions[0];

  // Filtrado de historial
  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatWeight = (kg: number, lbs?: number) => {
    if (unit === 'lbs') {
      const val = lbs ?? Math.round(kg * 2.20462 * 10) / 10;
      return `${val.toLocaleString()} lbs`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  const formatVolume = (kg: number, lbs?: number) => {
    if (unit === 'lbs') {
      const val = lbs ?? Math.round(kg * 2.20462);
      return `${val.toLocaleString()} lbs`;
    }
    return `${Math.round(kg).toLocaleString()} kg`;
  };

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

  const getMuscleBadgeColor = (group: string) => {
    switch (group) {
      case 'Pecho':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Espalda':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      case 'Piernas':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Hombros':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Brazos':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getRpeBadgeColor = (rpe?: number) => {
    if (!rpe) return 'text-slate-400 bg-slate-800/40 border-slate-700';
    if (rpe >= 9.5) return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
    if (rpe >= 8.5) return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
    return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
  };

  return (
    <section id="hevy-workouts-section" className="space-y-6">
      {/* 1. TOP BAR ESTILO HEVY (Perfil del Atleta + Toggle de Unidades + Acciones) */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#27272a]">
          {/* Info del Atleta */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-rose-600 to-amber-500 p-0.5 shrink-0 shadow-md">
              <div className="w-full h-full bg-[#18181b] rounded-2xl flex items-center justify-center font-black text-sm tracking-wider text-white">
                ST
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#18181b]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Santiago Smit Teheran Mogollon
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#27272a] text-slate-300">
                  @teheransmit
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                <span>{sessions.length} Entrenamientos</span>
                <span>•</span>
                <span className="text-emerald-400">Gimnasio UPB Montería (4:00 PM)</span>
              </div>
            </div>
          </div>

          {/* Toggle KG / LBS & Botón Subir */}
          <div className="flex items-center gap-2.5 self-start md:self-center">
            {/* Toggle de Unidades */}
            <div className="bg-[#09090b] p-1 rounded-xl border border-[#27272a] flex items-center text-xs font-mono">
              <button
                onClick={() => setUnit('kg')}
                className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold transition-all ${
                  unit === 'kg'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                onClick={() => setUnit('lbs')}
                className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold transition-all ${
                  unit === 'lbs'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                LBS
              </button>
            </div>

            {/* Input oculto y botón para subir workouts.csv */}
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
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold rounded-xl border border-[#3f3f46] transition-colors"
              title="Importar archivo workouts.csv de Hevy"
            >
              <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Importando...' : 'Subir CSV'}</span>
            </button>

            <a
              href="https://hevy.com/user/teheransmit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 transition-colors"
            >
              <span>Abrir Hevy Web</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}
      </div>

      {/* 2. GRID PRINCIPAL: FEED LATERAL + TARJETA DE ENTRENAMIENTO ESTILO HEVY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Historial de Entrenamientos (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar rutina o fecha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Lista scrolleable estilo Hevy Activity Feed */}
          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredSessions.map((sess) => {
              const isSelected = sess.id === selectedSession.id;
              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#27272a] border-rose-500 shadow-md ring-1 ring-rose-500/40'
                      : 'bg-[#18181b] border-[#27272a] hover:bg-[#222225] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white tracking-tight line-clamp-1">
                      {sess.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {sess.date.includes(',') ? sess.date.split(',')[0] : sess.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-2">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {sess.durationMinutes}m
                    </span>
                    <span>•</span>
                    <span className="text-slate-300">
                      {formatVolume(sess.totalVolumeKg, sess.totalVolumeLbs)}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300">{sess.totalSets} sets</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Entrenamiento Idéntica a Hevy (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card Encabezado del Entrenamiento */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 text-white space-y-5 shadow-lg">
            {/* Título de la Sesión & Metadatos */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {selectedSession.date}
                  {selectedSession.startTimeLocal && selectedSession.endTimeLocal
                    ? ` (${selectedSession.startTimeLocal} – ${selectedSession.endTimeLocal})`
                    : ''}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  UPB Gym 4:00 PM
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {selectedSession.name}
              </h2>
            </div>

            {/* Fila de 4 Estadísticas Clave de Hevy */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#27272a]">
              <div className="p-3 rounded-2xl bg-[#09090b]/60 border border-[#27272a]/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tiempo</span>
                <div className="text-lg font-black text-white font-mono mt-0.5 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  {selectedSession.durationMinutes} min
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#09090b]/60 border border-[#27272a]/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Volumen</span>
                <div className="text-lg font-black text-white font-mono mt-0.5 flex items-center gap-1">
                  <Dumbbell className="w-4 h-4 text-rose-500" />
                  {formatVolume(selectedSession.totalVolumeKg, selectedSession.totalVolumeLbs)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#09090b]/60 border border-[#27272a]/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Series Totales</span>
                <div className="text-lg font-black text-white font-mono mt-0.5 flex items-center gap-1">
                  <Layers className="w-4 h-4 text-purple-400" />
                  {selectedSession.totalSets}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#09090b]/60 border border-[#27272a]/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RPE Promedio</span>
                <div className="text-lg font-black text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-500" />
                  {selectedSession.rpeAverage ? selectedSession.rpeAverage.toFixed(1) : '8.5'} / 10
                </div>
              </div>
            </div>
          </div>

            {/* 3. LISTA DE EJERCICIOS CON TABLAS ESTILO HEVY */}
            <div className="space-y-4">
              {selectedSession.exercises.map((exercise, exIdx) => {
                const muscleColor = getMuscleBadgeColor(exercise.muscleGroup);

                return (
                  <div
                    key={exIdx}
                    className="bg-[#18181b] border border-[#27272a] rounded-3xl p-5 text-white space-y-4 shadow-sm"
                  >
                    {/* Header del Ejercicio */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs border ${muscleColor}`}>
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-white tracking-tight">
                            {exercise.name}
                          </h4>
                          {exercise.esTitle && (
                            <span className="text-xs text-slate-400 block">
                              {exercise.esTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${muscleColor}`}>
                        {exercise.muscleGroup}
                      </span>
                    </div>

                    {/* Nota personal del usuario si existe */}
                    {exercise.notes && (
                      <div className="p-3 rounded-2xl bg-[#27272a]/60 border-l-4 border-amber-500 text-xs text-slate-300 flex items-start gap-2.5">
                        <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed italic">
                          "{exercise.notes}"
                        </p>
                      </div>
                    )}

                    {/* TABLA DE SERIES IDÉNTICA A HEVY */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-[#27272a] pb-2">
                            <th className="py-2 px-2 w-12 text-center">SET</th>
                            <th className="py-2 px-3">PESO ({unit.toUpperCase()})</th>
                            <th className="py-2 px-3">REPS</th>
                            <th className="py-2 px-3">RPE</th>
                            <th className="py-2 px-3 text-right">COMPLETADO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#27272a]/60">
                          {exercise.sets.map((set, sIdx) => {
                            const isWarmup = set.isWarmup || set.indicator === 'warmup';
                            const rpeColor = getRpeBadgeColor(set.rpe);

                            return (
                              <tr
                                key={sIdx}
                                className={`transition-colors ${
                                  isWarmup ? 'bg-amber-500/5' : 'hover:bg-[#27272a]/30'
                                }`}
                              >
                                {/* Badge de Set (W para Warmup o 1, 2, 3...) */}
                                <td className="py-2.5 px-2 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                                      isWarmup
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                        : 'bg-[#27272a] text-slate-200'
                                    }`}
                                  >
                                    {isWarmup ? 'W' : set.setNumber}
                                  </span>
                                </td>

                                {/* Peso en KG o LBS */}
                                <td className="py-2.5 px-3">
                                  {set.durationSeconds ? (
                                    <span className="text-slate-300 font-bold">
                                      {Math.floor(set.durationSeconds / 60)}m {set.durationSeconds % 60}s
                                    </span>
                                  ) : (
                                    <span className="text-white font-bold text-sm">
                                      {formatWeight(set.weightKg, set.weightLbs)}
                                    </span>
                                  )}
                                </td>

                                {/* Repeticiones */}
                                <td className="py-2.5 px-3">
                                  {set.reps > 0 ? (
                                    <span className="text-white font-bold text-sm">
                                      {set.reps}{' '}
                                      <span className="text-[10px] text-slate-400 font-normal">reps</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </td>

                                {/* RPE Badge */}
                                <td className="py-2.5 px-3">
                                  {set.rpe ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${rpeColor}`}>
                                      @{set.rpe}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">—</span>
                                  )}
                                </td>

                                {/* Botón / Check verde estilo Hevy */}
                                <td className="py-2.5 px-3 text-right">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
  );
}
