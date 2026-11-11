'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Printer,
  Download,
  ExternalLink,
  Sparkles,
  Dumbbell,
  Layers,
  ShieldCheck,
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
  isGymOrEnglish?: boolean;
}

type ScheduleScenarioKey = '2026_2_official' | '2027_1_scenario_1' | '2027_1_scenario_2a';

const SCHEDULE_2026_2_OFFICIAL: ScheduleBlock[] = [
  // LUNES
  {
    id: 'sch-vias-lun',
    name: 'Vías II (✅ Def: 4.03)',
    code: 'NRC 52893',
    professor: 'Ing. Nelson Junior Molinares Doria',
    classroom: 'Bloque Principal-Mon 323',
    building: 'Edificio Principal',
    day: 'Lunes',
    startTime: '10:00',
    endTime: '11:40',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
  {
    id: 'sch-hidro-lun',
    name: 'Fundamentos de Hidrología',
    code: 'NRC 52910',
    professor: 'Ing. Hernán José Tapia Contreras',
    classroom: 'Bloque Principal 3-Mon 402',
    building: 'Edificio Principal 3',
    day: 'Lunes',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
  },
  {
    id: 'sch-suelos-lun',
    name: 'Mecánica de Suelos',
    code: 'NRC 52906',
    professor: 'Ing. David Jesús González Arteaga',
    classroom: 'Bloque Laboratorios-Mon 119',
    building: 'Bloque Laboratorios',
    day: 'Lunes',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
  {
    id: 'sch-presup-lun',
    name: 'Programación y Presupuesto (✅ Def: 3.63)',
    code: 'NRC 52914',
    professor: 'Ing. Pablo Javier Berdugo Arroyo',
    classroom: 'Bloque Principal 3-Mon 301',
    building: 'Edificio Principal 3',
    day: 'Lunes',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },

  // MARTES
  {
    id: 'sch-estruct-mar',
    name: 'Análisis de Estructuras',
    code: 'NRC 52885',
    professor: 'Ing. Sergio Elías Flórez Causil',
    classroom: 'Bloque Laboratorios-Mon 109',
    building: 'Bloque Laboratorios',
    day: 'Martes',
    startTime: '08:00',
    endTime: '09:40',
    colorClass: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-800/60',
    textDark: 'dark:text-rose-300',
  },
  {
    id: 'sch-suelos-mar',
    name: 'Mecánica de Suelos',
    code: 'NRC 52906',
    professor: 'Ing. David Jesús González Arteaga',
    classroom: 'Bloque Principal 3-Mon 407',
    building: 'Edificio Principal 3',
    day: 'Martes',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
  {
    id: 'sch-presup-mar',
    name: 'Programación y Presupuesto (✅ Def: 3.63)',
    code: 'NRC 52914',
    professor: 'Ing. Pablo Javier Berdugo Arroyo',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Martes',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },

  // MIÉRCOLES
  {
    id: 'sch-vias-mie',
    name: 'Vías II (✅ Def: 4.03)',
    code: 'NRC 52893',
    professor: 'Ing. Nelson Junior Molinares Doria',
    classroom: 'Bloque Principal 3-Mon 401',
    building: 'Edificio Principal 3',
    day: 'Miércoles',
    startTime: '10:00',
    endTime: '11:40',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
  {
    id: 'sch-hidro-mie',
    name: 'Fundamentos de Hidrología',
    code: 'NRC 52910',
    professor: 'Ing. Hernán José Tapia Contreras',
    classroom: 'Bloque Principal-Mon 211',
    building: 'Edificio Principal',
    day: 'Miércoles',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
  },
  {
    id: 'sch-suelos-mie',
    name: 'Mecánica de Suelos',
    code: 'NRC 52906',
    professor: 'Ing. David Jesús González Arteaga',
    classroom: 'Bloque Laboratorios-Mon 119',
    building: 'Bloque Laboratorios',
    day: 'Miércoles',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
  {
    id: 'sch-presup-mie',
    name: 'Programación y Presupuesto (✅ Def: 3.63)',
    code: 'NRC 52914',
    professor: 'Ing. Pablo Javier Berdugo Arroyo',
    classroom: 'Bloque Principal 3-Mon 301',
    building: 'Edificio Principal 3',
    day: 'Miércoles',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },

  // JUEVES
  {
    id: 'sch-estruct-jue',
    name: 'Análisis de Estructuras',
    code: 'NRC 52885',
    professor: 'Ing. Sergio Elías Flórez Causil',
    classroom: 'Bloque Principal-Mon 407',
    building: 'Edificio Principal',
    day: 'Jueves',
    startTime: '08:00',
    endTime: '09:40',
    colorClass: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-800/60',
    textDark: 'dark:text-rose-300',
  },
  {
    id: 'sch-suelos-jue',
    name: 'Mecánica de Suelos',
    code: 'NRC 52906',
    professor: 'Ing. David Jesús González Arteaga',
    classroom: 'Bloque Principal 3-Mon 308',
    building: 'Edificio Principal 3',
    day: 'Jueves',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
  {
    id: 'sch-presup-jue',
    name: 'Programación y Presupuesto (✅ Def: 3.63)',
    code: 'NRC 52914',
    professor: 'Ing. Pablo Javier Berdugo Arroyo',
    classroom: 'Bloque Principal 3-Mon 303',
    building: 'Edificio Principal 3',
    day: 'Jueves',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },

  // VIERNES
  {
    id: 'sch-vias-vie',
    name: 'Vías II (✅ Def: 4.03)',
    code: 'NRC 52893',
    professor: 'Ing. Nelson Junior Molinares Doria',
    classroom: 'Bloque Principal 3-Mon 307',
    building: 'Edificio Principal 3',
    day: 'Viernes',
    startTime: '10:00',
    endTime: '11:40',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
];

// ESCENARIO 1 (2027-1): APRUEBA TODO (13 CRÉDITOS COMPACTOS + INGLÉS 202750 + GYM UPB 16:00)
const SCHEDULE_2027_1_SCENARIO_1: ScheduleBlock[] = [
  // LUNES
  {
    id: 's1-transp-lun',
    name: 'Transporte (2 cr)',
    code: 'NRC 22223',
    professor: 'Ing. Nelson Junior Molinares Doria',
    classroom: 'Bloque Principal-Mon 212',
    building: 'Edificio Principal',
    day: 'Lunes',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
  {
    id: 's1-concreto-lun',
    name: 'Concreto I (3 cr)',
    code: 'NRC 13826',
    professor: 'Ing. Sergio Elías Flórez Causil',
    classroom: 'Bloque Principal 3-Mon 305',
    building: 'Edificio Principal 3',
    day: 'Lunes',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-800/60',
    textDark: 'dark:text-rose-300',
  },
  {
    id: 's1-gym-lun',
    name: '🏋️‍♂️ Gimnasio UPB (Ventana Protegida)',
    code: 'TG01-1 ($51.6k)',
    professor: 'Entrenamiento Hipertrofia Hevy',
    classroom: 'Gimnasio Campus UPB',
    building: 'Bienestar Universitario',
    day: 'Lunes',
    startTime: '16:00',
    endTime: '17:40',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
    isGymOrEnglish: true,
  },
  {
    id: 's1-acued-lun',
    name: 'Acueducto (2 cr)',
    code: 'NRC 22229',
    professor: 'Ing. Jorge Eliecer Cabrales',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Lunes',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
  },

  // MARTES
  {
    id: 's1-eng-mar',
    name: '🌐 Inglés Nivel 10 — Threshold',
    code: 'NRC 50242 (202750)',
    professor: 'Prof. Katia Díaz',
    classroom: 'Bloque 2-Mon 203',
    building: 'Formación Continua 202750',
    day: 'Martes',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
    bgDark: 'dark:bg-indigo-950/40',
    borderDark: 'dark:border-indigo-800/60',
    textDark: 'dark:text-indigo-300',
    isGymOrEnglish: true,
  },
  {
    id: 's1-transp-mar',
    name: 'Transporte (2 cr)',
    code: 'NRC 22223',
    professor: 'Ing. Nelson Junior Molinares Doria',
    classroom: 'Bloque Principal 3-Mon 404',
    building: 'Edificio Principal 3',
    day: 'Martes',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
  {
    id: 's1-gym-mar',
    name: '🏋️‍♂️ Gimnasio UPB (Ventana Protegida)',
    code: 'TG01-1 ($51.6k)',
    professor: 'Entrenamiento Hipertrofia Hevy',
    classroom: 'Gimnasio Campus UPB',
    building: 'Bienestar Universitario',
    day: 'Martes',
    startTime: '16:00',
    endTime: '17:40',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
    isGymOrEnglish: true,
  },
  {
    id: 's1-acued-mar',
    name: 'Acueducto (2 cr)',
    code: 'NRC 22229',
    professor: 'Ing. Jorge Eliecer Cabrales',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Martes',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
  },

  // MIÉRCOLES
  {
    id: 's1-concreto-mie',
    name: 'Concreto I (3 cr)',
    code: 'NRC 13826',
    professor: 'Ing. Sergio Elías Flórez Causil',
    classroom: 'Bloque Laboratorios-Mon 109',
    building: 'Bloque Laboratorios',
    day: 'Miércoles',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-800/60',
    textDark: 'dark:text-rose-300',
  },
  {
    id: 's1-gym-mie',
    name: '🏋️‍♂️ Gimnasio UPB (Ventana Protegida)',
    code: 'TG01-1 ($51.6k)',
    professor: 'Entrenamiento Hipertrofia Hevy',
    classroom: 'Gimnasio Campus UPB',
    building: 'Bienestar Universitario',
    day: 'Miércoles',
    startTime: '16:00',
    endTime: '17:40',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
    isGymOrEnglish: true,
  },
  {
    id: 's1-alcant-mie',
    name: 'Alcantarillado (2 cr)',
    code: 'NRC 22231',
    professor: 'Ing. Hernán José Tapia Contreras',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Miércoles',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },

  // JUEVES
  {
    id: 's1-eng-jue',
    name: '🌐 Inglés Nivel 10 — Threshold',
    code: 'NRC 50242 (202750)',
    professor: 'Prof. Katia Díaz',
    classroom: 'Bloque 2-Mon 203',
    building: 'Formación Continua 202750',
    day: 'Jueves',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
    bgDark: 'dark:bg-indigo-950/40',
    borderDark: 'dark:border-indigo-800/60',
    textDark: 'dark:text-indigo-300',
    isGymOrEnglish: true,
  },
  {
    id: 's1-concreto-jue',
    name: 'Concreto I (3 cr)',
    code: 'NRC 13826',
    professor: 'Ing. Sergio Elías Flórez Causil',
    classroom: 'Bloque Principal 3-Mon 305',
    building: 'Edificio Principal 3',
    day: 'Jueves',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-800/60',
    textDark: 'dark:text-rose-300',
  },
  {
    id: 's1-gym-jue',
    name: '🏋️‍♂️ Gimnasio UPB (Ventana Protegida)',
    code: 'TG01-1 ($51.6k)',
    professor: 'Entrenamiento Hipertrofia Hevy',
    classroom: 'Gimnasio Campus UPB',
    building: 'Bienestar Universitario',
    day: 'Jueves',
    startTime: '16:00',
    endTime: '17:40',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
    isGymOrEnglish: true,
  },
  {
    id: 's1-alcant-jue',
    name: 'Alcantarillado (2 cr)',
    code: 'NRC 22231',
    professor: 'Ing. Hernán José Tapia Contreras',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Jueves',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },

  // VIERNES
  {
    id: 's1-ecologia-vie',
    name: 'Ecología y Sostenibilidad (2 cr • CBFH II)',
    code: 'NRC 12475 (ELE)',
    professor: 'Facultad Ing. Ambiental',
    classroom: 'Bloque Principal-Mon 106',
    building: 'Edificio Principal',
    day: 'Viernes',
    startTime: '08:00',
    endTime: '09:40',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },
  {
    id: 's1-eng-vie',
    name: '🌐 Inglés Nivel 10 — Threshold',
    code: 'NRC 50242 (202750)',
    professor: 'Prof. Katia Díaz',
    classroom: 'Bloque 2-Mon 203',
    building: 'Formación Continua 202750',
    day: 'Viernes',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
    bgDark: 'dark:bg-indigo-950/40',
    borderDark: 'dark:border-indigo-800/60',
    textDark: 'dark:text-indigo-300',
    isGymOrEnglish: true,
  },
  {
    id: 's1-etica-vie',
    name: 'Ética Profesional (1 cr • CBFH)',
    code: 'NRC 22674',
    professor: 'Formación Humanista',
    classroom: 'Bloque Principal 3-Mon 305',
    building: 'Edificio Principal 3',
    day: 'Viernes',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },
];

// ESCENARIO 2A (2027-1): PLAN DE CONTINGENCIA (11 CRÉDITOS TARDES + EMPRENDIMIENTO + GYM 16:00)
const SCHEDULE_2027_1_SCENARIO_2A: ScheduleBlock[] = [
  // LUNES
  {
    id: 's2-transp-lun',
    name: 'Transporte (2 cr)',
    code: 'NRC 22223',
    professor: 'Ing. Nelson Junior Molinares Doria',
    classroom: 'Bloque Principal-Mon 212',
    building: 'Edificio Principal',
    day: 'Lunes',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
  {
    id: 's2-suelos-lun',
    name: 'Mecánica de Suelos (3 cr)',
    code: 'NRC 13812',
    professor: 'Ing. David Jesús González Arteaga',
    classroom: 'Bloque Laboratorios-Mon 119',
    building: 'Bloque Laboratorios',
    day: 'Lunes',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
  {
    id: 's2-gym-lun',
    name: '🏋️‍♂️ Gimnasio UPB (Ventana Protegida)',
    code: 'TG01-1 ($51.6k)',
    professor: 'Entrenamiento Hipertrofia Hevy',
    classroom: 'Gimnasio Campus UPB',
    building: 'Bienestar Universitario',
    day: 'Lunes',
    startTime: '16:00',
    endTime: '17:40',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
    isGymOrEnglish: true,
  },
  {
    id: 's2-acued-lun',
    name: 'Acueducto (2 cr)',
    code: 'NRC 22229',
    professor: 'Ing. Jorge Eliecer Cabrales',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Lunes',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
  },

  // MARTES
  {
    id: 's2-eng-mar',
    name: '🌐 Inglés Nivel 10 — Threshold',
    code: 'NRC 50242 (202750)',
    professor: 'Prof. Katia Díaz',
    classroom: 'Bloque 2-Mon 203',
    building: 'Formación Continua 202750',
    day: 'Martes',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
    bgDark: 'dark:bg-indigo-950/40',
    borderDark: 'dark:border-indigo-800/60',
    textDark: 'dark:text-indigo-300',
    isGymOrEnglish: true,
  },
  {
    id: 's2-transp-mar',
    name: 'Transporte (2 cr)',
    code: 'NRC 22223',
    professor: 'Ing. Nelson Junior Molinares Doria',
    classroom: 'Bloque Principal 3-Mon 404',
    building: 'Edificio Principal 3',
    day: 'Martes',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
  {
    id: 's2-gym-mar',
    name: '🏋️‍♂️ Gimnasio UPB (Ventana Protegida)',
    code: 'TG01-1 ($51.6k)',
    professor: 'Entrenamiento Hipertrofia Hevy',
    classroom: 'Gimnasio Campus UPB',
    building: 'Bienestar Universitario',
    day: 'Martes',
    startTime: '16:00',
    endTime: '17:40',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
    isGymOrEnglish: true,
  },
  {
    id: 's2-acued-mar',
    name: 'Acueducto (2 cr)',
    code: 'NRC 22229',
    professor: 'Ing. Jorge Eliecer Cabrales',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Martes',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
  },

  // MIÉRCOLES
  {
    id: 's2-suelos-mie',
    name: 'Mecánica de Suelos (3 cr)',
    code: 'NRC 13812',
    professor: 'Ing. David Jesús González Arteaga',
    classroom: 'Bloque Laboratorios-Mon 119',
    building: 'Bloque Laboratorios',
    day: 'Miércoles',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
  {
    id: 's2-gym-mie',
    name: '🏋️‍♂️ Gimnasio UPB (Ventana Protegida)',
    code: 'TG01-1 ($51.6k)',
    professor: 'Entrenamiento Hipertrofia Hevy',
    classroom: 'Gimnasio Campus UPB',
    building: 'Bienestar Universitario',
    day: 'Miércoles',
    startTime: '16:00',
    endTime: '17:40',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
    isGymOrEnglish: true,
  },
  {
    id: 's2-alcant-mie',
    name: 'Alcantarillado (2 cr)',
    code: 'NRC 22231',
    professor: 'Ing. Hernán José Tapia Contreras',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Miércoles',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },

  // JUEVES
  {
    id: 's2-eng-jue',
    name: '🌐 Inglés Nivel 10 — Threshold',
    code: 'NRC 50242 (202750)',
    professor: 'Prof. Katia Díaz',
    classroom: 'Bloque 2-Mon 203',
    building: 'Formación Continua 202750',
    day: 'Jueves',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
    bgDark: 'dark:bg-indigo-950/40',
    borderDark: 'dark:border-indigo-800/60',
    textDark: 'dark:text-indigo-300',
    isGymOrEnglish: true,
  },
  {
    id: 's2-emprend-jue',
    name: 'Emprendimiento y Resp. Social (2 cr)',
    code: 'NRC 21967',
    professor: 'Escuela de Economía',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Jueves',
    startTime: '14:00',
    endTime: '15:40',
    colorClass: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-800/60',
    textDark: 'dark:text-rose-300',
  },
  {
    id: 's2-gym-jue',
    name: '🏋️‍♂️ Gimnasio UPB (Ventana Protegida)',
    code: 'TG01-1 ($51.6k)',
    professor: 'Entrenamiento Hipertrofia Hevy',
    classroom: 'Gimnasio Campus UPB',
    building: 'Bienestar Universitario',
    day: 'Jueves',
    startTime: '16:00',
    endTime: '17:40',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
    isGymOrEnglish: true,
  },
  {
    id: 's2-alcant-jue',
    name: 'Alcantarillado (2 cr)',
    code: 'NRC 22231',
    professor: 'Ing. Hernán José Tapia Contreras',
    classroom: 'Bloque Principal 3-Mon 302',
    building: 'Edificio Principal 3',
    day: 'Jueves',
    startTime: '18:00',
    endTime: '19:40',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },

  // VIERNES
  {
    id: 's2-eng-vie',
    name: '🌐 Inglés Nivel 10 — Threshold',
    code: 'NRC 50242 (202750)',
    professor: 'Prof. Katia Díaz',
    classroom: 'Bloque 2-Mon 203',
    building: 'Formación Continua 202750',
    day: 'Viernes',
    startTime: '12:00',
    endTime: '13:40',
    colorClass: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
    bgDark: 'dark:bg-indigo-950/40',
    borderDark: 'dark:border-indigo-800/60',
    textDark: 'dark:text-indigo-300',
    isGymOrEnglish: true,
  },
  {
    id: 's2-suelos-vie',
    name: 'Mecánica de Suelos (3 cr)',
    code: 'NRC 13812',
    professor: 'Ing. David Jesús González Arteaga',
    classroom: 'Bloque Principal 3-Mon 308',
    building: 'Edificio Principal 3',
    day: 'Viernes',
    startTime: '14:00',
    endTime: '15:40',
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

export default function ScheduleManagerSection() {
  const [scenario, setScenario] = useState<ScheduleScenarioKey>('2026_2_official');
  const [selectedDay, setSelectedDay] = useState<string>('todos');
  const [filterView, setFilterView] = useState<'grid' | 'cards'>('grid');

  const schedule =
    scenario === '2026_2_official'
      ? SCHEDULE_2026_2_OFFICIAL
      : scenario === '2027_1_scenario_1'
      ? SCHEDULE_2027_1_SCENARIO_1
      : SCHEDULE_2027_1_SCENARIO_2A;

  const filteredBlocks =
    selectedDay === 'todos' ? schedule : schedule.filter((s) => s.day === selectedDay);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportIcs = () => {
    const dayMap: Record<string, string> = {
      Lunes: 'MO',
      Martes: 'TU',
      Miércoles: 'WE',
      Jueves: 'TH',
      Viernes: 'FR',
      Sábado: 'SA',
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UPB Monteria//Horario Santiago Teheran//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Horario UPB (${scenario}) - Santiago Teheran`,
      'X-WR-TIMEZONE:America/Bogota',
    ];

    schedule.forEach((block) => {
      const byDay = dayMap[block.day] || 'MO';
      const startClean = block.startTime.replace(':', '') + '00';
      const endClean = block.endTime.replace(':', '') + '00';
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${block.id}-${scenario}@upb.edu.co`,
        `SUMMARY:${block.name} (${block.code})`,
        `DESCRIPTION:Profesor: ${block.professor}\\nAula: ${block.classroom} - ${block.building}`,
        `LOCATION:${block.classroom}, ${block.building}, UPB Montería`,
        `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
        `DTSTART:20260803T${startClean}`,
        `DTEND:20260803T${endClean}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Horario_UPB_Santiago_${scenario}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section
      id="schedule-manager-section"
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10"
    >
      {/* Header Superior */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Motor de Horarios SIGAA UPB (`202620` / `202710` / `202750`)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              0 Cruces • Paseos Caninos & Gimnasio UPB Protegidos
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {scenario === '2026_2_official'
              ? 'Horario Académico Oficial 2026-II (5 Materias • 13 Créditos)'
              : scenario === '2027_1_scenario_1'
              ? 'Proyección 2027-I • Escenario 1: Aprueba Todo (13 cr + Inglés 202750 + Gym 16:00)'
              : 'Proyección 2027-I • Escenario 2A: Contingencia Compacta (11 cr + Inglés 202750 + Gym 16:00)'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl mt-1">
            Conmuta entre tu horario oficial vigente en SIGAA (`202620`) y los dos escenarios óptimos de matrícula para **2027-I (`202710` + `202750`)** con mañanas despejadas para paseos caninos y ventana fija de **Gimnasio UPB (16:00 - 17:40)**.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={handleExportIcs}
            className="cursor-pointer flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            title="Descargar archivo estándar .ics compatible con Google Calendar, Apple Calendar y Outlook"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar .ics</span>
          </button>
          <a
            href="https://vine-sternum-6db.notion.site/HORARIO-210f834da25880df9892f70cb70c5e24"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Notion Oficial</span>
          </a>

          <button
            onClick={handlePrintPdf}
            className="cursor-pointer flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Selector de Periodo / Escenario 2027-1 */}
      <div className="mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Simulador de Escenarios SIGAA:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 max-w-3xl">
          <button
            onClick={() => setScenario('2026_2_official')}
            className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
              scenario === '2026_2_official'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="truncate">📌 2026-2 Oficial (Actual)</div>
            <div className="text-[10px] opacity-80 font-normal">5 Materias • 13 cr • 14 bloques</div>
          </button>

          <button
            onClick={() => setScenario('2027_1_scenario_1')}
            className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
              scenario === '2027_1_scenario_1'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="truncate">🚀 2027-1 Escenario 1 (Ideal)</div>
            <div className="text-[10px] opacity-80 font-normal">13 cr ($409k) + Inglés 202750 + Gym</div>
          </button>

          <button
            onClick={() => setScenario('2027_1_scenario_2a')}
            className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
              scenario === '2027_1_scenario_2a'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="truncate">🛡️ 2027-1 Escenario 2A (Tardes)</div>
            <div className="text-[10px] opacity-80 font-normal">11 cr ($352k) • Mañanas 100% libres</div>
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

      {/* VISTA 1: REJILLA SEMANAL INTERACTIVA */}
      {filterView === 'grid' && (
        <div className="space-y-2">
          <div className="sm:hidden flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/40 text-[11px] font-medium text-blue-700 dark:text-blue-300 text-center">
            <span>👉 Desliza horizontalmente para ver todos los días de la semana</span>
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl scrollbar-none sm:custom-nav-scrollbar">
            <div className="min-w-[800px] grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/60">
              {/* Columna Horas */}
              <div className="p-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">
                  Hora
                </span>
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
                          <span className="text-[11px] text-slate-400/60 dark:text-slate-600 italic">
                            Libre de clases
                          </span>
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
        </div>
      )}

      {/* VISTA 2: LISTA DE TARJETAS */}
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
            {scenario === '2026_2_official' ? <Sparkles className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              {scenario === '2026_2_official'
                ? 'Distribución Espacial Oficial SIGAA 2026-II (Campus UPB Montería)'
                : 'Arquitectura Compacta de Tardes 2027-I + Inglés 202750 + Gimnasio UPB'}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {scenario === '2026_2_official' ? (
                <>
                  Tus 5 asignaturas oficiales (`202620`) se distribuyen en el <strong>Edificio Principal 3</strong> (Presupuesto, Hidrología, Vías, Suelos), <strong>Edificio Principal 1</strong> y <strong>Bloque Laboratorios</strong> (Suelos 119, Estructuras 109).
                </>
              ) : (
                <>
                  Mañanas de Lunes a Jueves 100% despejadas para paseos caninos (<em>Sienna</em> y <em>Frida</em>), almuerzo e <strong>Inglés Threshold (`NRC 50242`) a las 12:00 m.</strong> y bloque sagrado de <strong>Gimnasio UPB de 16:00 a 17:40</strong> antes de Acueducto/Alcantarillado.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 font-medium">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Bloques Semanales</span>
            <span className="font-bold text-slate-900 dark:text-white">{schedule.length} Bloques</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Créditos</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {scenario === '2027_1_scenario_2a' ? '11 Créditos' : '13 Créditos'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
