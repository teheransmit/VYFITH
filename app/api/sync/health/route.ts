import { NextRequest, NextResponse } from 'next/server';
import { getHealthSyncState, updateHealthSyncState, HealthObservation } from '@/lib/healthStore';
import { INITIAL_FEMMTO_STATE, createFemmtoEntry } from '@/lib/femmtoStore';
import { applyWaterPayload } from '@/lib/waterStore';
import { getDailyNutritionState, saveDailyNutritionState } from '@/lib/nutritionStore';
import { saveBodyMeasurement } from '@/lib/bodyMeasurementsStore';
import { readStoredFinanceState, writeStoredFinanceState } from '@/lib/financeServerStore';
import { readStoredWorkouts } from '@/lib/hevySyncService';
import { normalizeIncomingVyfithPayload, isWatchCardioLabel } from '@/lib/vyfithHealthNormalizer';
import fs from 'fs';
import path from 'path';

function resolveRealHevySummary(prevSummary?: any) {
  try {
    const stored = readStoredWorkouts();
    if (Array.isArray(stored) && stored.length > 0) {
      const latest = stored[0];
      return {
        lastWorkoutName: latest.name,
        totalVolumeKg: Math.round(latest.totalVolumeKg || 0),
        setsCompleted: Number(latest.totalSets || 0),
        date: latest.date || '',
      };
    }
  } catch {
    // fallback below
  }
  if (prevSummary && prevSummary.lastWorkoutName && !isWatchCardioLabel(prevSummary.lastWorkoutName)) {
    return prevSummary;
  }
  return {
    lastWorkoutName: 'Sin sincronizar',
    totalVolumeKg: 0,
    setsCompleted: 0,
    date: '',
  };
}

