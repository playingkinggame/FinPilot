// FinPilot AI Layer — Groq Client Abstraction
// Communicates with backend proxy /api/ai/chat and /api/ai/insights to keep GROQ_API_KEY secure

export interface GroqChatPayload {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  financialContext: Record<string, any>;
  query: string;
}

export interface GroqChatResponse {
  content: string;
  modelUsed: string;
  source: 'groq' | 'deterministic_engine';
}

export async function sendGroqChatRequest(payload: GroqChatPayload): Promise<GroqChatResponse> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`API responded with status ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.warn('Groq backend request fallback to deterministic response:', error.message);
    throw error;
  }
}

export async function requestGroqReceiptExtraction(receiptText: string): Promise<any> {
  try {
    const res = await fetch('/api/ai/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: receiptText })
    });

    if (!res.ok) {
      throw new Error(`Extraction failed: ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Extraction fallback to local regex parser');
    return null;
  }
}
