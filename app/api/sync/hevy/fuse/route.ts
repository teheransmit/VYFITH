import { NextRequest, NextResponse } from 'next/server';
import {
  readWatchArchive,
  syncAndAutoFuseFromCloud,
  upsertWatchSessionsAndAutoFuse,
  manualFuseHevyWithWatch,
  unfuseHevyWorkout,
  normalizeWatchSession,
} from '@/lib/workoutFusionEngine';
import { readStoredWorkouts } from '@/lib/hevySyncService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Parsea un CSV exportado de Mi Fitness / Zepp Life / Xiaomi (o JSON de Health Connect)
 * a sesiones estándar del reloj para poder fusionarlas con Hevy.
 */
function parseUploadedWatchFile(content: string, filename = ''): any[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // 1. JSON (array de sesiones o payload con extendedBiometrics)
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.sessions)) return parsed.sessions;
      if (Array.isArray(parsed.exerciseSessions)) return parsed.exerciseSessions;
      if (Array.isArray(parsed.recentExerciseSessions)) return parsed.recentExerciseSessions;
      if (parsed.extendedBiometrics) {
        return [
          ...(Array.isArray(parsed.extendedBiometrics.exerciseSessions) ? parsed.extendedBiometrics.exerciseSessions : []),
          ...(Array.isArray(parsed.extendedBiometrics.recentExerciseSessions) ? parsed.extendedBiometrics.recentExerciseSessions : []),
        ];
      }
    } catch {
      // fall through to CSV parser
    }
  }

  // 2. CSV (Mi Fitness sport export: Key/Time/Value JSON o columnas startTime/endTime/duration/calories/avgHeartRate)
  const lines = trimmed.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const splitCsvLine = (line: string): string[] => {
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

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const extracted: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? '';
    });

    // Formato oficial GDPR Mi Fitness (Key, Time, Value con JSON embebido en Value)
    if (row['value'] && row['value'].startsWith('{')) {
      try {
        const valObj = JSON.parse(row['value']);
        const startSec = Number(valObj.start_time || valObj.time || row['time'] || 0);
        const endSec = Number(valObj.end_time || 0);
        const durSec = Number(valObj.duration || (endSec > startSec ? endSec - startSec : 0));
        if (startSec > 1_000_000_000 && durSec >= 120) {
          const startMs = startSec > 1e12 ? startSec : startSec * 1000;
          const endMs = endSec > 1_000_000_000 ? (endSec > 1e12 ? endSec : endSec * 1000) : startMs + durSec * 1000;
          const sportName = String(row['key'] || valObj.category || valObj.sport_type || 'Entrenamiento Reloj');
          extracted.push({
            id: `mifitness-${startSec}-${Math.round(durSec)}`,
            startTimeIso: new Date(startMs).toISOString(),
            endTimeIso: new Date(endMs).toISOString(),
            durationSeconds: durSec,
            durationMinutes: Math.max(1, Math.round(durSec / 60)),
            title: sportName,
            exerciseTypeName: sportName,
            caloriesBurned: Number(valObj.calories || valObj.calorie || 0),
            avgHeartRateBpm: Number(valObj.avg_hrm || valObj.avg_hr || valObj.heart_rate_avg || 0) || null,
            maxHeartRateBpm: Number(valObj.max_hrm || valObj.max_hr || valObj.heart_rate_max || 0) || null,
            minHeartRateBpm: Number(valObj.min_hrm || valObj.min_hr || valObj.heart_rate_min || 0) || null,
            distanceMeters: Number(valObj.distance || 0) || null,
            sourceLabel: `Mi Fitness Export (${filename || 'CSV'})`,
            deviceModel: 'Xiaomi Smart Band 9 Pro',
            isWatchSource: true,
          });
        }
      } catch {
        // ignore invalid JSON row
      }
      continue;
    }

    // Formato CSV tabular genérico (date / start_time / end_time / duration / avg_hr / max_hr / calories)
    const startRaw = row['start_time'] || row['starttime'] || row['start'] || row['inicio'] || '';
    const endRaw = row['end_time'] || row['endtime'] || row['end'] || row['fin'] || '';
    if (!startRaw) continue;

    extracted.push({
      id: row['id'] || undefined,
      dateIso: row['date'] || row['dateiso'] || row['fecha'] || '',
      startTimeIso: startRaw,
      endTimeIso: endRaw || undefined,
      durationMinutes: Number(row['duration_minutes'] || row['duration'] || row['duracion'] || 0) || undefined,
      title: row['title'] || row['type'] || row['sport'] || row['actividad'] || 'Entrenamiento Reloj',
      exerciseTypeName: row['exercise_type'] || row['type'] || row['sport'] || row['actividad'] || 'Entrenamiento',
      caloriesBurned: Number(row['calories'] || row['kcal'] || row['calorias'] || 0),
      avgHeartRateBpm: Number(row['avg_hr'] || row['avg_heart_rate'] || row['fc_prom'] || 0) || null,
      maxHeartRateBpm: Number(row['max_hr'] || row['max_heart_rate'] || row['fc_max'] || 0) || null,
      minHeartRateBpm: Number(row['min_hr'] || row['min_heart_rate'] || row['fc_min'] || 0) || null,
      sourceLabel: `Mi Fitness CSV (${filename || 'manual'})`,
      deviceModel: row['device'] || 'Xiaomi Smart Band 9 Pro',
      isWatchSource: true,
    });
  }

  return extracted;
}

