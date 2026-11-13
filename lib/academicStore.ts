export interface GradeItem {
  name: string;
  weight: number; // Porcentaje en decimal (ej. 0.15 para 15%)
  grade?: number;
  status: 'graded' | 'pending' | 'provisional';
}

export interface CourseAttendance {
  totalHours: number;
  recordedSessions: number;
  attendedSessions: number;
  absences: number;
  absenceHours: number;
  absencePercentage: number;
  absenceDates: string[];
  status: 'optimal' | 'warning' | 'critical';
}

export interface CourseGrade {
  id: string;
  code: string; // NRC o CRN de SIGAA
  subjectCode: string; // Código UPB (ej. 8825-0027)
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
  attendance: CourseAttendance;
  // Campos de compatibilidad:
  corte1: number;
  corte2: number;
  corte3: number;
}

export interface HistoricalCourseRecord {
  code: string;
  name: string;
  credits: number;
  grade: number;
  passed: boolean;
  bagTag?: string;
}

export interface HistoricalSemesterRecord {
  periodCode: string;
  semesterLabel: string;
  pga: number;
  creditsEarned: number;
  tuitionGross: number;
  discountTbea: number;
  tuitionNetPaid: number;
  courses: HistoricalCourseRecord[];
}

export interface EnglishLevelRecord {
  level: number;
  code: string;
  name: string;
  grade?: number;
  status: 'completed' | 'available_202750' | 'pending';
  nrc202750?: string;
  schedule202750?: string;
}

export interface CappBagRequirement {
  id: string;
  name: string;
  category: 'CBFH' | 'Disciplinar' | 'Optativa' | 'Idiomas' | 'Deporte';
  creditsRequired: number;
  creditsCompleted: number;
  status: 'completed' | 'in_progress' | 'pending';
  fulfilledBy?: string;
  recommended2027?: string;
}

export interface Offer2027Course {
  nrc: string;
  period: '202710' | '202750';
  code: string;
  name: string;
  credits: number;
  professor: string;
  schedule: string;
  classroom: string;
  seatsAvailable: number;
  seatsTotal: number;
  bagFulfilled: string;
  bypassNote?: string;
  isZeroCreditTrap?: boolean;
}

