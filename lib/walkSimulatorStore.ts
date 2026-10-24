export interface DogProfile {
  id: string;
  name: string;
  breed: string;
  defaultDurationMin: number;
  ratePerWalk: number;
  owner: string;
  energyLevel: 'Moderado' | 'Alto' | 'Tranquilo';
  colorTag: string;
}

export interface SimulationResult {
  totalWalkDurationMin: number;
  recommendedWakeUpTime: string;
  recommendedWalkDepartureTime: string;
  walkReturnTime: string;
  homeDepartureTime: string;
  upbArrivalTime: string;
  classStartTime: string;
  bufferMarginMin: number;
  punctualityScore: number;
  thermalRisk: 'Óptimo (Pata Fresca 🐾)' | 'Aceptable 🌤️' | 'Alerta Calor Montería 🔥';
  totalProjectedIncome: number;
  notes: string[];
}

export const initialDogs: DogProfile[] = [
  {
    id: 'dog-frida',
    name: 'Frida',
    breed: 'Criolla enérgica',
    defaultDurationMin: 30,
    ratePerWalk: 5850,
    owner: 'Laura',
    energyLevel: 'Alto',
    colorTag: 'emerald',
  },
  {
    id: 'dog-sienna',
    name: 'Sienna',
    breed: 'Raza grande activa',
    defaultDurationMin: 40,
    ratePerWalk: 9000,
    owner: 'Elena',
    energyLevel: 'Alto',
    colorTag: 'indigo',
  },
];

export function calculateWalkSchedule(
  selectedDogIds: string[],
  classStartTimeStr: string = '07:00',
  commuteMinutes: number = 25,
  prepMinutes: number = 20,
  safetyBufferMin: number = 10,
  walkDurationOverrides: Record<string, number> = {}
): SimulationResult {
  const selectedDogs = initialDogs.filter((d) => selectedDogIds.includes(d.id));

  // Si no hay perros seleccionados, duración 0
  const totalWalkDuration = selectedDogs.reduce(
    (acc, d) => acc + (walkDurationOverrides[d.id] ?? d.defaultDurationMin),
    0
  );
  const totalIncome = selectedDogs.reduce((acc, d) => acc + d.ratePerWalk, 0);

  // Parse class start time
  const [classHour, classMin] = classStartTimeStr.split(':').map(Number);
  const classTotalMinutes = classHour * 60 + classMin;

  // Retrocalcular tiempos:
  // Hora de llegada deseada = clase - safetyBufferMin
  const targetArrivalMinutes = classTotalMinutes - safetyBufferMin;
  // Salida de casa hacia UPB = llegada - commuteMinutes
  const homeDepartureMinutes = targetArrivalMinutes - commuteMinutes;
  // Regreso del paseo a casa = salida - prepMinutes
  const walkReturnMinutes = homeDepartureMinutes - prepMinutes;
  // Salida a pasear = regreso - totalWalkDuration
  const walkDepartureMinutes = walkReturnMinutes - totalWalkDuration;
  // Despertar = salida a pasear - 15 min (alistamiento previo)
  const wakeUpMinutes = walkDepartureMinutes - 15;

  const toTimeString = (totalMins: number) => {
    let normalized = totalMins;
    while (normalized < 0) normalized += 24 * 60;
    const h = Math.floor(normalized / 60) % 24;
    const m = normalized % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Evaluación térmica para Montería (clima cálido tropical):
  // Pavimento fresco antes de las 06:45 AM. Entre 06:45 y 07:15 templado. Después de las 07:15 asfalto >32°C.
  let thermalRisk: SimulationResult['thermalRisk'] = 'Óptimo (Pata Fresca 🐾)';
  if (walkReturnMinutes > 7 * 60 + 15) {
    thermalRisk = 'Alerta Calor Montería 🔥';
  } else if (walkReturnMinutes > 6 * 60 + 45) {
    thermalRisk = 'Aceptable 🌤️';
  }

  // Puntaje de puntualidad: basado en buffer y holgura
  const punctualityScore = Math.min(100, Math.max(30, 95 + (safetyBufferMin >= 10 ? 5 : -15)));

  const notes: string[] = [];
  if (selectedDogs.length > 0) {
    notes.push(`Paseando a: ${selectedDogs.map((d) => d.name).join(', ')} (${totalWalkDuration} min).`);
    notes.push(`Ingreso estimado por los paseos: $${totalIncome.toLocaleString('es-CO')} COP.`);
  } else {
    notes.push('Sin paseos seleccionados. Solo traslado directo hacia la UPB.');
  }

  if (walkReturnMinutes > 6 * 60 + 45) {
    notes.push('⚠️ Terminas después de las 06:45 AM: Lleva agua para hidratar a los perros y camina sobre césped.');
  } else {
    notes.push('✅ Horario perfecto de Montería: Asfalto fresco antes de que el sol suba.');
  }

  notes.push(`Traslado a UPB (Km 8 vía Cereté): ~${commuteMinutes} min estimados en tráfico matutino.`);

  return {
    totalWalkDurationMin: totalWalkDuration,
    recommendedWakeUpTime: toTimeString(wakeUpMinutes),
    recommendedWalkDepartureTime: toTimeString(walkDepartureMinutes),
    walkReturnTime: toTimeString(walkReturnMinutes),
    homeDepartureTime: toTimeString(homeDepartureMinutes),
    upbArrivalTime: toTimeString(targetArrivalMinutes),
    classStartTime: classStartTimeStr,
    bufferMarginMin: safetyBufferMin,
    punctualityScore,
    thermalRisk,
    totalProjectedIncome: totalIncome,
    notes,
  };
}
