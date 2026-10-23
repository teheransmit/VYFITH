/**
 * ADVERSARIAL EMPIRICAL CHALLENGE HARNESS
 * VYFITH Milestone 1: Mathematical Precision & State Transitions
 * 
 * Conducts stress tests, mathematical oracle comparisons, and edge case mining across:
 * 1. Nu 9.30% E.A. compound daily yield vs linear interest, $0, negative, and large balances.
 * 2. Real Free Surplus edge cases (empty accounts, negative balances, debts > balances).
 * 3. Medellín trip simulator: dad abono saturation (>= 450k), luxury balance deficit/surplus.
 * 4. Deferred walk logic: pendingWalksWeekly vs immediate cash balance isolation, Molly purging.
 * 5. Cross-platform consistency between TypeScript store and domain engine.
 */

import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
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

// Also import directly from TypeScript implementation using tsx/esm if possible,
// or execute cross-checks.
console.log('='.repeat(80));
console.log('  VYFITH ADVERSARIAL EMPIRICAL CHALLENGE SUITE');
console.log('  Role: Empirical Challenger (Adversarial stress-testing & Math Oracles)');
console.log('='.repeat(80));

let passCount = 0;
let failCount = 0;

function runChallenge(title, fn) {
  process.stdout.write(`[TEST] ${title}... `);
  try {
    fn();
    console.log('PASSED \u2714');
    passCount++;
  } catch (err) {
    console.log(`FAILED \u2716`);
    console.error(`       Error: ${err.message}`);
    failCount++;
  }
}

// ============================================================================
// SUITE 1: NU 9.30% E.A. COMPOUND DAILY YIELD VS LINEAR AND EXTREME BALANCES
// ============================================================================
console.log('\n--- SUITE 1: Nu 9.30% E.A. Mathematical Precision & Oracle Comparison ---');

runChallenge('1.1 Exact daily compound rate equals (1 + 0.0930)^(1/365) - 1', () => {
  const theoreticalDailyRate = Math.pow(1 + 0.0930, 1 / 365) - 1;
  const expectedRate = 0.00024366313088708402;
  assert.ok(
    Math.abs(theoreticalDailyRate - expectedRate) < 1e-15,
    `Theoretical rate ${theoreticalDailyRate} does not match expected ${expectedRate}`
  );
});

runChallenge('1.2 Contrast compound daily yield vs simple linear interest on $320,000 COP', () => {
  const balance = 320000.0;
  const compoundDailyRate = Math.pow(1 + 0.0930, 1 / 365) - 1;
  const linearDailyRate = 0.0930 / 365;

  const compoundYield = Math.round(balance * compoundDailyRate * 100) / 100;
  const linearYield = Math.round(balance * linearDailyRate * 100) / 100;

  // Compound is $77.97, Linear is $81.53
  assert.equal(compoundYield, 77.97, 'Compound yield must equal $77.97 COP');
  assert.equal(linearYield, 81.53, 'Linear yield would equal $81.53 COP');

  const discrepancy = linearYield - compoundYield;
  assert.ok(discrepancy > 3.5, 'Linear interest overstates daily return by > $3.50 COP/day');

  // Verify the engine uses compound, NOT linear
  const engineYield = calculateNuDailyYield(balance, 1);
  assert.equal(engineYield, compoundYield, 'Engine MUST compute compound interest, not linear');
});

runChallenge('1.3 Annual compounding identity: (1 + i_daily)^365 exactly reconstructs (1 + EA)', () => {
  const balance = 1000000.0; // 1M COP
  const dailyRate = Math.pow(1 + 0.0930, 1 / 365) - 1;
  const compoundedAnnual = balance * Math.pow(1 + dailyRate, 365);
  const directEA = balance * (1 + 0.0930);

  // Must match to within floating-point epsilon (< 1e-6)
  assert.ok(
    Math.abs(compoundedAnnual - directEA) < 1e-6,
    `Annual compounded balance ${compoundedAnnual} deviates from direct EA ${directEA}`
  );
});

runChallenge('1.4 Zero and negative balance yield protection', () => {
  // $0 balance -> 0.00 COP
  assert.equal(calculateNuDailyYield(0, 1), 0.0);
  assert.equal(calculateNuDailyYield(0.00001, 1), 0.0);

  // Negative balance (-$500,000 COP overdraft) -> must NOT generate negative interest
  assert.equal(calculateNuDailyYield(-500000.0, 1), 0.0, 'Negative balance must yield 0');
  assert.equal(calculateNuDailyYield(-1.0, 1), 0.0);
  assert.equal(calculateNuDailyYield(-10000000.0, 30), 0.0);
});

