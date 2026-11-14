import {
  initialAcademicData,
  CourseGrade,
  Offer2027Course,
  LabComponentSummary,
  computeCourseLabSummary,
} from './academicStore';

export type DayName = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export interface ScheduleBlock {
  id: string;
  name: string;
  code: string; // NRC
  professor: string;
  classroom: string;
  building: string;
  day: DayName;
  startTime: string; // "08:00"
  endTime: string; // "10:00"
  colorClass: string;
  bgDark: string;
  borderDark: string;
  textDark: string;
  isGymOrEnglish?: boolean;
  courseId?: string;
  componentType?: 'theory' | 'lab' | 'regular' | 'gym' | 'english';
  credits?: number;
  note?: string;
}

export type TrackedCourseId =
  | 'c-vias'
  | 'c-presupuesto'
  | 'c-suelos'
  | 'c-estructuras'
  | 'c-hidrologia';

export type CourseOverrideMode = 'sigaa_auto' | 'passed' | 'failed';

export interface AcademicInteractiveOverrides {
  courseStatuses: Record<TrackedCourseId, CourseOverrideMode>;
  homologateSuelosLab: boolean;
  includeEtica: boolean;
  includeContratacion: boolean;
  includeElementosCiudad: boolean;
  includeEmprendimiento: 'auto' | 'always' | 'never';
  includeEnglish: boolean;
  updatedAt?: string;
}

export const DEFAULT_ACADEMIC_OVERRIDES: AcademicInteractiveOverrides = {
  courseStatuses: {
    'c-vias': 'sigaa_auto',
    'c-presupuesto': 'sigaa_auto',
    'c-suelos': 'sigaa_auto',
    'c-estructuras': 'sigaa_auto',
    'c-hidrologia': 'sigaa_auto',
  },
  homologateSuelosLab: true,
  includeEtica: true,
  includeContratacion: false,
  includeElementosCiudad: false,
  includeEmprendimiento: 'auto',
  includeEnglish: true,
};

export function mergeAcademicOverrides(
  partial?: Partial<AcademicInteractiveOverrides> | null
): AcademicInteractiveOverrides {
  const incomingStatuses: Partial<Record<TrackedCourseId, unknown>> = partial?.courseStatuses ?? {};
  const validMode = (v: unknown): CourseOverrideMode =>
    v === 'passed' || v === 'failed' || v === 'sigaa_auto' ? v : 'sigaa_auto';

  const incEmp = partial?.includeEmprendimiento;
  const includeEmprendimiento: 'auto' | 'always' | 'never' =
    incEmp === 'always' || incEmp === 'never' || incEmp === 'auto' ? incEmp : 'auto';

  return {
    courseStatuses: {
      'c-vias': validMode(incomingStatuses['c-vias']),
      'c-presupuesto': validMode(incomingStatuses['c-presupuesto']),
      'c-suelos': validMode(incomingStatuses['c-suelos']),
      'c-estructuras': validMode(incomingStatuses['c-estructuras']),
      'c-hidrologia': validMode(incomingStatuses['c-hidrologia']),
    },
    homologateSuelosLab:
      typeof partial?.homologateSuelosLab === 'boolean'
        ? partial.homologateSuelosLab
        : DEFAULT_ACADEMIC_OVERRIDES.homologateSuelosLab,
    includeEtica:
      typeof partial?.includeEtica === 'boolean'
        ? partial.includeEtica
        : DEFAULT_ACADEMIC_OVERRIDES.includeEtica,
    includeContratacion:
      typeof partial?.includeContratacion === 'boolean'
        ? partial.includeContratacion
        : DEFAULT_ACADEMIC_OVERRIDES.includeContratacion,
    includeElementosCiudad:
      typeof partial?.includeElementosCiudad === 'boolean'
        ? partial.includeElementosCiudad
        : DEFAULT_ACADEMIC_OVERRIDES.includeElementosCiudad,
    includeEmprendimiento,
    includeEnglish:
      typeof partial?.includeEnglish === 'boolean'
        ? partial.includeEnglish
        : DEFAULT_ACADEMIC_OVERRIDES.includeEnglish,
    updatedAt: typeof partial?.updatedAt === 'string' ? partial.updatedAt : undefined,
  };
}

interface SectionMeeting {
  day: DayName;
  startTime: string;
  endTime: string;
  classroom: string;
  building: string;
  componentType: 'theory' | 'lab' | 'regular' | 'english';
  note?: string;
}

interface CatalogSectionTemplate {
  key: string;
  nrc: string;
  code: string;
  name: string;
  credits: number;
  professor: string;
  prerequisiteCourseId?: TrackedCourseId;
  prerequisiteLabel?: string;
  role: 'repeat' | 'next' | 'cbfh' | 'english';
  palette: {
    colorClass: string;
    bgDark: string;
    borderDark: string;
    textDark: string;
  };
  meetings: SectionMeeting[];
}

const PALETTES = {
  amber: {
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
  },
  rose: {
    colorClass: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-800/60',
    textDark: 'dark:text-rose-300',
  },
  blue: {
    colorClass: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
  },
  teal: {
    colorClass: 'bg-teal-500/15 border-teal-400/40 text-teal-300',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
  },
  emerald: {
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
  },
  purple: {
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
  },
  orange: {
    colorClass: 'bg-orange-500/15 border-orange-400/40 text-orange-300',
    bgDark: 'dark:bg-orange-950/40',
    borderDark: 'dark:border-orange-800/60',
    textDark: 'dark:text-orange-300',
  },
  cyan: {
    colorClass: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300',
    bgDark: 'dark:bg-cyan-950/40',
    borderDark: 'dark:border-cyan-800/60',
    textDark: 'dark:text-cyan-300',
  },
  lime: {
    colorClass: 'bg-lime-500/15 border-lime-400/40 text-lime-300',
    bgDark: 'dark:bg-lime-950/40',
    borderDark: 'dark:border-lime-800/60',
    textDark: 'dark:text-lime-300',
  },
  indigo: {
    colorClass: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
    bgDark: 'dark:bg-indigo-950/40',
    borderDark: 'dark:border-indigo-800/60',
    textDark: 'dark:text-indigo-300',
  },
};

