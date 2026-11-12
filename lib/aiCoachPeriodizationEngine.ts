/**
 * VYFITH - Motor de Periodización & Entrenador Personal Autónomo con IA
 * Integra el historial de 198 entrenamientos de Hevy, el modelo de Doble Progresión
 * y la base científica de Jeff Nippard (Google NotebookLM "MegaProyecto").
 */

import { HevyWorkoutSession, HevyExercise, ExerciseSet } from './hevyStore';
import { getScienceRuleForExercise, MUSCLE_VOLUME_LANDMARKS } from './scientificKnowledgeBase';
import { parseHevyDate } from './hevyDateParser';
import realHevyWorkouts from '@/data/real_hevy_workouts.json';
import realHealthState from '@/data/real_health_state.json';

export interface ExercisePrescription {
  exerciseName: string;
  muscleGroup: string;
  lastWeightKg: number;
  lastRepsSummary: string;
  lastEstimated1RmKg: number;
  prescribedWeightKg: number;
  prescribedRepsSummary: string;
  targetRir: number;
  action: 'SUBIR_PESO' | 'SUBIR_REPS' | 'CONSOLIDAR_CARGA' | 'DESCARGA_TECNICA';
  plateauStatus: 'PROGRESO_OPTIMO' | 'ALERTA_ESTANCAMIENTO' | 'SOBRECARGA_FATIGA';
  reasoning: string;
  scientificCitation: string;
  biomechanicalCues: string[];
}

export interface WorkoutRoutinePrescription {
  routineName: string;
  dateAnalyzed: string;
  overallStatus: 'LISTO_PARA_SOBRECARGA' | 'ESTANCAMIENTO_DETECTADO' | 'FATIGA_BIOMETRICA';
  readinessScore: number;
  hydrationCompliancePct: number;
  summaryMessage: string;
  prescriptions: ExercisePrescription[];
  hevySyncPayload: {
    routineTitle: string;
    exercises: Array<{
      title: string;
      targetWeightKg: number;
      targetReps: number;
      targetSets: number;
    }>;
  };
}

/**
 * Calcula el 1RM estimado usando la fórmula de Brzycki.
 */
export function calculateBrzycki1Rm(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  if (reps >= 30) return weightKg * 1.5;
  const denominator = 1.0278 - 0.0278 * reps;
  return denominator > 0 ? Math.round((weightKg / denominator) * 10) / 10 : weightKg;
}

/**
 * Genera el diagnóstico del Entrenador Personal IA para una rutina específica.
 */
