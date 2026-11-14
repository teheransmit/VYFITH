import assert from 'node:assert';
import {
  DEFAULT_ACADEMIC_OVERRIDES,
  computeAcademicProjection,
  computeScheduleOverlapMinutes,
} from '../lib/academicReactiveEngine';

console.log('=== Test Suite: Motor Reactivo Académico → Agenda 2027-I ===');

// 1. Estado Real SIGAA + Homologación de Laboratorio Suelos activa (Default)
{
  const proj = computeAcademicProjection(DEFAULT_ACADEMIC_OVERRIDES);

  assert.strictEqual(
    proj.suelosLabSummary.homologationEligible,
    true,
    'Los 3 laboratorios de Suelos (4.57, 4.25, 4.20) deben promediar >= 4.00'
  );
  assert.ok(
    proj.suelosLabSummary.weightedAverage >= 4.35 && proj.suelosLabSummary.weightedAverage <= 4.37,
    `Promedio ponderado esperado ~4.36, obtenido ${proj.suelosLabSummary.weightedAverage}`
  );
  assert.strictEqual(proj.homologationApplied, true);

  const plan = proj.schedule2027Real;
  assert.strictEqual(plan.overlapMinutes, 0, 'El horario 2027-1 no debe tener cruces');
  assert.strictEqual(plan.suelosMode, 'theory_only_homologated');
  assert.strictEqual(plan.morningProtected, true, 'Mañanas L-J protegidas');
  assert.strictEqual(plan.fridayAfternoonFree, true, 'Viernes tarde libre al homologar Lab');

  // Cimentaciones DEBE estar bloqueada y ausente del horario
  assert.ok(
    plan.blockedCourses.some((b) => b.name === 'Cimentaciones' && b.prerequisiteCourseId === 'c-suelos'),
    'Cimentaciones debe estar bloqueada por Suelos 2.50 < 3.000'
  );
  assert.ok(
    !plan.blocks.some((b) => b.name.includes('Cimentaciones')),
    'Cimentaciones no debe aparecer en los bloques de 2027-1'
  );

  // Suelos SOLO tiene bloques de Teoría (Mar 14:00 B3-408 y Jue 14:00 B3-301), CERO Lab 119
  const suelosBlocks = plan.blocks.filter((b) => b.courseId === 'suelos-13812');
  assert.strictEqual(suelosBlocks.length, 2, 'Solo 2 bloques teóricos para Suelos al homologar lab');
  assert.ok(suelosBlocks.every((b) => b.componentType === 'theory'));
  assert.deepStrictEqual(
    suelosBlocks.map((b) => `${b.day} ${b.startTime}`),
    ['Martes 14:00', 'Jueves 14:00']
  );

  // Ética NRC 22674 (Mié 14:00) encaja en el hueco del laboratorio liberado -> 12 cr totales
  assert.ok(
    plan.enrolledCourses.some((c) => c.nrc === 'NRC 22674'),
    'Ética Profesional NRC 22674 debe encajar en Mié 14:00 liberado'
  );
  assert.strictEqual(plan.totalCredits, 12);
  console.log('✔ Test 1: Suelos 2.50 bloquea Cimentaciones y homologación Lab (4.36) deja Solo Teoría + Ética (12 cr, 0 cruces)');
}

// 2. Desactivar Homologación de Laboratorio -> Restaura Lab 119 Mié/Vie y expulsa Ética sin generar cruces
{
  const projNoHomol = computeAcademicProjection({
    ...DEFAULT_ACADEMIC_OVERRIDES,
    homologateSuelosLab: false,
  });
  const plan = projNoHomol.schedule2027Real;

  assert.strictEqual(projNoHomol.homologationApplied, false);
  assert.strictEqual(plan.suelosMode, 'full_theory_and_lab');
  assert.strictEqual(plan.overlapMinutes, 0);
  assert.strictEqual(computeScheduleOverlapMinutes(plan.blocks), 0);

  const suelosBlocks = plan.blocks.filter((b) => b.courseId === 'suelos-13812');
  assert.strictEqual(suelosBlocks.length, 4, 'Sin homologación deben programarse los 4 bloques (Teoría + Lab 119)');
  assert.strictEqual(suelosBlocks.filter((b) => b.componentType === 'lab').length, 2);
  assert.strictEqual(plan.fridayAfternoonFree, false, 'Lab 119 ocupa viernes 14:00');

  // Ética NRC 22674 (Mié 14:00) debe aparecer en conflictos porque choca con Lab Suelos Mié 14:00
  assert.ok(
    plan.skippedForConflict.some((s) => s.nrc === 'NRC 22674'),
    'Ética NRC 22674 debe detectarse en conflicto con Lab 119 Mié 14:00'
  );
  assert.strictEqual(plan.totalCredits, 11);
  console.log('✔ Test 2: Desactivar homologación restaura Mié/Vie Lab 119 y resuelve conflicto con Ética (11 cr, 0 cruces)');
}

