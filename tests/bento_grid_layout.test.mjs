import fs from 'fs';

const bioFile = fs.readFileSync('G:/Mi unidad/Proyecto personal/VYFITH/components/PersonalBioAssistant.tsx', 'utf8');
const healthFile = fs.readFileSync('G:/Mi unidad/Proyecto personal/VYFITH/components/UnifiedHealthFitnessSection.tsx', 'utf8');
const googleHealthFile = fs.readFileSync('G:/Mi unidad/Proyecto personal/VYFITH/components/GoogleHealthConnector.tsx', 'utf8');
const biomedicalFile = fs.readFileSync('G:/Mi unidad/Proyecto personal/VYFITH/components/BiomedicalIntelligencePanel.tsx', 'utf8');
const hevyFile = fs.readFileSync('G:/Mi unidad/Proyecto personal/VYFITH/components/HevyWorkoutsSection.tsx', 'utf8');

const checks = [
  // 1. PersonalBioAssistant checks
  { name: 'BioAssistant: Root is 12-col Bento Grid', ok: bioFile.includes('grid grid-cols-1 lg:grid-cols-12 gap-4 items-start') },
  { name: 'BioAssistant: Left column is lg:col-span-5', ok: bioFile.includes('className="lg:col-span-5 space-y-4"') },
  { name: 'BioAssistant: Right column is lg:col-span-7', ok: bioFile.includes('className="lg:col-span-7"') },
  { name: 'BioAssistant: Contains compact 2x2 personal cards', ok: bioFile.includes('grid grid-cols-2 gap-3') },
  { name: 'BioAssistant: Contains 2x2 engineering project cards', ok: bioFile.includes('grid grid-cols-1 sm:grid-cols-2 gap-2.5') },

  // 2. UnifiedHealthFitnessSection checks
  { name: 'HealthSection: Fila 1 & 2 use Bento Grid lg:grid-cols-12', ok: healthFile.includes('grid grid-cols-1 lg:grid-cols-12 gap-4 items-start') },
  { name: 'HealthSection: Fila 1 Izquierda has GoogleHealthConnector', ok: healthFile.includes('<GoogleHealthConnector hideNestedSuites={true} />') },
  { name: 'HealthSection: Fila 1 Derecha has MiFitnessHealthSuite', ok: healthFile.includes('<MiFitnessHealthSuite />') },
  { name: 'HealthSection: Fila 2 Izquierda has BiomedicalIntelligencePanel + UpbGymStatusAndKpis', ok: healthFile.includes('<BiomedicalIntelligencePanel />') && healthFile.includes('<UpbGymStatusAndKpis />') },
  { name: 'HealthSection: Fila 2 Derecha has MuscleHeatmap', ok: healthFile.includes('<MuscleHeatmap />') },
  { name: 'HealthSection: Fila 4 uses Bento Grid (Femmto + UPB Schedule)', ok: healthFile.includes('FILA 4: COMPOSICIÓN CORPORAL FEMMTO (lg:col-span-6) & MATRIZ DE HORARIOS UPB / SIGAA (lg:col-span-6)') },

  // 3. GoogleHealthConnector checks
  { name: 'GoogleHealth: Readiness fallback is 67', ok: googleHealthFile.includes('readinessScore ?? 67') },
  { name: 'GoogleHealth: Body Battery RHR is 62 bpm', ok: googleHealthFile.includes('restingHeartRate ?? 62') },
  { name: 'GoogleHealth: Metrics grid is responsive without lg:grid-cols-7', ok: googleHealthFile.includes('xl:grid-cols-4 2xl:grid-cols-7') },
  { name: 'GoogleHealth: FHIR table hidden in Bento mode', ok: googleHealthFile.includes('Últimas Observaciones Biométricas HL7 FHIR') && googleHealthFile.indexOf('Últimas Observaciones Biométricas HL7 FHIR') > googleHealthFile.indexOf('{!hideNestedSuites && (') },

  // 4. BiomedicalIntelligencePanel checks
  { name: 'Biomedical: No my-8 margin on root', ok: !biomedicalFile.includes('my-8 rounded-3xl') },
  { name: 'Biomedical: 5-metric grid is responsive', ok: biomedicalFile.includes('grid-cols-2 sm:grid-cols-3 xl:grid-cols-5') },

  // 5. HevyWorkoutsSection checks
  { name: 'Hevy: Exercises are in 2-3 column grid', ok: hevyFile.includes('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4') },
  { name: 'Hevy: No narrow max-w container', ok: !hevyFile.includes('max-w-4xl mx-auto') && !hevyFile.includes('max-w-3xl mx-auto') }
];

let failed = 0;
console.log('================================================================================');
console.log('  TEST SUITE: BENTO GRID LAYOUT & ARCHITECTURE AUDIT');
console.log('================================================================================');

for (const c of checks) {
  if (c.ok) {
    console.log(`  ✔ PASS: ${c.name}`);
  } else {
    console.error(`  ✖ FAIL: ${c.name}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n✖ ${failed} layout assertions failed.`);
  process.exit(1);
} else {
  console.log('================================================================================');
  console.log(`  ✔ ALL ${checks.length} BENTO GRID ARCHITECTURAL ASSERTIONS PASSED (100%)`);
  console.log('================================================================================');
}
