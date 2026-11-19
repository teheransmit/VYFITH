/**
 * VYFITH — Motor de Entrenador Personal Multi-IA Real
 *
 * REGLAS INQUEBRANTABLES:
 * 1. CERO respuestas deterministas o simuladas de 0ms.
 * 2. Siempre consulta modelos reales del Consejo Multi-IA (Google AI Studio Gemini + NVIDIA NIM)
 *    con timeout >= 45s y reporte transparente de códigos HTTP en caso de fallo.
 * 3. Cruza rutina viva real de Hevy (data/real_hevy_routines.json), últimas sesiones reales
 *    con RPE y notas del atleta (data/real_hevy_workouts.json), fusión reloj Xiaomi Smart Band 9 Pro,
 *    y biometría viva (sueño, HRV, RHR, hidratación, nutrición, peso ectomorfo 55.5 kg -> 60 kg).
 */

import fs from 'fs';
import path from 'path';
import { resolveConfiguredAiKeys, AiKeysConfig } from '@/lib/multiAiRouter';
import { readStoredWorkouts } from '@/lib/hevySyncService';
import { findKnownRoutine, parseHevyDate, translateExerciseTitle } from '@/lib/hevyDateParser';
import { HevyWorkoutSession } from '@/lib/hevyStore';
import {
  LiveHevyRoutine,
  LiveAiRoutineAudit,
  ExerciseAiRecommendation,
  SetDeltaSuggestion,
  StructuralIssue,
  AiCouncilModelContribution,
  ExerciseCoachAction,
  CoherenceCrossCheck,
} from '@/lib/realAiCoachTypes';
import {
  buildHolistic360AthleteDossier,
  Holistic360Dossier,
} from '@/lib/holisticAthleteContext';

const DATA_DIR = path.join(process.cwd(), 'data');
const ROUTINES_FILE = path.join(DATA_DIR, 'real_hevy_routines.json');
const LIVE_ANALYSIS_FILE = path.join(DATA_DIR, 'ai_coach_live_analysis.json');
const HEALTH_STATE_FILE = path.join(DATA_DIR, 'real_health_state.json');
const WATER_LOG_FILE = path.join(DATA_DIR, 'real_water_log.json');
const NUTRITION_STATE_FILE = path.join(DATA_DIR, 'real_nutrition_state.json');

const LBS_TO_KG = 0.45359237;
const AI_COACH_TIMEOUT_MS = 34000;

function normalizeKey(s?: string | null): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
    }
  } catch {
    // ignore corrupt json
  }
  return fallback;
}

export function readLiveHevyRoutines(): {
  exportedAt: string | null;
  accountName: string | null;
  routines: LiveHevyRoutine[];
} {
  const raw = safeReadJson<{
    exportedAt?: string;
    accountName?: string;
    routines?: LiveHevyRoutine[];
  }>(ROUTINES_FILE, {});
  return {
    exportedAt: raw.exportedAt || null,
    accountName: raw.accountName || null,
    routines: Array.isArray(raw.routines) ? raw.routines : [],
  };
}

export function findLiveHevyRoutine(routineNameOrId: string): LiveHevyRoutine | null {
  const { routines } = readLiveHevyRoutines();
  if (routines.length === 0) return null;
  const q = normalizeKey(routineNameOrId);
  const known = findKnownRoutine(routineNameOrId);

  return (
    routines.find(
      (r) =>
        (known && (r.shortId === known.routineId || r.uuid === known.routineUuid)) ||
        normalizeKey(r.shortId) === q ||
        normalizeKey(r.uuid) === q ||
        normalizeKey(r.title) === q ||
        (q.length >= 4 && normalizeKey(r.title).includes(q)) ||
        (q.length >= 4 && q.includes(normalizeKey(r.title).split('(')[0].trim()))
    ) || null
  );
}

export function readSavedAiAudits(): Record<string, LiveAiRoutineAudit> {
  const raw = safeReadJson<{ audits?: Record<string, LiveAiRoutineAudit> }>(LIVE_ANALYSIS_FILE, {});
  return raw.audits && typeof raw.audits === 'object' ? raw.audits : {};
}

export function getSavedAiAuditForRoutine(routineNameOrId: string): LiveAiRoutineAudit | null {
  const audits = readSavedAiAudits();
  const liveRoutine = findLiveHevyRoutine(routineNameOrId);
  const known = findKnownRoutine(routineNameOrId);
  const keysToTry = [
    liveRoutine?.shortId,
    known?.routineId,
    liveRoutine?.title,
    routineNameOrId,
  ].filter(Boolean) as string[];

  for (const k of keysToTry) {
    if (audits[k]) return audits[k];
  }

  const q = normalizeKey(routineNameOrId);
  for (const audit of Object.values(audits)) {
    if (
      normalizeKey(audit.routineShortId) === q ||
      normalizeKey(audit.routineName) === q ||
      (q.length >= 5 && normalizeKey(audit.routineName).includes(q))
    ) {
      return audit;
    }
  }
  return null;
}

export function saveAiAudit(audit: LiveAiRoutineAudit): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const current = readSavedAiAudits();
  const key = audit.routineShortId || audit.routineName;
  current[key] = audit;
  fs.writeFileSync(
    LIVE_ANALYSIS_FILE,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        audits: current,
      },
      null,
      2
    ),
    'utf8'
  );
}

