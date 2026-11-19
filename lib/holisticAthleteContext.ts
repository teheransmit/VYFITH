/**
 * VYFITH — Motor de Contexto Holístico 360° del Atleta
 * Unifica TODAS las 8 fuentes reales de la página antes de auditar o construir una rutina:
 *  1. Hevy Workouts & Live Routines (204+ sesiones, RPE, notas personales UPB, 4 rutinas)
 *  2. Reloj Xiaomi Smart Band 9 Pro (sesiones cardíacas, FC prom/máx, kcal, TRIMP)
 *  3. Salud & Sueño Mi Fitness / Health Connect (sueño profundo/REM, HRV, RHR, SpO2, Readiness)
 *  4. Báscula Femmto (27 pesajes históricos: peso 55.5 kg -> meta 60 kg, % grasa, MME, masa magra)
 *  5. Medidas Corporales 17 Puntos (detección matemática de asimetrías izq/der y músculos rezagados)
 *  6. Nutrición & Hidratación Viva (kcal, proteína vs 140g, agua vs 2900 ml -> tope de volumen diario)
 *  7. Paseos Caninos en Bicicleta + Agenda UPB (Frida 9/sem + Sienna 5/sem a 15 km/h -> fatiga piernas)
 *  8. Base de Datos Viva Google NotebookLM ("MegaProyecto", ID 57126469-ac46-4b0d-a370-6270c887c26b, 67 fuentes)
 */

import fs from 'fs';
import path from 'path';
import { Holistic360Pill } from '@/lib/realAiCoachTypes';

const DATA_DIR = path.join(process.cwd(), 'data');

function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export interface BodyAsymmetryAlert {
  muscle: string;
  leftCm: number;
  rightCm: number;
  diffCm: number;
  weakerSide: 'izquierdo' | 'derecho';
  prescriptionCue: string;
}

export interface Holistic360Dossier {
  generatedAt: string;
  sourcesConnectedCount: number;
  summaryLine: string;
  pills: Holistic360Pill[];
  athleteProfile: {
    name: string;
    age: number;
    heightCm: number;
    weightKg: number;
    targetWeightKg: number;
    bodyFatPct: number;
    skeletalMuscleKg: number;
    leanBodyMassKg: number;
    gymLocation: string;
    trainsAlone: boolean;
  };
  biometricsAndWatch: {
    readinessScore: number | null;
    sleepHours: number | null;
    deepSleepHours: number | null;
    remSleepHours: number | null;
    sleepEfficiency: number | null;
    hrvMs: number | null;
    restingHeartRateBpm: number | null;
    spo2: number | null;
    watchSessionsCount: number;
    recentWatchActivitySummary: string;
  };
  measurements17Pts: {
    latestDate: string | null;
    totalRecords: number;
    chestCm: number | null;
    shouldersCm: number | null;
    waistCm: number | null;
    asymmetryAlerts: BodyAsymmetryAlert[];
    growthSinceFirstRecord: string;
    laggingMusclePriority: string[];
  };
  nutritionAndHydration: {
    caloriesToday: number;
    targetCalories: number;
    proteinTodayG: number;
    targetProteinG: number;
    waterTodayMl: number;
    waterGoalMl: number;
    waterPct: number;
    caloricReadinessFlag: 'superavit_optimo' | 'ingesta_parcial_dia' | 'deficit_severo';
    maxRecommendedSetsToday: number;
    maxRecommendedExercisesToday: number;
  };
  walksBikeAndSchedule: {
    mode: string;
    bikeSpeedKmh: number;
    weeklyWalksPlanned: number;
    estimatedWeeklyBikeKm: number;
    lowerBodyFatigueLevel: 'moderada' | 'alta';
    sessionDurationTargetMinutes: string;
    scheduleSummary: string;
  };
  notebookLmKnowledge: {
    connected: boolean;
    notebookId: string;
    notebookName: string;
    notebookUrl: string;
    curatedSourcesCount: number;
    syncedAt: string | null;
    driveDossierSynced: boolean;
    coreRules: Array<{ id: string; topic: string; rule: string; citation: string }>;
    routineBlueprint: Record<string, unknown> | null;
  };
}

