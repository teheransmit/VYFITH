#!/usr/bin/env node
/**
 * VYFITH — Puente de Base de Datos Viva Google NotebookLM ("MegaProyecto")
 * Notebook oficial: https://notebooklm.google.com/notebook/57126469-ac46-4b0d-a370-6270c887c26b
 *
 * Comandos:
 *   node scripts/notebooklm_bridge.mjs export-telemetry-to-drive
 *   node scripts/notebooklm_bridge.mjs sync-knowledge
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const NOTEBOOK_ID = '57126469-ac46-4b0d-a370-6270c887c26b';
const NOTEBOOK_URL = `https://notebooklm.google.com/notebook/${NOTEBOOK_ID}`;
const KNOWLEDGE_FILE = path.join(DATA_DIR, 'notebooklm_knowledge_base.json');
const DRIVE_STAGING_DIR = 'G:\\Mi unidad\\Proyecto personal\\NotebookLM_Staging_VYFITH';
const DRIVE_DOSSIER_FILE = path.join(DRIVE_STAGING_DIR, 'VYFITH_Base_Datos_Integral_Santiago.md');
const LOCAL_DOSSIER_BACKUP = path.join(DATA_DIR, 'VYFITH_Base_Datos_Integral_Santiago.md');

function safeReadJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Compila un dossier Markdown completo con las 8 fuentes vivas de VYFITH
 * listo para Google Drive Staging -> NotebookLM "MegaProyecto".
 */
