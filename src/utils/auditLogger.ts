import {
  AuditLogEntry,
  AuditFieldChange,
  AuditEntityType,
  AuditActionType,
  AuditLogActor,
} from '../types/audit';

// Human-readable labels for entity fields
export const FIELD_LABELS: Record<string, string> = {
  // Quote fields
  eventName: 'Event Name',
  quoteNumber: 'Quote Number',
  clientName: 'Client Contact',
  clientCompany: 'Client Company',
  clientEmail: 'Client Email',
  venueName: 'Venue Name',
  venueAddress: 'Venue Address',
  loadInDate: 'Load-In Date',
  showStartDate: 'Show Start Date',
  showEndDate: 'Show End Date',
  strikeDate: 'Strike Date',
  status: 'Status',
  totalAmount: 'Total Amount ($)',
  equipmentSubtotal: 'Equipment Subtotal ($)',
  laborSubtotal: 'Labor Subtotal ($)',
  logisticsFee: 'Logistics Fee ($)',
  damageWaiverPercent: 'Damage Waiver (%)',
  taxPercent: 'Sales Tax (%)',
  clientDiscountPercent: 'Client Discount (%)',
  termsAccepted: 'Terms & Conditions Accepted',
  equipmentItems: 'Equipment Items Manifest',
  laborItems: 'Crew Labor Call List',
  pulledGearStatus: 'Pulled Equipment Status',
  internalNotes: 'Internal Notes',
  clientNotes: 'Client Notes',

  // Inventory fields
  sku: 'Item SKU',
  name: 'Asset Name',
  category: 'Equipment Category',
  subcategory: 'Subcategory',
  model: 'Model Number',
  totalQuantity: 'Total Fleet Count',
  availableQuantity: 'Available in Warehouse',
  onRentQuantity: 'Currently On-Rent',
  inRepairQuantity: 'In Repair / Shop',
  dayRate: 'Standard Day Rate ($)',
  weekRate: 'Weekly Rate ($)',
  replacementCost: 'Full Replacement Value ($)',
  locationBin: 'Warehouse Location Bin',
  barcode: 'Barcode / Asset Tag',
  powerWatts: 'Power Consumption (Watts)',
  weightLbs: 'Weight (Lbs)',
  lastServiceDate: 'Last Inspection Date',
  nextServiceDueDate: 'Next Service Due',

  // Schedule & Shift fields
  staffName: 'Assigned Crew Member',
  role: 'Production Crew Role',
  date: 'Call Date',
  startTime: 'Call Time (Start)',
  endTime: 'Wrap Time (End)',
  callType: 'Shift Type',
  rateType: 'Pay Structure',
  rate: 'Labor Pay Rate ($)',
  hours: 'Scheduled Hours',
  venue: 'Show Site Venue',
  assignedEquipment: 'Assigned Gear Pack',
};

/**
 * Computes deep field differences between two states of an object.
 */
export function computeEntityDiff(
  oldObj: Record<string, any>,
  updates: Record<string, any>,
  fieldsToIgnore: string[] = ['id', 'createdAt', 'updatedAt']
): AuditFieldChange[] {
  const changes: AuditFieldChange[] = [];

  for (const [key, newVal] of Object.entries(updates)) {
    if (fieldsToIgnore.includes(key)) continue;
    const oldVal = oldObj[key];

    // Check if values actually differ
    const isDifferent =
      typeof newVal === 'object' && newVal !== null
        ? JSON.stringify(oldVal) !== JSON.stringify(newVal)
        : oldVal !== newVal;

    if (isDifferent && oldVal !== undefined) {
      let formattedOld = oldVal;
      let formattedNew = newVal;

      // Friendly string formatting for arrays
      if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        formattedOld = `${oldVal.length} item(s)`;
        formattedNew = `${newVal.length} item(s)`;
      } else if (typeof oldVal === 'boolean') {
        formattedOld = oldVal ? 'Yes' : 'No';
        formattedNew = newVal ? 'Yes' : 'No';
      }

      changes.push({
        field: key,
        fieldLabel: FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        oldValue: formattedOld,
        newValue: formattedNew,
      });
    }
  }

  return changes;
}

/**
 * Initial historical seed audit entries for existing mock quotes, inventory, and shifts.
 */
