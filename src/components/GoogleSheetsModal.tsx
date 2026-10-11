import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  FileSpreadsheet,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table,
  Layers,
  FileText,
  DollarSign,
  Users,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  exportQuoteToGoogleSheet,
  exportInventoryToGoogleSheet,
  exportShiftsToGoogleSheet,
  exportInvoicesToGoogleSheet,
  readSheetValues,
  CreatedSpreadsheetResult,
} from '../services/sheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'quotes' | 'inventory' | 'shifts' | 'invoices' | 'read';
  preselectedQuoteId?: string;
  preselectedInvoiceId?: string;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'quotes',
  preselectedQuoteId,
  preselectedInvoiceId,
}) => {
  const {
    quotes,
    inventory,
    shifts,
    staff,
    invoices,
    settings,
    googleCalendarToken,
    connectGoogleCalendar,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'quotes' | 'inventory' | 'shifts' | 'invoices' | 'read'>(initialTab);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(preselectedQuoteId || quotes[0]?.id || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(preselectedInvoiceId || invoices[0]?.id || '');
  const [exporting, setExporting] = useState(false);
  const [lastExported, setLastExported] = useState<CreatedSpreadsheetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Read Sheet state
  const [readSpreadsheetId, setReadSpreadsheetId] = useState('');
  const [readRange, setReadRange] = useState('Sheet1!A1:E10');
  const [reading, setReading] = useState(false);
  const [readData, setReadData] = useState<string[][] | null>(null);

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setError(null);
    try {
      await connectGoogleCalendar();
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google');
    }
  };

  const handleExportQuote = async () => {
    if (!googleCalendarToken) {
      setError('Please connect your Google account to export to Google Sheets.');
      return;
    }
    const quote = quotes.find((q) => q.id === selectedQuoteId);
    if (!quote) {
      setError('Please select a valid quote to export.');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const result = await exportQuoteToGoogleSheet(quote, settings, googleCalendarToken);
      setLastExported(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to export quote to Google Sheets.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportInventory = async () => {
    if (!googleCalendarToken) {
      setError('Please connect your Google account to export to Google Sheets.');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const result = await exportInventoryToGoogleSheet(inventory, settings, googleCalendarToken);
      setLastExported(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to export equipment inventory to Google Sheets.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportShifts = async () => {
    if (!googleCalendarToken) {
      setError('Please connect your Google account to export to Google Sheets.');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const result = await exportShiftsToGoogleSheet(shifts, staff, googleCalendarToken);
      setLastExported(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to export labor dispatch calls to Google Sheets.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportInvoices = async () => {
    if (!googleCalendarToken) {
      setError('Please connect your Google account to export to Google Sheets.');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const result = await exportInvoicesToGoogleSheet(invoices, googleCalendarToken);
      setLastExported(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to export invoices ledger to Google Sheets.');
    } finally {
      setExporting(false);
    }
  };

  const handleReadSheet = async () => {
    if (!googleCalendarToken) {
      setError('Please connect your Google account to read Google Sheets.');
      return;
    }
    if (!readSpreadsheetId.trim()) {
      setError('Please enter a Google Spreadsheet ID or URL.');
      return;
    }

    // Extract ID if full URL pasted
    let cleanId = readSpreadsheetId.trim();
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    setReading(true);
    setError(null);
    setReadData(null);
    try {
      const result = await readSheetValues(cleanId, readRange || 'A1:Z50', googleCalendarToken);
      setReadData(result.values || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to read spreadsheet values.');
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Google Sheets Integration</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-normal">
                Live Google Drive Export
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Export real-time quotes, fleet inventory, labor schedules, and invoices directly to Google Sheets.
            </p>
          </div>
        </div>

        {/* Google Authentication Status */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                googleCalendarToken ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs text-neutral-300">
              {googleCalendarToken ? 'Connected to Google Workspace' : 'Google Account Not Connected'}
            </span>
          </div>
          {!googleCalendarToken && (
            <button
              onClick={handleConnectGoogle}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Connect Google</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800 text-xs overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('quotes');
              setError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quotes' ? 'bg-neutral-800 text-amber-400 shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quotes & Proposals</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('inventory');
              setError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-neutral-800 text-amber-400 shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gear Inventory</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('shifts');
              setError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shifts' ? 'bg-neutral-800 text-amber-400 shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Labor Shifts</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('invoices');
              setError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'invoices' ? 'bg-neutral-800 text-amber-400 shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Billing Invoices</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('read');
              setError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'read' ? 'bg-neutral-800 text-emerald-400 shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Preview Sheet</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {lastExported && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white">Exported to Google Sheets: </span>
                <span className="text-emerald-300">{lastExported.title}</span>
              </div>
            </div>
            <a
              href={lastExported.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Open in Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Select Production Quote to Export</label>
                <select
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                >
                  {quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      #{q.quoteNumber} — {q.eventName} (${q.totalAmount.toLocaleString()} · {q.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedQuoteId && (() => {
                const quote = quotes.find((q) => q.id === selectedQuoteId);
                if (!quote) return null;
                return (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs space-y-2">
                    <div className="flex justify-between border-b border-neutral-800 pb-2">
                      <span className="text-neutral-400">Client / Company:</span>
                      <span className="font-semibold text-white">{quote.clientName} ({quote.clientCompany || 'N/A'})</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800 pb-2">
                      <span className="text-neutral-400">Venue:</span>
                      <span className="text-neutral-200">{quote.venueName}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800 pb-2">
                      <span className="text-neutral-400">Dates:</span>
                      <span className="text-neutral-200">{quote.showStartDate} - {quote.showEndDate}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800 pb-2">
                      <span className="text-neutral-400">Gear Manifest:</span>
                      <span className="text-neutral-200">{quote.equipmentItems?.length || 0} equipment line items</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="font-semibold text-white">Total Amount:</span>
                      <span className="font-bold text-amber-400 text-sm">${quote.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={handleExportQuote}
                disabled={exporting || !googleCalendarToken}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Google Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Create Google Sheet for Quote</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Fleet Assets:</span>
                  <span className="font-bold text-white">{inventory.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Asset Units:</span>
                  <span className="font-semibold text-neutral-200">
                    {inventory.reduce((sum, item) => sum + item.totalQuantity, 0)} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Fleet Valuation:</span>
                  <span className="font-bold text-emerald-400">
                    ${inventory.reduce((sum, item) => sum + item.replacementCost * item.totalQuantity, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-400">
                Exports full inventory catalog including SKU numbers, categories, day rates, quantities, storage bin locations, barcodes, and electrical wattage specs.
              </p>

              <button
                onClick={handleExportInventory}
                disabled={exporting || !googleCalendarToken}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting Catalog to Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export Fleet Inventory to Google Sheet</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'shifts' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Active Dispatched Shifts:</span>
                  <span className="font-bold text-white">{shifts.length} shifts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Rostered Technicians:</span>
                  <span className="font-semibold text-neutral-200">{staff.length} crew members</span>
                </div>
              </div>

              <p className="text-xs text-neutral-400">
                Creates a live Call Sheet roster on Google Sheets including dates, call times, crew roles, venue addresses, and wage calculations.
              </p>

              <button
                onClick={handleExportShifts}
                disabled={exporting || !googleCalendarToken}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting Call Sheet to Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Labor Dispatch Schedule to Google Sheet</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Billed Invoices:</span>
                  <span className="font-bold text-white">{invoices.length} invoices</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Gross Receivables:</span>
                  <span className="font-bold text-emerald-400">
                    ${invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleExportInvoices}
                disabled={exporting || !googleCalendarToken}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting Invoices Ledger...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Invoices Ledger to Google Sheet</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'read' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Spreadsheet ID or URL</label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n... or ID"
                  value={readSpreadsheetId}
                  onChange={(e) => setReadSpreadsheetId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Cell Range</label>
                <input
                  type="text"
                  placeholder="Sheet1!A1:E20"
                  value={readRange}
                  onChange={(e) => setReadRange(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-mono"
                />
              </div>

              <button
                onClick={handleReadSheet}
                disabled={reading || !googleCalendarToken}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {reading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Fetch and Preview Sheet Data</span>
              </button>

              {readData && (
                <div className="border border-neutral-800 rounded-xl overflow-x-auto max-h-60 bg-neutral-950 p-2">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <tbody>
                      {readData.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx === 0 ? 'font-bold bg-neutral-900 border-b border-neutral-800' : 'border-b border-neutral-900'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1.5 text-neutral-300 font-mono">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
