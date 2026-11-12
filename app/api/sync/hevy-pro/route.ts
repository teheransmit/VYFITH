import { NextRequest, NextResponse } from 'next/server';
import { processHevyProAnalytics } from '@/lib/hevyProEngine';
import {
  readStoredWorkouts,
  scanDropFoldersAndSync,
  mergeAndPersistWorkouts,
  normalizeHevyApiWorkout,
} from '@/lib/hevySyncService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodParam = (searchParams.get('period') || '7d') as '7d' | '30d' | '90d' | '1y';
    const period = ['7d', '30d', '90d', '1y'].includes(periodParam) ? periodParam : '7d';

    const scanned = scanDropFoldersAndSync();
    const sessions = scanned.allWorkouts.length > 0 ? scanned.allWorkouts : readStoredWorkouts();
    const analytics = processHevyProAnalytics(sessions, period);

    return NextResponse.json(
      {
        success: true,
        totalSessionsLoaded: sessions.length,
        latestWorkoutDate: sessions[0]?.date || null,
        latestWorkoutName: sessions[0]?.name || null,
        analytics,
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing Hevy PRO analytics' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawList = body.session ? [body.session] : Array.isArray(body.sessions) ? body.sessions : [];
    const normalized = rawList.map((item: any) =>
      item.totalVolumeKg !== undefined && Array.isArray(item.exercises) ? item : normalizeHevyApiWorkout(item)
    );
    const merged = mergeAndPersistWorkouts(normalized, 'hevy_pro_post');
    const analytics = processHevyProAnalytics(merged.allWorkouts, '7d');

    return NextResponse.json(
      {
        success: true,
        addedCount: merged.addedCount,
        totalSessionsLoaded: merged.allWorkouts.length,
        message: 'Entrenamientos deduplicados y procesados en Hevy PRO.',
        analytics,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error saving Hevy workout session' },
      { status: 500, headers: corsHeaders }
    );
  }
}
