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
    estructurasAcum: number;
    estructurasNeeded: number;
    suelosAcum: number;
    presupuestoAcum: number;
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

### 🐕 SIMULADOR DE PASEOS Y RUTINAS UPB (MOTOR MATEMÁTICO REAL):
- **Algoritmo de Cálculo Retroactivo (Backtracking):** Implementado en \`components/UpbWalkSimulatorSection.tsx\` y \`lib/walkSimulatorStore.ts\`.
- **Clientes y Tarifas:**
  * **Sienna (Elena):** 40 min de paseo base ($9.000 COP) en La Castellana \`[8.77228, -75.85933]\`.
  * **Frida (Laura):** 30 min de paseo base ($5.850 COP) \`[8.77418, -75.86532]\`.
  * **Ingreso diario proyectado:** +$14.850 COP directo a tus finanzas.
- **Tiempos de Traslado y Preparación:**
  * Alistamiento en casa (ducha, hidratación, mochila): 20 min.
  * Mi Casa: Coordenadas exactas [8.753656905902142, -75.87434089839805].
  * Transporte habitual: 100% en Bicicleta (~15-18 km/h). Traslado a UPB (Km 8 Vía Cereté): ~25-28 min en bicicleta.
  * Margen de seguridad (Buffer de puntualidad): 10 min antes del inicio de clase.
- **Cronograma Calculado para Días con Clase a las 08:00 AM (Martes / Jueves):**
  * 1. **Alarma / Despertar:** **05:00 AM** (15 min previo con ropa cómoda).
  * 2. **Salida al Paseo:** **05:45 AM** (40 min totales con correa: Sienna 30m + Frida 10m).
  * 3. **Regreso a Casa:** **06:25 AM** (Ducha rápida de 20 min + hidratación).
  * 4. **Salida a UPB:** **06:45 AM** (Ruta Cereté de 25 min).
  * 5. **Llegada al Aula:** **07:50 AM** (+10 min de holgura antes de clase a las 08:00 AM).
  * **Evaluación Térmica Montería:** **Óptimo (Pata Fresca 🐾)** porque finaliza antes de las 06:45 AM, protegiendo las almohadillas de los perros del calor de Montería.
- **Días con Clase a las 10:00 AM (Lunes / Miércoles / Viernes):**
  * El retrocálculo arrojaría paseo a las 07:15 AM y regreso a las 08:25 AM, pero a esa hora el asfalto supera los 35°C (**Alerta Calor Montería 🔥**).
  * **Regla de Oro:** Siempre aconsejar mantener el paseo en la ventana fresca de la madrugada (**05:30 AM**), dejando un bloque libre de 07:00 a 09:30 AM para desayunar, estudiar o ir al gimnasio institucional UPB.
- **Impacto Biométrico:** La rutina matutina genera **~4,500 pasos** y **~200 kcal** aeróbicas previas antes de cualquier clase.
- **Bloqueo Matutino de Gimnasio:** La franja de 05:00 a 07:45 AM está **COMPLETAMENTE BLOQUEADA** por trabajo canino y traslado a la universidad.

### 🏋️ GIMNASIO UPB & HEVY:
- **Ventana de Entrenamiento Recomendada (Martes y Jueves):**
  * **Hueco Dorado Mañana (10:00 – 11:30 AM):** Inmediatamente después de salir de Análisis de Estructuras (09:40 AM). Es el momento perfecto para entrenar **Tren Superior (Brazos, Deltoides o Espalda)** liberando el estrés cognitivo del cálculo matricial, mientras las piernas asimilan la caminata matutina.
  * **Opción Tarde (16:00 – 17:30 PM):** Al salir de Mecánica de Suelos (15:40) y antes de Presupuesto (18:00), con ducha obligatoria antes de clase.
- **Meta Física:** Subir de 57 kg a **60 kg de masa muscular magra y limpia** (170 cm, 8 abdominales visibles).

### 📚 ACADEMIA UPB (6.° SEMESTRE):
- **Análisis de Estructuras (NRC 52885):** Acumulado **2.11 / 5.00** sobre el 70%. Para aprobar y desbloquear Concreto I, necesita sacar **2.97 (~3.0)** en el Examen Final (30%) de mañana jueves (08:00 – 09:40 AM en Aula 109, Edificio B2).
- **Mecánica de Suelos:** Acumulado **2.45 / 5.00** (asegurada para pasar a Cimentaciones).
- **Programación y Presupuesto:** Acumulado **2.55 / 5.00** (tras el 4.40 en el Quiz).

### 💰 FINANZAS NU & DEUDAS:
- **Cajita Nu (9.30% E.A.):** ~$116.929 COP.
- **Efectivo:** $5.000 COP.
- **Por cobrar:** $25.000 COP (Laura, 5 paseos de Frida).
- **Pasivo pendiente:** $22.000 COP a Daniela Bula.
- **Deuda Moral con Yessid:** $580.000 COP. Regla innegociable: saldar esta deuda antes de comprar el iPhone 15 Pro ($1.950.000 COP).
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
- **Simulador de Paseos y Rutinas UPB (${walkAnalysis.day.toUpperCase()}):**
  * Primera clase UPB: ${walkAnalysis.classTime} | Buffer al aula: 10 min (Llegada ${walkAnalysis.sim.upbArrivalTime}).
  * Salida de casa hacia UPB Km 8: ${walkAnalysis.sim.homeDepartureTime} (25 min de viaje).
  * Regreso de paseos a casa: ${walkAnalysis.sim.walkReturnTime} (20 min para ducha y alistamiento).
  * Salida a paseos caninos: ${walkAnalysis.sim.recommendedWalkDepartureTime} (Sienna 40m + Frida 30m = 70 min).
  * Alarma matutina: ${walkAnalysis.sim.recommendedWakeUpTime}.
  * Confort térmico en Montería: ${walkAnalysis.sim.thermalRisk}.
  * Ingreso diario proyectado: +$${walkAnalysis.incomeDay.toLocaleString('es-CO')} COP.
- **Gimnasio & Hevy:** Última sesión: "${snapshot.hevy?.lastWorkoutName || 'Horizontal Torso (Chest & Back)'}" con tonelaje de ${snapshot.hevy?.totalVolumeKg?.toLocaleString('es-CO') || '4,484'} kg (${snapshot.hevy?.date || 'ayer'}).
- **Finanzas Nu:** Saldo líquido en Cajita Nu: $116.929 COP | Efectivo: $5.000 COP | Por cobrar Laura: $25.000 COP | Deuda Daniela: $22.000 COP | Compromiso Yessid: $580.000 COP.
- **Academia UPB:** Análisis de Estructuras acumulado 2.11 / 5.00 (requiere 2.97 en Examen Final) | Suelos: 2.45 | Presupuesto: 2.55.
- **Ventana óptima de gym:** 10:00 - 11:30 AM (Hueco Dorado) o 16:00 - 17:30 PM.`;
  }

  const megaBlock = megaProyectoNotes && megaProyectoNotes.trim()
    ? `\n\n### 📓 CONOCIMIENTO INTEGRAL DE MEGAPROYECTO (OBSIDIAN CEREBRO):\n${megaProyectoNotes.trim()}`
    : '';

  return `${SANTIAGO_SYSTEM_INSTRUCTION}${liveBlock}${megaBlock}`;
}
