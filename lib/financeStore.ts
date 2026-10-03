export interface ExpenseItem {
  id: string;
  category: 'Nutrición y Proteína' | 'Gimnasio & Salud' | 'Universidad & Libros' | 'Transporte' | 'Ocio y Café' | 'Viaje Medellín';
  title: string;
  amount: number;
  date: string;
  paymentMethod: 'Tarjeta Débito' | 'Efectivo' | 'Transferencia' | 'Nequi' | 'Cajita Nu';
}

export interface ReceivableItem {
  id: string;
  client: string;
  concept: string;
  amount: number;
  status: 'Pendiente' | 'Cobrado';
  perWalkRate?: number;
  dogName?: string;
  notes?: string;
}

export interface MedellinTripBudget {
  tripDates: string;
  targetBudget: number;
  liquidSavings: number;
  nuBoxSavings: number; // Cajita Medayork de Nu al 9.30% E.A.
  receivablesTotal: number;
  familyContributions: number;
  fixedMonthlyCosts: number;
  housingCovered: boolean;
  projectedBuffer: number;
  items: {
    category: string;
    amount: number;
    description: string;
    status: 'Cubierto' | 'Planificado' | 'Prioritario';
  }[];
  receivables: ReceivableItem[];
}

export interface FinanceSummary {
  monthlyIncome: number;
  monthlyBudget: number;
  totalExpenses: number;
  savingsRate: number;
  expenses: ExpenseItem[];
  medellinTrip: MedellinTripBudget;
}

export const initialFinanceData: FinanceSummary = {
  monthlyIncome: 3200000,
  monthlyBudget: 2400000,
  totalExpenses: 1845000,
  savingsRate: 42.3,
  expenses: [
    {
      id: 'exp-1',
      category: 'Nutrición y Proteína',
      title: 'Whey Protein Isolate + Creatina Monohidratada',
      amount: 285000,
      date: '2026-09-24',
      paymentMethod: 'Tarjeta Débito',
    },
    {
      id: 'exp-2',
      category: 'Nutrición y Proteína',
      title: 'Mercado semanal hiperproteico (Pechuga, huevos, avena)',
      amount: 320000,
      date: '2026-09-23',
      paymentMethod: 'Tarjeta Débito',
    },
    {
      id: 'exp-3',
      category: 'Gimnasio & Salud',
      title: 'Membresía Mensual SmartFit Black',
      amount: 119000,
      date: '2026-09-20',
      paymentMethod: 'Transferencia',
    },
    {
      id: 'exp-4',
      category: 'Universidad & Libros',
      title: 'Suscripción Cloud GCP + Material de Arquitectura',
      amount: 145000,
      date: '2026-09-18',
      paymentMethod: 'Tarjeta Débito',
    },
    {
      id: 'exp-5',
      category: 'Transporte',
      title: 'Recarga Tarjeta de Transporte Masivo',
      amount: 75000,
      date: '2026-09-22',
      paymentMethod: 'Efectivo',
    },
    {
      id: 'exp-6',
      category: 'Ocio y Café',
      title: 'Café de especialidad en semana de estudio',
      amount: 42000,
      date: '2026-09-25',
      paymentMethod: 'Tarjeta Débito',
    },
  ],
  medellinTrip: {
    tripDates: '8 - 12 de Octubre de 2026',
    targetBudget: 420000,
    liquidSavings: 130000,
    nuBoxSavings: 110000,
    receivablesTotal: 123050,
    familyContributions: 260000,
    fixedMonthlyCosts: 22200,
    housingCovered: true,
    projectedBuffer: 70850,
    items: [
      {
        category: 'Alojamiento',
        amount: 0,
        description: '100% Cubierto y liquidado',
        status: 'Cubierto',
      },
      {
        category: 'Bus Aeropuerto (Combuses Nutibara)',
        amount: 40000,
        description: 'Trayecto Rionegro - Medellín ida y vuelta',
        status: 'Planificado',
      },
      {
        category: 'Transporte Local (Tarjeta Cívica Metro)',
        amount: 35000,
        description: 'Metro, Metrocable y Tranvía de Medellín',
        status: 'Planificado',
      },
      {
        category: 'Alimentación (5 Días)',
        amount: 225000,
        description: 'Presupuesto diario $45.000 COP para 5 días',
        status: 'Prioritario',
      },
      {
        category: 'Actividades, Café y Salidas',
        amount: 70000,
        description: 'Entradas, Museo de Antioquia, cafés especiales',
        status: 'Planificado',
      },
      {
        category: 'Fondo de Imprevistos & Retorno',
        amount: 50000,
        description: 'Reserva intocable para emergencias en viaje',
        status: 'Prioritario',
      },
    ],
    receivables: [
      {
        id: 'rec-1',
        client: 'Laura',
        concept: 'Paseos caninos de Frida',
        amount: 78050,
        status: 'Pendiente',
        perWalkRate: 5850,
        dogName: 'Frida',
        notes: 'Al recibir en Nequi, trasladar a Cajita Medayork de Nu al 9.30% E.A.',
      },
      {
        id: 'rec-2',
        client: 'Sienna',
        concept: 'Paseos directos',
        amount: 45000,
        status: 'Pendiente',
        perWalkRate: 9000,
        dogName: 'Sienna',
        notes: 'Pago acordado para liquidación antes del viaje.',
      },
    ],
  },
};
