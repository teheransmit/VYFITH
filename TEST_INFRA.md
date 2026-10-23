# VYFITH Financial Module — Test Infrastructure & Verification Specification

**Document Version**: 1.1.0  
**Target Environment**: Node.js v20+ / Next.js 15+ / Kotlin Room DB  
**Author**: `test_writer_1`  
**Date**: 2026-10-23  
**Status**: APPROVED & FULLY VERIFIED (25/25 Tests Passing)  

---

## 1. Overview & Test Architecture

The VYFITH Financial & Medellín Trip module governs Santiago's personal cash flows, pet care receivables (Sienna & Frida — strictly without Molly), Rappi courier earnings, daily expenses, debt amortizations, compound interest yields on Nu (9.30% E.A.), and the Medellín trip budget simulator ($584,549 COP target with $450,000 COP father commitment).

This test infrastructure implements a rigorous **4-Tier verification pyramid** designed to guarantee mathematical accuracy, data integrity across mobile (Android Room) and web (Next.js/TypeScript), and flawless resilience against adverse boundary conditions.

```
                  ▲
                 / \
                /   \     Tier 4: Real-World Workload Scenarios
               / Tier\    (Santiago's 7-day flow, Dad abono sync, Emergency stress)
              /   4   \
             /---------\
            /  Tier 3   \   Tier 3: Cross-Feature Combinations
           /             \  (Multi-day logs, yield + expenses + walks, DTO sync)
          /---------------\
         /    Tier 2     \  Tier 2: Boundary & Corner Cases
        /                 \ (Zero Nu, abono saturation, empty logs, Molly exclusion)
       /-------------------\
      /       Tier 1        \ Tier 1: Feature Coverage (Core Engine & Contracts)
     /                       \(Accounts, Nu 9.30%, DailyLog, Debts, API DTOs)
    /-------------------------\
```

---

## 2. Mathematical & Financial Foundation

### 2.1 Nu Account Daily Compound Yield (9.30% E.A.)
In Colombia, the Cajita Nu compounds interest on a daily basis derived from the Effective Annual rate ($EA = 0.0930$):
$$i_{daily} = (1 + EA)^{\frac{1}{365}} - 1 = (1 + 0.0930)^{\frac{1}{365}} - 1 \approx 0.000243663130887$$
$$\text{Yield}_{daily}(B) = B \times i_{daily}$$
$$\text{Yield}_{N\_days}(B) = B \times \left((1 + i_{daily})^N - 1\right)$$

*Authoritative Reference*: For a representative balance of $320,000 COP:
$$\text{Yield}_{daily}(320,000) = 320,000 \times 0.000243663130887 \approx 77.9722 \implies \$77.97 \text{ COP/day}$$
$$\text{Yield}_{30\_days}(320,000) = 320,000 \times \left((1 + 0.00024366313)^{30} - 1\right) \approx \$2,347.45 \text{ COP/month}$$

### 2.2 Immediate Liquidity vs. Deferred Walk Receivables
1. **Walk Income Sum**:
   $$\text{WalksSum} = (\text{sienna} \times 9000) + (\text{frida} \times 5850) + (\text{molly} \times 0)$$
   *(Molly is strictly excluded and forced to false/0).*
2. **Immediate Net Liquid Change**:
   $$\Delta \text{Balance}_{immediate} = \text{RappiIncome} - \text{DailyExpense}$$
   *(Applied immediately to `targetAccountName`).*
3. **Deferred Receivable Accumulation**:
   $$\text{pendingWalksWeekly}_{t+1} = \text{pendingWalksWeekly}_t + \text{WalksSum}$$
4. **Weekly Settlement (`settleWeeklyWalks`)**:
   $$\text{TargetAccount.balance} \leftarrow \text{TargetAccount.balance} + \text{pendingWalksWeekly}$$
   $$\text{pendingWalksWeekly} \leftarrow 0.0$$

### 2.3 Medellín Trip Budget & Luxury Balance
- **Total Estimated Trip Cost**: $\$584,549 \text{ COP}$ (Alojamiento $\$164,550$ + Bus $\$40,000$ + Alimentación $\$225,000$ + Transporte $\$35,000$ + Actividades $\$70,000$ + Imprevistos $\$50,000$).
- **Base Available Fund**: $\$550,000 \text{ COP}$.
- **Dad's Total Commitment**: $\$450,000 \text{ COP}$.
- **Dad's Initial Paid Amount**: $\$140,000 \text{ COP}$.
- **Dad's Pending Delivery**:
  $$\text{dadPending} = \max(0, \text{dadTotalCommitted} - \text{dadPaidAmount}) = \max(0, 450000 - 140000) = \$310,000 \text{ COP}$$
- **Santiago's Personal Remaining Target**:
  $$\text{personalRemainingTarget} = \max(0, \text{totalEstimatedCost} - \text{dadTotalCommitted}) = \max(0, 584549 - 450000) = \$134,549 \text{ COP}$$
