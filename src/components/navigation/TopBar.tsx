// FinPilot Private Financial Workspace Top Bar
import React, { useState } from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import {
  Search,
  Sparkles,
  Plus,
  Bell,
  User,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Settings,
  Shield,
  Menu
} from 'lucide-react';

interface TopBarProps {
  onOpenQuickAdd: () => void;
  onOpenCopilot: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenQuickAdd,
  onOpenCopilot,
  onOpenSearch,
  onOpenProfile,
  onToggleMobileMenu
}) => {
  const { user, profile, signOut } = useFinPilot();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const displayName = profile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || profile.email || 'private@finpilot.vault';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Menu Toggle + Global Search Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Global Search Bar (Ctrl + K) */}
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between rounded-xl border border-neutral-800/90 bg-neutral-900/60 hover:bg-neutral-900 px-3.5 py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors shadow-inner"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">Search transactions, merchants, categories...</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 pl-2 shrink-0">
              <kbd className="rounded bg-neutral-800 border border-neutral-700/80 px-1.5 py-0.5 text-[10px] font-mono text-neutral-300">
                Ctrl + K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Workspace Indicator, Notifications, AI Copilot, Add Tx, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 ml-4">
          {/* Workspace Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs font-medium text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Private Workspace</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileDropdownOpen(false);
              }}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 relative transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
                  <h4 className="text-xs font-semibold text-white">Notifications</h4>
                  <span className="text-[10px] text-emerald-400 font-mono">Workspace Status</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800">
                    <p className="font-semibold text-white text-[11px]">Private Ledger Active</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Your calculations are verified locally with deterministic mathematics.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800">
                    <p className="font-semibold text-white text-[11px]">Groq Intelligence Connected</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Natural language copilot is armed for structured inquiries.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Copilot Action */}
          <button
            onClick={onOpenCopilot}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-300 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>AI Copilot</span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-neutral-900 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
                {displayName.slice(0, 2)}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-neutral-800 mb-1">
                  <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{displayEmail}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-mono">Private Vault</span>
                  </div>
                </div>

                <div className="space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
                  >
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
                  >
                    <Settings className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Settings & Export</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
                  >
                    <Shield className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Security Status</span>
                  </button>



                  <div className="pt-1 mt-1 border-t border-neutral-800">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
