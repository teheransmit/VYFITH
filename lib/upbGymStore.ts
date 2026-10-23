// lib/upbGymStore.ts
// Gestión de horarios oficiales, estado en tiempo real, validación SIGAA y cruce con calendario académico

export interface GymShift {
  name: string; // 'Turno Mañana' | 'Turno Tarde'
  startTime: string; // '06:00'
  endTime: string; // '11:30' o '11:00' o '19:00'
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface DayGymSchedule {
  dayName: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  dayIndex: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  isOpenDay: boolean;
  shifts: GymShift[];
  myClasses: {
    timeRange: string;
    courseName: string;
    classroom: string;
    building: string;
  }[];
  recommendedWindows: {
    title: string;
    timeRange: string;
    durationMinutes: number;
    recommendedWorkout: string;
    strategyNote: string;
    isPrimary: boolean;
  }[];
}

export interface GymLiveStatus {
  isOpenNow: boolean;
  currentShiftName: string | null;
  closingInMinutes: number | null;
  nextOpeningText: string;
  currentTimeString: string;
  currentDayName: string;
}

export const SIGAA_BANNER_URL =
  'https://general.upb.edu.co/BannerGeneralSsb/ssb/personalInformation#/personalInformationMain';

export const DATA_QUALITY_EMAIL = 'calidaddeldato.monteria@upb.edu.co';

export const UPB_GYM_FACILITIES = [
  {
    title: 'Espacio Climatizado',
    description: 'Aire acondicionado continuo de alta potencia para alto rendimiento en clima de Montería.',
    icon: 'Snowflake',
  },
  {
    title: 'Entrenamiento Muscular & Hipertrofia',
    description: 'Equipamiento de fuerza, barras olímpicas, mancuernas y máquinas guiadas.',
    icon: 'Dumbbell',
  },
  {
    title: 'Entrenamiento Funcional',
    description: 'Zona de movilidad, bandas elásticas, colchonetas y circuitos metabólicos.',
    icon: 'Flame',
  },
  {
    title: 'Duchas & Lockers Individuales',
    description: 'Vestidores equipados para bañarte y cambiarte antes de ingresar a tus clases.',
    icon: 'Droplets',
  },
  {
    title: 'Orientación de Rutinas',
    description: 'Instructores y educadores físicos UPB disponibles para corregir técnica y asesorar.',
    icon: 'Users',
  },
];

// Horarios y cruce específico con las clases de Santiago (6.° Semestre Ing. Civil)
export const UPB_GYM_WEEKLY_SCHEDULE: DayGymSchedule[] = [
  {
    dayName: 'Lunes',
    dayIndex: 1,
    isOpenDay: true,
    shifts: [
      { name: 'Turno Mañana', startTime: '06:00', endTime: '11:30', startHour: 6, startMinute: 0, endHour: 11, endMinute: 30 },
      { name: 'Turno Tarde', startTime: '16:00', endTime: '19:00', startHour: 16, startMinute: 0, endHour: 19, endMinute: 0 },
    ],
    myClasses: [
      { timeRange: '05:50 - 06:20', courseName: 'Paseo de Frida', classroom: 'Exteriores', building: 'Castellana' },
      { timeRange: '10:00 - 11:40', courseName: 'Vías II', classroom: 'Aula 323', building: 'Edificio B1' },
      { timeRange: '12:00 - 13:40', courseName: 'Fundamentos de Hidrología', classroom: 'Aula 110', building: 'Edificio B2' },
      { timeRange: '18:00 - 19:40', courseName: 'Programación y Presupuesto', classroom: 'Aula 214', building: 'Edificio B2' },
    ],
    recommendedWindows: [
      {
        title: 'Opción Tarde (Recomendada)',
        timeRange: '16:00 - 17:30',
        durationMinutes: 90,
        recommendedWorkout: 'Horizontal Torso (Chest & Back)',
        strategyNote: 'Terminas a las 17:30, te duchas en el gimnasio de 17:30 a 17:50 y entras impecable a las 18:00 a Presupuesto en el B2.',
        isPrimary: true,
      },
      {
        title: 'Opción Mañana Temprano',
        timeRange: '06:30 - 08:30',
        durationMinutes: 120,
        recommendedWorkout: 'Hipertrofia Torso Superior',
        strategyNote: 'Inmediatamente después de pasear a Frida (06:20), llegas al campus con el gym vacío. Tienes tiempo libre hasta las 10:00 a.m.',
        isPrimary: false,
      },
    ],
  },
  {
    dayName: 'Martes',
    dayIndex: 2,
    isOpenDay: true,
    shifts: [
      { name: 'Turno Mañana', startTime: '06:00', endTime: '11:30', startHour: 6, startMinute: 0, endHour: 11, endMinute: 30 },
      { name: 'Turno Tarde', startTime: '16:00', endTime: '19:00', startHour: 16, startMinute: 0, endHour: 19, endMinute: 0 },
    ],
    myClasses: [
      { timeRange: '05:42 - 06:12', courseName: 'Paseo de Frida', classroom: 'Exteriores', building: 'Castellana' },
      { timeRange: '08:00 - 09:40', courseName: 'Análisis de Estructuras (Momentos)', classroom: 'Aula 109', building: 'Edificio B2' },
      { timeRange: '14:00 - 15:40', courseName: 'Mecánica de Suelos', classroom: 'Aula 114', building: 'Edificio B2' },
      { timeRange: '18:00 - 18:45', courseName: 'Programación y Presupuesto', classroom: 'Aula 214', building: 'Edificio B2' },
    ],
    recommendedWindows: [
      {
        title: 'Hueco Dorado Mañana (Recomendada)',
        timeRange: '10:00 - 11:30',
        durationMinutes: 90,
        recommendedWorkout: 'Vertical & Incline Torso (Chest & Back)',
        strategyNote: 'Sales de Estructuras (09:40), cruzas al gimnasio a las 10:00, entrenas 90 min y te duchas. Te quedan 2 horas y media para almorzar antes de Suelos (14:00).',
        isPrimary: true,
      },
      {
        title: 'Opción Tarde',
        timeRange: '16:00 - 17:30',
        durationMinutes: 90,
        recommendedWorkout: 'Vertical Torso / Hombros',
        strategyNote: 'Sales de Suelos (15:40) y a las 16:00 abre el gym. Cortas a las 17:30 para ducharte antes de Presupuesto (18:00).',
        isPrimary: false,
      },
    ],
  },
  {
    dayName: 'Miércoles',
    dayIndex: 3,
    isOpenDay: true,
    shifts: [
      { name: 'Turno Mañana', startTime: '06:00', endTime: '11:30', startHour: 6, startMinute: 0, endHour: 11, endMinute: 30 },
      { name: 'Turno Tarde', startTime: '16:00', endTime: '19:00', startHour: 16, startMinute: 0, endHour: 19, endMinute: 0 },
    ],
    myClasses: [
      { timeRange: '05:50 - 06:20', courseName: 'Paseo de Frida', classroom: 'Exteriores', building: 'Castellana' },
      { timeRange: '10:00 - 11:40', courseName: 'Vías II', classroom: 'Aula 323', building: 'Edificio B1' },
      { timeRange: '12:00 - 13:40', courseName: 'Fundamentos de Hidrología', classroom: 'Aula 110', building: 'Edificio B2' },
      { timeRange: '14:00 - 15:40', courseName: 'Mecánica de Suelos', classroom: 'Aula 114', building: 'Edificio B2' },
      { timeRange: '18:00 - 19:40', courseName: 'Programación y Presupuesto', classroom: 'Aula 214', building: 'Edificio B2' },
    ],
    recommendedWindows: [
      {
        title: 'Tarde Post-Suelos (Recomendada)',
        timeRange: '16:00 - 17:30',
        durationMinutes: 90,
        recommendedWorkout: 'Full Legs (Pierna Pesada)',
        strategyNote: 'Sales de Suelos a las 15:40. Inicias a las 16:00, entrenas 90 min de tren inferior, te duchas y entras a Presupuesto a las 18:00.',
        isPrimary: true,
      },
      {
        title: 'Mañana Madrugador',
        timeRange: '06:30 - 08:30',
        durationMinutes: 120,
        recommendedWorkout: 'Pierna / Sentadilla & Prensa',
        strategyNote: 'Excelente opción si quieres dejar la tarde libre para estudiar parciales.',
        isPrimary: false,
      },
    ],
  },
  {
    dayName: 'Jueves',
    dayIndex: 4,
    isOpenDay: true,
    shifts: [
      { name: 'Turno Mañana', startTime: '06:00', endTime: '11:30', startHour: 6, startMinute: 0, endHour: 11, endMinute: 30 },
      { name: 'Turno Tarde', startTime: '16:00', endTime: '19:00', startHour: 16, startMinute: 0, endHour: 19, endMinute: 0 },
    ],
    myClasses: [
      { timeRange: '05:42 - 06:12', courseName: 'Paseo de Frida', classroom: 'Exteriores', building: 'Castellana' },
      { timeRange: '08:00 - 09:40', courseName: 'Análisis de Estructuras (Exámenes/Teoría)', classroom: 'Aula 109', building: 'Edificio B2' },
      { timeRange: '14:00 - 15:40', courseName: 'Mecánica de Suelos', classroom: 'Aula 114', building: 'Edificio B2' },
      { timeRange: '18:00 - 19:40', courseName: 'Programación y Presupuesto', classroom: 'Aula 214', building: 'Edificio B2' },
    ],
    recommendedWindows: [
      {
        title: 'Hueco Dorado Mañana (Recomendada)',
        timeRange: '10:00 - 11:30',
        durationMinutes: 90,
        recommendedWorkout: 'Arms & Shoulders (Brazos y Hombros)',
        strategyNote: 'Cero interferencias de 10:00 a 11:30. Ideal para desestresar los brazos y hombros después de cálculo matricial.',
        isPrimary: true,
      },
      {
        title: 'Opción Tarde',
        timeRange: '16:00 - 17:30',
        durationMinutes: 90,
        recommendedWorkout: 'Brazos, Tríceps & Deltoides',
        strategyNote: 'Mismo esquema: 16:00 a 17:30 con ducha obligatoria antes de clase a las 18:00.',
        isPrimary: false,
      },
    ],
  },
  {
    dayName: 'Viernes',
    dayIndex: 5,
    isOpenDay: true,
    shifts: [
      { name: 'Turno Mañana', startTime: '06:00', endTime: '11:00', startHour: 6, startMinute: 0, endHour: 11, endMinute: 0 },
      { name: 'Turno Tarde', startTime: '16:00', endTime: '19:00', startHour: 16, startMinute: 0, endHour: 19, endMinute: 0 },
    ],
    myClasses: [
      { timeRange: '05:50 - 06:20', courseName: 'Paseo de Frida', classroom: 'Exteriores', building: 'Castellana' },
      { timeRange: '10:00 - 11:40', courseName: 'Vías II', classroom: 'Aula 323', building: 'Edificio B1' },
    ],
    recommendedWindows: [
      {
        title: 'Tarde Dorada (¡La Mejor de la Semana!)',
        timeRange: '16:00 - 18:30',
        durationMinutes: 150,
        recommendedWorkout: 'Full Legs o Sesión Recuperación Hevy',
        strategyNote: '¡No tienes clases en la tarde! Puedes entrenar sin afán de reloj, ducharte con calma y salir relajado para el fin de semana.',
        isPrimary: true,
      },
      {
        title: 'Mañana Madrugador',
        timeRange: '07:00 - 09:00',
        durationMinutes: 120,
        recommendedWorkout: 'Hipertrofia / Pierna',
        strategyNote: 'Atención: Viernes el turno mañana cierra a las 11:00 a.m. Tienes clase de Vías II a las 10:00 a.m., así que debes terminar antes de las 09:15.',
        isPrimary: false,
      },
    ],
  },
  {
    dayName: 'Sábado',
    dayIndex: 6,
    isOpenDay: false,
    shifts: [],
    myClasses: [
      { timeRange: '10:00 - 11:30', courseName: 'Activación USD (Outlier / Alignerr)', classroom: 'Home Office', building: 'Remoto' },
    ],
    recommendedWindows: [
      {
        title: 'Gimnasio UPB Cerrado',
        timeRange: 'Todo el día',
        durationMinutes: 0,
        recommendedWorkout: 'Recuperación Activa o Calistenia en Parque',
        strategyNote: 'El gimnasio no presta servicio los fines de semana. Día para descanso del SNC o paseo largo con Frida.',
        isPrimary: true,
      },
    ],
  },
  {
    dayName: 'Domingo',
    dayIndex: 0,
    isOpenDay: false,
    shifts: [],
    myClasses: [],
    recommendedWindows: [
      {
        title: 'Descanso Total',
        timeRange: 'Todo el día',
        durationMinutes: 0,
        recommendedWorkout: 'Reposo Muscular & Sueño Reparador',
        strategyNote: 'Preparación fisiológica para iniciar la semana académica.',
        isPrimary: true,
      },
    ],
  },
];

/**
 * Calcula en tiempo real si el gimnasio UPB está abierto o cerrado en este instante
 * en la zona horaria de Montería (America/Bogota, UTC-5).
 */
export function getUpbGymLiveStatus(customDate?: Date): GymLiveStatus {
  const now = customDate || new Date();
  // Formatear en zona horaria de Colombia
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  let hour = 0;
  let minute = 0;
  let weekdayName = '';

  for (const part of parts) {
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
    if (part.type === 'weekday') weekdayName = part.value.toLowerCase();
  }

  // Normalizar nombre de día
  let dayIndex = 1;
  if (weekdayName.includes('lunes')) dayIndex = 1;
  else if (weekdayName.includes('martes')) dayIndex = 2;
  else if (weekdayName.includes('miércoles') || weekdayName.includes('miercoles')) dayIndex = 3;
  else if (weekdayName.includes('jueves')) dayIndex = 4;
  else if (weekdayName.includes('viernes')) dayIndex = 5;
  else if (weekdayName.includes('sábado') || weekdayName.includes('sabado')) dayIndex = 6;
  else if (weekdayName.includes('domingo')) dayIndex = 0;

  const currentTotalMinutes = hour * 60 + minute;
  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const daySchedule = UPB_GYM_WEEKLY_SCHEDULE.find((d) => d.dayIndex === dayIndex)!;

  if (!daySchedule.isOpenDay || daySchedule.shifts.length === 0) {
    return {
      isOpenNow: false,
      currentShiftName: null,
      closingInMinutes: null,
      nextOpeningText: 'Abre el Lunes a las 06:00 a.m.',
      currentTimeString: timeString,
      currentDayName: daySchedule.dayName,
    };
  }

  // Verificar si cae dentro de algún turno de hoy
  for (const shift of daySchedule.shifts) {
    const shiftStartMins = shift.startHour * 60 + shift.startMinute;
    const shiftEndMins = shift.endHour * 60 + shift.endMinute;

    if (currentTotalMinutes >= shiftStartMins && currentTotalMinutes < shiftEndMins) {
      return {
        isOpenNow: true,
        currentShiftName: shift.name,
        closingInMinutes: shiftEndMins - currentTotalMinutes,
        nextOpeningText: `Cierra a las ${shift.endTime} (${shiftEndMins - currentTotalMinutes} min restantes)`,
        currentTimeString: timeString,
        currentDayName: daySchedule.dayName,
      };
    }
  }

  // Si está cerrado hoy pero es un día hábil:
  const firstShift = daySchedule.shifts[0];
  const firstShiftStart = firstShift.startHour * 60 + firstShift.startMinute;
  const secondShift = daySchedule.shifts[1];

  if (currentTotalMinutes < firstShiftStart) {
    return {
      isOpenNow: false,
      currentShiftName: null,
      closingInMinutes: null,
      nextOpeningText: `Abre hoy a las ${firstShift.startTime} a.m. (Turno Mañana)`,
      currentTimeString: timeString,
      currentDayName: daySchedule.dayName,
    };
  }

  if (secondShift) {
    const secondShiftStart = secondShift.startHour * 60 + secondShift.startMinute;
    if (currentTotalMinutes < secondShiftStart) {
      return {
        isOpenNow: false,
        currentShiftName: null,
        closingInMinutes: null,
        nextOpeningText: `Abre hoy a las ${secondShift.startTime} (Turno Tarde)`,
        currentTimeString: timeString,
        currentDayName: daySchedule.dayName,
      };
    }
  }

  // Ya pasó el último turno de hoy
  const nextDayIndex = (dayIndex + 1) % 7;
  const nextDay = UPB_GYM_WEEKLY_SCHEDULE.find((d) => d.dayIndex === nextDayIndex)!;
  const nextText = nextDay.isOpenDay
    ? `Abre mañana ${nextDay.dayName} a las ${nextDay.shifts[0].startTime} a.m.`
    : 'Abre el próximo Lunes a las 06:00 a.m.';

  return {
    isOpenNow: false,
    currentShiftName: null,
    closingInMinutes: null,
    nextOpeningText: nextText,
    currentTimeString: timeString,
    currentDayName: daySchedule.dayName,
  };
}
