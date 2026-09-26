// Vercel Serverless Function: GET /api/health
// Quick way to confirm env vars are wired correctly after deployment.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GROQ_MODEL } from './_groq.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    appName: 'FinPilot',
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    groqModel: GROQ_MODEL,
    supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
    timestamp: new Date().toISOString()
  });
}