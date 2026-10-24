/**
 * VYFITH - Módulo Unificado de Finanzas Personales & Viaje a Medellín
 * lib/financeStore.ts
 *
 * Consolida los modelos oficiales, motor de cálculo financiero (Cajita Nu 9.30% E.A.,
 * Excedente Real, Simulador Medellín, abonos de papá, paseos Sienna/Frida sin Molly),
 * tienda reactiva local-first y sincronización bidireccional con Antigravity.
 */

// ============================================================================
// 1. CONSTANTES FINANCIERAS Y REGLAS DE NEGOCIO
// ============================================================================

/** Tasa Efectiva Anual oficial de la Cajita Nu (9.30% E.A.) */
export const NU_ANNUAL_EFFECTIVE_RATE = 0.0930;

/** Tarifa por paseo de Sienna: $9.000 COP */
export const SIENNA_WALK_RATE = 9000;

/** Tarifa oficial por paseo de Frida: $5.850 COP */
export const FRIDA_WALK_RATE = 5850;

/** Tarifa base previa por paseo de Frida (para compatibilidad de formularios): $5.000 COP */
export const FRIDA_WALK_RATE_BASE = 5000;

/** Tarifa de Molly: DEPRECADA / EXCLUIDA ($0 COP) */
export const MOLLY_WALK_RATE = 0;

/** Costo Total Estimado del Viaje a Medellín (Suma de rubros fijos): $584.549 COP */
export const DEFAULT_MEDELLIN_COST = 584549;

/** Fondo inicial disponible asignado a Medellín: $550.000 COP */
export const DEFAULT_AVAILABLE_FUND = 550000;

/** Compromiso Total de Papá pactado para el viaje: $450.000 COP */
export const DEFAULT_DAD_COMMITTED = 450000;

/** Abonos reales ya entregados por Papá: $140.000 COP */
export const DEFAULT_DAD_PAID = 140000;

/** Saldo de cartera acumulada de paseos semanal por defecto: $48.700 COP */
export const DEFAULT_PENDING_WALKS_WEEKLY = 48700;

// ============================================================================
// 2. TIPOS Y DTOs OFICIALES (UNIFICACIÓN WEB & ROOM DB)
// ============================================================================

export type AccountType = 'CASH' | 'NU' | 'NEQUI';
export type ExpenseCategory = 'DEBT' | 'SUBSCRIPTION' | 'GENERAL';

/**
 * Entidad 1: Saldos de Cuentas Líquidas
 * Espejo de Room Entity `accounts` en Android
 */
export interface AccountBalance {
  id: number | string;
  name: string; // "Efectivo", "Cuenta Nu", "Nequi"
  balance: number; // Saldo en COP
  type: AccountType; // "CASH", "NU", "NEQUI"
  dailyYieldCOP?: number; // Calculado diariamente para Nu al 9.30% E.A.
}
export type AccountBalanceDTO = AccountBalance;

/**
 * Entidad 2: Gastos Fijos, Deudas de Honor y Suscripciones
 * Espejo de Room Entity `fixed_expenses` en Android
 */
export interface FixedExpense {
  id: number | string;
  title: string; // Ej: "Vuelos", "Suscripciones", "Motilada", "Deuda Yessid"
  amount: number; // Valor mensual o total del compromiso
  category: ExpenseCategory; // "DEBT", "SUBSCRIPTION", "GENERAL"
  dueDate?: string;
  isPaid?: boolean;
}
export type FixedExpenseDTO = FixedExpense;

/**
 * Entidad 3: Registro Diario de Ingresos y Gastos
 * Espejo de Room Entity `daily_logs` en Android
 * Regla estricta: mollyWalk = false (Molly purgada)
 */
export interface DailyLog {
  id: number | string;
  timestamp: number;
  dateDisplay: string; // Ej: "28 de agosto, 2026"
  walksIncome: number; // Valor total de paseos del día (por cobrar)
  siennaWalk: boolean; // Tarifa: $9.000 COP
  fridaWalk: boolean; // Tarifa: $5.850 COP / $5.000 COP
  mollyWalk: false; // STRICT: siempre false, excluida de la lógica
  rappiIncome: number; // Ingreso líquido inmediato de Rappi
  dailyExpense: number; // Gasto del día
  netChange: number; // Variación líquida inmediata (rappiIncome - dailyExpense)
  targetAccountName: string; // Cuenta a debitar o acreditar
  note: string; // Observaciones del día
}
export type DailyLogDTO = DailyLog;

/**
 * Entidad 4: Configuración y Presupuesto del Viaje a Medellín
 * Espejo de Room Entity `trip_settings` en Android (ID singleton = 1)
 */
