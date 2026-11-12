/**
 * VYFITH - Base de Conocimiento Científico de Hipertrofia & Periodización
 * Fundamentado en la metodología de Jeff Nippard, Mike Israetel (Renaissance Periodization),
 * Brad Schoenfeld y Eric Helms (Google NotebookLM "MegaProyecto").
 */

export interface ExerciseScienceRule {
  exerciseNameRegex: RegExp;
  category: 'compuesto_axial' | 'compuesto_maquina' | 'aislamiento_mancuerna' | 'aislamiento_polea';
  minRepsTarget: number;
  maxRepsTarget: number;
  weightIncrementKg: number;
  recommendedRir: number;
  cues: string[];
  scientificCitation: string;
}

export interface MuscleVolumeLandmarks {
  muscleGroup: 'Pecho' | 'Espalda' | 'Piernas' | 'Hombros' | 'Brazos' | 'Core';
  mevSetsPerWeek: number; // Mínimo efectivo
  mavSetsPerWeek: number; // Máximo adaptativo (óptimo)
  mrvSetsPerWeek: number; // Máximo recuperable
  recoveryDaysNeeded: number;
}

export const MUSCLE_VOLUME_LANDMARKS: Record<string, MuscleVolumeLandmarks> = {
  Pecho: {
    muscleGroup: 'Pecho',
    mevSetsPerWeek: 10,
    mavSetsPerWeek: 14,
    mrvSetsPerWeek: 20,
    recoveryDaysNeeded: 2,
  },
  Espalda: {
    muscleGroup: 'Espalda',
    mevSetsPerWeek: 12,
    mavSetsPerWeek: 16,
    mrvSetsPerWeek: 22,
    recoveryDaysNeeded: 2,
  },
  Piernas: {
    muscleGroup: 'Piernas',
    mevSetsPerWeek: 10,
    mavSetsPerWeek: 15,
    mrvSetsPerWeek: 20,
    recoveryDaysNeeded: 3,
  },
  Hombros: {
    muscleGroup: 'Hombros',
    mevSetsPerWeek: 10,
    mavSetsPerWeek: 16,
    mrvSetsPerWeek: 24,
    recoveryDaysNeeded: 1.5,
  },
  Brazos: {
    muscleGroup: 'Brazos',
    mevSetsPerWeek: 8,
    mavSetsPerWeek: 14,
    mrvSetsPerWeek: 18,
    recoveryDaysNeeded: 1.5,
  },
  Core: {
    muscleGroup: 'Core',
    mevSetsPerWeek: 6,
    mavSetsPerWeek: 10,
    mrvSetsPerWeek: 16,
    recoveryDaysNeeded: 1,
  },
};

