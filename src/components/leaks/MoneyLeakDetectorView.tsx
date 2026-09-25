// FinPilot Money Leak Detector View
import React from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { detectMoneyLeaks } from '../../lib/finance/engine';
import { Flame, ShieldCheck, ArrowRight, TrendingDown, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export const MoneyLeakDetectorView: React.FC = () => {
  const { transactions, subscriptions, currencySymbol, setActiveView } = useFinPilot();

  const leaks = detectMoneyLeaks(transactions, subscriptions);
  const totalPotentialSavingsYearly = leaks.reduce((sum, l) => sum + l.potentialSavingsYearly, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Money Leak Detector</span>
          <Flame className="h-5 w-5 text-amber-500" />
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Algorithmic scans for micro-transaction creep, recurring fees, and high-frequency delivery markups.
        </p>
      </div>

      {/* Aggregate Savings Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Total Annual Recapturable Capital
          </span>
          <div className="text-3xl font-extrabold text-white tabular-nums mt-1">
            {currencySymbol}{totalPotentialSavingsYearly.toLocaleString()}/year
          </div>
          <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
            By applying the recommended micro-spending adjustments below, you can redirect ~{currencySymbol}{Math.round(totalPotentialSavingsYearly / 12).toLocaleString()}/month directly toward your emergency reserve or investment goals.
          </p>
        </div>

        <button
          onClick={() => setActiveView('whatif')}
          className="self-start sm:self-center shrink-0 flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg"
        >
          <span>Simulate Savings Impact</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Detected Leak Cards */}
      {leaks.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No active leaks detected</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Your recurring subscriptions and daily outflow are operating without detected duplications, ghost subscriptions, or runaway delivery surcharges.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leaks.map((leak) => {
            return (
              <div
                key={leak.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          leak.severity === 'high'
                            ? 'bg-rose-500'
                            : leak.severity === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <h3 className="text-sm font-semibold text-white">{leak.title}</h3>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {leak.frequency}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 mb-4 leading-relaxed">{leak.description}</p>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 mb-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Active Drain</span>
                      <span className="text-sm font-bold text-rose-400 tabular-nums font-mono">
                        {currencySymbol}{leak.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-500 block text-[10px]">Potential Annual Savings</span>
                      <span className="text-sm font-bold text-emerald-400 tabular-nums font-mono">
                        +{currencySymbol}{leak.potentialSavingsYearly.toLocaleString()}/yr
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800/80 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-neutral-300 font-medium">
                    {leak.recommendedAction}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
