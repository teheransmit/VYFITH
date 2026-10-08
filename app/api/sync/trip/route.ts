import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { initialTravelState, TravelState } from '@/lib/travelStore';

// Memoria en caliente para entornos serverless (Vercel)
let inMemoryState: TravelState = initialTravelState;

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'travel_state.json');

function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Silencioso en entornos con permisos restringidos
  }
}

function readStoredState(): TravelState {
  try {
    ensureDataDirectory();
    if (fs.existsSync(STATE_FILE)) {
      const content = fs.readFileSync(STATE_FILE, 'utf8');
      inMemoryState = JSON.parse(content);
      return inMemoryState;
    }
  } catch (err) {
    console.error('Error leyendo travel_state.json:', err);
  }
  return inMemoryState || initialTravelState;
}

function writeStoredState(state: TravelState): void {
  inMemoryState = state;
  try {
    ensureDataDirectory();
    const payload = JSON.stringify(state, null, 2);
    fs.writeFileSync(STATE_FILE, payload, 'utf8');
  } catch (err) {
    console.error('Error escribiendo travel_state.json (usando in-memory fallback):', err);
  }
}

export async function GET() {
  const state = readStoredState();
  return NextResponse.json({
    success: true,
    data: state,
    serverTime: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const incoming: TravelState = await req.json();
    if (!incoming || typeof incoming !== 'object') {
      return NextResponse.json({ success: false, error: 'Payload inválido' }, { status: 400 });
    }

    const mergedState: TravelState = {
      ...incoming,
      lastSynced: new Date().toISOString(),
    };

    writeStoredState(mergedState);

    const checklistDone = (mergedState.checklist || []).filter(c => c.done).length;
    const checklistTotal = (mergedState.checklist || []).length;
    const totalExpensesCount = (mergedState.expenses || []).length;

    return NextResponse.json({
      success: true,
      message: 'Estado de viaje sincronizado exitosamente con el Cerebro de Antigravity.',
      summary: {
        cashInHand: mergedState.cashInHand,
        nuSavings: mergedState.nuSavings,
        checklistDone,
        checklistTotal,
        totalExpensesCount,
        lastSynced: mergedState.lastSynced,
      },
      data: mergedState,
    });
  } catch (error) {
    console.error('Error en POST /api/sync/trip:', error);
    return NextResponse.json(
      { success: false, error: 'Fallo al sincronizar estado de viaje' },
      { status: 500 }
    );
  }
}
