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
      professor: 'Área de Estructuras',
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
      diagnostic: 'Objetivo crítico: Sacar mínimo 3.0 en el Examen Final para pasar la materia y habilitar Concreto I.',
      corte1: 2.85,
      corte2: 3.08,
      corte3: 2.97,
      breakdown: [
        { name: 'Avance 1', weight: 0.10, grade: 2.50, status: 'graded' },
        { name: 'Avance 2', weight: 0.15, grade: 3.20, status: 'graded' },
        { name: 'Avance 3', weight: 0.15, grade: 5.00, status: 'graded' },
        { name: 'Avance 4', weight: 0.15, grade: 0.50, status: 'graded' },
        { name: 'Avance 5 (Confirmado)', weight: 0.15, grade: 3.70, status: 'provisional' },
        { name: 'Examen Final (Pendiente)', weight: 0.30, status: 'pending' },
      ],
    },
    {
      id: 'c-suelos',
      code: 'NRC 52906',
      name: 'Mecánica de Suelos',
      credits: 3,
      professor: 'Área de Geotecnia',
      linea: 'Línea Geotécnica (6° Semestre — Llave de Cimentaciones)',
      evaluatedPercent: 64,
      accumulatedPoints: 2.45,
      currentAverage: 3.83,
      neededForPassing: 1.53,
      neededFor35: 2.92,
      maxPossible: 4.25,
      remainingDescription: 'Examen II (10%), Lab III (6%), Examen Final (20%)',
      targetGrade: 3.8,
      status: 'passed',
      diagnostic: 'Materia prácticamente asegurada. Solo necesitas promediar 1.53 en el 36% restante para aprobar.',
      corte1: 4.50,
      corte2: 4.80,
      corte3: 3.83,
      breakdown: [
        { name: 'Seguimiento I', weight: 0.10, grade: 4.50, status: 'graded' },
        { name: 'Seguimiento II', weight: 0.10, grade: 4.80, status: 'graded' },
        { name: 'Examen I', weight: 0.20, grade: 2.00, status: 'graded' },
        { name: 'Seguimiento III', weight: 0.10, grade: 5.00, status: 'graded' },
        { name: 'Laboratorio I', weight: 0.08, grade: 4.57, status: 'graded' },
        { name: 'Laboratorio II', weight: 0.06, grade: 4.25, status: 'graded' },
        { name: 'Examen II (Pendiente)', weight: 0.10, status: 'pending' },
        { name: 'Laboratorio III (Pendiente)', weight: 0.06, status: 'pending' },
        { name: 'Examen Final (Pendiente)', weight: 0.20, status: 'pending' },
      ],
    },
    {
      id: 'c-vias',
      code: 'NRC 52893',
      name: 'Vías II',
      credits: 3,
      professor: 'Área de Vías y Transporte',
      linea: 'Línea Vial (5° Semestre — Llave de Transporte y Pavimentos)',
      evaluatedPercent: 30,
      accumulatedPoints: 1.13,
      currentAverage: 3.75,
      neededForPassing: 2.68,
      neededFor35: 3.39,
      maxPossible: 4.63,
      remainingDescription: 'Corte 2 (35%) y Corte 3 (35%)',
      targetGrade: 3.8,
      status: 'in_progress',
      diagnostic: 'Buen colchón inicial. Tienes el 70% del semestre por delante y solo necesitas promediar 2.68 para pasar.',
      corte1: 3.75,
      corte2: 3.50,
      corte3: 3.50,
      breakdown: [
        { name: 'Corte 1 - Seguimiento', weight: 0.15, grade: 5.00, status: 'graded' },
        { name: 'Corte 1 - Parcial', weight: 0.15, grade: 2.50, status: 'graded' },
        { name: 'Corte 2 (Seg 10%, Lab 10%, Parcial 15%)', weight: 0.35, status: 'pending' },
        { name: 'Corte 3 (Seg 10%, Lab 10%, Parcial 15%)', weight: 0.35, status: 'pending' },
      ],
    },
    {
      id: 'c-presupuesto',
      code: 'NRC 52914',
      name: 'Programación y Presupuesto de Obras Civiles',
      credits: 3,
      professor: 'Área de Gestión y Construcción',
      linea: 'Línea de Gestión (6° Semestre)',
      evaluatedPercent: 35,
      accumulatedPoints: 1.23,
      currentAverage: 3.50,
      neededForPassing: 2.73,
      neededFor35: 3.50,
      maxPossible: 4.48,
      remainingDescription: 'Quiz (30%), Examen Final (20%), Asistencia (15%)',
      targetGrade: 3.8,
      status: 'in_progress',
      diagnostic: 'Rendimiento sólido. Necesitas promediar 2.73 en el 65% restante para aprobar sin problemas.',
      corte1: 3.50,
      corte2: 3.50,
      corte3: 3.50,
      breakdown: [
        { name: 'Participación y Exposiciones', weight: 0.15, grade: 4.17, status: 'graded' },
        { name: 'Examen Parcial', weight: 0.20, grade: 3.00, status: 'graded' },
        { name: 'Quiz (Pendiente)', weight: 0.30, status: 'pending' },
        { name: 'Examen Final (Pendiente)', weight: 0.20, status: 'pending' },
        { name: 'Asistencia (Pendiente)', weight: 0.15, status: 'pending' },
      ],
    },
    {
      id: 'c-hidrologia',
      code: 'NRC 52910',
      name: 'Fundamentos de Hidrología',
      credits: 2,
      professor: 'Área de Hidráulica y Aguas',
      linea: 'Línea de Recursos Hídricos (6° Semestre — Llave de Acueducto y Alcantarillado)',
      evaluatedPercent: 40,
      accumulatedPoints: 1.20,
      currentAverage: 2.99,
      neededForPassing: 3.01,
      neededFor35: 3.84,
      maxPossible: 4.20,
      remainingDescription: 'Parcial 3 (20%), Proyecto Inv. Final (20%), Proyecto de Aula (20%)',
      targetGrade: 3.5,
      status: 'in_progress',
      diagnostic: 'Llevas dos parciales en 2.99. Necesitas promediar 3.01 en el 60% restante (proyectos y parcial final).',
      corte1: 2.99,
      corte2: 2.99,
      corte3: 3.00,
      breakdown: [
        { name: 'Parcial 1', weight: 0.20, grade: 2.99, status: 'graded' },
        { name: 'Parcial 2', weight: 0.20, grade: 2.99, status: 'graded' },
        { name: 'Parcial 3 (Pendiente)', weight: 0.20, status: 'pending' },
        { name: 'Proyecto Inv. Final (Pendiente)', weight: 0.20, status: 'pending' },
        { name: 'Proyecto de Aula (Pendiente)', weight: 0.20, status: 'pending' },
      ],
    },
  ],
};
