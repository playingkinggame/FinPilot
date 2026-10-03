// FinPilot Analytics Engine — Real Deterministic Charts & Categorical Breakdown
import React, { useState, useMemo } from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { DayTransactionsModal } from './DayTransactionsModal';
import {
  calculateSpendingTrend,
  calculateCategoryBreakdown,
  calculateTopCategories,
  calculateMerchantBreakdown,
  calculateWeekendSpending,
  calculateWeekdaySpending,
  calculatePaymentMethodBreakdown,
  calculateMonthlyComparison,
  calculateTotalExpenses,
  calculateTotalIncome
} from '../../lib/finance/engine';
import {
  RotateCcw,
  Plus,
  Receipt,
  PieChart as PieIcon,
  Sparkles,
  ShoppingBag,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { transactions, currencySymbol, setActiveView } = useFinPilot();

  // Multi-Filter State
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '3M' | '6M' | '1Y'>('30D');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  const [heatmapMonthOffset, setHeatmapMonthOffset] = useState(0);
  const [categoryDeepDive, setCategoryDeepDive] = useState<string>('Food');
  const [hoveredSlice, setHoveredSlice] = useState<{
    category: string;
    amount: number;
    percentage: number;
    topItems: string;
    merchants: string[];
    color: string;
  } | null>(null);

  // Filtered dataset
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (selectedCategory !== 'All' && t.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedPaymentMethod !== 'All' && t.payment_method !== selectedPaymentMethod) return false;
      return true;
    });
  }, [transactions, typeFilter, selectedCategory, selectedPaymentMethod]);

  // Calculations for charts
  const trendData = calculateSpendingTrend(filteredTransactions, timeRange);
  const categoryData = calculateCategoryBreakdown(filteredTransactions);
  const topCategories = calculateTopCategories(filteredTransactions, 6);
  const merchantData = calculateMerchantBreakdown(filteredTransactions).slice(0, 6);
  const weekendData = calculateWeekendSpending(filteredTransactions);
  const weekdayData = calculateWeekdaySpending(filteredTransactions);
  const paymentData = calculatePaymentMethodBreakdown(filteredTransactions);

  const totalFilteredExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  // Dynamic Month-over-Month Real Comparison
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const curMonthStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
  const prevDate = new Date(curYear, curMonth - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const monthlyGroupedBarData = useMemo(() => {
    const cats = ['Food', 'Shopping', 'Transport', 'Bills', 'Entertainment'];
    const curMonthTxs = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(curMonthStr));
    const prevMonthTxs = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(prevMonthStr));

    return cats.map((cat) => {
      const curAmt = curMonthTxs
        .filter((t) => t.category.toLowerCase() === cat.toLowerCase())
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const prevAmt = prevMonthTxs
        .filter((t) => t.category.toLowerCase() === cat.toLowerCase())
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      return {
        name: cat,
        Prev: prevAmt,
        Curr: curAmt
      };
    });
  }, [transactions, curMonthStr, prevMonthStr]);

  // Dynamic Inflow vs Outflow vs Net Savings from actual transactions
  const incomeVsExpenseData = useMemo(() => {
    const monthsBack = 4;
    const result = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(curYear, curMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const monthTxs = transactions.filter((t) => t.date.startsWith(key));
      const inc = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      result.push({
        month: monthLabel,
        Income: inc,
        Expense: exp,
        Savings: Math.max(0, inc - exp)
      });
    }
    return result;
  }, [transactions, curYear, curMonth]);

  // Daily Spending (past 14 days)
  const dailyData = trendData.slice(-14);

  // Dynamic Calendar Spending Heatmap — independent month navigation.
  // heatmapMonthOffset: 0 = current month, 1 = one month back ("last month"), etc.
  // This used to always show `curMonth`/`curYear` (the global "now") with no way
  // to step back, so last month's spending was never visible. It's intentionally
  // decoupled from curYear/curMonth above (which still drive the other charts)
  // so navigating the heatmap doesn't affect the rest of the page.
  const heatmapDate = useMemo(() => new Date(curYear, curMonth - heatmapMonthOffset, 1), [curYear, curMonth, heatmapMonthOffset]);
  const heatmapYear = heatmapDate.getFullYear();
  const heatmapMonth = heatmapDate.getMonth();
  const heatmapMonthStr = `${heatmapYear}-${String(heatmapMonth + 1).padStart(2, '0')}`;
  const heatmapMonthLabel = heatmapDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInHeatmapMonth = new Date(heatmapYear, heatmapMonth + 1, 0).getDate();

  const heatmapDays = useMemo(() => {
    return Array.from({ length: Math.min(31, daysInHeatmapMonth) }, (_, i) => {
      const day = i + 1;
      const dateStr = `${heatmapMonthStr}-${String(day).padStart(2, '0')}`;
      // Compute directly from the full transaction list for whichever month is
      // selected (not filteredTransactions' time-range, and not trendData's
      // "MM-DD"-only window) so every month — including past ones — is correct.
      const amt = transactions
        .filter((t) => t.type === 'expense' && t.date === dateStr)
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      return { day, dateStr, amount: amt };
    });
  }, [daysInHeatmapMonth, heatmapMonthStr, transactions]);

  // Real Category Deep-Dive Trend
  const deepDiveTrend = useMemo(() => {
    const result = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(curYear, curMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const catTxs = transactions.filter(
        (t) => t.type === 'expense' && t.date.startsWith(key) && t.category.toLowerCase() === categoryDeepDive.toLowerCase()
      );
      const amt = catTxs.reduce((s, t) => s + Number(t.amount || 0), 0);
      result.push({
        month: monthLabel,
        amount: amt
      });
    }
    return result;
  }, [transactions, curYear, curMonth, categoryDeepDive]);

  // Real Transaction Size Distribution
  const sizeBins = useMemo(() => {
    const bins = [
      { range: `${currencySymbol}0–100`, count: 0 },
      { range: `${currencySymbol}100–500`, count: 0 },
      { range: `${currencySymbol}500–1k`, count: 0 },
      { range: `${currencySymbol}1k–5k`, count: 0 },
      { range: `${currencySymbol}5k+`, count: 0 }
    ];

    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const a = Number(t.amount || 0);
        if (a <= 100) bins[0].count++;
        else if (a <= 500) bins[1].count++;
        else if (a <= 1000) bins[2].count++;
        else if (a <= 5000) bins[3].count++;
        else bins[4].count++;
      });
    return bins;
  }, [filteredTransactions, currencySymbol]);

  const resetFilters = () => {
    setTimeRange('30D');
    setSelectedCategory('All');
    setSelectedPaymentMethod('All');
    setTypeFilter('all');
  };

  // Active or hovered category for donut center display
  const activeCategoryInfo = hoveredSlice || (categoryData.length > 0 ? categoryData[0] : null);

  return (
    <>
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title & Filter System */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Analytics Engine</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Verified patterns, categorical outflow, and merchant spending distribution.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-800 p-0.5">
            {(['7D', '30D', '3M', '6M', '1Y'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeRange === r ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Food">Food</option>
            <option value="Shopping">Shopping</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Subscriptions">Subscriptions</option>
            <option value="Health">Health</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="All">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>

          {(selectedCategory !== 'All' || selectedPaymentMethod !== 'All' || timeRange !== '30D') && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800/80 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Spending Trend */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Chart 1: Spending Trend ({timeRange})</h2>
              <p className="text-xs text-neutral-400">Expense velocity trajectory over selected window</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any) => [`${currencySymbol}${Number(v).toLocaleString()}`, 'Expense']}
                />
                <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: ENHANCED CATEGORY BREAKDOWN PIE/DONUT (Shows Price AND What We Did the Spending On) */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Chart 2: Category Breakdown & Spending Details</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Price + Items
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Displays exact price, percentage, and what items/merchants you spent on
              </p>
            </div>
            {selectedCategory !== 'All' && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Filtered: {selectedCategory}
              </span>
            )}
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 bg-neutral-950/40 rounded-xl border border-neutral-800/80">
              <div className="h-12 w-12 rounded-full border border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 mb-3">
                <PieIcon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No expense transactions recorded yet</h3>
              <p className="text-xs text-neutral-400 max-w-sm mb-3">
                Add an expense to view price breakdowns, categorical share, and see what you spent on.
              </p>
              <button
                onClick={() => setActiveView('transactions')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add First Transaction</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pie / Donut Chart with Interactive Center Detail */}
              <div className="relative h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={4}
                      onClick={(entry: any) => setSelectedCategory(entry?.category || 'All')}
                      onMouseEnter={(entry: any) => {
                        if (entry) {
                          setHoveredSlice({
                            category: entry.category,
                            amount: entry.amount,
                            percentage: entry.percentage,
                            topItems: entry.topItems,
                            merchants: entry.merchants,
                            color: entry.color
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className="cursor-pointer"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`c-${index}`}
                          fill={entry.color}
                          stroke="#18181B"
                          strokeWidth={2}
                          className="transition-all hover:opacity-90"
                        />
                      ))}
                    </Pie>
                    {/* No <Tooltip> here on purpose: the "Donut Center Display" panel
                        below already shows category/amount/% on hover via hoveredSlice.
                        Recharts' floating tooltip used to render at the same spot,
                        stacking duplicate text on top of it — that was the overlap bug. */}
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display: Shows Price & What was Spent On */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  {activeCategoryInfo ? (
                    <div className="space-y-0.5 animate-in fade-in max-w-[130px]">
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider block truncate"
                        style={{ color: activeCategoryInfo.color }}
                      >
                        {activeCategoryInfo.category}
                      </span>
                      <div className="text-base sm:text-lg font-extrabold text-white font-mono tabular-nums leading-tight">
                        {currencySymbol}{Number(activeCategoryInfo.amount).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium block">
                        {activeCategoryInfo.percentage}% of outflow
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-medium">
                        Total Spent
                      </span>
                      <div className="text-base sm:text-lg font-bold text-white font-mono">
                        {currencySymbol}{totalFilteredExpense.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Categorical "What We Spent On" Breakdown Ledger */}
              <div className="border-t border-neutral-800/80 pt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  <span>Category & Spending Outlay</span>
                  <span>Price / Share</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {categoryData.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.category.toLowerCase();
                    return (
                      <div
                        key={cat.category}
                        onClick={() =>
                          setSelectedCategory(isSelected ? 'All' : cat.category)
                        }
                        className={`group p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800/80 border-emerald-500/50 shadow-md'
                            : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span
                              className="h-3 w-3 rounded-full mt-0.5 shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                                  {cat.category}
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  ({cat.count} tx{cat.count !== 1 ? 's' : ''})
                                </span>
                              </div>
                              {/* What we spent on detail */}
                              <p className="text-[11px] text-neutral-300 truncate mt-0.5">
                                <strong className="text-neutral-400 font-medium">Spent on: </strong>
                                {cat.topItems}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-white font-mono tabular-nums">
                              {currencySymbol}{cat.amount.toLocaleString()}
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-400 font-mono">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Progress visual bar */}
                        <div className="mt-2 h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, cat.percentage)}%`,
                              backgroundColor: cat.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CHART 3: Top Spending Categories Horizontal Bar */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="pb-3 border-b border-neutral-800 mb-3">
            <h2 className="text-sm font-semibold text-white">Chart 3: Top Spending Categories</h2>
            <p className="text-xs text-neutral-400">Ranked categorical outflow</p>
          </div>
          <div className="h-56 w-full">
            {topCategories.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                No expense categories recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={topCategories} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid stroke="#27272A" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#71717A" fontSize={10} tickFormatter={(v) => `${currencySymbol}${v}`} />
                  <YAxis type="category" dataKey="category" stroke="#A1A1AA" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: any) => [`${currencySymbol}${Number(v).toLocaleString()}`, 'Spent']}
                  />
                  <Bar dataKey="amount" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 4: Monthly Comparison Grouped Bar (Real MoM) */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="pb-3 border-b border-neutral-800 mb-3">
            <h2 className="text-sm font-semibold text-white">Chart 4: Month-over-Month Comparison</h2>
            <p className="text-xs text-neutral-400">Actual categorical variation between billing cycles</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyGroupedBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any) => [`${currencySymbol}${Number(v).toLocaleString()}`, 'Outflow']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Prev" fill="#64748B" name="Previous Cycle" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Curr" fill="#10B981" name="Current Cycle" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: Real Inflow vs Outflow vs Net Savings */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="pb-3 border-b border-neutral-800 mb-3">
            <h2 className="text-sm font-semibold text-white">Chart 5: Inflow vs Outflow vs Net Savings</h2>
            <p className="text-xs text-neutral-400">Multi-month real macroeconomic performance</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any) => [`${currencySymbol}${Number(v).toLocaleString()}`, 'Amount']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="Income" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
                <Area type="monotone" dataKey="Expense" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} />
                <Area type="monotone" dataKey="Savings" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 6: Daily Spending Bar Chart */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="pb-3 border-b border-neutral-800 mb-3">
            <h2 className="text-sm font-semibold text-white">Chart 6: Daily Spending Distribution</h2>
            <p className="text-xs text-neutral-400">Day-by-day cash outlays</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any) => [`${currencySymbol}${Number(v).toLocaleString()}`, 'Daily Spend']}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 7: Weekday vs Weekend Comparison */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col justify-between">
          <div className="pb-3 border-b border-neutral-800 mb-3">
            <h2 className="text-sm font-semibold text-white">Chart 7: Weekday vs Weekend Behavior</h2>
            <p className="text-xs text-neutral-400">Behavioral surge during leisure days</p>
          </div>
          <div className="grid grid-cols-2 gap-4 my-auto">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-xs text-blue-400 font-medium">Weekdays (Mon–Fri)</span>
              <div className="text-2xl font-bold text-white tabular-nums mt-1 font-mono">
                {currencySymbol}{weekdayData.amount.toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">{weekdayData.percentage}% of discretionary</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-xs text-pink-400 font-medium">Weekends (Sat–Sun)</span>
              <div className="text-2xl font-bold text-white tabular-nums mt-1 font-mono">
                {currencySymbol}{weekendData.amount.toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">{weekendData.percentage}% of discretionary</p>
            </div>
          </div>
          <div className="text-[11px] text-neutral-400 pt-3 border-t border-neutral-800/80">
            {weekendData.percentage > 35
              ? 'Weekend spending concentration detected: Leisure and dining outpace standard weekdays.'
              : 'Discretionary spending is evenly pacing throughout the week.'}
          </div>
        </div>

        {/* CHART 8: Payment Method Breakdown */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="pb-3 border-b border-neutral-800 mb-3">
            <h2 className="text-sm font-semibold text-white">Chart 8: Payment Method Breakdown</h2>
            <p className="text-xs text-neutral-400">UPI vs Cards vs Bank Transfer vs Cash</p>
          </div>
          <div className="h-56 w-full">
            {paymentData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                No payment transactions recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                  <XAxis dataKey="method" stroke="#71717A" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={10} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: any) => [`${currencySymbol}${Number(v).toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 9: Top Merchants (Outflow Volume) */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="pb-3 border-b border-neutral-800 mb-3">
            <h2 className="text-sm font-semibold text-white">Chart 9: Top Merchants & Outlets</h2>
            <p className="text-xs text-neutral-400">Where outflow is concentrated</p>
          </div>
          {merchantData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-neutral-500">
              No merchant spending recorded yet
            </div>
          ) : (
            <div className="space-y-2.5">
              {merchantData.map((m, idx) => (
                <div key={m.merchant} className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-950/40 border border-neutral-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 font-mono w-4">{idx + 1}.</span>
                    <div>
                      <span className="text-white font-medium">{m.merchant}</span>
                      <span className="text-[10px] text-neutral-400 block">{m.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400 text-[11px] font-mono">{m.count} visit{m.count !== 1 ? 's' : ''}</span>
                    <span className="font-bold text-white tabular-nums font-mono">{currencySymbol}{m.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CHART 10: Spending Intensity Heatmap */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="pb-3 border-b border-neutral-800 mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Chart 10: Calendar Spending Heatmap</h2>
              <p className="text-xs text-neutral-400">Daily intensity — {heatmapMonthLabel}</p>
            </div>
            {/* Month navigation: lets you step back to last month (and beyond) instead
                of being stuck on whatever the current calendar month is. */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setHeatmapMonthOffset((o) => Math.min(o + 1, 23))}
                title="Previous month"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {heatmapMonthOffset > 0 && (
                <button
                  type="button"
                  onClick={() => setHeatmapMonthOffset(0)}
                  className="px-2 h-7 flex items-center rounded-lg border border-neutral-800 bg-neutral-950/60 text-[10px] font-semibold text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
                >
                  Today
                </button>
              )}
              <button
                type="button"
                onClick={() => setHeatmapMonthOffset((o) => Math.max(o - 1, 0))}
                disabled={heatmapMonthOffset === 0}
                title="Next month"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-neutral-400 disabled:hover:border-neutral-800"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {heatmapDays.map((d) => {
              const intensity = d.amount === 0 ? 0 : d.amount < 1000 ? 1 : d.amount < 3000 ? 2 : 3;
              const bgColors = [
                'bg-neutral-950 border-neutral-800 text-neutral-600',
                'bg-emerald-950/40 border-emerald-900/40 text-emerald-400',
                'bg-emerald-800/60 border-emerald-700/60 text-emerald-200',
                'bg-emerald-500 text-neutral-950 font-bold'
              ];
              return (
                <div
                  key={d.day}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDayStr(d.dateStr)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedDayStr(d.dateStr);
                  }}
                  title={`${d.dateStr}: ${currencySymbol}${d.amount.toLocaleString()} — click to see transactions`}
                  className={`h-9 rounded-md border flex flex-col items-center justify-center p-0.5 text-[10px] cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-emerald-500/50 ${bgColors[intensity]}`}
                >
                  <span>{d.day}</span>
                  {d.amount > 0 && (
                    <span className="text-[8px] opacity-80 tabular-nums">
                      {currencySymbol}{d.amount > 999 ? `${Math.round(d.amount / 1000)}k` : d.amount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 11: Category Deep-Dive Trend */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Chart 11: Category Trend Deep-Dive</h2>
              <p className="text-xs text-neutral-400">Monthly evolution of selected category</p>
            </div>
            <select
              value={categoryDeepDive}
              onChange={(e) => setCategoryDeepDive(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-emerald-400 font-semibold focus:outline-none"
            >
              <option value="Food">Food</option>
              <option value="Shopping">Shopping</option>
              <option value="Transport">Transport</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
            </select>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deepDiveTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any) => [`${currencySymbol}${Number(v).toLocaleString()}`, categoryDeepDive]}
                />
                <Line type="monotone" dataKey="amount" stroke="#EC4899" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 12: Transaction Size Distribution */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="pb-3 border-b border-neutral-800 mb-3">
            <h2 className="text-sm font-semibold text-white">Chart 12: Transaction Size Distribution</h2>
            <p className="text-xs text-neutral-400">Frequency by monetary ticket tier</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any) => [`${v} transactions`, 'Volume']}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>

    <DayTransactionsModal dateStr={selectedDayStr} onClose={() => setSelectedDayStr(null)} />
    </>
  );
};

export default AnalyticsView;