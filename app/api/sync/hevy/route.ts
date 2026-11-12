import { NextRequest, NextResponse } from 'next/server';
import {
  syncAllWorkoutsReal,
  parseHevyCsvToSessions,
  normalizeHevyApiWorkout,
  mergeAndPersistWorkouts,
} from '@/lib/hevySyncService';
import { generateAiCoachPrescription } from '@/lib/aiCoachPeriodizationEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey') || process.env.HEVY_API_KEY || undefined;
    const liveBrowser = searchParams.get('live') === '1' || searchParams.get('refresh') === '1';

    const syncResult = await syncAllWorkoutsReal({ apiKey, liveBrowser });

    return NextResponse.json({
      success: true,
      sourceUsed: syncResult.sourceUsed,
      addedCount: syncResult.addedCount,
      updatedCount: syncResult.updatedCount,
      requiresBrowserAuth: syncResult.requiresBrowserAuth,
      hasProApiKey: syncResult.hasProApiKey,
      browserBridgeAuthenticated: syncResult.browserBridgeAuthenticated,
      warning: syncResult.warning,
      syncMeta: syncResult.syncMeta,
      count: syncResult.workouts.length,
      workouts: syncResult.workouts,
    });
  } catch (error: any) {
    console.error('[HEVY GET ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al sincronizar Hevy' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body?.action === 'sync_live') {
      const syncResult = await syncAllWorkoutsReal({
        apiKey: body.apiKey || process.env.HEVY_API_KEY,
        liveBrowser: true,
      });
      return NextResponse.json({
        success: !syncResult.requiresBrowserAuth,
        ...syncResult,
        count: syncResult.workouts.length,
      });
    }

    if (body?.csvContent && typeof body.csvContent === 'string') {
      const parsed = parseHevyCsvToSessions(body.csvContent);
      if (parsed.length === 0) {
        return NextResponse.json(
          { success: false, error: 'El archivo CSV no contiene filas válidas de Hevy.' },
          { status: 400 }
        );
      }

      const merged = mergeAndPersistWorkouts(parsed, 'csv_manual_upload', {
        hevyPlanDetected: process.env.HEVY_API_KEY ? 'pro' : 'free',
      });

      const latestName = merged.allWorkouts[0]?.name || 'Horizontal Torso (Chest & Back)';
      const newCoachPrescription = generateAiCoachPrescription(latestName, {
        workouts: merged.allWorkouts,
      });

      return NextResponse.json({
        success: true,
        source: 'csv_manual_upload',
        importedCount: parsed.length,
        addedCount: merged.addedCount,
        updatedCount: merged.updatedCount,
        totalCount: merged.allWorkouts.length,
        workouts: merged.allWorkouts,
        syncMeta: { lastSource: 'csv_manual_upload', totalWorkouts: merged.allWorkouts.length },
        aiCoachReevaluated: true,
        newCoachPrescription,
        message: `Se procesaron ${parsed.length} sesiones (${merged.addedCount} nuevas agregadas, ${merged.allWorkouts.length} totales).`,
      });
    }

    // Webhook de Hevy PRO o POST JSON de entrenamiento individual
    const incomingRaw = body?.payload?.workout || body?.workout || (body?.title || body?.name ? body : null);
    if (incomingRaw) {
      const normalized = normalizeHevyApiWorkout(incomingRaw);
      const merged = mergeAndPersistWorkouts([normalized], 'hevy_webhook_json', {
        lastLivePullAt: new Date().toISOString(),
      });
      const newCoachPrescription = generateAiCoachPrescription(normalized.name, {
        workouts: merged.allWorkouts,
      });

      return NextResponse.json({
        success: true,
        source: 'hevy_webhook_json',
        addedCount: merged.addedCount,
        updatedCount: merged.updatedCount,
        totalCount: merged.allWorkouts.length,
        session: normalized,
        workouts: merged.allWorkouts,
        aiCoachReevaluated: true,
        newCoachPrescription,
        message: `Entrenamiento '${normalized.name}' ingerido y deduplicado automáticamente.`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Se esperaba csvContent, workout (webhook) o action: "sync_live".' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[HEVY POST ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar carga de Hevy' },
      { status: 500 }
    );
  }
}
