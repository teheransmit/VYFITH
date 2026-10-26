/**
 * Base de Conocimiento Oficial y Sistema de Instrucción de Santiago Smit Teherán Mogollón
 * Utilizado por el asistente interactivo IA con Google Gemini 3.5 Flash y fallback semántico local.
 */

export const SANTIAGO_SYSTEM_INSTRUCTION = `
Eres el Copiloto y Asistente Interactivo Oficial de Santiago Smit Teherán Mogollón (19 años, estudiante de 6° semestre de Ingeniería Civil en la UPB Seccional Montería, ID: 000533630).

### 🎯 DIRECTIVAS CRÍTICAS DE ESTILO Y PRESENTACIÓN (CERO RESPUESTAS MALUCAS):
1. **Claridad y Elegancia Ejecutiva:**
   - Evita la sobrecarga de markdown: CERO títulos repetitivos (###), NUNCA uses líneas divisorias de guiones (---) ni plantillas rígidas burocráticas.
   - Ve directo al grano: la primera línea debe responder de inmediato a la pregunta con la conclusión o saldo clave.
   - Desglose con viñetas limpias: si hay datos numéricos o materias, usa viñetas concisas con negrita solo en la cifra o término clave.
   - No saludes con fórmulas robóticas como "Aquí tienes el estado actualizado de...". Empieza conversando con naturalidad.

2. **Detección Dinámica de Voz:**
   - **Si el usuario habla en primera persona ("mis finanzas", "mi gym", "mi promedio", "cuánto debo"):** Asume que es el propio Santiago quien te habla. Trátalo de tú con tono de copiloto de confianza, inteligente, ágil y motivador ("Tienes disponible...", "En tu Cajita Nu cuentas con...", "Para tu examen final de Estructuras necesitas...").
   - **Si preguntan en tercera persona ("quién es Santiago", "sus proyectos", "cuál es su perfil"):** Responde en tercera persona como su embajador tecnológico ante reclutadores o colegas ("Santiago es un perfil híbrido...").

3. **Base de Verdad Oficial de Santiago:**
   - **Identidad:** Santiago Smit Teherán Mogollón, 19 años, Montería (Córdoba). Ing. Civil Computacional / Hidroinformático en formación en UPB Montería. Enlaces: GitHub (@teheransmit), Notion oficial.
   - **Finanzas Nu & Liquidez:**
     * Cajita de Ahorro Nu (9.30% E.A.): ~$116.929 COP.
     * Efectivo en mano: $5.000 COP.
     * Total líquido actual: **$121.929 COP**.
     * Cuentas por cobrar: Laura (5 paseos pendientes de Frida a $5.000 = **$25.000 COP**).
     * Cobro recibido: Elena (3 paseos de Sienna = **$50.000 COP**, ya ingresados en Nu).
     * Pasivos pendientes: **$22.000 COP** a Daniela Bula.
     * Balance neto proyectado tras cobro y pago de deuda: **$124.929 COP**.
     * Compromiso próximo: Mensualidad gimnasio UPB de **$49.000 COP** (100% viable con tu liquidez).
     * Viaje a Medellín: 100% concluido y cerrado (sin abonos futuros de papá).
   - **Meta iPhone 15 Pro & Deuda de Honor:**
     * **Regla Innegociable:** Liquidar primero al 100% la deuda moral de palabra con Yessid ($580.000 COP) antes de asignar fondos a la compra del teléfono.
     * **Dispositivo iPhone 15 Pro (256 GB Titanio):** $1.950.000 COP cotizado en Bodega Mayorista Montería (Calle 33-34 con 3ra frente a Óptica Bucaramanga). Grado A+ batería 100% verificada con ciclos <=50 en iOS 17.4+ y test 3uTools en PC.
     * **Combo de Accesorios Cotizados:**
       - Cabeza cargador 20W original Apple: $35.000 COP (precio confirmado canal Bodega Mayorista Montería).
       - Cable USB-C a USB-C carga rápida trenzado: $25.000 COP.
       - Forro / Case silicona reforzada MagSafe: $30.000 COP.
       - Protector de pantalla vidrio cerámico 9D templado: $15.000 COP.
       - Activación chip eSIM Prepago: $5.000 COP.
       - Subtotal Accesorios + eSIM: $110.000 COP.
     * **Presupuesto Total Consolidado:** **$2.060.000 COP**.
     * **Regulación eSIM Prepago en Colombia (Ley 1341 CRC):** NO es obligatorio contratar un plan pospago para usar eSIM. En Tigo se solicita reposición o activación en modalidad prepago en tienda física por ~$5.000 COP. Claro, Movistar y Liwa también permiten prepago sin contratos ni cuotas mensuales forzadas.
   - **Gimnasio y Hevy:**
     * Split de 6 días a la semana en gimnasio UPB ($49.000/mes).
     * Métricas: 57 kg, 170 cm, 8 abdominales visibles.
     * Meta: **60 kg de masa muscular limpia y magra**.
     * Foco de hipertrofia: Tríceps, antebrazos y pantorrillas. Registro riguroso en Hevy (tonelaje, series efectivas W/F/D, RPE).
   - **Academia UPB (PGA 3.93 | Saber 11 Matemáticas 74/100, Percentil 97 Colombia):**
     * Materias destacadas aprobadas: Ecuaciones Diferenciales (5.00), Álgebra Lineal (4.53), Programación (4.63), Fluidos (4.30), Vías I (4.26).
     * Semestre 2026-II: Cursando 13 créditos.
     * **Análisis de Estructuras (NRC 52885):** Acumulado 2.11 / 5.00 (70% evaluado, avance 5: 3.70). Requiere nota de **2.97 (~3.0)** en el examen final para aprobar y desbloquear Concreto I.
     * **Mecánica de Suelos:** Acumulado 2.45 / 5.00 (prácticamente aprobada, asegura Cimentaciones).
     * Vías II, Fundamentos de Hidrología y Presupuesto de Obras.
     * Inglés institucional: 9 niveles aprobados (Upper Intermediate 4.00; Threshold cancelado formalmente).
   - **Proyectos de Software:**
     * colouring-monteria: Plataforma de datos espaciales y huella constructiva de Montería.
     * Horario-: Aplicación web con NRCs y exportación en PDF embebida en Notion.
     * VYFITH: Plataforma de salud biométrica HL7 FHIR, Hevy y finanzas personales.
     * Guías Zapatas & Columnas para UPB.
   - **Rutina canina:** Paseo de Frida 5:50 AM diaria.
`.trim();

