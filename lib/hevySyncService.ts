import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile, execFileSync } from 'child_process';
import { promisify } from 'util';
import { HevyWorkoutSession, HevyExercise, ExerciseSet } from './hevyStore';
import {
  parseHevyDate,
  classifyExerciseMuscleGroup,
  translateExerciseTitle,
  findKnownRoutine,
} from './hevyDateParser';
import {
  applyStoredWatchFusionToWorkouts,
  parseLocalBogotaIso,
} from './workoutFusionEngine';

const execFileAsync = promisify(execFile);

const LBS_TO_KG = 0.45359237;
const WORKOUTS_PATH = path.join(process.cwd(), 'data', 'real_hevy_workouts.json');
const META_PATH = path.join(process.cwd(), 'data', 'hevy_sync_meta.json');
const IMPORTS_DIR = path.join(process.cwd(), 'data', 'imports');
const BRIDGE_SCRIPT = path.join(process.cwd(), 'scripts', 'hevy_web_bridge.mjs');

const KNOWN_WORKOUT_SHORT_IDS: Record<string, string> = {
  'horizontal torso (chest & back)|2026-11-17t17:11': '3iXBJa30JS6',
  'arms & shoulders|2026-11-12t17:29': 'b4t9vnN1e9g',
  'full legs|2026-11-10t17:15': 'fveLGVNMjSv',
  'horizontal torso (chest & back)|2026-11-09t10:04': 'BbD4VM1I5fI',
  'arms & shoulders|2026-10-30t16:30': '0P12cOsoyIM',
  'full legs|2026-10-29t16:22': 'KQhZwkraYRf',
  'horizontal torso (chest & back)|2026-10-27t16:15': 'sIkYBSAf7jc',
  'full legs|2026-09-30t16:08': 'T6r0QPmPAMf',
  'horizontal torso (chest & back)|2026-09-28t16:09': 'OR7HX5ZjKSB',
  'horizontal torso (chest & back)|2026-09-21t16:19': 'hIJt0wq1uvW',
};

let publicCountCache: { fetchedAt: number; username: string; count: number } | null = null;

export async function fetchHevyPublicWorkoutCount(username = 'teheransmit'): Promise<number | null> {
  const now = Date.now();
  if (publicCountCache && publicCountCache.username === username && now - publicCountCache.fetchedAt < 5 * 60 * 1000) {
    return publicCountCache.count;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://hevy.com/user/${encodeURIComponent(username)}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return publicCountCache?.count ?? null;
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return publicCountCache?.count ?? null;
    const data = JSON.parse(match[1]);
    const countVal = Number(data?.props?.pageProps?.metadata?.workout_count);
    if (Number.isFinite(countVal) && countVal > 0) {
      publicCountCache = { fetchedAt: now, username, count: countVal };
      return countVal;
    }
    return publicCountCache?.count ?? null;
  } catch {
    clearTimeout(timer);
    return publicCountCache?.count ?? null;
  }
}

export interface HevySyncMeta {
  lastSyncAt: string | null;
  lastLivePullAt: string | null;
  lastSource: string;
  totalWorkouts: number;
  latestWorkoutName?: string;
  latestWorkoutDate?: string;
  processedFiles: Record<string, { mtimeMs: number; hash: string; processedAt: string }>;
  hevyPlanDetected: 'free' | 'pro';
  notes?: string;
}

export function readSyncMeta(): HevySyncMeta {
  try {
    if (fs.existsSync(META_PATH)) {
      return JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
    }
  } catch (err) {
    console.warn('[HevySync] No se pudo leer hevy_sync_meta.json:', err);
  }
  return {
    lastSyncAt: null,
    lastLivePullAt: null,
    lastSource: 'local_cache',
    totalWorkouts: 0,
    processedFiles: {},
    hevyPlanDetected: process.env.HEVY_API_KEY ? 'pro' : 'free',
  };
}

export function writeSyncMeta(meta: HevySyncMeta) {
  fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf8');
}

export function readStoredWorkouts(): HevyWorkoutSession[] {
  try {
    if (fs.existsSync(WORKOUTS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(WORKOUTS_PATH, 'utf8'));
      if (Array.isArray(raw)) {
        return sortWorkoutsNewestFirst(raw);
      }
    }
  } catch (err) {
    console.error('[HevySync] Error leyendo real_hevy_workouts.json:', err);
  }
  return [];
}

