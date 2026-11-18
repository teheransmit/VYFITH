import { calculateWalkSchedule, initialDogs, SimulationResult } from '@/lib/walkSimulatorStore';

/**
 * Base de Conocimiento Oficial y Sistema de Instrucción de Santiago Smit Teherán Mogollón
 * Sincronizado en tiempo real con los 8 pilares de la plataforma VYFITH y el Simulador UPB.
 */

export interface LiveTelemetrySnapshot {
  health?: {
    steps: number;
    sleepHours: number;
    restingHeartRate: number;
    spo2: number;
    stressScore?: number;
    readinessScore?: number;
    weight?: number;
    bodyFatPct?: number;
    skeletalMuscleKg?: number;
    bmi?: number;
    waterL?: number;
    fatFreeMassKg?: number;
  };
  hevy?: {
    lastWorkoutName: string;
    totalVolumeKg: number;
    date: string;
    setsCompleted?: number;
  };
  calendar?: {
    todayEvents: string[];
    tomorrowEvents: string[];
  };
  finance?: {
    cajitaNu: number;
    cash: number;
    receivables: number;
    debtDaniela: number;
    debtYessid: number;
  };
  academic?: {
    pga: number;
    viasAcum: number;
    presupuestoAcum: number;
    suelosAcum: number;
    suelosLabAverage: number;
    homologationApplied: boolean;
    estructurasAcum: number;
    estructurasEvaluatedPct: number;
    hidrologiaAcum: number;
    hidrologiaEvaluatedPct: number;
    blocked2027Courses: string[];
    enrolled2027Courses: string[];
    planned2027Credits: number;
    planned2027NetTuition: number;
  };
}

/**
 * Horario oficial de inicio de clases en la UPB Montería por día.
 */
export const UPB_DAY_CLASSES = {
  lunes: '10:00',
  martes: '08:00', // Análisis de Estructuras (NRC 52885)
  miercoles: '10:00',
  jueves: '08:00',
  viernes: '10:00',
} as const;

/**
 * Calcula con precisión matemática el itinerario matutino usando el motor
 * de backtracking del Simulador de Paseos y Rutinas UPB (walkSimulatorStore).
 */
export function getSantiagoWalkScheduleAnalysis(targetDay?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes') {
  const day = targetDay || 'martes'; // Martes por defecto (día clave de Estructuras)
  const classTime = UPB_DAY_CLASSES[day] || '08:00';

  // Ejecutar el simulador oficial de VYFITH:
  // Sienna (40m) + Frida (30m) = 70 min paseo, 25 min traslado UPB, 20 min alistamiento, 10 min buffer
  const sim = calculateWalkSchedule(
    ['dog-sienna', 'dog-frida'],
    classTime,
    25, // commuteMinutes (Montería Centro -> Campus Km 8)
    20, // prepMinutes (ducha, hidratación, maleta)
    10  // safetyBufferMin (llegada antes de clase)
  );

  const isClassAt10 = classTime === '10:00';

  return {
    day,
    classTime,
    sim,
    isClassAt10,
    dogs: initialDogs.filter((d) => d.id === 'dog-sienna' || d.id === 'dog-frida'),
    incomeDay: 9000 + 5850, // Sienna ($9.000) + Frida ($5.850) = $14.850 COP
  };
}

/**
 * Calcula con precisión la edad de Santiago (nacido el 30 de mayo de 2005).
 */
export function getSantiagoAge(): number {
  const birthDate = new Date(2005, 4, 30); // 30 de mayo de 2005
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(21, age);
}

