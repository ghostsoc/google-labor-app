import React, { useState } from 'react';
import { InventoryItem, ClientQuote, MaintenanceRecord } from '../types';
import {
  CheckCircle2,
  Package,
  Wrench,
  ArrowRight,
  ArrowLeft,
  X,
  QrCode,
  MapPin,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';

interface EquipmentScanDetailModalProps {
  item: InventoryItem;
  scannedCode: string;
  onClose: () => void;
  onScanNext: () => void;
  onUpdateStock: (id: string, updates: Partial<InventoryItem>) => void;
  onSendToMaintenance: (item: InventoryItem) => void;
  quotes: ClientQuote[];
  maintenanceRecords: MaintenanceRecord[];
}

export const EquipmentScanDetailModal: React.FC<EquipmentScanDetailModalProps> = ({
  item,
  scannedCode,
  onClose,
  onScanNext,
  onUpdateStock,
  onSendToMaintenance,
  quotes,
  maintenanceRecords,
}) => {
  const [successActionMsg, setSuccessActionMsg] = useState<string | null>(null);

  // Active bookings containing this item
  const activeBookings = quotes.filter(
    (q) =>
      (q.status === 'Approved' || q.status === 'Completed') &&
      q.equipmentItems.some((eq) => eq.inventoryId === item.id)
  );

  // Active maintenance tickets
  const activeTickets = maintenanceRecords.filter(
    (m) =>
      m.inventoryItemId === item.id &&
      (m.status === 'In Progress' || m.status === 'Scheduled')
  );

  const flashMessage = (msg: string) => {
    setSuccessActionMsg(msg);
    setTimeout(() => setSuccessActionMsg(null), 2500);
  };

  const handleCheckOut = () => {
    if (item.availableQuantity <= 0) {
      alert(`No units of ${item.name} currently available in warehouse to check out.`);
      return;
    }
    const newAvail = item.availableQuantity - 1;
    const newOnRent = item.onRentQuantity + 1;
    onUpdateStock(item.id, {
      availableQuantity: newAvail,
      onRentQuantity: newOnRent,
    });
    flashMessage(`Checked OUT 1 unit to show/truck (Remaining warehouse: ${newAvail})`);
  };

  const handleCheckIn = () => {
    if (item.onRentQuantity <= 0) {
      alert(`No units of ${item.name} currently recorded as on-rent.`);
      return;
    }
    const newOnRent = item.onRentQuantity - 1;
    const newAvail = item.availableQuantity + 1;
    onUpdateStock(item.id, {
      availableQuantity: newAvail,
      onRentQuantity: newOnRent,
    });
    flashMessage(`Checked IN 1 unit from show return (Now available in warehouse: ${newAvail})`);
  };

  const handleReturnFromMaintenance = () => {
    if (item.inRepairQuantity <= 0) return;
    const newRepair = Math.max(0, item.inRepairQuantity - 1);
    const newAvail = item.availableQuantity + 1;
    onUpdateStock(item.id, {
      inRepairQuantity: newRepair,
      availableQuantity: newAvail,
      status: newRepair === 0 ? 'Available' : 'In Maintenance',
    });
    flashMessage(`Restored 1 unit from repair bay to active warehouse stock!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-neutral-950 font-bold flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-400 font-bold">{item.barcode}</span>
                <span className="text-neutral-500">·</span>
                <span className="text-xs font-mono text-neutral-400">{item.sku}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 leading-snug">{item.name}</h2>
              <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <span>{item.category} ({item.subcategory})</span>
                <span>·</span>
                <span className="text-neutral-300 font-medium">Bin: {item.locationBin}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Feedback Toast Notification */}
        {successActionMsg && (
          <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successActionMsg}</span>
          </div>
        )}

        {/* Live Fleet Stock Cards */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
            <span className="text-[11px] text-neutral-400 block font-medium">Warehouse Avail</span>
            <div className={`text-2xl font-bold font-mono mt-1 ${item.availableQuantity > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
              {item.availableQuantity}
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Ready to ship</span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
            <span className="text-[11px] text-neutral-400 block font-medium">On-Rent / Show</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {item.onRentQuantity}
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">On road / trucks</span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
            <span className="text-[11px] text-neutral-400 block font-medium">In Service / Rep</span>
            <div className={`text-2xl font-bold font-mono mt-1 ${item.inRepairQuantity > 0 ? 'text-rose-400' : 'text-neutral-500'}`}>
              {item.inRepairQuantity}
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Quarantined</span>
          </div>
        </div>

        {/* Check-In / Check-Out Actions Panel */}
        <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Loading Dock Fast Actions
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Check Out button */}
            <button
              onClick={handleCheckOut}
              disabled={item.availableQuantity <= 0}
              className={`p-3 rounded-xl flex items-center justify-between font-semibold text-xs transition-colors cursor-pointer ${
                item.availableQuantity > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <div className="text-left">
                <div className="font-bold">Check OUT to Show</div>
                <div className="text-[10px] opacity-80 font-normal">Depart warehouse dock</div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Check In button */}
            <button
              onClick={handleCheckIn}
              disabled={item.onRentQuantity <= 0}
              className={`p-3 rounded-xl flex items-center justify-between font-semibold text-xs transition-colors cursor-pointer ${
                item.onRentQuantity > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <div className="text-left">
                <div className="font-bold">Check IN from Return</div>
                <div className="text-[10px] opacity-80 font-normal">Return to warehouse bin</div>
              </div>
              <RotateCcw className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Maintenance Actions */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            {item.inRepairQuantity > 0 ? (
              <button
                type="button"
                onClick={handleReturnFromMaintenance}
                className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Return 1 unit from repair to active fleet</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSendToMaintenance(item)}
                className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Log repair / send to service bay</span>
              </button>
            )}

            <span className="text-[11px] font-mono text-neutral-400">
              Total Fleet: {item.totalQuantity}
            </span>
          </div>
        </div>

        {/* Active Bookings / Shows */}
        {activeBookings.length > 0 && (
          <div className="space-y-1.5 text-xs">
            <span className="font-semibold text-neutral-300 block text-[11px] uppercase tracking-wider">
              Active Show Allocations:
            </span>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {activeBookings.map((q) => {
                const line = q.equipmentItems.find((eq) => eq.inventoryId === item.id);
                return (
                  <div
                    key={q.id}
                    className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between text-[11px]"
                  >
                    <span className="text-white font-medium truncate max-w-[200px]">
                      {q.eventName}
                    </span>
                    <span className="font-mono text-amber-400">
                      {line?.quantity} units · {q.loadInDate}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onScanNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Next Equipment Case</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
