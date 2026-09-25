// FinPilot Payment Screenshot Import Modal — REAL OCR extraction
// Reads the user's actual uploaded payment screenshot (GPay / PhonePe / Paytm /
// bank apps) via in-browser OCR. Nothing is invented: if a field can't be read,
// the user completes it before saving. No simulated waits, no hardcoded data.
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Smartphone,
  Upload,
  CheckCircle2,
  X,
  ScanLine,
  AlertTriangle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Transaction, PaymentMethod } from '../../types';
import { runImageOcr, parseReceiptDate } from '../../lib/ocr/receipt-ocr';

interface ScreenshotImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (t: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => void;
}

interface ParsedPayment {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  payment_method: string | null;
  appSource: string | null;
  reference: string | null;
  rawText: string;
  confidence: number;
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];
const CATEGORIES = [
  'Food', 'Shopping', 'Transport', 'Bills', 'Entertainment',
  'Subscriptions', 'Education', 'Health', 'Other'
];

/** Deterministic parser for UPI / bank payment confirmation screenshots. */
function parsePaymentScreenshot(text: string, ocrConfidence = 100): ParsedPayment {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const lowerLines = lines.map((l) => l.toLowerCase());
  const joined = lowerLines.join(' ');

  // ---- Amount: prefer "paid/sent/amount ₹X", else largest money-like number ----
  let amount: number | null = null;
  const amountRegex = /(?:₹|rs\.?|inr|\$)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi;
  for (let i = 0; i < lines.length && amount === null; i++) {
    if (/paid|sent|debited|amount|total|transferred/i.test(lines[i])) {
      let best: number | null = null;
      let m: RegExpExecArray | null;
      amountRegex.lastIndex = 0;
      while ((m = amountRegex.exec(lines[i])) !== null) {
        const v = parseFloat(m[1].replace(/,/g, ''));
        if (isFinite(v) && v > 0 && (best === null || v > best)) best = v;
      }
      amount = best;
    }
  }
  if (amount === null) {
    const all: number[] = [];
    lines.forEach((l) => {
      let m: RegExpExecArray | null;
      amountRegex.lastIndex = 0;
      while ((m = amountRegex.exec(l)) !== null) {
        const v = parseFloat(m[1].replace(/,/g, ''));
        if (isFinite(v) && v > 0) all.push(v);
      }
    });
    // Ignore years (e.g. 2024, 2026) and tiny numbers when picking the largest
    const meaningful = all.filter((v) => v >= 10 && ![2024, 2025, 2026].includes(v));
    if (meaningful.length) amount = Math.max(...meaningful);
  }

  // ---- Recipient: "paid to X" / "sent to X" / "to X" ----
  let merchant: string | null = null;
  const payTo = text.match(/(?:paid|sent|transferred)\s+to\s+([A-Za-z0-9&.'\- ]{2,40})/i);
  if (payTo) {
    merchant = payTo[1]
      .replace(/\s+(on|via|using|with|through)\s+.*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  } else {
    const toLine = lines.find((l) => /^\s*(to|recipient|payee|merchant)\b/i.test(l));
    if (toLine) {
      merchant = toLine.replace(/^(to|recipient|payee|merchant)\b[:\s-]*/i, '').trim();
    }
  }
  if (merchant) {
    merchant = merchant
      .split(' ')
      .slice(0, 6)
      .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
    if (!/[A-Za-z0-9]/.test(merchant)) merchant = null;
  }

  // ---- Source app (only if actually mentioned in the screenshot) ----
  let appSource: string | null = null;
  if (/google\s*pay|\bgpay\b/.test(joined)) appSource = 'Google Pay';
  else if (/phonepe|phone\s*pe/.test(joined)) appSource = 'PhonePe';
  else if (/\bpaytm\b/.test(joined)) appSource = 'Paytm';
  else if (/amazon\s*pay/.test(joined)) appSource = 'Amazon Pay';
  else if (/\bbhim\b/.test(joined)) appSource = 'BHIM UPI';
  else if (/whats?app\s*(pay|upe)/.test(joined)) appSource = 'WhatsApp Pay';
  else if (/hdfc|icici|sbi|axis|kotak|yes\s*bank|idfci|indusind|federal|punjab\s*national|\bpnb\b|bank\s*of\s*baroda|canara/.test(joined)) appSource = 'Bank App';

  // ---- Payment method ----
  let payment_method: string | null = null;
  if (/upi|vpa|@ok|@ybl|@paytm|@ibl|@axis/.test(joined)) payment_method = 'UPI';
  else if (/credit\s*card/.test(joined)) payment_method = 'Credit Card';
  else if (/debit\s*card/.test(joined)) payment_method = 'Debit Card';
  else if (/neft|imps|rtgs|net\s*banking/.test(joined)) payment_method = 'Bank Transfer';
  else if (/\bcash\b/.test(joined)) payment_method = 'Cash';

  // ---- UPI reference / UTR (kept as notes for verification) ----
  let reference: string | null = null;
  const refMatch = text.match(/\b(?:upi[^\d]{0,12})?((?:utr|ref(?:erence)?(?:\s*(?:no|id|#))?)[:\s-]*)([0-9]{9,18})\b/i);
  if (refMatch) reference = refMatch[2];
  if (!reference) {
    const upiId = text.match(/\b([0-9]{12})\b/);
    if (upiId) reference = upiId[1];
  }

  return {
    merchant,
    amount,
    date: parseReceiptDate(text),
    payment_method,
    appSource,
    reference,
    rawText: text,
    confidence: Math.round(ocrConfidence)
  };
}

export const ScreenshotImportModal: React.FC<ScreenshotImportModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedPayment | null>(null);

  // Editable confirmation form
  const [fMerchant, setFMerchant] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDate, setFDate] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fPaymentMethod, setFPaymentMethod] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setOcrStatus(null);
    setOcrProgress(0);
    setOcrError(null);
    setParsed(null);
    setFMerchant('');
    setFAmount('');
    setFDate('');
    setFCategory('');
    setFPaymentMethod('');
    setTouched(false);
  };

  const handleFile = async (selected: File) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setOcrError('Please upload an image file (JPEG, PNG, WebP, BMP) of your payment screenshot.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setOcrError(null);
    setParsed(null);
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    setOcrStatus('Loading OCR engine…');
    setOcrProgress(0);
    try {
      const result = await runImageOcr(selected, (pct, status) => {
        setOcrProgress(pct);
        const readable: Record<string, string> = {
          'loading tesseract core': 'Loading OCR engine…',
          'initializing tesseract': 'Initializing OCR engine…',
          'loading language traineddata': 'Downloading language data (first run only)…',
          'initializing api': 'Preparing recognition…',
          'recognizing text': 'Reading your payment screenshot…'
        };
        setOcrStatus(readable[status] || 'Processing…');
      });

      const p = parsePaymentScreenshot(result.text, result.confidence);
      if (!result.text.trim()) {
        setOcrError(
          'No readable text was found in this image. Try a sharper screenshot with the payment details visible.'
        );
      }
      setParsed(p);
      setFMerchant(p.merchant || '');
      setFAmount(p.amount !== null ? String(p.amount) : '');
      setFDate(p.date || new Date().toISOString().split('T')[0]);
      setFCategory('');
      setFPaymentMethod(p.payment_method || '');
      setTouched(false);
    } catch (err: any) {
      console.error('OCR failed:', err);
      setOcrError(
        `OCR failed: ${err?.message || 'unknown error'}. Check your connection (language data downloads on first use) and try again.`
      );
    } finally {
      setOcrStatus(null);
      setOcrProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const amountNum = parseFloat(fAmount);
  const canSave = Boolean(
    fMerchant.trim() &&
      fAmount.trim() &&
      !isNaN(amountNum) &&
      amountNum > 0 &&
      fDate &&
      fCategory &&
      fPaymentMethod
  );

  const handleSave = () => {
    setTouched(true);
    if (!canSave || !parsed) return;
    onAddTransaction({
      amount: amountNum,
      type: 'expense',
      category: fCategory,
      merchant: fMerchant.trim(),
      description: `${fMerchant.trim()}${parsed.appSource ? ` (${parsed.appSource})` : ' (screenshot import)'}`,
      date: fDate,
      payment_method: fPaymentMethod as PaymentMethod,
      receipt_url: previewUrl || undefined,
      notes:
        parsed.reference
          ? `Imported from payment screenshot · Ref/UTR ${parsed.reference} · OCR confidence ${parsed.confidence}%`
          : `Imported from payment screenshot · OCR confidence ${parsed.confidence}%`
    });
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={() => {
            reset();
            onClose();
          }}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Payment Screenshot Importer</h2>
            <p className="text-xs text-neutral-400">
              Real OCR on your GPay / PhonePe / Paytm / bank screenshots
            </p>
          </div>
        </div>

        {!parsed ? (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-neutral-800 hover:border-blue-500/50 rounded-xl p-5 text-center transition-colors"
            >
              <Upload className="h-7 w-7 text-neutral-500 mx-auto mb-2" />
              <p className="text-xs text-neutral-300 font-medium mb-1">
                Upload a payment confirmation screenshot
              </p>
              <p className="text-[11px] text-neutral-500 mb-3">
                Drag & drop or browse — the app, recipient & amount are read from your image
              </p>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors">
                <span>Upload Screenshot</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={Boolean(ocrStatus)}
                />
              </label>
              {file && <p className="text-xs text-blue-400 mt-2 font-mono">{file.name}</p>}

              {previewUrl && (
                <div className="mt-4 relative rounded-lg overflow-hidden border border-neutral-800">
                  <img src={previewUrl} alt="Screenshot preview" className="max-h-56 w-full object-contain bg-neutral-950" />
                  {ocrStatus && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 p-4">
                      <ScanLine className="h-6 w-6 text-blue-400 animate-pulse" />
                      <p className="text-xs text-blue-300 font-medium">{ocrStatus}</p>
                      <div className="w-4/5 h-1 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {ocrError && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{ocrError}</span>
              </div>
            )}

            {ocrStatus && !previewUrl && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{ocrStatus} ({ocrProgress}%)</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {parsed.appSource ? `${parsed.appSource} detected` : 'Screenshot read complete'}
                </span>
                <span className="text-xs font-mono text-neutral-400">confidence {parsed.confidence}%</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-2">
                {parsed.amount !== null
                  ? 'Amount was read from your screenshot — verify it below before saving.'
                  : 'No clear amount was detected — please enter it below.'}
                {parsed.reference ? ` UPI Ref: ${parsed.reference}.` : ''}
              </p>
              {parsed.rawText.trim() && (
                <details className="mt-2">
                  <summary className="text-[11px] text-neutral-500 hover:text-neutral-300 cursor-pointer select-none">
                    View recognized text
                  </summary>
                  <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-[10px] font-mono text-neutral-500 bg-neutral-900 rounded-lg p-2 border border-neutral-800">
                    {parsed.rawText.trim()}
                  </pre>
                </details>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">Recipient / Merchant *</label>
                <input
                  type="text"
                  value={fMerchant}
                  onChange={(e) => setFMerchant(e.target.value)}
                  placeholder="Not detected — type it"
                  className={`w-full rounded-lg border bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none ${
                    touched && !fMerchant.trim() ? 'border-rose-500/60' : 'border-neutral-800 focus:border-emerald-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Amount *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={fAmount}
                  onChange={(e) => setFAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full rounded-lg border bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none tabular-nums font-mono ${
                    touched && !(parseFloat(fAmount) > 0) ? 'border-rose-500/60' : 'border-neutral-800 focus:border-emerald-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Date *</label>
                <input
                  type="date"
                  value={fDate}
                  onChange={(e) => setFDate(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Category *</label>
                <select
                  value={fCategory}
                  onChange={(e) => setFCategory(e.target.value)}
                  className={`w-full rounded-lg border bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none ${
                    touched && !fCategory ? 'border-rose-500/60' : 'border-neutral-800 focus:border-emerald-500'
                  }`}
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Payment Route *</label>
                <select
                  value={fPaymentMethod}
                  onChange={(e) => setFPaymentMethod(e.target.value)}
                  className={`w-full rounded-lg border bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none ${
                    touched && !fPaymentMethod ? 'border-rose-500/60' : 'border-neutral-800 focus:border-emerald-500'
                  }`}
                >
                  <option value="">Select…</option>
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {(touched && !canSave) && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Please complete all required fields before saving.</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={reset}
                className="w-1/3 rounded-lg border border-neutral-800 bg-neutral-900 py-2 text-xs font-medium text-neutral-300 hover:text-white"
              >
                Import Another
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="w-2/3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Add to Ledger</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
