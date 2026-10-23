/**
 * VYFITH Unified Financial Domain Engine & Calculation Library
 * 
 * Provides reference domain logic for:
 * - Account balances & compound interest on Cuenta Nu (9.30% E.A.)
 * - Daily logs registration (Sienna $9,000, Frida $5,850, NO Molly)
 * - Immediate liquid flows vs. deferred walk receivables (pendingWalksWeekly)
 * - Weekly walk settlement and pending debt resolution
 * - Dad abono tracking, saturation limits ($450,000 COP)
 * - Medellín trip budget simulator ($584,549 COP target) and luxury balance
 * - Unified JSON state serialization conforming to REST API contracts
 */

export const NU_EA_RATE = 0.0930;
export const NU_DAILY_RATE = Math.pow(1 + NU_EA_RATE, 1 / 365) - 1; // ≈ 0.0002434571905

export const SIENNA_RATE = 9000.0;
export const FRIDA_RATE = 5850.0;
export const TOTAL_MEDELLIN_COST = 584549.0;
export const DAD_COMMITMENT_DEFAULT = 450000.0;
export const BASE_AVAILABLE_FUND = 550000.0;

/**
 * Calculates compound interest yield for Nu account.
 * @param {number} balance 
 * @param {number} [days=1]
 * @returns {number} Yield in COP rounded to 2 decimals
 */
export function calculateNuDailyYield(balance, days = 1) {
  if (balance <= 0 || isNaN(balance) || days <= 0) return 0.0;
  const yieldAmount = balance * (Math.pow(1 + NU_DAILY_RATE, days) - 1);
  return Math.round(yieldAmount * 100) / 100;
}

/**
 * Creates initial default accounts.
 */
export function createDefaultAccounts() {
  return [
    { id: 1, name: 'Efectivo', balance: 85000.0, type: 'CASH' },
    { id: 2, name: 'Cuenta Nu', balance: 320000.0, type: 'NU' },
    { id: 3, name: 'Nequi', balance: 245000.0, type: 'NEQUI' },
  ];
}

/**
 * Creates initial fixed expenses.
 */
export function createDefaultFixedExpenses() {
  return [
    { id: 1, title: 'Vuelos', amount: 140000.0, category: 'DEBT' },
    { id: 2, title: 'Suscripciones (Spotify/Crunchyroll)', amount: 10200.0, category: 'SUBSCRIPTION' },
    { id: 3, title: 'Motilada', amount: 25000.0, category: 'GENERAL' },
  ];
}

/**
 * Creates initial trip settings.
 */
export function createDefaultTripSettings() {
  return {
    id: 1,
    availableFund: BASE_AVAILABLE_FUND,
    dadTotalCommitted: DAD_COMMITMENT_DEFAULT,
    dadPaidAmount: 140000.0,
    pendingWalksWeekly: 48700.0,
  };
}

/**
 * Creates initial pending debts (receivables from third parties).
 */
export function createDefaultPendingDebts() {
  return [
    { id: 1, debtorName: 'Camilo', amount: 35000.0, description: 'Préstamo salida fin de semana', dateCreated: '28 de agosto, 2026', isPaid: false, paidDate: null, paidToAccount: null },
    { id: 2, debtorName: 'Mateo', amount: 20000.0, description: 'Mitad almuerzo', dateCreated: '30 de agosto, 2026', isPaid: false, paidDate: null, paidToAccount: null },
  ];
}

/**
 * Computes Medellín simulator metrics.
 */
