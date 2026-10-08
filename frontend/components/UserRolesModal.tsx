import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Users,
  Grid3X3,
  Check,
  X,
  AlertTriangle,
  UserPlus,
  Crown,
  Wrench,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Sliders,
  Sparkles,
  Phone,
  Mail,
  Building,
  RotateCcw,
} from 'lucide-react';
import { UserRole, USER_ROLE_DEFINITIONS, RolePermissions } from '../types/roles';
import { AppUser } from '../types';

interface UserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserRolesModal: React.FC<UserRolesModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    activeRole,
    simulatedRole,
    setSimulatedRole,
    teamUsers,
    updateUserRole,
    addTeamUser,
    userHasPermission,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'roster' | 'matrix' | 'simulator'>('roster');
  const [roleChangeSuccess, setRoleChangeSuccess] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');

  // New member form
  const [newMemberForm, setNewMemberForm] = useState<{
    displayName: string;
    email: string;
    role: UserRole;
    department: string;
    phone: string;
  }>({
    displayName: '',
    email: '',
    role: 'Technician',
    department: 'Event Production Crew',
    phone: '',
  });

  if (!isOpen) return null;

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      setRoleChangeSuccess(`User role updated to ${newRole}`);
      setTimeout(() => setRoleChangeSuccess(null), 2500);
    } catch (err: any) {
      console.error('Failed to change user role:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.email || !newMemberForm.displayName) return;

    await addTeamUser({
      email: newMemberForm.email,
      displayName: newMemberForm.displayName,
      photoURL: '',
      role: newMemberForm.role,
      department: newMemberForm.department,
      phone: newMemberForm.phone,
      status: 'Active',
      createdAt: new Date().toISOString(),
    });

    setRoleChangeSuccess(`Team member ${newMemberForm.displayName} added as ${newMemberForm.role}`);
    setIsInviteOpen(false);
    setNewMemberForm({
      displayName: '',
      email: '',
      role: 'Technician',
      department: 'Event Production Crew',
      phone: '',
    });
    setTimeout(() => setRoleChangeSuccess(null), 2500);
  };

  const rolesList: UserRole[] = [
    'Admin',
    'Production Manager',
    'Warehouse Lead',
    'Lead Engineer',
    'Technician',
    'Finance & Billing',
  ];

  const filteredUsers = teamUsers.filter((u) => {
    const matchesSearch =
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const permissionMatrixRows: {
    category: string;
    key: keyof RolePermissions;
    label: string;
    description: string;
  }[] = [
    {
      category: 'Inventory & Fleet',
      key: 'canCreateEditInventory',
      label: 'Add & Edit Equipment Catalog',
      description: 'Create new SKUs, update day rates, and modify fleet specs',
    },
    {
      category: 'Inventory & Fleet',
      key: 'canDeleteInventory',
      label: 'Decommission & Delete Gear',
      description: 'Remove gear from rental catalog permanently',
    },
    {
      category: 'Inventory & Fleet',
      key: 'canManagePullSheets',
      label: 'Fulfill Pull Sheets & Staging',
      description: 'Scan barcodes and stage gear bays for upcoming shows',
    },
    {
      category: 'Maintenance',
      key: 'canManageMaintenance',
      label: 'Log & Resolve Maintenance Tickets',
      description: 'File equipment repair logs and sign off on inspections',
    },
    {
      category: 'Crew & Scheduling',
      key: 'canScheduleCrew',
      label: 'Dispatch Crew & Labor Calls',
      description: 'Assign technicians to event shifts and modify call times',
    },
    {
      category: 'Crew & Scheduling',
      key: 'canViewCrewRates',
      label: 'View Crew Pay Rates & Overtime',
      description: 'Inspect hourly/day rates and calculate labor expenses',
    },
    {
      category: 'Proposals & Quotes',
      key: 'canCreateEditQuotes',
      label: 'Build & Edit Production Quotes',
      description: 'Generate client quotes, add line items, and adjust discounts',
    },
    {
      category: 'Proposals & Quotes',
      key: 'canApproveQuotes',
      label: 'Approve & Lock Show Contracts',
      description: 'Authorize client accepted bookings and release hold gear',
    },
    {
      category: 'Invoicing & Payments',
      key: 'canCreateInvoices',
      label: 'Generate Client Invoices',
      description: 'Convert quotes into formal commercial invoices',
    },
    {
      category: 'Invoicing & Payments',
      key: 'canRecordPayments',
      label: 'Record Payments & Settle Balances',
      description: 'Log ACH, Wire, Check, and Credit Card settlements',
    },
    {
      category: 'Invoicing & Payments',
      key: 'canDeleteInvoices',
      label: 'Void & Delete Invoices',
      description: 'Administrative ledger cancellation and record deletion',
    },
    {
      category: 'Clients & CRM',
      key: 'canManageClients',
      label: 'Manage Client Accounts & Terms',
      description: 'Edit credit terms, tax exemption status, and contact cards',
    },
    {
      category: 'System & Security',
      key: 'canManageUserRoles',
      label: 'Manage Team Roles & RBAC',
      description: 'Assign user permissions and invite staff members',
    },
    {
      category: 'System & Security',
      key: 'canManageCompanySettings',
      label: 'Company Terms & Defaults',
      description: 'Modify legal contracts, tax percentages, and company profile',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">User Roles & Access Control (RBAC)</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  Active: {activeRole}
                </span>
                {simulatedRole && (
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                    Simulating {simulatedRole}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Manage organizational roles, assign team permissions, and test role-based access boundaries.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Roster ({teamUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Permissions Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-purple-900/40 text-purple-300 border border-purple-700/60'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Role Simulator / RBAC Test</span>
            </button>
          </div>

          {activeTab === 'roster' && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>

        {/* Success Banner */}
        {roleChangeSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{roleChangeSuccess}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: TEAM ROSTER */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <input
                  type="text"
                  placeholder="Search crew members, emails, departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                  <span className="text-[11px] text-neutral-400 whitespace-nowrap">Filter Role:</span>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="All">All Roles</option>
                    {rolesList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster Cards / Table */}
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const roleDef = USER_ROLE_DEFINITIONS[user.role] || USER_ROLE_DEFINITIONS.Technician;
                  const isCurrent = currentUser?.uid === user.uid;

                  return (
                    <div
                      key={user.uid}
                      className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-neutral-700 transition-all"
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'Member'}
                            className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-800 text-amber-400 font-bold text-sm flex items-center justify-center border border-neutral-700 shrink-0">
                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">
                              {user.displayName || 'Crew Member'}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                You
                              </span>
                            )}
                            <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </div>

                          <div className="text-[11px] text-neutral-400 flex items-center gap-3 truncate mt-0.5">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                              {user.email}
                            </span>
                            {user.department && (
                              <span className="hidden md:flex items-center gap-1 text-neutral-500">
                                <Building className="w-3 h-3 shrink-0" />
                                {user.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Role Selector */}
                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-neutral-500 font-mono">Assigned Role</div>
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                            className={`mt-0.5 px-3 py-1 rounded-lg text-xs font-semibold border ${roleDef.badgeBg} ${roleDef.badgeColor} ${roleDef.borderColor} bg-neutral-900 focus:outline-none cursor-pointer`}
                          >
                            {rolesList.map((r) => (
                              <option key={r} value={r} className="bg-neutral-900 text-white">
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PERMISSIONS MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
                <span className="text-amber-400 font-semibold">Role-Based Access Control Architecture:</span> Each role enforces least privilege principles to protect confidential client billing terms, financial balance records, and master system settings.
              </div>

              <div className="overflow-x-auto border border-neutral-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-950 border-b border-neutral-800">
                      <th className="p-3 text-neutral-400 font-semibold min-w-[200px]">Capability / Action</th>
                      {rolesList.map((r) => {
                        const def = USER_ROLE_DEFINITIONS[r];
                        return (
                          <th key={r} className="p-3 text-center min-w-[110px]">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${def.badgeBg} ${def.badgeColor} border ${def.borderColor}`}>
                              {r}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/50">
                    {permissionMatrixRows.map((row) => (
                      <tr key={row.key} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-white">{row.label}</div>
                          <div className="text-[10px] text-neutral-500">{row.description}</div>
                        </td>
                        {rolesList.map((r) => {
                          const has = USER_ROLE_DEFINITIONS[r].permissions[row.key];
                          return (
                            <td key={r} className="p-3 text-center">
                              {has ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-500/60 border border-rose-500/10">
                                  <X className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ROLE SIMULATOR (RBAC TEST) */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-neutral-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Interactive Role Simulator (Live RBAC Testing)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Click any role card below to instantly simulate experiencing the application from that crew member&apos;s perspective. Notice how restricted tabs (such as client Invoices or Company Settings) dynamically lock and protect sensitive financial figures.
                </p>

                {simulatedRole && (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-amber-300 font-mono text-[11px]">
                      Currently Simulating: <strong>{simulatedRole}</strong>
                    </span>
                    <button
                      onClick={() => setSimulatedRole(null)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg border border-neutral-700 transition-colors cursor-pointer text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reset to My Role ({currentUser?.role || 'Admin'})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Role Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rolesList.map((r) => {
                  const def = USER_ROLE_DEFINITIONS[r];
                  const isActive = activeRole === r;

                  return (
                    <div
                      key={r}
                      onClick={() => setSimulatedRole(r)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        isActive
                          ? 'bg-neutral-900 border-amber-400/60 shadow-lg ring-1 ring-amber-400/40'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${def.badgeBg} ${def.badgeColor} border ${def.borderColor}`}>
                            {def.badgeLabel}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-400 text-neutral-950">
                              ACTIVE NOW
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-500 font-mono">{def.department}</span>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed">{def.description}</p>

                      <div className="space-y-1 pt-1 border-t border-neutral-800/80">
                        <div className="text-[10px] font-mono text-neutral-400 font-semibold uppercase tracking-wider">
                          Key Capabilities:
                        </div>
                        <ul className="text-[11px] text-neutral-400 space-y-0.5">
                          {def.highlightCapabilities.slice(0, 3).map((cap, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                              <span className="truncate">{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 text-right">
                        <button
                          type="button"
                          className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-amber-400 text-neutral-950 font-bold'
                              : 'bg-neutral-800 text-neutral-300 hover:text-white'
                          }`}
                        >
                          {isActive ? 'Current View' : `Simulate ${r}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add Member Form Modal */}
        {isInviteOpen && (
          <div className="fixed inset-0 z-60 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  Add Team Crew Member
                </h3>
                <button onClick={() => setIsInviteOpen(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Hayes"
                    value={newMemberForm.displayName}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, displayName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jordan.hayes@inthewindav.com"
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 mb-1">Assigned Role</label>
                    <select
                      value={newMemberForm.role}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as UserRole })}
                      className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                    >
                      {rolesList.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Live Events"
                      value={newMemberForm.department}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, department: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. (415) 555-0192"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-3 py-1.5 text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs shrink-0">
          <div className="text-neutral-400 text-[11px]">
            Security Rule Model: Attribute-Based Access Control (ABAC) with Firestore Enforcement.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
