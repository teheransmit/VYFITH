import { BodyMeasurementEntry, calculateUsNavyBodyFatMen, calculateLeanBodyMass, kgToLbs } from './hevyProEngine';
import fs from 'fs';
import path from 'path';

export const INITIAL_BODY_MEASUREMENTS: BodyMeasurementEntry[] = [
  {
    id: 'meas-2026-10-01',
    date: '2026-10-01',
    timestamp: '2026-10-01T07:15:00Z',
    weightKg: 54.8,
    weightLbs: kgToLbs(54.8),
    waistCm: 72.0,
    neckCm: 36.0,
    heightCm: 172.0,
    bodyFatPct: 11.2,
    leanBodyMassKg: 48.7,
    leanBodyMassLbs: kgToLbs(48.7),
    shouldersCm: 108.5,
    chestCm: 91.0,
    bicepsLeftCm: 30.0,
    bicepsRightCm: 30.2,
    forearmLeftCm: 25.5,
    forearmRightCm: 26.0,
    abdomenCm: 73.0,
    hipsCm: 87.5,
    thighLeftCm: 48.5,
    thighRightCm: 49.0,
    calfLeftCm: 33.0,
    calfRightCm: 33.5,
    notes: 'Inicio de fase de volumen limpio (Ectomorfo UPB).',
  },
  {
    id: 'meas-2026-10-20',
    date: '2026-10-20',
    timestamp: '2026-10-20T07:30:00Z',
    weightKg: 55.2,
    weightLbs: kgToLbs(55.2),
    waistCm: 71.5,
    neckCm: 36.2,
    heightCm: 172.0,
    bodyFatPct: 10.9,
    leanBodyMassKg: 49.2,
    leanBodyMassLbs: kgToLbs(49.2),
    shouldersCm: 109.2,
    chestCm: 92.0,
    bicepsLeftCm: 30.2,
    bicepsRightCm: 30.6,
    forearmLeftCm: 25.8,
    forearmRightCm: 26.2,
    abdomenCm: 72.5,
    hipsCm: 88.0,
    thighLeftCm: 49.0,
    thighRightCm: 49.5,
    calfLeftCm: 33.2,
    calfRightCm: 33.8,
    notes: 'Excelente adherencia a la sobrecarga progresiva en Hevy.',
  },
  {
    id: 'meas-2026-11-11',
    date: '2026-11-11',
    timestamp: '2026-11-11T07:00:00Z',
    weightKg: 55.7,
    weightLbs: kgToLbs(55.7),
    waistCm: 71.0,
    neckCm: 36.5,
    heightCm: 172.0,
    bodyFatPct: 10.6,
    leanBodyMassKg: 49.8,
    leanBodyMassLbs: kgToLbs(49.8),
    shouldersCm: 110.0,
    chestCm: 92.5,
    bicepsLeftCm: 30.5,
    bicepsRightCm: 31.0,
    forearmLeftCm: 26.0,
    forearmRightCm: 26.5,
    abdomenCm: 72.0,
    hipsCm: 88.0,
    thighLeftCm: 49.5,
    thighRightCm: 50.0,
    calfLeftCm: 33.5,
    calfRightCm: 34.0,
    notes: 'Medición oficial actual: Densidad muscular óptima y menor grasa abdominal.',
  },
];

const MEASUREMENTS_FILE = path.join(process.cwd(), 'data', 'real_body_measurements.json');

export function getBodyMeasurements(): BodyMeasurementEntry[] {
  try {
    if (fs.existsSync(MEASUREMENTS_FILE)) {
      const raw = fs.readFileSync(MEASUREMENTS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading body measurements from disk:', e);
  }
  return INITIAL_BODY_MEASUREMENTS;
}

export function saveBodyMeasurement(entry: Partial<BodyMeasurementEntry>): BodyMeasurementEntry {
  const current = getBodyMeasurements();
  const dateStr = entry.date || new Date().toISOString().slice(0, 10);
  const weightKg = Number(entry.weightKg || 55.7);
  const waistCm = Number(entry.waistCm || entry.abdomenCm || 71.0);
  const neckCm = Number(entry.neckCm || 36.5);
  const heightCm = Number(entry.heightCm || 172.0);

  // Autocálculo de grasa corporal si no viene especificada
  const calculatedBf = entry.bodyFatPct !== undefined && entry.bodyFatPct > 0
    ? entry.bodyFatPct
    : calculateUsNavyBodyFatMen(waistCm, neckCm, heightCm);

  const { lbmKg, lbmLbs } = calculateLeanBodyMass(weightKg, calculatedBf);

  const newEntry: BodyMeasurementEntry = {
    id: entry.id || `meas-${dateStr}-${Date.now()}`,
    date: dateStr,
    timestamp: new Date().toISOString(),
    photoUrl: entry.photoUrl,
    notes: entry.notes || '',
    weightKg,
    weightLbs: kgToLbs(weightKg),
    waistCm,
    neckCm,
    heightCm,
    bodyFatPct: calculatedBf,
    leanBodyMassKg: lbmKg,
    leanBodyMassLbs: lbmLbs,
    shouldersCm: entry.shouldersCm ? Number(entry.shouldersCm) : undefined,
    chestCm: entry.chestCm ? Number(entry.chestCm) : undefined,
    bicepsLeftCm: entry.bicepsLeftCm ? Number(entry.bicepsLeftCm) : undefined,
    bicepsRightCm: entry.bicepsRightCm ? Number(entry.bicepsRightCm) : undefined,
    forearmLeftCm: entry.forearmLeftCm ? Number(entry.forearmLeftCm) : undefined,
    forearmRightCm: entry.forearmRightCm ? Number(entry.forearmRightCm) : undefined,
    abdomenCm: entry.abdomenCm ? Number(entry.abdomenCm) : undefined,
    hipsCm: entry.hipsCm ? Number(entry.hipsCm) : undefined,
    thighLeftCm: entry.thighLeftCm ? Number(entry.thighLeftCm) : undefined,
    thighRightCm: entry.thighRightCm ? Number(entry.thighRightCm) : undefined,
    calfLeftCm: entry.calfLeftCm ? Number(entry.calfLeftCm) : undefined,
    calfRightCm: entry.calfRightCm ? Number(entry.calfRightCm) : undefined,
  };

  // Reemplazar si ya existe para la misma fecha o agregar al final
  const existingIdx = current.findIndex((m) => m.date === dateStr);
  if (existingIdx >= 0) {
    current[existingIdx] = newEntry;
  } else {
    current.push(newEntry);
  }

  // Ordenar cronológicamente
  current.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  try {
    fs.writeFileSync(MEASUREMENTS_FILE, JSON.stringify(current, null, 2), 'utf8');
  } catch (e) {
    console.error('Error persisting body measurements to disk:', e);
  }

  return newEntry;
}