const VERIFIED_2027_SECTIONS: Record<string, CatalogSectionTemplate> = {
  'suelos-13812': {
    key: 'suelos-13812',
    nrc: 'NRC 13812',
    code: '8825-0050',
    name: 'Mecánica de Suelos (Repetir)',
    credits: 3,
    professor: 'Ing. David Jesús González Arteaga',
    role: 'repeat',
    palette: PALETTES.teal,
    meetings: [
      {
        day: 'Martes',
        startTime: '14:00',
        endTime: '15:40',
        classroom: 'Bloque Principal 3-Mon 408',
        building: 'Edificio Principal 3',
        componentType: 'theory',
        note: 'Componente Teórico (obligatorio)',
      },
      {
        day: 'Jueves',
        startTime: '14:00',
        endTime: '15:40',
        classroom: 'Bloque Principal 3-Mon 301',
        building: 'Edificio Principal 3',
        componentType: 'theory',
        note: 'Componente Teórico (obligatorio)',
      },
      {
        day: 'Miércoles',
        startTime: '14:00',
        endTime: '15:40',
        classroom: 'Bloque Laboratorios-Mon 119',
        building: 'Bloque Laboratorios',
        componentType: 'lab',
        note: 'Laboratorio de Suelos (homologable)',
      },
      {
        day: 'Viernes',
        startTime: '14:00',
        endTime: '15:40',
        classroom: 'Bloque Laboratorios-Mon 119',
        building: 'Bloque Laboratorios',
        componentType: 'lab',
        note: 'Laboratorio de Suelos (homologable)',
      },
    ],
  },
  'estructuras-13802': {
    key: 'estructuras-13802',
    nrc: 'NRC 13802',
    code: '8825-0049',
    name: 'Análisis de Estructuras (Repetir)',
    credits: 2,
    professor: 'Ing. Sergio Elías Flórez Causil',
    role: 'repeat',
    palette: PALETTES.rose,
    meetings: [
      {
        day: 'Martes',
        startTime: '10:00',
        endTime: '11:40',
        classroom: 'Bloque Principal-Mon 204',
        building: 'Edificio Principal',
        componentType: 'regular',
        note: 'Repetición si no supera 3.000',
      },
      {
        day: 'Jueves',
        startTime: '10:00',
        endTime: '11:40',
        classroom: 'Bloque Principal-Mon 125',
        building: 'Edificio Principal',
        componentType: 'regular',
        note: 'Repetición si no supera 3.000',
      },
    ],
  },
  'hidrologia-22221': {
    key: 'hidrologia-22221',
    nrc: 'NRC 22221',
    code: '8825-0030',
    name: 'Fundamentos de Hidrología (Repetir)',
    credits: 2,
    professor: 'Ing. Bertha Rincón Silva',
    role: 'repeat',
    palette: PALETTES.blue,
    meetings: [
      {
        day: 'Lunes',
        startTime: '14:00',
        endTime: '15:40',
        classroom: 'Bloque Principal 3-Mon 402',
        building: 'Edificio Principal 3',
        componentType: 'regular',
      },
      {
        day: 'Miércoles',
        startTime: '14:00',
        endTime: '15:40',
        classroom: 'Bloque Principal-Mon 221',
        building: 'Edificio Principal',
        componentType: 'regular',
      },
    ],
  },
  'hidrologia-22222': {
    key: 'hidrologia-22222',
    nrc: 'NRC 22222',
    code: '8825-0030',
    name: 'Fundamentos de Hidrología (Repetir)',
    credits: 2,
    professor: 'Ing. Juan Medrano Barboza',
    role: 'repeat',
    palette: PALETTES.blue,
    meetings: [
      {
        day: 'Lunes',
        startTime: '10:00',
        endTime: '11:40',
        classroom: 'Bloque Principal-Mon 409',
        building: 'Edificio Principal',
        componentType: 'regular',
      },
      {
        day: 'Jueves',
        startTime: '10:00',
        endTime: '11:40',
        classroom: 'Bloque Principal-Mon 323',
        building: 'Edificio Principal',
        componentType: 'regular',
      },
    ],
  },
  'cimentaciones-22225': {
    key: 'cimentaciones-22225',
    nrc: 'NRC 22225',
    code: '8825-0035',
    name: 'Cimentaciones',
    credits: 3,
    professor: 'Ing. Manuel Doria Narváez',
    prerequisiteCourseId: 'c-suelos',
    prerequisiteLabel: 'Mecánica de Suelos',
    role: 'next',
    palette: PALETTES.orange,
    meetings: [
      {
        day: 'Lunes',
        startTime: '14:00',
        endTime: '15:40',
        classroom: 'Bloque Principal 3-Mon 403',
        building: 'Edificio Principal 3',
        componentType: 'theory',
      },
      {
        day: 'Miércoles',
        startTime: '14:00',
        endTime: '15:40',
        classroom: 'Bloque Principal-Mon 204',
        building: 'Edificio Principal',
        componentType: 'theory',
      },
      {
        day: 'Lunes',
        startTime: '16:00',
        endTime: '17:40',
        classroom: 'Bloque Laboratorios-Mon 119',
        building: 'Bloque Laboratorios',
        componentType: 'lab',
      },
      {
        day: 'Miércoles',
        startTime: '16:00',
        endTime: '17:40',
        classroom: 'Bloque Laboratorios-Mon 119',
        building: 'Bloque Laboratorios',
        componentType: 'lab',
      },
    ],
  },
  'transporte-22223': {
    key: 'transporte-22223',
    nrc: 'NRC 22223',
    code: '8825-0031',
    name: 'Transporte',
    credits: 2,
    professor: 'Ing. Rafael Pastrana Usta',
    prerequisiteCourseId: 'c-vias',
    prerequisiteLabel: 'Vías II',
    role: 'next',
    palette: PALETTES.amber,
    meetings: [
      {
        day: 'Lunes',
        startTime: '12:00',
        endTime: '13:40',
        classroom: 'Bloque Principal 3-Mon 401',
        building: 'Edificio Principal 3',
        componentType: 'regular',
      },
      {
        day: 'Miércoles',
        startTime: '12:00',
        endTime: '13:40',
        classroom: 'Bloque Principal 3-Mon 304',
        building: 'Edificio Principal 3',
        componentType: 'regular',
      },
    ],
  },
  'concreto-13826': {
    key: 'concreto-13826',
    nrc: 'NRC 13826',
    code: '8825-0029',
    name: 'Concreto I',
    credits: 2,
    professor: 'Ing. Sergio Elías Flórez Causil',
    prerequisiteCourseId: 'c-estructuras',
    prerequisiteLabel: 'Análisis de Estructuras',
    role: 'next',
    palette: PALETTES.rose,
    meetings: [
      {
        day: 'Martes',
        startTime: '12:00',
        endTime: '13:40',
        classroom: 'Bloque Principal-Mon 216',
        building: 'Edificio Principal',
        componentType: 'regular',
      },
      {
        day: 'Jueves',
        startTime: '12:00',
        endTime: '13:40',
        classroom: 'Bloque Principal 3-Mon 408',
        building: 'Edificio Principal 3',
        componentType: 'regular',
      },
    ],
  },
  'acueducto-22229': {
    key: 'acueducto-22229',
    nrc: 'NRC 22229',
    code: '8825-0033',
    name: 'Acueducto',
    credits: 2,
    professor: 'Ing. Juan Durango Grisales',
    prerequisiteCourseId: 'c-hidrologia',
    prerequisiteLabel: 'Fundamentos de Hidrología',
    role: 'next',
    palette: PALETTES.cyan,
    meetings: [
      {
        day: 'Lunes',
        startTime: '18:00',
        endTime: '19:40',
        classroom: 'Bloque Principal 3-Mon 303',
        building: 'Edificio Principal 3',
        componentType: 'regular',
      },
      {
        day: 'Miércoles',
        startTime: '18:00',
        endTime: '19:40',
        classroom: 'Bloque Principal 3-Mon 301',
        building: 'Edificio Principal 3',
        componentType: 'regular',
      },
    ],
  },
  'alcantarillado-22231': {
    key: 'alcantarillado-22231',
    nrc: 'NRC 22231',
    code: '8825-0034',
    name: 'Alcantarillado',
    credits: 2,
    professor: 'Ing. Juan Durango Grisales',
    prerequisiteCourseId: 'c-hidrologia',
    prerequisiteLabel: 'Fundamentos de Hidrología',
    role: 'next',
    palette: PALETTES.blue,
    meetings: [
      {
        day: 'Martes',
        startTime: '18:00',
        endTime: '19:40',
        classroom: 'Bloque Principal 3-Mon 302',
        building: 'Edificio Principal 3',
        componentType: 'regular',
      },
      {
        day: 'Jueves',
        startTime: '18:00',
        endTime: '19:40',
        classroom: 'Bloque Principal 3-Mon 303',
        building: 'Edificio Principal 3',
        componentType: 'regular',
      },
    ],
  },
  'contratacion-22233': {
    key: 'contratacion-22233',
    nrc: 'NRC 22233',
    code: '8825-0036',
    name: 'Contratación y Legislación',
    credits: 2,
    professor: 'Ing. Jesús López Peña',
    prerequisiteCourseId: 'c-presupuesto',
    prerequisiteLabel: 'Programación y Presupuesto',
    role: 'next',
    palette: PALETTES.emerald,
    meetings: [
      {
        day: 'Viernes',
        startTime: '06:00',
        endTime: '07:40',
        classroom: 'Bloque Laboratorios-Mon 109',
        building: 'Bloque Laboratorios',
        componentType: 'regular',
        note: 'Franja mañana viernes (afecta descanso/paseos)',
      },
      {
        day: 'Viernes',
        startTime: '08:00',
        endTime: '09:40',
        classroom: 'Bloque Laboratorios-Mon 109',
        building: 'Bloque Laboratorios',
        componentType: 'regular',
        note: 'Franja mañana viernes (afecta paseos)',
      },
    ],
  },
  'etica-22674': {
    key: 'etica-22674',
    nrc: 'NRC 22674',
    code: '5555-0010',
    name: 'Ética Profesional',
    credits: 1,
    professor: 'Rosa Rodríguez Barón (CBFH)',
    role: 'cbfh',
    palette: PALETTES.purple,
    meetings: [
      {
        day: 'Miércoles',
        startTime: '14:00',
        endTime: '15:40',
        classroom: 'Bloque Principal-Mon 217',
        building: 'Edificio Principal',
        componentType: 'regular',
        note: 'Encaja al liberar Lab Suelos de Mié 14:00',
      },
    ],
  },
  'emprendimiento-21967': {
    key: 'emprendimiento-21967',
    nrc: 'NRC 21967',
    code: '6069-0001',
    name: 'Emprendimiento y Resp. Social',
    credits: 2,
    professor: 'Patricia Cassab (Administración)',
    role: 'cbfh',
    palette: PALETTES.indigo,
    meetings: [
      {
        day: 'Martes',
        startTime: '12:00',
        endTime: '13:40',
        classroom: 'Bloque Principal 3-Mon 304',
        building: 'Edificio Principal 3',
        componentType: 'regular',
        note: 'Bolsa CBFH Obligatoria (Plan B si falta Concreto I)',
      },
      {
        day: 'Jueves',
        startTime: '12:00',
        endTime: '13:40',
        classroom: 'Bloque Principal 3-Mon 304',
        building: 'Edificio Principal 3',
        componentType: 'regular',
        note: 'Bolsa CBFH Obligatoria (Plan B si falta Concreto I)',
      },
    ],
  },
  'ciudad-14026': {
    key: 'ciudad-14026',
    nrc: 'NRC 14026',
    code: '8818-0044',
    name: 'Elementos de Ciudad (ELE Arquitectura)',
    credits: 2,
    professor: 'Sonia Gómez Bustamante (Arquitectura)',
    role: 'cbfh',
    palette: PALETTES.purple,
    meetings: [
      {
        day: 'Viernes',
        startTime: '14:00',
        endTime: '17:20',
        classroom: 'Bloque Arquitectura-Mon',
        building: 'Facultad de Arquitectura',
        componentType: 'regular',
        note: 'Solo viable si Lab Suelos Vie 14:00 está homologado',
      },
    ],
  },
  'ingles-50242': {
    key: 'ingles-50242',
    nrc: 'NRC 50242',
    code: '5564-0083T',
    name: 'Inglés Nivel 10 — Threshold (Tardes)',
    credits: 0,
    professor: 'Prof. Katia Díaz (Centro de Lenguas)',
    role: 'english',
    palette: PALETTES.lime,
    meetings: [
      {
        day: 'Martes',
        startTime: '12:00',
        endTime: '13:40',
        classroom: 'Bloque Principal 2-Mon 203',
        building: 'Edificio Principal 2',
        componentType: 'english',
      },
      {
        day: 'Jueves',
        startTime: '12:00',
        endTime: '13:40',
        classroom: 'Bloque Principal 2-Mon 203',
        building: 'Edificio Principal 2',
        componentType: 'english',
      },
      {
        day: 'Viernes',
        startTime: '12:00',
        endTime: '13:40',
        classroom: 'Bloque Principal 2-Mon 203',
        building: 'Edificio Principal 2',
        componentType: 'english',
      },
    ],
  },
  'ingles-50244': {
    key: 'ingles-50244',
    nrc: 'NRC 50244',
    code: '5564-0083T',
    name: 'Inglés Nivel 10 — Threshold (Sábados)',
    credits: 0,
    professor: 'Centro de Lenguas UPB (202750)',
    role: 'english',
    palette: PALETTES.lime,
    meetings: [
      {
        day: 'Sábado',
        startTime: '07:00',
        endTime: '12:50',
        classroom: 'Campus UPB Montería',
        building: 'Formación Continua 202750',
        componentType: 'english',
      },
    ],
  },
};

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function intervalsOverlap(
  a: { day: DayName; startTime: string; endTime: string },
  b: { day: DayName; startTime: string; endTime: string }
): number {
  if (a.day !== b.day) return 0;
  const start = Math.max(toMinutes(a.startTime), toMinutes(b.startTime));
  const end = Math.min(toMinutes(a.endTime), toMinutes(b.endTime));
  return Math.max(0, end - start);
}