export function generateAiCoachPrescription(
  targetRoutineName: string = 'Horizontal Torso (Chest & Back)',
  contextOptions?: { readiness?: number; hydrationPct?: number; workouts?: HevyWorkoutSession[] }
): WorkoutRoutinePrescription {
  const rawWorkouts = contextOptions?.workouts || (realHevyWorkouts as unknown as HevyWorkoutSession[]) || [];
  const allWorkouts = [...rawWorkouts].sort(
    (a, b) => (parseHevyDate(b.date)?.getTime() || 0) - (parseHevyDate(a.date)?.getTime() || 0)
  );

  // Filtrar entrenamientos que coincidan con la rutina
  const matchingWorkouts = allWorkouts.filter(
    (w) => w.name.toLowerCase().includes(targetRoutineName.toLowerCase()) || targetRoutineName === 'ALL'
  );

  const lastSession = matchingWorkouts[0] || allWorkouts[0];
  const previousSession = matchingWorkouts[1];

  // Datos biométricos de contexto (Readiness y Agua)
  const todayDate = new Date().toISOString().slice(0, 10);
  const readiness = contextOptions?.readiness ?? (realHealthState?.vyfithData?.readinessScore || 78);
  const hydrationPct = contextOptions?.hydrationPct ?? 75;

  const prescriptions: ExercisePrescription[] = [];
  let plateauCount = 0;

  if (lastSession && lastSession.exercises) {
    for (const ex of lastSession.exercises) {
      const workingSets = ex.sets.filter((s) => !s.isWarmup && s.indicator !== 'warmup');
      if (workingSets.length === 0) continue;

      const rule = getScienceRuleForExercise(ex.name);
      const topSet = workingSets.reduce((max, s) => (s.weightKg > max.weightKg ? s : max), workingSets[0]);
      const lastWeight = topSet.weightKg;
      const lastReps = workingSets.map((s) => s.reps);
      const avgReps = lastReps.reduce((a, b) => a + b, 0) / lastReps.length;
      const est1Rm = calculateBrzycki1Rm(lastWeight, Math.round(avgReps));

      // Buscar rendimiento del mismo ejercicio en la sesión anterior
      let prevWeight = lastWeight;
      let prevAvgReps = avgReps;
      if (previousSession) {
        const prevEx = previousSession.exercises.find(
          (e) => e.name.toLowerCase().trim() === ex.name.toLowerCase().trim()
        );
        if (prevEx) {
          const prevWorkingSets = prevEx.sets.filter((s) => !s.isWarmup && s.indicator !== 'warmup');
          if (prevWorkingSets.length > 0) {
            prevWeight = Math.max(...prevWorkingSets.map((s) => s.weightKg));
            prevAvgReps = prevWorkingSets.reduce((a, b) => a + (b.reps || 0), 0) / prevWorkingSets.length;
          }
        }
      }

      const prev1Rm = calculateBrzycki1Rm(prevWeight, Math.round(prevAvgReps));
      const delta1RmPct = prev1Rm > 0 ? ((est1Rm - prev1Rm) / prev1Rm) * 100 : 0;

      // LÓGICA DE DOBLE PROGRESIÓN (Jeff Nippard):
      // 1. ¿Todas las series superaron el rango objetivo superior?
      const completedTopReps = workingSets.every((s) => s.reps >= rule.maxRepsTarget);
      const canOverloadWeight = completedTopReps && readiness >= 65;

      let action: ExercisePrescription['action'] = 'SUBIR_REPS';
      let prescribedWeight = lastWeight;
      let prescribedReps = `${workingSets.length}x${rule.minRepsTarget}-${rule.maxRepsTarget}`;
      let plateauStatus: ExercisePrescription['plateauStatus'] = 'PROGRESO_OPTIMO';
      let reasoning = '';

      if (canOverloadWeight) {
        action = 'SUBIR_PESO';
        prescribedWeight = lastWeight + rule.weightIncrementKg;
        prescribedReps = `${workingSets.length}x${rule.minRepsTarget}`;
        reasoning = `Completaste ${rule.maxRepsTarget} reps en todas las series. Se aplica sobrecarga progresiva de +${rule.weightIncrementKg} kg para iniciar ciclo en ${rule.minRepsTarget} reps.`;
      } else if (Math.abs(delta1RmPct) < 1.0 && lastWeight === prevWeight && avgReps <= prevAvgReps) {
        plateauCount++;
        plateauStatus = 'ALERTA_ESTANCAMIENTO';
        action = 'SUBIR_REPS';
        prescribedWeight = lastWeight;
        const targetNextReps = Math.min(rule.maxRepsTarget, Math.round(avgReps) + 1);
        prescribedReps = `${workingSets.length}x${targetNextReps}`;
        reasoning = `Estancamiento detectado (1RM sin variación en las últimas sesiones). Mantén ${lastWeight} kg pero fuerza 1 repetición adicional en las 2 primeras series.`;
      } else if (readiness < 60) {
        plateauStatus = 'SOBRECARGA_FATIGA';
        action = 'CONSOLIDAR_CARGA';
        prescribedWeight = lastWeight;
        prescribedReps = `${workingSets.length}x${rule.minRepsTarget}`;
        reasoning = `Nivel de recuperación bajo (Readiness ${readiness}/100). Mantener peso sin ir al fallo para disipar fatiga neuromuscular acumulada.`;
      } else {
        action = 'SUBIR_REPS';
        prescribedWeight = lastWeight;
        prescribedReps = `${workingSets.length}x${Math.min(rule.maxRepsTarget, Math.round(avgReps) + 1)}`;
        reasoning = `Faltan repeticiones para consolidar la carga en ${lastWeight} kg. Objetivo: completar ${rule.maxRepsTarget} reps en serie 1 antes de aumentar el tonelaje.`;
      }

      prescriptions.push({
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        lastWeightKg: lastWeight,
        lastRepsSummary: lastReps.join(', '),
        lastEstimated1RmKg: est1Rm,
        prescribedWeightKg: prescribedWeight,
        prescribedRepsSummary: prescribedReps,
        targetRir: rule.recommendedRir,
        action,
        plateauStatus,
        reasoning,
        scientificCitation: rule.scientificCitation,
        biomechanicalCues: rule.cues,
      });
    }
  }

  const overallStatus =
    plateauCount >= 2
      ? 'ESTANCAMIENTO_DETECTADO'
      : readiness < 60
      ? 'FATIGA_BIOMETRICA'
      : 'LISTO_PARA_SOBRECARGA';

  const summaryMessage =
    overallStatus === 'ESTANCAMIENTO_DETECTADO'
      ? `Se detectó meseta en ${plateauCount} ejercicios. La IA ajustó las repeticiones objetivo y el RIR para romper el estancamiento sin sobreentrenar.`
      : overallStatus === 'FATIGA_BIOMETRICA'
      ? `Fatiga sistémica detectada (Readiness ${readiness}%). Se mantienen pesos conservando la técnica estricta de Jeff Nippard.`
      : `¡Excelente recuperación! Tienes luz verde para aplicar sobrecarga progresiva en tus ejercicios principales.`;

  return {
    routineName: lastSession?.name || targetRoutineName,
    dateAnalyzed: lastSession?.date || todayDate,
    overallStatus,
    readinessScore: readiness,
    hydrationCompliancePct: hydrationPct,
    summaryMessage,
    prescriptions,
    hevySyncPayload: {
      routineTitle: lastSession?.name || targetRoutineName,
      exercises: prescriptions.map((p) => ({
        title: p.exerciseName,
        targetWeightKg: p.prescribedWeightKg,
        targetReps: parseInt(p.prescribedRepsSummary.split('-')[0].split('x')[1] || '8', 10),
        targetSets: parseInt(p.prescribedRepsSummary.split('x')[0] || '3', 10),
      })),
    },
  };
}
