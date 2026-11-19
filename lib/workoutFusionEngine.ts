import fs from 'fs';
import path from 'path';
import type {
  HevyWorkoutSession,
  WatchExerciseSession,
  FusedWatchBiometrics,
  HrZoneMinutes,
} from './hevyStore';
import { parseHevyDate } from './hevyDateParser';

const WATCH_WORKOUTS_PATH = path.join(process.cwd(), 'data', 'real_watch_workouts.json');
const HEVY_WORKOUTS_PATH = path.join(process.cwd(), 'data', 'real_hevy_workouts.json');

const FIREBASE_PROJECT_ID = 'gen-lang-client-0463513688';
const FIRESTORE_DB_ID = 'ai-studio-android-vyfithap-2321ae21-ba56-4210-a764-79319278e807';
const SANTIAGO_UID = 'ZVcSo21uZTOujKDgBWlSMqctLjg2';
const BOGOTA_OFFSET = '-05:00';

// Referencia fisiológica real de Santiago (21 años: FCmáx = 220 - 21 = 199 bpm, FC reposo típica = 56 bpm)
const SANTIAGO_MAX_HR = 199;
const SANTIAGO_RESTING_HR = 56;

export interface WatchArchiveStore {
  lastUpdated: string;
  lastFirestorePullAt?: string;
  sessions: WatchExerciseSession[];
}

export interface FusionSummaryReport {
  totalHevyWorkouts: number;
  fusedWorkoutsCount: number;
  newlyFusedCount: number;
  watchSessionsCount: number;
  unmatchedWatchSessionsCount: number;
  firestoreSessionsPulled: number;
  matchedPairs: Array<{
    hevyId: string;
    hevyName: string;
    hevyDate: string;
    watchSessionId: string;
    watchTitle: string;
    watchDateIso: string;
    watchStartTime: string;
    watchEndTime: string;
    avgHeartRateBpm: number | null;
    maxHeartRateBpm: number | null;
    caloriesBurned: number | null;
    startOffsetSeconds: number;
    endOffsetSeconds: number;
    overlapPct: number;
    matchConfidence: FusedWatchBiometrics['matchConfidence'];
  }>;
  watchSessions: WatchExerciseSession[];
  workouts: HevyWorkoutSession[];
}

function pad2(n: number): string {
  return String(Math.floor(Math.abs(n))).padStart(2, '0');
}

/**
 * Convierte una fecha/hora de Hevy ("17 nov 2026, 17:11" o ISO) a epoch ms en zona horaria America/Bogota (-05:00).
 */
