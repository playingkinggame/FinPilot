// FinPilot Immersive Split Authentication Experience
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinPilot } from '../../lib/supabase/context';
import { Logo } from '../brand/Logo';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Shield,
  Sparkles,
  ArrowLeft,
  MailCheck
} from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../../lib/supabase/client';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

interface AuthPageProps {
  initialMode?: 'signin' | 'signup' | 'forgot';
  onBackToLanding?: () => void;
  onSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signup',
  onBackToLanding,
  onSuccess
}) => {
  const { signIn, signUp, signInWithGoogle, resetPassword, isDemo } = useFinPilot();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // When set, a dedicated "confirm your email" screen replaces the form below.
  // Supabase requires the person to click the link in their confirmation email
  // before a real session exists — this screen is that required step, shown
  // BEFORE they can ever reach onboarding (previously signUp() skipped straight
  // to onboarding without this, even though the person hadn't verified anything).
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleResendConfirmation = async () => {
    if (!pendingConfirmationEmail || !supabase) return;
    setResendStatus('sending');
    try {
      await supabase.auth.resend({ type: 'signup', email: pendingConfirmationEmail });
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(password);

  const getStrengthLabel = (score: number) => {
    if (!password) return { label: 'Empty', color: 'bg-neutral-800' };
    if (score <= 2) return { label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { label: 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-emerald-500' };
  };

  const strengthInfo = getStrengthLabel(passwordStrength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate email
    const emailRes = emailSchema.safeParse(email.trim());
    if (!emailRes.success) {
      setError(emailRes.error.issues[0].message);
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        return;
      }
      const passRes = passwordSchema.safeParse(password);
      if (!passRes.success) {
        setError(passRes.error.issues[0].message);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);
      try {
        const res = await signUp(email.trim(), password, fullName.trim());
        if (res.error) {
          setError(res.error);
        } else if (res.needsConfirmation) {
          // Not actually signed in yet — do NOT call onSuccess() (that would
          // route back into the app). Show the confirm-email screen instead.
          setPendingConfirmationEmail(email.trim());
        } else {
          setSuccessMessage('Workspace initialized successfully! Welcome to FinPilot.');
          if (onSuccess) onSuccess();
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to create your private account.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'signin') {
      const passRes = passwordSchema.safeParse(password);
      if (!passRes.success) {
        setError(passRes.error.issues[0].message);
        return;
      }

      setLoading(true);
      try {
        const res = await signIn(email.trim(), password);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Welcome back! Entering private workspace...');
          if (onSuccess) onSuccess();
        }
      } catch (err: any) {
        setError(err?.message || 'Sign in failed. Please verify credentials.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      setLoading(true);
      try {
        const res = await resetPassword(email.trim());
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Password recovery link has been dispatched to your email.');
        }
      } catch (err: any) {
        setError(err?.message || 'Password reset request failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithGoogle();
      if (res.error) {
        setError(res.error);
        return;
      }
      // In real Supabase mode this triggers a full-page redirect to Google, so nothing
      // after this line runs. Without a backend there is no Google flow — the context
      // returns a clear configuration error instead of faking an account.
      if (res.error) return;
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header bar with navigation back */}
      <div className="w-full border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-none">FinPilot</span>
            <span className="text-[10px] tracking-wider text-emerald-400/90 font-mono mt-0.5">PRIVATE FINANCE</span>
          </div>
        </div>

        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </button>
        )}
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12 items-center gap-12">
        {/* LEFT SIDE: Immersive Visuals & Financial Statements */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1 text-xs text-neutral-300 w-fit">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Private Financial Workspace</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              YOUR MONEY.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                UNDERSTOOD.
              </span>
            </h1>
            <p className="text-sm xl:text-base text-neutral-400 leading-relaxed max-w-md">
              A private financial environment designed to monitor burn velocity, detect money leaks, project cash flow, and answer any financial question with deterministic precision.
            </p>
          </div>

          {/* Floating Financial Cards with subtle animations */}
          <div className="space-y-3 pt-4">
            {/* Net Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm rounded-xl border border-neutral-800/90 bg-neutral-900/80 p-4 shadow-xl backdrop-blur-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 font-medium">Net Cash Balance</div>
                  <div className="text-xl font-bold text-white tracking-tight tabular-nums">₹78,642</div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center text-xs font-semibold text-emerald-400">
                  +18% Savings
                </span>
                <p className="text-[10px] text-neutral-500 mt-0.5">Surplus pacing</p>
              </div>
            </motion.div>

            {/* Food Expense Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-sm rounded-xl border border-neutral-800/90 bg-neutral-900/60 p-4 shadow-lg backdrop-blur-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold">
                  FD
                </div>
                <div>
                  <div className="text-xs text-neutral-400 font-medium">Food & Dining</div>
                  <div className="text-lg font-bold text-white tracking-tight tabular-nums">₹6,240</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-neutral-300 font-medium">21 Transactions</span>
                <p className="text-[10px] text-neutral-500 mt-0.5">Swiggy · Zomato</p>
              </div>
            </motion.div>

            {/* AI Insight Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-sm rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 flex items-center gap-2.5 text-xs text-neutral-300"
            >
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Zero hallucinations. Pure deterministic calculation + Groq LLM reasoning.</span>
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT SIDE: Authentication Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

            {pendingConfirmationEmail ? (
              // ---- "Confirm your email" screen ----
              // This is the real next step after sign-up (Supabase needs the
              // email confirmed before a session exists). It now comes before
              // the setup wizard instead of being skipped entirely.
              <div className="flex flex-col items-center text-center py-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <MailCheck className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">Check your email</h2>
                <p className="text-xs text-neutral-400 mt-2 max-w-xs">We sent a confirmation link to</p>
                <p className="text-sm font-semibold text-white mt-1 mb-4 break-all">{pendingConfirmationEmail}</p>
                <p className="text-xs text-neutral-400 max-w-xs mb-6">
                  Click the link in that email to verify your address. Once confirmed, sign in below — that's
                  when your FinPilot setup begins.
                </p>

                {resendStatus === 'sent' ? (
                  <p className="text-xs text-emerald-400 font-medium mb-4">Confirmation email resent — check your inbox.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendStatus === 'sending'}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50 mb-4"
                  >
                    {resendStatus === 'sending' ? 'Resending…' : "Didn't get it? Resend email"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPendingConfirmationEmail(null);
                    setResendStatus('idle');
                    setMode('signin');
                    setPassword('');
                    setConfirmPassword('');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  <span>I've confirmed — Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
            <>
            {/* Mode Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {mode === 'signup' && 'Create your FinPilot'}
                  {mode === 'signin' && 'Welcome back'}
                  {mode === 'forgot' && 'Reset your password'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400">
                {mode === 'signup' && 'Your private financial workspace starts here.'}
                {mode === 'signin' && 'Enter your private financial workspace.'}
                {mode === 'forgot' && 'Enter your verified email address to receive reset instructions.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            {mode !== 'forgot' && (
              <div className="grid grid-cols-2 p-1 rounded-lg bg-neutral-950 border border-neutral-800 mb-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className={`py-2 rounded-md transition-all ${
                    mode === 'signup'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className={`py-2 rounded-md transition-all ${
                    mode === 'signin'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Error & Success Alerts */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yathin Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="yathin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-neutral-300">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 pl-9 pr-10 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator for Sign Up */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-neutral-400">Strength:</span>
                        <span className="font-semibold text-neutral-200">{strengthInfo.label}</span>
                      </div>
                      <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full ${strengthInfo.color} transition-all duration-300`}
                          style={{ width: `${Math.min(100, (passwordStrength / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 pl-9 pr-10 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signin' && (
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-xs text-neutral-400">Remember this device</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-sm mt-2"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
                ) : (
                  <>
                    <span>
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'forgot' && 'Send Reset Link'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            {mode !== 'forgot' && (
              <>
                <div className="relative my-6 text-center text-xs">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800" />
                  </div>
                  <span className="relative bg-neutral-900 px-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                    OR
                  </span>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
                {isDemo && (
                  <p className="mt-2 text-center text-[11px] text-neutral-500">
                    Real Google sign-in requires the Supabase backend (VITE_SUPABASE_URL +
                    VITE_SUPABASE_ANON_KEY with the Google provider enabled). Until then, use
                    email sign-up — your data stays on this device either way.
                  </p>
                )}
              </>
            )}

            {/* Footer link to switch */}
            <div className="mt-6 text-center text-xs text-neutral-400">
              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="font-semibold text-emerald-400 hover:underline ml-1"
                  >
                    Sign In
                  </button>
                </p>
              )}
              {mode === 'signin' && (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="font-semibold text-emerald-400 hover:underline ml-1"
                  >
                    Create one
                  </button>
                </p>
              )}
              {mode === 'forgot' && (
                <p>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="font-semibold text-emerald-400 hover:underline ml-1"
                  >
                    Return to Sign In
                  </button>
                </p>
              )}
            </div>
            </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};