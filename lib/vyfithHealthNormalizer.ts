/**
 * VYFITH — Normalizador Único de Telemetría (Android VYFITH_APP + Firestore + Web)
 * Unifica los esquemas de `roomMetrics`, `extendedBiometrics`, `hydrationState` y `superAppSummary`
 * para que ningún campo de las 24 categorías de Google Health Connect ni de los 4 módulos de la
 * Super-App se pierda o se sobrescriba con 0 desde un emulador vacío.
 */

export interface NormalizedVyfithPayload {
  isBlankEmulator: boolean;
  deviceId: string;
  readinessScore: number | undefined;
  readinessCategory: string | undefined;
  steps: number;
  totalSleepHours: number;
  deepSleepHours: number;
  lightSleepHours: number | undefined;
  remSleepHours: number | undefined;
  awakeMinutes: number | undefined;
  awakeningsCount: number | undefined;
  sleepEfficiency: number | undefined;
  sleepStartTime: string | null;
  sleepEndTime: string | null;
  isFallbackRecentSleep: boolean;
  sleepDate: string | null;
  restingHeartRate: number | undefined;
  avgHeartRate: number | undefined;
  minHeartRate: number | undefined;
  maxHeartRate: number | undefined;
  hrv: number | undefined;
  spo2: number | undefined;
  caloriesBurned: number | undefined;
  activeCaloriesBurned: number | undefined;
  totalCaloriesBurned: number | undefined;
  basalMetabolicRateKcal: number | undefined;
  distanceMeters: number | undefined;
  activityMinutes: number | undefined;
  elevationGainedMeters: number | undefined;
  avgSpeedMps: number | undefined;
  powerWatts: number | undefined;
  respiratoryRateBpm: number | undefined;
  bloodPressureSystolic: number | undefined;
  bloodPressureDiastolic: number | undefined;
  bloodGlucoseMgDl: number | undefined;
  weightKg: number | undefined;
  bodyFatPct: number | undefined;
  leanBodyMassKg: number | undefined;
  boneMassKg: number | undefined;
  heightCm: number | undefined;
  hydrationLiters: number | undefined;
  nutritionCaloriesKcal: number | undefined;
  nutritionProteinGrams: number | undefined;
  nutritionCarbsGrams: number | undefined;
  nutritionFatGrams: number | undefined;
  watchActivitySummary: string | null;
  watchExerciseSessions: any[];
  hydrationState: any | null;
  nutritionState: any | null;
  latestMeasurement: any | null;
  financeSummary: any | null;
  closetSummary: any | null;
  notesSummary: any | null;
  geminiAnalysis: {
    diagnostico?: string;
    recomendacionMuscular?: string;
    gruposPriorizar?: string[];
    gruposDescanso?: string[];
    tiempoRecuperacionHoras?: number;
  };
}

function numOrUndef(val: any): number | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function posOrUndef(...vals: any[]): number | undefined {
  for (const v of vals) {
    const n = numOrUndef(v);
    if (n !== undefined && n > 0) return n;
  }
  return undefined;
}

function strOrNull(...vals: any[]): string | null {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return null;
}

export function isWatchCardioLabel(name?: string | null): boolean {
  if (!name) return false;
  const low = name.toLowerCase();
  return (
    low.includes('[reloj]') ||
    low.includes('del reloj') ||
    low.includes('sin sesiones registradas') ||
    low.includes('ciclismo') ||
    low.includes('caminata') ||
    low.includes('correr') ||
    low.includes('running') ||
    low.includes('cycling') ||
    low.includes('walking')
  );
}

