// Shared helpers for Vercel serverless functions under /api.
// These mirror the logic in server.ts (used for local dev via `npm run dev`)
// so behavior is identical whether running locally or deployed on Vercel.
import Groq from 'groq-sdk';

export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}
