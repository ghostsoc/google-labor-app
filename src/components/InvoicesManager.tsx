import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, PaymentStatus, PaymentMethod, PaymentRecord } from '../types';
import {
  DollarSign,
  Search,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  Building,
  Receipt,
  ArrowRight,
  X,
  History,
  Trash2,
  FileSpreadsheet,
  Mail,
} from 'lucide-react';
import { GoogleSheetsModal } from './GoogleSheetsModal';
import { GmailComposeModal, GmailComposePrefill } from './GmailComposeModal';

export const InvoicesManager: React.FC = () => {
  const {
    invoices,
    quotes,
    createInvoiceFromQuote,
    recordPayment,
    deleteInvoice,
    setActiveInvoiceForPrint,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Google Workspace modals state
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [gmailPrefill, setGmailPrefill] = useState<GmailComposePrefill | null>(null);

  // Record Payment Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ACH / Wire Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Payment History Modal State
  const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);

  // Accepted quotes that haven't been invoiced yet
  const unInvoicedApprovedQuotes = quotes.filter(
    (q) => q.status === 'Approved' && !q.convertedToInvoiceId
  );

  // Calculate Metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const overdueTotal = invoices
    .filter((inv) => inv.paymentStatus === 'overdue')
    .reduce((sum, inv) => sum + inv.balanceDue, 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.quoteNumber && inv.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'All' || inv.paymentStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleOpenPaymentModal = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setPaymentAmount(invoice.balanceDue);
    setPaymentMethod('ACH / Wire Transfer');
    setReferenceNumber('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || paymentAmount <= 0) return;

    recordPayment(payingInvoice.id, {
      amount: Number(paymentAmount),
      date: paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber || 'Direct Payment',
      recordedBy: 'Chris Vance',
      notes: paymentNotes,
    });

    setPayingInvoice(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Invoicing & Payment Tracking
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Convert accepted event quotes, record settlement payments, track Net terms, and manage receivables
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsSheetsModalOpen(true)}
            title="Export Billing Ledger to Google Sheets"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-emerald-300 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync Sheets</span>
          </button>
        </div>
      </div>

      {/* Convert Approved Quotes Banner (if any available) */}
      {unInvoicedApprovedQuotes.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400 text-neutral-950 font-bold shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {unInvoicedApprovedQuotes.length} Approved Quote{unInvoicedApprovedQuotes.length > 1 ? 's' : ''} Ready to Convert
                </h3>
                <p className="text-xs text-neutral-300">
                  Accepted client proposals ready for formal billing and deposit schedule.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {unInvoicedApprovedQuotes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => createInvoiceFromQuote(q.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                >
                  Generate Invoice for {q.quoteNumber} (${q.totalAmount.toLocaleString()})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Total Invoiced</span>
            <DollarSign className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            ${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">{invoices.length} active invoices</div>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Collected / Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Bank settlements confirmed</div>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Outstanding Balance</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-400/90 mt-1">Due under Net terms</div>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Overdue Amount</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400 tabular-nums">
            ${overdueTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">Past scheduled due date</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by invoice #, quote #, event, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto">
          {['All', 'pending', 'partial', 'paid', 'overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Master Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice & Event</th>
                <th className="py-3 px-4">Client & Company</th>
                <th className="py-3 px-4">Terms & Dates</th>
                <th className="py-3 px-4 text-right">Total Invoiced</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70 text-neutral-200">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.paymentStatus === 'paid';
                const isOverdue = inv.paymentStatus === 'overdue';
                const isPartial = inv.paymentStatus === 'partial';

                return (
                  <tr key={inv.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* Invoice & Event */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{inv.invoiceNumber}</span>
                        {inv.quoteNumber && (
                          <span className="text-[10px] font-mono text-neutral-400">
                            (Quote: {inv.quoteNumber})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-300 font-medium truncate mt-0.5">
                        {inv.eventName}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{inv.clientCompany}</div>
                      <div className="text-[11px] text-neutral-400">{inv.clientName}</div>
                    </td>

                    {/* Terms & Dates */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-neutral-300 font-medium">{inv.paymentTerms}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        Issued: {inv.issueDate} · Due: {inv.dueDate}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono tabular-nums font-semibold text-white">
                      ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Balance Due */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono tabular-nums">
                      <div className={`font-bold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        ${inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      {inv.paidAmount > 0 && (
                        <div className="text-[10px] text-neutral-400">
                          (${inv.paidAmount.toLocaleString()} paid)
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase ${
                          isPaid
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                            : isOverdue
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                            : isPartial
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                            : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                        }`}
                      >
                        {isPaid && <CheckCircle2 className="w-3 h-3" />}
                        {isOverdue && <AlertTriangle className="w-3 h-3" />}
                        {isPartial && <Clock className="w-3 h-3" />}
                        {inv.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Record payment button */}
                        {!isPaid && (
                          <button
                            onClick={() => handleOpenPaymentModal(inv)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded transition-colors cursor-pointer"
                          >
                            Record Pay
                          </button>
                        )}

                        {/* History button if payments exist */}
                        {inv.payments.length > 0 && (
                          <button
                            onClick={() => setHistoryInvoice(inv)}
                            title="View Payment Ledger"
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print Invoice */}
                        <button
                          onClick={() => setActiveInvoiceForPrint(inv)}
                          title="Print / Export Invoice PDF"
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Email Invoice via Gmail */}
                        <button
                          onClick={() => {
                            setGmailPrefill({
                              templateType: 'invoice',
                              invoiceId: inv.id,
                              to: inv.clientEmail,
                            });
                            setIsGmailModalOpen(true);
                          }}
                          title="Email Invoice to Client via Gmail"
                          className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete invoice */}
                        <button
                          onClick={() => {
                            if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                              deleteInvoice(inv.id);
                            }
                          }}
                          title="Delete Invoice"
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                    <p className="text-sm font-medium">No invoices found matching criteria</p>
                    <p className="text-xs text-neutral-500 mt-1">Convert an accepted quote above</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Record Invoice Payment</h3>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs font-mono text-neutral-400">{payingInvoice.invoiceNumber}</div>
              <div className="text-sm font-bold text-white mt-0.5">{payingInvoice.eventName}</div>
              <div className="text-xs text-neutral-400">{payingInvoice.clientCompany}</div>
            </div>

            {/* Balances summary */}
            <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500 block">Total Invoiced:</span>
                <span className="font-mono font-bold text-white">
                  ${payingInvoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Remaining Due:</span>
                <span className="font-mono font-bold text-amber-400">
                  ${payingInvoice.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={payingInvoice.balanceDue}
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="ACH / Wire Transfer">ACH / Wire Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Company Check">Company Check</option>
                  <option value="Direct Deposit">Direct Deposit</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Reference / Check / Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Check #4102, Wire Ref #88921, Stripe ch_..."
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Payment Received Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received via Chase ACH, deposit slip on file"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Record Payment (${paymentAmount.toLocaleString()})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Drawer Modal */}
      {historyInvoice && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Payment Transaction Ledger</h3>
              </div>
              <button
                onClick={() => setHistoryInvoice(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs font-mono text-neutral-400">{historyInvoice.invoiceNumber}</div>
              <div className="text-sm font-bold text-white mt-0.5">{historyInvoice.eventName}</div>
            </div>

            <div className="divide-y divide-neutral-800/80">
              {historyInvoice.payments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{p.paymentMethod}</span>
                      <span className="text-[10px] font-mono text-neutral-400">({p.referenceNumber})</span>
                    </div>
                    <div className="text-neutral-400 text-[11px] mt-0.5">
                      Date: {p.date} · Recorded by: {p.recordedBy}
                    </div>
                    {p.notes && <div className="text-neutral-400 text-[11px] italic mt-0.5">{p.notes}</div>}
                  </div>
                  <div className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                    +${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Total Settled:</span>
              <span className="font-mono font-bold text-emerald-400">
                ${historyInvoice.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Billing Ledger Export Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        initialTab="invoices"
      />

      {/* Gmail Compose Modal for Commercial Invoices */}
      <GmailComposeModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        prefill={gmailPrefill}
      />
    </div>
  );
};
