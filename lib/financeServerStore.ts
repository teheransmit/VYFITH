import * as fs from 'fs';
import * as path from 'path';
import {
  initialUnifiedFinanceState,
  normalizeFinanceState,
  UnifiedFinanceState,
} from '@/lib/financeStore';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'real_finance_state.json');

// Memoria en caliente para Serverless
let inMemoryState: UnifiedFinanceState = { ...initialUnifiedFinanceState };

export function ensureDataDirectory(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Permisos restringidos en entornos aislados
  }
}

export function readStoredFinanceState(): UnifiedFinanceState {
  try {
    ensureDataDirectory();
    if (fs.existsSync(STATE_FILE)) {
      const content = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.accounts)) {
        inMemoryState = normalizeFinanceState(parsed);
        return inMemoryState;
      }
    } else {
      // Si no existe, escribir el estado inicial predeterminado
      writeStoredFinanceState(initialUnifiedFinanceState);
      return initialUnifiedFinanceState;
    }
  } catch (err) {
    console.error('Error leyendo real_finance_state.json:', err);
  }
  return inMemoryState || initialUnifiedFinanceState;
}

export function writeStoredFinanceState(state: UnifiedFinanceState): UnifiedFinanceState {
  const normalized = normalizeFinanceState({
    ...state,
    lastSynced: new Date().toISOString(),
  });
  inMemoryState = normalized;

  try {
    ensureDataDirectory();
    const payload = JSON.stringify(normalized, null, 2);
    fs.writeFileSync(STATE_FILE, payload, 'utf8');
  } catch (err) {
    console.error('Error persistiendo real_finance_state.json (usando in-memory fallback):', err);
  }

  return normalized;
}
