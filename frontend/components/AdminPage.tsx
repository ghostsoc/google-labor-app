import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TeamManager } from './TeamManager';
import { CompanySettingsForm } from './CompanySettingsForm';
import { exportToCSV } from '../utils/csvExport';
import {
  AdminAuditEntry,
  clearAdminAuditLog,
  getAdminAuditLog,
  logAdminAction,
} from '../utils/adminAudit';
import {
  AlertCircle,
  ArrowLeft,
  Database,
  Download,
  RefreshCw,
  ScrollText,
  Settings,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';

type AdminSection = 'team' | 'settings' | 'data';

const SECTIONS: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'team', label: 'Team & Roles', icon: Users },
  { id: 'settings', label: 'Company Settings', icon: Settings },
  { id: 'data', label: 'Audit & Data', icon: Database },
];

/**
 * Dedicated /admin console. Admin-role only, exposing team/RBAC management,
 * company settings and an audit log with data export/resync tools.
 */
export const AdminPage: React.FC = () => {
  const {
    activeRole,
    userHasPermission,
    currentUser,
    settings,
    inventory,
    clients,
    quotes,
    invoices,
    staff,
    maintenanceRecords,
    resetAllData,
  } = useApp();

  const [section, setSection] = useState<AdminSection>('team');
  const [auditLog, setAuditLog] = useState<AdminAuditEntry[]>(() => getAdminAuditLog());

  const isAdmin = activeRole === 'Admin' && userHasPermission('canManageUserRoles');
  const actor = currentUser?.email || 'Signed-out operator';

  const refreshLog = () => setAuditLog(getAdminAuditLog());

  const handleExport = (
    label: string,
    filename: string,
    headers: string[],
    rows: (string | number | boolean | null | undefined)[][]
  ) => {
    exportToCSV(filename, headers, rows);
    logAdminAction('Data export', `${label} exported as CSV (${rows.length} rows)`, actor);
    refreshLog();
  };

  const handleResync = () => {
    if (!confirm('Re-sync and reload all live records directly from the cloud database?')) return;
    resetAllData();
    logAdminAction('Data re-sync', 'Reloaded all collections from the cloud database', actor);
    refreshLog();
  };

  const handleClearLog = () => {
    if (!confirm('Clear the administrative audit log? This cannot be undone.')) return;
    clearAdminAuditLog();
    refreshLog();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Administrator Access Required</h1>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              The admin console is restricted to the <span className="font-semibold text-white">Admin</span> role
              under least privilege security policies. You are currently viewing as{' '}
              <span className="text-amber-400 font-mono font-bold">{activeRole}</span>.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Workspace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <header className="border-b border-neutral-800 bg-neutral-900/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="/"
              aria-label="Back to workspace"
              className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Admin Console
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-mono font-bold">
                  <Shield className="w-2.5 h-2.5" />
                  ADMIN
                </span>
              </h1>
              <p className="text-[11px] text-neutral-400 font-mono truncate">
                {settings.companyName} · {actor}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 shrink-0 hidden sm:block">
            /admin
          </span>
        </div>

        <nav className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 flex flex-wrap gap-1.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              aria-current={section === id ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                section === id
                  ? 'bg-amber-400 text-neutral-950 border-amber-400'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {section === 'team' && (
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
            <TeamManager />
          </section>
        )}

        {section === 'settings' && (
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Company Profile & Operational Defaults
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Billing terms, tax defaults and the standard rental agreement used on every proposal.
              </p>
            </div>
            <CompanySettingsForm />
          </section>
        )}

        {section === 'data' && (
          <>
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="border-b border-neutral-800 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  Data Snapshot
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Record counts currently loaded in this workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  { label: 'Inventory assets', value: inventory.length },
                  { label: 'Crew members', value: staff.length },
                  { label: 'Client accounts', value: clients.length },
                  { label: 'Quotes', value: quotes.length },
                  { label: 'Invoices', value: invoices.length },
                  { label: 'Maintenance records', value: maintenanceRecords.length },
                ].map((stat) => (
                  <div key={stat.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                    <div className="text-lg font-bold text-white font-mono">{stat.value}</div>
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wide mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() =>
                    handleExport(
                      'Inventory',
                      'itw-inventory',
                      ['SKU', 'Name', 'Category', 'Model', 'Total', 'Available', 'On Rent', 'Day Rate', 'Week Rate', 'Bin'],
                      inventory.map((i) => [
                        i.sku, i.name, i.category, i.model, i.totalQuantity,
                        i.availableQuantity, i.onRentQuantity, i.dayRate, i.weekRate, i.locationBin,
                      ])
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Inventory CSV
                </button>
                <button
                  onClick={() =>
                    handleExport(
                      'Quotes',
                      'itw-quotes',
                      ['Quote #', 'Event', 'Client Company', 'Status', 'Total', 'Show Start'],
                      quotes.map((q) => [q.quoteNumber, q.eventName, q.clientCompany, q.status, q.totalAmount, q.showStartDate])
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Quotes CSV
                </button>
                <button
                  onClick={() =>
                    handleExport(
                      'Clients',
                      'itw-clients',
                      ['Name', 'Company', 'Email', 'Phone', 'Billing Terms'],
                      clients.map((c) => [c.name, c.company, c.email, c.phone, c.billingTerms])
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Clients CSV
                </button>
                <button
                  onClick={handleResync}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-sync from Cloud
                </button>
              </div>
            </section>

            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-amber-400" />
                    Audit Log
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Administrative actions recorded in this workspace, newest first.
                  </p>
                </div>
                <button
                  onClick={handleClearLog}
                  disabled={auditLog.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 hover:text-rose-300 border border-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>

              {auditLog.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center font-mono">
                  No administrative actions recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-800 text-xs">
                  {auditLog.slice(0, 50).map((entry) => (
                    <li key={entry.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="font-mono text-[10px] text-neutral-500 sm:w-36 shrink-0">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      <span className="font-semibold text-white shrink-0">{entry.action}</span>
                      <span className="text-neutral-400 truncate">{entry.detail}</span>
                      <span className="sm:ml-auto font-mono text-[10px] text-neutral-500 shrink-0">
                        {entry.actor}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};
