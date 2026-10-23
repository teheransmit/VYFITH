/**
 * TIER 3: CROSS-FEATURE COMBINATIONS TEST SUITE
 * 
 * Verifies complex interactions across multiple financial subsystems:
 * - T3.1 Multi-day daily logs modifying multiple accounts
 * - T3.2 Immediate liquid flows vs. deferred walk receivables under concurrent operations
 * - T3.3 Nu daily yield accrual across multiple days while spending from Nequi
 * - T3.4 Walk settlement into Nu triggering automatic yield increase
 * - T3.5 Concurrent dad abono registration and debt collection
 * - T3.6 Round-trip serialization & deserialization between Room DTOs and Next.js JSON API
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FinanceDomainStore,
  calculateNuDailyYield,
  computeMedellinMetrics,
  SIENNA_RATE,
  FRIDA_RATE,
} from './finance_domain.mjs';

describe('Tier 3: Cross-Feature Combinations', () => {
  it('T3.1 Multi-Day Sequential Logs: correctly tracks balances and pending walks across 4 days', () => {
    const store = new FinanceDomainStore();
    // Baseline: Efectivo $85k, Nu $320k, Nequi $245k, pending walks $48.7k

    // Day 1: Sienna walk + Rappi $40,000 - Expense $15,000 -> Nequi
    store.saveDailyRecord({
      dateDisplay: '2026-10-24',
      sienna: true,
      frida: false,
      rappi: 40000.0,
      expense: 15000.0,
      targetAccountName: 'Nequi',
    });
    // Nequi: 245k + 25k = 270k; Pending walks: 48.7k + 9k = 57.7k
    assert.equal(store.getAccount('Nequi').balance, 270000.0);
    assert.equal(store.tripSettings.pendingWalksWeekly, 57700.0);

    // Day 2: Frida walk + No Rappi - Expense $20,000 -> Efectivo
    store.saveDailyRecord({
      dateDisplay: '2026-10-25',
      sienna: false,
      frida: true,
      rappi: 0.0,
      expense: 20000.0,
      targetAccountName: 'Efectivo',
    });
    // Efectivo: 85k - 20k = 65k; Pending walks: 57.7k + 5.85k = 63.55k
    assert.equal(store.getAccount('Efectivo').balance, 65000.0);
    assert.equal(store.tripSettings.pendingWalksWeekly, 63550.0);

    // Day 3: Both Sienna + Frida + Rappi $50,000 - Expense $0 -> Cuenta Nu
    store.saveDailyRecord({
      dateDisplay: '2026-10-26',
      sienna: true,
      frida: true,
      rappi: 50000.0,
      expense: 0.0,
      targetAccountName: 'Cuenta Nu',
    });
    // Nu: 320k + 50k = 370k; Pending walks: 63.55k + 14.85k = 78.4k
    assert.equal(store.getAccount('Cuenta Nu').balance, 370000.0);
    assert.equal(store.tripSettings.pendingWalksWeekly, 78400.0);

    // Day 4: No walks, pure expense $10,000 -> Nequi
    store.saveDailyRecord({
      dateDisplay: '2026-10-27',
      sienna: false,
      frida: false,
      rappi: 0.0,
      expense: 10000.0,
      targetAccountName: 'Nequi',
    });
    // Nequi: 270k - 10k = 260k; Pending walks: remains 78.4k
    assert.equal(store.getAccount('Nequi').balance, 260000.0);
    assert.equal(store.tripSettings.pendingWalksWeekly, 78400.0);

    // Total logs count: 4
    assert.equal(store.dailyLogs.length, 4);

    // Total liquid balance: Efectivo 65k + Nu 370k + Nequi 260k = 695k
    assert.equal(store.getTotalBalance(), 695000.0);
  });

  it('T3.2 Immediate vs. Deferred Splitting: simultaneously segregates immediate cash from receivables', () => {
    const store = new FinanceDomainStore();
    const beforeEfectivo = store.getAccount('Efectivo').balance;
    const beforePending = store.tripSettings.pendingWalksWeekly;

    // A single log with Sienna ($9,000), Frida ($5,850), Rappi ($28,000), and Expense ($14,000)
    const result = store.saveDailyRecord({
      dateDisplay: '2026-10-28',
      sienna: true,
      frida: true,
      rappi: 28000.0,
      expense: 14000.0,
      targetAccountName: 'Efectivo',
      note: 'Doble paseo + Rappi almuerzo',
    });

    // Immediate cash impact is strictly Rappi - Expense = 28,000 - 14,000 = +14,000
    assert.equal(result.immediateNetChange, 14000.0);
    assert.equal(store.getAccount('Efectivo').balance, beforeEfectivo + 14000.0);

    // Deferred walk earnings is strictly Sienna + Frida = 9,000 + 5,850 = 14,850
    assert.equal(result.walksSum, 14850.0);
    assert.equal(store.tripSettings.pendingWalksWeekly, beforePending + 14850.0);

    // Walks did NOT leak into the immediate cash account
    assert.notEqual(store.getAccount('Efectivo').balance, beforeEfectivo + 14000.0 + 14850.0);
  });

  it('T3.3 Nu Yield Accrual Concurrent with Spending: tracks yield while funds are spent from other accounts', () => {
    const store = new FinanceDomainStore();
    const nuAccount = store.getAccount('Cuenta Nu');
    const nequi = store.getAccount('Nequi');

    // Day 1 yield on Nu ($320,000)
    const yieldDay1 = calculateNuDailyYield(nuAccount.balance, 1);
    assert.equal(yieldDay1, 77.97);

    // Spend $50,000 from Nequi
    store.saveDailyRecord({
      dateDisplay: '2026-10-29',
      sienna: false,
      frida: false,
      rappi: 0,
      expense: 50000.0,
      targetAccountName: 'Nequi',
      note: 'Mercado UPB',
    });
    assert.equal(nequi.balance, 195000.0);

    // Day 2 Nu balance was untouched ($320,000), so yield remains identical
    const yieldDay2 = calculateNuDailyYield(nuAccount.balance, 1);
    assert.equal(yieldDay2, 77.97);

    // Cumulative 7-day yield on Nu regardless of Nequi transactions
    const yield7Days = calculateNuDailyYield(nuAccount.balance, 7);
    // 320,000 * ((1 + i_daily)^7 - 1) ≈ 546.20 COP
    assert.equal(yield7Days, 546.2);
  });

  it('T3.4 Walk Settlement into Nu: increases Nu balance and immediately elevates daily yield', () => {
    const store = new FinanceDomainStore();
    const nu = store.getAccount('Cuenta Nu');

    // Initial Nu: $320,000 COP -> Yield = $77.97 COP
    const initialYield = calculateNuDailyYield(nu.balance, 1);
    assert.equal(initialYield, 77.97);

    // Store has $48,700 COP in pending walks. Settle them into Cuenta Nu
    const settlement = store.settleWeeklyWalks('Cuenta Nu');
    assert.equal(settlement.settledAmount, 48700.0);
    assert.equal(nu.balance, 368700.0); // 320,000 + 48,700
    assert.equal(store.tripSettings.pendingWalksWeekly, 0.0);

    // New daily yield on updated Nu balance ($368,700):
    // 368,700 * 0.00024366313... ≈ 89.84 COP/day
    const elevatedYield = calculateNuDailyYield(nu.balance, 1);
    assert.equal(elevatedYield, 89.84, 'Yield must increase proportionally to settled funds');
    assert.ok(elevatedYield > initialYield);
  });

  it('T3.5 Concurrent Dad Abono & Debt Collection: updates family commitment and liquid accounts', () => {
    const store = new FinanceDomainStore();
    const initialTotal = store.getTotalBalance();

    // 1. Dad abona $100,000 COP into Nequi
    const metricsAfterDad = store.registerDadAbono(100000.0, 'Nequi');
    assert.equal(store.tripSettings.dadPaidAmount, 240000.0);
    assert.equal(metricsAfterDad.dadPendingAmount, 210000.0);
    assert.equal(store.getAccount('Nequi').balance, 345000.0); // 245k + 100k

    // 2. Friend Mateo settles his debt ($20,000 COP) into Efectivo
    const debtSettlement = store.settlePendingDebt(2, 'Efectivo');
    assert.ok(debtSettlement);
    assert.equal(debtSettlement.credited, 20000.0);
    assert.equal(store.getAccount('Efectivo').balance, 105000.0); // 85k + 20k

    // Total liquid balance increased by 100k (dad) + 20k (Mateo) = 120k
    assert.equal(store.getTotalBalance(), initialTotal + 120000.0);

    // Free liquid surplus is updated
    assert.equal(store.getFreeLiquidSurplus(), (initialTotal + 120000.0) - 175200.0);
  });

  it('T3.6 Round-Trip State Serialization / Deserialization: preserves all entities and calculations', () => {
    const store1 = new FinanceDomainStore();

    // Make some mutations
    store1.saveDailyRecord({
      dateDisplay: '2026-10-23',
      sienna: true,
      rappi: 25000.0,
      expense: 5000.0,
      targetAccountName: 'Nequi',
    });
    store1.registerDadAbono(60000.0, 'Cuenta Nu');
    store1.addPendingDebt('Laura', 45000.0, 'Paseos extra');

    // Export to JSON string (simulating HTTP payload over /api/finance/state)
    const exportedState = store1.exportUnifiedState();
    const jsonPayload = JSON.stringify(exportedState);

    // Create fresh store and import the payload
    const store2 = new FinanceDomainStore();
    const parsedPayload = JSON.parse(jsonPayload);
    store2.importUnifiedState(parsedPayload);

    // Verify exact equality of reconstructed state
    assert.equal(store2.accounts.length, store1.accounts.length);
    assert.equal(store2.getTotalBalance(), store1.getTotalBalance());
    assert.equal(store2.tripSettings.dadPaidAmount, store1.tripSettings.dadPaidAmount);
    assert.equal(store2.tripSettings.pendingWalksWeekly, store1.tripSettings.pendingWalksWeekly);
    assert.equal(store2.pendingDebts.length, store1.pendingDebts.length);
    assert.equal(store2.dailyLogs.length, store1.dailyLogs.length);

    // Recomputed metrics on imported store must match 100%
    const metrics1 = computeMedellinMetrics(store1.tripSettings);
    const metrics2 = computeMedellinMetrics(store2.tripSettings);
    assert.deepEqual(metrics1, metrics2);
  });
});
