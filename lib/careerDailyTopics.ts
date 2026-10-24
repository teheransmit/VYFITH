export interface CareerDailyTopic {
  id: string;
  title: string;
  hook: string;
  discipline: string;
  prompt: string;
}

export interface CareerTopicQuiz {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const CAREER_DAILY_TOPICS: CareerDailyTopic[] = [
  { id: 'airplane-wings', title: '¿Cómo vuelan las alas de un avión?', hook: 'Sustentación, presión y estructuras aeronáuticas.', discipline: 'Mecánica y estructuras', prompt: 'Explica cómo una carga distribuida termina convirtiéndose en esfuerzos dentro del ala.' },
  { id: 'tall-buildings', title: '¿Cómo resisten los edificios altos?', hook: 'Viento, rigidez lateral y núcleos estructurales.', discipline: 'Estructuras', prompt: 'Investiga qué sistema lateral usarías para un edificio de 30 pisos y por qué.' },
  { id: 'suspension-bridges', title: '¿Por qué no se cae un puente colgante?', hook: 'Cables, tensiones y distribución de cargas.', discipline: 'Puentes', prompt: 'Dibuja el recorrido de una carga desde el tablero hasta las fundaciones.' },
  { id: 'earthquake-buildings', title: '¿Qué hace que un edificio sobreviva a un sismo?', hook: 'Ductilidad, disipación de energía y detallado.', discipline: 'Ingeniería sísmica', prompt: 'Compara un edificio rígido con uno dúctil ante un movimiento del suelo.' },
  { id: 'dams', title: '¿Cómo soporta una presa la presión del agua?', hook: 'Empuje hidrostático, peso propio y estabilidad.', discipline: 'Hidráulica y geotecnia', prompt: 'Explica dónde aparecen deslizamiento, volcamiento y subpresión.' },
  { id: 'roads', title: '¿Cómo se diseña una carretera para que dure?', hook: 'Subrasante, pavimento, drenaje y tránsito.', discipline: 'Vías y transporte', prompt: 'Relaciona el agua, el suelo y las capas del pavimento en una sección.' },
  { id: 'soil-foundations', title: '¿Cómo sabe una cimentación cuánto puede soportar?', hook: 'Capacidad portante, asentamientos y suelo.', discipline: 'Geotecnia', prompt: 'Describe la diferencia entre falla por capacidad portante y asentamiento excesivo.' },
  { id: 'wind-turbines', title: '¿Cómo se sostiene una torre eólica?', hook: 'Momento flector, vibración y fundación.', discipline: 'Estructuras y energía', prompt: 'Identifica la carga dominante y la forma de llevarla al terreno.' },
  { id: 'concrete', title: '¿Por qué el concreto y el acero trabajan juntos?', hook: 'Compresión, tracción, adherencia y durabilidad.', discipline: 'Concreto estructural', prompt: 'Explica qué material resiste cada zona de una viga de concreto reforzado.' },
  { id: 'water-treatment', title: '¿Cómo se limpia el agua en una planta?', hook: 'Sedimentación, filtración y procesos hidráulicos.', discipline: 'Ambiental e hidráulica', prompt: 'Ordena las etapas de tratamiento y explica qué elimina cada una.' },
  { id: 'city-drainage', title: '¿Cómo evita una ciudad inundarse?', hook: 'Escorrentía, sumideros, colectores y tormentas.', discipline: 'Hidrología urbana', prompt: 'Traza el camino de una gota desde un techo hasta el río.' },
  { id: 'tunnels', title: '¿Cómo se construye un túnel sin que colapse?', hook: 'Macizo rocoso, revestimiento y sostenimiento.', discipline: 'Geotecnia', prompt: 'Compara excavación en suelo blando y en roca.' },
  { id: 'cantilever', title: '¿Cómo puede existir una estructura en voladizo?', hook: 'Empotramiento, momento y equilibrio.', discipline: 'Análisis estructural', prompt: 'Dibuja el diagrama de momento de un voladizo con carga puntual.' },
  { id: 'wind-loads', title: '¿Cómo empuja el viento a un edificio?', hook: 'Presión dinámica, forma y turbulencia.', discipline: 'Cargas estructurales', prompt: 'Explica por qué la geometría cambia la fuerza del viento.' },
  { id: 'construction-cranes', title: '¿Cómo funciona una grúa torre?', hook: 'Contrapesos, estabilidad y momentos.', discipline: 'Construcción', prompt: 'Identifica el punto de giro y las acciones que equilibran la grúa.' },
  { id: 'smart-cities', title: '¿Qué hace inteligente a una ciudad?', hook: 'Datos, movilidad, energía e infraestructura.', discipline: 'Planeación urbana', prompt: 'Propón una solución de datos para reducir un problema de movilidad.' },
];