runChallenge('1.5 Large balance scalability and precision: $10M, $100M, and $1B COP', () => {
  // $10,000,000 COP
  const yield10M = calculateNuDailyYield(10000000.0, 1);
  const expected10M = Math.round(10000000.0 * (Math.pow(1.093, 1 / 365) - 1) * 100) / 100;
  assert.equal(yield10M, 2436.63, 'Yield on $10M COP must be $2,436.63 COP/day');
  assert.equal(yield10M, expected10M);

  // $100,000,000 COP
  const yield100M = calculateNuDailyYield(100000000.0, 1);
  assert.equal(yield100M, 24366.31, 'Yield on $100M COP must be $24,366.31 COP/day');

  // $1,000,000,000 COP (1 Billion COP)
  const yield1B = calculateNuDailyYield(1000000000.0, 1);
  assert.equal(yield1B, 243663.13, 'Yield on $1B COP must be $243,663.13 COP/day');

  // 30-day projection on $10,000,000 COP
  const monthly10M = calculateNuDailyYield(10000000.0, 30);
  // 10,000,000 * ((1 + i_daily)^30 - 1)
  const dailyRate = Math.pow(1.093, 1 / 365) - 1;
  const expectedMonthly10M = Math.round(10000000.0 * (Math.pow(1 + dailyRate, 30) - 1) * 100) / 100;
  assert.equal(monthly10M, expectedMonthly10M);
  assert.equal(monthly10M, 73357.79, '30-day yield on $10M must be $73,357.79 COP');
});

// ============================================================================
// SUITE 2: REAL FREE SURPLUS EDGE CASES & ADVERSARIAL STRESS
// ============================================================================
console.log('\n--- SUITE 2: Real Free Surplus Boundary & Adversarial Cases ---');

runChallenge('2.1 Baseline surplus calculation', () => {
  const store = new FinanceDomainStore();
  // Balances: 85k + 320k + 245k = 650,000 COP
  // Expenses: 140k + 10.2k + 25k = 175,200 COP
  // Surplus: 650,000 - 175,200 = 474,800 COP
  assert.equal(store.getTotalBalance(), 650000.0);
  assert.equal(store.getTotalFixedExpenses(), 175200.0);
  assert.equal(store.getFreeLiquidSurplus(), 474800.0);
});

runChallenge('2.2 Zero accounts edge case (empty accounts array)', () => {
  const store = new FinanceDomainStore();
  store.accounts = [];

  assert.equal(store.getTotalBalance(), 0.0);
  // Surplus with 0 accounts and 175.2k fixed expenses = -175,200 COP
  assert.equal(store.getFreeLiquidSurplus(), -175200.0);

  // If fixed expenses are also empty
  store.fixedExpenses = [];
  assert.equal(store.getTotalFixedExpenses(), 0.0);
  assert.equal(store.getFreeLiquidSurplus(), 0.0);
});

runChallenge('2.3 Debts and fixed expenses exceeding balances (deficit scenario)', () => {
  const store = new FinanceDomainStore();
  // Set accounts to only $50,000 COP
  store.accounts = [{ id: 1, name: 'Efectivo', balance: 50000.0, type: 'CASH' }];
  // Fixed expenses are $175,200 COP
  const surplus = store.getFreeLiquidSurplus();
  assert.equal(surplus, -125200.0, 'Surplus must reflect exact deficit: -$125,200 COP');
});

runChallenge('2.4 Overdraft and negative balances in accounts', () => {
  const store = new FinanceDomainStore();
  store.accounts = [
    { id: 1, name: 'Efectivo', balance: -20000.0, type: 'CASH' },
    { id: 2, name: 'Cuenta Nu', balance: 100000.0, type: 'NU' },
    { id: 3, name: 'Nequi', balance: -150000.0, type: 'NEQUI' },
  ];
  // Total balance: -20k + 100k - 150k = -70,000 COP
  assert.equal(store.getTotalBalance(), -70000.0);

  // Surplus: -70,000 - 175,200 = -245,200 COP
  assert.equal(store.getFreeLiquidSurplus(), -245200.0);
});

// ============================================================================
// SUITE 3: MEDELLIN SIMULATOR STRESS TESTS
// ============================================================================
console.log('\n--- SUITE 3: Medellín Simulator Stress Tests ---');

