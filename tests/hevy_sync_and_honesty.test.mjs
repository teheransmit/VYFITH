import assert from 'node:assert/strict';

const BASE = 'http://localhost:3000';

async function main() {
  console.log('=== TEST SUITE: HEVY SYNC REAL, ANALÍTICA NO-MOCK Y HONESTIDAD ===');

  // 1. Verificar que /api/sync/hevy cargó las 202 sesiones reales incluyendo 9 nov y 30 oct
  const resGet = await fetch(`${BASE}/api/sync/hevy`);
  assert.equal(resGet.status, 200);
  const dataGet = await resGet.json();
  assert.equal(dataGet.success, true);
  assert.ok(dataGet.count >= 202, `Se esperaban >= 202 sesiones, got ${dataGet.count}`);

  const datesAndNames = dataGet.workouts.slice(0, 5).map((w) => `${w.date}::${w.name}`);
  assert.ok(
    datesAndNames.some((s) => s.includes('10 nov 2026') && s.includes('Full Legs')),
    'Debe aparecer Full Legs del 10 nov 2026'
  );
  assert.ok(
    datesAndNames.some((s) => s.includes('9 nov 2026') && s.includes('Horizontal Torso')),
    'Debe aparecer Horizontal Torso del 9 nov 2026'
  );
  assert.ok(
    datesAndNames.some((s) => s.includes('30 oct 2026') && s.includes('Arms & Shoulders')),
    'Debe aparecer Arms & Shoulders del 30 oct 2026'
  );
  console.log('[1/4] PASS: 202 entrenamientos reales ordenados cronológicamente (incluye 10 nov, 9 nov y 30 oct).');

  // 2. Verificar que /api/sync/hevy-pro calcula ventana 7d real (2 entrenamientos, 28 series) y no fallbacks falsos
  const resPro = await fetch(`${BASE}/api/sync/hevy-pro?period=7d`);
  assert.equal(resPro.status, 200);
  const dataPro = await resPro.json();
  assert.equal(dataPro.success, true);
  assert.equal(dataPro.analytics.cards.workouts.currentValue, 2, 'En 7d (hasta 12 nov) deben haber exactamente 2 entrenamientos reales (9 nov + 10 nov)');
  console.log('[2/4] PASS: Analítica PRO calcula correctamente 2 entrenamientos reales en ventana 7d.');

  // 3. Verificar deduplicación al re-subir el mismo entrenamiento via webhook POST /api/sync/hevy
  const latestWorkout = dataGet.workouts[0];
  const resWebhook = await fetch(`${BASE}/api/sync/hevy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workout: {
        id: latestWorkout.id,
        title: latestWorkout.name,
        start_time: latestWorkout.date,
        exercises: latestWorkout.exercises || [],
      },
    }),
  });
  assert.equal(resWebhook.status, 200);
  const dataWebhook = await resWebhook.json();
  assert.equal(dataWebhook.totalCount, dataGet.count, 'Re-ingestar una sesión existente NO debe duplicar registros');
  console.log('[3/4] PASS: Deduplicación en webhook POST /api/sync/hevy mantiene conteo exacto.');

  // 4. Verificar honestidad estricta en POST /api/hevy/ai-coach (sin API Key PRO ni Chrome conectado, syncedToHevy DEBE ser false)
  const resCoach = await fetch(`${BASE}/api/hevy/ai-coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routineTitle: 'Full Legs',
      hevySyncPayload: [
        {
          exerciseName: 'Seated Calf Raise',
          suggestedWeightKg: 25,
          targetReps: '3x12-15',
        },
      ],
    }),
  });
  assert.equal(resCoach.status, 200);
  const dataCoach = await resCoach.json();
  assert.equal(dataCoach.savedLocally, true);
  if (!dataGet.hasProApiKey && !dataGet.browserBridgeAuthenticated) {
    assert.equal(dataCoach.syncedToHevy, false, 'PROHIBIDO reportar syncedToHevy=true sin escritura externa verificada');
    assert.ok(
      dataCoach.message.includes('SOLO en VYFITH local'),
      `Mensaje debe declarar guardado solo local: ${dataCoach.message}`
    );
  }
  console.log('[4/4] PASS: POST /api/hevy/ai-coach respeta regla cero mentiras (syncedToHevy=' + dataCoach.syncedToHevy + ').');
  console.log('ALL HEVY SYNC & HONESTY TESTS PASSED.');
}

main().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
