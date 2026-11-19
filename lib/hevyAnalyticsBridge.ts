/**
 * VYFITH — Puente Matemático Unificado de Hevy + Correlación Biomédica
 * Garantiza que TODAS las tarjetas de la web (Overview, Matriz Biomédica,
 * Mapa de Calor Muscular, Distribución Corporal y KPIs del Gimnasio UPB)
 * calculen sus métricas desde los MISMOS entrenamientos reales de Hevy.
 */

import { HevyWorkoutSession } from './hevyStore';
import { parseHevyDate } from './hevyDateParser';

export interface LiveMuscleVolumeMetric {
  id: 'chest' | 'back' | 'shoulders' | 'triceps' | 'biceps' | 'quads' | 'hamstrings' | 'calves';
  name: string;
  sets: number;
  volumeKg: number;
  mev: number;
  mrv: number;
  status: 'optimal' | 'maintenance' | 'under' | 'over';
  color: string;
  lastExercise: string;
  lastDateLabel: string;
}

export interface LiveLiftDiagnostic {
  exercise: string;
  currentWeight: string;
  status: string;
  detail: string;
  action: string;
  type: 'warning' | 'success' | 'optimal';
  estimated1RmKg: number;
  sessionsTracked: number;
}

export interface LiveHevyCorrelationSnapshot {
  totalSessionsAllTime: number;
  latestSession: HevyWorkoutSession | null;
  acute7dVolumeKg: number;
  acute7dSets: number;
  acute7dSessions: number;
  prev7dVolumeKg: number;
  chronic28dVolumeKg: number;
  chronicWeeklyAvgKg: number;
  acwr: number;
  volumeDeltaPct: number;
  rpeAverage: number;
  activeMicrocycleVolumeKg: number;
  activeMicrocycleSets: number;
  activeMicrocycleWindowLabel: string;
  muscleVolumes: Record<LiveMuscleVolumeMetric['id'], LiveMuscleVolumeMetric>;
  liftDiagnostics: LiveLiftDiagnostic[];
  dailyVolumeMapIso: Record<string, number>; // YYYY-MM-DD -> kg
}

const MUSCLE_META: Record<
  LiveMuscleVolumeMetric['id'],
  { name: string; mev: number; mrv: number }
> = {
  chest: { name: 'Pectoral (Pecho)', mev: 10, mrv: 20 },
  back: { name: 'Espalda & Dorsales', mev: 12, mrv: 22 },
  shoulders: { name: 'Deltoides (Hombros)', mev: 8, mrv: 18 },
  triceps: { name: 'Tríceps (Prioridad)', mev: 8, mrv: 16 },
  biceps: { name: 'Bíceps & Braquial', mev: 8, mrv: 16 },
  quads: { name: 'Cuádriceps', mev: 10, mrv: 18 },
  hamstrings: { name: 'Femorales / Isquios', mev: 8, mrv: 16 },
  calves: { name: 'Pantorrillas', mev: 8, mrv: 16 },
};

