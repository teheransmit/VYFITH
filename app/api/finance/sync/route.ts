import { NextRequest, NextResponse } from 'next/server';
import { writeStoredFinanceState } from '@/lib/financeServerStore';
import { UnifiedFinanceState } from '@/lib/financeStore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Payload de sincronización inválido' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const stateToSave: UnifiedFinanceState = body.state || body;
    const saved = writeStoredFinanceState(stateToSave);

    return NextResponse.json(
      {
        success: true,
        message: 'Estado financiero sincronizado correctamente con Antigravity.',
        timestamp: saved.lastSynced,
        data: saved,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('Error en POST /api/finance/sync:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error de sincronización' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