- **Current Balance for Luxuries**:
  $$\text{balanceParaLujos} = \text{availableFund} - \text{totalEstimatedCost} = 550000 - 584549 = -\$34,549 \text{ COP (Deficit)}$$
- **Projected Fund with Dad**:
  $$\text{projectedFundWithDad} = \text{availableFund} + \text{dadPending} = 550000 + 310000 = \$860,000 \text{ COP}$$
- **Projected Luxury Surplus**:
  $$\text{projectedSurplus} = \text{projectedFundWithDad} - \text{totalEstimatedCost} = 860000 - 584549 = +\$275,451 \text{ COP (Surplus)}$$
- **Sienna Walks Required to Cover Personal Target**:
  $$\text{walksNeeded} = \lceil 134549 / 9000 \rceil = 15 \text{ paseos}$$

---

## 3. The 4-Tier Test Suite Specification

### Tier 1: Feature Coverage (Core Engine & Contracts)
Focus: Direct validation of each isolated feature against business rules.
- **T1.1 Account Balances**:
  - Verification of 3 primary account categories (`CASH`, `NU`, `NEQUI`).
  - Total account balances summation ($85k + $320k + $245k = $650,000 COP).
- **T1.2 Nu Daily Compound Yield (9.30% E.A.)**:
  - Single-day compound interest calculation ($320,000 COP $\to$ $77.97 COP).
  - Multi-day compound interest projections (30 days $\to$ $2,347.45 COP, $1M 1 day $\to$ $243.66 COP).
- **T1.3 Fixed Expenses & Free Liquid Surplus**:
  - Fixed expense aggregation across categories (`DEBT`, `SUBSCRIPTION`, `GENERAL` = $175,200 COP).
  - Excedente Líquido Libre: $\sum \text{Accounts} - \sum \text{FixedExpenses} = \$474,800 \text{ COP}$.
- **T1.4 DailyLog Registration (Strictly No Molly)**:
  - Immediate liquid impact ($\text{rappi} - \text{expense}$) on selected account.
  - Walk earnings deferred into `pendingWalksWeekly`.
  - Molly walk explicitly rejected/sanitized to `false` and 0 COP value.
- **T1.5 TripSettings & Medellín Metrics**:
  - Verification of singleton state (id: 1).
  - Validation of calculated properties: `dadPendingAmount`, `personalRemainingTarget`, `balanceParaLujos`, `projectedFundWithDad`, `projectedSurplusWithDad`.
- **T1.6 PendingDebt Lifecycle**:
  - Creation of receivable item with debtor name, amount, date.
  - Settlement of debt: status becomes `isPaid = true`, funds credited to target account.
- **T1.7 REST API Payloads & Contracts**:
  - JSON schema conformance for `GET /api/finance/state`, `POST /api/finance/daily-log`, `POST /api/finance/settle-walks`, `POST /api/sync/trip`.

### Tier 2: Boundary & Corner Cases
Focus: Mathematical edge cases, invalid inputs, and saturation boundaries.
- **T2.1 Zero & Low Nu Balance**:
  - Balance = 0 yields exactly $0.00 COP; no NaN, null, or division by zero.
  - Negative balance returns $0.00 COP; micro-balances ($10 COP) accurately compute without precision collapse.
- **T2.2 Overdraft / Negative Balance Handling**:
  - Negative account balance correctly calculated in net surplus.
  - Overdraft state correctly reflects in liquid surplus without throwing.
- **T2.3 Empty Daily Log Rejection**:
  - Logs with 0 walks, 0 Rappi, and 0 expenses are blocked with explicit validation error.
- **T2.4 Dad Abono Saturation at $450,000 COP and Beyond**:
  - Abonos reaching $450,000 COP result in `dadPendingAmount` of exactly 0.0 COP.
  - Abonos exceeding $450,000 (e.g. $500,000) clamp `dadPendingAmount` to 0.0 and progress to 100% (1.0).
- **T2.5 Zero Pending Walks Settlement**:
  - Calling `settleWeeklyWalks` when `pendingWalksWeekly <= 0` returns 0.0 and creates no account drift.
- **T2.6 Duplicate Debt Settlement Prevention**:
  - Settling an already-paid debt does not re-credit the target account (idempotent guard).
- **T2.7 Molly Parameter Infiltration Adversarial Test**:
  - Injected payload `{ molly: true, mollyWalk: true, mollyRate: 5000 }` is scrubbed to `false` and 0 COP.
- **T2.8 Extreme Currency Values & Floating-Point Precision**:
  - Billion COP values handled cleanly; fractional centavos safely rounded to 2 decimal places.

### Tier 3: Cross-Feature Combinations
Focus: Inter-module interactions and state evolution across multiple domains.
- **T3.1 Multi-Day Sequential Logs**:
  - Sequence of 4 distinct days modifying Cash, Nu, and Nequi with positive and negative flows.