function makeDedupeKey(session: Partial<HevyWorkoutSession>): string {
  const normName = (session.name || 'workout').trim().toLowerCase();
  const dt = parseHevyDate(session.date);
  if (dt) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${normName}|${y}-${m}-${d}t${hh}:${mm}`;
  }
  return `${normName}|${(session.date || '').trim().toLowerCase()}`;
}

export function sortWorkoutsNewestFirst(sessions: HevyWorkoutSession[]): HevyWorkoutSession[] {
  return [...sessions].sort((a, b) => {
    const ta = parseHevyDate(a.date)?.getTime() || 0;
    const tb = parseHevyDate(b.date)?.getTime() || 0;
    return tb - ta;
  });
}

function parseCsvRows(csvContent: string): Array<Record<string, string>> {
  const clean = csvContent.replace(/^\uFEFF/, '');
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      if (current.trim().length > 0) lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0) lines.push(current);
  if (lines.length < 2) return [];

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let buf = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (quoted && line[i + 1] === '"') {
          buf += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (c === ',' && !quoted) {
        out.push(buf.trim());
        buf = '';
      } else {
        buf += c;
      }
    }
    out.push(buf.trim());
    return out;
  };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitLine(lines[i]);
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = vals[idx] ?? '';
    });
    rows.push(rec);
  }
  return rows;
}

function extractLocalClock(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const m = dateStr.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : undefined;
}

export function parseHevyCsvToSessions(csvContent: string): HevyWorkoutSession[] {
  const rows = parseCsvRows(csvContent);
  if (rows.length === 0) return [];

  interface TempSession {
    id: string;
    name: string;
    date: string;
    startTimeLocal?: string;
    endTimeLocal?: string;
    startTimeIso?: string;
    endTimeIso?: string;
    durationMinutes: number;
    notes?: string;
    exercisesMap: Map<string, HevyExercise>;
    totalVolumeLbs: number;
    totalSets: number;
    rpeSum: number;
    rpeCount: number;
  }

  const sessionsMap = new Map<string, TempSession>();

  for (const row of rows) {
    const title = row['title'] || 'Entrenamiento Hevy';
    const startTime = row['start_time'] || '';
    const endTime = row['end_time'] || '';
    const description = row['description'] || '';
    if (!startTime) continue;

    const groupKey = `${title.trim()}|${startTime.trim()}`;
    if (!sessionsMap.has(groupKey)) {
      const dStart = parseHevyDate(startTime);
      const dEnd = parseHevyDate(endTime);
      const startIsoInfo = parseLocalBogotaIso(startTime);
      const endIsoInfo = parseLocalBogotaIso(endTime);
      let durationMinutes = 55;
      if (dStart && dEnd && dEnd.getTime() > dStart.getTime()) {
        durationMinutes = Math.max(5, Math.round((dEnd.getTime() - dStart.getTime()) / 60000));
      }
      const dedupeKey = makeDedupeKey({ name: title, date: startTime });
      const shortId =
        KNOWN_WORKOUT_SHORT_IDS[dedupeKey] ||
        `hevy-${crypto.createHash('sha1').update(dedupeKey).digest('hex').slice(0, 10)}`;

      sessionsMap.set(groupKey, {
        id: shortId,
        name: title.trim(),
        date: startTime.trim(),
        startTimeLocal: extractLocalClock(startTime) || startIsoInfo?.hhmm,
        endTimeLocal: extractLocalClock(endTime) || endIsoInfo?.hhmm,
        startTimeIso: startIsoInfo?.iso,
        endTimeIso: endIsoInfo?.iso,
        durationMinutes,
        notes: description || undefined,
        exercisesMap: new Map(),
        totalVolumeLbs: 0,
        totalSets: 0,
        rpeSum: 0,
        rpeCount: 0,
      });
    }

    const sess = sessionsMap.get(groupKey)!;
    const exTitle = (row['exercise_title'] || 'Ejercicio General').trim();
    const rawSetType = (row['set_type'] || 'normal').toLowerCase();
    const isCardioOrWarmupOnly =
      exTitle.toLowerCase() === 'warm up' || exTitle.toLowerCase() === 'stretching';

    const indicator: ExerciseSet['indicator'] =
      rawSetType === 'warmup' || isCardioOrWarmupOnly
        ? 'warmup'
        : rawSetType === 'dropset' || rawSetType === 'drop'
        ? 'drop'
        : rawSetType === 'failure'
        ? 'failure'
        : 'normal';

    const weightLbsRaw = parseFloat(row['weight_lbs'] || row['weight (lbs)'] || '');
    const weightKgColRaw = parseFloat(row['weight_kg'] || row['weight (kg)'] || '');
    let weightLbs = 0;
    let weightKg = 0;

    if (!isNaN(weightLbsRaw) && weightLbsRaw > 0) {
      weightLbs = Math.round(weightLbsRaw * 100) / 100;
      weightKg = Math.round(weightLbs * LBS_TO_KG * 100) / 100;
    } else if (!isNaN(weightKgColRaw) && weightKgColRaw > 0) {
      weightKg = Math.round(weightKgColRaw * 100) / 100;
      weightLbs = Math.round((weightKg / LBS_TO_KG) * 10) / 10;
    }

    const reps = parseInt(row['reps'] || '0', 10) || 0;
    const durationSeconds = parseInt(row['duration_seconds'] || '', 10);
    const rpeVal = parseFloat(row['rpe'] || '');
    const rpe = !isNaN(rpeVal) && rpeVal > 0 ? rpeVal : undefined;
    const exNotes = (row['exercise_notes'] || '').trim();

    if (!sess.exercisesMap.has(exTitle)) {
      sess.exercisesMap.set(exTitle, {
        name: exTitle,
        esTitle: translateExerciseTitle(exTitle),
        notes: exNotes || undefined,
        muscleGroup: classifyExerciseMuscleGroup(exTitle),
        sets: [],
        totalVolume: 0,
      });
    }

    const ex = sess.exercisesMap.get(exTitle)!;
    if (exNotes && !ex.notes) ex.notes = exNotes;

    const setObj: ExerciseSet = {
      setNumber: ex.sets.length + 1,
      weightKg,
      ...(weightLbs > 0 ? { weightLbs: Math.round(weightLbs * 10) / 10 } : {}),
      reps,
      ...(rpe !== undefined ? { rpe } : {}),
      ...(!isNaN(durationSeconds) && durationSeconds > 0 ? { durationSeconds } : {}),
      indicator,
    };

    ex.sets.push(setObj);

    const setVolLbs = weightLbs * reps;
    const setVolKg = weightKg * reps;
    if (!isCardioOrWarmupOnly && indicator !== 'warmup') {
      ex.totalVolume += setVolKg;
      sess.totalVolumeLbs += setVolLbs;
      sess.totalSets += 1;
    }
    if (rpe !== undefined && indicator !== 'warmup') {
      sess.rpeSum += rpe;
      sess.rpeCount += 1;
    }
  }

  const out: HevyWorkoutSession[] = [];
  for (const s of sessionsMap.values()) {
    const exercises = Array.from(s.exercisesMap.values()).map((ex) => ({
      ...ex,
      totalVolume: Math.round(ex.totalVolume),
    }));
    const totalVolumeLbs = Math.round(s.totalVolumeLbs);
    const totalVolumeKg = Math.round(totalVolumeLbs * LBS_TO_KG);
    const rpeAverage = s.rpeCount > 0 ? Number((s.rpeSum / s.rpeCount).toFixed(1)) : 8.5;

    out.push({
      id: s.id,
      name: s.name,
      date: s.date,
      startTimeLocal: s.startTimeLocal,
      endTimeLocal: s.endTimeLocal,
      ...(s.startTimeIso ? { startTimeIso: s.startTimeIso } : {}),
      ...(s.endTimeIso ? { endTimeIso: s.endTimeIso } : {}),
      durationMinutes: s.durationMinutes,
      totalVolumeKg,
      totalVolumeLbs,
      totalSets: s.totalSets,
      rpeAverage,
      ...(s.notes ? { notes: s.notes } : {}),
      exercises,
    });
  }

  return sortWorkoutsNewestFirst(out);
}

export function normalizeHevyApiWorkout(rawWorkout: any): HevyWorkoutSession {
  const start = rawWorkout.start_time || rawWorkout.created_at || rawWorkout.date || new Date().toISOString();
  const explicitEnd = rawWorkout.end_time || rawWorkout.updated_at || '';
  const startIsoInfo = parseLocalBogotaIso(start);
  const endIsoInfo = explicitEnd ? parseLocalBogotaIso(explicitEnd) : null;
  const hasRealEnd = Boolean(startIsoInfo && endIsoInfo && endIsoInfo.ms > startIsoInfo.ms);
  const durationMinutes =
    Number(rawWorkout.durationMinutes) > 0
      ? Number(rawWorkout.durationMinutes)
      : hasRealEnd
      ? Math.max(5, Math.round((endIsoInfo!.ms - startIsoInfo!.ms) / 60000))
      : 60;

  let totalVolKg = 0;
  let totalSets = 0;
  let rpeSum = 0;
  let rpeCount = 0;

  const rawExercises = Array.isArray(rawWorkout.exercises) ? rawWorkout.exercises : [];
  const exercises: HevyExercise[] = rawExercises.map((ex: any) => {
    const exTitle = ex.title || ex.name || 'Ejercicio';
    let exVolKg = 0;
    const rawSets = Array.isArray(ex.sets) ? ex.sets : [];
    const sets: ExerciseSet[] = rawSets.map((s: any, idx: number) => {
      const weightKg = Number(s.weight_kg ?? s.weightKg ?? 0);
      const reps = Number(s.reps ?? 0);
      const rpe = s.rpe !== undefined && s.rpe !== null ? Number(s.rpe) : undefined;
      const setType = (s.set_type || s.indicator || 'normal').toLowerCase();
      const indicator: ExerciseSet['indicator'] =
        setType === 'warmup' ? 'warmup' : setType === 'dropset' || setType === 'drop' ? 'drop' : setType === 'failure' ? 'failure' : 'normal';
      if (indicator !== 'warmup') {
        exVolKg += weightKg * reps;
        totalVolKg += weightKg * reps;
        totalSets += 1;
        if (rpe && !isNaN(rpe)) {
          rpeSum += rpe;
          rpeCount += 1;
        }
      }
      return {
        setNumber: idx + 1,
        weightKg: Math.round(weightKg * 100) / 100,
        weightLbs: Math.round((weightKg / LBS_TO_KG) * 10) / 10,
        reps,
        ...(rpe !== undefined ? { rpe } : {}),
        indicator,
      };
    });

    return {
      name: exTitle,
      esTitle: translateExerciseTitle(exTitle),
      notes: ex.notes || undefined,
      muscleGroup: classifyExerciseMuscleGroup(exTitle),
      sets,
      totalVolume: Math.round(exVolKg),
    };
  });

  const roundedKg = Math.round(totalVolKg);
  return {
    id: rawWorkout.id || `hevy-api-${Date.now()}`,
    name: rawWorkout.title || rawWorkout.name || 'Entrenamiento Hevy',
    date: start,
    ...(startIsoInfo?.hhmm ? { startTimeLocal: startIsoInfo.hhmm } : {}),
    ...(hasRealEnd && endIsoInfo?.hhmm ? { endTimeLocal: endIsoInfo.hhmm } : {}),
    ...(startIsoInfo?.iso ? { startTimeIso: startIsoInfo.iso } : {}),
    ...(hasRealEnd && endIsoInfo?.iso ? { endTimeIso: endIsoInfo.iso } : {}),
    durationMinutes,
    totalVolumeKg: roundedKg,
    totalVolumeLbs: Math.round(roundedKg / LBS_TO_KG),
    totalSets,
    rpeAverage: rpeCount > 0 ? Number((rpeSum / rpeCount).toFixed(1)) : 8.5,
    notes: rawWorkout.description || undefined,
    exercises,
  };
}

export function mergeAndPersistWorkouts(
  incoming: HevyWorkoutSession[],
  sourceLabel: string,
  extraMeta?: Partial<HevySyncMeta>
): { allWorkouts: HevyWorkoutSession[]; addedCount: number; updatedCount: number } {
  const existing = readStoredWorkouts();
  const byKey = new Map<string, HevyWorkoutSession>();

  for (const w of existing) {
    byKey.set(makeDedupeKey(w), w);
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const w of incoming) {
    const k = makeDedupeKey(w);
    const prev = byKey.get(k);
    if (!prev) {
      byKey.set(k, w);
      addedCount++;
    } else {
      // No sobrescribir ejercicios reales existentes con un payload parcial vacío
      if ((w.exercises?.length || 0) === 0 && (prev.exercises?.length || 0) > 0) {
        continue;
      }
      // Conservar ID corto oficial de Hevy y telemetría fusionada del reloj si ya estaban registrados
      const preservedId = prev.id && !prev.id.startsWith('hevy-') ? prev.id : w.id;
      const preservedWatch = w.watchBiometrics ?? prev.watchBiometrics;
      const incomingHasDistinctEnd = Boolean(
        w.endTimeLocal && (!w.startTimeLocal || w.endTimeLocal !== w.startTimeLocal)
      );
      const nextDuration =
        incomingHasDistinctEnd && w.durationMinutes > 0
          ? w.durationMinutes
          : prev.durationMinutes || w.durationMinutes;
      if (
        prev.totalSets !== w.totalSets ||
        Math.abs((prev.totalVolumeKg || 0) - (w.totalVolumeKg || 0)) > 2 ||
        (prev.exercises?.length || 0) !== (w.exercises?.length || 0) ||
        (!prev.endTimeLocal && incomingHasDistinctEnd) ||
        (!prev.startTimeIso && Boolean(w.startTimeIso)) ||
        (incomingHasDistinctEnd && prev.durationMinutes !== w.durationMinutes)
      ) {
        updatedCount++;
      }
      byKey.set(k, {
        ...w,
        id: preservedId,
        startTimeLocal: w.startTimeLocal || prev.startTimeLocal,
        endTimeLocal: incomingHasDistinctEnd ? w.endTimeLocal : prev.endTimeLocal || w.endTimeLocal,
        startTimeIso: w.startTimeIso || prev.startTimeIso,
        endTimeIso: incomingHasDistinctEnd ? w.endTimeIso || prev.endTimeIso : prev.endTimeIso || w.endTimeIso,
        durationMinutes: nextDuration,
        ...(preservedWatch ? { watchBiometrics: preservedWatch } : {}),
      });
    }
  }

  const allSortedBase = sortWorkoutsNewestFirst(Array.from(byKey.values()));
  // Auto-fusionar automáticamente contra las sesiones del reloj almacenadas en data/real_watch_workouts.json
  const fusionApplied = applyStoredWatchFusionToWorkouts(allSortedBase);
  const allSorted = fusionApplied.workouts;
  fs.mkdirSync(path.dirname(WORKOUTS_PATH), { recursive: true });
  fs.writeFileSync(WORKOUTS_PATH, JSON.stringify(allSorted, null, 2), 'utf8');

  const currentMeta = readSyncMeta();
  const nextMeta: HevySyncMeta = {
    ...currentMeta,
    ...extraMeta,
    lastSyncAt: new Date().toISOString(),
    lastSource: sourceLabel,
    totalWorkouts: allSorted.length,
    latestWorkoutName: allSorted[0]?.name,
    latestWorkoutDate: allSorted[0]?.date,
  };
  writeSyncMeta(nextMeta);

  return { allWorkouts: allSorted, addedCount, updatedCount };
}

function listCandidateCsvFiles(): string[] {
  const dirs = [
    IMPORTS_DIR,
    'G:\\Mi unidad\\Panel_de_Vida\\Hevy',
    path.join(process.env.USERPROFILE || 'C:\\Users\\Luis', 'Downloads'),
  ];
  const results: Array<{ full: string; mtimeMs: number }> = [];

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      for (const entry of fs.readdirSync(dir)) {
        const lower = entry.toLowerCase();
        if (!lower.endsWith('.csv')) continue;
        if (lower.includes('workout') || lower.includes('hevy')) {
          const full = path.join(dir, entry);
          const stat = fs.statSync(full);
          if (stat.isFile() && stat.size > 200) {
            results.push({ full, mtimeMs: stat.mtimeMs });
          }
        }
      }
    } catch {
      // Carpeta no accesible en este entorno
    }
  }

  results.sort((a, b) => a.mtimeMs - b.mtimeMs);
  return results.map((r) => r.full);
}

export function scanDropFoldersAndSync(): {
  scannedFiles: number;
  ingestedFiles: string[];
  addedCount: number;
  updatedCount: number;
  allWorkouts: HevyWorkoutSession[];
} {
  const candidates = listCandidateCsvFiles();
  const meta = readSyncMeta();
  let totalAdded = 0;
  let totalUpdated = 0;
  const ingestedFiles: string[] = [];
  let latestWorkouts = readStoredWorkouts();

  for (const filePath of candidates) {
    try {
      const stat = fs.statSync(filePath);
      const prev = meta.processedFiles[filePath];
      if (prev && Math.abs(prev.mtimeMs - stat.mtimeMs) < 50 && latestWorkouts.length > 0) {
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      if (prev && prev.hash === hash && latestWorkouts.length > 0) {
        meta.processedFiles[filePath] = { ...prev, mtimeMs: stat.mtimeMs };
        writeSyncMeta(meta);
        continue;
      }

      const parsed = parseHevyCsvToSessions(content);
      if (parsed.length > 0) {
        const updatedFilesMap = {
          ...meta.processedFiles,
          [filePath]: { mtimeMs: stat.mtimeMs, hash, processedAt: new Date().toISOString() },
        };
        const merged = mergeAndPersistWorkouts(parsed, `csv_auto_watch (${path.basename(filePath)})`, {
          processedFiles: updatedFilesMap,
        });
        meta.processedFiles = updatedFilesMap;
        latestWorkouts = merged.allWorkouts;
        totalAdded += merged.addedCount;
        totalUpdated += merged.updatedCount;
        ingestedFiles.push(path.basename(filePath));
      }
    } catch (err) {
      console.warn('[HevySync] Error escaneando CSV:', filePath, err);
    }
  }

  return {
    scannedFiles: candidates.length,
    ingestedFiles,
    addedCount: totalAdded,
    updatedCount: totalUpdated,
    allWorkouts: latestWorkouts,
  };
}

export function sanitizeHevyBridgeError(raw: unknown): string {
  const str = String(raw || '')
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\[\d+m/g, '')
    .trim();
  if (!str) return 'Error ejecutando puente Chrome Hevy Web.';
  if (
    /Abriendo en una sesi/i.test(str) ||
    /existing browser session/i.test(str) ||
    /Target page, context or browser has been closed/i.test(str)
  ) {
    return 'La ventana de Chrome de Hevy Web se cerró o ya había otra sesión abierta. Pulsa «Conectar Hevy Web» o «Sync en Vivo» nuevamente.';
  }
  const cleanLine = str.split(/Browser logs:|Call log:|\r?\n/)[0].trim();
  return cleanLine.slice(0, 450) || 'Error ejecutando puente Chrome Hevy Web.';
}

let cachedSandboxedDesktop: boolean | null = null;

/**
 * Detecta una sola vez si el servidor Next.js corre en un escritorio Windows aislado (exebox-* / service-*)
 * donde no es posible mostrar ventanas interactivas al usuario.
 */
export function isRunningInSandboxedDesktop(): boolean {
  if (cachedSandboxedDesktop !== null) return cachedSandboxedDesktop;
  if (process.platform !== 'win32') {
    cachedSandboxedDesktop = false;
    return false;
  }
  try {
    const ps = `
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class VyfithServerDesk {
  [DllImport("user32.dll")] public static extern IntPtr GetThreadDesktop(uint dwThreadId);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, int nLength, out int lpnLengthNeeded);
  public static string Name() {
    IntPtr d = GetThreadDesktop(GetCurrentThreadId());
    var sb = new StringBuilder(256); int need;
    GetUserObjectInformation(d, 2, sb, 256, out need);
    return sb.ToString();
  }
}
"@
Write-Output ([VyfithServerDesk]::Name())
`;
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { encoding: 'utf8', timeout: 8000, windowsHide: true }
    );
    const desk = String(out || '').trim().split(/\r?\n/).pop() || 'Default';
    cachedSandboxedDesktop = /^(exebox-|service-)/i.test(desk);
    return cachedSandboxedDesktop;
  } catch {
    cachedSandboxedDesktop = false;
    return false;
  }
}

export const HEVY_LOGIN_LAUNCHER_PATH = path.join(process.cwd(), 'Conectar_Hevy_Web.bat');

type BridgeGlobalState = {
  promise: Promise<any> | null;
  cmd: string | null;
  startedAt: number;
};

function getGlobalBridgeState(): BridgeGlobalState {
  const g = globalThis as unknown as { __vyfithHevyBridge?: BridgeGlobalState };
  if (!g.__vyfithHevyBridge) {
    g.__vyfithHevyBridge = { promise: null, cmd: null, startedAt: 0 };
  }
  return g.__vyfithHevyBridge;
}

function hasActiveBridgeLockFile(): boolean {
  try {
    const lockPath = path.join(process.cwd(), '.hevy-chrome-profile', 'bridge.lock');
    if (!fs.existsSync(lockPath)) return false;
    const raw = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    if (!raw?.pid) return false;
    try {
      process.kill(Number(raw.pid), 0);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

export async function runHevyWebBridgeCommand(args: string[], timeoutMs = 95000): Promise<any> {
  if (!fs.existsSync(BRIDGE_SCRIPT)) {
    return { ok: false, error: 'Falta scripts/hevy_web_bridge.mjs' };
  }

  const cmd = args[0] || 'status';
  const isForceLogin = cmd === 'login' && args.includes('--force');
  const gState = getGlobalBridgeState();

  // Limpiar estado obsoleto si el proceso previo ya murió o si el usuario ya se autenticó externamente
  if (gState.promise) {
    const ageMs = Date.now() - (gState.startedAt || 0);
    const lockAlive = hasActiveBridgeLockFile();
    const alreadyAuth = readHevyBridgeAuthStatus().authenticated;
    if (ageMs > 180000 || (!lockAlive && ageMs > 4000) || (gState.cmd === 'login' && alreadyAuth)) {
      gState.promise = null;
      gState.cmd = null;
      gState.startedAt = 0;
    }
  }

  // Si hay una sesión de login interactivo abierta y entra un export-csv o status concurrente, no lanzar un 2do Chrome sobre el mismo perfil
  if (gState.promise) {
    if (gState.cmd === 'login' && cmd !== 'login') {
      return {
        ok: false,
        requiresLogin: true,
        error: 'La ventana de Chromium para iniciar sesión en Hevy Web ya está abierta. Completa el login allí primero.',
      };
    }
    if (isForceLogin) {
      gState.promise = null;
      gState.cmd = null;
      gState.startedAt = 0;
    } else if (gState.cmd === cmd) {
      return gState.promise;
    } else {
      await gState.promise.catch(() => {});
    }
  }

  const execPromise = execFileAsync(process.execPath, [BRIDGE_SCRIPT, ...args], {
    cwd: process.cwd(),
    timeout: timeoutMs,
    windowsHide: cmd !== 'login',
  })
    .then(({ stdout }) => {
      const lines = stdout.trim().split(/\r?\n/);
      const lastLine = lines[lines.length - 1] || '{}';
      const parsed = JSON.parse(lastLine);
      if (parsed && parsed.error) {
        parsed.error = sanitizeHevyBridgeError(parsed.error);
      }
      return parsed;
    })
    .catch((err) => {
      const out = err?.stdout?.trim()?.split(/\r?\n/)?.pop();
      if (out) {
        try {
          const parsed = JSON.parse(out);
          if (parsed && parsed.error) {
            parsed.error = sanitizeHevyBridgeError(parsed.error);
          }
          return parsed;
        } catch {
          // ignore
        }
      }
      return {
        ok: false,
        error: sanitizeHevyBridgeError(err?.message || 'Error ejecutando puente Chrome Hevy Web'),
      };
    });

  gState.cmd = cmd;
  gState.startedAt = Date.now();
  gState.promise = execPromise.finally(() => {
    if (gState.promise === execPromise) {
      gState.promise = null;
      gState.cmd = null;
      gState.startedAt = 0;
    }
  });

  return gState.promise;
}

let lastAutoLiveExportAttemptMs = 0;
const AUTO_LIVE_EXPORT_COOLDOWN_MS = 5 * 60 * 1000;

async function ingestExportedCsvFromBridge(csvPath: string) {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseHevyCsvToSessions(csvText);
  const hash = crypto.createHash('sha256').update(csvText).digest('hex');
  const stat = fs.statSync(csvPath);
  const meta = readSyncMeta();
  const updatedFiles = {
    ...meta.processedFiles,
    [csvPath]: { mtimeMs: stat.mtimeMs, hash, processedAt: new Date().toISOString() },
  };
  return mergeAndPersistWorkouts(parsed, 'hevy_web_live_export', {
    lastLivePullAt: new Date().toISOString(),
    hevyPlanDetected: 'free',
    processedFiles: updatedFiles,
  });
}

export async function syncAllWorkoutsReal(options?: {
  apiKey?: string;
  liveBrowser?: boolean;
}): Promise<{
  workouts: HevyWorkoutSession[];
  sourceUsed: 'hevy_pro_api' | 'hevy_web_live_export' | 'csv_drop_folder' | 'local_cache';
  addedCount: number;
  updatedCount: number;
  requiresBrowserAuth: boolean;
  hasProApiKey: boolean;
  browserBridgeAuthenticated: boolean;
  remoteWorkoutCount: number | null;
  pendingRemoteDiff: number;
  warning?: string;
  syncMeta: HevySyncMeta;
}> {
  const effectiveApiKey = options?.apiKey || process.env.HEVY_API_KEY || '';
  const hasProApiKey = Boolean(effectiveApiKey);

  // 1. Siempre barrer carpetas automáticas primero (instantáneo)
  const folderScan = scanDropFoldersAndSync();
  let workouts = folderScan.allWorkouts;
  let addedCount = folderScan.addedCount;
  let updatedCount = folderScan.updatedCount;
  let sourceUsed: 'hevy_pro_api' | 'hevy_web_live_export' | 'csv_drop_folder' | 'local_cache' =
    folderScan.ingestedFiles.length > 0 ? 'csv_drop_folder' : 'local_cache';
  let requiresBrowserAuth = false;
  let browserBridgeAuthenticated = false;
  let warning: string | undefined;

  const remoteWorkoutCount = await fetchHevyPublicWorkoutCount('teheransmit');

  if (hasProApiKey) {
    try {
      const res = await fetch('https://api.hevyapp.com/v1/workouts?page=1&pageSize=20', {
        headers: { 'api-key': effectiveApiKey, Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const apiWorkouts = Array.isArray(data?.workouts) ? data.workouts.map(normalizeHevyApiWorkout) : [];
        if (apiWorkouts.length > 0) {
          const merged = mergeAndPersistWorkouts(apiWorkouts, 'hevy_pro_api', {
            lastLivePullAt: new Date().toISOString(),
            hevyPlanDetected: 'pro',
          });
          workouts = merged.allWorkouts;
          addedCount += merged.addedCount;
          updatedCount += merged.updatedCount;
          sourceUsed = 'hevy_pro_api';
        }
      } else {
        warning = `Hevy API devolvió HTTP ${res.status} (verifica HEVY_API_KEY / suscripción Hevy PRO).`;
      }
    } catch (err: any) {
      warning = `Error conectando a api.hevyapp.com: ${err.message}`;
    }
  } else {
    // Leer estado guardado de sesión del puente Chromium dedicado
    const sessionStatePath = path.join(process.cwd(), '.hevy-chrome-profile', 'session_state.json');
    try {
      if (fs.existsSync(sessionStatePath)) {
        const st = JSON.parse(fs.readFileSync(sessionStatePath, 'utf8'));
        browserBridgeAuthenticated = Boolean(st?.authenticated);
      }
    } catch {
      browserBridgeAuthenticated = false;
    }

    const detectedRemoteDiff =
      typeof remoteWorkoutCount === 'number' && remoteWorkoutCount > workouts.length
        ? remoteWorkoutCount - workouts.length
        : 0;

    const shouldAutoSync =
      !options?.liveBrowser &&
      browserBridgeAuthenticated &&
      detectedRemoteDiff > 0 &&
      Date.now() - lastAutoLiveExportAttemptMs > AUTO_LIVE_EXPORT_COOLDOWN_MS;

    if (options?.liveBrowser || shouldAutoSync) {
      if (shouldAutoSync) {
        lastAutoLiveExportAttemptMs = Date.now();
      }
      // Puente Chromium aislado (export oficial CSV sin necesidad de Antigravity/tokens)
      const bridgeRes = await runHevyWebBridgeCommand(['export-csv'], 100000);
      if (bridgeRes?.ok && bridgeRes.csvPath && fs.existsSync(bridgeRes.csvPath)) {
        browserBridgeAuthenticated = true;
        const merged = await ingestExportedCsvFromBridge(bridgeRes.csvPath);
        workouts = merged.allWorkouts;
        addedCount += merged.addedCount;
        updatedCount += merged.updatedCount;
        sourceUsed = 'hevy_web_live_export';

        // Refrescar también las 4 rutinas vivas en data/real_hevy_routines.json si hubo entrenamientos nuevos o no existen aún
        const routinesFile = path.join(process.cwd(), 'data', 'real_hevy_routines.json');
        if (options?.liveBrowser || merged.addedCount > 0 || !fs.existsSync(routinesFile)) {
          await runHevyWebBridgeCommand(['export-routines'], 95000).catch(() => {});
        }
      } else if (bridgeRes?.requiresLogin) {
        requiresBrowserAuth = true;
        browserBridgeAuthenticated = false;
        warning =
          'Sesión Hevy Web expirada o pendiente. Pulsa «Conectar Hevy Web» una sola vez y VYFITH sincronizará solo cada nuevo entrenamiento.';
      } else if (bridgeRes?.error) {
        warning = `Puente Chromium Hevy Web: ${bridgeRes.error}`;
      }
    }
  }

  const pendingRemoteDiff =
    typeof remoteWorkoutCount === 'number' && remoteWorkoutCount > workouts.length
      ? remoteWorkoutCount - workouts.length
      : 0;

  return {
    workouts,
    sourceUsed,
    addedCount,
    updatedCount,
    requiresBrowserAuth,
    hasProApiKey,
    browserBridgeAuthenticated,
    remoteWorkoutCount,
    pendingRemoteDiff,
    warning,
    syncMeta: readSyncMeta(),
  };
}

export async function pushPrescriptionToHevyExternal(params: {
  routineTitle: string;
  hevySyncPayload: Array<{
    exerciseName: string;
    esTitle?: string;
    suggestedWeightKg: number;
    suggestedWeightLbs?: number;
    targetReps: string;
    note?: string;
  }>;
}): Promise<{
  syncedToHevy: boolean;
  method: 'hevy_pro_api' | 'hevy_web_playwright' | 'local_plan_only';
  requiresLogin?: boolean;
  routineUrl?: string;
  editUrl?: string;
  modifiedExercises?: any[];
  message: string;
}> {
  const known = findKnownRoutine(params.routineTitle);
  const effectiveApiKey = process.env.HEVY_API_KEY || '';

  // 1. Vía oficial Hevy PRO API si existe HEVY_API_KEY
  if (effectiveApiKey && known?.routineId) {
    try {
      const apiRes = await fetch(`https://api.hevyapp.com/v1/routines/${known.routineId}`, {
        headers: { 'api-key': effectiveApiKey, Accept: 'application/json' },
      });
      if (apiRes.ok) {
        const routineData = await apiRes.json();
        const currentRoutine = routineData?.routine || routineData;
        if (currentRoutine && Array.isArray(currentRoutine.exercises)) {
          const updatedExercises = currentRoutine.exercises.map((ex: any) => {
            const match = params.hevySyncPayload.find(
              (p) =>
                p.exerciseName.toLowerCase() === (ex.title || '').toLowerCase() ||
                (p.esTitle && p.esTitle.toLowerCase() === (ex.title || '').toLowerCase())
            );
            if (!match) return ex;
            return {
              ...ex,
              notes: match.note || ex.notes,
              sets: (ex.sets || []).map((s: any) =>
                s.type === 'warmup' ? s : { ...s, weight_kg: match.suggestedWeightKg }
              ),
            };
          });
          const putRes = await fetch(`https://api.hevyapp.com/v1/routines/${known.routineId}`, {
            method: 'PUT',
            headers: {
              'api-key': effectiveApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              routine: {
                title: currentRoutine.title,
                notes: `VYFITH AI Coach (${new Date().toLocaleDateString('es-CO')})`,
                exercises: updatedExercises,
              },
            }),
          });
          if (putRes.ok) {
            return {
              syncedToHevy: true,
              method: 'hevy_pro_api',
              routineUrl: known.routineUrl,
              message: `Rutina '${params.routineTitle}' actualizada directamente en Hevy API v1 (${known.routineId}).`,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[HevySync] Falló PUT API PRO:', err.message);
    }
  }

  // 2. Vía automatización web oficial en hevy.com/edit-routine/... (funciona en Hevy Free si el puente Chrome está logueado)
  fs.mkdirSync(IMPORTS_DIR, { recursive: true });
  const tempPayloadPath = path.join(IMPORTS_DIR, 'pending_routine_update.json');
  const exercisesPayload = params.hevySyncPayload.map((item) => ({
    exerciseName: item.exerciseName,
    esTitle: item.esTitle || translateExerciseTitle(item.exerciseName),
    targetWeightKg: item.suggestedWeightKg,
    targetWeightLbs: item.suggestedWeightLbs || Math.round((item.suggestedWeightKg / LBS_TO_KG) * 10) / 10,
    targetReps: item.targetReps,
    pinnedNote: item.note || '',
  }));
  fs.writeFileSync(
    tempPayloadPath,
    JSON.stringify({ routineTitle: params.routineTitle, exercises: exercisesPayload }, null, 2),
    'utf8'
  );

  const args = [
    'update-routine',
    '--routine-name',
    params.routineTitle,
    ...(known?.routineUrl ? ['--routine-url', known.routineUrl] : []),
    '--payload-file',
    tempPayloadPath,
  ];
  const bridgeRes = await runHevyWebBridgeCommand(args, 95000);

  if (bridgeRes?.ok) {
    return {
      syncedToHevy: true,
      method: 'hevy_web_playwright',
      routineUrl: known?.routineUrl,
      editUrl: bridgeRes.editUrl,
      modifiedExercises: bridgeRes.modifiedExercises,
      message: `Rutina '${params.routineTitle}' actualizada realmente en Hevy Web (${bridgeRes.modifiedExercises?.length || 0} ejercicios modificados).`,
    };
  }

  return {
    syncedToHevy: false,
    method: 'local_plan_only',
    requiresLogin: Boolean(bridgeRes?.requiresLogin),
    routineUrl: known?.routineUrl,
    editUrl: known?.editUrl,
    message: bridgeRes?.requiresLogin
      ? 'Prescripción guardada SOLO en VYFITH local. NO se modificó Hevy todavía porque tu cuenta es Free (sin API PRO) y falta iniciar sesión 1 vez en el puente Chrome Hevy Web.'
      : `Prescripción guardada SOLO en VYFITH local. No se pudo confirmar edición en Hevy Web: ${bridgeRes?.error || 'puente no conectado'}.`,
  };
}

