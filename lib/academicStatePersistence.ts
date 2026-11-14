import fs from 'fs';
import path from 'path';
import {
  AcademicInteractiveOverrides,
  DEFAULT_ACADEMIC_OVERRIDES,
  mergeAcademicOverrides,
} from './academicReactiveEngine';

const STATE_FILE_PATH = path.resolve(process.cwd(), 'data', 'academic_state.json');

export function readAcademicOverridesFromDisk(): AcademicInteractiveOverrides {
  try {
    if (!fs.existsSync(STATE_FILE_PATH)) {
      return DEFAULT_ACADEMIC_OVERRIDES;
    }
    const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AcademicInteractiveOverrides>;
    return mergeAcademicOverrides(parsed);
  } catch {
    return DEFAULT_ACADEMIC_OVERRIDES;
  }
}

export function writeAcademicOverridesToDisk(
  incoming: Partial<AcademicInteractiveOverrides>
): {
  overrides: AcademicInteractiveOverrides;
  persistedToDisk: boolean;
  warning?: string;
} {
  const merged = mergeAcademicOverrides({
    ...incoming,
    updatedAt: incoming.updatedAt || new Date().toISOString(),
  });

  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    return { overrides: merged, persistedToDisk: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error escribiendo data/academic_state.json';
    return {
      overrides: merged,
      persistedToDisk: false,
      warning: `Entorno solo lectura (${msg}): estado mantenido en sesión local.`,
    };
  }
}