export const EXERCISE_SCIENCE_RULES: ExerciseScienceRule[] = [
  {
    exerciseNameRegex: /press.*banca|bench.*press|pecho.*plano|inclinado.*barra/i,
    category: 'compuesto_axial',
    minRepsTarget: 6,
    maxRepsTarget: 8,
    weightIncrementKg: 2.5,
    recommendedRir: 2,
    cues: [
      'Retracción escapular activa y arco lumbar natural',
      'Pausa de 1 segundo en el punto de máximo estiramiento sobre el pecho',
      'Codos a 45°-60° del torso para maximizar tensión en fibras esternocostales',
    ],
    scientificCitation: 'Jeff Nippard: The Smartest Way To Bench Press (Science Explained) • NotebookLM MegaProyecto',
  },
  {
    exerciseNameRegex: /press.*mancuerna|dumbbell.*press/i,
    category: 'compuesto_maquina',
    minRepsTarget: 8,
    maxRepsTarget: 10,
    weightIncrementKg: 2.0,
    recommendedRir: 1.5,
    cues: [
      'Mayor rango de recorrido en la posición estirada que con barra',
      'Convergencia natural sin chocar las mancuernas al bloquear',
    ],
    scientificCitation: 'Jeff Nippard: Best Chest Workout For Muscle Growth (Science-Based) • NotebookLM MegaProyecto',
  },
  {
    exerciseNameRegex: /remo.*barra|barbell.*row|bent.*over.*row/i,
    category: 'compuesto_axial',
    minRepsTarget: 6,
    maxRepsTarget: 8,
    weightIncrementKg: 2.5,
    recommendedRir: 2,
    cues: [
      'Tronco a 45°-70°, tirar con los codos hacia la cadera',
      'Evitar impulso excesivo de cadera en las primeras 6 repeticiones',
    ],
    scientificCitation: 'Jeff Nippard: Science-Based Back Hypertrophy & Lat Optimization • NotebookLM MegaProyecto',
  },
  {
    exerciseNameRegex: /jalon.*pecho|lat.*pulldown|pulldown/i,
    category: 'compuesto_maquina',
    minRepsTarget: 8,
    maxRepsTarget: 12,
    weightIncrementKg: 2.5,
    recommendedRir: 1.5,
    cues: [
      'Agarre neutro o prono al ancho biacromial',
      'Estiramiento dorsal completo arriba sin elevar los hombros hacia las orejas',
    ],
    scientificCitation: 'Jeff Nippard: Lat Pulldown Technique & Lat Fiber Alignment • NotebookLM MegaProyecto',
  },
  {
    exerciseNameRegex: /sentadilla|squat|hack.*squat/i,
    category: 'compuesto_axial',
    minRepsTarget: 6,
    maxRepsTarget: 8,
    weightIncrementKg: 2.5,
    recommendedRir: 2,
    cues: [
      'Flexión profunda de rodilla para cargar cuádriceps en longitud estirada',
      'Control excéntrico de 2 a 3 segundos',
    ],
    scientificCitation: 'Jeff Nippard: The Ultimate Squat Guide (Hypertrophy Biomechanics) • NotebookLM MegaProyecto',
  },
  {
    exerciseNameRegex: /peso.*muerto|deadlift|rdl|rumano/i,
    category: 'compuesto_axial',
    minRepsTarget: 6,
    maxRepsTarget: 8,
    weightIncrementKg: 5.0,
    recommendedRir: 2,
    cues: [
      'Bisagra de cadera pura: llevar los glúteos hacia atrás hasta sentir tensión máxima en isquiotibiales',
      'Barra pegada a las espinillas/muslos en todo el recorrido',
    ],
    scientificCitation: 'Jeff Nippard: Romanian Deadlift for Hamstring & Glute Growth • NotebookLM MegaProyecto',
  },
  {
    exerciseNameRegex: /elevacion.*lateral|lateral.*raise/i,
    category: 'aislamiento_polea',
    minRepsTarget: 12,
    maxRepsTarget: 15,
    weightIncrementKg: 1.0,
    recommendedRir: 1,
    cues: [
      'Plano escapular (brazos 30° adelantados respecto a la línea clavicular)',
      'Priorizar polea a la altura de la cadera para tensión en estiramiento',
      'Progresar en repeticiones de 10 a 15 antes de subir la placa',
    ],
    scientificCitation: 'Jeff Nippard: How To Build 3D Shoulders (Full Lateral Delt Anatomy) • NotebookLM MegaProyecto',
  },
  {
    exerciseNameRegex: /curl.*biceps|bicep.*curl/i,
    category: 'aislamiento_mancuerna',
    minRepsTarget: 10,
    maxRepsTarget: 12,
    weightIncrementKg: 1.0,
    recommendedRir: 1,
    cues: [
      'Codos estables ligeramente por delante del torso',
      'Supinación máxima de muñeca al llegar a la flexión de 90°',
    ],
    scientificCitation: 'Jeff Nippard: Science-Based Biceps (Long Head vs Short Head) • NotebookLM MegaProyecto',
  },
  {
    exerciseNameRegex: /triceps|pushdown|extension.*triceps/i,
    category: 'aislamiento_polea',
    minRepsTarget: 10,
    maxRepsTarget: 15,
    weightIncrementKg: 1.25,
    recommendedRir: 1,
    cues: [
      'Bloqueo de codo en la extensión final para reclutar la cabeza lateral',
      'Extensión sobre la cabeza (overhead) para enfatizar la cabeza larga',
    ],
    scientificCitation: 'Jeff Nippard: Complete Triceps Hypertrophy Guide • NotebookLM MegaProyecto',
  },
];

/**
 * Obtiene la regla científica para un ejercicio por nombre.
 */
export function getScienceRuleForExercise(exerciseName: string): ExerciseScienceRule {
  const matched = EXERCISE_SCIENCE_RULES.find((rule) => rule.exerciseNameRegex.test(exerciseName));
  if (matched) return matched;

  // Regla por defecto para ejercicios generales
  return {
    exerciseNameRegex: /.*/,
    category: 'compuesto_maquina',
    minRepsTarget: 8,
    maxRepsTarget: 10,
    weightIncrementKg: 2.5,
    recommendedRir: 2,
    cues: ['Control excéntrico de 2 segundos', 'Rango completo de movimiento'],
    scientificCitation: 'Principios de Hipertrofia y Sobrecarga Progresiva • NotebookLM MegaProyecto',
  };
}
