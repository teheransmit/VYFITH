import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { HevyWorkoutSession, HevyExercise, ExerciseSet } from './hevyStore';
import {
  parseHevyDate,
  classifyExerciseMuscleGroup,
  translateExerciseTitle,
  findKnownRoutine,
} from './hevyDateParser';

const execFileAsync = promisify(execFile);

const LBS_TO_KG = 0.45359237;
const WORKOUTS_PATH = path.join(process.cwd(), 'data', 'real_hevy_workouts.json');
const META_PATH = path.join(process.cwd(), 'data', 'hevy_sync_meta.json');
const IMPORTS_DIR = path.join(process.cwd(), 'data', 'imports');
const BRIDGE_SCRIPT = path.join(process.cwd(), 'scripts', 'hevy_web_bridge.mjs');

const KNOWN_WORKOUT_SHORT_IDS: Record<string, string> = {
  'full legs|2026-11-10t17:15': 'fveLGVNMjSv',
  'horizontal torso (chest & back)|2026-11-09t10:04': 'BbD4VM1I5fI',
  'arms & shoulders|2026-10-30t16:30': '0P12cOsoyIM',
  'full legs|2026-10-29t16:22': 'KQhZwkraYRf',
  'horizontal torso (chest & back)|2026-10-27t16:15': 'sIkYBSAf7jc',
  'full legs|2026-09-30t16:08': 'T6r0QPmPAMf',
  'horizontal torso (chest & back)|2026-09-28t16:09': 'OR7HX5ZjKSB',
  'horizontal torso (chest & back)|2026-09-21t16:19': 'hIJt0wq1uvW',
};

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
        startTimeLocal: extractLocalClock(startTime),
        endTimeLocal: extractLocalClock(endTime),
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
  const end = rawWorkout.end_time || rawWorkout.updated_at || start;
  const dStart = new Date(start);
  const dEnd = new Date(end);
  const durationMinutes =
    rawWorkout.durationMinutes ||
    (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime()) && dEnd.getTime() > dStart.getTime()
      ? Math.max(5, Math.round((dEnd.getTime() - dStart.getTime()) / 60000))
      : 60);

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
      // Conservar ID corto oficial de Hevy si ya estaba registrado
      const preservedId = prev.id && !prev.id.startsWith('hevy-') ? prev.id : w.id;
      if (
        prev.totalSets !== w.totalSets ||
        Math.abs((prev.totalVolumeKg || 0) - (w.totalVolumeKg || 0)) > 2 ||
        (prev.exercises?.length || 0) !== (w.exercises?.length || 0)
      ) {
        updatedCount++;
      }
      byKey.set(k, { ...w, id: preservedId });
    }
  }

  const allSorted = sortWorkoutsNewestFirst(Array.from(byKey.values()));
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

let activeBridgePromise: Promise<any> | null = null;

export async function runHevyWebBridgeCommand(args: string[], timeoutMs = 95000): Promise<any> {
  if (!fs.existsSync(BRIDGE_SCRIPT)) {
    return { ok: false, error: 'Falta scripts/hevy_web_bridge.mjs' };
  }
  const execPromise = execFileAsync(process.execPath, [BRIDGE_SCRIPT, ...args], {
    cwd: process.cwd(),
    timeout: timeoutMs,
    windowsHide: args[0] !== 'login',
  })
    .then(({ stdout }) => {
      const lines = stdout.trim().split(/\r?\n/);
      const lastLine = lines[lines.length - 1] || '{}';
      return JSON.parse(lastLine);
    })
    .catch((err) => {
      const out = err?.stdout?.trim()?.split(/\r?\n/)?.pop();
      if (out) {
        try {
          return JSON.parse(out);
        } catch {
          // ignore
        }
      }
      return { ok: false, error: err?.message || 'Error ejecutando puente Chrome Hevy Web' };
    });

  if (args[0] === 'export-csv' || args[0] === 'status') {
    if (activeBridgePromise) return activeBridgePromise;
    activeBridgePromise = execPromise.finally(() => {
      activeBridgePromise = null;
    });
    return activeBridgePromise;
  }
  return execPromise;
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

  // 2. Si hay API Key oficial de Hevy PRO -> consultar API v1 paginada y normalizar
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
  } else if (options?.liveBrowser) {
    // 3. Si es Sync en Vivo en cuenta Free -> usar puente Chrome Web (export oficial CSV)
    const bridgeRes = await runHevyWebBridgeCommand(['export-csv'], 100000);
    if (bridgeRes?.ok && bridgeRes.csvPath && fs.existsSync(bridgeRes.csvPath)) {
      browserBridgeAuthenticated = true;
      const csvText = fs.readFileSync(bridgeRes.csvPath, 'utf8');
      const parsed = parseHevyCsvToSessions(csvText);
      const hash = crypto.createHash('sha256').update(csvText).digest('hex');
      const stat = fs.statSync(bridgeRes.csvPath);
      const meta = readSyncMeta();
      const updatedFiles = {
        ...meta.processedFiles,
        [bridgeRes.csvPath]: { mtimeMs: stat.mtimeMs, hash, processedAt: new Date().toISOString() },
      };
      const merged = mergeAndPersistWorkouts(parsed, 'hevy_web_live_export', {
        lastLivePullAt: new Date().toISOString(),
        hevyPlanDetected: 'free',
        processedFiles: updatedFiles,
      });
      workouts = merged.allWorkouts;
      addedCount += merged.addedCount;
      updatedCount += merged.updatedCount;
      sourceUsed = 'hevy_web_live_export';
    } else if (bridgeRes?.requiresLogin) {
      requiresBrowserAuth = true;
      browserBridgeAuthenticated = false;
      warning =
        'Tu cuenta Hevy es Free (sin API Key PRO) y falta iniciar sesión 1 vez en el puente Chrome Hevy Web para descargar automáticamente tus últimos entrenamientos.';
    } else if (bridgeRes?.error) {
      warning = `Puente Chrome Hevy Web: ${bridgeRes.error}`;
    }
  } else {
    // Chequeo pasivo rápido: leer estado real guardado por hevy_web_bridge.mjs (nunca asumir por simple archivo Cookies)
    const sessionStatePath = path.join(process.cwd(), '.hevy-chrome-profile', 'session_state.json');
    try {
      if (fs.existsSync(sessionStatePath)) {
        const st = JSON.parse(fs.readFileSync(sessionStatePath, 'utf8'));
        browserBridgeAuthenticated = Boolean(st?.authenticated);
      }
    } catch {
      browserBridgeAuthenticated = false;
    }
  }

  return {
    workouts,
    sourceUsed,
    addedCount,
    updatedCount,
    requiresBrowserAuth,
    hasProApiKey,
    browserBridgeAuthenticated,
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
