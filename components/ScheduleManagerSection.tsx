'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Printer,
  Plus,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';

export interface ScheduleBlock {
  id: string;
  name: string;
  code: string; // NRC
  professor: string;
  classroom: string;
  building: string;
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  startTime: string; // "08:00"
  endTime: string; // "10:00"
  colorClass: string; // tailwind color token
  bgDark: string;
  borderDark: string;
  textDark: string;
}

const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  {
    id: 'sch-1',
    name: 'English Level 10',
    code: 'NRC 52915',
    professor: 'Centro de Lenguas UPB',
    classroom: 'Virtual / B2 104',
    building: 'Edificio B2',
    day: 'Lunes',
    startTime: '12:00',
    endTime: '14:00',
    colorClass: 'bg-sky-500/15 border-sky-400/40 text-sky-300',
    bgDark: 'dark:bg-sky-950/40',
    borderDark: 'dark:border-sky-800/60',
    textDark: 'dark:text-sky-300',
  },
  {
    id: 'sch-2',
    name: 'Programación y Presupuesto',
    code: 'NRC 52890',
    professor: 'Área de Gestión y Construcción',
    classroom: 'Aula B3 302',
    building: 'Edificio B3',
    day: 'Lunes',
    startTime: '18:00',
    endTime: '20:00',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },
  {
    id: 'sch-3',
    name: 'Vías II',
    code: 'NRC 52895',
    professor: 'Área de Vías y Transporte',
    classroom: 'Aula B3 401',
    building: 'Edificio B3',
    day: 'Martes',
    startTime: '10:00',
    endTime: '12:00',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
  {
    id: 'sch-4',
    name: 'Fundamentos de Hidrología',
    code: 'NRC 52906',
    professor: 'Área de Hidráulica & Recursos Hídricos',
    classroom: 'Aula B1 211',
    building: 'Edificio B1',
    day: 'Martes',
    startTime: '12:00',
    endTime: '14:00',
    colorClass: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
  },
  {
    id: 'sch-5',
    name: 'Mecánica de Suelos',
    code: 'NRC 52910',
    professor: 'Área de Geotecnia',
    classroom: 'Aula B1 106',
    building: 'Edificio B1',
    day: 'Miércoles',
    startTime: '08:00',
    endTime: '10:00',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
  {
    id: 'sch-6',
    name: 'Análisis de Estructuras',
    code: 'NRC 52885',
    professor: 'Área de Estructuras (Llave Concreto I)',
    classroom: 'Aula B3 301 / B1 407',
    building: 'Edificio B3',
    day: 'Miércoles',
    startTime: '18:00',
    endTime: '20:00',
    colorClass: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-800/60',
    textDark: 'dark:text-rose-300',
  },
  {
    id: 'sch-7',
    name: 'Vías II',
    code: 'NRC 52895',
    professor: 'Área de Vías y Transporte',
    classroom: 'Aula B3 401',
    building: 'Edificio B3',
    day: 'Jueves',
    startTime: '10:00',
    endTime: '12:00',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
  {
    id: 'sch-8',
    name: 'Fundamentos de Hidrología',
    code: 'NRC 52906',
    professor: 'Área de Hidráulica & Recursos Hídricos',
    classroom: 'Aula B1 211',
    building: 'Edificio B1',
    day: 'Jueves',
    startTime: '12:00',
    endTime: '14:00',
    colorClass: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
  },
  {
    id: 'sch-9',
    name: 'Mecánica de Suelos (Lab)',
    code: 'NRC 52910',
    professor: 'Laboratorio de Geotecnia',
    classroom: 'Aula B2 114 / Lab Suelos',
    building: 'Edificio B2',
    day: 'Viernes',
    startTime: '08:00',
    endTime: '10:00',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
  {
    id: 'sch-10',
    name: 'Proyecto Integrador II',
    code: 'NRC 52900',
    professor: 'Coordinación Integrador Civil',
    classroom: 'Aula B2 109',
    building: 'Edificio B2',
    day: 'Viernes',
    startTime: '14:00',
    endTime: '17:00',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
  },
  {
    id: 'sch-11',
    name: 'Práctica de Suelos / Campo',
    code: 'NRC 52910',
    professor: 'Ensayos Granulometría & Proctor',
    classroom: 'Laboratorio de Materiales',
    building: 'Campus UPB',
    day: 'Sábado',
    startTime: '09:00',
    endTime: '11:00',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
];

const DAYS: Array<'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'> = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

export default function ScheduleManagerSection() {
  const [schedule] = useState<ScheduleBlock[]>(DEFAULT_SCHEDULE);
  const [selectedDay, setSelectedDay] = useState<string>('todos');
  const [filterView, setFilterView] = useState<'grid' | 'cards'>('grid');

  const filteredBlocks = selectedDay === 'todos'
    ? schedule
    : schedule.filter((s) => s.day === selectedDay);

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <section id="schedule-manager-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10">
      {/* Header Superior */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Gestor de Horarios Universitario UPB
            </span>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
              Inspirado en Notion Sites & teheransmit.github.io/Horario-
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Horario Académico Semestral (2026-II)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Rejilla horaria con bloques de asignaturas, códigos NRC, aulas físicas en el campus Montería (Edificios B1, B2, B3) y profesores a cargo.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://vine-sternum-6db.notion.site/HORARIO-210f834da25880df9892f70cb70c5e24"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Notion Site Oficial</span>
          </a>

          <button
            onClick={handlePrintPdf}
            className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Exportar PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros por Día y Vista */}
      <div className="my-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Píldoras de Días */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            onClick={() => setSelectedDay('todos')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedDay === 'todos'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Toda la Semana
          </button>
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedDay === d
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Toggle Rejilla vs Lista */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          <button
            onClick={() => setFilterView('grid')}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterView === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Rejilla Semanal
          </button>
          <button
            onClick={() => setFilterView('cards')}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterView === 'cards'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Lista de Bloques
          </button>
        </div>
      </div>

      {/* VISTA 1: REJILLA SEMANAL INTERACTIVA (Similar a GitHub Pages Horario) */}
      {filterView === 'grid' && (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="min-w-[800px] grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/60">
            {/* Columna Horas */}
            <div className="p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">Hora</span>
              <div className="space-y-6 text-center">
                {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((h) => (
                  <div key={h} className="text-xs font-mono text-slate-400 dark:text-slate-500 py-2">
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* Columnas Días */}
            {DAYS.map((day) => {
              const dayBlocks = schedule.filter((b) => b.day === day);
              return (
                <div key={day} className="p-2.5 flex flex-col justify-start">
                  <div className="text-center pb-2 mb-2 border-b border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">{day}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {dayBlocks.length} {dayBlocks.length === 1 ? 'bloque' : 'bloques'}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[360px]">
                    {dayBlocks.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-4">
                        <span className="text-[11px] text-slate-400/60 dark:text-slate-600 italic">Libre de clases</span>
                      </div>
                    ) : (
                      dayBlocks.map((b) => (
                        <div
                          key={b.id}
                          className={`p-2.5 rounded-xl border transition-all hover:scale-[1.02] shadow-xs ${b.bgDark} ${b.borderDark} bg-white`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {b.startTime} - {b.endTime}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {b.name}
                          </h4>

                          <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate font-medium">{b.classroom}</span>
                            </div>
                            <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate">
                              {b.code}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: LISTA DE TARJETAS (Optimizado para lectura rápida) */}
      {filterView === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBlocks.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border transition-all shadow-xs ${b.bgDark} ${b.borderDark} bg-white dark:bg-slate-900`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {b.day} • {b.startTime} - {b.endTime}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                  {b.code}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{b.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{b.professor}</p>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold">{b.classroom}</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{b.building}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen de Carga Académica */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Distribución Espacial en el Campus UPB Montería
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tus clases se concentran en el <strong>Edificio B3</strong> (Estructuras, Vías, Obras) y el <strong>Edificio B1/B2</strong> (Hidrología, Suelos e Integrador).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 font-medium">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Total Horas</span>
            <span className="font-bold text-slate-900 dark:text-white">18 hrs/semana</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Materias</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">7 Activas</span>
          </div>
        </div>
      </div>
    </section>
  );
}