export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(), // 24 minutes ago
    entityType: 'quote',
    entityId: 'quote-001',
    entityName: 'ITW-2026-092 (Apex Technology Showcase 2026)',
    action: 'status_change',
    summary: 'Approved quote and locked client production contract',
    actor: {
      uid: 'user-001',
      name: 'Chris Vance',
      email: 'chris@inthewindav.com',
      role: 'Admin',
    },
    changes: [
      {
        field: 'status',
        fieldLabel: 'Status',
        oldValue: 'Sent',
        newValue: 'Approved',
      },
      {
        field: 'termsAccepted',
        fieldLabel: 'Terms & Conditions Accepted',
        oldValue: 'No',
        newValue: 'Yes',
      },
    ],
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // ~1 hr ago
    entityType: 'inventory',
    entityId: 'inv-001',
    entityName: 'L-Acoustics K2 Line Array Enclosure [SKU: SPK-LA-K2-01]',
    action: 'update',
    summary: 'Adjusted total quantity and warehouse bin location',
    actor: {
      uid: 'user-002',
      name: 'Marcus Brody',
      email: 'm.brody@inthewindav.com',
      role: 'Warehouse Lead',
    },
    changes: [
      {
        field: 'availableQuantity',
        fieldLabel: 'Available in Warehouse',
        oldValue: 6,
        newValue: 8,
      },
      {
        field: 'locationBin',
        fieldLabel: 'Warehouse Location Bin',
        oldValue: 'Bay A-03',
        newValue: 'Bay A-01',
      },
    ],
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hrs ago
    entityType: 'schedule',
    entityId: 'shift-001',
    entityName: 'Apex Technology Showcase 2026: Chris Vance (A1 Audio Lead)',
    action: 'update',
    summary: 'Updated call time and confirmed technician assignment',
    actor: {
      uid: 'user-003',
      name: 'Elena Rostova',
      email: 'e.rostova@inthewindav.com',
      role: 'Production Manager',
    },
    changes: [
      {
        field: 'startTime',
        fieldLabel: 'Call Time (Start)',
        oldValue: '07:30',
        newValue: '07:00',
      },
      {
        field: 'status',
        fieldLabel: 'Status',
        oldValue: 'Offered',
        newValue: 'Confirmed',
      },
    ],
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(), // ~5 hrs ago
    entityType: 'inventory',
    entityId: 'inv-002',
    entityName: 'GrandMA3 Full-Size Console [SKU: CON-MA3-FS-01]',
    action: 'maintenance',
    summary: 'Placed 1 unit into shop for firmware & motorized fader service',
    actor: {
      uid: 'user-002',
      name: 'Marcus Brody',
      email: 'm.brody@inthewindav.com',
      role: 'Warehouse Lead',
    },
    changes: [
      {
        field: 'status',
        fieldLabel: 'Status',
        oldValue: 'Available',
        newValue: 'In Maintenance',
      },
      {
        field: 'inRepairQuantity',
        fieldLabel: 'In Repair / Shop',
        oldValue: 0,
        newValue: 1,
      },
    ],
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hrs ago
    entityType: 'quote',
    entityId: 'quote-002',
    entityName: 'ITW-2026-093 (Vanguard Philanthropy Gala 2026)',
    action: 'create',
    summary: 'Created new production proposal for Vanguard Philanthropy Foundation',
    actor: {
      uid: 'user-003',
      name: 'Elena Rostova',
      email: 'e.rostova@inthewindav.com',
      role: 'Production Manager',
    },
    changes: [
      {
        field: 'totalAmount',
        fieldLabel: 'Total Amount ($)',
        oldValue: '$0.00',
        newValue: '$8,450.00',
      },
      {
        field: 'status',
        fieldLabel: 'Status',
        oldValue: 'None',
        newValue: 'Sent',
      },
    ],
  },
  {
    id: 'audit-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 1 day ago
    entityType: 'schedule',
    entityId: 'shift-002',
    entityName: 'Vanguard Philanthropy Gala: Sarah Lin (L1 Lighting Designer)',
    action: 'create',
    summary: 'Dispatched crew call for L1 Lighting Designer / Board Op',
    actor: {
      uid: 'user-003',
      name: 'Elena Rostova',
      email: 'e.rostova@inthewindav.com',
      role: 'Production Manager',
    },
  },
];
