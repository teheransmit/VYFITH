export interface GradeItem {
  name: string;
  weight: number; // Porcentaje en decimal (ej. 0.15 para 15%)
  grade?: number;
  status: 'graded' | 'pending' | 'provisional';
}

export interface CourseGrade {
  id: string;
  code: string; // NRC o CRN de SIGAA
  name: string;
  credits: number;
  professor: string;
  linea: string;
  evaluatedPercent: number; // % evaluado a la fecha (ej. 70)
  accumulatedPoints: number; // Puntos ganados sobre 5.00 (ej. 2.11)
  currentAverage: number; // Promedio de lo evaluado (ej. 3.01)
  neededForPassing: number; // Nota requerida en lo que falta para pasar con 3.00
  neededFor35: number; // Nota requerida para 3.50
  maxPossible: number; // Nota máxima sacando 5.0 en lo restante
  remainingDescription: string; // Qué queda por calificar
  targetGrade: number;
  status: 'passed' | 'warning' | 'in_progress';
  diagnostic: string;
  breakdown: GradeItem[];
  // Campos de compatibilidad:
  corte1: number;
  corte2: number;
  corte3: number;
}

export interface AcademicSemester {
  semesterName: string;
  period: string;
  university: string;
  program: string;
  studentId: string;
  totalCredits: number;
  gpa: number; // Promedio acumulado histórico
  academicStanding: string;
  courses: CourseGrade[];
}

export function calculateCourseAverage(course: CourseGrade): number {
  return course.accumulatedPoints;
}

export function calculateSemesterGPA(courses: CourseGrade[]): number {
  let totalWeighted = 0;
  let totalCredits = 0;
  for (const c of courses) {
    totalWeighted += c.currentAverage * c.credits;
    totalCredits += c.credits;
  }
  return totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 100) / 100 : 0;
}