export function parseLocalBogotaIso(dateStr?: string | null): { ms: number; iso: string; dateIso: string; hhmm: string } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Si ya trae zona horaria explícita (Z o ±HH:MM), respetarla directamente
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    const dt = new Date(trimmed);
    if (!isNaN(dt.getTime())) {
      const bogotaParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(dt);
      const get = (t: string) => bogotaParts.find((p) => p.type === t)?.value || '00';
      const hh = get('hour') === '24' ? '00' : get('hour');
      const dateIso = `${get('year')}-${get('month')}-${get('day')}`;
      return {
        ms: dt.getTime(),
        iso: `${dateIso}T${hh}:${get('minute')}:${get('second')}${BOGOTA_OFFSET}`,
        dateIso,
        hhmm: `${hh}:${get('minute')}`,
      };
    }
  }

  // Formato ISO local sin offset: YYYY-MM-DDTHH:mm(:ss)?
  const isoLocal = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (isoLocal) {
    const dateIso = `${isoLocal[1]}-${isoLocal[2]}-${isoLocal[3]}`;
    const hh = pad2(Number(isoLocal[4]));
    const mm = pad2(Number(isoLocal[5]));
    const ss = pad2(Number(isoLocal[6] || '0'));
    const iso = `${dateIso}T${hh}:${mm}:${ss}${BOGOTA_OFFSET}`;
    const ms = Date.parse(iso);
    if (Number.isFinite(ms)) {
      return { ms, iso, dateIso, hhmm: `${hh}:${mm}` };
    }
  }

  // Formato Hevy español/inglés ("17 nov 2026, 17:11")
  const parsed = parseHevyDate(trimmed);
  if (parsed) {
    const dateIso = `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
    const hh = pad2(parsed.getHours());
    const mm = pad2(parsed.getMinutes());
    const ss = pad2(parsed.getSeconds());
    const iso = `${dateIso}T${hh}:${mm}:${ss}${BOGOTA_OFFSET}`;
    const ms = Date.parse(iso);
    if (Number.isFinite(ms)) {
      return { ms, iso, dateIso, hhmm: `${hh}:${mm}` };
    }
  }

  return null;
}

/**
 * Obtiene la ventana temporal [startMs, endMs] exacta de un entrenamiento de Hevy.
 */
export function resolveHevyWindow(workout: HevyWorkoutSession): {
  startMs: number;
  endMs: number;
  dateIso: string;
  startIso: string;
  endIso: string;
} | null {
  const startInfo =
    parseLocalBogotaIso(workout.startTimeIso) ||
    parseLocalBogotaIso(workout.date);
  if (!startInfo) return null;

  let endInfo = parseLocalBogotaIso(workout.endTimeIso);
  if (!endInfo && workout.endTimeLocal && /^\d{1,2}:\d{2}$/.test(workout.endTimeLocal.trim())) {
    const [eh, em] = workout.endTimeLocal.trim().split(':').map(Number);
    const candidateEnd = parseLocalBogotaIso(`${startInfo.dateIso}T${pad2(eh)}:${pad2(em)}:00${BOGOTA_OFFSET}`);
    if (candidateEnd) {
      // Si cruzó medianoche
      if (candidateEnd.ms < startInfo.ms) {
        const nextDayMs = candidateEnd.ms + 86_400_000;
        endInfo = {
          ms: nextDayMs,
          iso: new Date(nextDayMs).toISOString(),
          dateIso: startInfo.dateIso,
          hhmm: `${pad2(eh)}:${pad2(em)}`,
        };
      } else {
        endInfo = candidateEnd;
      }
    }
  }

  const durMinutes = Math.max(5, Number(workout.durationMinutes || 55));
  const endMs =
    endInfo && endInfo.ms > startInfo.ms
      ? endInfo.ms
      : startInfo.ms + durMinutes * 60_000;
  const endIso = endInfo && endInfo.ms > startInfo.ms
    ? endInfo.iso
    : parseLocalBogotaIso(new Date(endMs).toISOString())?.iso || new Date(endMs).toISOString();

  return {
    startMs: startInfo.ms,
    endMs,
    dateIso: startInfo.dateIso,
    startIso: startInfo.iso,
    endIso,
  };
}

/**
 * Obtiene la ventana temporal [startMs, endMs] exacta de una sesión del reloj (Xiaomi / Health Connect).
 */
export function resolveWatchWindow(watch: WatchExerciseSession): {
  startMs: number;
  endMs: number;
  dateIso: string;
  startIso: string;
  endIso: string;
} | null {
  const startFromIso = parseLocalBogotaIso(watch.startTimeIso);
  const startFromText =
    watch.dateIso && watch.startTimeText
      ? parseLocalBogotaIso(`${watch.dateIso}T${watch.startTimeText}:00${BOGOTA_OFFSET}`)
      : null;
  const startInfo = startFromIso || startFromText;
  if (!startInfo) return null;

  let endInfo = parseLocalBogotaIso(watch.endTimeIso);
  if (!endInfo && watch.dateIso && watch.endTimeText) {
    const candidate = parseLocalBogotaIso(`${watch.dateIso}T${watch.endTimeText}:00${BOGOTA_OFFSET}`);
    if (candidate) {
      if (candidate.ms < startInfo.ms) {
        const nextDayMs = candidate.ms + 86_400_000;
        endInfo = {
          ms: nextDayMs,
          iso: parseLocalBogotaIso(new Date(nextDayMs).toISOString())?.iso || new Date(nextDayMs).toISOString(),
          dateIso: watch.dateIso,
          hhmm: watch.endTimeText,
        };
      } else {
        endInfo = candidate;
      }
    }
  }

  const durSeconds =
    Number(watch.durationSeconds || 0) > 0
      ? Number(watch.durationSeconds)
      : Math.max(60, Number(watch.durationMinutes || 1) * 60);

  const endMs =
    endInfo && endInfo.ms > startInfo.ms
      ? endInfo.ms
      : startInfo.ms + durSeconds * 1000;
  const endIso =
    endInfo && endInfo.ms > startInfo.ms
      ? endInfo.iso
      : parseLocalBogotaIso(new Date(endMs).toISOString())?.iso || new Date(endMs).toISOString();

  return {
    startMs: startInfo.ms,
    endMs,
    dateIso: startInfo.dateIso,
    startIso: startInfo.iso,
    endIso,
  };
}

function normalizeHrZones(raw: any): HrZoneMinutes | null {
  if (!raw || typeof raw !== 'object') return null;
  const z1 = Number(raw.z1 ?? raw.Z1 ?? 0) || 0;
  const z2 = Number(raw.z2 ?? raw.Z2 ?? 0) || 0;
  const z3 = Number(raw.z3 ?? raw.Z3 ?? 0) || 0;
  const z4 = Number(raw.z4 ?? raw.Z4 ?? 0) || 0;
  const z5 = Number(raw.z5 ?? raw.Z5 ?? 0) || 0;
  if (z1 + z2 + z3 + z4 + z5 <= 0) return null;
  return { z1, z2, z3, z4, z5 };
}

function posOrNull(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Normaliza un objeto crudo de sesión del reloj (Firestore, Android HTTP o CSV) al esquema estándar.
 */
export function normalizeWatchSession(raw: any): WatchExerciseSession | null {
  if (!raw || typeof raw !== 'object') return null;

  const startFromIso = parseLocalBogotaIso(raw.startTimeIso || raw.startTime);
  const endFromIso = parseLocalBogotaIso(raw.endTimeIso || raw.endTime);

  const dateIso = String(raw.dateIso || startFromIso?.dateIso || '').trim();
  const startTimeText = String(raw.startTimeText || startFromIso?.hhmm || '').trim();
  const endTimeText = String(raw.endTimeText || endFromIso?.hhmm || '').trim();

  if (!dateIso || !startTimeText) return null;

  const durationSeconds = Number(raw.durationSeconds || 0) || undefined;
  let durationMinutes = Number(raw.durationMinutes || 0);
  if ((!Number.isFinite(durationMinutes) || durationMinutes <= 0) && startFromIso && endFromIso && endFromIso.ms > startFromIso.ms) {
    durationMinutes = Math.max(1, Math.round((endFromIso.ms - startFromIso.ms) / 60_000));
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    durationMinutes = durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : 1;
  }

  const title = String(raw.title || raw.exerciseTypeName || 'Entrenamiento Reloj').trim();
  const exerciseTypeName = String(raw.exerciseTypeName || raw.title || 'Entrenamiento').trim();
  const rawId = String(raw.id || '').trim();
  const id = rawId || `watch-${dateIso}-${startTimeText.replace(':', '')}-${Math.round(durationMinutes)}m`;

  const sourceLabel = String(raw.sourceLabel || 'Mi Fitness (Xiaomi) (Reloj)').trim();
  const rawDev = String(raw.deviceModel || '').trim();
  const deviceModel =
    !rawDev || rawDev.toLowerCase() === 'xiaomi'
      ? 'Xiaomi Smart Band 9 Pro'
      : rawDev;

  return {
    id,
    dateIso,
    startTimeText,
    endTimeText: endTimeText || startTimeText,
    ...(startFromIso?.iso ? { startTimeIso: startFromIso.iso } : raw.startTimeIso ? { startTimeIso: String(raw.startTimeIso) } : {}),
    ...(endFromIso?.iso ? { endTimeIso: endFromIso.iso } : raw.endTimeIso ? { endTimeIso: String(raw.endTimeIso) } : {}),
    durationMinutes: Math.round(durationMinutes),
    ...(durationSeconds ? { durationSeconds: Math.round(durationSeconds) } : {}),
    title,
    exerciseTypeName,
    ...(Number.isFinite(Number(raw.exerciseTypeCode)) ? { exerciseTypeCode: Number(raw.exerciseTypeCode) } : {}),
    caloriesBurned: Math.round((Number(raw.caloriesBurned || 0) || 0) * 10) / 10,
    avgHeartRateBpm: posOrNull(raw.avgHeartRateBpm),
    maxHeartRateBpm: posOrNull(raw.maxHeartRateBpm),
    minHeartRateBpm: posOrNull(raw.minHeartRateBpm),
    ...(Number(raw.hrSampleCount || 0) > 0 ? { hrSampleCount: Number(raw.hrSampleCount) } : {}),
    hrZoneMinutes: normalizeHrZones(raw.hrZoneMinutes),
    distanceMeters: posOrNull(raw.distanceMeters),
    sourceLabel,
    deviceModel,
    isWatchSource: raw.isWatchSource !== false,
    syncedAt: String(raw.syncedAt || new Date().toISOString()),
  };
}

function isLikelyStrengthOrGymWatchType(watch: WatchExerciseSession): boolean {
  const txt = `${watch.title} ${watch.exerciseTypeName}`.toLowerCase();
  return (
    txt.includes('fuerza') ||
    txt.includes('strength') ||
    txt.includes('pesa') ||
    txt.includes('weight') ||
    txt.includes('gym') ||
    txt.includes('gimnasio') ||
    txt.includes('calistenia') ||
    txt.includes('calisthenics') ||
    txt.includes('funcional') ||
    txt.includes('functional') ||
    txt.includes('libre') ||
    txt.includes('freestyle') ||
    txt.includes('entrenamiento') ||
    txt.includes('workout') ||
    txt.includes('hiit') ||
    txt.includes('cross') ||
    txt.includes('other') ||
    txt.includes('otro')
  );
}

function isLikelyShortCommuteCardio(watch: WatchExerciseSession): boolean {
  const txt = `${watch.title} ${watch.exerciseTypeName}`.toLowerCase();
  const isCommuteType =
    txt.includes('ciclismo') ||
    txt.includes('cycling') ||
    txt.includes('bici') ||
    txt.includes('caminata') ||
    txt.includes('walking') ||
    txt.includes('correr') ||
    txt.includes('running');
  return isCommuteType && watch.durationMinutes < 25;
}

/**
 * Construye el bloque `FusedWatchBiometrics` combinando métricas reales del reloj + volumen de Hevy.
 */
export function buildFusedWatchBiometrics(
  hevy: HevyWorkoutSession,
  watch: WatchExerciseSession,
  params: {
    startOffsetSeconds: number;
    endOffsetSeconds: number;
    overlapPct: number;
    matchConfidence: FusedWatchBiometrics['matchConfidence'];
  }
): FusedWatchBiometrics {
  const avgHr = posOrNull(watch.avgHeartRateBpm);
  const maxHr = posOrNull(watch.maxHeartRateBpm);
  const minHr = posOrNull(watch.minHeartRateBpm);
  const cals = posOrNull(watch.caloriesBurned);
  const watchDurMin = Math.max(1, watch.durationMinutes || hevy.durationMinutes || 1);

  const kcalPerMinute = cals !== null ? Number((cals / watchDurMin).toFixed(2)) : null;
  const kgPerKcal =
    cals !== null && cals > 0 && Number(hevy.totalVolumeKg || 0) > 0
      ? Number((Number(hevy.totalVolumeKg) / cals).toFixed(1))
      : null;

  // Índice de carga cardiovascular estilo TRIMP (Banister simplificado, normalizado 0-200)
  let cardiacLoadIndex: number | null = null;
  if (avgHr !== null && avgHr > SANTIAGO_RESTING_HR) {
    const hrr = Math.max(0.05, Math.min(1.0, (avgHr - SANTIAGO_RESTING_HR) / (SANTIAGO_MAX_HR - SANTIAGO_RESTING_HR)));
    // Factor exponencial Banister masculino: durMin * HRR * 0.64 * e^(1.92 * HRR)
    const trimp = watchDurMin * hrr * 0.64 * Math.exp(1.92 * hrr);
    cardiacLoadIndex = Math.round(trimp);
  }

  return {
    watchSessionId: watch.id,
    watchTitle: watch.title,
    watchExerciseType: watch.exerciseTypeName,
    watchDevice: watch.deviceModel || 'Xiaomi Smart Band 9 Pro',
    watchSource: watch.sourceLabel || 'Mi Fitness (Xiaomi) (Reloj)',
    watchDateIso: watch.dateIso,
    watchStartTime: watch.startTimeText,
    watchEndTime: watch.endTimeText,
    ...(watch.startTimeIso ? { watchStartIso: watch.startTimeIso } : {}),
    ...(watch.endTimeIso ? { watchEndIso: watch.endTimeIso } : {}),
    watchDurationMinutes: watch.durationMinutes,
    ...(watch.durationSeconds ? { watchDurationSeconds: watch.durationSeconds } : {}),
    startOffsetSeconds: Math.round(params.startOffsetSeconds),
    endOffsetSeconds: Math.round(params.endOffsetSeconds),
    overlapPct: Math.round(Math.max(0, Math.min(100, params.overlapPct))),
    matchConfidence: params.matchConfidence,
    avgHeartRateBpm: avgHr !== null ? Math.round(avgHr) : null,
    maxHeartRateBpm: maxHr !== null ? Math.round(maxHr) : null,
    minHeartRateBpm: minHr !== null ? Math.round(minHr) : null,
    ...(watch.hrSampleCount ? { hrSampleCount: watch.hrSampleCount } : {}),
    hrZoneMinutes: normalizeHrZones(watch.hrZoneMinutes),
    caloriesBurned: cals !== null ? Number(cals.toFixed(1)) : null,
    kcalPerMinute,
    kgPerKcal,
    cardiacLoadIndex,
    distanceMeters: posOrNull(watch.distanceMeters),
    fusedAt: new Date().toISOString(),
  };
}

/**
 * Motor puro de emparejamiento temporal 1-a-1 entre sesiones de Hevy y sesiones del reloj.
 * Diseñado específicamente para inicios simultáneos y desfases de segundos/minutos al finalizar.
 */
export function matchHevyAndWatchSessions(
  hevyWorkouts: HevyWorkoutSession[],
  watchSessions: WatchExerciseSession[]
): {
  workouts: HevyWorkoutSession[];
  newlyFusedCount: number;
  fusedWorkoutsCount: number;
  matchedPairs: FusionSummaryReport['matchedPairs'];
} {
  const cloned = hevyWorkouts.map((w) => ({ ...w }));
  const hevyWindows = new Map<string, ReturnType<typeof resolveHevyWindow>>();
  const watchWindows = new Map<string, ReturnType<typeof resolveWatchWindow>>();

  for (const h of cloned) {
    hevyWindows.set(h.id, resolveHevyWindow(h));
  }
  for (const w of watchSessions) {
    watchWindows.set(w.id, resolveWatchWindow(w));
  }

  // Preservar vinculaciones manuales existentes (no las sobrescribe el algoritmo automático)
  const lockedHevyIds = new Set<string>();
  const lockedWatchIds = new Set<string>();
  for (const h of cloned) {
    if (h.watchBiometrics?.matchConfidence === 'manual' && h.watchBiometrics.watchSessionId) {
      lockedHevyIds.add(h.id);
      lockedWatchIds.add(h.watchBiometrics.watchSessionId);
    }
  }

  interface CandidateMatch {
    hevyIdx: number;
    watch: WatchExerciseSession;
    startOffsetSeconds: number;
    endOffsetSeconds: number;
    overlapPct: number;
    jaccardRatio: number;
    matchConfidence: 'exact' | 'high' | 'probable';
    score: number;
  }

  const candidates: CandidateMatch[] = [];

  cloned.forEach((hevy, hevyIdx) => {
    if (lockedHevyIds.has(hevy.id)) return;
    const hw = hevyWindows.get(hevy.id);
    if (!hw) return;

    const hevyDurMs = Math.max(60_000, hw.endMs - hw.startMs);

    for (const watch of watchSessions) {
      if (lockedWatchIds.has(watch.id)) continue;
      const ww = watchWindows.get(watch.id);
      if (!ww) continue;

      const startOffsetSeconds = Math.round((ww.startMs - hw.startMs) / 1000);
      const endOffsetSeconds = Math.round((ww.endMs - hw.endMs) / 1000);
      const absStartDiffSec = Math.abs(startOffsetSeconds);
      const absEndDiffSec = Math.abs(endOffsetSeconds);

      // Descartar rápido sesiones separadas por más de 60 minutos sin solapamiento
      const overlapMs = Math.max(0, Math.min(hw.endMs, ww.endMs) - Math.max(hw.startMs, ww.startMs));
      if (absStartDiffSec > 45 * 60 && overlapMs <= 0) continue;

      const watchDurMs = Math.max(60_000, ww.endMs - ww.startMs);
      const shorterMs = Math.max(60_000, Math.min(hevyDurMs, watchDurMs));
      const unionMs = Math.max(60_000, hevyDurMs + watchDurMs - overlapMs);
      const overlapRatio = overlapMs / shorterMs;
      const jaccardRatio = overlapMs / unionMs;
      const overlapPct = overlapRatio * 100;

      // Filtro anti-falso positivo: evitar fusionar un trayecto corto en bici/caminata al gym con una sesión larga de pesas
      if (isLikelyShortCommuteCardio(watch) && hevy.durationMinutes >= 35 && jaccardRatio < 0.5) {
        continue;
      }

      // Criterios de aceptación temporal:
      // 1. Inicio simultáneo o cercano (<= 20 min) + solapamiento >= 35% (o fin también cercano <= 20 min)
      // 2. O solapamiento muy alto (>= 65% de la sesión más corta y Jaccard >= 45%)
      const qualifies =
        (absStartDiffSec <= 20 * 60 && (overlapRatio >= 0.35 || absEndDiffSec <= 20 * 60)) ||
        (overlapRatio >= 0.65 && jaccardRatio >= 0.45);

      if (!qualifies) continue;

      let matchConfidence: 'exact' | 'high' | 'probable' = 'probable';
      if (absStartDiffSec <= 180 && overlapRatio >= 0.72) {
        matchConfidence = 'exact';
      } else if (absStartDiffSec <= 900 && overlapRatio >= 0.5) {
        matchConfidence = 'high';
      }

      // Puntaje compuesto para asignación óptima 1-a-1
      const startProximityScore = Math.max(0, 1 - absStartDiffSec / 1800) * 45;
      const endProximityScore = Math.max(0, 1 - absEndDiffSec / 1800) * 20;
      const overlapScore = jaccardRatio * 35;
      const strengthBonus = isLikelyStrengthOrGymWatchType(watch) ? 12 : 0;
      const watchBonus = watch.isWatchSource ? 5 : 0;
      const hrBonus = posOrNull(watch.avgHeartRateBpm) !== null ? 5 : 0;
      const score = startProximityScore + endProximityScore + overlapScore + strengthBonus + watchBonus + hrBonus;

      candidates.push({
        hevyIdx,
        watch,
        startOffsetSeconds,
        endOffsetSeconds,
        overlapPct,
        jaccardRatio,
        matchConfidence,
        score,
      });
    }
  });

  candidates.sort((a, b) => b.score - a.score);

  const usedHevy = new Set<number>();
  const usedWatch = new Set<string>(lockedWatchIds);
  let newlyFusedCount = 0;

  for (const cand of candidates) {
    if (usedHevy.has(cand.hevyIdx) || usedWatch.has(cand.watch.id)) continue;
    usedHevy.add(cand.hevyIdx);
    usedWatch.add(cand.watch.id);

    const target = cloned[cand.hevyIdx];
    const hadSameFusion = target.watchBiometrics?.watchSessionId === cand.watch.id;
    target.watchBiometrics = buildFusedWatchBiometrics(target, cand.watch, {
      startOffsetSeconds: cand.startOffsetSeconds,
      endOffsetSeconds: cand.endOffsetSeconds,
      overlapPct: cand.overlapPct,
      matchConfidence: cand.matchConfidence,
    });
    if (!hadSameFusion) {
      newlyFusedCount++;
    }
  }

  const matchedPairs: FusionSummaryReport['matchedPairs'] = [];
  let fusedWorkoutsCount = 0;
  for (const h of cloned) {
    if (h.watchBiometrics) {
      fusedWorkoutsCount++;
      matchedPairs.push({
        hevyId: h.id,
        hevyName: h.name,
        hevyDate: h.date,
        watchSessionId: h.watchBiometrics.watchSessionId,
        watchTitle: h.watchBiometrics.watchTitle,
        watchDateIso: h.watchBiometrics.watchDateIso,
        watchStartTime: h.watchBiometrics.watchStartTime,
        watchEndTime: h.watchBiometrics.watchEndTime,
        avgHeartRateBpm: h.watchBiometrics.avgHeartRateBpm,
        maxHeartRateBpm: h.watchBiometrics.maxHeartRateBpm,
        caloriesBurned: h.watchBiometrics.caloriesBurned,
        startOffsetSeconds: h.watchBiometrics.startOffsetSeconds,
        endOffsetSeconds: h.watchBiometrics.endOffsetSeconds,
        overlapPct: h.watchBiometrics.overlapPct,
        matchConfidence: h.watchBiometrics.matchConfidence,
      });
    }
  }

  return {
    workouts: cloned,
    newlyFusedCount,
    fusedWorkoutsCount,
    matchedPairs,
  };
}

// ============================================================================
// PERSISTENCIA EN DISCO (data/real_watch_workouts.json)
// ============================================================================

export function readWatchArchive(): WatchArchiveStore {
  try {
    if (fs.existsSync(WATCH_WORKOUTS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(WATCH_WORKOUTS_PATH, 'utf8'));
      if (parsed && Array.isArray(parsed.sessions)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[WorkoutFusion] Error leyendo real_watch_workouts.json:', err);
  }
  return {
    lastUpdated: new Date().toISOString(),
    sessions: [],
  };
}

export function writeWatchArchive(store: WatchArchiveStore): void {
  fs.mkdirSync(path.dirname(WATCH_WORKOUTS_PATH), { recursive: true });
  fs.writeFileSync(WATCH_WORKOUTS_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function makeWatchDedupeKey(s: WatchExerciseSession): string {
  if (s.id && !s.id.startsWith('watch-')) {
    return `id:${s.id}`;
  }
  return `ts:${s.dateIso}|${s.startTimeText}|${Math.round(s.durationMinutes)}`;
}

export function mergeWatchSessionsIntoArchive(
  incomingRaw: any[],
  extraMeta?: { lastFirestorePullAt?: string }
): { store: WatchArchiveStore; addedCount: number } {
  const archive = readWatchArchive();
  const byKey = new Map<string, WatchExerciseSession>();

  for (const existing of archive.sessions) {
    const norm = normalizeWatchSession(existing);
    if (norm) byKey.set(makeWatchDedupeKey(norm), norm);
  }

  let addedCount = 0;
  for (const raw of incomingRaw) {
    const norm = normalizeWatchSession(raw);
    if (!norm) continue;

    const key = makeWatchDedupeKey(norm);
    // También comprobar duplicado por misma fecha + hora exacta de inicio (por si el id cambió)
    let matchedKey = byKey.has(key) ? key : null;
    if (!matchedKey) {
      for (const [k, prev] of byKey.entries()) {
        if (
          prev.dateIso === norm.dateIso &&
          prev.startTimeText === norm.startTimeText &&
          Math.abs(prev.durationMinutes - norm.durationMinutes) <= 2
        ) {
          matchedKey = k;
          break;
        }
      }
    }

    if (!matchedKey) {
      byKey.set(key, norm);
      addedCount++;
    } else {
      const prev = byKey.get(matchedKey)!;
      // Enriquecer con los campos más completos (sin sobrescribir HR/calorías con null/0)
      byKey.set(matchedKey, {
        ...prev,
        ...norm,
        startTimeIso: norm.startTimeIso || prev.startTimeIso,
        endTimeIso: norm.endTimeIso || prev.endTimeIso,
        durationSeconds: norm.durationSeconds || prev.durationSeconds,
        avgHeartRateBpm: norm.avgHeartRateBpm ?? prev.avgHeartRateBpm ?? null,
        maxHeartRateBpm: norm.maxHeartRateBpm ?? prev.maxHeartRateBpm ?? null,
        minHeartRateBpm: norm.minHeartRateBpm ?? prev.minHeartRateBpm ?? null,
        hrSampleCount: norm.hrSampleCount || prev.hrSampleCount,
        hrZoneMinutes: norm.hrZoneMinutes || prev.hrZoneMinutes || null,
        caloriesBurned: norm.caloriesBurned > 0 ? norm.caloriesBurned : prev.caloriesBurned,
        distanceMeters: norm.distanceMeters ?? prev.distanceMeters ?? null,
      });
    }
  }

  const sortedSessions = Array.from(byKey.values()).sort((a, b) => {
    const ta = resolveWatchWindow(a)?.startMs || 0;
    const tb = resolveWatchWindow(b)?.startMs || 0;
    return tb - ta;
  });

  const nextStore: WatchArchiveStore = {
    lastUpdated: new Date().toISOString(),
    ...(extraMeta?.lastFirestorePullAt
      ? { lastFirestorePullAt: extraMeta.lastFirestorePullAt }
      : archive.lastFirestorePullAt
      ? { lastFirestorePullAt: archive.lastFirestorePullAt }
      : {}),
    sessions: sortedSessions,
  };

  writeWatchArchive(nextStore);
  return { store: nextStore, addedCount };
}

// ============================================================================
// COSECHADOR FIRESTORE (PULL REAL DE SESIONES DEL RELOJ DESDE LA NUBE)
// ============================================================================

function parseFirestoreValue(v: any): any {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(parseFirestoreValue);
  if ('mapValue' in v) {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v.mapValue?.fields || {})) {
      out[k] = parseFirestoreValue(val);
    }
    return out;
  }
  return null;
}

function extractSessionsFromFirestoreDoc(docObj: Record<string, any>): WatchExerciseSession[] {
  const out: WatchExerciseSession[] = [];
  const ext = docObj?.extendedBiometrics;
  if (ext && typeof ext === 'object') {
    for (const list of [ext.exerciseSessions, ext.recentExerciseSessions, ext.recentExerciseSessions7d]) {
      if (Array.isArray(list)) {
        for (const item of list) {
          const norm = normalizeWatchSession(item);
          if (norm) out.push(norm);
        }
      }
    }
  }
  return out;
}

/**
 * Consulta Firestore REST API (stream global + docs fechados recientes y fechas exactas de Hevy)
 * para cosechar todas las sesiones del reloj disponibles en la nube.
 */
export async function pullWatchSessionsFromFirestore(hevyWorkouts?: HevyWorkoutSession[]): Promise<WatchExerciseSession[]> {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCBY4W1zPd4G5MLMz8Yf6EOf1xF5uui1cg';
  const base = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents`;

  const docPaths = new Set<string>([
    'health_sync_stream/latest',
    `users/${SANTIAGO_UID}/healthSync/latest`,
  ]);

  // Agregar últimos 7 días en hora Bogotá
  const now = Date.now();
  for (let i = 0; i < 8; i++) {
    const dt = new Date(now - i * 86_400_000);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(dt);
    const iso = `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}-${parts.find((p) => p.type === 'day')?.value}`;
    docPaths.add(`users/${SANTIAGO_UID}/healthSync/day_${iso}`);
    docPaths.add(`users/${SANTIAGO_UID}/health_metrics/${iso}`);
  }

  // Agregar las fechas exactas de los últimos 15 entrenamientos de Hevy
  if (Array.isArray(hevyWorkouts)) {
    for (const hw of hevyWorkouts.slice(0, 15)) {
      const win = resolveHevyWindow(hw);
      if (win?.dateIso) {
        docPaths.add(`users/${SANTIAGO_UID}/healthSync/day_${win.dateIso}`);
        docPaths.add(`users/${SANTIAGO_UID}/health_metrics/${win.dateIso}`);
      }
    }
  }

  const fetched = await Promise.all(
    Array.from(docPaths).map(async (p) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${base}/${p}?key=${encodeURIComponent(apiKey)}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) return [];
        const json = await res.json();
        if (!json?.fields) return [];
        const obj: Record<string, any> = {};
        for (const [k, v] of Object.entries(json.fields)) {
          obj[k] = parseFirestoreValue(v);
        }
        return extractSessionsFromFirestoreDoc(obj);
      } catch {
        return [];
      }
    })
  );

  return fetched.flat();
}