/**
 * Fallback semántico local enriquecido cuando no hay internet o no hay API Key disponible.
 */
export function localSemanticFallback(query: string): string {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (q.includes('iphone') || q.includes('celular') || q.includes('telefono') || q.includes('yessid') || q.includes('esim') || q.includes('cargador') || q.includes('forro') || q.includes('pantalla')) {
    return [
      'Tu presupuesto y estrategia para el **iPhone 15 Pro (256 GB Titanio)**:',
      '',
      '• **Regla de Honor #1:** Saldar primero los **$580.000 COP** con tu mejor amigo Yessid antes de comprar el celular.',
      '• **Dispositivo base:** **$1.950.000 COP** (Bodega Mayorista Montería, Calle 33-34 con 3ra frente a Óptica Bucaramanga, Grado A+ batería 100%).',
      '• **Combo de Accesorios:** **$110.000 COP**',
      '  - Cabeza cargador original 20W Apple: $35.000 COP (confirmado en bodega).',
      '  - Cable USB-C a USB-C trenzado: $25.000 COP.',
      '  - Forro MagSafe reforzado: $30.000 COP.',
      '  - Protector cerámico 9D: $15.000 COP.',
      '  - Activación eSIM Prepago: $5.000 COP.',
      '• **Presupuesto Total Meta:** **$2.060.000 COP**.',
      '• **eSIM 100% Prepago (Ley 1341 CRC):** Cero planes pospago obligatorios. Puedes activar o reponer tu eSIM en prepago en Tigo ($5.000 COP en tienda) o Claro/Liwa sin amarrarte a mensualidades fijas.'
    ].join('\n');
  }

  if (q.includes('finanza') || q.includes('dinero') || q.includes('nu') || q.includes('cajita') || q.includes('plata') || q.includes('ahorro') || q.includes('debo')) {
    return [
      'Tienes un total líquido disponible de **$121.929 COP** ($116.929 COP en tu Cajita Nu al 9.30% E.A. y $5.000 COP en efectivo).',
      '',
      'Detalles clave de tus cuentas:',
      '• **Por cobrar:** $25.000 COP de Laura por 5 paseos de Frida.',
      '• **Cobrado:** $50.000 COP de Elena por Sienna (ya ingresados en Nu).',
      '• **Pasivo:** $22.000 COP pendientes con Daniela Bula.',
      '• **Próximo compromiso:** Mensualidad del gym UPB ($49.000 COP), 100% cubierta con tu capital disponible.',
      '',
      'Al cobrar lo de Frida y saldar con Daniela, tu saldo neto libre será de **$124.929 COP**.'
    ].join('\n');
  }

  if (q.includes('gym') || q.includes('hevy') || q.includes('deporte') || q.includes('meta') || q.includes('fisic') || q.includes('entrenar') || q.includes('peso')) {
    return [
      'Tu estado físico y disciplina deportiva en Hevy:',
      '',
      '• **Métricas actuales:** 57 kg de peso corporal, 170 cm de estatura y 8 abdominales visibles.',
      '• **Meta principal:** Alcanzar **60 kg de masa muscular magra y limpia**.',
      '• **Enfoque muscular:** Hipertrofia prioritaria en tríceps, antebrazos y pantorrillas.',
      '• **Rutina:** Split de 6 días semanales en el gimnasio UPB con monitoreo exacto de tonelaje, series efectivas y RPE.'
    ].join('\n');
  }

  if (q.includes('estructura') || q.includes('concreto') || q.includes('nrc 52885') || q.includes('examen final')) {
    return [
      'En **Análisis de Estructuras** (NRC 52885) tienes acumulado **2.11 / 5.00** sobre el 70% calificado (último avance calificado con 3.70).',
      '',
      'Para aprobar la materia y desbloquear **Concreto I**, necesitas sacar una nota mínima de **2.97 (~3.0)** en el Examen Final. Es tu asignatura foco del semestre.'
    ].join('\n');
  }

  if (q.includes('suelo') || q.includes('geotecnia')) {
    return 'En **Mecánica de Suelos** acumulas **2.45 / 5.00** sobre el 70% evaluado. Tienes la materia prácticamente asegurada para continuar sin tropiezos hacia Cimentaciones en 7° semestre.';
  }

  if (q.includes('semestre') || q.includes('upb') || q.includes('nota') || q.includes('academ') || q.includes('pga') || q.includes('materia')) {
    return [
      'Tu rendimiento académico en UPB Montería (6° Semestre, 2026-II):',
      '',
      '• **PGA Global:** **3.93 / 5.00** con más de 80 créditos aprobados.',
      '• **Materias en curso:** Análisis de Estructuras (acumulado 2.11, meta 2.97), Mecánica de Suelos (2.45 asegurada), Vías II, Fundamentos de Hidrología y Presupuesto de Obras Civiles.',
      '• **Hito Saber 11:** 323 puntos y **74/100 en Matemáticas (Percentil 97 Nacional — Top 3% de Colombia)**.'
    ].join('\n');
  }

  if (q.includes('proyecto') || q.includes('software') || q.includes('github') || q.includes('repo')) {
    return [
      'Tus proyectos tecnológicos destacados:',
      '',
      '• **colouring-monteria:** Plataforma open-source de cartografía de atributos constructivos y huella urbana en Montería.',
      '• **Horario-:** Aplicación interactiva de horarios universitarios con NRCs y exportación PDF, embebida en tu Notion oficial.',
      '• **VYFITH:** Plataforma de salud biométrica HL7 FHIR, entrenamientos Hevy y finanzas personales.',
      '• **Guías Zapatas & Columnas:** Manuales técnicos de diseño de cimentaciones para UPB.'
    ].join('\n');
  }

  if (q.includes('perro') || q.includes('frida') || q.includes('sienna') || q.includes('paseo')) {
    return [
      'Tu rutina y cobros de paseos caninos:',
      '',
      '• **Frida:** Paseo diario a las 5:50 AM. Tienes 5 paseos pendientes por cobrar a Laura ($25.000 COP).',
      '• **Sienna:** 3 paseos completados con Elena ($50.000 COP cobrados y depositados en tu cuenta Nu).'
    ].join('\n');
  }

  return [
    '**Santiago Smit Teherán Mogollón** (19 años, UPB Montería, PGA 3.93) es un Ingeniero Civil Computacional e Hidroinformático en formación.',
    '',
    'Combina la física de las estructuras, la mecánica de fluidos y la geotecnia con la programación avanzada (Next.js, Python, PyQGIS, TypeScript), entrenamientos rigurosos en Hevy (57 kg ➔ 60 kg) y una gestión financiera estructurada en Nu Colombia.'
  ].join('\n');
}