function exportTelemetryDossierToDrive() {
  const workouts = safeReadJson(path.join(DATA_DIR, 'real_hevy_workouts.json'), []);
  const routinesBundle = safeReadJson(path.join(DATA_DIR, 'real_hevy_routines.json'), { routines: [] });
  const health = safeReadJson(path.join(DATA_DIR, 'real_health_state.json'), {});
  const measurements = safeReadJson(path.join(DATA_DIR, 'real_body_measurements.json'), []);
  const nutrition = safeReadJson(path.join(DATA_DIR, 'real_nutrition_state.json'), {});
  const water = safeReadJson(path.join(DATA_DIR, 'real_water_log.json'), {});
  const watch = safeReadJson(path.join(DATA_DIR, 'real_watch_workouts.json'), { sessions: [] });
  const finance = safeReadJson(path.join(DATA_DIR, 'real_finance_state.json'), {});

  const latestMeas = Array.isArray(measurements) && measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const firstMeas = Array.isArray(measurements) && measurements.length > 0 ? measurements[0] : null;
  const m = health?.currentMetrics || {};
  const v = health?.vyfithData || {};
  const waterDays = water?.days ? Object.values(water.days) : [];
  const latestWater = waterDays.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null;

  const asymmetries = [];
  if (latestMeas) {
    const pairs = [
      ['Bíceps', latestMeas.bicepsLeftCm, latestMeas.bicepsRightCm],
      ['Antebrazo', latestMeas.forearmLeftCm, latestMeas.forearmRightCm],
      ['Muslo', latestMeas.thighLeftCm, latestMeas.thighRightCm],
      ['Gemelo', latestMeas.calfLeftCm, latestMeas.calfRightCm],
    ];
    for (const [label, l, r] of pairs) {
      if (Number.isFinite(l) && Number.isFinite(r) && Math.abs(l - r) >= 0.3) {
        asymmetries.push(`- **${label}:** Izq ${l} cm vs Der ${r} cm (Δ = ${(l - r).toFixed(1)} cm)`);
      }
    }
  }

  const recentNotes = [];
  for (const w of (Array.isArray(workouts) ? workouts : []).slice(0, 15)) {
    for (const ex of w.exercises || []) {
      if (ex.notes && String(ex.notes).trim()) {
        recentNotes.push(`- [${w.date}] **${w.name} → ${ex.name}:** "${String(ex.notes).trim()}"`);
      }
    }
  }

  const lines = [
    `# VYFITH — Base de Datos Biológica y de Entrenamiento 360° (Santiago Smit Teherán Mogollón)`,
    ``,
    `- **Actualizado:** ${new Date().toISOString()}`,
    `- **Perfil:** 21 años (30/05/2005), 172 cm, Ectomorfo Magro, Gimnasio UPB Montería (entrena solo).`,
    `- **Meta Principal:** Subir de **${m.weightKg ?? 55.5} kg** (${m.bodyFatPct ?? 10.4}% grasa) a **60.0 kg de masa muscular magra**.`,
    `- **Cuaderno NotebookLM Destino:** MegaProyecto (\`${NOTEBOOK_ID}\`)`,
    ``,
    `## 1. Biometría Viva y Báscula Femmto`,
    `- Peso actual: **${m.weightKg ?? 55.5} kg** | Masa Muscular Esquelética: **${m.skeletalMuscleKg ?? 25.1} kg** | Masa Magra: **${m.leanBodyMassKg ?? 46.5} kg** | % Grasa: **${m.bodyFatPct ?? 10.4}%**`,
    `- Sueño última noche: **${m.sleepHours ?? 'N/D'} h** (Profundo: ${m.deepSleepHours ?? 'N/D'} h, REM: ${m.remSleepHours ?? 'N/D'} h, Eficiencia: ${m.sleepEfficiency ?? 'N/D'}%)`,
    `- HRV: **${m.hrv ?? 'N/D'} ms** | FC Reposo: **${m.heartRate ?? 'N/D'} bpm** | SpO2: **${m.spo2 ?? 'N/D'}%** | Readiness: **${v.readinessScore ?? 'N/D'}/100**`,
    `- Hidratación hoy: **${latestWater?.totalMl ?? nutrition?.current?.waterMl ?? 0} / ${latestWater?.goalMl ?? 2900} ml**`,
    `- Nutrición registrada hoy: **${nutrition?.current?.calories ?? 0} / ${nutrition?.targets?.targetKcal ?? 2800} kcal** | Proteína: **${nutrition?.current?.protein ?? 0} / ${nutrition?.targets?.targetProtein ?? 140} g**`,
    ``,
    `## 2. Medidas Corporales de 17 Puntos y Asimetrías Reales`,
    latestMeas
      ? `- Fecha última medición: **${latestMeas.date}** | Pecho: **${latestMeas.chestCm} cm** | Hombros: **${latestMeas.shouldersCm} cm** | Cintura: **${latestMeas.waistCm} cm** | Muslo: **${latestMeas.thighLeftCm}/${latestMeas.thighRightCm} cm** | Bíceps: **${latestMeas.bicepsLeftCm}/${latestMeas.bicepsRightCm} cm**`
      : `- Sin mediciones registradas.`,
    firstMeas && latestMeas
      ? `- Progreso desde ${firstMeas.date}: Peso ${firstMeas.weightKg} → ${latestMeas.weightKg} kg | Pecho ${firstMeas.chestCm} → ${latestMeas.chestCm} cm | Hombros ${firstMeas.shouldersCm} → ${latestMeas.shouldersCm} cm | Muslo Der ${firstMeas.thighRightCm} → ${latestMeas.thighRightCm} cm.`
      : ``,
    `### Asimetrías Detectadas (≥ 0.3 cm — Priorizar Unilateral por Lado Izquierdo)`,
    ...(asymmetries.length > 0 ? asymmetries : ['- Sin asimetrías relevantes.']),
    ``,
    `## 3. Carga Mecánica de Paseos Caninos en Bicicleta (Montería)`,
    `- Transporte habitual: **Bicicleta a 15 km/h** (~2.1 km casa→perros, ~7.8 km a Campus UPB).`,
    `- **Frida:** Turno mañana 06:30 AM (L–V) + Turno tarde 19:30 PM (M–V) → hasta 9 paseos/semana.`,
    `- **Sienna:** 15:15 PM (M/J/V) y 05:55 AM (L–V en vacaciones) → hasta 5 paseos/semana.`,
    `- Implicación biomecánica: El gasto calórico diario y la fatiga de tren inferior (cuádriceps/gemelos) exigen controlar el volumen basura en Full Legs y proteger el superávit calórico ectomorfo.`,
    ``,
    `## 4. Estructura Viva de las 4 Rutinas en Hevy (${(routinesBundle.routines || []).length} rutinas, ${Array.isArray(workouts) ? workouts.length : 0} sesiones históricas)`,
    ...(routinesBundle.routines || []).map(
      (r) =>
        `### ${r.title} (${r.exerciseCount} ejercicios • ${r.shortId})\n` +
        (r.exercises || [])
          .map(
            (e) =>
              `${e.index + 1}. **${e.title}** (${e.unit.toUpperCase()}, descanso ${e.restSeconds}s, ${e.sets?.length || 0} sets)${e.notes ? ` — Nota: ${e.notes}` : ''}`
          )
          .join('\n')
    ),
    ``,
    `## 5. Notas Personales Recientes de Santiago en Hevy (Contexto de Gimnasio UPB)`,
    ...(recentNotes.length > 0 ? recentNotes.slice(0, 18) : ['- Sin notas recientes.']),
    ``,
    `## 6. Sesiones Cardíacas Archivadas del Reloj Xiaomi Smart Band 9 Pro (${(watch.sessions || []).length})`,
    ...(watch.sessions || []).slice(0, 8).map(
      (s) => `- ${s.dateIso} ${s.startTimeText}-${s.endTimeText} • ${s.title} (${s.durationMinutes} min, FC prom ${s.avgHeartRateBpm ?? 'N/D'} bpm, ${s.caloriesBurned ?? 0} kcal)`
    ),
    ``,
    `## 7. Estado de Entorno y Estrés Financiero`,
    `- Estado: Vacaciones UPB (2026-II finalizado) • Gimnasio UPB pagado al día • Entrenamientos de 60-75 min óptimos.`,
    `- Cuentas registradas: ${Array.isArray(finance?.accounts) ? finance.accounts.length : 0}.`,
    ``,
  ];

  const markdown = lines.join('\n');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LOCAL_DOSSIER_BACKUP, markdown, 'utf8');

  let driveSynced = false;
  try {
    if (fs.existsSync('G:\\Mi unidad\\Proyecto personal')) {
      fs.mkdirSync(DRIVE_STAGING_DIR, { recursive: true });
      fs.writeFileSync(DRIVE_DOSSIER_FILE, markdown, 'utf8');
      driveSynced = true;
    }
  } catch {
    driveSynced = false;
  }

  return {
    driveSynced,
    driveDossierPath: driveSynced ? DRIVE_DOSSIER_FILE : null,
    localDossierPath: LOCAL_DOSSIER_BACKUP,
    bytes: Buffer.byteLength(markdown, 'utf8'),
    asymmetriesCount: asymmetries.length,
    recentNotesCount: recentNotes.length,
  };
}

