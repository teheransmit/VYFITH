/**
 * TIER 1: FEATURE COVERAGE TEST SUITE
 * 
 * Exercises all primary features and interfaces of VYFITH Financial Module:
 * - T1.1 Account balances (CASH, NU, NEQUI)
 * - T1.2 Nu daily compound yield (9.30% E.A.)
 * - T1.3 Fixed expenses & Free liquid surplus
 * - T1.4 DailyLog registration (Sienna, Frida, Rappi, expenses, NO Molly)
 * - T1.5 TripSettings baseline & Medellín metrics
 * - T1.6 PendingDebt lifecycle & settlement
 * - T1.7 REST API payload formats
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FinanceDomainStore,
  calculateNuDailyYield,
  computeMedellinMetrics,
  NU_EA_RATE,
  SIENNA_RATE,
  FRIDA_RATE,
  TOTAL_MEDELLIN_COST,
  DAD_COMMITMENT_DEFAULT,
  BASE_AVAILABLE_FUND,
} from './finance_domain.mjs';

describe('Tier 1: Feature Coverage (Core Engine & Contracts)', () => {
  it('T1.1 Account Balances: initializes with standard 3 accounts and sums balances correctly', () => {
    const store = new FinanceDomainStore();
    const accounts = store.accounts;

    assert.equal(accounts.length, 3, 'Should have exactly 3 initial accounts');

    const efectivo = store.getAccount('Efectivo');
    const nu = store.getAccount('Cuenta Nu');
    const nequi = store.getAccount('Nequi');

    assert.ok(efectivo, 'Efectivo account must exist');
    assert.equal(efectivo.type, 'CASH');
    assert.equal(efectivo.balance, 85000.0);

    assert.ok(nu, 'Cuenta Nu must exist');
    assert.equal(nu.type, 'NU');
    assert.equal(nu.balance, 320000.0);

    assert.ok(nequi, 'Nequi account must exist');
    assert.equal(nequi.type, 'NEQUI');
    assert.equal(nequi.balance, 245000.0);

    // Sum: 85,000 + 320,000 + 245,000 = 650,000 COP
    assert.equal(store.getTotalBalance(), 650000.0, 'Total initial liquid balance should equal $650,000 COP');
  });

  it('T1.2 Nu Daily Compound Yield: yields exact values at 9.30% E.A. for 1 day and 30 days', () => {
    assert.equal(NU_EA_RATE, 0.0930, 'Nu EA rate must be 9.30%');

    // Expected daily compound interest on $320,000 COP:
    // i_daily = (1.093)^(1/365) - 1 ≈ 0.00024366313088708402
    // 320,000 * 0.00024366313088708402 = 77.9722 -> 77.97 COP (exact mathematical oracle)
    const dailyYield = calculateNuDailyYield(320000.0, 1);
    assert.equal(dailyYield, 77.97, '1-day compound yield for $320k must be $77.97 COP');

    // 30-day projection on $320,000 COP:
    // 320,000 * ((1 + i_daily)^30 - 1) ≈ 2347.45 COP
    const monthlyYield = calculateNuDailyYield(320000.0, 30);
    assert.equal(monthlyYield, 2347.45, '30-day compound yield for $320k must be $2,347.45 COP');

    // Yield on $1,000,000 COP:
    const millionYield = calculateNuDailyYield(1000000.0, 1);
    assert.equal(millionYield, 243.66, '1-day compound yield for $1M must be $243.66 COP');
  });

  it('T1.3 Fixed Expenses & Free Liquid Surplus: aggregates fixed obligations and computes surplus', () => {
    const store = new FinanceDomainStore();
    const expenses = store.fixedExpenses;

    assert.equal(expenses.length, 3, 'Should have 3 default fixed expenses');
    // Vuelos: 140,000, Suscripciones: 10,200, Motilada: 25,000 = 175,200 COP
    assert.equal(store.getTotalFixedExpenses(), 175200.0, 'Fixed expenses total must be $175,200 COP');

    // Free liquid surplus: Total liquid balances ($650,000) - Total fixed expenses ($175,200) = $474,800 COP
    const freeSurplus = store.getFreeLiquidSurplus();
    assert.equal(freeSurplus, 474800.0, 'Free liquid surplus must be $474,800 COP');
  });

  it('T1.4 DailyLog Registration: handles walks, Rappi and expenses immediately to account without Molly', () => {
    const store = new FinanceDomainStore();
    const initialNequi = store.getAccount('Nequi').balance;
    const initialPendingWalks = store.tripSettings.pendingWalksWeekly;

    // Record a day with Sienna ($9,000 pending), Rappi +$35,000, Expense -$12,000, and attempted Molly
    const result = store.saveDailyRecord({
      dateDisplay: '23 de octubre, 2026',
      sienna: true,
      frida: false,
      molly: true, // Should be ignored and forced to false
      rappi: 35000.0,
      expense: 12000.0,
      targetAccountName: 'Nequi',
      note: 'Turno tarde y paseo',
    });

    // Immediate liquid net change: 35,000 - 12,000 = +23,000 COP
    assert.equal(result.immediateNetChange, 23000.0);
    assert.equal(result.updatedAccountBalance, initialNequi + 23000.0);
    assert.equal(store.getAccount('Nequi').balance, 268000.0);

    // Walks sum: only Sienna ($9,000), zero Molly
    assert.equal(result.walksSum, 9000.0);
    assert.equal(store.tripSettings.pendingWalksWeekly, initialPendingWalks + 9000.0);

    // Verify persisted log
    const savedLog = store.dailyLogs[0];
    assert.ok(savedLog, 'Daily log must be stored');
    assert.equal(savedLog.siennaWalk, true);
    assert.equal(savedLog.fridaWalk, false);
    assert.equal(savedLog.mollyWalk, false, 'Molly must ALWAYS be false');
    assert.equal(savedLog.walksIncome, 9000.0);
    assert.equal(savedLog.netChange, 23000.0);
  });

  it('T1.5 TripSettings & Medellín Metrics: verifies baseline targets and luxury balance', () => {
    const store = new FinanceDomainStore();
    const metrics = computeMedellinMetrics(store.tripSettings);

    assert.equal(metrics.totalEstimatedCost, 584549.0, 'Total estimated trip cost must be $584,549 COP');
    assert.equal(metrics.availableFund, 550000.0, 'Available fund baseline must be $550,000 COP');
    assert.equal(metrics.dadTotalCommitted, 450000.0, 'Dad committed baseline must be $450,000 COP');
    assert.equal(metrics.dadPaidAmount, 140000.0, 'Dad initial paid amount must be $140,000 COP');

    // Dad pending: 450,000 - 140,000 = 310,000 COP
    assert.equal(metrics.dadPendingAmount, 310000.0);

    // Personal target for Santiago: 584,549 - 450,000 = 134,549 COP
    assert.equal(metrics.personalRemainingTarget, 134549.0);

    // Luxury balance: 550,000 - 584,549 = -34,549 COP (Deficit)
    assert.equal(metrics.balanceParaLujos, -34549.0);
    assert.equal(metrics.isDeficit, true);
    assert.equal(metrics.deficitAmount, 34549.0);
    assert.equal(metrics.surplusAmount, 0.0);

    // Projected fund with dad: 550,000 + 310,000 = 860,000 COP
    assert.equal(metrics.projectedFundWithDad, 860000.0);

    // Projected surplus with dad: 860,000 - 584,549 = +275,451 COP
    assert.equal(metrics.projectedSurplusWithDad, 275451.0);

    // Sienna walks needed: ceil(134,549 / 9,000) = 15 walks
    assert.equal(metrics.siennaWalksNeeded, 15);
  });

  it('T1.6 PendingDebt Lifecycle: registers and settles receivables to target account', () => {
    const store = new FinanceDomainStore();
    const initialCash = store.getAccount('Efectivo').balance;

    // Verify initial debts (Camilo $35k, Mateo $20k)
    assert.equal(store.pendingDebts.length, 2);

    // Add new debt for Yessid's lunch ($15,000 COP)
    const newDebt = store.addPendingDebt('Andres', 15000.0, 'Gasolina moto');
    assert.equal(newDebt.id, 3);
    assert.equal(newDebt.amount, 15000.0);
    assert.equal(newDebt.isPaid, false);

    // Settle Camilo's debt ($35,000 COP) to Efectivo
    const settlement = store.settlePendingDebt(1, 'Efectivo');
    assert.ok(settlement);
    assert.equal(settlement.alreadyPaid, false);
    assert.equal(settlement.credited, 35000.0);
    assert.equal(settlement.debt.isPaid, true);
    assert.equal(settlement.debt.paidToAccount, 'Efectivo');
    assert.equal(store.getAccount('Efectivo').balance, initialCash + 35000.0);
  });

  it('T1.7 REST API Payloads: exports state conforming to /api/finance/state contract', () => {
    const store = new FinanceDomainStore();
    const exported = store.exportUnifiedState();

    assert.ok(Array.isArray(exported.accounts), 'accounts must be an array');
    assert.equal(exported.accounts.length, 3);
    const nuAccount = exported.accounts.find(a => a.type === 'NU');
    assert.ok(nuAccount);
    assert.equal(nuAccount.dailyYieldCOP, 77.97, 'Nu account DTO must include dailyYieldCOP (77.97 COP)');

    assert.ok(Array.isArray(exported.fixedExpenses), 'fixedExpenses must be an array');
    assert.ok(exported.tripSettings, 'tripSettings must exist');
    assert.equal(exported.tripSettings.personalRemainingTarget, 134549.0);
    assert.equal(exported.tripSettings.projectedSurplusWithDad, 275451.0);

    assert.ok(Array.isArray(exported.pendingDebts), 'pendingDebts must be an array');
    assert.ok(Array.isArray(exported.dailyLogs), 'dailyLogs must be an array');
    assert.ok(exported.lastSynced, 'lastSynced ISO timestamp must be populated');
  });
});
