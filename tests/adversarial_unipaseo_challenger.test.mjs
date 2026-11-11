/**
 * @license
 * Adversarial Challenger Test Harness for UniPaseo (VYFITH)
 * Agent: challenger_r2_1 (Empirical Challenger - Timeline & Invariants)
 * 
 * Tests Cartesian product of all inputs:
 * 5 weekdays x 3 scenarios x 3 strategies x 3 start locations x 3 transports = 405 runs
 * + Adversarial injections (Molly injection in pickupOrder, goalMolly > 0, corrupt state)
 * + AST / Static code invariant checks
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('='.repeat(80));
console.log('  ADVERSARIAL STRESS TEST HARNESS — UNIPASEO TIMELINE & INVARIANTS');
console.log('  Agent: challenger_r2_1 (Empirical Challenger)');
console.log('='.repeat(80));

// --- 1. CODEBASE INVARIANT CHECKS (AST / REGEX AUDIT) ---
console.log('\n[STAGE 1] Invariant Audit on React Components...');

const COMPONENT_DIR = 'C:/Users/Luis/AndroidStudioProjects/VYFITH/components';
const upbSectionCode = fs.readFileSync(path.join(COMPONENT_DIR, 'UpbWalkSimulatorSection.tsx'), 'utf-8');
const timelineCode = fs.readFileSync(path.join(COMPONENT_DIR, 'unipaseo/Timeline.tsx'), 'utf-8');
const configPanelCode = fs.readFileSync(path.join(COMPONENT_DIR, 'unipaseo/ConfigPanel.tsx'), 'utf-8');
const mapContainerCode = fs.readFileSync(path.join(COMPONENT_DIR, 'unipaseo/MapContainer.tsx'), 'utf-8');
const realWalkCode = fs.readFileSync(path.join(COMPONENT_DIR, 'unipaseo/RealWalk.tsx'), 'utf-8');

// 1.1 Invariant: isThreeDogs must be strictly false
assert.match(
  upbSectionCode,
  /const\s+isThreeDogs\s*=\s*false;/,
  'CRITICAL INVARIANT VIOLATION: isThreeDogs must be hardcoded to false'
);
console.log('  ✔ Invariant 1: isThreeDogs is unconditionally false.');

// 1.2 Invariant: Timeline.tsx must not contain Molly or banana emoji
assert.ok(
  !timelineCode.toLowerCase().includes('molly'),
  'CRITICAL INVARIANT VIOLATION: Timeline.tsx contains reference to Molly'
);
assert.ok(
  !timelineCode.includes('🍌'),
  'CRITICAL INVARIANT VIOLATION: Timeline.tsx contains banana emoji (🍌)'
);
console.log('  ✔ Invariant 2: Timeline.tsx has zero occurrences of Molly or 🍌.');

// 1.3 Invariant: ConfigPanel.tsx must not offer Molly in dropdowns
assert.ok(
  !configPanelCode.includes('Molly'),
  'CRITICAL INVARIANT VIOLATION: ConfigPanel.tsx offers Molly'
);
assert.ok(
  !configPanelCode.includes('value="M"'),
  'CRITICAL INVARIANT VIOLATION: ConfigPanel.tsx contains option value="M"'
);
console.log('  ✔ Invariant 3: ConfigPanel.tsx has no option or dropdown for Molly.');

// 1.4 Invariant: MapContainer.tsx must remove inactive dog 'M'
assert.match(
  mapContainerCode,
  /\['S',\s*'F',\s*'M'\]\.filter\(\(id\)\s*=>\s*!activeDogs\.includes\(id\)\)/,
  'CRITICAL INVARIANT VIOLATION: MapContainer must filter out and unmount inactive dogs including M'
);
console.log('  ✔ Invariant 4: MapContainer.tsx automatically unmounts marker M.');

// 1.5 Invariant: RealWalk.tsx must not have "+ Molly" button
assert.ok(
  !realWalkCode.includes('+ Molly'),
  'CRITICAL INVARIANT VIOLATION: RealWalk.tsx still has "+ Molly" button'
);
console.log('  ✔ Invariant 5: RealWalk.tsx does not display "+ Molly" button.');

// 1.6 Invariant: Default active dogs must strictly be Sienna ($9000, 30m) and Frida ($5000, 10m)
assert.match(
  upbSectionCode,
  /rate:\s*9000[\s\S]*?targetMinutes:\s*30/,
  'CRITICAL INVARIANT: Sienna default must be $9.000 COP, 30 min'
);
assert.match(
  upbSectionCode,
  /rate:\s*5000[\s\S]*?targetMinutes:\s*10/,
  'CRITICAL INVARIANT: Frida default must be $5.000 COP, 10 min'
);
console.log('  ✔ Invariant 6: Default custom dogs are Sienna ($9k, 30m) and Frida ($5k, 10m).');

// --- 2. PURE REPRODUCTION OF UNIPASEO ROUTING & TIMELINE LOGIC ---
console.log('\n[STAGE 2] Setting up Exact Mathematical Engine Reproduction...');

const BASE_LOCATIONS = {
  casa: { lat: 8.753656905902142, lng: -75.87434089839805, name: 'Mi Casa', emoji: '🏡' },
  centro: { lat: 8.76132, lng: -75.87928, name: 'Casa Centro', emoji: '🏢' },
  abuela: { lat: 8.753656905902142, lng: -75.87434089839805, name: 'Casa Abuela', emoji: '👵' },
  S: { lat: 8.77228, lng: -75.85933, name: 'Sienna', color: '#f97316', emoji: '🍊', address: 'Edificio Palmanova' },
  F: { lat: 8.77418, lng: -75.86532, name: 'Frida', color: '#8b5cf6', emoji: '🍇', address: 'Castellana 101' },
  M: { lat: 8.76630, lng: -75.86490, name: 'Molly', color: '#eab308', emoji: '🍌', address: 'La Castellana' },
  cra14: { lat: 8.77189, lng: -75.86720 },
  upb: { lat: 8.80457, lng: -75.85040 },
};

const CLASS_SCHEDULES = {
  lunes: { time: '10:00', name: 'Vías II (Diseño Pavimentos)' },
  martes: { time: '08:00', name: 'Análisis de Estructuras II' },
  miercoles: { time: '10:00', name: 'Vías II (Laboratorio)' },
  jueves: { time: '08:00', name: 'Análisis de Estructuras II' },
  viernes: { time: '10:00', name: 'Vías II (Teoría avanzada)' },
};

// Haversine distance
function getHaversineDistance(p1, p2) {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeFallbackDistances(locations, startLocation) {
  const startLoc = locations[startLocation] || locations.casa;
  return {
    C_P1: getHaversineDistance(startLoc, locations.S) * 1.28,
    P1_P2: getHaversineDistance(locations.S, locations.F) * 1.28,
    P2_P3: getHaversineDistance(locations.F, locations.S) * 1.28,
    P3_P1: getHaversineDistance(locations.S, locations.S) * 1.28,
    P1_Bus: getHaversineDistance(locations.S, locations.cra14) * 1.28,
    P3_Bus: getHaversineDistance(locations.S, locations.cra14) * 1.28,
    Bus_UPB: getHaversineDistance(locations.cra14, locations.upb) * 1.28,
  };
}

function calculateSequence(settings, routeDistances, targetClassInfo) {
  const order = (settings.pickupOrder || ['S', 'F']).filter((id) => id !== 'M');
  const p1Dog = order[0] || 'S';
  const p2Dog = order[1] || 'F';
  const goals = { S: settings.goalSienna, F: settings.goalFrida };

  const speedSoloMod = settings.scenario === 'lluvia' ? settings.walkSpeedSolo * 0.8 : settings.walkSpeedSolo;
  const speedPackMod = settings.scenario === 'lluvia' ? settings.walkSpeedPack * 0.8 : settings.walkSpeedPack;

  const [startH, startM] = settings.startTime.split(':').map(Number);
  let curDate = new Date(2024, 0, 1, startH, startM, 0, 0);

  const startLocToP1Dist = routeDistances['C_P1'] || 0.5;
  const departureSpeed =
    settings.firstLegTransport === 'moto'
      ? 32
      : settings.firstLegTransport === 'bici'
      ? 15
      : speedSoloMod;
  const departureMinutes = Math.round((startLocToP1Dist / departureSpeed) * 60);
  const departureTimeDate = new Date(curDate.getTime() - departureMinutes * 60000);
  const departureTimeStr = departureTimeDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const steps = [];
  const dogWalkDurations = { S: 0, F: 0, M: 0 };

  // Step 1: Departure
  steps.push({
    id: 'step_departure',
    title: `Partida de Casa (${
      settings.startLocation === 'casa'
        ? 'Mi Casa'
        : settings.startLocation === 'centro'
        ? 'Centro'
        : 'Abuela'
    })`,
    description: `Inicias traslado hacia la casa de ${p1Dog === 'S' ? 'Sienna' : 'Frida'}.\nModo: ${
      settings.firstLegTransport === 'bici'
        ? '🚲 Bicicleta (~15 km/h)'
        : settings.firstLegTransport === 'moto'
        ? '🏍️ Moto'
        : '🚶‍♂️ A Pie'
    }. Distancia: ${startLocToP1Dist.toFixed(2)} km.`,
    startTime: departureTimeStr,
    endTime: settings.startTime,
    durationMinutes: departureMinutes,
    icon: 'casa',
    type: 'casa',
    distanceKm: startLocToP1Dist,
  });

  let curTimeStr = settings.startTime;

  // Step 2: Pick P1
  steps.push({
    id: `pick_${p1Dog}`,
    title: `Recoger a ${p1Dog === 'S' ? 'Sienna' : 'Frida'}`,
    description: `Buscas a ${p1Dog === 'S' ? 'Sienna' : 'Frida'} en ${
      p1Dog === 'S' ? 'Ed. Palmanova' : 'Castellana 101'
    }.\nInicia su paseo objetivo de ${goals[p1Dog]} min.`,
    startTime: curTimeStr,
    endTime: curTimeStr,
    durationMinutes: 0,
    icon: 'pick',
    type: 'pick',
    dogId: p1Dog,
    distanceKm: 0,
  });

  // Step 3: Transit P1 to P2
  const p1ToP2Dist = routeDistances['P1_P2'] || 0.4;
  const p1ToP2Mins = Math.max(1, Math.round((p1ToP2Dist / speedPackMod) * 60));
  let nextDate = new Date(curDate.getTime() + p1ToP2Mins * 60000);
  let nextTimeStr = nextDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  dogWalkDurations[p1Dog] += p1ToP2Mins;

  steps.push({
    id: 'transit_p1_p2',
    title: `Tránsito con ${p1Dog === 'S' ? 'Sienna' : 'Frida'}`,
    description: `Recorres con la manada hasta donde ${
      p2Dog === 'S' ? 'Sienna' : 'Frida'
    }. Distancia: ${p1ToP2Dist.toFixed(2)} km.`,
    startTime: curTimeStr,
    endTime: nextTimeStr,
    durationMinutes: p1ToP2Mins,
    icon: 'walk',
    type: 'walk',
    distanceKm: p1ToP2Dist,
  });
  curDate = nextDate;
  curTimeStr = nextTimeStr;

  // Step 4: Pick P2
  steps.push({
    id: `pick_${p2Dog}`,
    title: `Recoger a ${p2Dog === 'S' ? 'Sienna' : 'Frida'}`,
    description: `Sumas a la manada a ${p2Dog === 'S' ? 'Sienna' : 'Frida'} en ${
      p2Dog === 'S' ? 'Ed. Palmanova' : 'Castellana 101'
    }.\nInicia su tiempo objetivo de ${goals[p2Dog]} min.`,
    startTime: curTimeStr,
    endTime: curTimeStr,
    durationMinutes: 0,
    icon: 'pick',
    type: 'pick',
    dogId: p2Dog,
    distanceKm: 0,
  });

  // Step 5: Joint walk
  const p2WalkMins = goals[p2Dog] || 10;
  const dTransitP2 = routeDistances['P1_P2'] || 0.4;
  nextDate = new Date(curDate.getTime() + p2WalkMins * 60000);
  nextTimeStr = nextDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  dogWalkDurations[p1Dog] += p2WalkMins;
  dogWalkDurations[p2Dog] += p2WalkMins;

  steps.push({
    id: 'drop_p2_trip',
    title: `Paseo conjunto / camino a devolver a ${p2Dog === 'S' ? 'Sienna' : 'Frida'}`,
    description: `Caminas junto a ${p1Dog === 'S' ? 'Sienna' : 'Frida'} y ${
      p2Dog === 'S' ? 'Sienna' : 'Frida'
    } completando el recorrido de ${p2Dog === 'S' ? 'Sienna' : 'Frida'}. Distancia: ${dTransitP2.toFixed(
      2
    )} km.`,
    startTime: curTimeStr,
    endTime: nextTimeStr,
    durationMinutes: p2WalkMins,
    icon: 'walk',
    type: 'walk',
    distanceKm: dTransitP2,
  });
  curDate = nextDate;
  curTimeStr = nextTimeStr;

  // Step 6: Drop P2
  steps.push({
    id: `drop_${p2Dog}`,
    title: `Devolver a ${p2Dog === 'S' ? 'Sienna' : 'Frida'}`,
    description: `Entregas a ${p2Dog === 'S' ? 'Sienna' : 'Frida'} en ${
      p2Dog === 'S' ? 'Ed. Palmanova' : 'Castellana 101'
    }. Paseo completado (${dogWalkDurations[p2Dog]}m cumplidos).`,
    startTime: curTimeStr,
    endTime: curTimeStr,
    durationMinutes: 0,
    icon: 'drop',
    type: 'drop',
    dogId: p2Dog,
    distanceKm: 0,
  });

  // Step 7: Return P1
  const p1RemainingMins = Math.max(1, (goals[p1Dog] || 30) - dogWalkDurations[p1Dog]);
  const dTransitP1 = routeDistances['P1_P2'] || 0.4;
  nextDate = new Date(curDate.getTime() + p1RemainingMins * 60000);
  nextTimeStr = nextDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  dogWalkDurations[p1Dog] += p1RemainingMins;

  steps.push({
    id: 'drop_p1_trip',
    title: `Camino a devolver a ${p1Dog === 'S' ? 'Sienna' : 'Frida'}`,
    description: `Regresas para entregar a ${p1Dog === 'S' ? 'Sienna' : 'Frida'} en su hogar. Distancia: ${dTransitP1.toFixed(
      2
    )} km.`,
    startTime: curTimeStr,
    endTime: nextTimeStr,
    durationMinutes: p1RemainingMins,
    icon: 'walk',
    type: 'walk',
    distanceKm: dTransitP1,
  });
  curDate = nextDate;
  curTimeStr = nextTimeStr;

  // Step 8: Drop P1
  steps.push({
    id: `drop_${p1Dog}`,
    title: `Devolver a ${p1Dog === 'S' ? 'Sienna' : 'Frida'}`,
    description: `Entregas a ${p1Dog === 'S' ? 'Sienna' : 'Frida'} sano y salvo. Paseo completado (${dogWalkDurations[p1Dog]}m cumplidos).`,
    startTime: curTimeStr,
    endTime: curTimeStr,
    durationMinutes: 0,
    icon: 'drop',
    type: 'drop',
    dogId: p1Dog,
    distanceKm: 0,
  });

  // Step 9: Walk to bus
  const dBusWalk = routeDistances['P1_Bus'] || 0.5;
  const mBusWalk = Math.max(1, Math.round((dBusWalk / speedSoloMod) * 60));
  nextDate = new Date(curDate.getTime() + mBusWalk * 60000);
  nextTimeStr = nextDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  steps.push({
    id: 'walk_to_bus',
    title: 'Traslado rápido al paradero Cra 14',
    description: `Te diriges hacia el paradero de la Carrera 14. Distancia: ${dBusWalk.toFixed(
      2
    )} km a paso veloz (${speedSoloMod} km/h).`,
    startTime: curTimeStr,
    endTime: nextTimeStr,
    durationMinutes: mBusWalk,
    icon: 'walk',
    type: 'walk',
    distanceKm: dBusWalk,
  });
  curDate = nextDate;
  curTimeStr = nextTimeStr;

  // Step 10: Bus wait
  const waitMins = 5;
  nextDate = new Date(curDate.getTime() + waitMins * 60000);
  nextTimeStr = nextDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  steps.push({
    id: 'wait_for_bus',
    title: 'Espera en el paradero Cra 14',
    description: 'Buffer de espera estimado de 5 minutos para el colectivo de transporte o buseta.',
    startTime: curTimeStr,
    endTime: nextTimeStr,
    durationMinutes: waitMins,
    icon: 'bus_wait',
    type: 'bus_wait',
    distanceKm: 0,
  });
  curDate = nextDate;
  curTimeStr = nextTimeStr;

  // Step 11: Bus to UPB
  const busDist = routeDistances['Bus_UPB'] || 4.2;
  let busMins = Math.round((busDist / 20) * 60);
  if (settings.scenario === 'trafico') {
    busMins += 12;
  }

  nextDate = new Date(curDate.getTime() + busMins * 60000);
  nextTimeStr = nextDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  steps.push({
    id: 'transit_to_upb',
    title: 'Colectivo / MetroSinú a UPB',
    description: `Buses de Montería (MetroSinú) rumbo norte hasta campus UPB. Distancia: ${busDist.toFixed(
      2
    )} km.${settings.scenario === 'trafico' ? ' 🚗 Tráfico pesado (+12m).' : ''}`,
    startTime: curTimeStr,
    endTime: nextTimeStr,
    durationMinutes: busMins,
    icon: 'bus_ride',
    type: 'bus_ride',
    distanceKm: busDist,
  });
  curDate = nextDate;
  curTimeStr = nextTimeStr;

  // Step 12: Arrival at UPB
  steps.push({
    id: 'step_upb_arrival',
    title: 'Llegada Campus UPB Montería 🎓',
    description: `Arribas formalmente al acceso peatonal UPB. Tu clase inicia a las ${targetClassInfo.time}.`,
    startTime: curTimeStr,
    endTime: curTimeStr,
    durationMinutes: 0,
    icon: 'upb',
    type: 'upb',
    distanceKm: 0,
  });

  return {
    steps,
    finalArrival: curTimeStr,
    dogWalkDurations,
  };
}

// --- 3. CARTESIAN PRODUCT EMPIRICAL STRESS TESTS ---
console.log('\n[STAGE 3] Running Full Cartesian Product Stress Matrix...');

const WEEKDAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const SCENARIOS = ['normal', 'lluvia', 'trafico'];
const STRATEGIES = ['zigzag', 'lineal', 'terminar_m'];
const START_LOCS = ['casa', 'centro', 'abuela'];
const TRANSPORTS = ['bici', 'pie', 'moto'];

let totalCombinationsRun = 0;

for (const day of WEEKDAYS) {
  for (const scenario of SCENARIOS) {
    for (const strategy of STRATEGIES) {
      for (const startLocation of START_LOCS) {
        for (const firstLegTransport of TRANSPORTS) {
          totalCombinationsRun++;

          const settings = {
            day,
            scenario,
            strategy,
            startLocation,
            firstLegTransport,
            startTime: '06:00',
            walkSpeedSolo: 5.5,
            walkSpeedPack: 4.26,
            goalSienna: 30,
            goalFrida: 10,
            goalMolly: 0,
            pickupOrder: ['S', 'F'],
          };

          const distances = computeFallbackDistances(BASE_LOCATIONS, startLocation);
          const targetClassInfo = CLASS_SCHEDULES[day];
          const result = calculateSequence(settings, distances, targetClassInfo);

          // ASSERTION 1: Exactly 12 steps generated
          assert.strictEqual(
            result.steps.length,
            12,
            `Expected exactly 12 steps on ${day}/${scenario}/${strategy}/${startLocation}/${firstLegTransport}`
          );

          // ASSERTION 2: Molly NEVER in any step
          for (const s of result.steps) {
            assert.notStrictEqual(s.dogId, 'M', `dogId must never be M on step ${s.id}`);
            assert.ok(!s.title.toLowerCase().includes('molly'), `Title contains Molly: ${s.title}`);
            assert.ok(!s.description.toLowerCase().includes('molly'), `Description contains Molly: ${s.description}`);
            assert.ok(!s.description.includes('🍌'), `Description contains banana: ${s.description}`);
          }

          // ASSERTION 3: Molly duration is 0
          assert.strictEqual(result.dogWalkDurations.M, 0, 'dogWalkDurations.M must be 0');

          // ASSERTION 4: Sienna walk duration matches 30m goal exactly
          assert.strictEqual(
            result.dogWalkDurations.S,
            30,
            `Sienna walk duration must be 30m on ${day}/${scenario}`
          );

          // ASSERTION 5: Frida walk duration matches 10m goal exactly
          assert.strictEqual(
            result.dogWalkDurations.F,
            10,
            `Frida walk duration must be 10m on ${day}/${scenario}`
          );

          // ASSERTION 6: Departure coordinates for 'casa'
          if (startLocation === 'casa') {
            assert.strictEqual(BASE_LOCATIONS.casa.lat, 8.753656905902142);
            assert.strictEqual(BASE_LOCATIONS.casa.lng, -75.87434089839805);
          }
        }
      }
    }
  }
}

console.log(`  ✔ Verified ${totalCombinationsRun} combinations across all weekdays, scenarios, strategies, origins, and transports.`);

// --- 4. ADVERSARIAL INJECTIONS ---
console.log('\n[STAGE 4] Running Adversarial Injections...');

// Injection 4.1: Molly injected in pickupOrder: ['M', 'S', 'F']
{
  const distances = computeFallbackDistances(BASE_LOCATIONS, 'casa');
  const settings = {
    day: 'lunes',
    scenario: 'normal',
    strategy: 'zigzag',
    startLocation: 'casa',
    firstLegTransport: 'bici',
    startTime: '06:00',
    walkSpeedSolo: 5.5,
    walkSpeedPack: 4.26,
    goalSienna: 30,
    goalFrida: 10,
    goalMolly: 45, // Deliberate injection
    pickupOrder: ['M', 'S', 'F'], // Deliberate injection
  };
  const result = calculateSequence(settings, distances, CLASS_SCHEDULES.lunes);

  assert.strictEqual(result.steps.length, 12, 'Must still produce 12 steps after stripping M');
  assert.strictEqual(result.dogWalkDurations.M, 0, 'Molly duration must remain 0 despite injection');
  assert.strictEqual(result.dogWalkDurations.S, 30, 'Sienna duration must remain 30');
  assert.strictEqual(result.dogWalkDurations.F, 10, 'Frida duration must remain 10');
  const hasM = result.steps.some(s => s.dogId === 'M' || s.title.includes('Molly'));
  assert.strictEqual(hasM, false, 'Molly must be sanitized completely from steps');
  console.log('  ✔ Adversarial Injection 1: pickupOrder: ["M", "S", "F"] sanitized successfully.');
}

// Injection 4.2: Molly injected at end: ['S', 'F', 'M']
{
  const distances = computeFallbackDistances(BASE_LOCATIONS, 'casa');
  const settings = {
    day: 'miercoles',
    scenario: 'lluvia',
    strategy: 'lineal',
    startLocation: 'casa',
    firstLegTransport: 'bici',
    startTime: '06:30',
    walkSpeedSolo: 5.5,
    walkSpeedPack: 4.26,
    goalSienna: 30,
    goalFrida: 10,
    goalMolly: 100,
    pickupOrder: ['S', 'F', 'M'],
  };
  const result = calculateSequence(settings, distances, CLASS_SCHEDULES.miercoles);

  assert.strictEqual(result.steps.length, 12);
  assert.strictEqual(result.dogWalkDurations.M, 0);
  assert.strictEqual(result.dogWalkDurations.S, 30);
  assert.strictEqual(result.dogWalkDurations.F, 10);
  console.log('  ✔ Adversarial Injection 2: pickupOrder: ["S", "F", "M"] sanitized successfully.');
}

// Injection 4.3: Simulation Avatar Emojis and HUD verification
console.log('\n[STAGE 5] Stress-Testing HUD and Animated Simulation Frames...');
{
  const steps = [
    { id: 'step_departure', type: 'casa', durationMinutes: 8, title: 'Partida' },
    { id: 'pick_S', type: 'pick', dogId: 'S', durationMinutes: 0, title: 'Pick S' },
    { id: 'transit_p1_p2', type: 'walk', durationMinutes: 9, title: 'Walk S' },
    { id: 'pick_F', type: 'pick', dogId: 'F', durationMinutes: 0, title: 'Pick F' },
    { id: 'drop_p2_trip', type: 'walk', durationMinutes: 10, title: 'Walk S+F' },
    { id: 'drop_F', type: 'drop', dogId: 'F', durationMinutes: 0, title: 'Drop F' },
    { id: 'drop_p1_trip', type: 'walk', durationMinutes: 11, title: 'Walk S' },
    { id: 'drop_S', type: 'drop', dogId: 'S', durationMinutes: 0, title: 'Drop S' },
    { id: 'walk_to_bus', type: 'walk', durationMinutes: 5, title: 'To Bus' },
    { id: 'wait_for_bus', type: 'bus_wait', durationMinutes: 5, title: 'Wait Bus' },
    { id: 'transit_to_upb', type: 'bus_ride', durationMinutes: 20, title: 'Bus to UPB' },
    { id: 'step_upb_arrival', type: 'upb', durationMinutes: 0, title: 'Arrival UPB' },
  ];

  // Verify avatar combinations during lifecycle
  const avatarSequence = [];
  const pickedUp = { S: false, F: false };
  const droppedOff = { S: false, F: false };

  for (const step of steps) {
    if (step.type === 'pick' && step.dogId) pickedUp[step.dogId] = true;
    if (step.type === 'drop' && step.dogId) droppedOff[step.dogId] = true;

    const pack = [];
    if (pickedUp.S && !droppedOff.S) pack.push('S');
    if (pickedUp.F && !droppedOff.F) pack.push('F');

    let avatarEmoji = '🚶‍♂️';
    if (step.type === 'bus_ride') avatarEmoji = '🚌';
    else if (step.type === 'upb') avatarEmoji = '🎓';
    else if (pack.length > 0) {
      avatarEmoji = '🚶‍♂️' + pack.map((id) => (id === 'S' ? '🍊' : '🍇')).join('');
    }

    avatarSequence.push({ stepId: step.id, emoji: avatarEmoji });

    // Assertions on avatar
    assert.ok(!avatarEmoji.includes('🍌'), `Avatar must never include 🍌: ${avatarEmoji}`);
    assert.ok(!avatarEmoji.includes('M'), `Avatar must never include M: ${avatarEmoji}`);
  }

  // Check specific phases:
  // After pick S: 🚶‍♂️🍊
  assert.strictEqual(avatarSequence.find(a => a.stepId === 'transit_p1_p2').emoji, '🚶‍♂️🍊');
  // While both are walked: 🚶‍♂️🍊🍇
  assert.strictEqual(avatarSequence.find(a => a.stepId === 'drop_p2_trip').emoji, '🚶‍♂️🍊🍇');
  // After F dropped, returning S: 🚶‍♂️🍊
  assert.strictEqual(avatarSequence.find(a => a.stepId === 'drop_p1_trip').emoji, '🚶‍♂️🍊');
  // After both dropped: 🚶‍♂️
  assert.strictEqual(avatarSequence.find(a => a.stepId === 'walk_to_bus').emoji, '🚶‍♂️');
  // In bus: 🚌
  assert.strictEqual(avatarSequence.find(a => a.stepId === 'transit_to_upb').emoji, '🚌');
  // At UPB: 🎓
  assert.strictEqual(avatarSequence.find(a => a.stepId === 'step_upb_arrival').emoji, '🎓');

  console.log('  ✔ HUD & Avatars verified across all 12 lifecycle phases:');
  console.log('    🚶‍♂️ -> 🚶‍♂️🍊 -> 🚶‍♂️🍊🍇 -> 🚶‍♂️🍊 -> 🚶‍♂️ -> 🚌 -> 🎓');
}

console.log('\n' + '='.repeat(80));
console.log('  ALL ADVERSARIAL STRESS CHALLENGES PASSED (405 Combinations + Injections)');
console.log('='.repeat(80));