export function computeScheduleOverlapMinutes(blocks: ScheduleBlock[]): number {
  let total = 0;
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      total += intervalsOverlap(blocks[i], blocks[j]);
    }
  }
  return total;
}

export interface ProjectedCourseStatus {
  id: TrackedCourseId;
  name: string;
  subjectCode: string;
  credits: number;
  accumulatedPoints: number;
  evaluatedPercent: number;
  overrideMode: CourseOverrideMode;
  sigaaStatus: CourseGrade['status'];
  effectiveOutcome: 'passed' | 'projected_pass' | 'failed';
  isPassingForPrereqs: boolean;
  blocksNextCourses: string[];
  unlocksNextCourses: string[];
  labSummary: LabComponentSummary;
}

export interface EnrolledCourseSummary {
  key: string;
  nrc: string;
  code: string;
  name: string;
  credits: number;
  role: 'repeat' | 'next' | 'cbfh' | 'english';
  theoryOnlyMode?: boolean;
  reason: string;
}

export interface BlockedCourseInfo {
  nrc: string;
  code: string;
  name: string;
  credits: number;
  prerequisiteCourseId: TrackedCourseId;
  prerequisiteName: string;
  reason: string;
}

export interface SkippedCourseConflict {
  nrc: string;
  name: string;
  credits: number;
  conflictWith: string;
  reason: string;
}

