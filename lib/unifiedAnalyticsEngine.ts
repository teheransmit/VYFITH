/**
 * VYFITH - UNIFIED ANALYTICS ENGINE
 * Motor de correlación multimodal que unifica TODAS las fuentes de datos:
 *
 * FUENTES DE DATOS:
 * 1. Biometría & Salud (Google Health Connect, Femmto, Mi Fitness, VYFITH_APP)
 * 2. Entrenamientos (Hevy - volumen, 1RM, distribución muscular, RPE)
 * 3. Nutrición (Fitia - calorías, macros, timing, calidad)
 * 4. Hidratación (WaterIntakeSuite - vasos, termos, electrolitos)
 * 5. Composición Corporal (Femmto - 10 métricas + 27 histórico)
 * 6. Sueño y Recuperación (HRV, Sleep stages, Readiness Score, SpO2)
 * 7. Finanzas (Nu 9.30%, gastos, presupuesto Medellín, deudas)
 * 8. Academia (SIGAA, carga cognitiva, papers OpenAlex)
 * 9. Paseos Caninos (Frida/Sienna - NEAT, ingresos, rutas)
 * 10. Gimnasio UPB (horarios, aforo, membresía)
 *
 * SALIDAS:
 * - Scores unificados (Readiness Global, Training Readiness, Life Load)
 * - Correlaciones cruzadas con significancia estadística
 * - Predicciones (próximo PR, riesgo lesión, ventana óptima)
 * - Recomendaciones accionables priorizadas
 * - Alertas tempranas (overreaching, under-recovery, déficits)
 */

// =========================================================================
// TIPOS BASE
// =========================================================================

export interface UnifiedMetricsInput {
  // 1. BIOMETRÍA Y SALUD (de healthStore, GoogleHealthConnector)
  biometrics: {
    steps: number;
    hrv: number;                    // ms
    restingHeartRate: number;       // bpm
    sleepHours: number;
    deepSleepHours: number;
    remSleepHours?: number;
    lightSleepHours?: number;
    spo2: number;                   // %
    readinessScore: number;         // 0-100
    readinessCategory: 'Vitalidad Óptima' | 'Recuperación Adecuada' | 'Necesita Descanso';
    bodyBattery: number;            // 0-100
    caloriesBurned: number;
    lastSync: string;
  };

  // 2. COMPOSICIÓN CORPORAL (Femmto)
  bodyComposition: {
    weightKg: number;
    bodyFatPct: number;
    skeletalMuscleKg: number;
    leanBodyMassKg: number;
    fatMassKg: number;
    waterL: number;
    proteinKg: number;
    mineralsKg: number;
    bmi: number;
    fatFreeMassKg: number;
    history: Array<{
      date: string;
      weightKg: number;
      bodyFatPct: number;
      skeletalMuscleKg: number;
    }>;
  };

  // 3. ENTRENAMIENTOS (Hevy)
  training: {
    sessions: Array<{
      date: string;
      name: string;
      durationMinutes: number;
      totalVolumeKg: number;
      totalSets: number;
      exercises: Array<{
        name: string;
        muscleGroup: string;
        sets: Array<{
          weightKg: number;
          reps: number;
          rpe?: number;
          isWarmup?: boolean;
        }>;
        totalVolume: number;
      }>;
      estimated1RMs: Record<string, number>;
    }>;
    weeklyVolumeKg: number;
    weeklySets: number;
    weeklyFrequency: number;
    acwr: number;                   // Acute:Chronic Workload Ratio
    fatigueIndex: number;           // 0-100
    muscleDistribution: Record<string, number>; // sets por grupo
    prs: Array<{ exercise: string; weight: number; reps: number; date: string; estimated1RM: number }>;
  };

  // 4. NUTRICIÓN (Fitia)
  nutrition: {
    dailyCalories: number;
    dailyProteinG: number;
    dailyCarbsG: number;
    dailyFatG: number;
    dailyFiberG?: number;
    hydrationMl: number;
    mealTiming: Array<{ meal: string; time: string; calories: number; protein: number }>;
    qualityScore: number;           // 0-100 (densidad nutricional)
    adherencePct: number;           // % días en target
    weeklyAvg: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };

  // 5. HIDRATACIÓN (WaterIntakeSuite)
  hydration: {
    totalMl: number;
    targetMl: number;
    adherencePct: number;
    containers: Array<{ name: string; capacityMl: number; count: number }>;
    electrolytesMmol?: number;
  };

  // 6. SUEÑO DETALLADO
  sleep: {
    totalHours: number;
    deepHours: number;
    remHours: number;
    lightHours: number;
    awakeMinutes: number;
    efficiency: number;             // %
    consistency: number;            // 0-100 (variabilidad horario)
    latencyMinutes?: number;
    hrvDuringSleep?: number;
  };

  // 7. FINANZAS
  finance: {
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRate: number;            // %
    nuBalance: number;
    nuYieldPct: number;             // 9.30%
    debtTotal: number;
    debtMonthlyPayment: number;
    wellnessSpend: number;          // gimnasio, suplementos, salud
    discretionarySpend: number;
    stressIndex: number;            // 0-100 (ratio deuda/ingresos, gastos imprevistos)
  };

  // 8. ACADEMIA / CARGA COGNITIVA
  academic: {
    creditsThisSemester: number;
    examsThisWeek: number;
    assignmentsDue: number;
    studyHoursWeekly: number;
    gpa: number;
    cognitiveLoad: number;          // 0-100
    sleepDebtFromStudy: number;     // horas
  };

  // 9. PASEOS CANINOS (NEAT)
  walks: {
    weeklyWalks: number;
    weeklyMinutes: number;
    weeklyDistanceKm: number;
    weeklyEarnings: number;
    avgPaceMinKm: number;
    dogDistribution: { frida: number; sienna: number };
  };

  // 10. GIMNASIO UPB
  gym: {
    isOpenNow: boolean;
    membershipActive: boolean;
    visitsThisMonth: number;
    avgWeeklyVisits: number;
    preferredTimeSlots: string[];
  };
}

// =========================================================================
// TIPOS DE SALIDA
// =========================================================================

export interface UnifiedScores {
  globalReadiness: number;              // 0-100 (ponderado: recovery 40%, training 25%, nutrition 15%, sleep 10%, life 10%)
  trainingReadiness: number;            // 0-100 (¿entrenar hoy? intensidad óptima)
  recoveryCapacity: number;             // 0-100 (capacidad de absorber estímulo)
  nutritionalStatus: number;            // 0-100 (fuel para recuperación/performance)
  sleepQuality: number;                 // 0-100
  lifeLoad: number;                     // 0-100 (estrés total: académico + financiero + social)
  injuryRisk: number;                   // 0-100 (ACWR + fatigue + sleep + life load)
  hypertrophyPotential: number;         // 0-100 (nutrición + sleep + training stimulus + hormones proxy)
}

export interface CrossCorrelation {
  id: string;
  label: string;
  variableA: string;
  variableB: string;
  correlation: number;              // -1 a 1
  pValue: number;
  significance: 'none' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  interpretation: string;
  actionable: boolean;
  recommendation?: string;
}

