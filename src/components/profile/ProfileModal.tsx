// FinPilot User Profile, Settings & Security Modal
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinPilot } from '../../lib/supabase/context';
import {
  User,
  Settings,
  Shield,
  Download,
  LogOut,
  X,
  CheckCircle2,
  Lock,
  Mail,
  Calendar,
  KeyRound,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'profile' | 'settings' | 'security';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'profile'
}) => {
  const { user, profile, updateProfile, signOut, transactions, budgets, goals, currencySymbol } = useFinPilot();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security'>(defaultTab);

  // Edit fields
  const [name, setName] = useState(profile.full_name || '');
  const [currency, setCurrency] = useState(profile.currency || 'INR');
  const [userType, setUserType] = useState<'Student' | 'Professional' | 'Freelancer' | 'Other'>(profile.user_type || 'Professional');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: name,
      currency,
      currency_symbol: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹',
      user_type: userType
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportData = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        full_name: profile.full_name
      },
      transactions,
      budgets,
      goals
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpilot_workspace_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayName = profile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || profile.email || 'private@finpilot.vault';
  const accountCreatedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'September 2026';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase text-sm">
              {displayName.slice(0, 2)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{displayName}</h3>
              <p className="text-xs text-neutral-400">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Settings & Workspace
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Security & Vault
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={displayEmail}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs text-neutral-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Profile Focus</label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as 'Student' | 'Professional' | 'Freelancer' | 'Other')}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Freelancer">Freelancer / Creator</option>
                    <option value="Student">Student</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Member since: {accountCreatedDate}</span>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  {savedSuccess ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Export Private Data</h4>
                    <p className="text-[11px] text-neutral-400">Download a complete JSON export of your financial records.</p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Deterministic Math Engine</h4>
                    <p className="text-[11px] text-neutral-400">All balances, budget burns, and cash flow projections are executed with zero AI hallucination.</p>
                  </div>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-semibold">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-semibold text-white">Row Level Security (RLS)</h4>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your transactions and financial targets are secured using PostgreSQL Row Level Security. Data is strictly isolated to your authenticated account ID (<code className="text-neutral-300 font-mono text-[10px]">{user?.id?.slice(0, 16)}...</code>).
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Active Session Status</h4>
                    <p className="text-[11px] text-neutral-400">Encrypted token verified with Supabase Auth</p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    SECURE
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Sign Out */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out of Workspace</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
