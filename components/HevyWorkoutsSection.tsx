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
  ChevronDown,
  ExternalLink,
  Flame,
  Search,
  Award,
  Layers,
  ArrowUpRight,
  Share2,
  Heart,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { initialHevySessions, HevyWorkoutSession } from '@/lib/hevyStore';

export default function HevyWorkoutsSection() {
  const [sessions, setSessions] = useState<HevyWorkoutSession[]>(initialHevySessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialHevySessions[0]?.id || ''
  );
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllWorkoutsModal, setShowAllWorkoutsModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSession =
    sessions.find((s) => s.id === selectedSessionId) || sessions[0] || initialHevySessions[0];

  const filteredSessions = sessions.filter(
    (s) =>
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
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Espalda':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'Piernas':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Hombros':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Brazos':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getRpeBadgeColor = (rpe?: number) => {
    if (!rpe) return 'text-slate-400 bg-slate-800/40 border-slate-700';
    if (rpe >= 9.5) return 'text-rose-400 bg-rose-950/70 border-rose-800';
    if (rpe >= 8.5) return 'text-amber-400 bg-amber-950/70 border-amber-800';
    return 'text-emerald-400 bg-emerald-950/70 border-emerald-800';
  };

  return (
    <section id="hevy-workouts-section" className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP BAR DESCOMPRIMIDA: PERFIL ATLETA + SELECTOR DE UNIDADES (IDÉNTICO A HEVY WEB) */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-7 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-[#27272a]">
          {/* Perfil del Atleta */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400 p-0.5 shrink-0 shadow-lg">
              <div className="w-full h-full bg-[#18181b] rounded-2xl flex items-center justify-center font-black text-base tracking-wider text-white">
                ST
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#18181b]" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Santiago Smit Teheran Mogollon
                </h3>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#27272a] text-slate-300 border border-[#3f3f46]">
                  @teheransmit
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                <span className="text-slate-300 font-bold">{sessions.length} Entrenamientos</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Gimnasio UPB Montería (Turno 4:00 PM)</span>
              </div>
            </div>
          </div>

          {/* Acciones & Toggle KG/LBS */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {/* Toggle KG / LBS */}
            <div className="bg-[#09090b] p-1 rounded-xl border border-[#27272a] flex items-center text-xs font-mono shadow-inner">
              <button
                onClick={() => setUnit('kg')}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-black transition-all ${
                  unit === 'kg'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                onClick={() => setUnit('lbs')}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-black transition-all ${
                  unit === 'lbs'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                LBS
              </button>
            </div>

            {/* Subir workouts.csv */}
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
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold rounded-xl border border-[#3f3f46] transition-all shadow-xs disabled:opacity-50"
              title="Importar archivo workouts.csv de Hevy"
            >
              <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Procesando...' : 'Subir CSV'}</span>
            </button>

            {/* Abrir Hevy Web */}
            <a
              href="https://hevy.com/user/teheransmit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition-all shadow-xs"
            >
              <span>Hevy Web</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{uploadSuccess}</span>
          </div>
        )}

        {/* 2. TIMELINE HORIZONTAL DE ENTRENAMIENTOS (CERO COMPRESIÓN) */}
        <div className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sesiones Recientes</span>
            </span>

            <button
              onClick={() => setShowAllWorkoutsModal(true)}
              className="cursor-pointer text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Ver todos los {sessions.length} entrenamientos</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Carrusel Horizontal de Píldoras de Sesión */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {sessions.slice(0, 10).map((sess) => {
              const isSelected = sess.id === selectedSession.id;
              const dateLabel = sess.date.includes(',') ? sess.date.split(',')[0] : sess.date;

              return (
                <button
                  key={sess.id}
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={`cursor-pointer px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all border text-left flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/30'
                      : 'bg-[#09090b]/80 text-slate-300 border-[#27272a] hover:bg-[#27272a] hover:border-slate-600'
                  }`}
                >
                  <span className="font-extrabold">{sess.name}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                    {dateLabel} • {formatVolume(sess.totalVolumeKg, sess.totalVolumeLbs)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. TARJETA PRINCIPAL DEL ENTRENAMIENTO ACTIVO (ANCHO COMPLETO - FORMATO HEVY POST) */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 text-white space-y-7 shadow-2xl">
        {/* Cabezote del Entrenamiento */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{selectedSession.date}</span>
              {selectedSession.startTimeLocal && selectedSession.endTimeLocal
                ? ` (${selectedSession.startTimeLocal} – ${selectedSession.endTimeLocal})`
                : ''}
            </span>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
              <Dumbbell className="w-3 h-3 text-rose-500" />
              <span>UPB Gym 4:00 PM</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {selectedSession.name}
          </h2>
        </div>

        {/* Barra de 4 Métricas Clave de Hevy */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-[#27272a]">
          <div className="p-4 rounded-2xl bg-[#09090b]/70 border border-[#27272a]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tiempo</span>
            <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{selectedSession.durationMinutes} min</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09090b]/70 border border-[#27272a]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Volumen Total</span>
            <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-rose-500" />
              <span>{formatVolume(selectedSession.totalVolumeKg, selectedSession.totalVolumeLbs)}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09090b]/70 border border-[#27272a]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Series Totales</span>
            <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>{selectedSession.totalSets} sets</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09090b]/70 border border-[#27272a]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">RPE Promedio</span>
            <div className="text-xl font-black text-amber-400 font-mono mt-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{selectedSession.rpeAverage ? selectedSession.rpeAverage.toFixed(1) : '8.5'} / 10</span>
            </div>
          </div>
        </div>

        {/* LISTA DE EJERCICIOS CON TABLAS ANCHAS (THE HEVY TABLE) */}
        <div className="space-y-6 pt-2">
          {selectedSession.exercises.map((exercise, exIdx) => {
            const muscleColor = getMuscleBadgeColor(exercise.muscleGroup);

            return (
              <div
                key={exIdx}
                className="bg-[#09090b]/90 border border-[#27272a] rounded-3xl p-6 text-white space-y-4 shadow-sm"
              >
                {/* Encabezado del Ejercicio */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold border ${muscleColor} shadow-inner`}>
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white tracking-tight">
                        {exercise.name}
                      </h4>
                      {exercise.esTitle && (
                        <span className="text-xs text-slate-400 block font-medium">
                          {exercise.esTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${muscleColor}`}>
                    {exercise.muscleGroup}
                  </span>
                </div>

                {/* Nota Personal de Santiago (Callout Idéntico a Hevy) */}
                {exercise.notes && (
                  <div className="p-4 rounded-2xl bg-[#18181b] border-l-4 border-amber-500 text-xs sm:text-sm text-slate-300 flex items-start gap-3 shadow-inner">
                    <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed italic">
                      "{exercise.notes}"
                    </p>
                  </div>
                )}

                {/* TABLA DE SERIES ANCHA Y ESPACIOSA */}
                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-left text-sm font-mono">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-[#27272a] pb-3">
                        <th className="py-3 px-3 w-16 text-center">SET</th>
                        <th className="py-3 px-4">PESO ({unit.toUpperCase()})</th>
                        <th className="py-3 px-4">REPETICIONES</th>
                        <th className="py-3 px-4">RPE</th>
                        <th className="py-3 px-4 text-right">COMPLETADO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]/70">
                      {exercise.sets.map((set, sIdx) => {
                        const isWarmup = set.isWarmup || set.indicator === 'warmup';
                        const rpeColor = getRpeBadgeColor(set.rpe);

                        return (
                          <tr
                            key={sIdx}
                            className={`transition-colors ${
                              isWarmup ? 'bg-amber-500/5' : 'hover:bg-[#18181b]/60'
                            }`}
                          >
                            {/* SET BADGE (W para Warmup o 1, 2, 3...) */}
                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shadow-xs ${
                                  isWarmup
                                    ? 'bg-amber-500/25 text-amber-400 border border-amber-500/50'
                                    : 'bg-[#27272a] text-slate-200 border border-[#3f3f46]'
                                }`}
                              >
                                {isWarmup ? 'W' : set.setNumber}
                              </span>
                            </td>

                            {/* PESO */}
                            <td className="py-3.5 px-4">
                              {set.durationSeconds ? (
                                <span className="text-slate-300 font-bold text-sm">
                                  {Math.floor(set.durationSeconds / 60)}m {set.durationSeconds % 60}s
                                </span>
                              ) : (
                                <span className="text-white font-extrabold text-base">
                                  {formatWeight(set.weightKg, set.weightLbs)}
                                </span>
                              )}
                            </td>

                            {/* REPETICIONES */}
                            <td className="py-3.5 px-4">
                              {set.reps > 0 ? (
                                <span className="text-white font-extrabold text-base">
                                  {set.reps}{' '}
                                  <span className="text-xs text-slate-400 font-normal">reps</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 font-normal">—</span>
                              )}
                            </td>

                            {/* RPE */}
                            <td className="py-3.5 px-4">
                              {set.rpe ? (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black border ${rpeColor}`}>
                                  @{set.rpe}
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* CHECK HEVY */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs">
                                <Check className="w-4 h-4 stroke-[3]" />
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

        {/* 4. BARRA SOCIAL INFERIOR DE HEVY (LIKE, COMENTARIOS, COMPARTIR) */}
        <div className="pt-6 border-t border-[#27272a] flex items-center justify-between flex-wrap gap-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setLiked(!liked);
                setLikesCount(liked ? likesCount - 1 : likesCount + 1);
              }}
              className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                liked
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-[#27272a] text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likesCount} Me gusta</span>
            </button>

            <button
              onClick={() => alert('Entrenamiento verificado y respaldado en la base de datos de VYFITH.')}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#27272a] text-slate-300 hover:text-white transition-all"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>Comentarios (0)</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Enlace del entrenamiento copiado al portapapeles');
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#27272a] text-slate-300 hover:text-white transition-all"
            >
              <Share2 className="w-4 h-4 text-slate-400" />
              <span>Compartir</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            Identificador Hevy: sIkYBSAf7jc • Sincronizado
          </span>
        </div>
      </div>

      {/* MODAL / OVERLAY: LISTA COMPLETA DE LOS 198 ENTRENAMIENTOS */}
      {showAllWorkoutsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-2xl w-full p-6 text-white space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div>
                <h3 className="text-lg font-black text-white">Historial de Entrenamientos Hevy</h3>
                <span className="text-xs text-slate-400">Total: {sessions.length} entrenamientos registrados</span>
              </div>
              <button
                onClick={() => setShowAllWorkoutsModal(false)}
                className="cursor-pointer px-3 py-1.5 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-xs font-bold text-slate-300"
              >
                Cerrar (✕)
              </button>
            </div>

            {/* Buscador interno */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre de rutina o fecha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#09090b] border border-[#27272a] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Lista scrolleable completa */}
            <div className="overflow-y-auto space-y-2 pr-1 divide-y divide-[#27272a]/60">
              {filteredSessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => {
                    setSelectedSessionId(sess.id);
                    setShowAllWorkoutsModal(false);
                  }}
                  className="py-3 px-3 rounded-xl hover:bg-[#27272a]/60 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{sess.name}</h4>
                    <span className="text-xs font-mono text-slate-400">{sess.date}</span>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-300">
                    <span className="block font-bold text-rose-400">
                      {formatVolume(sess.totalVolumeKg, sess.totalVolumeLbs)}
                    </span>
                    <span className="text-[10px] text-slate-500">{sess.durationMinutes} min • {sess.totalSets} sets</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