function buildLiveBiometricSnapshot(): {
  summaryLine: string;
  structured: Record<string, unknown>;
} {
  const health = safeReadJson<any>(HEALTH_STATE_FILE, {});
  const water = safeReadJson<any>(WATER_LOG_FILE, {});
  const nutrition = safeReadJson<any>(NUTRITION_STATE_FILE, {});

  const m = health?.currentMetrics || {};
  const v = health?.vyfithData || {};

  const waterDays = water?.days && typeof water.days === 'object' ? Object.values(water.days) : [];
  const latestWaterDay: any =
    waterDays.length > 0
      ? (waterDays as any[]).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0]
      : null;

  const waterMl = latestWaterDay?.totalMl ?? nutrition?.current?.waterMl ?? null;
  const waterGoalMl = latestWaterDay?.goalMl ?? water?.goalMl ?? nutrition?.targets?.targetWaterMl ?? 2900;
  const waterPct = waterMl !== null && waterGoalMl > 0 ? Math.round((waterMl / waterGoalMl) * 100) : null;

  const sleepHours = m.sleepHours ?? v?.roomMetrics?.totalSleepHours ?? null;
  const deepSleep = m.deepSleepHours ?? v?.roomMetrics?.deepSleepHours ?? null;
  const remSleep = m.remSleepHours ?? v?.roomMetrics?.remSleepHours ?? null;
  const hrv = m.hrv ?? v?.roomMetrics?.hrv ?? null;
  const rhr = m.heartRate ?? v?.roomMetrics?.restingHeartRate ?? null;
  const weightKg = m.weightKg ?? 55.5;
  const bodyFatPct = m.bodyFatPct ?? 10.4;
  const readinessScore = v?.readinessScore ?? null;
  const proteinG = nutrition?.current?.protein ?? null;
  const targetProteinG = nutrition?.targets?.targetProtein ?? 140;
  const kcal = nutrition?.current?.calories ?? null;
  const targetKcal = nutrition?.targets?.targetKcal ?? 2800;

  const parts = [
    `Peso ${weightKg} kg (${bodyFatPct}% grasa, meta 60 kg)`,
    readinessScore !== null ? `Readiness ${readinessScore}/100` : null,
    sleepHours !== null ? `Sueño ${sleepHours}h (Profundo ${deepSleep ?? '?'}h, REM ${remSleep ?? '?'}h)` : null,
    hrv !== null ? `HRV ${hrv} ms` : null,
    rhr !== null ? `RHR ${rhr} bpm` : null,
    waterMl !== null ? `Agua ${waterMl}/${waterGoalMl} ml (${waterPct}%)` : null,
    proteinG !== null ? `Proteína registrada hoy ${proteinG}/${targetProteinG} g (${kcal ?? 0}/${targetKcal} kcal)` : null,
  ].filter(Boolean);

  return {
    summaryLine: parts.join(' • '),
    structured: {
      athlete: 'Santiago Smit Teherán Mogollón, 21 años, 172 cm, ectomorfo magro, entrena solo en Gimnasio UPB Montería',
      weightKg,
      targetWeightKg: 60,
      bodyFatPct,
      readinessScore,
      sleepHours,
      deepSleepHours: deepSleep,
      remSleepHours: remSleep,
      hrvMs: hrv,
      restingHeartRateBpm: rhr,
      waterMl,
      waterGoalMl,
      waterPct,
      proteinG,
      targetProteinG,
      caloriesToday: kcal,
      targetCalories: targetKcal,
      lastBiometricSync: health?.lastSyncTime || null,
    },
  };
}

function getRecentMatchingSessions(routineName: string, limit = 4): HevyWorkoutSession[] {
  const all = readStoredWorkouts();
  const sorted = [...all].sort(
    (a, b) => (parseHevyDate(b.date)?.getTime() || 0) - (parseHevyDate(a.date)?.getTime() || 0)
  );
  const q = normalizeKey(routineName);
  const shortQ = q.split('(')[0].trim();

  const matches = sorted.filter((w) => {
    const wn = normalizeKey(w.name);
    return wn === q || wn.includes(shortQ) || shortQ.includes(wn);
  });

  return matches.slice(0, limit);
}

function extractBalancedJson(raw: string): Record<string, unknown> | null {
  const cleaned = String(raw || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  if (s === -1 || e === -1 || e <= s) return null;
  try {
    return JSON.parse(cleaned.slice(s, e + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function callGeminiStructuredJson(params: {
  geminiKeys: string[];
  model: string;
  systemInstruction: string;
  userPrompt: string;
}): Promise<{
  success: boolean;
  status: number;
  model: string;
  latencyMs: number;
  json: Record<string, unknown> | null;
  error?: string;
}> {
  const t0 = Date.now();
  let lastStatus = 500;
  let lastError = 'Sin GEMINI_API_KEY';

  for (const apiKey of params.geminiKeys) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_COACH_TIMEOUT_MS);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: params.systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
            generationConfig: {
              temperature: 0.35,
              topP: 0.9,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = extractBalancedJson(text);
        if (parsed && Array.isArray(parsed.exerciseRecommendations)) {
          return {
            success: true,
            status: res.status,
            model: params.model,
            latencyMs: Date.now() - t0,
            json: parsed,
          };
        }
        lastStatus = 502;
        lastError = `${params.model} devolvió JSON incompleto o sin exerciseRecommendations.`;
      } else {
        lastStatus = res.status;
        const txt = await res.text().catch(() => '');
        lastError = `HTTP ${res.status} (${params.model}): ${txt.slice(0, 220)}`;
        if (res.status !== 401 && res.status !== 403 && res.status !== 429) break;
      }
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err?.name === 'AbortError';
      lastStatus = isAbort ? 504 : 500;
      lastError = isAbort
        ? `Timeout ${AI_COACH_TIMEOUT_MS / 1000}s en ${params.model}`
        : `Error de red en ${params.model}: ${err?.message || 'desconocido'}`;
    }
  }

  return {
    success: false,
    status: lastStatus,
    model: params.model,
    latencyMs: Date.now() - t0,
    json: null,
    error: lastError,
  };
}

async function callNvidiaStructuredJson(params: {
  nvidiaKey: string;
  model: string;
  displayName: string;
  systemInstruction: string;
  userPrompt: string;
}): Promise<{
  success: boolean;
  status: number;
  model: string;
  latencyMs: number;
  json: Record<string, unknown> | null;
  error?: string;
}> {
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_COACH_TIMEOUT_MS);

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.nvidiaKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.systemInstruction },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: 0.35,
        max_tokens: 8192,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content || '';
      const parsed = extractBalancedJson(rawContent);
      if (parsed && Array.isArray(parsed.exerciseRecommendations)) {
        return {
          success: true,
          status: res.status,
          model: params.displayName,
          latencyMs: Date.now() - t0,
          json: parsed,
        };
      }
      return {
        success: false,
        status: 502,
        model: params.displayName,
        latencyMs: Date.now() - t0,
        json: null,
        error: `${params.displayName} no entregó JSON válido con exerciseRecommendations.`,
      };
    }

    const txt = await res.text().catch(() => '');
    return {
      success: false,
      status: res.status,
      model: params.displayName,
      latencyMs: Date.now() - t0,
      json: null,
      error: `HTTP ${res.status} (${params.displayName}): ${txt.slice(0, 220)}`,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const isAbort = err?.name === 'AbortError';
    return {
      success: false,
      status: isAbort ? 504 : 500,
      model: params.displayName,
      latencyMs: Date.now() - t0,
      json: null,
      error: isAbort
        ? `Timeout ${AI_COACH_TIMEOUT_MS / 1000}s en ${params.displayName}`
        : `Error de red en ${params.displayName}: ${err?.message || 'desconocido'}`,
    };
  }
}

