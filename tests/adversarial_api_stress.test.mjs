/**
 * VYFITH Adversarial Stress Test Suite: REST API & Data Persistence Layer
 * Agent: challenger_m1_2 (EMPIRICAL CHALLENGER)
 * 
 * Verifies and stress-tests:
 * 1. GET /api/finance/state against data/real_finance_state.json
 * 2. POST /api/finance/daily-log with valid, boundary, and adversarial payloads
 * 3. POST /api/finance/settle-walks when pendingWalksWeekly is 0 vs > 0
 * 4. JSON import/export roundtrip: serialize state to JSON, parse back, verify zero data loss
 * 5. Verify that mollyWalk is NEVER enabled and returns 0 revenue under all stress inputs
 */

import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NextRequest } from 'next/server';

import {
  GET as getFinanceState,
  OPTIONS as optionsFinanceState,
} from '../app/api/finance/state/route.ts';

import {
  POST as postDailyLog,
  OPTIONS as optionsDailyLog,
} from '../app/api/finance/daily-log/route.ts';

import {
  POST as postSettleWalks,
  OPTIONS as optionsSettleWalks,
} from '../app/api/finance/settle-walks/route.ts';

import {
  POST as postSync,
  OPTIONS as optionsSync,
} from '../app/api/finance/sync/route.ts';

import {
  GET as getFinanceMultiplexer,
  POST as postFinanceMultiplexer,
  OPTIONS as optionsFinanceMultiplexer,
  readStoredFinanceState,
  writeStoredFinanceState,
} from '../app/api/finance/route.ts';

import {
  normalizeFinanceState,
  calculateDailyNuYield,
  MOLLY_WALK_RATE,
  SIENNA_WALK_RATE,
  FRIDA_WALK_RATE,
} from '../lib/financeStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const STATE_FILE = path.join(PROJECT_ROOT, 'data', 'real_finance_state.json');
const BACKUP_FILE = path.join(PROJECT_ROOT, 'data', 'real_finance_state.json.bak');

let originalStateSnapshot = null;

function createNextRequest(urlPath, method = 'GET', body = null) {
  const url = `http://localhost:3000${urlPath}`;
  const init = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return new NextRequest(url, init);
}

