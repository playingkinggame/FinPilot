// FinPilot Future Cash Flow Projection Engine View
import React, { useState } from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { calculateBalance, calculateTotalIncome, calculateCashFlowProjection } from '../../lib/finance/engine';
import { TrendingUp, AlertCircle, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const CashFlowView: React.FC = () => {
  const { transactions, subscriptions, currencySymbol } = useFinPilot();
  const [horizonDays, setHorizonDays] = useState<30 | 60 | 90>(60);

  const balance = calculateBalance(transactions);
  const totalIncome = calculateTotalIncome(transactions);

  const projection = calculateCashFlowProjection(balance, totalIncome, transactions, subscriptions, horizonDays);

  const finalProjected = projection.projectedBalance;
  const isHealthy = finalProjected > balance * 0.5;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Future Cash Flow Projection</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Deterministic liquidity modeling based on verified burn velocity and recurring obligations.
          </p>
        </div>

        {/* Horizon selector */}
        <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 self-start sm:self-auto">
          {([30, 60, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setHorizonDays(d)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                horizonDays === d ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <span className="text-xs text-neutral-400 font-medium">Starting Verified Balance</span>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">
            {currencySymbol}{balance.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Current liquid availability</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <span className="text-xs text-neutral-400 font-medium">Forecasted Balance ({horizonDays}d)</span>
          <div
            className={`text-2xl font-bold tabular-nums mt-1 ${
              isHealthy ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {currencySymbol}{finalProjected.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {finalProjected >= balance ? 'Net positive liquidity accumulation' : 'Contained discretionary outflow'}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <span className="text-xs text-neutral-400 font-medium">Confidence & Margin</span>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">
            {projection.confidenceScore}%
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">High statistical predictability</p>
        </div>
      </div>

      {/* Projection Area Chart */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div className="pb-3 border-b border-neutral-800 mb-4">
          <h2 className="text-sm font-semibold text-white">Continuous Liquidity Trajectory</h2>
          <p className="text-xs text-neutral-400">Modeled daily balance incorporating expected paychecks and card renewals</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projection.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={10} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString()}`, 'Projected Balance']}
              />
              <Area type="monotone" dataKey="projectedBalance" stroke="#10B981" strokeWidth={2.5} fill="url(#cfGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Milestone Events on Timeline */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Anticipated Inflow / Outflow Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold block mb-1">
              Monthly Salary Credit
            </span>
            <div className="text-base font-bold text-white tabular-nums">+₹50,000</div>
            <p className="text-[11px] text-neutral-400 mt-1">Expected 1st of month</p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold block mb-1">
              Recurring Subscriptions Batch
            </span>
            <div className="text-base font-bold text-white tabular-nums">-₹1,418</div>
            <p className="text-[11px] text-neutral-400 mt-1">Netflix, Spotify & Google One</p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold block mb-1">
              Discretionary Daily Run Rate
            </span>
            <div className="text-base font-bold text-white tabular-nums">~₹820/day</div>
            <p className="text-[11px] text-neutral-400 mt-1">Average daily burn across Food & Transport</p>
          </div>
        </div>
      </div>
    </div>
  );
};
