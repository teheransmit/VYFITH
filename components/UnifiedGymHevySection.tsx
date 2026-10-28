'use client';

import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Clock,
  Calendar,
  Sparkles,
  ExternalLink,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Snowflake,
  Droplets,
  Flame,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Upload,
  UserCheck,
  Layers,
  LayoutGrid,
} from 'lucide-react';
import {
  UPB_GYM_WEEKLY_SCHEDULE,
  UPB_GYM_FACILITIES,
  SIGAA_BANNER_URL,
  DATA_QUALITY_EMAIL,
  getUpbGymLiveStatus,
  GymLiveStatus,
} from '@/lib/upbGymStore';
import { initialHevySessions, HevyWorkoutSession } from '@/lib/hevyStore';
import MuscleHeatmap from './MuscleHeatmap';
import HevyWorkoutsSection from './HevyWorkoutsSection';

export interface UnifiedGymHevyProps {
  initialSubTab?: 'all' | 'schedule' | 'hevy';
  hideHeader?: boolean;
}

export default function UnifiedGymHevySection({
  initialSubTab = 'all',
  hideHeader = false,
}: UnifiedGymHevyProps = {}) {
  // Estado del Gimnasio UPB
  const [liveStatus, setLiveStatus] = useState<GymLiveStatus | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1);
  const [sigaaCompleted, setSigaaCompleted] = useState<boolean>(false);
  const [towelCheck, setTowelCheck] = useState<boolean>(true);
  const [lockerLockCheck, setLockerLockCheck] = useState<boolean>(true);

  // Estado de Hevy Workouts
  const [sessions] = useState<HevyWorkoutSession[]>(initialHevySessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialHevySessions[0].id);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Sub-vista activa dentro de la sección unificada
  const [subTab, setSubTab] = useState<'all' | 'schedule' | 'hevy'>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const totalWeeklyVolume = sessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
  const totalWeeklySets = sessions.reduce((acc, s) => acc + s.totalSets, 0);

  useEffect(() => {
    setLiveStatus(getUpbGymLiveStatus());
    const interval = setInterval(() => {
      setLiveStatus(getUpbGymLiveStatus());
    }, 30000);

    const today = new Date().getDay();
    if (today >= 1 && today <= 5) {
      setSelectedDayIndex(today);
    }

    const savedSigaa = localStorage.getItem('upb_gym_sigaa_done');
    if (savedSigaa === 'true') {
      setSigaaCompleted(true);
    }

    return () => clearInterval(interval);
  }, []);

  const handleToggleSigaa = () => {
    const nextVal = !sigaaCompleted;
    setSigaaCompleted(nextVal);
    localStorage.setItem('upb_gym_sigaa_done', String(nextVal));
  };

  const handleSimulateCsvUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }, 1000);
  };

  const selectedDaySchedule =
    UPB_GYM_WEEKLY_SCHEDULE.find((d) => d.dayIndex === selectedDayIndex) ||
    UPB_GYM_WEEKLY_SCHEDULE[0];

  const emailSubject = encodeURIComponent(
    'Actualización de Datos Personales - Acceso Gimnasio UPB - Santiago Smit Teherán Mogollón (ID: 000533630)'
  );
  const emailBody = encodeURIComponent(
    'Cordial saludo,\n\nMi nombre es Santiago Smit Teherán Mogollón (ID: 000533630), estudiante de 6.° semestre de Ingeniería Civil en la UPB Seccional Montería.\n\nEscribo para solicitar la validación de mis datos personales en el sistema SIGAA/Banner con el fin de habilitar el acceso a los servicios del Gimnasio UPB Montería. Adjunto copia de mi documento de identidad para los fines pertinentes.\n\nAtentamente,\nSantiago Smit Teherán Mogollón\nID: 000533630\nsantiago.teheran@upb.edu.co\nTel: +57 324 584 9478'
  );
  const mailtoLink = `mailto:${DATA_QUALITY_EMAIL}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <section id="unified-gym-hevy-section" className="space-y-8 animate-fadeIn">
      {/* 1. HERO PRINCIPAL UNIFICADO */}
      {!hideHeader && (
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/30">
              <Dumbbell className="w-3.5 h-3.5 text-rose-400" />
              <span>Pilar Integral • Gimnasio UPB & Hevy Workouts</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Gimnasio UPB & Hevy Workouts
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Centro unificado para planificar tus sesiones de hipertrofia y fuerza en el <strong>espacio climatizado del campus UPB</strong>,
              cruzando tus horas libres de clases con el registro de sobrecarga progresiva y tonelaje de <strong>Hevy App</strong>.
            </p>

            {/* Badges de Estado Rápido */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <strong>Horario UPB:</strong> L–J: 6–11:30 & 4–7 | Vie: 6–11 & 4–7
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1.5 font-mono">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <strong>Volumen Hevy:</strong> {totalWeeklyVolume.toLocaleString()} kg levantados esta semana
              </span>
            </div>
          </div>

          {/* Widget en Vivo del Gimnasio UPB */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-indigo-500/30 p-5 shrink-0 min-w-[280px] shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Estado en Vivo</span>
              <span className="text-[11px] font-mono text-slate-400">Montería (UTC-5)</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                {liveStatus?.isOpenNow ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
                )}
              </span>

              <div>
                <span
                  className={`text-lg font-black tracking-tight ${
                    liveStatus?.isOpenNow ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {liveStatus?.isOpenNow ? 'ABIERTO AHORA' : 'CERRADO'}
                </span>
                {liveStatus?.currentShiftName && (
                  <span className="block text-xs text-slate-300">
                    {liveStatus.currentShiftName}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span>Hora actual:</span>
                <span className="font-mono text-white font-bold">{liveStatus?.currentTimeString || '--:--'}</span>
              </div>
              <p className="text-indigo-200/90 text-xs font-medium pt-1">
                {liveStatus?.nextOpeningText}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-selector de Enfoque */}
        <div className="mt-8 pt-5 border-t border-indigo-900/40 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab('all')}
              className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                subTab === 'all'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Vista Completa Unificada</span>
            </button>
            <button
              onClick={() => setSubTab('schedule')}
              className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                subTab === 'schedule'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Horarios UPB & Validación SIGAA</span>
            </button>
            <button
              onClick={() => setSubTab('hevy')}
              className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                subTab === 'hevy'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Métricas de Sobrecarga Hevy</span>
            </button>
          </div>

          <button
            onClick={handleSimulateCsvUpload}
            disabled={isUploading}
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
            <span>{isUploading ? 'Importando...' : 'Sincronizar CSV Hevy'}</span>
          </button>
        </div>
      </div>
      )}

      {uploadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡CSV de Hevy sincronizado exitosamente! Se actualizaron tus métricas de hipertrofia.</span>
        </div>
      )}

      {/* 2. DASHBOARD DE MÉTRICAS HEVY (Volumen, Series, RPE, Sobrecarga) */}
      {(subTab === 'all' || subTab === 'hevy') && (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Volumen Semanal</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalWeeklyVolume.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
              En espacio climatizado UPB
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Series Efectivas</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalWeeklySets} <span className="text-xs font-normal text-slate-400">series</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">RPE promedio 8.4</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Esfuerzo Percibido</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              8.4 <span className="text-xs font-normal text-slate-400">/ 10 RPE</span>
            </div>
            <span className="text-[11px] text-amber-600/90 dark:text-amber-400 font-medium block mt-1">
              Zona óptima de hipertrofia
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sobrecarga Progresiva</span>
            <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5" /> +4.8%
            </div>
            <span className="text-[11px] text-emerald-600/90 dark:text-emerald-400 font-medium block mt-1">
              Crecimiento vs mes anterior
            </span>
          </div>
        </div>

        {/* 2.1. MAPA DE CALOR MUSCULAR & PLATEAUS (Inspirado en aree6/LiftShift) */}
        <div className="animate-fadeIn">
          <MuscleHeatmap />
        </div>
        </>
      )}

      {/* 3. ALERTA TÁCTICA PARA SEMANA DE PARCIALES */}
      {(subTab === 'all' || subTab === 'schedule') && (
        <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 p-5 sm:p-6 text-slate-800 dark:text-slate-200 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Estrategia Táctica para Semana de Parciales (Cero Estrés, Máxima Retención)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  3 días x 50 min
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                En parciales no debes sobreentrenar ni quemar tiempo en trayectos. Los 3 bloques óptimos de tu semana son:
                <strong> Martes (10:00 a.m.)</strong>, <strong>Jueves (10:00 a.m.)</strong> y <strong>Viernes (16:00 p.m.)</strong>.
                El ejercicio en el espacio climatizado de la UPB disipa el cortisol de las materias pesadas y te permite retener mejor las fórmulas.
              </p>
              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-amber-200/60 dark:border-amber-800/40 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Regla de oro del corte a las 17:30:</strong> Los días con clase de <em>Programación y Presupuesto</em> (18:00),
                  debes terminar de entrenar a las <strong>17:30</strong> para usar las duchas y lockers con 20 minutos de margen.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MATRIZ DE VENTANAS ÓPTIMAS VS CLASES REALES (GOOGLE CALENDAR) */}
      {(subTab === 'all' || subTab === 'schedule') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Matriz de Compatibilidad</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Tus Ventanas de Entrenamiento en el Campus UPB
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Selecciona el día para ver tus huecos libres de clases
            </span>
          </div>

          {/* Selector de Días (Lunes a Viernes) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {UPB_GYM_WEEKLY_SCHEDULE.filter((d) => d.dayIndex >= 1 && d.dayIndex <= 5).map((day) => {
              const isSelected = day.dayIndex === selectedDayIndex;
              return (
                <button
                  key={day.dayName}
                  onClick={() => setSelectedDayIndex(day.dayIndex)}
                  className={`cursor-pointer px-4 py-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border text-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm font-extrabold">{day.dayName}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {day.dayIndex === 5 ? 'Cierra 11:00 am' : '6–11:30 / 4–7'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desglose del Día Seleccionado */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Clases reales */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Tus Clases en Google Calendar ({selectedDaySchedule.dayName})
              </span>

              <div className="space-y-2">
                {selectedDaySchedule.myClasses.map((cls, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {cls.courseName}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {cls.classroom} • {cls.building}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 shrink-0">
                      {cls.timeRange}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ventanas recomendadas */}
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Ventanas Óptimas en el Gimnasio UPB & Rutina Hevy Sugerida
              </span>

              <div className="space-y-3">
                {selectedDaySchedule.recommendedWindows.map((win, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      win.isPrimary
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 shadow-xs ring-1 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            win.isPrimary
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {win.title}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {win.recommendedWorkout}
                        </span>
                      </div>

                      <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
                        {win.timeRange} ({win.durationMinutes} min)
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {win.strategyNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. HISTORIAL DE SESIONES DETALLADAS DE HEVY (Estilo Hevy Web Descomprimido) */}
      {(subTab === 'all' || subTab === 'hevy') && (
        <HevyWorkoutsSection />
      )}

      {/* 6. VALIDACIÓN INSTITUCIONAL SIGAA & CHECKLIST */}
      {(subTab === 'all' || subTab === 'schedule') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Requisitos Administrativos</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Validación de Datos en SIGAA Banner
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                La UPB exige que tus datos personales estén actualizados en el portal Banner antes de iniciar tu registro en el gimnasio.
              </p>
            </div>

            <button
              onClick={handleToggleSigaa}
              className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                sigaaCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${sigaaCompleted ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{sigaaCompleted ? 'Datos Validados en SIGAA' : 'Marcar como Validado'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Paso 1: Portal Banner General SSB
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verifica tu dirección, teléfono y correo institucional
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ingresa directamente al autoservicio de Banner para certificar tu información como estudiante activo.
              </p>

              <a
                href={SIGAA_BANNER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <span>Actualizar datos en SIGAA Banner</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Paso 2: Enviar Cédula (Si hubo cambios)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    calidaddeldato.monteria@upb.edu.co
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Si cambiaste de documento o teléfono, envía la copia a Calidad del Dato con la plantilla lista.
              </p>

              <a
                href={mailtoLink}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Redactar Correo con Plantilla Oficial</span>
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Checklist para Ingreso
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sigaaCompleted}
                  onChange={handleToggleSigaa}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Validación SIGAA completada</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={towelCheck}
                  onChange={() => setTowelCheck(!towelCheck)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Toalla personal de mano</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockerLockCheck}
                  onChange={() => setLockerLockCheck(!lockerLockCheck)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Candado personal para locker</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 7. INSTALACIONES DISPONIBLES */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Instalaciones Disponibles</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Servicios del Gimnasio UPB Montería
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {UPB_GYM_FACILITIES.map((fac, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {fac.icon === 'Snowflake' && <Snowflake className="w-4 h-4" />}
                  {fac.icon === 'Dumbbell' && <Dumbbell className="w-4 h-4" />}
                  {fac.icon === 'Flame' && <Flame className="w-4 h-4" />}
                  {fac.icon === 'Droplets' && <Droplets className="w-4 h-4" />}
                  {fac.icon === 'Users' && <Sparkles className="w-4 h-4" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{fac.title}</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {fac.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
