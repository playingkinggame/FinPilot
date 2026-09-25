// FinPilot Private Financial Workspace Dashboard
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useFinPilot } from '../../lib/supabase/context';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateBalance,
  calculateSavingsRate,
  calculateSpendingTrend,
  calculateCategoryBreakdown,
  calculateBudgetProgress,
  calculateGoalProgress,
  calculateSubscriptionTotal
} from '../../lib/finance/engine';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Plus,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Flame,
  Camera,
  Bot,
  Receipt,
  Target,
  PiggyBank,
  Database,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface DashboardViewProps {
  onOpenQuickAdd: () => void;
  onOpenCopilot: () => void;
  onOpenScanReceipt?: () => void;
  onOpenAddIncome?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenQuickAdd,
  onOpenCopilot,
  onOpenScanReceipt,
  onOpenAddIncome
}) => {
  const {
    profile,
    user,
    transactions,
    budgets,
    goals,
    subscriptions,
    insights,
    currencySymbol,
    setActiveView
  } = useFinPilot();

  const [trendRange, setTrendRange] = useState<'7D' | '30D' | '3M' | '6M' | '1Y'>('30D');

  // Deterministic math executed directly on real user transactions
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const balance = calculateBalance(transactions);
  const savingsRate = calculateSavingsRate(transactions);

  const spendingTrend = calculateSpendingTrend(transactions, trendRange);
  const budgetProgress = calculateBudgetProgress(budgets, transactions).slice(0, 3);
  const goalProgress = calculateGoalProgress(goals).slice(0, 3);
  const subSummary = calculateSubscriptionTotal(subscriptions);

  // Authenticated user's verified name
  const rawName = profile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const firstName = rawName.trim().split(' ')[0] || 'User';

  const hasTransactions = transactions.length > 0;

  // Real data-driven primary insight
  const primaryInsight = insights[0] || (hasTransactions ? {
    id: 'insight_velocity',
    type: 'positive' as const,
    title: 'Balanced Financial Velocity',
    description: `Your spending rate is running at ${savingsRate}% net savings this cycle.`,
    impact_level: 'medium' as const,
    action_label: 'View Analytics',
    action_url: 'analytics'
  } : null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 antialiased">
      {/* 1. PRIVATE WORKSPACE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-semibold">
              PRIVATE FINANCIAL WORKSPACE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Welcome back, {firstName}</span>
            <span>👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {hasTransactions
              ? 'Your finances are organized and ready.'
              : 'Your financial workspace is ready. Add your first transaction to start seeing insights.'}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ask Copilot</span>
          </button>
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>+ Add Transaction</span>
          </button>
        </div>
      </div>

      {/* NEW ACCOUNT EMPTY EXPERIENCE BANNER (If 0 transactions) */}
      {!hasTransactions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 text-center space-y-4 shadow-xl"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Receipt className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">No transactions yet</h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Start by recording your first expense or income credit. All balances, cash flow forecasts, and AI insights will automatically calculate in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>+ Add Transaction</span>
            </button>
            <button
              onClick={onOpenAddIncome}
              className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>Record Income</span>
            </button>
            <button
              onClick={onOpenScanReceipt}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              <Receipt className="h-3.5 w-3.5 text-emerald-400" />
              <span>Scan Receipt OCR</span>
            </button>
            <button
              onClick={onOpenCopilot}
              className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
            >
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ask Copilot</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. STATISTICS ROW (4 Cards calculated dynamically) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-400 mb-1">
              <span className="uppercase tracking-wider text-[10px]">NET BALANCE</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums mt-1">
              {currencySymbol}{balance.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">
              {hasTransactions ? (balance >= 0 ? 'Surplus liquidity' : 'Deficit') : 'Clean workspace'}
            </span>
            <button
              onClick={() => setActiveView('cashflow')}
              className="text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>Forecast</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </motion.div>

        {/* Total Inflow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-400 mb-1">
              <span className="uppercase tracking-wider text-[10px]">TOTAL INFLOW</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums mt-1">
              {currencySymbol}{totalIncome.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400">
            {hasTransactions ? 'Verified income credits' : 'No income logged'}
          </div>
        </motion.div>

        {/* Total Outflow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-400 mb-1">
              <span className="uppercase tracking-wider text-[10px]">TOTAL OUTFLOW</span>
              <ArrowDownRight className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums mt-1">
              {currencySymbol}{totalExpenses.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400">
            {hasTransactions ? 'Total debits & expenses' : 'No expenses logged'}
          </div>
        </motion.div>

        {/* Savings Rate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-400 mb-1">
              <span className="uppercase tracking-wider text-[10px]">SAVINGS RATE</span>
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums mt-1">
              {savingsRate}%
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-800/80 text-[11px] text-emerald-400">
            {totalIncome > 0 ? `${savingsRate}% retained surplus` : 'Awaiting income'}
          </div>
        </motion.div>
      </div>

      {/* 3. AI INSIGHT SECTION */}
      {primaryInsight && hasTransactions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-sm"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono tracking-wider font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                  AI INSIGHT
                </span>
                <p className="text-sm font-semibold text-white">{primaryInsight.title}</p>
              </div>
              <p className="text-xs text-neutral-300">{primaryInsight.description}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView(primaryInsight.action_url || 'analytics')}
            className="self-start sm:self-center shrink-0 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>{primaryInsight.action_label || 'View Analytics'}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {/* 4. QUICK ACTIONS SECTION */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3 px-1">
          Quick Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 p-3 text-left transition-colors"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white truncate">+ Add Expense</span>
          </button>

          <button
            onClick={() => {
              if (onOpenAddIncome) onOpenAddIncome();
              else onOpenQuickAdd();
            }}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 p-3 text-left transition-colors"
          >
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white truncate">+ Add Income</span>
          </button>

          <button
            onClick={() => setActiveView('budgets')}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 p-3 text-left transition-colors"
          >
            <PiggyBank className="h-4 w-4 text-teal-400" />
            <span className="text-xs font-semibold text-white truncate">Create Budget</span>
          </button>

          <button
            onClick={() => setActiveView('goals')}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 p-3 text-left transition-colors"
          >
            <Target className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white truncate">Create Goal</span>
          </button>

          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 p-3 text-left transition-colors"
          >
            <Bot className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white truncate">Ask AI Copilot</span>
          </button>

          <button
            onClick={() => {
              if (onOpenScanReceipt) onOpenScanReceipt();
              else setActiveView('transactions');
            }}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 p-3 text-left transition-colors"
          >
            <Camera className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-white truncate">Scan Receipt</span>
          </button>
        </div>
      </div>

      {/* 5. SPENDING ANALYTICS CARD (Area Chart or Empty State) */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3 mb-6">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Spending Overview</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Your spending activity and burn velocity over time.</p>
          </div>

          {/* Time Range Controls */}
          <div className="flex items-center gap-1 rounded-lg bg-neutral-950 p-1 border border-neutral-800 self-start sm:self-center">
            {(['7D', '30D', '3M', '6M', '1Y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTrendRange(range)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  trendRange === range
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {hasTransactions ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#71717A"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${currencySymbol}${v}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-2.5 shadow-xl text-xs">
                          <p className="text-neutral-400">{payload[0].payload.date}</p>
                          <p className="font-bold text-emerald-400 mt-0.5">
                            {currencySymbol}{payload[0].value?.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/40">
            <p className="text-sm font-semibold text-neutral-300">No spending data yet</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Your spending curve and velocity chart will render automatically here once transactions are recorded.
            </p>
            <button
              onClick={onOpenQuickAdd}
              className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
            >
              + Record first expense
            </button>
          </div>
        )}
      </div>

      {/* 6. TWO COLUMNS: RECENT TRANSACTIONS + UPCOMING SUBSCRIPTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
              <p className="text-xs text-neutral-400">Verified entries from your personal ledger</p>
            </div>
            <button
              onClick={() => setActiveView('transactions')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {hasTransactions ? (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3 flex items-center justify-between hover:bg-neutral-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-xs font-bold text-neutral-300">
                      {t.category.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{t.merchant || t.description}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {t.category} · {t.date} · {t.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        t.type === 'income' ? 'text-emerald-400' : 'text-neutral-200'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '−'}{currencySymbol}{t.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-neutral-500">
              No recent transactions recorded yet.
            </div>
          )}
        </div>

        {/* Upcoming Subscriptions & Goals (1 Col) */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Active Subscriptions</h3>
                <p className="text-xs text-neutral-400">Monthly recurring drain</p>
              </div>
              <button
                onClick={() => setActiveView('subscriptions')}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Manage →
              </button>
            </div>

            {subscriptions.length > 0 ? (
              <div className="space-y-2.5">
                {subscriptions.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-850 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-white">{s.service}</p>
                      <p className="text-[10px] text-neutral-500 capitalize">
                        Renews {s.next_billing_date} · {s.billing_cycle}
                      </p>
                    </div>
                    <span className="font-bold text-neutral-200 tabular-nums">
                      {currencySymbol}{s.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="pt-2 text-right">
                  <span className="text-[11px] text-neutral-400">
                    Total: <strong className="text-white">{currencySymbol}{subSummary.monthlyTotal.toLocaleString()}/mo</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-neutral-500">
                No active subscriptions tracked.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-neutral-400 font-medium">Top Goal Progress</span>
              <button onClick={() => setActiveView('goals')} className="text-emerald-400 hover:underline">
                View Goals
              </button>
            </div>
            {goalProgress.length > 0 ? (
              <div className="space-y-2">
                {goalProgress.slice(0, 2).map((g) => (
                  <div key={g.goal.id} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-300 font-medium">{g.goal.name}</span>
                      <span className="text-neutral-400 tabular-nums">{g.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, g.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500">No active savings goals set.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
