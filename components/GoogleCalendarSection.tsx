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
    summary: 'Clase: Arquitectura de Software & Cloud',
    start: { dateTime: '2026-09-25T14:00:00Z' },
    end: { dateTime: '2026-09-25T16:00:00Z' },
    location: 'Edificio de Ingeniería - Aula 402',
    description: 'Entrega del proyecto de microservicios y despliegue en GCP',
  },
  {
    id: 'samp-2',
    summary: '🏋️ Sesión Hevy: Push Hypertrophy (Pecho y Hombros)',
    start: { dateTime: '2026-09-25T17:30:00Z' },
    end: { dateTime: '2026-09-25T19:00:00Z' },
    location: 'Gimnasio Universitario',
    description: 'Press plano 4x8, Militar 3x8, Fondos 3x10',
  },
  {
    id: 'samp-3',
    summary: 'Grupo de Estudio: Parcial de Inteligencia Artificial',
    start: { dateTime: '2026-09-26T10:00:00Z' },
    end: { dateTime: '2026-09-26T12:00:00Z' },
    location: 'Biblioteca Central - Sala 3',
    description: 'Repaso de Fine-Tuning y Transformers',
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
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/70 border border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-950 uppercase tracking-wider">
              Diagnóstico de Agenda & Disponibilidad de Entrenamiento
            </div>
            <p className="text-xs text-blue-800/80 mt-0.5">
              Hoy tienes <strong>3 bloques de clase y estudio</strong> programados. Tu ventana ideal para entrenar en el gimnasio con energía óptima es entre las <strong>17:30 y 19:00</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center px-3 py-1.5 bg-white/80 rounded-xl border border-blue-200/60">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Carga del Día</span>
            <span className="text-xs font-bold text-blue-900">Moderada (4.5h)</span>
          </div>
          <div className="text-center px-3 py-1.5 bg-white/80 rounded-xl border border-blue-200/60">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ventana Gym</span>
            <span className="text-xs font-bold text-emerald-700">Libre 17:30</span>
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
                  ? 'bg-rose-50/50 border-rose-200'
                  : isGym
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {startTime}
                </span>
                {isExam ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                    Examen / Parcial
                  </span>
                ) : isGym ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    Entrenamiento
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 text-slate-700">
                    Universidad
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{evt.summary}</h4>

              {evt.location && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 truncate">
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