export interface DynamicSchedulePlan {
  blocks: ScheduleBlock[];
  enrolledCourses: EnrolledCourseSummary[];
  blockedCourses: BlockedCourseInfo[];
  skippedForConflict: SkippedCourseConflict[];
  totalCredits: number;
  netCreditsCost: number;
  studentInsurance: number;
  totalNetTuition: number;
  surplusForGym: number;
  gymMonthsCovered: number;
  overlapMinutes: number;
  morningProtected: boolean;
  fridayAfternoonFree: boolean;
  suelosMode: 'not_repeated' | 'theory_only_homologated' | 'full_theory_and_lab';
  freedLabSlots: string[];
  englishNrc: string | null;
}

export interface Offer2027ReactiveItem extends Offer2027Course {
  reactiveStatus: 'enrolled' | 'blocked_prereq' | 'conflict' | 'trap' | 'available';
  reactiveReason: string;
}

export interface AcademicProjectionResult {
  overrides: AcademicInteractiveOverrides;
  suelosCourse: CourseGrade;
  suelosLabSummary: LabComponentSummary;
  homologationApplied: boolean;
  projectedCourses: ProjectedCourseStatus[];
  projectedCourseMap: Record<TrackedCourseId, ProjectedCourseStatus>;
  schedule2026Official: ScheduleBlock[];
  schedule2027Real: DynamicSchedulePlan;
  schedule2027Contingency: DynamicSchedulePlan;
  offerCatalogWithStatus: Offer2027ReactiveItem[];
}

const NEXT_COURSES_BY_PREREQ: Record<TrackedCourseId, string[]> = {
  'c-suelos': ['Cimentaciones (NRC 22225, 3 cr)'],
  'c-vias': ['Transporte (NRC 22223, 2 cr)', 'Pavimentos (8825-0038, 3 cr)'],
  'c-estructuras': ['Concreto I (NRC 13826, 2 cr)'],
  'c-hidrologia': ['Acueducto (NRC 22229, 2 cr)', 'Alcantarillado (NRC 22231, 2 cr)'],
  'c-presupuesto': ['Contratación y Legislación (NRC 22233, 2 cr)'],
};

function resolveEffectiveCourseStatus(
  course: CourseGrade,
  overrideMode: CourseOverrideMode
): {
  effectiveOutcome: 'passed' | 'projected_pass' | 'failed';
  isPassingForPrereqs: boolean;
} {
  if (overrideMode === 'passed') {
    return { effectiveOutcome: 'passed', isPassingForPrereqs: true };
  }
  if (overrideMode === 'failed') {
    return { effectiveOutcome: 'failed', isPassingForPrereqs: false };
  }
  // sigaa_auto
  if (course.status === 'failed' || (course.evaluatedPercent === 100 && course.accumulatedPoints < 3.0)) {
    return { effectiveOutcome: 'failed', isPassingForPrereqs: false };
  }
  if (course.status === 'passed' || course.accumulatedPoints >= 3.0) {
    return { effectiveOutcome: 'passed', isPassingForPrereqs: true };
  }
  // in_progress con promedio parcial positivo (Estructuras 4.10, Hidrología 4.30)
  return {
    effectiveOutcome: 'projected_pass',
    isPassingForPrereqs: course.currentAverage >= 3.0,
  };
}

