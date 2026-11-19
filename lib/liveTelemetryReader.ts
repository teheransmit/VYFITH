import fs from 'fs';
import path from 'path';
import { LiveTelemetrySnapshot } from '@/lib/santiagoKnowledgeBase';
import { computeAcademicProjection } from '@/lib/academicReactiveEngine';
import { readAcademicOverridesFromDisk } from '@/lib/academicStatePersistence';
import {
  CalendarEvent,
  computeWalksIncomeFromCalendar,
} from '@/lib/googleCalendar';
import { resolveConfiguredAiKeys } from '@/lib/multiAiRouter';

/**
 * Lee directamente los 3 archivos centrales del cerebro de Obsidian en MegaProyecto/
 */
export function readMegaProyectoNotes(): string {
  const cwd = process.cwd();
  const candidateDirs = [
    path.resolve(cwd, '..', 'MegaProyecto'),
    'G:\\Mi unidad\\Proyecto personal\\MegaProyecto',
    path.resolve(cwd, 'MegaProyecto'),
  ];

  let megaDir = '';
  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      megaDir = dir;
      break;
    }
  }

  if (!megaDir) {
    return '';
  }

  const files = [
    '00_Antigravity_Cerebro_Proyecto_Personal.md',
    '01_Simulador_Paseos_y_Rutinas_UPB.md',
    '02_Bitacora_Automejora_y_Enlace_Cognitivo.md',
  ];

  let combined = '';
  for (const file of files) {
    const fullPath = path.join(megaDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8').trim();
        const sliced =
          file === '02_Bitacora_Automejora_y_Enlace_Cognitivo.md'
            ? content.slice(-4500)
            : file === '00_Antigravity_Cerebro_Proyecto_Personal.md'
            ? content.slice(0, 12000)
            : content.slice(0, 6000);
        combined += `\n\n--- NODO OBSIDIAN MEGAPROYECTO: ${file} ---\n${sliced}\n`;
      } catch (err) {
        console.warn(`[TelemetryReader] Error leyendo nodo ${file}:`, err);
      }
    }
  }

  return combined;
}

function getBogotaIsoDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value || '2026';
  const m = parts.find((p) => p.type === 'month')?.value || '11';
  const day = parts.find((p) => p.type === 'day')?.value || '18';
  return `${y}-${m}-${day}`;
}

function readJsonSafe<T = unknown>(
  filePath: string
): { ok: boolean; data: T | null; error?: string } {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, data: null, error: 'Archivo no encontrado' };
    }
    const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
    const data = JSON.parse(raw) as T;
    return { ok: true, data };
  } catch (err: unknown) {
    return {
      ok: false,
      data: null,
      error: (err as Error)?.message || 'JSON inválido',
    };
  }
}

export interface FullEcosystemTelemetry {
  timestamp: string;
  bogotaTimeLabel: string;
  snapshot: LiveTelemetrySnapshot;
  healthDetailed: {
    steps: number;
    sleepHours: number;
    sleepEfficiencyPct: number;
    restingHeartRate: number;
    spo2: number;
    stressScore: number;
    readinessScore: number;
    weightKg: number;
    bodyFatPct: number;
    skeletalMuscleKg: number;
    bmi: number;
    waterL: number;
    targetWeightKg: number;
  };
  hevyDetailed: {
    totalWorkouts: number;
    lastWorkoutName: string;
    totalVolumeKg: number;
    date: string;
    setsCompleted: number;
  };
  financeDetailed: {
    efectivo: number;
    nequi: number;
    cuentaNu: number;
    totalLiquid: number;
    fridaPendingTransferToNu: number;
    receivablesTotal: number;
    richardDebt: number;
    mabaDebt: number;
    yessidRemaining: number;
    yessidPaid: number;
    danielaDebt: number;
    gymPaid: boolean;
    lauraPaid: boolean;
  };
  calendarDetailed: {
    totalEventsCount: number;
    todayEvents: Array<{ summary: string; start: string; end: string; rsvp?: string }>;
    tomorrowEvents: Array<{ summary: string; start: string; end: string; rsvp?: string }>;
    weeklyConfirmedIncome: number;
    weeklyConfirmedCount: number;
    weeklyUnconfirmedIncome: number;
    weeklyUnconfirmedCount: number;
    weeklyDeclinedCount: number;
    monthlyConfirmedIncome: number;
    todayGymSession: string | null;
  };
  systemAudit: {
    healthOk: boolean;
    hevyOk: boolean;
    calendarOk: boolean;
    financeOk: boolean;
    academicOk: boolean;
    errorCount: number;
    errors: string[];
    geminiReady: boolean;
    nvidiaReady: boolean;
    groqReady: boolean;
  };
}

