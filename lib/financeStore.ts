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
  targetBudget: number; // Costo estimado restante del viaje: $375.000 COP
  cashInHand: number; // Efectivo físico en mano: $202.000 COP
  nuBoxSavings: number; // Cajita Medayork de Nu al 9.35% E.A.: $148.579 COP
  nequiSavings: number; // Cuenta Nequi: $0.00 COP
  totalLiquidAvailable: number; // Total Líquido Disponible: $350.579 COP
  receivablesTotal: number; // Cartera en la calle: $0.00 COP (100% cobrada)
  pendingFixedExpenses: number; // Gastos fijos próximos: -$12.000 COP (Motilada)
  realFreeSurplus: number; // Excedente Líquido Libre real: $338.579 COP
  pendingFamilyContributions: number; // Aportes familiares pendientes: $150.000 COP (Papá $100k + Mamá $50k)
  totalTripSecuredCapital: number; // Capital total asegurado: $488.579 COP
  projectedBuffer: number; // Excedente asegurado libre: +$113.579 COP
  housingCovered: boolean;
  statusDiagnostic: 'BIEN 🟢' | 'ATENCIÓN 🟡' | 'CRÍTICO 🔴';
  tacticalRecommendations: {
    id: string;
    priority: 'Alta' | 'Media';
    title: string;
    description: string;
    amount?: number;
  }[];
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
    targetBudget: 375000, // Costo restante estimado del viaje
    cashInHand: 202000, // Efectivo en mano
    nuBoxSavings: 148579, // Cajita Medayork al 9.35% E.A.
    nequiSavings: 0,
    totalLiquidAvailable: 350579, // Efectivo + Nu
    receivablesTotal: 0, // Cartera cobrada al 100% (Rappi, Frida, Sienna, Andrés liquidados)
    pendingFixedExpenses: 12000, // Motilada pendiente hoy
    realFreeSurplus: 338579, // Excedente Líquido Libre real
    pendingFamilyContributions: 150000, // Papá debe $100.000 + Mamá debe $50.000
    totalTripSecuredCapital: 488579, // Total asegurado ($338.579 + $150.000)
    projectedBuffer: 113579, // Excedente asegurado libre final en Antioquia
    housingCovered: true, // Airbnb 100% pago ($0 COP)
    statusDiagnostic: 'BIEN 🟢',
    tacticalRecommendations: [
      {
        id: 'rec-1',
        priority: 'Alta',
        title: 'Ejecutar gasto de motilada (Prioridad Alta)',
        description: 'El embarque cierra mañana a las 11:58 a.m. Se debe descontar hoy mismo el bloque de -$12.000 COP del efectivo disponible para ir a la barbería y no generar cuellos de botella operativos en la mañana del viaje.',
        amount: 12000,
      },
      {
        id: 'rec-2',
        priority: 'Media',
        title: 'Sincronización familiar (Fondo pendiente)',
        description: 'Solicitar esta misma noche el bloque de $150.000 COP restante a los padres (Papá $100k + Mamá $50k) para unificar el 100% del capital en la base de datos de Nu antes del despliegue al aeropuerto.',
        amount: 150000,
      },
    ],
    items: [
      {
        category: 'Alojamiento (Airbnb)',
        amount: 0,
        description: '100% Cubierto y liquidado ($0.00 COP)',
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
        amount: 180000,
        description: 'Ajustado por llegada a la 1:49 p.m. el jueves 8',
        status: 'Prioritario',
      },
      {
        category: 'Actividades y Salidas',
        amount: 70000,
        description: 'Entradas, museos, cafés de especialidad',
        status: 'Planificado',
      },
      {
        category: 'Reserva de Imprevistos',
        amount: 50000,
        description: 'Reserva intocable para contingencias en viaje',
        status: 'Prioritario',
      },
    ],
    receivables: [
      {
        id: 'rec-1',
        client: 'Rappi / Clientes Varios',
        concept: 'Entregas & Servicios',
        amount: 0,
        status: 'Cobrado',
        notes: 'Cartera 100% liquidada y disponible.',
      },
      {
        id: 'rec-2',
        client: 'Laura',
        concept: 'Paseos caninos de Frida',
        amount: 0,
        status: 'Cobrado',
        dogName: 'Frida',
        notes: '100% cobrado y transferido a Cajita Medayork Nu (9.35%).',
      },
      {
        id: 'rec-3',
        client: 'Sienna',
        concept: 'Paseos caninos directos',
        amount: 0,
        status: 'Cobrado',
        dogName: 'Sienna',
        notes: '100% liquidado antes del viaje.',
      },
      {
        id: 'rec-4',
        client: 'Andrés',
        concept: 'Cobros pendientes',
        amount: 0,
        status: 'Cobrado',
        notes: 'Liquidado en su totalidad.',
      },
    ],
  },
};