function classifyMuscleId(exName: string, muscleGroup?: string): LiveMuscleVolumeMetric['id'] | null {
  const n = (exName || '').toLowerCase();
  const g = (muscleGroup || '').toLowerCase();

  if (n === 'stretching' || n === 'warm up' || n.includes('estiramiento') || n.includes('calentamiento')) {
    return null;
  }

  // Específicos primero para no mezclar brazos o pierna
  if (n.includes('calf') || n.includes('pantorrill') || n.includes('talon') || n.includes('soleus')) return 'calves';
  if (
    n.includes('hamstring') ||
    n.includes('leg curl') ||
    n.includes('femoral') ||
    n.includes('romanian') ||
    n.includes('rumano') ||
    n.includes('rdl') ||
    n.includes('hip thrust') ||
    n.includes('glute')
  ) {
    return 'hamstrings';
  }
  if (
    n.includes('squat') ||
    n.includes('sentadilla') ||
    n.includes('leg press') ||
    n.includes('prensa') ||
    n.includes('leg extension') ||
    n.includes('quad') ||
    n.includes('lunge') ||
    n.includes('bulgarian') ||
    n.includes('hack')
  ) {
    return 'quads';
  }
  if (
    n.includes('tricep') ||
    n.includes('trícep') ||
    n.includes('pushdown') ||
    n.includes('skullcrusher') ||
    n.includes('press francés') ||
    n.includes('extension') && (n.includes('rope') || n.includes('cable') || n.includes('overhead'))
  ) {
    return 'triceps';
  }
  if (
    n.includes('bicep') ||
    n.includes('bícep') ||
    n.includes('curl') ||
    n.includes('wrist') ||
    n.includes('forearm') ||
    n.includes('hammer') ||
    n.includes('preacher')
  ) {
    return 'biceps';
  }
  if (
    n.includes('lateral raise') ||
    n.includes('shoulder') ||
    n.includes('overhead press') ||
    n.includes('military') ||
    n.includes('militar') ||
    n.includes('face pull') ||
    n.includes('rear delt') ||
    n.includes('arnold') ||
    n.includes('shrug') ||
    n.includes('deltoid')
  ) {
    return 'shoulders';
  }
  if (
    n.includes('bench') ||
    n.includes('chest') ||
    n.includes('pec') ||
    n.includes('fly') ||
    n.includes('push up') ||
    n.includes('dip') ||
    n.includes('banca')
  ) {
    return 'chest';
  }
  if (
    n.includes('row') ||
    n.includes('pulldown') ||
    n.includes('pull up') ||
    n.includes('chin up') ||
    n.includes('lat ') ||
    n.includes('remo') ||
    n.includes('jalón') ||
    n.includes('dominada') ||
    n.includes('deadlift') ||
    n.includes('back') ||
    n.includes('pullover')
  ) {
    return 'back';
  }

  // Fallback por muscleGroup declarado
  if (g.includes('pecho') || g.includes('chest')) return 'chest';
  if (g.includes('espalda') || g.includes('back')) return 'back';
  if (g.includes('hombro') || g.includes('shoulder')) return 'shoulders';
  if (g.includes('trícep') || g.includes('tricep')) return 'triceps';
  if (g.includes('bícep') || g.includes('bicep') || g.includes('brazo') || g.includes('arm')) return 'biceps';
  if (g.includes('pierna') || g.includes('leg') || g.includes('cuádriceps')) return 'quads';
  if (g.includes('femoral') || g.includes('glút')) return 'hamstrings';
  if (g.includes('pantorrill')) return 'calves';

  return null;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function effectiveWorkingSets(ex: HevyWorkoutSession['exercises'][number]) {
  return (ex.sets || []).filter(
    (s) => s.indicator !== 'warmup' && ((s.weightKg || 0) > 0 || (s.reps || 0) > 0)
  );
}

function estimateBrzycki1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Number(weightKg.toFixed(1));
  if (reps >= 36) return Number((weightKg * (1 + reps / 30)).toFixed(1));
  return Number((weightKg / (1.0278 - 0.0278 * reps)).toFixed(1));
}

