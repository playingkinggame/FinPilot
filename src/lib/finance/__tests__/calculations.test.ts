// FinPilot Financial Calculation Engine Unit Tests
// Tests core deterministic functions without mocking AI

import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateBalance,
  calculateSavingsRate,
  calculateCategoryBreakdown,
  calculateMerchantBreakdown,
  calculateMonthlyComparison,
  calculateBudgetProgress,
  calculateGoalProgress,
  calculateSubscriptionTotal,
  calculateWeekendSpending,
  calculatePaymentMethodBreakdown,
  simulateWhatIfScenario
} from '../engine';
import { Transaction, Budget, Goal, Subscription } from '../../../types';

export function runFinancialEngineTests(): {
  total: number;
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
} {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      user_id: 'u1',
      amount: 50000,
      type: 'income',
      category: 'Salary',
      description: 'Monthly Salary',
      date: '2026-09-01',
      payment_method: 'Bank Transfer',
      created_at: '2026-09-01'
    },
    {
      id: '2',
      user_id: 'u1',
      amount: 6240,
      type: 'expense',
      category: 'Food',
      merchant: 'Swiggy',
      description: 'Swiggy Orders',
      date: '2026-09-05', // Saturday
      payment_method: 'UPI',
      created_at: '2026-09-05'
    },
    {
      id: '3',
      user_id: 'u1',
      amount: 4820,
      type: 'expense',
      category: 'Shopping',
      merchant: 'Amazon',
      description: 'Amazon Electronics',
      date: '2026-09-10', // Thursday
      payment_method: 'Credit Card',
      created_at: '2026-09-10'
    },
    {
      id: '4',
      user_id: 'u1',
      amount: 2340,
      type: 'expense',
      category: 'Transport',
      merchant: 'Uber',
      description: 'Uber rides',
      date: '2026-09-12', // Saturday
      payment_method: 'UPI',
      created_at: '2026-09-12'
    },
    {
      id: '5',
      user_id: 'u1',
      amount: 14120,
      type: 'expense',
      category: 'Bills',
      merchant: 'Apartment Rent',
      description: 'Rent & Utilities',
      date: '2026-08-05', // Previous month (Wednesday — Aug 1 2026 would be a Saturday!)
      payment_method: 'Bank Transfer',
      created_at: '2026-08-01'
    }
  ];

  // Test 1: Total Income & Expenses
  try {
    const inc = calculateTotalIncome(mockTransactions);
    const exp = calculateTotalExpenses(mockTransactions);
    const bal = calculateBalance(mockTransactions);
    const passed = inc === 50000 && exp === 27520 && bal === 22480;
    results.push({
      name: 'calculateTotalIncome, Expenses & Balance',
      passed,
      message: passed ? undefined : `Expected inc:50000 exp:27520 bal:22480 got ${inc}, ${exp}, ${bal}`
    });
  } catch (err: any) {
    results.push({ name: 'calculateTotalIncome, Expenses & Balance', passed: false, message: err.message });
  }

  // Test 2: Savings Rate
  try {
    const rate = calculateSavingsRate(mockTransactions);
    const expected = Math.round(((50000 - 27520) / 50000) * 1000) / 10;
    const passed = rate === expected;
    results.push({
      name: 'calculateSavingsRate',
      passed,
      message: passed ? undefined : `Expected rate ${expected} got ${rate}`
    });
  } catch (err: any) {
    results.push({ name: 'calculateSavingsRate', passed: false, message: err.message });
  }

  // Test 3: Category Breakdown
  try {
    const cats = calculateCategoryBreakdown(mockTransactions);
    const foodCat = cats.find((c) => c.category === 'Food');
    const passed = foodCat !== undefined && foodCat.amount === 6240;
    results.push({
      name: 'calculateCategoryBreakdown',
      passed,
      message: passed ? undefined : `Food category calculation mismatch`
    });
  } catch (err: any) {
    results.push({ name: 'calculateCategoryBreakdown', passed: false, message: err.message });
  }

  // Test 4: Merchant Breakdown
  try {
    const merchants = calculateMerchantBreakdown(mockTransactions);
    const swiggy = merchants.find((m) => m.merchant === 'Swiggy');
    const passed = swiggy !== undefined && swiggy.amount === 6240;
    results.push({
      name: 'calculateMerchantBreakdown',
      passed,
      message: passed ? undefined : `Swiggy merchant calculation mismatch`
    });
  } catch (err: any) {
    results.push({ name: 'calculateMerchantBreakdown', passed: false, message: err.message });
  }

  // Test 5: Weekend Spending
  try {
    const weekend = calculateWeekendSpending(mockTransactions);
    // 2026-09-05 is Sat (6240), 2026-09-12 is Sat (2340) -> 8580
    const passed = weekend.amount === 8580 && weekend.count === 2;
    results.push({
      name: 'calculateWeekendSpending',
      passed,
      message: passed ? undefined : `Expected weekend: 8580 got ${weekend.amount}`
    });
  } catch (err: any) {
    results.push({ name: 'calculateWeekendSpending', passed: false, message: err.message });
  }

  // Test 6: Payment Method Breakdown
  try {
    const methods = calculatePaymentMethodBreakdown(mockTransactions);
    const upi = methods.find((m) => m.method === 'UPI');
    const passed = upi !== undefined && upi.amount === 8580;
    results.push({
      name: 'calculatePaymentMethodBreakdown',
      passed,
      message: passed ? undefined : `UPI breakdown mismatch`
    });
  } catch (err: any) {
    results.push({ name: 'calculatePaymentMethodBreakdown', passed: false, message: err.message });
  }

  // Test 7: Subscription Total
  try {
    const subs: Subscription[] = [
      {
        id: 's1',
        user_id: 'u1',
        service: 'Netflix',
        amount: 649,
        billing_cycle: 'monthly',
        next_billing_date: '2026-10-01',
        category: 'Entertainment',
        payment_method: 'Credit Card',
        is_active: true
      },
      {
        id: 's2',
        user_id: 'u1',
        service: 'Amazon Prime',
        amount: 1499,
        billing_cycle: 'yearly',
        next_billing_date: '2026-11-15',
        category: 'Shopping',
        payment_method: 'UPI',
        is_active: true
      }
    ];
    const subTotals = calculateSubscriptionTotal(subs);
    // 649 + (1499/12 = 124.916) = 773.92
    const passed = subTotals.activeCount === 2 && subTotals.monthlyTotal > 770 && subTotals.monthlyTotal < 775;
    results.push({
      name: 'calculateSubscriptionTotal',
      passed,
      message: passed ? undefined : `Subscription totals mismatch: got ${subTotals.monthlyTotal}`
    });
  } catch (err: any) {
    results.push({ name: 'calculateSubscriptionTotal', passed: false, message: err.message });
  }

  // Test 8: What-If Simulation
  try {
    const goals: Goal[] = [
      {
        id: 'g1',
        user_id: 'u1',
        name: 'MacBook Pro',
        target_amount: 150000,
        current_amount: 80000,
        deadline: '2026-12-31'
      }
    ];
    const sim = simulateWhatIfScenario(24820, 50000, mockTransactions, [], goals, {
      purchaseAmount: 5000,
      purchaseName: 'Earbuds'
    });
    const passed = sim.purchaseAmount === 5000 && sim.verdict !== undefined;
    results.push({
      name: 'simulateWhatIfScenario',
      passed,
      message: passed ? undefined : `Simulation failed to generate verdict`
    });
  } catch (err: any) {
    results.push({ name: 'simulateWhatIfScenario', passed: false, message: err.message });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    results
  };
}
