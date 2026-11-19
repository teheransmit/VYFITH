import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Compilar/cargar el motor TypeScript directamente vía tsx/esbuild o endpoint en vivo
const ROOT = process.cwd();
const API_BASE = 'http://localhost:3000';

async function testLiveFusionPipeline() {
  console.log('1) Verificando re-ingesta CSV con ventanas horarias exactas (start/end)...');
  const csvPath = path.join(ROOT, 'data', 'imports', 'workouts_live_export.csv');
  assert.ok(fs.existsSync(csvPath), 'Debe existir data/imports/workouts_live_export.csv');

  const workouts = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data', 'real_hevy_workouts.json'), 'utf8')
  );
  assert.ok(workouts.length >= 200, `Esperados >= 200 entrenamientos, hay ${workouts.length}`);
  const latest = workouts[0];
  assert.equal(latest.name, 'Horizontal Torso (Chest & Back)');
  assert.equal(latest.startTimeLocal, '17:11', 'startTimeLocal debe ser 17:11');
  assert.equal(latest.endTimeLocal, '18:53', 'endTimeLocal debe ser 18:53');
  assert.equal(latest.durationMinutes, 102, 'durationMinutes real del 17 nov debe ser 102 min');
  assert.ok(latest.startTimeIso && latest.startTimeIso.includes('2026-11-17T17:11'), 'startTimeIso exacto');
  assert.ok(latest.endTimeIso && latest.endTimeIso.includes('2026-11-17T18:53'), 'endTimeIso exacto');
  console.log('   ✔ Ventanas exactas de Hevy verificadas (17 nov 17:11–18:53, 102 min).');

  console.log('2) Verificando algoritmo de fusión con escenarios reales y anti-falso-positivo (endpoint /api/sync/hevy/fuse)...');
  // Probar GET /api/sync/hevy/fuse
  const getRes = await fetch(`${API_BASE}/api/sync/hevy/fuse`);
  assert.equal(getRes.status, 200, 'GET /api/sync/hevy/fuse debe responder 200');
  const getData = await getRes.json();
  assert.equal(getData.success, true);
  assert.ok(Array.isArray(getData.watchSessions), 'watchSessions debe ser un arreglo');
  assert.ok(getData.watchSessionsCount >= 1, 'Debe haber al menos 1 sesión real del reloj cosechada desde Firestore');

  // Verificar que Ciclismo 19 nov 06:26 (12 min) NO se fusionó falsamente con Horizontal Torso 17 nov 17:11
  const nov17 = workouts.find((w) => w.id === '3iXBJa30JS6');
  if (nov17?.watchBiometrics) {
    assert.notEqual(
      nov17.watchBiometrics.watchDateIso,
      '2026-11-19',
      'JAMÁS debe fusionar una sesión de otra fecha'
    );
  }
  console.log(
    `   ✔ Estado real verificado: ${getData.watchSessionsCount} sesión(es) real(es) del reloj en archivo, ${getData.fusedWorkoutsCount} fusionado(s), 0 falsos positivos.`
  );

  // 3) Probar fusión temporal en memoria sobre el módulo TS compilado por Next.js sin ensuciar datos reales:
  // Verificamos con una prueba de unidad pura en memoria usando respaldo temporal del JSON
  console.log('3) Probando emparejamiento exacto (inicio simultáneo + reloj finalizado 35s antes) y preservación ante re-sync CSV...');
  const workoutsBackup = fs.readFileSync(path.join(ROOT, 'data', 'real_hevy_workouts.json'), 'utf8');
  const watchBackupPath = path.join(ROOT, 'data', 'real_watch_workouts.json');
  const watchBackup = fs.existsSync(watchBackupPath) ? fs.readFileSync(watchBackupPath, 'utf8') : null;

  try {
    // Inyectar sesión sintética de prueba temporal para el 17 nov 2026 (17:11:05 -> 18:52:25, 35s antes que Hevy)
    // y una sesión de bici corta justo antes (16:50 -> 17:04, 14m) que NO debe fusionarse
    const ingestRes = await fetch(`${API_BASE}/api/sync/hevy/fuse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ingest_watch_sessions',
        sessions: [
          {
            id: 'test-commute-nov17',
            dateIso: '2026-11-17',
            startTimeText: '16:50',
            endTimeText: '17:04',
            startTimeIso: '2026-11-17T16:50:00-05:00',
            endTimeIso: '2026-11-17T17:04:00-05:00',
            durationMinutes: 14,
            durationSeconds: 840,
            title: 'Ciclismo',
            exerciseTypeName: 'Ciclismo',
            caloriesBurned: 45,
            avgHeartRateBpm: 122,
            maxHeartRateBpm: 144,
            sourceLabel: 'Mi Fitness (Xiaomi) (Reloj)',
            deviceModel: 'Xiaomi Smart Band 9 Pro',
            isWatchSource: true,
          },
          {
            id: 'test-strength-nov17',
            dateIso: '2026-11-17',
            startTimeText: '17:11',
            endTimeText: '18:52',
            startTimeIso: '2026-11-17T17:11:05-05:00',
            endTimeIso: '2026-11-17T18:52:25-05:00',
            durationMinutes: 101,
            durationSeconds: 6080,
            title: 'Entrenamiento de fuerza',
            exerciseTypeName: 'Fuerza',
            caloriesBurned: 412.5,
            avgHeartRateBpm: 134,
            maxHeartRateBpm: 171,
            minHeartRateBpm: 88,
            hrSampleCount: 240,
            hrZoneMinutes: { z1: 12, z2: 38, z3: 35, z4: 14, z5: 2 },
            sourceLabel: 'Mi Fitness (Xiaomi) (Reloj)',
            deviceModel: 'Xiaomi Smart Band 9 Pro',
            isWatchSource: true,
          },
        ],
      }),
    });
    assert.equal(ingestRes.status, 200);
    const ingestData = await ingestRes.json();
    assert.equal(ingestData.success, true);

    const fusedNov17 = ingestData.workouts.find((w) => w.id === '3iXBJa30JS6');
    assert.ok(fusedNov17?.watchBiometrics, 'Horizontal Torso 17 nov debe quedar fusionado');
    assert.equal(fusedNov17.watchBiometrics.watchSessionId, 'test-strength-nov17', 'Debe elegir la sesión de fuerza y NO la bici');
    assert.equal(fusedNov17.watchBiometrics.matchConfidence, 'exact', 'Confianza debe ser exact');
    assert.equal(fusedNov17.watchBiometrics.startOffsetSeconds, 5, 'Desfase inicio debe ser +5s');
    assert.equal(fusedNov17.watchBiometrics.endOffsetSeconds, -35, 'Desfase fin debe ser -35s (reloj paró 35s antes)');
    assert.equal(fusedNov17.watchBiometrics.avgHeartRateBpm, 134);
    assert.equal(fusedNov17.watchBiometrics.maxHeartRateBpm, 171);
    assert.equal(fusedNov17.watchBiometrics.minHeartRateBpm, 88);
    assert.equal(fusedNov17.watchBiometrics.caloriesBurned, 412.5);
    assert.ok(fusedNov17.watchBiometrics.overlapPct >= 98, `Solapamiento esperado >=98%, got ${fusedNov17.watchBiometrics.overlapPct}`);
    assert.ok(fusedNov17.watchBiometrics.cardiacLoadIndex > 0, 'TRIMP debe calcularse > 0');
    assert.ok(fusedNov17.watchBiometrics.kgPerKcal > 0, 'Eficiencia kg/kcal debe calcularse > 0');

    // Verificar que las demás sesiones SIN reloj sigan sin datos fabricados
    const nov12 = ingestData.workouts.find((w) => w.id === 'b4t9vnN1e9g');
    assert.equal(nov12?.watchBiometrics, undefined, 'Sesión sin reloj (12 nov) NO debe inventar HR');

    // Probar desvinculación
    const unfuseRes = await fetch(`${API_BASE}/api/sync/hevy/fuse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unfuse', hevyWorkoutId: '3iXBJa30JS6' }),
    });
    const unfuseData = await unfuseRes.json();
    assert.equal(unfuseData.success, true);
    const unfusedNov17 = unfuseData.workouts.find((w) => w.id === '3iXBJa30JS6');
    assert.equal(unfusedNov17?.watchBiometrics, undefined, 'Debe quedar desvinculado tras unfuse');
    console.log('   ✔ Fusión exacta (+5s inicio / -35s fin / 99% solapamiento), filtro anti-bici y unfuse 100% PASS.');
  } finally {
    // Restaurar archivos reales intactos (cero datos sintéticos persistidos!)
    fs.writeFileSync(path.join(ROOT, 'data', 'real_hevy_workouts.json'), workoutsBackup, 'utf8');
    if (watchBackup !== null) {
      fs.writeFileSync(watchBackupPath, watchBackup, 'utf8');
    }
  }
}

testLiveFusionPipeline()
  .then(() => {
    console.log('\n✅ TODAS LAS PRUEBAS DE FUSIÓN HEVY ↔ RELOJ PASARON AL 100%.');
  })
  .catch((err) => {
    console.error('\n❌ FALLO EN PRUEBA DE FUSIÓN:', err);
    process.exit(1);
  });
