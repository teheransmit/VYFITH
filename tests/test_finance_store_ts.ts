/**
 * DIRECT EMPIRICAL AUDIT OF lib/financeStore.ts
 * Executed via npx tsx to directly test production TypeScript code.
 */

import assert from 'node:assert/strict';
import {
  calculateDailyNuYield,
  calculateMonthlyNuYield,
  calculateNuProjection,
  calculateRealFreeSurplus,
  calculateMedellinBalance,
  addDailyLog,
  settleWeeklyWalks,
  registerDadAbono,
  settlePendingDebt,
  getFinanceState,
  setFinanceState,
  initialUnifiedFinanceState,
  NU_ANNUAL_EFFECTIVE_RATE,
  SIENNA_WALK_RATE,
  FRIDA_WALK_RATE,
  DEFAULT_MEDELLIN_COST,
  DEFAULT_DAD_COMMITTED,
  DEFAULT_AVAILABLE_FUND,
  AccountBalance,
  FixedExpense,
} from '../lib/financeStore';

console.log('='.repeat(80));
console.log('  TESTING PRODUCTION lib/financeStore.ts VIA TSX');
console.log('='.repeat(80));

let passCount = 0;
let failCount = 0;

function runTest(name: string, fn: () => void) {
  process.stdout.write(`[TS-TEST] ${name}... `);
  try {
    fn();
    console.log('PASSED \u2714');
    passCount++;
  } catch (err: any) {
    console.log('FAILED \u2716');
    console.error(`          ${err.message}`);
    failCount++;
  }
}

// Reset store before each test suite
setFinanceState(JSON.parse(JSON.stringify(initialUnifiedFinanceState)));

// 1. Math precision in TypeScript
runTest('Nu daily compound yield on $320,000 COP', () => {
  const yieldCOP = calculateDailyNuYield(320000.0);
  // (1 + 0.0930)^(1/365) - 1 ≈ 0.00024366313 -> 320000 * 0.00024366313 = 77.97
  assert.equal(yieldCOP, 77.97, 'Daily yield on $320k must be 77.97 COP');
});

runTest('Nu yield on $0 and negative balances', () => {
  assert.equal(calculateDailyNuYield(0), 0);
  assert.equal(calculateDailyNuYield(-500000), 0);
  assert.equal(calculateMonthlyNuYield(0), 0);
  assert.equal(calculateMonthlyNuYield(-100000), 0);
});

runTest('Nu yield on large balances ($10M COP, $100M COP)', () => {
  const yield10M = calculateDailyNuYield(10000000.0);
  assert.equal(yield10M, 2436.63);

  const monthly10M = calculateMonthlyNuYield(10000000.0);
  // 10000000 * ((1 + 0.0930)^(30/365) - 1) = 73357.79
  assert.equal(monthly10M, 73357.79);

  const projection365 = calculateNuProjection(1000000.0, 365);
  // 1,000,000 * (1 + 0.0930) = 1,093,000 COP
  assert.equal(projection365, 1093000.0);
});

// 2. Real Free Surplus
runTest('Real Free Surplus calculation', () => {
  const accounts: AccountBalance[] = [
    { id: 1, name: 'Efectivo', balance: 85000, type: 'CASH' },
    { id: 2, name: 'Cuenta Nu', balance: 320000, type: 'NU' },
    { id: 3, name: 'Nequi', balance: 245000, type: 'NEQUI' },
  ];
  const fixed: FixedExpense[] = [
    { id: 1, title: 'Vuelos', amount: 140000, category: 'DEBT' },
    { id: 2, title: 'Suscripciones', amount: 10200, category: 'SUBSCRIPTION' },
    { id: 3, title: 'Motilada', amount: 25000, category: 'GENERAL' },
  ];
  // 650,000 - 175,200 = 474,800
  assert.equal(calculateRealFreeSurplus(accounts, fixed), 474800);

  // Empty accounts
  assert.equal(calculateRealFreeSurplus([], fixed), -175200);

  // Negative accounts (overdraft)
  assert.equal(calculateRealFreeSurplus([{ id: 1, name: 'Nequi', balance: -50000, type: 'NEQUI' }], []), -50000);
});

