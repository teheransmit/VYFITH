export interface ExpenseItem {
  id: string;
  category: 'Nutrición y Proteína' | 'Gimnasio & Salud' | 'Universidad & Libros' | 'Transporte' | 'Ocio y Café' | 'Viaje Medellín' | 'Deuda Yessid' | 'Ahorro iPhone';
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

export interface DogWalkIncomeItem {
  id: string;
  client: string;
  dogName: string;
  walksPerWeek: number;
  ratePerWalk: number;
  weeklyTotal: number;
}

export interface RappiPartnerIncome {
  partner: string;
  days: string;
  grossWeekendTotal: number;
  operatingCosts: {
    gasoline: number;
    mobileData: number;
    total: number;
  };
  netWeekendTotal: number;
  splitPercentage: number;
  myNetWeeklyTotal: number;
  ordersCompleted: number;
  notes: string;
}

export interface WeeklyCashFlow {
  dogWalksIncome: DogWalkIncomeItem[];
  upbTransportSavings: number; // Aporte pasajes papá ($7.000/día x 5 días) — Tarjeta Estudiantil Gratis ($0 gasto)
  rappiIncome?: RappiPartnerIncome; // Rappi fines de semana con Andrés Bello (50/50)
  otherWeeklyIncome: number; // Trabajos universitarios periódicos
  weeklyFixedExpenses: {
    id: string;
    concept: string;
    amount: number;
    category: string;
  }[];
}

export interface DebtPriorityItem {
  id: string;
  creditor: string;
  relationship: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  priority: number;
  targetPaymentDate: string;
  notes: string;
}

export interface AssetGoalItem {
  id: string;
  name: string;
  store: string;
  location: string;
  specs: string;
  price: number;
  savedAmount: number;
  targetDate: string;
  verifiedBatteryHealth: string;
  status: 'En Espera de Pago Deuda' | 'En Progreso' | 'Completado';
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
  yessidDebt: DebtPriorityItem;
  iphoneGoal: AssetGoalItem;
  weeklyFlow: WeeklyCashFlow;
}

export const initialFinanceData: FinanceSummary = {
  monthlyIncome: 3200000,
  monthlyBudget: 2400000,
  totalExpenses: 1845000,
  savingsRate: 42.3,
  yessidDebt: {
    id: 'debt-yessid',
    creditor: 'Yessid',
    relationship: 'Mejor Amigo',
    totalAmount: 580000,
    paidAmount: 0,
    remainingAmount: 580000,
    priority: 1,
    targetPaymentDate: 'Noviembre 2026 (Prioridad Absoluta #1)',
    notes: 'Deuda de palabra con mi mejor amigo Yessid. Regla de oro financiera: pagar el 100% de esta deuda antes de gastar en el iPhone.',
  },
  iphoneGoal: {
    id: 'goal-iphone-15-pro',
    name: 'iPhone 15 Pro (256 GB - Titanio)',
    store: 'Bodega Mayorista Montería (Importadores Directos)',
    location: 'Montería, Córdoba',
    specs: '256 GB, Dynamic Island, A17 Pro (3nm), Cámara 48MP Pro, USB-C 3.0',
    price: 1950000,
    savedAmount: 0,
    targetDate: 'Diciembre 2026 (Temporada)',
    verifiedBatteryHealth: 'Verificar en iOS 17.4+ ciclos reales (≤50 ciclos) o test en 3uTools',
    status: 'En Espera de Pago Deuda',
  },
  weeklyFlow: {
    dogWalksIncome: [
      { id: 'walk-1', client: 'Carlos', dogName: 'Sienna', walksPerWeek: 5, ratePerWalk: 9000, weeklyTotal: 45000 },
      { id: 'walk-2', client: 'Laura', dogName: 'Frida', walksPerWeek: 5.5, ratePerWalk: 5000, weeklyTotal: 27500 },
    ],
    upbTransportSavings: 35000, // Aporte pasajes papá ($7.000/día x 5 días) — Tarjeta Estudiantil Gratis ($0 gasto) = $35.000 neto
    rappiIncome: {
      partner: 'Andrés Bello',
      days: 'Fines de semana (Viernes noche, Sábado y Domingo almuerzo/cena)',
      grossWeekendTotal: 255200, // ~44 pedidos x $5.800 tarifa integral promedio
      operatingCosts: {
        gasoline: 35600, // ~2.2 galones en moto urbana (~260 km de recorridos)
        mobileData: 5400, // Paquete datos 3 días app Soy Rappi + Waze
        total: 41000,
      },
      netWeekendTotal: 214200, // Ganancia neta fin de semana
      splitPercentage: 50, // 50% Santiago / 50% Andrés Bello
      myNetWeeklyTotal: 107100, // Mitad limpia para Santiago (~$107.100 COP/fin de semana)
      ordersCompleted: 44,
      notes: 'Dupla en moto con Andrés Bello en horas pico de fin de semana en Montería (El Recreo, Pasatiempo, Alamedas, Buenavista). Ganancia 100% dividida en mitades.',
    },
    otherWeeklyIncome: 27500, // Trabajos universitarios periódicos (~$120.000 COP/mes)
    weeklyFixedExpenses: [
      { id: 'fix-1', concept: 'Almuerzos & Nutrición UPB', amount: 55000, category: 'Nutrición' },
      { id: 'fix-2', concept: 'SmartFit Prorrateado Semanal', amount: 28000, category: 'Gimnasio' },
      { id: 'fix-3', concept: 'Imprevistos & Recargas', amount: 15000, category: 'Varios' },
    ],
  },
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
