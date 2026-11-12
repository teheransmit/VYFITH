import { NextRequest, NextResponse } from 'next/server';
import { runHevyWebBridgeCommand } from '@/lib/hevySyncService';

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

    // Lanza Google Chrome visible en hevy.com/login usando el perfil dedicado .hevy-chrome-profile
    const loginRes = await runHevyWebBridgeCommand(['login'], 190000);
    return NextResponse.json({
      success: Boolean(loginRes?.authenticated),
      ...loginRes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, authenticated: false, error: error.message || 'Error en autenticación web Hevy' },
      { status: 500 }
    );
  }
}