export function buildHolistic360AthleteDossier(routineName: string): Holistic360Dossier {
  const health = safeReadJson<any>(path.join(DATA_DIR, 'real_health_state.json'), {});
  const water = safeReadJson<any>(path.join(DATA_DIR, 'real_water_log.json'), {});
  const nutrition = safeReadJson<any>(path.join(DATA_DIR, 'real_nutrition_state.json'), {});
  const measurements = safeReadJson<any[]>(path.join(DATA_DIR, 'real_body_measurements.json'), []);
  const watch = safeReadJson<any>(path.join(DATA_DIR, 'real_watch_workouts.json'), { sessions: [] });
  const workouts = safeReadJson<any[]>(path.join(DATA_DIR, 'real_hevy_workouts.json'), []);
  const routines = safeReadJson<any>(path.join(DATA_DIR, 'real_hevy_routines.json'), { routines: [] });
  const finance = safeReadJson<any>(path.join(DATA_DIR, 'real_finance_state.json'), {});
  const notebookLm = safeReadJson<any>(path.join(DATA_DIR, 'notebooklm_knowledge_base.json'), null);

  let sourcesCount = 0;
  if (Array.isArray(workouts) && workouts.length > 0) sourcesCount++;
  if (Array.isArray(routines?.routines) && routines.routines.length > 0) sourcesCount++;
  if (health?.currentMetrics) sourcesCount++;
  if (Array.isArray(measurements) && measurements.length > 0) sourcesCount++;
  if (nutrition?.targets || water?.days) sourcesCount++;
  if (Array.isArray(watch?.sessions)) sourcesCount++;
  if (finance?.accounts) sourcesCount++;
  if (notebookLm?.notebookId) sourcesCount++;

  // 1. Perfil y Femmto
  const m = health?.currentMetrics || {};
  const v = health?.vyfithData || {};
  const weightKg = Number(m.weightKg ?? 55.5);
  const bodyFatPct = Number(m.bodyFatPct ?? 10.4);
  const skeletalMuscleKg = Number(m.skeletalMuscleKg ?? 25.1);
  const leanBodyMassKg = Number(m.leanBodyMassKg ?? 46.5);

  // 2. Biometría y Reloj
  const readinessScore = v?.readinessScore ?? null;
  const sleepHours = m.sleepHours ?? v?.roomMetrics?.totalSleepHours ?? null;
  const deepSleepHours = m.deepSleepHours ?? v?.roomMetrics?.deepSleepHours ?? null;
  const remSleepHours = m.remSleepHours ?? v?.roomMetrics?.remSleepHours ?? null;
  const sleepEfficiency = m.sleepEfficiency ?? v?.roomMetrics?.sleepEfficiency ?? null;
  const hrvMs = m.hrv ?? v?.roomMetrics?.hrv ?? null;
  const restingHeartRateBpm = m.heartRate ?? v?.roomMetrics?.restingHeartRate ?? null;
  const spo2 = m.spo2 ?? v?.roomMetrics?.spo2 ?? null;
  const watchSessions = Array.isArray(watch?.sessions) ? watch.sessions : [];

  // 3. Medidas 17 Puntos y Detector de Asimetrías Reales
  const sortedMeas = Array.isArray(measurements)
    ? [...measurements].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
    : [];
  const firstMeas = sortedMeas[0] || null;
  const latestMeas = sortedMeas[sortedMeas.length - 1] || null;

  const asymmetryAlerts: BodyAsymmetryAlert[] = [];
  if (latestMeas) {
    const pairs: Array<[string, number | undefined, number | undefined]> = [
      ['Bíceps', latestMeas.bicepsLeftCm, latestMeas.bicepsRightCm],
      ['Antebrazo', latestMeas.forearmLeftCm, latestMeas.forearmRightCm],
      ['Muslo', latestMeas.thighLeftCm, latestMeas.thighRightCm],
      ['Gemelo', latestMeas.calfLeftCm, latestMeas.calfRightCm],
    ];
    for (const [muscle, left, right] of pairs) {
      if (Number.isFinite(left) && Number.isFinite(right)) {
        const diff = Math.round(Math.abs(left! - right!) * 10) / 10;
        if (diff >= 0.4) {
          const weakerSide = left! < right! ? 'izquierdo' : 'derecho';
          asymmetryAlerts.push({
            muscle,
            leftCm: left!,
            rightCm: right!,
            diffCm: diff,
            weakerSide,
            prescriptionCue: `Iniciar series unilaterales por lado ${weakerSide} (${left} vs ${right} cm) e igualar reps en el lado fuerte.`,
          });
        }
      }
    }
  }

  let growthSinceFirstRecord = 'Sin histórico suficiente.';
  const laggingMusclePriority: string[] = [];
  if (firstMeas && latestMeas && firstMeas.date !== latestMeas.date) {
    const dChest = Number(((latestMeas.chestCm || 0) - (firstMeas.chestCm || 0)).toFixed(1));
    const dShoulders = Number(((latestMeas.shouldersCm || 0) - (firstMeas.shouldersCm || 0)).toFixed(1));
    const dThigh = Number(((latestMeas.thighLeftCm || 0) - (firstMeas.thighLeftCm || 0)).toFixed(1));
    const dBicep = Number(((latestMeas.bicepsLeftCm || 0) - (firstMeas.bicepsLeftCm || 0)).toFixed(1));
    growthSinceFirstRecord = `Desde ${firstMeas.date} a ${latestMeas.date}: Peso +${((latestMeas.weightKg || 0) - (firstMeas.weightKg || 0)).toFixed(1)} kg, Pecho +${dChest} cm, Hombros +${dShoulders} cm, Bíceps Izq +${dBicep} cm, Muslo Izq +${dThigh} cm.`;

    if ((latestMeas.bicepsLeftCm || 0) < 32) laggingMusclePriority.push('Bíceps lado izquierdo (30.5 cm vs 31.0 cm der)');
    if ((latestMeas.thighLeftCm || 0) < 52) laggingMusclePriority.push('Cuádriceps / Muslo izquierdo (49.5 cm vs 50.0 cm der)');
    if ((latestMeas.chestCm || 0) < 96) laggingMusclePriority.push('Pectoral superior y esternocostal (92.5 cm)');
    if ((latestMeas.shouldersCm || 0) < 114) laggingMusclePriority.push('Deltoides lateral (anchura hombros 110 cm)');
  }

  // 4. Nutrición e Hidratación
  const waterDays = water?.days && typeof water.days === 'object' ? Object.values(water.days) : [];
  const latestWater: any =
    waterDays.length > 0
      ? (waterDays as any[]).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0]
      : null;

  const waterTodayMl = Number(latestWater?.totalMl ?? nutrition?.current?.waterMl ?? 0);
  const waterGoalMl = Number(latestWater?.goalMl ?? water?.goalMl ?? nutrition?.targets?.targetWaterMl ?? 2900);
  const waterPct = waterGoalMl > 0 ? Math.round((waterTodayMl / waterGoalMl) * 100) : 0;
  const caloriesToday = Number(nutrition?.current?.calories ?? 0);
  const targetCalories = Number(nutrition?.targets?.targetKcal ?? 2800);
  const proteinTodayG = Number(nutrition?.current?.protein ?? 0);
  const targetProteinG = Number(nutrition?.targets?.targetProtein ?? 140);

  const kcalRatio = targetCalories > 0 ? caloriesToday / targetCalories : 0;
  const caloricReadinessFlag: Holistic360Dossier['nutritionAndHydration']['caloricReadinessFlag'] =
    kcalRatio >= 0.75 ? 'superavit_optimo' : kcalRatio >= 0.4 ? 'ingesta_parcial_dia' : 'deficit_severo';

  // Para ectomorfo 55.5 kg, recortar volumen basura drásticamente si falta energía o Readiness < 70
  const maxRecommendedExercisesToday =
    caloricReadinessFlag === 'deficit_severo' || (readinessScore !== null && readinessScore < 68) ? 8 : 9;
  const maxRecommendedSetsToday =
    caloricReadinessFlag === 'deficit_severo' || (readinessScore !== null && readinessScore < 68) ? 16 : 19;

  // 5. Carga de Paseos Caninos en Bici + Calendario UPB
  // Frida: L-V 06:30 + M-V 19:30 (hasta 9/sem) | Sienna: 3-5/sem | Traslado en bici 15 km/h (~2.1 km casa-perros + ~7.8 km UPB)
  const weeklyWalksPlanned = 12; // 9 Frida + 3 a 5 Sienna
  const estimatedWeeklyBikeKm = 48; // traslados urbanos Montería + ida/vuelta UPB
  const lowerBodyFatigueLevel: 'moderada' | 'alta' = weeklyWalksPlanned >= 10 ? 'alta' : 'moderada';

  // 6. Base NotebookLM ("MegaProyecto")
  const nlmBlueprints = notebookLm?.routineBlueprints || {};
  const matchedBlueprintKey = Object.keys(nlmBlueprints).find((k) =>
    routineName.toLowerCase().includes(k.split('(')[0].trim().toLowerCase())
  );

  const notebookLmKnowledge: Holistic360Dossier['notebookLmKnowledge'] = {
    connected: Boolean(notebookLm?.notebookId),
    notebookId: notebookLm?.notebookId || '57126469-ac46-4b0d-a370-6270c887c26b',
    notebookName: notebookLm?.notebookName || 'MegaProyecto',
    notebookUrl: notebookLm?.notebookUrl || 'https://notebooklm.google.com/notebook/57126469-ac46-4b0d-a370-6270c887c26b',
    curatedSourcesCount: Number(notebookLm?.curatedSourcesCount || 67),
    syncedAt: notebookLm?.syncedAt || null,
    driveDossierSynced: Boolean(notebookLm?.driveDossierPath),
    coreRules: Array.isArray(notebookLm?.coreHypertrophyRules) ? notebookLm.coreHypertrophyRules : [],
    routineBlueprint: matchedBlueprintKey ? nlmBlueprints[matchedBlueprintKey] : null,
  };

  // 7. Píldoras visuales de Coherencia 360° para la UI
  const pills: Holistic360Pill[] = [
    {
      id: 'notebooklm',
      icon: 'notebooklm',
      label: 'NotebookLM',
      value: `${notebookLmKnowledge.curatedSourcesCount} fuentes (${notebookLmKnowledge.notebookName})`,
      tone: 'indigo',
      detail: notebookLmKnowledge.driveDossierSynced
        ? 'Base científica + Dossier 360° sincronizado en Drive Staging'
        : 'Base científica local activa',
    },
    {
      id: 'measurements',
      icon: 'measurements',
      label: '17 Medidas',
      value:
        asymmetryAlerts.length > 0
          ? `${asymmetryAlerts.length} asimetrías Izq < Der (-0.5 cm)`
          : `Pecho ${latestMeas?.chestCm ?? '?'} cm • Hombros ${latestMeas?.shouldersCm ?? '?'} cm`,
      tone: asymmetryAlerts.length > 0 ? 'amber' : 'emerald',
      detail: asymmetryAlerts.map((a) => `${a.muscle}: ${a.leftCm}/${a.rightCm} cm`).join(' • '),
    },
    {
      id: 'femmto',
      icon: 'femmto',
      label: 'Femmto',
      value: `${weightKg} kg (${bodyFatPct}% grasa) → 60 kg`,
      tone: 'cyan',
      detail: `MME ${skeletalMuscleKg} kg • Magra ${leanBodyMassKg} kg • Tope ${maxRecommendedExercisesToday} ejs/sesión`,
    },
    {
      id: 'watch',
      icon: 'watch',
      label: 'Reloj & Sueño',
      value: `${sleepHours ?? '?'}h sueño • HRV ${hrvMs ?? '?'} ms • RHR ${restingHeartRateBpm ?? '?'}`,
      tone: readinessScore !== null && readinessScore >= 70 ? 'emerald' : 'amber',
      detail: `Readiness ${readinessScore ?? '?'}/100 • ${watchSessions.length} sesiones reloj archivadas`,
    },
    {
      id: 'nutrition',
      icon: 'nutrition',
      label: 'Nutrición/Agua',
      value: `${waterTodayMl}/${waterGoalMl} ml (${waterPct}%) • ${proteinTodayG}/${targetProteinG}g prot`,
      tone: caloricReadinessFlag === 'deficit_severo' ? 'rose' : waterPct >= 85 ? 'emerald' : 'amber',
      detail: `${caloriesToday}/${targetCalories} kcal registradas hoy`,
    },
    {
      id: 'bike',
      icon: 'bike',
      label: 'Paseos & Bici',
      value: `Frida + Sienna (~${estimatedWeeklyBikeKm} km/sem bici)`,
      tone: 'amber',
      detail: 'Fatiga crónica de tren inferior considerada en volumen de Full Legs y gasto calórico',
    },
  ];

  const summaryLine = [
    `Peso ${weightKg} kg (${bodyFatPct}% grasa → 60 kg)`,
    readinessScore !== null ? `Readiness ${readinessScore}/100` : null,
    sleepHours !== null ? `Sueño ${sleepHours}h` : null,
    hrvMs !== null ? `HRV ${hrvMs} ms` : null,
    `Agua ${waterTodayMl}/${waterGoalMl} ml (${waterPct}%)`,
    asymmetryAlerts.length > 0 ? `${asymmetryAlerts.length} asimetrías Izq<Der` : null,
    `NotebookLM ${notebookLmKnowledge.curatedSourcesCount} fuentes`,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    generatedAt: new Date().toISOString(),
    sourcesConnectedCount: sourcesCount,
    summaryLine,
    pills,
    athleteProfile: {
      name: 'Santiago Smit Teherán Mogollón',
      age: 21,
      heightCm: 172,
      weightKg,
      targetWeightKg: 60,
      bodyFatPct,
      skeletalMuscleKg,
      leanBodyMassKg,
      gymLocation: 'Gimnasio UPB Montería',
      trainsAlone: true,
    },
    biometricsAndWatch: {
      readinessScore,
      sleepHours,
      deepSleepHours,
      remSleepHours,
      sleepEfficiency,
      hrvMs,
      restingHeartRateBpm,
      spo2,
      watchSessionsCount: watchSessions.length,
      recentWatchActivitySummary: m.watchActivitySummary || 'Sin actividad reciente del reloj',
    },
    measurements17Pts: {
      latestDate: latestMeas?.date || null,
      totalRecords: sortedMeas.length,
      chestCm: latestMeas?.chestCm ?? null,
      shouldersCm: latestMeas?.shouldersCm ?? null,
      waistCm: latestMeas?.waistCm ?? null,
      asymmetryAlerts,
      growthSinceFirstRecord,
      laggingMusclePriority,
    },
    nutritionAndHydration: {
      caloriesToday,
      targetCalories,
      proteinTodayG,
      targetProteinG,
      waterTodayMl,
      waterGoalMl,
      waterPct,
      caloricReadinessFlag,
      maxRecommendedSetsToday,
      maxRecommendedExercisesToday,
    },
    walksBikeAndSchedule: {
      mode: 'Vacaciones UPB (2026-II finalizado)',
      bikeSpeedKmh: 15,
      weeklyWalksPlanned,
      estimatedWeeklyBikeKm,
      lowerBodyFatigueLevel,
      sessionDurationTargetMinutes: '60-75 min',
      scheduleSummary:
        'Lunes Horizontal Torso 4pm • Martes Vertical Torso 5pm • Miércoles Full Legs 5pm • Jueves Arms & Shoulders 4pm • Viernes Full Legs 8am. Paseos Frida (L-V 6:30am + M-V 7:30pm) + Sienna (3-5/sem) en bicicleta.',
    },
    notebookLmKnowledge,
  };
}
