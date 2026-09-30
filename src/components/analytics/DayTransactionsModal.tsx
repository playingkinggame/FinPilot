// FinPilot — Day Transactions Modal
// Shown when a person clicks a specific day on the Calendar Spending Heatmap;
// lists every transaction logged on that exact date (merchant, category, amount,
// payment method), so they can see e.g. "Rapido ₹450, Swiggy ₹220" at a glance.
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinPilot } from '../../lib/supabase/context';
import { getCategoryColor } from '../../lib/finance/engine';
import { X, Calendar, CreditCard, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface DayTransactionsModalProps {
  dateStr: string | null;
  onClose: () => void;
}

export const DayTransactionsModal: React.FC<DayTransactionsModalProps> = ({ dateStr, onClose }) => {
  const { transactions, currencySymbol, setActiveView } = useFinPilot();

  const dayTransactions = useMemo(() => {
    if (!dateStr) return [];
    return transactions
      .filter((t) => t.date === dateStr)
      .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  }, [transactions, dateStr]);

  const totals = useMemo(() => {
    const expense = dayTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const income = dayTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    return { expense, income };
  }, [dayTransactions]);

  const formattedDate = useMemo(() => {
    if (!dateStr) return '';
    // Parse as a local date (not UTC) so it always matches the day that was clicked
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [dateStr]);

  return (
    <AnimatePresence>
      {dateStr && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{formattedDate}</h2>
                  <p className="text-[11px] text-neutral-400">
                    {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''} logged
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Totals strip */}
            {dayTransactions.length > 0 && (
              <div className="grid grid-cols-2 divide-x divide-neutral-800 border-b border-neutral-800">
                <div className="px-5 py-3">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Spent</span>
                  <div className="text-base font-bold text-white tabular-nums">
                    {currencySymbol}{totals.expense.toLocaleString()}
                  </div>
                </div>
                <div className="px-5 py-3">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Received</span>
                  <div className="text-base font-bold text-emerald-400 tabular-nums">
                    {currencySymbol}{totals.income.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Transaction list */}
            <div className="max-h-[50vh] overflow-y-auto p-3 space-y-1.5">
              {dayTransactions.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs text-neutral-500">No transactions logged on this day.</p>
                  <button
                    onClick={() => {
                      onClose();
                      setActiveView('transactions');
                    }}
                    className="mt-3 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    Add one in Transactions →
                  </button>
                </div>
              ) : (
                dayTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/50 px-3.5 py-2.5 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColor(t.category) }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-semibold text-white truncate">
                            {t.merchant || t.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                            {t.category}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CreditCard className="h-2.5 w-2.5" />
                            {t.payment_method}
                          </span>
                        </div>
                        {t.merchant && t.description && t.description !== t.merchant && (
                          <p className="text-[10px] text-neutral-500 mt-0.5 truncate">{t.description}</p>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center gap-1 shrink-0 text-sm font-bold tabular-nums ${
                      t.type === 'income' ? 'text-emerald-400' : 'text-neutral-100'
                    }`}>
                      {t.type === 'income' ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {t.type === 'income' ? '+' : '-'}{currencySymbol}{Number(t.amount).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
