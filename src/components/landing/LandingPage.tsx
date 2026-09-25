// FinPilot Premium Public Landing Page
import React from 'react';
import { motion } from 'motion/react';
import { Logo } from '../brand/Logo';
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Sparkles,
  Lock,
  Layers,
  BarChart3,
  Bot,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-900/80 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white leading-none">FinPilot</span>
              <span className="text-[9px] tracking-wider text-emerald-400/90 font-mono mt-0.5">PRIVATE FINANCE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="relative overflow-hidden pt-20 pb-20 sm:pt-28 sm:pb-28 border-b border-neutral-900">
          {/* Subtle Background Glow Animation */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-emerald-500/10 blur-[140px]" />

          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            {/* Pill Label */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/70 px-3.5 py-1 text-xs text-neutral-300 mb-6 backdrop-blur-sm"
            >
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Personal Finance Hub · Private Financial Workspace</span>
            </motion.div>

            {/* Wordmark & Main Statement */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight"
            >
              FINPILOT
              <span className="block text-2xl sm:text-4xl font-semibold text-neutral-300 mt-2">
                Understand your money. Plan what comes next.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto max-w-2xl text-base sm:text-lg text-neutral-400 mb-10 leading-relaxed font-normal"
            >
              A private financial workspace that helps you track, analyze and understand your spending with deterministic precision and real AI reasoning.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5"
            >
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={onSignIn}
                className="w-full sm:w-auto rounded-xl border border-neutral-800 bg-neutral-900/60 px-6 py-3 text-sm font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Sign In
              </button>
            </motion.div>
          </div>

          {/* Floating UI Elements / Workspace Teaser */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto max-w-5xl px-4 sm:px-6 mt-16"
          >
            <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-4 sm:p-6 backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-neutral-500 ml-2 font-mono">finpilot.private/workspace</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Private Session</span>
                </div>
              </div>

              {/* 3 Metric Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider mb-1">
                    Deterministic Math
                  </div>
                  <div className="text-xl font-bold text-white tabular-nums">0% AI Hallucination</div>
                  <p className="text-[11px] text-neutral-500 mt-1">Verified formulas calculate balances & budgets</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider mb-1">
                    12 Deep Visualizations
                  </div>
                  <div className="text-xl font-bold text-white tabular-nums">Interactive Analytics</div>
                  <p className="text-[11px] text-neutral-500 mt-1">Cash flow forecasting & spending heatmaps</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider mb-1">
                    Groq Intelligence
                  </div>
                  <div className="text-xl font-bold text-white tabular-nums">Real Financial Copilot</div>
                  <p className="text-[11px] text-neutral-500 mt-1">Context-aware reasoning over your verified ledger</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 border-b border-neutral-900 bg-neutral-950/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                Engineered for total financial clarity
              </h2>
              <p className="text-sm text-neutral-400">
                A modern private workspace replacing scattered spreadsheets and noisy generic apps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Private Workspace Dashboard</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Personalized command center with real-time net balance, burn rate, upcoming bills, and quick transaction logging.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Groq-Powered Copilot</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Ask natural questions in plain English and receive structured answers, spending cards, and actionable recommendations.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Private & Isolated Storage</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Your financial data is strictly isolated to your verified account with Row Level Security and encrypted credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={18} />
            <span className="font-semibold text-neutral-300">FinPilot</span>
            <span>· Private Financial Workspace</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} FinPilot. All financial data strictly private.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
