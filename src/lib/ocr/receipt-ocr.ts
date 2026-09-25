// FinPilot Client-side OCR & Receipt Parsing Utilities
// Real OCR runs fully in the browser via tesseract.js (WASM). No fabricated data:
// every extracted value originates from text recognized in the user's own image,
// and confidence is surfaced so users can verify before saving.
import type { Worker } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number; // 0-100 mean recognition confidence
}

export interface ParsedReceipt {
  merchant: string | null;
  amount: number | null;
  date: string | null; // YYYY-MM-DD when confidently parsed
  payment_method: string | null;
  items: Array<{ name: string; price: number }>;
  tax: number | null;
  rawText: string;
  confidence: number;
}

const WORKER_LANGS = 'eng';

/**
 * Runs real OCR on an image entirely in the browser using tesseract.js (WASM).
 * Language data is fetched on first use and cached by the browser/CDN.
 */
export async function runImageOcr(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrResult> {
  // Lazy-load the OCR engine so it never bloats the initial app bundle
  const { createWorker } = await import('tesseract.js');
  const worker: Worker = await createWorker(WORKER_LANGS, 1, {
    logger: (m: any) => {
      if (onProgress && typeof m?.progress === 'number') {
        onProgress(Math.round(m.progress * 100), String(m.status || 'processing'));
      }
    }
  });

  try {
    const { data } = await worker.recognize(file);
    return {
      text: data.text || '',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0
    };
  } finally {
    await worker.terminate();
  }
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12'
};

function pad2(n: number | string): string {
  return String(n).padStart(2, '0');
}

/** Parse many common receipt date formats into YYYY-MM-DD (null when not found). */
export function parseReceiptDate(text: string): string | null {
  const t = text.replace(/\s+/g, ' ');

  // ISO: 2024-09-25 or 2024/09/25
  let m = t.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${y}-${pad2(mo)}-${pad2(d)}`;
  }

  // DD/MM/YYYY or MM/DD/YYYY or DD-MM-YY (assume DD/MM first — common on IN receipts)
  m = t.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) {
    let d = Number(m[1]);
    let mo = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    if (d > 12 && mo <= 12) {
      // clearly DD/MM
    } else if (mo > 12 && d <= 12) {
      const tmp = d; d = mo; mo = tmp;
    }
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${y}-${pad2(mo)}-${pad2(d)}`;
  }

  // 25 Sep 2024 / Sep 25, 2024 / 25 September 2024
  m = t.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{2,4})\b/);
  if (m) {
    const key = m[2].toLowerCase().slice(0, 4).replace(/[^a-z]/g, '');
    const mo = MONTHS[key] || MONTHS[key.slice(0, 3)];
    if (mo) {
      let y = Number(m[3]);
      if (y < 100) y += 2000;
      return `${y}-${mo}-${pad2(Number(m[1]))}`;
    }
  }
  m = t.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{2,4})\b/);
  if (m) {
    const key = m[1].toLowerCase().slice(0, 4).replace(/[^a-z]/g, '');
    const mo = MONTHS[key] || MONTHS[key.slice(0, 3)];
    if (mo) {
      let y = Number(m[3]);
      if (y < 100) y += 2000;
      return `${y}-${mo}-${pad2(Number(m[2]))}`;
    }
  }

  return null;
}

function normalizeAmountString(raw: string): number | null {
  // Strip currency symbols/codes and thousands separators: "₹1,234.56", "INR 1 234", "Rs. 1,234"
  const cleaned = raw.replace(/[^0-9.,\s]/g, '').trim();
  if (!cleaned) return null;
  // Prefer the last comma/dot as decimal separator when both appear
  let normalized: string;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = cleaned.replace(/,/g, '');
  }
  normalized = normalized.replace(/\s/g, '');
  const n = parseFloat(normalized);
  return isFinite(n) && n >= 0 ? n : null;
}

