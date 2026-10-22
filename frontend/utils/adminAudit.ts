/**
 * Lightweight audit trail for administrative actions performed in the app.
 * Entries are kept in localStorage (same local-first persistence the rest of
 * the app uses) and capped so the log cannot grow without bound.
 */

export interface AdminAuditEntry {
  id: string;
  timestamp: string; // ISO 8601
  actor: string;
  action: string;
  detail: string;
}

const STORAGE_KEY = 'itw_admin_audit_log';
const MAX_ENTRIES = 200;

export function getAdminAuditLog(): AdminAuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminAuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function logAdminAction(action: string, detail: string, actor?: string): void {
  const entry: AdminAuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    actor: actor || 'Unknown operator',
    action,
    detail,
  };

  try {
    const log = [entry, ...getAdminAuditLog()].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // Auditing must never block the action being audited.
  }
}

export function clearAdminAuditLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