export interface TripSettings {
  id: number;
  availableFund: number; // Fondo actual asignado ($550.000 COP)
  dadTotalCommitted: number; // Compromiso de papá ($450.000 COP)
  dadPaidAmount: number; // Entregado por papá ($140.000 COP)
  dadPendingAmount: number; // Restante de papá ($310.000 COP)
  pendingWalksWeekly: number; // Cartera acumulada semanal de paseos
  totalEstimatedCost: number; // Meta fija de Medellín ($584.549 COP)
  balanceParaLujos: number; // availableFund - totalEstimatedCost (-$34.549 COP)
  personalRemainingTarget: number; // max(0, totalEstimatedCost - dadTotalCommitted) = $134.549 COP
  projectedFundWithDad: number; // availableFund + dadPendingAmount ($860.000 COP)
  projectedSurplusWithDad: number; // projectedFundWithDad - totalEstimatedCost (+$275.451 COP)
}
export type TripSettingsDTO = TripSettings;

/**
 * Entidad 5: Cuentas por Cobrar a Terceros (Gente que me debe plata)
 * Espejo de Room Entity `pending_debts` en Android
 */
export interface PendingDebt {
  id: number | string;
  debtorName: string; // Nombre del deudor (ej: "Camilo", "Mateo")
  amount: number; // Monto adeudado en COP
  description: string; // Concepto del préstamo
  dateCreated: string; // Fecha de registro
  isPaid: boolean; // Estado de pago
  paidDate?: string | null; // Fecha de liquidación
  paidToAccount?: string | null; // Cuenta destino donde ingresó
}
export type PendingDebtDTO = PendingDebt;

/**
 * Desglose de Rubros Fijos del Viaje a Medellín
 */
export interface TripFixedItem {
  id: string;
  title: string;
  amount: number;
  category: 'HOTEL' | 'TRANSIT' | 'FOOD' | 'TAXI' | 'ACTIVITIES' | 'EMERGENCY' | string;
}

/**
 * Estado Financiero Unificado Completo (Local-First & Sync Contract)
 */
export interface UnifiedFinanceState {
  accounts: AccountBalance[];
  fixedExpenses: FixedExpense[];
  dailyLogs: DailyLog[];
  tripSettings: TripSettings;
  pendingDebts: PendingDebt[];
  lastSynced: string;
}

// ============================================================================
// 3. FÓRMULAS MATEMÁTICAS RIGUROSAS
// ============================================================================

/**
 * Calcula el rendimiento diario compuesto de la Cajita Nu sobre la tasa E.A.
 * Fórmula: i_diario = (1 + EA)^(1/365) - 1
 * Sobre $320.000 COP da exactamente $77.91 COP/día.
 */
export function calculateDailyNuYield(balance: number, rateEA: number = NU_ANNUAL_EFFECTIVE_RATE): number {
  if (balance <= 0) return 0;
  const dailyCompoundRate = Math.pow(1 + rateEA, 1 / 365) - 1;
  const dailyYield = balance * dailyCompoundRate;
  return Number(dailyYield.toFixed(2));
}

/**
 * Proyección mensual compuesta (30 días) de la Cajita Nu
 */
export function calculateMonthlyNuYield(balance: number, rateEA: number = NU_ANNUAL_EFFECTIVE_RATE): number {
  if (balance <= 0) return 0;
  const monthlyCompoundRate = Math.pow(1 + rateEA, 30 / 365) - 1;
  const monthlyYield = balance * monthlyCompoundRate;
  return Number(monthlyYield.toFixed(2));
}

/**
 * Proyección a N días con capitalización diaria en Nu
 */
export function calculateNuProjection(balance: number, days: number, rateEA: number = NU_ANNUAL_EFFECTIVE_RATE): number {
  if (balance <= 0 || days <= 0) return balance;
  const dailyCompoundRate = Math.pow(1 + rateEA, 1 / 365) - 1;
  const finalBalance = balance * Math.pow(1 + dailyCompoundRate, days);
  return Number(finalBalance.toFixed(2));
}

/**
 * Calcula el Excedente Líquido Libre Patrimonial:
 * Excedente = Total Balances en Cuentas - Total Gastos Fijos y Deudas
 */
export function calculateRealFreeSurplus(
  accounts: AccountBalance[],
  fixedExpenses: FixedExpense[]
): number {
  const totalBalances = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  const totalFixed = fixedExpenses.reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
  return totalBalances - totalFixed;
}

/**
 * Calcula el Balance para Lujos de Medellín y el Pronóstico Familiar
 */
export function calculateMedellinBalance(
  settings: Partial<TripSettings>,
  totalCost: number = DEFAULT_MEDELLIN_COST
) {
  const availableFund = Number(settings.availableFund ?? DEFAULT_AVAILABLE_FUND);
  const dadTotalCommitted = Number(settings.dadTotalCommitted ?? DEFAULT_DAD_COMMITTED);
  const dadPaidAmount = Number(settings.dadPaidAmount ?? DEFAULT_DAD_PAID);

  const dadPendingAmount = Math.max(0, dadTotalCommitted - dadPaidAmount);
  const personalRemainingTarget = Math.max(0, totalCost - dadTotalCommitted);
  const balanceParaLujos = availableFund - totalCost;
  const isDeficit = balanceParaLujos < 0;
  const deficitAmount = isDeficit ? Math.abs(balanceParaLujos) : 0;
  const surplusAmount = isDeficit ? 0 : balanceParaLujos;

  const projectedFundWithDad = availableFund + dadPendingAmount;
  const projectedSurplusWithDad = projectedFundWithDad - totalCost;
  const siennaWalksNeeded = Math.ceil(personalRemainingTarget / SIENNA_WALK_RATE);
  const dadProgressPercent = Math.min(100, (dadPaidAmount / (dadTotalCommitted || 1)) * 100);

  return {
    availableFund,
    totalCost,
    balanceParaLujos,
    isDeficit,
    deficitAmount,
    surplusAmount,
    dadTotalCommitted,
    dadPaidAmount,
    dadPendingAmount,
    dadProgressPercent: Number(dadProgressPercent.toFixed(1)),
    personalRemainingTarget,
    projectedFundWithDad,
    projectedSurplusWithDad,
    siennaWalksNeeded,
  };
}