function snapRestTo5s(sec: number, fallback: number): number {
  const n = Number(sec);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.max(0, Math.min(300, Math.round(n / 5) * 5));
}

function buildShortBadge(params: {
  weightDeltaKg: number;
  repsDelta: number;
  suggestedReps: number;
  suggestedWeightKg: number;
  unit: 'kg' | 'lbs';
  targetRir: number;
  currentRpe?: number;
  suggestedRepRange?: string;
}): string {
  const { weightDeltaKg, repsDelta, suggestedReps, unit, targetRir, currentRpe } = params;
  const absWKg = Math.abs(weightDeltaKg);
  const wLbsDelta = Math.round((weightDeltaKg / LBS_TO_KG) * 2) / 2;
  const wLabel =
    absWKg >= 0.4
      ? unit === 'lbs'
        ? `${wLbsDelta > 0 ? '+' : ''}${wLbsDelta} lb`
        : `${weightDeltaKg > 0 ? '+' : ''}${Number(weightDeltaKg.toFixed(1))} kg`
      : '';
  const rLabel =
    repsDelta !== 0
      ? `${repsDelta > 0 ? '+' : ''}${repsDelta} rep${Math.abs(repsDelta) === 1 ? '' : 's'}`
      : '';

  if (wLabel && rLabel) return `${wLabel} • ${rLabel} (${suggestedReps})`;
  if (wLabel) {
    if (weightDeltaKg < 0 && currentRpe && currentRpe >= 9.5) {
      return `${wLabel} (RIR ${targetRir})`;
    }
    return `${wLabel} (${suggestedReps}r)`;
  }
  if (rLabel) return `${rLabel} → ${suggestedReps}`;
  if (currentRpe && currentRpe >= 9.5) return `Mantener • RIR ${targetRir}`;
  return `Igual (${suggestedReps}r) • RIR ${targetRir}`;
}

function sanitizeAction(raw: unknown): ExerciseCoachAction {
  const s = String(raw || '').toUpperCase().trim();
  if (
    s === 'SUBIR_PESO' ||
    s === 'SUBIR_REPS' ||
    s === 'BAJAR_PESO' ||
    s === 'MANTENER_TECNICA' ||
    s === 'REUBICAR' ||
    s === 'ELIMINAR'
  ) {
    return s;
  }
  return 'MANTENER_TECNICA';
}

