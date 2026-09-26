# FinPilot — Private Financial Operating System

FinPilot is a modern, AI-assisted personal finance workspace: track transactions, budgets,
goals and subscriptions, visualize cash flow, and ask an AI copilot (powered by Groq)
questions about your own money — all backed by your own private Supabase database with
row-level security, so your data belongs to you alone.

## Features

- 📊 Dashboard, analytics, cash flow, "What-If" simulator, money-leak detector, expense DNA
- 💳 Transactions, budgets, goals and recurring subscriptions with full CRUD
- 🤖 AI Copilot chat and receipt scanning powered by Groq
- 🔐 Email/password auth and real Google Sign-In via Supabase Auth
- 🗄️ Postgres schema with Row Level Security — every row is scoped to `auth.uid()`
- 🧪 Works fully offline in **Demo Mode** (local browser storage) if you don't configure Supabase

## Tech Stack

React 19 + TypeScript + Vite, Tailwind CSS, Supabase (Postgres + Auth), Groq (AI), Express
(local dev/prod server), deployable to Vercel out of the box.

## Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project (for real accounts + real Google sign-in)
- A free [Groq](https://console.groq.com) API key (for the AI Copilot and receipt scanner)

## 1. Install

\`\`\`bash
npm install
\`\`\`

## 2. Configure environment variables

Copy \`.env.example\` to \`.env\` and fill in your own values:

\`\`\`bash
cp .env.example .env
\`\`\`

| Variable | Where to get it |
|---|---|
| \`VITE_SUPABASE_URL\` | Supabase dashboard → Project Settings → API |
| \`VITE_SUPABASE_ANON_KEY\` | Supabase dashboard → Project Settings → API |
| \`GROQ_API_KEY\` | [console.groq.com](https://console.groq.com) → API Keys |
| \`GROQ_MODEL\` | Optional, defaults to \`llama-3.3-70b-versatile\` |

> If you skip Supabase configuration, the app still runs in **Demo Mode**: accounts and data
> are stored locally in the browser only. This is real usable data — nothing is pre-seeded —
> but it isn't shared across devices, and "Sign in with Google" falls back to creating a
> private local guest account instead of a real Google login.

## 3. Set up the Supabase database

In your Supabase project's SQL editor, run the migration in
[\`supabase/migrations/001_initial_schema.sql\`](supabase/migrations/001_initial_schema.sql).
This creates the \`profiles\`, \`transactions\`, \`budgets\`, \`goals\` and \`subscriptions\` tables
with Row Level Security policies so each user can only ever read or write their own rows.

## 4. Enable real Google Sign-In (optional but recommended)

FinPilot's "Continue with Google" button calls Supabase's real OAuth flow
(\`supabase.auth.signInWithOAuth({ provider: 'google' })\`). To make it work end-to-end you
need your own Google OAuth credentials — these must come from your own Google Cloud project
and domain, so they can't be generated for you automatically:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an
   **OAuth 2.0 Client ID** (type: Web application).
2. Add your Supabase callback URL as an authorized redirect URI. It looks like:
   \`https://<your-project-ref>.supabase.co/auth/v1/callback\`
3. Add your app's own URL (e.g. \`http://localhost:5173\` and your production domain) to
   **Authorized JavaScript origins**.
4. Copy the generated **Client ID** and **Client Secret**.
5. In your Supabase dashboard, go to **Authentication → Providers → Google**, toggle it on,
   and paste in the Client ID and Client Secret.
6. In **Authentication → URL Configuration**, set your Site URL and add your deployed URL(s)
   to the redirect allow-list.

Once this is done, clicking "Continue with Google" performs a real Google OAuth login — no
demo or mock account is created.

## 5. Run it

\`\`\`bash
npm run dev
\`\`\`

The app runs at \`http://localhost:3000\` (configurable via \`PORT\`).

## Build & deploy

\`\`\`bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
\`\`\`

A \`vercel.json\` is included for one-click deployment to Vercel — just set the same
environment variables in your Vercel project settings.

## Project structure

\`\`\`
src/
  components/     UI screens and modals, grouped by feature
  lib/
    ai/           Groq-powered chat, insights, receipt extraction
    finance/      Pure calculation engine (budgets, cash flow, projections)
    supabase/     Supabase client + global app state/data provider
  types/          Shared TypeScript types
api/              Vercel serverless functions (AI chat/extract, health check)
supabase/         SQL migrations
\`\`\`

## License

Private project — all rights reserved.