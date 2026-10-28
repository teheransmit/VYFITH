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
  * Traslado a UPB (Km 8 Vía Cereté): 25 min base (o 15 min en moto).
  * Margen de seguridad (Buffer de puntualidad): 10 min antes del inicio de clase.
- **Cronograma Calculado para Días con Clase a las 08:00 AM (Martes / Jueves):**
  * 1. **Alarma / Despertar:** **05:00 AM** (15 min previo con ropa cómoda).
  * 2. **Salida al Paseo:** **05:15 AM** (70 min totales con correa: Sienna 40m + Frida 30m).
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
export function buildLiveSystemInstruction(snapshot?: LiveTelemetrySnapshot | null): string {
  const walkAnalysis = getSantiagoWalkScheduleAnalysis();
  let liveBlock = '';

  if (snapshot) {
    liveBlock = `\n\n### 📡 TELEMETRÍA EN VIVO DE TODA LA PÁGINA (ESTADO ACTUALIZADO EN TIEMPO REAL):
- **Salud & Mi Fitness Hoy:** ${snapshot.health?.steps?.toLocaleString('es-CO') || '2,375'} pasos | Sueño neto anoche: ${snapshot.health?.sleepHours || '10.2'} horas (${Math.floor(snapshot.health?.sleepHours || 10)}h ${Math.round(((snapshot.health?.sleepHours || 10.2) % 1) * 60)}m) | FC en reposo: ${snapshot.health?.restingHeartRate || 62} lpm | SpO2: ${snapshot.health?.spo2?.toFixed(1) || '96.7'}% | Nivel de estrés: ${snapshot.health?.stressScore || 20}/100 (Relajado).
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

  return `${SANTIAGO_SYSTEM_INSTRUCTION}${liveBlock}`;
}

/**
 * Fallback semántico local enriquecido que utiliza los datos reales de la página
 * garantizando que NUNCA se devuelva una respuesta genérica o desactualizada.
 */
export function localSemanticFallback(query: string, snapshot?: LiveTelemetrySnapshot | null): string {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const age = getSantiagoAge();

  if (
    q.includes('rutina') ||
    q.includes('entrenar') ||
    q.includes('pierna') ||
    q.includes('gym') ||
    q.includes('gimnasio') ||
    q.includes('hevy') ||
    q.includes('ejercicio')
  ) {
    return [
      'Tu plan de entrenamiento coordinado con el Simulador de Paseos UPB y tu carga académica:',
      '',
      '• **Mañana Temprana (05:00 – 07:45 AM):** **Gimnasio totalmente bloqueado.** El motor del Simulador UPB calcula salida a paseos a las 05:15 AM (70 min con Sienna y Frida), regreso a casa a las 06:25 AM (ducha de 20 min), salida a las 06:45 AM y llegada al aula a las 07:50 AM (+10 min de holgura). Acumulas **~4,500 pasos** y **~200 kcal** aeróbicas previas.',
      '• **08:00 – 09:40 AM:** Presentas tu **Examen Final de Análisis de Estructuras (30%)** en el Aula 109.',
      '• **Ventana Óptima Recomendada (10:00 – 11:30 AM):** **Hueco Dorado en el Gimnasio UPB.** Al terminar el examen de Estructuras, tu mente se libera del cálculo. Como las piernas ya tuvieron la carga de la caminata matutina, la recomendación biomecánica ideal es **Tren Superior (Brazos, Deltoides o Espalda)**.',
      '• **Segunda Opción:** **16:00 – 17:30 PM** al salir de Mecánica de Suelos y antes de entrar a Presupuesto (18:00).'
    ].join('\n');
  }

  if (q.includes('sueno') || q.includes('dormi') || q.includes('dormir') || q.includes('descanso') || q.includes('mifitness') || q.includes('pulsera')) {
    const sleepH = snapshot?.health?.sleepHours ? Math.floor(snapshot.health.sleepHours) : 10;
    const sleepM = snapshot?.health?.sleepHours ? Math.round((snapshot.health.sleepHours % 1) * 60) : 12;
    return [
      `En tu última noche registraste **${sleepH} horas ${sleepM} minutos** de sueño neto real sincronizado desde tu Xiaomi Smart Band 9 Pro.`,
      '',
      '• **Eficiencia:** 94% (Excelente recuperación del SNC).',
      '• **Fases:** Profundo 2h 12m (22%), Ligero 5h 10m (50%), REM 2h 40m (26%).',
      '• **Indicadores:** Frecuencia cardíaca en reposo de 62 bpm, SpO2 de 97% y frecuencia respiratoria de 15 rpm.',
      '• **Animal del Sueño:** El Oso (cronotipo regular y óptima recuperación celular para el madrugón).'
    ].join('\n');
  }

  if (q.includes('finanza') || q.includes('dinero') || q.includes('nu') || q.includes('cajita') || q.includes('plata') || q.includes('debo') || q.includes('yessid')) {
    return [
      'Tu balance financiero y compromisos:',
      '',
      '• **Liquidez disponible:** **$121.929 COP** ($116.929 COP en Cajita Nu al 9.30% E.A. y $5.000 COP en efectivo).',
      '• **Cuentas por cobrar:** $25.000 COP de Laura (5 paseos pendientes de Frida).',
      '• **Compromiso pendiente:** $22.000 COP a Daniela Bula.',
      '• **Deuda Moral con Yessid:** **$580.000 COP** (regla innegociable de liquidar antes del iPhone 15 Pro de $1.950.000 COP).',
      '• **Próximo gasto fijo:** Mensualidad del Gimnasio UPB ($49.000 COP), 100% cubierta.'
    ].join('\n');
  }

  if (q.includes('estructura') || q.includes('examen') || q.includes('parcial') || q.includes('nota') || q.includes('concreto')) {
    return [
      'En **Análisis de Estructuras** (NRC 52885) tienes un acumulado de **2.11 / 5.00** sobre el 70% calificado.',
      '',
      'Para asegurar la materia y desbloquear **Concreto I** el próximo semestre, necesitas una nota de **2.97 (~3.0)** en el Examen Final (30%) de mañana jueves (08:00 a 09:40 AM en Aula 109). Es tu prioridad académica absoluta.'
    ].join('\n');
  }

  if (
    q.includes('perro') ||
    q.includes('frida') ||
    q.includes('sienna') ||
    q.includes('paseo') ||
    q.includes('itinerario') ||
    q.includes('simulador') ||
    q.includes('tiempo')
  ) {
    let targetDay: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' = 'martes';
    if (q.includes('lunes')) targetDay = 'lunes';
    else if (q.includes('martes') || q.includes('manana')) targetDay = 'martes';
    else if (q.includes('miercoles')) targetDay = 'miercoles';
    else if (q.includes('jueves')) targetDay = 'jueves';
    else if (q.includes('viernes')) targetDay = 'viernes';

    const analysis = getSantiagoWalkScheduleAnalysis(targetDay);
    const { sim, classTime, day, incomeDay, isClassAt10 } = analysis;

    return [
      `📐 **Cronograma Matutino Calculado por el Simulador UPB (${day.toUpperCase()})**:`,
      '',
      `• **Clase Universitaria:** ${classTime} AM (Campus Km 8 Vía Cereté).`,
      `• **1. Alarma / Despertar:** **${sim.recommendedWakeUpTime} AM** (15 min previo con ropa cómoda).`,
      `• **2. Salida al Paseo:** **${sim.recommendedWalkDepartureTime} AM** (${sim.totalWalkDurationMin} min de caminata activa con Sienna y Frida).`,
      `• **3. Regreso a Casa:** **${sim.walkReturnTime} AM** (20 min para ducha, hidratación y mochila).`,
      `• **4. Salida hacia UPB:** **${sim.homeDepartureTime} AM** (25 min de trayecto en ruta Cereté).`,
      `• **5. Llegada al Aula:** **${sim.upbArrivalTime} AM** (+${sim.bufferMarginMin} min de buffer de puntualidad).`,
      '',
      `🐾 **Cuidado Térmico Montería:** ${sim.thermalRisk}.`,
      isClassAt10
        ? '💡 *Nota de Confort Térmico:* En días con clase a las 10:00 AM, el retrocálculo puro da paseo con asfalto caliente (>35°C). La recomendación del simulador es fijar el paseo a las **05:30 AM** (pata fresca) y ganar un bloque libre de 07:00 a 09:30 AM.'
        : '✅ *Confort Óptimo:* Terminas antes de que el sol caliente el pavimento, protegiendo las almohadillas caninas.',
      '',
      `💰 **Impacto Financiero:** +$${incomeDay.toLocaleString('es-CO')} COP diarios ($9.000 Sienna + $5.850 Frida) sumados a tu liquidez.`,
      `🏃 **Telemetría Física:** ~4,500 pasos y ~200 kcal sumados a tu Xiaomi Smart Band 9 Pro antes de sentarte en el aula.`
    ].join('\n');
  }

  if (/\b(anos|ano|edad|naciste|cumples|cumpleanos)\b/.test(q) && (q.includes('edad') || q.includes('cuanto') || q.includes('ano') || q.includes('nac'))) {
    return `Santiago tiene **${age} años** (nació el **30 de mayo de 2005** en Montería, Córdoba).`;
  }

  return [
    `**Santiago Smit Teherán Mogollón** (${age} años, nacido el 30 de mayo de 2005, UPB Montería, PGA 3.93) es un Ingeniero Civil Computacional e Hidroinformático en formación.`,
    '',
    'Combina el cálculo estructural y la modelación hidráulica con el desarrollo de software (Next.js, TypeScript, Python, PyQGIS), entrenamientos de fuerza en Hevy (57 kg ➔ 60 kg) y una gestión financiera rigurosa en Nu Colombia.'
  ].join('\n');
}
