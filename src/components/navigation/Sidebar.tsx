// FinPilot Private Financial Workspace Sidebar
import React from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { Logo } from '../brand/Logo';
import {
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
  User,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenSecurity: () => void;
  onOpenCopilot: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onOpenProfile,
  onOpenSettings,
  onOpenSecurity,
  onOpenCopilot
}) => {
  const {
    activeView,
    setActiveView,
    profile,
    user,
    signOut,
    clearWorkspace
  } = useFinPilot();

  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, isSpecial: true },
    { id: 'whatif', label: 'Simulator', icon: SlidersHorizontal },
    { id: 'mirror', label: 'Financial Mirror', icon: FileText },
    { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
    { id: 'leaks', label: 'Money Leaks', icon: Flame },
    { id: 'dna', label: 'Expense DNA', icon: Dna }
  ];

  const handleNavClick = (id: string) => {
    if (id === 'copilot') {
      onOpenCopilot();
      return;
    }
    setActiveView(id);
  };

  const displayName = profile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || profile.email || 'private@finpilot.vault';

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-neutral-800/80 bg-neutral-950/95 transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-800/80">
        <button
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-3 overflow-hidden text-left focus:outline-none"
        >
          <Logo size={36} />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">FINPILOT</span>
              <span className="text-[9px] font-mono tracking-wider text-emerald-400 font-semibold mt-1">
                PRIVATE FINANCE
              </span>
            </div>
          )}
        </button>

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800">
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Workspace
            </div>
          )}
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-neutral-800/90 text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : item.isSpecial ? 'text-emerald-400/80' : 'text-neutral-400'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.isSpecial && (
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono font-medium text-emerald-400">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace Management Section */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-1">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Settings & Vault
            </div>
          )}
          <button
            onClick={onOpenProfile}
            title={collapsed ? 'Profile' : undefined}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 transition-colors"
          >
            <User className="h-4 w-4 shrink-0 text-neutral-400" />
            {!collapsed && <span>Profile</span>}
          </button>

          <button
            onClick={onOpenSettings}
            title={collapsed ? 'Settings' : undefined}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 transition-colors"
          >
            <Settings className="h-4 w-4 shrink-0 text-neutral-400" />
            {!collapsed && <span>Settings</span>}
          </button>

          <button
            onClick={onOpenSecurity}
            title={collapsed ? 'Security' : undefined}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 transition-colors"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-400" />
            {!collapsed && <span>Security</span>}
          </button>
        </div>

        {/* Clear Workspace Banner */}
        {!collapsed && (
          <div className="pt-2 border-t border-neutral-800/80">
            <button
              onClick={clearWorkspace}
              className="w-full text-left rounded-lg border border-neutral-800 bg-neutral-900/40 p-2.5 text-[11px] text-neutral-400 hover:text-neutral-200 hover:border-rose-500/30 transition-colors"
            >
              <span className="font-semibold text-neutral-300 block mb-0.5">Clear Workspace</span>
              <span className="text-[10px] text-neutral-500 block">Delete all transactions, budgets, goals and subscriptions</span>
            </button>
          </div>
        )}
      </div>

      {/* User Profile Card at Bottom */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 overflow-hidden text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
              {displayName.slice(0, 2)}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{displayName}</span>
                <span className="text-[10px] text-neutral-400 truncate">{displayEmail}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-mono">Private Vault</span>
                </div>
              </div>
            )}
          </button>

          {!collapsed && (
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