/**
 * Recopila toda la telemetría viva verificada de data/*.json para el Pulso Cognitivo y Bio-Assistant.
 */
export function gatherFullEcosystemTelemetry(): FullEcosystemTelemetry {
  const cwd = process.cwd();
  const auditErrors: string[] = [];

  // 1. Salud y Femmto
  const healthRes = readJsonSafe<Record<string, any>>(
    path.join(cwd, 'data', 'real_health_state.json')
  );
  if (!healthRes.ok) {
    auditErrors.push(`real_health_state.json: ${healthRes.error}`);
  }
  const metrics = healthRes.data?.currentMetrics || {};
  const room = healthRes.data?.vyfithData?.roomMetrics || {};
  const healthDetailed = {
    steps: Number(metrics.steps ?? room.steps ?? 2354),
    sleepHours: Number(metrics.sleepHours ?? room.totalSleepHours ?? 10.2),
    sleepEfficiencyPct: 94,
    restingHeartRate: Number(metrics.heartRate ?? room.restingHeartRate ?? 62),
    spo2: Number(room.spo2 ?? 96.7),
    stressScore: 20,
    readinessScore: Number(healthRes.data?.vyfithData?.readinessScore ?? 67),
    weightKg: Number(metrics.weightKg ?? 55.7),
    bodyFatPct: Number(metrics.bodyFatPct ?? 10.6),
    skeletalMuscleKg: Number(metrics.skeletalMuscleKg ?? 25.1),
    bmi: Number(metrics.bmi ?? 18.8),
    waterL: Number(metrics.waterL ?? 32.8),
    targetWeightKg: 60,
  };

  // 2. Hevy Workouts & Meta
  const hevyRes = readJsonSafe<Array<Record<string, any>>>(
    path.join(cwd, 'data', 'real_hevy_workouts.json')
  );
  const hevyMetaRes = readJsonSafe<Record<string, any>>(
    path.join(cwd, 'data', 'hevy_sync_meta.json')
  );
  if (!hevyRes.ok) {
    auditErrors.push(`real_hevy_workouts.json: ${hevyRes.error}`);
  }
  const workoutsList = Array.isArray(hevyRes.data) ? hevyRes.data : [];
  const lastWorkout = workoutsList[0] || {};
  const hevyDetailed = {
    totalWorkouts: Number(
      workoutsList.length || hevyMetaRes.data?.totalWorkouts || 204
    ),
    lastWorkoutName: String(
      lastWorkout.name ??
        lastWorkout.title ??
        hevyMetaRes.data?.latestWorkoutName ??
        hevyMetaRes.data?.lastWorkoutName ??
        'Horizontal Torso (Chest & Back)'
    ),
    totalVolumeKg: Number(
      lastWorkout.totalVolumeKg ?? hevyMetaRes.data?.totalVolumeKg ?? 5940
    ),
    date: String(
      lastWorkout.date ??
        hevyMetaRes.data?.latestWorkoutDate ??
        hevyMetaRes.data?.lastWorkoutDate ??
        '17 nov 2026, 17:11'
    ),
    setsCompleted: Number(lastWorkout.setsCompleted ?? 24),
  };

  // 3. Finanzas Reales (Nequi, Nu, Efectivo, Cobros, Yessid)
  const finRes = readJsonSafe<Record<string, any>>(
    path.join(cwd, 'data', 'real_finance_state.json')
  );
  if (!finRes.ok) {
    auditErrors.push(`real_finance_state.json: ${finRes.error}`);
  }
  const fin = finRes.data || {};
  const accounts: Array<{ name?: string; balance?: number; type?: string }> =
    Array.isArray(fin.accounts) ? fin.accounts : [];
  const fixedExpenses: Array<{ title?: string; amount?: number; isPaid?: boolean }> =
    Array.isArray(fin.fixedExpenses) ? fin.fixedExpenses : [];
  const pendingDebts: Array<{ debtorName?: string; amount?: number; isPaid?: boolean }> =
    Array.isArray(fin.pendingDebts) ? fin.pendingDebts : [];

  const getAcc = (type: string, match: string, fallback: number) => {
    const found = accounts.find(
      (a) => a.type === type || (a.name || '').toLowerCase().includes(match)
    );
    return found ? Number(found.balance ?? 0) : fallback;
  };

  const efectivo = getAcc('CASH', 'efectivo', 0);
  const cuentaNu = getAcc('NU', 'nu', 0);
  const nequi = getAcc('NEQUI', 'nequi', 45724.27);

  const richardEntry = pendingDebts.find((d) =>
    (d.debtorName || '').toLowerCase().includes('richard')
  );
  const mabaEntry = pendingDebts.find((d) =>
    (d.debtorName || '').toLowerCase().includes('maba')
  );
  const lauraEntry = pendingDebts.find((d) =>
    (d.debtorName || '').toLowerCase().includes('laura')
  );
  const yessidEntry = fixedExpenses.find((f) =>
    (f.title || '').toLowerCase().includes('yessid')
  );
  const danielaEntry = fixedExpenses.find((f) =>
    (f.title || '').toLowerCase().includes('daniela')
  );
  const gymEntry = fixedExpenses.find((f) =>
    (f.title || '').toLowerCase().includes('gimnasio')
  );

  const receivablesTotal = pendingDebts
    .filter((d) => !d.isPaid)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const yessidRemaining = Number(yessidEntry?.amount ?? 519000);
  const financeDetailed = {
    efectivo,
    nequi,
    cuentaNu,
    totalLiquid: Number((efectivo + nequi + cuentaNu).toFixed(2)),
    fridaPendingTransferToNu: cuentaNu === 0 && nequi >= 25000 ? 25000 : 0,
    receivablesTotal,
    richardDebt: richardEntry && !richardEntry.isPaid ? Number(richardEntry.amount) : 0,
    mabaDebt: mabaEntry && !mabaEntry.isPaid ? Number(mabaEntry.amount) : 0,
    yessidRemaining,
    yessidPaid: Math.max(0, 580000 - yessidRemaining),
    danielaDebt: danielaEntry && !danielaEntry.isPaid ? Number(danielaEntry.amount) : 0,
    gymPaid: Boolean(gymEntry?.isPaid ?? true),
    lauraPaid: Boolean(lauraEntry?.isPaid ?? true),
  };

  // 4. Google Calendar & Paseos (Auto-Invite RSVP)
  const calRes = readJsonSafe<CalendarEvent[] | Record<string, any>>(
    path.join(cwd, 'data', 'real_calendar_events.json')
  );
  if (!calRes.ok) {
    auditErrors.push(`real_calendar_events.json: ${calRes.error}`);
  }
  const calendarEvents: CalendarEvent[] = Array.isArray(calRes.data) ? calRes.data : [];
  const todayIso = getBogotaIsoDate(0);
  const tomorrowIso = getBogotaIsoDate(1);

  const extractDayEvents = (targetIso: string) =>
    calendarEvents
      .filter((e) => {
        const dt = e.start?.dateTime || e.start?.date || '';
        return dt.startsWith(targetIso) && e.status !== 'cancelled';
      })
      .map((e) => {
        const startRaw = e.start?.dateTime || e.start?.date || '';
        const endRaw = e.end?.dateTime || e.end?.date || '';
        const selfAtt = e.attendees?.find(
          (a) => a.self || a.email?.toLowerCase() === 'santiagosmitttt@gmail.com'
        );
        return {
          summary: e.summary || 'Evento',
          start: startRaw.includes('T') ? startRaw.slice(11, 16) : 'Todo el día',
          end: endRaw.includes('T') ? endRaw.slice(11, 16) : '',
          rsvp: selfAtt?.responseStatus || 'solid',
        };
      });

  const todayEvents = extractDayEvents(todayIso);
  const tomorrowEvents = extractDayEvents(tomorrowIso);

  const walksSummary = computeWalksIncomeFromCalendar(calendarEvents, {
    fridaRate: 5000,
    siennaRate: 9000,
  });
  const gymKeywords = ['torso', 'legs', 'arms', 'shoulders', 'push', 'pull', 'gym'];
  const todayGym =
    todayEvents.find((ev) =>
      gymKeywords.some((k) => ev.summary.toLowerCase().includes(k))
    ) || null;

  const calendarDetailed = {
    totalEventsCount: calendarEvents.length,
    todayEvents,
    tomorrowEvents,
    weeklyConfirmedIncome: walksSummary.weeklyConfirmedIncome,
    weeklyConfirmedCount: walksSummary.weeklyConfirmedCount,
    weeklyUnconfirmedIncome: walksSummary.weeklyUnconfirmedIncome,
    weeklyUnconfirmedCount: walksSummary.weeklyUnconfirmedCount,
    weeklyDeclinedCount: walksSummary.weeklyDeclinedCount,
    monthlyConfirmedIncome: walksSummary.monthlyConfirmedIncome,
    todayGymSession: todayGym ? `${todayGym.summary} (${todayGym.start})` : null,
  };

  // 5. Academia SIGAA
  let academicOk = true;
  let academicSnapshot: LiveTelemetrySnapshot['academic'];
  try {
    const academicOverrides = readAcademicOverridesFromDisk();
    const projection = computeAcademicProjection(academicOverrides);
    const cMap = projection.projectedCourseMap;
    academicSnapshot = {
      pga: 3.93,
      viasAcum: cMap['c-vias'].accumulatedPoints,
      presupuestoAcum: cMap['c-presupuesto'].accumulatedPoints,
      suelosAcum: cMap['c-suelos'].accumulatedPoints,
      suelosLabAverage: projection.suelosLabSummary.weightedAverage,
      homologationApplied: projection.homologationApplied,
      estructurasAcum: cMap['c-estructuras'].accumulatedPoints,
      estructurasEvaluatedPct: cMap['c-estructuras'].evaluatedPercent,
      hidrologiaAcum: cMap['c-hidrologia'].accumulatedPoints,
      hidrologiaEvaluatedPct: cMap['c-hidrologia'].evaluatedPercent,
      blocked2027Courses: projection.schedule2027Real.blockedCourses.map((b) => b.name),
      enrolled2027Courses: projection.schedule2027Real.enrolledCourses.map((c) =>
        c.theoryOnlyMode ? `${c.name} (Solo Teoría)` : c.name
      ),
      planned2027Credits: projection.schedule2027Real.totalCredits,
      planned2027NetTuition: projection.schedule2027Real.totalNetTuition,
    };
  } catch (err: unknown) {
    academicOk = false;
    auditErrors.push(`academicProjection: ${(err as Error)?.message || 'Error'}`);
  }

  const aiFlags = resolveConfiguredAiKeys().statusFlags;

  const snapshot: LiveTelemetrySnapshot = {
    health: {
      steps: healthDetailed.steps,
      sleepHours: healthDetailed.sleepHours,
      restingHeartRate: healthDetailed.restingHeartRate,
      spo2: healthDetailed.spo2,
      stressScore: healthDetailed.stressScore,
      readinessScore: healthDetailed.readinessScore,
      weight: healthDetailed.weightKg,
      bodyFatPct: healthDetailed.bodyFatPct,
      skeletalMuscleKg: healthDetailed.skeletalMuscleKg,
      bmi: healthDetailed.bmi,
      waterL: healthDetailed.waterL,
      fatFreeMassKg: Number(metrics.fatFreeMassKg ?? 49.8),
    },
    hevy: {
      lastWorkoutName: hevyDetailed.lastWorkoutName,
      totalVolumeKg: hevyDetailed.totalVolumeKg,
      date: hevyDetailed.date,
      setsCompleted: hevyDetailed.setsCompleted,
    },
    calendar: {
      todayEvents: todayEvents.map((e) => `${e.start} ${e.summary}`),
      tomorrowEvents: tomorrowEvents.map((e) => `${e.start} ${e.summary}`),
    },
    finance: {
      cajitaNu: financeDetailed.cuentaNu,
      nequi: financeDetailed.nequi,
      cash: financeDetailed.efectivo,
      receivables: financeDetailed.receivablesTotal,
      debtDaniela: financeDetailed.danielaDebt,
      debtYessid: financeDetailed.yessidRemaining,
    },
    academic: academicSnapshot,
  };

  const bogotaTimeLabel = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  return {
    timestamp: new Date().toISOString(),
    bogotaTimeLabel,
    snapshot,
    healthDetailed,
    hevyDetailed,
    financeDetailed,
    calendarDetailed,
    systemAudit: {
      healthOk: healthRes.ok,
      hevyOk: hevyRes.ok,
      calendarOk: calRes.ok,
      financeOk: finRes.ok,
      academicOk,
      errorCount: auditErrors.length,
      errors: auditErrors,
      ...aiFlags,
    },
  };
}

export function readLivePageSnapshot(): LiveTelemetrySnapshot {
  return gatherFullEcosystemTelemetry().snapshot;
}
