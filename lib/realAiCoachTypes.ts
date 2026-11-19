/**
 * Tipos compartidos (cliente + servidor) para el Entrenador Personal Multi-IA Vivo
 * y la escritura real verificada de rutinas en Hevy Web.
 */

export interface LiveHevyRoutineSet {
  index: number;
  type: string; // 'warmup' | 'normal' | 'failure' | 'dropset'
  weightKg: number;
  weightLbs: number;
  reps: number | null;
  repRangeStart: number | null;
  repRangeEnd: number | null;
  durationSeconds: number | null;
  rpe: number | null;
}

export interface LiveHevyRoutineExercise {
  index: number;
  id: string;
  exerciseTemplateId: string;
  title: string;
  esTitle: string;
  muscleGroup: string;
  exerciseType: string;
  equipmentCategory: string;
  unit: 'kg' | 'lbs';
  restSeconds: number;
  inputModifier: string; // 'rep-range' | 'reps'
  notes: string;
  pinnedNotes: unknown[];
  supersetId: number | null;
  sets: LiveHevyRoutineSet[];
}

export interface LiveHevyRoutine {
  uuid: string;
  shortId: string;
  title: string;
  folderId: number | null;
  notes: string;
  routineUrl: string;
  editUrl: string;
  updatedAt: string;
  exerciseCount: number;
  exercises: LiveHevyRoutineExercise[];
}

export interface SetDeltaSuggestion {
  setNumber: number;
  isWarmup?: boolean;
  currentWeightKg: number;
  currentWeightLbs?: number;
  suggestedWeightKg: number;
  suggestedWeightLbs?: number;
  weightDeltaKg: number;
  currentReps: number;
  suggestedReps: number;
  suggestedRepRange?: string; // ej. "6-8"
  repsDelta: number; // ej. +1, -2, 0
  currentRpe?: number;
  targetRir: number;
  shortBadge: string; // ej. "+1 rep (7)", "+2.5 kg", "-4.5 kg", "Mantener • RIR 2"
}

export type ExerciseCoachAction =
  | 'SUBIR_PESO'
  | 'SUBIR_REPS'
  | 'BAJAR_PESO'
  | 'MANTENER_TECNICA'
  | 'REUBICAR'
  | 'ELIMINAR';

export interface ExerciseAiRecommendation {
  exerciseName: string;
  esTitle: string;
  unit: 'kg' | 'lbs';
  currentOrderIndex: number; // 0-based
  suggestedOrderIndex: number; // 0-based
  orderChangeReason?: string;
  keepExercise: boolean;
  removeReason?: string;
  currentRestSeconds: number;
  suggestedRestSeconds: number;
  restDeltaSeconds: number;
  targetWorkingSets?: number; // ej. 2 o 3 series efectivas sugeridas por Constructor 360°
  action: ExerciseCoachAction;
  coachReasoning: string;
  pinnedNoteForHevy: string;
  setSuggestions: SetDeltaSuggestion[];
}

export interface Holistic360Pill {
  id: string;
  icon: 'measurements' | 'femmto' | 'bike' | 'watch' | 'nutrition' | 'notebooklm' | 'hevy' | 'calendar';
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'rose' | 'cyan' | 'indigo';
  detail?: string;
}

export interface CoherenceCrossCheck {
  measurementsImpact: string;
  femmtoAndNutritionImpact: string;
  walksAndBikeImpact: string;
  sleepAndWatchImpact: string;
  notebookLmCitations: string[];
}

export interface RoundTripVerificationDiff {
  exerciseName: string;
  field: 'order' | 'removed' | 'restSeconds' | 'weight' | 'reps' | 'note';
  expected: string;
  actualOnHevyServer: string;
  matched: boolean;
}

export interface RoundTripFieldVerification {
  verifiedPct: number;
  checksPassed: number;
  checksTotal: number;
  retryPerformed: boolean;
  mismatches: RoundTripVerificationDiff[];
  sampleVerifiedDiffs: RoundTripVerificationDiff[];
}

export interface StructuralIssue {
  severity: 'critical' | 'warning' | 'optimization';
  category: 'orden' | 'descanso' | 'volumen' | 'rpe_fatiga' | 'desbalance' | 'nota_atleta';
  title: string;
  detail: string;
}

export interface AiCouncilModelContribution {
  model: string;
  provider: string;
  status: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface LiveAiRoutineAudit {
  routineId: string; // UUID
  routineShortId: string;
  routineName: string;
  routineUrl: string;
  editUrl: string;
  mode?: 'audit' | 'build_optimal';
  analyzedAt: string;
  totalLatencyMs: number;
  modelsUsed: string[];
  modelContributions: AiCouncilModelContribution[];
  structureScore: number; // 0-100
  projectedOptimizedScore?: number; // 0-100 tras aplicar el plan óptimo
  executiveVerdict: string;
  biometricContextSummary: string;
  sourcesConnectedCount?: number;
  holisticPills?: Holistic360Pill[];
  coherenceCrossCheck?: CoherenceCrossCheck;
  structuralIssues: StructuralIssue[];
  exerciseRecommendations: ExerciseAiRecommendation[];
}

export interface HevyApplyOptions {
  weightsAndReps: boolean;
  restTimers: boolean;
  notes: boolean;
  reorder: boolean;
  removeMarked: boolean;
}

export function formatSecondsToMmSs(sec?: number | null): string {
  const n = Number(sec ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '0:00';
  const m = Math.floor(n / 60);
  const s = Math.round(n % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
