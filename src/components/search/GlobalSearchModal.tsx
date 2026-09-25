// FinPilot Global Financial Search Modal (Ctrl + K)
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinPilot } from '../../lib/supabase/context';
import {
  Search,
  Receipt,
  Store,
  Tag,
  Target,
  PiggyBank,
  Repeat,
  ArrowRight,
  X,
  Calendar,
  CreditCard
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTransaction?: (txId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTransaction
}) => {
  const { transactions, budgets, goals, subscriptions, currencySymbol, setActiveView } = useFinPilot();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search in Transactions
  const matchingTransactions = transactions.filter((t) => {
    if (!cleanQuery) return false;
    return (
      t.description.toLowerCase().includes(cleanQuery) ||
      (t.merchant && t.merchant.toLowerCase().includes(cleanQuery)) ||
      t.category.toLowerCase().includes(cleanQuery) ||
      (t.notes && t.notes.toLowerCase().includes(cleanQuery))
    );
  });

  // Calculate Merchant Aggregation if searching a merchant
  const merchantTotals: Record<string, { count: number; total: number; lastDate: string }> = {};
  if (cleanQuery) {
    transactions.forEach((t) => {
      const merchant = t.merchant || t.description;
      if (merchant.toLowerCase().includes(cleanQuery)) {
        if (!merchantTotals[merchant]) {
          merchantTotals[merchant] = { count: 0, total: 0, lastDate: t.date };
        }
        merchantTotals[merchant].count += 1;
        merchantTotals[merchant].total += t.amount;
        if (new Date(t.date) > new Date(merchantTotals[merchant].lastDate)) {
          merchantTotals[merchant].lastDate = t.date;
        }
      }
    });
  }

  // Search in Budgets
  const matchingBudgets = budgets.filter((b) => {
    if (!cleanQuery) return false;
    return b.category.toLowerCase().includes(cleanQuery);
  });

  // Search in Goals
  const matchingGoals = goals.filter((g) => {
    if (!cleanQuery) return false;
    return g.name.toLowerCase().includes(cleanQuery) || (g.category && g.category.toLowerCase().includes(cleanQuery));
  });

  // Search in Subscriptions
  const matchingSubscriptions = subscriptions.filter((s) => {
    if (!cleanQuery) return false;
    return s.service.toLowerCase().includes(cleanQuery) || s.category.toLowerCase().includes(cleanQuery);
  });

  const totalResults =
    matchingTransactions.length +
    Object.keys(merchantTotals).length +
    matchingBudgets.length +
    matchingGoals.length +
    matchingSubscriptions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-800">
          <Search className="h-4 w-4 text-emerald-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, merchants, categories, budgets, goals... (Esc to exit)"
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-500 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-neutral-800">
          {!cleanQuery ? (
            <div className="py-8 text-center">
              <p className="text-xs text-neutral-400">
                Type a merchant name (e.g. <span className="text-emerald-400">"Swiggy"</span>, <span className="text-emerald-400">"Amazon"</span>), category (<span className="text-emerald-400">"Food"</span>, <span className="text-emerald-400">"Rent"</span>), or goal to search across your workspace.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-[11px] text-neutral-500">Quick keys:</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300">Esc</kbd>
                <span className="text-[11px] text-neutral-500">to close</span>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-white mb-1">No matching financial records</p>
              <p className="text-xs text-neutral-500">
                No transactions, merchants, or targets found matching "{query}".
              </p>
            </div>
          ) : (
            <>
              {/* Merchant Aggregations */}
              {Object.keys(merchantTotals).length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Merchants</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(merchantTotals).map(([merchant, stat]) => (
                      <div
                        key={merchant}
                        className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-white">{merchant}</h4>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {stat.count} transaction{stat.count > 1 ? 's' : ''} · Last active: {stat.lastDate}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-white tabular-nums">
                            {currencySymbol}{stat.total.toLocaleString()} total
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions */}
              {matchingTransactions.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Transactions ({matchingTransactions.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingTransactions.slice(0, 8).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveView('transactions');
                          if (onSelectTransaction) onSelectTransaction(t.id);
                          onClose();
                        }}
                        className="w-full text-left rounded-xl border border-neutral-800/80 bg-neutral-950/40 hover:bg-neutral-800/50 p-2.5 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-[10px] font-bold text-neutral-300">
                            {t.category.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white truncate max-w-xs">{t.description}</p>
                            <p className="text-[10px] text-neutral-400">
                              {t.date} · {t.payment_method} · {t.category}
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
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Budgets */}
              {matchingBudgets.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                    <PiggyBank className="h-3.5 w-3.5 text-teal-400" />
                    <span>Budgets ({matchingBudgets.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingBudgets.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setActiveView('budgets');
                          onClose();
                        }}
                        className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 p-2.5 flex items-center justify-between transition-colors"
                      >
                        <span className="text-xs font-medium text-white">{b.category} Budget</span>
                        <span className="text-xs font-semibold text-neutral-300">
                          {currencySymbol}{b.amount.toLocaleString()}/{b.period}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {matchingGoals.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Goals ({matchingGoals.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingGoals.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setActiveView('goals');
                          onClose();
                        }}
                        className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 p-2.5 flex items-center justify-between transition-colors"
                      >
                        <span className="text-xs font-medium text-white">{g.name}</span>
                        <span className="text-xs font-semibold text-neutral-300">
                          {currencySymbol}{g.current_amount.toLocaleString()} / {currencySymbol}{g.target_amount.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
          <span>{totalResults} results found</span>
          <div className="flex items-center gap-2">
            <span>FinPilot Workspace Vault</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
