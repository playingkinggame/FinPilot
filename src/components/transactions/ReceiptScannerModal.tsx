// FinPilot AI Receipt Scanner Modal — REAL image OCR (tesseract.js, in-browser)
// Nothing is fabricated: data comes only from text recognized in the user's image,
// and every field must be verified/completed before it can be saved to the ledger.
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ScanLine,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Transaction, PaymentMethod } from '../../types';
import { runImageOcr, parseReceiptText, ParsedReceipt } from '../../lib/ocr/receipt-ocr';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (t: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];
const CATEGORIES = [
  'Food', 'Shopping', 'Transport', 'Bills', 'Entertainment',
  'Subscriptions', 'Education', 'Health', 'Other'
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ParsedReceipt | null>(null);

  // Editable confirmation form (pre-filled from OCR, completed by the user)
  const [fMerchant, setFMerchant] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDate, setFDate] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fPaymentMethod, setFPaymentMethod] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [touched, setTouched] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);

  // Revoke object URLs to avoid memory leaks
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
    setExtracted(null);
    setFMerchant('');
    setFAmount('');
    setFDate('');
    setFCategory('');
    setFPaymentMethod('');
    setFNotes('');
    setTouched(false);
  };

  const handleFile = async (selected: File) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setOcrError('Please upload an image file (JPEG, PNG, WebP, BMP). PDF receipts are not supported yet — screenshot the receipt instead.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setOcrError(null);
    setExtracted(null);
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    // Run REAL OCR on the actual uploaded image
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
          'recognizing text': 'Reading text from your receipt…'
        };
        setOcrStatus(readable[status] || 'Processing…');
      });

      const parsed = parseReceiptText(result.text, result.confidence);
      if (!result.text.trim()) {
        setOcrError(
          'No readable text was found in this image. Try a sharper, well-lit, close-up photo of the receipt.'
        );
      }
      setExtracted(parsed);
      setFMerchant(parsed.merchant || '');
      setFAmount(parsed.amount !== null ? String(parsed.amount) : '');
      setFDate(parsed.date || new Date().toISOString().split('T')[0]);
      setFCategory('');
      setFPaymentMethod(parsed.payment_method || '');
      setFNotes('');
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

  const showRawText = () => {
    if (extracted?.rawText) {
      console.log('FinPilot OCR raw text:\n', extracted.rawText);
    }
  };

  const lowConfidence = touched && extracted !== null && extracted.confidence > 0 && extracted.confidence < 60;
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

  const handleCommit = () => {
    setTouched(true);
    if (!canSave) return;
    onAddTransaction({
      amount: amountNum,
      type: 'expense',
      category: fCategory,
      merchant: fMerchant.trim(),
      description: `${fMerchant.trim()} (scanned receipt)`,
      date: fDate,
      payment_method: fPaymentMethod as PaymentMethod,
      receipt_url: previewUrl || undefined,
      notes: fNotes.trim() || `Extracted via on-device OCR · recognition confidence ${extracted?.confidence ?? '?'}%`
    });
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">AI Receipt Scanner</h2>
            <p className="text-xs text-neutral-400">
              Real on-device OCR — your data never leaves this device
            </p>
          </div>
        </div>

        {!extracted ? (
          <div className="space-y-4">
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-colors"
            >
              <Upload className="h-8 w-8 text-neutral-500 mx-auto mb-2" />
              <p className="text-xs text-neutral-300 font-medium mb-1">
                Upload a receipt photo (JPEG, PNG, WebP, BMP)
              </p>
              <p className="text-[11px] text-neutral-500 mb-3">
                Drag & drop or browse — text is read from your actual image
              </p>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={Boolean(ocrStatus)}
                />
              </label>
              {file && <p className="text-xs text-emerald-400 mt-2 font-mono">{file.name}</p>}

              {previewUrl && (
                <div className="mt-4 relative rounded-lg overflow-hidden border border-neutral-800">
                  <img src={previewUrl} alt="Receipt preview" className="max-h-56 w-full object-contain bg-neutral-950" />
                  {ocrStatus && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 p-4">
                      <ScanLine className="h-6 w-6 text-emerald-400 animate-pulse" />
                      <p className="text-xs text-emerald-300 font-medium">{ocrStatus}</p>
                      <div className="w-4/5 h-1 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
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
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{ocrStatus} ({ocrProgress}%)</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* OCR source summary — honest about what was and wasn't found */}
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  OCR Read Complete
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  confidence {extracted.confidence}%
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-2">
                {extracted.items.length > 0
                  ? `Found ${extracted.items.length} likely line item${extracted.items.length === 1 ? '' : 's'} in your receipt.`
                  : 'Recognized the text below — confirm or complete the fields before saving.'}
                {' '}
                {extracted.amount === null && 'No clear total was detected, so please enter the amount.'}
              </p>
              {extracted.rawText.trim() && (
                <details className="mt-2">
                  <summary
                    onClick={showRawText}
                    className="text-[11px] text-neutral-500 hover:text-neutral-300 cursor-pointer select-none"
                  >
                    View recognized text
                  </summary>
                  <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-[10px] font-mono text-neutral-500 bg-neutral-900 rounded-lg p-2 border border-neutral-800">
                    {extracted.rawText.trim()}
                  </pre>
                </details>
              )}
            </div>

            {/* Confirmation form — everything is required before save */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">Merchant *</label>
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
                <label className="block text-xs font-medium text-neutral-300 mb-1">Payment Method *</label>
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
              <div className="col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Anything worth remembering"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {(lowConfidence || (touched && !canSave)) && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {touched && !canSave
                    ? 'Please complete all required fields before saving.'
                    : `OCR confidence is low (${extracted.confidence}%). Double-check the amount and merchant against the paper receipt.`}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={reset}
                className="w-1/3 rounded-lg border border-neutral-800 bg-neutral-900 py-2 text-xs font-medium text-neutral-300 hover:text-white"
              >
                Scan Another
              </button>
              <button
                onClick={handleCommit}
                disabled={!canSave}
                className="w-2/3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save to Verified Ledger</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
