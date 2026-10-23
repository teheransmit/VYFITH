import { NextRequest, NextResponse } from 'next/server';
import {
  initialUnifiedFinanceState,
  normalizeFinanceState,
  UnifiedFinanceState,
  DailyLog,
  SIENNA_WALK_RATE,
  FRIDA_WALK_RATE,
  formatCOP,
} from '@/lib/financeStore';
import {
  readStoredFinanceState,
  writeStoredFinanceState,
} from '@/lib/financeServerStore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET() {
  const state = readStoredFinanceState();
  return NextResponse.json(
    {
      success: true,
      serverTime: new Date().toISOString(),
      data: state,
    },
    { headers: CORS_HEADERS }
  );
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

    // 1. Sincronización completa (action: 'sync' o payload completo de UnifiedFinanceState)
    if (body.action === 'sync' || (body.accounts && body.fixedExpenses && body.tripSettings)) {
      const incomingState: UnifiedFinanceState = body.state || body;
      const saved = writeStoredFinanceState(incomingState);
      return NextResponse.json(
        {
          success: true,
          message: 'Estado financiero sincronizado correctamente con Antigravity.',
          timestamp: saved.lastSynced,
          data: saved,
        },
        { headers: CORS_HEADERS }
      );
    }

    // 2. Registro diario atómico (action: 'daily-log' o campos de paseo/gasto)
    if (
      body.action === 'daily-log' ||
      body.siennaWalk !== undefined ||
      body.fridaWalk !== undefined ||
      body.rappiIncome !== undefined ||
      body.dailyExpense !== undefined
    ) {
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
    }

    // 3. Liquidación semanal de paseos (action: 'settle-walks')
    if (body.action === 'settle-walks' || (body.targetAccountName && !body.addedAmount && !body.debtId)) {
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
    }

    // 4. Registro de abono de Papá (action: 'dad-abono')
    if (body.action === 'dad-abono' || body.addedAmount !== undefined) {
      const addedAmount = Number(body.addedAmount) || 0;
      const targetAccountName = body.targetAccountName ? String(body.targetAccountName) : null;

      let updatedAccounts = current.accounts;
      if (targetAccountName && addedAmount > 0) {
        updatedAccounts = current.accounts.map((acc) => {
          if (acc.name === targetAccountName) {
            return {
              ...acc,
              balance: acc.balance + addedAmount,
            };
          }
          return acc;
        });
      }

      const updatedTrip = {
        ...current.tripSettings,
        dadPaidAmount: current.tripSettings.dadPaidAmount + addedAmount,
      };

      const nextState: UnifiedFinanceState = {
        ...current,
        accounts: updatedAccounts,
        tripSettings: updatedTrip,
      };

      const saved = writeStoredFinanceState(nextState);

      return NextResponse.json(
        {
          success: true,
          message: `Abono de ${formatCOP(addedAmount)} de Papá registrado exitosamente.`,
          data: saved,
        },
        { headers: CORS_HEADERS }
      );
    }

    // 5. Liquidación de deuda por cobrar (action: 'settle-debt')
    if (body.action === 'settle-debt' || body.debtId !== undefined) {
      const debtId = String(body.debtId);
      const targetAccountName = String(body.targetAccountName || 'Efectivo');
      const debt = current.pendingDebts.find((d) => String(d.id) === debtId);

      if (!debt || debt.isPaid) {
        return NextResponse.json(
          { success: false, error: 'Deuda no encontrada o ya liquidada' },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      const dateStr = new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());

      const updatedDebts = current.pendingDebts.map((d) => {
        if (String(d.id) === debtId) {
          return {
            ...d,
            isPaid: true,
            paidDate: dateStr,
            paidToAccount: targetAccountName,
          };
        }
        return d;
      });

      const updatedAccounts = current.accounts.map((acc) => {
        if (acc.name === targetAccountName) {
          return {
            ...acc,
            balance: acc.balance + debt.amount,
          };
        }
        return acc;
      });

      const nextState: UnifiedFinanceState = {
        ...current,
        accounts: updatedAccounts,
        pendingDebts: updatedDebts,
      };

      const saved = writeStoredFinanceState(nextState);

      return NextResponse.json(
        {
          success: true,
          message: `Cobro de ${formatCOP(debt.amount)} a ${debt.debtorName} registrado en ${targetAccountName}.`,
          data: saved,
        },
        { headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Acción no reconocida en el payload' },
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('Error en POST /api/finance:', err);
    return NextResponse.json(
      { success: false, error: `Error del servidor: ${err?.message || err}` },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
