export type UserRole =
  | 'Admin'
  | 'Production Manager'
  | 'Warehouse Lead'
  | 'Lead Engineer'
  | 'Technician'
  | 'Finance & Billing';

export interface RolePermissions {
  // Navigation / Module access
  canAccessDashboard: boolean;
  canAccessInventory: boolean;
  canAccessMaintenance: boolean;
  canAccessStaff: boolean;
  canAccessQuotes: boolean;
  canAccessInvoices: boolean;
  canAccessClients: boolean;
  canAccessPullSheets: boolean;
  canAccessSettings: boolean;

  // Granular Actions
  canCreateEditInventory: boolean;
  canDeleteInventory: boolean;
  canManageMaintenance: boolean;
  canScheduleCrew: boolean;
  canViewCrewRates: boolean;
  canCreateEditQuotes: boolean;
  canApproveQuotes: boolean;
  canDeleteQuotes: boolean;
  canViewFinancialTotals: boolean;
  canCreateInvoices: boolean;
  canRecordPayments: boolean;
  canDeleteInvoices: boolean;
  canManageClients: boolean;
  canManagePullSheets: boolean;
  canManageCompanySettings: boolean;
  canManageUserRoles: boolean;
}

export interface UserRoleDefinition {
  role: UserRole;
  title: string;
  department: string;
  badgeLabel: string;
  badgeColor: string; // text color
  badgeBg: string; // bg color
  borderColor: string;
  description: string;
  highlightCapabilities: string[];
  permissions: RolePermissions;
}