export const initialAcademicData: AcademicSemester = {
  semesterName: 'Semestre 2026-II (6° Semestre)',
  period: '202620 (Agosto - Noviembre 2026)',
  university: 'Universidad Pontificia Bolivariana — Campus Montería',
  program: 'Ingeniería Civil',
  studentId: '000533630',
  totalCredits: 13,
  gpa: 3.93,
  academicStanding: 'Estudiante Regular — Énfasis Hidroinformática y Estructuras',
  courses: [
    {
      id: 'c-estructuras',
      code: 'NRC 52885',
      name: 'Análisis de Estructuras',
      credits: 2,
      professor: 'Ing. Sergio Elías Flórez Causil',
      linea: 'Línea Estructural (5° Semestre — Llave de Concreto I)',
      evaluatedPercent: 70,
      accumulatedPoints: 2.11,
      currentAverage: 3.01,
      neededForPassing: 2.97,
      neededFor35: 4.64,
      maxPossible: 3.61,
      remainingDescription: 'Examen Final (30%)',
      targetGrade: 3.5,
      status: 'warning',
      diagnostic: 'Objetivo crítico: Sacar mínimo 2.97 en el Examen Final (30%) para asegurar la materia con 3.00 y habilitar Concreto I.',
      corte1: 2.85,
      corte2: 3.08,
      corte3: 2.97,
      breakdown: [
        { name: 'NOTA 1 - Avance 1', weight: 0.10, grade: 2.50, status: 'graded' },
        { name: 'NOTA 2 - Avance 2', weight: 0.15, grade: 3.20, status: 'graded' },
        { name: 'NOTA 3 - Avance 3', weight: 0.15, grade: 5.00, status: 'graded' },
        { name: 'NOTA 4 - Avance 4', weight: 0.15, grade: 0.50, status: 'graded' },
        { name: 'NOTA 5 - Avance 5', weight: 0.15, grade: 3.70, status: 'graded' },
        { name: 'NOTA 6 - Examen Final', weight: 0.30, status: 'pending' },
      ],
    },
    {
      id: 'c-suelos',
      code: 'NRC 52906',
      name: 'Mecánica de Suelos',
      credits: 3,
      professor: 'Ing. David Jesús González Arteaga',
      linea: 'Línea Geotécnica (6° Semestre — Llave de Cimentaciones)',
      evaluatedPercent: 74,
      accumulatedPoints: 2.55,
      currentAverage: 3.45,
      neededForPassing: 1.73,
      neededFor35: 3.65,
      maxPossible: 3.85,
      remainingDescription: 'Laboratorio III (6%), Examen Final (20%)',
      targetGrade: 3.8,
      status: 'passed',
      diagnostic: 'Materia prácticamente asegurada (2.55 / 5.00 acumulados con el 74% evaluado). Solo requieres promediar 1.73 en el 26% restante para aprobar.',
      corte1: 4.50,
      corte2: 4.80,
      corte3: 3.45,
      breakdown: [
        { name: 'NOTA 1 - Seguimiento I', weight: 0.10, grade: 4.50, status: 'graded' },
        { name: 'NOTA 2 - Seguimiento II', weight: 0.10, grade: 4.80, status: 'graded' },
        { name: 'NOTA 3 - Examen I', weight: 0.20, grade: 2.00, status: 'graded' },
        { name: 'NOTA 4 - Seguimiento III', weight: 0.10, grade: 5.00, status: 'graded' },
        { name: 'NOTA 5 - Examen II', weight: 0.10, grade: 1.00, status: 'graded' },
        { name: 'NOTA 6 - Laboratorio I', weight: 0.08, grade: 4.57, status: 'graded' },
        { name: 'NOTA 7 - Laboratorio II', weight: 0.06, grade: 4.25, status: 'graded' },
        { name: 'NOTA 8 - Laboratorio III', weight: 0.06, status: 'pending' },
        { name: 'NOTA 9 - Examen Final', weight: 0.20, status: 'pending' },
      ],
    },
    {
      id: 'c-vias',
      code: 'NRC 52893',
      name: 'Vías II',
      credits: 3,
      professor: 'Ing. Nelson Junior Molinares Doria',
      linea: 'Línea Vial (5° Semestre — Llave de Transporte y Pavimentos)',
      evaluatedPercent: 100,
      accumulatedPoints: 4.03,
      currentAverage: 4.03,
      neededForPassing: 0.0,
      neededFor35: 0.0,
      maxPossible: 4.03,
      remainingDescription: 'Completada 100% en SIGAA',
      targetGrade: 4.0,
      status: 'passed',
      diagnostic: '¡Materia completamente aprobada con 4.03 definitiva en SIGAA! Todos los 3 cortes y 8 componentes están asentados.',
      corte1: 3.75,
      corte2: 4.31,
      corte3: 3.99,
      breakdown: [
        { name: 'NOTA 1 - Primer Corte - Seguimiento', weight: 0.15, grade: 5.00, status: 'graded' },
        { name: 'NOTA 2 - Primer Corte - Parcial', weight: 0.15, grade: 2.50, status: 'graded' },
        { name: 'NOTA 3 - Segundo Corte - Seguimiento', weight: 0.10, grade: 5.00, status: 'graded' },
        { name: 'NOTA 4 - Segundo Corte - Laboratorio', weight: 0.10, grade: 4.25, status: 'graded' },
        { name: 'NOTA 5 - Segundo Corte - Parcial', weight: 0.15, grade: 3.88, status: 'graded' },
        { name: 'NOTA 6 - Tercer Periodo - Seguimiento', weight: 0.10, grade: 4.80, status: 'graded' },
        { name: 'NOTA 7 - Tercer Periodo - Laboratorio', weight: 0.10, grade: 3.90, status: 'graded' },
        { name: 'NOTA 8 - Tercer Periodo - Parcial', weight: 0.15, grade: 3.50, status: 'graded' },
      ],
    },
    {
      id: 'c-presupuesto',
      code: 'NRC 52914',
      name: 'Programación y Presupuesto de Obras Civiles',
      credits: 3,
      professor: 'Ing. Pablo Javier Berdugo Arroyo',
      linea: 'Línea de Gestión (6° Semestre)',
      evaluatedPercent: 100,
      accumulatedPoints: 3.63,
      currentAverage: 3.63,
      neededForPassing: 0.0,
      neededFor35: 0.0,
      maxPossible: 3.63,
      remainingDescription: 'Completada 100% en SIGAA',
      targetGrade: 3.8,
      status: 'passed',
      diagnostic: '¡Materia completamente aprobada con 3.63 definitiva en SIGAA! Examen Final calificado en 4.00 y asistencia asentada.',
      corte1: 4.17,
      corte2: 3.80,
      corte3: 3.63,
      breakdown: [
        { name: 'NOTA 1 - Participación, Preguntas, Exposiciones', weight: 0.15, grade: 4.17, status: 'graded' },
        { name: 'NOTA 2 - Quiz', weight: 0.30, grade: 4.40, status: 'graded' },
        { name: 'NOTA 3 - Examen Parcial', weight: 0.20, grade: 3.00, status: 'graded' },
        { name: 'NOTA 4 - Examen Final', weight: 0.20, grade: 4.00, status: 'graded' },
        { name: 'NOTA 5 - Asistencia', weight: 0.15, grade: 1.90, status: 'graded' },
      ],
    },
    {
      id: 'c-hidrologia',
      code: 'NRC 52910',
      name: 'Fundamentos de Hidrología',
      credits: 2,
      professor: 'Ing. Hernán José Tapia Contreras',
      linea: 'Línea de Recursos Hídricos (6° Semestre — Llave de Acueducto y Alcantarillado)',
      evaluatedPercent: 60,
      accumulatedPoints: 1.80,
      currentAverage: 2.99,
      neededForPassing: 3.01,
      neededFor35: 4.26,
      maxPossible: 3.80,
      remainingDescription: 'Parcial 3 (20%), Proyecto Inv. Final (20%)',
      targetGrade: 3.5,
      status: 'in_progress',
      diagnostic: 'Acumulado real en 1.80 / 5.00 con el 60% evaluado tras asentarse el 3.00 de Proyecto de Aula. Requiere promediar 3.01 en el 40% restante para aprobar.',
      corte1: 2.99,
      corte2: 2.99,
      corte3: 3.00,
      breakdown: [
        { name: 'NOTA 1 - Parcial 1', weight: 0.20, grade: 2.99, status: 'graded' },
        { name: 'NOTA 2 - Parcial 2', weight: 0.20, grade: 2.99, status: 'graded' },
        { name: 'NOTA 3 - Parcial 3', weight: 0.20, status: 'pending' },
        { name: 'NOTA 4 - Proyecto de Investigación Final', weight: 0.20, status: 'pending' },
        { name: 'NOTA 5 - Proyecto de Aula', weight: 0.20, grade: 3.00, status: 'graded' },
      ],
    },
  ],
};
