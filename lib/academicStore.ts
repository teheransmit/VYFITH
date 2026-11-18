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
  status: 'passed' | 'warning' | 'in_progress' | 'failed';
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
  prerequisiteCourseId?: string;
  prerequisiteLabel?: string;
  courseRole?: 'repeat' | 'next' | 'cbfh' | 'english' | 'trap';
  theorySchedule?: string;
  labSchedule?: string;
}

export interface LabComponentSummary {
  hasLab: boolean;
  items: GradeItem[];
  totalWeight: number;
  weightedAverage: number;
  allAboveFour: boolean;
  homologationEligible: boolean;
}

export function computeCourseLabSummary(course: CourseGrade): LabComponentSummary {
  const labItems = course.breakdown.filter(
    (item) => item.name.toLowerCase().includes('laboratorio') && typeof item.grade === 'number'
  );
  if (labItems.length === 0) {
    return {
      hasLab: false,
      items: [],
      totalWeight: 0,
      weightedAverage: 0,
      allAboveFour: false,
      homologationEligible: false,
    };
  }
  const totalWeight = labItems.reduce((acc, item) => acc + item.weight, 0);
  const weightedSum = labItems.reduce((acc, item) => acc + (item.grade ?? 0) * item.weight, 0);
  const weightedAverage = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
  const allAboveFour = labItems.every((item) => (item.grade ?? 0) >= 4.0);
  return {
    hasLab: true,
    items: labItems,
    totalWeight,
    weightedAverage,
    allAboveFour,
    homologationEligible: weightedAverage >= 4.0 && allAboveFour,
  };
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
      evaluatedPercent: 100,
      accumulatedPoints: 4.03,
      currentAverage: 4.03,
      neededForPassing: 0.0,
      neededFor35: 0.0,
      maxPossible: 4.03,
      remainingDescription: '100% de componentes cargados en SIGAA (4.027 — Pendiente cierre oficial al Cárdex)',
      targetGrade: 4.0,
      status: 'passed',
      diagnostic: '¡Materia aprobada en SIGAA! 100% de componentes cargados suman 4.027 (~4.03 / 5.00), pendiente de cierre oficial al Cárdex. Habilita Transporte (8825-0031) y Pavimentos (8825-0038).',
      corte1: 3.50,
      corte2: 4.10,
      corte3: 4.03,
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
        { name: 'N1 - Seguimiento I', weight: 0.15, grade: 5.00, status: 'graded' },
        { name: 'N2 - Parcial I', weight: 0.15, grade: 2.50, status: 'graded' },
        { name: 'N3 - Seguimiento II', weight: 0.10, grade: 5.00, status: 'graded' },
        { name: 'N4 - Laboratorio II', weight: 0.10, grade: 4.25, status: 'graded' },
        { name: 'N5 - Parcial II', weight: 0.15, grade: 3.88, status: 'graded' },
        { name: 'N6 - Seguimiento III', weight: 0.10, grade: 4.80, status: 'graded' },
        { name: 'N7 - Laboratorio III', weight: 0.10, grade: 3.90, status: 'graded' },
        { name: 'N8 - Parcial III', weight: 0.15, grade: 3.50, status: 'graded' },
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
      evaluatedPercent: 100,
      accumulatedPoints: 3.63,
      currentAverage: 3.63,
      neededForPassing: 0.0,
      neededFor35: 0.0,
      maxPossible: 3.63,
      remainingDescription: '100% de componentes cargados en SIGAA (3.6305 — Pendiente cierre oficial al Cárdex)',
      targetGrade: 4.2,
      status: 'passed',
      diagnostic: '¡Materia aprobada en SIGAA! 100% de componentes cargados suman 3.6305 (~3.63 / 5.00), pendiente de cierre oficial al Cárdex. Habilita Contratación y Legislación (8825-0036).',
      corte1: 4.17,
      corte2: 4.40,
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
        { name: 'N1 - Participación / Exposición', weight: 0.15, grade: 4.17, status: 'graded' },
        { name: 'N2 - Quiz', weight: 0.30, grade: 4.40, status: 'graded' },
        { name: 'N3 - Examen Parcial', weight: 0.20, grade: 3.00, status: 'graded' },
        { name: 'N4 - Examen Final', weight: 0.20, grade: 4.00, status: 'graded' },
        { name: 'N5 - Asistencia', weight: 0.15, grade: 1.90, status: 'graded' },
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
      evaluatedPercent: 100,
      accumulatedPoints: 2.50,
      currentAverage: 2.50,
      neededForPassing: 0.0,
      neededFor35: 0.0,
      maxPossible: 2.50,
      remainingDescription: '100% de componentes cargados en SIGAA (Reprobada < 3.000 — Pendiente cierre periodo)',
      targetGrade: 3.0,
      status: 'failed',
      diagnostic: 'Reprobada (< 3.000): todos los 9 componentes cargados en bzsksmrk suman 2.50 / 5.00 (Seguimiento III en 0.00, Examen II 1.00, Examen Final 1.00). Toca repetir Mecánica de Suelos y se mantiene bloqueada Cimentaciones.',
      corte1: 4.50,
      corte2: 4.80,
      corte3: 2.50,
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
        { name: 'NOTA 1 - Seguimiento I', weight: 0.10, grade: 4.50, status: 'graded' },
        { name: 'NOTA 2 - Seguimiento II', weight: 0.10, grade: 4.80, status: 'graded' },
        { name: 'NOTA 3 - Examen I', weight: 0.20, grade: 2.00, status: 'graded' },
        { name: 'NOTA 4 - Seguimiento III', weight: 0.10, grade: 0.00, status: 'graded' },
        { name: 'NOTA 5 - Examen II', weight: 0.10, grade: 1.00, status: 'graded' },
        { name: 'NOTA 6 - Laboratorio I', weight: 0.08, grade: 4.57, status: 'graded' },
        { name: 'NOTA 7 - Laboratorio II', weight: 0.06, grade: 4.25, status: 'graded' },
        { name: 'NOTA 8 - Laboratorio III', weight: 0.06, grade: 4.20, status: 'graded' },
        { name: 'NOTA 9 - Examen Final', weight: 0.20, grade: 1.00, status: 'graded' },
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
      evaluatedPercent: 100,
      accumulatedPoints: 2.71,
      currentAverage: 2.71,
      neededForPassing: 0.0,
      neededFor35: 0.0,
      maxPossible: 2.71,
      remainingDescription: '100% de componentes cargados en SIGAA (2.710 — Reprobada < 3.000 sin redondeo)',
      targetGrade: 3.8,
      status: 'failed',
      diagnostic: 'Reprobada en SIGAA (< 3.000 sin redondeo): 100% de componentes suman 2.710 / 5.000 (Avance 4 en 0.50, Examen Final 2.00). Toca repetir Análisis de Estructuras (NRC 13801/13802) y bloquea Concreto I (8825-0029).',
      corte1: 2.50,
      corte2: 3.20,
      corte3: 2.71,
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
        { name: 'N1 - Avance 1', weight: 0.10, grade: 2.50, status: 'graded' },
        { name: 'N2 - Avance 2', weight: 0.15, grade: 3.20, status: 'graded' },
        { name: 'N3 - Avance 3', weight: 0.15, grade: 5.00, status: 'graded' },
        { name: 'N4 - Avance 4', weight: 0.15, grade: 0.50, status: 'graded' },
        { name: 'N5 - Avance 5', weight: 0.15, grade: 3.70, status: 'graded' },
        { name: 'N6 - Examen Final', weight: 0.30, grade: 2.00, status: 'graded' },
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
      evaluatedPercent: 100,
      accumulatedPoints: 2.896,
      currentAverage: 2.896,
      neededForPassing: 0.0,
      neededFor35: 0.0,
      maxPossible: 2.896,
      remainingDescription: '100% de componentes cargados en SIGAA (2.896 — Reprobada < 3.000 sin redondeo)',
      targetGrade: 4.0,
      status: 'failed',
      diagnostic: 'Reprobada en SIGAA (< 3.000 sin redondeo): 100% de componentes suman 2.896 / 5.000 (-0.104 bajo 3.000; SIGAA jamás redondea). Toca repetir Fundamentos de Hidrología (NRC 22221/22222) y bloquea Acueducto y Alcantarillado.',
      corte1: 2.99,
      corte2: 2.99,
      corte3: 2.896,
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
        { name: 'N1 - Parcial 1', weight: 0.20, grade: 2.99, status: 'graded' },
        { name: 'N2 - Parcial 2', weight: 0.20, grade: 2.99, status: 'graded' },
        { name: 'N3 - Parcial 3', weight: 0.20, grade: 2.50, status: 'graded' },
        { name: 'N4 - Proyecto de Investigación', weight: 0.20, grade: 2.00, status: 'graded' },
        { name: 'N5 - Proyecto de Aula', weight: 0.20, grade: 4.00, status: 'graded' },
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
      recommended2027: 'NRC 22674 — Ética Profesional (Mié 14:00-15:40, 1.0 cr — Encaja al homologar Lab Suelos)',
    },
    {
      id: 'bag-emprendimiento',
      name: 'EMPRENDIMIENTO Y RESPONSABILIDAD SOCIAL',
      category: 'CBFH',
      creditsRequired: 2,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: 'NRC 21967 — Emprendimiento y Resp. Social (Mar/Jue 12:00-13:40, 2.0 cr)',
    },
    {
      id: 'bag-electiva-1',
      name: 'ELECTIVA I (Competencias Discursivas)',
      category: 'CBFH',
      creditsRequired: 2,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: '⚠️ Evitar COSO-0024T NRC 22787 (creditHourLow = 0 cr). Usar NRC 14026 o NRC 22774 (ELE, 2.0 cr).',
    },
    {
      id: 'bag-cbfh-1',
      name: 'ELECTIVA CBFH I (Interdisciplinar)',
      category: 'CBFH',
      creditsRequired: 2,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: 'NRC 14026 — Elementos de Ciudad y Tejido Urbano (Vie 14:00-17:20, 2.0 cr, Arq.)',
    },
    {
      id: 'bag-cbfh-2',
      name: 'ELECTIVA CBFH II (Sostenibilidad / Cultura)',
      category: 'CBFH',
      creditsRequired: 2,
      creditsCompleted: 0,
      status: 'pending',
      recommended2027: 'NRC 12475 — Ecología en la Cultura (Mar/Jue 14:00-15:40, 2.0 cr)',
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
      nrc: 'NRC 13812',
      period: '202710',
      code: '8825-0050',
      name: 'Mecánica de Suelos (Repetición — Solo Teoría si homologas Lab)',
      credits: 3,
      professor: 'Ing. David Jesús González Arteaga',
      schedule: 'Teoría: Mar 14:00-15:40 & Jue 14:00-15:40 | Lab: Mié/Vie 14:00-15:40',
      theorySchedule: 'Mar 14:00-15:40 (B3-408) • Jue 14:00-15:40 (B3-301)',
      labSchedule: 'Mié 14:00-15:40 (Lab 119) • Vie 14:00-15:40 (Lab 119)',
      classroom: 'B3-408 / B3-301 (Teoría) • Lab 119',
      seatsAvailable: 25,
      seatsTotal: 25,
      courseRole: 'repeat',
      bagFulfilled: 'Repetición obligatoria 6° Semestre (< 3.000). Labs 2026-2 ganados sobre 4.00 (4.36) → Homologables.',
      bypassNote: 'Homologación Lab: Con Labs ≥ 4.00 cursas SOLO Teoría (Mar/Jue 14:00) y liberas Mié y Vie 14:00.',
    },
    {
      nrc: 'NRC 13802',
      period: '202710',
      code: '8825-0049',
      name: 'Análisis de Estructuras (Repetición)',
      credits: 2,
      professor: 'Ing. Sergio Elías Flórez Causil',
      schedule: 'Mar 10:00-11:40 | Jue 10:00-11:40',
      classroom: 'Campus UPB Montería',
      seatsAvailable: 0,
      seatsTotal: 0,
      courseRole: 'repeat',
      bagFulfilled: 'Repetición obligatoria (< 3.000: 2.710 en 2026-2). También disponible NRC 13801 Mar/Jue 08:00-09:40.',
    },
    {
      nrc: 'NRC 22221',
      period: '202710',
      code: '8825-0030',
      name: 'Fundamentos de Hidrología (Repetición)',
      credits: 2,
      professor: 'Ing. Bertha Rincón Silva',
      schedule: 'Lun 14:00-15:40 | Mié 14:00-15:40',
      classroom: 'Campus UPB Montería',
      seatsAvailable: 0,
      seatsTotal: 0,
      courseRole: 'repeat',
      bagFulfilled: 'Repetición obligatoria (< 3.000: 2.896 en 2026-2). También disponible NRC 22222 Lun/Jue 10:00-11:40.',
    },
    {
      nrc: 'NRC 13803',
      period: '202710',
      code: '8825-0024',
      name: 'Proyecto Integrador II',
      credits: 2,
      professor: 'Ing. Juan Araque Vesga',
      schedule: 'Lun 10:00-11:40 | Mié 10:00-11:40',
      classroom: 'BP 323 / BP3 401',
      seatsAvailable: 0,
      seatsTotal: 0,
      courseRole: 'next',
      bagFulfilled: '6° Semestre — Prerrequisitos 100% aprobados. También disponible NRC 13804 Mar/Jue 08:00-09:40.',
    },
    {
      nrc: 'NRC 22243',
      period: '202710',
      code: '8825-0038',
      name: 'Pavimentos',
      credits: 3,
      professor: 'Ing. Juan Giraldo Daza / Ing. Nelson Molinares',
      schedule: 'Lun/Mié 14:00-15:40 | Mar/Jue 16:00-17:40',
      classroom: 'Lab 120 / BP 125 / BP 204',
      seatsAvailable: 0,
      seatsTotal: 0,
      courseRole: 'next',
      bagFulfilled: '7° Semestre — Sin prerrequisitos registrados en Banner 9 (también disponible NRC 22244).',
    },
    {
      nrc: 'NRC 22225',
      period: '202710',
      code: '8825-0035',
      name: 'Cimentaciones',
      credits: 3,
      professor: 'Ing. Manuel Doria Narváez',
      schedule: 'Lun 14:00-15:40 | Mié 14:00-15:40 | Lun/Mié 16:00-17:40 (Lab 119)',
      classroom: 'B3-403 / B1-204 / Lab 119',
      seatsAvailable: 25,
      seatsTotal: 25,
      prerequisiteCourseId: 'c-suelos',
      prerequisiteLabel: 'Mecánica de Suelos',
      courseRole: 'next',
      bagFulfilled: '7° Semestre — Bloqueada hasta aprobar Mecánica de Suelos (8825-0050)',
    },
    {
      nrc: 'NRC 22223',
      period: '202710',
      code: '8825-0031',
      name: 'Transporte',
      credits: 2,
      professor: 'Ing. Rafael Pastrana Usta',
      schedule: 'Lun 12:00-13:40 | Mié 12:00-13:40',
      classroom: 'B3-401 / B3-304',
      seatsAvailable: 25,
      seatsTotal: 25,
      prerequisiteCourseId: 'c-vias',
      prerequisiteLabel: 'Vías II',
      courseRole: 'next',
      bagFulfilled: '7° Semestre — Prerrequisito Vías II (8825-0027)',
    },
    {
      nrc: 'NRC 13826',
      period: '202710',
      code: '8825-0029',
      name: 'Concreto I',
      credits: 2,
      professor: 'Ing. Sergio Elías Flórez Causil',
      schedule: 'Mar 12:00-13:40 | Jue 12:00-13:40',
      classroom: 'B1-216 / B3-408',
      seatsAvailable: 25,
      seatsTotal: 25,
      prerequisiteCourseId: 'c-estructuras',
      prerequisiteLabel: 'Análisis de Estructuras',
      courseRole: 'next',
      bagFulfilled: '7° Semestre — Prerrequisito Análisis de Estructuras (8825-0049)',
    },
    {
      nrc: 'NRC 22229',
      period: '202710',
      code: '8825-0033',
      name: 'Acueducto',
      credits: 2,
      professor: 'Ing. Juan Durango Grisales',
      schedule: 'Lun 18:00-19:40 | Mié 18:00-19:40',
      classroom: 'B3-303 / B3-301',
      seatsAvailable: 30,
      seatsTotal: 30,
      prerequisiteCourseId: 'c-hidrologia',
      prerequisiteLabel: 'Fundamentos de Hidrología',
      courseRole: 'next',
      bagFulfilled: '7° Semestre — Prerrequisito Fundamentos de Hidrología (8825-0030)',
    },
    {
      nrc: 'NRC 22231',
      period: '202710',
      code: '8825-0034',
      name: 'Alcantarillado',
      credits: 2,
      professor: 'Ing. Juan Durango Grisales',
      schedule: 'Mar 18:00-19:40 | Jue 18:00-19:40',
      classroom: 'B3-302 / B3-303',
      seatsAvailable: 30,
      seatsTotal: 30,
      prerequisiteCourseId: 'c-hidrologia',
      prerequisiteLabel: 'Fundamentos de Hidrología',
      courseRole: 'next',
      bagFulfilled: '7° Semestre — Prerrequisito Fundamentos de Hidrología (8825-0030)',
    },
    {
      nrc: 'NRC 22233',
      period: '202710',
      code: '8825-0036',
      name: 'Contratación y Legislación',
      credits: 2,
      professor: 'Ing. Jesús López Peña',
      schedule: 'Vie 06:00-07:40 | Vie 08:00-09:40',
      classroom: 'Bloque Lab 109',
      seatsAvailable: 25,
      seatsTotal: 25,
      prerequisiteCourseId: 'c-presupuesto',
      prerequisiteLabel: 'Programación y Presupuesto',
      courseRole: 'next',
      bagFulfilled: '7° Semestre — Prerrequisito Programación y Presupuesto (8825-0028). Ocupa mañana viernes.',
    },
    {
      nrc: 'NRC 22674',
      period: '202710',
      code: '5555-0010',
      name: 'Ética Profesional',
      credits: 1,
      professor: 'Rosa Rodríguez Barón',
      schedule: 'Mié 14:00-15:40',
      classroom: 'B1-217',
      seatsAvailable: 40,
      seatsTotal: 40,
      courseRole: 'cbfh',
      bagFulfilled: 'Bolsa CAPP: Ética Profesional (1.0 cr) • Aprovecha Mié 14:00 libre al homologar Lab Suelos.',
    },
    {
      nrc: 'NRC 21967',
      period: '202710',
      code: '6069-0001',
      name: 'Emprendimiento y Responsabilidad Social',
      credits: 2,
      professor: 'Patricia Cassab (Escuela Administración)',
      schedule: 'Mar 12:00-13:40 | Jue 12:00-13:40',
      classroom: 'B3-304',
      seatsAvailable: 30,
      seatsTotal: 30,
      courseRole: 'cbfh',
      bagFulfilled: 'Bolsa CAPP: Emprendimiento (2.0 cr) • Plan B compacto si se bloquea Concreto I',
    },
    {
      nrc: 'NRC 12475',
      period: '202710',
      code: '5555-0012',
      name: 'Ecología en la Cultura',
      credits: 2,
      professor: 'Luis Parra Arango (CBFH)',
      schedule: 'Mar 14:00-15:40 | Jue 14:00-15:40',
      classroom: 'B1-407 / B1-127',
      seatsAvailable: 20,
      seatsTotal: 20,
      courseRole: 'cbfh',
      bagFulfilled: 'Bolsa CAPP: Electiva CBFH II (2.0 cr)',
      bypassNote: 'Bypass: Marcar atributo ELE / FLEX (Choca con Teoría Suelos Mar/Jue 14:00)',
    },
    {
      nrc: 'NRC 14026',
      period: '202710',
      code: '8818-0044',
      name: 'Elementos de Ciudad y Tejido Urbano',
      credits: 2,
      professor: 'Sonia Gómez Bustamante (Arquitectura)',
      schedule: 'Vie 14:00-17:20',
      classroom: 'Bloque Arquitectura',
      seatsAvailable: 25,
      seatsTotal: 25,
      courseRole: 'cbfh',
      bagFulfilled: 'Bolsa CAPP: Electiva CBFH I / Electiva I (2.0 cr) • Solo viable si homologas Lab Suelos (Vie 14:00 libre)',
      bypassNote: 'Bypass: Marcar atributo ELE y permiso TCAR Arquitectura',
    },
    {
      nrc: 'NRC 50242',
      period: '202750',
      code: '5564-0083T',
      name: 'Inglés Nivel 10 — Threshold (Bimestre I Tardes)',
      credits: 0,
      professor: 'Prof. Katia Díaz',
      schedule: 'Mar / Jue / Vie 12:00-13:40',
      classroom: 'B2-203',
      seatsAvailable: 25,
      seatsTotal: 25,
      courseRole: 'english',
      bagFulfilled: 'Requisito Lengua Extranjera (Nivel 10/12)',
      bypassNote: 'Periodo Oculto 202750 • Choca si tomas Concreto I o Emprendimiento a las 12:00 (usar NRC 50244 Sábados)',
    },
    {
      nrc: 'NRC 50244',
      period: '202750',
      code: '5564-0083T',
      name: 'Inglés Nivel 10 — Threshold (Bimestre I Sábados)',
      credits: 0,
      professor: 'Centro de Lenguas UPB',
      schedule: 'Sáb 07:00-12:50',
      classroom: 'Campus UPB Montería',
      seatsAvailable: 25,
      seatsTotal: 25,
      courseRole: 'english',
      bagFulfilled: 'Requisito Lengua Extranjera (Nivel 10/12) • Cero cruces con Concreto I y Tarde Compacta',
      bypassNote: 'Periodo Oculto: Seleccionar "2027 Semestre 1 Form Continua" (202750)',
    },
    {
      nrc: 'NRC 22787',
      period: '202710',
      code: 'COSO-0024T',
      name: 'Expresión Oral (⚠️ TRAMPA 0 CRÉDITOS)',
      credits: 0,
      professor: 'Elinda Bruges González',
      schedule: 'Mié 12:00-13:40 | Vie 12:00-13:40',
      classroom: 'Comunicación Social',
      seatsAvailable: 35,
      seatsTotal: 35,
      courseRole: 'trap',
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