/**
 * Formateador de moneda colombiana en COP sin decimales
 */
export function formatCOP(amount: number): String {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

// ============================================================================
// 4. RUBROS FIJOS DE MEDELLÍN Y ESTADO POR DEFECTO
// ============================================================================

export const DEFAULT_MEDELLIN_ITEMS: TripFixedItem[] = [
  { id: '1', title: 'Alojamiento', amount: 164550, category: 'HOTEL' },
  { id: '2', title: 'Bus Aeropuerto (Combuses)', amount: 40000, category: 'TRANSIT' },
  { id: '3', title: 'Alimentación (5 Días)', amount: 225000, category: 'FOOD' },
  { id: '4', title: 'Transporte Local (Metro/Taxi)', amount: 35000, category: 'TAXI' },
  { id: '5', title: 'Actividades & Tours', amount: 70000, category: 'ACTIVITIES' },
  { id: '6', title: 'Fondo de Imprevistos', amount: 50000, category: 'EMERGENCY' },
];

export const initialUnifiedFinanceState: UnifiedFinanceState = {
  accounts: [
    { id: 1, name: 'Efectivo', balance: 85000, type: 'CASH' },
    { id: 2, name: 'Cuenta Nu', balance: 320000, type: 'NU', dailyYieldCOP: 77.91 },
    { id: 3, name: 'Nequi', balance: 245000, type: 'NEQUI' },
  ],
  fixedExpenses: [
    { id: 1, title: 'Vuelos', amount: 140000, category: 'DEBT' },
    { id: 2, title: 'Suscripciones (Spotify/Crunchyroll)', amount: 10200, category: 'SUBSCRIPTION' },
    { id: 3, title: 'Motilada', amount: 25000, category: 'GENERAL' },
  ],
  tripSettings: {
    id: 1,
    availableFund: 550000,
    dadTotalCommitted: 450000,
    dadPaidAmount: 140000,
    dadPendingAmount: 310000,
    pendingWalksWeekly: 48700,
    totalEstimatedCost: 584549,
    balanceParaLujos: -34549,
    personalRemainingTarget: 134549,
    projectedFundWithDad: 860000,
    projectedSurplusWithDad: 275451,
  },
  pendingDebts: [
    {
      id: 1,
      debtorName: 'Camilo',
      amount: 35000,
      description: 'Préstamo salida fin de semana',
      dateCreated: '28 de agosto, 2026',
      isPaid: false,
      paidDate: null,
      paidToAccount: null,
    },
    {
      id: 2,
      debtorName: 'Mateo',
      amount: 20000,
      description: 'Mitad de la cuenta del almuerzo',
      dateCreated: '30 de agosto, 2026',
      isPaid: false,
      paidDate: null,
      paidToAccount: null,
    },
  ],
  dailyLogs: [
    {
      id: 1,
      timestamp: 1787664000000,
      dateDisplay: '26 de agosto, 2026',
      walksIncome: 9000,
      siennaWalk: true,
      fridaWalk: false,
      mollyWalk: false,
      rappiIncome: 25000,
      dailyExpense: 0,
      netChange: 25000,
      targetAccountName: 'Nequi',
      note: 'Paseo Sienna mañana + 2 horas Rappi tarde',
    },
    {
      id: 2,
      timestamp: 1787750400000,
      dateDisplay: '27 de agosto, 2026',
      walksIncome: 5850,
      siennaWalk: false,
      fridaWalk: true,
      mollyWalk: false,
      rappiIncome: 0,
      dailyExpense: 3500,
      netChange: -3500,
      targetAccountName: 'Efectivo',
      note: 'Paseo Frida',
    },
    {
      id: 3,
      timestamp: 1787836800000,
      dateDisplay: '28 de agosto, 2026',
      walksIncome: 14850,
      siennaWalk: true,
      fridaWalk: true,
      mollyWalk: false,
      rappiIncome: 18000,
      dailyExpense: 0,
      netChange: 18000,
      targetAccountName: 'Cuenta Nu',
      note: 'Sienna + Frida + Turno Rappi viernes',
    },
    {
      id: 4,
      timestamp: 1787923200000,
      dateDisplay: '29 de agosto, 2026',
      walksIncome: 0,
      siennaWalk: false,
      fridaWalk: false,
      mollyWalk: false,
      rappiIncome: 32000,
      dailyExpense: 6000,
      netChange: 26000,
      targetAccountName: 'Nequi',
      note: 'Turno Rappi noche de sábado',
    },
    {
      id: 5,
      timestamp: 1788009600000,
      dateDisplay: '30 de agosto, 2026',
      walksIncome: 14850,
      siennaWalk: true,
      fridaWalk: true,
      mollyWalk: false,
      rappiIncome: 22000,
      dailyExpense: 0,
      netChange: 22000,
      targetAccountName: 'Cuenta Nu',
      note: 'Paseos Sienna y Frida + Rappi domingo',
    },
    {
      id: 6,
      timestamp: 1788096000000,
      dateDisplay: '31 de agosto, 2026',
      walksIncome: 9000,
      siennaWalk: true,
      fridaWalk: false,
      mollyWalk: false,
      rappiIncome: 0,
      dailyExpense: 0,
      netChange: 0,
      targetAccountName: 'Efectivo',
      note: 'Paseo Sienna',
    },
  ],
  lastSynced: '2026-10-23T18:00:00.000Z',
};

// ============================================================================
// 5. TIENDA REACTIVA LOCAL-FIRST (IN-MEMORY & LOCALSTORAGE)
// ============================================================================

const LOCAL_STORAGE_KEY = 'vyfith_unified_finance_state';
type FinanceSubscriber = (state: UnifiedFinanceState) => void;

let activeState: UnifiedFinanceState = { ...initialUnifiedFinanceState };
const subscribers: Set<FinanceSubscriber> = new Set();

/**
 * Normaliza y recalcula valores derivados de estado financiero
 */
export function normalizeFinanceState(state: UnifiedFinanceState): UnifiedFinanceState {
  // 1. Recalcular rendimiento Nu para cada cuenta
  const normalizedAccounts = state.accounts.map((acc) => {
    if (acc.type === 'NU' || acc.name.toLowerCase().includes('nu')) {
      return {
        ...acc,
        dailyYieldCOP: calculateDailyNuYield(acc.balance),
      };
    }
    return acc;
  });

  // 2. Recalcular tripSettings
  const medellinCalc = calculateMedellinBalance(state.tripSettings);
  const normalizedTrip: TripSettings = {
    ...state.tripSettings,
    availableFund: medellinCalc.availableFund,
    dadTotalCommitted: medellinCalc.dadTotalCommitted,
    dadPaidAmount: medellinCalc.dadPaidAmount,
    dadPendingAmount: medellinCalc.dadPendingAmount,
    pendingWalksWeekly: Number(state.tripSettings.pendingWalksWeekly) || 0,
    totalEstimatedCost: medellinCalc.totalCost,
    balanceParaLujos: medellinCalc.balanceParaLujos,
    personalRemainingTarget: medellinCalc.personalRemainingTarget,
    projectedFundWithDad: medellinCalc.projectedFundWithDad,
    projectedSurplusWithDad: medellinCalc.projectedSurplusWithDad,
  };

  // 3. Asegurar mollyWalk = false en dailyLogs
  const normalizedLogs = state.dailyLogs.map((log) => ({
    ...log,
    mollyWalk: false as const,
  }));

  return {
    ...state,
    accounts: normalizedAccounts,
    tripSettings: normalizedTrip,
    dailyLogs: normalizedLogs,
    lastSynced: state.lastSynced || new Date().toISOString(),
  };
}

/**
 * Obtiene el estado actual en memoria
 */
export function getFinanceState(): UnifiedFinanceState {
  return activeState;
}

/**
 * Notifica a todos los suscriptores reactivos
 */
function notifySubscribers(): void {
  subscribers.forEach((sub) => {
    try {
      sub(activeState);
    } catch (e) {
      console.error('Error en suscriptor de FinanceStore:', e);
    }
  });
}

/**
 * Establece el nuevo estado, lo persiste localmente y notifica a los suscriptores
 */
export function setFinanceState(nextState: UnifiedFinanceState): void {
  activeState = normalizeFinanceState(nextState);
  saveFinanceState(activeState);
  notifySubscribers();
}

/**
 * Suscripción reactiva para componentes de React
 */
export function subscribeFinanceState(listener: FinanceSubscriber): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

/**
 * Carga el estado financiero desde localStorage (en navegador) o inicial
 */
export function loadFinanceState(): UnifiedFinanceState {
  if (typeof window === 'undefined') {
    return activeState;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.accounts)) {
        activeState = normalizeFinanceState(parsed);
        return activeState;
      }
    }
  } catch (err) {
    console.warn('No se pudo leer estado de localStorage, usando estado base:', err);
  }
  activeState = normalizeFinanceState(initialUnifiedFinanceState);
  return activeState;
}