export const USER_ROLE_DEFINITIONS: Record<UserRole, UserRoleDefinition> = {
  Admin: {
    role: 'Admin',
    title: 'Executive / General Manager',
    department: 'Executive Operations',
    badgeLabel: 'Admin / Owner',
    badgeColor: 'text-amber-400',
    badgeBg: 'bg-amber-400/10',
    borderColor: 'border-amber-400/30',
    description: 'Unrestricted master access across all production systems, financial ledgers, inventory assets, crew payroll, and team security privileges.',
    highlightCapabilities: [
      'Full administrative control over all modules',
      'Manage team user roles, permissions & security',
      'Update company billing terms & legal contracts',
      'Unrestricted financial reports & payment overrides',
      'Delete and archive quotes, invoices & inventory',
    ],
    permissions: {
      canAccessDashboard: true,
      canAccessInventory: true,
      canAccessMaintenance: true,
      canAccessStaff: true,
      canAccessQuotes: true,
      canAccessInvoices: true,
      canAccessClients: true,
      canAccessPullSheets: true,
      canAccessSettings: true,
      canCreateEditInventory: true,
      canDeleteInventory: true,
      canManageMaintenance: true,
      canScheduleCrew: true,
      canViewCrewRates: true,
      canCreateEditQuotes: true,
      canApproveQuotes: true,
      canDeleteQuotes: true,
      canViewFinancialTotals: true,
      canCreateInvoices: true,
      canRecordPayments: true,
      canDeleteInvoices: true,
      canManageClients: true,
      canManagePullSheets: true,
      canManageCompanySettings: true,
      canManageUserRoles: true,
    },
  },

  'Production Manager': {
    role: 'Production Manager',
    title: 'Senior Production Manager',
    department: 'Live Event Operations',
    badgeLabel: 'Production Manager',
    badgeColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-400/10',
    borderColor: 'border-indigo-400/30',
    description: 'Directs client proposals, event manifests, crew dispatch calls, technical stage plots, and warehouse staging operations.',
    highlightCapabilities: [
      'Create and edit client proposals and booked shows',
      'Dispatch crew calls, schedule shifts & labor rates',
      'Approve quotes and generate warehouse pull sheets',
      'Client relationship & technical rider management',
      'View quote financials and labor cost projections',
    ],
    permissions: {
      canAccessDashboard: true,
      canAccessInventory: true,
      canAccessMaintenance: true,
      canAccessStaff: true,
      canAccessQuotes: true,
      canAccessInvoices: true,
      canAccessClients: true,
      canAccessPullSheets: true,
      canAccessSettings: false,
      canCreateEditInventory: true,
      canDeleteInventory: false,
      canManageMaintenance: true,
      canScheduleCrew: true,
      canViewCrewRates: true,
      canCreateEditQuotes: true,
      canApproveQuotes: true,
      canDeleteQuotes: false,
      canViewFinancialTotals: true,
      canCreateInvoices: true,
      canRecordPayments: false,
      canDeleteInvoices: false,
      canManageClients: true,
      canManagePullSheets: true,
      canManageCompanySettings: false,
      canManageUserRoles: false,
    },
  },

  'Warehouse Lead': {
    role: 'Warehouse Lead',
    title: 'Logistics & Warehouse Manager',
    department: 'Fleet & Shop Operations',
    badgeLabel: 'Warehouse Lead',
    badgeColor: 'text-amber-500',
    badgeBg: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Controls gear catalog, barcode QR printing, scan-in/scan-out staging, pull sheets prep, and maintenance overhaul servicing.',
    highlightCapabilities: [
      'Full catalog inventory creation, editing & barcode batching',
      'Warehouse pull sheet fulfillment & equipment staging',
      'Quick check-out and check-in scanner execution',
      'Maintenance ticket logging, servicing & resolution',
      'Track equipment availability across warehouse bays',
    ],
    permissions: {
      canAccessDashboard: true,
      canAccessInventory: true,
      canAccessMaintenance: true,
      canAccessStaff: true,
      canAccessQuotes: true,
      canAccessInvoices: false,
      canAccessClients: false,
      canAccessPullSheets: true,
      canAccessSettings: false,
      canCreateEditInventory: true,
      canDeleteInventory: true,
      canManageMaintenance: true,
      canScheduleCrew: false,
      canViewCrewRates: false,
      canCreateEditQuotes: false,
      canApproveQuotes: false,
      canDeleteQuotes: false,
      canViewFinancialTotals: false,
      canCreateInvoices: false,
      canRecordPayments: false,
      canDeleteInvoices: false,
      canManageClients: false,
      canManagePullSheets: true,
      canManageCompanySettings: false,
      canManageUserRoles: false,
    },
  },

  'Lead Engineer': {
    role: 'Lead Engineer',
    title: 'A1 / V1 / L1 Systems Engineer',
    department: 'Technical Engineering',
    badgeLabel: 'Lead Engineer',
    badgeColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/30',
    description: 'Leads audio, lighting, video, and rigging systems on-site. Oversees technical gear manifests, meeting diagrams, and crew shift calls.',
    highlightCapabilities: [
      'View event technical gear manifests & stage diagrams',
      'Review master schedule and crew dispatch calls',
      'Report damaged or malfunctioning equipment tickets',
      'Quick gear check-out for site deployments',
      'Direct on-site engineering and load-in workflows',
    ],
    permissions: {
      canAccessDashboard: true,
      canAccessInventory: true,
      canAccessMaintenance: true,
      canAccessStaff: true,
      canAccessQuotes: true,
      canAccessInvoices: false,
      canAccessClients: false,
      canAccessPullSheets: true,
      canAccessSettings: false,
      canCreateEditInventory: false,
      canDeleteInventory: false,
      canManageMaintenance: true,
      canScheduleCrew: false,
      canViewCrewRates: false,
      canCreateEditQuotes: false,
      canApproveQuotes: false,
      canDeleteQuotes: false,
      canViewFinancialTotals: false,
      canCreateInvoices: false,
      canRecordPayments: false,
      canDeleteInvoices: false,
      canManageClients: false,
      canManagePullSheets: false,
      canManageCompanySettings: false,
      canManageUserRoles: false,
    },
  },

  Technician: {
    role: 'Technician',
    title: 'Field Technician / Operator',
    department: 'Event Production Crew',
    badgeLabel: 'Technician',
    badgeColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400/30',
    description: 'On-site show operator and stagehand. Views assigned shift calls, venue load-in details, pack lists, and reports equipment maintenance tickets.',
    highlightCapabilities: [
      'View personal shift schedule, call times & venue directions',
      'Submit equipment issue reports & repair maintenance logs',
      'View event equipment pack lists & warehouse staging status',
      'Quick barcode scanning for equipment verification',
      'Focused field-friendly interface with zero billing clutter',
    ],
    permissions: {
      canAccessDashboard: true,
      canAccessInventory: true,
      canAccessMaintenance: true,
      canAccessStaff: true,
      canAccessQuotes: false,
      canAccessInvoices: false,
      canAccessClients: false,
      canAccessPullSheets: true,
      canAccessSettings: false,
      canCreateEditInventory: false,
      canDeleteInventory: false,
      canManageMaintenance: true,
      canScheduleCrew: false,
      canViewCrewRates: false,
      canCreateEditQuotes: false,
      canApproveQuotes: false,
      canDeleteQuotes: false,
      canViewFinancialTotals: false,
      canCreateInvoices: false,
      canRecordPayments: false,
      canDeleteInvoices: false,
      canManageClients: false,
      canManagePullSheets: false,
      canManageCompanySettings: false,
      canManageUserRoles: false,
    },
  },

  'Finance & Billing': {
    role: 'Finance & Billing',
    title: 'Financial Controller / Billing Specialist',
    department: 'Finance & Accounts',
    badgeLabel: 'Finance & Billing',
    badgeColor: 'text-teal-400',
    badgeBg: 'bg-teal-400/10',
    borderColor: 'border-teal-400/30',
    description: 'Manages accounts receivable, client invoices, payment processing, tax exemptions, credit terms, and financial margin analysis.',
    highlightCapabilities: [
      'Generate, issue, and manage commercial client invoices',
      'Record payments (ACH, Wire, Credit Card, Check)',
      'Review financial revenue, labor cost margins & tax breakdowns',
      'Manage client billing terms & tax exemption status',
      'Export financial ledgers & payment transaction histories',
    ],
    permissions: {
      canAccessDashboard: true,
      canAccessInventory: true,
      canAccessMaintenance: false,
      canAccessStaff: true,
      canAccessQuotes: true,
      canAccessInvoices: true,
      canAccessClients: true,
      canAccessPullSheets: false,
      canAccessSettings: false,
      canCreateEditInventory: false,
      canDeleteInventory: false,
      canManageMaintenance: false,
      canScheduleCrew: false,
      canViewCrewRates: true,
      canCreateEditQuotes: true,
      canApproveQuotes: true,
      canDeleteQuotes: false,
      canViewFinancialTotals: true,
      canCreateInvoices: true,
      canRecordPayments: true,
      canDeleteInvoices: true,
      canManageClients: true,
      canManagePullSheets: false,
      canManageCompanySettings: false,
      canManageUserRoles: false,
    },
  },
};
