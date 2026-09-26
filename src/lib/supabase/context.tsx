// FinPilot App State & Data Provider
// When Supabase is configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set), all financial
// data (profile, transactions, budgets, goals, subscriptions) is persisted to the Supabase
// Postgres database defined in supabase-schema.sql, scoped per-user via Row Level Security.
// When Supabase is NOT configured, the app falls back to a local browser account backed by
// localStorage so the product still works fully offline / without setup.
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './client';
import {
  Transaction,
  Budget,
  Goal,
  Subscription,
  Profile,
  FinancialInsight,
  ChatMessage
} from '../../types';
import { generateProactiveInsights } from '../ai/insights';

interface FinPilotContextType {
  user: any | null;
  profile: Profile;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isDemo: boolean;
  isLoadingWorkspace: boolean;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  subscriptions: Subscription[];
  insights: FinancialInsight[];
  chatMessages: ChatMessage[];
  currencySymbol: string;
  activeView: string;
  setActiveView: (view: string) => void;
  // Auth methods
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  completeOnboarding: (data: Partial<Profile>) => void;
  updateProfile: (data: Partial<Profile>) => void;
  // Transaction CRUD
  addTransaction: (t: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  duplicateTransaction: (id: string) => void;
  // Budgets
  addBudget: (b: Omit<Budget, 'id' | 'user_id'>) => void;
  updateBudget: (id: string, amount: number) => void;
  // Goals
  addGoal: (g: Omit<Goal, 'id' | 'user_id' | 'current_amount'>) => void;
  updateGoalAmount: (id: string, addedAmount: number) => void;
  // Subscriptions
  addSubscription: (s: Omit<Subscription, 'id' | 'user_id'>) => void;
  toggleSubscriptionActive: (id: string) => void;
  deleteSubscription: (id: string) => void;
  // Chat
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  // Workspace Data Controls
  clearWorkspace: () => void;
}

const FinPilotContext = createContext<FinPilotContextType | null>(null);

const DEFAULT_BLANK_PROFILE: Profile = {
  id: '',
  email: '',
  full_name: '',
  user_type: 'Professional',
  financial_goal: 'Financial Stability & Wealth Building',
  income_frequency: 'Monthly',
  currency: 'INR',
  currency_symbol: '₹',
  monthly_income_estimate: 0
};

// ---- Row <-> App model mappers (DB columns are snake_case and match our types 1:1 here,
// but the DB assigns UUID primary keys, so inserts never send a client-generated id) ----

const genLocalId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const FinPilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth User State - strictly null if not authenticated
  const [user, setUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('finpilot_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const savedUser = localStorage.getItem('finpilot_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const savedProfile = localStorage.getItem(`finpilot_profile_${u.id}`);
        if (savedProfile) return JSON.parse(savedProfile);
        return {
          ...DEFAULT_BLANK_PROFILE,
          id: u.id,
          email: u.email || '',
          full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User'
        };
      }
    } catch {}
    return DEFAULT_BLANK_PROFILE;
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('finpilot_onboarded');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState<boolean>(false);