/**
 * Persiste el estado financiero en localStorage
 */
export function saveFinanceState(state: UnifiedFinanceState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error persistiendo en localStorage:', err);
  }
}

/**
 * Consulta el estado financiero en el backend (/api/finance/state o /api/finance)
 */
export async function fetchFinanceState(): Promise<UnifiedFinanceState> {
  try {
    const res = await fetch('/api/finance/state', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        setFinanceState(json.data);
        return activeState;
      }
    }
  } catch (err) {
    console.warn('Fallo fetch a /api/finance/state, intentando /api/finance:', err);
    try {
      const resFallback = await fetch('/api/finance', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (resFallback.ok) {
        const json = await resFallback.json();
        if (json.success && json.data) {
          setFinanceState(json.data);
          return activeState;
        }
      }
    } catch (e) {
      console.error('No se pudo conectar al endpoint de finanzas:', e);
    }
  }
  return loadFinanceState();
}

/**
 * Sincroniza el estado actual con el backend vía POST
 */
export async function syncFinanceStateWithBackend(
  state?: UnifiedFinanceState
): Promise<{ success: boolean; message?: string }> {
  // Guard para SSR / Node.js: previene intentos de fetch con URL relativa fuera del navegador
  if (typeof window === 'undefined') {
    return { success: true, message: 'Entorno Node.js / SSR: estado actualizado en memoria' };
  }
  const payload = state ? normalizeFinanceState(state) : activeState;
  try {
    const res = await fetch('/api/finance/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, message: json.message || 'Sincronizado' };
    }
  } catch (err) {
    console.warn('Fallo sync a /api/finance/sync, intentando fallback /api/finance:', err);
    try {
      const resFallback = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', state: payload }),
      });
      if (resFallback.ok) {
        const json = await resFallback.json();
        return { success: true, message: json.message || 'Sincronizado' };
      }
    } catch (e) {
      console.error('Fallo en sincronización con backend:', e);
    }
  }
  return { success: false, message: 'Operando en modo local (sin conexión al backend)' };
}

