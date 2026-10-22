'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  LogOut,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { CalendarEvent } from '@/lib/googleCalendar';

interface CalendarUser {
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

const STATIC_SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 'samp-1',
    summary: 'Análisis de Estructuras (NRC 52885)',
    start: { dateTime: '2026-10-22T18:00:00Z' },
    end: { dateTime: '2026-10-22T20:00:00Z' },
    location: 'Campus UPB - Aula B3 301 / B1 407',
    description: 'Materia prioritaria (5° sem). Necesitas 2.97 en el examen final para habilitar Concreto I.',
  },
  {
    id: 'samp-2',
    summary: 'Fundamentos de Hidrología (NRC 52906)',
    start: { dateTime: '2026-10-22T12:00:00Z' },
    end: { dateTime: '2026-10-22T14:00:00Z' },
    location: 'Campus UPB - Aula B1 211',
    description: 'Línea de Recursos Hídricos. Proyecto de Investigación y Cuencas.',
  },
  {
    id: 'samp-3',
    summary: 'Mecánica de Suelos (NRC 52910)',
    start: { dateTime: '2026-10-23T08:00:00Z' },
    end: { dateTime: '2026-10-23T10:00:00Z' },
    location: 'Campus UPB - Aula B1 106 / Lab Suelos B2 114',
    description: 'Laboratorio de Ensayos Proctor y Granulometría. Desbloquea Cimentaciones.',
  },
  {
    id: 'samp-4',
    summary: 'Programación y Presupuesto de Obras Civiles (NRC 52890)',
    start: { dateTime: '2026-10-22T18:00:00Z' },
    end: { dateTime: '2026-10-22T20:00:00Z' },
    location: 'Campus UPB - Aula B3 302',
    description: 'Gestión y presupuestación de obras civiles.',
  },
  {
    id: 'samp-5',
    summary: 'Vías II (NRC 52895)',
    start: { dateTime: '2026-10-23T10:00:00Z' },
    end: { dateTime: '2026-10-23T12:00:00Z' },
    location: 'Campus UPB - Aula B3 401',
    description: 'Línea Vial. Diseño geométrico de carreteras y pavimentos.',
  },
  {
    id: 'samp-6',
    summary: '🏋️ Sesión Hevy: Torso Horizontal & Bíceps',
    start: { dateTime: '2026-10-22T17:30:00Z' },
    end: { dateTime: '2026-10-22T19:00:00Z' },
    location: 'Gimnasio Universitario',
    description: 'Bench press, remo con barra, fondos y curl bíceps. Meta: 60 kg limpios.',
  },
  {
    id: 'samp-7',
    summary: '🐶 Paseo de Frida (Rutina Matutina)',
    start: { dateTime: '2026-10-22T05:50:00Z' },
    end: { dateTime: '2026-10-22T06:20:00Z' },
    location: 'Cll 63 # 6-41 Edificio Castellana 101',
    description: 'Paseo matutino y cardio ligero (3.500 pasos).',
  },
  {
    id: 'samp-8',
    summary: '🛁 Baño de Recuperación Térmica',
    start: { dateTime: '2026-10-22T20:20:00Z' },
    end: { dateTime: '2026-10-22T21:00:00Z' },
    location: 'Hogar',
    description: 'Recuperación muscular y activación parasimpática.',
  },
];

export default function GoogleCalendarSection() {
  const [user, setUser] = useState<CalendarUser | null>({
    displayName: 'Santiago Smith',
    email: 'santiagosmitttt@gmail.com',
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/calendar/events');
      const data = await res.json();
      if (data.success && Array.isArray(data.events) && data.events.length > 0) {
        setEvents(data.events);
        if (data.account) {
          setUser({
            displayName: 'Santiago Smith Terán',
            email: data.account,
          });
        }
      } else {
        setEvents(STATIC_SAMPLE_EVENTS);
      }
    } catch (err: any) {
      console.warn('Calendar fetch error, using sample events fallback:', err);
      setErrorMsg(err.message || 'Error cargando eventos de Google Calendar');
      setEvents(STATIC_SAMPLE_EVENTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleRefresh = async () => {
    await loadEvents();
  };

  const handleLogout = async () => {
    setUser(null);
    setEvents(STATIC_SAMPLE_EVENTS);
  };

  const displayEvents = events.length > 0 ? events : STATIC_SAMPLE_EVENTS;

  return (
    <section id="google-calendar-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Google Calendar API (OAuth 2.0)
            </span>
            <span className="text-xs font-mono text-slate-400">Pilar 4: Agenda & Compromisos</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Agenda y Calendario de Google
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Sincroniza tus clases de la universidad, sesiones de entrenamiento en el gimnasio y compromisos para que la IA contextualice tu nivel de estrés diario y tiempo libre.
          </p>
        </div>

        {/* Botón de Autenticación con Google */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{user.displayName || user.email}</div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="cursor-pointer p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                title="Recargar eventos de Google Calendar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="cursor-pointer p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                title="Desconectar vista"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="cursor-pointer flex items-center gap-2.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Cargando eventos...' : 'Sincronizar Google Calendar'}</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tarjeta de Correlación Inteligente con la Agenda */}
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/70 dark:from-blue-950/70 dark:via-indigo-950/60 dark:to-purple-950/70 border border-blue-100 dark:border-blue-900/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider">
              Diagnóstico de Agenda & Disponibilidad de Entrenamiento
            </div>
            <p className="text-xs text-blue-800/80 dark:text-blue-300/90 mt-0.5">
              Hoy tienes <strong>3 bloques de clase y estudio</strong> programados. Tu ventana ideal para entrenar en el gimnasio con energía óptima es entre las <strong>17:30 y 19:00</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Carga del Día</span>
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Moderada (4.5h)</span>
          </div>
          <div className="text-center px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Ventana Gym</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Libre 17:30</span>
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayEvents.map((evt) => {
          const startStr = evt.start.dateTime || evt.start.date || '';
          const startTime = startStr.includes('T') ? startStr.split('T')[1].slice(0, 5) : 'Todo el día';
          const isExam = evt.summary.toLowerCase().includes('parcial') || evt.summary.toLowerCase().includes('examen');
          const isGym = evt.summary.toLowerCase().includes('hevy') || evt.summary.toLowerCase().includes('sesión') || evt.summary.toLowerCase().includes('gym');

          return (
            <div
              key={evt.id}
              className={`p-4 rounded-2xl border transition-all ${
                isExam
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                  : isGym
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {startTime}
                </span>
                {isExam ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 dark:border dark:border-rose-800/60 text-rose-700 dark:text-rose-300">
                    Examen / Parcial
                  </span>
                ) : isGym ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 dark:border dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                    Entrenamiento
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 dark:border dark:border-slate-700/80 text-slate-700 dark:text-slate-300">
                    Universidad
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">{evt.summary}</h4>

              {evt.location && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{evt.location}</span>
                </div>
              )}

              {evt.description && (
                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {evt.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
