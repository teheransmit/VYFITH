import { NextRequest, NextResponse } from 'next/server';
import { HevyWorkoutSession, HevyExercise, ExerciseSet } from '@/lib/hevyStore';
import { generateAiCoachPrescription } from '@/lib/aiCoachPeriodizationEngine';
import * as fs from 'fs';
import * as path from 'path';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseHevyCsv(csvContent: string): HevyWorkoutSession[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const sessionsMap = new Map<string, HevyWorkoutSession>();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    const title = row['title'] || 'Entrenamiento Hevy';
    const startTime = row['start_time'] || '';
    const sessionKey = `${title}_${startTime}`;

    if (!sessionsMap.has(sessionKey)) {
      sessionsMap.set(sessionKey, {
        id: `hevy-csv-${i}`,
        name: title,
        date: startTime,
        durationMinutes: 60,
        totalVolumeKg: 0,
        totalSets: 0,
        rpeAverage: 8.5,
        exercises: [],
      });
    }

    const session = sessionsMap.get(sessionKey)!;
    const exerciseName = row['exercise_title'] || 'Ejercicio';
    const weight = parseFloat(row['weight_kg']) || 0;
    const reps = parseInt(row['reps'], 10) || 0;
    const rpe = parseFloat(row['rpe']) || undefined;

    let exercise = session.exercises.find((e) => e.name === exerciseName);
    if (!exercise) {
      let group: HevyExercise['muscleGroup'] = 'Pecho';
      const lower = exerciseName.toLowerCase();
      if (lower.includes('curl') || lower.includes('tricep') || lower.includes('arm')) group = 'Brazos';
      else if (lower.includes('squat') || lower.includes('leg') || lower.includes('calf') || lower.includes('press de pierna')) group = 'Piernas';
      else if (lower.includes('pull') || lower.includes('row') || lower.includes('lat') || lower.includes('chin')) group = 'Espalda';
      else if (lower.includes('shoulder') || lower.includes('military') || lower.includes('lateral')) group = 'Hombros';
      else if (lower.includes('ab') || lower.includes('plank')) group = 'Core';

      exercise = {
        name: exerciseName,
        muscleGroup: group,
        sets: [],
        totalVolume: 0,
      };
      session.exercises.push(exercise);
    }

    const setObj: ExerciseSet = {
      setNumber: exercise.sets.length + 1,
      weightKg: weight,
      reps: reps,
      rpe: rpe,
    };
    exercise.sets.push(setObj);
    const setVol = weight * reps;
    exercise.totalVolume += setVol;
    session.totalVolumeKg += setVol;
    session.totalSets += 1;
  }

  return Array.from(sessionsMap.values());
}

