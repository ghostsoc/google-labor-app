import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { exportToCSV } from '../utils/csvExport';
import {
  Contact,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  Download,
} from 'lucide-react';

interface ClientsManagerProps {
  onOpenQuoteWithClient?: (client: Client) => void;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({ onOpenQuoteWithClient }) => {
  const {
    clients,
    quotes,
    invoices,
    addClient,
    updateClient,
    deleteClient,
    selectedClientForDetail,
    setSelectedClientForDetail,
    setActiveQuoteForPrint,
    setActiveInvoiceForPrint,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerms, setSelectedTerms] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt'>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    billingTerms: 'Net 30',
    taxExempt: false,
    taxExemptNumber: '',
    preferences: '',
    notes: '',
  });

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.preferences.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTerms =
      selectedTerms === 'All' ||
      (selectedTerms === 'Tax Exempt' ? c.taxExempt : c.billingTerms === selectedTerms);

    return matchesSearch && matchesTerms;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      billingTerms: 'Net 30',
      taxExempt: false,
      taxExemptNumber: '',
      preferences: '',
      notes: '',
    });
    setEditingClient(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      billingTerms: client.billingTerms,
      taxExempt: client.taxExempt,
      taxExemptNumber: client.taxExemptNumber || '',
      preferences: client.preferences,
      notes: client.notes,
    });
    setEditingClient(client);
    setIsAddModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingClient) {
      updateClient(editingClient.id, formData);
    } else {
      addClient(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleExportClientsCSV = () => {
    const headers = [
      'Client Name',
      'Company',
      'Email',
      'Phone',
      'Billing Address',
      'Billing Terms',
      'Tax Exempt',
      'Tax Exempt Certificate',
      'Production Preferences / Rider',
      'Internal Notes',
      'Created Date',
      'Total Quotes Count',
      'Total Invoices Count',
      'Lifetime Spend ($)',
    ];

    const rows = filteredClients.map((client) => {
      const clientQuotes = quotes.filter(
        (q) => q.clientId === client.id || q.clientEmail === client.email
      );
      const clientInvoices = invoices.filter(
        (i) => i.clientId === client.id || i.clientEmail === client.email
      );
      const lifetimeSpend = clientInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

      return [
        client.name,
        client.company,
        client.email,
        client.phone,
        client.address || '',
        client.billingTerms,
        client.taxExempt ? 'Yes' : 'No',
        client.taxExemptNumber || '',
        client.preferences || '',
        client.notes || '',
        client.createdAt,
        clientQuotes.length,
        clientInvoices.length,
        lifetimeSpend,
      ];
    });

    exportToCSV(`clients_crm_export_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Client Accounts & Technical Profiles
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage corporate event planners, promoter riders, billing terms, and historic production preferences
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportClientsCSV}
            title="Download CSV report of client accounts"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by client, company, email, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto">
          {['All', 'Net 30', 'Net 15', 'Due on Receipt', 'Tax Exempt'].map((term) => (
            <button
              key={term}
              onClick={() => setSelectedTerms(term)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedTerms === term
                  ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const clientQuotes = quotes.filter(
            (q) => q.clientId === client.id || q.clientEmail === client.email
          );
          const clientInvoices = invoices.filter(
            (i) => i.clientId === client.id || i.clientEmail === client.email
          );
          const lifetimeSpend = clientInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

          return (
            <div
              key={client.id}
              onClick={() => setSelectedClientForDetail(client)}
              className="p-5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all flex flex-col justify-between cursor-pointer group shadow-xs"
            >
              <div>
                {/* Header Lockup */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-amber-400 text-sm shrink-0 group-hover:border-amber-500/50 transition-colors">
                      {client.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {client.name}
                      </h3>
                      <div className="text-xs text-neutral-400 font-medium">{client.company}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(client, e)}
                      title="Edit Client"
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete client record for ${client.name}?`)) {
                          deleteClient(client.id);
                        }
                      }}
                      title="Delete Client"
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact info list */}
                <div className="mt-4 space-y-1.5 text-xs text-neutral-300">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  {client.address && (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Specific technical preferences */}
                {client.preferences && (
                  <div className="mt-3 p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-lg text-[11px]">
                    <span className="font-semibold text-amber-400/90 block mb-0.5">
                      Production Rider & Preferences:
                    </span>
                    <p className="text-neutral-300 line-clamp-2">{client.preferences}</p>
                  </div>
                )}
              </div>

              {/* Bottom stats row */}
              <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {client.billingTerms}
                  </span>
                  {client.taxExempt && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      Tax Exempt
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-neutral-400 text-[11px]">
                    {clientQuotes.length} quotes ·{' '}
                  </span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    ${lifetimeSpend.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl">
            <Contact className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-sm font-medium">No clients found matching query</p>
            <p className="text-xs text-neutral-500 mt-1">Add a client or adjust filters</p>
          </div>
        )}
      </div>

      {/* Client Detail Drawer / Modal */}
      {selectedClientForDetail && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-neutral-950 font-bold text-lg flex items-center justify-center">
                  {selectedClientForDetail.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedClientForDetail.name}
                  </h2>
                  <div className="text-xs text-neutral-400 font-medium">
                    {selectedClientForDetail.company} · Terms: {selectedClientForDetail.billingTerms}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientForDetail(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 block">Direct Email:</span>
                <span className="font-medium text-white">{selectedClientForDetail.email}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Direct Phone:</span>
                <span className="font-medium text-white">{selectedClientForDetail.phone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-neutral-500 block">Billing Address:</span>
                <span className="font-medium text-neutral-200">
                  {selectedClientForDetail.address || 'No physical address specified'}
                </span>
              </div>
              {selectedClientForDetail.taxExempt && (
                <div className="sm:col-span-2 flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Tax Exempt Organization (Cert: {selectedClientForDetail.taxExemptNumber || 'On file'})</span>
                </div>
              )}
            </div>

            {/* Production Preferences & Past Event Notes */}
            <div className="space-y-3">
              <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Specific Production Preferences & Audio/Video Rider
                </h4>
                <p className="text-xs text-neutral-200 leading-relaxed">
                  {selectedClientForDetail.preferences || 'No specific preferences recorded.'}
                </p>
              </div>

              <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Past Event History & Internal Notes
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {selectedClientForDetail.notes || 'No historic notes.'}
                </p>
              </div>
            </div>

            {/* Associated Quotes & Invoices */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Production Proposals & Active Gigs
              </h4>

              <div className="space-y-2">
                {quotes
                  .filter(
                    (q) =>
                      q.clientId === selectedClientForDetail.id ||
                      q.clientEmail === selectedClientForDetail.email
                  )
                  .map((quote) => (
                    <div
                      key={quote.id}
                      className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{quote.eventName}</div>
                        <div className="text-[11px] text-neutral-400">
                          {quote.quoteNumber} · {quote.venueName} · Load-in: {quote.loadInDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white tabular-nums">
                          ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedClientForDetail(null);
                            setActiveQuoteForPrint(quote);
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors cursor-pointer"
                        >
                          View Quote
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => handleOpenEdit(selectedClientForDetail)}
                className="px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Client Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenQuoteWithClient) {
                    onOpenQuoteWithClient(selectedClientForDetail);
                  }
                  setSelectedClientForDetail(null);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Quote for this Client</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-white">
                {editingClient ? 'Edit Client Profile' : 'Add New Client Profile'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Apex Global Enterprises"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. s.jenkins@apexglobal.com"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. (415) 555-0182"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 500 Howard Street, Suite 2400, San Francisco, CA"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Default Payment Terms
                  </label>
                  <select
                    value={formData.billingTerms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingTerms: e.target.value as 'Due on Receipt' | 'Net 15' | 'Net 30' | 'Net 60',
                      })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.taxExempt}
                      onChange={(e) => setFormData({ ...formData, taxExempt: e.target.checked })}
                      className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-400"
                    />
                    <span>Tax-Exempt Entity (Non-profit / Reseller)</span>
                  </label>
                </div>

                {formData.taxExempt && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Tax Exemption Certificate Number
                    </label>
                    <input
                      type="text"
                      value={formData.taxExemptNumber || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, taxExemptNumber: e.target.value })
                      }
                      placeholder="e.g. EX-CA-94111-9821"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Production Preferences & Equipment Riders
                  </label>
                  <textarea
                    rows={2}
                    value={formData.preferences}
                    onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                    placeholder="Preferred console, microphone type, sound pressure limits, room lighting temperature..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    General History & Relationship Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Past event feedback, payment reliability, key executive contacts..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {editingClient ? 'Save Changes' : 'Create Client Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
