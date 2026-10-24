'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  LayoutGrid,
  CalendarDays,
  Layers,
  GraduationCap,
} from 'lucide-react';
import ScheduleManagerSection from './ScheduleManagerSection';
import GoogleCalendarSection from './GoogleCalendarSection';

export default function UnifiedScheduleCalendarSection() {
  const [viewType, setViewType] = useState<'grid' | 'calendar' | 'combined'>('combined');

  return (
    <section id="unified-schedule-calendar-section" className="space-y-6 animate-fadeIn">
      {/* 1. HEADER INTEGRADO & SELECTOR DE MODO */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Agenda Unificada • UPB Montería & Google Calendar</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Horario Académico & Google Calendar
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Pilar integrado que consolida en un solo lugar la <strong>cuadrícula semanal de clases universitarias (6.° Semestre)</strong> con los
              <strong> eventos en vivo de Google Calendar</strong> (exámenes, paseos de Frida, citas y recordatorios).
            </p>
          </div>

          {/* Sub-Selector de Vista */}
          <div className="w-full lg:w-auto bg-slate-900/90 backdrop-blur-md rounded-2xl border border-blue-500/30 p-2 shrink-0 shadow-lg flex flex-col sm:flex-row items-center gap-1.5 self-stretch lg:self-center">
            <button
              onClick={() => setViewType('combined')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                viewType === 'combined'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vista Integral</span>
            </button>
            <button
              onClick={() => setViewType('grid')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                viewType === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cuadrícula Semanal (Notion)</span>
            </button>
            <button
              onClick={() => setViewType('calendar')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                viewType === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Google Calendar (Agenda en Vivo)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. RENDERIZADO SEGÚN EL MODO ELEGIDO */}
      {viewType === 'combined' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Arriba: Cuadrícula de Clases Semanales */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Bloque 1: Matriz de Clases Semanales UPB</span>
              </span>
            </div>
            <ScheduleManagerSection />
          </div>

          {/* Abajo: Agenda en Vivo de Google Calendar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Bloque 2: Agenda en Tiempo Real (Google Calendar)</span>
              </span>
            </div>
            <GoogleCalendarSection />
          </div>
        </div>
      )}

      {viewType === 'grid' && (
        <div className="animate-fadeIn">
          <ScheduleManagerSection />
        </div>
      )}

      {viewType === 'calendar' && (
        <div className="animate-fadeIn">
          <GoogleCalendarSection />
        </div>
      )}
    </section>
  );
}
