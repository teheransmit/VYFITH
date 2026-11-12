import { NextRequest, NextResponse } from 'next/server';
import { getWaterState, applyWaterPayload, todayStr } from '@/lib/waterStore';

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

export async function GET() {
  try {
    const state = getWaterState();
    const today = todayStr();
    const days = Object.values(state.days).sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json(
      {
        success: true,
        goalMl: state.goalMl,
        today: state.days[today] || { date: today, totalMl: 0, goalMl: state.goalMl, entries: [], lastUpdated: null },
        history: days.slice(-30),
        lastSync: state.lastSync,
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Error leyendo agua' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hasData =
      typeof body.totalMl === 'number' ||
      typeof body.deltaMl === 'number' ||
      Array.isArray(body.entries) ||
      typeof body.goalMl === 'number';
    if (!hasData) {
      return NextResponse.json(
        { success: false, error: 'Envía totalMl, deltaMl, entries o goalMl' },
        { status: 400, headers: corsHeaders }
      );
    }
    const day = applyWaterPayload(body);
    return NextResponse.json({ success: true, message: 'Hidratación sincronizada', data: day }, { headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Error guardando agua' }, { status: 500, headers: corsHeaders });
  }
}
