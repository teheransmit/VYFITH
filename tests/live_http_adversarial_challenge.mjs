import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:3000';
console.log('='.repeat(80));
console.log('  LIVE HTTP REST API & PERSISTENCE ADVERSARIAL STRESS TEST');
console.log(`  Target Server: ${BASE_URL}`);
console.log('='.repeat(80));

let passes = 0;
let failures = 0;

async function test(name, fn) {
  process.stdout.write(`[LIVE-TEST] ${name}... `);
  try {
    await fn();
    console.log('PASSED ✔');
    passes++;
  } catch (err) {
    console.log('FAILED ✖');
    console.error(err);
    failures++;
  }
}

// Backup current state file
const STATE_FILE = path.join(process.cwd(), 'data', 'real_finance_state.json');
let backupState = null;
if (fs.existsSync(STATE_FILE)) {
  backupState = fs.readFileSync(STATE_FILE, 'utf8');
}

async function run() {
  try {
    // 1. Live GET /api/finance/state
    await test('GET /api/finance/state returns 200 with complete UnifiedFinanceState', async () => {
      const res = await fetch(`${BASE_URL}/api/finance/state`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), '*');
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.serverTime);
      assert.ok(Array.isArray(json.data.accounts));
      assert.equal(json.data.accounts.length, 3);
      assert.ok(json.data.tripSettings);
      assert.ok(Array.isArray(json.data.dailyLogs));
      assert.ok(Array.isArray(json.data.fixedExpenses));
      assert.ok(Array.isArray(json.data.pendingDebts));

      // Verify Molly exclusion across all daily logs
      for (const log of json.data.dailyLogs) {
        assert.equal(log.mollyWalk, false, 'mollyWalk must never be true in persisted logs');
      }
    });

    // 2. Preflight OPTIONS
    await test('OPTIONS /api/finance/state and /api/finance/daily-log return 200 with CORS headers', async () => {
      const r1 = await fetch(`${BASE_URL}/api/finance/state`, { method: 'OPTIONS' });
      assert.equal(r1.status, 200);
      assert.equal(r1.headers.get('access-control-allow-origin'), '*');

      const r2 = await fetch(`${BASE_URL}/api/finance/daily-log`, { method: 'OPTIONS' });
      assert.equal(r2.status, 200);
      assert.equal(r2.headers.get('access-control-allow-origin'), '*');
    });

    // 3. POST /api/finance/daily-log - Sienna Walk
    await test('POST /api/finance/daily-log: Sienna walk adds 9,000 COP to pendingWalksWeekly without altering cash', async () => {
      // Get baseline
      const baseRes = await fetch(`${BASE_URL}/api/finance/state`);
      const baseState = (await baseRes.json()).data;
      const initialPending = baseState.tripSettings.pendingWalksWeekly;
      const initialCash = baseState.accounts.find(a => a.name === 'Nequi').balance;

      const res = await fetch(`${BASE_URL}/api/finance/daily-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siennaWalk: true,
          fridaWalk: false,
          rappiIncome: 0,
          dailyExpense: 0,
          targetAccountName: 'Nequi',
          note: 'Live Sienna Test',
        }),
      });

      assert.equal(res.status, 200);
      const resJson = await res.json();
      assert.equal(resJson.success, true);
      assert.equal(resJson.walksSum, 9000);
      assert.equal(resJson.immediateNetChange, 0);

      // Verify in-memory and persisted state
      const newState = resJson.data;
      assert.equal(newState.tripSettings.pendingWalksWeekly, initialPending + 9000);
      assert.equal(newState.accounts.find(a => a.name === 'Nequi').balance, initialCash);
      assert.equal(newState.dailyLogs[0].siennaWalk, true);
      assert.equal(newState.dailyLogs[0].mollyWalk, false);
    });

    // 4. POST /api/finance/daily-log - Adversarial Molly Injection
    await test('POST /api/finance/daily-log: Adversarial mollyWalk injection is strictly neutralized', async () => {
      const baseRes = await fetch(`${BASE_URL}/api/finance/state`);
      const baseState = (await baseRes.json()).data;
      const initialPending = baseState.tripSettings.pendingWalksWeekly;

      const res = await fetch(`${BASE_URL}/api/finance/daily-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siennaWalk: false,
          fridaWalk: false,
          mollyWalk: true,
          mollyRate: 15000,
          walksIncome: 99999,
          rappiIncome: 0,
          dailyExpense: 0,
          targetAccountName: 'Nequi',
          note: 'Malicious Molly Injection Test',
        }),
      });

      assert.equal(res.status, 200);
      const resJson = await res.json();
      assert.equal(resJson.success, true);
      assert.equal(resJson.walksSum, 0, 'Walk sum must be 0 for Molly');
      assert.equal(resJson.data.tripSettings.pendingWalksWeekly, initialPending, 'Pending walks must not increase');
      assert.equal(resJson.data.dailyLogs[0].mollyWalk, false, 'mollyWalk must be strictly false');
      assert.equal(resJson.data.dailyLogs[0].walksIncome, 0);
    });

    // 5. POST /api/finance/daily-log - Immediate cashflow
    await test('POST /api/finance/daily-log: Rappi income + expense update account balance immediately', async () => {
      const baseRes = await fetch(`${BASE_URL}/api/finance/state`);
      const baseState = (await baseRes.json()).data;
      const initialEfectivo = baseState.accounts.find(a => a.name === 'Efectivo').balance;

      const res = await fetch(`${BASE_URL}/api/finance/daily-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siennaWalk: false,
          fridaWalk: false,
          rappiIncome: 45000,
          dailyExpense: 15000,
          targetAccountName: 'Efectivo',
          note: 'Live Rappi + Lunch',
        }),
      });

      assert.equal(res.status, 200);
      const resJson = await res.json();
      assert.equal(resJson.immediateNetChange, 30000);
      assert.equal(
        resJson.data.accounts.find(a => a.name === 'Efectivo').balance,
        initialEfectivo + 30000
      );
    });

    // 6. POST /api/finance/settle-walks - Weekly Walk Settlement
    await test('POST /api/finance/settle-walks: credits accumulated walks to Cuenta Nu and resets pending to 0', async () => {
      const baseRes = await fetch(`${BASE_URL}/api/finance/state`);
      const baseState = (await baseRes.json()).data;
      const pendingToSettle = baseState.tripSettings.pendingWalksWeekly;
      assert.ok(pendingToSettle > 0, 'Should have pending walks from previous tests');
      const initialNu = baseState.accounts.find(a => a.name === 'Cuenta Nu').balance;

      const res = await fetch(`${BASE_URL}/api/finance/settle-walks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAccountName: 'Cuenta Nu',
        }),
      });

      assert.equal(res.status, 200);
      const resJson = await res.json();
      assert.equal(resJson.success, true);
      assert.equal(resJson.settledAmount, pendingToSettle);
      assert.equal(resJson.data.tripSettings.pendingWalksWeekly, 0);
      assert.equal(
        resJson.data.accounts.find(a => a.name === 'Cuenta Nu').balance,
        initialNu + pendingToSettle
      );
      assert.equal(resJson.data.dailyLogs[0].walksIncome, pendingToSettle);
      assert.equal(resJson.data.dailyLogs[0].mollyWalk, false);
    });

    // 7. POST /api/finance/settle-walks - Idempotent when 0
    await test('POST /api/finance/settle-walks: idempotent when pendingWalksWeekly is 0', async () => {
      const res = await fetch(`${BASE_URL}/api/finance/settle-walks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAccountName: 'Cuenta Nu',
        }),
      });

      assert.equal(res.status, 200);
      const resJson = await res.json();
      assert.equal(resJson.success, true);
      assert.equal(resJson.settledAmount, 0);
      assert.equal(resJson.message, 'No hay saldo pendiente de paseos por liquidar.');
    });

    // 8. Full JSON Roundtrip via POST /api/finance/sync and GET /api/finance/state
    await test('Full JSON roundtrip: POST /api/finance/sync persists and GET /api/finance/state preserves fidelity', async () => {
      // Create a test state with a unique note marker
      const marker = `Roundtrip-Verification-${Date.now()}`;
      const stateRes = await fetch(`${BASE_URL}/api/finance/state`);
      const testState = (await stateRes.json()).data;
      testState.dailyLogs[0].note = marker;

      const syncRes = await fetch(`${BASE_URL}/api/finance/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testState),
      });

      assert.equal(syncRes.status, 200);
      const syncJson = await syncRes.json();
      assert.equal(syncJson.success, true);

      // Verify file on disk actually contains the marker
      const diskContent = fs.readFileSync(STATE_FILE, 'utf8');
      assert.ok(diskContent.includes(marker), 'Disk file must contain the persisted marker');

      // Now fetch fresh from GET
      const freshRes = await fetch(`${BASE_URL}/api/finance/state`);
      const freshJson = await freshRes.json();
      assert.equal(freshJson.data.dailyLogs[0].note, marker);
    });

    // 9. Adversarial Malformed Requests
    await test('Adversarial: Malformed requests return appropriate HTTP status codes', async () => {
      // Malformed daily-log
      const r1 = await fetch(`${BASE_URL}/api/finance/daily-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('not an object'),
      });
      assert.equal(r1.status, 400);

      // Malformed sync
      const r2 = await fetch(`${BASE_URL}/api/finance/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(null),
      });
      assert.equal(r2.status, 400);
    });

  } finally {
    // Restore backup state to leave clean environment
    if (backupState) {
      fs.writeFileSync(STATE_FILE, backupState, 'utf8');
      console.log('\n[CLEANUP] Restored data/real_finance_state.json from initial backup.');
    }
  }

  console.log('='.repeat(80));
  console.log(`  LIVE ADVERSARIAL STRESS TEST SUMMARY: ${passes} PASSED, ${failures} FAILED`);
  console.log('='.repeat(80));

  if (failures > 0) {
    process.exit(1);
  }
}

run();
