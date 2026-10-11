import { ClientQuote, InventoryItem, LaborShift, Invoice, CompanySettings, StaffMember } from '../types';

export interface CreatedSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export interface SheetValuesResult {
  range: string;
  majorDimension: string;
  values: string[][];
}

/**
 * Creates a raw Google Spreadsheet with initial title and optional tab names
 */
export async function createGoogleSpreadsheet(
  title: string,
  accessToken: string,
  sheetTitles: string[] = ['Sheet1']
): Promise<CreatedSpreadsheetResult> {
  const requestBody = {
    properties: {
      title,
    },
    sheets: sheetTitles.map((tabTitle) => ({
      properties: {
        title: tabTitle,
        gridProperties: {
          frozenRowCount: 1,
        },
      },
    })),
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create spreadsheet (${res.status})`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

/**
 * Appends or updates values in a Google Spreadsheet range
 */
export async function updateSheetValues(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][],
  accessToken: string
): Promise<void> {
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to update sheet values (${res.status})`);
  }
}

/**
 * Reads values from a Google Spreadsheet
 */
export async function readSheetValues(
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<SheetValuesResult> {
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to read sheet values (${res.status})`);
  }

  return await res.json();
}

/**
 * Exports a full AV Quote to a formatted Google Sheet
 */
export async function exportQuoteToGoogleSheet(
  quote: ClientQuote,
  settings: CompanySettings,
  accessToken: string
): Promise<CreatedSpreadsheetResult> {
  const dateStr = new Date().toISOString().split('T')[0];
  const title = `Quote #${quote.quoteNumber} - ${quote.eventName} (${dateStr})`;

  const created = await createGoogleSpreadsheet(title, accessToken, ['Quote Details', 'Equipment Manifest', 'Labor Call']);

  // Tab 1: Quote Overview
  const overviewValues: (string | number)[][] = [
    ['IN THE WIND AV - PRODUCTION QUOTE', ''],
    ['Company:', settings.companyName || 'In The Wind AV'],
    ['Quote Number:', quote.quoteNumber],
    ['Event Name:', quote.eventName],
    ['Client Name:', quote.clientName],
    ['Client Company:', quote.clientCompany || 'N/A'],
    ['Client Email:', quote.clientEmail],
    ['Venue Name:', quote.venueName],
    ['Venue Address:', quote.venueAddress || 'N/A'],
    ['Load-In Date:', quote.loadInDate || 'N/A'],
    ['Show Date:', `${quote.showStartDate} to ${quote.showEndDate}`],
    ['Strike Date:', quote.strikeDate || 'N/A'],
    ['Status:', quote.status],
    ['', ''],
    ['FINANCIAL SUMMARY', 'AMOUNT'],
    ['Equipment Subtotal:', `$${quote.equipmentSubtotal.toFixed(2)}`],
    ['Labor Subtotal:', `$${quote.laborSubtotal.toFixed(2)}`],
    ['Logistics / Trucking Fee:', `$${quote.logisticsFee.toFixed(2)}`],
    ['Damage Waiver (10%):', `$${quote.damageWaiverAmount.toFixed(2)}`],
    ['Estimated Tax (9.25%):', `$${quote.taxAmount.toFixed(2)}`],
    ['TOTAL PROPOSAL AMOUNT:', `$${quote.totalAmount.toFixed(2)}`],
  ];

  await updateSheetValues(created.spreadsheetId, "'Quote Details'!A1:B20", overviewValues, accessToken);

  // Tab 2: Equipment Manifest
  const gearHeaders = ['Item ID', 'Equipment Name', 'Category', 'Quantity', 'Days', 'Day Rate', 'Total'];
  const gearRows: (string | number)[][] = [gearHeaders];
  (quote.equipmentItems || []).forEach((item) => {
    gearRows.push([
      item.inventoryId || item.id,
      item.name,
      item.category,
      item.quantity,
      item.days,
      `$${item.dayRate}`,
      `$${item.total.toFixed(2)}`,
    ]);
  });

  await updateSheetValues(created.spreadsheetId, "'Equipment Manifest'!A1:G100", gearRows, accessToken);

  // Tab 3: Labor Call
  const laborHeaders = ['Role', 'Technician Call', 'Quantity / Schedule', 'Rate ($)', 'Total'];
  const laborRows: (string | number)[][] = [laborHeaders];
  (quote.laborItems || []).forEach((item) => {
    laborRows.push([
      item.role,
      item.staffName || item.role,
      `${item.quantity} (${item.daysOrHours} ${item.rateType === 'Hourly' ? 'hrs' : 'days'})`,
      `$${item.rate}`,
      `$${item.total.toFixed(2)}`,
    ]);
  });

  await updateSheetValues(created.spreadsheetId, "'Labor Call'!A1:E50", laborRows, accessToken);

  return created;
}

/**
 * Exports Full Inventory Catalog to a Google Sheet
 */
export async function exportInventoryToGoogleSheet(
  inventory: InventoryItem[],
  settings: CompanySettings,
  accessToken: string
): Promise<CreatedSpreadsheetResult> {
  const dateStr = new Date().toISOString().split('T')[0];
  const title = `Inventory Catalog - ${settings.companyName || 'In The Wind AV'} (${dateStr})`;

  const created = await createGoogleSpreadsheet(title, accessToken, ['Equipment Fleet']);

  const headers = [
    'SKU',
    'Equipment Name',
    'Category',
    'Subcategory',
    'Model',
    'Total Qty',
    'Available Qty',
    'On Rent Qty',
    'In Repair Qty',
    'Day Rate ($)',
    'Replacement Cost ($)',
    'Storage Bin',
    'Barcode',
    'Power (W)',
    'Status',
  ];

  const rows: (string | number)[][] = [headers];
  inventory.forEach((item) => {
    rows.push([
      item.sku,
      item.name,
      item.category,
      item.subcategory || '',
      item.model || '',
      item.totalQuantity,
      item.availableQuantity,
      item.onRentQuantity,
      item.inRepairQuantity,
      item.dayRate,
      item.replacementCost,
      item.locationBin,
      item.barcode,
      item.powerWatts || 0,
      item.status,
    ]);
  });

  await updateSheetValues(created.spreadsheetId, "'Equipment Fleet'!A1:O200", rows, accessToken);
  return created;
}

/**
 * Exports Labor Shifts Schedule to a Google Sheet
 */
export async function exportShiftsToGoogleSheet(
  shifts: LaborShift[],
  staff: StaffMember[],
  accessToken: string
): Promise<CreatedSpreadsheetResult> {
  const dateStr = new Date().toISOString().split('T')[0];
  const title = `Labor Dispatch Schedule - In The Wind AV (${dateStr})`;

  const created = await createGoogleSpreadsheet(title, accessToken, ['Shifts Roster']);

  const headers = [
    'Shift ID',
    'Event / Production',
    'Technician Name',
    'Dispatched Role',
    'Date',
    'Call Start',
    'Call End',
    'Duration (Hrs)',
    'Pay Rate ($)',
    'Rate Type',
    'Total Est Pay ($)',
    'Venue Location',
    'Status',
    'Crew Phone',
  ];

  const rows: (string | number)[][] = [headers];
  shifts.forEach((s) => {
    const tech = staff.find((m) => m.id === s.staffId);
    const estPay = s.rateType === 'Hourly' ? s.rate * s.hours : s.rate;
    rows.push([
      s.id,
      s.eventName,
      s.staffName,
      s.role,
      s.date,
      s.startTime,
      s.endTime,
      s.hours,
      s.rate,
      s.rateType,
      estPay,
      s.venue || 'On-Site',
      s.status,
      tech?.phone || 'N/A',
    ]);
  });

  await updateSheetValues(created.spreadsheetId, "'Shifts Roster'!A1:N200", rows, accessToken);
  return created;
}

/**
 * Exports Invoices Ledger to Google Sheets
 */
export async function exportInvoicesToGoogleSheet(
  invoices: Invoice[],
  accessToken: string
): Promise<CreatedSpreadsheetResult> {
  const dateStr = new Date().toISOString().split('T')[0];
  const title = `Billing & Invoices Ledger - In The Wind AV (${dateStr})`;

  const created = await createGoogleSpreadsheet(title, accessToken, ['Invoices Ledger']);

  const headers = [
    'Invoice #',
    'Event Name',
    'Client Name',
    'Client Company',
    'Client Email',
    'Issue Date',
    'Due Date',
    'Total Amount ($)',
    'Paid Amount ($)',
    'Balance Due ($)',
    'Payment Status',
    'Payment Terms',
  ];

  const rows: (string | number)[][] = [headers];
  invoices.forEach((inv) => {
    rows.push([
      inv.invoiceNumber,
      inv.eventName,
      inv.clientName,
      inv.clientCompany || '',
      inv.clientEmail,
      inv.issueDate,
      inv.dueDate,
      inv.totalAmount,
      inv.paidAmount,
      inv.balanceDue,
      inv.paymentStatus.toUpperCase(),
      inv.paymentTerms || 'Due on Receipt',
    ]);
  });

  await updateSheetValues(created.spreadsheetId, "'Invoices Ledger'!A1:L200", rows, accessToken);
  return created;
}
