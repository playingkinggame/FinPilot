// FinPilot Transactions Ledger Management
import React, { useState, useMemo } from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { Transaction } from '../../types';
import { ReceiptScannerModal } from './ReceiptScannerModal';
import { ScreenshotImportModal } from './ScreenshotImportModal';
import {
  Search,
  Plus,
  Download,
  Upload,
  Copy,
  Trash2,
  Edit2,
  Camera,
  Smartphone,
  Check,
  X,
  Filter,
  ArrowUpDown,
  Calendar
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
    currencySymbol
  } = useFinPilot();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);

  // Form State for Add / Edit
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formCategory, setFormCategory] = useState('Food');
  const [formDescription, setFormDescription] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('UPI');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  // Filter and sort transactions
  const filteredList = useMemo(() => {
    return transactions
      .filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const matchDesc = t.description?.toLowerCase().includes(s);
          const matchMerch = t.merchant?.toLowerCase().includes(s);
          const matchCat = t.category.toLowerCase().includes(s);
          if (!matchDesc && !matchMerch && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, typeFilter, categoryFilter, searchTerm, sortBy]);

  const handleOpenAdd = () => {
    setFormAmount('');
    setFormType('expense');
    setFormCategory('Food');
    setFormDescription('');
    setFormMerchant('');
    setFormPaymentMethod('UPI');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setFormAmount(String(t.amount));
    setFormType(t.type === 'income' ? 'income' : 'expense');
    setFormCategory(t.category);
    setFormDescription(t.description);
    setFormMerchant(t.merchant || '');
    setFormPaymentMethod(t.payment_method);
    setFormDate(t.date);
    setFormNotes(t.notes || '');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (!amountNum || isNaN(amountNum)) return;

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        amount: amountNum,
        type: formType,
        category: formCategory,
        description: formDescription || formMerchant || 'Transaction',
        merchant: formMerchant,
        payment_method: formPaymentMethod as any,
        date: formDate,
        notes: formNotes
      });
      setEditingTransaction(null);
    } else {
      addTransaction({
        amount: amountNum,
        type: formType,
        category: formCategory,
        description: formDescription || formMerchant || 'Transaction',
        merchant: formMerchant,
        payment_method: formPaymentMethod as any,
        date: formDate,
        notes: formNotes
      });
      setIsAddOpen(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Merchant', 'Description', 'Amount', 'Payment Method', 'Notes'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.merchant || ''}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.payment_method}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finpilot_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 6) {
          const [date, type, category, merchant, description, amountStr, payment_method] = parts;
          const amt = parseFloat(amountStr);
          if (!isNaN(amt)) {
            addTransaction({
              date: date || new Date().toISOString().split('T')[0],
              type: type.toLowerCase() === 'income' ? 'income' : 'expense',
              category: category || 'General',
              merchant: merchant || '',
              description: description || 'Imported Entry',
              amount: amt,
              payment_method: (payment_method as any) || 'UPI'
            });
            count++;
          }
        }
      }
      alert(`Imported ${count} verified transactions into ledger.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Transactions Ledger</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Verified financial records with multi-channel OCR and instant CSV sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scan Receipt */}
          <button
            onClick={() => setIsReceiptOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <Camera className="h-3.5 w-3.5 text-emerald-400" />
            <span>Scan Receipt</span>
          </button>

          {/* Screenshot Importer */}
          <button
            onClick={() => setIsScreenshotOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <Smartphone className="h-3.5 w-3.5 text-blue-400" />
            <span>Import Screenshot</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {/* CSV Import */}
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white hover:border-neutral-700 transition-colors">
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          {/* Add Transaction Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description, merchant..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/80 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Type Filter */}
        <div className="flex rounded-lg bg-neutral-900 border border-neutral-800 p-0.5">
          {(['all', 'expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex-1 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                typeFilter === t ? 'bg-neutral-800 text-white font-semibold shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="Food">Food</option>
          <option value="Shopping">Shopping</option>
          <option value="Transport">Transport</option>
          <option value="Bills">Bills</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Subscriptions">Subscriptions</option>
          <option value="Education">Education</option>
          <option value="Health">Health</option>
          <option value="Salary">Salary</option>
          <option value="Freelance">Freelance</option>
        </select>

        {/* Sort selector */}
        <div className="relative flex items-center">
          <ArrowUpDown className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="date_desc">Date: Newest First</option>
            <option value="date_asc">Date: Oldest First</option>
            <option value="amount_desc">Amount: Highest First</option>
            <option value="amount_asc">Amount: Lowest First</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description & Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-neutral-500">
                    No transactions match the specified filter criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-800/30 transition-colors group">
                    <td className="py-3 px-4 text-neutral-400 whitespace-nowrap font-mono">{t.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white truncate max-w-[240px]">{t.description}</div>
                      {t.merchant && <div className="text-[11px] text-neutral-400">{t.merchant}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">{t.payment_method}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span
                        className={`font-semibold ${
                          t.type === 'income' ? 'text-emerald-400' : 'text-neutral-200'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => duplicateTransaction(t.id)}
                          title="Duplicate Transaction"
                          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          title="Edit Transaction"
                          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          title="Delete Transaction"
                          className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      {(isAddOpen || editingTransaction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <button
              onClick={() => {
                setIsAddOpen(false);
                setEditingTransaction(null);
              }}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-white mb-4">
              {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
            </h2>

            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    formType === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-neutral-400'
                  }`}
                >
                  Expense Outflow
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    formType === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-400'
                  }`}
                >
                  Income Inflow
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none tabular-nums"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Swiggy Lunch with team"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Merchant & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Merchant</label>
                  <input
                    type="text"
                    value={formMerchant}
                    onChange={(e) => setFormMerchant(e.target.value)}
                    placeholder="e.g. Swiggy"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Food">Food</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Transport">Transport</option>
                    <option value="Bills">Bills</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-md"
                >
                  {editingTransaction ? 'Save Modifications' : 'Add to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      <ReceiptScannerModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onAddTransaction={addTransaction}
      />

      <ScreenshotImportModal
        isOpen={isScreenshotOpen}
        onClose={() => setIsScreenshotOpen(false)}
        onAddTransaction={addTransaction}
      />
    </div>
  );
};