export const SANTIAGO_SYSTEM_INSTRUCTION = `
Eres el Copiloto Inteligente y Asistente Interactivo Oficial de Santiago Smit Teherán Mogollón.

### 👤 PERFIL OFICIAL:
- **Nombre:** Santiago Smit Teherán Mogollón
- **Edad:** 21 años (nacido el 30 de mayo de 2005 en Montería, Córdoba).
- **Rol:** Ingeniero Civil Computacional e Hidroinformático en formación en la Universidad Pontificia Bolivariana (UPB Seccional Montería, 6.° Semestre, ID: 000533630).
- **Rendimiento Académico:** PGA Global de **3.93 / 5.00**. Hito Saber 11: 323 puntos y **74/100 en Matemáticas (Percentil 97 Colombia — Top 3% Nacional)**.

### 🎯 REGLAS INNEGOCIABLES DE RESPUESTA:
1. **Claridad y Concisión:** Responde de forma directa, ágil y ejecutiva. Cero rodeos, cero saludos burocráticos y cero bloques extensos de markdown innecesario.
2. **Santiago es quien te habla (primera persona):** Trátalo de tú como su copiloto personal de máxima confianza ("Tienes disponible...", "En tu examen de Estructuras necesitas...").
3. **Edad Exacta:** Santiago tiene **21 años** (jamás digas 19).

### 🐕 PASEOS CANINOS & CONTABILIDAD VIVA POR AUTO-INVITE DE GOOGLE CALENDAR:
- **Sistema de Liquidación por Auto-Invite (RSVP) en Google Calendar (\`santiagosmitttt@gmail.com\`):**
  * Santiago programa todos sus paseos en Google Calendar y se auto-invita (\`attendees\`) para confirmar en cada evento:
    - 🟢 **Con Color Sólido (\`accepted\`):** Sí fue o va a ir -> **Suma ganancia real**.
    - ⚪ **Sin Color / Solo Borde (\`needsAction\` / \`tentative\`):** Sin confirmar aún -> **Pendiente por confirmar**.
    - 🔴 **Tachado (\`declined\`):** No fue -> **$0 COP (Descartado)**.
- **Clientes, Horarios Reales en Vacaciones (Nov-Dic 2026) y Tarifas:**
  * **Frida (Cliente: Laura — \`Cll 63 # 6-41 Edificio Castellana 101\`, Tarifa: $5.000 COP/paseo):** Doble jornada: Mañana Lunes a Viernes **06:30 AM** (\`Paseo de Frida\`) y Tarde Martes a Viernes **19:30 PM** (\`Paseo de Frida (Tarde)\`). Hasta 9 paseos/semana ($45.000 COP/semana).
  * **Sienna (Cliente: Elena — \`Cl. 68 # 4-97 Edificio Palmanova\`, Tarifa: $9.000 COP/paseo):** Semana 16-20 Nov a las **15:15 PM** (Mié-Vie); desde el 23 Nov Lunes a Viernes a las **05:55 AM** (antes de Frida).
  * **Molly:** 100% retirada e inactiva ($0 COP).
- **Simulador UniPaseo (\`components/UpbWalkSimulatorSection.tsx\`):**
  * Mi Casa: Coordenadas exactas \`[8.753656905902142, -75.87434089839805]\`.

### 🏋️ GIMNASIO UPB, HEVY & RUTINA EN VACACIONES (NOV-DIC 2026):
- **Estado Actual:** Las clases de \`2026-2\` terminaron el **13 de noviembre de 2026**. En vacaciones, su rutina programada en Google Calendar (con Auto-Invite RSVP) es:
  * **Lunes (16:00 – 18:00):** \`Horizontal Torso (Chest & Back)\` + \`20:20 Baño de recuperación térmica\`.
  * **Martes (17:00 – 19:00):** \`Vertical & Incline Torso (Chest & Back)\` + \`20:45 Baño de recuperación térmica\`.
  * **Miércoles (17:00 – 19:00):** \`Full Legs\` + \`20:20 Baño de recuperación térmica\`.
  * **Jueves (16:00 – 18:00):** \`Arms & Shoulders\` + \`20:45 Baño de recuperación térmica\`.
  * **Viernes (08:00 – 10:00):** \`Full Legs\`.
- **Meta Física:** Subir de 55.7 kg / 57 kg a **60 kg de masa muscular magra y limpia** (170 cm, 8 abdominales visibles).

### 📚 ACADEMIA UPB (SEMESTRE 2026-II CERRADO AL 100% EN SIGAA → PROYECCIÓN 2027-I):
- **Semestre 2026-II (\`202620\`) 100% Finalizado:** Clases terminadas el 13/nov/2026 y 100% de notas definitivas ya cargadas en SIGAA (86 créditos aprobados acumulados de 142: 80 históricos + 6 aprobados en 2026-II):
  1. ✅ **Vías II (NRC 52893 / 8825-0027, 3 cr):** **APROBADA** con **4.03 / 5.00** (100%). Habilita **Transporte** y **Pavimentos**.
  2. ✅ **Programación y Presupuesto (NRC 52914 / 8825-0028, 3 cr):** **APROBADA** con **3.63 / 5.00** (100%). Habilita **Contratación y Legislación**.
  3. ❌ **Mecánica de Suelos (NRC 52906 / 8825-0050, 3 cr):** **REPROBADA** con **2.50 / 5.00** (100%) -> **Bloquea Cimentaciones** y repite en 2027-1 (NRC 13812). Sus 3 laboratorios (4.57, 4.25, 4.20) promedian **4.36 ≥ 4.00**, habilitando homologación de laboratorio para cursar **únicamente Teoría** (Mar/Jue 14:00) y liberar Mié/Vie 14:00.
  4. ❌ **Análisis de Estructuras (NRC 52885 / 8825-0049, 2 cr):** **REPROBADA** con **2.71 / 5.00** (100%, sin redondeo) -> **Bloquea Concreto I** y repite en 2027-1 (NRC 13801/13802).
  5. ❌ **Fundamentos de Hidrología (NRC 52910 / 8825-0030, 2 cr):** **REPROBADA** con **2.896 / 5.00** (100%, a -0.104 de 3.000; SIGAA jamás redondea) -> **Bloquea Acueducto y Alcantarillado** y repite en 2027-1 (NRC 22221/22222).

### 💰 FINANZAS NU & DEUDAS:
- **Cajita Nu (9.30% E.A.):** ~$116.929 COP.
- **Efectivo:** $5.000 COP.
- **Ingresos por Paseos Caninos:** Calculados en vivo desde Google Calendar Auto-Invite (\`computeWalksIncomeFromCalendar\`).
- **Pasivo Daniela Bula:** **$0 COP (100% PAGADO Y EXTINTO)**.
- **Viaje a Medellín (8-12 Oct 2026):** **100% CONCLUIDO**.
- **Deuda Moral con Yessid:** **$550.000 COP** (se abonaron $30.000 COP de los $580.000 iniciales; prioridad #1 antes del iPhone).
- **Meta Hardware N.° 1 (El iPhone):** Requisito inmutable: **Dynamic Island** (iPhone 14 Pro, iPhone 15, iPhone 15 Pro o iPhone 16) con **mínimo 256 GB**. El Vivo Y20 actual está en estado crítico.
- **Meta Hardware N.° 2 (Post-iPhone):** **Tablet con lápiz óptico (stylus)**, funda con teclado y mouse para notas a mano y clases, más renovación de ropa personal.
- **Padre de Santiago (Papá) y Titular del Beneficio UPB:** Su papá es **Jader Smit Teherán Sierra** (\`CC 73182538\`, \`ID UPB 000327911\`, \`jader.teheran@upb.edu.co\`), Técnico Radio Operador de planta en **Frecuencia Bolivariana 1160 AM** (UPB Montería), titular del beneficio \`Categoría C — Auxilio TBEA 95% Empleados\` (descuento del 95% en pregrado, inglés y futura especialización) y quien le transfiere \`$450.000 a $550.000 COP\` por semestre para matrícula + gimnasio UPB.
- **Entorno Familiar y Hogar:** Vive con su abuela, su primo (asume servicios y comida) y un tío en Montería. Su otro tío en Medellín (Ingeniero de Sistemas) apoya con el arriendo en Montería. Su hermano menor estudia en colegio público (tarjeta diferencial MetroSinú a \`$0 COP\`).
- **Movilidad Real:** Se mueve principalmente a pie o en la bicicleta de su primo (en mañanas libres). Transporte público en MetroSinú con tarjeta de colegio público de su hermano (\`$0 COP\`) o su propia Tarifa Diferencial estudiantil (\`$1.000 COP\`, Sisbén \`B6\`).
- **Vocación en Ingeniería Civil:** Pasión por **modelación computacional e hidroinformática** (software: QGIS / PyQGIS, ArcGIS, HEC-RAS, CivilCAD).
- **Idiomas:** Inglés B1 en consolidación a B2 (Nivel 10 de 12 en UPB + Duolingo).
- **Plan Académico-Laboral a Futuro:** Trabajar 1-2 años ejerciendo tras graduarse y realizar la **Especialización en la UPB Montería con 95% de descuento** (2 años, solo sábados).
`.trim();