/** Find candidate money amounts in OCR text with their line context. */
function findAmounts(lines: string[]): Array<{ value: number; lineIndex: number; raw: string }> {
  const out: Array<{ value: number; lineIndex: number; raw: string }> = [];
  const amountRegex = /(?:₹|rs\.?|inr|\$|€|£)?\s*([0-9]{1,3}(?:[,\s][0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\b/gi;

  lines.forEach((line, i) => {
    let m: RegExpExecArray | null;
    amountRegex.lastIndex = 0;
    while ((m = amountRegex.exec(line)) !== null) {
      const v = normalizeAmountString(m[1]);
      if (v !== null && v > 0) out.push({ value: v, lineIndex: i, raw: m[0] });
    }
  });
  return out;
}

/**
 * Deterministic, hallucination-free receipt parser over OCR text.
 * Every field comes from recognized text; missing fields stay null and the UI
 * forces the user to complete them before saving.
 */
export function parseReceiptText(text: string, ocrConfidence = 100): ParsedReceipt {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const lowerLines = lines.map((l) => l.toLowerCase());
  const amounts = findAmounts(lines);

  // ---- Total amount: the strongest signal wins, in priority order ----
  let amount: number | null = null;
  const totalLineIdx = lowerLines.findIndex((l) => /(?:grand\s*total|total\s*amount|amount\s*paid|net\s*payable|total\s*payable|balance\s*due)/.test(l));
  if (totalLineIdx >= 0) {
    const candidates = amounts.filter((a) => a.lineIndex === totalLineIdx);
    if (candidates.length) amount = Math.max(...candidates.map((c) => c.value));
  }
  if (amount === null) {
    const totalIdx = lowerLines.findIndex((l) => /(^|\W)total(\W|$)/.test(l));
    if (totalIdx >= 0) {
      const candidates = amounts.filter((a) => a.lineIndex === totalIdx);
      if (candidates.length) amount = Math.max(...candidates.map((c) => c.value));
    }
  }
  if (amount === null) {
    // Fall back to the largest amount found anywhere on the receipt
    if (amounts.length) amount = Math.max(...amounts.map((a) => a.value));
  }

  // ---- Tax (best-effort, only if explicitly labelled) ----
  let tax: number | null = null;
  const taxIdx = lowerLines.findIndex((l) => /\b(?:gst|cgst|sgst|igst|vat|tax)\b/.test(l));
  if (taxIdx >= 0) {
    const candidates = amounts.filter((a) => a.lineIndex === taxIdx);
    if (candidates.length) tax = Math.max(...candidates.map((c) => c.value));
  }

  // ---- Merchant: first meaningful line, skipping invoice/status noise ----
  let merchant: string | null = null;
  const noise = /(invoice|receipt|tax\s*invoice|bill|statement|order|customer|merchant|cashier|token|table|www\.|http|\.com|app|download|powered\s*by|thank\s*you|visit)/i;
  for (const line of lines.slice(0, 8)) {
    const cleaned = line.replace(/[^A-Za-z0-9&.'\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleaned.length >= 3 && /[A-Za-z]{3}/.test(cleaned) && !noise.test(cleaned)) {
      merchant = cleaned
        .split(' ')
        .slice(0, 5)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      break;
    }
  }

  // ---- Payment method: only when explicitly present ----
  let payment_method: string | null = null;
  const joined = lowerLines.join(' ');
  if (/\bupi\b|gpay|google\s*pay|phonepe|paytm|bhim|vpa/.test(joined)) payment_method = 'UPI';
  else if (/credit\s*card/.test(joined)) payment_method = 'Credit Card';
  else if (/debit\s*card/.test(joined)) payment_method = 'Debit Card';
  else if (/\bcash\b/.test(joined)) payment_method = 'Cash';
  else if (/neft|imps|rtgs|net\s*banking|bank\s*transfer/.test(joined)) payment_method = 'Bank Transfer';

  // ---- Line items: "name ... price" lines between merchant header and total ----
  const items: Array<{ name: string; price: number }> = [];
  const stopIdx = totalLineIdx >= 0 ? totalLineIdx : lines.length;
  for (let i = 0; i < stopIdx; i++) {
    const line = lines[i];
    if (/\b(?:gst|cgst|sgst|igst|vat|tax|subtotal|sub-total|sub total|delivery|shipping|discount|round(?:ing)?\s*off|change|tender|cash)\b/i.test(line)) continue;
    const lineAmounts = amounts.filter((a) => a.lineIndex === i);
    if (!lineAmounts.length) continue;
    const name = line
      .replace(/(?:₹|rs\.?|inr|\$|€|£)/gi, ' ')
      .replace(/[0-9][0-9,.\s]*$/g, ' ')
      .replace(/[*•|:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9%().]+$/g, '')
      .trim();
    if (name.length < 2 || !/[A-Za-z0-9]/.test(name)) continue;
    const price = Math.max(...lineAmounts.map((a) => a.value));
    if (amount !== null && price === amount && stopIdx !== lines.length) continue; // skip total echo
    items.push({ name, price });
  }

  return {
    merchant,
    amount,
    date: parseReceiptDate(text),
    payment_method,
    items,
    tax,
    rawText: text,
    confidence: Math.round(ocrConfidence)
  };
}