// ============================================================================
// ORQUESTADORES DE FUSIÓN CON PERSISTENCIA EN data/real_hevy_workouts.json
// ============================================================================

function readHevyWorkoutsFile(): HevyWorkoutSession[] {
  try {
    if (fs.existsSync(HEVY_WORKOUTS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(HEVY_WORKOUTS_PATH, 'utf8'));
      if (Array.isArray(raw)) return raw;
    }
  } catch (err) {
    console.warn('[WorkoutFusion] Error leyendo real_hevy_workouts.json:', err);
  }
  return [];
}

function writeHevyWorkoutsFile(workouts: HevyWorkoutSession[]): void {
  fs.mkdirSync(path.dirname(HEVY_WORKOUTS_PATH), { recursive: true });
  fs.writeFileSync(HEVY_WORKOUTS_PATH, JSON.stringify(workouts, null, 2), 'utf8');
}

/**
 * Aplica la fusión sobre una lista en memoria de Hevy contra el archivo de sesiones del reloj en disco.
 * (Usado automáticamente dentro de `mergeAndPersistWorkouts` al importar Hevy).
 */
export function applyStoredWatchFusionToWorkouts(
  hevyWorkouts: HevyWorkoutSession[]
): { workouts: HevyWorkoutSession[]; fusedWorkoutsCount: number; newlyFusedCount: number } {
  const archive = readWatchArchive();
  if (archive.sessions.length === 0) {
    const existingFused = hevyWorkouts.filter((w) => Boolean(w.watchBiometrics)).length;
    return { workouts: hevyWorkouts, fusedWorkoutsCount: existingFused, newlyFusedCount: 0 };
  }
  const res = matchHevyAndWatchSessions(hevyWorkouts, archive.sessions);
  return {
    workouts: res.workouts,
    fusedWorkoutsCount: res.fusedWorkoutsCount,
    newlyFusedCount: res.newlyFusedCount,
  };
}