/**
 * Resuelve y valida el nombre de la cuenta destino con fallback a 'Nequi' o 'Efectivo'
 * si la cuenta proporcionada no existe en el catálogo.
 */
export function resolveAccountName(
  accountName?: string | null,
  accounts: AccountBalance[] = activeState.accounts
): string {
  if (accountName && accounts.some((a) => a.name === accountName)) {
    return accountName;
  }
  const fallback =
    accounts.find((a) => a.name === 'Nequi') ||
    accounts.find((a) => a.name === 'Efectivo') ||
    accounts[0];
  return fallback ? fallback.name : accountName || 'Nequi';
}

/**
 * Registra un día de ingresos/gastos de forma atómica:
 * - Sienna ($9.000) y Frida ($5.850 / configurable) van a cartera semanal (`pendingWalksWeekly`)
 * - Rappi - Gasto impacta la liquidez de la cuenta inmediatamente
 * - Inserta el log histórico
 */
export function addDailyLog(params: {
  siennaWalk: boolean;
  fridaWalk: boolean;
  rappiIncome: number;
  dailyExpense: number;
  targetAccountName: string;
  note: string;
  fridaRate?: number;
  dateDisplay?: string;
}): { netChange: number; walksSum: number; updatedState: UnifiedFinanceState } {
  const current = activeState;

  const siennaVal = params.siennaWalk ? SIENNA_WALK_RATE : 0;
  const fridaRate = params.fridaRate ?? FRIDA_WALK_RATE;
  const fridaVal = params.fridaWalk ? fridaRate : 0;
  const walksSum = siennaVal + fridaVal;

  const immediateNetChange = Number(params.rappiIncome || 0) - Number(params.dailyExpense || 0);

  const targetAccountName = resolveAccountName(params.targetAccountName, current.accounts);

  // 1. Actualizar saldo de la cuenta destino
  const nextAccounts = current.accounts.map((acc) => {
    if (acc.name === targetAccountName) {
      return {
        ...acc,
        balance: acc.balance + immediateNetChange,
      };
    }
    return acc;
  });

  // 2. Acumular cartera de paseos semanales
  const nextTrip: TripSettings = {
    ...current.tripSettings,
    pendingWalksWeekly: current.tripSettings.pendingWalksWeekly + walksSum,
  };

  // 3. Formatear fecha
  const dateStr =
    params.dateDisplay ||
    new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

  const newLog: DailyLog = {
    id: Date.now(),
    timestamp: Date.now(),
    dateDisplay: dateStr,
    walksIncome: walksSum,
    siennaWalk: params.siennaWalk,
    fridaWalk: params.fridaWalk,
    mollyWalk: false,
    rappiIncome: Number(params.rappiIncome || 0),
    dailyExpense: Number(params.dailyExpense || 0),
    netChange: immediateNetChange,
    targetAccountName,
    note:
      walksSum > 0
        ? params.note.trim()
          ? `${params.note.trim()} (Paseos por cobrar: +${formatCOP(walksSum)})`
          : `Paseos por cobrar: +${formatCOP(walksSum)}`
        : params.note.trim(),
  };

  const nextState: UnifiedFinanceState = {
    ...current,
    accounts: nextAccounts,
    tripSettings: nextTrip,
    dailyLogs: [newLog, ...current.dailyLogs],
    lastSynced: new Date().toISOString(),
  };

  setFinanceState(nextState);

  // Disparo en segundo plano para sincronizar con backend
  syncFinanceStateWithBackend(nextState).catch(() => {});

  return { netChange: immediateNetChange, walksSum, updatedState: activeState };
}

