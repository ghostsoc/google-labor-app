import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LaborShift, AssignedShiftEquipment, InventoryItem } from '../types';
import {
  X,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  AlertTriangle,
  Layers,
  Barcode,
  MapPin,
  User,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ShiftGearAssignmentModalProps {
  shift: LaborShift;
  onClose: () => void;
}

export const ShiftGearAssignmentModal: React.FC<ShiftGearAssignmentModalProps> = ({
  shift,
  onClose,
}) => {
  const { inventory, updateShift, currentUser } = useApp();

  const assignedEquipment: AssignedShiftEquipment[] = useMemo(() => {
    return shift.assignedEquipment || [];
  }, [shift.assignedEquipment]);

  // New Equipment Assignment Form State
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [searchInventoryTerm, setSearchInventoryTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  // Filter inventory items for selection
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchInventoryTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchInventoryTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchInventoryTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchInventoryTerm, categoryFilter]);

  const selectedInventoryItem = useMemo(() => {
    return inventory.find((i) => i.id === selectedInventoryId);
  }, [inventory, selectedInventoryId]);

  // Handle adding equipment to this crew shift
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;

    // Check if already assigned
    const existingIndex = assignedEquipment.findIndex(
      (item) => item.inventoryId === selectedInventoryItem.id
    );

    let updatedList: AssignedShiftEquipment[];
    if (existingIndex >= 0) {
      // Update quantity on existing assignment
      updatedList = assignedEquipment.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              quantity: item.quantity + quantity,
              notes: assignmentNotes || item.notes,
            }
          : item
      );
    } else {
      const newAssignment: AssignedShiftEquipment = {
        id: `ase-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        inventoryId: selectedInventoryItem.id,
        name: selectedInventoryItem.name,
        sku: selectedInventoryItem.sku,
        category: selectedInventoryItem.category,
        quantity,
        locationBin: selectedInventoryItem.locationBin,
        barcode: selectedInventoryItem.barcode,
        stagedStatus: 'Pending Staging',
        notes: assignmentNotes,
      };
      updatedList = [...assignedEquipment, newAssignment];
    }

    updateShift(shift.id, { assignedEquipment: updatedList });

    // Reset selection form
    setSelectedInventoryId('');
    setQuantity(1);
    setAssignmentNotes('');
  };

  // Toggle or update status of individual assigned item
  const handleUpdateItemStatus = (
    itemId: string,
    newStatus: 'Pending Staging' | 'Staged / Checked Out' | 'Returned'
  ) => {
    const updatedList = assignedEquipment.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          stagedStatus: newStatus,
          stagedAt:
            newStatus === 'Staged / Checked Out'
              ? new Date().toLocaleString([], {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : item.stagedAt,
          stagedBy:
            newStatus === 'Staged / Checked Out'
              ? currentUser?.displayName || 'Warehouse Lead'
              : item.stagedBy,
        };
      }
      return item;
    });

    updateShift(shift.id, { assignedEquipment: updatedList });
  };

  // Remove assigned gear item
  const handleRemoveItem = (itemId: string) => {
    const updatedList = assignedEquipment.filter((item) => item.id !== itemId);
    updateShift(shift.id, { assignedEquipment: updatedList });
  };

  // Mark all items as staged
  const handleMarkAllStaged = () => {
    const timestamp = new Date().toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const updatedList = assignedEquipment.map((item) => ({
      ...item,
      stagedStatus: 'Staged / Checked Out' as const,
      stagedAt: timestamp,
      stagedBy: currentUser?.displayName || 'Warehouse Staging Team',
    }));
    updateShift(shift.id, { assignedEquipment: updatedList });
  };

  // Staging metrics
  const totalItemsCount = assignedEquipment.reduce((sum, item) => sum + item.quantity, 0);
  const stagedItemsCount = assignedEquipment
    .filter((item) => item.stagedStatus === 'Staged / Checked Out')
    .reduce((sum, item) => sum + item.quantity, 0);
  const isFullyStaged =
    assignedEquipment.length > 0 && stagedItemsCount === totalItemsCount;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <Package className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Crew Equipment Assignment & Staging
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isFullyStaged
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : assignedEquipment.length > 0
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {isFullyStaged
                    ? 'Fully Staged'
                    : assignedEquipment.length > 0
                    ? `Staging ${stagedItemsCount}/${totalItemsCount} Units`
                    : 'No Gear Assigned'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Assign specific gear packages and track warehouse bay staging for {shift.staffName} ({shift.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintMode(!isPrintMode)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isPrintMode
                  ? 'bg-amber-400 text-neutral-950 border-amber-400'
                  : 'text-neutral-400 hover:text-white bg-neutral-800 border-neutral-700'
              }`}
              title="Toggle Warehouse Staging Slip View"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shift Details Banner */}
        <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Technician & Role</span>
            <span className="text-white font-bold flex items-center gap-1.5 mt-0.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              {shift.staffName} · {shift.role}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Production & Venue</span>
            <span className="text-white font-medium truncate block mt-0.5" title={shift.eventName}>
              {shift.eventName}
            </span>
            <span className="text-neutral-400 text-[11px] truncate block">{shift.venue}</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Call Date & Time</span>
            <span className="text-amber-300 font-bold block mt-0.5">
              {shift.date} · {shift.startTime} – {shift.endTime}
            </span>
            <span className="text-neutral-400 text-[11px] block">{shift.callType}</span>
          </div>
        </div>

        {/* View Mode 1: Printable Staging Slip */}
        {isPrintMode ? (
          <div className="space-y-4">
            <div className="p-5 bg-white text-neutral-900 rounded-xl font-mono text-xs space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-3">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">IN THE WIND AV · STAGING MANIFEST</h3>
                  <p className="text-[11px] text-neutral-600">Bay Dispatch Ticket for Crew Call</p>
                </div>
                <div className="text-right text-[11px]">
                  <div>Date: {shift.date}</div>
                  <div>Call: {shift.startTime}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] border-b border-neutral-300 pb-3">
                <div>
                  <p><strong>Crew Lead:</strong> {shift.staffName} ({shift.role})</p>
                  <p><strong>Event:</strong> {shift.eventName}</p>
                </div>
                <div>
                  <p><strong>Venue:</strong> {shift.venue}</p>
                  <p><strong>Call Scope:</strong> {shift.callType}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase mb-2">Assigned Gear Checklist ({totalItemsCount} Units):</h4>
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-neutral-300 text-neutral-600">
                      <th className="py-1">Status</th>
                      <th className="py-1">SKU</th>
                      <th className="py-1">Item Description</th>
                      <th className="py-1">Bin / Rack</th>
                      <th className="py-1 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {assignedEquipment.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1.5 font-bold">
                          [ {item.stagedStatus === 'Staged / Checked Out' ? 'X' : ' '} ]
                        </td>
                        <td className="py-1.5">{item.sku}</td>
                        <td className="py-1.5">
                          {item.name}
                          {item.notes && <div className="text-[10px] text-neutral-500 italic">{item.notes}</div>}
                        </td>
                        <td className="py-1.5">{item.locationBin || 'Yard'}</td>
                        <td className="py-1.5 text-right font-bold">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-6 border-t-2 border-dashed border-neutral-300 flex justify-between text-[10px]">
                <div>Staged By: __________________________</div>
                <div>Crew Lead Signature: __________________________</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Staging Ticket</span>
              </button>
            </div>
          </div>
        ) : (
          /* View Mode 2: Interactive Gear Assignment & Staging Manager */
          <div className="space-y-5">
            {/* Quick Actions & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assigned Gear Manifest ({assignedEquipment.length} Line Items)</span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Gear will be staged in the warehouse staging bay prior to call time
                </p>
              </div>

              {assignedEquipment.length > 0 && !isFullyStaged && (
                <button
                  onClick={handleMarkAllStaged}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-neutral-950 hover:bg-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark All As Staged</span>
                </button>
              )}
            </div>

            {/* List of currently assigned equipment */}
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {assignedEquipment.length === 0 ? (
                <div className="p-8 bg-neutral-950/60 border border-neutral-800 rounded-xl text-center text-neutral-400 text-xs">
                  <Package className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                  <p className="font-medium text-neutral-300">No equipment currently assigned to this shift</p>
                  <p className="text-neutral-500 mt-1">
                    Select gear from the catalog below to assign necessary tools, consoles, or rigs.
                  </p>
                </div>
              ) : (
                assignedEquipment.map((item) => {
                  const isStaged = item.stagedStatus === 'Staged / Checked Out';
                  const isReturned = item.stagedStatus === 'Returned';

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isStaged
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isReturned
                              ? 'bg-neutral-800 text-neutral-400'
                              : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          }`}
                        >
                          <Package className="w-4 h-4" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{item.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-amber-400 border border-neutral-800">
                              Qty: {item.quantity}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1 font-mono">
                            <span>SKU: {item.sku}</span>
                            {item.locationBin && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-neutral-500" />
                                {item.locationBin}
                              </span>
                            )}
                            {item.barcode && (
                              <span className="flex items-center gap-1">
                                <Barcode className="w-3 h-3 text-neutral-500" />
                                {item.barcode}
                              </span>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-neutral-400 italic mt-1">
                              Note: {item.notes}
                            </p>
                          )}

                          {item.stagedAt && (
                            <p className="text-[10px] text-emerald-400 font-mono mt-1">
                              ✓ Staged at {item.stagedAt} by {item.stagedBy}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Staging Status Controls & Delete */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <select
                          value={item.stagedStatus}
                          onChange={(e) =>
                            handleUpdateItemStatus(
                              item.id,
                              e.target.value as 'Pending Staging' | 'Staged / Checked Out' | 'Returned'
                            )
                          }
                          className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border focus:outline-none cursor-pointer ${
                            isStaged
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isReturned
                              ? 'bg-neutral-900 text-neutral-400 border-neutral-700'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          <option value="Pending Staging">Pending Staging</option>
                          <option value="Staged / Checked Out">Staged / Checked Out</option>
                          <option value="Returned">Returned to Shelf</option>
                        </select>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          title="Remove assignment"
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Equipment Assignment Selector Form */}
            <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Assign Additional Gear to {shift.staffName}</span>
              </h4>

              <form onSubmit={handleAddEquipment} className="space-y-3">
                {/* Search & Filter for catalog */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 relative">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search inventory gear by name, SKU, model..."
                      value={searchInventoryTerm}
                      onChange={(e) => setSearchInventoryTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="All">All Categories</option>
                      <option value="Audio">Audio</option>
                      <option value="Video">Video</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Rigging & Power">Rigging & Power</option>
                      <option value="Staging & Truss">Staging & Truss</option>
                      <option value="Cables & Comms">Cables & Comms</option>
                    </select>
                  </div>
                </div>

                {/* Gear Select Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Choose Catalog Gear Item *
                    </label>
                    <select
                      required
                      value={selectedInventoryId}
                      onChange={(e) => setSelectedInventoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="">-- Select gear item from fleet --</option>
                      {filteredInventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.category}) — {item.availableQuantity} Avail
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedInventoryItem ? Math.max(1, selectedInventoryItem.availableQuantity) : 99}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Staging notes / prep instructions */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Prep & Staging Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Firmware v2.4 pre-loaded, G57 RF coordination, include Pelican case cables..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Add button */}
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!selectedInventoryId}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Equipment to Shift</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
          <span className="text-xs text-neutral-400 font-mono">
            {assignedEquipment.length} items assigned · {stagedItemsCount} of {totalItemsCount} units staged
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
