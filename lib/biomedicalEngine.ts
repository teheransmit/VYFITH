export interface HeartRateSample {
  bpm: number;
  timestamp: string;
}

export interface SleepMetricsInput {
  totalSleepHours: number;
  deepSleepHours: number;
  remSleepHours: number;
  lightSleepHours: number;
  awakeMinutes: number;
}

export interface Spo2MetricsInput {
  average: number;
  minimum: number;
}

export interface BiometricsInput {
  steps: number;
  cadenceSpm?: number;
  restingHeartRate: number;
  rhrSevenDayMean?: number;
  rhrThirtyDaySeries?: number[];
  heartRateSeries: HeartRateSample[];
  sleepMetrics: SleepMetricsInput;
  spo2: Spo2MetricsInput | number;
  activeCalories: number;
}

export interface WorkoutMetricsInput {
  lastWorkoutName: string;
  totalVolumeKg: number;
  setsCompleted: number;
  rpeAverage: number;
  acuteLoadSevenDaysKg?: number;
  chronicLoadTwentyEightDaysKg?: number;
}

export type AcademicMilestone = 'Normal' | 'Semana de Parciales' | 'Entrega Proyecto Final';

export interface AcademicContextInput {
  activeSemester: string;
  criticalSubjects: string[];
  studyHoursToday: number;
  academicMilestone: AcademicMilestone;
}

export interface BiomedicalInputPayload {
  biometrics: BiometricsInput;
  workoutMetrics: WorkoutMetricsInput;
  academicContext: AcademicContextInput;
}

export interface BiomedicalPrescriptionOutput {
  readinessScore: number;
  readinessCategory: string;
  biomedicalSummary: {
    acwr: number;
    acwrStatus: string;
    rhrBaselineTrend: string;
    sleepQualityIndex: string;
    cnsRecoveryPercentage: number;
  };
  gymPrescription: {
    intensityRecommendation: string;
    recommendedMuscleGroups: string[];
    groupsToRest: string[];
    tonnageTargetKg: number;
    physiologicalRationale: string;
  };
  academicCognitivePrescription: {
    cognitiveBandwidth: string;
    recommendedFocusBlocks: string;
    stressMitigation: string;
  };
  temporalInsights: {
    sevenDaysInsight: string;
    thirtyDaysInsight: string;
    sixMonthsProjection: string;
  };
}

export interface MathematicalDiagnosticMetadata {
  acwrRaw: number;
  acuteWeeklyLoadKg: number;
  chronicWeeklyAvgKg: number;
  parasympatheticInhibitionAlert: boolean;
  rhrDeltaVs7dMean: number;
  olsSlope30dPerDay: number;
  olsTotalDelta30dBpm: number;
  remDeficitAlert: boolean;
  projectedRhr6mBpm: number;
}

export const DEFAULT_SANTIAGO_BIOMEDICAL_INPUT: BiomedicalInputPayload = {
  biometrics: {
    steps: 8420,
    cadenceSpm: 112,
    restingHeartRate: 58,
    rhrSevenDayMean: 59.5,
    rhrThirtyDaySeries: [
      61, 61, 60, 61, 60, 60, 59, 60, 59, 60,
      59, 59, 58, 59, 59, 58, 59, 58, 58, 59,
      58, 58, 57, 58, 58, 58, 57, 58, 58, 58,
    ],
    heartRateSeries: [
      { bpm: 56, timestamp: '2026-10-28T04:00:00Z' },
      { bpm: 58, timestamp: '2026-10-28T06:30:00Z' },
      { bpm: 74, timestamp: '2026-10-28T09:00:00Z' },
      { bpm: 142, timestamp: '2026-10-28T11:30:00Z' },
      { bpm: 64, timestamp: '2026-10-28T14:00:00Z' },
    ],
    sleepMetrics: {
      totalSleepHours: 8.2,
      deepSleepHours: 1.8,
      remSleepHours: 2.1,
      lightSleepHours: 4.3,
      awakeMinutes: 14,
    },
    spo2: {
      average: 98.4,
      minimum: 96.0,
    },
    activeCalories: 640,
  },
  workoutMetrics: {
    lastWorkoutName: 'Pull Day (Dorsal, Bíceps, Romboides)',
    totalVolumeKg: 7120,
    setsCompleted: 18,
    rpeAverage: 8.2,
    acuteLoadSevenDaysKg: 28400,
    chronicLoadTwentyEightDaysKg: 101428,
  },
  academicContext: {
    activeSemester: '2026-2 (6° Semestre Ingeniería Civil)',
    criticalSubjects: [
      'Análisis de Estructuras',
      'Vías II',
      'Fundamentos de Hidrología',
      'Mecánica de Suelos',
    ],
    studyHoursToday: 4.5,
    academicMilestone: 'Normal',
  },
};

