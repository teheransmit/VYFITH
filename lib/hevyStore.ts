export interface ExerciseSet {
  setNumber: number;
  weightKg: number;
  weightLbs?: number;
  reps: number;
  rpe?: number;
  isWarmup?: boolean;
  indicator?: 'warmup' | 'normal' | 'drop' | 'failure';
  durationSeconds?: number;
}

export interface HevyExercise {
  name: string;
  esTitle?: string;
  notes?: string;
  muscleGroup: 'Pecho' | 'Espalda' | 'Piernas' | 'Hombros' | 'Brazos' | 'Core';
  sets: ExerciseSet[];
  totalVolume: number;
}

export interface HrZoneMinutes {
  z1: number; // <60% FCmáx (Recuperación)
  z2: number; // 60-70% FCmáx (Aeróbico ligero)
  z3: number; // 70-80% FCmáx (Tempo / Metabólico)
  z4: number; // 80-90% FCmáx (Umbral anaeróbico)
  z5: number; // >=90% FCmáx (Máximo)
}

export interface WatchExerciseSession {
  id: string;
  dateIso: string; // YYYY-MM-DD (America/Bogota)
  startTimeText: string; // HH:mm
  endTimeText: string; // HH:mm
  startTimeIso?: string; // Exact ISO-8601 timestamp with timezone offset
  endTimeIso?: string; // Exact ISO-8601 timestamp with timezone offset
  durationMinutes: number;
  durationSeconds?: number;
  title: string;
  exerciseTypeName: string;
  exerciseTypeCode?: number;
  caloriesBurned: number;
  avgHeartRateBpm?: number | null;
  maxHeartRateBpm?: number | null;
  minHeartRateBpm?: number | null;
  hrSampleCount?: number;
  hrZoneMinutes?: HrZoneMinutes | Record<string, number> | null;
  distanceMeters?: number | null;
  sourceLabel: string;
  deviceModel: string;
  isWatchSource: boolean;
  syncedAt?: string;
}

export interface FusedWatchBiometrics {
  watchSessionId: string;
  watchTitle: string;
  watchExerciseType: string;
  watchDevice: string;
  watchSource: string;
  watchDateIso: string;
  watchStartTime: string;
  watchEndTime: string;
  watchStartIso?: string;
  watchEndIso?: string;
  watchDurationMinutes: number;
  watchDurationSeconds?: number;
  startOffsetSeconds: number; // watchStart - hevyStart (ej. -12s = reloj inició 12s antes)
  endOffsetSeconds: number; // watchEnd - hevyEnd (ej. -35s = reloj finalizó 35s antes que Hevy)
  overlapPct: number; // 0..100
  matchConfidence: 'exact' | 'high' | 'probable' | 'manual';
  avgHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
  minHeartRateBpm: number | null;
  hrSampleCount?: number;
  hrZoneMinutes?: HrZoneMinutes | null;
  caloriesBurned: number | null;
  kcalPerMinute: number | null;
  kgPerKcal: number | null;
  cardiacLoadIndex: number | null; // Índice de esfuerzo cardiovascular tipo TRIMP
  distanceMeters?: number | null;
  fusedAt: string;
}

export interface HevyWorkoutSession {
  id: string;
  name: string;
  date: string;
  startTimeLocal?: string;
  endTimeLocal?: string;
  startTimeIso?: string;
  endTimeIso?: string;
  durationMinutes: number;
  totalVolumeKg: number;
  totalVolumeLbs?: number;
  totalSets: number;
  rpeAverage: number;
  notes?: string;
  exercises: HevyExercise[];
  watchBiometrics?: FusedWatchBiometrics;
}

import realHevyWorkouts from '@/data/real_hevy_workouts.json';