// 3. Medellín Balance
runTest('Medellin simulator metrics & Dad saturation', () => {
  const baseline = calculateMedellinBalance({
    availableFund: 550000,
    dadTotalCommitted: 450000,
    dadPaidAmount: 140000,
  });
  assert.equal(baseline.totalCost, 584549);
  assert.equal(baseline.balanceParaLujos, -34549);
  assert.equal(baseline.isDeficit, true);
  assert.equal(baseline.deficitAmount, 34549);
  assert.equal(baseline.surplusAmount, 0);
  assert.equal(baseline.dadPendingAmount, 310000);
  assert.equal(baseline.personalRemainingTarget, 134549);
  assert.equal(baseline.siennaWalksNeeded, 15);

  // Saturation: dad delivers $450k (full)
  const fullDad = calculateMedellinBalance({
    availableFund: 550000,
    dadTotalCommitted: 450000,
    dadPaidAmount: 450000,
  });
  assert.equal(fullDad.dadPendingAmount, 0);
  assert.equal(fullDad.dadProgressPercent, 100);

  // Overpayment: dad delivers $500k
  const overDad = calculateMedellinBalance({
    availableFund: 550000,
    dadTotalCommitted: 450000,
    dadPaidAmount: 500000,
  });
  assert.equal(overDad.dadPendingAmount, 0, 'dadPendingAmount must clamp at 0');
  assert.equal(overDad.dadProgressPercent, 100, 'dadProgressPercent must clamp at 100%');
});

// 4. Deferred walks & immediate cash balance isolation
runTest('DailyLog deferred walks do not alter cash immediately', () => {
  setFinanceState(JSON.parse(JSON.stringify(initialUnifiedFinanceState)));
  const stateBefore = getFinanceState();
  const initialEfectivo = stateBefore.accounts.find(a => a.name === 'Efectivo')!.balance;
  const initialPendingWalks = stateBefore.tripSettings.pendingWalksWeekly;

  const res = addDailyLog({
    siennaWalk: true,
    fridaWalk: true,
    rappiIncome: 0,
    dailyExpense: 0,
    targetAccountName: 'Efectivo',
    note: 'Paseos domingo',
  });

  const stateAfter = getFinanceState();
  const efectivoAfter = stateAfter.accounts.find(a => a.name === 'Efectivo')!.balance;

  // Cash must NOT have changed
  assert.equal(efectivoAfter, initialEfectivo, 'Cash must not change when only walks performed');
  // Pending walks must have increased by 9,000 + 5,850 = 14,850
  assert.equal(stateAfter.tripSettings.pendingWalksWeekly, initialPendingWalks + 14850);
  // Log entry created
  assert.equal(res.walksSum, 14850);
  assert.equal(res.netChange, 0);
});

// 5. Weekly settlement
runTest('settleWeeklyWalks transfers to account and resets pending to 0', () => {
  const stateBefore = getFinanceState();
  const pending = stateBefore.tripSettings.pendingWalksWeekly;
  const initialNu = stateBefore.accounts.find(a => a.name === 'Cuenta Nu')!.balance;

  const result = settleWeeklyWalks('Cuenta Nu');
  assert.equal(result.settledAmount, pending);

  const stateAfter = getFinanceState();
  const nuAfter = stateAfter.accounts.find(a => a.name === 'Cuenta Nu')!.balance;
  assert.equal(nuAfter, initialNu + pending);
  assert.equal(stateAfter.tripSettings.pendingWalksWeekly, 0);

  // Calling second time settles 0
  const secondResult = settleWeeklyWalks('Cuenta Nu');
  assert.equal(secondResult.settledAmount, 0);
});

// 6. Settle pending debt
runTest('settlePendingDebt credits account and marks debt paid', () => {
  const stateBefore = getFinanceState();
  const initialNequi = stateBefore.accounts.find(a => a.name === 'Nequi')!.balance;
  const debt = stateBefore.pendingDebts[0]; // Camilo, $35,000 COP

  const result = settlePendingDebt(debt.id, 'Nequi');
  assert.equal(result.success, true);

  const stateAfter = getFinanceState();
  const nequiAfter = stateAfter.accounts.find(a => a.name === 'Nequi')!.balance;
  assert.equal(nequiAfter, initialNequi + debt.amount);

  const updatedDebt = stateAfter.pendingDebts.find(d => d.id === debt.id)!;
  assert.equal(updatedDebt.isPaid, true);
  assert.equal(updatedDebt.paidToAccount, 'Nequi');

  // Idempotency: second call must fail gracefully
  const secondResult = settlePendingDebt(debt.id, 'Nequi');
  assert.equal(secondResult.success, false);
});

console.log('='.repeat(80));
console.log(`  TSX TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('='.repeat(80));

if (failCount > 0) {
  process.exit(1);
}
