import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import { AuthModal } from './AuthModal';
import { GoogleCalendarSyncModal } from './GoogleCalendarSyncModal';
import { GoogleWorkspaceHubModal } from './GoogleWorkspaceHubModal';
import { GoogleSheetsModal } from './GoogleSheetsModal';
import { GmailComposeModal } from './GmailComposeModal';
import { GoogleContactsModal } from './GoogleContactsModal';
import { UserRolesModal } from './UserRolesModal';
import { USER_ROLE_DEFINITIONS, UserRole } from '../types/roles';
import {
  Layers,
  Wrench,
  Users,
  FileText,
  DollarSign,
  Contact,
  ClipboardCheck,
  Settings,
  Plus,
  LogOut,
  Calendar,
  Shield,
  Crown,
  ChevronDown,
  RotateCcw,
  Sparkles,
  KeyRound,
  Cloud,
  FileSpreadsheet,
  Mail,
} from 'lucide-react';

interface HeaderProps {
  onOpenNewQuote: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewQuote, onOpenSettings }) => {
  const {
    activeTab,
    setActiveTab,
    quotes,
    invoices,
    maintenanceRecords,
    currentUser,
    authLoading,
    signInWithGoogle,
    logout,
    activeRole,
    simulatedRole,
    setSimulatedRole,
    googleCalendarToken,
    userHasPermission,
    teamUsers,
  } = useApp();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isWorkspaceHubOpen, setIsWorkspaceHubOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.warn('Google sign in error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const pendingQuotesCount = quotes.filter((q) => q.status === 'Sent' || q.status === 'Draft').length;
  const overdueInvoicesCount = invoices.filter((i) => i.paymentStatus === 'overdue').length;
  const activeMaintenanceCount = maintenanceRecords.filter((m) => m.status === 'In Progress').length;

  const currentRoleDef = USER_ROLE_DEFINITIONS[activeRole] || USER_ROLE_DEFINITIONS.Admin;

  const rolesList: UserRole[] = [
    'Admin',
    'Production Manager',
    'Warehouse Lead',
    'Lead Engineer',
    'Technician',
    'Finance & Billing',
  ];

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Layers className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" />, badge: activeMaintenanceCount },
    { id: 'staff', label: 'Crew & Shifts', icon: <Users className="w-4 h-4" /> },
    { id: 'quotes', label: 'Quotes', icon: <FileText className="w-4 h-4" />, badge: pendingQuotesCount },
    { id: 'invoices', label: 'Invoices', icon: <DollarSign className="w-4 h-4" />, badge: overdueInvoicesCount },
    { id: 'clients', label: 'Clients CRM', icon: <Contact className="w-4 h-4" /> },
    { id: 'pullsheet', label: 'Pull Sheet', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'team', label: 'Team Accounts', icon: <Shield className="w-4 h-4" />, badge: teamUsers.length },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center font-bold text-neutral-950 text-sm shadow-sm group-hover:scale-105 transition-transform">
                ITW
              </div>
              <span className="text-base font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap">
                In The Wind AV
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-neutral-800 text-amber-400 shadow-xs border border-neutral-700/60'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                  }`}
                >
                  {item.label}
                  {item.badge && item.badge > 0 ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions, Google Calendar & Role RBAC Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Google Workspace Hub Button (Sheets, Gmail, Contacts, Calendar) */}
            <button
              onClick={() => setIsWorkspaceHubOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-xs ${
                googleCalendarToken
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
              }`}
              title="Google Workspace Hub: Google Sheets, Gmail, Contacts, and Calendar"
            >
              <Sparkles className={`w-3.5 h-3.5 ${googleCalendarToken ? 'text-amber-400' : 'text-neutral-400'}`} />
              <span className="hidden md:inline">Google Workspace</span>
              {googleCalendarToken ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="hidden sm:inline text-[10px] font-mono text-neutral-400">Connect</span>
              )}
            </button>

            {/* Quick Sheets Direct Button */}
            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="hidden lg:flex items-center gap-1 px-2 py-1.5 text-xs text-neutral-300 hover:text-emerald-300 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Google Sheets: Export & Sync Spreadsheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sheets</span>
            </button>

            {/* Quick Gmail Direct Button */}
            <button
              onClick={() => setIsGmailModalOpen(true)}
              className="hidden lg:flex items-center gap-1 px-2 py-1.5 text-xs text-neutral-300 hover:text-red-300 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Gmail: Dispatch Quotes, Invoices & Crew Calls"
            >
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>Gmail</span>
            </button>

            {/* Quick Contacts Direct Button */}
            <button
              onClick={() => setIsContactsModalOpen(true)}
              className="hidden lg:flex items-center gap-1 px-2 py-1.5 text-xs text-neutral-300 hover:text-blue-300 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Google Contacts: People API Address Book"
            >
              <Contact className="w-3.5 h-3.5 text-blue-400" />
              <span>Contacts</span>
            </button>

            {/* Role Badge & RBAC Simulator Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${currentRoleDef.badgeBg} ${currentRoleDef.badgeColor} ${currentRoleDef.borderColor} hover:brightness-110 shadow-xs`}
                title="Click to switch role or inspect permissions"
              >
                {activeRole === 'Admin' ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="font-bold whitespace-nowrap">{currentRoleDef.badgeLabel}</span>
                {simulatedRole && (
                  <span className="hidden sm:inline text-[9px] font-mono px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    TEST
                  </span>
                )}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* Role Dropdown Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-2xl z-50 space-y-3">
                  <div className="border-b border-neutral-800 pb-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      Current User & Role
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5 truncate">
                      {currentUser?.displayName || 'Chris Vance (Admin)'}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {currentUser?.email || 'chris@inthewindav.com'}
                    </div>
                  </div>

                  {/* Simulator Quick Switcher */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400 font-semibold">
                      <span>Simulate View As Role:</span>
                      {simulatedRole && (
                        <button
                          onClick={() => setSimulatedRole(null)}
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {rolesList.map((r) => {
                        const def = USER_ROLE_DEFINITIONS[r];
                        const isSelected = activeRole === r;

                        return (
                          <button
                            key={r}
                            onClick={() => {
                              setSimulatedRole(r);
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-medium border transition-all cursor-pointer truncate ${
                              isSelected
                                ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400'
                                : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                            }`}
                          >
                            <span className="truncate block">{def.badgeLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manage Roles Modal Trigger */}
                  <div className="pt-2 border-t border-neutral-800">
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        setIsRolesModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>Manage Team Roles & RBAC</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Auth buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-neutral-800">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-neutral-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-400/40">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                  title="Sign In with Email & Password or Create Account"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={authLoading || isSigningIn}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap disabled:opacity-50"
                  title="Fast Google Sign In"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            )}

            {/* New Quote button */}
            {userHasPermission('canCreateEditQuotes') && (
              <button
                onClick={onOpenNewQuote}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Quote</span>
              </button>
            )}

            {/* Company Settings */}
            <button
              onClick={onOpenSettings}
              title="Company Settings"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-neutral-800/80 -mx-4 px-4 scrollbar-none">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                activeTab === item.id
                  ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.label}
              {item.badge && item.badge > 0 ? (
                <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Cloud Persistence Notice Bar when Not Logged In */}
      {!currentUser && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-t border-amber-500/20 px-4 py-1.5 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
          <Cloud className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Connect Firebase Auth to enable real-time cloud data persistence with Firestore and Storage across all production devices.
          </span>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="underline font-bold text-amber-400 hover:text-amber-200 cursor-pointer ml-1"
          >
            Sign in or Register →
          </button>
        </div>
      )}

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <GoogleCalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
      <GoogleWorkspaceHubModal
        isOpen={isWorkspaceHubOpen}
        onClose={() => setIsWorkspaceHubOpen(false)}
      />
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
      <GmailComposeModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
      />
      <GoogleContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
      />
      <UserRolesModal isOpen={isRolesModalOpen} onClose={() => setIsRolesModalOpen(false)} />
    </header>
  );
};