export function computeLiveHevyCorrelation(
  sessions: HevyWorkoutSession[],
  healthContext?: {
    readinessScore?: number;
    sleepHours?: number;
    hydrationPct?: number;
  }
): LiveHevyCorrelationSnapshot {
  const parsedList = (sessions || [])
    .map((s) => ({ session: s, dateObj: parseHevyDate(s.date) }))
    .filter((item): item is { session: HevyWorkoutSession; dateObj: Date } => Boolean(item.dateObj))
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  const now = new Date();
  // Si el último entrenamiento está en una fecha reciente, anclar ventanas a now (o al último entreno si supera now por timezone)
  const latestDateMs = parsedList[0]?.dateObj.getTime() || now.getTime();
  const anchorMs = Math.max(now.getTime(), latestDateMs);
  const dayMs = 24 * 60 * 60 * 1000;

  const cutoff7d = anchorMs - 7 * dayMs;
  const cutoff14d = anchorMs - 14 * dayMs;
  const cutoff28d = anchorMs - 28 * dayMs;

  const sessions7d = parsedList.filter((i) => i.dateObj.getTime() >= cutoff7d);
  const sessionsPrev7d = parsedList.filter(
    (i) => i.dateObj.getTime() >= cutoff14d && i.dateObj.getTime() < cutoff7d
  );
  const sessions28d = parsedList.filter((i) => i.dateObj.getTime() >= cutoff28d);

  // Microciclo activo: últimos 14 días (o últimas 4 sesiones reales si la semana actual está arrancando)
  // para que el mapa muscular refleje la distribución de la rotación completa de Santiago (Horizontal, Vertical, Legs, Arms)
  const microcycleSessions =
    sessions7d.length >= 3 ? sessions7d : parsedList.slice(0, Math.min(4, parsedList.length));
  const activeMicrocycleWindowLabel =
    sessions7d.length >= 3
      ? `Últimos 7 días (${sessions7d.length} sesiones)`
      : `Último microciclo activo (${microcycleSessions.length} sesiones)`;

  const acute7dVolumeKg = Math.round(sessions7d.reduce((a, i) => a + (i.session.totalVolumeKg || 0), 0));
  const acute7dSets = sessions7d.reduce((a, i) => a + (i.session.totalSets || 0), 0);
  const prev7dVolumeKg = Math.round(sessionsPrev7d.reduce((a, i) => a + (i.session.totalVolumeKg || 0), 0));
  const chronic28dVolumeKg = Math.round(sessions28d.reduce((a, i) => a + (i.session.totalVolumeKg || 0), 0));
  const chronicWeeklyAvgKg = Math.round(chronic28dVolumeKg / 4);

  const activeMicrocycleVolumeKg = Math.round(
    microcycleSessions.reduce((a, i) => a + (i.session.totalVolumeKg || 0), 0)
  );
  const activeMicrocycleSets = microcycleSessions.reduce((a, i) => a + (i.session.totalSets || 0), 0);

  // Si la semana actual apenas tiene 1 sesión (ej. martes), usar la carga del microciclo o 7d con protección
  const effectiveAcute = acute7dVolumeKg > 0 ? acute7dVolumeKg : activeMicrocycleVolumeKg;
  const acwr =
    chronicWeeklyAvgKg > 0 ? Number((effectiveAcute / chronicWeeklyAvgKg).toFixed(2)) : 1.0;

  const volumeDeltaPct =
    prev7dVolumeKg > 0
      ? Number((((acute7dVolumeKg - prev7dVolumeKg) / prev7dVolumeKg) * 100).toFixed(1))
      : 0;

  // RPE real promedio de las sesiones recientes
  const rpeValues: number[] = [];
  microcycleSessions.forEach(({ session }) => {
    if (session.rpeAverage && session.rpeAverage > 0) {
      rpeValues.push(session.rpeAverage);
    } else {
      session.exercises.forEach((ex) => {
        ex.sets.forEach((st) => {
          if (st.rpe && st.rpe > 0) rpeValues.push(st.rpe);
        });
      });
    }
  });
  const rpeAverage =
    rpeValues.length > 0
      ? Number((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1))
      : 0;

  // Mapa diario YYYY-MM-DD -> kg (para correlación de 90 días en DashboardOverview)
  const dailyVolumeMapIso: Record<string, number> = {};
  parsedList.forEach(({ session, dateObj }) => {
    const iso = toIsoDate(dateObj);
    dailyVolumeMapIso[iso] = (dailyVolumeMapIso[iso] || 0) + Math.round(session.totalVolumeKg || 0);
  });

  // Volumen por grupo muscular sobre el microciclo activo (y último ejercicio real en historial)
  const accMuscles: Record<
    LiveMuscleVolumeMetric['id'],
    { sets: number; volumeKg: number; lastExercise: string; lastDateLabel: string }
  > = {
    chest: { sets: 0, volumeKg: 0, lastExercise: 'Sin registro reciente', lastDateLabel: '—' },
    back: { sets: 0, volumeKg: 0, lastExercise: 'Sin registro reciente', lastDateLabel: '—' },
    shoulders: { sets: 0, volumeKg: 0, lastExercise: 'Sin registro reciente', lastDateLabel: '—' },
    triceps: { sets: 0, volumeKg: 0, lastExercise: 'Sin registro reciente', lastDateLabel: '—' },
    biceps: { sets: 0, volumeKg: 0, lastExercise: 'Sin registro reciente', lastDateLabel: '—' },
    quads: { sets: 0, volumeKg: 0, lastExercise: 'Sin registro reciente', lastDateLabel: '—' },
    hamstrings: { sets: 0, volumeKg: 0, lastExercise: 'Sin registro reciente', lastDateLabel: '—' },
    calves: { sets: 0, volumeKg: 0, lastExercise: 'Sin registro reciente', lastDateLabel: '—' },
  };

  microcycleSessions.forEach(({ session }) => {
    (session.exercises || []).forEach((ex) => {
      const mId = classifyMuscleId(ex.name, ex.muscleGroup);
      if (!mId) return;
      const workSets = effectiveWorkingSets(ex);
      if (workSets.length === 0) return;

      accMuscles[mId].sets += workSets.length;
      accMuscles[mId].volumeKg += Math.round(ex.totalVolume || 0);

      if (accMuscles[mId].lastExercise === 'Sin registro reciente') {
        const topSet = workSets.reduce((best, s) => ((s.weightKg || 0) > (best.weightKg || 0) ? s : best), workSets[0]);
        const title = ex.esTitle || ex.name;
        const wStr = topSet.weightKg > 0 ? `${Number(topSet.weightKg.toFixed(1))} kg` : 'peso corporal';
        accMuscles[mId].lastExercise = `${title} ${wStr} (${workSets.length} series)`;
        accMuscles[mId].lastDateLabel = session.date.split(',')[0] || session.date;
      }
    });
  });

  // Si algún músculo no estuvo en el microciclo de 4 sesiones, buscar su último ejercicio real en las últimas 12 sesiones
  const recent12 = parsedList.slice(0, 12);
  (Object.keys(accMuscles) as LiveMuscleVolumeMetric['id'][]).forEach((mId) => {
    if (accMuscles[mId].lastExercise !== 'Sin registro reciente') return;
    for (const { session } of recent12) {
      const found = (session.exercises || []).find((ex) => classifyMuscleId(ex.name, ex.muscleGroup) === mId);
      if (found) {
        const workSets = effectiveWorkingSets(found);
        if (workSets.length > 0) {
          const topSet = workSets.reduce((best, s) => ((s.weightKg || 0) > (best.weightKg || 0) ? s : best), workSets[0]);
          const title = found.esTitle || found.name;
          const wStr = topSet.weightKg > 0 ? `${Number(topSet.weightKg.toFixed(1))} kg` : 'peso corporal';
          accMuscles[mId].lastExercise = `${title} ${wStr} (${workSets.length} series)`;
          accMuscles[mId].lastDateLabel = session.date.split(',')[0] || session.date;
          break;
        }
      }
    }
  });

  const muscleVolumes = {} as Record<LiveMuscleVolumeMetric['id'], LiveMuscleVolumeMetric>;
  (Object.keys(MUSCLE_META) as LiveMuscleVolumeMetric['id'][]).forEach((mId) => {
    const meta = MUSCLE_META[mId];
    const data = accMuscles[mId];
    let status: LiveMuscleVolumeMetric['status'] = 'optimal';
    let color = '#10B981';
    if (data.sets === 0 || data.sets < Math.round(meta.mev * 0.6)) {
      status = 'under';
      color = '#60A5FA';
    } else if (data.sets < meta.mev) {
      status = 'maintenance';
      color = '#F59E0B';
    } else if (data.sets > meta.mrv) {
      status = 'over';
      color = '#EF4444';
    }

    muscleVolumes[mId] = {
      id: mId,
      name: meta.name,
      sets: data.sets,
      volumeKg: data.volumeKg,
      mev: meta.mev,
      mrv: meta.mrv,
      status,
      color,
      lastExercise: data.lastExercise,
      lastDateLabel: data.lastDateLabel,
    };
  });

  // Diagnósticos de Sobrecarga Progresiva reales (últimas 16 sesiones) cruzados con Readiness / Sueño / Agua
  const readiness = healthContext?.readinessScore ?? 75;
  const sleepH = healthContext?.sleepHours ?? 7.4;
  const hydPct = healthContext?.hydrationPct ?? 100;
  const lowRecovery = readiness < 70 || sleepH < 6.8 || hydPct < 65;

  const liftHistory = new Map<
    string,
    Array<{ title: string; date: string; topWeightKg: number; topReps: number; avgRpe: number; est1Rm: number }>
  >();

  parsedList.slice(0, 20).forEach(({ session }) => {
    (session.exercises || []).forEach((ex) => {
      const mId = classifyMuscleId(ex.name, ex.muscleGroup);
      if (!mId) return;
      const workSets = effectiveWorkingSets(ex);
      if (workSets.length === 0) return;

      const topSet = workSets.reduce(
        (best, s) =>
          estimateBrzycki1RM(s.weightKg, s.reps) > estimateBrzycki1RM(best.weightKg, best.reps) ? s : best,
        workSets[0]
      );
      if ((topSet.weightKg || 0) <= 0) return;

      const rpes = workSets.map((s) => s.rpe || 0).filter((r) => r > 0);
      const avgRpe = rpes.length > 0 ? Number((rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1)) : 8.5;
      const est1Rm = estimateBrzycki1RM(topSet.weightKg, topSet.reps);
      const key = ex.name;

      if (!liftHistory.has(key)) liftHistory.set(key, []);
      liftHistory.get(key)!.push({
        title: ex.esTitle || ex.name,
        date: session.date.split(',')[0] || session.date,
        topWeightKg: Number(topSet.weightKg.toFixed(1)),
        topReps: topSet.reps,
        avgRpe,
        est1Rm,
      });
    });
  });

  // Seleccionar los 3 levantamientos principales más recientes y frecuentes (priorizando compuestos del microciclo)
  const sortedLifts = Array.from(liftHistory.entries())
    .sort((a, b) => {
      const aScore = b[1].length * 10 + (a[1][0]?.topWeightKg || 0) * 0.2;
      const bScore = a[1].length * 10 + (b[1][0]?.topWeightKg || 0) * 0.2;
      return aScore - bScore;
    })
    .sort((a, b) => {
      const aLatest = a[1][0]?.est1Rm || 0;
      const bLatest = b[1][0]?.est1Rm || 0;
      return b[1].length * 25 + bLatest - (a[1].length * 25 + aLatest);
    })
    .slice(0, 3);

  const liftDiagnostics: LiveLiftDiagnostic[] = sortedLifts.map(([, history]) => {
    const latest = history[0];
    const prev = history[1];
    const delta1Rm = prev ? Number((latest.est1Rm - prev.est1Rm).toFixed(1)) : 0;

    let status = 'Progresión Activa';
    let detail = `Última marca (${latest.date}): ${latest.topWeightKg} kg × ${latest.topReps} reps (1RM est. ${latest.est1Rm} kg • RPE ${latest.avgRpe}).`;
    let action = `Subir +1.25–2.5 kg o añadir +1 rep en la primera serie efectiva.`;
    let type: 'warning' | 'success' | 'optimal' = 'success';

    if (prev && delta1Rm <= 0 && latest.avgRpe >= 9.5) {
      status = 'Meseta / Fatiga Alta';
      type = 'warning';
      detail = `1RM est. ${latest.est1Rm} kg vs ${prev.est1Rm} kg previo con RPE ${latest.avgRpe} al límite.`;
      action = lowRecovery
        ? `Readiness ${readiness}/100 y agua ${Math.round(hydPct)}%: consolida ${latest.topWeightKg} kg a RIR 2 hoy y cierra hidratación antes de subir carga.`
        : `Mantener ${latest.topWeightKg} kg con técnica controlada (RIR 1–2) buscando +1 rep limpia antes de subir peso.`;
    } else if (prev && delta1Rm > 0.4) {
      status = `Sobrecarga +${delta1Rm} kg 1RM`;
      type = 'success';
      detail = `Subiste de ${prev.est1Rm} kg a ${latest.est1Rm} kg de 1RM estimado (${latest.topWeightKg} kg × ${latest.topReps}).`;
      action = lowRecovery
        ? `Progresión real positiva; con sueño de ${sleepH.toFixed(1)}h hoy mantén peso y prioriza RIR 1–2.`
        : `Excelente adaptación: apunta a ${Number((latest.topWeightKg + 2.5).toFixed(1))} kg o +1 rep en el Gimnasio UPB.`;
    } else {
      status = 'Rango de Hipertrofia';
      type = 'optimal';
      action = lowRecovery
        ? `Con Readiness ${readiness}/100 (sueño ${sleepH.toFixed(1)}h), consolida ${latest.topWeightKg} kg buscando 8–10 reps limpias.`
        : `Consolidar ${latest.topWeightKg} kg buscando llegar al tope de reps (RIR 1) para desbloquear subida.`;
    }

    return {
      exercise: latest.title,
      currentWeight: `${latest.topWeightKg} kg`,
      status,
      detail,
      action,
      type,
      estimated1RmKg: latest.est1Rm,
      sessionsTracked: history.length,
    };
  });

  return {
    totalSessionsAllTime: sessions.length,
    latestSession: parsedList[0]?.session || sessions[0] || null,
    acute7dVolumeKg,
    acute7dSets,
    acute7dSessions: sessions7d.length,
    prev7dVolumeKg,
    chronic28dVolumeKg,
    chronicWeeklyAvgKg,
    acwr,
    volumeDeltaPct,
    rpeAverage,
    activeMicrocycleVolumeKg,
    activeMicrocycleSets,
    activeMicrocycleWindowLabel,
    muscleVolumes,
    liftDiagnostics,
    dailyVolumeMapIso,
  };
}
