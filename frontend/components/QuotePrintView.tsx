import React from 'react';
import { useApp } from '../context/AppContext';
import { Printer, ArrowLeft, Download, ShieldCheck } from 'lucide-react';

export const QuotePrintView: React.FC = () => {
  const { activeQuoteForPrint, setActiveQuoteForPrint, settings } = useApp();

  if (!activeQuoteForPrint) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 overflow-y-auto p-4 sm:p-8">
      {/* Action Header (hidden in print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <button
          onClick={() => setActiveQuoteForPrint(null)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
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
              Production Estimate & Proposal
            </span>
            <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
              {activeQuoteForPrint.quoteNumber}
            </div>
            <div className="text-xs text-neutral-600 mt-2 space-y-0.5 font-mono">
              <p>Issue Date: {activeQuoteForPrint.createdAt}</p>
              <p>Valid Until: {activeQuoteForPrint.validUntil}</p>
              <p className="font-bold text-neutral-900">Status: {activeQuoteForPrint.status}</p>
            </div>
          </div>
        </div>

        {/* Client & Production Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-neutral-300 text-xs">
          <div>
            <span className="uppercase font-bold tracking-wider text-neutral-500 text-[10px] block mb-1">
              Prepared For Client:
            </span>
            <div className="text-sm font-bold text-neutral-900">
              {activeQuoteForPrint.clientCompany || activeQuoteForPrint.clientName}
            </div>
            <div className="text-neutral-700 mt-1">
              <p>Contact: {activeQuoteForPrint.clientName}</p>
              <p>Email: {activeQuoteForPrint.clientEmail}</p>
              <p>Phone: {activeQuoteForPrint.clientPhone}</p>
            </div>
          </div>

          <div>
            <span className="uppercase font-bold tracking-wider text-neutral-500 text-[10px] block mb-1">
              Event Staging Schedule:
            </span>
            <div className="text-sm font-bold text-neutral-900">
              {activeQuoteForPrint.eventName}
            </div>
            <div className="text-neutral-700 mt-1 space-y-0.5">
              <p>Venue: {activeQuoteForPrint.venueName}</p>
              <p>Load-in: {activeQuoteForPrint.loadInDate}</p>
              <p>Show Dates: {activeQuoteForPrint.showStartDate} through {activeQuoteForPrint.showEndDate}</p>
              <p>Strike Date: {activeQuoteForPrint.strikeDate}</p>
            </div>
          </div>
        </div>

        {/* Equipment Section */}
        <div className="py-6 border-b border-neutral-300">
          <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-900 mb-3">
            Section 1: Audio, Video & Lighting Equipment
          </h3>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-300 text-neutral-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-center">Days</th>
                <th className="py-2 text-right">Daily Rate</th>
                <th className="py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {activeQuoteForPrint.equipmentItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 font-medium text-neutral-900">{item.name}</td>
                  <td className="py-2 text-center font-mono">{item.quantity}</td>
                  <td className="py-2 text-center font-mono">{item.days}</td>
                  <td className="py-2 text-right font-mono">${item.dayRate.toFixed(2)}</td>
                  <td className="py-2 text-right font-mono font-bold">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Labor Section */}
        {activeQuoteForPrint.laborItems.length > 0 && (
          <div className="py-6 border-b border-neutral-300">
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-900 mb-3">
              Section 2: Production Engineers & Technical Crew
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-300 text-neutral-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2">Role & Personnel</th>
                  <th className="py-2">Call Description</th>
                  <th className="py-2 text-center">Calls</th>
                  <th className="py-2 text-right">Day Rate</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeQuoteForPrint.laborItems.map((labor) => (
                  <tr key={labor.id}>
                    <td className="py-2 font-medium text-neutral-900">
                      {labor.role} {labor.staffName ? `(${labor.staffName})` : ''}
                    </td>
                    <td className="py-2 text-neutral-600">{labor.callType}</td>
                    <td className="py-2 text-center font-mono">{labor.daysOrHours}</td>
                    <td className="py-2 text-right font-mono">${labor.rate.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono font-bold">${labor.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial Summary */}
        <div className="py-6 border-b border-neutral-300 flex justify-end">
          <div className="w-72 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-700">
              <span>Equipment Subtotal:</span>
              <span className="font-mono">${activeQuoteForPrint.equipmentSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Technical Crew Subtotal:</span>
              <span className="font-mono">${activeQuoteForPrint.laborSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Trucking & Logistics:</span>
              <span className="font-mono">${activeQuoteForPrint.logisticsFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Damage Waiver ({activeQuoteForPrint.damageWaiverPercent}%):</span>
              <span className="font-mono">${activeQuoteForPrint.damageWaiverAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Applicable Tax ({activeQuoteForPrint.taxPercent}%):</span>
              <span className="font-mono">${activeQuoteForPrint.taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-neutral-900 flex justify-between items-baseline font-bold text-neutral-950 text-base">
              <span>Grand Total:</span>
              <span className="font-mono">${activeQuoteForPrint.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Meeting & Stage Layout Diagram (if present) */}
        {activeQuoteForPrint.meetingDiagram && activeQuoteForPrint.meetingDiagram.elements.length > 0 && (
          <div className="py-6 border-b border-neutral-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-900">
                Meeting Room & Staging Layout Diagram
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">
                Room: {activeQuoteForPrint.meetingDiagram.roomDimensions?.lengthFt || 90}ft x {activeQuoteForPrint.meetingDiagram.roomDimensions?.widthFt || 60}ft · Trim: {activeQuoteForPrint.meetingDiagram.roomDimensions?.ceilingHeightFt || 22}ft
              </span>
            </div>

            <div
              className="relative w-full h-64 bg-neutral-100 border border-neutral-300 rounded-lg overflow-hidden flex items-center justify-center"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0, 0, 0, 0.12) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {activeQuoteForPrint.meetingDiagram.backgroundImageUrl && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${activeQuoteForPrint.meetingDiagram.backgroundImageUrl})`,
                    opacity: activeQuoteForPrint.meetingDiagram.backgroundOpacity || 0.6,
                  }}
                />
              )}

              <div className="relative w-[700px] h-[450px] scale-[0.55] origin-center">
                {activeQuoteForPrint.meetingDiagram.elements.map((el) => (
                  <div
                    key={el.id}
                    className="absolute flex items-center justify-center text-center p-1 rounded font-mono text-[10px] font-bold text-white shadow-xs"
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      backgroundColor: el.color || '#3b82f6',
                      transform: `rotate(${el.rotation || 0}deg)`,
                    }}
                  >
                    <span className="truncate px-1">{el.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1.5 italic">
              Production schematic indicating stage positioning, LED walls, audio line arrays, FOH mix position, and audience layout.
            </p>
          </div>
        )}

        {/* Terms & Authorization Block */}
        <div className="pt-6 space-y-6 text-xs text-neutral-600">
          <div>
            <h4 className="font-bold text-neutral-900 uppercase text-[10px] tracking-wider mb-1">
              Terms & Conditions Summary:
            </h4>
            <pre className="font-sans whitespace-pre-wrap leading-relaxed text-[11px] text-neutral-600">
              {settings.termsAndConditions}
            </pre>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-12">
            <div className="border-t border-neutral-400 pt-2">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Authorized Client Signature
              </span>
              <div className="h-6"></div>
              <div className="text-neutral-800">Date: ________________________</div>
            </div>
            <div className="border-t border-neutral-400 pt-2">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                In The Wind AV Representative
              </span>
              <div className="h-6"></div>
              <div className="text-neutral-800">Date: ________________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
