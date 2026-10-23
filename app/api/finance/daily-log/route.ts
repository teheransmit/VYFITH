import { NextRequest, NextResponse } from 'next/server';
import { readStoredFinanceState, writeStoredFinanceState } from '@/lib/financeServerStore';
import {
  DailyLog,
  SIENNA_WALK_RATE,
  FRIDA_WALK_RATE,
  formatCOP,
  UnifiedFinanceState,
} from '@/lib/financeStore';

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
        { success: false, error: 'Payload inválido' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const current = readStoredFinanceState();

    const siennaWalk = Boolean(body.siennaWalk);
    const fridaWalk = Boolean(body.fridaWalk);
    const fridaRate = Number(body.fridaRate) || FRIDA_WALK_RATE;
    const walksSum = (siennaWalk ? SIENNA_WALK_RATE : 0) + (fridaWalk ? fridaRate : 0);

    const rappiIncome = Number(body.rappiIncome) || 0;
    const dailyExpense = Number(body.dailyExpense) || 0;
    const immediateNetChange = rappiIncome - dailyExpense;

    const targetAccountName = String(body.targetAccountName || 'Nequi');
    const note = String(body.note || '').trim();

    // Actualizar cuenta líquida destino
    const updatedAccounts = current.accounts.map((acc) => {
      if (acc.name === targetAccountName) {
        return {
          ...acc,
          balance: acc.balance + immediateNetChange,
        };
      }
      return acc;
    });

    // Acumular paseos en cartera semanal
    const updatedTrip = {
      ...current.tripSettings,
      pendingWalksWeekly: (current.tripSettings.pendingWalksWeekly || 0) + walksSum,
    };

    const dateStr =
      body.dateDisplay ||
      new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());

    const newLog: DailyLog = {
      id: Date.now(),
      timestamp: Date.now(),
      dateDisplay: dateStr,
      walksIncome: walksSum,
      siennaWalk,
      fridaWalk,
      mollyWalk: false,
      rappiIncome,
      dailyExpense,
      netChange: immediateNetChange,
      targetAccountName,
      note:
        walksSum > 0
          ? note
            ? `${note} (Paseos por cobrar: +${formatCOP(walksSum)})`
            : `Paseos por cobrar: +${formatCOP(walksSum)}`
          : note,
    };

    const nextState: UnifiedFinanceState = {
      ...current,
      accounts: updatedAccounts,
      tripSettings: updatedTrip,
      dailyLogs: [newLog, ...current.dailyLogs],
    };

    const saved = writeStoredFinanceState(nextState);

    return NextResponse.json(
      {
        success: true,
        message: 'Registro diario guardado exitosamente.',
        walksSum,
        immediateNetChange,
        data: saved,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('Error en POST /api/finance/daily-log:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error guardando registro diario' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