/**
 * Recibe sesiones del reloj (desde Android, Firestore o importación manual), las guarda en el archivo
 * histórico persistente y ejecuta inmediatamente la fusión con `data/real_hevy_workouts.json`.
 */
export function upsertWatchSessionsAndAutoFuse(
  incomingWatchSessions: any[],
  options?: { lastFirestorePullAt?: string }
): FusionSummaryReport {
  const { store } = mergeWatchSessionsIntoArchive(incomingWatchSessions, options);
  const hevyWorkouts = readHevyWorkoutsFile();
  const matchRes = matchHevyAndWatchSessions(hevyWorkouts, store.sessions);

  if (hevyWorkouts.length > 0 && (matchRes.newlyFusedCount > 0 || matchRes.fusedWorkoutsCount > 0)) {
    writeHevyWorkoutsFile(matchRes.workouts);
  }

  const matchedWatchIds = new Set(matchRes.matchedPairs.map((m) => m.watchSessionId));
  return {
    totalHevyWorkouts: matchRes.workouts.length,
    fusedWorkoutsCount: matchRes.fusedWorkoutsCount,
    newlyFusedCount: matchRes.newlyFusedCount,
    watchSessionsCount: store.sessions.length,
    unmatchedWatchSessionsCount: store.sessions.filter((s) => !matchedWatchIds.has(s.id)).length,
    firestoreSessionsPulled: incomingWatchSessions.length,
    matchedPairs: matchRes.matchedPairs,
    watchSessions: store.sessions,
    workouts: matchRes.workouts,
  };
}

