import { NextRequest, NextResponse } from 'next/server';
import { HevyWorkoutSession, HevyExercise, ExerciseSet } from '@/lib/hevyStore';
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get('apiKey') || process.env.HEVY_API_KEY;

  if (!apiKey) {
    // Si no hay API key, retornar las sesiones locales existentes
    const filePath = path.join(process.cwd(), 'data', 'real_hevy_workouts.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return NextResponse.json({
        source: 'local_database',
        count: Array.isArray(data) ? data.length : 0,
        workouts: data.slice(0, 20),
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
    const csvContent = body.csvContent;

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'csvContent requerido en formato texto.' }, { status: 400 });
    }

    const parsedSessions = parseHevyCsv(csvContent);
    return NextResponse.json({
      success: true,
      sessionsCount: parsedSessions.length,
      workouts: parsedSessions.slice(0, 15),
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Error procesando archivo CSV', details: err.message }, { status: 500 });
  }
}