export function normalizeIncomingVyfithPayload(raw: any): NormalizedVyfithPayload {
  const rm = raw?.roomMetrics || {};
  const extBio = raw?.extendedBiometrics || {};
  const legacyExt = raw?.hydrationState?.extendedHealthConnect || {};

  const deviceId = String(raw?.deviceId || '').trim();
  const steps = Number(
    posOrUndef(rm.steps, extBio.steps, legacyExt.steps, raw?.steps, raw?.stepCount) ?? 0
  );

  // Sueño total (horas) — acepta totalSleepHours o extendedBiometrics.sleepMinutes / 60
  const extSleepHours =
    numOrUndef(extBio.sleepMinutes) && Number(extBio.sleepMinutes) > 0
      ? Number((Number(extBio.sleepMinutes) / 60).toFixed(2))
      : undefined;
  const totalSleepHours = Number(
    posOrUndef(
      rm.totalSleepHours,
      extSleepHours,
      legacyExt.totalSleepHours,
      raw?.totalSleepHours,
      raw?.sleepHours,
      raw?.sleepTotalHours
    ) ?? 0
  );

  const isBlankEmulator =
    (deviceId.includes('sdk_gphone') ||
      deviceId.includes('Emulator') ||
      deviceId.includes('x86') ||
      deviceId.includes('generic')) &&
    steps === 0 &&
    totalSleepHours === 0;

  // Fases de sueño (convertir minutos de Android extendedBiometrics a horas con 2 decimales)
  const extDeepHours =
    numOrUndef(extBio.deepSleepMinutes) && Number(extBio.deepSleepMinutes) > 0
      ? Number((Number(extBio.deepSleepMinutes) / 60).toFixed(2))
      : undefined;
  const extLightHours =
    numOrUndef(extBio.lightSleepMinutes) && Number(extBio.lightSleepMinutes) > 0
      ? Number((Number(extBio.lightSleepMinutes) / 60).toFixed(2))
      : undefined;
  const extRemHours =
    numOrUndef(extBio.remSleepMinutes) && Number(extBio.remSleepMinutes) > 0
      ? Number((Number(extBio.remSleepMinutes) / 60).toFixed(2))
      : undefined;

  const deepSleepHours = Number(
    posOrUndef(rm.deepSleepHours, extDeepHours, legacyExt.deepSleepHours, raw?.deepSleepHours) ?? 0
  );
  const lightSleepHours = posOrUndef(
    rm.lightSleepHours,
    extLightHours,
    legacyExt.lightSleepHours,
    raw?.lightSleepHours
  );
  const remSleepHours = posOrUndef(
    rm.remSleepHours,
    extRemHours,
    legacyExt.remSleepHours,
    raw?.remSleepHours
  );
  const awakeMinutes = posOrUndef(
    rm.awakeMinutes,
    extBio.awakeSleepMinutes,
    extBio.awakeMinutes,
    legacyExt.awakeMinutes,
    raw?.awakeMinutes
  );
  const awakeningsCount = posOrUndef(
    rm.awakeningsCount,
    extBio.awakeningsCount,
    legacyExt.awakeningsCount,
    raw?.awakeningsCount
  );
  const sleepEfficiency = posOrUndef(
    rm.sleepEfficiency,
    extBio.sleepEfficiency,
    legacyExt.sleepEfficiency,
    raw?.sleepEfficiency
  );
  const sleepStartTime = strOrNull(
    rm.sleepStartTime,
    extBio.sleepStartTime,
    legacyExt.sleepStartTime,
    raw?.sleepStartTime
  );
  const sleepEndTime = strOrNull(
    rm.sleepEndTime,
    extBio.sleepEndTime,
    legacyExt.sleepEndTime,
    raw?.sleepEndTime
  );
  const sleepDate = strOrNull(
    rm.sleepDate,
    extBio.sleepRecordDate,
    legacyExt.sleepDate,
    raw?.sleepDate,
    raw?.sleepRecordDate
  );
  const isFallbackRecentSleep = Boolean(
    rm.isFallbackRecentSleep ??
      extBio.isFallbackRecentSleep ??
      legacyExt.isFallbackRecentSleep ??
      raw?.isFallbackRecentSleep
  );

  // Cardiovascular, HRV & Signos Vitales
  const restingHeartRate = posOrUndef(
    rm.restingHeartRate,
    extBio.restingHeartRateBpm,
    legacyExt.restingHeartRate,
    raw?.restingHeartRate,
    raw?.heartRate
  );
  const avgHeartRate = posOrUndef(
    rm.avgHeartRate,
    extBio.avgHeartRateBpm,
    legacyExt.avgHeartRate,
    raw?.avgHeartRate
  );
  const minHeartRate = posOrUndef(
    rm.minHeartRate,
    extBio.minHeartRateBpm,
    legacyExt.minHeartRate,
    raw?.minHeartRate
  );
  const maxHeartRate = posOrUndef(
    rm.maxHeartRate,
    extBio.maxHeartRateBpm,
    legacyExt.maxHeartRate,
    raw?.maxHeartRate
  );
  const hrv = posOrUndef(rm.hrv, extBio.hrvRmssdMs, legacyExt.hrv, raw?.hrv, raw?.hrvRmssdMs);
  const spo2 = posOrUndef(rm.spo2, extBio.spo2, legacyExt.spo2, raw?.spo2);
  const respiratoryRateBpm = posOrUndef(
    rm.respiratoryRateBpm,
    extBio.respiratoryRateBpm,
    legacyExt.respiratoryRateBpm,
    raw?.respiratoryRateBpm
  );
  const bloodPressureSystolic = posOrUndef(
    rm.bloodPressureSystolic,
    extBio.bloodPressureSystolicMmHg,
    legacyExt.bloodPressureSystolic,
    raw?.bloodPressureSystolic
  );
  const bloodPressureDiastolic = posOrUndef(
    rm.bloodPressureDiastolic,
    extBio.bloodPressureDiastolicMmHg,
    legacyExt.bloodPressureDiastolic,
    raw?.bloodPressureDiastolic
  );

  // Glucosa: Android Health Connect guarda mmol/L -> convertir a mg/dL si llega en mmol/L (< 35)
  const rawGlucoseMgDl = posOrUndef(
    rm.bloodGlucoseMgDl,
    legacyExt.bloodGlucoseMgDl,
    raw?.bloodGlucoseMgDl
  );
  const rawGlucoseMmol = posOrUndef(extBio.bloodGlucoseMmolL, raw?.bloodGlucoseMmolL);
  const bloodGlucoseMgDl =
    rawGlucoseMgDl ??
    (rawGlucoseMmol !== undefined
      ? Number((rawGlucoseMmol > 35 ? rawGlucoseMmol : rawGlucoseMmol * 18.018).toFixed(1))
      : undefined);

  // Energía & Movimiento
  const caloriesBurned = posOrUndef(
    rm.caloriesBurned,
    extBio.activeCaloriesBurned,
    legacyExt.caloriesBurned,
    raw?.caloriesBurned
  );
  const activeCaloriesBurned = posOrUndef(
    rm.activeCaloriesBurned,
    extBio.activeCaloriesBurned,
    legacyExt.activeCaloriesBurned,
    raw?.activeCaloriesBurned
  );
  const totalCaloriesBurned = posOrUndef(
    rm.totalCaloriesBurned,
    extBio.totalCaloriesBurned,
    legacyExt.totalCaloriesBurned,
    raw?.totalCaloriesBurned
  );
  const basalMetabolicRateKcal = posOrUndef(
    rm.basalMetabolicRateKcal,
    extBio.basalMetabolicRateKcal,
    legacyExt.basalMetabolicRateKcal,
    raw?.basalMetabolicRateKcal
  );
  const distanceMeters = posOrUndef(
    rm.distanceMeters,
    extBio.distanceMeters,
    legacyExt.distanceMeters,
    raw?.distanceMeters
  );
  const activityMinutes = posOrUndef(
    rm.activityMinutes,
    extBio.activityMinutes,
    legacyExt.activityMinutes,
    raw?.activityMinutes
  );
  const elevationGainedMeters = posOrUndef(
    rm.elevationGainedMeters,
    extBio.elevationGainedMeters,
    legacyExt.elevationGainedMeters,
    raw?.elevationGainedMeters
  );
  const avgSpeedMps = posOrUndef(
    rm.avgSpeedMps,
    extBio.avgSpeedMps,
    legacyExt.avgSpeedMps,
    raw?.avgSpeedMps
  );
  const powerWatts = posOrUndef(
    rm.powerWatts,
    extBio.powerWatts,
    legacyExt.powerWatts,
    raw?.powerWatts
  );

  // Composición corporal & Hidratación/Nutrición HC
  const latestMeasurement =
    raw?.latestMeasurement ||
    extBio.measurements17Points ||
    raw?.hydrationState?.latestMeasurement ||
    null;

  const weightKg = posOrUndef(
    rm.weightKg,
    extBio.weightKg,
    latestMeasurement?.weightKg,
    raw?.weightKg
  );
  const bodyFatPct = posOrUndef(
    rm.bodyFatPct,
    extBio.bodyFatPercentage,
    latestMeasurement?.bodyFatPct,
    raw?.bodyFatPct
  );
  const leanBodyMassKg = posOrUndef(
    rm.leanBodyMassKg,
    extBio.leanBodyMassKg,
    raw?.leanBodyMassKg
  );
  const boneMassKg = posOrUndef(rm.boneMassKg, extBio.boneMassKg, raw?.boneMassKg);
  const heightCm = posOrUndef(
    rm.heightCm,
    extBio.heightCm,
    latestMeasurement?.heightCm,
    raw?.heightCm
  );
  const hydrationLiters = posOrUndef(
    rm.hydrationLiters,
    extBio.hydrationLitersHc,
    legacyExt.hydrationLiters,
    raw?.hydrationLiters
  );
  const nutritionCaloriesKcal = posOrUndef(
    rm.nutritionCaloriesKcal,
    extBio.nutritionCaloriesHc,
    legacyExt.nutritionCaloriesKcal,
    raw?.nutritionCaloriesKcal
  );
  const nutritionProteinGrams = posOrUndef(
    rm.nutritionProteinGrams,
    extBio.nutritionProteinHc,
    legacyExt.nutritionProteinGrams,
    raw?.nutritionProteinGrams
  );
  const nutritionCarbsGrams = posOrUndef(
    rm.nutritionCarbsGrams,
    extBio.nutritionCarbsHc,
    raw?.nutritionCarbsGrams
  );
  const nutritionFatGrams = posOrUndef(
    rm.nutritionFatGrams,
    extBio.nutritionFatHc,
    raw?.nutritionFatGrams
  );

  // Actividad del reloj (cardio/ciclismo) separada de las sesiones de fuerza Hevy
  const incomingWorkoutLabel = strOrNull(
    rm.watchActivitySummary,
    raw?.hevyWorkouts?.lastWorkoutName,
    raw?.lastWorkoutName
  );
  const watchActivitySummary =
    incomingWorkoutLabel && isWatchCardioLabel(incomingWorkoutLabel) && !incomingWorkoutLabel.toLowerCase().includes('sin sesiones')
      ? incomingWorkoutLabel
      : strOrNull(rm.watchActivitySummary);

  // Sesiones de ejercicio reales del reloj (hoy + historial reciente de 30-60 días desde Health Connect)
  const rawWatchSessionsPool: any[] = [];
  for (const list of [
    extBio.exerciseSessions,
    extBio.recentExerciseSessions,
    extBio.recentExerciseSessions7d,
    raw?.exerciseSessions,
    raw?.recentExerciseSessions,
  ]) {
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item && typeof item === 'object') {
          rawWatchSessionsPool.push(item);
        }
      }
    }
  }
  const watchSessionsDedup = new Map<string, any>();
  for (const s of rawWatchSessionsPool) {
    const key = String(s.id || `${s.dateIso || ''}|${s.startTimeText || ''}|${s.durationMinutes || ''}`);
    if (!watchSessionsDedup.has(key)) {
      watchSessionsDedup.set(key, s);
    }
  }
  const watchExerciseSessions = Array.from(watchSessionsDedup.values());

  // Módulos Super-App (acepta tanto `superAppSummary` de AI Studio como legacy `*Module`)
  const superSum = raw?.superAppSummary || {};
  const rawFinance = raw?.financeModule || raw?.hydrationState?.financeModule || superSum.finance || null;
  const dedupedFinanceAccounts = Array.isArray(rawFinance?.accounts)
    ? Array.from(
        new Map<string, any>(
          rawFinance.accounts
            .filter((a: any) => a && typeof a.name === 'string')
            .map((a: any) => [String(a.name).trim().toLowerCase(), a])
        ).values()
      )
    : undefined;
  const computedFinanceTotal =
    dedupedFinanceAccounts && dedupedFinanceAccounts.length > 0
      ? dedupedFinanceAccounts.reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0)
      : Number(rawFinance?.totalLiquidityCop ?? rawFinance?.totalBalanceCop ?? 0);

  const financeSummary =
    rawFinance &&
    typeof rawFinance === 'object' &&
    (Number(dedupedFinanceAccounts?.length ?? rawFinance.accountsCount ?? 0) > 0 ||
      computedFinanceTotal > 0)
      ? {
          totalLiquidityCop: Number(computedFinanceTotal.toFixed(2)),
          accountsCount: Number(dedupedFinanceAccounts?.length ?? rawFinance.accountsCount ?? 0),
          dailyLogsCount: Number(rawFinance.dailyLogsCount ?? rawFinance.recentLogsCount ?? rawFinance.recentLogs?.length ?? 0),
          accounts: dedupedFinanceAccounts,
          recentLogs: Array.isArray(rawFinance.recentLogs) ? rawFinance.recentLogs : undefined,
          medellinEstimatedCostCop: rawFinance.medellinEstimatedCostCop,
          medellinAvailableFundCop: rawFinance.medellinAvailableFundCop,
        }
      : null;

  const rawCloset = raw?.closetModule || raw?.hydrationState?.closetModule || superSum.closet || null;
  const closetSummary =
    rawCloset &&
    typeof rawCloset === 'object' &&
    Number(rawCloset.totalItems ?? rawCloset.totalGarments ?? 0) > 0
      ? {
          totalItems: Number(rawCloset.totalItems ?? rawCloset.totalGarments ?? 0),
          favoriteItems: Number(rawCloset.favoriteItems ?? rawCloset.favoriteGarments ?? 0),
          categoriesCount: rawCloset.categoriesCount || rawCloset.categoriesBreakdown || {},
          recentItems: Array.isArray(rawCloset.recentItems) ? rawCloset.recentItems : undefined,
        }
      : null;

  const rawNotes = raw?.notesModule || raw?.hydrationState?.notesModule || superSum.notes || null;
  const notesSummary =
    rawNotes &&
    typeof rawNotes === 'object' &&
    (Number(rawNotes.totalNotes ?? 0) > 0 ||
      Number(rawNotes.referencesCount ?? 0) > 0 ||
      Number(rawNotes.totalBookReferences ?? 0) + Number(rawNotes.totalArticleReferences ?? 0) > 0)
      ? {
          totalNotes: Number(rawNotes.totalNotes ?? 0),
          referencesCount: Number(
            rawNotes.referencesCount ??
              Number(rawNotes.totalBookReferences ?? 0) + Number(rawNotes.totalArticleReferences ?? 0)
          ),
          completedResearchCount: Number(rawNotes.completedResearchCount ?? 0),
          recentNotes: Array.isArray(rawNotes.recentNotes) ? rawNotes.recentNotes : undefined,
        }
      : null;

  const hydrationState = raw?.hydrationState || null;
  const nutritionState = raw?.nutritionState || raw?.hydrationState?.nutritionCurrent || null;

  const readinessScore = posOrUndef(raw?.readinessScore);
  const readinessCategory = strOrNull(raw?.readinessCategory) || undefined;

  const geminiAnalysis = {
    diagnostico: strOrNull(raw?.dailyCoachAiReport, raw?.geminiAnalysis?.diagnostico, raw?.diagnostico) || undefined,
    recomendacionMuscular: strOrNull(raw?.geminiAnalysis?.recomendacionMuscular, raw?.recomendacionMuscular) || undefined,
    gruposPriorizar: Array.isArray(raw?.geminiAnalysis?.gruposPriorizar)
      ? raw.geminiAnalysis.gruposPriorizar
      : Array.isArray(raw?.gruposPriorizar)
      ? raw.gruposPriorizar
      : undefined,
    gruposDescanso: Array.isArray(raw?.geminiAnalysis?.gruposDescanso)
      ? raw.geminiAnalysis.gruposDescanso
      : Array.isArray(raw?.gruposDescanso)
      ? raw.gruposDescanso
      : undefined,
    tiempoRecuperacionHoras: numOrUndef(raw?.geminiAnalysis?.tiempoRecuperacionHoras ?? raw?.tiempoRecuperacionHoras),
  };

  return {
    isBlankEmulator,
    deviceId,
    readinessScore,
    readinessCategory,
    steps,
    totalSleepHours,
    deepSleepHours,
    lightSleepHours,
    remSleepHours,
    awakeMinutes,
    awakeningsCount,
    sleepEfficiency,
    sleepStartTime,
    sleepEndTime,
    isFallbackRecentSleep,
    sleepDate,
    restingHeartRate,
    avgHeartRate,
    minHeartRate,
    maxHeartRate,
    hrv,
    spo2,
    caloriesBurned,
    activeCaloriesBurned,
    totalCaloriesBurned,
    basalMetabolicRateKcal,
    distanceMeters,
    activityMinutes,
    elevationGainedMeters,
    avgSpeedMps,
    powerWatts,
    respiratoryRateBpm,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    bloodGlucoseMgDl,
    weightKg,
    bodyFatPct,
    leanBodyMassKg,
    boneMassKg,
    heightCm,
    hydrationLiters,
    nutritionCaloriesKcal,
    nutritionProteinGrams,
    nutritionCarbsGrams,
    nutritionFatGrams,
    watchActivitySummary,
    watchExerciseSessions,
    hydrationState,
    nutritionState,
    latestMeasurement,
    financeSummary,
    closetSummary,
    notesSummary,
    geminiAnalysis,
  };
}
