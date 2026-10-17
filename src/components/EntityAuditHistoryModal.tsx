import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLogEntry, AuditEntityType } from '../types/audit';
import { exportToCSV } from '../utils/csvExport';
import {
  History,
  X,
  FileText,
  Package,
  Calendar,
  User,
  ArrowRight,
  Clock,
  Download,
  Shield,
  Layers,
  Search,
} from 'lucide-react';

interface EntityAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: AuditEntityType;
  entityId: string;
  entityTitle: string;
  subtitle?: string;
}

export const EntityAuditHistoryModal: React.FC<EntityAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
  subtitle,
}) => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // Filter logs for this specific entity
  const entityLogs = useMemo(() => {
    return auditLogs.filter(
      (log) =>
        log.entityId === entityId ||
        (log.entityType === entityType && log.entityName.includes(entityTitle))
    );
  }, [auditLogs, entityId, entityType, entityTitle]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return entityLogs;
    const q = searchQuery.toLowerCase();
    return entityLogs.filter(
      (log) =>
        log.summary.toLowerCase().includes(q) ||
        log.actor.name.toLowerCase().includes(q) ||
        log.actor.role.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.changes?.some(
          (c) =>
            c.fieldLabel.toLowerCase().includes(q) ||
            String(c.oldValue).toLowerCase().includes(q) ||
            String(c.newValue).toLowerCase().includes(q)
        )
    );
  }, [entityLogs, searchQuery]);

  if (!isOpen) return null;

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
    setExpandedLogIds(new Set(entityLogs.map((l) => l.id)));
  };

  const collapseAll = () => {
    setExpandedLogIds(new Set());
  };

  const handleExportCSV = () => {
    const filename = `${entityType}_audit_history_${entityId}_${new Date().toISOString().split('T')[0]}.csv`;
    const headers = [
      'Timestamp',
      'Entity Type',
      'Entity ID',
      'Entity Name',
      'Action',
      'Summary',
      'Actor Name',
      'Actor Role',
      'Actor Email',
      'Changes (Diff)',
    ];

    const rows = entityLogs.map((log) => [
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

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return { label: 'Created', bg: 'bg-emerald-950 text-emerald-400 border-emerald-800' };
      case 'update':
        return { label: 'Updated', bg: 'bg-blue-950 text-blue-300 border-blue-800' };
      case 'status_change':
        return { label: 'Status Changed', bg: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'maintenance':
        return { label: 'Maintenance', bg: 'bg-orange-950 text-orange-300 border-orange-800' };
      case 'gear_hold':
        return { label: 'Gear Held', bg: 'bg-purple-950 text-purple-300 border-purple-800' };
      case 'delete':
        return { label: 'Deleted', bg: 'bg-rose-950 text-rose-400 border-rose-800' };
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate">
                  Audit Trail & Change History
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {entityType}
                </span>
              </div>
              <p className="text-xs text-neutral-400 truncate mt-0.5 font-medium">
                {entityTitle} {subtitle ? `· ${subtitle}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={entityLogs.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
              title="Download RFC-4180 CSV audit history"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search history, actors, or modified fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-neutral-400 font-mono">
              {filteredLogs.length} of {entityLogs.length} events
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
              Collapse
            </button>
          </div>
        </div>

        {/* Timeline Log List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 text-neutral-500 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-300">No matching audit logs found</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  {entityLogs.length === 0
                    ? 'No changes have been recorded for this item yet. All modifications will be automatically logged here for accountability.'
                    : 'No historical changes match your search term. Try resetting your query.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative border-l-2 border-neutral-800 pl-5 sm:pl-6 space-y-5">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.action);
                const isExpanded = expandedLogIds.has(log.id);
                const hasChanges = !!log.changes && log.changes.length > 0;

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node Point */}
                    <div className="absolute -left-[27px] sm:-left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-neutral-950 border-2 border-amber-400 ring-4 ring-neutral-900 group-hover:scale-110 transition-transform" />

                    {/* Card Container */}
                    <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-all shadow-xs space-y-2.5">
                      {/* Top Row: Action, Actor, Relative Time */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          <div className="flex items-center gap-1.5 text-neutral-300">
                            <span className="font-semibold text-white">{log.actor.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                              {log.actor.role}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{formatRelativeTime(log.timestamp)}</span>
                          <span className="text-neutral-600 hidden sm:inline">·</span>
                          <span className="text-neutral-500 hidden sm:inline">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Summary Line */}
                      <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                        {log.summary}
                      </p>

                      {/* Field Diff Section */}
                      {hasChanges && (
                        <div className="pt-1">
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 cursor-pointer"
                          >
                            <span>
                              {isExpanded
                                ? 'Hide Changed Fields ▲'
                                : `View ${log.changes!.length} Changed Field${log.changes!.length > 1 ? 's' : ''} ▼`}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2.5 border border-neutral-800/80 rounded-lg overflow-hidden bg-neutral-900/70 animate-in fade-in duration-100">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-neutral-950/60 text-neutral-400 text-[10px] uppercase font-mono border-b border-neutral-800">
                                  <tr>
                                    <th className="py-2 px-3">Field</th>
                                    <th className="py-2 px-3">Previous Value</th>
                                    <th className="py-2 px-3">New Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-mono text-[11px]">
                                  {log.changes!.map((change, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-800/40">
                                      <td className="py-2 px-3 font-semibold text-neutral-200">
                                        {change.fieldLabel}
                                      </td>
                                      <td className="py-2 px-3 text-rose-400/90 line-through max-w-[180px] truncate">
                                        {String(change.oldValue ?? 'None')}
                                      </td>
                                      <td className="py-2 px-3 text-emerald-400 font-bold max-w-[180px] truncate">
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Immutable audit trail recorded under operational compliance policies.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
