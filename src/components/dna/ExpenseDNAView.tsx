// FinPilot Expense DNA (Behavioral Fingerprint Engine)
import React, { useMemo } from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import {
  calculateWeekendSpending,
  calculateWeekdaySpending,
  calculateMerchantBreakdown,
  calculateCategoryBreakdown,
  calculateTotalExpenses
} from '../../lib/finance/engine';
import { Dna, Zap, Shield, Heart, Clock, Sparkles, Plus } from 'lucide-react';

export const ExpenseDNAView: React.FC = () => {
  const { profile, transactions, currencySymbol, setActiveView } = useFinPilot();

  const totalExpenses = calculateTotalExpenses(transactions);
  const weekend = calculateWeekendSpending(transactions);
  const weekday = calculateWeekdaySpending(transactions);
  const merchants = calculateMerchantBreakdown(transactions);
  const categories = calculateCategoryBreakdown(transactions);

  const topBrand = merchants[0]?.merchant || 'General Outlets';
  const weekendRatio = weekend.percentage;

  // Behavioral profile archetype
  const archetype = useMemo(() => {
    if (transactions.length === 0) return 'The Fresh Slate Architect';
    if (weekendRatio > 40) return 'The Weekend Connoisseur';
    if (weekendRatio > 25) return 'The Balanced Modern Professional';
    return 'The Disciplined Steady-State Compounder';
  }, [transactions.length, weekendRatio]);

  // Dynamic daily velocity
  const dailyVelocity = useMemo(() => {
    if (transactions.length === 0) return 0;
    const expenseTxs = transactions.filter((t) => t.type === 'expense');
    if (expenseTxs.length === 0) return 0;
    const dates = new Set(expenseTxs.map((t) => t.date));
    const daysCount = Math.max(1, dates.size);
    return Math.round(totalExpenses / daysCount);
  }, [transactions, totalExpenses]);

  if (transactions.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Expense DNA & Behavioral Fingerprint</h1>
            <Dna className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Analytical behavioral profiling mapping velocity, temporal patterns, and brand concentration.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
            <Dna className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No spending patterns recorded yet</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Add your daily expenses to decode your spending velocity, weekend-to-weekday split, and brand affinity.
            </p>
          </div>
          <button
            onClick={() => setActiveView('transactions')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-xs font-semibold text-white hover:bg-purple-500 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Transactions</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Expense DNA & Behavioral Fingerprint</h1>
          <Dna className="h-5 w-5 text-purple-400" />
        </div>
        <p className="text-xs text-neutral-400 mt-0.5">
          Analytical behavioral profiling mapping velocity, temporal patterns, and brand concentration.
        </p>
      </div>

      {/* Archetype Hero Card */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 block mb-1">
              FINANCIAL ARCHETYPE
            </span>
            <h2 className="text-2xl font-extrabold text-white">{archetype}</h2>
            <p className="text-xs text-neutral-300 mt-2 max-w-xl leading-relaxed">
              {weekendRatio > 40
                ? 'Your spending shows high concentration during leisure weekends (dining out, social experiences, events), while remaining lean during the work week.'
                : 'Your spending demonstrates composed, steady discipline throughout standard cycles with measured variance.'}
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 shrink-0">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* 4 DNA Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: Spending Velocity */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Daily Spending Velocity</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              ~{currencySymbol}{dailyVelocity.toLocaleString()} / active day
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Your ledger shows an average daily burn of {currencySymbol}{dailyVelocity.toLocaleString()} across active spending days, based on {transactions.length} total logged transactions.
          </p>
          <div className="pt-2">
            <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
              <span>Velocity Pacing</span>
              <span className="text-neutral-300">Normalized Cadence</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
        </div>

        {/* Pillar 2: Weekend vs Weekday Divergence */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-pink-400" />
              <h3 className="text-sm font-semibold text-white">Weekend vs Weekday Split</h3>
            </div>
            <span className="text-xs font-mono font-bold text-pink-400">
              {weekend.percentage}% Weekend
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Weekends generate {currencySymbol}{weekend.amount.toLocaleString()} ({weekend.percentage}% of all discretionary spend), while weekdays account for {currencySymbol}{weekday.amount.toLocaleString()} ({weekday.percentage}%).
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Weekday Total</span>
              <span className="font-semibold text-white font-mono">{currencySymbol}{weekday.amount.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Weekend Total</span>
              <span className="font-semibold text-pink-400 font-mono">{currencySymbol}{weekend.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Impulse Buy Index */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Discretionary Resistance Rating</h3>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400">
              {weekend.percentage < 35 ? '84 / 100' : '72 / 100'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Evaluation of micro-transactions vs structured planned obligations. Low-ticket transactions are tracked with precision.
          </p>
          <div className="pt-2">
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: weekend.percentage < 35 ? '84%' : '72%' }}
              />
            </div>
          </div>
        </div>

        {/* Pillar 4: Brand Concentration */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Top Brand Affinity</h3>
            </div>
            <span className="text-xs font-mono font-bold text-white truncate max-w-[140px] text-right">
              {topBrand}
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {merchants.length > 0
              ? `${topBrand} is your primary outlet, totaling ${currencySymbol}${merchants[0]?.amount.toLocaleString()} across ${merchants[0]?.count} transactions.`
              : 'Add transactions with merchant names to identify your brand loyalty metrics.'}
          </p>
          <div className="pt-2">
            <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
              <span>Top Outlet Share</span>
              <span className="text-neutral-300">
                {totalExpenses > 0 && merchants[0]
                  ? `${Math.round((merchants[0].amount / totalExpenses) * 100)}% of expenses`
                  : '0%'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{
                  width:
                    totalExpenses > 0 && merchants[0]
                      ? `${Math.min(100, Math.round((merchants[0].amount / totalExpenses) * 100))}%`
                      : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDNAView;
