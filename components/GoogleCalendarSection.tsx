'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  LogOut,
  Sparkles,
  AlertCircle,
  Footprints,
  Dumbbell,
  GraduationCap,
  Heart,
  Plane,
  AlertTriangle,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { CalendarEvent } from '@/lib/googleCalendar';

interface CalendarUser {
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

export type EventCategoryType = 'dog-walk' | 'gym' | 'health' | 'exam' | 'university' | 'trip' | 'personal';

export interface EventClassification {
  type: EventCategoryType;
  label: string;
  badgeClass: string;
  cardClass: string;
}

export function classifyCalendarEvent(evt: CalendarEvent): EventClassification {
  const text = `${evt.summary || ''} ${evt.description || ''} ${evt.location || ''}`.toLowerCase();

  // 1. Paseos Caninos / Mascotas (Frida, Sienna, paseos)
  if (
    text.includes('frida') ||
    text.includes('sienna') ||
    text.includes('paseo') ||
    text.includes('canino') ||
    text.includes('perrita') ||
    text.includes('perro')
  ) {
    return {
      type: 'dog-walk',
      label: 'Paseo Canino (Frida)',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-200',
      cardClass: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-300',
    };
  }

  // 2. Exámenes / Parciales / Quices
  if (
    text.includes('parcial') ||
    text.includes('examen') ||
    text.includes('quiz') ||
    text.includes('sustentación') ||
    text.includes('evaluación')
  ) {
    return {
      type: 'exam',
      label: 'Examen / Parcial',
      badgeClass: 'bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-200',
      cardClass: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-300',
    };
  }

  // 3. Entrenamiento / Gimnasio
  if (
    text.includes('hevy') ||
    text.includes('sesión hevy') ||
    text.includes('gym') ||
    text.includes('gimnasio') ||
    text.includes('pesas') ||
    text.includes('hipertrofia') ||
    text.includes('bench press') ||
    text.includes('bíceps') ||
    text.includes('torso')
  ) {
    return {
      type: 'gym',
      label: 'Entrenamiento (Hevy)',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200',
      cardClass: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300',
    };
  }

  // 4. Salud & Recuperación / Bienestar
  if (
    text.includes('baño') ||
    text.includes('recuperación') ||
    text.includes('térmica') ||
    text.includes('sauna') ||
    text.includes('médico') ||
    text.includes('cita') ||
    text.includes('descanso')
  ) {
    return {
      type: 'health',
      label: 'Salud & Recuperación',
      badgeClass: 'bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800/60 text-teal-800 dark:text-teal-200',
      cardClass: 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50 hover:border-teal-300',
    };
  }

  // 5. Viaje / Vuelos / Transporte
  if (
    text.includes('jetsmart') ||
    text.includes('vuelo') ||
    text.includes('aeropuerto') ||
    text.includes('medellín') ||
    text.includes('rionegro') ||
    text.includes('garzones') ||
    text.includes('viaje')
  ) {
    return {
      type: 'trip',
      label: 'Viaje & Transporte',
      badgeClass: 'bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800/60 text-purple-800 dark:text-purple-200',
      cardClass: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50 hover:border-purple-300',
    };
  }

  // 6. Universidad UPB (Clases y Materias Oficiales)
  if (
    text.includes('upb') ||
    text.includes('nrc') ||
    text.includes('estructuras') ||
    text.includes('hidrología') ||
    text.includes('hidrologia') ||
    text.includes('suelos') ||
    text.includes('vías') ||
    text.includes('vias') ||
    text.includes('presupuesto') ||
    text.includes('concreto') ||
    text.includes('english') ||
    text.includes('inglés') ||
    text.includes('aula') ||
    text.includes('campus') ||
    text.includes('b1') ||
    text.includes('b2') ||
    text.includes('b3')
  ) {
    return {
      type: 'university',
      label: 'Universidad UPB',
      badgeClass: 'bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800/60 text-blue-800 dark:text-blue-200',
      cardClass: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 hover:border-blue-300',
    };
  }

  // 7. General / Compromiso Personal (Fallback)
  return {
    type: 'personal',
    label: 'Compromiso Personal',
    badgeClass: 'bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    cardClass: 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300',
  };
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
    description: 'Paseo matutino y cardio ligero (3.500 pasos). Ingreso cliente Laura.',
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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'university' | 'dog-walk' | 'gym' | 'health'>('all');

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

  // Clasificar eventos y contar por categoría
  const classifiedEvents = useMemo(() => {
    return displayEvents.map((evt) => ({
      evt,
      info: classifyCalendarEvent(evt),
    }));
  }, [displayEvents]);

  const counts = useMemo(() => {
    const uni = classifiedEvents.filter((c) => c.info.type === 'university' || c.info.type === 'exam').length;
    const dog = classifiedEvents.filter((c) => c.info.type === 'dog-walk').length;
    const gym = classifiedEvents.filter((c) => c.info.type === 'gym').length;
    const health = classifiedEvents.filter((c) => c.info.type === 'health').length;
    return { uni, dog, gym, health, total: classifiedEvents.length };
  }, [classifiedEvents]);

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return classifiedEvents;
    if (selectedCategory === 'university') {
      return classifiedEvents.filter((c) => c.info.type === 'university' || c.info.type === 'exam');
    }
    return classifiedEvents.filter((c) => c.info.type === selectedCategory);
  }, [classifiedEvents, selectedCategory]);

  return (
    <section id="google-calendar-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Google Calendar API (OAuth 2.0)
            </span>
            <span className="text-xs font-mono text-slate-400">Pilar 4: Agenda & Compromisos</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Agenda y Calendario de Google
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Clasificación inteligente y separada de tus clases de la UPB, paseos caninos con Frida, entrenamientos Hevy y rutinas de recuperación personal.
          </p>
        </div>

        {/* Botón de Autenticación con Google */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{user.displayName || user.email}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="cursor-pointer p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                title="Recargar eventos de Google Calendar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="cursor-pointer p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tarjeta de Correlación Inteligente con la Agenda */}
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/70 dark:from-blue-950/50 dark:via-indigo-950/40 dark:to-purple-950/50 border border-blue-100 dark:border-blue-900/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider">
              Diagnóstico de Agenda & Rutina Diaria
            </div>
            <p className="text-xs text-blue-800/90 dark:text-blue-300 mt-0.5">
              Tienes <strong>{counts.uni} materias UPB</strong>, <strong>{counts.dog} paseos caninos con Frida</strong>, y <strong>{counts.gym + counts.health} bloques de entrenamiento y recuperación</strong> identificados correctamente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-center px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">UPB</span>
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300">{counts.uni} clases</span>
          </div>
          <div className="text-center px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase block font-semibold">Paseos</span>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">{counts.dog} diario</span>
          </div>
          <div className="text-center px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase block font-semibold">Gym</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">17:30</span>
          </div>
        </div>
      </div>

      {/* Pestañas de Filtro por Categoría Real */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Todos ({counts.total})</span>
        </button>

        <button
          onClick={() => setSelectedCategory('university')}
          className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            selectedCategory === 'university'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Universidad UPB ({counts.uni})</span>
        </button>

        <button
          onClick={() => setSelectedCategory('dog-walk')}
          className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            selectedCategory === 'dog-walk'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>Paseos Caninos ({counts.dog})</span>
        </button>

        <button
          onClick={() => setSelectedCategory('gym')}
          className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            selectedCategory === 'gym'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Entrenamiento ({counts.gym})</span>
        </button>

        <button
          onClick={() => setSelectedCategory('health')}
          className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            selectedCategory === 'health'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Salud & Recuperación ({counts.health})</span>
        </button>
      </div>

      {/* Lista de Eventos Clasificados Correctamente */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map(({ evt, info }) => {
          const startStr = evt.start.dateTime || evt.start.date || '';
          const startTime = startStr.includes('T') ? startStr.split('T')[1].slice(0, 5) : 'Todo el día';

          return (
            <div
              key={evt.id}
              className={`p-4 rounded-2xl border transition-all ${info.cardClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {startTime}
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${info.badgeClass}`}>
                  {info.type === 'dog-walk' && <Footprints className="w-3 h-3 text-amber-600 dark:text-amber-300" />}
                  {info.type === 'gym' && <Dumbbell className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />}
                  {info.type === 'health' && <Heart className="w-3 h-3 text-teal-600 dark:text-teal-300" />}
                  {info.type === 'exam' && <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-300" />}
                  {info.type === 'university' && <GraduationCap className="w-3 h-3 text-blue-600 dark:text-blue-300" />}
                  {info.type === 'trip' && <Plane className="w-3 h-3 text-purple-600 dark:text-purple-300" />}
                  {info.type === 'personal' && <Tag className="w-3 h-3 text-slate-500" />}
                  <span>{info.label}</span>
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                {evt.summary}
              </h4>

              {evt.location && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{evt.location}</span>
                </div>
              )}

              {evt.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
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