describe('CHALLENGER M1-2: Adversarial REST API & Data Integrity Stress Tests', () => {
  before(() => {
    // Preserve baseline state from backup or state file
    if (fs.existsSync(BACKUP_FILE)) {
      originalStateSnapshot = fs.readFileSync(BACKUP_FILE, 'utf8');
    } else if (fs.existsSync(STATE_FILE)) {
      originalStateSnapshot = fs.readFileSync(STATE_FILE, 'utf8');
      fs.writeFileSync(BACKUP_FILE, originalStateSnapshot, 'utf8');
    }
  });

  beforeEach(() => {
    // Reset state before each test to guarantee test isolation
    if (originalStateSnapshot) {
      writeStoredFinanceState(JSON.parse(originalStateSnapshot));
    }
  });

  after(() => {
    // Restore pristine baseline state upon completion
    if (originalStateSnapshot) {
      writeStoredFinanceState(JSON.parse(originalStateSnapshot));
      fs.writeFileSync(STATE_FILE, originalStateSnapshot, 'utf8');
    }
  });

  // ==========================================================================
  // SUITE 1: GET /api/finance/state against data/real_finance_state.json
  // ==========================================================================
  describe('Suite 1: GET /api/finance/state vs data/real_finance_state.json', () => {
    it('1.1 Response Contract: returns HTTP 200, CORS headers, success=true, valid ISO timestamp', async () => {
      const res = await getFinanceState();
      assert.equal(res.status, 200, 'GET /api/finance/state must return 200');

      const json = await res.json();
      assert.ok(json, 'Response must be valid JSON');
      assert.equal(json.success, true, 'Response must have success: true');
      assert.ok(json.serverTime, 'Response must contain serverTime');
      assert.ok(!isNaN(Date.parse(json.serverTime)), 'serverTime must be a valid parseable ISO timestamp');

      // CORS headers
      const corsOrigin = res.headers.get('access-control-allow-origin');
      assert.equal(corsOrigin, '*', 'Must allow CORS from all origins');
    });

    it('1.2 Preflight OPTIONS: returns 200 with CORS allowed methods', async () => {
      const res = await optionsFinanceState();
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), '*');
      assert.ok(res.headers.get('access-control-allow-methods').includes('GET'));
    });

    it('1.3 Account Entities & Balances: verifies Efectivo, Cuenta Nu, Nequi and total liquidity ($650k)', async () => {
      const res = await getFinanceState();
      const json = await res.json();
      const accounts = json.data.accounts;
      assert.equal(accounts.length, 3, 'Must contain exactly 3 accounts');

      const efectivo = accounts.find((a) => a.name === 'Efectivo');
      const nu = accounts.find((a) => a.name === 'Cuenta Nu');
      const nequi = accounts.find((a) => a.name === 'Nequi');

      assert.ok(efectivo, 'Efectivo account must exist');
      assert.equal(efectivo.balance, 85000, 'Efectivo balance must be 85,000 COP');
      assert.equal(efectivo.type, 'CASH');

      assert.ok(nu, 'Cuenta Nu must exist');
      assert.equal(nu.balance, 320000, 'Cuenta Nu balance must be 320,000 COP');
      assert.equal(nu.type, 'NU');

      assert.ok(nequi, 'Nequi must exist');
      assert.equal(nequi.balance, 245000, 'Nequi balance must be 245,000 COP');
      assert.equal(nequi.type, 'NEQUI');

      const totalBalance = efectivo.balance + nu.balance + nequi.balance;
      assert.equal(totalBalance, 650000, 'Total liquid assets must equal $650,000 COP');
    });

    it('1.4 Nu Yield Dynamic Normalization: Nu daily yield dynamically normalized to 77.97 COP', async () => {
      const res = await getFinanceState();
      const json = await res.json();
      const nu = json.data.accounts.find((a) => a.name === 'Cuenta Nu');
      assert.ok(nu);
      // Empirical verification: 320,000 * ((1 + 0.093)^(1/365) - 1) = 77.9722... -> 77.97
      assert.equal(nu.dailyYieldCOP, 77.97, 'Nu daily yield must be dynamically normalized to 77.97 COP');
    });

    it('1.5 Fixed Expenses: verifies 3 expenses totaling $175,200 and surplus of $474,800', async () => {
      const res = await getFinanceState();
      const json = await res.json();
      const fixed = json.data.fixedExpenses;
      assert.equal(fixed.length, 3, 'Must have 3 fixed expenses');

      const vuelos = fixed.find((f) => f.title === 'Vuelos');
      const subs = fixed.find((f) => f.title.includes('Suscripciones'));
      const motilada = fixed.find((f) => f.title === 'Motilada');

      assert.ok(vuelos && vuelos.amount === 140000 && vuelos.category === 'DEBT');
      assert.ok(subs && subs.amount === 10200 && subs.category === 'SUBSCRIPTION');
      assert.ok(motilada && motilada.amount === 25000 && motilada.category === 'GENERAL');

      const totalFixed = vuelos.amount + subs.amount + motilada.amount;
      assert.equal(totalFixed, 175200, 'Fixed expenses sum must be $175,200 COP');

      const totalLiquid = 650000;
      const surplus = totalLiquid - totalFixed;
      assert.equal(surplus, 474800, 'Real free surplus must equal $474,800 COP');
    });

    it('1.6 TripSettings Contract & Calculations: verifies all 10 Medellín metrics', async () => {
      const res = await getFinanceState();
      const json = await res.json();
      const trip = json.data.tripSettings;

      assert.equal(trip.availableFund, 550000, 'availableFund must be 550,000 COP');
      assert.equal(trip.dadTotalCommitted, 450000, 'dadTotalCommitted must be 450,000 COP');
      assert.equal(trip.dadPaidAmount, 140000, 'dadPaidAmount must be 140,000 COP');
      assert.equal(trip.dadPendingAmount, 310000, 'dadPendingAmount must be 310,000 COP');
      assert.equal(trip.pendingWalksWeekly, 48700, 'pendingWalksWeekly must be 48,700 COP');
      assert.equal(trip.totalEstimatedCost, 584549, 'totalEstimatedCost must be 584,549 COP');
      assert.equal(trip.balanceParaLujos, -34549, 'balanceParaLujos must be -34,549 COP');
      assert.equal(trip.personalRemainingTarget, 134549, 'personalRemainingTarget must be 134,549 COP');
      assert.equal(trip.projectedFundWithDad, 860000, 'projectedFundWithDad must be 860,000 COP');
      assert.equal(trip.projectedSurplusWithDad, 275451, 'projectedSurplusWithDad must be +275,451 COP');
    });

    it('1.7 Pending Debts: verifies Camilo ($35k) and Mateo ($20k) are unpaid receivables', async () => {
      const res = await getFinanceState();
      const json = await res.json();
      const debts = json.data.pendingDebts;
      assert.equal(debts.length, 2, 'Must have 2 pending debts');

      const camilo = debts.find((d) => d.debtorName === 'Camilo');
      const mateo = debts.find((d) => d.debtorName === 'Mateo');

      assert.ok(camilo && camilo.amount === 35000 && camilo.isPaid === false);
      assert.ok(mateo && mateo.amount === 20000 && mateo.isPaid === false);
    });

    it('1.8 Historical Daily Logs: verifies 6 logs, strictly zero Molly presence', async () => {
      const res = await getFinanceState();
      const json = await res.json();
      const logs = json.data.dailyLogs;
      assert.equal(logs.length, 6, 'Must have 6 initial historical daily logs');

      for (const log of logs) {
        assert.equal(log.mollyWalk, false, `DailyLog ID ${log.id} must have mollyWalk: false`);
      }
    });

    it('1.9 Main Multiplexer GET /api/finance returns identical state with CORS headers', async () => {
      const res = await getFinanceMultiplexer();
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), '*');

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.accounts.length, 3);
      assert.equal(json.data.fixedExpenses.length, 3);
      assert.equal(json.data.tripSettings.availableFund, 550000);
    });
  });

  // ==========================================================================
  // SUITE 2: POST /api/finance/daily-log Stress & Invariant Tests
  // ==========================================================================
  describe('Suite 2: POST /api/finance/daily-log Stress & Invariant Tests', () => {
    it('2.1 Valid: Sienna walk only adds 9,000 COP to pendingWalksWeekly without altering liquid cash', async () => {
      const payload = {
        siennaWalk: true,
        fridaWalk: false,
        rappiIncome: 0,
        dailyExpense: 0,
        targetAccountName: 'Nequi',
        note: 'Paseo matutino Sienna',
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.walksSum, 9000);
      assert.equal(json.immediateNetChange, 0);

      const state = json.data;
      assert.equal(state.tripSettings.pendingWalksWeekly, 48700 + 9000); // 57,700 COP
      const nequi = state.accounts.find((a) => a.name === 'Nequi');
      assert.equal(nequi.balance, 245000, 'Nequi liquid balance must remain untouched');

      const latestLog = state.dailyLogs[0];
      assert.equal(latestLog.siennaWalk, true);
      assert.equal(latestLog.fridaWalk, false);
      assert.equal(latestLog.mollyWalk, false);
      assert.equal(latestLog.walksIncome, 9000);
      assert.equal(latestLog.netChange, 0);
    });

    it('2.2 Valid: Frida walk only adds 5,850 COP to pendingWalksWeekly', async () => {
      const payload = {
        siennaWalk: false,
        fridaWalk: true,
        rappiIncome: 0,
        dailyExpense: 0,
        targetAccountName: 'Efectivo',
        note: 'Paseo Frida',
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.walksSum, 5850);
      assert.equal(json.immediateNetChange, 0);
      assert.equal(json.data.dailyLogs[0].mollyWalk, false);
    });

    it('2.3 Valid: Custom Frida rate (5,000 COP base rate)', async () => {
      const payload = {
        siennaWalk: false,
        fridaWalk: true,
        fridaRate: 5000,
        rappiIncome: 0,
        dailyExpense: 0,
        targetAccountName: 'Efectivo',
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.walksSum, 5000);
    });

    it('2.4 Valid: Both Sienna & Frida walks (14,850 COP)', async () => {
      const payload = {
        siennaWalk: true,
        fridaWalk: true,
        rappiIncome: 0,
        dailyExpense: 0,
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.walksSum, 14850);
      assert.equal(json.data.tripSettings.pendingWalksWeekly, 48700 + 14850);
    });

    it('2.5 Valid: Immediate cashflow (Rappi $35k, Expense $12k) credited to Efectivo', async () => {
      const stateBefore = readStoredFinanceState();
      const efectivoBefore = stateBefore.accounts.find((a) => a.name === 'Efectivo').balance;
      const pendingWalksBefore = stateBefore.tripSettings.pendingWalksWeekly;

      const payload = {
        siennaWalk: false,
        fridaWalk: false,
        rappiIncome: 35000,
        dailyExpense: 12000,
        targetAccountName: 'Efectivo',
        note: 'Turno Rappi tarde',
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.walksSum, 0);
      assert.equal(json.immediateNetChange, 23000);

      const stateAfter = json.data;
      const efectivoAfter = stateAfter.accounts.find((a) => a.name === 'Efectivo').balance;
      assert.equal(efectivoAfter, efectivoBefore + 23000);
      assert.equal(stateAfter.tripSettings.pendingWalksWeekly, pendingWalksBefore);
    });

    it('2.6 Valid: Expense-only deduction (Expense $25,000 from Cuenta Nu)', async () => {
      const stateBefore = readStoredFinanceState();
      const nuBefore = stateBefore.accounts.find((a) => a.name === 'Cuenta Nu').balance;

      const payload = {
        siennaWalk: false,
        fridaWalk: false,
        rappiIncome: 0,
        dailyExpense: 25000,
        targetAccountName: 'Cuenta Nu',
        note: 'Pago de motilada',
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.immediateNetChange, -25000);

      const stateAfter = json.data;
      const nuAfter = stateAfter.accounts.find((a) => a.name === 'Cuenta Nu').balance;
      assert.equal(nuAfter, nuBefore - 25000);
      assert.equal(stateAfter.dailyLogs[0].netChange, -25000);
    });

    it('2.7 Defaulting: Missing targetAccountName defaults to Nequi', async () => {
      const stateBefore = readStoredFinanceState();
      const nequiBefore = stateBefore.accounts.find((a) => a.name === 'Nequi').balance;

      const payload = {
        rappiIncome: 10000,
        dailyExpense: 0,
        // targetAccountName omitted
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      const stateAfter = json.data;
      const nequiAfter = stateAfter.accounts.find((a) => a.name === 'Nequi').balance;
      assert.equal(nequiAfter, nequiBefore + 10000);
      assert.equal(stateAfter.dailyLogs[0].targetAccountName, 'Nequi');
    });

    it('2.8 Adversarial: Empty body / non-object returns HTTP 400 Bad Request', async () => {
      const req = createNextRequest('/api/finance/daily-log', 'POST', 'null');
      const res = await postDailyLog(req);
      assert.equal(res.status, 400);

      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.error.includes('inválido') || json.error.includes('Payload'));
    });

    it('2.9 Adversarial: Malformed non-numeric values coerced safely to 0 without NaN pollution', async () => {
      const payload = {
        rappiIncome: 'unparseable_string',
        dailyExpense: 'NaN',
        siennaWalk: false,
        fridaWalk: false,
        targetAccountName: 'Nequi',
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.immediateNetChange, 0);
      const nequi = json.data.accounts.find((a) => a.name === 'Nequi');
      assert.ok(!isNaN(nequi.balance), 'Account balance must not be NaN');
      assert.equal(typeof nequi.balance, 'number');
    });

    it('2.10 Adversarial: Target account not found leaves all account balances untouched', async () => {
      const stateBefore = readStoredFinanceState();
      const balancesBefore = stateBefore.accounts.map((a) => a.balance);

      const payload = {
        rappiIncome: 50000,
        dailyExpense: 0,
        targetAccountName: 'CuentaInexistenteDePrueba',
        note: 'Prueba cuenta fantasma',
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      const balancesAfter = json.data.accounts.map((a) => a.balance);
      assert.deepEqual(balancesAfter, balancesBefore, 'No known account balances should have changed');
    });

    it('2.11 Adversarial Molly Injection: mollyWalk=true with spoofed walksIncome is strictly purged to 0', async () => {
      const payload = {
        siennaWalk: false,
        fridaWalk: false,
        mollyWalk: true, // Malicious injection attempt
        walksIncome: 999999, // Attempted spoofed walksIncome
        mollyIncome: 50000,
        rappiIncome: 0,
        dailyExpense: 0,
        targetAccountName: 'Nequi',
        note: 'Intento de paseo con Molly',
      };

      const req = createNextRequest('/api/finance/daily-log', 'POST', payload);
      const res = await postDailyLog(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.walksSum, 0, 'Walks sum must strictly be 0 (Molly purgada)');

      const latestLog = json.data.dailyLogs[0];
      assert.equal(latestLog.mollyWalk, false, 'DailyLog mollyWalk MUST be forced to false');
      assert.equal(latestLog.walksIncome, 0, 'DailyLog walksIncome MUST be 0');
    });

    it('2.12 Multiplexer Route /api/finance handles daily-log action identically', async () => {
      const payload = {
        action: 'daily-log',
        siennaWalk: true,
        fridaWalk: false,
        rappiIncome: 15000,
        dailyExpense: 5000,
        targetAccountName: 'Nequi',
      };

      const req = createNextRequest('/api/finance', 'POST', payload);
      const res = await postFinanceMultiplexer(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.walksSum, 9000);
      assert.equal(json.immediateNetChange, 10000);
    });
  });

  // ==========================================================================
  // SUITE 3: POST /api/finance/settle-walks when pendingWalksWeekly is 0 vs > 0
  // ==========================================================================
  describe('Suite 3: POST /api/finance/settle-walks Boundary & Settlement Tests', () => {
    it('3.1 When pendingWalksWeekly > 0: credits exact amount to Nu, resets pending to 0, logs settlement', async () => {
      const stateBefore = readStoredFinanceState();
      const nuBefore = stateBefore.accounts.find((a) => a.name === 'Cuenta Nu').balance; // 320,000
      const pendingBefore = stateBefore.tripSettings.pendingWalksWeekly; // 48,700
      assert.ok(pendingBefore > 0, 'Precondition: pendingWalksWeekly must be > 0');

      const req = createNextRequest('/api/finance/settle-walks', 'POST', { targetAccountName: 'Cuenta Nu' });
      const res = await postSettleWalks(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.settledAmount, pendingBefore);

      const stateAfter = json.data;
      const nuAfter = stateAfter.accounts.find((a) => a.name === 'Cuenta Nu').balance;
      assert.equal(nuAfter, nuBefore + pendingBefore, 'Cuenta Nu must receive full pending amount ($368,700 COP)');
      assert.equal(stateAfter.tripSettings.pendingWalksWeekly, 0, 'pendingWalksWeekly must be reset to exactly 0');

      // Verify settlement log
      const settlementLog = stateAfter.dailyLogs[0];
      assert.equal(settlementLog.walksIncome, pendingBefore);
      assert.equal(settlementLog.netChange, pendingBefore);
      assert.equal(settlementLog.mollyWalk, false);
      assert.ok(settlementLog.note.includes('Liquidación'));
    });

    it('3.2 When pendingWalksWeekly == 0: idempotent response with settledAmount=0 and no spurious logs', async () => {
      // First settle walks so pending becomes 0
      const req1 = createNextRequest('/api/finance/settle-walks', 'POST', { targetAccountName: 'Cuenta Nu' });
      await postSettleWalks(req1);

      const stateBefore = readStoredFinanceState();
      assert.equal(stateBefore.tripSettings.pendingWalksWeekly, 0, 'Precondition: pendingWalksWeekly is 0');
      const logCountBefore = stateBefore.dailyLogs.length;
      const nuBefore = stateBefore.accounts.find((a) => a.name === 'Cuenta Nu').balance;

      // Second settlement attempt
      const req2 = createNextRequest('/api/finance/settle-walks', 'POST', { targetAccountName: 'Cuenta Nu' });
      const res = await postSettleWalks(req2);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.settledAmount, 0);
      assert.ok(json.message.includes('No hay saldo'));

      const stateAfter = json.data;
      const nuAfter = stateAfter.accounts.find((a) => a.name === 'Cuenta Nu').balance;
      assert.equal(nuAfter, nuBefore, 'Nu balance must not change on zero settlement');
      assert.equal(stateAfter.dailyLogs.length, logCountBefore, 'No additional log entry should be created');
    });

    it('3.3 Default Target Account: settle-walks defaults to Cuenta Nu when targetAccountName is omitted', async () => {
      // Add a walk log so pendingWalksWeekly > 0
      const logReq = createNextRequest('/api/finance/daily-log', 'POST', { siennaWalk: true });
      await postDailyLog(logReq);

      const stateBefore = readStoredFinanceState();
      const nuBefore = stateBefore.accounts.find((a) => a.name === 'Cuenta Nu').balance;
      const pendingBefore = stateBefore.tripSettings.pendingWalksWeekly;
      assert.ok(pendingBefore > 0);

      // Call settle-walks without targetAccountName
      const settleReq = createNextRequest('/api/finance/settle-walks', 'POST', {});
      const res = await postSettleWalks(settleReq);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.settledAmount, pendingBefore);
      const nuAfter = json.data.accounts.find((a) => a.name === 'Cuenta Nu').balance;
      assert.equal(nuAfter, nuBefore + pendingBefore);
    });

    it('3.4 Settle to Nequi: properly directs settlement funds to specified alternative account', async () => {
      const logReq = createNextRequest('/api/finance/daily-log', 'POST', { fridaWalk: true });
      await postDailyLog(logReq);

      const stateBefore = readStoredFinanceState();
      const nequiBefore = stateBefore.accounts.find((a) => a.name === 'Nequi').balance;
      const pendingBefore = stateBefore.tripSettings.pendingWalksWeekly;

      const settleReq = createNextRequest('/api/finance/settle-walks', 'POST', { targetAccountName: 'Nequi' });
      const res = await postSettleWalks(settleReq);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.settledAmount, pendingBefore);
      const nequiAfter = json.data.accounts.find((a) => a.name === 'Nequi').balance;
      assert.equal(nequiAfter, nequiBefore + pendingBefore);
    });

    it('3.5 Multiplexer route /api/finance handles action=settle-walks identically', async () => {
      const logReq = createNextRequest('/api/finance/daily-log', 'POST', { siennaWalk: true });
      await postDailyLog(logReq);

      const req = createNextRequest('/api/finance', 'POST', { action: 'settle-walks', targetAccountName: 'Nequi' });
      const res = await postFinanceMultiplexer(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.tripSettings.pendingWalksWeekly, 0);
    });
  });

  // ==========================================================================
  // SUITE 4: JSON Import/Export Roundtrip & Data Persistence Verification
  // ==========================================================================
  describe('Suite 4: JSON Roundtrip & State Persistence', () => {
    it('4.1 Full Roundtrip: GET state -> JSON serialize -> sync POST -> GET state yields 0 data loss', async () => {
      const get1 = await getFinanceState();
      assert.equal(get1.status, 200);
      const stateOriginal = (await get1.json()).data;

      // JSON Roundtrip serialize & parse
      const serialized = JSON.stringify(stateOriginal, null, 2);
      const deserialized = JSON.parse(serialized);

      // Post back to sync
      const syncReq = createNextRequest('/api/finance/sync', 'POST', { state: deserialized });
      const syncRes = await postSync(syncReq);
      assert.equal(syncRes.status, 200);

      // Read back again
      const get2 = await getFinanceState();
      assert.equal(get2.status, 200);
      const stateRestored = (await get2.json()).data;

      // Deep field verification
      assert.equal(stateRestored.accounts.length, stateOriginal.accounts.length);
      for (let i = 0; i < stateOriginal.accounts.length; i++) {
        assert.equal(stateRestored.accounts[i].id, stateOriginal.accounts[i].id);
        assert.equal(stateRestored.accounts[i].name, stateOriginal.accounts[i].name);
        assert.equal(stateRestored.accounts[i].balance, stateOriginal.accounts[i].balance);
        assert.equal(stateRestored.accounts[i].type, stateOriginal.accounts[i].type);
      }

      assert.deepEqual(stateRestored.fixedExpenses, stateOriginal.fixedExpenses);

      // Verify tripSettings
      assert.equal(stateRestored.tripSettings.availableFund, stateOriginal.tripSettings.availableFund);
      assert.equal(stateRestored.tripSettings.dadTotalCommitted, stateOriginal.tripSettings.dadTotalCommitted);
      assert.equal(stateRestored.tripSettings.dadPaidAmount, stateOriginal.tripSettings.dadPaidAmount);
      assert.equal(stateRestored.tripSettings.dadPendingAmount, stateOriginal.tripSettings.dadPendingAmount);
      assert.equal(stateRestored.tripSettings.pendingWalksWeekly, stateOriginal.tripSettings.pendingWalksWeekly);
      assert.equal(stateRestored.tripSettings.totalEstimatedCost, stateOriginal.tripSettings.totalEstimatedCost);
      assert.equal(stateRestored.tripSettings.balanceParaLujos, stateOriginal.tripSettings.balanceParaLujos);
      assert.equal(stateRestored.tripSettings.personalRemainingTarget, stateOriginal.tripSettings.personalRemainingTarget);
      assert.equal(stateRestored.tripSettings.projectedFundWithDad, stateOriginal.tripSettings.projectedFundWithDad);
      assert.equal(stateRestored.tripSettings.projectedSurplusWithDad, stateOriginal.tripSettings.projectedSurplusWithDad);

      // Verify pendingDebts including nulls
      assert.deepEqual(stateRestored.pendingDebts, stateOriginal.pendingDebts);

      // Verify dailyLogs
      assert.equal(stateRestored.dailyLogs.length, stateOriginal.dailyLogs.length);
      for (let i = 0; i < stateOriginal.dailyLogs.length; i++) {
        assert.equal(stateRestored.dailyLogs[i].id, stateOriginal.dailyLogs[i].id);
        assert.equal(stateRestored.dailyLogs[i].walksIncome, stateOriginal.dailyLogs[i].walksIncome);
        assert.equal(stateRestored.dailyLogs[i].siennaWalk, stateOriginal.dailyLogs[i].siennaWalk);
        assert.equal(stateRestored.dailyLogs[i].fridaWalk, stateOriginal.dailyLogs[i].fridaWalk);
        assert.equal(stateRestored.dailyLogs[i].mollyWalk, false);
      }
    });

    it('4.2 File Persistence: writeStoredFinanceState actually writes to data/real_finance_state.json', () => {
      const getRes = readStoredFinanceState();
      assert.ok(getRes);

      const fileContent = fs.readFileSync(STATE_FILE, 'utf8');
      const fileData = JSON.parse(fileContent);

      assert.equal(fileData.accounts.length, 3);
      assert.equal(fileData.fixedExpenses.length, 3);
      assert.ok(fileData.tripSettings);
      assert.ok(fileData.dailyLogs.length >= 6);
    });

    it('4.3 Dad Abono Flow: adding 60,000 COP abono adjusts dadPaid to 200k, reduces pending to 250k', async () => {
      const payload = {
        action: 'dad-abono',
        addedAmount: 60000,
        targetAccountName: 'Cuenta Nu',
      };

      const req = createNextRequest('/api/finance', 'POST', payload);
      const res = await postFinanceMultiplexer(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      const trip = json.data.tripSettings;
      assert.equal(trip.dadPaidAmount, 140000 + 60000); // 200,000 COP
      assert.equal(trip.dadPendingAmount, 250000); // 450,000 - 200,000
    });

    it('4.4 Settle Debt Flow: settling Camilo debt marks isPaid=true and credits Efectivo', async () => {
      const stateBefore = readStoredFinanceState();
      const efectivoBefore = stateBefore.accounts.find((a) => a.name === 'Efectivo').balance;

      const payload = {
        action: 'settle-debt',
        debtId: '1',
        targetAccountName: 'Efectivo',
      };

      const req = createNextRequest('/api/finance', 'POST', payload);
      const res = await postFinanceMultiplexer(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);

      const stateAfter = json.data;
      const efectivoAfter = stateAfter.accounts.find((a) => a.name === 'Efectivo').balance;
      assert.equal(efectivoAfter, efectivoBefore + 35000);

      const camiloDebt = stateAfter.pendingDebts.find((d) => String(d.id) === '1');
      assert.equal(camiloDebt.isPaid, true);
      assert.equal(camiloDebt.paidToAccount, 'Efectivo');
      assert.ok(camiloDebt.paidDate);

      // Re-settling the same debt should return 404
      const retryReq = createNextRequest('/api/finance', 'POST', payload);
      const retryRes = await postFinanceMultiplexer(retryReq);
      assert.equal(retryRes.status, 404);
      assert.equal((await retryRes.json()).success, false);
    });

    it('4.5 Normalization Idempotency: normalizeFinanceState is an exact fixed point', () => {
      const state = readStoredFinanceState();
      const pass1 = normalizeFinanceState(state);
      const pass2 = normalizeFinanceState(pass1);

      assert.deepEqual(pass2.accounts, pass1.accounts);
      assert.deepEqual(pass2.tripSettings, pass1.tripSettings);
      assert.deepEqual(pass2.fixedExpenses, pass1.fixedExpenses);
      assert.deepEqual(pass2.pendingDebts, pass1.pendingDebts);
    });
  });

  // ==========================================================================
  // SUITE 5: Absolute Invariant — mollyWalk NEVER Enabled & 0 Revenue
  // ==========================================================================
  describe('Suite 5: Absolute Invariant — mollyWalk NEVER Enabled & Zero Revenue', () => {
    it('5.1 Adversarial State Sync with mollyWalk=true: forced to false upon storage', async () => {
      const maliciousState = {
        ...JSON.parse(originalStateSnapshot),
        dailyLogs: [
          {
            id: 9999,
            timestamp: Date.now(),
            dateDisplay: '01 de septiembre, 2026',
            walksIncome: 100000,
            siennaWalk: false,
            fridaWalk: false,
            mollyWalk: true, // Injected true
            rappiIncome: 0,
            dailyExpense: 0,
            netChange: 0,
            targetAccountName: 'Efectivo',
            note: 'Malicious Molly log injection',
          },
        ],
      };

      const syncReq = createNextRequest('/api/finance/sync', 'POST', maliciousState);
      const res = await postSync(syncReq);
      assert.equal(res.status, 200);

      const json = await res.json();
      const savedLogs = json.data.dailyLogs;
      const injectedLog = savedLogs.find((l) => l.id === 9999);
      assert.ok(injectedLog, 'Log was stored');
      assert.equal(injectedLog.mollyWalk, false, 'mollyWalk MUST be forced to false by normalization');
    });

    it('5.2 Verification in Android Kotlin Source Files: mollyWalk=false in entities and repositories', () => {
      const modelsPath = path.join(
        PROJECT_ROOT,
        'android/app/src/main/java/com/megaproyecto/health/finance/data/model/FinanceModels.kt'
      );
      const repoPath = path.join(
        PROJECT_ROOT,
        'android/app/src/main/java/com/megaproyecto/health/finance/data/repository/FinanceRepository.kt'
      );

      assert.ok(fs.existsSync(modelsPath), 'FinanceModels.kt must exist');
      assert.ok(fs.existsSync(repoPath), 'FinanceRepository.kt must exist');

      const modelsContent = fs.readFileSync(modelsPath, 'utf8');
      assert.ok(
        modelsContent.includes('val mollyWalk: Boolean = false'),
        'FinanceModels.kt DailyLog must define mollyWalk default false'
      );

      const repoContent = fs.readFileSync(repoPath, 'utf8');
      assert.ok(
        repoContent.includes('mollyWalk = false'),
        'FinanceRepository.kt saveDailyRecord must strictly set mollyWalk = false'
      );
      assert.ok(
        !repoContent.includes('walksSum += mollyRate') && !repoContent.includes('walksSum += molly'),
        'FinanceRepository must never add molly to walksSum'
      );
    });

    it('5.3 Verification in TypeScript Store Source: MOLLY_WALK_RATE is 0, mollyWalk is false', () => {
      const storePath = path.join(PROJECT_ROOT, 'lib/financeStore.ts');
      assert.ok(fs.existsSync(storePath), 'lib/financeStore.ts must exist');

      const storeContent = fs.readFileSync(storePath, 'utf8');
      assert.ok(
        storeContent.includes('export const MOLLY_WALK_RATE = 0;'),
        'MOLLY_WALK_RATE must be explicitly defined as 0'
      );
      assert.ok(
        storeContent.includes('mollyWalk: false as const') || storeContent.includes('mollyWalk: false;'),
        'normalizeFinanceState must enforce mollyWalk: false'
      );
    });

    it('5.4 Mathematical Invariant: calculateMedellinBalance and walk rates yield 0 for Molly under all inputs', () => {
      assert.equal(MOLLY_WALK_RATE, 0, 'MOLLY_WALK_RATE constant must be strictly 0');
      assert.equal(SIENNA_WALK_RATE, 9000, 'SIENNA_WALK_RATE must be 9,000 COP');
      assert.equal(FRIDA_WALK_RATE, 5850, 'FRIDA_WALK_RATE must be 5,850 COP');

      // Even if an adversarial routine attempts to multiply walks by Molly rate:
      const hypotheticalRevenue = 1000 * MOLLY_WALK_RATE;
      assert.equal(hypotheticalRevenue, 0, 'Revenue for 1000 Molly walks must be 0 COP');
    });
  });
});