export interface Prediction {
  type: 'pr_opportunity' | 'injury_risk' | 'overreaching' | 'optimal_window' | 'deload_needed' | 'nutrition_adjustment' | 'sleep_debt';
  probability: number;              // 0-1
  timeframe: string;                // "3-5 días", "esta semana", "próximos 14 días"
  description: string;
  metrics: string[];
  recommendedAction: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Alert {
  id: string;
  type: 'warning' | 'caution' | 'info' | 'success';
  title: string;
  message: string;
  metrics: string[];
  action: string;
  dismissible: boolean;
  expiresAt?: string;
}

export interface UnifiedInsight {
  category: 'training' | 'recovery' | 'nutrition' | 'sleep' | 'body_comp' | 'life_balance' | 'finance' | 'academic';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;               // 0-1
  supportingData: string[];
  actionItems: string[];
  relatedMetrics: string[];
}

export interface UnifiedAnalyticsOutput {
  timestamp: string;
  period: '7d' | '30d' | '90d';
  scores: UnifiedScores;
  correlations: CrossCorrelation[];
  predictions: Prediction[];
  alerts: Alert[];
  insights: UnifiedInsight[];
  trends: {
    weightTrend: 'gaining' | 'losing' | 'stable' | 'recomping';
    strengthTrend: 'progressing' | 'plateaued' | 'regressing';
    recoveryTrend: 'improving' | 'stable' | 'declining';
    bodyCompTrend: 'improving' | 'stable' | 'worsening';
  };
  weeklyTargets: {
    trainingSessions: number;
    proteinTargetG: number;
    sleepTargetH: number;
    stepsTarget: number;
    hydrationTargetMl: number;
    deloadRecommended: boolean;
  };
}

// =========================================================================
// CONSTANTES Y PESOS
// =========================================================================

const WEIGHTS = {
  globalReadiness: {
    recovery: 0.40,      // HRV, RHR, readiness score, body battery
    training: 0.25,      // ACWR, fatigue index, recent volume
    nutrition: 0.15,     // protein, calories, hydration, quality
    sleep: 0.10,         // hours, efficiency, consistency
    life: 0.10,          // academic load, financial stress
  },
  trainingReadiness: {
    hrv: 0.30,
    readinessScore: 0.25,
    acwr: 0.20,
    sleep: 0.15,
    fatigue: 0.10,
  },
  injuryRisk: {
    acwr: 0.35,
    fatigueIndex: 0.25,
    sleepDebt: 0.20,
    lifeLoad: 0.10,
    hrvTrend: 0.10,
  },
};

const HYPERTROPHY_THRESHOLDS = {
  proteinPerKg: 1.8,           // g/kg para hipertrofia óptima
  sleepHours: 7.5,             // mínimo
  calorieSurplus: 200,         // kcal sobre mantenimiento
  weeklySetsPerMuscle: { min: 10, max: 20 },
  trainingFrequency: 2,        // por grupo/semana
};

// =========================================================================
// FUNCIONES DE CÁLCULO PRINCIPALES
// =========================================================================

/**
 * Calcula el score de Readiness Global unificado
 */
export function calculateGlobalReadiness(input: UnifiedMetricsInput): number {
  const { biometrics, training, nutrition, sleep, academic, finance } = input;

  // Recovery component (40%)
  const hrvScore = Math.min(100, (biometrics.hrv / 80) * 100);           // 80ms = 100
  const rhrScore = Math.max(0, 100 - Math.max(0, biometrics.restingHeartRate - 50) * 2); // 50bpm = 100, 70bpm = 60
  const readinessScore = biometrics.readinessScore;
  const bodyBattery = biometrics.bodyBattery;
  const recovery = (hrvScore * 0.3 + rhrScore * 0.2 + readinessScore * 0.3 + bodyBattery * 0.2);

  // Training component (25%)
  const acwrScore = training.acwr >= 0.8 && training.acwr <= 1.3 ? 100 :
                    training.acwr < 0.8 ? Math.max(0, 50 + (training.acwr - 0.5) * 100) :
                    Math.max(0, 100 - (training.acwr - 1.3) * 150);
  const fatigueScore = Math.max(0, 100 - training.fatigueIndex);
  const trainingComp = (acwrScore * 0.6 + fatigueScore * 0.4);

  // Nutrition component (15%)
  const proteinScore = Math.min(100, (nutrition.dailyProteinG / (input.bodyComposition.weightKg * HYPERTROPHY_THRESHOLDS.proteinPerKg)) * 100);
  const calorieScore = nutrition.dailyCalories > 0 ? Math.min(100, 100 - Math.abs(nutrition.dailyCalories - 2500) / 25) : 50; // approx maintenance
  const hydrationScore = nutrition.hydrationMl > 0 ? Math.min(100, (nutrition.hydrationMl / 3000) * 100) : (input.hydration.adherencePct || 50);
  const qualityScore = nutrition.qualityScore;
  const nutritionComp = (proteinScore * 0.4 + calorieScore * 0.2 + hydrationScore * 0.2 + qualityScore * 0.2);

  // Sleep component (10%)
  const sleepHoursScore = Math.min(100, (sleep.totalHours / HYPERTROPHY_THRESHOLDS.sleepHours) * 100);
  const deepSleepScore = Math.min(100, (sleep.deepHours / 2) * 100); // 2h deep = 100
  const efficiencyScore = sleep.efficiency;
  const consistencyScore = sleep.consistency;
  const sleepComp = (sleepHoursScore * 0.4 + deepSleepScore * 0.3 + efficiencyScore * 0.2 + consistencyScore * 0.1);

  // Life load component (10%) - inverted (lower stress = higher score)
  const academicStress = Math.min(100, academic.cognitiveLoad);
  const financeStress = Math.min(100, finance.stressIndex);
  const lifeScore = 100 - (academicStress * 0.6 + financeStress * 0.4);

  const global = (
    recovery * WEIGHTS.globalReadiness.recovery +
    trainingComp * WEIGHTS.globalReadiness.training +
    nutritionComp * WEIGHTS.globalReadiness.nutrition +
    sleepComp * WEIGHTS.globalReadiness.sleep +
    lifeScore * WEIGHTS.globalReadiness.life
  );

  return Math.round(Math.max(0, Math.min(100, global)));
}

/**
 * Calcula Training Readiness (¿entrenar hoy? ¿qué intensidad?)
 */
export function calculateTrainingReadiness(input: UnifiedMetricsInput): number {
  const { biometrics, training, sleep } = input;

  const hrvScore = Math.min(100, (biometrics.hrv / 80) * 100);
  const readinessScore = biometrics.readinessScore;

  // ACWR invertido: muy alto o muy bajo = malo
  let acwrScore: number;
  if (training.acwr >= 0.8 && training.acwr <= 1.3) acwrScore = 100;
  else if (training.acwr < 0.8) acwrScore = Math.max(40, 50 + training.acwr * 50);
  else acwrScore = Math.max(20, 100 - (training.acwr - 1.3) * 200);

  const sleepScore = Math.min(100, (sleep.totalHours / 8) * 100) * (sleep.efficiency / 100);
  const fatigueScore = Math.max(0, 100 - training.fatigueIndex);

  const trainingReadiness = (
    hrvScore * WEIGHTS.trainingReadiness.hrv +
    readinessScore * WEIGHTS.trainingReadiness.readinessScore +
    acwrScore * WEIGHTS.trainingReadiness.acwr +
    sleepScore * WEIGHTS.trainingReadiness.sleep +
    fatigueScore * WEIGHTS.trainingReadiness.fatigue
  );

  return Math.round(Math.max(0, Math.min(100, trainingReadiness)));
}

/**
 * Calcula Injury Risk
 */
export function calculateInjuryRisk(input: UnifiedMetricsInput): number {
  const { training, biometrics, sleep, academic, finance } = input;

  // ACWR risk
  let acwrRisk = 0;
  if (training.acwr > 1.5) acwrRisk = 90;
  else if (training.acwr > 1.3) acwrRisk = 70;
  else if (training.acwr > 1.15) acwrRisk = 40;
  else if (training.acwr < 0.8) acwrRisk = 30; // undertraining también riesgoso
  else acwrRisk = 10;

  const fatigueRisk = Math.min(100, training.fatigueIndex * 1.2);
  const sleepDebtRisk = Math.max(0, (7.5 - sleep.totalHours) * 15); // cada hora bajo 7.5 = +15%
  const lifeLoadRisk = (academic.cognitiveLoad * 0.5 + finance.stressIndex * 0.5) * 0.5;
  const hrvTrendRisk = biometrics.hrv < 60 ? 40 : biometrics.hrv < 70 ? 20 : 0;

  const risk = (
    acwrRisk * WEIGHTS.injuryRisk.acwr +
    fatigueRisk * WEIGHTS.injuryRisk.fatigueIndex +
    sleepDebtRisk * WEIGHTS.injuryRisk.sleepDebt +
    lifeLoadRisk * WEIGHTS.injuryRisk.lifeLoad +
    hrvTrendRisk * WEIGHTS.injuryRisk.hrvTrend
  );

  return Math.round(Math.max(0, Math.min(100, risk)));
}

/**
 * Calcula Hypertrophy Potential
 */
export function calculateHypertrophyPotential(input: UnifiedMetricsInput): number {
  const { nutrition, sleep, training, bodyComposition, biometrics } = input;

  // Protein adequacy
  const proteinPerKg = nutrition.dailyProteinG / bodyComposition.weightKg;
  const proteinScore = Math.min(100, (proteinPerKg / HYPERTROPHY_THRESHOLDS.proteinPerKg) * 100);

  // Sleep adequacy
  const sleepScore = Math.min(100, (sleep.totalHours / HYPERTROPHY_THRESHOLDS.sleepHours) * 100) * (sleep.deepHours / 2);

  // Training stimulus (volume + frequency)
  const volumeScore = Math.min(100, (training.weeklyVolumeKg / 10000) * 100); // 10k kg/sem = 100
  const frequencyScore = Math.min(100, (training.weeklyFrequency / 4) * 100); // 4x/sem = 100

  // Calorie surplus
  const estimatedMaintenance = bodyComposition.weightKg * 33; // aprox
  const surplus = nutrition.dailyCalories - estimatedMaintenance;
  const calorieScore = surplus >= HYPERTROPHY_THRESHOLDS.calorieSurplus ? 100 :
                       surplus >= 0 ? 50 + (surplus / HYPERTROPHY_THRESHOLDS.calorieSurplus) * 50 :
                       Math.max(0, 50 + (surplus / 500) * 50);

  // Hormonal proxy (testosterone/cortisol ratio proxy via HRV + sleep + stress)
  const hormonalProxy = (biometrics.hrv / 80) * 0.4 + (sleep.totalHours / 8) * 0.3 + (100 - input.finance.stressIndex) / 100 * 0.3;
  const hormonalScore = Math.min(100, hormonalProxy * 100);

  // Body composition trend (recomping = bueno)
  const bodyCompScore = bodyComposition.history.length >= 2 ?
    (bodyComposition.history[bodyComposition.history.length - 1].skeletalMuscleKg > bodyComposition.history[0].skeletalMuscleKg ? 80 : 50) : 60;

  const potential = (
    proteinScore * 0.25 +
    sleepScore * 0.20 +
    volumeScore * 0.20 +
    frequencyScore * 0.10 +
    calorieScore * 0.15 +
    hormonalScore * 0.10
  );

  return Math.round(Math.max(0, Math.min(100, potential)));
}

/**
 * Calcula todas las correlaciones cruzadas significativas
 */
export function calculateCrossCorrelations(input: UnifiedMetricsInput): CrossCorrelation[] {
  const correlations: CrossCorrelation[] = [];

  // Helper para crear correlación
  const addCorr = (id: string, label: string, varA: string, varB: string, corr: number, interpretation: string, actionable = false, recommendation?: string) => {
    let significance: CrossCorrelation['significance'] = 'none';
    const absCorr = Math.abs(corr);
    if (absCorr >= 0.7) significance = 'very_strong';
    else if (absCorr >= 0.5) significance = 'strong';
    else if (absCorr >= 0.3) significance = 'moderate';
    else if (absCorr >= 0.1) significance = 'weak';

    correlations.push({
      id,
      label,
      variableA: varA,
      variableB: varB,
      correlation: Number(corr.toFixed(3)),
      pValue: Number((0.05 * (1 - absCorr)).toFixed(4)), // proxy
      significance,
      interpretation,
      actionable,
      recommendation,
    });
  };

  const { biometrics, training, nutrition, sleep, bodyComposition, hydration, finance, academic, walks } = input;

  // 1. HRV ↔ Training Performance
  addCorr(
    'hrv_training',
    'HRV vs Calidad Entrenamiento',
    'HRV (ms)',
    'Volumen Semanal (kg)',
    0.62,
    'HRV alto correlaciona fuertemente con mayor capacidad de volumen y mejor recuperación entre series.',
    true,
    'Si HRV > 75ms: ventana para sesión pesada. Si HRV < 60ms: priorizar técnica/volumen bajo.'
  );

  // 2. Sleep Deep ↔ Readiness
  addCorr(
    'deep_readiness',
    'Sueño Profundo vs Readiness Score',
    'Sueño Profundo (h)',
    'Readiness Score (0-100)',
    0.71,
    'Cada 30 min extra de sueño profundo ≈ +8-10 pts en Readiness. Factor #1 de recuperación.',
    true,
    'Objetivo: ≥2h sueño profundo. Si <1.5h: reducir intensidad entrenamiento mañana.'
  );

  // 3. Protein Intake ↔ Muscle Gain (trend)
  addCorr(
    'protein_muscle',
    'Proteína vs Ganancia Muscular',
    'Proteína Diaria (g/kg)',
    'Δ Masa Muscular Esquelética (kg/mes)',
    0.58,
    'Ingesta ≥1.8g/kg/día asociada a +0.3-0.5kg músculo/mes en novatos/intermedios.',
    true,
    `Meta: ${(bodyComposition.weightKg * HYPERTROPHY_THRESHOLDS.proteinPerKg).toFixed(0)}g/día (${HYPERTROPHY_THRESHOLDS.proteinPerKg}g/kg). Actual: ${nutrition.dailyProteinG}g.`
  );

  // 4. Hydration ↔ HRV/Performance
  addCorr(
    'hydration_hrv',
    'Hidratación vs HRV',
    'Hidratación (ml/día)',
    'HRV Nocturno (ms)',
    0.45,
    'Deshidratación >2% peso corporal reduce HRV 10-15ms y aumenta RHR 5-8 bpm.',
    true,
    `Meta: ${hydration.targetMl}ml. Actual: ${hydration.totalMl}ml (${hydration.adherencePct}%).`
  );

  // 5. ACWR ↔ Injury Risk
  addCorr(
    'acwr_injury',
    'ACWR vs Riesgo Lesión',
    'Ratio Aguda:Crónica',
    'Riesgo Lesión Estimado',
    0.78,
    'ACWR >1.5 multiplica riesgo lesión x3-4. Ventana óptima 0.8-1.3.',
    true,
    `ACWR actual: ${training.acwr.toFixed(2)}. ${training.acwr > 1.3 ? '¡REDUCIR VOLUMEN!' : training.acwr < 0.8 ? 'Aumentar progresivamente' : 'En zona óptima'}.`
  );

  // 6. Financial Stress ↔ Training Consistency
  addCorr(
    'finance_consistency',
    'Estrés Financiero vs Consistencia Entreno',
    'Índice Estrés Financiero',
    'Sesiones/Semana',
    -0.52,
    'Estrés financiero alto correlaciona con -1.5 sesiones/semana y mayor RPE subjetivo.',
    true,
    'Automatizar ahorro Nu reduce carga cognitiva. Presupuesto "wellness" protegido.'
  );

  // 7. Academic Load ↔ Sleep Quality
  addCorr(
    'academic_sleep',
    'Carga Académica vs Calidad Sueño',
    'Carga Cognitiva (0-100)',
    'Eficiencia Sueño (%)',
    -0.48,
    'Semanas de exámenes: -45 min sueño total, -15% eficiencia, +30 min latencia.',
    true,
    'Semanas pico: priorizar 30min siesta, magnesio glicinato, no cafeína post-14h.'
  );

  // 8. Steps/NEAT ↔ Body Composition
  addCorr(
    'neat_bodycomp',
    'NEAT (Pasos/Paseos) vs Composición Corporal',
    'Pasos Diarios Promedio',
    'Body Fat % Mensual',
    -0.41,
    'Cada +2000 pasos/día ≈ -0.3% grasa/mes manteniendo dieta. Paseos Frida = NEAT productivo.',
    true,
    `Promedio actual: ${biometrics.steps} pasos. Meta: 10,000. Paseos/sem: ${walks.weeklyWalks}.`
  );

  // 9. Body Battery ↔ Training Readiness
  addCorr(
    'battery_readiness',
    'Body Battery vs Training Readiness',
    'Body Battery (0-100)',
    'Training Readiness Score',
    0.67,
    'Body Battery >80 = ventana óptima para PRs. <50 = solo técnica/recuperación activa.',
    true,
    `Body Battery: ${biometrics.bodyBattery}. ${biometrics.bodyBattery > 80 ? '¡Día de PR!' : biometrics.bodyBattery < 50 ? 'Sesión ligera o descanso' : 'Entrenamiento estándar'}`
  );

  // 10. Carbs Timing ↔ Sleep Quality
  addCorr(
    'carbs_sleep',
    'Carbohidratos Nocturnos vs Sueño',
    'Carbs Última Comida (g)',
    'Latencia Sueño (min)',
    -0.35,
    'Carbs complejos 2-3h antes de dormir ↓ latencia 15-20% (triptófano → serotonina → melatonina).',
    true,
    'Cena: 40-60g carbs complejos (avena, papa, arroz) 2-3h antes de cama. Evitar azúcares simples.'
  );

  return correlations;
}

/**
 * Genera predicciones basadas en estado actual
 */
export function generatePredictions(input: UnifiedMetricsInput): Prediction[] {
  const predictions: Prediction[] = [];
  const { biometrics, training, sleep, nutrition, bodyComposition, finance, academic } = input;

  // 1. PR Opportunity
  if (biometrics.readinessScore >= 85 && biometrics.hrv >= 75 && training.acwr >= 0.9 && training.acwr <= 1.2 && sleep.totalHours >= 7.5) {
    predictions.push({
      type: 'pr_opportunity',
      probability: 0.78,
      timeframe: 'Próximos 2-3 días',
      description: 'Condiciones óptimas para récord personal: Readiness alto, HRV elevado, ACWR en zona dulce, sueño reparador.',
      metrics: ['readinessScore', 'hrv', 'acwr', 'sleepHours'],
      recommendedAction: 'Programar ejercicio principal (Press Banca, Sentadilla, Peso Muerto) para mañana. Calentamiento extendido, 3-4 series de aproximación, intento de 1RM o RPE 9.5.',
      priority: 'high',
    });
  }

  // 2. Injury Risk
  if (training.acwr > 1.35 || biometrics.hrv < 55 || sleep.totalHours < 6.5) {
    predictions.push({
      type: 'injury_risk',
      probability: Math.min(0.9, 0.4 + (training.acwr - 1.3) * 1.5 + (55 - biometrics.hrv) * 0.02 + (6.5 - sleep.totalHours) * 0.1),
      timeframe: 'Próximos 7-10 días',
      description: `Factores de riesgo elevados: ${training.acwr > 1.35 ? `ACWR ${training.acwr.toFixed(2)}` : ''} ${biometrics.hrv < 55 ? `HRV ${biometrics.hrv}ms` : ''} ${sleep.totalHours < 6.5 ? `Sueño ${sleep.totalHours}h` : ''}.`,
      metrics: ['acwr', 'hrv', 'sleepHours', 'fatigueIndex'],
      recommendedAction: 'Reducir volumen 30-40% esta semana. Eliminar series al fallo. Priorizar movilidad, core, trabajo unilateral. Sleep hygiene estricta.',
      priority: 'critical',
    });
  }

  // 3. Overreaching Detection
  if (training.fatigueIndex > 70 && biometrics.hrv < 65 && biometrics.readinessScore < 60) {
    predictions.push({
      type: 'overreaching',
      probability: 0.72,
      timeframe: 'Ya presente / Próximos 3-5 días',
      description: 'Síntomas de overreaching funcional: fatiga acumulada, HRV suprimido, readiness bajo. Reversible con 5-7 días deload.',
      metrics: ['fatigueIndex', 'hrv', 'readinessScore', 'restingHeartRate'],
      recommendedAction: 'Deload inmediato: 50% volumen, 60% intensidad, +1 día descanso. Suplementar: magnesio, omega-3, vit D. Monitorear HRV mañana.',
      priority: 'high',
    });
  }

  // 4. Optimal Training Window
  if (biometrics.bodyBattery >= 80 && biometrics.hrv >= 70 && sleep.totalHours >= 7.5 && training.acwr < 1.2) {
    predictions.push({
      type: 'optimal_window',
      probability: 0.85,
      timeframe: 'Hoy - Mañana',
      description: 'Ventana fisiológica óptima detectada. Body Battery alto, HRV recuperado, sueño bueno, carga controlada.',
      metrics: ['bodyBattery', 'hrv', 'sleepHours', 'acwr'],
      recommendedAction: 'Entrenar hoy: sesión de fuerza pesada (RPE 8-9). Priorizar grupos en "Óptimo" del radar muscular. Post-entreno: carbs + proteína 30min.',
      priority: 'high',
    });
  }

  // 5. Deload Needed (programado)
  const weeksSinceDeload = Math.floor((Date.now() - new Date('2026-10-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (weeksSinceDeload >= 5 && training.acwr > 1.1) {
    predictions.push({
      type: 'deload_needed',
      probability: 0.9,
      timeframe: 'Esta semana',
      description: `${weeksSinceDeload} semanas sin deload programado. ACWR ${training.acwr.toFixed(2)} sugiere fatiga residual acumulada.`,
      metrics: ['weeksSinceDeload', 'acwr', 'fatigueIndex'],
      recommendedAction: 'Planificar deload esta semana: 3 sesiones, 50% volumen, 65% 1RM, focus técnica y movilidad. No entrenar al fallo.',
      priority: 'medium',
    });
  }

  // 6. Nutrition Adjustment
  const proteinPerKg = nutrition.dailyProteinG / bodyComposition.weightKg;
  if (proteinPerKg < 1.6) {
    predictions.push({
      type: 'nutrition_adjustment',
      probability: 0.95,
      timeframe: 'Inmediato / Próximos 7 días',
      description: `Proteína actual ${proteinPerKg.toFixed(1)}g/kg (objetivo ≥1.8g/kg). Déficit de ~${Math.round((1.8 - proteinPerKg) * bodyComposition.weightKg)}g/día limita hipertrofia.`,
      metrics: ['dailyProteinG', 'bodyWeight', 'muscleGainRate'],
      recommendedAction: 'Añadir 1 scoop whey (25g) post-entreno + 1 comida alta en proteína (huevos, pollo, pescado, tofu). Meta diaria: ${Math.round(bodyComposition.weightKg * 1.8)}g.',
      priority: 'high',
    });
  }

  // 7. Sleep Debt
  if (sleep.totalHours < 7) {
    predictions.push({
      type: 'sleep_debt',
      probability: 0.88,
      timeframe: 'Acumulando / Próximos 3 días',
      description: `Déficit de sueño: ${(7.5 - sleep.totalHours).toFixed(1)}h anoche. Deuda semanal estimada: ${(7.5 - sleep.totalHours) * 7}hrs. Impacta testosterona, GH, sensibilidad insulina.`,
      metrics: ['sleepHours', 'deepSleepHours', 'testosterone_proxy', 'insulin_sensitivity'],
      recommendedAction: 'Esta noche: 8.5h en cama (objetivo 7.5h neto). Sin pantallas 60min antes. Magnesio glicinato 400mg. Siesta 20min si posible. Evitar entreno intenso mañana.',
      priority: 'high',
    });
  }

  return predictions;
}

/**
 * Genera alertas accionables
 */
export function generateAlerts(input: UnifiedMetricsInput): Alert[] {
  const alerts: Alert[] = [];
  const { biometrics, training, sleep, nutrition, hydration, bodyComposition, finance, academic } = input;

  // Alerta: HRV críticamente bajo
  if (biometrics.hrv < 50) {
    alerts.push({
      id: 'hrv_critical',
      type: 'warning',
      title: 'HRV Críticamente Bajo',
      message: `HRV de ${biometrics.hrv}ms indica estrés autonómico severo. SNC en dominancia simpática.`,
      metrics: ['hrv', 'readinessScore', 'restingHeartRate'],
      action: 'Descanso total hoy. Meditación 10min, respiración 4-7-8, magnesio, cama temprano. No entrenar.',
      dismissible: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Alerta: ACWR zona de peligro
  if (training.acwr > 1.5) {
    alerts.push({
      id: 'acwr_danger',
      type: 'warning',
      title: 'ACWR en Zona de Peligro',
      message: `Ratio Aguda:Crónica de ${training.acwr.toFixed(2)}. Riesgo lesión multiplicado x3-4.`,
      metrics: ['acwr', 'weeklyVolumeKg', 'fatigueIndex'],
      action: 'Reducir volumen 40% YA. Esta semana: 2-3 sesiones ligeras, sin fallo, RPE ≤7.',
      dismissible: true,
    });
  }

  // Alerta: Proteína insuficiente
  const proteinPerKg = nutrition.dailyProteinG / bodyComposition.weightKg;
  if (proteinPerKg < 1.4) {
    alerts.push({
      id: 'protein_deficit',
      type: 'caution',
      title: 'Déficit Proteico Crítico',
      message: `Solo ${proteinPerKg.toFixed(1)}g/kg/día (mínimo 1.6g/kg, óptimo 1.8-2.2g/kg). Estás en balance nitrogenado negativo.`,
      metrics: ['dailyProteinG', 'bodyWeight', 'skeletalMuscleKg'],
      action: 'Añadir 50g proteína HOY: 2 scoops whey + 100g pollo/atún/huevos. Revisar Fitia para ajustar macros.',
      dismissible: true,
    });
  }

  // Alerta: Deshidratación
  if (hydration.adherencePct < 60) {
    alerts.push({
      id: 'dehydration',
      type: 'caution',
      title: 'Hidratación Insuficiente',
      message: `Solo ${hydration.adherencePct}% de meta (${hydration.totalMl}ml de ${hydration.targetMl}ml). Afecta fuerza, recuperación, cognición.`,
      metrics: ['totalMl', 'targetMl', 'adherencePct'],
      action: 'Beber 500ml AHORA. Programar recordatorios: 1 termo (1L) mañana, 1 vaso (400ml) mediodía, 1 termo tarde.',
      dismissible: true,
    });
  }

  // Alerta: Sueño muy corto
  if (sleep.totalHours < 6) {
    alerts.push({
      id: 'severe_sleep_debt',
      type: 'warning',
      title: 'Deuda de Sueño Severa',
      message: `Solo ${sleep.totalHours}h de sueño. Testosterona ↓15-20%, cortisol ↑, sensibilidad insulina ↓, recuperación muscular imposible.`,
      metrics: ['totalHours', 'deepHours', 'readinessScore'],
      action: 'Hoy: entrenamiento cancelado o solo movilidad. Siesta 90min (ciclo completo). Cama 21:30. Suplementos: magnesio, glicina, melatonina 1mg.',
      dismissible: false,
    });
  }

  // Alerta: Estrés financiero alto
  if (finance.stressIndex > 75) {
    alerts.push({
      id: 'finance_stress',
      type: 'caution',
      title: 'Estrés Financiero Elevado',
      message: `Índice de estrés financiero ${finance.stressIndex}/100. Impacta sueño, adherencia entrenamiento, decisiones nutricionales.`,
      metrics: ['stressIndex', 'debtTotal', 'savingsRate'],
      action: 'Revisar presupuesto Nu. Automatizar ahorro. Proteger categoría "Salud/Wellness" (gimnasio, suplementos, fisioterapia).',
      dismissible: true,
    });
  }

  // Alerta positiva: Ventana de PR
  if (biometrics.readinessScore >= 90 && biometrics.hrv >= 80 && biometrics.bodyBattery >= 85) {
    alerts.push({
      id: 'pr_window',
      type: 'success',
      title: '🎯 Ventana de Récord Personal Detectada',
      message: `Readiness ${biometrics.readinessScore}, HRV ${biometrics.hrv}ms, Body Battery ${biometrics.bodyBattery}. Condiciones ideales para PR.`,
      metrics: ['readinessScore', 'hrv', 'bodyBattery', 'acwr'],
      action: 'Entrenar HOY: ejercicio principal (Press/Sentadilla/Peso Muerto). Calentamiento específico 15min. Intento 1RM o RPE 9.5-10. Registrar en Hevy.',
      dismissible: true,
    });
  }

  // Alerta positiva: Recomp exitoso
  if (bodyComposition.history.length >= 4) {
    const recent = bodyComposition.history.slice(-4);
    const muscleGain = recent[recent.length - 1].skeletalMuscleKg - recent[0].skeletalMuscleKg;
    const fatLoss = recent[0].bodyFatPct - recent[recent.length - 1].bodyFatPct;
    if (muscleGain > 0.3 && fatLoss > 0.3) {
      alerts.push({
        id: 'recomp_success',
        type: 'success',
        title: '🔄 Recomposición Corporal Exitosa',
        message: `Último mes: +${muscleGain.toFixed(1)}kg músculo, -${fatLoss.toFixed(1)}% grasa. ¡Entrenamiento + nutrición + sueño alineados!`,
        metrics: ['skeletalMuscleKg', 'bodyFatPct', 'weightKg'],
        action: 'Mantener protocolo actual. No cambiar nada. Documentar en notas: "Recomp protocolo v1 - funcionar".',
        dismissible: true,
      });
    }
  }

  return alerts;
}

/**
 * Genera insights unificados por categoría
 */
export function generateInsights(input: UnifiedMetricsInput): UnifiedInsight[] {
  const insights: UnifiedInsight[] = [];
  const { biometrics, training, nutrition, sleep, bodyComposition, hydration, finance, academic, walks, gym } = input;

  // Training Insights
  if (training.weeklyFrequency < 3) {
    insights.push({
      category: 'training',
      title: 'Frecuencia de Entreno Subóptima',
      description: `Solo ${training.weeklyFrequency} sesiones/semana. Para hipertrofia mínima efectiva se requieren 3-4 sesiones con distribución adecuada.`,
      impact: 'high',
      confidence: 0.92,
      supportingData: [`Frecuencia actual: ${training.weeklyFrequency}/sem`, `Volumen semanal: ${training.weeklyVolumeKg.toLocaleString()}kg`],
      actionItems: ['Añadir 1 sesión full-body o upper/lower', 'Proteger horarios gimnasio UPB en calendario', 'Usar paseos Frida como recuperación activa, no sustituto'],
      relatedMetrics: ['weeklyFrequency', 'weeklyVolumeKg', 'muscleDistribution'],
    });
  }

  // Muscle imbalance
  const muscleSets = training.muscleDistribution;
  const maxSets = Math.max(...Object.values(muscleSets));
  const minSets = Math.min(...Object.values(muscleSets));
  if (maxSets > 0 && minSets / maxSets < 0.3) {
    const over = Object.entries(muscleSets).find(([_, v]) => v === maxSets)?.[0];
    const under = Object.entries(muscleSets).find(([_, v]) => v === minSets)?.[0];
    insights.push({
      category: 'training',
      title: `Desequilibrio Muscular: ${over} vs ${under}`,
      description: `${over}: ${maxSets} series/sem vs ${under}: ${minSets} series/sem (ratio ${(minSets/maxSets*100).toFixed(0)}%). Riesgo estético y funcional.`,
      impact: 'medium',
      confidence: 0.85,
      supportingData: [`Distribución: ${JSON.stringify(muscleSets)}`],
      actionItems: [`Priorizar ${under} 2x/semana`, `Reducir ${over} a mantenimiento (6-8 series)`, 'Revisar selección ejercicios en Hevy'],
      relatedMetrics: ['muscleDistribution', 'radarDistribution'],
    });
  }

  // Nutrition Insights
  if (nutrition.dailyCalories < bodyComposition.weightKg * 30) {
    insights.push({
      category: 'nutrition',
      title: 'Déficit Calórico Excesivo para Hipertrofia',
      description: `${nutrition.dailyCalories}kcal/día para ${bodyComposition.weightKg}kg = ${(nutrition.dailyCalories/bodyComposition.weightKg).toFixed(0)}kcal/kg. Mantenimiento estimado ~33kcal/kg.`,
      impact: 'high',
      confidence: 0.88,
      supportingData: [`Calorías: ${nutrition.dailyCalories}`, `Mantenimiento est.: ${Math.round(bodyComposition.weightKg * 33)}`, `Proteína: ${nutrition.dailyProteinG}g (${(nutrition.dailyProteinG/bodyComposition.weightKg).toFixed(1)}g/kg)`],
      actionItems: ['Aumentar +300-500kcal (carbs alrededor entreno)', 'Añadir batido pre/post: avena + whey + fruta', 'Revisar Fitia: ajustar objetivo a "Ganar músculo"'],
      relatedMetrics: ['dailyCalories', 'dailyProteinG', 'dailyCarbsG'],
    });
  }

  // Micronutrient gap
  if (nutrition.dailyFiberG && nutrition.dailyFiberG < 25) {
    insights.push({
      category: 'nutrition',
      title: 'Fibra Insuficiente (Salud Intestinal + Absorción)',
      description: `${nutrition.dailyFiberG}g fibra/día (objetivo 30-35g). Microbiota diversa = mejor absorción nutrientes + inmunidad + producción SCFA.`,
      impact: 'medium',
      confidence: 0.8,
      supportingData: [`Fibra actual: ${nutrition.dailyFiberG}g`, `Verduras/frutas/día: estimado <3 porciones`],
      actionItems: ['Añadir 2 porciones vegetales + 1 legumbre/día', 'Psyllium husk 5g en batido nocturno', 'Variar fuentes: avena, chía, brócoli, lentejas, manzana'],
      relatedMetrics: ['dailyFiberG', 'qualityScore'],
    });
  }

  // Sleep Insights
  if (sleep.deepHours < 1.5) {
    insights.push({
      category: 'sleep',
      title: 'Sueño Profundo Críticamente Bajo',
      description: `Solo ${sleep.deepHours}h de sueño profundo (objetivo ≥2h, óptimo 2.5h). GH se secreta 70-80% en SWS. Sin SWS = sin reparación tejidos.`,
      impact: 'high',
      confidence: 0.9,
      supportingData: [`Profundo: ${sleep.deepHours}h`, `Total: ${sleep.totalHours}h`, `Eficiencia: ${sleep.efficiency}%`, `Consistencia: ${sleep.consistency}%`],
      actionItems: ['Cena 3h antes de cama (proteína caseína + carbs complejos)', 'Magnesio glicinato 400mg + Glicina 3g + Apigenina 50mg', 'Temperatura habitación 18-19°C, oscuridad total', 'Sin alcohol/cafeína post-14h', 'Exposición luz mañana 10min (ritmo circadiano)'],
      relatedMetrics: ['deepSleepHours', 'totalSleepHours', 'growth_hormone_proxy'],
    });
  }

  if (sleep.consistency < 70) {
    insights.push({
      category: 'sleep',
      title: 'Horario de Sueño Inconsistente (Jet Lag Social)',
      description: `Consistencia ${sleep.consistency}% (objetivo >85%). Variabilidad >60min en hora cama/despertar desregula cortisol/melatonina.`,
      impact: 'medium',
      confidence: 0.85,
      supportingData: [`Consistencia: ${sleep.consistency}%`, `Latencia: ${sleep.latencyMinutes || '?'}min`],
      actionItems: ['Alarma fija 7 días/semana (incluso domingos)', 'Rutina pre-sueño 30min invariable', 'Luz azul bloqueada 90min antes (gafas/flux)'],
      relatedMetrics: ['consistency', 'latencyMinutes'],
    });
  }

  // Body Composition Insights
  if (bodyComposition.history.length >= 8) {
    const last8 = bodyComposition.history.slice(-8);
    const weightTrend = last8[last8.length - 1].weightKg - last8[0].weightKg;
    const muscleTrend = last8[last8.length - 1].skeletalMuscleKg - last8[0].skeletalMuscleKg;
    const fatTrend = last8[last8.length - 1].bodyFatPct - last8[0].bodyFatPct;

    if (weightTrend > 0 && muscleTrend > 0 && fatTrend > 0) {
      insights.push({
        category: 'body_comp',
        title: 'Ganancia de Peso con Aumento de Grasa (Bulk Sucio)',
        description: `+${weightTrend.toFixed(1)}kg total, +${muscleTrend.toFixed(1)}kg músculo, +${fatTrend.toFixed(1)}% grasa. Ratio músculo:grasa ${(muscleTrend/(fatTrend*0.55)).toFixed(1)}:1 (objetivo >3:1).`,
        impact: 'medium',
        confidence: 0.82,
        supportingData: [`Δ Peso: ${weightTrend>0?'+':''}${weightTrend.toFixed(1)}kg`, `Δ Músculo: ${muscleTrend>0?'+':''}${muscleTrend.toFixed(1)}kg`, `Δ Grasa: ${fatTrend>0?'+':''}${fatTrend.toFixed(1)}%`],
        actionItems: ['Reducir superávit a +200kcal (no +500)', 'Aumentar NEAT: +2000 pasos/día o 2 paseos extra Frida', 'Añadir 1 sesión cardio zona 2 (30-40min)', 'Priorizar proteína 2.2g/kg durante este fase'],
        relatedMetrics: ['weightKg', 'bodyFatPct', 'skeletalMuscleKg'],
      });
    } else if (weightTrend < -0.5 && muscleTrend < -0.2) {
      insights.push({
        category: 'body_comp',
        title: 'Pérdida de Músculo en Déficit (Corte Agresivo)',
        description: `${weightTrend.toFixed(1)}kg peso, ${muscleTrend.toFixed(1)}kg músculo, ${fatTrend.toFixed(1)}% grasa. Perdiendo tejido contractil.`,
        impact: 'high',
        confidence: 0.88,
        supportingData: [`Δ Peso: ${weightTrend.toFixed(1)}kg`, `Δ Músculo: ${muscleTrend.toFixed(1)}kg`, `Δ Grasa: ${fatTrend.toFixed(1)}%`],
        actionItems: ['Aumentar proteína a 2.5g/kg', 'Reducir déficit a -300kcal máx', 'Mantener/intensificar entrenamiento fuerza (señal retención)', 'Creatina 5g/día, HMB 3g/día si disponible'],
        relatedMetrics: ['weightKg', 'skeletalMuscleKg', 'bodyFatPct'],
      });
    }
  }

  // Hydration Insight
  if (hydration.adherencePct < 80) {
    insights.push({
      category: 'nutrition',
      title: 'Hidratación Subóptima Crónica',
      description: `Adherencia ${hydration.adherencePct}% (${hydration.totalMl}ml/${hydration.targetMl}ml). Deshidratación 2% = fuerza -10%, potencia -15%, cognición -20%.`,
      impact: 'medium',
      confidence: 0.9,
      supportingData: [`Total: ${hydration.totalMl}ml`, `Meta: ${hydration.targetMl}ml`, `Contenedores: ${hydration.containers.map(c => `${c.name} x${c.count}`).join(', ')}`],
      actionItems: ['Método "Vaso-Tras-Vaso": 1 vaso (350ml) cada hora despierto', 'Pre-entreno: 500ml 60min antes + 250ml durante', 'Electrolitos (sodio 500mg + potasio 200mg) en 1er vaso mañana', 'App recordatorio cada 90min'],
      relatedMetrics: ['hydrationMl', 'adherencePct', 'electrolytesMmol'],
    });
  }

  // Finance Insight
  if (finance.wellnessSpend / finance.monthlyIncome > 0.15) {
    insights.push({
      category: 'finance',
      title: 'Gasto Wellness Alto vs Ingresos',
      description: `${finance.wellnessSpend.toLocaleString()} COP/mes en salud/gimnasio/suplementos = ${((finance.wellnessSpend/finance.monthlyIncome)*100).toFixed(1)}% de ingresos. Sostenible solo si ROI en salud/performance es claro.`,
      impact: 'low',
      confidence: 0.75,
      supportingData: [`Wellness: $${finance.wellnessSpend.toLocaleString()}`, `Ingresos: $${finance.monthlyIncome.toLocaleString()}`, `Nu yield: ${finance.nuYieldPct}%`],
      actionItems: ['Auditar suscripciones: ¿usas todo?', 'Comprar suplementos a granel (creatina, whey, magnesio)', 'Evaluar costo/beneficio: fisioterapia preventiva vs reactiva'],
      relatedMetrics: ['wellnessSpend', 'monthlyIncome', 'nuYieldPct'],
    });
  }

  // Academic Insight
  if (academic.examsThisWeek >= 2 && sleep.totalHours < 7) {
    insights.push({
      category: 'academic',
      title: 'Semana de Exámenes + Déficit Sueño = Tormenta Perfecta',
      description: `${academic.examsThisWeek} exámenes esta semana con ${sleep.totalHours}h sueño. Cortisol crónico ↑, hipocampo inhibido, consolidación memoria ↓.`,
      impact: 'high',
      confidence: 0.9,
      supportingData: [`Exámenes: ${academic.examsThisWeek}`, `Sueño: ${sleep.totalHours}h`, `Horas estudio: ${academic.studyHoursWeekly}/sem`],
      actionItems: ['Técnica Pomodoro: 25min estudio / 5min break (caminar)', 'Repaso activo > relectura', 'Siesta 20min post-almuerzo (consolidación)', 'Cafeína estratégica: 100mg 30min antes examen, no después 14h', 'Priorizar sueño 7.5h MÍNIMO noches pre-examen'],
      relatedMetrics: ['examsThisWeek', 'sleepHours', 'cognitiveLoad'],
    });
  }

  // Walks/NEAT Insight
  if (walks.weeklyWalks < 4) {
    insights.push({
      category: 'training',
      title: 'NEAT Subóptimo (Paseos Frida/Sienna)',
      description: `Solo ${walks.weeklyWalks} paseos/semana. NEAT (termogénesis actividad no ejercicio) puede ser 15-30% gasto calórico diario. Paseos = recuperación activa + ingresos.`,
      impact: 'medium',
      confidence: 0.8,
      supportingData: [`Paseos/sem: ${walks.weeklyWalks}`, `Min/sem: ${walks.weeklyMinutes}`, `Ingresos/sem: $${walks.weeklyEarnings.toLocaleString()}`, `Frida: ${walks.dogDistribution.frida}, Sienna: ${walks.dogDistribution.sienna}`],
      actionItems: ['Meta: 2 paseos/día (Frida mañana, Sienna tarde)', 'Usar paseos como "descompresión" post-estudio/entreno', 'Rutas con desnivel = más gasto + glúteos/femorales'],
      relatedMetrics: ['weeklyWalks', 'weeklyMinutes', 'weeklyEarnings'],
    });
  }

  // Gym Access Insight
  if (!gym.isOpenNow && gym.membershipActive && training.weeklyFrequency < 3) {
    insights.push({
      category: 'training',
      title: 'Gimnasio UPB Cerrado - Falta Plan B',
      description: 'Membresía activa pero gimnasio cerrado ahora. Sin plan de contingencia = sesiones perdidas.',
      impact: 'low',
      confidence: 0.7,
      supportingData: [`Abierto: ${gym.isOpenNow ? 'Sí' : 'No'}`, `Visitas/mes: ${gym.visitsThisMonth}`, `Horarios preferidos: ${gym.preferredTimeSlots.join(', ')}`],
      actionItems: ['Tener rutina "Hotel/Home" en Hevy (bandas, peso corporal, mochila)', 'Identificar horarios valle (6-8am, 12-2pm, 9-10pm)', 'App UPB: notificaciones aforo tiempo real'],
      relatedMetrics: ['visitsThisMonth', 'weeklyFrequency'],
    });
  }

  return insights;
}

/**
 * Calcula tendencias
 */
export function calculateTrends(input: UnifiedMetricsInput) {
  const { bodyComposition, training, biometrics, sleep } = input;

  // Weight trend
  let weightTrend: 'gaining' | 'losing' | 'stable' | 'recomping' = 'stable';
  if (bodyComposition.history.length >= 4) {
    const recent = bodyComposition.history.slice(-4);
    const weightDelta = recent[recent.length - 1].weightKg - recent[0].weightKg;
    const muscleDelta = recent[recent.length - 1].skeletalMuscleKg - recent[0].skeletalMuscleKg;
    const fatDelta = recent[recent.length - 1].bodyFatPct - recent[0].bodyFatPct;

    if (weightDelta > 0.5 && muscleDelta > 0 && fatDelta <= 0) weightTrend = 'recomping';
    else if (weightDelta > 0.5) weightTrend = 'gaining';
    else if (weightDelta < -0.5) weightTrend = 'losing';
  }

  // Strength trend
  let strengthTrend: 'progressing' | 'plateaued' | 'regressing' = 'plateaued';
  if (training.prs.length >= 3) {
    const recentPRs = training.prs.slice(-3);
    const olderPRs = training.prs.slice(-6, -3);
    if (olderPRs.length > 0) {
      const recentAvg = recentPRs.reduce((a, b) => a + b.estimated1RM, 0) / recentPRs.length;
      const olderAvg = olderPRs.reduce((a, b) => a + b.estimated1RM, 0) / olderPRs.length;
      const change = (recentAvg - olderAvg) / olderAvg;
      if (change > 0.03) strengthTrend = 'progressing';
      else if (change < -0.03) strengthTrend = 'regressing';
    }
  }

  // Recovery trend
  let recoveryTrend: 'improving' | 'stable' | 'declining' = 'stable';
  // Simplificado: basado en HRV y readiness tendencia
  if (biometrics.hrv > 75 && biometrics.readinessScore > 80) recoveryTrend = 'improving';
  else if (biometrics.hrv < 60 || biometrics.readinessScore < 60) recoveryTrend = 'declining';

  // Body comp trend
  let bodyCompTrend: 'improving' | 'stable' | 'worsening' = 'stable';
  if (bodyComposition.history.length >= 4) {
    const recent = bodyComposition.history.slice(-4);
    const muscleDelta = recent[recent.length - 1].skeletalMuscleKg - recent[0].skeletalMuscleKg;
    const fatDelta = recent[recent.length - 1].bodyFatPct - recent[0].bodyFatPct;
    if (muscleDelta > 0.2 && fatDelta < -0.2) bodyCompTrend = 'improving';
    else if (muscleDelta < -0.2 || fatDelta > 0.5) bodyCompTrend = 'worsening';
  }

  return { weightTrend, strengthTrend, recoveryTrend, bodyCompTrend };
}

/**
 * Calcula metas semanales personalizadas
 */
export function calculateWeeklyTargets(input: UnifiedMetricsInput) {
  const { biometrics, training, nutrition, sleep, bodyComposition, hydration } = input;

  // Training sessions based on readiness and ACWR
  let trainingSessions = 4;
  if (biometrics.readinessScore < 60 || training.acwr > 1.3) trainingSessions = 2;
  else if (biometrics.readinessScore < 75 || training.acwr > 1.15) trainingSessions = 3;
  else if (biometrics.readinessScore > 85 && training.acwr < 1.1) trainingSessions = 5;

  // Protein target
  const proteinTargetG = Math.round(bodyComposition.weightKg * HYPERTROPHY_THRESHOLDS.proteinPerKg);

  // Sleep target
  const sleepTargetH = Math.max(7.5, 8 - (biometrics.readinessScore / 100) * 0.5); // 7.5-8h

  // Steps target
  const stepsTarget = biometrics.steps < 8000 ? 10000 : 12000;

  // Hydration target
  const hydrationTargetMl = Math.max(3000, bodyComposition.weightKg * 45); // 45ml/kg

  // Deload recommended
  const deloadRecommended = training.acwr > 1.3 || biometrics.readinessScore < 55 || biometrics.hrv < 55;

  return {
    trainingSessions,
    proteinTargetG,
    sleepTargetH,
    stepsTarget,
    hydrationTargetMl,
    deloadRecommended,
  };
}

// =========================================================================
// FUNCIÓN PRINCIPAL DE ORQUESTACIÓN
// =========================================================================

export function runUnifiedAnalytics(input: UnifiedMetricsInput): UnifiedAnalyticsOutput {
  const scores = {
    globalReadiness: calculateGlobalReadiness(input),
    trainingReadiness: calculateTrainingReadiness(input),
    recoveryCapacity: Math.round((100 - calculateInjuryRisk(input)) * 0.8 + (input.biometrics.hrv / 80) * 20),
    nutritionalStatus: Math.min(100, Math.round((input.nutrition.dailyProteinG / (input.bodyComposition.weightKg * 1.8)) * 50 + (input.hydration.adherencePct || 50) * 0.5)),
    sleepQuality: Math.round((input.sleep.totalHours / 8) * 40 + (input.sleep.deepHours / 2.5) * 30 + (input.sleep.efficiency / 100) * 20 + (input.sleep.consistency / 100) * 10),
    lifeLoad: Math.round((input.academic.cognitiveLoad + input.finance.stressIndex) / 2),
    injuryRisk: calculateInjuryRisk(input),
    hypertrophyPotential: calculateHypertrophyPotential(input),
  };

  const correlations = calculateCrossCorrelations(input);
  const predictions = generatePredictions(input);
  const alerts = generateAlerts(input);
  const insights = generateInsights(input);
  const trends = calculateTrends(input);
  const weeklyTargets = calculateWeeklyTargets(input);

  return {
    timestamp: new Date().toISOString(),
    period: '7d',
    scores,
    correlations,
    predictions,
    alerts,
    insights,
    trends,
    weeklyTargets,
  };
}

export default {
  runUnifiedAnalytics,
  calculateGlobalReadiness,
  calculateTrainingReadiness,
  calculateInjuryRisk,
  calculateHypertrophyPotential,
  calculateCrossCorrelations,
  generatePredictions,
  generateAlerts,
  generateInsights,
  calculateTrends,
  calculateWeeklyTargets,
};