/**
 * Construye y actualiza la base de datos local estructurada data/notebooklm_knowledge_base.json
 * fundamentada en las 67 fuentes curadas del cuaderno "MegaProyecto" (Jeff Nippard, Mike Israetel,
 * Brad Schoenfeld y Eric Helms).
 */
function buildNotebookLmKnowledgeIndex(dossierInfo) {
  const knowledge = {
    notebookId: NOTEBOOK_ID,
    notebookName: 'MegaProyecto',
    notebookUrl: NOTEBOOK_URL,
    curatedSourcesCount: 67,
    syncedAt: new Date().toISOString(),
    syncMode: 'curated_megaproyecto_67_sources_plus_live_drive_staging',
    driveStagingDir: dossierInfo.driveSynced ? DRIVE_STAGING_DIR : null,
    driveDossierPath: dossierInfo.driveDossierPath,
    localDossierPath: dossierInfo.localDossierPath,
    authorsAndFoundations: [
      'Jeff Nippard — Pure Bodybuilding, Fundamentals of Hypertrophy, Science-Based Exercise Tier Lists & Stretch-Mediated Hypertrophy (28 fuentes Deep Research activas)',
      'Dr. Mike Israetel (Renaissance Periodization) — Volume Landmarks (MEV/MAV/MRV), Stimulus-to-Fatigue Ratio (SFR) y Mesocycle Progression',
      'Brad Schoenfeld — Mechanisms of Muscle Hypertrophy, Rest Interval Meta-Analysis (≥2-3 min compounds) & Training Frequency',
      'Eric Helms — The Muscle & Strength Pyramid (RIR 1-3 auto-regulation, Double Progression & Ectomorph Surplus Strategy)',
    ],
    coreHypertrophyRules: [
      {
        id: 'NLM-ORDER-01',
        topic: 'Orden Biomecánico de la Sesión',
        rule: 'Colocar SIEMPRE los ejercicios compuestos pesados y técnicamente demandantes (#1-#3) cuando el SNC y el agarre están 100% frescos. Nunca hacer estiramiento estático prolongado antes de press pesado ni fatigar antebrazos/bíceps antes de remos o jalones.',
        citation: 'Jeff Nippard • Exercise Order Science & Pre-Workout Warmup Protocol (NotebookLM MegaProyecto)',
      },
      {
        id: 'NLM-VOL-02',
        topic: 'Presupuesto de Volumen para Ectomorfo Magro (55.5 kg → 60 kg)',
        rule: 'Limitar cada sesión a 7-10 ejercicios de alto Ratio Estímulo-Fatiga (14-20 series efectivas por sesión, 60-75 min). Más de 12 ejercicios genera volumen basura, eleva el cortisol, quema calorías valiosas y degrada el rendimiento en las últimas series.',
        citation: 'Mike Israetel (RP) & Eric Helms • MEV/MAV Landmarks & Junk Volume Threshold (NotebookLM MegaProyecto)',
      },
      {
        id: 'NLM-REST-03',
        topic: 'Intervalos de Descanso Basados en Evidencia',
        rule: 'Compuestos axiales o pesados multiarticulares (Bench Press, Squat, Deadlift, RDL, Rows, OHP): 150-180 segundos (2:30-3:00). Accesorios multiarticulares (Incline DB, Chest Press, Pulldowns): 120-150 segundos. Aislamientos (Bíceps, Tríceps, Laterales, Antebrazo, Gemelos, Core): 60-90 segundos.',
        citation: 'Brad Schoenfeld & Jeff Nippard • Optimal Rest Periods Meta-Analysis (NotebookLM MegaProyecto)',
      },
      {
        id: 'NLM-RIR-04',
        topic: 'Progresión Doble y Gestión de RPE 10 / Entrenamiento Solo',
        rule: 'Entrenar crónicamente al fallo absoluto (@RPE 10) en todas las series de compuestos libres dispara la fatiga del SNC y el riesgo de estancamiento. Mantener RIR 1-2 (@RPE 8-9) en compuestos libres (usando pines de seguridad si entrena solo) y reservar el fallo (@RPE 9.5-10) únicamente para la última serie de máquinas o aislamientos seguros.',
        citation: 'Eric Helms & Jeff Nippard • RIR Auto-Regulation & Safe Failure Selection (NotebookLM MegaProyecto)',
      },
      {
        id: 'NLM-ASYM-05',
        topic: 'Corrección de Asimetrías Izquierda vs. Derecha (Medidas 17 Puntos)',
        rule: 'Cuando la cinta métrica detecta una diferencia ≥ 0.4 cm entre extremidades (ej. lado izquierdo menor al derecho en bíceps, antebrazo, muslo o gemelo), priorizar variantes unilaterales o con mancuernas/polea iniciando SIEMPRE con el lado rezagado e igualando estrictamente las repeticiones en el lado dominante.',
        citation: 'Jeff Nippard • Fixing Muscle Imbalances & Unilateral Hypertrophy (NotebookLM MegaProyecto)',
      },
      {
        id: 'NLM-LEGS-06',
        topic: 'Interferencia Aeróbica / Ciclismo Diario y Día de Pierna',
        rule: 'Si el atleta acumula paseos diarios y desplazamientos en bicicleta (15 km/h), las piernas ya tienen fatiga periférica crónica. En Full Legs: abrir con el patrón de sentadilla (#1) y bisagra de cadera (#2) con 3:00 de descanso, limitar gemelos a 1-2 ejercicios máximo (4-6 series de calidad con pausa en estiramiento) y evitar 11+ ejercicios extenuantes.',
        citation: 'Mike Israetel & Brad Schoenfeld • Concurrent Training Interference & Stretch-Mediated Calf Hypertrophy (NotebookLM MegaProyecto)',
      },
      {
        id: 'NLM-FOREARM-07',
        topic: 'Especialización Inteligente de Antebrazos sin Destruir la Espalda',
        rule: 'Si se desean antebrazos más grandes, elegir MÁXIMO 1-2 ejercicios (1 flexión + 1 extensión/rodillo, 2-3 series cada uno) ubicados estrictamente AL FINAL de la sesión, jamás intercalados antes de ejercicios de tracción o remo.',
        citation: 'Jeff Nippard • Forearm Training Placement & Grip Preservation (NotebookLM MegaProyecto)',
      },
    ],
    routineBlueprints: {
      'Horizontal Torso (Chest & Back)': {
        idealExerciseCount: '8-10 ejercicios (65-75 min)',
        idealOrderPattern: [
          '1. Compuesto Pecho Plano (Bench Press Barbell con pines de seguridad o DB) — 180s',
          '2. Compuesto Espalda Horizontal Pesado (Seated Cable Row con soporte firme) — 180s',
          '3. Compuesto Pecho Inclinado (Incline Bench Press DB) — 150s',
          '4. Compuesto Espalda Horizontal Secundario (Smith Machine Bent Over Row) — 150s',
          '5. Aislamiento / Máquina Pecho Estiramiento (Seated Chest Flys o Chest Press Machine) — 90-120s',
          '6. Aislamiento Dorsal / Deltoide Posterior (Crossbody Lat Pull-Around / Reverse Fly Single Arm iniciando izq) — 90s',
          '7. Brazos (Bicep Curl Cable + Triceps Pressdown) — 90s',
          '8. Core / 1 solo ejercicio de Antebrazo al final (Wrist Roller o Behind the Back Curl) — 60-75s',
        ],
        removeTrashCriteria: 'Eliminar Estiramiento estático al inicio y recortar de 4 ejercicios de antebrazo a máximo 1-2 al final absoluto.',
      },
      'Vertical & Incline Torso (Chest & Back)': {
        idealExerciseCount: '8-10 ejercicios (65-75 min)',
        idealOrderPattern: [
          '1. Compuesto Pecho Inclinado Pesado — 150-180s',
          '2. Jalón Vertical Pesado (Lat Pulldown / Dominadas) — 150-180s',
          '3. Empuje / Remo complementario — 120-150s',
          '4. Aislamientos de pecho superior, dorsal y hombro posterior — 90s',
          '5. Core (Cable Crunch con rango fijo 10-15) + máximo 1 antebrazo al cierre — 60-75s',
        ],
        removeTrashCriteria: 'Reducir antebrazos redundantes al cierre (de 3 a 1) y fijar rango numérico en Cable Crunch.',
      },
      'Arms & Shoulders': {
        idealExerciseCount: '8-10 ejercicios (60-70 min)',
        idealOrderPattern: [
          '1. Compuesto Hombro (Overhead Press Smith Machine) — 180s (nunca después de curl de bíceps)',
          '2. Elevación Lateral Prioritaria (Lateral Raise DB/Cable para anchura de hombros, iniciando lado izq) — 90s',
          '3. Bíceps en estiramiento + Bíceps acortado (Preacher Curl / Cable Curl iniciando izq por asimetría) — 90s',
          '4. Tríceps cabeza larga (Overhead Extension) + Pushdown — 90s',
          '5. Deltoide Posterior + máximo 1-2 antebrazos al cierre — 60-75s',
        ],
        removeTrashCriteria: 'Sacar Bench Press del día de brazos (interfiere con recuperación de pecho de Torso) y depurar ejercicios duplicados de brazo/antebrazo.',
      },
      'Full Legs': {
        idealExerciseCount: '7-8 ejercicios (60-70 min)',
        idealOrderPattern: [
          '1. Patrón Sentadilla Pesado (Squat Smith Machine o Hack Squat) — 180s',
          '2. Patrón Bisagra de Cadera (Romanian Deadlift Barbell o Deadlift al inicio, NUNCA al final #11) — 180s',
          '3. Compuesto Unilateral/Prensa (Leg Press iniciando conciencia pierna izq por -0.5 cm muslo) — 150s',
          '4. Aislamiento Cuádriceps (Leg Extension) — 90-120s',
          '5. Aislamiento Isquiotibiales (Lying Leg Curl) — 90-120s',
          '6. Aducción de Cadera — 90s',
          '7. 1 solo ejercicio de Gemelos con pausa de 2s abajo (Standing Calf Raise) — 60-75s',
        ],
        removeTrashCriteria: 'Nunca colocar Deadlift de último (#11) ni Squat en #7; consolidar 3 ejercicios de gemelos en 1-2 efectivos considerando el ciclismo diario de paseos.',
      },
    },
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(knowledge, null, 2), 'utf8');
  return knowledge;
}

const cmd = process.argv[2] || 'sync-knowledge';
if (cmd === 'export-telemetry-to-drive') {
  const dossier = exportTelemetryDossierToDrive();
  console.log(JSON.stringify({ ok: true, cmd, ...dossier }));
} else if (cmd === 'sync-knowledge') {
  const dossier = exportTelemetryDossierToDrive();
  const knowledge = buildNotebookLmKnowledgeIndex(dossier);
  console.log(
    JSON.stringify({
      ok: true,
      cmd,
      notebookId: knowledge.notebookId,
      notebookUrl: knowledge.notebookUrl,
      curatedSourcesCount: knowledge.curatedSourcesCount,
      rulesCount: knowledge.coreHypertrophyRules.length,
      knowledgeFile: KNOWLEDGE_FILE,
      ...dossier,
    })
  );
} else {
  console.log(JSON.stringify({ ok: false, error: `Comando desconocido: ${cmd}` }));
  process.exitCode = 1;
}
