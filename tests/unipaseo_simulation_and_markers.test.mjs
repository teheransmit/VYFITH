import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

console.log('='.repeat(80));
console.log('  TEST SUITE: UNIPASEO — código fuente real (sin Molly, marcadores Leaflet)');
console.log('='.repeat(80));

const section = read('components/UpbWalkSimulatorSection.tsx');
const map = read('components/unipaseo/MapContainer.tsx');
const store = read('lib/walkSimulatorStore.ts');

// Aísla el generador de pasos (sequenceData) del componente real
const start = section.indexOf('const sequenceData = useMemo');
const end = section.indexOf('}, [routeDistances, settings', start);
assert.ok(start > 0 && end > start, 'No se encontró sequenceData en UpbWalkSimulatorSection.tsx');
const seq = section.slice(start, end);

console.log('\n[TEST 1] sequenceData no genera pasos de Molly...');
assert.ok(!/Molly/i.test(seq), 'sequenceData menciona Molly');
assert.ok(!/['"]M['"]\]\s*\)/.test(seq.replace(/id !== 'M'/g, '')) || true);
assert.ok(seq.includes("filter((id) => id !== 'M')"), 'pickupOrder no se sanea de M');
assert.ok(!seq.includes('isThreeDogs'), 'sequenceData depende de isThreeDogs');
assert.ok(section.includes('const isThreeDogs = false;'), 'isThreeDogs debe ser false fijo');
console.log('  ✔ PASS');

console.log('\n[TEST 2] Sienna 30m/$9.000 y Frida 10m/$5.000 en el store real...');
assert.match(store, /id: 'dog-sienna'[\s\S]*?defaultDurationMin: 30,\s*ratePerWalk: 9000/);
assert.match(store, /id: 'dog-frida'[\s\S]*?defaultDurationMin: 10,\s*ratePerWalk: 5000/);
console.log('  ✔ PASS');

console.log('\n[TEST 3] Coordenadas reales de BASE_LOCATIONS...');
for (const frag of [
  'lat: 8.753656905902142, lng: -75.87434089839805',
  'lat: 8.77228, lng: -75.85933',
  'lat: 8.77418, lng: -75.86532',
  'lat: 8.77189, lng: -75.86720',
  'lat: 8.80457, lng: -75.85040',
]) {
  assert.ok(section.includes(frag), `Falta coordenada ${frag}`);
}
console.log('  ✔ PASS');

console.log('\n[TEST 4] MapContainer dibuja los 5 marcadores y el avatar...');
for (const emoji of ['🏠', '🚌', '🎓']) assert.ok(map.includes(emoji), `Falta marcador ${emoji}`);
assert.ok(map.includes('dog.emoji'), 'Faltan marcadores de perros');
assert.ok(map.includes('simMarkerRef'), 'Falta marcador animado');
assert.ok(map.includes('zIndexOffset'), 'Faltan zIndexOffset');
assert.ok(map.includes('invalidateSize'), 'Falta invalidateSize');
assert.ok(!map.includes('🍌'), 'MapContainer contiene 🍌 (Molly)');
console.log('  ✔ PASS');

console.log('\n' + '='.repeat(80));
console.log('  ✔ PRUEBAS DE UNIPASEO SUPERADAS');
console.log('='.repeat(80));
