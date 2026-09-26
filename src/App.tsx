// FinPilot Main Application Entry Point
import React, { useState, useEffect } from 'react';
import { FinPilotProvider, useFinPilot } from './lib/supabase/context';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { MobileNav } from './components/navigation/MobileNav';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { GoalsView } from './components/goals/GoalsView';
import { SubscriptionsView } from './components/subscriptions/SubscriptionsView';
import { CashFlowView } from './components/cashflow/CashFlowView';
import { WhatIfSimulatorView } from './components/whatif/WhatIfSimulatorView';
import { MoneyLeakDetectorView } from './components/leaks/MoneyLeakDetectorView';
import { FinancialMirrorView } from './components/reports/FinancialMirrorView';
import { ExpenseDNAView } from './components/dna/ExpenseDNAView';
import { AICopilotDrawer } from './components/copilot/AICopilotDrawer';
import { ReceiptScannerModal } from './components/transactions/ReceiptScannerModal';
import { PaymentMethod } from './types';
import {
  X,
  Plus,
  Compass,
  LayoutDashboard,
  BarChart3,
  Receipt,
  PiggyBank,
  Target,
  Repeat,
  Bot,
  SlidersHorizontal,
  FileText,
  TrendingUp,
  Flame,
  Dna,
  ShieldCheck,
  User,
  Settings,
  LogOut
} from 'lucide-react';

