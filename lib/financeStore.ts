export interface ExpenseItem {
  id: string;
  category: 'Nutrición y Proteína' | 'Gimnasio & Salud' | 'Universidad & Libros' | 'Transporte' | 'Ocio y Café';
  title: string;
  amount: number;
  date: string;
  paymentMethod: 'Tarjeta Débito' | 'Efectivo' | 'Transferencia';
}

export interface FinanceSummary {
  monthlyIncome: number;
  monthlyBudget: number;
  totalExpenses: number;
  savingsRate: number;
  expenses: ExpenseItem[];
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
};
