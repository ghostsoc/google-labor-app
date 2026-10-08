import React from 'react';
import { useApp } from '../context/AppContext';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const InvoicePrintView: React.FC = () => {
  const { activeInvoiceForPrint, setActiveInvoiceForPrint, settings } = useApp();

  if (!activeInvoiceForPrint) return null;

  const isPaid = activeInvoiceForPrint.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 overflow-y-auto p-4 sm:p-8">
      {/* Action Header (hidden in print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <button
          onClick={() => setActiveInvoiceForPrint(null)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Invoice PDF</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-4xl mx-auto bg-white text-neutral-900 rounded-xl shadow-2xl p-8 sm:p-12 print-page font-sans">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-neutral-300 pb-8 gap-4">
          <div>
            <div className="text-2xl font-black tracking-tight text-neutral-950">
              {settings.companyName}
            </div>
            <div className="text-xs text-neutral-600 mt-1 max-w-sm">
              {settings.tagline}
            </div>
            <div className="text-xs text-neutral-600 mt-2 space-y-0.5">
              <p>{settings.address}</p>
              <p>{settings.phone} · {settings.email}</p>
              <p>{settings.website}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs uppercase tracking-wider font-bold text-neutral-500">
              Commercial Invoice
            </span>
            <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
              {activeInvoiceForPrint.invoiceNumber}
            </div>
            <div className="text-xs text-neutral-600 mt-2 space-y-0.5 font-mono">
              <p>Issue Date: {activeInvoiceForPrint.issueDate}</p>
              <p className="font-bold text-rose-700">Payment Due: {activeInvoiceForPrint.dueDate}</p>
              <p>Terms: {activeInvoiceForPrint.paymentTerms}</p>
              {activeInvoiceForPrint.quoteNumber && (
                <p>Ref Quote: {activeInvoiceForPrint.quoteNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* Client & Production Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-neutral-300 text-xs">
          <div>
            <span className="uppercase font-bold tracking-wider text-neutral-500 text-[10px] block mb-1">
              Billed To:
            </span>
            <div className="text-sm font-bold text-neutral-900">
              {activeInvoiceForPrint.clientCompany}
            </div>
            <div className="text-neutral-700 mt-1">
              <p>Attn: {activeInvoiceForPrint.clientName}</p>
              <p>Email: {activeInvoiceForPrint.clientEmail}</p>
              {activeInvoiceForPrint.clientPhone && <p>Phone: {activeInvoiceForPrint.clientPhone}</p>}
            </div>
          </div>

          <div>
            <span className="uppercase font-bold tracking-wider text-neutral-500 text-[10px] block mb-1">
              Production Details:
            </span>
            <div className="text-sm font-bold text-neutral-900">
              {activeInvoiceForPrint.eventName}
            </div>
            {activeInvoiceForPrint.venueName && (
              <div className="text-neutral-700 mt-1">
                <p>Venue: {activeInvoiceForPrint.venueName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Line Items Overview */}
        <div className="py-6 border-b border-neutral-300">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-300 text-neutral-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2">Item Category</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr>
                <td className="py-2.5 font-medium text-neutral-900">
                  Audio, Video, Lighting & Rigging Equipment Rental
                </td>
                <td className="py-2.5 text-right font-mono font-semibold">
                  ${activeInvoiceForPrint.equipmentSubtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-neutral-900">
                  Production Engineers & Crew Labor Scheduling
                </td>
                <td className="py-2.5 text-right font-mono font-semibold">
                  ${activeInvoiceForPrint.laborSubtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-neutral-900">
                  Logistics, Transport & Warehouse Prep
                </td>
                <td className="py-2.5 text-right font-mono font-semibold">
                  ${activeInvoiceForPrint.logisticsFee.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-neutral-900">
                  Equipment Damage Waiver Coverage
                </td>
                <td className="py-2.5 text-right font-mono font-semibold">
                  ${activeInvoiceForPrint.damageWaiverAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-neutral-900">
                  Applicable Sales / Rental Tax
                </td>
                <td className="py-2.5 text-right font-mono font-semibold">
                  ${activeInvoiceForPrint.taxAmount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payments Recorded / Transaction Ledger */}
        <div className="py-6 border-b border-neutral-300">
          <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-900 mb-2">
            Payment & Settlement Ledger
          </h3>

          {activeInvoiceForPrint.payments.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-1.5">Payment Date</th>
                  <th className="py-1.5">Method</th>
                  <th className="py-1.5">Reference / Check #</th>
                  <th className="py-1.5 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeInvoiceForPrint.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 font-mono text-neutral-700">{p.date}</td>
                    <td className="py-2 text-neutral-900 font-medium">{p.paymentMethod}</td>
                    <td className="py-2 font-mono text-neutral-600">{p.referenceNumber}</td>
                    <td className="py-2 text-right font-mono font-bold text-emerald-700">
                      -${p.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-neutral-500 italic">No payments recorded to date.</p>
          )}
        </div>

        {/* Balances & Settlement Summary */}
        <div className="py-6 border-b border-neutral-300 flex justify-end">
          <div className="w-80 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-700">
              <span>Total Invoiced:</span>
              <span className="font-mono font-bold">${activeInvoiceForPrint.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Total Payments Received:</span>
              <span className="font-mono font-bold">-${activeInvoiceForPrint.paidAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-neutral-900 flex justify-between items-baseline font-bold text-base">
              <span className="text-neutral-950">Balance Due:</span>
              <span className={`font-mono ${isPaid ? 'text-emerald-600' : 'text-rose-700'}`}>
                ${activeInvoiceForPrint.balanceDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Remittance Instructions */}
        <div className="pt-6 space-y-4 text-xs text-neutral-700">
          <h4 className="font-bold text-neutral-900 uppercase text-[10px] tracking-wider">
            Remittance Instructions:
          </h4>
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-neutral-900">ACH / Domestic Wire:</p>
              <p>Bank: Silicon Valley Bank / First Citizens</p>
              <p>Routing (ABA): 121140399</p>
              <p>Account: 48992019488</p>
              <p>Beneficiary: In The Wind AV LLC</p>
            </div>
            <div>
              <p className="font-bold text-neutral-900">Company Check by Mail:</p>
              <p>Payable to: In The Wind AV LLC</p>
              <p>1480 Production Way, Suite B</p>
              <p>San Francisco, CA 94107</p>
              <p className="text-neutral-500 mt-1">Please reference Invoice #{activeInvoiceForPrint.invoiceNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