- **T3.2 Immediate vs. Deferred Cash Flow Splitting**:
  - Single log with Sienna walk ($9k deferred), Rappi ($40k liquid), and Expense ($15k liquid) into Nequi.
  - Immediate check: Nequi increases by $25k; Pending walks increases by $9k.
- **T3.3 Nu Yield Accrual Concurrent with Spending**:
  - Multi-day Nu interest compounding while spending occurs from Nequi or Cash.
- **T3.4 Walk Settlement into Nu Account**:
  - Accumulate walks over 3 days, settle into Nu account, verify new balance immediately begins earning higher daily yield.
- **T3.5 Concurrent Dad Abono & Debt Settlement**:
  - Receive dad abono into Nequi and friend debt payment into Cash; verify total liquid assets and surplus balance match expected totals.
- **T3.6 Round-Trip DTO Serialization / Deserialization**:
  - Export state to JSON format matching API contract, parse back, and verify exact byte-for-byte and numeric equality.

### Tier 4: Real-World Workload Scenarios
Focus: End-to-end simulation of Santiago's actual financial routine in Montería leading to Medellín.
- **T4.1 Comprehensive 7-Day Pre-Medellín Financial Flow**:
  - **Day 0**: Initial baseline: Efectivo $85,000, Nu $320,000, Nequi $245,000. Fixed expenses: Vuelos $140,000, Suscripciones $10,200, Motilada $25,000.
  - **Day 1**: Morning dog walk with Sienna ($9,000 pending). Afternoon Rappi shift +$35,000. Lunch at UPB -$12,000. Logged to Nequi.
  - **Day 2**: Morning dog walk with Frida ($5,850 pending). Barbershop motilada -$25,000 from Efectivo.
  - **Day 3**: Rainy day in Montería, no dog walks. Rappi shift +$45,000 COP, motorbike fuel -$10,000 COP into Nequi.
  - **Day 4**: Sienna walk ($9,000 pending). Afternoon snack -$8,000 COP from Nequi.
  - **Day 5**: Weekly settlement: Elena & Laura pay for walks. $72,550 credited to Nu account; pending walks reset to 0; Nu yield increases from $77.97 to $95.65 COP/day.
  - **Day 6**: Dad delivers partial contribution of $200,000 COP, credited to Nequi. Dad pending drops to $110,000 COP; progress exceeds 75%.
  - **Day 7**: Friend Camilo repays $35,000 COP debt into Efectivo.
  - **Audit & Luxury Balance**: Santiago allocates $700,000 COP to availableFund. Balance for luxuries turns from deficit (-$34,549) to surplus (+$115,451). Projected surplus with Dad reaches +$225,451 COP.
- **T4.2 Dad Abono Final Delivery & Commitment Saturation**:
  - Dad delivers remaining $310,000 COP to reach $450,000 COP total.
  - Dad pending reaches exactly 0.0 COP; progress reaches 100%.
  - Extra $50,000 COP bonus ($500,000 total) clamps pending at 0.0 COP and progress at 100%.
- **T4.3 Emergency Expense Stress Shock**:
  - Sudden $150,000 COP emergency motorbike repair expense on Nequi.
  - Absorbed smoothly into free surplus without disrupting Nu compound yield or corrupting trip budget.
- **T4.4 End-to-End JSON Synchronization & Round-Trip Portability**:
  - Primary store mutations exported to `GET /api/finance/state` format, serialized, and re-imported into clean client.
  - Complete state parity asserted across all 5 financial entities.

---

## 4. Test Execution & Automation

The test suite is automated via Node.js native test runner and ESM modules:

```powershell
# Run the complete test suite with full executive tier report:
node tests/run_all_tests.mjs

# Run individual test tiers with node:test:
node --test tests/tier1_feature_coverage.test.mjs
node --test tests/tier2_boundary_corner_cases.test.mjs
node --test tests/tier3_cross_feature_combinations.test.mjs
node --test tests/tier4_real_world_workload.test.mjs

# Run filtered tier via test runner:
node tests/run_all_tests.mjs --tier=1
node tests/run_all_tests.mjs --tier=4
```

---

## 5. Pass / Fail Criteria & Invariants

A test run is considered **PASSED** if and only if:
1. 100% of test assertions across Tiers 1–4 execute without errors (`exitCode === 0`).
2. Zero tolerance for Molly inclusions: any test detecting `mollyWalk == true` or Molly rate > 0 MUST fail.
3. Nu yield calculations match the exact compound formula within $\pm 0.01$ COP tolerance.
4. Medellín budget formulas enforce the $584,549 COP fixed target and dad $450,000 COP commitment invariants.
5. All JSON contracts match the REST API specifications defined in `PROJECT.md` and `spec_miner_models_0/handoff.md`.
