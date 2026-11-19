import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateAiCoachPrescription } from '@/lib/aiCoachPeriodizationEngine';
import { findKnownRoutine } from '@/lib/hevyDateParser';
import {
  readStoredWorkouts,
  pushPrescriptionToHevyExternal,
  applyRoutinePlanToHevyExternal,
  exportLiveRoutinesFromHevy,
  readHevyBridgeAuthStatus,
  isRunningInSandboxedDesktop,
  HEVY_LOGIN_LAUNCHER_PATH,
} from '@/lib/hevySyncService';
import {
  findLiveHevyRoutine,
  getSavedAiAuditForRoutine,
  readLiveHevyRoutines,
  runRealAiRoutineAudit,
} from '@/lib/realAiCoachEngine';
import { HevyApplyOptions } from '@/lib/realAiCoachTypes';

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
    const liveRoutine = findLiveHevyRoutine(routine);
    const liveAudit = getSavedAiAuditForRoutine(routine);
    const allRoutinesBundle = readLiveHevyRoutines();
    const bridgeAuth = readHevyBridgeAuthStatus();

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
      liveAudit,
      liveRoutine,
      routinesExportedAt: allRoutinesBundle.exportedAt,
      allRoutines: allRoutinesBundle.routines.map((r) => ({
        shortId: r.shortId,
        uuid: r.uuid,
        title: r.title,
        exerciseCount: r.exerciseCount,
        routineUrl: r.routineUrl,
        editUrl: r.editUrl,
      })),
      bridgeAuth: {
        ...bridgeAuth,
        sandboxedDesktop: isRunningInSandboxedDesktop(),
        launcherScript: HEVY_LOGIN_LAUNCHER_PATH,
      },
      prescription,
      localSaved,
      routineMeta: known || null,
      capabilities: {
        hasProApiKey: Boolean(process.env.HEVY_API_KEY),
        hevyAccountTier: process.env.HEVY_API_KEY ? 'pro' : 'free',
        browserBridgeAuthenticated: bridgeAuth.authenticated,
      },
      totalWorkoutsAnalyzed: workouts.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error consultando Coach IA' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action || '').trim();

    // MODO 1: Refrescar snapshot de las 4 rutinas vivas desde Hevy Web
    if (action === 'export_routines') {
      const expRes = await exportLiveRoutinesFromHevy();
      const allRoutinesBundle = readLiveHevyRoutines();
      if (!expRes.ok) {
        return NextResponse.json(
          {
            success: false,
            requiresLogin: Boolean(expRes.requiresLogin),
            sandboxedDesktop: isRunningInSandboxedDesktop(),
            launcherScript: HEVY_LOGIN_LAUNCHER_PATH,
            error: expRes.error || 'No se pudieron exportar las rutinas de Hevy Web.',
          },
          { status: expRes.requiresLogin ? 401 : 502 }
        );
      }
      return NextResponse.json({
        success: true,
        routineCount: allRoutinesBundle.routines.length,
        exportedAt: allRoutinesBundle.exportedAt,
        allRoutines: allRoutinesBundle.routines.map((r) => ({
          shortId: r.shortId,
          uuid: r.uuid,
          title: r.title,
          exerciseCount: r.exerciseCount,
          routineUrl: r.routineUrl,
          editUrl: r.editUrl,
        })),
      });
    }

    // MODO 2: Auditoría REAL con Consejo Multi-IA (Gemini + NVIDIA NIM) — CERO 0ms fakes
    if (action === 'analyze_with_ai') {
      const routineName = String(body?.routineName || body?.routineTitle || 'Horizontal Torso (Chest & Back)');
      const shouldRefresh = Boolean(body?.refreshRoutines) || !findLiveHevyRoutine(routineName);

      if (shouldRefresh) {
        const expRes = await exportLiveRoutinesFromHevy();
        if (!expRes.ok && !findLiveHevyRoutine(routineName)) {
          return NextResponse.json(
            {
              success: false,
              requiresLogin: Boolean(expRes.requiresLogin),
              sandboxedDesktop: isRunningInSandboxedDesktop(),
              launcherScript: HEVY_LOGIN_LAUNCHER_PATH,
              error: expRes.error || 'No hay rutinas vivas exportadas desde Hevy Web.',
            },
            { status: expRes.requiresLogin ? 401 : 502 }
          );
        }
      }

      const aiRes = await runRealAiRoutineAudit({
        routineName,
        keys: body?.keys,
      });

      if (!aiRes.ok) {
        return NextResponse.json(
          {
            success: false,
            status: aiRes.status,
            error: aiRes.error,
            modelContributions: aiRes.modelContributions,
          },
          { status: aiRes.status >= 400 && aiRes.status < 600 ? aiRes.status : 502 }
        );
      }

      return NextResponse.json({
        success: true,
        liveAudit: aiRes.audit,
        liveRoutine: findLiveHevyRoutine(routineName),
      });
    }

    // MODO 3: Aplicar plan aprobado REAL a Hevy Web (pesos, reps, descansos, notas, orden, depuración) + verificación HTTP 200
    if (action === 'apply_to_hevy') {
      const routineName = String(body?.routineName || body?.routineTitle || 'Horizontal Torso (Chest & Back)');
      const liveRoutine = findLiveHevyRoutine(routineName);
      const savedAudit = getSavedAiAuditForRoutine(routineName);
      const known = findKnownRoutine(routineName);

      const applyOptions: HevyApplyOptions = {
        weightsAndReps: body?.applyOptions?.weightsAndReps !== false,
        restTimers: body?.applyOptions?.restTimers !== false,
        notes: body?.applyOptions?.notes !== false,
        reorder: Boolean(body?.applyOptions?.reorder),
        removeMarked: Boolean(body?.applyOptions?.removeMarked),
      };

      const sourceExercises = Array.isArray(body?.selectedExercises) && body.selectedExercises.length > 0
        ? body.selectedExercises
        : savedAudit?.exerciseRecommendations || [];

      if (sourceExercises.length === 0) {
        return NextResponse.json(
          {
            success: false,
            syncedToHevy: false,
            error: 'No hay recomendaciones de IA para aplicar. Pulsa primero «Analizar Rutina con IA».',
          },
          { status: 400 }
        );
      }

      const exercisesForBridge = sourceExercises.map((ex: any) => ({
        exerciseName: ex.exerciseName || ex.title,
        esTitle: ex.esTitle,
        keepExercise: ex.keepExercise !== false,
        suggestedOrderIndex: ex.suggestedOrderIndex,
        suggestedRestSeconds: ex.suggestedRestSeconds,
        pinnedNote: ex.pinnedNoteForHevy ?? ex.pinnedNote ?? '',
        targetWeightKg: ex.setSuggestions?.find((s: any) => !s.isWarmup)?.suggestedWeightKg ?? ex.targetWeightKg,
        targetWeightLbs: ex.setSuggestions?.find((s: any) => !s.isWarmup)?.suggestedWeightLbs ?? ex.targetWeightLbs,
        setSuggestions: Array.isArray(ex.setSuggestions) ? ex.setSuggestions : [],
      }));

      // Guardar copia local del plan aplicado
      let existingRoutines: Record<string, any> = {};
      if (fs.existsSync(ROUTINES_FILE)) {
        try {
          existingRoutines = JSON.parse(fs.readFileSync(ROUTINES_FILE, 'utf8'));
        } catch {
          existingRoutines = {};
        }
      }
      existingRoutines[routineName] = {
        routineTitle: routineName,
        updatedAt: new Date().toISOString(),
        source: 'VYFITH-Real-Multi-AI-Coach',
        applyOptions,
        exercisesCount: exercisesForBridge.length,
        exercises: exercisesForBridge,
      };
      fs.writeFileSync(ROUTINES_FILE, JSON.stringify(existingRoutines, null, 2), 'utf8');

      const applyRes = await applyRoutinePlanToHevyExternal({
        routineTitle: liveRoutine?.title || routineName,
        routineShortId: liveRoutine?.shortId || savedAudit?.routineShortId || known?.routineId,
        routineUuid: liveRoutine?.uuid || savedAudit?.routineId || known?.routineUuid,
        applyOptions,
        exercises: exercisesForBridge,
      });

      return NextResponse.json({
        success: true,
        savedLocally: true,
        ...applyRes,
        sandboxedDesktop: isRunningInSandboxedDesktop(),
        launcherScript: HEVY_LOGIN_LAUNCHER_PATH,
        updatedRoutine: findLiveHevyRoutine(routineName),
        timestamp: new Date().toISOString(),
      });
    }

    // MODO LEGACY (compatibilidad con scripts/pruebas anteriores que envían hevySyncPayload)
    const routineTitle = body?.routineTitle || 'Horizontal Torso (Chest & Back)';
    const hevySyncPayload = body?.hevySyncPayload;
    const prescriptions = body?.prescriptions;

    if (!hevySyncPayload || !Array.isArray(hevySyncPayload)) {
      return NextResponse.json(
        { success: false, error: 'Payload de rutina inválido o faltante' },
        { status: 400 }
      );
    }

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
      sandboxedDesktop: isRunningInSandboxedDesktop(),
      launcherScript: HEVY_LOGIN_LAUNCHER_PATH,
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
