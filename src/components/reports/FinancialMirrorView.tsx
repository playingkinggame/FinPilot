// FinPilot Financial Mirror (Monthly Honest Reflection Report)
import React from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateBalance,
  calculateSavingsRate,
  calculateCategoryBreakdown,
  calculateLargestTransaction,
  detectMoneyLeaks
} from '../../lib/finance/engine';
import { FileText, Award, AlertTriangle, TrendingUp, Sparkles, Printer, CheckCircle2, Receipt, Plus } from 'lucide-react';

export const FinancialMirrorView: React.FC = () => {
  const { profile, transactions, subscriptions, currencySymbol, setActiveView } = useFinPilot();

  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const balance = calculateBalance(transactions);
  const savingsRate = calculateSavingsRate(transactions);
  const categoryBreakdown = calculateCategoryBreakdown(transactions);
  const largestTx = calculateLargestTransaction(transactions);
  const leaks = detectMoneyLeaks(transactions, subscriptions);

  const topCategory = categoryBreakdown[0];
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long' });

  if (transactions.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="pb-4 border-b border-neutral-800">
          <h1 className="text-2xl font-bold tracking-tight text-white">The Financial Mirror</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            An unfiltered monthly statement assessing habits, leaks, and net trajectory.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No transactions recorded yet</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Add your recent income and expenses to generate your comprehensive {currentMonthName} Financial Mirror statement.
            </p>
          </div>
          <button
            onClick={() => setActiveView('transactions')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Transactions</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">The Financial Mirror</h1>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
              {currentMonthName} Audit
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            An unfiltered monthly statement assessing habits, leaks, and net trajectory.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors self-start sm:self-auto"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Executive Summary Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Sparkles className="h-4 w-4" />
          <span>EXECUTIVE AI SUMMARY · {currentMonthName.toUpperCase()} CYCLE</span>
        </div>

        <p className="text-sm text-neutral-200 leading-relaxed">
          {profile.full_name || 'Member'}, your net financial positioning this cycle shows total inflow of{' '}
          <span className="font-mono text-white font-semibold">{currencySymbol}{totalIncome.toLocaleString()}</span> against an outflow of{' '}
          <span className="font-mono text-white font-semibold">{currencySymbol}{totalExpenses.toLocaleString()}</span>, yielding a net balance of{' '}
          <span className={`font-mono font-semibold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {balance >= 0 ? '+' : ''}{currencySymbol}{balance.toLocaleString()}
          </span>{' '}
          and a savings rate of <span className="font-semibold text-white">{savingsRate}%</span>.
        </p>

        {topCategory && (
          <p className="text-xs text-neutral-400 leading-relaxed">
            Discretionary outflow was primarily led by <span className="text-white font-medium">{topCategory.category}</span> ({currencySymbol}{topCategory.amount.toLocaleString()} or {topCategory.percentage}% of all expenses). Top spending items include <span className="text-emerald-300 font-medium">{topCategory.topItems}</span>.
          </p>
        )}
      </div>

      {/* Core Scorecard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">Total Inflow</span>
          <span className="text-lg font-bold text-white tabular-nums font-mono">{currencySymbol}{totalIncome.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">Total Outflow</span>
          <span className="text-lg font-bold text-white tabular-nums font-mono">{currencySymbol}{totalExpenses.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">Net Surplus</span>
          <span className={`text-lg font-bold tabular-nums font-mono ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {balance >= 0 ? '+' : ''}{currencySymbol}{balance.toLocaleString()}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">Savings Rate</span>
          <span className="text-lg font-bold text-blue-400 tabular-nums font-mono">{savingsRate}%</span>
        </div>
      </div>

      {/* Best vs Needs Attention Move */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Positive move */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <Award className="h-5 w-5" />
            <h3 className="text-sm font-bold">Key Strength This Cycle</h3>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed mb-2 font-medium">
            {savingsRate >= 20
              ? `Strong Capital Retention (${savingsRate}% Savings Rate)`
              : balance > 0
              ? 'Positive Net Operating Surplus'
              : 'Active Expense Tracking Discipline'}
          </p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {savingsRate >= 20
              ? `You retained ${savingsRate}% of total inflows, significantly beating the recommended 15% baseline. Continue routing excess cash flow to your investment goals.`
              : balance > 0
              ? `You successfully kept expenses (${currencySymbol}${totalExpenses.toLocaleString()}) below total revenue, protecting your primary balance.`
              : `Consistently logging your transactions ensures 100% financial clarity without blind spots.`}
          </p>
        </div>

        {/* Focus Area */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5">
          <div className="flex items-center gap-2 mb-2 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-sm font-bold">Optimization Focus Area</h3>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed mb-2 font-medium">
            {topCategory
              ? `Concentration in ${topCategory.category} (${topCategory.percentage}%)`
              : 'Managing Discretionary Outlays'}
          </p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {topCategory
              ? `${currencySymbol}${topCategory.amount.toLocaleString()} was directed towards ${topCategory.category}. Targeted moderation here can free up substantial monthly surplus.`
              : 'Establish monthly category limits to prevent unexpected cash leaks.'}
          </p>
        </div>
      </div>

      {/* Identified Money Leaks */}
      {leaks.length > 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Identified Recurring Leaks for Next Cycle</h3>
          <div className="divide-y divide-neutral-800/80">
            {leaks.map((leak) => (
              <div key={leak.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-white">{leak.title}</p>
                  <p className="text-[11px] text-neutral-400">{leak.recommendedAction}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-400 font-semibold">
                    +{currencySymbol}{leak.potentialSavingsYearly.toLocaleString()}/yr
                  </span>
                  <span className="text-[10px] text-neutral-500 block">recovery</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialMirrorView;
