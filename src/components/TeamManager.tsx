import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Users,
  UserPlus,
  UserCheck,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building,
  Crown,
  KeyRound,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { UserRole, USER_ROLE_DEFINITIONS, RolePermissions } from '../types/roles';
import { AppUser } from '../types';

export const TeamManager: React.FC = () => {
  const {
    currentUser,
    activeRole,
    teamUsers,
    addTeamUser,
    updateTeamUser,
    updateUserRole,
    deleteTeamUser,
    switchActiveUser,
    userHasPermission,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'roster' | 'matrix'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AppUser | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState<{
    displayName: string;
    email: string;
    role: UserRole;
    department: string;
    phone: string;
    status: 'Active' | 'Invited' | 'Suspended';
  }>({
    displayName: '',
    email: '',
    role: 'Technician',
    department: 'Event Production Crew',
    phone: '',
    status: 'Active',
  });

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const rolesList: UserRole[] = [
    'Admin',
    'Production Manager',
    'Warehouse Lead',
    'Lead Engineer',
    'Technician',
    'Finance & Billing',
  ];

  const departmentDefaults: Record<UserRole, string> = {
    Admin: 'Executive Operations',
    'Production Manager': 'Live Event Operations',
    'Warehouse Lead': 'Fleet & Shop Operations',
    'Lead Engineer': 'Technical Engineering',
    Technician: 'Event Production Crew',
    'Finance & Billing': 'Finance & Accounts',
  };

  // Filter users
  const filteredUsers = teamUsers.filter((u) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (u.displayName || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.department || '').toLowerCase().includes(query) ||
      (u.phone || '').toLowerCase().includes(query);
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || (u.status || 'Active') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.displayName.trim() || !createForm.email.trim()) {
      showNotification('Name and Email are required.', 'error');
      return;
    }

    try {
      await addTeamUser({
        displayName: createForm.displayName.trim(),
        email: createForm.email.trim().toLowerCase(),
        role: createForm.role,
        department: createForm.department || departmentDefaults[createForm.role],
        phone: createForm.phone.trim(),
        status: createForm.status,
        photoURL: '',
        createdAt: new Date().toISOString(),
      });

      showNotification(`Account created for ${createForm.displayName} (${createForm.role})`);
      setIsCreateModalOpen(false);
      setCreateForm({
        displayName: '',
        email: '',
        role: 'Technician',
        department: 'Event Production Crew',
        phone: '',
        status: 'Active',
      });
    } catch (err: any) {
      console.error('Create user error:', err);
      showNotification('Failed to create account in database.', 'error');
    }
  };

  // Handle Update User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await updateTeamUser(editingUser.uid, {
        displayName: editingUser.displayName,
        email: editingUser.email,
        role: editingUser.role,
        department: editingUser.department,
        phone: editingUser.phone,
        status: editingUser.status,
      });

      showNotification(`Updated profile for ${editingUser.displayName}`);
      setEditingUser(null);
    } catch (err: any) {
      console.error('Update user error:', err);
      showNotification('Failed to update account.', 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    try {
      await deleteTeamUser(deleteConfirmUser.uid);
      showNotification(`Removed account for ${deleteConfirmUser.displayName || deleteConfirmUser.email}`);
      setDeleteConfirmUser(null);
    } catch (err: any) {
      console.error('Delete user error:', err);
      showNotification('Failed to delete account.', 'error');
    }
  };

  // Handle Switch User (Login As)
  const handleSwitchUser = (user: AppUser) => {
    switchActiveUser(user);
    showNotification(`Switched active user to ${user.displayName || user.email} (${user.role})`, 'info');
  };

  // Permissions Matrix Rows
  const permissionCategories: {
    category: string;
    permissions: { key: keyof RolePermissions; label: string; description: string }[];
  }[] = [
    {
      category: 'Fleet & Inventory Catalog',
      permissions: [
        { key: 'canAccessInventory', label: 'Access Inventory Module', description: 'View rental gear listings and specs' },
        { key: 'canCreateEditInventory', label: 'Create & Edit Gear Catalog', description: 'Add items, edit day rates, specs' },
        { key: 'canDeleteInventory', label: 'Decommission / Delete Gear', description: 'Permanently remove gear from fleet' },
        { key: 'canManagePullSheets', label: 'Fulfill Warehouse Pull Sheets', description: 'Barcode staging & show prep' },
      ],
    },
    {
      category: 'Maintenance & Service',
      permissions: [
        { key: 'canAccessMaintenance', label: 'Access Maintenance Module', description: 'View service history and active repairs' },
        { key: 'canManageMaintenance', label: 'Create & Sign-off Tickets', description: 'Log repairs, enter vendor costs & sign-offs' },
      ],
    },
    {
      category: 'Crew Scheduling & Labor',
      permissions: [
        { key: 'canAccessStaff', label: 'Access Crew Roster & Shifts', description: 'View tech calendar and calls' },
        { key: 'canScheduleCrew', label: 'Dispatch Calls & Shifts', description: 'Assign shifts, dates, hours, and call types' },
        { key: 'canViewCrewRates', label: 'View Labor Rates & Payroll', description: 'Inspect crew day/hourly billable rates' },
      ],
    },
    {
      category: 'Commercial Quotes & Proposals',
      permissions: [
        { key: 'canAccessQuotes', label: 'Access Quotes Module', description: 'View quote repository & client events' },
        { key: 'canCreateEditQuotes', label: 'Build Quotes & Technical Riders', description: 'Configure packages, lines, discounts' },
        { key: 'canApproveQuotes', label: 'Approve & Confirm Quotes', description: 'Change status to Confirmed / Booked' },
        { key: 'canDeleteQuotes', label: 'Archive & Delete Quotes', description: 'Permanent quote removal' },
      ],
    },
    {
      category: 'Invoicing & Ledgers',
      permissions: [
        { key: 'canAccessInvoices', label: 'Access Invoices Module', description: 'View commercial billing ledgers' },
        { key: 'canCreateInvoices', label: 'Generate Commercial Invoices', description: 'Draft invoices from approved quotes' },
        { key: 'canRecordPayments', label: 'Post Payments & Credits', description: 'Apply ACH, Wire, Check or Card receipts' },
        { key: 'canDeleteInvoices', label: 'Delete & Void Invoices', description: 'Void or remove invoice records' },
        { key: 'canViewFinancialTotals', label: 'Financial Margins & Totals', description: 'View total revenue, costs, and profit' },
      ],
    },
    {
      category: 'Security & System Administration',
      permissions: [
        { key: 'canManageUserRoles', label: 'Manage Team Accounts & Roles', description: 'Create users, modify RBAC roles' },
        { key: 'canManageCompanySettings', label: 'Manage Company Legal & Tax', description: 'Edit contracts, tax rates, waivers' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Team Accounts & Role Access (RBAC)</h1>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl">
            Create and manage multi-user accounts across 6 operational tiers. All accounts synchronize directly with the live Firestore database.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Tab Pill Switcher */}
          <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Accounts Roster ({teamUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Permissions Matrix</span>
            </button>
          </div>

          {/* Create User Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User Account</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : notification.type === 'info'
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {notification.type === 'info' && <Sparkles className="w-4 h-4" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Total Registered Accounts</div>
          <div className="text-2xl font-bold text-white">{teamUsers.length}</div>
          <div className="text-[10px] text-neutral-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Live in Firestore DB</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Active Operations Roles</div>
          <div className="text-2xl font-bold text-amber-400">{rolesList.length}</div>
          <div className="text-[10px] text-neutral-500">Tiered ABAC policies</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Current Session Identity</div>
          <div className="text-sm font-bold text-white truncate">{currentUser?.displayName || 'Admin User'}</div>
          <div className="text-[10px] font-mono text-amber-300 truncate">{activeRole}</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Account Security Tier</div>
          <div className="text-sm font-bold text-emerald-400">Least-Privilege Enforcement</div>
          <div className="text-[10px] text-neutral-500">Server-validated ABAC</div>
        </div>
      </div>

      {activeTab === 'roster' ? (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user accounts by name, email, department, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Role:</span>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="All">All Roles</option>
                {rolesList.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Invited">Invited</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const roleDef = USER_ROLE_DEFINITIONS[user.role] || USER_ROLE_DEFINITIONS.Technician;
              const isCurrentSessionUser = currentUser?.uid === user.uid;

              return (
                <div
                  key={user.uid}
                  className={`bg-neutral-900 border rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all hover:border-neutral-700 shadow-sm ${
                    isCurrentSessionUser ? 'border-amber-400/60 ring-1 ring-amber-400/30' : 'border-neutral-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Top: Avatar, Name, Email, Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${roleDef.badgeBg} ${roleDef.badgeColor} border ${roleDef.borderColor}`}>
                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-white truncate max-w-[160px]">
                              {user.displayName || 'Unnamed User'}
                            </h3>
                            {isCurrentSessionUser && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-400 truncate max-w-[180px]">
                            {user.email || 'No email registered'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          (user.status || 'Active') === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : (user.status || 'Active') === 'Invited'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {user.status || 'Active'}
                      </span>
                    </div>

                    {/* Role & Department */}
                    <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">Operational Role</span>
                        <div className="flex items-center gap-1">
                          <select
                            value={user.role}
                            onChange={(e) => {
                              const newRole = e.target.value as UserRole;
                              updateUserRole(user.uid, newRole);
                              showNotification(`Updated ${user.displayName}'s role to ${newRole}`);
                            }}
                            className={`text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${roleDef.badgeBg} ${roleDef.badgeColor} ${roleDef.borderColor}`}
                          >
                            {rolesList.map((r) => (
                              <option key={r} value={r} className="bg-neutral-900 text-white">
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-neutral-800/60">
                        <div className="flex items-center gap-1.5 text-neutral-400 truncate">
                          <Building className="w-3 h-3 shrink-0 text-neutral-500" />
                          <span className="truncate">{user.department || 'Production'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-400 truncate">
                          <Phone className="w-3 h-3 shrink-0 text-neutral-500" />
                          <span className="truncate">{user.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Capabilities Snippet */}
                    <p className="text-[11px] text-neutral-400 line-clamp-2 italic">
                      {roleDef.description}
                    </p>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSwitchUser(user)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isCurrentSessionUser
                          ? 'bg-neutral-800 text-neutral-400 cursor-default'
                          : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      }`}
                      title="Experience the app interface, views and permissions as this user"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isCurrentSessionUser ? 'Active User' : 'Log In As User'}</span>
                    </button>

                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Account Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmUser(user)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete User Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
              <Users className="w-8 h-8 text-neutral-600 mx-auto" />
              <div className="text-sm font-semibold text-white">No user accounts match your filter criteria</div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Try searching for another term, clearing the role filter, or creating a new user account.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('All');
                  setStatusFilter('All');
                }}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </>
      ) : (
        /* Permissions Matrix View */
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white">Role-Based Access Control (RBAC) Permissions Matrix</h2>
              <p className="text-xs text-neutral-400">
                Detailed comparison of granular security capabilities enforced for each role tier.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/80">
                  <th className="py-3 px-4 font-semibold text-neutral-300 w-1/3">System Capability / Permission</th>
                  {rolesList.map((r) => {
                    const def = USER_ROLE_DEFINITIONS[r];
                    return (
                      <th key={r} className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${def.badgeBg} ${def.badgeColor}`}>
                          {def.badgeLabel}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {permissionCategories.map((cat) => (
                  <React.Fragment key={cat.category}>
                    <tr className="bg-neutral-950/40">
                      <td colSpan={rolesList.length + 1} className="py-2 px-4 font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                        {cat.category}
                      </td>
                    </tr>
                    {cat.permissions.map((perm) => (
                      <tr key={perm.key} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-white">{perm.label}</div>
                          <div className="text-[11px] text-neutral-500">{perm.description}</div>
                        </td>
                        {rolesList.map((r) => {
                          const has = USER_ROLE_DEFINITIONS[r].permissions[perm.key];
                          return (
                            <td key={r} className="py-2.5 px-3 text-center">
                              {has ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <Check className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-800/60 text-neutral-600">
                                  <X className="w-3 h-3" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Create User Account Modal */}
      {/* ---------------------------------------------------------------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Create Multi-User Account</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Hayes"
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="jordan.hayes@inthewindav.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="(415) 555-0199"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Operational Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setCreateForm({
                        ...createForm,
                        role: newRole,
                        department: departmentDefaults[newRole] || createForm.department,
                      });
                    }}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Account Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Invited">Invited</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 mb-1 font-medium">Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Selected Role Summary Preview */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                <div className="text-[10px] font-mono uppercase text-amber-400 font-semibold">
                  Permissions Tier: {createForm.role}
                </div>
                <p className="text-[11px] text-neutral-400">
                  {USER_ROLE_DEFINITIONS[createForm.role]?.description}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Create & Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Edit User Account Modal */}
      {/* ---------------------------------------------------------------------- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Edit User Account</h2>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.displayName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Phone</label>
                  <input
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Operational Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Account Status</label>
                  <select
                    value={editingUser.status || 'Active'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Invited">Invited</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 mb-1 font-medium">Department</label>
                  <input
                    type="text"
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Delete User Confirmation Modal */}
      {/* ---------------------------------------------------------------------- */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete User Account?</h3>
                <p className="text-xs text-neutral-400">
                  This will remove the user account document from the Firestore database.
                </p>
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-1">
              <div className="font-bold text-white">{deleteConfirmUser.displayName || 'Unnamed User'}</div>
              <div className="font-mono text-neutral-400">{deleteConfirmUser.email}</div>
              <div className="text-[11px] text-amber-400">{deleteConfirmUser.role}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs shadow-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