runChallenge('3.1 Baseline Medellín metrics: budget, deficit, personal target, and walks', () => {
  const store = new FinanceDomainStore();
  const metrics = computeMedellinMetrics(store.tripSettings);

  assert.equal(metrics.totalEstimatedCost, 584549.0);
  assert.equal(metrics.availableFund, 550000.0);
  assert.equal(metrics.dadTotalCommitted, 450000.0);
  assert.equal(metrics.dadPaidAmount, 140000.0);
  assert.equal(metrics.dadPendingAmount, 310000.0);

  // Balance para lujos: 550,000 - 584,549 = -34,549 COP (deficit)
  assert.equal(metrics.balanceParaLujos, -34549.0);
  assert.equal(metrics.isDeficit, true);
  assert.equal(metrics.deficitAmount, 34549.0);
  assert.equal(metrics.surplusAmount, 0.0);

  // Personal remaining target: max(0, 584,549 - 450,000) = 134,549 COP
  assert.equal(metrics.personalRemainingTarget, 134549.0);

  // Sienna walks needed: ceil(134,549 / 9,000) = 15 walks
  assert.equal(metrics.siennaWalksNeeded, 15);

  // Projected fund with dad: 550,000 + 310,000 = 860,000 COP
  assert.equal(metrics.projectedFundWithDad, 860000.0);
  // Projected surplus: 860,000 - 584,549 = +275,451 COP
  assert.equal(metrics.projectedSurplusWithDad, 275451.0);
});

runChallenge('3.2 Dad abono saturation at >= $450k and generous overpayment', () => {
  const store = new FinanceDomainStore();

  // Test exact fulfillment: dad pays remaining $310k
  let metrics = store.registerDadAbono(310000.0, 'Nequi');
  assert.equal(metrics.dadPaidAmount, 450000.0);
  assert.equal(metrics.dadPendingAmount, 0.0, 'Pending amount must be 0');
  assert.equal(metrics.dadProgress, 1.0, 'Progress must be 1.0 (100%)');
  assert.equal(metrics.projectedFundWithDad, metrics.availableFund, 'Projected fund equals available once dad paid in full');

  // Test overpayment: dad pays an additional $100,000 COP
  metrics = store.registerDadAbono(100000.0, 'Nequi');
  assert.equal(metrics.dadPaidAmount, 550000.0);
  assert.equal(metrics.dadPendingAmount, 0.0, 'Pending amount must remain clamped at 0.0 (never negative)');
  assert.equal(metrics.dadProgress, 1.0, 'Progress must saturate at 1.0 (never > 100%)');

  // Test single huge abono of $1,000,000 COP from initial state
  const freshStore = new FinanceDomainStore();
  metrics = freshStore.registerDadAbono(1000000.0);
  assert.equal(metrics.dadPendingAmount, 0.0);
  assert.equal(metrics.dadProgress, 1.0);
});

runChallenge('3.3 Luxury balance transition: deficit vs surplus vs breakeven', () => {
  // Deficit: available 550k < cost 584.549k
  let metrics = computeMedellinMetrics({
    availableFund: 550000.0,
    dadTotalCommitted: 450000.0,
    dadPaidAmount: 140000.0,
    pendingWalksWeekly: 0.0,
  });
  assert.equal(metrics.isDeficit, true);
  assert.equal(metrics.deficitAmount, 34549.0);
  assert.equal(metrics.surplusAmount, 0.0);

  // Surplus: available 700k > cost 584.549k
  metrics = computeMedellinMetrics({
    availableFund: 700000.0,
    dadTotalCommitted: 450000.0,
    dadPaidAmount: 140000.0,
    pendingWalksWeekly: 0.0,
  });
  assert.equal(metrics.isDeficit, false);
  assert.equal(metrics.deficitAmount, 0.0);
  assert.equal(metrics.surplusAmount, 115451.0);
  assert.equal(metrics.balanceParaLujos, 115451.0);

  // Breakeven: available 584549 == cost 584549
  metrics = computeMedellinMetrics({
    availableFund: 584549.0,
    dadTotalCommitted: 450000.0,
    dadPaidAmount: 140000.0,
    pendingWalksWeekly: 0.0,
  });
  assert.equal(metrics.isDeficit, false);
  assert.equal(metrics.deficitAmount, 0.0);
  assert.equal(metrics.surplusAmount, 0.0);
  assert.equal(metrics.balanceParaLujos, 0.0);
});

// ============================================================================
// SUITE 4: DEFERRED WALK LOGIC & CASH ISOLATION INVARIANTS
// ============================================================================
console.log('\n--- SUITE 4: Deferred Walk Logic & Cash Balance Isolation ---');

