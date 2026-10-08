import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { InventoryManager } from './components/InventoryManager';
import { MaintenanceManager } from './components/MaintenanceManager';
import { StaffScheduler } from './components/StaffScheduler';
import { QuotesManager } from './components/QuotesManager';
import { InvoicesManager } from './components/InvoicesManager';
import { ClientsManager } from './components/ClientsManager';
import { WarehousePullSheet } from './components/WarehousePullSheet';
import { QuotePrintView } from './components/QuotePrintView';
import { InvoicePrintView } from './components/InvoicePrintView';
import { SettingsModal } from './components/SettingsModal';
import { Client } from './types';
import { Shield } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeQuoteForPrint,
    activeInvoiceForPrint,
    userHasPermission,
    activeRole,
    setSimulatedRole,
  } = useApp();

  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preselectedClient, setPreselectedClient] = useState<Client | null>(null);
  const [shiftDispatchPrefill, setShiftDispatchPrefill] = useState<{
    date?: string;
    eventName?: string;
    openModal?: boolean;
  } | null>(null);

  const isTabRestricted =
    (activeTab === 'invoices' && !userHasPermission('canAccessInvoices')) ||
    (activeTab === 'quotes' && !userHasPermission('canAccessQuotes')) ||
    (activeTab === 'clients' && !userHasPermission('canAccessClients')) ||
    (activeTab === 'pullsheet' && !userHasPermission('canAccessPullSheets')) ||
    (activeTab === 'maintenance' && !userHasPermission('canAccessMaintenance'));

  const handleOpenNewQuote = () => {
    setPreselectedClient(null);
    setIsQuoteBuilderOpen(true);
    setActiveTab('quotes');
  };

  const handleOpenQuoteWithClient = (client: Client) => {
    setPreselectedClient(client);
    setIsQuoteBuilderOpen(true);
    setActiveTab('quotes');
  };

  const handleOpenNewShift = (initialDate?: string, eventName?: string) => {
    if (initialDate || eventName) {
      setShiftDispatchPrefill({ date: initialDate, eventName, openModal: true });
    } else {
      setShiftDispatchPrefill({ openModal: true });
    }
    setActiveTab('staff');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Bar Contract Navigation */}
      <Header
        onOpenNewQuote={handleOpenNewQuote}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isTabRestricted ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md mx-auto text-center space-y-4 my-16 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Access Restricted by Role</h2>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                The <span className="font-semibold text-white capitalize">{activeTab}</span> module is restricted for the <span className="text-amber-400 font-mono font-bold">{activeRole}</span> role under least privilege security policies.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Return to Overview
              </button>
              <button
                onClick={() => setSimulatedRole('Admin')}
                className="w-full sm:w-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Switch to Admin View
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                onOpenNewQuote={handleOpenNewQuote}
                onOpenNewShift={handleOpenNewShift}
              />
            )}

            {activeTab === 'inventory' && <InventoryManager />}

            {activeTab === 'maintenance' && <MaintenanceManager />}

            {activeTab === 'staff' && (
              <StaffScheduler
                initialPrefill={shiftDispatchPrefill}
                onClearPrefill={() => setShiftDispatchPrefill(null)}
              />
            )}

            {activeTab === 'quotes' && (
              <QuotesManager
                isCreateModalOpen={isQuoteBuilderOpen}
                setIsCreateModalOpen={setIsQuoteBuilderOpen}
                preselectedClient={preselectedClient}
                onClearPreselectedClient={() => setPreselectedClient(null)}
              />
            )}

            {activeTab === 'invoices' && <InvoicesManager />}

            {activeTab === 'clients' && (
              <ClientsManager onOpenQuoteWithClient={handleOpenQuoteWithClient} />
            )}

            {activeTab === 'pullsheet' && <WarehousePullSheet />}
          </>
        )}
      </main>

      {/* Global Overlays & Modals */}
      {activeQuoteForPrint && <QuotePrintView />}
      {activeInvoiceForPrint && <InvoicePrintView />}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