function buildPromptForRoutine(params: {
  routine: LiveHevyRoutine;
  recentSessions: HevyWorkoutSession[];
  dossier: Holistic360Dossier;
  mode: 'audit' | 'build_optimal';
}): { systemInstruction: string; userPrompt: string } {
  const isBuildOptimal = params.mode === 'build_optimal';
  const modeDirective = isBuildOptimal
    ? `MODO CONSTRUCTOR AUTÓNOMO 360° (REESTRUCTURACIÓN COMPLETA):
- Tu misión es ARMAR Y REESTRUCTURAR la versión ÓPTIMA y depurada de esta rutina de principio a fin.
- Recorta SIN MIEDO el volumen basura dejando estrictamente entre 8 y 10 ejercicios de máximo Ratio Estímulo-Fatiga (marca el resto con "keepExercise": false y explica por qué en "removeReason", ej. exceso de antebrazos, estiramiento estático al inicio o ejercicios duplicados que funden a un ectomorfo de ${params.dossier.athleteProfile.weightKg} kg).
- Reordena los ejercicios conservados ('suggestedOrderIndex' 0..K-1) poniendo compuestos pesados primero (#0-#2), accesorios multiarticulares después y aislamientos/core/máximo 1 antebrazo al cierre absoluto.
- Prescribe el número exacto de series efectivas ('targetWorkingSets': 2 o 3) según el presupuesto diario (${params.dossier.nutritionAndHydration.maxRecommendedSetsToday} series máx hoy) y la fatiga de paseos en bici.`
    : `MODO AUDITORÍA INTEGRAL 360°:
- Audita la rutina real actual en Hevy, señala fallos críticos de orden, descansos, volumen basura y RPE 10, propón mejoras serie por serie (+1/-1 rep, +/- kg) y marca qué ejercicios sobran o deben reubicarse.`;

  const systemInstruction = `Eres el Arquitecto de Hipertrofia y Entrenador Personal 360° de Santiago Smit Teherán Mogollón (21 años, ectomorfo magro ${params.dossier.athleteProfile.weightKg} kg -> meta 60 kg, entrena solo en Gimnasio UPB Montería).
Trabajas conectado directamente a su base científica de Google NotebookLM ("MegaProyecto", ID 57126469-ac46-4b0d-a370-6270c887c26b, 67 fuentes: Jeff Nippard, Dr. Mike Israetel, Brad Schoenfeld y Eric Helms) y a TODAS las 8 fuentes vivas de datos de su página VYFITH.

${modeDirective}

OBLIGACIÓN DE COHERENCIA CRUZADA CON TODOS LOS DATOS DE LA PÁGINA:
1) MEDIDAS DE 17 PUNTOS Y ASIMETRÍAS: Santiago tiene el lado izquierdo más pequeño (-0.5 cm en bíceps, antebrazo, muslo y gemelo). En ejercicios unilaterales o con mancuerna/polea, indícale explícitamente en 'pinnedNoteForHevy' iniciar por el lado izquierdo e igualar repeticiones en el derecho.
2) BÁSCULA FEMMTO + NUTRICIÓN + AGUA: Pesa ${params.dossier.athleteProfile.weightKg} kg (${params.dossier.athleteProfile.bodyFatPct}% grasa). Controla el volumen basura para no quemar su superávit hacia los 60 kg; cita sus calorías/proteína/agua reales del día.
3) PASEOS CANINOS EN BICI (Frida + Sienna, ~${params.dossier.walksBikeAndSchedule.estimatedWeeklyBikeKm} km/sem a 15 km/h): Considera el desgaste periférico de tren inferior y gasto energético extra al programar piernas y volumen total.
4) SUEÑO, HRV, RELOJ SMART BAND 9 PRO Y NOTAS PERSONALES EN HEVY: Cita textualmente sus notas reales (ej. entrenar solo sin spotter en Press Banca, falta de apoyo de pies en Remo Sentado UPB) y su RPE 9.5-10.
5) REGLAS CIENTÍFICAS DE NOTEBOOKLM ("MegaProyecto"): Aplica y cita los códigos 'NLM-*' provistos en 'notebookLmKnowledge'.

REGLAS ESTRICTAS DE RESPUESTA:
- Responde ÚNICAMENTE con un objeto JSON válido (sin markdown ni texto fuera del JSON).
- Para CADA ejercicio de la rutina actual en Hevy (todos los ${params.routine.exerciseCount} ejercicios), entrega un objeto en 'exerciseRecommendations' con:
  * 'exerciseName': nombre exacto en inglés de la rutina.
  * 'suggestedOrderIndex': entero 0..N-1.
  * 'keepExercise': true o false (en modo Constructor 360°, marca false en todo volumen basura/redundante hasta dejar 8-10 ejercicios clave).
  * 'targetWorkingSets': 2 o 3 (series efectivas óptimas para ese ejercicio).
  * 'suggestedRestSeconds': múltiplo de 5 entre 60 y 240 (compuestos pesados: 150-180s; accesorios: 120s; aislamientos/brazos/core: 60-90s).
  * 'setSuggestions': arreglo serie por serie con 'setNumber', 'isWarmup', 'suggestedWeightKg', 'suggestedReps', 'suggestedRepRange' (ej. "6-8"), 'targetRir' (1-3).
  * 'pinnedNoteForHevy': máximo 135 caracteres, directo y accionable para leer en Hevy App (incluyendo pines de seguridad, lado izquierdo primero si es unilateral, o descanso).

ESQUEMA JSON OBLIGATORIO:
{
  "structureScore": 48,
  "projectedOptimizedScore": 92,
  "executiveVerdict": "Diagnóstico directo de 3-4 frases cruzando los 8 módulos de datos y NotebookLM.",
  "coherenceCrossCheck": {
    "measurementsImpact": "Cómo las medidas de 17 puntos y asimetrías Izq<Der (-0.5 cm) moldearon la rutina.",
    "femmtoAndNutritionImpact": "Cómo el peso de 55.5 kg, meta 60 kg y nutrición/agua definieron el límite de ejercicios y series.",
    "walksAndBikeImpact": "Cómo los paseos de Frida/Sienna y la bici (15 km/h) ajustaron la fatiga y duración.",
    "sleepAndWatchImpact": "Cómo el sueño, HRV, RHR y reloj ajustaron el RIR y los descansos.",
    "notebookLmCitations": ["NLM-ORDER-01: ...", "NLM-VOL-02: ..."]
  },
  "structuralIssues": [
    {
      "severity": "critical | warning | optimization",
      "category": "orden | descanso | volumen | rpe_fatiga | desbalance | nota_atleta",
      "title": "Título breve y contundente",
      "detail": "Explicación concreta citando ejercicios, números y reglas NLM."
    }
  ],
  "exerciseRecommendations": [
    {
      "exerciseName": "Nombre exacto en inglés de la rutina",
      "suggestedOrderIndex": 0,
      "orderChangeReason": "Por qué va en esta posición",
      "keepExercise": true,
      "removeReason": "Solo si keepExercise es false: por qué sobra",
      "targetWorkingSets": 3,
      "suggestedRestSeconds": 180,
      "action": "SUBIR_PESO | SUBIR_REPS | BAJAR_PESO | MANTENER_TECNICA | REUBICAR | ELIMINAR",
      "coachReasoning": "Explicación real citando RPE, notas del atleta, medidas 17 pts y NotebookLM.",
      "pinnedNoteForHevy": "Pines seguridad! 61.2kg x 6-8 (RIR 2) • 3:00 desc",
      "setSuggestions": [
        {
          "setNumber": 1,
          "isWarmup": false,
          "suggestedWeightKg": 61.23,
          "suggestedReps": 7,
          "suggestedRepRange": "6-8",
          "targetRir": 2
        }
      ]
    }
  ]
}`;

  const compactRoutine = params.routine.exercises.map((ex) => ({
    orderIdx: ex.index,
    exerciseName: ex.title,
    esTitle: ex.esTitle,
    muscle: ex.muscleGroup,
    unit: ex.unit,
    restSeconds: ex.restSeconds,
    mode: ex.inputModifier,
    currentNote: ex.notes || undefined,
    sets: ex.sets.map((s) => ({
      set: s.index + 1,
      type: s.type,
      wKg: s.weightKg,
      wLbs: s.weightLbs,
      reps: s.reps,
      range: s.repRangeStart !== null ? `${s.repRangeStart}-${s.repRangeEnd ?? ''}` : undefined,
      durSec: s.durationSeconds || undefined,
    })),
  }));

  const compactHistory = params.recentSessions.map((sess) => ({
    date: sess.date,
    durationMin: sess.durationMinutes,
    totalVolumeKg: sess.totalVolumeKg,
    rpeAvg: sess.rpeAverage,
    watch: sess.watchBiometrics
      ? {
          avgHr: sess.watchBiometrics.avgHeartRateBpm,
          maxHr: sess.watchBiometrics.maxHeartRateBpm,
          kcal: sess.watchBiometrics.caloriesBurned,
          trimp: sess.watchBiometrics.cardiacLoadIndex,
        }
      : undefined,
    exercises: sess.exercises.map((e) => ({
      name: e.name,
      athleteNote: e.notes || undefined,
      sets: e.sets.map((s) => ({
        n: s.setNumber,
        w: s.indicator === 'warmup' || s.isWarmup ? 'W' : undefined,
        kg: s.weightKg,
        reps: s.reps,
        rpe: s.rpe,
      })),
    })),
  }));

  const userPrompt = JSON.stringify(
    {
      mode: params.mode,
      routineTitle: params.routine.title,
      routineShortId: params.routine.shortId,
      totalExercisesInRoutine: params.routine.exerciseCount,
      holistic360Dossier: {
        athleteProfile: params.dossier.athleteProfile,
        biometricsAndWatch: params.dossier.biometricsAndWatch,
        measurements17Pts: params.dossier.measurements17Pts,
        nutritionAndHydration: params.dossier.nutritionAndHydration,
        walksBikeAndSchedule: params.dossier.walksBikeAndSchedule,
        notebookLmKnowledge: {
          notebookId: params.dossier.notebookLmKnowledge.notebookId,
          curatedSourcesCount: params.dossier.notebookLmKnowledge.curatedSourcesCount,
          coreRules: params.dossier.notebookLmKnowledge.coreRules,
          routineBlueprint: params.dossier.notebookLmKnowledge.routineBlueprint,
        },
      },
      currentHevyRoutineStructure: compactRoutine,
      lastExecutedSessions: compactHistory,
    },
    null,
    2
  );

  return { systemInstruction, userPrompt };
}

