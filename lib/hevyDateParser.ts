/**
 * Utilidades puras de fecha, clasificación anatómica y catálogo oficial de rutinas de Hevy.
 * Compatible con cliente ('use client') y servidor (Node/API) sin dependencias de fs.
 */

export interface KnownHevyRoutine {
  name: string;
  folder: 'upper body' | 'lower body';
  routineId: string;
  routineUrl: string;
  editUrl?: string;
}

export const KNOWN_HEVY_ROUTINES: KnownHevyRoutine[] = [
  {
    name: 'Horizontal Torso (Chest & Back)',
    folder: 'upper body',
    routineId: 'DsaJ9O9Ed4U',
    routineUrl: 'https://hevy.com/routine/DsaJ9O9Ed4U',
    editUrl: 'https://hevy.com/edit-routine/b0f00c93-41ba-41b3-91dd-06b503028635',
  },
  {
    name: 'Vertical & Incline Torso (Chest & Back)',
    folder: 'upper body',
    routineId: 'xEaFx8bgFGw',
    routineUrl: 'https://hevy.com/routine/xEaFx8bgFGw',
  },
  {
    name: 'Arms & Shoulders',
    folder: 'upper body',
    routineId: 'EqZ9Xs9vRnO',
    routineUrl: 'https://hevy.com/routine/EqZ9Xs9vRnO',
  },
  {
    name: 'Full Legs',
    folder: 'lower body',
    routineId: 'LZhgyR0nGZB',
    routineUrl: 'https://hevy.com/routine/LZhgyR0nGZB',
  },
];

const MONTH_MAP: Record<string, number> = {
  ene: 0, enero: 0, jan: 0, january: 0,
  feb: 1, febrero: 1, february: 1,
  mar: 2, marzo: 2, march: 2,
  abr: 3, abril: 3, apr: 3, april: 3,
  may: 4, mayo: 4,
  jun: 5, junio: 5, june: 5,
  jul: 6, julio: 6, july: 6,
  ago: 7, agosto: 7, aug: 7, august: 7,
  sep: 8, sept: 8, septiembre: 8, setiembre: 8, september: 8,
  oct: 9, octubre: 9, october: 9,
  nov: 10, noviembre: 10, november: 10,
  dic: 11, diciembre: 11, dec: 11, december: 11,
};

/**
 * Parsea fechas de exportación Hevy en español/inglés ("10 nov 2026, 17:15", "30 sept 2026, 16:08")
 * así como formatos ISO estándar ("2026-11-10T17:15:00Z").
 */
export function parseHevyDate(input?: string | null): Date | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Formato español/inglés tipo "10 nov 2026, 17:15" o "30 sept 2026, 16:08"
  const match = trimmed.match(/^(\d{1,2})\s+([a-záéíóúñ]+)\.?\s+(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthKey = match[2].toLowerCase().replace('.', '');
    const year = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 12;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    const monthIndex = MONTH_MAP[monthKey];
    if (monthIndex !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, monthIndex, day, hour, minute, 0, 0);
    }
  }

  // 2. Fallback ISO u otros formatos estándar válidos
  const nativeParsed = new Date(trimmed);
  if (!isNaN(nativeParsed.getTime())) {
    return nativeParsed;
  }

  return null;
}

export type CanonicalMuscleGroup = 'Pecho' | 'Espalda' | 'Piernas' | 'Hombros' | 'Brazos' | 'Core';