export function readHevyBridgeAuthStatus(): {
  authenticated: boolean;
  accountName: string | null;
  checkedAt: string | null;
} {
  try {
    const sessionStatePath = path.join(process.cwd(), '.hevy-chrome-profile', 'session_state.json');
    if (fs.existsSync(sessionStatePath)) {
      const st = JSON.parse(fs.readFileSync(sessionStatePath, 'utf8'));
      return {
        authenticated: Boolean(st?.authenticated),
        accountName: st?.accountName || null,
        checkedAt: st?.checkedAt || null,
      };
    }
  } catch {
    // ignore
  }
  return { authenticated: false, accountName: null, checkedAt: null };
}

export async function exportLiveRoutinesFromHevy(): Promise<{
  ok: boolean;
  requiresLogin?: boolean;
  routineCount?: number;
  error?: string;
}> {
  const res = await runHevyWebBridgeCommand(['export-routines'], 95000);
  if (res?.ok) {
    return { ok: true, routineCount: res.routineCount || 0 };
  }
  return {
    ok: false,
    requiresLogin: Boolean(res?.requiresLogin),
    error: res?.error || 'No se pudieron exportar las rutinas desde Hevy Web.',
  };
}

export async function applyRoutinePlanToHevyExternal(params: {
  routineTitle: string;
  routineShortId?: string;
  routineUuid?: string;
  applyOptions: {
    weightsAndReps: boolean;
    restTimers: boolean;
    notes: boolean;
    reorder: boolean;
    removeMarked: boolean;
  };
  exercises: Array<{
    exerciseName: string;
    esTitle?: string;
    keepExercise?: boolean;
    suggestedOrderIndex?: number;
    suggestedRestSeconds?: number;
    pinnedNote?: string;
    targetWeightKg?: number;
    targetWeightLbs?: number;
    setSuggestions?: Array<{
      setNumber: number;
      isWarmup?: boolean;
      suggestedWeightKg: number;
      suggestedWeightLbs?: number;
      suggestedReps: number;
      suggestedRepRange?: string;
    }>;
  }>;
}): Promise<{
  syncedToHevy: boolean;
  verifiedHttp200: boolean;
  httpStatus?: number;
  method: 'hevy_web_playwright' | 'local_plan_only';
  requiresLogin?: boolean;
  backupSaved?: boolean;
  backupFile?: string | null;
  routineUrl?: string;
  editUrl?: string;
  modifiedExercises: any[];
  restTimersUpdated: any[];
  notesUpdated: string[];
  removedExercises: string[];
  reorderedCount: number;
  finalOrderTitles: string[];
  notFound: string[];
  verifiedExerciseCount?: number | null;
  message: string;
}> {
  const known = findKnownRoutine(params.routineShortId || params.routineTitle);
  const shortId = params.routineShortId || known?.routineId || '';
  const uuid = params.routineUuid || known?.routineUuid || '';

  fs.mkdirSync(IMPORTS_DIR, { recursive: true });
  const tempPayloadPath = path.join(IMPORTS_DIR, 'pending_routine_plan.json');
  const fullPayload = {
    routineTitle: params.routineTitle,
    routineShortId: shortId,
    routineUuid: uuid,
    applyOptions: params.applyOptions,
    exercises: params.exercises.map((ex) => ({
      ...ex,
      esTitle: ex.esTitle || translateExerciseTitle(ex.exerciseName),
    })),
  };
  fs.writeFileSync(tempPayloadPath, JSON.stringify(fullPayload, null, 2), 'utf8');

  const args = [
    'apply-routine-plan',
    '--routine-name',
    params.routineTitle,
    ...(shortId ? ['--routine-id', shortId] : []),
    ...(uuid ? ['--routine-uuid', uuid] : []),
    '--payload-file',
    tempPayloadPath,
  ];

  const bridgeRes = await runHevyWebBridgeCommand(args, 120000);

  if (bridgeRes?.ok && bridgeRes?.verifiedHttp200) {
    const modCount = Array.isArray(bridgeRes.modifiedExercises) ? bridgeRes.modifiedExercises.length : 0;
    const restCount = Array.isArray(bridgeRes.restTimersUpdated) ? bridgeRes.restTimersUpdated.length : 0;
    const notesCount = Array.isArray(bridgeRes.notesUpdated) ? bridgeRes.notesUpdated.length : 0;
    const remCount = Array.isArray(bridgeRes.removedExercises) ? bridgeRes.removedExercises.length : 0;
    const reordCount = Number(bridgeRes.reorderedCount || 0);

    const summaryParts = [
      modCount > 0 ? `${modCount} ejercicios actualizados` : null,
      restCount > 0 ? `${restCount} descansos ajustados` : null,
      notesCount > 0 ? `${notesCount} notas fijadas` : null,
      reordCount > 0 ? `${reordCount} reordenamientos` : null,
      remCount > 0 ? `${remCount} ejercicios eliminados` : null,
    ].filter(Boolean);

    return {
      syncedToHevy: true,
      verifiedHttp200: true,
      httpStatus: bridgeRes.httpStatus,
      method: 'hevy_web_playwright',
      backupSaved: Boolean(bridgeRes.backupSaved),
      backupFile: bridgeRes.backupFile || null,
      routineUrl: bridgeRes.routineUrl || known?.routineUrl,
      editUrl: bridgeRes.editUrl || known?.editUrl,
      modifiedExercises: bridgeRes.modifiedExercises || [],
      restTimersUpdated: bridgeRes.restTimersUpdated || [],
      notesUpdated: bridgeRes.notesUpdated || [],
      removedExercises: bridgeRes.removedExercises || [],
      reorderedCount: reordCount,
      finalOrderTitles: bridgeRes.finalOrderTitles || [],
      notFound: bridgeRes.notFound || [],
      verifiedExerciseCount: bridgeRes.verifiedExerciseCount ?? null,
      message: `Verificado en Hevy Web (HTTP ${bridgeRes.httpStatus}): ${summaryParts.join(' • ')}. Ya se sincroniza en tu Hevy App del celular.`,
    };
  }

  return {
    syncedToHevy: false,
    verifiedHttp200: false,
    httpStatus: bridgeRes?.httpStatus,
    method: 'local_plan_only',
    requiresLogin: Boolean(bridgeRes?.requiresLogin),
    backupSaved: Boolean(bridgeRes?.backupSaved),
    routineUrl: known?.routineUrl,
    editUrl: bridgeRes?.editUrl || known?.editUrl,
    modifiedExercises: [],
    restTimersUpdated: [],
    notesUpdated: [],
    removedExercises: [],
    reorderedCount: 0,
    finalOrderTitles: [],
    notFound: bridgeRes?.notFound || [],
    message: bridgeRes?.requiresLogin
      ? 'Plan guardado SOLO en VYFITH local. Falta iniciar sesión 1 vez en Hevy Web (Conectar_Hevy_Web.bat).'
      : `Plan guardado SOLO en VYFITH local. Hevy Web no confirmó guardado HTTP 200: ${bridgeRes?.error || 'error desconocido'}.`,
  };
}
