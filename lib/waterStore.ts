import fs from 'fs';
import path from 'path';
import { getDailyNutritionState, saveDailyNutritionState } from './nutritionStore';

export interface WaterEntry {
  id: string;
  ml: number;
  time: string; // ISO
}

export interface WaterDay {
  date: string; // YYYY-MM-DD
  totalMl: number;
  goalMl: number;
  entries: WaterEntry[];
  lastUpdated: string;
}

export interface WaterState {
  goalMl: number;
  days: Record<string, WaterDay>;
  lastSync: string | null;
}

const WATER_FILE = path.join(process.cwd(), 'data', 'real_water_log.json');
export const DEFAULT_WATER_GOAL_ML = 3000;

export function todayStr(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

export function getWaterState(): WaterState {
  try {
    if (fs.existsSync(WATER_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(WATER_FILE, 'utf8'));
      if (parsed && parsed.days) return parsed;
    }
  } catch (e) {
    console.error('Error loading water log:', e);
  }
  return { goalMl: DEFAULT_WATER_GOAL_ML, days: {}, lastSync: null };
}

function persist(state: WaterState): WaterState {
  state.lastSync = new Date().toISOString();
  try {
    fs.mkdirSync(path.dirname(WATER_FILE), { recursive: true });
    fs.writeFileSync(WATER_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('Error persisting water log:', e);
  }
  return state;
}

/** Mantiene el HUD de hidratación de Nutrición alineado con el día de hoy. */
function mirrorToNutrition(day: WaterDay) {
  if (day.date !== todayStr()) return;
  try {
    const n = getDailyNutritionState();
    n.current.waterMl = day.totalMl;
    n.targets.targetWaterMl = day.goalMl;
    saveDailyNutritionState(n);
  } catch (e) {
    console.error('Error mirroring water to nutrition:', e);
  }
}

export interface WaterPayload {
  date?: string;
  totalMl?: number; // snapshot: total del día
  deltaMl?: number; // incremento (puede ser negativo)
  goalMl?: number;
  entries?: { id?: string; ml: number; time?: string }[]; // registros individuales del día
}

export function applyWaterPayload(p: WaterPayload): WaterDay {
  const state = getWaterState();
  const date = p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : todayStr();
  if (p.goalMl && p.goalMl > 0) state.goalMl = Math.round(p.goalMl);

  const day: WaterDay = state.days[date] || {
    date,
    totalMl: 0,
    goalMl: state.goalMl,
    entries: [],
    lastUpdated: new Date().toISOString(),
  };
  day.goalMl = state.goalMl;

  if (Array.isArray(p.entries)) {
    day.entries = p.entries
      .filter((e) => Number(e.ml) > 0)
      .map((e, i) => ({
        id: e.id || `w-${date}-${i}-${Date.now()}`,
        ml: Math.round(Number(e.ml)),
        time: e.time || new Date().toISOString(),
      }));
    day.totalMl = day.entries.reduce((a, e) => a + e.ml, 0);
  }

  if (typeof p.totalMl === 'number' && p.totalMl >= 0) {
    day.totalMl = Math.round(p.totalMl);
  } else if (typeof p.deltaMl === 'number' && p.deltaMl !== 0) {
    day.totalMl = Math.max(0, day.totalMl + Math.round(p.deltaMl));
    if (p.deltaMl > 0) {
      day.entries.push({ id: `w-${Date.now()}`, ml: Math.round(p.deltaMl), time: new Date().toISOString() });
    }
  }

  day.lastUpdated = new Date().toISOString();
  state.days[date] = day;
  persist(state);
  mirrorToNutrition(day);
  return day;
}
