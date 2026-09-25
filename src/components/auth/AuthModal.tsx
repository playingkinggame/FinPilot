// FinPilot Premium Fintech Authentication Modal
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinPilot } from '../../lib/supabase/context';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { Logo } from '../brand/Logo';
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, X, Sparkles, Shield } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin'
}) => {
  const { signIn, signUp, resetPassword } = useFinPilot();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate email
    const emailRes = emailSchema.safeParse(email);
    if (!emailRes.success) {
      setError(emailRes.error.issues[0].message);
      return;
    }

    if (mode !== 'forgot') {
      const passRes = passwordSchema.safeParse(password);
      if (!passRes.success) {
        setError(passRes.error.issues[0].message);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('Please provide your name');
          setLoading(false);
          return;
        }
        const res = await signUp(email, password, fullName);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Account provisioned! Welcome to FinPilot.');
          setTimeout(() => onClose(), 1200);
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Password recovery instructions dispatched.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/95 p-6 sm:p-8 shadow-2xl"
      >
        {/* Soft background glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Lockup */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <Logo size={48} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === 'signin' && 'Welcome back to FinPilot'}
            {mode === 'signup' && 'Create your FinPilot account'}
            {mode === 'forgot' && 'Reset your password'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs">
            {mode === 'signin' && 'Enter your credentials to access your verified ledger.'}
            {mode === 'signup' && 'Start taking control with AI-assisted personal finance.'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-neutral-950/80 rounded-lg border border-neutral-800/80 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'signin' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'signup' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Sharma"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-300">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors disabled:opacity-50 shadow-md"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create FinPilot Account'}
                  {mode === 'forgot' && 'Send Recovery Link'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* Backend Mode / Supabase Indicator Banner */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              {isSupabaseConfigured
                ? 'Connected to Supabase — cloud sync & real Google sign-in enabled'
                : 'Local Mode — data stored privately on this device'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-400 hover:underline font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
