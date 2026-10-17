import { UserRole } from './roles';

export type AuditEntityType = 'quote' | 'inventory' | 'schedule';

export type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'maintenance'
  | 'gear_hold';

export interface AuditFieldChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLogActor {
  uid: string;
  name: string;
  email: string;
  role: UserRole | string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  entityType: AuditEntityType; // 'quote' | 'inventory' | 'schedule'
  entityId: string;
  entityName: string; // e.g. "ITW-2026-092 (Apex Technology Showcase 2026)" or "Shure ULXD4Q Quad Receiver"
  action: AuditActionType;
  summary: string;
  changes?: AuditFieldChange[];
  actor: AuditLogActor;
  metadata?: Record<string, any>;
}