/**
 * Ejecuta sincronización completa con Firestore + archivo local y fusiona automáticamente con Hevy.
 */
export async function syncAndAutoFuseFromCloud(): Promise<FusionSummaryReport> {
  const hevyWorkouts = readHevyWorkoutsFile();
  const pulled = await pullWatchSessionsFromFirestore(hevyWorkouts);
  const report = upsertWatchSessionsAndAutoFuse(pulled, {
    lastFirestorePullAt: new Date().toISOString(),
  });
  return {
    ...report,
    firestoreSessionsPulled: pulled.length,
  };
}

/**
 * Vincula manualmente una sesión del reloj específica con un entrenamiento de Hevy.
 */
export function manualFuseHevyWithWatch(
  hevyWorkoutId: string,
  watchSessionId: string
): { ok: boolean; error?: string; workout?: HevyWorkoutSession; workouts?: HevyWorkoutSession[] } {
  const hevyWorkouts = readHevyWorkoutsFile();
  const archive = readWatchArchive();

  const hIdx = hevyWorkouts.findIndex((w) => w.id === hevyWorkoutId);
  if (hIdx < 0) return { ok: false, error: 'Entrenamiento Hevy no encontrado.' };

  const watch = archive.sessions.find((s) => s.id === watchSessionId);
  if (!watch) return { ok: false, error: 'Sesión del reloj no encontrada en el archivo.' };

  const hw = resolveHevyWindow(hevyWorkouts[hIdx]);
  const ww = resolveWatchWindow(watch);
  let startOffsetSeconds = 0;
  let endOffsetSeconds = 0;
  let overlapPct = 100;

  if (hw && ww) {
    startOffsetSeconds = Math.round((ww.startMs - hw.startMs) / 1000);
    endOffsetSeconds = Math.round((ww.endMs - hw.endMs) / 1000);
    const overlapMs = Math.max(0, Math.min(hw.endMs, ww.endMs) - Math.max(hw.startMs, ww.startMs));
    const shorterMs = Math.max(60_000, Math.min(hw.endMs - hw.startMs, ww.endMs - ww.startMs));
    overlapPct = Math.round((overlapMs / shorterMs) * 100);
  }

  hevyWorkouts[hIdx] = {
    ...hevyWorkouts[hIdx],
    watchBiometrics: buildFusedWatchBiometrics(hevyWorkouts[hIdx], watch, {
      startOffsetSeconds,
      endOffsetSeconds,
      overlapPct,
      matchConfidence: 'manual',
    }),
  };

  writeHevyWorkoutsFile(hevyWorkouts);
  return { ok: true, workout: hevyWorkouts[hIdx], workouts: hevyWorkouts };
}

/**
 * Desvincula los datos biométricos del reloj de un entrenamiento de Hevy.
 */
export function unfuseHevyWorkout(hevyWorkoutId: string): {
  ok: boolean;
  error?: string;
  workouts?: HevyWorkoutSession[];
} {
  const hevyWorkouts = readHevyWorkoutsFile();
  const hIdx = hevyWorkouts.findIndex((w) => w.id === hevyWorkoutId);
  if (hIdx < 0) return { ok: false, error: 'Entrenamiento Hevy no encontrado.' };

  const next = { ...hevyWorkouts[hIdx] };
  delete next.watchBiometrics;
  hevyWorkouts[hIdx] = next;
  writeHevyWorkoutsFile(hevyWorkouts);
  return { ok: true, workouts: hevyWorkouts };
}
