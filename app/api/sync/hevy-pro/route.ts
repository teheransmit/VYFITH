import { NextRequest, NextResponse } from 'next/server';
import { processHevyProAnalytics } from '@/lib/hevyProEngine';
import fs from 'fs';
import path from 'path';

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

function loadHevySessions() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'real_hevy_workouts.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error loading real_hevy_workouts.json:', err);
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodParam = (searchParams.get('period') || '7d') as '7d' | '30d' | '90d' | '1y';
    const period = ['7d', '30d', '90d', '1y'].includes(periodParam) ? periodParam : '7d';

    const sessions = loadHevySessions();
    const analytics = processHevyProAnalytics(sessions, period);

    return NextResponse.json(
      {
        success: true,
        totalSessionsLoaded: sessions.length,
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
    const filePath = path.join(process.cwd(), 'data', 'real_hevy_workouts.json');
    const sessions = loadHevySessions();

    if (body.session) {
      sessions.unshift(body.session);
    } else if (Array.isArray(body.sessions)) {
      sessions.unshift(...body.sessions);
    }

    fs.writeFileSync(filePath, JSON.stringify(sessions, null, 2), 'utf8');

    const analytics = processHevyProAnalytics(sessions, '7d');

    return NextResponse.json(
      {
        success: true,
        message: 'Entrenamiento Hevy sincronizado exitosamente en el motor PRO',
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