function buildOfficial2026Schedule(
  courseMap: Record<TrackedCourseId, ProjectedCourseStatus>
): ScheduleBlock[] {
  const tagFor = (id: TrackedCourseId, baseName: string): string => {
    const p = courseMap[id];
    if (p.sigaaStatus === 'failed') return `${baseName} (❌ ${p.accumulatedPoints.toFixed(2)})`;
    if (p.sigaaStatus === 'passed') return `${baseName} (✅ ${p.accumulatedPoints.toFixed(2)})`;
    return `${baseName} (${p.accumulatedPoints.toFixed(2)} / ${p.evaluatedPercent}%)`;
  };

  const viasTitle = tagFor('c-vias', 'Vías II');
  const presTitle = tagFor('c-presupuesto', 'Programación y Presupuesto');
  const suelosTitle = tagFor('c-suelos', 'Mecánica de Suelos');
  const estTitle = tagFor('c-estructuras', 'Análisis de Estructuras');
  const hidroTitle = tagFor('c-hidrologia', 'Fundamentos de Hidrología');

  return [
    {
      id: 'sch-vias-lun',
      name: viasTitle,
      code: 'NRC 52893',
      professor: 'Ing. Nelson Junior Molinares Doria',
      classroom: 'Bloque Principal-Mon 323',
      building: 'Edificio Principal',
      day: 'Lunes',
      startTime: '10:00',
      endTime: '11:40',
      courseId: 'c-vias',
      credits: 3,
      ...PALETTES.amber,
    },
    {
      id: 'sch-hidro-lun',
      name: hidroTitle,
      code: 'NRC 52910',
      professor: 'Ing. Hernán José Tapia Contreras',
      classroom: 'Bloque Principal 3-Mon 402',
      building: 'Edificio Principal 3',
      day: 'Lunes',
      startTime: '12:00',
      endTime: '13:40',
      courseId: 'c-hidrologia',
      credits: 2,
      ...PALETTES.blue,
    },
    {
      id: 'sch-suelos-lun',
      name: suelosTitle,
      code: 'NRC 52906',
      professor: 'Ing. David Jesús González Arteaga',
      classroom: 'Bloque Laboratorios-Mon 119',
      building: 'Bloque Laboratorios',
      day: 'Lunes',
      startTime: '14:00',
      endTime: '15:40',
      courseId: 'c-suelos',
      credits: 3,
      ...PALETTES.teal,
    },
    {
      id: 'sch-presup-lun',
      name: presTitle,
      code: 'NRC 52914',
      professor: 'Ing. Pablo Javier Berdugo Arroyo',
      classroom: 'Bloque Principal 3-Mon 301',
      building: 'Edificio Principal 3',
      day: 'Lunes',
      startTime: '18:00',
      endTime: '19:40',
      courseId: 'c-presupuesto',
      credits: 3,
      ...PALETTES.emerald,
    },
    {
      id: 'sch-estruct-mar',
      name: estTitle,
      code: 'NRC 52885',
      professor: 'Ing. Sergio Elías Flórez Causil',
      classroom: 'Bloque Laboratorios-Mon 109',
      building: 'Bloque Laboratorios',
      day: 'Martes',
      startTime: '08:00',
      endTime: '09:40',
      courseId: 'c-estructuras',
      credits: 2,
      ...PALETTES.rose,
    },
    {
      id: 'sch-suelos-mar',
      name: suelosTitle,
      code: 'NRC 52906',
      professor: 'Ing. David Jesús González Arteaga',
      classroom: 'Bloque Principal 3-Mon 407',
      building: 'Edificio Principal 3',
      day: 'Martes',
      startTime: '14:00',
      endTime: '15:40',
      courseId: 'c-suelos',
      credits: 3,
      ...PALETTES.teal,
    },
    {
      id: 'sch-presup-mar',
      name: presTitle,
      code: 'NRC 52914',
      professor: 'Ing. Pablo Javier Berdugo Arroyo',
      classroom: 'Bloque Principal 3-Mon 302',
      building: 'Edificio Principal 3',
      day: 'Martes',
      startTime: '18:00',
      endTime: '19:40',
      courseId: 'c-presupuesto',
      credits: 3,
      ...PALETTES.emerald,
    },
    {
      id: 'sch-vias-mie',
      name: viasTitle,
      code: 'NRC 52893',
      professor: 'Ing. Nelson Junior Molinares Doria',
      classroom: 'Bloque Principal 3-Mon 401',
      building: 'Edificio Principal 3',
      day: 'Miércoles',
      startTime: '10:00',
      endTime: '11:40',
      courseId: 'c-vias',
      credits: 3,
      ...PALETTES.amber,
    },
    {
      id: 'sch-hidro-mie',
      name: hidroTitle,
      code: 'NRC 52910',
      professor: 'Ing. Hernán José Tapia Contreras',
      classroom: 'Bloque Principal-Mon 211',
      building: 'Edificio Principal',
      day: 'Miércoles',
      startTime: '12:00',
      endTime: '13:40',
      courseId: 'c-hidrologia',
      credits: 2,
      ...PALETTES.blue,
    },
    {
      id: 'sch-suelos-mie',
      name: suelosTitle,
      code: 'NRC 52906',
      professor: 'Ing. David Jesús González Arteaga',
      classroom: 'Bloque Laboratorios-Mon 119',
      building: 'Bloque Laboratorios',
      day: 'Miércoles',
      startTime: '14:00',
      endTime: '15:40',
      courseId: 'c-suelos',
      credits: 3,
      ...PALETTES.teal,
    },
    {
      id: 'sch-presup-mie',
      name: presTitle,
      code: 'NRC 52914',
      professor: 'Ing. Pablo Javier Berdugo Arroyo',
      classroom: 'Bloque Principal 3-Mon 301',
      building: 'Edificio Principal 3',
      day: 'Miércoles',
      startTime: '18:00',
      endTime: '19:40',
      courseId: 'c-presupuesto',
      credits: 3,
      ...PALETTES.emerald,
    },
    {
      id: 'sch-estruct-jue',
      name: estTitle,
      code: 'NRC 52885',
      professor: 'Ing. Sergio Elías Flórez Causil',
      classroom: 'Bloque Principal-Mon 407',
      building: 'Edificio Principal',
      day: 'Jueves',
      startTime: '08:00',
      endTime: '09:40',
      courseId: 'c-estructuras',
      credits: 2,
      ...PALETTES.rose,
    },
    {
      id: 'sch-suelos-jue',
      name: suelosTitle,
      code: 'NRC 52906',
      professor: 'Ing. David Jesús González Arteaga',
      classroom: 'Bloque Principal 3-Mon 308',
      building: 'Edificio Principal 3',
      day: 'Jueves',
      startTime: '14:00',
      endTime: '15:40',
      courseId: 'c-suelos',
      credits: 3,
      ...PALETTES.teal,
    },
    {
      id: 'sch-presup-jue',
      name: presTitle,
      code: 'NRC 52914',
      professor: 'Ing. Pablo Javier Berdugo Arroyo',
      classroom: 'Bloque Principal 3-Mon 303',
      building: 'Edificio Principal 3',
      day: 'Jueves',
      startTime: '18:00',
      endTime: '19:40',
      courseId: 'c-presupuesto',
      credits: 3,
      ...PALETTES.emerald,
    },
    {
      id: 'sch-vias-vie',
      name: viasTitle,
      code: 'NRC 52893',
      professor: 'Ing. Nelson Junior Molinares Doria',
      classroom: 'Bloque Principal 3-Mon 307',
      building: 'Edificio Principal 3',
      day: 'Viernes',
      startTime: '10:00',
      endTime: '11:40',
      courseId: 'c-vias',
      credits: 3,
      ...PALETTES.amber,
    },
  ];
}

