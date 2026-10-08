import React, { useState } from 'react';
import { ClientQuote, QuoteStatus } from '../types';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  MapPin,
  Clock,
  Package,
  Users,
  DollarSign,
  FileText,
  Printer,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Phone,
  Mail,
  Building,
  Image as ImageIcon,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { GoogleCalendarSyncModal } from './GoogleCalendarSyncModal';

interface EventDetailModalProps {
  quote: ClientQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditDiagram?: (quote: ClientQuote) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  quote,
  isOpen,
  onClose,
  onOpenEditDiagram,
}) => {
  const {
    setActiveTab,
    setActiveQuoteForPrint,
    setSelectedQuoteForPull,
    convertQuoteToActiveJob,
    createInvoiceFromQuote,
    updateQuoteStatus,
    invoices,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'manifest' | 'crew' | 'diagram' | 'financials'>('manifest');
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);

  if (!isOpen || !quote) return null;

  const isApproved = quote.status === 'Approved';
  const isCompleted = quote.status === 'Completed';
  const isSent = quote.status === 'Sent';
  const hasInvoice = !!quote.convertedToInvoiceId || invoices.some((inv) => inv.quoteId === quote.id);

  const totalGearItems = quote.equipmentItems.reduce((sum, item) => sum + item.quantity, 0);
  const pulledGearStatus = quote.pulledGearStatus || {};
  const totalGearPulled = Object.values(pulledGearStatus).reduce((sum, qty) => sum + qty, 0);
  const pullProgressPercent = totalGearItems > 0 ? Math.min(100, Math.round((totalGearPulled / totalGearItems) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full p-5 sm:p-7 space-y-6 shadow-2xl my-auto text-neutral-100 max-h-[92vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-800 pb-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-amber-400">
                {quote.quoteNumber}
              </span>
              <span className="text-neutral-600">·</span>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold ${
                  isApproved || isCompleted
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                    : isSent
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                {quote.status}
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs font-mono text-neutral-400">
                Created: {quote.createdAt}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {quote.eventName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 mt-1 font-mono">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>{quote.clientCompany || quote.clientName}</span>
              </span>
              <span className="flex items-center gap-1.5 text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{quote.venueName}</span>
              </span>
            </div>
          </div>

          {/* Close & Print Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsCalendarSyncOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-lg border border-blue-500/30 transition-colors cursor-pointer"
              title="Sync this show to Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveQuoteForPrint(quote);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
              title="Print formal proposal PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Proposal</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Milestone Schedule Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block">Load-In Call</span>
            <span className="text-sm font-bold font-mono text-amber-400 mt-0.5 block">{quote.loadInDate}</span>
            <span className="text-[10px] text-neutral-400">Truck arrival 06:00 AM</span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block">Show Days</span>
            <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
              {quote.showStartDate}
            </span>
            <span className="text-[10px] text-neutral-400">thru {quote.showEndDate}</span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block">Strike & Wrap</span>
            <span className="text-sm font-bold font-mono text-sky-400 mt-0.5 block">{quote.strikeDate}</span>
            <span className="text-[10px] text-neutral-400">Pack-out dock bay 4</span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block">Total Proposal</span>
            <span className="text-sm font-bold font-mono text-white mt-0.5 block">
              ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-neutral-400">
              {hasInvoice ? 'Formal invoice created' : 'Ready for invoice'}
            </span>
          </div>
        </div>

        {/* Client & Venue Logistics Strip */}
        <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400">Client Contact:</span>
            <span className="text-white font-semibold">{quote.clientName}</span>
            <span className="text-neutral-500">·</span>
            <a href={`mailto:${quote.clientEmail}`} className="text-amber-400 hover:underline flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>{quote.clientEmail}</span>
            </a>
            {quote.clientPhone && (
              <>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  <span>{quote.clientPhone}</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-neutral-400">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-xs">{quote.venueAddress || quote.venueName}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveSubTab('manifest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'manifest'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Equipment Manifest ({quote.equipmentItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('crew')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'crew'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Crew & Labor Calls ({quote.laborItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('diagram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'diagram'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Meeting & Stage Diagram ({quote.meetingDiagram?.elements.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('financials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'financials'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Financials & Invoicing</span>
          </button>
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* TAB 1: Equipment Manifest & Warehouse Pull Status */}
          {activeSubTab === 'manifest' && (
            <div className="space-y-4">
              {/* Warehouse Pull Status Banner */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase font-mono tracking-wider">
                      Warehouse Pull Sheet Progress:
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      {totalGearPulled} of {totalGearItems} units staged ({pullProgressPercent}%)
                    </span>
                  </div>
                  <div className="w-72 bg-neutral-800 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${pullProgressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuoteForPull(quote);
                    onClose();
                    setActiveTab('pullsheet');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer shadow-xs self-start sm:self-center"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Warehouse Pull Sheet</span>
                </button>
              </div>

              {/* Items Table */}
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 font-sans">Equipment Name</th>
                      <th className="py-2.5 px-3 text-center">Category</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-center">Days</th>
                      <th className="py-2.5 px-3 text-right">Day Rate</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center font-sans">Pull Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {quote.equipmentItems.map((item) => {
                      const pulledCount = pulledGearStatus[item.inventoryId] || 0;
                      const isComplete = pulledCount >= item.quantity;

                      return (
                        <tr key={item.id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-white font-sans">{item.name}</td>
                          <td className="py-2.5 px-3 text-center text-neutral-400">{item.category}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-white">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-center text-neutral-400">{item.days}</td>
                          <td className="py-2.5 px-3 text-right">${item.dayRate}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                                isComplete
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-bold'
                                  : pulledCount > 0
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/80 font-medium'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              {pulledCount} / {item.quantity} staged
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Crew & Labor Calls */}
          {activeSubTab === 'crew' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">
                  Assigned Production Technicians & Shift Calls
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setActiveTab('staff');
                  }}
                  className="text-xs text-sky-400 hover:underline font-mono"
                >
                  Manage Master Crew Roster →
                </button>
              </div>

              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 font-sans">Role</th>
                      <th className="py-2.5 px-3 font-sans">Assigned Technician</th>
                      <th className="py-2.5 px-3 font-sans">Call Type</th>
                      <th className="py-2.5 px-3 text-center">Days/Calls</th>
                      <th className="py-2.5 px-3 text-right">Day Rate</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {quote.laborItems.map((labor) => (
                      <tr key={labor.id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-amber-300 font-sans">{labor.role}</td>
                        <td className="py-2.5 px-3 text-white font-sans">
                          {labor.staffName ? labor.staffName : <span className="text-neutral-500 italic">Unassigned</span>}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">{labor.callType}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-white">{labor.daysOrHours}</td>
                        <td className="py-2.5 px-3 text-right">${labor.rate}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">
                          ${labor.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Meeting & Stage Layout Diagram */}
          {activeSubTab === 'diagram' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider block">
                    Venue Stage Plot & AV Equipment Placement Schematic
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    {quote.meetingDiagram?.roomDimensions?.lengthFt || 90}ft x {quote.meetingDiagram?.roomDimensions?.widthFt || 60}ft · Ceiling Trim: {quote.meetingDiagram?.roomDimensions?.ceilingHeightFt || 22}ft
                  </p>
                </div>

                {onOpenEditDiagram && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenEditDiagram(quote);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Diagram Studio</span>
                  </button>
                )}
              </div>

              {quote.meetingDiagram && quote.meetingDiagram.elements.length > 0 ? (
                <div
                  className="relative w-full h-80 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center shadow-inner"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  {quote.meetingDiagram.backgroundImageUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${quote.meetingDiagram.backgroundImageUrl})`,
                        opacity: quote.meetingDiagram.backgroundOpacity || 0.65,
                      }}
                    />
                  )}

                  <div className="relative w-[700px] h-[450px] scale-[0.65] origin-center">
                    {quote.meetingDiagram.elements.map((el) => (
                      <div
                        key={el.id}
                        className="absolute flex items-center justify-center text-center p-1 rounded-md font-mono text-[10px] font-bold text-white shadow-md select-none border"
                        style={{
                          left: `${el.x}px`,
                          top: `${el.y}px`,
                          width: `${el.width}px`,
                          height: `${el.height}px`,
                          backgroundColor: `${el.color || '#3b82f6'}dd`,
                          borderColor: el.color || '#3b82f6',
                          transform: `rotate(${el.rotation || 0}deg)`,
                        }}
                      >
                        <span className="truncate px-1 drop-shadow-xs">{el.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-neutral-500 bg-neutral-950 rounded-xl border border-neutral-800">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
                  <p className="text-xs font-semibold text-neutral-300">No meeting diagram saved yet for this event</p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Click &quot;Edit Diagram Studio&quot; to upload venue CAD floorplans and stage equipment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Financials & Invoicing */}
          {activeSubTab === 'financials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs font-mono">
                  <span className="font-bold text-neutral-300 font-sans uppercase block mb-1">
                    Cost Breakdown
                  </span>
                  <div className="flex justify-between text-neutral-400">
                    <span>Equipment Subtotal:</span>
                    <span className="text-white">${quote.equipmentSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Technical Crew Subtotal:</span>
                    <span className="text-white">${quote.laborSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Trucking & Logistics Fee:</span>
                    <span className="text-white">${quote.logisticsFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Damage Waiver ({quote.damageWaiverPercent}%):</span>
                    <span className="text-white">${quote.damageWaiverAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Sales / Rental Tax ({quote.taxPercent}%):</span>
                    <span className="text-white">${quote.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-sm text-amber-400">
                    <span>Grand Total:</span>
                    <span>${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 text-xs">
                  <span className="font-bold text-neutral-300 font-mono uppercase block">
                    Invoicing Workflow
                  </span>
                  <p className="text-neutral-400 leading-relaxed">
                    Convert this proposal directly into an accounts receivable invoice with Net 30 terms, tracking deposit and balance payments.
                  </p>

                  <div className="pt-2">
                    {hasInvoice ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setActiveTab('invoices');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>View Invoicing Ledger →</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          createInvoiceFromQuote(quote.id);
                          onClose();
                          setActiveTab('invoices');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Generate Formal Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-800 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            {!isApproved && (
              <button
                type="button"
                onClick={() => {
                  convertQuoteToActiveJob(quote.id);
                }}
                className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg font-bold transition-colors cursor-pointer"
              >
                Approve & Book Production
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedQuoteForPull(quote);
                onClose();
                setActiveTab('pullsheet');
              }}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Warehouse Pull Sheet
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>

      <GoogleCalendarSyncModal
        isOpen={isCalendarSyncOpen}
        onClose={() => setIsCalendarSyncOpen(false)}
        targetQuote={quote}
      />
    </div>
  );
};
