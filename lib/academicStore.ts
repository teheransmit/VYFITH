export interface CourseGrade {
  id: string;
  code: string;
  name: string;
  credits: number;
  professor: string;
  corte1: number; // 30%
  corte2: number; // 30%
  corte3: number; // 40%
  targetGrade: number;
  status: 'passed' | 'warning' | 'in_progress';
}

export interface AcademicSemester {
  semesterName: string;
  period: string;
  totalCredits: number;
  gpa: number; // 0.0 - 5.0
  academicStanding: string;
  courses: CourseGrade[];
}

export function calculateCourseAverage(course: CourseGrade): number {
  const avg = (course.corte1 * 0.3) + (course.corte2 * 0.3) + (course.corte3 * 0.4);
  return Math.round(avg * 10) / 10;
}

export function calculateSemesterGPA(courses: CourseGrade[]): number {
  let totalWeighted = 0;
  let totalCredits = 0;
  for (const c of courses) {
    const avg = calculateCourseAverage(c);
    totalWeighted += avg * c.credits;
    totalCredits += c.credits;
  }
  return totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 10) / 10 : 0;
}

export const initialAcademicData: AcademicSemester = {
  semesterName: 'Semestre 2026-II',
  period: 'Agosto - Diciembre 2026',
  totalCredits: 18,
  gpa: 4.4,
  academicStanding: 'Estudiante de Alto Rendimiento',
  courses: [
    {
      id: 'c-1',
      code: 'CS-401',
      name: 'Arquitectura de Software y Cloud',
      credits: 4,
      professor: 'Dr. Roberto Mendoza',
      corte1: 4.8,
      corte2: 4.6,
      corte3: 4.5,
      targetGrade: 4.5,
      status: 'passed',
    },
    {
      id: 'c-2',
      code: 'CS-405',
      name: 'Inteligencia Artificial y Modelos LLM',
      credits: 4,
      professor: 'Dra. Claudia Varela',
      corte1: 4.7,
      corte2: 4.9,
      corte3: 4.6,
      targetGrade: 4.5,
      status: 'passed',
    },
    {
      id: 'c-3',
      code: 'MAT-302',
      name: 'Optimización y Estadística Multivariable',
      credits: 3,
      professor: 'Prof. Guillermo Arango',
      corte1: 4.2,
      corte2: 3.9,
      corte3: 4.1,
      targetGrade: 4.0,
      status: 'passed',
    },
    {
      id: 'c-4',
      code: 'CS-410',
      name: 'Bases de Datos Distribuidas & NoSQL',
      credits: 4,
      professor: 'Ing. Patricia Gómez',
      corte1: 4.5,
      corte2: 4.3,
      corte3: 4.4,
      targetGrade: 4.2,
      status: 'passed',
    },
    {
      id: 'c-5',
      code: 'HUM-201',
      name: 'Liderazgo y Emprendimiento Tecnológico',
      credits: 3,
      professor: 'Mg. Carlos Duque',
      corte1: 4.9,
      corte2: 4.8,
      corte3: 5.0,
      targetGrade: 4.5,
      status: 'passed',
    },
  ],
};