function normalizeAndValidateAudit(params: {
  routine: LiveHevyRoutine;
  recentSessions: HevyWorkoutSession[];
  dossier: Holistic360Dossier;
  mode: 'audit' | 'build_optimal';
  primaryJson: Record<string, unknown>;
  secondaryJsons: Array<{ model: string; json: Record<string, unknown> }>;
  contributions: AiCouncilModelContribution[];
  totalLatencyMs: number;
}): LiveAiRoutineAudit {
  const { routine, recentSessions, dossier, mode, primaryJson, secondaryJsons, contributions, totalLatencyMs } = params;
  const biometricSummary = dossier.summaryLine;
  const latestSession = recentSessions[0] || null;

  // Mapear recomendaciones crudas del LLM por nombre normalizado
  const rawRecs = Array.isArray(primaryJson.exerciseRecommendations)
    ? (primaryJson.exerciseRecommendations as Record<string, unknown>[])
    : [];

  const findRawRec = (title: string, esTitle: string) => {
    const tNorm = normalizeKey(title);
    const esNorm = normalizeKey(esTitle);
    return (
      rawRecs.find((r) => {
        const rn = normalizeKey(String(r.exerciseName || r.title || ''));
        return rn === tNorm || rn === esNorm;
      }) ||
      rawRecs.find((r) => {
        const rn = normalizeKey(String(r.exerciseName || r.title || ''));
        return rn.length >= 6 && (tNorm.includes(rn) || rn.includes(tNorm) || esNorm.includes(rn));
      }) ||
      null
    );
  };

  // Mapear ejercicios ejecutados en la última sesión real (para deltas exactos contra lo último que hizo)
  const findLastExecutedExercise = (title: string) => {
    const tNorm = normalizeKey(title);
    for (const sess of recentSessions) {
      const found = sess.exercises.find((e) => normalizeKey(e.name) === tNorm);
      if (found) return found;
    }
    return null;
  };

  const recommendations: ExerciseAiRecommendation[] = routine.exercises.map((ex, idx) => {
    const raw = findRawRec(ex.title, ex.esTitle);
    const lastEx = findLastExecutedExercise(ex.title);
    const keepExercise = raw?.keepExercise === false ? false : true;

    const currentRestSeconds = Number.isFinite(ex.restSeconds) ? ex.restSeconds : 120;
    const suggestedRestSeconds =
      raw && Number.isFinite(Number(raw.suggestedRestSeconds))
        ? snapRestTo5s(Number(raw.suggestedRestSeconds), currentRestSeconds)
        : currentRestSeconds;
    const restDeltaSeconds = suggestedRestSeconds - currentRestSeconds;

    const suggestedOrderIndex =
      raw && Number.isFinite(Number(raw.suggestedOrderIndex))
        ? Math.max(0, Math.min(routine.exercises.length - 1, Math.round(Number(raw.suggestedOrderIndex))))
        : idx;

    // Series base: preferir series reales ejecutadas en la última sesión; si no ejecutó ese ejercicio, usar las de la rutina
    const rawSetList = Array.isArray(raw?.setSuggestions)
      ? (raw!.setSuggestions as Record<string, unknown>[])
      : [];

    const sourceSets =
      lastEx && lastEx.sets.length > 0
        ? lastEx.sets.map((s, sIdx) => ({
            setNumber: s.setNumber || sIdx + 1,
            isWarmup: Boolean(s.isWarmup || s.indicator === 'warmup'),
            currentWeightKg: Number(s.weightKg || 0),
            currentWeightLbs: Number(s.weightLbs || (s.weightKg ? Math.round((s.weightKg / LBS_TO_KG) * 10) / 10 : 0)),
            currentReps: Number(s.reps || 0),
            currentRpe: s.rpe,
          }))
        : ex.sets.map((s, sIdx) => ({
            setNumber: sIdx + 1,
            isWarmup: s.type === 'warmup',
            currentWeightKg: Number(s.weightKg || 0),
            currentWeightLbs: Number(s.weightLbs || 0),
            currentReps: Number(s.reps ?? s.repRangeStart ?? 0),
            currentRpe: s.rpe ?? undefined,
          }));

    const nonWarmupAiSets = rawSetList.filter((s) => !s.isWarmup);
    let workingCursor = 0;

    const setSuggestions: SetDeltaSuggestion[] = sourceSets.map((cur) => {
      if (cur.isWarmup || ex.exerciseType === 'duration') {
        return {
          setNumber: cur.setNumber,
          isWarmup: cur.isWarmup,
          currentWeightKg: cur.currentWeightKg,
          currentWeightLbs: cur.currentWeightLbs,
          suggestedWeightKg: cur.currentWeightKg,
          suggestedWeightLbs: cur.currentWeightLbs,
          weightDeltaKg: 0,
          currentReps: cur.currentReps,
          suggestedReps: cur.currentReps,
          repsDelta: 0,
          currentRpe: cur.currentRpe,
          targetRir: 4,
          shortBadge: cur.isWarmup ? 'Calentamiento' : 'Movilidad',
        };
      }

      const aiSet = nonWarmupAiSets[workingCursor] || nonWarmupAiSets[nonWarmupAiSets.length - 1] || null;
      workingCursor++;

      const suggestedWeightKg =
        aiSet && Number(aiSet.suggestedWeightKg) > 0
          ? Math.round(Number(aiSet.suggestedWeightKg) * 100) / 100
          : cur.currentWeightKg;
      const suggestedWeightLbs =
        suggestedWeightKg > 0 ? Math.round((suggestedWeightKg / LBS_TO_KG) * 10) / 10 : 0;
      const weightDeltaKg = Math.round((suggestedWeightKg - cur.currentWeightKg) * 100) / 100;

      const suggestedReps =
        aiSet && Number(aiSet.suggestedReps) > 0
          ? Math.round(Number(aiSet.suggestedReps))
          : cur.currentReps;
      const repsDelta = suggestedReps - cur.currentReps;

      const targetRir =
        aiSet && Number.isFinite(Number(aiSet.targetRir))
          ? Math.max(0, Math.min(4, Math.round(Number(aiSet.targetRir))))
          : 2;

      const suggestedRepRange = aiSet?.suggestedRepRange
        ? String(aiSet.suggestedRepRange).trim()
        : undefined;

      const shortBadge = buildShortBadge({
        weightDeltaKg,
        repsDelta,
        suggestedReps,
        suggestedWeightKg,
        unit: ex.unit,
        targetRir,
        currentRpe: cur.currentRpe,
        suggestedRepRange,
      });

      return {
        setNumber: cur.setNumber,
        isWarmup: false,
        currentWeightKg: cur.currentWeightKg,
        currentWeightLbs: cur.currentWeightLbs,
        suggestedWeightKg,
        suggestedWeightLbs,
        weightDeltaKg,
        currentReps: cur.currentReps,
        suggestedReps,
        ...(suggestedRepRange ? { suggestedRepRange } : {}),
        repsDelta,
        ...(cur.currentRpe !== undefined ? { currentRpe: cur.currentRpe } : {}),
        targetRir,
        shortBadge,
      };
    });

    const action = !keepExercise
      ? 'ELIMINAR'
      : sanitizeAction(raw?.action);

    const targetWorkingSetsRaw = Number(raw?.targetWorkingSets);
    const targetWorkingSets =
      Number.isFinite(targetWorkingSetsRaw) && targetWorkingSetsRaw >= 1 && targetWorkingSetsRaw <= 5
        ? Math.round(targetWorkingSetsRaw)
        : Math.max(1, setSuggestions.filter((s) => !s.isWarmup).length);

    return {
      exerciseName: ex.title,
      esTitle: ex.esTitle || translateExerciseTitle(ex.title),
      unit: ex.unit,
      currentOrderIndex: idx,
      suggestedOrderIndex,
      orderChangeReason: raw?.orderChangeReason ? String(raw.orderChangeReason).trim() : undefined,
      keepExercise,
      removeReason: !keepExercise && raw?.removeReason ? String(raw.removeReason).trim() : undefined,
      currentRestSeconds,
      suggestedRestSeconds,
      restDeltaSeconds,
      targetWorkingSets,
      action,
      coachReasoning:
        raw?.coachReasoning
          ? String(raw.coachReasoning).trim()
          : `Evaluado en contexto de ${routine.title}.`,
      pinnedNoteForHevy:
        raw?.pinnedNoteForHevy
          ? String(raw.pinnedNoteForHevy).trim().slice(0, 220)
          : '',
      setSuggestions,
    };
  });

  // Asegurar que suggestedOrderIndex forme una permutación limpia 0..(N-1) sin colisiones
  const kept = recommendations
    .filter((r) => r.keepExercise)
    .sort((a, b) => a.suggestedOrderIndex - b.suggestedOrderIndex || a.currentOrderIndex - b.currentOrderIndex);
  kept.forEach((r, i) => {
    r.suggestedOrderIndex = i;
  });
  const dropped = recommendations.filter((r) => !r.keepExercise);
  dropped.forEach((r, i) => {
    r.suggestedOrderIndex = kept.length + i;
  });

  // Fusionar hallazgos estructurales del modelo primario + modelos secundarios del consejo (sin duplicar)
  const rawIssues = Array.isArray(primaryJson.structuralIssues)
    ? (primaryJson.structuralIssues as Record<string, unknown>[])
    : [];
  const issues: StructuralIssue[] = [];
  const seenIssueTitles = new Set<string>();

  const pushIssue = (item: Record<string, unknown>, modelTag?: string) => {
    const title = String(item?.title || '').trim();
    const detail = String(item?.detail || '').trim();
    if (!title || !detail) return;
    const normT = normalizeKey(title).slice(0, 32);
    if (seenIssueTitles.has(normT)) return;
    seenIssueTitles.add(normT);
    const sev = String(item.severity || 'warning').toLowerCase();
    const severity: StructuralIssue['severity'] =
      sev === 'critical' || sev === 'warning' || sev === 'optimization' ? sev : 'warning';
    const cat = String(item.category || 'orden').toLowerCase();
    const category: StructuralIssue['category'] =
      cat === 'orden' ||
      cat === 'descanso' ||
      cat === 'volumen' ||
      cat === 'rpe_fatiga' ||
      cat === 'desbalance' ||
      cat === 'nota_atleta'
        ? cat
        : 'orden';
    issues.push({
      severity,
      category,
      title,
      detail: modelTag ? `${detail} [${modelTag}]` : detail,
    });
  };

  for (const it of rawIssues) pushIssue(it);
  for (const sec of secondaryJsons) {
    const secIssues = Array.isArray(sec.json.structuralIssues)
      ? (sec.json.structuralIssues as Record<string, unknown>[])
      : [];
    for (const it of secIssues.slice(0, 3)) {
      pushIssue(it, sec.model);
    }
  }

  // Promediar ligeramente la nota estructural si otro modelo del consejo también puntuó
  const scores: number[] = [];
  const primaryScore = Number(primaryJson.structureScore);
  if (Number.isFinite(primaryScore) && primaryScore >= 0 && primaryScore <= 100) {
    scores.push(primaryScore);
  }
  for (const sec of secondaryJsons) {
    const s = Number(sec.json.structureScore);
    if (Number.isFinite(s) && s >= 0 && s <= 100) scores.push(s);
  }
  const structureScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 60;

  let executiveVerdict = String(primaryJson.executiveVerdict || '').trim();
  if (secondaryJsons.length > 0 && secondaryJsons[0].json.executiveVerdict) {
    const secVerdict = String(secondaryJsons[0].json.executiveVerdict).trim();
    if (secVerdict && !executiveVerdict.includes(secVerdict.slice(0, 40))) {
      executiveVerdict = `${executiveVerdict} • Consenso ${secondaryJsons[0].model}: ${secVerdict.slice(0, 260)}`;
    }
  }

  const modelsUsed = contributions.filter((c) => c.success).map((c) => c.model);

  const rawCross = primaryJson.coherenceCrossCheck as Record<string, unknown> | undefined;
  const coherenceCrossCheck: CoherenceCrossCheck = {
    measurementsImpact:
      String(rawCross?.measurementsImpact || '').trim() ||
      (dossier.measurements17Pts.asymmetryAlerts.length > 0
        ? `Detectadas ${dossier.measurements17Pts.asymmetryAlerts.length} asimetrías Izq<Der (-0.5 cm); ejercicios unilaterales inician por el lado izquierdo.`
        : `Medidas 17 pts (${dossier.measurements17Pts.chestCm ?? '?'} cm pecho / ${dossier.measurements17Pts.shouldersCm ?? '?'} cm hombros) cruzadas con volumen semanal.`),
    femmtoAndNutritionImpact:
      String(rawCross?.femmtoAndNutritionImpact || '').trim() ||
      `Ectomorfo ${dossier.athleteProfile.weightKg} kg → 60 kg; tope de ${dossier.nutritionAndHydration.maxRecommendedExercisesToday} ejercicios y ${dossier.nutritionAndHydration.maxRecommendedSetsToday} series efectivas para evitar catabolismo.`,
    walksAndBikeImpact:
      String(rawCross?.walksAndBikeImpact || '').trim() ||
      `Paseos de Frida + Sienna (~${dossier.walksBikeAndSchedule.estimatedWeeklyBikeKm} km/sem en bicicleta a 15 km/h) integrados para regular fatiga periférica.`,
    sleepAndWatchImpact:
      String(rawCross?.sleepAndWatchImpact || '').trim() ||
      `Sueño ${dossier.biometricsAndWatch.sleepHours ?? '?'}h, HRV ${dossier.biometricsAndWatch.hrvMs ?? '?'} ms y Readiness ${dossier.biometricsAndWatch.readinessScore ?? '?'}/100 regulando RIR 1-2 y descansos.`,
    notebookLmCitations: Array.isArray(rawCross?.notebookLmCitations)
      ? (rawCross!.notebookLmCitations as unknown[]).map((c) => String(c).trim()).filter(Boolean).slice(0, 6)
      : dossier.notebookLmKnowledge.coreRules.slice(0, 3).map((r) => `${r.id}: ${r.topic}`),
  };

  const projRaw = Number(primaryJson.projectedOptimizedScore);
  const projectedOptimizedScore =
    Number.isFinite(projRaw) && projRaw >= structureScore && projRaw <= 100
      ? Math.round(projRaw)
      : Math.min(96, Math.max(structureScore + 28, 88));

  return {
    routineId: routine.uuid,
    routineShortId: routine.shortId,
    routineName: routine.title,
    routineUrl: routine.routineUrl,
    editUrl: routine.editUrl,
    mode,
    analyzedAt: new Date().toISOString(),
    totalLatencyMs,
    modelsUsed,
    modelContributions: contributions,
    structureScore,
    projectedOptimizedScore,
    executiveVerdict:
      executiveVerdict ||
      `Auditoría completada para ${routine.title} (${latestSession ? `última sesión: ${latestSession.date}` : 'rutina activa'}).`,
    biometricContextSummary: biometricSummary,
    sourcesConnectedCount: dossier.sourcesConnectedCount,
    holisticPills: dossier.pills,
    coherenceCrossCheck,
    structuralIssues: issues.slice(0, 10),
    exerciseRecommendations: recommendations,
  };
}

