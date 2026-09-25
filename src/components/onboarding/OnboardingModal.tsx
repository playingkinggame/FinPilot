// FinPilot 5-Step Guided Onboarding Modal
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useFinPilot } from '../../lib/supabase/context';
import { Compass, User, Briefcase, Target, Calendar, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Profile } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { profile, completeOnboarding } = useFinPilot();
  const [step, setStep] = useState(1);

  const [name, setName] = useState(profile.full_name || 'Alex Sharma');
  const [userType, setUserType] = useState<Profile['user_type']>(profile.user_type || 'Professional');
  const [goal, setGoal] = useState(profile.financial_goal || 'Build emergency fund & invest');
  const [frequency, setFrequency] = useState<Profile['income_frequency']>(profile.income_frequency || 'Monthly');
  const [income, setIncome] = useState(profile.monthly_income_estimate || 60000);
  const [currencySymbol, setCurrencySymbol] = useState(profile.currency_symbol || '₹');

  if (!isOpen) return null;

  const handleFinish = () => {
    completeOnboarding({
      full_name: name,
      user_type: userType,
      financial_goal: goal,
      income_frequency: frequency,
      monthly_income_estimate: Number(income),
      currency_symbol: currencySymbol
    });
    onComplete();
  };

  const userTypeOptions: Array<{ id: Profile['user_type']; title: string; desc: string }> = [
    { id: 'Student', title: 'Student', desc: 'Managing allowances, education loans, and part-time earnings' },
    { id: 'Professional', title: 'Professional', desc: 'Salaried career with monthly compensation, PF, and tax planning' },
    { id: 'Freelancer', title: 'Freelancer / Contractor', desc: 'Variable multi-client billings and irregular cash flows' },
    { id: 'Other', title: 'Creator / Entrepreneur', desc: 'Business distributions, equity draws, and mixed capital' }
  ];

  const goalOptions = [
    'Build 6-month emergency reserve',
    'Track and eliminate food & convenience money leaks',
    'Save for a major purchase (MacBook, Vehicle, Home)',
    'Accelerate investment & retirement compounding',
    'Optimize subscription expenses & monthly bills'
  ];

  const frequencyOptions: Array<Profile['income_frequency']> = ['Monthly', 'Bi-weekly', 'Weekly', 'Variable'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl"
      >
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              FinPilot Setup · Step {step} of 5
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-emerald-500' : i < step ? 'w-2 bg-emerald-700' : 'w-2 bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* NOTE: no AnimatePresence here — its mode="wait" blocks the next step until the
            previous step's exit animation completes, which permanently blanks the modal when
            animations are throttled (embedded webviews / background tabs). Simple keyed mounts
            keep the enter animation and can never get stuck. */}
        <div key={`step-wrapper-${step}`}>
          {/* Step 1: Name */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold text-white">What should we call you?</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  FinPilot customizes your reports, dashboards, and AI copilot conversations with your name.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Sharma"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 pl-9 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: User Type */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold text-white">Which profile describes you best?</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  This adjusts our cash-flow forecasting logic and budget models.
                </p>
              </div>

              <div className="space-y-2">
                {userTypeOptions.map((opt) => {
                  const isSelected = userType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setUserType(opt.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                          {opt.title}
                        </span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Financial Goal */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold text-white">What is your primary financial focus?</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  FinPilot AI will benchmark your monthly surplus and suggest prioritized actions.
                </p>
              </div>

              <div className="space-y-2">
                {goalOptions.map((g) => {
                  const isSelected = goal === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Income Frequency */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold text-white">Income cadence & currency</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Configures the timeline intervals in the Cash Flow projection engine.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Income Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencyOptions.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                        frequency === f
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                          : 'border-neutral-800 bg-neutral-950/50 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Estimated Monthly Inflow ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none tabular-nums"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Ready to enter */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center space-y-4 py-2"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Your FinPilot OS is Ready</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  We've configured your deterministic analytics engine, Groq AI Copilot integration, and verified your initial ledger.
                </p>
              </div>

              <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 text-left text-xs space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Ledger User:</span>
                  <span className="text-white font-medium">{name}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Profile Type:</span>
                  <span className="text-white font-medium">{userType}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Target Objective:</span>
                  <span className="text-emerald-400 font-medium truncate max-w-[200px]">{goal}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleFinish}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-all shadow-lg"
                >
                  <span>Enter FinPilot</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
