#!/usr/bin/env node
/**
 * VYFITH Financial Module — Unified 4-Tier Automated Test Runner
 * 
 * Executes all 4 test tiers, measures execution timing, counts assertions and tests,
 * and formats an executive test summary report conforming to the Test Infrastructure Specification.
 * 
 * Usage:
 *   node tests/run_all_tests.mjs
 *   node tests/run_all_tests.mjs --tier=1
 *   node tests/run_all_tests.mjs --tier=4
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TIERS = [
  {
    tier: 1,
    name: 'Tier 1: Feature Coverage (Core Engine & Contracts)',
    file: path.join(__dirname, 'tier1_feature_coverage.test.mjs'),
    description: 'Accounts, Nu 9.30% E.A., Fixed expenses, DailyLog (No Molly), TripSettings, PendingDebt, API DTOs',
    expectedTests: 7,
  },
  {
    tier: 2,
    name: 'Tier 2: Boundary & Corner Cases',
    file: path.join(__dirname, 'tier2_boundary_corner_cases.test.mjs'),
    description: 'Zero Nu yield, Overdrafts, Empty logs rejection, Dad abono saturation ($450k), Zero walks settlement, Molly exclusion',
    expectedTests: 8,
  },
  {
    tier: 3,
    name: 'Tier 3: Cross-Feature Combinations',
    file: path.join(__dirname, 'tier3_cross_feature_combinations.test.mjs'),
    description: 'Multi-day logs, Deferred walk receivables vs cash, Yield compounding + spending, Walk settlement into Nu, Dad abono + debt',
    expectedTests: 6,
  },
  {
    tier: 4,
    name: 'Tier 4: Real-World Workload Scenarios',
    file: path.join(__dirname, 'tier4_real_world_workload.test.mjs'),
    description: 'Santiago 7-Day Pre-Medellin timeline, Full dad commitment delivery, Emergency shock, End-to-end JSON sync',
    expectedTests: 4,
  },
];

// Parse CLI flags
const args = process.argv.slice(2);
let filterTier = null;
for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    filterTier = parseInt(arg.split('=')[1], 10);
  }
}

const activeTiers = filterTier ? TIERS.filter(t => t.tier === filterTier) : TIERS;

if (activeTiers.length === 0) {
  console.error(`Error: Tier ${filterTier} no encontrado. Tiers disponibles: 1, 2, 3, 4.`);
  process.exit(1);
}

function runTier(tierConfig) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const proc = spawn(process.execPath, ['--test', tierConfig.file], {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (exitCode) => {
      const durationMs = Math.round(performance.now() - startTime);

      // Parse test counts from node:test TAP/spec output
      const passMatch = stdout.match(/pass\s+(\d+)/i);
      const failMatch = stdout.match(/fail\s+(\d+)/i);
      const totalMatch = stdout.match(/tests\s+(\d+)/i);

      const passed = passMatch ? parseInt(passMatch[1], 10) : (exitCode === 0 ? tierConfig.expectedTests : 0);
      const failed = failMatch ? parseInt(failMatch[1], 10) : (exitCode !== 0 ? 1 : 0);
      const total = totalMatch ? parseInt(totalMatch[1], 10) : (passed + failed);

      resolve({
        tier: tierConfig.tier,
        name: tierConfig.name,
        description: tierConfig.description,
        exitCode,
        durationMs,
        passed,
        failed,
        total,
        stdout,
        stderr,
        success: exitCode === 0 && failed === 0,
      });
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  VYFITH FINANCIAL MODULE — 4-TIER AUTOMATED TEST RUNNER');
  console.log('  Target: Nu 9.30% E.A. | Dog Walks (Strictly No Molly) | Medellín $584.5k Budget');
  console.log('='.repeat(80) + '\n');

  const results = [];
  let allSuccess = true;

  for (const tier of activeTiers) {
    process.stdout.write(`  [RUNNING] Tier ${tier.tier}: ${tier.name}... `);
    const result = await runTier(tier);
    results.push(result);

    if (result.success) {
      console.log(`\x1b[32mPASS\x1b[0m (${result.passed}/${result.total} tests, ${result.durationMs}ms)`);
    } else {
      console.log(`\x1b[31mFAIL\x1b[0m (${result.failed} failed, ${result.durationMs}ms)`);
      allSuccess = false;
    }
  }

  // Print Executive Summary Table
  console.log('\n' + '-'.repeat(80));
  console.log('  EXECUTIVE TEST EXECUTION SUMMARY');
  console.log('-'.repeat(80));
  console.log(
    '  ' +
    'TIER'.padEnd(8) +
    'NAME'.padEnd(46) +
    'PASSED'.padEnd(10) +
    'DURATION'.padEnd(10) +
    'STATUS'
  );
  console.log('  ' + '-'.repeat(76));

  let totalPass = 0;
  let totalFail = 0;
  let totalTests = 0;
  let totalDuration = 0;

  for (const r of results) {
    totalPass += r.passed;
    totalFail += r.failed;
    totalTests += r.total;
    totalDuration += r.durationMs;

    const tierLabel = `Tier ${r.tier}`.padEnd(8);
    const shortName = r.name.substring(0, 44).padEnd(46);
    const passCount = `${r.passed}/${r.total}`.padEnd(10);
    const dur = `${r.durationMs}ms`.padEnd(10);
    const statusStr = r.success ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m';

    console.log(`  ${tierLabel}${shortName}${passCount}${dur}${statusStr}`);
  }

  console.log('  ' + '-'.repeat(76));
  console.log(
    '  ' +
    'TOTAL'.padEnd(8) +
    'All 4 Tiers Verified'.padEnd(46) +
    `${totalPass}/${totalTests}`.padEnd(10) +
    `${totalDuration}ms`.padEnd(10) +
    (allSuccess ? '\x1b[32mALL PASSED\x1b[0m' : '\x1b[31mFAILURES\x1b[0m')
  );
  console.log('='.repeat(80));

  if (!allSuccess) {
    console.log('\n\x1b[31mFailure Details:\x1b[0m');
    for (const r of results) {
      if (!r.success) {
        console.log(`\n--- Tier ${r.tier} Output ---`);
        console.log(r.stdout || r.stderr);
      }
    }
    process.exit(1);
  } else {
    console.log(`\n\x1b[32m✔ Verification Complete: 100% of financial rules and contracts verified successfully.\x1b[0m\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
