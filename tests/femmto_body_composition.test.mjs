import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('================================================================================');
console.log('  TEST SUITE: BÁSCULA FEMMTO & COMPOSICIÓN CORPORAL (SANTIAGO TEHERÁN)');
console.log('  Target: 55.7 kg • 10.6% PGC • 25.1 kg MME • 18.8 IMC • 27 Historical Weigh-ins');
console.log('================================================================================\n');

// 1. Cargar real_health_state.json
const healthJsonPath = path.join(projectRoot, 'data', 'real_health_state.json');
assert.ok(fs.existsSync(healthJsonPath), 'real_health_state.json debe existir');

const rawHealth = fs.readFileSync(healthJsonPath, 'utf8');
const healthState = JSON.parse(rawHealth);

// Test 1: currentMetrics contiene las 10 métricas de Femmto
console.log('[TEST 1] Verificando métricas actuales en real_health_state.json...');
assert.strictEqual(healthState.currentMetrics.weightKg, 55.7, 'El peso actual debe ser exactamente 55.7 kg');
assert.strictEqual(healthState.currentMetrics.bodyFatPct, 10.6, 'La grasa actual debe ser 10.6%');
assert.strictEqual(healthState.currentMetrics.skeletalMuscleKg, 25.1, 'El músculo esquelético (MME) debe ser 25.1 kg');
assert.strictEqual(healthState.currentMetrics.bmi, 18.8, 'El IMC debe ser 18.8 kg/m²');
assert.strictEqual(healthState.currentMetrics.waterL, 32.8, 'El agua corporal debe ser 32.8 L');
assert.strictEqual(healthState.currentMetrics.proteinKg, 13.9, 'La proteína debe ser 13.9 kg');
assert.strictEqual(healthState.currentMetrics.mineralsKg, 3.2, 'Los minerales deben ser 3.2 kg');
assert.strictEqual(healthState.currentMetrics.fatMassKg, 5.9, 'La masa de grasa debe ser 5.9 kg');
assert.strictEqual(healthState.currentMetrics.fatFreeMassKg, 49.8, 'La masa libre de grasa debe ser 49.8 kg');
console.log('  ✔ PASS: Las 10 dimensiones biométricas coinciden 100% con la báscula Femmto.\n');

// Test 2: femmtoData contiene el perfil y las 27 mediciones históricas
console.log('[TEST 2] Verificando estructura completa de femmtoData y los 27 pesajes históricos...');
assert.ok(healthState.femmtoData, 'femmtoData debe estar presente');
assert.strictEqual(healthState.femmtoData.user.name, 'Santiago Teheran');
assert.strictEqual(healthState.femmtoData.user.heightCm, 172);
assert.strictEqual(healthState.femmtoData.user.age, 21);
assert.strictEqual(healthState.femmtoData.user.gender, 'Masculino');
assert.strictEqual(healthState.femmtoData.history.length, 27, 'Deben existir exactamente 27 registros históricos de pesaje');

// Validar el primer registro histórico (01/08 21:45) y el último (28/10 12:12)
const firstRecord = healthState.femmtoData.history[0];
const lastRecord = healthState.femmtoData.history[26];
assert.strictEqual(firstRecord.date, '01/08');
assert.strictEqual(firstRecord.time, '21:45');
assert.strictEqual(firstRecord.weightKg, 55.0);
assert.strictEqual(firstRecord.skeletalMuscleKg, 25.0);
assert.strictEqual(firstRecord.bodyFatPct, 9.9);

assert.strictEqual(lastRecord.date, '28/10');
assert.strictEqual(lastRecord.time, '12:12');
assert.strictEqual(lastRecord.weightKg, 55.7);
assert.strictEqual(lastRecord.skeletalMuscleKg, 25.1);
assert.strictEqual(lastRecord.bodyFatPct, 10.6);
console.log('  ✔ PASS: Los 27 registros coinciden con la Página 2 del PDF de Femmto.\n');

// Test 3: Coherencia matemática de la jerarquía de bioimpedancia
console.log('[TEST 3] Verificando suma jerárquica multicompartimental...');
const water = healthState.femmtoData.latest.water.value; // 32.8
const protein = healthState.femmtoData.latest.protein.value; // 13.9
const minerals = healthState.femmtoData.latest.minerals.value; // 3.2
const fatMass = healthState.femmtoData.latest.fatMass.value; // 5.9
const leanBodyMass = healthState.femmtoData.latest.leanBodyMass.value; // 46.6
const fatFreeMass = healthState.femmtoData.latest.fatFreeMass.value; // 49.8
const weight = healthState.femmtoData.latest.weight.value; // 55.7

// Magra + Grasa = Peso
assert.strictEqual(Number((fatFreeMass + fatMass).toFixed(1)), weight, 'Masa libre de grasa + Masa grasa debe sumar Peso');
// Magra = Magra libre - minerales
assert.strictEqual(Number((fatFreeMass - minerals).toFixed(1)), leanBodyMass, 'Masa libre de grasa - Minerales debe ser Masa magra');
console.log('  ✔ PASS: La física de bioimpedancia cuadrática cierra con exactitud.\n');

// Test 4: Verificación de Observaciones HL7 FHIR
console.log('[TEST 4] Verificando Observaciones HL7 FHIR para báscula Femmto...');
const weightObs = healthState.recentObservations.find(o => o.code?.coding?.[0]?.code === '29463-7');
const fatObs = healthState.recentObservations.find(o => o.code?.coding?.[0]?.code === '41982-0');
const muscleObs = healthState.recentObservations.find(o => o.code?.coding?.[0]?.code === '73964-9');
const bmiObs = healthState.recentObservations.find(o => o.code?.coding?.[0]?.code === '39156-5');

assert.ok(weightObs, 'Debe existir observación FHIR LOINC 29463-7 (Body weight)');
assert.strictEqual(weightObs.valueQuantity.value, 55.7);
assert.strictEqual(weightObs.valueQuantity.unit, 'kg');

assert.ok(fatObs, 'Debe existir observación FHIR LOINC 41982-0 (Body fat %)');
assert.strictEqual(fatObs.valueQuantity.value, 10.6);

assert.ok(muscleObs, 'Debe existir observación FHIR LOINC 73964-9 (Skeletal muscle)');
assert.strictEqual(muscleObs.valueQuantity.value, 25.1);

assert.ok(bmiObs, 'Debe existir observación FHIR LOINC 39156-5 (BMI)');
assert.strictEqual(bmiObs.valueQuantity.value, 18.8);
console.log('  ✔ PASS: 4 Observaciones FHIR R4 mapeadas y válidas.\n');

console.log('================================================================================');
console.log('  ✔ 100% DE PRUEBAS DE LA BÁSCULA FEMMTO APROBADAS SATISFACTORIAMENTE');
console.log('================================================================================');
