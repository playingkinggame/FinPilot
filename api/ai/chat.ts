// Vercel Serverless Function: POST /api/ai/chat
// Keeps GROQ_API_KEY server-side only. Mirrors the /api/ai/chat route in server.ts
// which is used instead when running locally via `npm run dev`.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroqClient, GROQ_MODEL } from '../_groq.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { messages, financialContext } = req.body || {};
  const groq = getGroqClient();

  if (!groq) {
    res.status(200).json({
      content: '',
      modelUsed: GROQ_MODEL,
      source: 'deterministic_engine',
      notice: 'GROQ_API_KEY not configured. Responding with deterministic financial calculation engine.'
    });
    return;
  }

  try {
    const systemPrompt = `You are FinPilot, an elite AI personal finance copilot and financial strategist.
You speak clearly, warmly, and with high financial acumen (think Bloomberg meets Apple & Linear).
CRITICAL RULES:
1. You NEVER invent or guess any financial numbers, totals, or balances.
2. You strictly base your analysis and calculations on the structured financial data provided below:
---
STRUCTURED FINANCIAL CONTEXT:
${JSON.stringify(financialContext, null, 2)}
---
3. Format your answers elegantly using clean markdown with bullet points, bold key figures, and concise scannable paragraphs.
4. When relevant, reference specific merchants (e.g., Swiggy, Amazon, Zomato), category percentages, and actionable steps to reduce waste.
5. If the user asks for a follow-up ("Why?", "Which app?", "Compare"), maintain conversation context.`;

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...(messages || []).map((m: any) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content || ''
      }))
    ];

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: formattedMessages,
      temperature: 0.2,
      max_tokens: 1024
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    res.status(200).json({
      content: responseContent,
      modelUsed: GROQ_MODEL,
      source: 'groq'
    });
  } catch (error: any) {
    console.error('Groq chat completion error:', error?.message || error);
    res.status(200).json({
      content: '',
      modelUsed: GROQ_MODEL,
      source: 'deterministic_engine',
      error: error?.message
    });
  }
}