import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp } from 'drizzle-orm/pg-core';

// Users table (maps Firebase Auth UID to relational record)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Inventory items fleet catalog
export const inventoryItems = pgTable('inventory_items', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory').notNull(),
  model: text('model').notNull(),
  totalQuantity: integer('total_quantity').notNull().default(1),
  availableQuantity: integer('available_quantity').notNull().default(1),
  onRentQuantity: integer('on_rent_quantity').notNull().default(0),
  inRepairQuantity: integer('in_repair_quantity').notNull().default(0),
  status: text('status').notNull().default('Available'),
  dayRate: doublePrecision('day_rate').notNull().default(0),
  weekRate: doublePrecision('week_rate').notNull().default(0),
  replacementCost: doublePrecision('replacement_cost').notNull().default(0),
  locationBin: text('location_bin').notNull().default('Bay A'),
  barcode: text('barcode').notNull(),
  powerWatts: integer('power_watts').default(0),
  weightLbs: integer('weight_lbs').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Clients CRM directory
export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  billingTerms: text('billing_terms').notNull().default('Net 30'),
  taxExempt: boolean('tax_exempt').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Production proposals & rental contracts
export const quotes = pgTable('quotes', {
  id: text('id').primaryKey(),
  quoteNumber: text('quote_number').notNull(),
  clientId: text('client_id'),
  clientName: text('client_name').notNull(),
  clientCompany: text('client_company').notNull(),
  clientEmail: text('client_email').notNull(),
  eventName: text('event_name').notNull(),
  venueName: text('venue_name').notNull(),
  venueAddress: text('venue_address'),
  loadInDate: text('load_in_date').notNull(),
  showStartDate: text('show_start_date').notNull(),
  showEndDate: text('show_end_date').notNull(),
  strikeDate: text('strike_date').notNull(),
  equipmentSubtotal: doublePrecision('equipment_subtotal').notNull().default(0),
  laborSubtotal: doublePrecision('labor_subtotal').notNull().default(0),
  logisticsFee: doublePrecision('logistics_fee').notNull().default(0),
  damageWaiverAmount: doublePrecision('damage_waiver_amount').notNull().default(0),
  taxAmount: doublePrecision('tax_amount').notNull().default(0),
  totalAmount: doublePrecision('total_amount').notNull().default(0),
  status: text('status').notNull().default('Draft'),
  equipmentItemsJson: text('equipment_items_json'),
  laborItemsJson: text('labor_items_json'),
  meetingDiagramJson: text('meeting_diagram_json'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invoices & accounts receivable
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull(),
  quoteId: text('quote_id'),
  quoteNumber: text('quote_number'),
  clientCompany: text('client_company').notNull(),
  eventName: text('event_name').notNull(),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date').notNull(),
  totalAmount: doublePrecision('total_amount').notNull().default(0),
  paidAmount: doublePrecision('paid_amount').notNull().default(0),
  balanceDue: doublePrecision('balance_due').notNull().default(0),
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  paymentTerms: text('payment_terms').notNull().default('Net 30'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Crew labor shifts
export const laborShifts = pgTable('labor_shifts', {
  id: text('id').primaryKey(),
  staffMemberId: text('staff_member_id').notNull(),
  staffName: text('staff_name').notNull(),
  role: text('role').notNull(),
  date: text('date').notNull(),
  callTime: text('call_time').notNull(),
  wrapTime: text('wrap_time').notNull(),
  hours: doublePrecision('hours').notNull().default(8),
  rate: doublePrecision('rate').notNull().default(65),
  eventName: text('event_name').notNull(),
  venue: text('venue').notNull(),
  callType: text('call_type').notNull(),
  status: text('status').notNull().default('Scheduled'),
  createdAt: timestamp('created_at').defaultNow(),
});