function buildDynamicSchedule2027(
  overrides: AcademicInteractiveOverrides,
  courseMap: Record<TrackedCourseId, ProjectedCourseStatus>,
  suelosLabSummary: LabComponentSummary
): DynamicSchedulePlan {
  const placedBlocks: ScheduleBlock[] = [];
  const enrolledCourses: EnrolledCourseSummary[] = [];
  const blockedCourses: BlockedCourseInfo[] = [];
  const skippedForConflict: SkippedCourseConflict[] = [];

  const suelosPassing = courseMap['c-suelos'].isPassingForPrereqs;
  const estructurasPassing = courseMap['c-estructuras'].isPassingForPrereqs;
  const hidroPassing = courseMap['c-hidrologia'].isPassingForPrereqs;
  const viasPassing = courseMap['c-vias'].isPassingForPrereqs;
  const presPassing = courseMap['c-presupuesto'].isPassingForPrereqs;

  const canHomologateSuelosLab = !suelosPassing && suelosLabSummary.homologationEligible;
  const homologationApplied = canHomologateSuelosLab && overrides.homologateSuelosLab;

  const suelosMode: DynamicSchedulePlan['suelosMode'] = suelosPassing
    ? 'not_repeated'
    : homologationApplied
    ? 'theory_only_homologated'
    : 'full_theory_and_lab';

  const freedLabSlots: string[] = homologationApplied
    ? ['Miércoles 14:00-15:40 (Lab 119)', 'Viernes 14:00-15:40 (Lab 119)']
    : [];

  const findConflictWith = (
    meetings: Array<Pick<SectionMeeting, 'day' | 'startTime' | 'endTime'>>
  ): string | null => {
    for (const m of meetings) {
      for (const existing of placedBlocks) {
        if (intervalsOverlap(m, existing) > 0) {
          return `${existing.name} (${existing.day} ${existing.startTime}-${existing.endTime})`;
        }
      }
    }
    return null;
  };

  const tryPlaceSection = (
    template: CatalogSectionTemplate,
    reason: string,
    options?: { skipLabMeetings?: boolean; labelOverride?: string; theoryOnlyTag?: boolean }
  ): boolean => {
    const activeMeetings = options?.skipLabMeetings
      ? template.meetings.filter((m) => m.componentType !== 'lab')
      : template.meetings;

    const conflict = findConflictWith(activeMeetings);
    if (conflict) {
      skippedForConflict.push({
        nrc: template.nrc,
        name: options?.labelOverride ?? template.name,
        credits: template.credits,
        conflictWith: conflict,
        reason: `Cruce detectado con ${conflict}`,
      });
      return false;
    }

    const displayName =
      options?.labelOverride ??
      (template.credits > 0 ? `${template.name} (${template.credits} cr)` : template.name);

    activeMeetings.forEach((m, idx) => {
      placedBlocks.push({
        id: `dyn-${template.key}-${idx}-${m.day.toLowerCase()}`,
        name: displayName,
        code: template.nrc,
        professor: template.professor,
        classroom: m.classroom,
        building: m.building,
        day: m.day,
        startTime: m.startTime,
        endTime: m.endTime,
        colorClass: template.palette.colorClass,
        bgDark: template.palette.bgDark,
        borderDark: template.palette.borderDark,
        textDark: template.palette.textDark,
        courseId: template.key,
        componentType: m.componentType,
        credits: template.credits,
        isGymOrEnglish: template.role === 'english',
        note: m.note,
      });
    });

    enrolledCourses.push({
      key: template.key,
      nrc: template.nrc,
      code: template.code,
      name: template.name,
      credits: template.credits,
      role: template.role,
      theoryOnlyMode: options?.theoryOnlyTag,
      reason,
    });
    return true;
  };

  // 1. Repetición obligatoria si se reprueba materia llave
  if (!suelosPassing) {
    const label = homologationApplied
      ? `Mecánica de Suelos • Solo Teoría (3 cr — Lab ${suelosLabSummary.weightedAverage.toFixed(2)} homol.)`
      : 'Mecánica de Suelos • Teoría + Lab (3 cr)';
    const reason = homologationApplied
      ? `Repite Suelos (${courseMap['c-suelos'].accumulatedPoints.toFixed(2)}). Lab homologado (${suelosLabSummary.weightedAverage.toFixed(2)} ≥ 4.00): libera Mié y Vie 14:00.`
      : `Repite Suelos (${courseMap['c-suelos'].accumulatedPoints.toFixed(2)}) con componente Teórico + Laboratorio completo.`;

    tryPlaceSection(VERIFIED_2027_SECTIONS['suelos-13812'], reason, {
      skipLabMeetings: homologationApplied,
      labelOverride: label,
      theoryOnlyTag: homologationApplied,
    });

    blockedCourses.push({
      nrc: VERIFIED_2027_SECTIONS['cimentaciones-22225'].nrc,
      code: VERIFIED_2027_SECTIONS['cimentaciones-22225'].code,
      name: 'Cimentaciones',
      credits: 3,
      prerequisiteCourseId: 'c-suelos',
      prerequisiteName: 'Mecánica de Suelos',
      reason: `Bloqueada por Mecánica de Suelos (${courseMap['c-suelos'].accumulatedPoints.toFixed(2)} < 3.000).`,
    });
  } else {
    tryPlaceSection(
      VERIFIED_2027_SECTIONS['cimentaciones-22225'],
      'Simulación: Suelos aprobada -> Cimentaciones habilitada.'
    );
  }

  if (!estructurasPassing) {
    tryPlaceSection(
      VERIFIED_2027_SECTIONS['estructuras-13802'],
      'Repetición prioritaria de Análisis de Estructuras (Mar/Jue 10:00-11:40).'
    );
    blockedCourses.push({
      nrc: VERIFIED_2027_SECTIONS['concreto-13826'].nrc,
      code: VERIFIED_2027_SECTIONS['concreto-13826'].code,
      name: 'Concreto I',
      credits: 2,
      prerequisiteCourseId: 'c-estructuras',
      prerequisiteName: 'Análisis de Estructuras',
      reason: 'Bloqueada si Análisis de Estructuras queda < 3.000.',
    });
  }

  if (!hidroPassing) {
    // Intenta primero franja tarde (Lun/Mié 14:00) para proteger mañanas; si choca, usa mañana (Lun/Jue 10:00)
    const placedTarde = tryPlaceSection(
      VERIFIED_2027_SECTIONS['hidrologia-22221'],
      'Repetición Fundamentos de Hidrología en tarde (Lun/Mié 14:00-15:40, sin tocar mañanas).'
    );
    if (!placedTarde) {
      tryPlaceSection(
        VERIFIED_2027_SECTIONS['hidrologia-22222'],
        'Repetición Fundamentos de Hidrología (Lun/Jue 10:00-11:40; tarde Lun/Mié ocupada).'
      );
    }

    for (const depKey of ['acueducto-22229', 'alcantarillado-22231'] as const) {
      const tmpl = VERIFIED_2027_SECTIONS[depKey];
      blockedCourses.push({
        nrc: tmpl.nrc,
        code: tmpl.code,
        name: tmpl.name,
        credits: tmpl.credits,
        prerequisiteCourseId: 'c-hidrologia',
        prerequisiteName: 'Fundamentos de Hidrología',
        reason: 'Bloqueada si Fundamentos de Hidrología queda < 3.000.',
      });
    }
  }

  // 2. Disciplinares de 7.° semestre desbloqueadas
  if (viasPassing) {
    tryPlaceSection(
      VERIFIED_2027_SECTIONS['transporte-22223'],
      'Habilitada por Vías II aprobada (Lun/Mié 12:00-13:40).'
    );
  } else {
    blockedCourses.push({
      nrc: 'NRC 22223',
      code: '8825-0031',
      name: 'Transporte',
      credits: 2,
      prerequisiteCourseId: 'c-vias',
      prerequisiteName: 'Vías II',
      reason: 'Bloqueada si Vías II queda < 3.000.',
    });
  }

  let concretoPlaced = false;
  if (estructurasPassing) {
    concretoPlaced = tryPlaceSection(
      VERIFIED_2027_SECTIONS['concreto-13826'],
      'Habilitada por Análisis de Estructuras (Mar/Jue 12:00-13:40).'
    );
  }

  if (hidroPassing) {
    tryPlaceSection(
      VERIFIED_2027_SECTIONS['acueducto-22229'],
      'Habilitada por Fundamentos de Hidrología (Lun/Mié 18:00-19:40).'
    );
    tryPlaceSection(
      VERIFIED_2027_SECTIONS['alcantarillado-22231'],
      'Habilitada por Fundamentos de Hidrología (Mar/Jue 18:00-19:40).'
    );
  }

  // 3. Optativas / CBFH inteligentes en huecos liberados
  const shouldAttemptEmprendimiento =
    overrides.includeEmprendimiento === 'always' ||
    (overrides.includeEmprendimiento === 'auto' && !concretoPlaced);

  if (shouldAttemptEmprendimiento) {
    tryPlaceSection(
      VERIFIED_2027_SECTIONS['emprendimiento-21967'],
      concretoPlaced
        ? 'Bolsa CAPP Emprendimiento (Mar/Jue 12:00).'
        : 'Plan B automático: llena Mar/Jue 12:00 al estar bloqueada Concreto I.'
    );
  }

  if (overrides.includeEtica) {
    tryPlaceSection(
      VERIFIED_2027_SECTIONS['etica-22674'],
      'Aprovecha Mié 14:00-15:40 liberado al homologar Lab Suelos (1.0 cr CAPP obligatorio).'
    );
  }

  if (overrides.includeElementosCiudad) {
    tryPlaceSection(
      VERIFIED_2027_SECTIONS['ciudad-14026'],
      'Electiva I Arquitectura (Vie 14:00-17:20; corre Gym del viernes a 17:30-19:00).'
    );
  }

  if (overrides.includeContratacion) {
    if (presPassing) {
      tryPlaceSection(
        VERIFIED_2027_SECTIONS['contratacion-22233'],
        'Habilitada por Presupuesto (Vie 06:00-09:40; rompe regla de mañana libre).'
      );
    } else {
      blockedCourses.push({
        nrc: 'NRC 22233',
        code: '8825-0036',
        name: 'Contratación y Legislación',
        credits: 2,
        prerequisiteCourseId: 'c-presupuesto',
        prerequisiteName: 'Programación y Presupuesto',
        reason: 'Bloqueada por Presupuesto < 3.000.',
      });
    }
  }

  // 4. Inglés Nivel 10 (202750) — elige NRC 50242 (Mar/Jue/Vie 12:00) solo si está libre; si no, NRC 50244 (Sáb 07:00-12:50)
  let englishNrc: string | null = null;
  if (overrides.includeEnglish) {
    const afternoonEnglishFree = !findConflictWith(VERIFIED_2027_SECTIONS['ingles-50242'].meetings);
    if (afternoonEnglishFree) {
      if (
        tryPlaceSection(
          VERIFIED_2027_SECTIONS['ingles-50242'],
          'Inglés Nivel 10 (202750) en tardes al quedar libre Mar/Jue 12:00.'
        )
      ) {
        englishNrc = 'NRC 50242';
      }
    } else if (
      tryPlaceSection(
        VERIFIED_2027_SECTIONS['ingles-50244'],
        'Inglés Nivel 10 (202750) los sábados para 0 cruces con Concreto I / Emprendimiento.'
      )
    ) {
      englishNrc = 'NRC 50244';
    }
  }

  // 5. Bloques de Gimnasio Campus UPB adaptados dinámicamente a huecos sin colisión
  const gymDays: DayName[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  for (const day of gymDays) {
    const primaryWindow = { day, startTime: '16:00', endTime: '17:40' };
    const afternoonFallback = { day, startTime: '17:30', endTime: '19:00' };
    const morningFallback = { day, startTime: '10:00', endTime: '11:40' };

    let chosenGym = primaryWindow;
    let note = 'Ventana principal Gym Campus UPB';
    if (findConflictWith([primaryWindow])) {
      if (!findConflictWith([afternoonFallback])) {
        chosenGym = afternoonFallback;
        note = `Desplazado de 16:00-17:40 por clase de tarde (${day})`;
      } else if (!findConflictWith([morningFallback])) {
        chosenGym = morningFallback;
        note = `Reubicado a 10:00-11:40 por laboratorio de tarde (${day})`;
      } else {
        continue;
      }
    }

    placedBlocks.push({
      id: `dyn-gym-${day.toLowerCase()}`,
      name:
        chosenGym.startTime === '16:00'
          ? '🏋️ Gym Campus UPB'
          : `🏋️ Gym Campus UPB (${chosenGym.startTime})`,
      code: 'GIMNASIO',
      professor: 'Bienestar Universitario UPB',
      classroom: 'Gimnasio Campus',
      building: 'Bienestar Deportivo',
      day: chosenGym.day,
      startTime: chosenGym.startTime,
      endTime: chosenGym.endTime,
      isGymOrEnglish: true,
      componentType: 'gym',
      note,
      ...PALETTES.emerald,
    });
  }

  const academicOnlyBlocks = placedBlocks.filter((b) => b.componentType !== 'gym');
  const totalCredits = enrolledCourses.reduce((acc, c) => acc + c.credits, 0);
  const fin = initialAcademicData.financialConfig2027;
  const netCreditsCost = totalCredits * fin.netCreditCost;
  const totalNetTuition = netCreditsCost + fin.studentInsurance;
  const surplusForGym = Math.max(0, fin.availableBudget - totalNetTuition);
  const gymMonthsCovered = Math.round((surplusForGym / fin.gymMonthlyFee) * 10) / 10;

  const morningProtected = academicOnlyBlocks.every(
    (b) => b.day === 'Sábado' || toMinutes(b.startTime) >= toMinutes('12:00')
  );
  const fridayAfternoonFree = !academicOnlyBlocks.some(
    (b) => b.day === 'Viernes' && toMinutes(b.endTime) > toMinutes('12:00')
  );

  return {
    blocks: placedBlocks,
    enrolledCourses,
    blockedCourses,
    skippedForConflict,
    totalCredits,
    netCreditsCost,
    studentInsurance: fin.studentInsurance,
    totalNetTuition,
    surplusForGym,
    gymMonthsCovered,
    overlapMinutes: computeScheduleOverlapMinutes(placedBlocks),
    morningProtected,
    fridayAfternoonFree,
    suelosMode,
    freedLabSlots,
    englishNrc,
  };
}

export function computeAcademicProjection(
  inputOverrides?: Partial<AcademicInteractiveOverrides> | null
): AcademicProjectionResult {
  const overrides = mergeAcademicOverrides(inputOverrides);
  const suelosCourse =
    initialAcademicData.courses.find((c) => c.id === 'c-suelos') ?? initialAcademicData.courses[2];
  const suelosLabSummary = computeCourseLabSummary(suelosCourse);

  const projectedCourses: ProjectedCourseStatus[] = initialAcademicData.courses.map((course) => {
    const id = course.id as TrackedCourseId;
    const overrideMode = overrides.courseStatuses[id] ?? 'sigaa_auto';
    const resolved = resolveEffectiveCourseStatus(course, overrideMode);
    const deps = NEXT_COURSES_BY_PREREQ[id] ?? [];
    return {
      id,
      name: course.name,
      subjectCode: course.subjectCode,
      credits: course.credits,
      accumulatedPoints: course.accumulatedPoints,
      evaluatedPercent: course.evaluatedPercent,
      overrideMode,
      sigaaStatus: course.status,
      effectiveOutcome: resolved.effectiveOutcome,
      isPassingForPrereqs: resolved.isPassingForPrereqs,
      blocksNextCourses: resolved.isPassingForPrereqs ? [] : deps,
      unlocksNextCourses: resolved.isPassingForPrereqs ? deps : [],
      labSummary: computeCourseLabSummary(course),
    };
  });

  const projectedCourseMap = projectedCourses.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<TrackedCourseId, ProjectedCourseStatus>);

  const homologationApplied =
    !projectedCourseMap['c-suelos'].isPassingForPrereqs &&
    suelosLabSummary.homologationEligible &&
    overrides.homologateSuelosLab;

  const schedule2026Official = buildOfficial2026Schedule(projectedCourseMap);
  const schedule2027Real = buildDynamicSchedule2027(
    overrides,
    projectedCourseMap,
    suelosLabSummary
  );

  // Contingencia extrema: qué pasa si se pierden además Estructuras e Hidrología
  const contingencyOverrides: AcademicInteractiveOverrides = {
    ...overrides,
    courseStatuses: {
      ...overrides.courseStatuses,
      'c-suelos': 'failed',
      'c-estructuras': 'failed',
      'c-hidrologia': 'failed',
    },
  };
  const contingencyCoursesMap: Record<TrackedCourseId, ProjectedCourseStatus> = {
    ...projectedCourseMap,
    'c-suelos': {
      ...projectedCourseMap['c-suelos'],
      effectiveOutcome: 'failed',
      isPassingForPrereqs: false,
      blocksNextCourses: NEXT_COURSES_BY_PREREQ['c-suelos'],
      unlocksNextCourses: [],
    },
    'c-estructuras': {
      ...projectedCourseMap['c-estructuras'],
      effectiveOutcome: 'failed',
      isPassingForPrereqs: false,
      blocksNextCourses: NEXT_COURSES_BY_PREREQ['c-estructuras'],
      unlocksNextCourses: [],
    },
    'c-hidrologia': {
      ...projectedCourseMap['c-hidrologia'],
      effectiveOutcome: 'failed',
      isPassingForPrereqs: false,
      blocksNextCourses: NEXT_COURSES_BY_PREREQ['c-hidrologia'],
      unlocksNextCourses: [],
    },
  };
  const schedule2027Contingency = buildDynamicSchedule2027(
    contingencyOverrides,
    contingencyCoursesMap,
    suelosLabSummary
  );

  const enrolledNrcSet = new Set(schedule2027Real.enrolledCourses.map((e) => e.nrc));
  const blockedMap = new Map(schedule2027Real.blockedCourses.map((b) => [b.nrc, b]));
  const conflictMap = new Map(schedule2027Real.skippedForConflict.map((s) => [s.nrc, s]));

  const offerCatalogWithStatus: Offer2027ReactiveItem[] = initialAcademicData.offer2027.map(
    (offer) => {
      if (offer.isZeroCreditTrap) {
        return {
          ...offer,
          reactiveStatus: 'trap',
          reactiveReason: 'TRAMPA BANNER (creditHourLow = 0): NO inscribir.',
        };
      }
      if (enrolledNrcSet.has(offer.nrc)) {
        const entry = schedule2027Real.enrolledCourses.find((e) => e.nrc === offer.nrc);
        return {
          ...offer,
          reactiveStatus: 'enrolled',
          reactiveReason:
            entry?.theoryOnlyMode
              ? 'Inscrita en Plan 2027-1 (SOLO TEORÍA — Lab homologado)'
              : entry?.reason ?? 'Programada en Plan 2027-1',
        };
      }
      const blocked = blockedMap.get(offer.nrc);
      if (blocked) {
        return {
          ...offer,
          reactiveStatus: 'blocked_prereq',
          reactiveReason: blocked.reason,
        };
      }
      if (offer.prerequisiteCourseId) {
        const prereq = projectedCourseMap[offer.prerequisiteCourseId as TrackedCourseId];
        if (prereq && !prereq.isPassingForPrereqs) {
          return {
            ...offer,
            reactiveStatus: 'blocked_prereq',
            reactiveReason: `Bloqueada por ${prereq.name} (< 3.000).`,
          };
        }
      }
      const conflict = conflictMap.get(offer.nrc);
      if (conflict) {
        return {
          ...offer,
          reactiveStatus: 'conflict',
          reactiveReason: conflict.reason,
        };
      }
      return {
        ...offer,
        reactiveStatus: 'available',
        reactiveReason: offer.bagFulfilled,
      };
    }
  );

  return {
    overrides,
    suelosCourse,
    suelosLabSummary,
    homologationApplied,
    projectedCourses,
    projectedCourseMap,
    schedule2026Official,
    schedule2027Real,
    schedule2027Contingency,
    offerCatalogWithStatus,
  };
}

export function generateScheduleIcs(blocks: ScheduleBlock[], scenarioLabel: string): string {
  const dayMap: Record<DayName, string> = {
    Lunes: 'MO',
    Martes: 'TU',
    Miércoles: 'WE',
    Jueves: 'TH',
    Viernes: 'FR',
    Sábado: 'SA',
  };

  const dtBase = scenarioLabel.startsWith('2026') ? '20260803' : '20270118';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UPB Monteria//Horario Santiago Teheran//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Horario UPB (${scenarioLabel}) - Santiago Teheran`,
    'X-WR-TIMEZONE:America/Bogota',
  ];

  blocks.forEach((block) => {
    const byDay = dayMap[block.day] || 'MO';
    const startClean = block.startTime.replace(':', '') + '00';
    const endClean = block.endTime.replace(':', '') + '00';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${block.id}-${scenarioLabel}@upb.edu.co`,
      `SUMMARY:${block.name} (${block.code})`,
      `DESCRIPTION:Profesor: ${block.professor}\\nAula: ${block.classroom} - ${block.building}`,
      `LOCATION:${block.classroom}, ${block.building}, UPB Montería`,
      `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
      `DTSTART:${dtBase}T${startClean}`,
      `DTEND:${dtBase}T${endClean}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
