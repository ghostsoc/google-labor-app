import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, InventoryCategory, ItemStatus } from '../types';
import { exportToCSV } from '../utils/csvExport';
import { QRCodeScannerModal } from './QRCodeScannerModal';
import { EquipmentScanDetailModal } from './EquipmentScanDetailModal';
import { ItemQRCodeModal } from './ItemQRCodeModal';
import { BatchQRLabelsModal } from './BatchQRLabelsModal';
import {
  Search,
  Plus,
  Wrench,
  SlidersHorizontal,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Archive,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  Download,
  QrCode,
  Tag,
  Printer,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import { GoogleSheetsModal } from './GoogleSheetsModal';

export const InventoryManager: React.FC = () => {
  const {
    inventory,
    quotes,
    maintenanceRecords,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    setItemMaintenanceStatus,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // QR and Barcode Scanner & Generator State
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedEquipmentItem, setScannedEquipmentItem] = useState<InventoryItem | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [qrModalItem, setQrModalItem] = useState<InventoryItem | null>(null);
  const [isBatchQROpen, setIsBatchQROpen] = useState<boolean>(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [maintenanceTargetItem, setMaintenanceTargetItem] = useState<InventoryItem | null>(null);
  const [repairCountInput, setRepairCountInput] = useState<number>(1);

  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    category: 'Audio',
    subcategory: 'Speakers & P.A.',
    status: 'Available',
    totalQuantity: 4,
    availableQuantity: 4,
    onRentQuantity: 0,
    inRepairQuantity: 0,
    dayRate: 150,
    weekRate: 450,
    replacementCost: 3500,
    locationBin: 'Bay A-01',
    barcode: `ITW-${Math.floor(10000 + Math.random() * 90000)}`,
  });

  const categories: string[] = [
    'All',
    'Audio',
    'Video',
    'Lighting',
    'Rigging & Power',
    'Staging & Truss',
    'Cables & Comms',
  ];

  // Filtering
  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationBin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Available' && item.status === 'Available' && item.availableQuantity > 0) ||
      (selectedStatus === 'In Maintenance' && (item.status === 'In Maintenance' || item.inRepairQuantity > 0)) ||
      (selectedStatus === 'Decommissioned' && item.status === 'Decommissioned');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      sku: `AV-${Date.now().toString().slice(-5)}`,
      category: 'Audio',
      subcategory: 'Microphones',
      model: '',
      status: 'Available',
      totalQuantity: 4,
      availableQuantity: 4,
      onRentQuantity: 0,
      inRepairQuantity: 0,
      dayRate: 120,
      weekRate: 360,
      replacementCost: 2000,
      locationBin: 'Bay A-01',
      barcode: `ITW-${Math.floor(10000 + Math.random() * 90000)}`,
      powerWatts: 0,
      weightLbs: 10,
      notes: '',
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setFormData(item);
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    const total = Number(formData.totalQuantity) || 1;
    const onRent = Number(formData.onRentQuantity) || 0;
    const inRepair = Number(formData.inRepairQuantity) || 0;
    const avail = Math.max(0, total - onRent - inRepair);

    const payload: Omit<InventoryItem, 'id'> = {
      name: formData.name || 'Untitled Gear',
      sku: formData.sku || 'SKU-001',
      category: (formData.category as InventoryCategory) || 'Audio',
      subcategory: formData.subcategory || 'General',
      model: formData.model || formData.name || '',
      status: (formData.status as ItemStatus) || 'Available',
      totalQuantity: total,
      availableQuantity: avail,
      onRentQuantity: onRent,
      inRepairQuantity: inRepair,
      dayRate: Number(formData.dayRate) || 0,
      weekRate: Number(formData.weekRate) || 0,
      replacementCost: Number(formData.replacementCost) || 0,
      locationBin: formData.locationBin || 'Shelf A',
      barcode: formData.barcode || 'ITW-0000',
      powerWatts: Number(formData.powerWatts) || 0,
      weightLbs: Number(formData.weightLbs) || 0,
      notes: formData.notes || '',
      lastServiceDate: formData.lastServiceDate,
      nextServiceDueDate: formData.nextServiceDueDate,
    };

    if (editingItem) {
      updateInventoryItem(editingItem.id, payload);
    } else {
      addInventoryItem(payload);
    }

    setIsAddModalOpen(false);
  };

  const handleApplyMaintenance = (item: InventoryItem, newStatus: ItemStatus, count: number) => {
    setItemMaintenanceStatus(item.id, newStatus, count);
    setMaintenanceTargetItem(null);
  };

  const handleExportInventoryCSV = () => {
    const headers = [
      'SKU',
      'Equipment Name',
      'Category',
      'Subcategory',
      'Model',
      'Fleet Status',
      'Total Qty',
      'Available Qty',
      'On-Rent Qty',
      'In-Repair Qty',
      'Day Rate ($)',
      'Week Rate ($)',
      'Replacement Value ($)',
      'Location Bin',
      'Barcode',
      'Power (Watts)',
      'Weight (lbs)',
      'Last Service Date',
      'Next Service Due',
      'Notes',
    ];

    const rows = filteredItems.map((item) => [
      item.sku,
      item.name,
      item.category,
      item.subcategory,
      item.model,
      item.status,
      item.totalQuantity,
      item.availableQuantity,
      item.onRentQuantity,
      item.inRepairQuantity,
      item.dayRate,
      item.weekRate,
      item.replacementCost,
      item.locationBin,
      item.barcode,
      item.powerWatts || 0,
      item.weightLbs || 0,
      item.lastServiceDate || '',
      item.nextServiceDueDate || '',
      item.notes || '',
    ]);

    exportToCSV(`inventory_fleet_export_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Inventory & Fleet Assets
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Tracking {inventory.length} catalog items across Audio, Video, Lighting, and Rigging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQRScannerOpen(true)}
            title="Scan equipment QR code or barcode with camera"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR / Barcode</span>
          </button>
          <button
            onClick={() => setIsBatchQROpen(true)}
            title="Batch print equipment QR asset labels"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 hover:text-white rounded-lg border border-neutral-700 transition-colors shadow-xs cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Print QR Labels</span>
          </button>
          <button
            onClick={handleExportInventoryCSV}
            title={`Download CSV report of ${filteredItems.length} inventory items`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
            <span className="text-[10px] bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700/60 font-mono">
              {filteredItems.length}
            </span>
          </button>
          <button
            onClick={() => setIsSheetsModalOpen(true)}
            title="Export Fleet to Google Sheets or Import Equipment Catalog"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-emerald-300 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Sheets</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Service Tickets</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by model, SKU, barcode, or bin location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-neutral-400 mr-1.5">Fleet Status:</span>
            {['All', 'Available', 'In Maintenance', 'Decommissioned'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
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

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-t border-neutral-800/60 pt-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Equipment / Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location / Bin</th>
                <th className="py-3 px-4 text-center">Fleet Stock</th>
                <th className="py-3 px-4 text-right">Rates (Day / Wk)</th>
                <th className="py-3 px-4 text-center">Service Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70 text-neutral-200">
              {filteredItems.map((item) => {
                const isUnderMaintenance =
                  item.status === 'In Maintenance' || item.inRepairQuantity > 0;
                const isDecommissioned = item.status === 'Decommissioned';

                return (
                  <tr key={item.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* Item Name & SKU */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-semibold text-white truncate">{item.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>{item.sku}</span>
                        <span>·</span>
                        <button
                          onClick={() => setQrModalItem(item)}
                          title="Generate & View QR Code Tag"
                          className="inline-flex items-center gap-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3 h-3 text-amber-400/80" />
                          <span>BC: {item.barcode}</span>
                        </button>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-neutral-300">
                      <div>{item.category}</div>
                      <div className="text-[11px] text-neutral-500">{item.subcategory}</div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-neutral-300">
                      {item.locationBin}
                    </td>

                    {/* Stock Counts */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 font-mono tabular-nums">
                        <span
                          className={`font-bold ${
                            item.availableQuantity > 0 ? 'text-emerald-400' : 'text-neutral-500'
                          }`}
                          title="Available in warehouse"
                        >
                          {item.availableQuantity} Avail
                        </span>
                        <span className="text-neutral-600">/</span>
                        <span className="text-amber-400" title="On rent at show">
                          {item.onRentQuantity} Rent
                        </span>
                        {item.inRepairQuantity > 0 && (
                          <>
                            <span className="text-neutral-600">/</span>
                            <span className="text-rose-400" title="In repair">
                              {item.inRepairQuantity} Rep
                            </span>
                          </>
                        )}
                        <span className="text-neutral-500 text-[10px]">
                          ({item.totalQuantity} total)
                        </span>
                      </div>
                    </td>

                    {/* Day / Week Rates */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono tabular-nums">
                      <div className="font-semibold text-white">${item.dayRate}/day</div>
                      <div className="text-[11px] text-neutral-400">${item.weekRate}/wk</div>
                    </td>

                    {/* Service & Condition Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isDecommissioned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">
                          Decommissioned
                        </span>
                      ) : isUnderMaintenance ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950 text-amber-300 border border-amber-800/80">
                          <Wrench className="w-3 h-3" />
                          In Service ({item.inRepairQuantity})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready Fleet
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Generate & View Item QR Code */}
                        <button
                          onClick={() => setQrModalItem(item)}
                          title="Generate & View QR Code Asset Tag"
                          className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Check-in / Check-out Simulation */}
                        <button
                          onClick={() => {
                            setScannedEquipmentItem(item);
                            setScannedBarcode(item.barcode);
                          }}
                          title="Scan Check-In / Check-Out Actions"
                          className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                        </button>

                        {/* Maintenance toggle */}
                        <button
                          onClick={() => {
                            setMaintenanceTargetItem(item);
                            setRepairCountInput(item.inRepairQuantity || 1);
                          }}
                          title="Manage Maintenance Status"
                          className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Equipment"
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${item.name}" from fleet inventory?`)) {
                              deleteInventoryItem(item.id);
                            }
                          }}
                          title="Delete Item"
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                    <p className="text-sm font-medium">No equipment found matching criteria</p>
                    <p className="text-xs text-neutral-500 mt-1">Try clearing search or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Maintenance Status Modal */}
      {maintenanceTargetItem && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Service & Fleet Status</h3>
              </div>
              <button
                onClick={() => setMaintenanceTargetItem(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-white">{maintenanceTargetItem.name}</p>
              <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                SKU: {maintenanceTargetItem.sku} · Total Fleet: {maintenanceTargetItem.totalQuantity}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  How many units currently in repair/maintenance?
                </label>
                <input
                  type="number"
                  min="0"
                  max={maintenanceTargetItem.totalQuantity}
                  value={repairCountInput}
                  onChange={(e) => setRepairCountInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() =>
                    handleApplyMaintenance(
                      maintenanceTargetItem,
                      repairCountInput > 0 ? 'In Maintenance' : 'Available',
                      repairCountInput
                    )
                  }
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Update Service Units ({repairCountInput} in repair)
                </button>

                <button
                  onClick={() => handleApplyMaintenance(maintenanceTargetItem, 'Available', 0)}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                >
                  Return All Units to Available Fleet
                </button>

                <button
                  onClick={() => handleApplyMaintenance(maintenanceTargetItem, 'Decommissioned', 0)}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                >
                  Decommission / Retire Gear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Equipment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-white">
                {editingItem ? 'Edit Equipment Specifications' : 'Add New Inventory Asset'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Equipment Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Shure Axient Digital Quad Wireless Receiver Kit"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. AUD-SHU-AD4Q"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as InventoryCategory })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Audio">Audio</option>
                    <option value="Video">Video</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Rigging & Power">Rigging & Power</option>
                    <option value="Staging & Truss">Staging & Truss</option>
                    <option value="Cables & Comms">Cables & Comms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory || ''}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Wireless Mics, Moving Heads, Line Array"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Warehouse Bin / Rack Location
                  </label>
                  <input
                    type="text"
                    value={formData.locationBin || ''}
                    onChange={(e) => setFormData({ ...formData, locationBin: e.target.value })}
                    placeholder="e.g. Audio Rack A-01"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Total Fleet Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalQuantity || 1}
                    onChange={(e) => setFormData({ ...formData, totalQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Barcode / Asset ID
                  </label>
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. ITW-88201"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Daily Rental Rate ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.dayRate || 0}
                    onChange={(e) => setFormData({ ...formData, dayRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Weekly Rental Rate ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weekRate || 0}
                    onChange={(e) => setFormData({ ...formData, weekRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Replacement Value ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.replacementCost || 0}
                    onChange={(e) => setFormData({ ...formData, replacementCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Power Draw (Watts)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.powerWatts || 0}
                    onChange={(e) => setFormData({ ...formData, powerWatts: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Technical Specifications / Road Case Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Include flight case configuration, included accessories, cable bundles..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Inventory Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Camera Scanner Modal */}
      <QRCodeScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        inventory={inventory}
        onItemFound={(item, code) => {
          setIsQRScannerOpen(false);
          setScannedBarcode(code);
          setScannedEquipmentItem(item);
        }}
      />

      {/* Equipment Quick Scan Check-in / Check-out Details Modal */}
      {scannedEquipmentItem && (
        <EquipmentScanDetailModal
          item={scannedEquipmentItem}
          scannedCode={scannedBarcode || scannedEquipmentItem.barcode}
          onClose={() => setScannedEquipmentItem(null)}
          onScanNext={() => {
            setScannedEquipmentItem(null);
            setIsQRScannerOpen(true);
          }}
          onUpdateStock={(id, updates) => {
            updateInventoryItem(id, updates);
            setScannedEquipmentItem((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
          }}
          onSendToMaintenance={(item) => {
            setScannedEquipmentItem(null);
            setMaintenanceTargetItem(item);
            setRepairCountInput(1);
          }}
          quotes={quotes}
          maintenanceRecords={maintenanceRecords}
        />
      )}

      {/* Item QR Code Generator & Label Print Modal */}
      {qrModalItem && (
        <ItemQRCodeModal
          item={qrModalItem}
          isOpen={!!qrModalItem}
          onClose={() => setQrModalItem(null)}
        />
      )}

      {/* Batch QR Code Labels Sheet Modal */}
      <BatchQRLabelsModal
        isOpen={isBatchQROpen}
        onClose={() => setIsBatchQROpen(false)}
        inventory={filteredItems}
      />

      {/* Google Sheets Sync & Import Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        initialTab="inventory"
      />
    </div>
  );
};
