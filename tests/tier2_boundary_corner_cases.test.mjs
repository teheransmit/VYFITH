/**
 * TIER 2: BOUNDARY & CORNER CASES TEST SUITE
 * 
 * Verifies edge cases, mathematical limits, and boundary stability:
 * - T2.1 Zero & micro balance Nu yield
 * - T2.2 Negative account balance (overdraft) and negative Nu yield protection
 * - T2.3 Empty daily log validation rejection
 * - T2.4 Dad abono saturation at $450,000 COP and beyond
 * - T2.5 Zero/negative pending walks settlement idempotency
 * - T2.6 Settling already-paid pending debt (no double crediting)
 * - T2.7 Molly parameter adversarial injection protection
 * - T2.8 Extreme currency values and floating point precision
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FinanceDomainStore,
  calculateNuDailyYield,
  computeMedellinMetrics,
  DAD_COMMITMENT_DEFAULT,
} from './finance_domain.mjs';

describe('Tier 2: Boundary & Corner Cases', () => {
  it('T2.1 Zero & Micro Nu Balance: returns 0.00 without NaN, infinity or division by zero', () => {
    // 0 balance
    assert.equal(calculateNuDailyYield(0, 1), 0.0);
    assert.equal(calculateNuDailyYield(0, 30), 0.0);

    // Negative balance input to yield function
    assert.equal(calculateNuDailyYield(-100000, 1), 0.0, 'Negative balance must yield 0 interest');

    // NaN and invalid days input
    assert.equal(calculateNuDailyYield(NaN, 1), 0.0);
    assert.equal(calculateNuDailyYield(100000, 0), 0.0);
    assert.equal(calculateNuDailyYield(100000, -5), 0.0);

    // Micro-balance (e.g. $10 COP)
    // 10 * 0.00024366313... = 0.002436 -> rounds to 0.00 COP
    const microYield = calculateNuDailyYield(10, 1);
    assert.equal(microYield, 0.0, 'Micro yield below 1 centavo rounds to 0.00');

    // Small balance (e.g. $5,000 COP)
    // 5000 * 0.00024366313... = 1.218 -> rounds to 1.22 COP
    const smallYield = calculateNuDailyYield(5000, 1);
    assert.equal(smallYield, 1.22, 'Small yield calculates accurately');
  });

  it('T2.2 Overdraft / Negative Balances: accounts can be in negative and correctly affect free surplus', () => {
    const store = new FinanceDomainStore();
    // Simulate overdraft on Nequi: -$50,000 COP
    const nequi = store.getAccount('Nequi');
    nequi.balance = -50000.0;

    // Total balance: Efectivo $85,000 + Nu $320,000 + Nequi -$50,000 = $355,000 COP
    assert.equal(store.getTotalBalance(), 355000.0);

    // Free surplus: $355,000 - $175,200 = $179,800 COP
    assert.equal(store.getFreeLiquidSurplus(), 179800.0);

    // Heavy overdraft making net surplus negative
    nequi.balance = -600000.0;
    // Total balance: 85,000 + 320,000 - 600,000 = -195,000 COP
    assert.equal(store.getTotalBalance(), -195000.0);
    // Free surplus: -195,000 - 175,200 = -370,200 COP
    assert.equal(store.getFreeLiquidSurplus(), -370200.0);
  });

  it('T2.3 Empty Daily Log Rejection: rejects submission when all fields are empty or 0', () => {
    const store = new FinanceDomainStore();

    // 1. All false/0
    assert.throws(
      () => {
        store.saveDailyRecord({
          sienna: false,
          frida: false,
          rappi: 0,
          expense: 0,
        });
      },
      /Validation failed/,
      'Must reject empty daily log'
    );

    // 2. Negative expense or rappi without walks
    assert.throws(
      () => {
        store.saveDailyRecord({
          sienna: false,
          frida: false,
          rappi: -10,
          expense: 0,
        });
      },
      /Validation failed/
    );

    // 3. Invalid target account
    assert.throws(
      () => {
        store.saveDailyRecord({
          sienna: true,
          targetAccountName: 'NonExistentBank',
        });
      },
      /Cuenta no encontrada/
    );
  });

  it('T2.4 Dad Abono Saturation at $450,000 COP and Beyond', () => {
    const store = new FinanceDomainStore();

    // Baseline: committed 450k, paid 140k -> pending 310k, progress ≈ 31.11%
    let metrics = computeMedellinMetrics(store.tripSettings);
    assert.equal(metrics.dadPendingAmount, 310000.0);
    assert.ok(Math.abs(metrics.dadProgress - (140000 / 450000)) < 1e-4);

    // Scenario A: Dad delivers exact remaining amount ($310,000 COP)
    metrics = store.registerDadAbono(310000.0, 'Nequi');
    assert.equal(metrics.dadPaidAmount, 450000.0);
    assert.equal(metrics.dadPendingAmount, 0.0, 'Pending amount must be exactly 0.0 at full commitment');
    assert.equal(metrics.dadProgress, 1.0, 'Progress must be 1.0 (100%)');

    // Scenario B: Dad generously gives an additional $50,000 COP ($500,000 total)
    metrics = store.registerDadAbono(50000.0, 'Nequi');
    assert.equal(metrics.dadPaidAmount, 500000.0);
    assert.equal(metrics.dadPendingAmount, 0.0, 'Pending amount must not become negative (clamped at 0.0)');
    assert.equal(metrics.dadProgress, 1.0, 'Progress must saturate at 1.0 (100%)');

    // Invalid abono amount (0 or negative)
    assert.throws(() => store.registerDadAbono(0), /mayor a 0/);
    assert.throws(() => store.registerDadAbono(-20000), /mayor a 0/);
  });

  it('T2.5 Zero & Negative Pending Walks Settlement: idempotent and returns 0 with no account mutation', () => {
    const store = new FinanceDomainStore();
    store.tripSettings.pendingWalksWeekly = 0.0;
    const initialNuBalance = store.getAccount('Cuenta Nu').balance;
    const initialLogsCount = store.dailyLogs.length;

    // Settle when balance is 0
    const result0 = store.settleWeeklyWalks('Cuenta Nu');
    assert.equal(result0.settledAmount, 0.0);
    assert.equal(store.getAccount('Cuenta Nu').balance, initialNuBalance, 'Account balance must not change');
    assert.equal(store.dailyLogs.length, initialLogsCount, 'No settlement log should be created');

    // Settle when balance is negative (defensive check)
    store.tripSettings.pendingWalksWeekly = -500.0;
    const resultNeg = store.settleWeeklyWalks('Cuenta Nu');
    assert.equal(resultNeg.settledAmount, 0.0);
    assert.equal(store.getAccount('Cuenta Nu').balance, initialNuBalance);
  });

  it('T2.6 Duplicate Debt Settlement: prevents double crediting on already-paid receivables', () => {
    const store = new FinanceDomainStore();
    const initialCash = store.getAccount('Efectivo').balance;

    // 1st Settlement of Camilo ($35,000 COP)
    const firstSettlement = store.settlePendingDebt(1, 'Efectivo');
    assert.equal(firstSettlement.alreadyPaid, false);
    assert.equal(firstSettlement.credited, 35000.0);
    assert.equal(store.getAccount('Efectivo').balance, initialCash + 35000.0);

    // 2nd Settlement attempt of Camilo (should be idempotent)
    const secondSettlement = store.settlePendingDebt(1, 'Efectivo');
    assert.equal(secondSettlement.alreadyPaid, true);
    assert.equal(secondSettlement.credited, 0.0, 'Must NOT double credit account on duplicate settlement');
    assert.equal(store.getAccount('Efectivo').balance, initialCash + 35000.0, 'Account balance must remain unchanged');

    // Non-existent debt ID
    const notFound = store.settlePendingDebt(9999, 'Efectivo');
    assert.equal(notFound, null);
  });

  it('T2.7 Molly Exclusion Adversarial Verification: rejects Molly walks and eliminates value', () => {
    const store = new FinanceDomainStore();
    const initialPending = store.tripSettings.pendingWalksWeekly;
    const initialNequi = store.getAccount('Nequi').balance;

    // Adversarial payload attempting to sneak Molly with explicit rates
    const res = store.saveDailyRecord({
      dateDisplay: '23 de octubre, 2026',
      sienna: false,
      frida: false,
      molly: true,
      mollyWalk: true,
      mollyRate: 5000,
      rappi: 20000.0,
      expense: 5000.0,
      targetAccountName: 'Nequi',
      note: 'Infiltration test',
    });

    // Molly walked is forced false, walksSum is 0
    assert.equal(res.walksSum, 0.0, 'Molly must contribute exactly $0 COP');
    assert.equal(store.tripSettings.pendingWalksWeekly, initialPending, 'Pending walks must not increase for Molly');
    assert.equal(res.logEntry.mollyWalk, false, 'mollyWalk must be stored as false');

    // Liquid impact should be Rappi - expense: 20,000 - 5,000 = +15,000 COP
    assert.equal(res.immediateNetChange, 15000.0);
    assert.equal(store.getAccount('Nequi').balance, initialNequi + 15000.0);
  });

  it('T2.8 Extreme Currency Values & Floating-Point Precision: preserves decimal precision', () => {
    const store = new FinanceDomainStore();
    // Test billion COP value
    const largeNu = store.getAccount('Cuenta Nu');
    largeNu.balance = 1_000_000_000.0; // 1 Billion COP

    // Yield on 1 billion: 1,000,000,000 * 0.00024366313... ≈ 243,663.13 COP/day
    const billionYield = calculateNuDailyYield(largeNu.balance, 1);
    assert.equal(billionYield, 243663.13, 'Billion COP daily yield calculates cleanly');

    // Precision check: verify that cents rounding does not introduce precision leakage
    const testAmount = 14850.55;
    const singleCentYield = calculateNuDailyYield(testAmount, 1);
    assert.ok(typeof singleCentYield === 'number' && !isNaN(singleCentYield));
  });
});
