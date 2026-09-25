// FinPilot Smart Budget Engine View
import React, { useState } from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { calculateBudgetProgress } from '../../lib/finance/engine';
import { Plus, Edit2, AlertCircle, CheckCircle2, X, Wallet, ShieldAlert } from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const { budgets, transactions, addBudget, updateBudget, currencySymbol } = useFinPilot();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<{ id: string; category: string; amount: number } | null>(null);

  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('8000');

  const progressList = calculateBudgetProgress(budgets, transactions);

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = progressList.reduce((sum, p) => sum + p.spentAmount, 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  const handleOpenEdit = (b: { id: string; category: string; amount: number }) => {
    setSelectedBudget(b);
    setCategory(b.category);
    setAmount(String(b.amount));
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedBudget(null);
    setCategory('Food');
    setAmount('5000');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!parsedAmt || isNaN(parsedAmt)) return;

    if (selectedBudget) {
      updateBudget(selectedBudget.id, parsedAmt);
    } else {
      addBudget({
        category,
        amount: parsedAmt,
        period: 'monthly'
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Smart Budget Engine</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Pacing allowances, category caps, and velocity guardrails.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>New Budget Cap</span>
        </button>
      </div>

      {/* Aggregate Budget Bar */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs text-neutral-400 font-medium">Monthly Allocation Utilized</span>
            <div className="text-2xl font-bold text-white tabular-nums">
              {currencySymbol}{totalSpent.toLocaleString()} / {currencySymbol}{totalBudgeted.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`text-lg font-bold tabular-nums ${
                overallPercentage > 90 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {overallPercentage}%
            </span>
            <p className="text-[11px] text-neutral-500">
              {currencySymbol}{Math.max(0, totalBudgeted - totalSpent).toLocaleString()} available
            </p>
          </div>
        </div>

        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              overallPercentage > 100
                ? 'bg-rose-500'
                : overallPercentage > 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Category Budget Cards */}
      {progressList.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No budget limits defined yet</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Set up category spending allowances (e.g. Food, Shopping, Entertainment) to track pacing velocity and prevent overspending.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm mt-1"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Create First Budget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {progressList.map((item) => {
          const matchingBudget = budgets.find((b) => b.category.toLowerCase() === item.category.toLowerCase());
          const isOver = item.isOverBudget;
          const isNear = item.percentageUsed >= 80 && !isOver;

          return (
            <div
              key={matchingBudget?.id || item.category}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-300">
                      {item.category.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.category}</h3>
                      <p className="text-[11px] text-neutral-400 capitalize">{matchingBudget?.period || 'Monthly'} cap</p>
                    </div>
                  </div>

                  {matchingBudget && (
                    <button
                      onClick={() => handleOpenEdit({ id: matchingBudget.id, category: matchingBudget.category, amount: matchingBudget.amount })}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Spent:</span>
                    <span className="text-white font-medium tabular-nums">
                      {currencySymbol}{item.spentAmount.toLocaleString()} / {currencySymbol}{item.budgetAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentageUsed)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                  <span className="text-neutral-500 block">Daily Allowance</span>
                  <span className="text-white font-medium tabular-nums">
                    {currencySymbol}{item.dailyRemaining}/day
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                  <span className="text-neutral-500 block">Weekly Buffer</span>
                  <span className="text-white font-medium tabular-nums">
                    {currencySymbol}{item.weeklyRemaining}/wk
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-white mb-4">
              {selectedBudget ? 'Update Budget Cap' : 'Define Category Budget'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
                <select
                  disabled={Boolean(selectedBudget)}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none disabled:opacity-60"
                >
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transport">Transport</option>
                  <option value="Bills">Bills</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Monthly Cap ({currencySymbol})
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none tabular-nums"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-md"
              >
                Save Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