export function computeMedellinMetrics(tripSettings, customCost = TOTAL_MEDELLIN_COST) {
  const cost = customCost;
  const available = tripSettings.availableFund;
  const committed = tripSettings.dadTotalCommitted;
  const paid = tripSettings.dadPaidAmount;

  const dadPendingAmount = Math.max(0, committed - paid);
  const dadProgress = committed > 0 ? Math.min(1.0, Math.max(0.0, paid / committed)) : 1.0;
  const personalRemainingTarget = Math.max(0, cost - committed);
  const balanceParaLujos = available - cost;
  const isDeficit = balanceParaLujos < 0;
  const deficitAmount = isDeficit ? Math.abs(balanceParaLujos) : 0.0;
  const surplusAmount = !isDeficit ? balanceParaLujos : 0.0;
  const projectedFundWithDad = available + dadPendingAmount;
  const projectedSurplusWithDad = projectedFundWithDad - cost;
  const siennaWalksNeeded = personalRemainingTarget > 0 ? Math.ceil(personalRemainingTarget / SIENNA_RATE) : 0;

  return {
    totalEstimatedCost: cost,
    availableFund: available,
    dadTotalCommitted: committed,
    dadPaidAmount: paid,
    dadPendingAmount,
    dadProgress,
    personalRemainingTarget,
    balanceParaLujos,
    isDeficit,
    deficitAmount,
    surplusAmount,
    projectedFundWithDad,
    projectedSurplusWithDad,
    siennaWalksNeeded,
    pendingWalksWeekly: tripSettings.pendingWalksWeekly || 0.0,
  };
}

/**
 * Complete in-memory Finance Store implementation mirroring Room & Web local-first state.
 */