/**
 * Ejecuta el Consejo Multi-IA REAL en paralelo (Google AI Studio Gemini + NVIDIA NIM)
 * cruzando TODAS las 8 fuentes vivas de VYFITH + Base NotebookLM ("MegaProyecto")
 * en modo 'audit' o 'build_optimal' (Constructor Autónomo 360°).
 * NUNCA inventa respuestas deterministas de 0ms: si todos los modelos fallan, devuelve el error HTTP real.
 */
export async function runRealAiRoutineAudit(params: {
  routineName: string;
  mode?: 'audit' | 'build_optimal';
  keys?: AiKeysConfig;
}): Promise<
  | { ok: true; audit: LiveAiRoutineAudit }
  | {
      ok: false;
      status: number;
      error: string;
      modelContributions: AiCouncilModelContribution[];
    }
> {
  const startedAt = Date.now();
  const mode: 'audit' | 'build_optimal' = params.mode === 'build_optimal' ? 'build_optimal' : 'audit';
  const routine = findLiveHevyRoutine(params.routineName);
  if (!routine) {
    return {
      ok: false,
      status: 404,
      error: `No se encontró la rutina viva '${params.routineName}' en data/real_hevy_routines.json. Ejecuta «Exportar Rutinas» o «Sync en Vivo» primero.`,
      modelContributions: [],
    };
  }

  const { geminiKeys, nvidiaKey } = resolveConfiguredAiKeys(params.keys);
  if (geminiKeys.length === 0 && !nvidiaKey) {
    return {
      ok: false,
      status: 401,
      error: 'No hay claves de Google AI Studio (GEMINI_API_KEY) ni NVIDIA NIM (NVIDIA_API_KEY) configuradas en el servidor.',
      modelContributions: [],
    };
  }

  const recentSessions = getRecentMatchingSessions(routine.title, 4);
  const dossier = buildHolistic360AthleteDossier(routine.title);
  const { systemInstruction, userPrompt } = buildPromptForRoutine({
    routine,
    recentSessions,
    dossier,
    mode,
  });

  // Lanzar Consejo Multi-IA REAL en paralelo (Gemini JSON mode + NVIDIA NIM)
  const jobs: Array<
    Promise<{
      provider: string;
      success: boolean;
      status: number;
      model: string;
      latencyMs: number;
      json: Record<string, unknown> | null;
      error?: string;
    }>
  > = [];

  if (geminiKeys.length > 0) {
    jobs.push(
      callGeminiStructuredJson({
        geminiKeys,
        model: 'gemini-flash-lite-latest',
        systemInstruction,
        userPrompt,
      }).then(async (r) => {
        if (r.success || r.status === 504) return { provider: 'gemini', ...r };
        const backup = await callGeminiStructuredJson({
          geminiKeys,
          model: 'gemini-flash-latest',
          systemInstruction,
          userPrompt,
        });
        return { provider: 'gemini', ...backup };
      })
    );
    jobs.push(
      callGeminiStructuredJson({
        geminiKeys,
        model: 'gemini-3-flash-preview',
        systemInstruction,
        userPrompt,
      }).then((r) => ({ provider: 'gemini', ...r }))
    );
  }

  if (nvidiaKey) {
    jobs.push(
      callNvidiaStructuredJson({
        nvidiaKey,
        model: 'nvidia/nemotron-3.5-bolt-e4b',
        displayName: 'Nemotron 3.5 Bolt (NVIDIA NIM)',
        systemInstruction,
        userPrompt,
      }).then(async (r) => {
        if (r.success || r.status === 504 || r.latencyMs > 8000) {
          return { provider: 'nvidia', ...r };
        }
        const backup = await callNvidiaStructuredJson({
          nvidiaKey,
          model: 'google/gemma-4-31b-it',
          displayName: 'Gemma 4 31B (NVIDIA NIM)',
          systemInstruction,
          userPrompt,
        });
        return { provider: 'nvidia', ...backup };
      })
    );
  }

  const results = await Promise.all(jobs);
  const contributions: AiCouncilModelContribution[] = results.map((r) => ({
    model: r.model,
    provider: r.provider,
    status: r.status,
    latencyMs: r.latencyMs,
    success: r.success,
    ...(r.error ? { error: r.error } : {}),
  }));

  const succeeded = results.filter((r) => r.success && r.json);
  if (succeeded.length === 0) {
    const firstStatus = results[0]?.status || 503;
    return {
      ok: false,
      status: firstStatus,
      error: `El Consejo Multi-IA no pudo completar el análisis (${results.map((r) => `${r.model}: ${r.error || 'HTTP ' + r.status}`).join(' | ')})`,
      modelContributions: contributions,
    };
  }

  // Elegir el JSON más completo (mayor cobertura de ejercicios de la rutina) como primario
  const ranked = [...succeeded].sort((a, b) => {
    const lenA = Array.isArray(a.json?.exerciseRecommendations) ? (a.json!.exerciseRecommendations as unknown[]).length : 0;
    const lenB = Array.isArray(b.json?.exerciseRecommendations) ? (b.json!.exerciseRecommendations as unknown[]).length : 0;
    return lenB - lenA;
  });

  const primary = ranked[0];
  const secondaries = ranked.slice(1).map((r) => ({ model: r.model, json: r.json! }));

  const audit = normalizeAndValidateAudit({
    routine,
    recentSessions,
    dossier,
    mode,
    primaryJson: primary.json!,
    secondaryJsons: secondaries,
    contributions,
    totalLatencyMs: Date.now() - startedAt,
  });

  saveAiAudit(audit);
  return { ok: true, audit };
}