export function classifyExerciseMuscleGroup(exerciseName: string): CanonicalMuscleGroup {
  const lower = (exerciseName || '').toLowerCase();
  if (
    lower.includes('squat') ||
    lower.includes('leg ') ||
    lower.includes('calf') ||
    lower.includes('romanian') ||
    lower.includes('deadlift') ||
    lower.includes('lunge') ||
    lower.includes('hip ') ||
    lower.includes('adduction') ||
    lower.includes('abduction') ||
    lower.includes('sentadilla') ||
    lower.includes('prensa') ||
    lower.includes('pierna') ||
    lower.includes('gemelo') ||
    lower.includes('pantorrilla')
  ) {
    return 'Piernas';
  }
  if (
    lower.includes('bench') ||
    lower.includes('chest') ||
    lower.includes('pec') ||
    lower.includes('dip') ||
    lower.includes('fondos') ||
    lower.includes('pecho') ||
    lower.includes('aperturas') ||
    lower.includes('crossover') ||
    lower.includes('cables cruzados')
  ) {
    return 'Pecho';
  }
  if (
    lower.includes('row') ||
    lower.includes('pulldown') ||
    lower.includes('pull-up') ||
    lower.includes('pull up') ||
    lower.includes('chin') ||
    lower.includes('lat') ||
    lower.includes('pull-around') ||
    lower.includes('remo') ||
    lower.includes('jalón') ||
    lower.includes('jalon') ||
    lower.includes('dominada')
  ) {
    return 'Espalda';
  }
  if (
    lower.includes('overhead press') ||
    lower.includes('shoulder press') ||
    lower.includes('lateral raise') ||
    lower.includes('rear delt') ||
    lower.includes('face pull') ||
    lower.includes('press de hombros') ||
    lower.includes('elevación lateral') ||
    lower.includes('vuelos posteriores') ||
    lower.includes('deltoid') ||
    lower.includes('hombro')
  ) {
    return 'Hombros';
  }
  if (
    lower.includes('curl') ||
    lower.includes('tricep') ||
    lower.includes('tríceps') ||
    lower.includes('bicep') ||
    lower.includes('bíceps') ||
    lower.includes('wrist') ||
    lower.includes('muñeca') ||
    lower.includes('rodillo') ||
    lower.includes('antebrazo') ||
    lower.includes('skullcrusher') ||
    lower.includes('pushdown') ||
    lower.includes('press francés')
  ) {
    return 'Brazos';
  }
  if (
    lower.includes('crunch') ||
    lower.includes('plank') ||
    lower.includes('ab ') ||
    lower.includes('abdominal') ||
    lower.includes('oblique')
  ) {
    return 'Core';
  }
  return 'Espalda';
}

const ES_EXERCISE_MAP: Record<string, string> = {
  'Warm Up': 'Calentamiento',
  Stretching: 'Estiramiento',
  'Bench Press (Barbell)': 'Press de Banca (Barra)',
  'Incline Bench Press (Dumbbell)': 'Press de Banca Inclinado (Mancuerna)',
  'Incline Bench Press (Barbell)': 'Press de Banca Inclinado (Barra)',
  'Incline Bench Press (Smith Machine)': 'Press de Banca Inclinado (Máquina Smith)',
  'Seated Calf Raise': 'Elevación de Gemelos Sentado',
  'Standing Calf Raise (Smith Machine)': 'Elevación de Gemelos de Pie (Máquina Smith)',
  'Romanian Deadlift (Barbell)': 'Peso Muerto Rumano (Barra)',
  'Leg Extension (Machine)': 'Extensión de Pierna',
  'Lying Leg Curl (Machine)': 'Curl de Piernas Acostado (Máquina)',
  'Hack Squat (Machine)': 'Sentadilla Hack (Máquina)',
  'Leg Press (Machine)': 'Press de Piernas',
  'Squat (Smith Machine)': 'Sentadilla (Máquina Smith)',
  'Hip Adduction (Machine)': 'Aducción de Cadera (Máquina)',
  'Bicep Curl (Cable)': 'Curl de Bíceps (Cable)',
  'Preacher Curl (Machine)': 'Curl predicador (máquina)',
  'Hammer Curl (Cable)': 'Curl Martillo (Cable)',
  'Hammer Curl (Dumbbell)': 'Curl Martillo (Mancuerna)',
  'Triceps Extension (Machine)': 'Extensión de Tríceps (Máquina)',
  'Triceps Extension (Cable)': 'Extensión de Tríceps (Cable)',
  'Triceps Pushdown': 'Jalón de tríceps con cuerda',
  'Overhead Press (Smith Machine)': 'Press de Hombros (Máquina Smith)',
  'Lateral Raise (Dumbbell)': 'Elevación Lateral (Mancuerna)',
  'Seated Cable Row - V Grip (Cable)': 'Remo Sentado con Agarre en V (Cable)',
  'Seated Chest Flys (Cable)': 'Aperturas de Pecho Sentado (Cable)',
  'Lat Pulldown (Cable)': 'Jalón al Pecho (Cable)',
  'Straight Arm Lat Pulldown (Cable)': 'Jalón de dorsales con brazos rectos (polea)',
  'Wrist Roller': 'Rodillo de Antebrazos',
  'Behind the Back Wrist Curl (Barbell)': 'Curl de Muñeca por Detrás de la Espalda (Barra)',
  'Cable Crunch': 'Abdominal Corto con Cable',
};

export function translateExerciseTitle(name: string): string {
  return ES_EXERCISE_MAP[name] || name;
}

export function findKnownRoutine(nameOrId?: string | null): KnownHevyRoutine | undefined {
  if (!nameOrId) return undefined;
  const q = nameOrId.trim().toLowerCase();
  return KNOWN_HEVY_ROUTINES.find(
    (r) =>
      r.routineId.toLowerCase() === q ||
      r.name.toLowerCase() === q ||
      r.name.toLowerCase().includes(q) ||
      q.includes(r.name.split('(')[0].trim().toLowerCase())
  );
}
