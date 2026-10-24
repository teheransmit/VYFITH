export type StudyTopicStatus = 'pending' | 'in_progress' | 'completed' | 'review';

export interface StructuralStudyTopic {
  id: string;
  title: string;
  area: string;
  summary: string;
  difficulty: 'base' | 'intermedio' | 'alto';
  estimatedMinutes: number;
  examWeight: 'alta' | 'media' | 'base';
  exercise: string;
  checkpoints: string[];
}

export const STRUCTURAL_EXAM_DATE = '2026-10-29';

export const STRUCTURAL_STUDY_TOPICS: StructuralStudyTopic[] = [
  {
    id: 'fundamentos-cargas',
    title: 'Fundamentos y cargas',
    area: 'Bases',
    summary: 'Sistemas estructurales, cargas, áreas tributarias y métodos de diseño.',
    difficulty: 'base',
    estimatedMinutes: 45,
    examWeight: 'base',
    exercise: 'Clasifica las cargas de una viga de piso y dibuja sus áreas tributarias.',
    checkpoints: ['Identifica el sistema resistente', 'Distingue carga puntual y distribuida', 'Justifica el área tributaria'],
  },
  {
    id: 'estabilidad-determinacion',
    title: 'Estabilidad y determinación',
    area: 'Bases',
    summary: 'Equilibrio, estabilidad y clasificación de estructuras estáticamente determinadas.',
    difficulty: 'base',
    estimatedMinutes: 45,
    examWeight: 'base',
    exercise: 'Determina si una estructura plana es estable, determinada o indeterminada.',
    checkpoints: ['Cuenta reacciones e incógnitas', 'Aplica equilibrio', 'Explica el mecanismo posible'],
  },
  {
    id: 'diagramas-vigas',
    title: 'Diagramas en vigas',
    area: 'E.E.D.',
    summary: 'Ecuaciones, cortante y momento flector en vigas.',
    difficulty: 'intermedio',
    estimatedMinutes: 60,
    examWeight: 'alta',
    exercise: 'Resuelve una viga cargada, construye V(x) y M(x), y verifica el máximo momento.',
    checkpoints: ['Define tramos', 'Calcula reacciones', 'Relaciona carga-cortante-momento', 'Verifica unidades'],
  },
  {
    id: 'viga-conjugada',
    title: 'Viga conjugada',
    area: 'Deflexiones',
    summary: 'Deflexiones y giros mediante el método de la viga conjugada.',
    difficulty: 'intermedio',
    estimatedMinutes: 60,
    examWeight: 'alta',
    exercise: 'Obtén el giro y la deflexión máxima de una viga usando su diagrama M/EI.',
    checkpoints: ['Construye M/EI', 'Transforma apoyos', 'Ubica el punto de interés', 'Comprueba el signo'],
  },
  {
    id: 'trabajo-virtual',
    title: 'Trabajo virtual',
    area: 'E.E.D.',
    summary: 'Maxwell-Betti y trabajo virtual aplicado a armaduras, vigas y marcos.',
    difficulty: 'alto',
    estimatedMinutes: 75,
    examWeight: 'alta',
    exercise: 'Calcula el desplazamiento de un punto de una armadura por trabajo virtual.',
    checkpoints: ['Define sistema real y virtual', 'Calcula fuerzas internas', 'Suma productos NnL/AE', 'Interpreta el resultado'],
  },
  {
    id: 'fhe',
    title: 'F.H.E. horizontal',
    area: 'Deflexiones',
    summary: 'Deflexiones horizontales y procedimiento de compatibilidad.',
    difficulty: 'alto',
    estimatedMinutes: 60,
    examWeight: 'media',
    exercise: 'Determina el desplazamiento horizontal de un marco con una carga lateral.',
    checkpoints: ['Define grados de libertad', 'Plantea compatibilidad', 'Usa el método correcto', 'Revisa deformada'],
  },
  {
    id: 'metodo-fuerzas',
    title: 'Método de las fuerzas',
    area: 'E.E.I.',
    summary: 'Análisis de estructuras estáticamente indeterminadas por compatibilidad.',
    difficulty: 'alto',
    estimatedMinutes: 90,
    examWeight: 'alta',
    exercise: 'Resuelve una estructura con un grado de indeterminación usando una redundante.',
    checkpoints: ['Calcula el grado de indeterminación', 'Escoge la redundante', 'Formula compatibilidad', 'Obtén reacciones finales'],
  },
  {
    id: 'pendiente-deflexion',
    title: 'Pendiente-deflexión',
    area: 'E.E.I.',
    summary: 'Relaciones de giro, desplazamiento y momentos de extremo.',
    difficulty: 'alto',
    estimatedMinutes: 90,
    examWeight: 'alta',
    exercise: 'Plantea y resuelve las ecuaciones de pendiente-deflexión de un pórtico.',
    checkpoints: ['Define convenciones', 'Escribe ecuaciones', 'Aplica condiciones de apoyo', 'Comprueba equilibrio'],
  },
  {
    id: 'distribucion-momentos',
    title: 'Distribución de momentos',
    area: 'E.E.I.',
    summary: 'Rigideces, factores de distribución, momentos de empotramiento y balance.',
    difficulty: 'alto',
    estimatedMinutes: 90,
    examWeight: 'alta',
    exercise: 'Analiza una viga continua por distribución de momentos y verifica los nudos.',
    checkpoints: ['Calcula rigideces', 'Obtén factores de distribución', 'Balancea iteraciones', 'Verifica suma de momentos'],
  },
  {
    id: 'cypecad-modelacion',
    title: 'Cypecad y modelación',
    area: 'Aplicación',
    summary: 'Cargas, modelo estructural y acción sísmica en Cypecad.',
    difficulty: 'intermedio',
    estimatedMinutes: 60,
    examWeight: 'media',
    exercise: 'Audita un modelo: apoyos, cargas, niveles, combinaciones y acción sísmica.',
    checkpoints: ['Revisa geometría', 'Verifica cargas', 'Comprueba apoyos', 'Identifica errores de modelación'],
  },
];

export function getTopicById(id: string) {
  return STRUCTURAL_STUDY_TOPICS.find((topic) => topic.id === id);
}