// 3. Reprobar Estructuras -> Bloquea Concreto I, programa Estructuras Repetir (Mar/Jue 10:00) y mete Emprendimiento (Mar/Jue 12:00)
{
  const projFailEst = computeAcademicProjection({
    ...DEFAULT_ACADEMIC_OVERRIDES,
    courseStatuses: {
      ...DEFAULT_ACADEMIC_OVERRIDES.courseStatuses,
      'c-estructuras': 'failed',
    },
  });
  const plan = projFailEst.schedule2027Real;

  assert.strictEqual(plan.overlapMinutes, 0);
  assert.ok(plan.blockedCourses.some((b) => b.name === 'Concreto I'));
  assert.ok(plan.enrolledCourses.some((c) => c.nrc === 'NRC 13802'), 'Debe incluir Estructuras repetir NRC 13802');
  assert.ok(
    plan.enrolledCourses.some((c) => c.nrc === 'NRC 21967'),
    'Plan B Emprendimiento debe llenar Mar/Jue 12:00 al bloquearse Concreto I'
  );
  console.log('✔ Test 3: Reprobar Estructuras bloquea Concreto I, agenda NRC 13802 y activa Plan B Emprendimiento');
}

// 4. Reprobar Hidrología -> Bloquea Acueducto & Alcantarillado y programa Hidrología Repetir (sin pisar Lab Suelos)
{
  const projFailHidro = computeAcademicProjection({
    ...DEFAULT_ACADEMIC_OVERRIDES,
    courseStatuses: {
      ...DEFAULT_ACADEMIC_OVERRIDES.courseStatuses,
      'c-hidrologia': 'failed',
    },
  });
  const plan = projFailHidro.schedule2027Real;

  assert.strictEqual(plan.overlapMinutes, 0);
  assert.ok(plan.blockedCourses.some((b) => b.name === 'Acueducto'));
  assert.ok(plan.blockedCourses.some((b) => b.name === 'Alcantarillado'));
  assert.ok(
    plan.enrolledCourses.some((c) => c.nrc === 'NRC 22221' || c.nrc === 'NRC 22222'),
    'Debe programar Fundamentos de Hidrología para repetir sin cruces'
  );
  console.log('✔ Test 4: Reprobar Hidrología bloquea Acueducto/Alcantarillado y reubica Hidrología sin cruces');
}

// 5. Activar Elementos de Ciudad (Vie 14:00-17:20) con Lab Suelos homologado -> Ajusta Gym Viernes a 17:30-19:00
{
  const projCiudad = computeAcademicProjection({
    ...DEFAULT_ACADEMIC_OVERRIDES,
    includeElementosCiudad: true,
  });
  const plan = projCiudad.schedule2027Real;
  assert.strictEqual(plan.overlapMinutes, 0);
  assert.ok(plan.enrolledCourses.some((c) => c.nrc === 'NRC 14026'));
  const friGym = plan.blocks.find((b) => b.day === 'Viernes' && b.componentType === 'gym');
  assert.ok(friGym && friGym.startTime === '17:30', 'Gym del viernes debe desplazarse automáticamente a 17:30');
  console.log('✔ Test 5: Elementos de Ciudad (Vie 14:00) encaja gracias a Lab homologado y desplaza Gym del viernes a 17:30');
}

console.log('\n✅ ALL 5 ACADEMIC REACTIVE ENGINE TESTS PASSED (0 OVERLAP MINUTES)');