/**
 * Liquida la cartera semanal acumulada de paseos:
 * Transfiere pendingWalksWeekly a la cuenta elegida, resetea el contador a $0,
 * y genera un registro de conciliación.
 */
export function settleWeeklyWalks(targetAccountName: string = 'Cuenta Nu'): {
  settledAmount: number;
  updatedState: UnifiedFinanceState;
} {
  const current = activeState;
  const pending = Number(current.tripSettings.pendingWalksWeekly) || 0;
  if (pending <= 0) {
    return { settledAmount: 0, updatedState: current };
  }

  const effectiveAccount = resolveAccountName(targetAccountName, current.accounts);

  // 1. Acreditar saldo a la cuenta
  const nextAccounts = current.accounts.map((acc) => {
    if (acc.name === effectiveAccount) {
      return {
        ...acc,
        balance: acc.balance + pending,
      };
    }
    return acc;
  });

  // 2. Resetear contador semanal
  const nextTrip: TripSettings = {
    ...current.tripSettings,
    pendingWalksWeekly: 0,
  };

  // 3. Crear log de conciliación
  const dateStr = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const settlementLog: DailyLog = {
    id: Date.now(),
    timestamp: Date.now(),
    dateDisplay: dateStr,
    walksIncome: pending,
    siennaWalk: false,
    fridaWalk: false,
    mollyWalk: false,
    rappiIncome: 0,
    dailyExpense: 0,
    netChange: pending,
    targetAccountName: effectiveAccount,
    note: `Liquidación semanal de paseos cobrados (+${formatCOP(pending)})`,
  };

  const nextState: UnifiedFinanceState = {
    ...current,
    accounts: nextAccounts,
    tripSettings: nextTrip,
    dailyLogs: [settlementLog, ...current.dailyLogs],
    lastSynced: new Date().toISOString(),
  };

  setFinanceState(nextState);
  syncFinanceStateWithBackend(nextState).catch(() => {});

  return { settledAmount: pending, updatedState: activeState };
}

/**
 * Registra un abono entregado por el papá con ingreso opcional a cuenta líquida
 */
export function registerDadAbono(
  addedAmount: number,
  targetAccountName?: string
): { updatedState: UnifiedFinanceState } {
  const current = activeState;
  const amount = Number(addedAmount) || 0;
  if (amount <= 0) return { updatedState: current };

  let nextAccounts = current.accounts;
  if (targetAccountName) {
    const effectiveAccount = resolveAccountName(targetAccountName, current.accounts);
    nextAccounts = current.accounts.map((acc) => {
      if (acc.name === effectiveAccount) {
        return {
          ...acc,
          balance: acc.balance + amount,
        };
      }
      return acc;
    });
  }

  const newPaid = current.tripSettings.dadPaidAmount + amount;
  const nextTrip: TripSettings = {
    ...current.tripSettings,
    dadPaidAmount: newPaid,
  };

  const nextState: UnifiedFinanceState = {
    ...current,
    accounts: nextAccounts,
    tripSettings: nextTrip,
    lastSynced: new Date().toISOString(),
  };

  setFinanceState(nextState);
  syncFinanceStateWithBackend(nextState).catch(() => {});

  return { updatedState: activeState };
}

/**
 * Liquida una deuda pendiente por cobrar (amigo/tercero):
 * Marca isPaid = true y acredita el monto a la cuenta seleccionada.
 */
export function settlePendingDebt(
  debtId: number | string,
  targetAccountName: string = 'Efectivo'
): { success: boolean; settledDebt?: PendingDebt; updatedState: UnifiedFinanceState } {
  const current = activeState;
  const targetDebt = current.pendingDebts.find((d) => String(d.id) === String(debtId));

  if (!targetDebt || targetDebt.isPaid) {
    return { success: false, updatedState: current };
  }

  const effectiveAccount = resolveAccountName(targetAccountName, current.accounts);

  const dateStr = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const nextDebts = current.pendingDebts.map((d) => {
    if (String(d.id) === String(debtId)) {
      return {
        ...d,
        isPaid: true,
        paidDate: dateStr,
        paidToAccount: effectiveAccount,
      };
    }
    return d;
  });

  const nextAccounts = current.accounts.map((acc) => {
    if (acc.name === effectiveAccount) {
      return {
        ...acc,
        balance: acc.balance + targetDebt.amount,
      };
    }
    return acc;
  });

  const nextState: UnifiedFinanceState = {
    ...current,
    accounts: nextAccounts,
    pendingDebts: nextDebts,
    lastSynced: new Date().toISOString(),
  };

  setFinanceState(nextState);
  syncFinanceStateWithBackend(nextState).catch(() => {});

  return {
    success: true,
    settledDebt: { ...targetDebt, isPaid: true, paidDate: dateStr, paidToAccount: effectiveAccount },
    updatedState: activeState,
  };
}