const FinPilotApp: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isAuthenticated,
    isOnboarded,
    isLoadingWorkspace,
    addTransaction,
    currencySymbol,
    user,
    profile,
    signOut
  } = useFinPilot();

  // Public/Auth navigation state
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  // Workspace UI states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'settings' | 'security'>('profile');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [receiptScannerOpen, setReceiptScannerOpen] = useState(false);

  // Quick Add Form State
  const [quickAmount, setQuickAmount] = useState('');
  const [quickType, setQuickType] = useState<'expense' | 'income'>('expense');
  const [quickCategory, setQuickCategory] = useState('Food');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickMerchant, setQuickMerchant] = useState('');
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<PaymentMethod>('UPI');

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (!amt || isNaN(amt)) return;

    addTransaction({
      amount: amt,
      type: quickType,
      category: quickCategory,
      description: quickDesc || quickMerchant || (quickType === 'income' ? 'Income Credit' : 'Expense Debit'),
      merchant: quickMerchant,
      payment_method: quickPaymentMethod,
      date: new Date().toISOString().split('T')[0]
    });

    setQuickAmount('');
    setQuickDesc('');
    setQuickMerchant('');
    setQuickAddOpen(false);
  };

  // 1. STRICT AUTHENTICATION FIRST
  // Unauthenticated users MUST NEVER see the private workspace
  if (isAuthenticated && isLoadingWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showAuth) {
      return (
        <AuthPage
          initialMode={authMode}
          onBackToLanding={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      );
    }

    return (
      <LandingPage
        onGetStarted={() => {
          setAuthMode('signup');
          setShowAuth(true);
        }}
        onSignIn={() => {
          setAuthMode('signin');
          setShowAuth(true);
        }}
      />
    );
  }

  // 2. AUTHENTICATED PRIVATE WORKSPACE
  const navDrawerItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, isAi: true },
    { id: 'whatif', label: 'Simulator', icon: SlidersHorizontal },
    { id: 'mirror', label: 'Financial Mirror', icon: FileText },
    { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
    { id: 'leaks', label: 'Money Leaks', icon: Flame },
    { id: 'dna', label: 'Expense DNA', icon: Dna }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Desktop Left Fixed/Collapsible Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenProfile={() => {
          setProfileModalTab('profile');
          setProfileModalOpen(true);
        }}
        onOpenSettings={() => {
          setProfileModalTab('settings');
          setProfileModalOpen(true);
        }}
        onOpenSecurity={() => {
          setProfileModalTab('security');
          setProfileModalOpen(true);
        }}
        onOpenCopilot={() => setActiveView('copilot')}
      />

      {/* Main Workspace Frame (TopBar + Content View) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
        {/* Top Navigation Bar */}
        <TopBar
          onOpenQuickAdd={() => {
            setQuickType('expense');
            setQuickAddOpen(true);
          }}
          onOpenCopilot={() => setActiveView('copilot')}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenProfile={() => {
            setProfileModalTab('profile');
            setProfileModalOpen(true);
          }}
          onToggleMobileMenu={() => setMobileDrawerOpen(true)}
        />

        {/* Dynamic Workspace Views */}
        <main className="flex-1 overflow-x-hidden">
          {activeView === 'dashboard' && (
            <DashboardView
              onOpenQuickAdd={() => {
                setQuickType('expense');
                setQuickAddOpen(true);
              }}
              onOpenAddIncome={() => {
                setQuickType('income');
                setQuickCategory('Salary');
                setQuickAddOpen(true);
              }}
              onOpenCopilot={() => setActiveView('copilot')}
              onOpenScanReceipt={() => setReceiptScannerOpen(true)}
            />
          )}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'transactions' && <TransactionsView />}
          {activeView === 'budgets' && <BudgetsView />}
          {activeView === 'goals' && <GoalsView />}
          {activeView === 'subscriptions' && <SubscriptionsView />}
          {activeView === 'copilot' && (
            <AICopilotDrawer
              isOpen
              variant="page"
              onClose={() => setActiveView('dashboard')}
            />
          )}
          {activeView === 'cashflow' && <CashFlowView />}
          {activeView === 'whatif' && <WhatIfSimulatorView />}
          {activeView === 'leaks' && <MoneyLeakDetectorView />}
          {activeView === 'mirror' && <FinancialMirrorView />}
          {activeView === 'dna' && <ExpenseDNAView />}
        </main>
      </div>

      {/* Mobile Slide-out Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/80 backdrop-blur-sm">
          <div className="w-72 bg-neutral-950 border-r border-neutral-800 p-4 flex flex-col justify-between h-full animate-in slide-in-from-left">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-white text-sm">FinPilot Private Vault</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[70vh]">
                {navDrawerItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-neutral-800 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <button
                onClick={() => {
                  signOut();
                  setMobileDrawerOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/20 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        onOpenCopilot={() => setActiveView('copilot')}
        onOpenQuickAdd={() => {
          setQuickType('expense');
          setQuickAddOpen(true);
        }}
      />

      {/* Global Interactive Financial Search Modal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* User Profile, Settings, and Security Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        defaultTab={profileModalTab}
      />

      {/* Receipt OCR Scanner Modal */}
      <ReceiptScannerModal
        isOpen={receiptScannerOpen}
        onClose={() => setReceiptScannerOpen(false)}
        onAddTransaction={addTransaction}
      />

      {/* First-time Onboarding Modal */}
      <OnboardingModal
        isOpen={!isOnboarded}
        onComplete={() => {}}
      />

      {/* Quick Add Transaction Modal */}
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <button
              onClick={() => setQuickAddOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-white mb-4">
              {quickType === 'income' ? 'Record Income Credit' : 'Record Expense'}
            </h2>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setQuickType('expense')}
                  className={`py-1 text-xs font-semibold rounded-md transition-all ${
                    quickType === 'expense'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setQuickType('income')}
                  className={`py-1 text-xs font-semibold rounded-md transition-all ${
                    quickType === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  required
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none tabular-nums font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  placeholder={quickType === 'income' ? 'e.g. Monthly Salary / Client Invoice' : 'e.g. Swiggy Dinner / Grocery run'}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Merchant / Source</label>
                  <input
                    type="text"
                    value={quickMerchant}
                    onChange={(e) => setQuickMerchant(e.target.value)}
                    placeholder={quickType === 'income' ? 'e.g. Tech Corp' : 'e.g. Swiggy'}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {quickType === 'expense' ? (
                      <>
                        <option value="Food">Food</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Transport">Transport</option>
                        <option value="Bills">Bills</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Subscriptions">Subscriptions</option>
                        <option value="Health">Health</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Salary">Salary</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Investment">Investment</option>
                        <option value="Refund">Refund</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Payment Method</label>
                <select
                  value={quickPaymentMethod}
                  onChange={(e) => setQuickPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-md mt-2"
              >
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <FinPilotProvider>
      <FinPilotApp />
    </FinPilotProvider>
  );
}

export default App;