export async function GET() {
  try {
    const workouts = readStoredWorkouts();
    const archive = readWatchArchive();
    const fusedWorkouts = workouts.filter((w) => Boolean(w.watchBiometrics));
    const matchedWatchIds = new Set(
      fusedWorkouts.map((w) => w.watchBiometrics?.watchSessionId).filter(Boolean)
    );
    const unmatchedWatchSessions = archive.sessions.filter((s) => !matchedWatchIds.has(s.id));

    return NextResponse.json({
      success: true,
      totalHevyWorkouts: workouts.length,
      fusedWorkoutsCount: fusedWorkouts.length,
      watchSessionsCount: archive.sessions.length,
      unmatchedWatchSessionsCount: unmatchedWatchSessions.length,
      lastArchiveUpdated: archive.lastUpdated,
      lastFirestorePullAt: archive.lastFirestorePullAt || null,
      watchSessions: archive.sessions,
      unmatchedWatchSessions,
      matchedPairs: fusedWorkouts.map((w) => ({
        hevyId: w.id,
        hevyName: w.name,
        hevyDate: w.date,
        watchSessionId: w.watchBiometrics!.watchSessionId,
        watchTitle: w.watchBiometrics!.watchTitle,
        watchDateIso: w.watchBiometrics!.watchDateIso,
        watchStartTime: w.watchBiometrics!.watchStartTime,
        watchEndTime: w.watchBiometrics!.watchEndTime,
        avgHeartRateBpm: w.watchBiometrics!.avgHeartRateBpm,
        maxHeartRateBpm: w.watchBiometrics!.maxHeartRateBpm,
        caloriesBurned: w.watchBiometrics!.caloriesBurned,
        startOffsetSeconds: w.watchBiometrics!.startOffsetSeconds,
        endOffsetSeconds: w.watchBiometrics!.endOffsetSeconds,
        overlapPct: w.watchBiometrics!.overlapPct,
        matchConfidence: w.watchBiometrics!.matchConfidence,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error leyendo estado de fusión Reloj-Hevy' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'auto_fuse');

    if (action === 'manual_fuse') {
      const hevyWorkoutId = String(body?.hevyWorkoutId || '').trim();
      const watchSessionId = String(body?.watchSessionId || '').trim();
      if (!hevyWorkoutId || !watchSessionId) {
        return NextResponse.json(
          { success: false, error: 'Se requiere hevyWorkoutId y watchSessionId.' },
          { status: 400 }
        );
      }
      const res = manualFuseHevyWithWatch(hevyWorkoutId, watchSessionId);
      if (!res.ok) {
        return NextResponse.json({ success: false, error: res.error }, { status: 404 });
      }
      const archive = readWatchArchive();
      return NextResponse.json({
        success: true,
        action: 'manual_fuse',
        workout: res.workout,
        workouts: res.workouts,
        watchSessions: archive.sessions,
        fusedWorkoutsCount: (res.workouts || []).filter((w) => Boolean(w.watchBiometrics)).length,
        message: `Sesión del reloj vinculada manualmente con «${res.workout?.name}».`,
      });
    }

    if (action === 'unfuse') {
      const hevyWorkoutId = String(body?.hevyWorkoutId || '').trim();
      if (!hevyWorkoutId) {
        return NextResponse.json(
          { success: false, error: 'Se requiere hevyWorkoutId.' },
          { status: 400 }
        );
      }
      const res = unfuseHevyWorkout(hevyWorkoutId);
      if (!res.ok) {
        return NextResponse.json({ success: false, error: res.error }, { status: 404 });
      }
      const archive = readWatchArchive();
      return NextResponse.json({
        success: true,
        action: 'unfuse',
        workouts: res.workouts,
        watchSessions: archive.sessions,
        fusedWorkoutsCount: (res.workouts || []).filter((w) => Boolean(w.watchBiometrics)).length,
        message: 'Telemetría del reloj desvinculada del entrenamiento.',
      });
    }

    if (action === 'ingest_watch_sessions') {
      let incoming: any[] = [];
      if (Array.isArray(body?.sessions)) {
        incoming = body.sessions;
      } else if (typeof body?.fileContent === 'string') {
        incoming = parseUploadedWatchFile(body.fileContent, String(body?.filename || 'watch_export'));
      } else if (body?.session && typeof body.session === 'object') {
        incoming = [body.session];
      }

      const validNormalized = incoming.map(normalizeWatchSession).filter(Boolean);
      if (validNormalized.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              'No se encontraron sesiones de entrenamiento válidas en el archivo o payload (se requiere fecha/hora de inicio).',
          },
          { status: 400 }
        );
      }

      const report = upsertWatchSessionsAndAutoFuse(validNormalized);
      return NextResponse.json({
        success: true,
        action: 'ingest_watch_sessions',
        ingestedCount: validNormalized.length,
        ...report,
        message:
          report.newlyFusedCount > 0
            ? `${validNormalized.length} sesiones del reloj procesadas y ${report.newlyFusedCount} entrenamiento(s) de Hevy fusionados automáticamente.`
            : `${validNormalized.length} sesiones del reloj guardadas en el archivo (${report.fusedWorkoutsCount} fusionados en total).`,
      });
    }

    // Acción por defecto: auto_fuse (descarga sesiones de Firestore + fusiona con Hevy)
    const report = await syncAndAutoFuseFromCloud();
    const message =
      report.newlyFusedCount > 0
        ? `¡Fusión completada! ${report.newlyFusedCount} entrenamiento(s) nuevos fusionados (${report.fusedWorkoutsCount} total) desde ${report.watchSessionsCount} sesiones del reloj.`
        : report.fusedWorkoutsCount > 0
        ? `Fusión al día: ${report.fusedWorkoutsCount} entrenamiento(s) de Hevy fusionados con tu Xiaomi Smart Band 9 Pro (${report.watchSessionsCount} sesiones del reloj en historial).`
        : report.watchSessionsCount > 0
        ? `Se detectaron ${report.watchSessionsCount} sesiones del reloj en la nube, pero ninguna coincide con las fechas/horas de tus sesiones de Hevy todavía. Abre VYFITH Android actualizado en tu Vivo Y20 y pulsa Sincronizar para subir el historial de los últimos 60 días del reloj.`
        : 'Aún no hay sesiones de ejercicio del reloj en Firestore. Abre VYFITH Android en tu Vivo Y20 y pulsa Sincronizar para enviar el historial de los últimos 60 días.';

    return NextResponse.json({
      success: true,
      action: 'auto_fuse',
      ...report,
      message,
    });
  } catch (err: any) {
    console.error('[HEVY FUSE ERROR]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error ejecutando fusión Hevy-Reloj' },
      { status: 500 }
    );
  }
}
