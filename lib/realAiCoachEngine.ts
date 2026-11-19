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
} from '@/lib/realAiCoachTypes';

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
  biometrics: Record<string, unknown>;
}): { systemInstruction: string; userPrompt: string } {
  const systemInstruction = `Eres el Consejo Técnico de Hipertrofia y Biomecánica (metodología Jeff Nippard + Dr. Mike Israetel + fisiología del ejercicio) para Santiago Smit Teherán Mogollón (21 años, ectomorfo magro 55.5 kg -> meta 60 kg, entrena solo en Gimnasio UPB Montería).

Tu trabajo es hacer una AUDITORÍA REAL, HONESTA, SIN FILTRO y SERIE POR SERIE de su rutina actual en Hevy App cruzando:
1) La ESTRUCTURA REAL de su rutina en Hevy (orden de los ejercicios #0..#(N-1), tiempos de descanso en segundos, volumen basura / redundancia, fatiga de agarre, estiramientos estáticos antes de compuestos pesados).
2) Sus ÚLTIMAS SESIONES EJECUTADAS (pesos exactos, repeticiones exactas, RPE 9.5-10 al fallo, caída de rendimiento entre series, duración real, frecuencia cardíaca del reloj si existe).
3) TODAS SUS NOTAS PERSONALES en cada ejercicio (ej. si dice "estoy solo y no me atrevo por si se me queda la barra", debes citarlo explícitamente y adaptar peso/reps/seguridad/RIR).
4) Su BIOMETRÍA VIVA (sueño, HRV, RHR, Readiness, hidratación, proteína y calorías).

REGLAS ESTRICTAS DE RESPUESTA:
- Responde ÚNICAMENTE con un objeto JSON válido (sin markdown ni texto fuera del JSON).
- Sé quirúrgico y honesto: si la rutina tiene 18 ejercicios desordenados, dilo claro con una nota baja realista (ej. 45-65/100) y propón el orden óptimo ('suggestedOrderIndex' de 0 a N-1) y marca con '"keepExercise": false' los ejercicios claramente redundantes / volumen basura (ej. 4 ejercicios de antebrazo en medio del torso o estiramiento estático al inicio).
- Para CADA ejercicio de la rutina, calcula recomendaciones SERIE POR SERIE ('setSuggestions') con:
  * 'setNumber' (1, 2, 3... solo series efectivas; marca 'isWarmup: true' si es serie W).
  * 'suggestedWeightKg' (número exacto en kg; si baja peso para sacar la serie de RPE 10, baja 2.5 a 5 kg; si sube peso por Doble Progresión, sube 2.27 kg / 5 lbs o 2.5 kg).
  * 'suggestedReps' (entero exacto: ej. si hizo 6 reps, sugiere 7 para +1 rep; si hizo 4 reps al fallo @10, sugiere bajar peso o ajustar reps para dejar RIR 1-2).
  * 'suggestedRepRange' (ej. "6-8", "8-12", "10-15").
  * 'targetRir' (1, 2 o 3).
- Para CADA ejercicio, prescribe 'suggestedRestSeconds' múltiplo de 5 entre 60 y 240 (compuestos pesados: 150-180s; accesorios multiarticulares: 120s; aislamientos/brazos/gemelos/core: 60-90s).
- Para CADA ejercicio, escribe 'pinnedNoteForHevy' (máximo 130 caracteres, español directo y accionable para que Santiago lo lea en su celular dentro de Hevy App mientras entrena).

ESQUEMA JSON OBLIGATORIO:
{
  "structureScore": 52,
  "executiveVerdict": "Diagnóstico directo de 3-4 frases sin relleno citando datos reales de la rutina, sesiones y biometría.",
  "structuralIssues": [
    {
      "severity": "critical | warning | optimization",
      "category": "orden | descanso | volumen | rpe_fatiga | desbalance | nota_atleta",
      "title": "Título breve y contundente",
      "detail": "Explicación biomecánica concreta con números y nombres de ejercicios."
    }
  ],
  "exerciseRecommendations": [
    {
      "exerciseName": "Nombre exacto en inglés de la rutina",
      "suggestedOrderIndex": 0,
      "orderChangeReason": "Por qué va en esta posición (o vacío si no cambia)",
      "keepExercise": true,
      "removeReason": "Solo si keepExercise es false: por qué sobra",
      "suggestedRestSeconds": 180,
      "action": "SUBIR_PESO | SUBIR_REPS | BAJAR_PESO | MANTENER_TECNICA | REUBICAR | ELIMINAR",
      "coachReasoning": "Por qué exacto citando últimas reps, RPE, notas personales del atleta o fatiga.",
      "pinnedNoteForHevy": "Meta: 61.2 kg x 7,6 (RIR 1-2) | Usar pines de seguridad solo | 3:00 descanso",
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
      routineTitle: params.routine.title,
      routineShortId: params.routine.shortId,
      totalExercisesInRoutine: params.routine.exerciseCount,
      biometricsLive: params.biometrics,
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
  biometricSummary: string;
  primaryJson: Record<string, unknown>;
  secondaryJsons: Array<{ model: string; json: Record<string, unknown> }>;
  contributions: AiCouncilModelContribution[];
  totalLatencyMs: number;
}): LiveAiRoutineAudit {
  const { routine, recentSessions, biometricSummary, primaryJson, secondaryJsons, contributions, totalLatencyMs } = params;
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

  return {
    routineId: routine.uuid,
    routineShortId: routine.shortId,
    routineName: routine.title,
    routineUrl: routine.routineUrl,
    editUrl: routine.editUrl,
    analyzedAt: new Date().toISOString(),
    totalLatencyMs,
    modelsUsed,
    modelContributions: contributions,
    structureScore,
    executiveVerdict:
      executiveVerdict ||
      `Auditoría completada para ${routine.title} (${latestSession ? `última sesión: ${latestSession.date}` : 'rutina activa'}).`,
    biometricContextSummary: biometricSummary,
    structuralIssues: issues.slice(0, 10),
    exerciseRecommendations: recommendations,
  };
}

/**
 * Ejecuta el Consejo Multi-IA REAL en paralelo (Google AI Studio Gemini + NVIDIA NIM)
 * para auditar la rutina viva de Hevy y devolver recomendaciones serie por serie.
 * NUNCA inventa respuestas deterministas de 0ms: si todos los modelos fallan, devuelve el error HTTP real.
 */
export async function runRealAiRoutineAudit(params: {
  routineName: string;
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
  const { summaryLine: biometricSummary, structured: biometrics } = buildLiveBiometricSnapshot();
  const { systemInstruction, userPrompt } = buildPromptForRoutine({
    routine,
    recentSessions,
    biometrics,
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
    biometricSummary,
    primaryJson: primary.json!,
    secondaryJsons: secondaries,
    contributions,
    totalLatencyMs: Date.now() - startedAt,
  });

  saveAiAudit(audit);
  return { ok: true, audit };
}
