export type InventoryCategory =
  | 'Audio'
  | 'Video'
  | 'Lighting'
  | 'Rigging & Power'
  | 'Staging & Truss'
  | 'Cables & Comms';

export type ItemStatus = 'Available' | 'In Maintenance' | 'Decommissioned';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  subcategory: string;
  model: string;
  totalQuantity: number;
  availableQuantity: number;
  onRentQuantity: number;
  inRepairQuantity: number;
  status: ItemStatus; // Overall fleet condition or specific item flag
  dayRate: number;
  weekRate: number;
  replacementCost: number;
  locationBin: string;
  barcode: string;
  powerWatts?: number;
  weightLbs?: number;
  lastServiceDate?: string;
  nextServiceDueDate?: string;
  notes?: string;
  imageUrl?: string;
}

export type CrewRole =
  | 'A1 Audio Lead'
  | 'A2 Audio Assistant'
  | 'V1 Video Lead / Switcher'
  | 'V2 Video Tech / Projection'
  | 'L1 Lighting Designer / Board Op'
  | 'L2 Lighting Tech'
  | 'Rigging Lead'
  | 'Stage Manager'
  | 'General AV Tech'
  | 'Production Manager'
  | 'Logistics & Truck Driver';

export interface StaffMember {
  id: string;
  name: string;
  role: CrewRole;
  email: string;
  phone: string;
  dayRate: number;
  hourlyRate: number;
  skills: string[];
  avatarUrl: string;
  status: 'Available' | 'On Job' | 'Off Duty';
  notes?: string;
}

export interface AssignedShiftEquipment {
  id: string;
  inventoryId: string;
  name: string;
  sku: string;
  category: InventoryCategory;
  quantity: number;
  locationBin?: string;
  barcode?: string;
  stagedStatus: 'Pending Staging' | 'Staged / Checked Out' | 'Returned';
  stagedAt?: string;
  stagedBy?: string;
  notes?: string;
}

export interface LaborShift {
  id: string;
  quoteId?: string;
  eventName: string;
  staffId: string;
  staffName: string;
  role: CrewRole;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "07:00"
  endTime: string; // e.g. "17:00"
  callType: 'Load In / Setup' | 'Show Operator' | 'Rehearsal' | 'Strike / Load Out' | 'Warehouse Prep';
  rateType: 'Day Rate' | 'Hourly';
  rate: number;
  hours: number;
  status: 'Draft' | 'Offered' | 'Confirmed' | 'Completed' | 'Declined';
  venue: string;
  notes?: string;
  assignedEquipment?: AssignedShiftEquipment[];
}

export interface QuoteEquipmentItem {
  id: string;
  inventoryId: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  days: number;
  dayRate: number;
  discountPercent: number;
  total: number;
}

export interface QuoteLaborItem {
  id: string;
  staffId?: string;
  staffName?: string;
  role: CrewRole;
  callType: string;
  daysOrHours: number;
  rateType: 'Day Rate' | 'Hourly';
  rate: number;
  quantity: number;
  total: number;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Declined' | 'Completed';

export interface ClientQuote {
  id: string;
  quoteNumber: string;
  clientId?: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  eventName: string;
  venueName: string;
  venueAddress: string;
  loadInDate: string;
  showStartDate: string;
  showEndDate: string;
  strikeDate: string;
  equipmentItems: QuoteEquipmentItem[];
  laborItems: QuoteLaborItem[];
  logisticsFee: number;
  damageWaiverPercent: number;
  taxPercent: number;
  clientDiscountPercent: number;
  equipmentSubtotal: number;
  laborSubtotal: number;
  damageWaiverAmount: number;
  taxAmount: number;
  totalAmount: number;
  estimatedLaborCost: number;
  status: QuoteStatus;
  termsAccepted: boolean;
  clientNotes?: string;
  internalNotes?: string;
  createdAt: string;
  validUntil: string;
  pulledGearStatus?: Record<string, number>;
  convertedToInvoiceId?: string;
}

// INVOICES & PAYMENTS
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';

export type PaymentMethod =
  | 'Credit Card'
  | 'ACH / Wire Transfer'
  | 'Company Check'
  | 'Cash'
  | 'Direct Deposit';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string; // e.g. "Check #1042" or "Stripe ch_3N..."
  recordedBy: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId?: string;
  quoteNumber?: string;
  clientId?: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone?: string;
  eventName: string;
  venueName?: string;
  issueDate: string;
  dueDate: string;
  equipmentSubtotal: number;
  laborSubtotal: number;
  logisticsFee: number;
  damageWaiverAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  paymentTerms: 'Due on Receipt' | 'Net 15' | 'Net 30' | 'Net 60';
  payments: PaymentRecord[];
  notes?: string;
  createdAt: string;
}

// CLIENT CRM
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  billingTerms: 'Due on Receipt' | 'Net 15' | 'Net 30' | 'Net 60';
  taxExempt: boolean;
  taxExemptNumber?: string;
  preferences: string; // Audio preferences, specific technicians requested, coffee order, etc.
  notes: string;
  createdAt: string;
}

// EQUIPMENT MAINTENANCE
export type MaintenanceType =
  | 'Inspection & Testing'
  | 'Repair / Component Fix'
  | 'Routine Cleaning & Service'
  | 'Certification / Load Test'
  | 'Firmware & Calibration';

export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Decommissioned';

export interface MaintenanceRecord {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  sku: string;
  dateLogged: string;
  scheduledDate?: string;
  completedDate?: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  serviceVendor: string; // In-house or External vendor like "L-Acoustics Factory Service", "Motion Labs", etc.
  technician: string;
  cost: number;
  issueDescription: string;
  resolutionNotes?: string;
  nextServiceDueDate?: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  defaultTaxRate: number;
  defaultDamageWaiver: number;
  currencySymbol: string;
  termsAndConditions: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'inventory'
  | 'maintenance'
  | 'staff'
  | 'quotes'
  | 'invoices'
  | 'clients'
  | 'pullsheet'
  | 'settings';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
}

