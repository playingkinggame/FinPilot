// FinPilot Subscriptions & Recurring Commitments View
import React, { useState } from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { calculateSubscriptionTotal } from '../../lib/finance/engine';
import { Plus, Repeat, AlertTriangle, Check, X, Trash2, Calendar, CreditCard } from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const { subscriptions, addSubscription, toggleSubscriptionActive, deleteSubscription, currencySymbol } = useFinPilot();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [service, setService] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Entertainment');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  const summary = calculateSubscriptionTotal(subscriptions);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(amount);
    if (!a || isNaN(a)) return;

    addSubscription({
      service,
      amount: a,
      billing_cycle: cycle,
      next_billing_date: nextDate,
      category,
      payment_method: paymentMethod as any,
      is_active: true
    });

    setService('');
    setAmount('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Subscriptions & Recurring Commitments</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit automatic card deductions, annual projections, and eliminate zombie subscriptions.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>New Subscription</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <span className="text-xs text-neutral-400 font-medium">Monthly Recurring Drain</span>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">
            {currencySymbol}{summary.monthlyTotal.toLocaleString()}/mo
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Normalized for monthly & annual plans</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <span className="text-xs text-neutral-400 font-medium">Annualized Obligation</span>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">
            {currencySymbol}{summary.annualTotal.toLocaleString()}/yr
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">Direct compounding capital opportunity</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <span className="text-xs text-neutral-400 font-medium">Active Services</span>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">
            {summary.activeCount}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {summary.upcomingRenewals.length} renewals in next 14 days
          </p>
        </div>
      </div>

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Repeat className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No active subscriptions registered</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Log recurring SaaS tools, memberships, streaming services, or software licenses to audit recurring cash drain and renewal schedules.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm mt-1"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add First Subscription</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => (
          <div
            key={sub.id}
            className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
              sub.is_active
                ? 'border-neutral-800 bg-neutral-900/60'
                : 'border-neutral-800/40 bg-neutral-950/40 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200">
                    <Repeat className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{sub.service}</h3>
                    <p className="text-[11px] text-neutral-400 capitalize">
                      {sub.billing_cycle} · {sub.category}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold text-white tabular-nums">
                    {currencySymbol}{sub.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">/{sub.billing_cycle === 'yearly' ? 'yr' : 'mo'}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-400 mb-4">
                <div className="flex justify-between">
                  <span>Next Renewal:</span>
                  <span className="text-neutral-200 font-mono">{sub.next_billing_date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Route:</span>
                  <span className="text-neutral-300">{sub.payment_method}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <button
                onClick={() => toggleSubscriptionActive(sub.id)}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                  sub.is_active
                    ? 'bg-neutral-800 text-neutral-300 hover:text-white'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                {sub.is_active ? 'Mark Paused / Cancelled' : 'Reactivate'}
              </button>

              <button
                onClick={() => deleteSubscription(sub.id)}
                className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                title="Delete Subscription"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add Subscription Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-white mb-4">Record Recurring Subscription</h2>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="e.g. Netflix, Spotify, Claude Pro"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="649"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Billing Cycle</label>
                  <select
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Next Billing Date</label>
                  <input
                    type="date"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI AutoPay</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-md"
              >
                Track Subscription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
