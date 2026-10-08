import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MasterScheduleCalendar } from './MasterScheduleCalendar';
import { FinancialOverview } from './FinancialOverview';
import { EventDetailModal } from './EventDetailModal';
import { ClientQuote } from '../types';
import {
  Package,
  Users,
  FileText,
  DollarSign,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface DashboardProps {
  onOpenNewQuote: () => void;
  onOpenNewShift: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenNewQuote, onOpenNewShift }) => {
  const {
    inventory,
    quotes,
    shifts,
    invoices,
    maintenanceRecords,
    clients,
    setActiveTab,
    setActiveQuoteForPrint,
    setSelectedQuoteForPull,
    setActiveInvoiceForPrint,
  } = useApp();

  // Metrics calculations
  const totalFleetItems = inventory.reduce((sum, item) => sum + item.totalQuantity, 0);
  const totalOnRent = inventory.reduce((sum, item) => sum + item.onRentQuantity, 0);
  const totalInRepair = inventory.reduce((sum, item) => sum + item.inRepairQuantity, 0);
  const fleetUtilizationRate = totalFleetItems > 0 ? Math.round((totalOnRent / totalFleetItems) * 100) : 0;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const overdueInvoices = invoices.filter((inv) => inv.paymentStatus === 'overdue');
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const activeMaintenance = maintenanceRecords.filter((m) => m.status === 'In Progress' || m.status === 'Scheduled');

  const upcomingQuotes = quotes.slice(0, 4);
  const [dashboardSelectedEvent, setDashboardSelectedEvent] = useState<ClientQuote | null>(null);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Visual Banner with Scrim */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-md">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/hero_stage_av_rig_1790926711424.jpg"
            alt="Live Concert and Corporate AV Stage Rig"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
            <span>LIVE PRODUCTION & RENTAL ENGINE</span>
            <span>·</span>
            <span>SAN FRANCISCO BAY AREA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Seamless Staging, Inventory & Crew Logistics
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl">
            Real-time asset utilization, certified technician dispatching, automated quote-to-invoice workflows, and proactive gear maintenance.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewQuote}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <span>Build Client Quote</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNewShift}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Dispatch Crew Shift</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>View Receivables</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fleet Utilization */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Fleet Utilization</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {fleetUtilizationRate}%
            </span>
            <span className="text-xs text-neutral-400">
              ({totalOnRent} of {totalFleetItems} items)
            </span>
          </div>
          <div className="mt-3 w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, fleetUtilizationRate)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
            <span>{totalInRepair} in service bay</span>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Inspect gear →
            </button>
          </div>
        </div>

        {/* KPI 2: Active & Upcoming Gigs */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Booked Productions</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {quotes.filter((q) => q.status === 'Approved').length}
            </span>
            <span className="text-xs text-neutral-400">active jobs booked</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-300">
            <Users className="w-3.5 h-3.5 text-neutral-400" />
            <span>{shifts.filter((s) => s.status === 'Confirmed').length} confirmed crew shifts</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
            <span>{shifts.filter((s) => s.status === 'Offered' || s.status === 'Draft').length} pending dispatch</span>
            <button
              onClick={() => setActiveTab('staff')}
              className="text-sky-400 hover:underline cursor-pointer"
            >
              Schedule board →
            </button>
          </div>
        </div>

        {/* KPI 3: Invoicing & Receivables */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Outstanding Invoices</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-emerald-400">
              (${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} collected)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            {overdueTotal > 0 ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                ${overdueTotal.toLocaleString()} overdue
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All payments on track
              </span>
            )}
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-emerald-400 hover:underline text-[11px] cursor-pointer"
            >
              Invoices →
            </button>
          </div>
        </div>

        {/* KPI 4: Maintenance Health */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Maintenance & Testing</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {activeMaintenance.length}
            </span>
            <span className="text-xs text-neutral-400">units in repair / certs</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Next inspection: Oct 15</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Rigging hoist annual certs due</span>
            <button
              onClick={() => setActiveTab('maintenance')}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Service log →
            </button>
          </div>
        </div>
      </div>

      {/* Financial Overview & Real-Time Firestore Revenue Trends */}
      <FinancialOverview />

      {/* Master Event & Dispatch Schedule Calendar */}
      <MasterScheduleCalendar
        onOpenNewShift={onOpenNewShift}
        onOpenNewQuote={onOpenNewQuote}
        onOpenEventDetail={(quote) => setDashboardSelectedEvent(quote)}
      />

      {/* Main Two-Column Workflow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Productions & Quotes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Active Productions & Recent Proposals
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Pipeline of booked shows, load-in schedules, and client proposals
                </p>
              </div>
              <button
                onClick={() => setActiveTab('quotes')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>View all ({quotes.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-neutral-800/80">
              {upcomingQuotes.map((quote) => {
                const isApproved = quote.status === 'Approved';
                const isSent = quote.status === 'Sent';
                const hasInvoice = !!quote.convertedToInvoiceId;

                return (
                  <div
                    key={quote.id}
                    onClick={() => setDashboardSelectedEvent(quote)}
                    className="p-5 hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-neutral-400">{quote.quoteNumber}</span>
                          <span className="text-neutral-500">·</span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              isApproved
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                : isSent
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                            }`}
                          >
                            {quote.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mt-1 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          <span>{quote.eventName}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 mt-1">
                          <span>{quote.clientCompany || quote.clientName}</span>
                          <span>·</span>
                          <span>{quote.venueName}</span>
                          <span>·</span>
                          <span>Load-in: {quote.loadInDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <div className="text-right mr-2 hidden sm:block">
                          <div className="text-sm font-bold font-mono text-white tabular-nums">
                            ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {quote.equipmentItems.length} gear lines · {quote.laborItems.length} crew lines
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDashboardSelectedEvent(quote);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-neutral-950 border border-amber-400/30 rounded-lg transition-colors cursor-pointer"
                        >
                          Event Details →
                        </button>

                        {isApproved && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQuoteForPull(quote);
                              setActiveTab('pullsheet');
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
                          >
                            Pull Sheet
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveQuoteForPrint(quote);
                          }}
                          className="px-2.5 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Proposal PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Dispatch / Shifts Overview */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Today's Live Crew Dispatch</h3>
                <p className="text-xs text-neutral-400">Engineers and operators currently deployed on shows</p>
              </div>
              <button
                onClick={() => setActiveTab('staff')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
              >
                Crew Roster →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shifts.slice(0, 4).map((shift) => (
                <div
                  key={shift.id}
                  className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{shift.staffName}</div>
                    <div className="text-[11px] text-amber-400/90 truncate">{shift.role}</div>
                    <div className="text-[11px] text-neutral-400 mt-1 truncate">
                      {shift.callType} · {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      {shift.status}
                    </span>
                    <div className="text-xs font-mono font-medium text-neutral-300 mt-1.5 tabular-nums">
                      ${shift.rate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Maintenance Radar & Overdue Receivables */}
        <div className="space-y-6">
          {/* Equipment Maintenance Watch */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Maintenance Radar</h3>
              </div>
              <button
                onClick={() => setActiveTab('maintenance')}
                className="text-xs text-amber-400 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {activeMaintenance.map((record) => (
                <div
                  key={record.id}
                  className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-lg text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200 line-clamp-1">
                      {record.inventoryItemName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {record.status}
                    </span>
                  </div>
                  <p className="text-neutral-400 mt-1 line-clamp-2 text-[11px]">
                    {record.issueDescription}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400 border-t border-neutral-800/60 pt-1.5">
                    <span>{record.serviceVendor}</span>
                    <span className="font-mono text-neutral-300 tabular-nums">Est: ${record.cost}</span>
                  </div>
                </div>
              ))}

              {activeMaintenance.length === 0 && (
                <div className="text-xs text-neutral-400 py-4 text-center">
                  All fleet gear is in active certified service.
                </div>
              )}
            </div>
          </div>

          {/* Outstanding Receivables Watch */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Payment Ledger</h3>
              </div>
              <button
                onClick={() => setActiveTab('invoices')}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Invoices
              </button>
            </div>

            <div className="space-y-2.5">
              {invoices.slice(0, 3).map((inv) => {
                const isPaid = inv.paymentStatus === 'paid';
                const isOverdue = inv.paymentStatus === 'overdue';

                return (
                  <div
                    key={inv.id}
                    className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-white truncate max-w-[140px] sm:max-w-[180px]">
                        {inv.clientCompany || inv.clientName}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {inv.invoiceNumber} · Due {inv.dueDate}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-white tabular-nums">
                        ${inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          isPaid
                            ? 'bg-emerald-950 text-emerald-400'
                            : isOverdue
                            ? 'bg-rose-950 text-rose-400'
                            : 'bg-amber-950 text-amber-400'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Client CRM Glance */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Client Portfolio</h3>
              <button
                onClick={() => setActiveTab('clients')}
                className="text-xs text-amber-400 hover:underline cursor-pointer"
              >
                View all ({clients.length})
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              {clients.length} corporate and promoter accounts configured with custom terms and technical riders.
            </p>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {dashboardSelectedEvent && (
        <EventDetailModal
          quote={dashboardSelectedEvent}
          isOpen={!!dashboardSelectedEvent}
          onClose={() => setDashboardSelectedEvent(null)}
        />
      )}
    </div>
  );
};