/**
 * Exporta el estado financiero a un string JSON formateado
 */
export function exportFinanceStateJSON(state?: UnifiedFinanceState): string {
  const target = state || activeState;
  return JSON.stringify(target, null, 2);
}

/**
 * Importa y valida un archivo o string JSON al estado financiero
 */
export function importFinanceStateJSON(jsonString: string): {
  success: boolean;
  state?: UnifiedFinanceState;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'El archivo no contiene un objeto JSON válido.' };
    }
    if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.fixedExpenses)) {
      return { success: false, error: 'Estructura incompatible: faltan cuentas o gastos fijos.' };
    }

    const stateToApply: UnifiedFinanceState = {
      accounts: parsed.accounts,
      fixedExpenses: parsed.fixedExpenses,
      dailyLogs: Array.isArray(parsed.dailyLogs) ? parsed.dailyLogs : [],
      tripSettings: parsed.tripSettings || initialUnifiedFinanceState.tripSettings,
      pendingDebts: Array.isArray(parsed.pendingDebts) ? parsed.pendingDebts : [],
      lastSynced: new Date().toISOString(),
    };

    setFinanceState(stateToApply);
    syncFinanceStateWithBackend(stateToApply).catch(() => {});

    return { success: true, state: activeState };
  } catch (err: any) {
    return { success: false, error: `Error de parseo JSON: ${err?.message || err}` };
  }
}

// ============================================================================
// 6. COMPATIBILIDAD HACIA ATRÁS CON EL CÓDIGO EXISTENTE DE VYFITH
// ============================================================================