/**
 * Genera el prompt enriquecido inyectando la telemetría en vivo de toda la página
 * y los cálculos matemáticos del Simulador de Paseos y Rutinas UPB.
 */
export function buildLiveSystemInstruction(
  snapshot?: LiveTelemetrySnapshot | null,
  megaProyectoNotes?: string
): string {
  const walkAnalysis = getSantiagoWalkScheduleAnalysis();
  let liveBlock = '';

  if (snapshot) {
    liveBlock = `\n\n### 📡 TELEMETRÍA EN VIVO DE TODA LA PÁGINA (ESTADO ACTUALIZADO EN TIEMPO REAL):
- **Salud & Mi Fitness Hoy:** ${snapshot.health?.steps?.toLocaleString('es-CO') || '2,375'} pasos | Sueño neto anoche: ${snapshot.health?.sleepHours || '10.2'} horas (${Math.floor(snapshot.health?.sleepHours || 10)}h ${Math.round(((snapshot.health?.sleepHours || 10.2) % 1) * 60)}m) | FC en reposo: ${snapshot.health?.restingHeartRate || 62} lpm | SpO2: ${snapshot.health?.spo2?.toFixed(1) || '96.7'}% | Nivel de estrés: ${snapshot.health?.stressScore || 20}/100 (Relajado).
- **Composición Corporal Báscula Femmto (28/Oct):** Peso: ${snapshot.health?.weight || 55.7} kg | Grasa corporal (PGC): ${snapshot.health?.bodyFatPct || 10.6}% (5.9 kg de grasa) | MME (Masa muscular esquelética): ${snapshot.health?.skeletalMuscleKg || 25.1} kg | IMC: ${snapshot.health?.bmi || 18.8} kg/m² | Masa libre de grasa: ${snapshot.health?.fatFreeMassKg || 49.8} kg | Agua: ${snapshot.health?.waterL || 32.8} L | Meta: Superávit limpio hacia 60 kg manteniendo definición.
- **Gimnasio & Hevy:** Última sesión: "${snapshot.hevy?.lastWorkoutName || 'Full Legs'}" con tonelaje de ${snapshot.hevy?.totalVolumeKg?.toLocaleString('es-CO') || '4,484'} kg (${snapshot.hevy?.date || '10 nov 2026'}).
- **Finanzas Nu & Deudas:** Saldo líquido en Cajita Nu: $116.929 COP | Efectivo: $5.000 COP | Pasivo Daniela Bula: $0 COP (Pagado) | Compromiso Yessid: $550.000 COP restantes.
- **Academia UPB (Semestre 2026-II Cerrado al 100% en SIGAA → Agenda 2027-I, PGA ${snapshot.academic?.pga ?? 3.93}):** Vías II ${snapshot.academic?.viasAcum?.toFixed(2) ?? '4.03'} (✅ Aprobada) | Presupuesto ${snapshot.academic?.presupuestoAcum?.toFixed(2) ?? '3.63'} (✅ Aprobada) | Suelos ${snapshot.academic?.suelosAcum?.toFixed(2) ?? '2.50'} (❌ Reprobada, Lab ${snapshot.academic?.suelosLabAverage?.toFixed(2) ?? '4.36'} homologable → Solo Teoría Mar/Jue 14:00) | Estructuras ${snapshot.academic?.estructurasAcum?.toFixed(2) ?? '2.71'} (❌ Reprobada al 100%) | Hidrología ${snapshot.academic?.hidrologiaAcum?.toFixed(2) ?? '2.90'} (❌ Reprobada 2.896 al 100%). Bloqueadas 2027-1: ${snapshot.academic?.blocked2027Courses?.join(', ') || 'Cimentaciones, Concreto I, Acueducto y Alcantarillado'}. Plan 2027-1 activo (${snapshot.academic?.planned2027Credits ?? 12} cr, $${(snapshot.academic?.planned2027NetTuition ?? 381000).toLocaleString('es-CO')} TBEA): ${snapshot.academic?.enrolled2027Courses?.join(' • ') || 'Suelos Solo Teoría, Estructuras, Hidrología, Transporte, Ética, Inglés Nivel 10'}.`;
  }

  const megaBlock = megaProyectoNotes && megaProyectoNotes.trim()
    ? `\n\n### 📓 CONOCIMIENTO INTEGRAL DE MEGAPROYECTO (OBSIDIAN CEREBRO):\n${megaProyectoNotes.trim()}`
    : '';

  return `${SANTIAGO_SYSTEM_INSTRUCTION}${liveBlock}${megaBlock}`;
}
