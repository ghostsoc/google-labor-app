import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLogEntry, AuditEntityType, AuditActionType } from '../types/audit';
import { exportToCSV } from '../utils/csvExport';
import {
  History,
  Search,
  Filter,
  Download,
  FileText,
  Package,
  Calendar,
  Clock,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const {
    auditLogs,
    clearAuditLogs,
    setActiveTab,
    activeRole,
    userHasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedActor, setSelectedActor] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // Metrics
  const totalEvents = auditLogs.length;
  const quoteEvents = auditLogs.filter((l) => l.entityType === 'quote').length;
  const inventoryEvents = auditLogs.filter((l) => l.entityType === 'inventory').length;
  const scheduleEvents = auditLogs.filter((l) => l.entityType === 'schedule').length;

  const uniqueActors = useMemo(() => {
    const map = new Map<string, string>();
    auditLogs.forEach((l) => {
      if (l.actor.email) {
        map.set(l.actor.email, l.actor.name || l.actor.email);
      }
    });
    return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
  }, [auditLogs]);

  // Filtering
  const filteredLogs = useMemo(() => {
    const now = new Date().getTime();

    return auditLogs.filter((log) => {
      // Entity type filter
      if (selectedEntity !== 'all' && log.entityType !== selectedEntity) {
        return false;
      }

      // Action filter
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false;
      }

      // Actor filter
      if (selectedActor !== 'all' && log.actor.email !== selectedActor) {
        return false;
      }

      // Timeframe filter
      if (selectedTimeframe !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const diffMs = now - logTime;
        if (selectedTimeframe === 'today' && diffMs > 24 * 60 * 60 * 1000) return false;
        if (selectedTimeframe === '7days' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (selectedTimeframe === '30days' && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSummary = log.summary.toLowerCase().includes(q);
        const matchesEntity = log.entityName.toLowerCase().includes(q);
        const matchesActor =
          log.actor.name.toLowerCase().includes(q) ||
          log.actor.email.toLowerCase().includes(q) ||
          log.actor.role.toLowerCase().includes(q);
        const matchesDiff = log.changes?.some(
          (c) =>
            c.fieldLabel.toLowerCase().includes(q) ||
            String(c.oldValue).toLowerCase().includes(q) ||
            String(c.newValue).toLowerCase().includes(q)
        );

        if (!matchesSummary && !matchesEntity && !matchesActor && !matchesDiff) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, selectedEntity, selectedAction, selectedActor, selectedTimeframe, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLogIds(new Set(filteredLogs.map((l) => l.id)));
  };

  const collapseAll = () => {
    setExpandedLogIds(new Set());
  };

  const handleExportCSV = () => {
    const filename = `in_the_wind_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    const headers = [
      'Timestamp (ISO)',
      'Entity Type',
      'Entity ID',
      'Entity Name / Reference',
      'Action Taken',
      'Summary',
      'Actor Name',
      'Actor Role',
      'Actor Email',
      'Changed Fields (Diff)',
    ];

    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.entityType,
      log.entityId,
      log.entityName,
      log.action,
      log.summary,
      log.actor.name,
      log.actor.role,
      log.actor.email,
      log.changes
        ? log.changes
            .map((c) => `${c.fieldLabel}: "${c.oldValue}" -> "${c.newValue}"`)
            .join(' | ')
        : 'N/A',
    ]);

    exportToCSV(filename, headers, rows);
  };

  const getEntityIcon = (type: AuditEntityType) => {
    switch (type) {
      case 'quote':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'inventory':
        return <Package className="w-4 h-4 text-blue-400" />;
      case 'schedule':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'create':
        return { label: 'Created', bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' };
      case 'update':
        return { label: 'Updated', bg: 'bg-blue-950/80 text-blue-300 border-blue-800/80' };
      case 'status_change':
        return { label: 'Status Changed', bg: 'bg-amber-950/80 text-amber-300 border-amber-800/80' };
      case 'maintenance':
        return { label: 'Maintenance', bg: 'bg-orange-950/80 text-orange-300 border-orange-800/80' };
      case 'gear_hold':
        return { label: 'Gear Held', bg: 'bg-purple-950/80 text-purple-300 border-purple-800/80' };
      case 'delete':
        return { label: 'Deleted', bg: 'bg-rose-950/80 text-rose-400 border-rose-800/80' };
      default:
        return { label: action, bg: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
    }
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatRelativeTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const navigateToEntityModule = (type: AuditEntityType) => {
    if (type === 'quote') setActiveTab('quotes');
    else if (type === 'inventory') setActiveTab('inventory');
    else if (type === 'schedule') setActiveTab('staff');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Operational Audit Trail</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {totalEvents} Logged Events
                </span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Comprehensive accountability logging for quotes, equipment inventory, and staff dispatch schedules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg border border-neutral-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Download full CSV report of audit logs"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
            <span className="font-mono text-[10px] text-neutral-400">({filteredLogs.length})</span>
          </button>

          {/* Admin Purge / Reset Button */}
          {activeRole === 'Admin' && (
            <button
              onClick={() => {
                if (window.confirm('Reset all audit logs to initial baseline state?')) {
                  clearAuditLogs();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-lg border border-rose-900/50 transition-colors cursor-pointer"
              title="Clear audit log history (Admin only)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Purge</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Events */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-xs font-medium">Total Activity</span>
            <History className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {totalEvents}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Real-time multi-user change entries
          </div>
        </div>

        {/* Quotes Tracked */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-xs font-medium">Quote Changes</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {quoteEvents}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Proposals, bookings & status updates
          </div>
        </div>

        {/* Inventory Tracked */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-xs font-medium">Inventory Asset Logs</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400 tabular-nums">
            {inventoryEvents}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Stock counts, bins & repairs
          </div>
        </div>

        {/* Schedule Tracked */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-xs font-medium">Crew Shifts Dispatched</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {scheduleEvents}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Technician calls & time shifts
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3.5 shadow-xs">
        {/* Primary Row: Search and Entity Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Entity Tab Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Modules', count: totalEvents },
              { id: 'quote', label: 'Quotes', count: quoteEvents },
              { id: 'inventory', label: 'Inventory', count: inventoryEvents },
              { id: 'schedule', label: 'Staff Schedules', count: scheduleEvents },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedEntity(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  selectedEntity === tab.id
                    ? 'bg-neutral-800 text-amber-400 font-bold border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by quote, SKU, staff, change..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Secondary Row: Granular Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/70 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Action Type Dropdown */}
            <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 text-[11px]">Action:</span>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Actions</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="status_change">Status Changed</option>
                <option value="maintenance">Maintenance</option>
                <option value="gear_hold">Gear Held</option>
                <option value="delete">Deleted</option>
              </select>
            </div>

            {/* Timeframe Dropdown */}
            <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 text-[11px]">Date:</span>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Past 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {/* Actor Filter Dropdown */}
            {uniqueActors.length > 0 && (
              <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 text-[11px]">User:</span>
                <select
                  value={selectedActor}
                  onChange={(e) => setSelectedActor(e.target.value)}
                  className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer max-w-[140px] truncate"
                >
                  <option value="all">All Crew</option>
                  {uniqueActors.map((a) => (
                    <option key={a.email} value={a.email}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Expand / Collapse Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400 font-mono">
              Showing {filteredLogs.length} of {totalEvents}
            </span>
            <span className="text-neutral-700">·</span>
            <button
              onClick={expandAll}
              className="text-[11px] text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-neutral-700">·</span>
            <button
              onClick={collapseAll}
              className="text-[11px] text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline Feed */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">No Matching Audit Entries</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                No events matched your current combination of module, action, date, and search filters.
              </p>
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getActionBadge(log.action);
            const isExpanded = expandedLogIds.has(log.id);
            const hasChanges = !!log.changes && log.changes.length > 0;

            return (
              <div
                key={log.id}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-4 sm:p-5 transition-all shadow-xs space-y-3 group"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Entity Tag */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-semibold text-white">
                      {getEntityIcon(log.entityType)}
                      <span className="capitalize">{log.entityType}</span>
                    </div>

                    {/* Action Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${badge.bg}`}
                    >
                      {badge.label}
                    </span>

                    {/* Entity Name */}
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {log.entityName}
                    </span>
                  </div>

                  {/* Actor & Time */}
                  <div className="flex items-center gap-2.5 text-xs text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white">{log.actor.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-950 text-amber-300 border border-neutral-800">
                        {log.actor.role}
                      </span>
                    </div>
                    <span className="text-neutral-700">·</span>
                    <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-400">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span>{formatRelativeTime(log.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Summary Description */}
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
                    {log.summary}
                  </p>

                  <button
                    onClick={() => navigateToEntityModule(log.entityType)}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title={`Jump to ${log.entityType} module`}
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Changed Fields Drawer */}
                {hasChanges && (
                  <div className="border-t border-neutral-800/80 pt-2.5">
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide change diff ({log.changes!.length} fields)</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Inspect change diff ({log.changes!.length} fields)</span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950/70 animate-in fade-in duration-100">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase font-mono border-b border-neutral-800">
                            <tr>
                              <th className="py-2 px-3">Field Name</th>
                              <th className="py-2 px-3">Previous State</th>
                              <th className="py-2 px-3">Updated State</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-mono text-[11px]">
                            {log.changes!.map((change, idx) => (
                              <tr key={idx} className="hover:bg-neutral-800/30">
                                <td className="py-2 px-3 font-semibold text-neutral-200">
                                  {change.fieldLabel}
                                </td>
                                <td className="py-2 px-3 text-rose-400/90 line-through max-w-[200px] truncate">
                                  {String(change.oldValue ?? 'None')}
                                </td>
                                <td className="py-2 px-3 text-emerald-400 font-bold max-w-[200px] truncate">
                                  {String(change.newValue ?? 'None')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Compliance Footer Banner */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Enterprise Change Tracking Engine — All transactions synced in real-time to Google Cloud Firestore with append-only validation rules.
          </span>
        </div>
        <div className="font-mono text-[11px] text-neutral-500">
          Auditor Engine v2.4 · RFC 4180 Standard
        </div>
      </div>
    </div>
  );
};