const fallbackHevySessions: HevyWorkoutSession[] = [
  {
    id: 'hevy-w1',
    name: 'Push Hypertrophy (Pecho, Hombro, Tríceps)',
    date: '2026-09-24T18:00:00Z',
    durationMinutes: 72,
    totalVolumeKg: 14280,
    totalSets: 18,
    rpeAverage: 8.5,
    exercises: [
      {
        name: 'Press de Banca Plano con Barra',
        muscleGroup: 'Pecho',
        totalVolume: 4200,
        sets: [
          { setNumber: 1, weightKg: 80, reps: 10, rpe: 8 },
          { setNumber: 2, weightKg: 85, reps: 8, rpe: 8.5 },
          { setNumber: 3, weightKg: 90, reps: 6, rpe: 9 },
          { setNumber: 4, weightKg: 90, reps: 6, rpe: 9.5 },
        ],
      },
      {
        name: 'Press Inclinado con Mancuernas',
        muscleGroup: 'Pecho',
        totalVolume: 3360,
        sets: [
          { setNumber: 1, weightKg: 30, reps: 10, rpe: 8 },
          { setNumber: 2, weightKg: 32, reps: 8, rpe: 8.5 },
          { setNumber: 3, weightKg: 32, reps: 8, rpe: 9 },
        ],
      },
      {
        name: 'Press Militar con Barra',
        muscleGroup: 'Hombros',
        totalVolume: 2700,
        sets: [
          { setNumber: 1, weightKg: 50, reps: 10, rpe: 8 },
          { setNumber: 2, weightKg: 55, reps: 8, rpe: 8.5 },
          { setNumber: 3, weightKg: 55, reps: 7, rpe: 9 },
        ],
      },
      {
        name: 'Fondos en Paralelas Lastrados',
        muscleGroup: 'Pecho',
        totalVolume: 2400,
        sets: [
          { setNumber: 1, weightKg: 15, reps: 10, rpe: 8 },
          { setNumber: 2, weightKg: 20, reps: 8, rpe: 8.5 },
          { setNumber: 3, weightKg: 20, reps: 8, rpe: 9 },
        ],
      },
      {
        name: 'Extensiones de Tríceps en Polea',
        muscleGroup: 'Brazos',
        totalVolume: 1620,
        sets: [
          { setNumber: 1, weightKg: 35, reps: 12, rpe: 8 },
          { setNumber: 2, weightKg: 40, reps: 10, rpe: 9 },
        ],
      },
    ],
  },
  {
    id: 'hevy-w2',
    name: 'Pull Power & Lat Focus (Espalda & Bíceps)',
    date: '2026-09-22T17:30:00Z',
    durationMinutes: 68,
    totalVolumeKg: 15400,
    totalSets: 16,
    rpeAverage: 8.2,
    exercises: [
      {
        name: 'Dominadas con Lastre',
        muscleGroup: 'Espalda',
        totalVolume: 3600,
        sets: [
          { setNumber: 1, weightKg: 15, reps: 8, rpe: 8 },
          { setNumber: 2, weightKg: 20, reps: 6, rpe: 9 },
          { setNumber: 3, weightKg: 20, reps: 6, rpe: 9 },
        ],
      },
      {
        name: 'Remo con Barra Pendlay',
        muscleGroup: 'Espalda',
        totalVolume: 4500,
        sets: [
          { setNumber: 1, weightKg: 75, reps: 10, rpe: 8 },
          { setNumber: 2, weightKg: 80, reps: 8, rpe: 8.5 },
          { setNumber: 3, weightKg: 85, reps: 8, rpe: 9 },
        ],
      },
      {
        name: 'Jalón al Pecho Agarre Neutro',
        muscleGroup: 'Espalda',
        totalVolume: 3800,
        sets: [
          { setNumber: 1, weightKg: 70, reps: 10, rpe: 8 },
          { setNumber: 2, weightKg: 75, reps: 9, rpe: 8.5 },
          { setNumber: 3, weightKg: 75, reps: 8, rpe: 9 },
        ],
      },
      {
        name: 'Curl con Barra Z',
        muscleGroup: 'Brazos',
        totalVolume: 1950,
        sets: [
          { setNumber: 1, weightKg: 35, reps: 10, rpe: 8.5 },
          { setNumber: 2, weightKg: 35, reps: 9, rpe: 9 },
        ],
      },
    ],
  },
];

export const initialHevySessions: HevyWorkoutSession[] = (realHevyWorkouts && (realHevyWorkouts as any).length > 0)
  ? (realHevyWorkouts as unknown as HevyWorkoutSession[])
  : fallbackHevySessions;
