import assert from 'node:assert/strict';
import {
  UPB_GYM_WEEKLY_SCHEDULE,
  getUpbGymLiveStatus,
  SIGAA_BANNER_URL,
  DATA_QUALITY_EMAIL,
} from '../lib/upbGymStore.ts';

console.log('='.repeat(80));
console.log('  TESTING UPB GYM STORE & SCHEDULE ENGINE');
console.log('='.repeat(80));

let passes = 0;
let fails = 0;

function runTest(name, fn) {
  process.stdout.write(`[GYM-TEST] ${name}... `);
  try {
    fn();
    console.log('PASSED ✔');
    passes++;
  } catch (err) {
    console.log('FAILED ✖');
    console.error(err);
    fails++;
  }
}

// 1. Validar configuración oficial y constantes
runTest('Constantes oficiales: URL de SIGAA y Correo institucional', () => {
  assert.ok(SIGAA_BANNER_URL.includes('BannerGeneralSsb'));
  assert.equal(DATA_QUALITY_EMAIL, 'calidaddeldato.monteria@upb.edu.co');
});

// 2. Horarios por día: Lunes a Jueves vs Viernes
runTest('Horarios Lunes a Jueves: 6:00-11:30 y 16:00-19:00', () => {
  const monday = UPB_GYM_WEEKLY_SCHEDULE.find((d) => d.dayName === 'Lunes');
  assert.ok(monday);
  assert.equal(monday.shifts.length, 2);
  assert.equal(monday.shifts[0].startTime, '06:00');
  assert.equal(monday.shifts[0].endTime, '11:30');
  assert.equal(monday.shifts[1].startTime, '16:00');
  assert.equal(monday.shifts[1].endTime, '19:00');
});

runTest('Horario Viernes: 6:00-11:00 y 16:00-19:00', () => {
  const friday = UPB_GYM_WEEKLY_SCHEDULE.find((d) => d.dayName === 'Viernes');
  assert.ok(friday);
  assert.equal(friday.shifts.length, 2);
  assert.equal(friday.shifts[0].startTime, '06:00');
  assert.equal(friday.shifts[0].endTime, '11:00'); // Cierre temprano el viernes
  assert.equal(friday.shifts[1].startTime, '16:00');
  assert.equal(friday.shifts[1].endTime, '19:00');
});

// 3. Fines de semana cerrados
runTest('Sábados y Domingos cerrados', () => {
  const sat = UPB_GYM_WEEKLY_SCHEDULE.find((d) => d.dayName === 'Sábado');
  const sun = UPB_GYM_WEEKLY_SCHEDULE.find((d) => d.dayName === 'Domingo');
  assert.equal(sat.isOpenDay, false);
  assert.equal(sun.isOpenDay, false);
});

// 4. Prueba determinista de Estado en Tiempo Real (getUpbGymLiveStatus)
runTest('Simulación Lunes 07:30 a.m. -> ABIERTO AHORA (Turno Mañana)', () => {
  // 2026-10-26 es Lunes
  const testDate = new Date('2026-10-26T07:30:00-05:00');
  const status = getUpbGymLiveStatus(testDate);
  assert.equal(status.isOpenNow, true);
  assert.equal(status.currentShiftName, 'Turno Mañana');
  assert.equal(status.closingInMinutes, 240); // 11:30 - 07:30 = 4h = 240 min
});

runTest('Simulación Lunes 13:00 p.m. -> CERRADO (Intermedio)', () => {
  const testDate = new Date('2026-10-26T13:00:00-05:00');
  const status = getUpbGymLiveStatus(testDate);
  assert.equal(status.isOpenNow, false);
  assert.ok(status.nextOpeningText.includes('16:00'));
});

runTest('Simulación Lunes 16:30 p.m. -> ABIERTO AHORA (Turno Tarde)', () => {
  const testDate = new Date('2026-10-26T16:30:00-05:00');
  const status = getUpbGymLiveStatus(testDate);
  assert.equal(status.isOpenNow, true);
  assert.equal(status.currentShiftName, 'Turno Tarde');
  assert.equal(status.closingInMinutes, 150); // 19:00 - 16:30 = 2h 30m = 150 min
});

runTest('Simulación Viernes 11:15 a.m. -> CERRADO (Cerró a las 11:00)', () => {
  // 2026-10-30 es Viernes
  const testDate = new Date('2026-10-30T11:15:00-05:00');
  const status = getUpbGymLiveStatus(testDate);
  assert.equal(status.isOpenNow, false);
  assert.ok(status.nextOpeningText.includes('16:00'));
});

// 5. Verificación de ventanas óptimas cruzadas con clases de Santiago
runTest('Cruce de Clases: Martes Hueco Dorado 10:00 - 11:30 libre de Estructuras y Suelos', () => {
  const tuesday = UPB_GYM_WEEKLY_SCHEDULE.find((d) => d.dayName === 'Martes');
  const goldWindow = tuesday.recommendedWindows.find((w) => w.isPrimary);
  assert.ok(goldWindow);
  assert.equal(goldWindow.timeRange, '10:00 - 11:30');
  assert.ok(goldWindow.strategyNote.includes('09:40'));
});

console.log('='.repeat(80));
console.log(`  RESUMEN: ${passes} PASARON, ${fails} FALLARON`);
console.log('='.repeat(80));

if (fails > 0) process.exit(1);
