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
  Info,
  Layers,
  ArrowRight,
  UserCheck,
  Lock,
} from 'lucide-react';
import {
  UPB_GYM_WEEKLY_SCHEDULE,
  UPB_GYM_FACILITIES,
  SIGAA_BANNER_URL,
  DATA_QUALITY_EMAIL,
  getUpbGymLiveStatus,
  GymLiveStatus,
  DayGymSchedule,
} from '@/lib/upbGymStore';

export default function UpbGymSection() {
  const [liveStatus, setLiveStatus] = useState<GymLiveStatus | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1); // 1 = Lunes por defecto
  const [sigaaCompleted, setSigaaCompleted] = useState<boolean>(false);
  const [towelCheck, setTowelCheck] = useState<boolean>(true);
  const [lockerLockCheck, setLockerLockCheck] = useState<boolean>(true);

  // Inicializar y actualizar estado en tiempo real cada 30 segundos
  useEffect(() => {
    setLiveStatus(getUpbGymLiveStatus());
    const interval = setInterval(() => {
      setLiveStatus(getUpbGymLiveStatus());
    }, 30000);

    // Seleccionar automáticamente el día de hoy si es de lunes a viernes
    const today = new Date().getDay();
    if (today >= 1 && today <= 5) {
      setSelectedDayIndex(today);
    }

    // Leer checklist de localStorage
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
    <section id="upb-gym-section" className="space-y-8 animate-fadeIn">
      {/* 1. HERO BANNER: ESTADO EN VIVO Y HORARIO OFICIAL */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Dumbbell className="w-3.5 h-3.5 text-indigo-400" />
              <span>Campus Montería • Bienestar Universitario</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Gimnasio UPB Montería
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Módulo de sincronización horaria, compatibilidad con tus clases de 6.° semestre,
              reserva de tiempo para hipertrofia y validación administrativa obligatoria en <strong>SIGAA Banner</strong>.
            </p>

            {/* Badges de Horarios Oficiales */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <strong>Lunes a Jueves:</strong> 6:00 – 11:30 a.m. | 4:00 – 7:00 p.m.
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <strong>Viernes:</strong> 6:00 – 11:00 a.m. | 4:00 – 7:00 p.m.
              </span>
            </div>
          </div>

          {/* Estado en Vivo Dinámico */}
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
      </div>

      {/* 2. ALERTA TÁCTICA: ESTRATEGIA DE PARCIALES & REGLA DEL CORTE 17:30 */}
      <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 p-5 sm:p-6 text-slate-800 dark:text-slate-200">
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

      {/* 3. MATRIZ SEMANAL INTERACTIVA: DÍA POR DÍA CON TUS CLASES REALES */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Matriz de Compatibilidad</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Tus Ventanas de Entrenamiento vs Clases UPB
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Selecciona el día para ver tus huecos libres recomendados
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
                <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-400'}`}>
                  {day.dayIndex === 5 ? 'Cierra 11:00 am' : '6–11:30 / 4–7'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detalle del Día Seleccionado */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Columna Izquierda: Tus Clases de ese día */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tus Clases en Google Calendar ({selectedDaySchedule.dayName})
              </span>
            </div>

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

          {/* Columna Derecha: Ventanas Óptimas en el Gimnasio UPB */}
          <div className="lg:col-span-7 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Ventanas Óptimas de Entrenamiento en el Gimnasio UPB
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

      {/* 4. SECCIÓN ADMINISTRATIVA: VALIDACIÓN SIGAA OBLIGATORIA */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Requisitos Institucionales</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Validación de Datos en SIGAA Banner
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              La UPB exige que tus datos personales estén actualizados en el portal Banner antes de iniciar tu registro en el gimnasio.
            </p>
          </div>

          {/* Estado de Checklist */}
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

        {/* Tarjetas de Acción Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta 1: Acceso a Banner SSB */}
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

          {/* Tarjeta 2: Correo de Calidad del Dato */}
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

        {/* Checklist Rápido de Ingreso */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Checklist para tu Primer Día de Gimnasio
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

      {/* 5. INSTALACIONES Y SERVICIOS INCLUIDOS */}
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
