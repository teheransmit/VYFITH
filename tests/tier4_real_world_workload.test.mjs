/**
 * TIER 4: REAL-WORLD WORKLOAD SCENARIOS TEST SUITE
 * 
 * Simulates complete end-to-end real-world financial lifecycle for Santiago:
 * - T4.1 Comprehensive 7-Day Pre-Medellín Financial Flow (Daily logs, Rappi, walks, expenses, Nu yield, settlement, abono, debt collection)
 * - T4.2 Dad Abono Final Delivery & Commitment Saturation Scenario ($450,000 COP reached and exceeded)
 * - T4.3 Emergency Expense Stress Shock (Handling large unplanned expenses while protecting trip metrics)
 * - T4.4 End-to-End JSON Synchronization & Round-Trip Lossless Portability
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FinanceDomainStore,
  calculateNuDailyYield,
  computeMedellinMetrics,
  SIENNA_RATE,
  FRIDA_RATE,
  TOTAL_MEDELLIN_COST,
  DAD_COMMITMENT_DEFAULT,
  BASE_AVAILABLE_FUND,
} from './finance_domain.mjs';

describe('Tier 4: Real-World Workload Scenarios', () => {
  it('T4.1 Comprehensive 7-Day Pre-Medellín Financial Flow: simulates Santiago full weekly lifecycle', () => {
    const store = new FinanceDomainStore();

    // ==========================================
    // Day 0: Baseline Verification
    // ==========================================
    assert.equal(store.getAccount('Efectivo').balance, 85000.0);
    assert.equal(store.getAccount('Cuenta Nu').balance, 320000.0);
    assert.equal(store.getAccount('Nequi').balance, 245000.0);
    assert.equal(store.getTotalBalance(), 650000.0);
    assert.equal(store.getTotalFixedExpenses(), 175200.0);
    assert.equal(store.getFreeLiquidSurplus(), 474800.0);
    assert.equal(store.tripSettings.availableFund, BASE_AVAILABLE_FUND);
    assert.equal(store.tripSettings.pendingWalksWeekly, 48700.0);
    assert.equal(store.tripSettings.dadPaidAmount, 140000.0);

    const initialMetrics = computeMedellinMetrics(store.tripSettings);
    assert.equal(initialMetrics.balanceParaLujos, -34549.0); // Deficit of -$34,549
    assert.equal(initialMetrics.isDeficit, true);
    assert.equal(initialMetrics.dadPendingAmount, 310000.0);

    // ==========================================
    // Day 1 (Monday): Morning walk with Sienna + Afternoon Rappi shift + UPB lunch
    // ==========================================
    const day1Result = store.saveDailyRecord({
      dateDisplay: 'Lunes 19 de Octubre, 2026',
      sienna: true,
      frida: false,
      molly: false,
      rappi: 35000.0,
      expense: 12000.0,
      targetAccountName: 'Nequi',
      note: 'Paseo Sienna + Rappi tarde + Almuerzo UPB',
    });
    // Immediate net change: 35,000 - 12,000 = +23,000 into Nequi
    assert.equal(day1Result.immediateNetChange, 23000.0);
    assert.equal(store.getAccount('Nequi').balance, 268000.0);
    // Pending walks: 48,700 + 9,000 = 57,700
    assert.equal(store.tripSettings.pendingWalksWeekly, 57700.0);

    // ==========================================
    // Day 2 (Tuesday): Morning walk with Frida + Barbershop (motilada) from Efectivo
    // ==========================================
    const day2Result = store.saveDailyRecord({
      dateDisplay: 'Martes 20 de Octubre, 2026',
      sienna: false,
      frida: true,
      rappi: 0.0,
      expense: 25000.0,
      targetAccountName: 'Efectivo',
      note: 'Paseo Frida + Motilada barbería',
    });
    // Immediate net change: 0 - 25,000 = -25,000 from Efectivo (85k -> 60k)
    assert.equal(day2Result.immediateNetChange, -25000.0);
    assert.equal(store.getAccount('Efectivo').balance, 60000.0);
    // Pending walks: 57,700 + 5,850 = 63,550
    assert.equal(store.tripSettings.pendingWalksWeekly, 63550.0);

    // ==========================================
    // Day 3 (Wednesday): Rainy day, no dog walks, heavy evening Rappi shift + Fuel
    // ==========================================
    const day3Result = store.saveDailyRecord({
      dateDisplay: 'Miércoles 21 de Octubre, 2026',
      sienna: false,
      frida: false,
      rappi: 45000.0,
      expense: 10000.0,
      targetAccountName: 'Nequi',
      note: 'Lluvia en Montería (sin paseos) + Turno Rappi noche + Gasolina moto',
    });
    // Immediate net change: 45,000 - 10,000 = +35,000 into Nequi (268k -> 303k)
    assert.equal(day3Result.immediateNetChange, 35000.0);
    assert.equal(store.getAccount('Nequi').balance, 303000.0);
    assert.equal(store.tripSettings.pendingWalksWeekly, 63550.0); // Unchanged

    // ==========================================
    // Day 4 (Thursday): Sienna walk + UPB afternoon snack
    // ==========================================
    const day4Result = store.saveDailyRecord({
      dateDisplay: 'Jueves 22 de Octubre, 2026',
      sienna: true,
      frida: false,
      rappi: 0.0,
      expense: 8000.0,
      targetAccountName: 'Nequi',
      note: 'Paseo Sienna + Merienda panadería UPB',
    });
    // Immediate net change: 0 - 8,000 = -8,000 from Nequi (303k -> 295k)
    assert.equal(day4Result.immediateNetChange, -8000.0);
    assert.equal(store.getAccount('Nequi').balance, 295000.0);
    // Pending walks: 63,550 + 9,000 = 72,550
    assert.equal(store.tripSettings.pendingWalksWeekly, 72550.0);

    // ==========================================
    // Day 5 (Friday): Weekly dog walk settlement into Cuenta Nu!
    // Elena & Laura transfer the total pending walks ($72,550 COP)
    // ==========================================
    const settlementResult = store.settleWeeklyWalks('Cuenta Nu');
    assert.equal(settlementResult.settledAmount, 72550.0);
    assert.equal(store.tripSettings.pendingWalksWeekly, 0.0, 'Pending walks must reset to 0');
    // Nu: 320,000 + 72,550 = 392,550 COP
    assert.equal(store.getAccount('Cuenta Nu').balance, 392550.0);

    // Compound daily interest on Nu instantly reflects the increased balance
    const updatedNuYield = calculateNuDailyYield(store.getAccount('Cuenta Nu').balance, 1);
    assert.equal(updatedNuYield, 95.65, 'Yield must increase from $77.97 to $95.65 COP/day');

    // ==========================================
    // Day 6 (Saturday): Dad deposits a major abono of $200,000 COP into Nequi
    // ==========================================
    const dadAbonoMetrics = store.registerDadAbono(200000.0, 'Nequi');
    // Nequi: 295,000 + 200,000 = 495,000 COP
    assert.equal(store.getAccount('Nequi').balance, 495000.0);
    // Dad total paid: 140,000 + 200,000 = 340,000 COP
    assert.equal(store.tripSettings.dadPaidAmount, 340000.0);
    // Dad remaining to deliver: 450,000 - 340,000 = 110,000 COP
    assert.equal(dadAbonoMetrics.dadPendingAmount, 110000.0);
    assert.ok(dadAbonoMetrics.dadProgress > 0.75, 'Dad progress must exceed 75%');

    // ==========================================
    // Day 7 (Sunday): Friend Camilo repays his $35,000 COP loan into Efectivo
    // ==========================================
    const debtSettlement = store.settlePendingDebt(1, 'Efectivo');
    assert.equal(debtSettlement.alreadyPaid, false);
    assert.equal(debtSettlement.credited, 35000.0);
    // Efectivo: 60,000 + 35,000 = 95,000 COP
    assert.equal(store.getAccount('Efectivo').balance, 95000.0);

    // ==========================================
    // End-of-Week Full Financial Audit & Medellín Luxury Balance
    // ==========================================
    // Total liquid assets: Efectivo $95k + Nu $392.55k + Nequi $495k = $982,550 COP
    assert.equal(store.getTotalBalance(), 982550.0);
    // Fixed expenses remain $175,200 COP
    assert.equal(store.getTotalFixedExpenses(), 175200.0);
    // Free liquid surplus: $982,550 - $175,200 = $807,350 COP!
    assert.equal(store.getFreeLiquidSurplus(), 807350.0);

    // Santiago syncs his Medellín available fund to $700,000 COP based on his healthy surplus:
    store.tripSettings.availableFund = 700000.0;
    const finalMetrics = computeMedellinMetrics(store.tripSettings);

    // Balance for luxuries: $700,000 - $584,549 = +$115,451 COP (Comfortable surplus!)
    assert.equal(finalMetrics.balanceParaLujos, 115451.0);
    assert.equal(finalMetrics.isDeficit, false);
    assert.equal(finalMetrics.surplusAmount, 115451.0);
    assert.equal(finalMetrics.deficitAmount, 0.0);

    // Projected fund with Dad remaining $110,000 COP:
    // $700,000 + $110,000 = $810,000 COP
    assert.equal(finalMetrics.projectedFundWithDad, 810000.0);
    // Projected luxury surplus with Dad: $810,000 - $584,549 = +$225,451 COP
    assert.equal(finalMetrics.projectedSurplusWithDad, 225451.0);

    // Personal remaining target: max(0, 584,549 - 450,000) = $134,549 COP
    assert.equal(finalMetrics.personalRemainingTarget, 134549.0);
    // Since availableFund ($700,000) > $134,549, personal target is completely secured
    assert.ok(store.tripSettings.availableFund >= finalMetrics.personalRemainingTarget);

    // Audit logs integrity: 4 daily logs + 1 settlement log = 5 total logs
    assert.equal(store.dailyLogs.length, 5);
  });

  it('T4.2 Dad Abono Final Delivery & Commitment Saturation Scenario: dad delivers 100% of commitment and bonus', () => {
    const store = new FinanceDomainStore();
    // Dad initial: $140,000 paid of $450,000 committed (pending: $310,000)

    // Dad transfers the remaining $310,000 COP to Nequi
    const fullCommitmentMetrics = store.registerDadAbono(310000.0, 'Nequi');
    assert.equal(store.tripSettings.dadPaidAmount, 450000.0);
    assert.equal(fullCommitmentMetrics.dadPendingAmount, 0.0, 'Pending should be exactly 0');
    assert.equal(fullCommitmentMetrics.dadProgress, 1.0, 'Progress must be 100%');

    // Generous Dad adds an extra $50,000 COP bonus ($500,000 COP total)
    const bonusMetrics = store.registerDadAbono(50000.0, 'Nequi');
    assert.equal(store.tripSettings.dadPaidAmount, 500000.0);
    assert.equal(bonusMetrics.dadPendingAmount, 0.0, 'Pending must remain clamped at 0');
    assert.equal(bonusMetrics.dadProgress, 1.0, 'Progress must remain clamped at 100%');
  });

  it('T4.3 Emergency Expense Stress Shock: absorbs severe unplanned expense while preserving data integrity', () => {
    const store = new FinanceDomainStore();
    const initialSurplus = store.getFreeLiquidSurplus(); // 474,800 COP

    // Sudden medical emergency or motorbike repair: $150,000 COP from Nequi
    store.saveDailyRecord({
      dateDisplay: 'Emergencia Tarde',
      sienna: false,
      frida: false,
      rappi: 0.0,
      expense: 150000.0,
      targetAccountName: 'Nequi',
      note: 'Reparación de emergencia kit de arrastre moto',
    });

    assert.equal(store.getAccount('Nequi').balance, 95000.0); // 245k - 150k
    assert.equal(store.getFreeLiquidSurplus(), initialSurplus - 150000.0); // 324,800 COP
    // Nu account and compounding are unaffected by Nequi shock
    assert.equal(store.getAccount('Cuenta Nu').balance, 320000.0);
    assert.equal(calculateNuDailyYield(store.getAccount('Cuenta Nu').balance), 77.97);
  });

  it('T4.4 End-to-End JSON Synchronization & Round-Trip Portability: export to API and re-import into new client', () => {
    const primaryStore = new FinanceDomainStore();

    // Perform diverse mutations on primary store
    primaryStore.saveDailyRecord({
      dateDisplay: 'Lunes Sync',
      sienna: true,
      frida: true,
      rappi: 20000.0,
      expense: 5000.0,
      targetAccountName: 'Cuenta Nu',
      note: 'Sync test record',
    });
    primaryStore.registerDadAbono(50000.0, 'Nequi');
    primaryStore.settlePendingDebt(2, 'Efectivo'); // Settle Mateo's debt

    // Export to JSON string mirroring GET /api/finance/state
    const exportedState = primaryStore.exportUnifiedState();
    const jsonPayload = JSON.stringify(exportedState);

    // Simulate network transmission and re-import into secondary store
    const secondaryStore = new FinanceDomainStore();
    const parsedPayload = JSON.parse(jsonPayload);
    secondaryStore.importUnifiedState(parsedPayload);

    // Assert exact state parity
    assert.equal(secondaryStore.getTotalBalance(), primaryStore.getTotalBalance());
    assert.equal(secondaryStore.getTotalFixedExpenses(), primaryStore.getTotalFixedExpenses());
    assert.equal(secondaryStore.tripSettings.dadPaidAmount, primaryStore.tripSettings.dadPaidAmount);
    assert.equal(secondaryStore.tripSettings.pendingWalksWeekly, primaryStore.tripSettings.pendingWalksWeekly);
    assert.equal(secondaryStore.dailyLogs.length, primaryStore.dailyLogs.length);
    assert.equal(secondaryStore.pendingDebts.find(d => d.id === 2).isPaid, true);
  });
});
