import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MaintenanceRecord, MaintenanceType, MaintenanceStatus } from '../types';
import {
  Wrench,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  DollarSign,
  ArrowRight,
  X,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

export const MaintenanceManager: React.FC = () => {
  const {
    maintenanceRecords,
    inventory,
    staff,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    completeMaintenanceRecord,
    deleteMaintenanceRecord,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [completingRecord, setCompletingRecord] = useState<MaintenanceRecord | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionCost, setCompletionCost] = useState<number>(0);

  // New Maintenance Form State
  const [formState, setFormState] = useState<{
    inventoryItemId: string;
    type: MaintenanceType;
    status: MaintenanceStatus;
    serviceVendor: string;
    technician: string;
    cost: number;
    issueDescription: string;
    scheduledDate: string;
    nextServiceDueDate: string;
  }>({
    inventoryItemId: inventory[0]?.id || '',
    type: 'Repair / Component Fix',
    status: 'In Progress',
    serviceVendor: 'In-House Electronics Bench',
    technician: staff[0]?.name || 'Devon Tyler',
    cost: 150,
    issueDescription: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    nextServiceDueDate: '',
  });

  // Calculate Metrics
  const inProgressCount = maintenanceRecords.filter((m) => m.status === 'In Progress').length;
  const scheduledCount = maintenanceRecords.filter((m) => m.status === 'Scheduled').length;
  const completedCount = maintenanceRecords.filter((m) => m.status === 'Completed').length;
  const totalCost = maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0);

  const filteredRecords = maintenanceRecords.filter((record) => {
    const matchesSearch =
      record.inventoryItemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.serviceVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.technician.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'All' || record.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleOpenLogModal = () => {
    setFormState({
      inventoryItemId: inventory[0]?.id || '',
      type: 'Repair / Component Fix',
      status: 'In Progress',
      serviceVendor: 'In-House Electronics Bench',
      technician: staff[0]?.name || 'Devon Tyler',
      cost: 150,
      issueDescription: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      nextServiceDueDate: '',
    });
    setIsLogModalOpen(true);
  };

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find((i) => i.id === formState.inventoryItemId);
    if (!item) return;

    addMaintenanceRecord({
      inventoryItemId: item.id,
      inventoryItemName: item.name,
      sku: item.sku,
      type: formState.type,
      status: formState.status,
      serviceVendor: formState.serviceVendor,
      technician: formState.technician,
      cost: Number(formState.cost) || 0,
      issueDescription: formState.issueDescription,
      scheduledDate: formState.scheduledDate,
      nextServiceDueDate: formState.nextServiceDueDate || undefined,
    });

    setIsLogModalOpen(false);
  };

  const handleConfirmCompletion = () => {
    if (!completingRecord) return;
    completeMaintenanceRecord(
      completingRecord.id,
      completionNotes || 'Service completed, calibrated, and bench tested for active fleet dispatch.',
      completionCost
    );
    setCompletingRecord(null);
    setCompletionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Equipment Maintenance & Service Logs
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Track repairs, safety load certifications, firmware calibrations, and return units to the active fleet
          </p>
        </div>

        <button
          onClick={handleOpenLogModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Service / Repair</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>In Service Bay</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-amber-400/90 mt-1">Currently being serviced</div>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Scheduled Checks</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {scheduledCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Upcoming inspections</div>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Completed (YTD)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {completedCount}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Returned to active fleet</div>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Total Maintenance Spend</span>
            <DollarSign className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            ${totalCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Parts & vendor certs</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by gear name, SKU, vendor, tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto">
          {['All', 'In Progress', 'Scheduled', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
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

      {/* Maintenance Records Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Equipment & SKU</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Reported Issue / Scope</th>
                <th className="py-3 px-4">Vendor & Tech</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70 text-neutral-200">
              {filteredRecords.map((record) => {
                const isInProgress = record.status === 'In Progress';
                const isScheduled = record.status === 'Scheduled';
                const isCompleted = record.status === 'Completed';

                return (
                  <tr key={record.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* Gear Name */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">
                        {record.inventoryItemName}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>{record.sku}</span>
                        <span>·</span>
                        <span>Logged: {record.dateLogged}</span>
                      </div>
                    </td>

                    {/* Service Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-neutral-300">{record.type}</span>
                      {record.nextServiceDueDate && (
                        <div className="text-[10px] text-amber-400/80 mt-0.5">
                          Next due: {record.nextServiceDueDate}
                        </div>
                      )}
                    </td>

                    {/* Issue Description */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <p className="text-neutral-300 line-clamp-2">{record.issueDescription}</p>
                      {record.resolutionNotes && (
                        <p className="text-[11px] text-emerald-400/90 mt-1 line-clamp-1">
                          Fix: {record.resolutionNotes}
                        </p>
                      )}
                    </td>

                    {/* Vendor & Tech */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-white">{record.serviceVendor}</div>
                      <div className="text-[11px] text-neutral-400">Tech: {record.technician}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono ${
                          isInProgress
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                            : isScheduled
                            ? 'bg-sky-950 text-sky-400 border border-sky-800/80'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        }`}
                      >
                        {isInProgress && <Wrench className="w-3 h-3" />}
                        {isScheduled && <Clock className="w-3 h-3" />}
                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                        {record.status}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-semibold tabular-nums text-white">
                      ${record.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isInProgress || isScheduled ? (
                        <button
                          onClick={() => {
                            setCompletingRecord(record);
                            setCompletionCost(record.cost);
                            setCompletionNotes(record.resolutionNotes || '');
                          }}
                          className="px-2.5 py-1.5 text-xs font-medium bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Return to Fleet</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-500 font-mono">
                          Done {record.completedDate}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                    <p className="text-sm font-medium">No service records found</p>
                    <p className="text-xs text-neutral-500 mt-1">All equipment operational</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return to Fleet / Complete Service Modal */}
      {completingRecord && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Complete Service & Return to Fleet</h3>
              </div>
              <button
                onClick={() => setCompletingRecord(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-white">{completingRecord.inventoryItemName}</p>
              <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                SKU: {completingRecord.sku} · Issue: {completingRecord.issueDescription}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Final Resolution & Bench Test Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Diode replaced, optics aligned, 4-hour burn-in completed, ready for show staging."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Final Parts & Labor Cost ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={completionCost}
                  onChange={(e) => setCompletionCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCompletingRecord(null)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCompletion}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Mark Available & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Log Equipment Service or Repair</h2>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Select Equipment from Inventory *
                </label>
                <select
                  required
                  value={formState.inventoryItemId}
                  onChange={(e) =>
                    setFormState({ ...formState, inventoryItemId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.category}] {item.name} ({item.sku}) - Qty: {item.totalQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Service Scope / Type *
                  </label>
                  <select
                    value={formState.type}
                    onChange={(e) =>
                      setFormState({ ...formState, type: e.target.value as MaintenanceType })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Repair / Component Fix">Repair / Component Fix</option>
                    <option value="Inspection & Testing">Inspection & Testing</option>
                    <option value="Certification / Load Test">Certification / Load Test</option>
                    <option value="Routine Cleaning & Service">Routine Cleaning & Service</option>
                    <option value="Firmware & Calibration">Firmware & Calibration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Current Maintenance Status *
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) =>
                      setFormState({ ...formState, status: e.target.value as MaintenanceStatus })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="In Progress">In Progress (Remove unit from Available stock)</option>
                    <option value="Scheduled">Scheduled (Upcoming service)</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Service Vendor / Facility *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.serviceVendor}
                    onChange={(e) => setFormState({ ...formState, serviceVendor: e.target.value })}
                    placeholder="e.g. In-House Bench, L-Acoustics Factory Service"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Assigned Technician
                  </label>
                  <input
                    type="text"
                    value={formState.technician}
                    onChange={(e) => setFormState({ ...formState, technician: e.target.value })}
                    placeholder="e.g. Chris Vance, Devon Tyler"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Estimated / Actual Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.cost}
                    onChange={(e) => setFormState({ ...formState, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Next Routine Service Due Date
                  </label>
                  <input
                    type="date"
                    value={formState.nextServiceDueDate}
                    onChange={(e) =>
                      setFormState({ ...formState, nextServiceDueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Defect Description / Maintenance Notes *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formState.issueDescription}
                    onChange={(e) =>
                      setFormState({ ...formState, issueDescription: e.target.value })
                    }
                    placeholder="Describe failure symptom, broken hardware, certification interval, or replacement parts..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
