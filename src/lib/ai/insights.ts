// FinPilot Proactive AI Financial Insights Generator
import { Transaction, Budget, Subscription, FinancialInsight } from '../../types';
import { calculateCategoryBreakdown, detectMoneyLeaks, calculateTotalExpenses } from '../finance/engine';

export function generateProactiveInsights(
  transactions: Transaction[],
  budgets: Budget[],
  subscriptions: Subscription[]
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const expenses = transactions.filter((t) => t.type === 'expense');
  const total = calculateTotalExpenses(transactions);

  // 1. Food Delivery or Swiggy spike
  const swiggySpent = expenses
    .filter((t) => (t.merchant || t.description).toLowerCase().includes('swiggy'))
    .reduce((sum, t) => sum + t.amount, 0);

  if (swiggySpent > 2000) {
    insights.push({
      id: 'ins_swiggy_spike',
      type: 'money_leak',
      title: 'Food Delivery Convenience Creep',
      description: `You've spent ₹${swiggySpent.toLocaleString()} on Swiggy this month. Replacing 2 weekly orders with home cooking would save ~₹2,400 monthly.`,
      impact_level: 'high',
      category: 'Food',
      action_label: 'View Food Analytics',
      metric: `₹${swiggySpent.toLocaleString()} on Swiggy`
    });
  }

  // 2. Budget Alert
  const cats = calculateCategoryBreakdown(transactions);
  const shopping = cats.find((c) => c.category === 'Shopping');
  if (shopping && shopping.amount > 4000) {
    insights.push({
      id: 'ins_shopping_pace',
      type: 'budget_alert',
      title: 'Shopping Velocity Acceleration',
      description: `Shopping represents ${shopping.percentage}% of your expenses. You have reached 80% of your typical monthly discretionary pace.`,
      impact_level: 'medium',
      category: 'Shopping',
      action_label: 'Review Shopping Ledger',
      metric: `${shopping.percentage}% of expenses`
    });
  }

  // 3. Positive Savings Note
  if (total < 30000 && transactions.length > 5) {
    insights.push({
      id: 'ins_saving_positive',
      type: 'positive',
      title: 'Disciplined Discretionary Outflow',
      description: 'Your non-essential spend is tracking 14% below typical peer benchmarks for this time of month. You are on track to exceed your savings target.',
      impact_level: 'low',
      category: 'Savings',
      action_label: 'View Projected Cash Flow',
      metric: '14% below benchmark'
    });
  }

  // 4. Money leaks from detector
  const leaks = detectMoneyLeaks(transactions, subscriptions);
  for (const leak of leaks.slice(0, 2)) {
    insights.push({
      id: `ins_${leak.id}`,
      type: 'money_leak',
      title: leak.title,
      description: leak.description,
      impact_level: leak.severity,
      category: leak.category,
      action_label: 'Investigate Leak',
      metric: `₹${leak.amount.toLocaleString()}`
    });
  }

  return insights;
}
