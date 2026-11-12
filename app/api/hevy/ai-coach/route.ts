import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateAiCoachPrescription } from '@/lib/aiCoachPeriodizationEngine';
import { findKnownRoutine } from '@/lib/hevyDateParser';
import { readStoredWorkouts, pushPrescriptionToHevyExternal } from '@/lib/hevySyncService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROUTINES_FILE = path.join(process.cwd(), 'data', 'prescribed_hevy_routines.json');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routine = searchParams.get('routine') || 'Horizontal Torso (Chest & Back)';
    const workouts = readStoredWorkouts();
    const prescription = generateAiCoachPrescription(routine, { workouts });
    const known = findKnownRoutine(routine);

    let localSaved: any = null;
    if (fs.existsSync(ROUTINES_FILE)) {
      try {
        const all = JSON.parse(fs.readFileSync(ROUTINES_FILE, 'utf8'));
        localSaved = all[prescription.routineName] || all[routine] || null;
      } catch {
        localSaved = null;
      }
    }

    return NextResponse.json({
      success: true,
      prescription,
      localSaved,
      routineMeta: known || null,
      capabilities: {
        hasProApiKey: Boolean(process.env.HEVY_API_KEY),
        hevyAccountTier: process.env.HEVY_API_KEY ? 'pro' : 'free',
      },
      totalWorkoutsAnalyzed: workouts.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error calculando prescripción de IA' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const routineTitle = body?.routineTitle || 'Horizontal Torso (Chest & Back)';
    const hevySyncPayload = body?.hevySyncPayload;
    const prescriptions = body?.prescriptions;

    if (!hevySyncPayload || !Array.isArray(hevySyncPayload)) {
      return NextResponse.json(
        { success: false, error: 'Payload de rutina inválido o faltante' },
        { status: 400 }
      );
    }

    // 1. Guardar copia de prescripción científica en plan local de VYFITH
    let existingRoutines: Record<string, any> = {};
    if (fs.existsSync(ROUTINES_FILE)) {
      try {
        existingRoutines = JSON.parse(fs.readFileSync(ROUTINES_FILE, 'utf8'));
      } catch {
        existingRoutines = {};
      }
    }

    existingRoutines[routineTitle] = {
      routineTitle,
      updatedAt: new Date().toISOString(),
      source: 'VYFITH-AI-Coach-JeffNippard',
      exercisesCount: hevySyncPayload.length,
      hevySyncPayload,
      prescriptions: prescriptions || [],
    };
    fs.writeFileSync(ROUTINES_FILE, JSON.stringify(existingRoutines, null, 2), 'utf8');

    // 2. Intentar sincronización REAL hacia Hevy (API PRO o Playwright sobre hevy.com/edit-routine)
    // PROHIBIDO afirmar que Hevy se actualizó si no hubo escritura real verificada.
    const externalResult = await pushPrescriptionToHevyExternal({
      routineTitle,
      hevySyncPayload,
    });

    return NextResponse.json({
      success: true,
      savedLocally: true,
      syncedToHevy: externalResult.syncedToHevy,
      method: externalResult.method,
      requiresLogin: Boolean(externalResult.requiresLogin),
      routineUrl: externalResult.routineUrl || findKnownRoutine(routineTitle)?.routineUrl,
      editUrl: externalResult.editUrl || findKnownRoutine(routineTitle)?.editUrl,
      modifiedExercises: externalResult.modifiedExercises || [],
      message: externalResult.message,
      appliedRoutine: existingRoutines[routineTitle],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[HEVY AI COACH ROUTE ERROR]', error);
    return NextResponse.json(
      { success: false, syncedToHevy: false, error: error.message || 'Error interno en el servidor' },
      { status: 500 }
    );
  }
}
