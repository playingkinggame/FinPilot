// FinPilot Financial Goals & Savings Planner
import React, { useState } from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { calculateGoalProgress } from '../../lib/finance/engine';
import { Plus, Target, CheckCircle2, Calendar, Coins, Sparkles, X } from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { goals, addGoal, updateGoalAmount, currencySymbol } = useFinPilot();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // New Goal Form
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [category, setCategory] = useState('Savings');
  const [description, setDescription] = useState('');

  // Add Funds Form
  const [fundAmount, setFundAmount] = useState('');

  const progressList = calculateGoalProgress(goals);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(targetAmount);
    if (!t || isNaN(t)) return;

    addGoal({
      name,
      target_amount: t,
      deadline,
      category,
      description
    });

    setName('');
    setTargetAmount('');
    setIsAddOpen(false);
  };

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const f = parseFloat(fundAmount);
    if (!f || isNaN(f) || !selectedGoalId) return;

    updateGoalAmount(selectedGoalId, f);
    setFundAmount('');
    setIsFundOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Savings & Milestone Goals</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Deterministic pacing formulas calculate required monthly contributions and target completion dates.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>New Goal Target</span>
        </button>
      </div>

      {/* Goal Cards Grid */}
      {progressList.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No savings goals established yet</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Create milestone goals (such as an Emergency Fund, Travel, Vehicle, or House Deposit) to calculate target dates and contribution velocity.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm mt-1"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {progressList.map((item) => {
          const isComplete = item.percentage >= 100;

          return (
            <div
              key={item.goal.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.goal.name}</h3>
                      <p className="text-[10px] text-neutral-400">{item.goal.category || 'Savings Target'}</p>
                    </div>
                  </div>

                  {isComplete && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Funded</span>
                    </span>
                  )}
                </div>

                {item.goal.description && (
                  <p className="text-xs text-neutral-400 mb-4 line-clamp-2">{item.goal.description}</p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Saved:</span>
                    <span className="text-white font-medium tabular-nums">
                      {currencySymbol}{item.goal.current_amount.toLocaleString()} / {currencySymbol}{item.goal.target_amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] font-mono text-emerald-400 font-semibold">
                    {item.percentage}%
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 space-y-2.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Monthly Contribution:</span>
                  <span className="text-white font-medium tabular-nums">
                    {currencySymbol}{item.monthlySavingsRequired.toLocaleString()}/mo
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Target Date:</span>
                  <span className="text-neutral-300 font-mono">{item.goal.deadline}</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedGoalId(item.goal.id);
                    setIsFundOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <Coins className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Allocate Funds</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add Goal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-white mb-4">Establish Savings Goal</h2>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emergency Fund (6 Months)"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Target Capital ({currencySymbol})
                </label>
                <input
                  type="number"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="100000"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Savings">Savings / Reserve</option>
                    <option value="Tech Gear">Hardware & Tech</option>
                    <option value="Travel">Travel & Leisure</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dedicated high-yield capital buffer"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-md"
              >
                Create Target
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Funds Modal */}
      {isFundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xs rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <button
              onClick={() => setIsFundOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-white mb-2">Deposit Savings</h2>
            <p className="text-xs text-neutral-400 mb-4">Transfer surplus funds into this milestone goal.</p>

            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Amount to Allocate ({currencySymbol})
                </label>
                <input
                  type="number"
                  required
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none tabular-nums"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-md"
              >
                Confirm Allocation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
