export interface ExerciseSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup?: boolean;
}

export interface HevyExercise {
  name: string;
  muscleGroup: 'Pecho' | 'Espalda' | 'Piernas' | 'Hombros' | 'Brazos' | 'Core';
  sets: ExerciseSet[];
  totalVolume: number;
}

export interface HevyWorkoutSession {
  id: string;
  name: string;
  date: string;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  rpeAverage: number;
  exercises: HevyExercise[];
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
