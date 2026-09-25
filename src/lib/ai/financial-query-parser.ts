// FinPilot Financial Query Parser & Context Compiler
// Extracts exact financial facts deterministically to prevent hallucination

import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateBalance,
  calculateSavingsRate,
  calculateCategoryBreakdown,
  calculateMerchantBreakdown,
  calculateTopCategories,
  calculateTopMerchants,
  calculateLargestTransaction,
  calculateWeekendSpending,
  calculateWeekdaySpending,
  calculatePaymentMethodBreakdown,
  calculateSpendingTrend,
  calculateMonthlyComparison,
  calculateSubscriptionTotal,
  simulateWhatIfScenario,
  detectMoneyLeaks,
  calculateBudgetProgress
} from '../finance/engine';
import { Transaction, Budget, Goal, Subscription, StructuredChartPayload } from '../../types';

export interface ParsedFinancialQuery {
  intent:
    | 'top_category'
    | 'category_spend'
    | 'merchant_spend'
    | 'biggest_expense'
    | 'monthly_comparison'
    | 'weekend_spend'
    | 'payment_method'
    | 'affordability'
    | 'subscriptions'
    | 'spending_trend'
    | 'savings_summary'
    | 'money_leaks'
    | 'category_comparison'
    | 'general_overview';
  targetCategory?: string;
  targetMerchant?: string;
  targetAmount?: number;
  calculatedData: Record<string, any>;
  chartPayload?: StructuredChartPayload;
  suggestedAction?: { label: string; view: string; category?: string };
}

