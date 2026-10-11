import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClientQuote,
  QuoteStatus,
  QuoteEquipmentItem,
  QuoteLaborItem,
  InventoryItem,
  CrewRole,
  Client,
  MeetingDiagramData,
} from '../types';
import { MeetingDiagramEditor } from './MeetingDiagramEditor';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Printer,
  DollarSign,
  Calendar,
  Layers,
  Users,
  ArrowRight,
  Receipt,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  ChevronDown,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  Eye,
  FileSpreadsheet,
  Mail,
} from 'lucide-react';
import { EventDetailModal } from './EventDetailModal';
import { GoogleSheetsModal } from './GoogleSheetsModal';
import { GmailComposeModal, GmailComposePrefill } from './GmailComposeModal';

interface QuotesManagerProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  preselectedClient?: Client | null;
  onClearPreselectedClient?: () => void;
}

export const QuotesManager: React.FC<QuotesManagerProps> = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  preselectedClient,
  onClearPreselectedClient,
}) => {
  const {
    quotes,
    inventory,
    staff,
    clients,
    addQuote,
    updateQuote,
    deleteQuote,
    updateQuoteStatus,
    convertQuoteToActiveJob,
    createInvoiceFromQuote,
    setActiveQuoteForPrint,
    setSelectedQuoteForPull,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<ClientQuote | null>(null);

  // Google Workspace direct action state
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [sheetsPreselectedQuoteId, setSheetsPreselectedQuoteId] = useState<string | undefined>(undefined);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [gmailPrefill, setGmailPrefill] = useState<GmailComposePrefill | null>(null);

  // Interactive Quote Builder State
  const [builderEventName, setBuilderEventName] = useState('Apex Technology Showcase 2026');
  const [builderClientId, setBuilderClientId] = useState<string>(clients[0]?.id || '');
  const [builderClientName, setBuilderClientName] = useState(clients[0]?.name || 'Sarah Jenkins');
  const [builderClientCompany, setBuilderClientCompany] = useState(clients[0]?.company || 'Apex Global');
  const [builderClientEmail, setBuilderClientEmail] = useState(clients[0]?.email || 's.jenkins@apexglobal.com');
  const [builderClientPhone, setBuilderClientPhone] = useState(clients[0]?.phone || '(415) 555-0182');
  const [builderVenueName, setBuilderVenueName] = useState('Moscone Center - Hall A');
  const [builderVenueAddress, setBuilderVenueAddress] = useState('747 Howard St, San Francisco, CA');
  const [builderLoadInDate, setBuilderLoadInDate] = useState('2026-10-18');
  const [builderShowStartDate, setBuilderShowStartDate] = useState('2026-10-19');
  const [builderShowEndDate, setBuilderShowEndDate] = useState('2026-10-20');
  const [builderStrikeDate, setBuilderStrikeDate] = useState('2026-10-20');

  const [builderEquipment, setBuilderEquipment] = useState<QuoteEquipmentItem[]>([]);
  const [builderLabor, setBuilderLabor] = useState<QuoteLaborItem[]>([]);
  const [builderLogisticsFee, setBuilderLogisticsFee] = useState<number>(650);
  const [builderDamageWaiverPercent, setBuilderDamageWaiverPercent] = useState<number>(6.0);
  const [builderTaxPercent, setBuilderTaxPercent] = useState<number>(8.5);
  const [builderDiscountPercent, setBuilderDiscountPercent] = useState<number>(0);
  const [builderClientNotes, setBuilderClientNotes] = useState('');
  const [builderInternalNotes, setBuilderInternalNotes] = useState('');

  // Meeting Diagram Builder State
  const [builderMeetingDiagram, setBuilderMeetingDiagram] = useState<MeetingDiagramData | undefined>({
    roomDimensions: { lengthFt: 90, widthFt: 60, ceilingHeightFt: 22, roomName: 'Moscone Center - Hall A' },
    backgroundOpacity: 0.65,
    elements: [
      {
        id: 'el-stage-01',
        type: 'stage',
        label: 'Main Stage (32x16ft)',
        x: 220,
        y: 60,
        width: 260,
        height: 100,
        rotation: 0,
        color: '#3b82f6',
        notes: 'Raised 36-inch with black wrap',
      },
      {
        id: 'el-led-01',
        type: 'led_screen',
        label: 'Absen 2.6mm Curved LED Wall',
        x: 240,
        y: 65,
        width: 220,
        height: 18,
        rotation: 0,
        color: '#eab308',
      },
      {
        id: 'el-podium-01',
        type: 'podium',
        label: 'Keynote Podium',
        x: 330,
        y: 110,
        width: 36,
        height: 36,
        rotation: 0,
        color: '#06b6d4',
        notes: 'Dual Shure Gooseneck Mics',
      },
      {
        id: 'el-spk-l',
        type: 'speaker_left',
        label: 'Kara Left Array',
        x: 180,
        y: 80,
        width: 30,
        height: 48,
        rotation: 0,
        color: '#10b981',
      },
      {
        id: 'el-spk-r',
        type: 'speaker_right',
        label: 'Kara Right Array',
        x: 490,
        y: 80,
        width: 30,
        height: 48,
        rotation: 0,
        color: '#10b981',
      },
      {
        id: 'el-foh-01',
        type: 'foh_console',
        label: 'FOH Audio & Lighting Control',
        x: 275,
        y: 350,
        width: 150,
        height: 55,
        rotation: 0,
        color: '#8b5cf6',
      },
    ],
  });

  const [activeDiagramModalQuote, setActiveDiagramModalQuote] = useState<ClientQuote | null>(null);
  const [isDiagramExpandedInBuilder, setIsDiagramExpandedInBuilder] = useState(true);

  // Equipment Picker Modal Helper
  const [isGearPickerOpen, setIsGearPickerOpen] = useState(false);
  const [gearSearch, setGearSearch] = useState('');
  const [gearCategory, setGearCategory] = useState<string>('All');

  // React to preselectedClient from CRM
  React.useEffect(() => {
    if (preselectedClient) {
      setBuilderClientId(preselectedClient.id);
      setBuilderClientName(preselectedClient.name);
      setBuilderClientCompany(preselectedClient.company);
      setBuilderClientEmail(preselectedClient.email);
      setBuilderClientPhone(preselectedClient.phone);
      setBuilderVenueAddress(preselectedClient.address || '');
      setBuilderTaxPercent(preselectedClient.taxExempt ? 0 : 8.5);
      setIsCreateModalOpen(true);
    }
  }, [preselectedClient, setIsCreateModalOpen]);

  // When client dropdown changes in builder
  const handleClientChange = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setBuilderClientId(found.id);
      setBuilderClientName(found.name);
      setBuilderClientCompany(found.company);
      setBuilderClientEmail(found.email);
      setBuilderClientPhone(found.phone);
      setBuilderVenueAddress(found.address || '');
      setBuilderTaxPercent(found.taxExempt ? 0 : 8.5);
    }
  };

  // Add equipment to quote
  const handleAddEquipmentLine = (item: InventoryItem) => {
    const existingIndex = builderEquipment.findIndex((e) => e.inventoryId === item.id);
    if (existingIndex >= 0) {
      const updated = [...builderEquipment];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total =
        updated[existingIndex].quantity *
        updated[existingIndex].days *
        updated[existingIndex].dayRate *
        (1 - updated[existingIndex].discountPercent / 100);
      setBuilderEquipment(updated);
    } else {
      const newLine: QuoteEquipmentItem = {
        id: `qe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        inventoryId: item.id,
        name: item.name,
        category: item.category,
        quantity: 1,
        days: 2,
        dayRate: item.dayRate,
        discountPercent: 0,
        total: item.dayRate * 2,
      };
      setBuilderEquipment([...builderEquipment, newLine]);
    }
  };

  // Add labor line to quote
  const handleAddLaborLine = () => {
    const defaultStaff = staff[0];
    const newLine: QuoteLaborItem = {
      id: `ql-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      staffId: defaultStaff?.id,
      staffName: defaultStaff?.name,
      role: defaultStaff?.role || 'A1 Audio Lead',
      callType: 'Load In + Show Operator',
      daysOrHours: 2,
      rateType: 'Day Rate',
      rate: defaultStaff?.dayRate || 750,
      quantity: 1,
      total: (defaultStaff?.dayRate || 750) * 2,
    };
    setBuilderLabor([...builderLabor, newLine]);
  };

  // Financial calculations
  const equipmentSubtotal = builderEquipment.reduce((sum, item) => sum + item.total, 0);
  const laborSubtotal = builderLabor.reduce((sum, item) => sum + item.total, 0);
  const damageWaiverAmount = (equipmentSubtotal * builderDamageWaiverPercent) / 100;
  const taxableBasis = equipmentSubtotal + damageWaiverAmount;
  const taxAmount = (taxableBasis * builderTaxPercent) / 100;
  const totalAmount =
    equipmentSubtotal +
    laborSubtotal +
    builderLogisticsFee +
    damageWaiverAmount +
    taxAmount -
    (equipmentSubtotal * builderDiscountPercent) / 100;

  const estimatedLaborCost = builderLabor.reduce((sum, item) => sum + item.total * 0.75, 0);
  const estimatedGrossMargin = totalAmount > 0 ? Math.round(((totalAmount - estimatedLaborCost) / totalAmount) * 100) : 0;

  const handleSaveQuote = (status: QuoteStatus = 'Draft') => {
    const newQuoteId = addQuote({
      clientId: builderClientId,
      clientName: builderClientName,
      clientCompany: builderClientCompany,
      clientEmail: builderClientEmail,
      clientPhone: builderClientPhone,
      eventName: builderEventName,
      venueName: builderVenueName,
      venueAddress: builderVenueAddress,
      loadInDate: builderLoadInDate,
      showStartDate: builderShowStartDate,
      showEndDate: builderShowEndDate,
      strikeDate: builderStrikeDate,
      equipmentItems: builderEquipment,
      laborItems: builderLabor,
      logisticsFee: builderLogisticsFee,
      damageWaiverPercent: builderDamageWaiverPercent,
      taxPercent: builderTaxPercent,
      clientDiscountPercent: builderDiscountPercent,
      equipmentSubtotal,
      laborSubtotal,
      damageWaiverAmount,
      taxAmount,
      totalAmount,
      estimatedLaborCost,
      status,
      termsAccepted: status === 'Approved',
      clientNotes: builderClientNotes,
      internalNotes: builderInternalNotes,
      createdAt: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      meetingDiagram: builderMeetingDiagram,
    });

    setIsCreateModalOpen(false);
    if (onClearPreselectedClient) onClearPreselectedClient();
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'All' || q.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Client Proposals & Production Quotes
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Build itemized multi-day proposals, check inventory availability, book crew, and convert to invoices
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setSheetsPreselectedQuoteId(undefined);
              setIsSheetsModalOpen(true);
            }}
            title="Export Proposals to Google Sheets"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-emerald-300 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync Sheets</span>
          </button>
          <button
            onClick={() => {
              // Seed a starter quote with Kara and Shure mics if blank
              if (builderEquipment.length === 0 && inventory.length > 0) {
                handleAddEquipmentLine(inventory[0]);
                if (inventory[1]) handleAddEquipmentLine(inventory[1]);
                handleAddLaborLine();
              }
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quote</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by quote #, event, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto">
          {['All', 'Draft', 'Sent', 'Approved', 'Completed'].map((st) => (
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

      {/* Master Quotes Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Quote & Event</th>
                <th className="py-3 px-4">Client & Venue</th>
                <th className="py-3 px-4">Event Dates</th>
                <th className="py-3 px-4 text-center">Manifest</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70 text-neutral-200">
              {filteredQuotes.map((quote) => {
                const isApproved = quote.status === 'Approved';
                const isSent = quote.status === 'Sent';
                const hasInvoice = !!quote.convertedToInvoiceId;

                return (
                  <tr key={quote.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* Quote & Event */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div
                        onClick={() => setSelectedQuoteForDetail(quote)}
                        className="cursor-pointer group"
                        title="Click to view full event production details"
                      >
                        <div className="font-bold text-white flex items-center gap-1.5 group-hover:text-amber-400 transition-colors">
                          <span>{quote.quoteNumber}</span>
                          <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Details →</span>
                        </div>
                        <div className="text-xs text-neutral-300 font-medium truncate mt-0.5 group-hover:text-amber-200 transition-colors">
                          {quote.eventName}
                        </div>
                      </div>
                      {quote.meetingDiagram && (
                        <button
                          type="button"
                          onClick={() => setActiveDiagramModalQuote(quote)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 hover:border-amber-400 text-amber-400 mt-1 cursor-pointer transition-colors"
                          title="Click to view/edit stage layout diagram"
                        >
                          <ImageIcon className="w-3 h-3 text-amber-400" />
                          <span>Diagram ({quote.meetingDiagram.elements.length} AV items)</span>
                        </button>
                      )}
                    </td>

                    {/* Client & Venue */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{quote.clientCompany || quote.clientName}</div>
                      <div className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                        {quote.venueName}
                      </div>
                    </td>

                    {/* Event Dates */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-neutral-300">
                      <div>Show: {quote.showStartDate}</div>
                      <div className="text-neutral-500">In: {quote.loadInDate}</div>
                    </td>

                    {/* Manifest */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-[11px] text-neutral-400">
                      {quote.equipmentItems.length} gear · {quote.laborItems.length} crew
                    </td>

                    {/* Total Value */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-white tabular-nums">
                      ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                            : isSent
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Event Details Comprehensive Modal */}
                        <button
                          onClick={() => setSelectedQuoteForDetail(quote)}
                          title="View Event & Production Details"
                          className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Meeting Diagram & Stage Layout */}
                        <button
                          onClick={() => setActiveDiagramModalQuote(quote)}
                          title="View / Edit Meeting Diagram & Stage Layout"
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            quote.meetingDiagram
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-neutral-800'
                              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Proposal PDF View */}
                        <button
                          onClick={() => setActiveQuoteForPrint(quote)}
                          title="Print / Export Client Proposal"
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Export Quote to Google Sheets */}
                        <button
                          onClick={() => {
                            setSheetsPreselectedQuoteId(quote.id);
                            setIsSheetsModalOpen(true);
                          }}
                          title="Export Quote to Google Sheets"
                          className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>

                        {/* Email Proposal via Gmail */}
                        <button
                          onClick={() => {
                            setGmailPrefill({
                              templateType: 'quote',
                              quoteId: quote.id,
                              to: quote.clientEmail,
                            });
                            setIsGmailModalOpen(true);
                          }}
                          title="Email Proposal to Client via Gmail"
                          className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Convert to Active Job (reserves gear & books crew) */}
                        {!isApproved && (
                          <button
                            onClick={() => convertQuoteToActiveJob(quote.id)}
                            title="Accept & Hold Fleet/Crew"
                            className="px-2 py-1 text-xs font-semibold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        {/* Convert to Invoice */}
                        {isApproved && !hasInvoice && (
                          <button
                            onClick={() => {
                              createInvoiceFromQuote(quote.id);
                              setActiveTab('invoices');
                            }}
                            title="Generate Formal Invoice"
                            className="px-2 py-1 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded transition-colors cursor-pointer"
                          >
                            Invoice
                          </button>
                        )}

                        {hasInvoice && (
                          <button
                            onClick={() => setActiveTab('invoices')}
                            className="text-[11px] text-amber-400 hover:underline font-mono"
                          >
                            Invoiced →
                          </button>
                        )}

                        {/* Pull Sheet */}
                        {isApproved && (
                          <button
                            onClick={() => {
                              setSelectedQuoteForPull(quote);
                              setActiveTab('pullsheet');
                            }}
                            title="Warehouse Pull Sheet"
                            className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Quote */}
                        <button
                          onClick={() => {
                            if (confirm(`Delete quote ${quote.quoteNumber}?`)) {
                              deleteQuote(quote.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                    <p className="text-sm font-medium">No quotes found</p>
                    <p className="text-xs text-neutral-500 mt-1">Build a new proposal using the button above</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL QUOTE BUILDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Create Seamless Production Quote</h2>
                <p className="text-xs text-neutral-400">
                  Select inventory from live stock, allocate crew leads, and generate client terms
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onClearPreselectedClient) onClearPreselectedClient();
                }}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Event & Client Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-950/60 border border-neutral-800 rounded-xl text-xs">
              <div className="sm:col-span-2">
                <label className="block text-neutral-400 mb-1 font-medium">Production Title *</label>
                <input
                  type="text"
                  required
                  value={builderEventName}
                  onChange={(e) => setBuilderEventName(e.target.value)}
                  placeholder="e.g. Apex Global Tech Summit 2026"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Select Client (CRM) *</label>
                <select
                  value={builderClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Venue Name</label>
                <input
                  type="text"
                  value={builderVenueName}
                  onChange={(e) => setBuilderVenueName(e.target.value)}
                  placeholder="Moscone Center South Hall A"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Load-In Date</label>
                <input
                  type="date"
                  value={builderLoadInDate}
                  onChange={(e) => setBuilderLoadInDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Show Start & Strike</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={builderShowStartDate}
                    onChange={(e) => setBuilderShowStartDate(e.target.value)}
                    className="w-full px-2 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-neutral-500">to</span>
                  <input
                    type="date"
                    value={builderStrikeDate}
                    onChange={(e) => setBuilderStrikeDate(e.target.value)}
                    className="w-full px-2 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Equipment Manifest */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Equipment Manifest ({builderEquipment.length} items)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGearPickerOpen(true)}
                  className="px-3 py-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-lg border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Equipment From Inventory</span>
                </button>
              </div>

              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/90 text-neutral-400 font-semibold border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-center">Rental Days</th>
                      <th className="py-2.5 px-3 text-right">Day Rate</th>
                      <th className="py-2.5 px-3 text-right">Disc %</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {builderEquipment.map((line, idx) => (
                      <tr key={line.id}>
                        <td className="py-2.5 px-3 font-medium text-white">{line.name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => {
                              const updated = [...builderEquipment];
                              updated[idx].quantity = Number(e.target.value);
                              updated[idx].total =
                                updated[idx].quantity *
                                updated[idx].days *
                                updated[idx].dayRate *
                                (1 - updated[idx].discountPercent / 100);
                              setBuilderEquipment(updated);
                            }}
                            className="w-16 h-8 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-md text-center text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={line.days}
                            onChange={(e) => {
                              const updated = [...builderEquipment];
                              updated[idx].days = Number(e.target.value);
                              updated[idx].total =
                                updated[idx].quantity *
                                updated[idx].days *
                                updated[idx].dayRate *
                                (1 - updated[idx].discountPercent / 100);
                              setBuilderEquipment(updated);
                            }}
                            className="w-16 h-8 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-md text-center text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-white">
                          ${line.dayRate}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={line.discountPercent}
                            onChange={(e) => {
                              const updated = [...builderEquipment];
                              updated[idx].discountPercent = Number(e.target.value);
                              updated[idx].total =
                                updated[idx].quantity *
                                updated[idx].days *
                                updated[idx].dayRate *
                                (1 - updated[idx].discountPercent / 100);
                              setBuilderEquipment(updated);
                            }}
                            className="w-14 h-8 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-md text-right text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">
                          ${line.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setBuilderEquipment(builderEquipment.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-neutral-500 hover:text-rose-400 cursor-pointer rounded hover:bg-neutral-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {builderEquipment.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-neutral-500">
                          No equipment added yet. Click &quot;Add Equipment From Inventory&quot; to pick audio, video, lighting gear.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 3: Labor & Crew Manifest */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Crew & Labor Scheduling ({builderLabor.length} roles)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddLaborLine}
                  className="px-3 py-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-sky-400 rounded-lg border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Crew Role</span>
                </button>
              </div>

              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/90 text-neutral-400 font-semibold border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Role & Assigned Crew</th>
                      <th className="py-2.5 px-3">Call Description</th>
                      <th className="py-2.5 px-3 text-center">Days / Calls</th>
                      <th className="py-2.5 px-3 text-right">Day Rate ($)</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {builderLabor.map((line, idx) => (
                      <tr key={line.id}>
                        <td className="py-2.5 px-3">
                          <select
                            value={line.staffId || ''}
                            onChange={(e) => {
                              const s = staff.find((m) => m.id === e.target.value);
                              const updated = [...builderLabor];
                              if (s) {
                                updated[idx].staffId = s.id;
                                updated[idx].staffName = s.name;
                                updated[idx].role = s.role;
                                updated[idx].rate = s.dayRate;
                                updated[idx].total = s.dayRate * updated[idx].daysOrHours;
                              }
                              setBuilderLabor(updated);
                            }}
                            className="w-full max-w-xs h-8 px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded-md text-xs text-white focus:outline-none focus:border-amber-400"
                          >
                            {staff.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} - {s.role} (${s.dayRate})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={line.callType}
                            onChange={(e) => {
                              const updated = [...builderLabor];
                              updated[idx].callType = e.target.value;
                              setBuilderLabor(updated);
                            }}
                            className="w-full h-8 px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded-md text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={line.daysOrHours}
                            onChange={(e) => {
                              const updated = [...builderLabor];
                              updated[idx].daysOrHours = Number(e.target.value);
                              updated[idx].total = updated[idx].rate * updated[idx].daysOrHours;
                              setBuilderLabor(updated);
                            }}
                            className="w-16 h-8 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-md text-center text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-white">
                          <input
                            type="number"
                            value={line.rate}
                            onChange={(e) => {
                              const updated = [...builderLabor];
                              updated[idx].rate = Number(e.target.value);
                              updated[idx].total = updated[idx].rate * updated[idx].daysOrHours;
                              setBuilderLabor(updated);
                            }}
                            className="w-20 h-8 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-md text-right text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">
                          ${line.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setBuilderLabor(builderLabor.filter((_, i) => i !== idx))}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 cursor-pointer rounded hover:bg-neutral-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 4: Meeting Diagram & Stage Layout */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <ImageIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Step 4: Meeting Diagram & AV Stage Layout</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-amber-300 font-semibold">
                        {builderMeetingDiagram?.elements?.length || 0} Elements
                      </span>
                      {builderMeetingDiagram?.backgroundImageUrl && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                          CAD / Plan Attached
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Upload venue floorplan or architectural drawing, arrange staging and AV equipment, and set room dimensions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDiagramExpandedInBuilder(!isDiagramExpandedInBuilder)}
                    className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                  >
                    {isDiagramExpandedInBuilder ? 'Hide Diagram Canvas' : 'Show Diagram Canvas'}
                  </button>
                </div>
              </div>

              {isDiagramExpandedInBuilder && (
                <div className="border border-neutral-800 rounded-xl overflow-hidden p-3 bg-neutral-950/60">
                  <MeetingDiagramEditor
                    diagramData={builderMeetingDiagram}
                    onChange={(updated) => setBuilderMeetingDiagram(updated)}
                    eventName={builderEventName}
                    venueName={builderVenueName}
                  />
                </div>
              )}
            </div>

            {/* Financial Summary & Bottom Actions */}
            <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Logistics & Trucking Fee ($):</span>
                  <input
                    type="number"
                    value={builderLogisticsFee}
                    onChange={(e) => setBuilderLogisticsFee(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-right font-mono text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Damage Waiver (% of gear):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={builderDamageWaiverPercent}
                    onChange={(e) => setBuilderDamageWaiverPercent(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-right font-mono text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Sales/Rental Tax (%):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={builderTaxPercent}
                    onChange={(e) => setBuilderTaxPercent(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-right font-mono text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Client Volume Discount (%):</span>
                  <input
                    type="number"
                    value={builderDiscountPercent}
                    onChange={(e) => setBuilderDiscountPercent(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-right font-mono text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-neutral-800 sm:pl-6">
                <div className="flex justify-between text-neutral-400">
                  <span>Equipment Subtotal:</span>
                  <span className="font-mono text-white tabular-nums">${equipmentSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Labor Subtotal:</span>
                  <span className="font-mono text-white tabular-nums">${laborSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Damage Waiver:</span>
                  <span className="font-mono text-white tabular-nums">${damageWaiverAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Estimated Tax:</span>
                  <span className="font-mono text-white tabular-nums">${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
                  <span className="font-bold text-white text-sm">Quote Total:</span>
                  <span className="font-mono font-bold text-amber-400 text-lg tabular-nums">
                    ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center justify-between pt-1">
                  <span>Estimated Margin:</span>
                  <span className="font-mono font-bold">{estimatedGrossMargin}% gross profit</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onClearPreselectedClient) onClearPreselectedClient();
                }}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveQuote('Draft')}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuote('Sent')}
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Mark Sent to Client
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuote('Approved')}
                  className="px-5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Approve & Hold Gear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Picker Sub-Modal */}
      {isGearPickerOpen && (
        <div className="fixed inset-0 z-60 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white">Select Equipment from Fleet</h3>
              <button onClick={() => setIsGearPickerOpen(false)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search gear by name, model, SKU..."
                value={gearSearch}
                onChange={(e) => setGearSearch(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
              <select
                value={gearCategory}
                onChange={(e) => setGearCategory(e.target.value)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
              >
                <option value="All">All Categories</option>
                <option value="Audio">Audio</option>
                <option value="Video">Video</option>
                <option value="Lighting">Lighting</option>
                <option value="Rigging & Power">Rigging & Power</option>
              </select>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800/80">
              {inventory
                .filter((item) => {
                  const mSearch =
                    item.name.toLowerCase().includes(gearSearch.toLowerCase()) ||
                    item.sku.toLowerCase().includes(gearSearch.toLowerCase());
                  const mCat = gearCategory === 'All' || item.category === gearCategory;
                  return mSearch && mCat;
                })
                .map((item) => (
                  <div key={item.id} className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-neutral-800/40 rounded transition-colors">
                    <div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {item.sku} · Available: {item.availableQuantity} / {item.totalQuantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-white font-bold">${item.dayRate}/day</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddEquipmentLine(item);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGearPickerOpen(false)}
                className="px-4 py-2 bg-neutral-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Done Adding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Proposal Meeting Diagram Editor Modal */}
      {activeDiagramModalQuote && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-5xl w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <ImageIcon className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Proposal Meeting Diagram & Stage Layout: {activeDiagramModalQuote.eventName}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {activeDiagramModalQuote.quoteNumber} · {activeDiagramModalQuote.venueName} · Client: {activeDiagramModalQuote.clientCompany || activeDiagramModalQuote.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDiagramModalQuote(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MeetingDiagramEditor
              diagramData={activeDiagramModalQuote.meetingDiagram}
              onChange={(updated) => {
                updateQuote(activeDiagramModalQuote.id, { meetingDiagram: updated });
                setActiveDiagramModalQuote({ ...activeDiagramModalQuote, meetingDiagram: updated });
              }}
              eventName={activeDiagramModalQuote.eventName}
              venueName={activeDiagramModalQuote.venueName}
              isModal
              onClose={() => setActiveDiagramModalQuote(null)}
            />

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <span className="text-xs text-neutral-400 font-mono">
                Changes saved automatically to quote document in Firestore
              </span>
              <button
                onClick={() => setActiveDiagramModalQuote(null)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Event Details Modal */}
      {selectedQuoteForDetail && (
        <EventDetailModal
          quote={selectedQuoteForDetail}
          isOpen={!!selectedQuoteForDetail}
          onClose={() => setSelectedQuoteForDetail(null)}
          onOpenEditDiagram={(q) => {
            setSelectedQuoteForDetail(null);
            setActiveDiagramModalQuote(q);
          }}
        />
      )}

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        initialTab="quotes"
        preselectedQuoteId={sheetsPreselectedQuoteId}
      />

      {/* Gmail Compose Modal */}
      <GmailComposeModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        prefill={gmailPrefill}
      />
    </div>
  );
};