export class FinanceDomainStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.accounts = createDefaultAccounts();
    this.fixedExpenses = createDefaultFixedExpenses();
    this.tripSettings = createDefaultTripSettings();
    this.pendingDebts = createDefaultPendingDebts();
    this.dailyLogs = [];
    this.nextLogId = 1;
    this.nextDebtId = 3;
    this.lastSynced = new Date().toISOString();
  }

  getAccount(nameOrType) {
    return this.accounts.find(
      a => a.name.toLowerCase() === nameOrType.toLowerCase() ||
           a.type.toLowerCase() === nameOrType.toLowerCase()
    );
  }

  getTotalBalance() {
    return this.accounts.reduce((sum, a) => sum + a.balance, 0.0);
  }

  getTotalFixedExpenses() {
    return this.fixedExpenses.reduce((sum, e) => sum + e.amount, 0.0);
  }

  getFreeLiquidSurplus() {
    return this.getTotalBalance() - this.getTotalFixedExpenses();
  }

  /**
   * Registers a daily log.
   * STRICT POLICY: Molly is completely ignored, sanitized to false, and adds $0.
   */
  saveDailyRecord({
    dateDisplay = '2026-10-23',
    sienna = false,
    frida = false,
    molly = false, // Ignored
    rappi = 0.0,
    expense = 0.0,
    targetAccountName = 'Nequi',
    note = '',
  }) {
    // Sanitize Molly
    const mollySanitized = false;

    // Validation: at least one field must be non-zero
    const hasWalk = Boolean(sienna || frida);
    const hasRappi = Number(rappi) > 0;
    const hasExpense = Number(expense) > 0;
    if (!hasWalk && !hasRappi && !hasExpense) {
      throw new Error('Validation failed: Debe ingresar al menos un paseo, turno Rappi o gasto del día.');
    }

    let walksSum = 0.0;
    if (sienna) walksSum += SIENNA_RATE;
    if (frida) walksSum += FRIDA_RATE;

    const immediateNetChange = Number(rappi) - Number(expense);

    // Apply immediate liquid change to target account
    const account = this.getAccount(targetAccountName);
    if (!account) {
      throw new Error(`Cuenta no encontrada: ${targetAccountName}`);
    }
    account.balance += immediateNetChange;

    // Accumulate deferred walk receivables into tripSettings.pendingWalksWeekly
    if (walksSum > 0) {
      this.tripSettings.pendingWalksWeekly += walksSum;
    }

    const logEntry = {
      id: this.nextLogId++,
      timestamp: Date.now(),
      dateDisplay,
      walksIncome: walksSum,
      siennaWalk: Boolean(sienna),
      fridaWalk: Boolean(frida),
      mollyWalk: mollySanitized,
      rappiIncome: Number(rappi),
      dailyExpense: Number(expense),
      netChange: immediateNetChange,
      targetAccountName: account.name,
      note: walksSum > 0 ? (note ? `${note} (Paseos por cobrar: +$${walksSum.toLocaleString('es-CO')})` : `Paseos por cobrar: +$${walksSum.toLocaleString('es-CO')}`) : note,
    };

    this.dailyLogs.push(logEntry);
    this.lastSynced = new Date().toISOString();

    return {
      immediateNetChange,
      walksSum,
      logEntry,
      updatedAccountBalance: account.balance,
      pendingWalksWeekly: this.tripSettings.pendingWalksWeekly,
    };
  }

  /**
   * Settles accumulated weekly walks into a chosen target account.
   */
  settleWeeklyWalks(targetAccountName = 'Cuenta Nu') {
    const pendingAmount = this.tripSettings.pendingWalksWeekly || 0.0;
    if (pendingAmount <= 0.0) {
      return { settledAmount: 0.0, message: 'No hay saldo pendiente de paseos por liquidar' };
    }

    const account = this.getAccount(targetAccountName);
    if (!account) {
      throw new Error(`Cuenta destino no encontrada: ${targetAccountName}`);
    }

    // 1. Credit target account
    account.balance += pendingAmount;

    // 2. Reset pending walks
    this.tripSettings.pendingWalksWeekly = 0.0;

    // 3. Insert settlement log
    const settlementLog = {
      id: this.nextLogId++,
      timestamp: Date.now(),
      dateDisplay: 'Hoy',
      walksIncome: pendingAmount,
      siennaWalk: false,
      fridaWalk: false,
      mollyWalk: false,
      rappiIncome: 0.0,
      dailyExpense: 0.0,
      netChange: pendingAmount,
      targetAccountName: account.name,
      note: 'Liquidación semanal de paseos cobrados',
    };
    this.dailyLogs.push(settlementLog);
    this.lastSynced = new Date().toISOString();

    return {
      settledAmount: pendingAmount,
      targetAccount: account.name,
      updatedBalance: account.balance,
      settlementLog,
    };
  }

  /**
   * Registers a father abono toward the Medellín trip.
   */
  registerDadAbono(addedAmount, targetAccountName = null) {
    const amount = Number(addedAmount);
    if (amount <= 0 || isNaN(amount)) {
      throw new Error('El monto del abono debe ser mayor a 0');
    }

    this.tripSettings.dadPaidAmount += amount;

    if (targetAccountName) {
      const account = this.getAccount(targetAccountName);
      if (account) {
        account.balance += amount;
      }
    }

    this.lastSynced = new Date().toISOString();
    return computeMedellinMetrics(this.tripSettings);
  }

  /**
   * Adds a pending debt owed to Santiago.
   */
  addPendingDebt(debtorName, amount, description = '') {
    if (!debtorName || !debtorName.trim()) {
      throw new Error('El nombre del deudor es obligatorio');
    }
    const numAmount = Number(amount);
    if (numAmount <= 0 || isNaN(numAmount)) {
      throw new Error('El monto de la deuda debe ser mayor a 0');
    }

    const newDebt = {
      id: this.nextDebtId++,
      debtorName: debtorName.trim(),
      amount: numAmount,
      description: description.trim(),
      dateCreated: '2026-10-23',
      isPaid: false,
      paidDate: null,
      paidToAccount: null,
    };
    this.pendingDebts.push(newDebt);
    this.lastSynced = new Date().toISOString();
    return newDebt;
  }

  /**
   * Settles a pending debt owed to Santiago.
   */
  settlePendingDebt(debtId, targetAccountName) {
    const debt = this.pendingDebts.find(d => d.id === debtId);
    if (!debt) return null;
    if (debt.isPaid) {
      // Already paid - idempotent protection against double crediting
      return { debt, alreadyPaid: true, credited: 0.0 };
    }

    const account = this.getAccount(targetAccountName);
    if (!account) {
      throw new Error(`Cuenta destino inválida: ${targetAccountName}`);
    }

    debt.isPaid = true;
    debt.paidDate = new Date().toISOString().split('T')[0];
    debt.paidToAccount = account.name;

    account.balance += debt.amount;
    this.lastSynced = new Date().toISOString();

    return { debt, alreadyPaid: false, credited: debt.amount, updatedBalance: account.balance };
  }

  /**
   * Exports unified state matching JSON REST API contract `/api/finance/state`.
   */
  exportUnifiedState() {
    const nuAccount = this.getAccount('NU');
    const nuYield = nuAccount ? calculateNuDailyYield(nuAccount.balance) : 0.0;

    const accountsDto = this.accounts.map(a => ({
      id: a.id,
      name: a.name,
      balance: a.balance,
      type: a.type,
      dailyYieldCOP: a.type === 'NU' ? nuYield : undefined,
    }));

    const tripMetrics = computeMedellinMetrics(this.tripSettings);

    return {
      accounts: accountsDto,
      fixedExpenses: this.fixedExpenses.map(e => ({ ...e })),
      tripSettings: {
        ...this.tripSettings,
        ...tripMetrics,
      },
      pendingDebts: this.pendingDebts.map(d => ({ ...d })),
      dailyLogs: this.dailyLogs.map(l => ({ ...l })),
      lastSynced: this.lastSynced,
    };
  }

  /**
   * Imports unified state with schema validation.
   */
  importUnifiedState(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload inválido');
    }
    if (!Array.isArray(payload.accounts) || !payload.tripSettings) {
      throw new Error('Estructura financiera incompleta');
    }

    this.accounts = payload.accounts.map(a => ({
      id: Number(a.id) || 0,
      name: String(a.name),
      balance: Number(a.balance) || 0.0,
      type: String(a.type),
    }));

    if (Array.isArray(payload.fixedExpenses)) {
      this.fixedExpenses = payload.fixedExpenses.map(e => ({
        id: Number(e.id) || 0,
        title: String(e.title),
        amount: Number(e.amount) || 0.0,
        category: String(e.category || 'GENERAL'),
      }));
    }

    this.tripSettings = {
      id: 1,
      availableFund: Number(payload.tripSettings.availableFund) || BASE_AVAILABLE_FUND,
      dadTotalCommitted: Number(payload.tripSettings.dadTotalCommitted) || DAD_COMMITMENT_DEFAULT,
      dadPaidAmount: Number(payload.tripSettings.dadPaidAmount) || 0.0,
      pendingWalksWeekly: Number(payload.tripSettings.pendingWalksWeekly) || 0.0,
    };

    if (Array.isArray(payload.pendingDebts)) {
      this.pendingDebts = payload.pendingDebts.map(d => ({
        id: Number(d.id) || 0,
        debtorName: String(d.debtorName),
        amount: Number(d.amount) || 0.0,
        description: String(d.description || ''),
        dateCreated: String(d.dateCreated || ''),
        isPaid: Boolean(d.isPaid),
        paidDate: d.paidDate || null,
        paidToAccount: d.paidToAccount || null,
      }));
    }

    if (Array.isArray(payload.dailyLogs)) {
      this.dailyLogs = payload.dailyLogs.map(l => ({
        id: Number(l.id) || 0,
        timestamp: Number(l.timestamp) || Date.now(),
        dateDisplay: String(l.dateDisplay || ''),
        walksIncome: Number(l.walksIncome) || 0.0,
        siennaWalk: Boolean(l.siennaWalk),
        fridaWalk: Boolean(l.fridaWalk),
        mollyWalk: false, // Strict sanitization
        rappiIncome: Number(l.rappiIncome) || 0.0,
        dailyExpense: Number(l.dailyExpense) || 0.0,
        netChange: Number(l.netChange) || 0.0,
        targetAccountName: String(l.targetAccountName || 'Nequi'),
        note: String(l.note || ''),
      }));
    }

    this.lastSynced = new Date().toISOString();
  }
}
