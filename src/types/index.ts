// FinPilot Core Types & Domain Models

export type TransactionType = 'expense' | 'income' | 'transfer';

export type PaymentMethod = 'UPI' | 'Cash' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Other';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  merchant?: string;
  description: string;
  date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  notes?: string;
  receipt_url?: string;
  is_recurring?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  description?: string;
  category?: string;
  color?: string;
  created_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  service: string;
  amount: number;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_billing_date: string;
  category: string;
  payment_method: PaymentMethod;
  is_active: boolean;
  notes?: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface Receipt {
  id: string;
  user_id: string;
  file_name: string;
  merchant: string;
  amount: number;
  date: string;
  tax: number;
  items: ReceiptItem[];
  category: string;
  status: 'processed' | 'pending';
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: 'Student' | 'Professional' | 'Freelancer' | 'Other';
  financial_goal: string;
  income_frequency: 'Monthly' | 'Bi-weekly' | 'Weekly' | 'Variable';
  currency: string;
  currency_symbol: string;
  monthly_income_estimate: number;
}

export interface FinancialInsight {
  id: string;
  type: 'money_leak' | 'spike' | 'saving_tip' | 'budget_alert' | 'positive';
  title: string;
  description: string;
  impact_level: 'low' | 'medium' | 'high';
  category?: string;
  action_label?: string;
  action_url?: string;
  metric?: string;
}

export interface MoneyLeak {
  id: string;
  title: string;
  description: string;
  amount: number;
  frequency: string;
  potentialSavingsYearly: number;
  severity: 'low' | 'medium' | 'high';
  category: string;
  recommendedAction?: string;
}

export interface ExpenseDNA {
  weekendVsWeekday: {
    weekendAmount: number;
    weekdayAmount: number;
    weekendPercentage: number;
    weekdayPercentage: number;
  };
  averageTransactionAmount: number;
  transactionVelocityPerWeek: number;
  topSpendingCategory: string;
  topSpendingCategoryPercent: number;
  impulseSpendingScore: number; // 0 - 100
  recurringVsDiscretionary: {
    recurringTotal: number;
    discretionaryTotal: number;
    recurringRatio: number;
  };
  peakSpendingDay: string;
  peakSpendingTimeSlot: string;
}

export interface FutureCashFlowPoint {
  date: string;
  projectedBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  eventDescription?: string;
}

export interface WhatIfSimulation {
  purchaseAmount: number;
  purchaseName: string;
  monthlySavingsAdjustment: number;
  cancelledSubscriptionCost: number;
  currentProjectedBalance30d: number;
  newProjectedBalance30d: number;
  daysToRecover: number;
  goalDelayDays: number;
  verdict: 'Comfortable' | 'Caution' | 'High Risk';
  verdictExplanation: string;
}

export interface MonthlyFinancialReport {
  monthName: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  topCategories: { category: string; amount: number; percentage: number; diffPercent?: number }[];
  biggestTransactions: Transaction[];
  moneyLeaksIdentified: MoneyLeak[];
  budgetPerformance: {
    category: string;
    budgeted: number;
    spent: number;
    percentUsed: number;
    isOverBudget: boolean;
  }[];
  aiExecutiveSummary: string;
}

export interface StructuredChartPayload {
  type: 'donut' | 'bar' | 'horizontal_bar' | 'line' | 'heatmap';
  title: string;
  data: Array<{ label: string; value: number; secondaryValue?: number; color?: string }>;
  unit?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  chart?: StructuredChartPayload;
  actionLinks?: Array<{ label: string; view: string; category?: string }>;
  metricCards?: Array<{ label: string; value: string; subtext?: string }>;
}
