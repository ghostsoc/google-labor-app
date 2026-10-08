import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClientQuote, MaintenanceRecord } from '../types';
import {
  ClipboardCheck,
  CheckCircle2,
  Scan,
  Printer,
  Package,
  Layers,
  Check,
  AlertTriangle,
  Wrench,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const WarehousePullSheet: React.FC = () => {
  const {
    quotes,
    inventory,
    maintenanceRecords,
    selectedQuoteForPull,
    setSelectedQuoteForPull,
    updatePulledGearCount,
    setActiveTab,
  } = useApp();

  const approvedQuotes = quotes.filter((q) => q.status === 'Approved' || q.status === 'Completed');
  const activeQuote: ClientQuote | undefined =
    selectedQuoteForPull || approvedQuotes[0];

  const [selectedConflictTicket, setSelectedConflictTicket] = useState<{
    itemName: string;
    sku: string;
    bin: string;
    ticket: MaintenanceRecord;
    inRepairCount: number;
    availableCount: number;
    requestedCount: number;
  } | null>(null);

  if (!activeQuote) {
    return (
      <div className="p-12 text-center text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
        <h3 className="text-base font-bold text-white">No Booked Shows for Warehouse Staging</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Approve a client quote to generate an automated warehouse pick list.
        </p>
      </div>
    );
  }

  // Calculate readiness %
  const totalRequired = activeQuote.equipmentItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalScanned = activeQuote.equipmentItems.reduce((sum, item) => {
    const pulled = activeQuote.pulledGearStatus?.[item.inventoryId] || 0;
    return sum + Math.min(item.quantity, pulled);
  }, 0);

  const readinessPercent = totalRequired > 0 ? Math.round((totalScanned / totalRequired) * 100) : 0;

  // Identify all conflict items on this pull sheet
  const conflictItems = activeQuote.equipmentItems.filter((item) => {
    const inv = inventory.find((i) => i.id === item.inventoryId);
    const hasTickets = maintenanceRecords.some(
      (m) =>
        m.inventoryItemId === item.inventoryId &&
        (m.status === 'In Progress' || m.status === 'Scheduled')
    );
    return (inv?.inRepairQuantity ?? 0) > 0 || inv?.status === 'In Maintenance' || hasTickets;
  });

  const handleScanItem = (inventoryId: string, current: number, max: number) => {
    const nextVal = Math.min(max, current + 1);
    updatePulledGearCount(activeQuote.id, inventoryId, nextVal);
  };

  const handleMarkAllPulled = () => {
    activeQuote.equipmentItems.forEach((item) => {
      updatePulledGearCount(activeQuote.id, item.inventoryId, item.quantity);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Warehouse Staging & Truck Pull Sheet
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Loading dock checklist with real-time maintenance conflict detection and case verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Select Quote Dropdown */}
          <select
            value={activeQuote.id}
            onChange={(e) => {
              const q = quotes.find((item) => item.id === e.target.value);
              if (q) setSelectedQuoteForPull(q);
            }}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
          >
            {approvedQuotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quoteNumber} - {q.eventName}
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="p-2 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            title="Print Pull Sheet"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Production Details Card */}
      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono text-amber-400">{activeQuote.quoteNumber}</span>
            <h2 className="text-base font-bold text-white mt-0.5">{activeQuote.eventName}</h2>
            <div className="text-xs text-neutral-400 mt-1">
              Venue: {activeQuote.venueName} · Load-in: {activeQuote.loadInDate}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllPulled}
              className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            >
              Mark All Cases Pulled
            </button>
          </div>
        </div>

        {/* Readiness Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-neutral-400">Truck Load Preparation:</span>
            <span className="font-mono font-bold text-white tabular-nums">
              {totalScanned} of {totalRequired} units staged ({readinessPercent}%)
            </span>
          </div>
          <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                readinessPercent === 100 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Maintenance Conflict Alert Banner (if any conflict items exist) */}
      {conflictItems.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-600/50 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-300">
              Maintenance Cross-Reference Alert ({conflictItems.length} line item{conflictItems.length > 1 ? 's' : ''} affected)
            </h4>
            <p className="text-neutral-300 mt-0.5 leading-relaxed">
              Certain gear on this manifest currently has units in the repair bay or scheduled for safety inspection.
              Inspect the <strong className="text-white">Conflicts</strong> column below to confirm quarantine road cases are not loaded onto the truck.
            </p>
          </div>
        </div>
      )}

      {/* Equipment Checklist Table with 'Conflicts' column */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Required Equipment</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Maintenance Conflicts</th>
                <th className="py-3 px-4 text-center">Required Qty</th>
                <th className="py-3 px-4 text-center">Staged / Scanned</th>
                <th className="py-3 px-4 text-center">Verification Status</th>
                <th className="py-3 px-4 text-right">Dock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70 text-neutral-200">
              {activeQuote.equipmentItems.map((item) => {
                const currentCount = activeQuote.pulledGearStatus?.[item.inventoryId] || 0;
                const isComplete = currentCount >= item.quantity;

                // Cross-reference against Inventory & Maintenance
                const invItem = inventory.find((i) => i.id === item.inventoryId);
                const activeTickets = maintenanceRecords.filter(
                  (m) =>
                    m.inventoryItemId === item.inventoryId &&
                    (m.status === 'In Progress' || m.status === 'Scheduled')
                );

                const inRepairCount =
                  invItem?.inRepairQuantity ||
                  (invItem?.status === 'In Maintenance' ? 1 : 0);
                const hasMaintenanceUnits = inRepairCount > 0 || activeTickets.length > 0;
                const hasShortage = invItem ? item.quantity > invItem.availableQuantity : false;

                return (
                  <tr key={item.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* Equipment Description */}
                    <td className="py-3.5 px-4 font-semibold text-white max-w-xs">
                      <div className="truncate">{item.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        {invItem?.sku || 'SKU'} · Bin: {invItem?.locationBin || 'Warehouse'}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap">
                      {item.category}
                    </td>

                    {/* Conflicts Column */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {hasShortage && hasMaintenanceUnits ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeTickets[0] && invItem) {
                                setSelectedConflictTicket({
                                  itemName: invItem.name,
                                  sku: invItem.sku,
                                  bin: invItem.locationBin,
                                  ticket: activeTickets[0],
                                  inRepairCount,
                                  availableCount: invItem.availableQuantity,
                                  requestedCount: item.quantity,
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-rose-950 text-rose-300 border border-rose-800/80 font-semibold hover:bg-rose-900 transition-colors cursor-pointer text-left"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>Shortage: {inRepairCount} in repair</span>
                          </button>
                          <div className="text-[10px] text-rose-400 leading-tight">
                            Needs {item.quantity} · Only {invItem?.availableQuantity} available
                          </div>
                        </div>
                      ) : hasMaintenanceUnits ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeTickets[0] && invItem) {
                                setSelectedConflictTicket({
                                  itemName: invItem.name,
                                  sku: invItem.sku,
                                  bin: invItem.locationBin,
                                  ticket: activeTickets[0],
                                  inRepairCount,
                                  availableCount: invItem.availableQuantity,
                                  requestedCount: item.quantity,
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950 text-amber-300 border border-amber-800/80 hover:bg-amber-900 transition-colors cursor-pointer text-left"
                          >
                            <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{inRepairCount} in service ({activeTickets[0]?.status || 'In Maintenance'})</span>
                          </button>
                          <div className="text-[10px] text-neutral-400 leading-tight truncate max-w-[200px]" title={activeTickets[0]?.issueDescription}>
                            {activeTickets[0]?.issueDescription || `Do not load repair units from ${invItem?.locationBin}`}
                          </div>
                        </div>
                      ) : invItem?.status === 'Decommissioned' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          Decommissioned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Clear · {invItem?.availableQuantity ?? item.quantity} Ready</span>
                        </span>
                      )}
                    </td>

                    {/* Required Qty */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white whitespace-nowrap">
                      {item.quantity}
                    </td>

                    {/* Staged / Scanned */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                      <span className={isComplete ? 'text-emerald-400' : 'text-amber-400'}>
                        {currentCount}
                      </span>{' '}
                      / {item.quantity}
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                          <Check className="w-3 h-3" />
                          Verified on Truck
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80">
                          Pending Scan ({item.quantity - currentCount} left)
                        </span>
                      )}
                    </td>

                    {/* Dock Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleScanItem(item.inventoryId, currentCount, item.quantity)}
                        disabled={isComplete}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isComplete
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                        }`}
                      >
                        {isComplete ? 'Loaded' : '+1 Case Scanned'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conflict Detail Modal */}
      {selectedConflictTicket && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Maintenance Conflict Report</h3>
              </div>
              <button
                onClick={() => setSelectedConflictTicket(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{selectedConflictTicket.itemName}</h4>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">
                SKU: {selectedConflictTicket.sku} · Location Bin: {selectedConflictTicket.bin}
              </p>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Requested on Pull Sheet:</span>
                <span className="font-mono text-white font-bold">{selectedConflictTicket.requestedCount} units</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Currently Available in Fleet:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedConflictTicket.availableCount} units</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Currently in Service/Repair:</span>
                <span className="font-mono text-amber-400 font-bold">{selectedConflictTicket.inRepairCount} units</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Service Type:</span>
                <span className="text-white font-medium">{selectedConflictTicket.ticket.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Service Vendor:</span>
                <span className="text-white">{selectedConflictTicket.ticket.serviceVendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Assigned Tech:</span>
                <span className="text-white">{selectedConflictTicket.ticket.technician}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-0.5">Reported Issue:</span>
                <p className="text-neutral-300 leading-relaxed bg-neutral-900 p-2 rounded border border-neutral-800/80">
                  {selectedConflictTicket.ticket.issueDescription}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedConflictTicket(null);
                  setActiveTab('maintenance');
                }}
                className="text-xs text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
              >
                <span>Go to Maintenance module →</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedConflictTicket(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