  const [activeView, setActiveViewState] = useState<string>(() => {
    // Restore the last visited view on reload
    try {
      return window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  // Real navigation history: every view change pushes a history entry so the
  // browser Back/Forward buttons (and mouse back button) restore the previous view.
  const setActiveView = useCallback((view: string) => {
    const target = `#/${view}`;
    if (window.location.hash !== target) {
      window.location.hash = target; // pushes a history entry; hashchange listener syncs state
    } else {
      setActiveViewState(view);
    }
  }, []);

  useEffect(() => {
    const syncFromLocation = () => {
      const view = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
      setActiveViewState(view);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', syncFromLocation);
    return () => window.removeEventListener('hashchange', syncFromLocation);
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const savedUser = localStorage.getItem('finpilot_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const saved = localStorage.getItem(`finpilot_transactions_${u.id}`);
        if (saved) {
          const parsed: Transaction[] = JSON.parse(saved);
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const savedUser = localStorage.getItem('finpilot_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const saved = localStorage.getItem(`finpilot_budgets_${u.id}`);
        if (saved) {
          const parsed: Budget[] = JSON.parse(saved);
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const savedUser = localStorage.getItem('finpilot_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const saved = localStorage.getItem(`finpilot_goals_${u.id}`);
        if (saved) {
          const parsed: Goal[] = JSON.parse(saved);
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const savedUser = localStorage.getItem('finpilot_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const saved = localStorage.getItem(`finpilot_subscriptions_${u.id}`);
        if (saved) {
          const parsed: Subscription[] = JSON.parse(saved);
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg_welcome',
        sender: 'assistant',
        content: `Welcome to your Private Financial Workspace! I'm your FinPilot Copilot, powered by Groq. You can ask me questions about your spending, compare trends, test purchase affordability, or run calculations. How can I assist you today?`,
        timestamp: 'Just now'
      }
    ];
  });

  // ---- Demo Mode: sync state to user-specific localStorage keys ----
  useEffect(() => {
    if (!isSupabaseConfigured && user?.id) {
      localStorage.setItem(`finpilot_transactions_${user.id}`, JSON.stringify(transactions));
    }
  }, [transactions, user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured && user?.id) {
      localStorage.setItem(`finpilot_budgets_${user.id}`, JSON.stringify(budgets));
    }
  }, [budgets, user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured && user?.id) {
      localStorage.setItem(`finpilot_goals_${user.id}`, JSON.stringify(goals));
    }
  }, [goals, user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured && user?.id) {
      localStorage.setItem(`finpilot_subscriptions_${user.id}`, JSON.stringify(subscriptions));
    }
  }, [subscriptions, user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured && user?.id) {
      localStorage.setItem(`finpilot_profile_${user.id}`, JSON.stringify(profile));
    }
  }, [profile, user?.id]);

  useEffect(() => {
    localStorage.setItem('finpilot_onboarded', JSON.stringify(isOnboarded));
  }, [isOnboarded]);

  // Tracks which user id we've already fully loaded the workspace for, so that
  // Supabase auth events which do NOT represent a genuinely new sign-in (e.g. a
  // TOKEN_REFRESHED or a duplicate SIGNED_IN that supabase-js fires every time the
  // browser tab regains focus/visibility) don't re-trigger a full workspace reload
  // and the "Loading your workspace…" screen. Using a ref keeps this in sync with
  // the check performed synchronously inside the auth listener below, without
  // triggering re-subscription of the listener itself.
  const loadedUserIdRef = useRef<string | null>(null);

  // Handle Supabase Auth Session
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleUserLoggedIn(session.user);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!session?.user) {
          loadedUserIdRef.current = null;
          setUser(null);
          localStorage.removeItem('finpilot_user');
          return;
        }

        // supabase-js re-validates the session (and fires TOKEN_REFRESHED, and on
        // some browsers a repeat SIGNED_IN/INITIAL_SESSION) every time the tab
        // becomes visible again. None of these represent a new sign-in for a
        // *different* user, so if we've already loaded this exact user's
        // workspace, just keep the refreshed session/user in sync without
        // wiping the UI back to the loading screen and re-fetching everything.
        if (loadedUserIdRef.current === session.user.id) {
          setUser(session.user);
          localStorage.setItem('finpilot_user', JSON.stringify(session.user));
          return;
        }

        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Token refreshes never change which user is logged in; just sync the
          // (possibly first-load) user object without a full data reload.
          setUser(session.user);
          localStorage.setItem('finpilot_user', JSON.stringify(session.user));
          return;
        }

        loadedUserIdRef.current = session.user.id;
        handleUserLoggedIn(session.user);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Load everything for a user. In Supabase mode this reads straight from Postgres
  // (RLS-scoped to auth.uid()); in Demo Mode it reads from localStorage.
  const handleUserLoggedIn = async (loggedInUser: any) => {
    loadedUserIdRef.current = loggedInUser.id;
    setUser(loggedInUser);
    localStorage.setItem('finpilot_user', JSON.stringify(loggedInUser));

    if (isSupabaseConfigured && supabase) {
      setIsLoadingWorkspace(true);
      try {
        // Profile: fetch existing row, or create one on first login
        const { data: existingProfileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', loggedInUser.id)
          .maybeSingle();

        if (existingProfileRow) {
          setProfile({
            id: existingProfileRow.id,
            email: existingProfileRow.email,
            full_name: existingProfileRow.full_name || '',
            user_type: existingProfileRow.user_type,
            financial_goal: existingProfileRow.financial_goal,
            income_frequency: existingProfileRow.income_frequency,
            currency: existingProfileRow.currency,
            currency_symbol: existingProfileRow.currency_symbol,
            monthly_income_estimate: Number(existingProfileRow.monthly_income_estimate || 0)
          });
          setIsOnboarded(true);
        } else {
          const newP: Profile = {
            ...DEFAULT_BLANK_PROFILE,
            id: loggedInUser.id,
            email: loggedInUser.email || '',
            full_name: loggedInUser.user_metadata?.full_name || loggedInUser.email?.split('@')[0] || 'User'
          };
          const { error: insertErr } = await supabase.from('profiles').insert({
            id: newP.id,
            email: newP.email,
            full_name: newP.full_name,
            user_type: newP.user_type,
            financial_goal: newP.financial_goal,
            income_frequency: newP.income_frequency,
            currency: newP.currency,
            currency_symbol: newP.currency_symbol,
            monthly_income_estimate: newP.monthly_income_estimate
          });
          if (insertErr) console.error('Failed to create profile row:', insertErr.message);
          setProfile(newP);
          setIsOnboarded(false);
        }

        const [txRes, budgetRes, goalRes, subRes] = await Promise.all([
          supabase.from('transactions').select('*').eq('user_id', loggedInUser.id).order('date', { ascending: false }),
          supabase.from('budgets').select('*').eq('user_id', loggedInUser.id),
          supabase.from('goals').select('*').eq('user_id', loggedInUser.id),
          supabase.from('subscriptions').select('*').eq('user_id', loggedInUser.id)
        ]);

        if (txRes.error) console.error('Failed to load transactions:', txRes.error.message);
        if (budgetRes.error) console.error('Failed to load budgets:', budgetRes.error.message);
        if (goalRes.error) console.error('Failed to load goals:', goalRes.error.message);
        if (subRes.error) console.error('Failed to load subscriptions:', subRes.error.message);

        setTransactions((txRes.data as Transaction[]) || []);
        setBudgets((budgetRes.data as Budget[]) || []);
        setGoals((goalRes.data as Goal[]) || []);
        setSubscriptions((subRes.data as Subscription[]) || []);
      } catch (err: any) {
        console.error('Failed to load workspace from Supabase:', err?.message || err);
      } finally {
        setIsLoadingWorkspace(false);
      }
      return;
    }

    // ---- Demo Mode (localStorage) ----
    const existingProfile = localStorage.getItem(`finpilot_profile_${loggedInUser.id}`);
    if (existingProfile) {
      setProfile(JSON.parse(existingProfile));
    } else {
      const newP: Profile = {
        ...DEFAULT_BLANK_PROFILE,
        id: loggedInUser.id,
        email: loggedInUser.email || '',
        full_name: loggedInUser.user_metadata?.full_name || loggedInUser.email?.split('@')[0] || 'User'
      };
      setProfile(newP);
      localStorage.setItem(`finpilot_profile_${loggedInUser.id}`, JSON.stringify(newP));
    }

    const savedTx = localStorage.getItem(`finpilot_transactions_${loggedInUser.id}`);
    setTransactions(savedTx ? JSON.parse(savedTx) : []);

    const savedB = localStorage.getItem(`finpilot_budgets_${loggedInUser.id}`);
    setBudgets(savedB ? JSON.parse(savedB) : []);

    const savedG = localStorage.getItem(`finpilot_goals_${loggedInUser.id}`);
    setGoals(savedG ? JSON.parse(savedG) : []);

    const savedS = localStorage.getItem(`finpilot_subscriptions_${loggedInUser.id}`);
    setSubscriptions(savedS ? JSON.parse(savedS) : []);
  };

  const insights = generateProactiveInsights(transactions, budgets, subscriptions);

  // Auth Methods
  const signIn = async (email: string, pass: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error: error.message };
      if (data.user) {
        await handleUserLoggedIn(data.user);
      }
      return {};
    } else {
      // Local Authenticated User Flow (Demo Mode)
      const mockId = 'usr_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const savedUsersRaw = localStorage.getItem('finpilot_accounts') || '{}';
      const accounts = JSON.parse(savedUsersRaw);

      const existingAccount = accounts[email];
      if (existingAccount && existingAccount.password !== pass) {
        return { error: 'Invalid password. Please check your credentials.' };
      }

      const activeUser = {
        id: existingAccount?.id || mockId,
        email,
        user_metadata: {
          full_name: existingAccount?.full_name || email.split('@')[0]
        }
      };

      if (!existingAccount) {
        accounts[email] = {
          id: mockId,
          email,
          password: pass,
          full_name: email.split('@')[0]
        };
        localStorage.setItem('finpilot_accounts', JSON.stringify(accounts));
      }

      await handleUserLoggedIn(activeUser);
      return {};
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name } }
      });
      if (error) return { error: error.message };
      const createdUser = data.user;
      if (createdUser) {
        // If email confirmation is required, Supabase won't return a session yet;
        // handleUserLoggedIn still works off the returned user object for profile creation.
        await handleUserLoggedIn(createdUser);
        setIsOnboarded(false);
        if (!data.session) {
          return { error: 'Account created! Please check your email to confirm your address before signing in.' };
        }
      }
      return {};
    } else {
      const mockId = 'usr_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const savedUsersRaw = localStorage.getItem('finpilot_accounts') || '{}';
      const accounts = JSON.parse(savedUsersRaw);

      if (accounts[email]) {
        return { error: 'An account with this email already exists. Please sign in.' };
      }

      accounts[email] = {
        id: mockId,
        email,
        password: pass,
        full_name: name
      };
      localStorage.setItem('finpilot_accounts', JSON.stringify(accounts));

      const newUser = {
        id: mockId,
        email,
        user_metadata: { full_name: name }
      };

      await handleUserLoggedIn(newUser);
      setIsOnboarded(false);
      return {};
    }
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      // Real Google OAuth via Supabase. Requires the Google provider to be enabled in
      // Supabase (Authentication -> Providers -> Google) with your own Google Cloud OAuth
      // credentials. Supabase redirects the browser to Google, then back to this app.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) return { error: error.message };
      return {};
    }

    // No backend configured — a real Google OAuth flow is impossible without one.
    // We refuse to fake it: no throwaway guest accounts masquerading as Google sign-ins.
    return {
      error:
        'Real Google sign-in needs the Supabase backend. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (with the Google provider enabled in Supabase Auth), then try again — or use email sign-up.'
    };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    loadedUserIdRef.current = null;
    setUser(null);
    localStorage.removeItem('finpilot_user');
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setSubscriptions([]);
    setProfile(DEFAULT_BLANK_PROFILE);
    // Reset history to the dashboard without leaving stale workspace views behind
    window.location.hash = '#/dashboard';
    setActiveViewState('dashboard');
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { error: error.message };
      return {};
    }
    return {};
  };

  const completeOnboarding = (data: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...data };
      if (isSupabaseConfigured && supabase && user?.id) {
        supabase
          .from('profiles')
          .update({
            full_name: next.full_name,
            user_type: next.user_type,
            financial_goal: next.financial_goal,
            income_frequency: next.income_frequency,
            currency: next.currency,
            currency_symbol: next.currency_symbol,
            monthly_income_estimate: next.monthly_income_estimate,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) console.error('Failed to save profile:', error.message);
          });
      }
      return next;
    });
    setIsOnboarded(true);
  };

  const updateProfile = (data: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...data };
      if (isSupabaseConfigured && supabase && user?.id) {
        supabase
          .from('profiles')
          .update({
            full_name: next.full_name,
            user_type: next.user_type,
            financial_goal: next.financial_goal,
            income_frequency: next.income_frequency,
            currency: next.currency,
            currency_symbol: next.currency_symbol,
            monthly_income_estimate: next.monthly_income_estimate,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) console.error('Failed to save profile:', error.message);
          });
      }
      return next;
    });
  };

  // ---- Transaction Actions ----
  const addTransaction = (t: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    const tempId = genLocalId('tx');
    const optimistic: Transaction = {
      ...t,
      id: tempId,
      user_id: user?.id || 'usr_anon',
      created_at: new Date().toISOString()
    };
    setTransactions((prev) => [optimistic, ...prev]);

    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: t.amount,
          type: t.type,
          category: t.category,
          merchant: t.merchant,
          description: t.description,
          date: t.date,
          payment_method: t.payment_method,
          notes: t.notes,
          receipt_url: t.receipt_url,
          is_recurring: t.is_recurring || false
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Failed to save transaction:', error.message);
            return;
          }
          if (data) {
            setTransactions((prev) => prev.map((row) => (row.id === tempId ? (data as Transaction) : row)));
          }
        });
    }
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated, updated_at: new Date().toISOString() } : t))
    );
    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('transactions')
        .update({ ...updated, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Failed to update transaction:', error.message);
        });
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Failed to delete transaction:', error.message);
        });
    }
  };

  const duplicateTransaction = (id: string) => {
    const orig = transactions.find((t) => t.id === id);
    if (!orig) return;
    const { id: _origId, created_at: _origCreated, user_id: _origUser, ...rest } = orig;
    addTransaction({
      ...rest,
      description: `${orig.description} (Copy)`
    } as Omit<Transaction, 'id' | 'created_at' | 'user_id'>);
  };

  // ---- Budget Actions ----
  const addBudget = (b: Omit<Budget, 'id' | 'user_id'>) => {
    const tempId = genLocalId('b');
    const optimistic: Budget = { ...b, id: tempId, user_id: user?.id || 'usr_anon' };
    setBudgets((prev) => [...prev, optimistic]);

    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('budgets')
        .upsert(
          { user_id: user.id, category: b.category, amount: b.amount, period: b.period },
          { onConflict: 'user_id,category,period' }
        )
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Failed to save budget:', error.message);
            return;
          }
          if (data) {
            setBudgets((prev) => {
              const withoutTemp = prev.filter((row) => row.id !== tempId);
              const withoutDupe = withoutTemp.filter((row) => row.id !== (data as Budget).id);
              return [...withoutDupe, data as Budget];
            });
          }
        });
    }
  };

  const updateBudget = (id: string, amount: number) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, amount } : b)));
    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('budgets')
        .update({ amount, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Failed to update budget:', error.message);
        });
    }
  };

  // ---- Goal Actions ----
  const addGoal = (g: Omit<Goal, 'id' | 'user_id' | 'current_amount'>) => {
    const tempId = genLocalId('g');
    const optimistic: Goal = {
      ...g,
      id: tempId,
      user_id: user?.id || 'usr_anon',
      current_amount: 0,
      created_at: new Date().toISOString()
    };
    setGoals((prev) => [...prev, optimistic]);

    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: g.name,
          target_amount: g.target_amount,
          current_amount: 0,
          deadline: g.deadline,
          description: g.description,
          category: g.category,
          color: g.color
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Failed to save goal:', error.message);
            // Roll back the optimistic row instead of leaving a "phantom" goal that
            // only vanishes on the next refresh once we re-fetch from the DB. This
            // surfaces save failures (e.g. a schema mismatch) immediately in the UI.
            setGoals((prev) => prev.filter((row) => row.id !== tempId));
            return;
          }
          if (data) {
            setGoals((prev) => prev.map((row) => (row.id === tempId ? (data as Goal) : row)));
          }
        });
    }
  };

  const updateGoalAmount = (id: string, added: number) => {
    let newAmount = 0;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        newAmount = Math.max(0, g.current_amount + added);
        return { ...g, current_amount: newAmount };
      })
    );
    if (isSupabaseConfigured && supabase && user?.id) {
      // Slight delay-free read of computed value via closure above; Supabase update runs after state calc.
      supabase
        .from('goals')
        .update({ current_amount: newAmount, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Failed to update goal:', error.message);
        });
    }
  };

  // ---- Subscriptions Actions ----
  const addSubscription = (s: Omit<Subscription, 'id' | 'user_id'>) => {
    const tempId = genLocalId('sub');
    const optimistic: Subscription = { ...s, id: tempId, user_id: user?.id || 'usr_anon' };
    setSubscriptions((prev) => [...prev, optimistic]);

    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          service: s.service,
          amount: s.amount,
          billing_cycle: s.billing_cycle,
          next_billing_date: s.next_billing_date,
          category: s.category,
          payment_method: s.payment_method,
          is_active: s.is_active,
          notes: s.notes
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Failed to save subscription:', error.message);
            return;
          }
          if (data) {
            setSubscriptions((prev) => prev.map((row) => (row.id === tempId ? (data as Subscription) : row)));
          }
        });
    }
  };

  const toggleSubscriptionActive = (id: string) => {
    let nextActive = false;
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        nextActive = !s.is_active;
        return { ...s, is_active: nextActive };
      })
    );
    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('subscriptions')
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Failed to update subscription:', error.message);
        });
    }
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Failed to delete subscription:', error.message);
        });
    }
  };

  // ---- Chat Actions (kept local/ephemeral — not persisted server-side) ----
  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'assistant',
        content: `Chat history cleared. How can I help analyze your private workspace finances today?`,
        timestamp: 'Just now'
      }
    ]);
  };

  // Clear workspace back to clean empty state
  const clearWorkspace = () => {
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setSubscriptions([]);

    if (isSupabaseConfigured && supabase && user?.id) {
      const uid = user.id;
      Promise.all([
        supabase.from('transactions').delete().eq('user_id', uid),
        supabase.from('budgets').delete().eq('user_id', uid),
        supabase.from('goals').delete().eq('user_id', uid),
        supabase.from('subscriptions').delete().eq('user_id', uid)
      ]).then((results) => {
        results.forEach((r) => {
          if (r.error) console.error('Failed to clear workspace data:', r.error.message);
        });
      });
      return;
    }

    if (user?.id) {
      localStorage.removeItem(`finpilot_transactions_${user.id}`);
      localStorage.removeItem(`finpilot_budgets_${user.id}`);
      localStorage.removeItem(`finpilot_goals_${user.id}`);
      localStorage.removeItem(`finpilot_subscriptions_${user.id}`);
    }
  };

  return (
    <FinPilotContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: Boolean(user),
        isOnboarded,
        isDemo: !isSupabaseConfigured,
        isLoadingWorkspace,
        transactions,
        budgets,
        goals,
        subscriptions,
        insights,
        chatMessages,
        currencySymbol: profile.currency_symbol || '₹',
        activeView,
        setActiveView,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        completeOnboarding,
        updateProfile,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        duplicateTransaction,
        addBudget,
        updateBudget,
        addGoal,
        updateGoalAmount,
        addSubscription,
        toggleSubscriptionActive,
        deleteSubscription,
        addChatMessage,
        clearChat,
        clearWorkspace
      }}
    >
      {children}
    </FinPilotContext.Provider>
  );
};

export const useFinPilot = (): FinPilotContextType => {
  const context = useContext(FinPilotContext);
  if (!context) {
    throw new Error('useFinPilot must be used within a FinPilotProvider');
  }
  return context;
};