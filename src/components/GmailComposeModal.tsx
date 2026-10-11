import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  DollarSign,
  Users,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import {
  sendGmailMessage,
  createGmailDraft,
  generateQuoteEmailHtml,
  generateInvoiceEmailHtml,
  generateShiftCallEmailHtml,
  EmailPayload,
} from '../services/gmailService';

export interface GmailComposePrefill {
  to?: string;
  subject?: string;
  bodyHtml?: string;
  templateType?: 'quote' | 'invoice' | 'shift' | 'custom';
  quoteId?: string;
  invoiceId?: string;
  shiftId?: string;
}

interface GmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: GmailComposePrefill | null;
}

export const GmailComposeModal: React.FC<GmailComposeModalProps> = ({
  isOpen,
  onClose,
  prefill,
}) => {
  const {
    quotes,
    invoices,
    shifts,
    staff,
    settings,
    googleCalendarToken,
    connectGoogleCalendar,
  } = useApp();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'quote' | 'invoice' | 'shift' | 'custom'>(
    prefill?.templateType || 'custom'
  );

  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentResult, setSentResult] = useState<{ id: string; threadId: string } | null>(null);

  // Mandatory explicit confirmation dialog state
  const [isConfirmingSend, setIsConfirmingSend] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingSend(false);
      setSentResult(null);
      setError(null);
      return;
    }

    if (prefill) {
      if (prefill.to) setTo(prefill.to);
      if (prefill.subject) setSubject(prefill.subject);
      if (prefill.bodyHtml) setBodyHtml(prefill.bodyHtml);
      if (prefill.templateType) setSelectedTemplate(prefill.templateType);

      // Auto load quote template if quoteId provided
      if (prefill.templateType === 'quote' && prefill.quoteId) {
        const q = quotes.find((quote) => quote.id === prefill.quoteId);
        if (q) loadQuoteTemplate(q.id);
      } else if (prefill.templateType === 'invoice' && prefill.invoiceId) {
        const inv = invoices.find((i) => i.id === prefill.invoiceId);
        if (inv) loadInvoiceTemplate(inv.id);
      } else if (prefill.templateType === 'shift' && prefill.shiftId) {
        const sh = shifts.find((s) => s.id === prefill.shiftId);
        if (sh) loadShiftTemplate(sh.id);
      }
    } else {
      setTo('');
      setCc('');
      setSubject('In The Wind AV - Event Production Notification');
      setBodyHtml('<p>Hello,</p><p>Please find information regarding your upcoming production.</p>');
      setSelectedTemplate('custom');
    }
  }, [isOpen, prefill]);

  const loadQuoteTemplate = (qId: string) => {
    const q = quotes.find((quote) => quote.id === qId);
    if (!q) return;
    setTo(q.clientEmail);
    setSubject(`In The Wind AV Proposal: Quote #${q.quoteNumber} for ${q.eventName}`);
    const html = generateQuoteEmailHtml(
      q.quoteNumber,
      q.eventName,
      q.clientName,
      q.totalAmount,
      q.venueName,
      `${q.showStartDate} - ${q.showEndDate}`,
      settings.companyName || 'In The Wind AV'
    );
    setBodyHtml(html);
  };

  const loadInvoiceTemplate = (invId: string) => {
    const inv = invoices.find((i) => i.id === invId);
    if (!inv) return;
    setTo(inv.clientEmail);
    setSubject(`In The Wind AV Invoice #${inv.invoiceNumber} - ${inv.eventName}`);
    const html = generateInvoiceEmailHtml(
      inv.invoiceNumber,
      inv.eventName,
      inv.clientName,
      inv.totalAmount,
      inv.balanceDue,
      inv.dueDate,
      settings.companyName || 'In The Wind AV'
    );
    setBodyHtml(html);
  };

  const loadShiftTemplate = (shId: string) => {
    const sh = shifts.find((s) => s.id === shId);
    if (!sh) return;
    const tech = staff.find((m) => m.id === sh.staffId);
    if (tech?.email) setTo(tech.email);
    setSubject(`Crew Call Sheet: ${sh.eventName} on ${sh.date} (${sh.role})`);
    const html = generateShiftCallEmailHtml(
      sh.staffName,
      sh.role,
      sh.eventName,
      sh.venue || 'Event Venue',
      sh.date,
      sh.startTime,
      sh.endTime,
      sh.notes || '',
      settings.companyName || 'In The Wind AV'
    );
    setBodyHtml(html);
  };

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setError(null);
    try {
      await connectGoogleCalendar();
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google');
    }
  };

  // Step 1: Trigger review & confirmation modal
  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      setError('Please provide at least one recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setError('Email subject is required.');
      return;
    }
    if (!bodyHtml.trim()) {
      setError('Email body cannot be empty.');
      return;
    }
    setError(null);
    setIsConfirmingSend(true);
  };

  // Step 2: Explicit confirmation executed
  const handleConfirmAndSend = async () => {
    if (!googleCalendarToken) {
      setError('Please connect your Google Workspace account to send emails via Gmail.');
      setIsConfirmingSend(false);
      return;
    }

    setSending(true);
    setError(null);
    try {
      const payload: EmailPayload = {
        to: to.trim(),
        cc: cc.trim() || undefined,
        subject: subject.trim(),
        bodyHtml,
      };

      const result = await sendGmailMessage(payload, googleCalendarToken);
      setSentResult(result);
      setIsConfirmingSend(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to send email via Gmail.');
      setIsConfirmingSend(false);
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!googleCalendarToken) {
      setError('Please connect your Google Workspace account to create Gmail drafts.');
      return;
    }
    if (!to.trim()) {
      setError('Please provide a recipient email address.');
      return;
    }

    setDrafting(true);
    setError(null);
    try {
      const payload: EmailPayload = {
        to: to.trim(),
        cc: cc.trim() || undefined,
        subject: subject.trim(),
        bodyHtml,
      };
      await createGmailDraft(payload, googleCalendarToken);
      alert('Draft saved in your Gmail account.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save draft in Gmail.');
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Gmail Integration & Dispatcher</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 font-normal">
                Direct Gmail API Send
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Send client proposals, commercial invoices, and crew dispatch calls directly through your Gmail account.
            </p>
          </div>
        </div>

        {/* Google Authentication Status */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                googleCalendarToken ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs text-neutral-300">
              {googleCalendarToken ? 'Google Workspace Authenticated' : 'Google Workspace Account Disconnected'}
            </span>
          </div>
          {!googleCalendarToken && (
            <button
              onClick={handleConnectGoogle}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Connect Google</span>
            </button>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sent Success View */}
        {sentResult ? (
          <div className="space-y-4 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Email Sent via Gmail!</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Your message to <strong className="text-white">{to}</strong> has been transmitted through the Gmail API.
              </p>
              <div className="mt-2 text-[11px] font-mono text-neutral-500">
                Gmail Message ID: {sentResult.id}
              </div>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <a
                href="https://mail.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Open Gmail Sent Folder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  setSentResult(null);
                  onClose();
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : isConfirmingSend ? (
          /* MANDATORY USER CONFIRMATION VIEW (Per Workspace Skill Directive) */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Confirm Sending Email via Gmail</span>
              </div>
              <p className="leading-relaxed">
                You are about to send an outgoing email on behalf of your Google Workspace account with the following parameters. Please verify before proceeding:
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400 font-medium">Recipient (To):</span>
                <span className="text-white font-mono font-bold">{to}</span>
              </div>
              {cc && (
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400 font-medium">Carbon Copy (Cc):</span>
                  <span className="text-neutral-200 font-mono">{cc}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400 font-medium">Subject Line:</span>
                <span className="text-white font-semibold">{subject}</span>
              </div>
              <div>
                <span className="text-neutral-400 font-medium block mb-1">Body Preview:</span>
                <div
                  className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg max-h-40 overflow-y-auto text-[11px] text-neutral-300"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingSend(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Edit</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSend}
                disabled={sending}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending via Gmail...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Send via Gmail</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD COMPOSE VIEW */
          <form onSubmit={handleProceedToConfirmation} className="space-y-4 flex-1 overflow-y-auto pr-1">
            {/* Quick Templates Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Quick AV Templates
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate('quote');
                    if (quotes[0]) loadQuoteTemplate(quotes[0].id);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer truncate ${
                    selectedTemplate === 'quote'
                      ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span className="truncate">Quote Proposal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate('invoice');
                    if (invoices[0]) loadInvoiceTemplate(invoices[0].id);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer truncate ${
                    selectedTemplate === 'invoice'
                      ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-500'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  <span className="truncate">Invoice Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate('shift');
                    if (shifts[0]) loadShiftTemplate(shifts[0].id);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer truncate ${
                    selectedTemplate === 'shift'
                      ? 'bg-blue-500 text-neutral-950 font-bold border-blue-500'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span className="truncate">Crew Shift Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('custom')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer truncate ${
                    selectedTemplate === 'custom'
                      ? 'bg-neutral-800 text-white font-bold border-neutral-700'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  <Mail className="w-3 h-3" />
                  <span className="truncate">Custom Email</span>
                </button>
              </div>
            </div>

            {/* Recipient Field */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Recipient (To) *</label>
                <input
                  type="email"
                  required
                  placeholder="client@company.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Cc (Optional)</label>
                <input
                  type="email"
                  placeholder="operations@inthewindav.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            {/* Subject Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Subject *</label>
              <input
                type="text"
                required
                placeholder="In The Wind AV Proposal"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Body Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Email Message (HTML / Text)</label>
              <textarea
                rows={7}
                required
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 font-mono"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={drafting || !googleCalendarToken}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {drafting ? 'Saving Draft...' : 'Save as Gmail Draft'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!googleCalendarToken}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <span>Review & Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
