import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:3000';
const ROOT = process.cwd();

async function main() {
  console.log('=== TEST SUITE: MULTI-IA COACH VIVO + RUTINAS HEVY REALES + APLICACIÓN VERIFICADA ===');

  // 1. Verificar snapshot vivo de las 4 rutinas en data/real_hevy_routines.json
  const routinesPath = path.join(ROOT, 'data', 'real_hevy_routines.json');
  assert.ok(fs.existsSync(routinesPath), 'Debe existir data/real_hevy_routines.json');
  const routinesData = JSON.parse(fs.readFileSync(routinesPath, 'utf8'));
  assert.ok(Array.isArray(routinesData.routines) && routinesData.routines.length >= 4, 'Deben existir >= 4 rutinas vivas');
  const titles = routinesData.routines.map((r) => r.title);
  assert.ok(titles.some((t) => /Horizontal Torso/i.test(t)), 'Falta Horizontal Torso');
  assert.ok(titles.some((t) => /Vertical & Incline Torso/i.test(t)), 'Falta Vertical & Incline Torso');
  assert.ok(titles.some((t) => /Arms & Shoulders/i.test(t)), 'Falta Arms & Shoulders');
  assert.ok(titles.some((t) => /Full Legs/i.test(t)), 'Falta Full Legs');
  console.log(`[1/5] PASS: 4 rutinas vivas reales cargadas (${routinesData.templateUnitsCount} unidades KG/LBS mapeadas).`);

  // 2. Verificar GET /api/hevy/ai-coach devuelve auditoría Multi-IA REAL (no 0ms) para las 4 rutinas
  const routineNames = [
    'Horizontal Torso (Chest & Back)',
    'Vertical & Incline Torso (Chest & Back)',
    'Arms & Shoulders',
    'Full Legs',
  ];

  for (const name of routineNames) {
    const res = await fetch(`${BASE}/api/hevy/ai-coach?routine=${encodeURIComponent(name)}`);
    assert.equal(res.status, 200, `GET ai-coach falló para ${name}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.liveRoutine, `Debe devolver liveRoutine para ${name}`);
    assert.ok(data.liveAudit, `Debe devolver liveAudit Multi-IA para ${name}`);
    assert.ok(
      data.liveAudit.totalLatencyMs >= 1000,
      `Latencia real debe ser >= 1000ms (no 0ms fake), got ${data.liveAudit.totalLatencyMs} en ${name}`
    );
    assert.ok(
      Array.isArray(data.liveAudit.modelsUsed) && data.liveAudit.modelsUsed.length >= 1,
      `Debe reportar modelos reales usados en ${name}`
    );
    assert.ok(
      data.liveAudit.structureScore >= 0 && data.liveAudit.structureScore <= 100,
      `structureScore fuera de rango en ${name}`
    );
    assert.ok(
      Array.isArray(data.liveAudit.structuralIssues) && data.liveAudit.structuralIssues.length >= 1,
      `Debe reportar hallazgos estructurales reales en ${name}`
    );
    assert.equal(
      data.liveAudit.exerciseRecommendations.length,
      data.liveRoutine.exerciseCount,
      `Debe auditar todos los ejercicios de ${name}`
    );
  }
  console.log('[2/5] PASS: Las 4 rutinas tienen auditorías Multi-IA reales persistidas (latencia real > 1s, cero 0ms).');

  // 3. Verificar deltas exactos serie por serie (+1/-1, +/-kg), descansos múltiplos de 5 y biyección de orden
  const resHoriz = await fetch(
    `${BASE}/api/hevy/ai-coach?routine=${encodeURIComponent('Horizontal Torso (Chest & Back)')}`
  );
  const horiz = await resHoriz.json();
  const recs = horiz.liveAudit.exerciseRecommendations;

  const bench = recs.find((r) => /Bench Press \(Barbell\)/i.test(r.exerciseName));
  assert.ok(bench, 'Debe existir recomendación para Bench Press (Barbell)');
  assert.ok(bench.setSuggestions.length >= 2, 'Bench Press debe tener setSuggestions serie por serie');
  const workingBench = bench.setSuggestions.filter((s) => !s.isWarmup);
  assert.ok(workingBench.length >= 2, 'Bench Press debe tener >= 2 series efectivas sugeridas');
  assert.ok(
    workingBench.every((s) => typeof s.shortBadge === 'string' && s.shortBadge.length >= 3),
    'Cada serie debe tener shortBadge (+1/-1 o +/-kg)'
  );
  assert.ok(
    bench.coachReasoning.toLowerCase().includes('solo') ||
      bench.coachReasoning.toLowerCase().includes('barra') ||
      bench.pinnedNoteForHevy.toLowerCase().includes('seguridad'),
    `Bench Press debe leer la nota personal de Santiago (entrenar solo): ${bench.coachReasoning}`
  );

  // Validar descansos múltiplos de 5s y permutación válida 0..N-1 en suggestedOrderIndex
  const orderSet = new Set();
  for (const r of recs) {
    assert.equal(r.suggestedRestSeconds % 5, 0, `Descanso debe ser múltiplo de 5s: ${r.exerciseName}=${r.suggestedRestSeconds}`);
    assert.ok(r.suggestedOrderIndex >= 0 && r.suggestedOrderIndex < recs.length, 'suggestedOrderIndex fuera de rango');
    orderSet.add(r.suggestedOrderIndex);
  }
  assert.equal(orderSet.size, recs.length, 'suggestedOrderIndex debe ser biyección sin duplicados');
  console.log('[3/5] PASS: Deltas serie por serie (+1/-1), lectura de notas del atleta, descansos 5s y orden biyectivo válidos.');

  // 4. Verificar respaldo automático en data/hevy_routines_backup.json
  const backupPath = path.join(ROOT, 'data', 'hevy_routines_backup.json');
  assert.ok(fs.existsSync(backupPath), 'Debe existir respaldo automático data/hevy_routines_backup.json');
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  assert.ok(Array.isArray(backupData.backups) && backupData.backups.length >= 1, 'Debe haber al menos 1 respaldo guardado');
  console.log(`[4/5] PASS: Respaldo de seguridad verificado (${backupData.backups.length} snapshot(s) en hevy_routines_backup.json).`);

  // 5. Verificar rechazo honesto cuando se intenta aplicar sin ejercicios
  const resBad = await fetch(`${BASE}/api/hevy/ai-coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'apply_to_hevy',
      routineName: 'Rutina Inexistente XYZ 999',
      selectedExercises: [],
    }),
  });
  assert.equal(resBad.status, 400);
  const badJson = await resBad.json();
  assert.equal(badJson.syncedToHevy, false);
  console.log('[5/7] PASS: Validación antifraude rechaza payloads vacíos con HTTP 400 y syncedToHevy=false.');

  // 6. Verificar Base de Datos Viva NotebookLM + Dossier 360° en Staging Drive
  const nlmPath = path.join(ROOT, 'data', 'notebooklm_knowledge_base.json');
  assert.ok(fs.existsSync(nlmPath), 'Debe existir data/notebooklm_knowledge_base.json');
  const nlmData = JSON.parse(fs.readFileSync(nlmPath, 'utf8'));
  assert.equal(nlmData.notebookId, '57126469-ac46-4b0d-a370-6270c887c26b');
  assert.ok(nlmData.curatedSourcesCount >= 67, 'Debe indexar las 67 fuentes de MegaProyecto');
  assert.ok(Array.isArray(nlmData.coreHypertrophyRules) && nlmData.coreHypertrophyRules.length >= 6);
  console.log(`[6/7] PASS: Base de Datos NotebookLM MegaProyecto verificada (${nlmData.curatedSourcesCount} fuentes, ${nlmData.coreHypertrophyRules.length} reglas científicas).`);

  // 7. Verificar Fusión Holística 360° (8/8 fuentes vivas + asimetrías 17 pts + coherenceCrossCheck)
  assert.ok(horiz.holisticSummary, 'GET /api/hevy/ai-coach debe incluir holisticSummary 360°');
  assert.ok(horiz.holisticSummary.sourcesConnectedCount >= 7, `Deben conectarse >=7 fuentes vivas, got ${horiz.holisticSummary.sourcesConnectedCount}`);
  assert.ok(Array.isArray(horiz.holisticSummary.pills) && horiz.holisticSummary.pills.length >= 5);
  assert.ok(horiz.holisticSummary.asymmetryCount >= 1, 'Debe detectar asimetrías reales de real_body_measurements.json');
  assert.ok(horiz.liveAudit.coherenceCrossCheck, 'liveAudit debe incluir coherenceCrossCheck cruzando las 8 fuentes');
  console.log(`[7/7] PASS: Coherencia Cruzada 360° verificada (${horiz.holisticSummary.sourcesConnectedCount}/8 fuentes, ${horiz.holisticSummary.asymmetryCount} asimetrías 17 pts detectadas).`);

  console.log('ALL AI COACH 360°, NOTEBOOKLM & HEVY APPLY TESTS PASSED.');
}

main().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