export interface ExpenseItem {
  id: string;
  category:
    | 'Nutrición y Proteína'
    | 'Gimnasio & Salud'
    | 'Universidad & Libros'
    | 'Transporte'
    | 'Ocio y Café'
    | 'Viaje Medellín'
    | 'Deuda Yessid'
    | 'Ahorro iPhone';
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

export interface RealisticScenario {
  id: string;
  scenarioName: '🔴 Mes Malo (Parciales / Lluvias)' | '🟡 Mes Típico (Promedio Real)' | '🟢 Mes Excelente (Pico / Quincenas)';
  weeklyIncome: number;
  monthlyIncome: number;
  fixedExpensesWeekly: number;
  netSavingsWeekly: number;
  netSavingsMonthly: number;
  weeksToPayDebt: number;
  description: string;
}

export interface IncomeVolatilityModel {
  pertMonthlyAverage: number;
  pertWeeklyAverage: number;
  pertNetSavingsMonthly: number;
  scenarios: RealisticScenario[];
}

export interface WeeklyCashFlow {
  dogWalksIncome: DogWalkIncomeItem[];
  upbTransportSavings: number;
  rappiIncome?: RappiPartnerIncome;
  otherWeeklyIncome: number;
  volatilityModel?: IncomeVolatilityModel;
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
  targetBudget: number;
  cashInHand: number;
  nuBoxSavings: number;
  nequiSavings: number;
  totalLiquidAvailable: number;
  receivablesTotal: number;
  pendingFixedExpenses: number;
  realFreeSurplus: number;
  pendingFamilyContributions: number;
  totalTripSecuredCapital: number;
  projectedBuffer: number;
  housingCovered: boolean;
  statusDiagnostic: 'BIEN 🟢' | 'ATENCIÓN 🟡' | 'CRÍTICO 🔴' | 'CONCLUIDO ✅';
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
  monthlyIncome: 773000,
  monthlyBudget: 100000,
  totalExpenses: 27200,
  savingsRate: 96.5,
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
      { id: 'walk-1', client: 'Elena', dogName: 'Sienna', walksPerWeek: 3, ratePerWalk: 16666, weeklyTotal: 50000 },
      { id: 'walk-2', client: 'Laura', dogName: 'Frida', walksPerWeek: 5, ratePerWalk: 5000, weeklyTotal: 25000 },
    ],
    upbTransportSavings: 35000,
    rappiIncome: {
      partner: 'Andrés Bello',
      days: 'Fines de semana (Viernes noche, Sábado y Domingo almuerzo/cena)',
      grossWeekendTotal: 255200,
      operatingCosts: {
        gasoline: 35600,
        mobileData: 5400,
        total: 41000,
      },
      netWeekendTotal: 214200,
      splitPercentage: 50,
      myNetWeeklyTotal: 107100,
      ordersCompleted: 44,
      notes: 'Dupla en moto con Andrés Bello en horas pico de fin de semana en Montería. Ganancia 100% dividida en mitades.',
    },
    otherWeeklyIncome: 27500,
    volatilityModel: {
      pertMonthlyAverage: 773000,
      pertWeeklyAverage: 178000,
      pertNetSavingsMonthly: 351000,
      scenarios: [
        {
          id: 'scen-pessimistic',
          scenarioName: '🔴 Mes Malo (Parciales / Lluvias)',
          weeklyIncome: 107800,
          monthlyIncome: 467000,
          fixedExpensesWeekly: 15000,
          netSavingsWeekly: 9800,
          netSavingsMonthly: 44700,
          weeksToPayDebt: 59,
          description: 'Semanas de exámenes o lluvias torrenciales. Sin Rappi ni trabajos U; solo base asegurada de paseos y pasajes papá.',
        },
        {
          id: 'scen-realistic',
          scenarioName: '🟡 Mes Típico (Promedio Real)',
          weeklyIncome: 178000,
          monthlyIncome: 773000,
          fixedExpensesWeekly: 15000,
          netSavingsWeekly: 80000,
          netSavingsMonthly: 351000,
          weeksToPayDebt: 7,
          description: 'Mes normal en Montería. Paseos regulares, pasajes de papá, 2 a 3 salidas de fin de semana en Rappi con Andrés (~$67k/sem) y 1 trabajo universitario mediano.',
        },
        {
          id: 'scen-optimistic',
          scenarioName: '🟢 Mes Excelente (Pico / Quincenas)',
          weeklyIncome: 250800,
          monthlyIncome: 1087000,
          fixedExpensesWeekly: 15000,
          netSavingsWeekly: 152800,
          netSavingsMonthly: 664700,
          weeksToPayDebt: 4,
          description: 'Fines de semana con clima favorable y alta demanda de Rappi (4 salidas de V-S-D a tope), 2 trabajos universitarios y paseos al 100%.',
        },
      ],
    },
    weeklyFixedExpenses: [
      { id: 'fix-3', concept: 'Imprevistos & Recargas Móviles', amount: 15000, category: 'Varios' },
    ],
  },
  expenses: [
    {
      id: 'exp-1',
      category: 'Ocio y Café',
      title: 'Suscripción Mensual Spotify',
      amount: 5100,
      date: '2026-10-05',
      paymentMethod: 'Tarjeta Débito',
    },
    {
      id: 'exp-2',
      category: 'Ocio y Café',
      title: 'Suscripción Mensual Crunchyroll',
      amount: 5100,
      date: '2026-10-06',
      paymentMethod: 'Tarjeta Débito',
    },
    {
      id: 'exp-3',
      category: 'Gimnasio & Salud',
      title: 'Imprevistos & Recargas Móviles',
      amount: 15000,
      date: '2026-10-15',
      paymentMethod: 'Nequi',
    },
    {
      id: 'exp-4',
      category: 'Transporte',
      title: 'Transporte Universitario Ocasional',
      amount: 2000,
      date: '2026-10-18',
      paymentMethod: 'Efectivo',
    },
  ],
  medellinTrip: {
    tripDates: '8 - 12 de Octubre de 2026',
    targetBudget: 375000,
    cashInHand: 202000,
    nuBoxSavings: 148579,
    nequiSavings: 0,
    totalLiquidAvailable: 350579,
    receivablesTotal: 0,
    pendingFixedExpenses: 12000,
    realFreeSurplus: 338579,
    pendingFamilyContributions: 0,
    totalTripSecuredCapital: 488579,
    projectedBuffer: 113579,
    housingCovered: true,
    statusDiagnostic: 'CONCLUIDO ✅',
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
      { category: 'Alojamiento (Airbnb)', amount: 0, description: '100% Cubierto y liquidado ($0.00 COP)', status: 'Cubierto' },
      { category: 'Bus Aeropuerto (Combuses Nutibara)', amount: 40000, description: 'Trayecto Rionegro - Medellín ida y vuelta', status: 'Planificado' },
      { category: 'Transporte Local (Tarjeta Cívica Metro)', amount: 35000, description: 'Metro, Metrocable y Tranvía de Medellín', status: 'Planificado' },
      { category: 'Alimentación (5 Días)', amount: 180000, description: 'Ajustado por llegada a la 1:49 p.m. el jueves 8', status: 'Prioritario' },
      { category: 'Actividades y Salidas', amount: 70000, description: 'Entradas, museos, cafés de especialidad', status: 'Planificado' },
      { category: 'Reserva de Imprevistos', amount: 50000, description: 'Reserva intocable para contingencias en viaje', status: 'Prioritario' },
    ],
    receivables: [
      { id: 'rec-1', client: 'Laura', concept: 'Paseos caninos de Frida (5 paseos x $5.000)', amount: 25000, status: 'Pendiente', dogName: 'Frida', notes: 'Pendiente de cobro. NO está incluido aún en el saldo de Cajita Nu.' },
      { id: 'rec-2', client: 'María Minerva', concept: 'Cuenta por cobrar personal', amount: 10000, status: 'Pendiente', notes: 'Pendiente de cobro.' },
      { id: 'rec-3', client: 'Elena', concept: 'Paseos caninos de Sienna (3 paseos)', amount: 50000, status: 'Cobrado', dogName: 'Sienna', notes: '100% cobrado y ya incluido en el saldo de Cajita Nu ($116.929 COP).' },
      { id: 'rec-4', client: 'Rappi / Clientes Varios', concept: 'Entregas & Servicios', amount: 0, status: 'Cobrado', notes: 'Cartera 100% liquidada y disponible.' },
    ],
  },
};
