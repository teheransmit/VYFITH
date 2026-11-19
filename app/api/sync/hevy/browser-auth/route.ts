import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import {
  runHevyWebBridgeCommand,
  parseHevyCsvToSessions,
  mergeAndPersistWorkouts,
  readStoredWorkouts,
  fetchHevyPublicWorkoutCount,
} from '@/lib/hevySyncService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const status = await runHevyWebBridgeCommand(['status'], 45000);
  return NextResponse.json({
    success: Boolean(status?.ok),
    authenticated: Boolean(status?.authenticated),
    accountName: status?.accountName || null,
    url: status?.url || null,
    hasProApiKey: Boolean(process.env.HEVY_API_KEY),
    error: status?.error || null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action === 'check' ? 'status' : 'login';

    if (action === 'status') {
      const status = await runHevyWebBridgeCommand(['status'], 45000);
      return NextResponse.json({ success: Boolean(status?.ok), ...status });
    }

    // Lanza navegador Chromium aislado en hevy.com/login usando el perfil dedicado .hevy-chrome-profile
    const loginRes = await runHevyWebBridgeCommand(['login'], 190000);
    if (loginRes?.authenticated) {
      let workouts = readStoredWorkouts();
      let addedCount = 0;
      let updatedCount = 0;

      if (loginRes.csvPath && fs.existsSync(loginRes.csvPath)) {
        const csvText = fs.readFileSync(loginRes.csvPath, 'utf8');
        const parsed = parseHevyCsvToSessions(csvText);
        if (parsed.length > 0) {
          const merged = mergeAndPersistWorkouts(parsed, 'hevy_web_live_export', {
            lastLivePullAt: new Date().toISOString(),
            hevyPlanDetected: 'free',
          });
          workouts = merged.allWorkouts;
          addedCount = merged.addedCount;
          updatedCount = merged.updatedCount;
        }
      }

      const remoteWorkoutCount = await fetchHevyPublicWorkoutCount('teheransmit');
      const pendingRemoteDiff =
        typeof remoteWorkoutCount === 'number' && remoteWorkoutCount > workouts.length
          ? remoteWorkoutCount - workouts.length
          : 0;

      return NextResponse.json({
        success: true,
        authenticated: true,
        accountName: loginRes.accountName || null,
        addedCount,
        updatedCount,
        totalCount: workouts.length,
        remoteWorkoutCount,
        pendingRemoteDiff,
        workouts,
      });
    }

    return NextResponse.json({
      success: false,
      authenticated: false,
      error: loginRes?.error || 'No se completó el inicio de sesión en Hevy Web.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, authenticated: false, error: error.message || 'Error en autenticación web Hevy' },
      { status: 500 }
    );
  }
}