export interface AcademicSemester {
  semesterName: string;
  period: string;
  university: string;
  program: string;
  studentId: string;
  pidm: string;
  advisor: string;
  tariffCategory: string;
  holdsCount: number;
  totalCredits: number;
  creditsApprovedHistory: number;
  creditsRequiredTotal: number;
  gpa: number; // Promedio acumulado histórico
  academicStanding: string;
  courses: CourseGrade[];
  cappBags: CappBagRequirement[];
  englishLevels: EnglishLevelRecord[];
  historicalSemesters: HistoricalSemesterRecord[];
  offer2027: Offer2027Course[];
  financialConfig2027: {
    grossCreditCost: number;
    tbeaDiscountRate: number;
    netCreditCost: number;
    studentInsurance: number;
    availableBudget: number;
    gymMonthlyFee: number;
    gymHistoricalSessionsPaid: number;
    gymHistoricalInvested: number;
  };
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
  program: 'Ingeniería Civil (SNIES 3684)',
  studentId: '000533630',
  pidm: '533630',
  advisor: 'Ing. Nora L. Álvarez Doval',
  tariffCategory: 'Categoría C — Auxilio TBEA 95% Empleados',
  holdsCount: 0,
  totalCredits: 13,
  creditsApprovedHistory: 80,
  creditsRequiredTotal: 142,
  gpa: 3.93,
  academicStanding: 'Normal — Sin Retenciones (Holds: 0) — Habilitado Inscripción 202710/202750',
  courses: [
    {
      id: 'c-vias',
      code: 'NRC 52893',
      subjectCode: '8825-0027',
      name: 'Vías II',
      credits: 3,
      professor: 'Ing. Nelson Junior Molinares Doria',
      linea: 'Línea Vial (5° Semestre — Habilita Transporte y Pavimentos)',
      evaluatedPercent: 75,
      accumulatedPoints: 3.10,
      currentAverage: 4.13,
      neededForPassing: 0.0,
      neededFor35: 1.60,
      maxPossible: 4.35,
      remainingDescription: 'Cuarto 25% (25%)',
      targetGrade: 4.0,
      status: 'passed',
      diagnostic: '¡Materia ya asegurada en SIGAA! Llevas 3.10 / 5.00 puntos acumulados (promedio parcial 4.13 con el 75% evaluado). Solo falta el Cuarto 25%.',
      corte1: 3.50,
      corte2: 4.10,
      corte3: 4.80,
      attendance: {
        totalHours: 64,
        recordedSessions: 0,
        attendedSessions: 0,
        absences: 0,
        absenceHours: 0,
        absencePercentage: 0,
        absenceDates: [],
        status: 'optimal',
      },
      breakdown: [
        { name: 'Primer 25%', weight: 0.25, grade: 3.50, status: 'graded' },
        { name: 'Segundo 25%', weight: 0.25, grade: 4.10, status: 'graded' },
        { name: 'Tercer 25%', weight: 0.25, grade: 4.80, status: 'graded' },
        { name: 'Cuarto 25%', weight: 0.25, status: 'pending' },
      ],
    },
    {
      id: 'c-presupuesto',
      code: 'NRC 52914',
      subjectCode: '8825-0028',
      name: 'Programación y Presupuesto de Obras Civiles',
      credits: 3,
      professor: 'Ing. Pablo Javier Berdugo Arroyo',
      linea: 'Línea de Gestión y Construcción (6° Semestre)',
      evaluatedPercent: 75,
      accumulatedPoints: 3.28,
      currentAverage: 4.40,
      neededForPassing: 0.0,
      neededFor35: 0.90,
      maxPossible: 4.53,
      remainingDescription: 'TRABAJO 4 (10%), EXAMEN FINAL (15%)',
      targetGrade: 4.2,
      status: 'passed',
      diagnostic: '¡Materia ya asegurada en SIGAA! Llevas 3.28 / 5.00 puntos acumulados (promedio parcial 4.40 con el 75% evaluado). Faltan Trabajo 4 (10%) y Examen Final (15%).',
      corte1: 4.00,
      corte2: 5.00,
      corte3: 3.50,
      attendance: {
        totalHours: 96,
        recordedSessions: 0,
        attendedSessions: 0,
        absences: 0,
        absenceHours: 0,
        absencePercentage: 0,
        absenceDates: [],
        status: 'optimal',
      },
      breakdown: [
        { name: 'PARCIAL 1', weight: 0.10, grade: 4.00, status: 'graded' },
        { name: 'TRABAJO APU 1', weight: 0.15, grade: 4.00, status: 'graded' },
        { name: 'PARCIAL 2', weight: 0.10, grade: 5.00, status: 'graded' },
        { name: 'TRABAJO 2', weight: 0.15, grade: 5.00, status: 'graded' },
        { name: 'TRABAJO 3', weight: 0.10, grade: 5.00, status: 'graded' },
        { name: 'PARCIAL 3', weight: 0.15, grade: 3.50, status: 'graded' },
        { name: 'TRABAJO 4', weight: 0.10, status: 'pending' },
        { name: 'EXAMEN FINAL', weight: 0.15, status: 'pending' },
      ],
    },
    {
      id: 'c-suelos',
      code: 'NRC 52906',
      subjectCode: '8825-0050',
      name: 'Mecánica de Suelos',
      credits: 3,
      professor: 'Ing. David Jesús González Arteaga',
      linea: 'Línea Geotécnica (6° Semestre — Llave de Cimentaciones)',
      evaluatedPercent: 40,
      accumulatedPoints: 1.45,
      currentAverage: 3.63,
      neededForPassing: 2.58,
      neededFor35: 3.42,
      maxPossible: 4.45,
      remainingDescription: 'TERCER PREVIO (25%), LABORATORIO (25%), QUIZ (10%)',
      targetGrade: 3.8,
      status: 'in_progress',
      diagnostic: 'Llevas 1.45 / 5.00 puntos acumulados (promedio parcial 3.63 con el 40% evaluado). Necesitas promediar 2.58 en el 60% restante (Tercer Previo, Laboratorio y Quiz) para aprobar.',
      corte1: 3.50,
      corte2: 3.70,
      corte3: 3.63,
      attendance: {
        totalHours: 96,
        recordedSessions: 0,
        attendedSessions: 0,
        absences: 0,
        absenceHours: 0,
        absencePercentage: 0,
        absenceDates: [],
        status: 'optimal',
      },
      breakdown: [
        { name: 'PRIMER PREVIO', weight: 0.15, grade: 3.50, status: 'graded' },
        { name: 'SEGUNDO PREVIO', weight: 0.25, grade: 3.70, status: 'graded' },
        { name: 'TERCER PREVIO', weight: 0.25, status: 'pending' },
        { name: 'LABORATORIO', weight: 0.25, status: 'pending' },
        { name: 'QUIZ', weight: 0.10, status: 'pending' },
      ],
    },
    {
      id: 'c-estructuras',
      code: 'NRC 52885',
      subjectCode: '8825-0049',
      name: 'Análisis de Estructuras',
      credits: 2,
      professor: 'Ing. Sergio Elías Flórez Causil',
      linea: 'Línea Estructural (5° Semestre — Llave de Concreto I)',
      evaluatedPercent: 60,
      accumulatedPoints: 2.47,
      currentAverage: 4.10,
      neededForPassing: 1.33,
      neededFor35: 2.58,
      maxPossible: 4.47,
      remainingDescription: 'PARCIAL 3 (25%), SEGUIMIENTO 3 (15%)',
      targetGrade: 3.8,
      status: 'in_progress',
      diagnostic: 'Muy buen avance en SIGAA: 2.47 / 5.00 puntos acumulados (promedio parcial 4.10 con el 60% evaluado). Solo necesitas 1.33 en el 40% restante para aprobar. Ojo: registra 6 fallas en libro de asistencia.',
      corte1: 4.00,
      corte2: 3.60,
      corte3: 4.50,
      attendance: {
        totalHours: 46,
        recordedSessions: 23,
        attendedSessions: 17,
        absences: 6,
        absenceHours: 12,
        absencePercentage: 26.1,
        absenceDates: ['2026-07-28', '2026-08-11', '2026-08-25', '2026-09-03', '2026-09-08', '2026-09-17'],
        status: 'warning',
      },
      breakdown: [
        { name: 'PARCIAL 1', weight: 0.20, grade: 4.00, status: 'graded' },
        { name: 'SEGUIMIENTO 1', weight: 0.10, grade: 5.00, status: 'graded' },
        { name: 'PARCIAL 2', weight: 0.20, grade: 3.60, status: 'graded' },
        { name: 'SEGUIMIENTO 2', weight: 0.10, grade: 4.50, status: 'graded' },
        { name: 'PARCIAL 3', weight: 0.25, status: 'pending' },
        { name: 'SEGUIMIENTO 3', weight: 0.15, status: 'pending' },
      ],
    },
    {
      id: 'c-hidrologia',
      code: 'NRC 52910',
      subjectCode: '8825-0030',
      name: 'Fundamentos de Hidrología',
      credits: 2,
      professor: 'Ing. Hernán José Tapia Contreras',
      linea: 'Línea de Recursos Hídricos (6° Semestre — Llave de Acueducto y Alcantarillado)',
      evaluatedPercent: 40,
      accumulatedPoints: 1.72,
      currentAverage: 4.30,
      neededForPassing: 2.13,
      neededFor35: 2.97,
      maxPossible: 4.72,
      remainingDescription: 'Parcial 3 (20%), Quices/talleres/tareas (20%), Trabajo final (20%)',
      targetGrade: 4.0,
      status: 'in_progress',
      diagnostic: 'Excelente promedio parcial de 4.30 en SIGAA (1.72 / 5.00 puntos acumulados con el 40% evaluado). Requiere promediar 2.13 en el 60% restante para aprobar.',
      corte1: 3.80,
      corte2: 4.80,
      corte3: 4.30,
      attendance: {
        totalHours: 48,
        recordedSessions: 0,
        attendedSessions: 0,
        absences: 0,
        absenceHours: 0,
        absencePercentage: 0,
        absenceDates: [],
        status: 'optimal',
      },
      breakdown: [
        { name: 'Parcial 1', weight: 0.20, grade: 3.80, status: 'graded' },
        { name: 'Parcial 2', weight: 0.20, grade: 4.80, status: 'graded' },
        { name: 'Parcial 3', weight: 0.20, status: 'pending' },
        { name: 'Quices, talleres y/o tareas', weight: 0.20, status: 'pending' },
        { name: 'Trabajo final', weight: 0.20, status: 'pending' },
      ],
    },
  ],
  cappBags: [
    {
      id: 'bag-electiva-2',
      name: 'ELECTIVA II (Expresión / Humanidades)',
      category: 'CBFH',
      creditsRequired: 2,
      creditsCompleted: 2,
      status: 'completed',
      fulfilledBy: 'COSO 0021T — Expresión Escrita (4.46, 2026-1)',
    },
    {
      id: 'bag-optativa-1',
      name: 'OPTATIVA I (Herramientas Computacionales)',
      category: 'Optativa',
      creditsRequired: 2,
      creditsCompleted: 2,
      status: 'completed',
      fulfilledBy: '8825 0158 — Manejo de Software (3.58, 2025-2)',
    },
    {
      id: 'bag-deporte',
      name: 'FORMACIÓN DEPORTIVA REGLAMENTARIA',
      category: 'Deporte',
      creditsRequired: 0,
      creditsCompleted: 0,
      status: 'completed',
      fulfilledBy: 'DEPO 0066 — Fútbol (4.55, 2026-1)',
    },
    {
      id: 'bag-etica-prof',
      name: 'ÉTICA PROFESIONAL (CBFH)',
      category: 'CBFH',
      creditsRequired: 1,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: 'NRC 22674 — Ética Profesional (Vie 14:00-15:40, 1.0 cr)',
    },
    {
      id: 'bag-emprendimiento',
      name: 'EMPRENDIMIENTO Y RESPONSABILIDAD SOCIAL',
      category: 'CBFH',
      creditsRequired: 2,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: 'NRC 21967 — Emprendimiento y Resp. Social (Jue 14:00-15:40, 2.0 cr)',
    },
    {
      id: 'bag-electiva-1',
      name: 'ELECTIVA I (Competencias Discursivas)',
      category: 'CBFH',
      creditsRequired: 2,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: '⚠️ Evitar COSO-0024T en 202710 (tiene creditHourLow = 0 cr). Tomar equivalente de 2.0 cr.',
    },
    {
      id: 'bag-cbfh-1',
      name: 'ELECTIVA CBFH I (Interdisciplinar)',
      category: 'CBFH',
      creditsRequired: 2,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: 'NRC 14026 — Elementos de Ciudad (Vie 08:00-11:40, 2.0 cr, Arq. ELE)',
    },
    {
      id: 'bag-cbfh-2',
      name: 'ELECTIVA CBFH II (Sostenibilidad / Cultura)',
      category: 'CBFH',
      creditsRequired: 2,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: 'NRC 12475 — Ecología y Sostenibilidad (Vie 08:00-09:40, 2.0 cr, Ambiental ELE)',
    },
    {
      id: 'bag-optativas-2-3',
      name: 'OPTATIVA II y OPTATIVA III (Profundización Civil)',
      category: 'Optativa',
      creditsRequired: 4,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: 'Programadas para 8° y 9° Semestre (2.0 cr c/u)',
    },
  ],
  englishLevels: [
    { level: 1, code: '5564-0074', name: 'Introductory', grade: 3.55, status: 'completed' },
    { level: 2, code: '5564-0075', name: 'Access', grade: 3.55, status: 'completed' },
    { level: 3, code: '5564-0076', name: 'Low Elementary', grade: 3.58, status: 'completed' },
    { level: 4, code: '5564-0077', name: 'Elementary', grade: 3.64, status: 'completed' },
    { level: 5, code: '5564-0078', name: 'Upper Elementary', grade: 4.21, status: 'completed' },
    { level: 6, code: '5564-0079', name: 'Pre-Intermediate', grade: 3.25, status: 'completed' },
    { level: 7, code: '5564-0080', name: 'Low Intermediate', grade: 3.94, status: 'completed' },
    { level: 8, code: '5564-0081', name: 'Intermediate', grade: 4.21, status: 'completed' },
    { level: 9, code: '5564-0082', name: 'Upper Intermediate (B2 Formativo)', grade: 4.00, status: 'completed' },
    {
      level: 10,
      code: '5564-0083T',
      name: 'Threshold (Nivel 10)',
      status: 'available_202750',
      nrc202750: 'NRC 50242 (Bimestre I) / NRC 50243 (Bimestre II)',
      schedule202750: 'Mar / Jue / Vie 12:00 - 13:40 (B2-203, Prof. Katia Díaz)',
    },
    {
      level: 11,
      code: '5564-0084T',
      name: 'Low Advanced (Nivel 11)',
      status: 'available_202750',
      nrc202750: 'NRC 50246 (Bimestre II)',
      schedule202750: 'Mar / Jue / Vie 16:00 - 17:40 (B2-207)',
    },
    {
      level: 12,
      code: '5564-0085T',
      name: 'Advanced (Nivel 12 — Requisito Grado)',
      status: 'pending',
    },
  ],
  historicalSemesters: [
    {
      periodCode: '202610',
      semesterLabel: '2026-I (5° Semestre)',
      pga: 3.99,
      creditsEarned: 16,
      tuitionGross: 9200000,
      discountTbea: 8740000,
      tuitionNetPaid: 496000,
      courses: [
        { code: '5555-0009', name: 'Ética General', credits: 1, grade: 4.80, passed: true },
        { code: 'DEPO-0066', name: 'Fútbol', credits: 0, grade: 4.55, passed: true, bagTag: 'Deporte' },
        { code: 'COSO-0021T', name: 'Expresión Escrita', credits: 2, grade: 4.46, passed: true, bagTag: 'Electiva II' },
        { code: '8825-0023', name: 'Vías I', credits: 3, grade: 4.26, passed: true },
        { code: '8825-0026', name: 'Hidráulica', credits: 3, grade: 3.89, passed: true },
        { code: '8825-0025', name: 'Construcción y Equipos', credits: 3, grade: 3.80, passed: true },
        { code: '9937-0100', name: 'Estadística para Ingeniería', credits: 2, grade: 3.73, passed: true },
        { code: '8825-0047', name: 'Resistencia de Materiales', credits: 2, grade: 3.43, passed: true },
      ],
    },
    {
      periodCode: '202520',
      semesterLabel: '2025-II (4° Semestre)',
      pga: 3.90,
      creditsEarned: 15,
      tuitionGross: 9234000,
      discountTbea: 8772300,
      tuitionNetPaid: 495700,
      courses: [
        { code: '9937-0096', name: 'Ecuaciones Diferenciales', credits: 3, grade: 5.00, passed: true },
        { code: '8825-0048', name: 'Mecánica de Fluidos', credits: 3, grade: 4.30, passed: true },
        { code: '8825-0044', name: 'Dinámica', credits: 2, grade: 4.26, passed: true },
        { code: '9937-0097', name: 'Métodos Numéricos', credits: 3, grade: 3.95, passed: true },
        { code: '8825-0158', name: 'Manejo de Software', credits: 2, grade: 3.58, passed: true, bagTag: 'Optativa I' },
        { code: '5568-0006', name: 'Cristología Básica', credits: 2, grade: 3.25, passed: true },
      ],
    },
    {
      periodCode: '202510',
      semesterLabel: '2025-I (3° Semestre)',
      pga: 3.82,
      creditsEarned: 17,
      tuitionGross: 8721000,
      discountTbea: 8284950,
      tuitionNetPaid: 470050,
      courses: [
        { code: '8829-0075', name: 'Programación y Algoritmia', credits: 2, grade: 4.63, passed: true },
        { code: '9937-0095', name: 'Álgebra Lineal', credits: 3, grade: 4.53, passed: true },
        { code: '8825-0045', name: 'Topografía II', credits: 3, grade: 4.15, passed: true },
        { code: '9935-0036', name: 'Ondas y Física Moderna', credits: 2, grade: 3.67, passed: true },
        { code: '9937-0094', name: 'Cálculo Multivariable', credits: 2, grade: 3.38, passed: true },
        { code: '8825-0046', name: 'Materiales de Ingeniería', credits: 3, grade: 3.15, passed: true },
        { code: '8825-0041', name: 'Estática', credits: 2, grade: 3.10, passed: true },
      ],
    },
    {
      periodCode: '202420',
      semesterLabel: '2024-II (2° Semestre)',
      pga: 4.01,
      creditsEarned: 16,
      tuitionGross: 7472000,
      discountTbea: 7098400,
      tuitionNetPaid: 405600,
      courses: [
        { code: '5555-0008', name: 'Humanismo y Cultura Ciudadana', credits: 2, grade: 4.77, passed: true },
        { code: '9937-0093', name: 'Geometría Analítica Vectorial', credits: 2, grade: 4.42, passed: true },
        { code: '8825-0022', name: 'Proyecto Integrador I', credits: 2, grade: 4.38, passed: true },
        { code: '8825-0043', name: 'Fundamentos de Geología', credits: 2, grade: 4.23, passed: true },
        { code: '9937-0092', name: 'Cálculo Integral', credits: 3, grade: 4.00, passed: true },
        { code: '9935-0038', name: 'Física Eléctrica', credits: 2, grade: 3.57, passed: true },
        { code: '8825-0042', name: 'Topografía I', credits: 3, grade: 3.19, passed: true },
      ],
    },
    {
      periodCode: '202410',
      semesterLabel: '2024-I (1° Semestre)',
      pga: 3.93,
      creditsEarned: 16,
      tuitionGross: 7472000,
      discountTbea: 7098400,
      tuitionNetPaid: 405600,
      courses: [
        { code: '2027-0017', name: 'Dibujo de Ingeniería', credits: 2, grade: 4.62, passed: true },
        { code: '9937-0088', name: 'Matemática Básica', credits: 3, grade: 4.45, passed: true },
        { code: '5564-0070', name: 'Lengua y Cultura', credits: 2, grade: 4.14, passed: true },
        { code: '9939-0019', name: 'Fundamentos de Química Lab', credits: 2, grade: 3.93, passed: true },
        { code: '8825-0012', name: 'Introducción Ingeniería Civil', credits: 1, grade: 3.92, passed: true },
        { code: '9935-0035', name: 'Fundamentos de Mecánica', credits: 3, grade: 3.68, passed: true },
        { code: '9937-0087', name: 'Cálculo Diferencial', credits: 3, grade: 3.10, passed: true },
      ],
    },
  ],
  offer2027: [
    {
      nrc: 'NRC 22223',
      period: '202710',
      code: '8825-0031',
      name: 'Transporte',
      credits: 2,
      professor: 'Ing. Nelson Junior Molinares Doria',
      schedule: 'Lun 12:00-13:40 | Mar 14:00-15:40',
      classroom: 'B1-212 / B3-404',
      seatsAvailable: 25,
      seatsTotal: 25,
      bagFulfilled: '7° Semestre (Desbloqueada por Vías II 4.03 ✅)',
    },
    {
      nrc: 'NRC 13826',
      period: '202710',
      code: '8825-0032',
      name: 'Concreto I',
      credits: 3,
      professor: 'Ing. Sergio Elías Flórez Causil',
      schedule: 'Lun 14:00-15:40 | Mié 14:00-15:40 | Jue 14:00-15:40',
      classroom: 'B3-305 / Lab 109',
      seatsAvailable: 25,
      seatsTotal: 25,
      bagFulfilled: '7° Semestre (Requiere aprobar Análisis de Estructuras)',
    },
    {
      nrc: 'NRC 22229',
      period: '202710',
      code: '8825-0033',
      name: 'Acueducto',
      credits: 2,
      professor: 'Ing. Jorge Eliecer Cabrales',
      schedule: 'Lun 18:00-19:40 | Mar 18:00-19:40',
      classroom: 'B3-302',
      seatsAvailable: 30,
      seatsTotal: 30,
      bagFulfilled: '7° Semestre (Requiere aprobar Hidrología)',
    },
    {
      nrc: 'NRC 22231',
      period: '202710',
      code: '8825-0034',
      name: 'Alcantarillado',
      credits: 2,
      professor: 'Ing. Hernán José Tapia Contreras',
      schedule: 'Mié 18:00-19:40 | Jue 18:00-19:40',
      classroom: 'B3-302',
      seatsAvailable: 30,
      seatsTotal: 30,
      bagFulfilled: '7° Semestre (Requiere aprobar Hidrología)',
    },
    {
      nrc: 'NRC 22674',
      period: '202710',
      code: 'FILO-0006',
      name: 'Ética Profesional',
      credits: 1,
      professor: 'Departamento de Formación Humanista',
      schedule: 'Vie 14:00-15:40',
      classroom: 'B3-305',
      seatsAvailable: 40,
      seatsTotal: 40,
      bagFulfilled: 'Bolsa CAPP: Ética Profesional (1.0 cr)',
    },
    {
      nrc: 'NRC 21967',
      period: '202710',
      code: 'ADMI-0046',
      name: 'Emprendimiento y Responsabilidad Social',
      credits: 2,
      professor: 'Escuela de Economía y Administración',
      schedule: 'Jue 14:00-15:40',
      classroom: 'B3-302',
      seatsAvailable: 30,
      seatsTotal: 30,
      bagFulfilled: 'Bolsa CAPP: Emprendimiento (2.0 cr)',
    },
    {
      nrc: 'NRC 12475',
      period: '202710',
      code: '8826-0047',
      name: 'Ecología y Sostenibilidad',
      credits: 2,
      professor: 'Facultad Ing. Ambiental',
      schedule: 'Vie 08:00-09:40',
      classroom: 'B1-106',
      seatsAvailable: 20,
      seatsTotal: 20,
      bagFulfilled: 'Bolsa CAPP: Electiva CBFH II (2.0 cr)',
      bypassNote: 'Bypass: Marcar atributo ELE o Sobrepaso de Programa (Ambiental)',
    },
    {
      nrc: 'NRC 14026',
      period: '202710',
      code: '2027-0155',
      name: 'Elementos de Ciudad',
      credits: 2,
      professor: 'Facultad de Arquitectura',
      schedule: 'Vie 08:00-11:40',
      classroom: 'B2-309',
      seatsAvailable: 25,
      seatsTotal: 25,
      bagFulfilled: 'Bolsa CAPP: Electiva CBFH I (2.0 cr)',
      bypassNote: 'Bypass: Marcar atributo ELE (Arquitectura)',
    },
    {
      nrc: 'NRC 50242',
      period: '202750',
      code: '5564-0083T',
      name: 'Inglés Nivel 10 — Threshold (Bimestre I)',
      credits: 0,
      professor: 'Prof. Katia Díaz',
      schedule: 'Mar / Jue / Vie 12:00-13:40',
      classroom: 'B2-203',
      seatsAvailable: 25,
      seatsTotal: 25,
      bagFulfilled: 'Requisito Lengua Extranjera (Nivel 10/12)',
      bypassNote: 'Periodo Oculto: Seleccionar "2027 Semestre 1 Form Continua" (202750)',
    },
    {
      nrc: 'NRC 23453',
      period: '202710',
      code: 'COSO-0024T',
      name: 'Competencias Discursivas (⚠️ TRAMPA 0 CRÉDITOS)',
      credits: 0,
      professor: 'Escuela Ciencias Sociales',
      schedule: 'Mié 08:00-09:40',
      classroom: 'B1-204',
      seatsAvailable: 35,
      seatsTotal: 35,
      bagFulfilled: 'NO INSCRIBIR: Configurada con creditHourLow = 0 en Banner 202710',
      isZeroCreditTrap: true,
    },
  ],
  financialConfig2027: {
    grossCreditCost: 575000,
    tbeaDiscountRate: 0.95,
    netCreditCost: 28750,
    studentInsurance: 36000,
    availableBudget: 500000,
    gymMonthlyFee: 51685,
    gymHistoricalSessionsPaid: 17,
    gymHistoricalInvested: 591950,
  },
};