/**
 * Calcula la pendiente por Mínimos Cuadrados Ordinarios (OLS) de la serie temporal de RHR en 30 días.
 */
export function calculateOlsLinearRegressionSlope(series: number[]): {
  slopePerDay: number;
  totalChange30d: number;
} {
  const n = series.length;
  if (n < 2) {
    return { slopePerDay: 0, totalChange30d: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = series[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slopePerDay: 0, totalChange30d: 0 };
  }

  const slopePerDay = (n * sumXY - sumX * sumY) / denominator;
  const totalChange30d = Number((slopePerDay * (n - 1)).toFixed(1));

  return {
    slopePerDay: Number(slopePerDay.toFixed(4)),
    totalChange30d,
  };
}

/**
 * Ejecuta el motor matemático determinista de fisiología del ejercicio, neurobiología del sueño
 * y carga cognitiva para Santiago Smit Teherán Mogollón (UPB Montería - 6° Semestre Ing. Civil).
 */
export function computeDeterministicBiomedicalAnalysis(
  rawInput?: Partial<BiomedicalInputPayload>
): {
  prescription: BiomedicalPrescriptionOutput;
  diagnostics: MathematicalDiagnosticMetadata;
  normalizedInput: BiomedicalInputPayload;
} {
  const normalizedInput: BiomedicalInputPayload = {
    biometrics: {
      ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.biometrics,
      ...(rawInput?.biometrics || {}),
      sleepMetrics: {
        ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.biometrics.sleepMetrics,
        ...(rawInput?.biometrics?.sleepMetrics || {}),
      },
    },
    workoutMetrics: {
      ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.workoutMetrics,
      ...(rawInput?.workoutMetrics || {}),
    },
    academicContext: {
      ...DEFAULT_SANTIAGO_BIOMEDICAL_INPUT.academicContext,
      ...(rawInput?.academicContext || {}),
    },
  };

  const { biometrics, workoutMetrics, academicContext } = normalizedInput;
  const { sleepMetrics } = biometrics;

  const spo2Avg =
    typeof biometrics.spo2 === 'number'
      ? biometrics.spo2
      : Number(biometrics.spo2?.average ?? 98.2);
  const spo2Min =
    typeof biometrics.spo2 === 'number'
      ? Math.max(92, biometrics.spo2 - 2)
      : Number(biometrics.spo2?.minimum ?? 96.0);

  // 1. MICROCICLO (7 Días): Fatiga Aguda y Ratio ACWR
  const acuteWeeklyLoadKg =
    workoutMetrics.acuteLoadSevenDaysKg && workoutMetrics.acuteLoadSevenDaysKg > 0
      ? workoutMetrics.acuteLoadSevenDaysKg
      : Math.round(workoutMetrics.totalVolumeKg * 4);

  const chronic28dTotalKg =
    workoutMetrics.chronicLoadTwentyEightDaysKg && workoutMetrics.chronicLoadTwentyEightDaysKg > 0
      ? workoutMetrics.chronicLoadTwentyEightDaysKg
      : Math.round(acuteWeeklyLoadKg * 3.5714);

  const chronicWeeklyAvgKg = Math.max(1000, chronic28dTotalKg / 4);
  const acwr = Number((acuteWeeklyLoadKg / chronicWeeklyAvgKg).toFixed(2));

  let acwrStatus = 'Sweet Spot';
  if (acwr < 0.8) {
    acwrStatus = 'Subentrenamiento / Pérdida de adaptación';
  } else if (acwr <= 1.3) {
    acwrStatus = 'Sweet Spot';
  } else if (acwr < 1.5) {
    acwrStatus = 'Zona de precaución';
  } else {
    acwrStatus = 'Riesgo crítico de fatiga del SNC y lesión';
  }

  // Evaluación HRV / RHR diario e inhibición parasimpática
  const rhr7dMean = biometrics.rhrSevenDayMean ?? 59.5;
  const rhrDeltaVs7dMean = Number((biometrics.restingHeartRate - rhr7dMean).toFixed(1));
  const parasympatheticInhibitionAlert =
    rhrDeltaVs7dMean >= 4 && sleepMetrics.deepSleepHours < 1.3;

  // 2. MESOCICLO (30 Días): Regresión lineal de RHR y Estrés Universitario
  const rhrSeries30d =
    Array.isArray(biometrics.rhrThirtyDaySeries) && biometrics.rhrThirtyDaySeries.length >= 5
      ? [
          ...biometrics.rhrThirtyDaySeries.slice(0, -1),
          biometrics.restingHeartRate,
        ]
      : [
          61, 61, 60, 61, 60, 60, 59, 60, 59, 60,
          59, 59, 58, 59, 59, 58, 59, 58, 58, 59,
          58, 58, 57, 58, 58, 58, 57, 58, 58, biometrics.restingHeartRate,
        ];

  const { slopePerDay, totalChange30d } = calculateOlsLinearRegressionSlope(rhrSeries30d);
  const trendDirection =
    totalChange30d <= -0.5
      ? 'Descendente'
      : totalChange30d >= 0.5
      ? 'Ascendente'
      : 'Estable';
  const signPrefix = totalChange30d > 0 ? '+' : '';
  const rhrBaselineTrend = `${trendDirection} (${signPrefix}${Math.round(totalChange30d)} bpm en 30 días)`;

  const remDeficitAlert = sleepMetrics.remSleepHours < 1.5;

  // Cálculo del porcentaje de recuperación del SNC (CNS Recovery %)
  const sleepScoreComponent = Math.min(
    42,
    (sleepMetrics.deepSleepHours / 1.8) * 22 + (sleepMetrics.remSleepHours / 2.0) * 20
  );
  const rhrScoreComponent = Math.max(
    10,
    Math.min(35, 35 - Math.max(0, biometrics.restingHeartRate - 56) * 2.1)
  );
  const acwrPenalty =
    acwr > 1.3 ? (acwr - 1.3) * 35 : acwr < 0.8 ? (0.8 - acwr) * 10 : 0;
  const rpePenalty = Math.max(0, (workoutMetrics.rpeAverage - 7.5) * 3.5);
  const academicPenalty =
    academicContext.academicMilestone === 'Semana de Parciales'
      ? 6
      : academicContext.academicMilestone === 'Entrega Proyecto Final'
      ? 8
      : 0;
  const inhibitionPenalty = parasympatheticInhibitionAlert ? 14 : 0;

  const cnsRecoveryPercentage = Math.round(
    Math.max(
      35,
      Math.min(
        99,
        25 +
          sleepScoreComponent +
          rhrScoreComponent -
          acwrPenalty -
          rpePenalty -
          academicPenalty * 0.4 -
          inhibitionPenalty
      )
    )
  );

  const readinessScore = Math.round(
    Math.max(
      30,
      Math.min(
        99,
        cnsRecoveryPercentage * 0.94 +
          (spo2Avg >= 97 ? 4 : 1) -
          (academicPenalty * 0.3)
      )
    )
  );

  let readinessCategory = 'Óptimo para Hipertrofia y Exigencia Cognitiva';
  if (parasympatheticInhibitionAlert || readinessScore < 62 || acwr >= 1.5) {
    readinessCategory = 'Inhibición Parasimpática — Priorizar Descarga Neuromuscular y Sueño N3';
  } else if (readinessScore < 78 || acwr > 1.3) {
    readinessCategory = 'Capacidad Moderada — Modulación de Volumen y Control de Fatiga Central';
  }

  // Clasificación de Calidad del Sueño
  const sleepEfficiencyLabel =
    sleepMetrics.deepSleepHours >= 1.6 && sleepMetrics.remSleepHours >= 1.8
      ? 'Alta Eficiencia'
      : sleepMetrics.deepSleepHours >= 1.3 && sleepMetrics.remSleepHours >= 1.5
      ? 'Eficiencia Moderada'
      : 'Déficit de Arquitectura Nocturna';

  const sleepQualityIndex = `${sleepEfficiencyLabel} (Sueño profundo: ${sleepMetrics.deepSleepHours.toFixed(1)}h, REM: ${sleepMetrics.remSleepHours.toFixed(1)}h)`;

  // Rotación biomecánica según última sesión en Hevy
  const lastLower = workoutMetrics.lastWorkoutName.toLowerCase();
  let recommendedMuscleGroups = ['Pectoral', 'Deltoides anterior', 'Tríceps'];
  let groupsToRest = ['Dorsal', 'Isquiosurales'];

  if (lastLower.includes('push') || lastLower.includes('pecho') || lastLower.includes('pectoral')) {
    recommendedMuscleGroups = ['Dorsal ancho', 'Romboides', 'Bíceps braquial', 'Deltoides posterior'];
    groupsToRest = ['Pectoral', 'Deltoides anterior', 'Tríceps'];
  } else if (lastLower.includes('pull') || lastLower.includes('espalda') || lastLower.includes('dorsal')) {
    recommendedMuscleGroups = ['Pectoral', 'Deltoides anterior', 'Tríceps'];
    groupsToRest = ['Dorsal', 'Isquiosurales'];
  } else if (lastLower.includes('leg') || lastLower.includes('pierna') || lastLower.includes('cuádriceps')) {
    recommendedMuscleGroups = ['Pectoral', 'Dorsal ancho', 'Deltoides lateral'];
    groupsToRest = ['Cuádriceps', 'Isquiosurales', 'Erectores espinales'];
  }

  let intensityRecommendation = 'RPE 8-9 permitido hoy';
  let tonnageMultiplier = 0.96;

  if (parasympatheticInhibitionAlert || acwr >= 1.5) {
    intensityRecommendation = 'Deload obligatorio: RPE 5-6 (Técnica compensatoria / Movilidad)';
    tonnageMultiplier = 0.6;
  } else if (
    acwr > 1.3 ||
    academicContext.academicMilestone === 'Semana de Parciales' ||
    academicContext.academicMilestone === 'Entrega Proyecto Final'
  ) {
    intensityRecommendation = 'RPE 7-7.5 controlado (Preservar glucógeno y foco cognitivo UPB)';
    tonnageMultiplier = 0.82;
  }

  const tonnageTargetKg = Number(
    (Math.round((workoutMetrics.totalVolumeKg * tonnageMultiplier) / 50) * 50).toFixed(1)
  );

  const physiologicalRationale = parasympatheticInhibitionAlert
    ? `Alerta de inhibición parasimpática: RHR subió a ${biometrics.restingHeartRate} bpm (+${rhrDeltaVs7dMean} bpm sobre media de 7d) con etapa N3 reducida (${sleepMetrics.deepSleepHours.toFixed(1)}h < 1.3h). Se restringe el reclutamiento de unidades motoras de alto umbral para proteger el SNC.`
    : `SNC descansado (${cnsRecoveryPercentage}% recuperación); la síntesis proteica miofibrilar y la resíntesis de fosfocreatina están optimizadas tras ${sleepMetrics.totalSleepHours.toFixed(1)}h de sueño con ${sleepMetrics.deepSleepHours.toFixed(1)}h de sueño profundo (N3) y SpO2 nocturno estable en ${spo2Avg.toFixed(1)}%.`;

  // Prescripción Cognitiva y Académica (UPB Montería - 6° Semestre Ing. Civil)
  const primarySubjects = academicContext.criticalSubjects.slice(0, 2).join(' / ') || 'Análisis de Estructuras / Hidrología';
  let cognitiveBandwidth = `Excelente para cálculo avanzado (${primarySubjects})`;
  let recommendedFocusBlocks = 'Bloques Pomodoro de 50 min de alta concentración matutina';
  let stressMitigation = 'Caminata de 15 min al aire libre antes de las sesiones de estudio nocturnas.';

  if (remDeficitAlert) {
    cognitiveBandwidth = `Consolidación sináptica limitada (REM ${sleepMetrics.remSleepHours.toFixed(1)}h < 1.5h) — Priorizar revisión procedimental en ${primarySubjects} y evitar deducciones matriciales extensas sin descanso.`;
    recommendedFocusBlocks = 'Bloques fraccionados de 35 min con 10 min de desconexión visual y respiración diafragmática';
    stressMitigation = `NSDR (Non-Sleep Deep Rest) de 20 min post-almuerzo y caminata aeróbica Z1 (${biometrics.steps.toLocaleString('es-CO')} pasos acumulados) para restaurar acetilcolina prefrontal.`;
  } else if (academicContext.academicMilestone !== 'Normal') {
    cognitiveBandwidth = `Alta demanda ejecutiva (${academicContext.academicMilestone}) — Óptimo para resolución matricial en Análisis de Estructuras y modelado en Vías II / Mecánica de Suelos.`;
    recommendedFocusBlocks = `3 bloques profundos de 50 min (mañana) para ${primarySubjects} + 1 bloque de 45 min (tarde) de desarrollo de software.`;
    stressMitigation = 'Caminata de 15 min al aire libre antes de las sesiones de estudio nocturnas y corte de pantallas azules 45 min antes de dormir para proteger la fase REM.';
  }

  // Proyecciones Temporales (7d, 30d, 6m)
  const sevenDaysInsight = parasympatheticInhibitionAlert
    ? `Alerta autonómica en microciclo: ACWR en ${acwr.toFixed(2)} (${acwrStatus}) con elevación aguda de RHR (+${rhrDeltaVs7dMean} bpm) y N3 en ${sleepMetrics.deepSleepHours.toFixed(1)}h. Reducir tonelaje un 35% durante 72h.`
    : `Microciclo balanceado con ACWR en ${acwr.toFixed(2)} (${acwrStatus}). Volumen semanal de ${acuteWeeklyLoadKg.toLocaleString('es-CO')} kg en Hevy asimilado correctamente sin deriva simpática.`;

  const thirtyDaysInsight = remDeficitAlert
    ? `Durante el mesociclo (${academicContext.academicMilestone}), la compresión del sueño REM a ${sleepMetrics.remSleepHours.toFixed(1)}h penaliza la memoria de trabajo en Análisis de Estructuras y Mecánica de Suelos. Pendiente RHR de 30 días en ${totalChange30d} bpm.`
    : `La arquitectura de sueño REM (${sleepMetrics.remSleepHours.toFixed(1)}h) sostiene la plasticidad hipocampal para los talleres de Vías II y Fundamentos de Hidrología, acompañada de una pendiente RHR ${trendDirection.toLowerCase()} (${signPrefix}${Math.round(totalChange30d)} bpm en 30 días).`;

  const projectedRhr6mBpm = Math.max(
    52,
    Math.min(64, Math.round(biometrics.restingHeartRate - (biometrics.steps >= 8000 ? 1.5 : 0)))
  );

  const sixMonthsProjection = `Manteniendo el ritmo actual de ${biometrics.steps.toLocaleString('es-CO')} pasos diarios, SpO2 nocturno en ${spo2Avg.toFixed(1)}% (mín. ${spo2Min.toFixed(0)}%) y 4 sesiones semanales en UPB Gym / Hevy, la RHR basal se proyecta en ${projectedRhr6mBpm} bpm al cierre del semestre ${academicContext.activeSemester.split(' ')[0] || '2026-2'}. Programar semanas de descarga (deload al 65% de tonelaje) en las semanas 6 y 12 coincidiendo con los cortes del 30% y 40% de la UPB Montería para prevenir burnout psicofísico.`;

  const prescription: BiomedicalPrescriptionOutput = {
    readinessScore,
    readinessCategory,
    biomedicalSummary: {
      acwr,
      acwrStatus,
      rhrBaselineTrend,
      sleepQualityIndex,
      cnsRecoveryPercentage,
    },
    gymPrescription: {
      intensityRecommendation,
      recommendedMuscleGroups,
      groupsToRest,
      tonnageTargetKg,
      physiologicalRationale,
    },
    academicCognitivePrescription: {
      cognitiveBandwidth,
      recommendedFocusBlocks,
      stressMitigation,
    },
    temporalInsights: {
      sevenDaysInsight,
      thirtyDaysInsight,
      sixMonthsProjection,
    },
  };

  return {
    prescription,
    diagnostics: {
      acwrRaw: acwr,
      acuteWeeklyLoadKg,
      chronicWeeklyAvgKg: Math.round(chronicWeeklyAvgKg),
      parasympatheticInhibitionAlert,
      rhrDeltaVs7dMean,
      olsSlope30dPerDay: slopePerDay,
      olsTotalDelta30dBpm: totalChange30d,
      remDeficitAlert,
      projectedRhr6mBpm,
    },
    normalizedInput,
  };
}