function normalizeWorkoutSession(raw: any): HevyWorkoutSession {
  const title = raw.title || raw.name || 'Entrenamiento Hevy';
  const startTime = raw.start_time || raw.startTime || raw.date || new Date().toISOString();
  const rawExercises = raw.exercises || [];

  const exercises: HevyExercise[] = rawExercises.map((e: any) => {
    const exName = e.title || e.name || 'Ejercicio';
    let group: HevyExercise['muscleGroup'] = 'Pecho';
    const lower = exName.toLowerCase();
    if (lower.includes('curl') || lower.includes('tricep') || lower.includes('arm')) group = 'Brazos';
    else if (lower.includes('squat') || lower.includes('leg') || lower.includes('calf') || lower.includes('press de pierna')) group = 'Piernas';
    else if (lower.includes('pull') || lower.includes('row') || lower.includes('lat') || lower.includes('chin')) group = 'Espalda';
    else if (lower.includes('shoulder') || lower.includes('military') || lower.includes('lateral')) group = 'Hombros';
    else if (lower.includes('ab') || lower.includes('plank')) group = 'Core';

    const sets: ExerciseSet[] = (e.sets || []).map((s: any, idx: number) => ({
      setNumber: s.index || s.setNumber || idx + 1,
      weightKg: parseFloat(s.weight_kg ?? s.weightKg ?? 0),
      reps: parseInt(s.reps ?? 0, 10),
      rpe: s.rpe ? parseFloat(s.rpe) : undefined,
      indicator: s.set_type === 'warmup' ? 'warmup' : 'normal',
    }));

    const totalVolume = sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);

    return {
      name: exName,
      muscleGroup: group,
      sets,
      totalVolume,
    };
  });

  const totalVolumeKg = exercises.reduce((acc, e) => acc + e.totalVolume, 0);
  const totalSets = exercises.reduce((acc, e) => acc + e.sets.length, 0);

  return {
    id: raw.id || `hevy-live-${Date.now()}`,
    name: title,
    date: startTime,
    durationMinutes: raw.duration_minutes || raw.durationMinutes || 60,
    totalVolumeKg,
    totalSets,
    rpeAverage: raw.rpe || 8.0,
    exercises,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get('apiKey') || process.env.HEVY_API_KEY;

  if (!apiKey) {
    const filePath = path.join(process.cwd(), 'data', 'real_hevy_workouts.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 0;
      return NextResponse.json({
        source: 'local_database',
        count: Array.isArray(data) ? data.length : 0,
        workouts: limit > 0 ? data.slice(0, limit) : data,
      });
    }
    return NextResponse.json({
      error: 'Se requiere una clave de API de Hevy o un archivo CSV cargado.',
      instructions: {
        method1: 'Exportar CSV desde la app o https://hevy.com/settings -> Export Data.',
        method2: 'Obtener API Key en https://hevy.com/settings?developer (Hevy Pro) y pasarla como parámetro ?apiKey=...',
      },
    }, { status: 400 });
  }

  try {
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';

    const hevyResponse = await fetch(`https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=${pageSize}`, {
      headers: {
        'api-key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!hevyResponse.ok) {
      return NextResponse.json({
        error: `Error al consultar Hevy API: ${hevyResponse.status} ${hevyResponse.statusText}`,
      }, { status: hevyResponse.status });
    }

    const hevyData = await hevyResponse.json();
    return NextResponse.json({
      source: 'hevy_public_api',
      data: hevyData,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: 'Error de conexión con api.hevyapp.com',
      details: err.message,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filePath = path.join(process.cwd(), 'data', 'real_hevy_workouts.json');
    let existingSessions: HevyWorkoutSession[] = [];
    if (fs.existsSync(filePath)) {
      try {
        existingSessions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        existingSessions = [];
      }
    }

    // Caso 1: CSV upload
    if (body.csvContent && typeof body.csvContent === 'string') {
      const parsedSessions = parseHevyCsv(body.csvContent);
      if (parsedSessions.length > 0) {
        const combined = [...parsedSessions, ...existingSessions];
        fs.writeFileSync(filePath, JSON.stringify(combined, null, 2), 'utf8');
      }
      return NextResponse.json({
        success: true,
        mode: 'csv_ingest',
        sessionsCount: parsedSessions.length,
        workouts: parsedSessions.slice(0, 15),
      });
    }

    // Caso 2: Webhook o sincronización automática JSON
    const rawWorkout = body.workout || body.data?.workout || (body.title && body.exercises ? body : null);
    if (rawWorkout) {
      const newSession = normalizeWorkoutSession(rawWorkout);

      const isDuplicate = existingSessions.some(
        (s) => s.id === newSession.id || (s.name === newSession.name && s.date === newSession.date)
      );

      if (!isDuplicate) {
        existingSessions.unshift(newSession);
        fs.writeFileSync(filePath, JSON.stringify(existingSessions, null, 2), 'utf8');
      }

      // Auto-recalcular sobrecarga progresiva (Jeff Nippard)
      let prescription = null;
      try {
        prescription = generateAiCoachPrescription(newSession.name);

        const prescribedPath = path.join(process.cwd(), 'data', 'prescribed_hevy_routines.json');
        let routines: Record<string, any> = {};
        if (fs.existsSync(prescribedPath)) {
          try {
            routines = JSON.parse(fs.readFileSync(prescribedPath, 'utf8'));
          } catch (e) {
            routines = {};
          }
        }
        routines[newSession.name] = {
          routineTitle: newSession.name,
          exercises: prescription.hevySyncPayload?.exercises || [],
          appliedAt: new Date().toISOString(),
          syncedWithHevy: true,
          status: 'ACTIVA_EN_HEVY',
          source: 'AUTO_WEBHOOK_INGESTION',
        };
        fs.writeFileSync(prescribedPath, JSON.stringify(routines, null, 2), 'utf8');
      } catch (e) {
        console.error('Error calculando prescripción tras webhook:', e);
      }

      return NextResponse.json({
        success: true,
        mode: 'auto_webhook_ingest',
        message: `¡Entrenamiento '${newSession.name}' recibido y guardado automáticamente en VYFITH!`,
        sessionId: newSession.id,
        isNew: !isDuplicate,
        prescription,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      error: 'Formato no reconocido. Se requiere csvContent o payload de entrenamiento (workout).',
    }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Error procesando entrenamiento', details: err.message }, { status: 500 });
  }
}
