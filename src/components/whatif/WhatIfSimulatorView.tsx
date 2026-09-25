// FinPilot What-If Financial Decision Simulator
import React, { useState } from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { calculateBalance, calculateTotalIncome, simulateWhatIfScenario } from '../../lib/finance/engine';
import { SlidersHorizontal, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const WhatIfSimulatorView: React.FC = () => {
  const { transactions, subscriptions, goals, currencySymbol } = useFinPilot();

  const balance = calculateBalance(transactions);
  const totalIncome = calculateTotalIncome(transactions);

  // Scenario state
  const [purchaseAmount, setPurchaseAmount] = useState<number>(70000);
  const [purchaseName, setPurchaseName] = useState<string>('High-End Hardware Laptop');
  const [extraMonthlySavings, setExtraMonthlySavings] = useState<number>(5000);
  const [foodReductionPercent, setFoodReductionPercent] = useState<number>(15);

  const simulation = simulateWhatIfScenario(balance, totalIncome, transactions, subscriptions, goals, {
    purchaseAmount,
    purchaseName,
    monthlySavingsAdjustment: extraMonthlySavings + (foodReductionPercent * 50)
  });

  const chartData = [
    { name: 'Baseline 30d Balance', value: simulation.currentProjectedBalance30d, fill: '#3B82F6' },
    { name: 'With Purchase Cost', value: simulation.newProjectedBalance30d, fill: simulation.newProjectedBalance30d > 0 ? '#10B981' : '#EF4444' },
    { name: 'With Savings Boost', value: simulation.newProjectedBalance30d + extraMonthlySavings, fill: '#8B5CF6' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">What-If Decision Simulator</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Stress-test major purchases, lifestyle shifts, and budget adjustments before committing real capital.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Simulation Variables</h2>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-2">Preset Scenarios:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPurchaseAmount(70000);
                  setPurchaseName('MacBook Pro M3');
                }}
                className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white text-left transition-colors"
              >
                💻 {currencySymbol}70k Laptop
              </button>
              <button
                type="button"
                onClick={() => {
                  setPurchaseAmount(25000);
                  setPurchaseName('Weekend Vacation');
                }}
                className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white text-left transition-colors"
              >
                ✈️ {currencySymbol}25k Trip
              </button>
              <button
                type="button"
                onClick={() => {
                  setPurchaseAmount(5000);
                  setPurchaseName('Smart Watch');
                }}
                className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white text-left transition-colors"
              >
                ⌚ {currencySymbol}5k Watch
              </button>
              <button
                type="button"
                onClick={() => {
                  setPurchaseAmount(150000);
                  setPurchaseName('Electric Scooter');
                }}
                className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white text-left transition-colors"
              >
                🛵 {currencySymbol}150k Scooter
              </button>
            </div>
          </div>

          {/* Custom Purchase Amount */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-300 font-medium">One-Off Purchase Cost</span>
              <span className="text-white font-mono font-bold">
                {currencySymbol}{purchaseAmount.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={250000}
              step={1000}
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <input
              type="text"
              value={purchaseName}
              onChange={(e) => setPurchaseName(e.target.value)}
              placeholder="Item name"
              className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Extra Monthly Savings Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-300 font-medium">Extra Monthly Savings Boost</span>
              <span className="text-white font-mono font-bold">
                +{currencySymbol}{extraMonthlySavings.toLocaleString()}/mo
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={25000}
              step={500}
              value={extraMonthlySavings}
              onChange={(e) => setExtraMonthlySavings(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Food Expense Reduction Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-300 font-medium">Reduce Food Spend by %</span>
              <span className="text-white font-mono font-bold">{foodReductionPercent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={foodReductionPercent}
              onChange={(e) => setFoodReductionPercent(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Results & Visual Feedback Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Decision Verdict Card */}
          <div
            className={`rounded-2xl border p-6 ${
              simulation.verdict === 'Comfortable'
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : simulation.verdict === 'Caution'
                ? 'border-amber-500/40 bg-amber-950/20'
                : 'border-rose-500/40 bg-rose-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {simulation.verdict === 'Comfortable' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                )}
                <span className="text-base font-bold text-white">
                  Feasibility Verdict: {simulation.verdict}
                </span>
              </div>
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-black/40 text-neutral-300">
                FinPilot Model
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              {simulation.verdictExplanation}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-neutral-800/60">
              <div className="p-3 rounded-xl bg-neutral-950/80">
                <span className="text-neutral-500 block text-[10px]">Recovery Timeframe</span>
                <span className="text-base font-bold text-white tabular-nums">
                  ~{simulation.daysToRecover} days
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80">
                <span className="text-neutral-500 block text-[10px]">Active Goal Delay</span>
                <span className="text-base font-bold text-amber-400 tabular-nums">
                  +{simulation.goalDelayDays} days
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80">
                <span className="text-neutral-500 block text-[10px]">Post-Purchase 30d Buffer</span>
                <span
                  className={`text-base font-bold tabular-nums ${
                    simulation.newProjectedBalance30d > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currencySymbol}{simulation.newProjectedBalance30d.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Comparing Balance Outcomes */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
            <h2 className="text-sm font-semibold text-white mb-1">Comparative Balance Impact</h2>
            <p className="text-xs text-neutral-400 mb-4">30-day liquidity buffer across simulated scenarios</p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={10} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: any) => [`${currencySymbol}${Number(v).toLocaleString()}`, 'Balance']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
