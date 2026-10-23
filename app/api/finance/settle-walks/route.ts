import { NextRequest, NextResponse } from 'next/server';
import { readStoredFinanceState, writeStoredFinanceState } from '@/lib/financeServerStore';
import { DailyLog, formatCOP, UnifiedFinanceState } from '@/lib/financeStore';

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
    const current = readStoredFinanceState();

    const pending = Number(current.tripSettings.pendingWalksWeekly) || 0;
    const targetAccountName = String(body.targetAccountName || 'Cuenta Nu');

    if (pending <= 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No hay saldo pendiente de paseos por liquidar.',
          settledAmount: 0,
          data: current,
        },
        { headers: CORS_HEADERS }
      );
    }

    const updatedAccounts = current.accounts.map((acc) => {
      if (acc.name === targetAccountName) {
        return {
          ...acc,
          balance: acc.balance + pending,
        };
      }
      return acc;
    });

    const updatedTrip = {
      ...current.tripSettings,
      pendingWalksWeekly: 0,
    };

    const dateStr = new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const settlementLog: DailyLog = {
      id: Date.now(),
      timestamp: Date.now(),
      dateDisplay: dateStr,
      walksIncome: pending,
      siennaWalk: false,
      fridaWalk: false,
      mollyWalk: false,
      rappiIncome: 0,
      dailyExpense: 0,
      netChange: pending,
      targetAccountName,
      note: `Liquidación semanal de paseos cobrados (+${formatCOP(pending)})`,
    };

    const nextState: UnifiedFinanceState = {
      ...current,
      accounts: updatedAccounts,
      tripSettings: updatedTrip,
      dailyLogs: [settlementLog, ...current.dailyLogs],
    };

    const saved = writeStoredFinanceState(nextState);

    return NextResponse.json(
      {
        success: true,
        message: `Liquidación de ${formatCOP(pending)} acreditada a ${targetAccountName}.`,
        settledAmount: pending,
        data: saved,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('Error en POST /api/finance/settle-walks:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error en liquidación de paseos' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
