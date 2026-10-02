import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
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
  Cloud,
  CheckCircle2,
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
    isCloudSynced,
    signInWithGoogle,
    logout,
  } = useApp();

  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
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

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Layers className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" />, badge: activeMaintenanceCount },
    { id: 'staff', label: 'Crew & Shifts', icon: <Users className="w-4 h-4" /> },
    { id: 'quotes', label: 'Quotes', icon: <FileText className="w-4 h-4" />, badge: pendingQuotesCount },
    { id: 'invoices', label: 'Invoices', icon: <DollarSign className="w-4 h-4" />, badge: overdueInvoicesCount },
    { id: 'clients', label: 'Clients CRM', icon: <Contact className="w-4 h-4" /> },
    { id: 'pullsheet', label: 'Pull Sheet', icon: <ClipboardCheck className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
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

          {/* Zone 3: Primary Actions & Auth */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Cloud Sync Status Indicator */}
            {currentUser && (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium">Firestore Synced</span>
              </div>
            )}

            {/* Google Sign-in / User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
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
                  <div className="hidden md:block text-left text-xs leading-tight">
                    <div className="font-semibold text-white truncate max-w-[110px]">
                      {currentUser.displayName}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono">
                      {currentUser.role}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={authLoading || isSigningIn}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap disabled:opacity-50"
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
                <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google'}</span>
              </button>
            )}

            <button
              onClick={onOpenNewQuote}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Quote</span>
            </button>

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
            Connect Google Sign-in to enable real-time cloud data persistence with Firestore across all production devices.
          </span>
          <button
            onClick={handleSignIn}
            className="underline font-bold text-amber-400 hover:text-amber-200 cursor-pointer ml-1"
          >
            Sign in now →
          </button>
        </div>
      )}
    </header>
  );
};