runChallenge('4.1 Dog walks accumulate in pendingWalksWeekly WITHOUT modifying cash balance', () => {
  const store = new FinanceDomainStore();
  const initialCash = store.getAccount('Efectivo').balance;
  const initialPendingWalks = store.tripSettings.pendingWalksWeekly;

  // Record day with Sienna ($9,000) and Frida ($5,850), zero Rappi, zero expense
  const result = store.saveDailyRecord({
    dateDisplay: '2026-10-23',
    sienna: true,
    frida: true,
    rappi: 0.0,
    expense: 0.0,
    targetAccountName: 'Efectivo',
  });

  // Cash balance MUST be completely unchanged
  assert.equal(
    store.getAccount('Efectivo').balance,
    initialCash,
    'Cash balance must not change when only walks are performed'
  );
  assert.equal(result.immediateNetChange, 0.0);

  // Pending walks MUST have accumulated exactly 9,000 + 5,850 = 14,850 COP
  assert.equal(result.walksSum, 14850.0);
  assert.equal(
    store.tripSettings.pendingWalksWeekly,
    initialPendingWalks + 14850.0,
    'Pending walks weekly must accumulate $14,850 COP'
  );
});

runChallenge('4.2 Mixed day: immediate liquid change applies only Rappi - Expense to account', () => {
  const store = new FinanceDomainStore();
  const initialNequi = store.getAccount('Nequi').balance; // 245k
  const initialPendingWalks = store.tripSettings.pendingWalksWeekly;

  // Sienna ($9,000 deferred), Rappi $40,000, Expense $15,000 -> netChange = +$25,000
  const result = store.saveDailyRecord({
    dateDisplay: '2026-10-23',
    sienna: true,
    frida: false,
    rappi: 40000.0,
    expense: 15000.0,
    targetAccountName: 'Nequi',
  });

  assert.equal(result.immediateNetChange, 25000.0);
  // Account received strictly Rappi - Expense ($25,000 COP), NOT $25,000 + $9,000 = $34,000 COP
  assert.equal(store.getAccount('Nequi').balance, initialNequi + 25000.0);
  // Pending walks received the $9,000 COP
  assert.equal(store.tripSettings.pendingWalksWeekly, initialPendingWalks + 9000.0);
});

runChallenge('4.3 Molly walk parameter is aggressively purged and adds $0 COP', () => {
  const store = new FinanceDomainStore();
  const initialPendingWalks = store.tripSettings.pendingWalksWeekly;

  // Adversarial call attempting to activate Molly
  const result = store.saveDailyRecord({
    dateDisplay: '2026-10-23',
    sienna: false,
    frida: false,
    molly: true, // Should be purged
    rappi: 20000.0,
    expense: 0.0,
    targetAccountName: 'Nequi',
  });

  assert.equal(result.logEntry.mollyWalk, false, 'mollyWalk must be sanitized to false');
  assert.equal(result.walksSum, 0.0, 'Molly must not add any income');
  assert.equal(store.tripSettings.pendingWalksWeekly, initialPendingWalks);
});

runChallenge('4.4 Weekly settlement transfers all pending walks and is idempotent', () => {
  const store = new FinanceDomainStore();
  const initialNu = store.getAccount('Cuenta Nu').balance; // 320k
  const pendingAmount = store.tripSettings.pendingWalksWeekly; // 48.7k
  assert.ok(pendingAmount > 0);

  // Settle to Cuenta Nu
  const res1 = store.settleWeeklyWalks('Cuenta Nu');
  assert.equal(res1.settledAmount, pendingAmount);
  assert.equal(store.getAccount('Cuenta Nu').balance, initialNu + pendingAmount);
  assert.equal(store.tripSettings.pendingWalksWeekly, 0.0);

  // Settlement log was recorded
  const lastLog = store.dailyLogs[store.dailyLogs.length - 1];
  assert.equal(lastLog.netChange, pendingAmount);
  assert.equal(lastLog.targetAccountName, 'Cuenta Nu');

  // Second immediate settlement call (idempotency check)
  const res2 = store.settleWeeklyWalks('Cuenta Nu');
  assert.equal(res2.settledAmount, 0.0, 'Second settlement must settle 0 COP');
  assert.equal(store.getAccount('Cuenta Nu').balance, initialNu + pendingAmount, 'Balance must not change');
  assert.equal(store.tripSettings.pendingWalksWeekly, 0.0);
});

// ============================================================================
// SUITE 5: CROSS-PLATFORM TYPESCRIPT STORE VALIDATION VIA TSX
// ============================================================================
console.log('\n--- SUITE 5: Direct Verification of lib/financeStore.ts ---');

runChallenge('5.1 Production lib/financeStore.ts compiles and executes cleanly via tsx', () => {
  const output = execSync('npx tsx tests/test_finance_store_ts.ts', {
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  assert.ok(output.includes('TSX TEST RESULTS: 8 PASSED, 0 FAILED'), 'TSX tests must pass with 0 failures');
});

console.log('\n' + '='.repeat(80));
console.log(`  EMPIRICAL CHALLENGE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('='.repeat(80));

if (failCount > 0) {
  process.exit(1);
}