function persistJsonModuleFile(filename: string, payload: any) {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error persisting ${filename}:`, err);
  }
}

function finiteOrUndefined(val: any): number | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function positiveOrFallback(val: any, fallback: number | undefined): number | undefined {
  const n = finiteOrUndefined(val);
  return n !== undefined && n > 0 ? n : fallback;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-device-id',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function persistStateToDisk(state: any) {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'real_health_state.json');
    fs.writeFileSync(jsonPath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error persisting health state to disk:', err);
  }
}

function loadStateFromDisk() {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'real_health_state.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading health state from disk:', err);
  }
  return null;
}

export async function GET() {
  const diskData = loadStateFromDisk();
  let state = getHealthSyncState();
  if (diskData && diskData.currentMetrics) {
    state = updateHealthSyncState((s) => {
      Object.assign(s, diskData);
      // Correlación automática: si vyfithData.hevySummary tenía actividad cardio del reloj o dato viejo, sincronizarlo con Hevy real
      const realHevy = resolveRealHevySummary(s.vyfithData?.hevySummary);
      if (realHevy.totalVolumeKg > 0 && s.vyfithData) {
        if (
          !s.vyfithData.hevySummary?.lastWorkoutName ||
          isWatchCardioLabel(s.vyfithData.hevySummary.lastWorkoutName) ||
          s.vyfithData.hevySummary.totalVolumeKg !== realHevy.totalVolumeKg
        ) {
          if (
            s.vyfithData.hevySummary?.lastWorkoutName &&
            isWatchCardioLabel(s.vyfithData.hevySummary.lastWorkoutName) &&
            !s.vyfithData.roomMetrics?.watchActivitySummary
          ) {
            s.vyfithData.roomMetrics.watchActivitySummary = s.vyfithData.hevySummary.lastWorkoutName;
            s.currentMetrics.watchActivitySummary = s.vyfithData.hevySummary.lastWorkoutName;
          }
          s.vyfithData.hevySummary = realHevy;
        }
      }
      // Preservar fases de sueño en roomMetrics si existen en currentMetrics
      if (s.vyfithData?.roomMetrics && s.currentMetrics) {
        if (!s.vyfithData.roomMetrics.lightSleepHours && s.currentMetrics.lightSleepHours) {
          s.vyfithData.roomMetrics.lightSleepHours = s.currentMetrics.lightSleepHours;
        }
        if (!s.vyfithData.roomMetrics.remSleepHours && s.currentMetrics.remSleepHours) {
          s.vyfithData.roomMetrics.remSleepHours = s.currentMetrics.remSleepHours;
        }
        if (s.vyfithData.roomMetrics.awakeMinutes === undefined && s.currentMetrics.awakeMinutes !== undefined) {
          s.vyfithData.roomMetrics.awakeMinutes = s.currentMetrics.awakeMinutes;
        }
        if (s.vyfithData.roomMetrics.awakeningsCount === undefined && s.currentMetrics.awakeningsCount !== undefined) {
          s.vyfithData.roomMetrics.awakeningsCount = s.currentMetrics.awakeningsCount;
        }
        if (s.vyfithData.roomMetrics.sleepEfficiency === undefined && s.currentMetrics.sleepEfficiency !== undefined) {
          s.vyfithData.roomMetrics.sleepEfficiency = s.currentMetrics.sleepEfficiency;
        }
      }
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: state,
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Body can receive either:
    // 1) VYFITH_APP payload: { source: "VYFITH_APP", readinessScore, geminiAnalysis, roomMetrics, hevyWorkouts }
    // 2) HL7 FHIR observations: { health: [...], deviceId, changesToken }
    // 3) Simulation triggers: { simulateVyfith: true } or { simulate: true }
    
    let incomingObservations: HealthObservation[] = [];
    const nowIso = new Date().toISOString();
    let newStepsDelta = 0;
    let newHrv = 0;
    let newHr = 0;
    let newSleep = 0;
    let newWeight = 0;
    let newBodyFat = 0;
    let newMuscle = 0;
    let newBmi = 0;

    // Caso 0: Recargar datos reales desde data/real_health_state.json (Google Health & Hevy)
    if (body.source === 'RELOAD_REAL_DATA' || body.reloadReal) {
      const diskData = loadStateFromDisk();
      if (diskData) {
        diskData.lastSyncTime = nowIso;
        if (diskData.vyfithData) {
          diskData.vyfithData.lastSyncTimestamp = nowIso;
        }
        if (Array.isArray(diskData.recentObservations)) {
          diskData.recentObservations.forEach((obs: any) => {
            obs.effectiveDateTime = nowIso;
          });
        }
        const updated = updateHealthSyncState((state) => {
          Object.assign(state, diskData);
        });
        persistStateToDisk(updated);
        return NextResponse.json(
          {
            success: true,
            message: '¡Datos de Google Health y Hevy sincronizados exitosamente desde disco!',
            data: updated,
          },
          { headers: corsHeaders }
        );
      }
    }

    // Caso Femmto: Registro / Sincronización de Báscula Femmto
    if (body.action === 'add_femmto_record' || body.femmtoRecord || (body.weightKg && !body.source)) {
      const diskData = loadStateFromDisk() || getHealthSyncState();
      const currentFemmto = diskData.femmtoData || INITIAL_FEMMTO_STATE;

      const newEntry = createFemmtoEntry({
        weightKg: Number(body.weightKg || body.femmtoRecord?.weightKg || 55.7),
        skeletalMuscleKg: Number(body.skeletalMuscleKg || body.femmtoRecord?.skeletalMuscleKg || 25.1),
        bodyFatPct: Number(body.bodyFatPct || body.femmtoRecord?.bodyFatPct || 10.6),
        date: body.date || body.femmtoRecord?.date,
        time: body.time || body.femmtoRecord?.time,
        dateTime: body.dateTime || body.femmtoRecord?.dateTime || nowIso,
        heightCm: currentFemmto.user?.heightCm || 172,
      });

      const updatedHistory = [newEntry, ...(currentFemmto.history || [])];

      const updatedLatest = {
        ...currentFemmto.latest,
        weight: { ...currentFemmto.latest.weight, value: newEntry.weightKg },
        skeletalMuscle: { ...currentFemmto.latest.skeletalMuscle, value: newEntry.skeletalMuscleKg },
        bodyFatPct: { ...currentFemmto.latest.bodyFatPct, value: newEntry.bodyFatPct },
        bmi: { ...currentFemmto.latest.bmi, value: newEntry.bmi },
        fatMass: { ...currentFemmto.latest.fatMass, value: newEntry.fatMassKg || currentFemmto.latest.fatMass.value },
        water: { ...currentFemmto.latest.water, value: newEntry.waterL || currentFemmto.latest.water.value },
        protein: { ...currentFemmto.latest.protein, value: newEntry.proteinKg || currentFemmto.latest.protein.value },
        minerals: { ...currentFemmto.latest.minerals, value: newEntry.mineralsKg || currentFemmto.latest.minerals.value },
        leanBodyMass: { ...currentFemmto.latest.leanBodyMass, value: newEntry.leanBodyMassKg || currentFemmto.latest.leanBodyMass.value },
        fatFreeMass: { ...currentFemmto.latest.fatFreeMass, value: newEntry.fatFreeMassKg || currentFemmto.latest.fatFreeMass.value },
      };

      const updatedFemmto = {
        ...currentFemmto,
        user: {
          ...currentFemmto.user,
          lastMeasurementDateTime: `${newEntry.date} ${newEntry.time}`,
        },
        latest: updatedLatest,
        history: updatedHistory,
      };

      const nextToken = `femmto_sync_${Date.now()}`;
      const updated = updateHealthSyncState((state) => {
        state.lastSyncTime = nowIso;
        state.syncCount += 1;
        state.changesToken = nextToken;
        state.femmtoData = updatedFemmto;
        state.currentMetrics.weightKg = newEntry.weightKg;
        state.currentMetrics.bodyFatPct = newEntry.bodyFatPct;
        state.currentMetrics.skeletalMuscleKg = newEntry.skeletalMuscleKg;
        state.currentMetrics.bmi = newEntry.bmi;
        if (newEntry.waterL) state.currentMetrics.waterL = newEntry.waterL;
        if (newEntry.proteinKg) state.currentMetrics.proteinKg = newEntry.proteinKg;
        if (newEntry.mineralsKg) state.currentMetrics.mineralsKg = newEntry.mineralsKg;
        if (newEntry.fatMassKg) state.currentMetrics.fatMassKg = newEntry.fatMassKg;
        if (newEntry.leanBodyMassKg) state.currentMetrics.leanBodyMassKg = newEntry.leanBodyMassKg;
        if (newEntry.fatFreeMassKg) state.currentMetrics.fatFreeMassKg = newEntry.fatFreeMassKg;

        const weightObs: HealthObservation = {
          id: `vyfith-weight-femmto-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Composición Corporal - Báscula Femmto',
          code: {
            coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }],
          },
          valueQuantity: { value: newEntry.weightKg, unit: 'kg' },
          effectiveDateTime: newEntry.dateTime,
        };
        state.recentObservations = [weightObs, ...state.recentObservations].slice(0, 25);
      });

      persistStateToDisk(updated);

      return NextResponse.json(
        {
          success: true,
          message: `¡Pesaje de ${newEntry.weightKg} kg sincronizado exitosamente en formato Femmto!`,
          data: updated,
          record: newEntry,
        },
        { headers: corsHeaders }
      );
    }

    // Caso A: Simulación o Envío real desde VYFITH_APP (FitSync AI Android)
    if (body.source === 'VYFITH_APP' || body.simulateVyfith) {
      const isSimulated = Boolean(body.simulateVyfith);
      const prevDisk = loadStateFromDisk() || getHealthSyncState();
      const prevRoom: any = prevDisk?.vyfithData?.roomMetrics || {};
      const prevCur: any = prevDisk?.currentMetrics || {};

      // Normalizador unificado (roomMetrics + extendedBiometrics + superAppSummary + legacy)
      const norm = normalizeIncomingVyfithPayload(body);

      const incomingSleepHours = isSimulated ? 8.2 : norm.totalSleepHours;
      const incomingSteps = isSimulated ? Math.floor(Math.random() * 4000) + 9000 : norm.steps;
      const isBlankEmulator = !isSimulated && norm.isBlankEmulator;

      const preservePriorSleep =
        incomingSleepHours <= 0 && Number(prevCur?.sleepHours || prevRoom?.totalSleepHours || 0) > 0;

      const readinessScore = isSimulated
        ? Math.floor(Math.random() * 25) + 75 // 75 - 99
        : isBlankEmulator && Number(prevDisk?.vyfithData?.readinessScore || 0) > 0
        ? Number(prevDisk.vyfithData.readinessScore)
        : Number(norm.readinessScore ?? prevDisk?.vyfithData?.readinessScore ?? 75);

      const readinessCategory =
        readinessScore >= 80
          ? 'Vitalidad Óptima'
          : readinessScore >= 60
          ? 'Recuperación Adecuada'
          : 'Necesita Descanso';

      const prevGemini = prevDisk?.vyfithData?.geminiAnalysis;
      const geminiAnalysis =
        isBlankEmulator && prevGemini?.diagnostico
          ? prevGemini
          : {
              diagnostico: isSimulated
                ? 'Análisis Gemini AI: El atleta presenta una variabilidad cardíaca (HRV) alta de 78 ms y descanso reparador (2.2 h de sueño profundo). Fatiga del SNC mínima.'
                : norm.geminiAnalysis.diagnostico || prevGemini?.diagnostico || 'Evaluación médica deportiva completada.',
              recomendacionMuscular: isSimulated
                ? 'Día óptimo para levantamiento pesado de hipertrofia. Carga recomendada: RPE 8.5 en ejercicios básicos multiarticulares.'
                : norm.geminiAnalysis.recomendacionMuscular || prevGemini?.recomendacionMuscular || 'Continuar progresión planificada.',
              gruposPriorizar:
                norm.geminiAnalysis.gruposPriorizar || prevGemini?.gruposPriorizar || ['Espalda / Dorsales', 'Bíceps', 'Core'],
              gruposDescanso:
                norm.geminiAnalysis.gruposDescanso || prevGemini?.gruposDescanso || ['Piernas / Cuádriceps'],
              tiempoRecuperacionHoras:
                norm.geminiAnalysis.tiempoRecuperacionHoras ?? prevGemini?.tiempoRecuperacionHoras ?? 0,
            };

      const totalSleepHours = preservePriorSleep
        ? Number(prevRoom?.totalSleepHours ?? prevCur?.sleepHours ?? 0)
        : incomingSleepHours;

      const deepSleepHours = preservePriorSleep
        ? Number(prevRoom?.deepSleepHours ?? prevCur?.deepSleepHours ?? 0)
        : Number(
            positiveOrFallback(
              norm.deepSleepHours,
              isSimulated ? 2.3 : prevRoom?.deepSleepHours ?? prevCur?.deepSleepHours ?? 0
            ) ?? 0
          );

      // Siempre preservar fases de sueño previas válidas si el payload entrante no trae ese detalle
      const lightSleepHours = positiveOrFallback(
        preservePriorSleep ? undefined : norm.lightSleepHours,
        prevRoom?.lightSleepHours ?? prevCur?.lightSleepHours
      );

      const remSleepHours = positiveOrFallback(
        preservePriorSleep ? undefined : norm.remSleepHours,
        prevRoom?.remSleepHours ?? prevCur?.remSleepHours
      );

      const awakeMinutes = positiveOrFallback(
        preservePriorSleep ? undefined : norm.awakeMinutes,
        prevRoom?.awakeMinutes ?? prevCur?.awakeMinutes
      );

      const awakeningsCount = positiveOrFallback(
        preservePriorSleep ? undefined : norm.awakeningsCount,
        prevRoom?.awakeningsCount ?? prevCur?.awakeningsCount
      );

      const sleepEfficiency = positiveOrFallback(
        preservePriorSleep ? undefined : norm.sleepEfficiency,
        prevRoom?.sleepEfficiency ?? prevCur?.sleepEfficiency
      );

      const sleepStartTime = preservePriorSleep
        ? prevRoom?.sleepStartTime ?? prevCur?.sleepStartTime ?? null
        : norm.sleepStartTime ?? prevRoom?.sleepStartTime ?? prevCur?.sleepStartTime ?? null;

      const sleepEndTime = preservePriorSleep
        ? prevRoom?.sleepEndTime ?? prevCur?.sleepEndTime ?? null
        : norm.sleepEndTime ?? prevRoom?.sleepEndTime ?? prevCur?.sleepEndTime ?? null;

      const isFallbackRecentSleep = preservePriorSleep
        ? Boolean(prevRoom?.isFallbackRecentSleep)
        : Boolean(norm.isFallbackRecentSleep);

      const sleepDate = preservePriorSleep
        ? prevRoom?.sleepDate ?? null
        : norm.sleepDate ?? prevRoom?.sleepDate ?? null;

      const steps =
        isBlankEmulator && Number(prevRoom?.steps ?? prevCur?.steps ?? 0) > 0
          ? Number(prevRoom?.steps ?? prevCur?.steps ?? 0)
          : incomingSteps;

      const restingHeartRate = Number(
        positiveOrFallback(
          norm.restingHeartRate,
          prevRoom?.restingHeartRate ?? prevCur?.heartRate ?? (isSimulated ? Math.floor(Math.random() * 8) + 56 : 62)
        )
      );

      const spo2 = Number(positiveOrFallback(norm.spo2, prevRoom?.spo2 ?? prevCur?.spo2 ?? 97));

      const caloriesBurned =
        isBlankEmulator && Number(prevRoom?.caloriesBurned ?? 0) > 0
          ? Number(prevRoom.caloriesBurned)
          : Number(norm.caloriesBurned ?? (isSimulated ? 2450 : steps * 0.04));

      const avgHeartRate = positiveOrFallback(norm.avgHeartRate, prevRoom?.avgHeartRate ?? prevCur?.avgHeartRate);
      const minHeartRate = positiveOrFallback(norm.minHeartRate, prevRoom?.minHeartRate ?? prevCur?.minHeartRate);
      const maxHeartRate = positiveOrFallback(norm.maxHeartRate, prevRoom?.maxHeartRate ?? prevCur?.maxHeartRate);
      const hrvVal = positiveOrFallback(norm.hrv, prevRoom?.hrv ?? prevCur?.hrv);
      const activeCaloriesBurned = positiveOrFallback(
        norm.activeCaloriesBurned,
        prevRoom?.activeCaloriesBurned ?? prevCur?.activeCaloriesBurned
      );
      const totalCaloriesBurned = positiveOrFallback(
        norm.totalCaloriesBurned,
        prevRoom?.totalCaloriesBurned ?? prevCur?.totalCaloriesBurned
      );
      const basalMetabolicRateKcal = positiveOrFallback(
        norm.basalMetabolicRateKcal,
        prevRoom?.basalMetabolicRateKcal ?? prevCur?.basalMetabolicRateKcal
      );
      const distanceMeters = positiveOrFallback(
        norm.distanceMeters,
        prevRoom?.distanceMeters ?? prevCur?.distanceMeters
      );
      const activityMinutes = positiveOrFallback(
        norm.activityMinutes,
        prevRoom?.activityMinutes ?? prevCur?.activityMinutes
      );
      const elevationGainedMeters = positiveOrFallback(
        norm.elevationGainedMeters,
        prevRoom?.elevationGainedMeters ?? prevCur?.elevationGainedMeters
      );
      const avgSpeedMps = positiveOrFallback(norm.avgSpeedMps, prevRoom?.avgSpeedMps ?? prevCur?.avgSpeedMps);
      const powerWatts = positiveOrFallback(norm.powerWatts, prevRoom?.powerWatts ?? prevCur?.powerWatts);
      const respiratoryRateBpm = positiveOrFallback(
        norm.respiratoryRateBpm,
        prevRoom?.respiratoryRateBpm ?? prevCur?.respiratoryRateBpm
      );
      const bloodPressureSystolic = positiveOrFallback(
        norm.bloodPressureSystolic,
        prevRoom?.bloodPressureSystolic ?? prevCur?.bloodPressureSystolic
      );
      const bloodPressureDiastolic = positiveOrFallback(
        norm.bloodPressureDiastolic,
        prevRoom?.bloodPressureDiastolic ?? prevCur?.bloodPressureDiastolic
      );
      const bloodGlucoseMgDl = positiveOrFallback(
        norm.bloodGlucoseMgDl,
        prevRoom?.bloodGlucoseMgDl ?? prevCur?.bloodGlucoseMgDl
      );
      const weightKgVal = positiveOrFallback(norm.weightKg, prevCur?.weightKg);
      const bodyFatPctVal = positiveOrFallback(norm.bodyFatPct, prevCur?.bodyFatPct);
      const boneMassKgVal = positiveOrFallback(norm.boneMassKg, prevRoom?.boneMassKg ?? prevCur?.boneMassKg);
      const leanBodyMassKgVal = positiveOrFallback(
        norm.leanBodyMassKg,
        prevRoom?.leanBodyMassKg ?? prevCur?.leanBodyMassKg
      );
      const heightCmVal = positiveOrFallback(norm.heightCm, prevRoom?.heightCm ?? prevCur?.heightCm);
      const hydrationLitersVal = positiveOrFallback(
        norm.hydrationLiters,
        prevRoom?.hydrationLiters ?? prevCur?.hydrationLiters
      );
      const nutritionCaloriesKcal = positiveOrFallback(
        norm.nutritionCaloriesKcal,
        prevRoom?.nutritionCaloriesKcal
      );
      const nutritionProteinGrams = positiveOrFallback(
        norm.nutritionProteinGrams,
        prevRoom?.nutritionProteinGrams
      );
      const nutritionCarbsGrams = positiveOrFallback(
        norm.nutritionCarbsGrams,
        prevRoom?.nutritionCarbsGrams
      );
      const nutritionFatGrams = positiveOrFallback(norm.nutritionFatGrams, prevRoom?.nutritionFatGrams);
      const watchActivitySummary =
        norm.watchActivitySummary ?? prevRoom?.watchActivitySummary ?? prevCur?.watchActivitySummary ?? null;

      const roomMetrics = {
        steps,
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
        totalSleepHours,
        restingHeartRate,
        avgHeartRate,
        minHeartRate,
        maxHeartRate,
        hrv: hrvVal,
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
        boneMassKg: boneMassKgVal,
        leanBodyMassKg: leanBodyMassKgVal,
        heightCm: heightCmVal,
        hydrationLiters: hydrationLitersVal,
        nutritionCaloriesKcal,
        nutritionProteinGrams,
        nutritionCarbsGrams,
        nutritionFatGrams,
        watchActivitySummary,
      };

      // Correlación estricta: Hevy real viene de real_hevy_workouts.json; cardio del reloj va a watchActivitySummary
      const hevySummary = resolveRealHevySummary(prevDisk?.vyfithData?.hevySummary);

      // Persistir módulos adicionales de la Super-App si llegan en el paquete (soporta superAppSummary y *Module)
      const superAppSyncNext: any = prevDisk?.superAppSync ? { ...prevDisk.superAppSync } : {};
      superAppSyncNext.lastSyncedAt = nowIso;

      if (norm.hydrationState && typeof norm.hydrationState === 'object') {
        const h = norm.hydrationState;
        const totalMlVal = Number(h.totalIntakeMl ?? h.totalMl ?? 0);
        const goalMlVal = Number(h.dailyGoalMl ?? h.goalMl ?? 2900);
        if (totalMlVal > 0 || (Array.isArray(h.entries) && h.entries.length > 0)) {
          superAppSyncNext.hydrationState = h;
          applyWaterPayload({
            date: h.date,
            totalMl: totalMlVal,
            goalMl: goalMlVal,
            entries: Array.isArray(h.entries) ? h.entries : undefined,
          });
        }
      }

      if (norm.nutritionState && typeof norm.nutritionState === 'object') {
        const incomingNut = norm.nutritionState;
        superAppSyncNext.nutritionState = incomingNut;
        if (incomingNut.meals && typeof incomingNut.meals === 'object') {
          saveDailyNutritionState(incomingNut);
        } else if (Number(incomingNut.calories || 0) > 0 || Number(incomingNut.waterMl || 0) > 0) {
          const curNut = getDailyNutritionState();
          saveDailyNutritionState({
            ...curNut,
            date: incomingNut.date || curNut.date,
            current: {
              ...curNut.current,
              calories:
                Number(incomingNut.calories || 0) > 0
                  ? Number(incomingNut.calories)
                  : curNut.current.calories,
              protein:
                Number(incomingNut.protein || 0) > 0
                  ? Number(incomingNut.protein)
                  : curNut.current.protein,
              carbs:
                Number(incomingNut.carbs || 0) > 0 ? Number(incomingNut.carbs) : curNut.current.carbs,
              fat: Number(incomingNut.fat || 0) > 0 ? Number(incomingNut.fat) : curNut.current.fat,
              waterMl:
                Number(incomingNut.waterMl || 0) > 0
                  ? Number(incomingNut.waterMl)
                  : curNut.current.waterMl,
            },
          });
        }
      }

      if (norm.latestMeasurement && typeof norm.latestMeasurement === 'object' && Number(norm.latestMeasurement.weightKg || 0) > 0) {
        superAppSyncNext.latestMeasurement = norm.latestMeasurement;
        if (Number(norm.latestMeasurement.waistCm || 0) > 0 && body.persistMeasurement !== false) {
          saveBodyMeasurement(norm.latestMeasurement);
        }
      }

      if (norm.financeSummary && !isBlankEmulator) {
        superAppSyncNext.financeSummary = {
          ...(superAppSyncNext.financeSummary || {}),
          ...norm.financeSummary,
          lastUpdated: nowIso,
        };
        try {
          const currentFinance = readStoredFinanceState();
          const mergedFinance = {
            ...currentFinance,
            androidFinanceSync: {
              ...norm.financeSummary,
              syncedAt: nowIso,
            },
          } as any;
          writeStoredFinanceState(mergedFinance);
        } catch (err) {
          console.warn('Error syncing financeModule snapshot:', err);
        }
      }

      if (norm.closetSummary && !isBlankEmulator) {
        superAppSyncNext.closetSummary = {
          ...(superAppSyncNext.closetSummary || {}),
          ...norm.closetSummary,
          lastUpdated: nowIso,
        };
        persistJsonModuleFile('real_closet_state.json', {
          ...superAppSyncNext.closetSummary,
          lastSyncedAt: nowIso,
        });
      }

      if (norm.notesSummary && !isBlankEmulator) {
        superAppSyncNext.notesSummary = {
          ...(superAppSyncNext.notesSummary || {}),
          ...norm.notesSummary,
          lastUpdated: nowIso,
        };
        persistJsonModuleFile('real_notes_state.json', {
          ...superAppSyncNext.notesSummary,
          lastSyncedAt: nowIso,
        });
      }

      // Generar observaciones FHIR completas a partir de Health Connect & Room Database
      const makeObs = (
        key: string,
        code: string,
        display: string,
        category: string,
        value: number,
        unit: string
      ): HealthObservation => ({
        id: `vyfith-${key}-${Date.now()}`,
        resourceType: 'Observation',
        status: 'final',
        category,
        code: {
          coding: [{ system: 'http://loinc.org', code, display }],
        },
        valueQuantity: { value, unit },
        effectiveDateTime: nowIso,
      });

      incomingObservations = [
        makeObs('readiness', '77202-0', 'Athlete Readiness Score (0-100)', 'Recuperación / Readiness AI', readinessScore, 'score'),
        makeObs('steps', '55423-8', 'Number of steps', 'Health Connect - Pasos', roomMetrics.steps, 'steps'),
        makeObs('hr', '8867-4', 'Resting Heart Rate', 'Cardiovascular - Reposo', roomMetrics.restingHeartRate, 'bpm'),
        makeObs('sleep', '93832-4', 'Sleep duration total', 'Health Connect - Sueño', roomMetrics.totalSleepHours, 'hours'),
        makeObs('deep-sleep', '93831-6', 'Deep sleep duration', 'Health Connect - Arquitectura Sueño', roomMetrics.deepSleepHours, 'hours'),
        makeObs('spo2', '2708-6', 'Oxygen saturation (SpO2)', 'Oximetría Biométrica', roomMetrics.spo2, '%'),
        makeObs('cal', '41981-2', 'Active energy burned', 'Actividad Física - Calorías', roomMetrics.caloriesBurned, 'kcal'),
      ];

      if (remSleepHours !== undefined && remSleepHours > 0) {
        incomingObservations.push(makeObs('rem-sleep', '93830-8', 'REM sleep duration', 'Health Connect - Arquitectura Sueño', remSleepHours, 'hours'));
      }
      if (lightSleepHours !== undefined && lightSleepHours > 0) {
        incomingObservations.push(makeObs('light-sleep', '93829-0', 'Light sleep duration', 'Health Connect - Arquitectura Sueño', lightSleepHours, 'hours'));
      }
      if (hrvVal !== undefined && hrvVal > 0) {
        incomingObservations.push(makeObs('hrv', '80404-7', 'Heart rate variability (RMSSD)', 'Recuperación Autónoma (HRV)', hrvVal, 'ms'));
      }
      if (avgHeartRate !== undefined && avgHeartRate > 0) {
        incomingObservations.push(makeObs('hr-avg', '8867-4', 'Average Heart Rate', 'Cardiovascular - Promedio', avgHeartRate, 'bpm'));
      }
      if (distanceMeters !== undefined && distanceMeters > 0) {
        incomingObservations.push(makeObs('distance', '41950-7', 'Distance walked/run', 'Health Connect - Distancia', distanceMeters, 'm'));
      }
      if (totalCaloriesBurned !== undefined && totalCaloriesBurned > 0) {
        incomingObservations.push(makeObs('total-cal', '41979-6', 'Total calories burned', 'Gasto Energético Total', totalCaloriesBurned, 'kcal'));
      }
      if (basalMetabolicRateKcal !== undefined && basalMetabolicRateKcal > 0) {
        incomingObservations.push(makeObs('bmr', '19228-2', 'Basal metabolic rate', 'Metabolismo Basal', basalMetabolicRateKcal, 'kcal/day'));
      }
      if (respiratoryRateBpm !== undefined && respiratoryRateBpm > 0) {
        incomingObservations.push(makeObs('resp-rate', '9279-1', 'Respiratory rate', 'Ventilación Pulmonar', respiratoryRateBpm, 'breaths/min'));
      }
      if (weightKgVal !== undefined && weightKgVal > 0) {
        incomingObservations.push(makeObs('weight', '29463-7', 'Body weight', 'Composición Corporal', weightKgVal, 'kg'));
      }
      if (bodyFatPctVal !== undefined && bodyFatPctVal > 0) {
        incomingObservations.push(makeObs('bodyfat', '41982-0', 'Body fat percentage', 'Composición Corporal', bodyFatPctVal, '%'));
      }
      if (leanBodyMassKgVal !== undefined && leanBodyMassKgVal > 0) {
        incomingObservations.push(makeObs('leanmass', '73964-9', 'Lean body mass', 'Composición Corporal', leanBodyMassKgVal, 'kg'));
      }
      if (bloodPressureSystolic !== undefined && bloodPressureSystolic > 0) {
        incomingObservations.push(makeObs('bp-sys', '8480-6', 'Systolic blood pressure', 'Cardiovascular - Presión Arterial', bloodPressureSystolic, 'mmHg'));
      }
      if (bloodGlucoseMgDl !== undefined && bloodGlucoseMgDl > 0) {
        incomingObservations.push(makeObs('glucose', '2339-0', 'Blood glucose', 'Metabólico - Glucosa', bloodGlucoseMgDl, 'mg/dL'));
      }
      if (hydrationLitersVal !== undefined && hydrationLitersVal > 0) {
        incomingObservations.push(makeObs('hydration', '9052-2', 'Fluid intake total', 'Hidratación Health Connect', hydrationLitersVal, 'L'));
      }

      const nextToken = `vyfith_sync_${Date.now()}`;

      const updated = updateHealthSyncState((state) => {
        state.lastSyncTime = nowIso;
        state.syncCount += 1;
        state.changesToken = nextToken;
        const incomingIsEmu = /sdk_gphone|emulator|x86|generic/i.test(String(body.deviceId || ''));
        const prevRealDevice =
          prevDisk?.deviceId && !/sdk_gphone|emulator|x86|generic/i.test(String(prevDisk.deviceId))
            ? prevDisk.deviceId
            : 'V2027';
        state.deviceId = incomingIsEmu ? prevRealDevice : body.deviceId || prevRealDevice;
        state.deviceName = incomingIsEmu
          ? 'VYFITH_APP (Vivo Y20 + Cloud)'
          : body.deviceName || prevDisk?.deviceName || 'VYFITH_APP (Google Health Connect)';
        state.isPaired = true;

        state.currentMetrics.steps = roomMetrics.steps;
        state.currentMetrics.heartRate = roomMetrics.restingHeartRate;
        if (roomMetrics.totalSleepHours > 0) {
          state.currentMetrics.sleepHours = roomMetrics.totalSleepHours;
        }
        state.currentMetrics.deepSleepHours = roomMetrics.deepSleepHours;
        if (lightSleepHours !== undefined) state.currentMetrics.lightSleepHours = lightSleepHours;
        if (remSleepHours !== undefined) state.currentMetrics.remSleepHours = remSleepHours;
        if (awakeMinutes !== undefined) state.currentMetrics.awakeMinutes = awakeMinutes;
        if (awakeningsCount !== undefined) state.currentMetrics.awakeningsCount = awakeningsCount;
        if (sleepEfficiency !== undefined) state.currentMetrics.sleepEfficiency = sleepEfficiency;
        if (sleepStartTime) state.currentMetrics.sleepStartTime = sleepStartTime;
        if (sleepEndTime) state.currentMetrics.sleepEndTime = sleepEndTime;
        state.currentMetrics.spo2 = roomMetrics.spo2;
        if (hrvVal !== undefined) state.currentMetrics.hrv = hrvVal;
        if (avgHeartRate !== undefined) state.currentMetrics.avgHeartRate = avgHeartRate;
        if (minHeartRate !== undefined) state.currentMetrics.minHeartRate = minHeartRate;
        if (maxHeartRate !== undefined) state.currentMetrics.maxHeartRate = maxHeartRate;
        if (distanceMeters !== undefined) state.currentMetrics.distanceMeters = distanceMeters;
        if (activeCaloriesBurned !== undefined) state.currentMetrics.activeCaloriesBurned = activeCaloriesBurned;
        if (totalCaloriesBurned !== undefined) state.currentMetrics.totalCaloriesBurned = totalCaloriesBurned;
        if (basalMetabolicRateKcal !== undefined) state.currentMetrics.basalMetabolicRateKcal = basalMetabolicRateKcal;
        if (activityMinutes !== undefined) state.currentMetrics.activityMinutes = activityMinutes;
        if (respiratoryRateBpm !== undefined) state.currentMetrics.respiratoryRateBpm = respiratoryRateBpm;
        if (bloodPressureSystolic !== undefined) state.currentMetrics.bloodPressureSystolic = bloodPressureSystolic;
        if (bloodPressureDiastolic !== undefined) state.currentMetrics.bloodPressureDiastolic = bloodPressureDiastolic;
        if (bloodGlucoseMgDl !== undefined) state.currentMetrics.bloodGlucoseMgDl = bloodGlucoseMgDl;
        if (elevationGainedMeters !== undefined) state.currentMetrics.elevationGainedMeters = elevationGainedMeters;
        if (avgSpeedMps !== undefined) state.currentMetrics.avgSpeedMps = avgSpeedMps;
        if (powerWatts !== undefined) state.currentMetrics.powerWatts = powerWatts;
        if (hydrationLitersVal !== undefined) state.currentMetrics.hydrationLiters = hydrationLitersVal;
        if (weightKgVal !== undefined) state.currentMetrics.weightKg = weightKgVal;
        if (bodyFatPctVal !== undefined) state.currentMetrics.bodyFatPct = bodyFatPctVal;
        if (leanBodyMassKgVal !== undefined) state.currentMetrics.leanBodyMassKg = leanBodyMassKgVal;
        if (boneMassKgVal !== undefined) state.currentMetrics.boneMassKg = boneMassKgVal;
        if (heightCmVal !== undefined) state.currentMetrics.heightCm = heightCmVal;
        if (watchActivitySummary) state.currentMetrics.watchActivitySummary = watchActivitySummary;

        state.vyfithData = {
          connected: true,
          appName: 'VYFITH_APP (FitSync AI Android)',
          readinessScore,
          readinessCategory: readinessCategory as any,
          lastSyncTimestamp: nowIso,
          geminiAnalysis,
          roomMetrics,
          hevySummary,
        };

        state.superAppSync = superAppSyncNext;
        state.recentObservations = [...incomingObservations, ...state.recentObservations].slice(0, 30);
      });

      // Persistir inmediatamente a disco en tiempo real
      persistStateToDisk(updated);

      return NextResponse.json(
        {
          success: true,
          message: '¡Datos completos recibidos desde VYFITH_APP (Health Connect + Super-App) y guardados en tiempo real!',
          nextChangesToken: nextToken,
          syncedRecords: incomingObservations.length,
          data: updated,
        },
        { headers: corsHeaders }
      );
    }

    // Caso B: Simulación genérica de Worker de segundo plano
    if (body.simulate) {
      const randomSteps = Math.floor(Math.random() * 600) + 250;
      const hrvVariation = Math.floor(Math.random() * 7) - 3;
      const currentState = getHealthSyncState();
      
      newStepsDelta = randomSteps;
      newHrv = Math.max(50, Math.min(95, currentState.currentMetrics.hrv + hrvVariation));
      newHr = Math.floor(Math.random() * 12) + 60;
      newSleep = currentState.currentMetrics.sleepHours;

      incomingObservations = [
        {
          id: `obs-steps-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '55423-8',
                display: 'Number of steps (Delta Upsertion)',
              },
            ],
          },
          valueQuantity: {
            value: randomSteps,
            unit: 'steps',
          },
          effectiveDateTime: nowIso,
          category: 'Actividad Física (Delta)',
        },
        {
          id: `obs-hrv-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '80404-7',
                display: 'R-R interval.standard deviation (HRV)',
              },
            ],
          },
          valueQuantity: {
            value: newHrv,
            unit: 'ms',
          },
          effectiveDateTime: nowIso,
          category: 'Recuperación Biológica',
        },
      ];
    } else if (Array.isArray(body.health)) {
      // Caso C: Lote FHIR directo desde OkHttp/Retrofit
      incomingObservations = body.health.map((item: any, idx: number) => ({
        id: item.id || `obs-raw-${Date.now()}-${idx}`,
        resourceType: 'Observation',
        status: 'final',
        code: item.code || {
          coding: [{ system: 'http://loinc.org', code: '55423-8', display: 'Biometric reading' }],
        },
        valueQuantity: item.valueQuantity || { value: 0, unit: 'count' },
        effectiveDateTime: item.effectiveDateTime || nowIso,
        category: item.category || 'Salud Móvil',
      }));

      let newSpo2 = 0;
      let newCalories = 0;
      let newDistance = 0;
      let newDeepSleep = 0;
      let newRemSleep = 0;
      let newLightSleep = 0;
      let newRespRate = 0;

      for (const obs of incomingObservations) {
        const code = obs.code?.coding?.[0]?.code;
        const val = Number(obs.valueQuantity?.value || 0);
        if (code === '55423-8') newStepsDelta += val;
        else if (code === '80404-7') newHrv = val;
        else if (code === '8867-4') newHr = val;
        else if (code === '93832-4') newSleep = val;
        else if (code === '93831-6') newDeepSleep = val;
        else if (code === '93830-8') newRemSleep = val;
        else if (code === '93829-0') newLightSleep = val;
        else if (code === '2708-6') newSpo2 = val;
        else if (code === '41981-2') newCalories += val;
        else if (code === '41950-7') newDistance += val;
        else if (code === '9279-1') newRespRate = val;
        else if (code === '29463-7') newWeight = val;
        else if (code === '41982-0') newBodyFat = val;
        else if (code === '73964-9') newMuscle = val;
        else if (code === '39156-5') newBmi = val;
      }

      const nextTokenFhir = `hc_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const updatedFhir = updateHealthSyncState((state) => {
        state.lastSyncTime = nowIso;
        state.syncCount += 1;
        state.changesToken = nextTokenFhir;
        if (body.deviceId) state.deviceId = body.deviceId;
        if (body.deviceName) state.deviceName = body.deviceName;

        if (newStepsDelta > 0) {
          state.currentMetrics.steps += newStepsDelta;
          state.vyfithData.roomMetrics.steps = state.currentMetrics.steps;
        }
        if (newHrv > 0) {
          state.currentMetrics.hrv = newHrv;
          state.vyfithData.roomMetrics.hrv = newHrv;
        }
        if (newHr > 0) {
          state.currentMetrics.heartRate = newHr;
          state.vyfithData.roomMetrics.restingHeartRate = newHr;
        }
        if (newSleep > 0) {
          state.currentMetrics.sleepHours = newSleep;
          state.vyfithData.roomMetrics.totalSleepHours = newSleep;
        }
        if (newDeepSleep > 0) {
          state.currentMetrics.deepSleepHours = newDeepSleep;
          state.vyfithData.roomMetrics.deepSleepHours = newDeepSleep;
        }
        if (newRemSleep > 0) {
          state.currentMetrics.remSleepHours = newRemSleep;
          state.vyfithData.roomMetrics.remSleepHours = newRemSleep;
        }
        if (newLightSleep > 0) {
          state.currentMetrics.lightSleepHours = newLightSleep;
          state.vyfithData.roomMetrics.lightSleepHours = newLightSleep;
        }
        if (newSpo2 > 0) {
          state.currentMetrics.spo2 = newSpo2;
          state.vyfithData.roomMetrics.spo2 = newSpo2;
        }
        if (newCalories > 0) {
          state.vyfithData.roomMetrics.caloriesBurned = newCalories;
          state.currentMetrics.activeCaloriesBurned = newCalories;
        }
        if (newDistance > 0) {
          state.currentMetrics.distanceMeters = newDistance;
          state.vyfithData.roomMetrics.distanceMeters = newDistance;
        }
        if (newRespRate > 0) {
          state.currentMetrics.respiratoryRateBpm = newRespRate;
          state.vyfithData.roomMetrics.respiratoryRateBpm = newRespRate;
        }
        if (newWeight > 0) state.currentMetrics.weightKg = newWeight;
        if (newBodyFat > 0) state.currentMetrics.bodyFatPct = newBodyFat;
        if (newMuscle > 0) state.currentMetrics.skeletalMuscleKg = newMuscle;
        if (newBmi > 0) state.currentMetrics.bmi = newBmi;

        state.recentObservations = [...incomingObservations, ...state.recentObservations].slice(0, 30);
      });

      persistStateToDisk(updatedFhir);

      return NextResponse.json(
        {
          success: true,
          message: 'Sincronización procesada exitosamente en formato HL7 FHIR R4 y guardada en tiempo real',
          nextChangesToken: nextTokenFhir,
          syncedRecords: incomingObservations.length,
          data: updatedFhir,
        },
        { headers: corsHeaders }
      );
    }

    const nextToken = `hc_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const updated = updateHealthSyncState((state) => {
      state.lastSyncTime = nowIso;
      state.syncCount += 1;
      state.changesToken = nextToken;
      if (body.deviceId) state.deviceId = body.deviceId;
      if (body.deviceName) state.deviceName = body.deviceName;

      if (newStepsDelta > 0) state.currentMetrics.steps += newStepsDelta;
      if (newHrv > 0) state.currentMetrics.hrv = newHrv;
      if (newHr > 0) state.currentMetrics.heartRate = newHr;
      if (newSleep > 0) state.currentMetrics.sleepHours = newSleep;
      if (newWeight > 0) state.currentMetrics.weightKg = newWeight;
      if (newBodyFat > 0) state.currentMetrics.bodyFatPct = newBodyFat;
      if (newMuscle > 0) state.currentMetrics.skeletalMuscleKg = newMuscle;
      if (newBmi > 0) state.currentMetrics.bmi = newBmi;

      state.recentObservations = [...incomingObservations, ...state.recentObservations].slice(0, 20);
    });

    // Persistir inmediatamente a disco
    persistStateToDisk(updated);

    return NextResponse.json(
      {
        success: true,
        message: 'Sincronización procesada exitosamente en formato HL7 FHIR R4 y guardada en tiempo real',
        nextChangesToken: nextToken,
        syncedRecords: incomingObservations.length,
        data: updated,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al procesar el lote de salud',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