export function parseFinancialQuery(
  query: string,
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  subscriptions: Subscription[]
): ParsedFinancialQuery {
  const q = query.toLowerCase().trim();

  const totalExpense = calculateTotalExpenses(transactions);
  const totalIncome = calculateTotalIncome(transactions);
  const balance = calculateBalance(transactions);
  const topCats = calculateTopCategories(transactions, 5);
  const topMerchants = calculateTopMerchants(transactions, 5);
  const largest = calculateLargestTransaction(transactions);
  const weekend = calculateWeekendSpending(transactions);
  const weekday = calculateWeekdaySpending(transactions);
  const paymentMethods = calculatePaymentMethodBreakdown(transactions);
  const leaks = detectMoneyLeaks(transactions, subscriptions);
  const subSummary = calculateSubscriptionTotal(subscriptions);

  // 1. "Can I afford ₹X?" or "Can I buy X for ₹X"
  const affordMatch = q.match(/(?:afford|buy|purchase|spend)\s*(?:a|an)?\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
  if (affordMatch || q.includes('afford')) {
    const rawAmt = affordMatch ? Number(affordMatch[1].replace(/,/g, '')) : 5000;
    const sim = simulateWhatIfScenario(balance, totalIncome, transactions, subscriptions, goals, {
      purchaseAmount: rawAmt,
      purchaseName: 'Requested Purchase'
    });

    return {
      intent: 'affordability',
      targetAmount: rawAmt,
      calculatedData: {
        purchaseAmount: rawAmt,
        currentBalance: balance,
        newProjectedBalance30d: sim.newProjectedBalance30d,
        verdict: sim.verdict,
        verdictExplanation: sim.verdictExplanation,
        daysToRecover: sim.daysToRecover,
        goalDelayDays: sim.goalDelayDays
      },
      chartPayload: {
        type: 'bar',
        title: `Balance Impact for ₹${rawAmt.toLocaleString()}`,
        unit: '₹',
        data: [
          { label: 'Current Balance', value: balance, color: '#10B981' },
          { label: 'After Purchase', value: sim.newProjectedBalance30d, color: '#3B82F6' },
          { label: 'Purchase Cost', value: rawAmt, color: '#EF4444' }
        ]
      },
      suggestedAction: { label: 'Open What-If Simulator', view: 'whatif' }
    };
  }

  // 2. Specific Merchant Search (e.g. Swiggy, Amazon, Zomato, Uber, Blinkit)
  const knownMerchants = ['swiggy', 'amazon', 'zomato', 'uber', 'blinkit', 'zepto', 'flipkart', 'netflix', 'spotify', 'starbucks'];
  const matchedMerchant = knownMerchants.find((m) => q.includes(m));
  if (matchedMerchant || q.includes('merchant')) {
    if (matchedMerchant) {
      const merchantTrans = transactions.filter(
        (t) => t.type === 'expense' && (t.merchant || t.description).toLowerCase().includes(matchedMerchant)
      );
      const merchantTotal = merchantTrans.reduce((sum, t) => sum + t.amount, 0);
      const merchantName = matchedMerchant.charAt(0).toUpperCase() + matchedMerchant.slice(1);

      return {
        intent: 'merchant_spend',
        targetMerchant: merchantName,
        calculatedData: {
          merchant: merchantName,
          totalSpent: merchantTotal,
          transactionCount: merchantTrans.length,
          transactions: merchantTrans.slice(0, 5)
        },
        chartPayload: {
          type: 'bar',
          title: `Transactions at ${merchantName}`,
          unit: '₹',
          data: merchantTrans.slice(0, 6).map((t, i) => ({
            label: t.date.slice(5),
            value: t.amount,
            color: '#8B5CF6'
          }))
        },
        suggestedAction: { label: `View ${merchantName} Transactions`, view: 'transactions' }
      };
    } else {
      // Top merchants overall
      return {
        intent: 'merchant_spend',
        calculatedData: { topMerchants },
        chartPayload: {
          type: 'horizontal_bar',
          title: 'Top Merchants by Spending',
          unit: '₹',
          data: topMerchants.map((m) => ({
            label: m.merchant,
            value: m.amount,
            color: '#3B82F6'
          }))
        },
        suggestedAction: { label: 'View All Merchants', view: 'analytics' }
      };
    }
  }

  // 3. Category Comparison (e.g. "compare food vs shopping")
  if (q.includes('vs') || q.includes('compare food') || q.includes('compare shopping')) {
    const cats = calculateCategoryBreakdown(transactions);
    const food = cats.find((c) => c.category === 'Food')?.amount || 0;
    const shopping = cats.find((c) => c.category === 'Shopping')?.amount || 0;

    return {
      intent: 'category_comparison',
      calculatedData: {
        foodAmount: food,
        shoppingAmount: shopping,
        difference: Math.abs(food - shopping),
        leader: food >= shopping ? 'Food' : 'Shopping'
      },
      chartPayload: {
        type: 'bar',
        title: 'Food vs Shopping Comparison',
        unit: '₹',
        data: [
          { label: 'Food', value: food, color: '#10B981' },
          { label: 'Shopping', value: shopping, color: '#8B5CF6' }
        ]
      },
      suggestedAction: { label: 'View Category Analytics', view: 'analytics' }
    };
  }

  // 4. Specific Category (Food, Shopping, Transport, Bills, Entertainment, Travel, Health)
  const knownCategories = ['food', 'shopping', 'transport', 'bills', 'entertainment', 'travel', 'health', 'education', 'subscriptions'];
  const matchedCat = knownCategories.find((c) => q.includes(c));
  if (matchedCat && !q.includes('compare this month')) {
    const properCat = matchedCat.charAt(0).toUpperCase() + matchedCat.slice(1);
    const catBreakdown = calculateCategoryBreakdown(transactions);
    const found = catBreakdown.find((c) => c.category.toLowerCase() === matchedCat.toLowerCase());
    const catTrans = transactions.filter(
      (t) => t.type === 'expense' && t.category.toLowerCase() === matchedCat.toLowerCase()
    );

    // Top merchants in this category
    const catMerchants = calculateMerchantBreakdown(catTrans);

    return {
      intent: 'category_spend',
      targetCategory: properCat,
      calculatedData: {
        category: properCat,
        amount: found?.amount || 0,
        percentage: found?.percentage || 0,
        transactionCount: catTrans.length,
        topMerchants: catMerchants.slice(0, 3)
      },
      chartPayload: {
        type: 'donut',
        title: `${properCat} Spending Share`,
        unit: '₹',
        data: [
          { label: properCat, value: found?.amount || 0, color: found?.color || '#10B981' },
          { label: 'Other Spending', value: Math.max(0, totalExpense - (found?.amount || 0)), color: '#334155' }
        ]
      },
      suggestedAction: { label: `View ${properCat} Analytics`, view: 'analytics', category: properCat }
    };
  }

  // 5. Monthly Comparison (e.g. "compare this month with last month" or "how much did I spend last month")
  if (q.includes('last month') || q.includes('compare this month') || q.includes('increased') || q.includes('decreased')) {
    const now = new Date();
    const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const comp = calculateMonthlyComparison(transactions, curMonthKey, prevMonthKey);

    return {
      intent: 'monthly_comparison',
      calculatedData: comp,
      chartPayload: {
        type: 'bar',
        title: 'Monthly Spending Comparison',
        unit: '₹',
        data: [
          { label: 'Previous Month', value: comp.previousTotal, color: '#64748B' },
          { label: 'Current Month', value: comp.currentTotal, color: comp.diffAmount > 0 ? '#EF4444' : '#10B981' }
        ]
      },
      suggestedAction: { label: 'View Financial Mirror Report', view: 'mirror' }
    };
  }

  // 6. Weekend vs Weekday ("how much did I spend on weekends?" / "do I spend more on weekends?")
  if (q.includes('weekend') || q.includes('weekday') || q.includes('saturday') || q.includes('sunday')) {
    return {
      intent: 'weekend_spend',
      calculatedData: {
        weekendAmount: weekend.amount,
        weekendPercentage: weekend.percentage,
        weekdayAmount: weekday.amount,
        weekdayPercentage: weekday.percentage,
        spendsMoreOnWeekends: weekend.percentage > 40
      },
      chartPayload: {
        type: 'donut',
        title: 'Weekend vs Weekday Spending',
        unit: '₹',
        data: [
          { label: 'Weekdays', value: weekday.amount, color: '#3B82F6' },
          { label: 'Weekends', value: weekend.amount, color: '#EC4899' }
        ]
      },
      suggestedAction: { label: 'View Expense DNA', view: 'dna' }
    };
  }

  // 7. Payment method ("upi", "cash", "credit card")
  if (q.includes('upi') || q.includes('cash') || q.includes('credit card') || q.includes('payment method')) {
    return {
      intent: 'payment_method',
      calculatedData: { paymentMethods },
      chartPayload: {
        type: 'donut',
        title: 'Spending by Payment Method',
        unit: '₹',
        data: paymentMethods.map((p) => ({
          label: p.method,
          value: p.amount,
          color: p.method === 'UPI' ? '#10B981' : p.method === 'Credit Card' ? '#8B5CF6' : '#F59E0B'
        }))
      },
      suggestedAction: { label: 'View Payment Analytics', view: 'analytics' }
    };
  }

  // 8. Spending trend or timeline
  if (q.includes('trend') || q.includes('timeline') || q.includes('over time') || q.includes('6 months') || q.includes('by day')) {
    const trend = calculateSpendingTrend(transactions, '30D');
    return {
      intent: 'spending_trend',
      calculatedData: { trend },
      chartPayload: {
        type: 'line',
        title: '30-Day Spending Trend',
        unit: '₹',
        data: trend.slice(-14).map((t) => ({
          label: t.date,
          value: t.amount,
          secondaryValue: t.income,
          color: '#10B981'
        }))
      },
      suggestedAction: { label: 'View Trend Analytics', view: 'analytics' }
    };
  }

  // 9. Subscriptions
  if (q.includes('subscription') || q.includes('netflix') || q.includes('spotify') || q.includes('recurring')) {
    return {
      intent: 'subscriptions',
      calculatedData: subSummary,
      chartPayload: {
        type: 'horizontal_bar',
        title: 'Active Subscriptions',
        unit: '₹',
        data: subscriptions.map((s) => ({
          label: s.service,
          value: s.amount,
          color: '#6366F1'
        }))
      },
      suggestedAction: { label: 'Manage Subscriptions', view: 'subscriptions' }
    };
  }

  // 10. Biggest Expense or Largest Transaction
  if (q.includes('biggest expense') || q.includes('largest transaction') || q.includes('most expensive')) {
    return {
      intent: 'biggest_expense',
      calculatedData: {
        largestTransaction: largest,
        top5Expenses: [...transactions.filter((t) => t.type === 'expense')]
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
      },
      chartPayload: {
        type: 'horizontal_bar',
        title: 'Top 5 Largest Transactions',
        unit: '₹',
        data: [...transactions.filter((t) => t.type === 'expense')]
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
          .map((t) => ({
            label: t.description || t.merchant || 'Expense',
            value: t.amount,
            color: '#F43F5E'
          }))
      },
      suggestedAction: { label: 'View In Transactions', view: 'transactions' }
    };
  }

  // 11. Money leaks / unnecessary spending
  if (q.includes('unnecessary') || q.includes('leak') || q.includes('waste') || q.includes('reduce')) {
    return {
      intent: 'money_leaks',
      calculatedData: { leaks },
      chartPayload: {
        type: 'bar',
        title: 'Identified Money Leaks (Potential Savings)',
        unit: '₹/yr',
        data: leaks.map((l) => ({
          label: l.title.slice(0, 16),
          value: l.potentialSavingsYearly,
          color: '#F59E0B'
        }))
      },
      suggestedAction: { label: 'Open Money Leak Detector', view: 'leaks' }
    };
  }

  // Default: Top categories & spending breakdown
  return {
    intent: 'top_category',
    calculatedData: {
      totalExpense,
      totalIncome,
      balance,
      topCategories: topCats
    },
    chartPayload: {
      type: 'donut',
      title: 'Top Spending Categories',
      unit: '₹',
      data: topCats.map((c) => ({
        label: c.category,
        value: c.amount,
        color: c.color
      }))
    },
    suggestedAction: { label: 'View Full Analytics', view: 'analytics' }
  };
}
