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

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, activeQuoteForPrint, activeInvoiceForPrint } = useApp();

  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preselectedClient, setPreselectedClient] = useState<Client | null>(null);
  const [shiftDispatchPrefill, setShiftDispatchPrefill] = useState<{
    date?: string;
    eventName?: string;
    openModal?: boolean;
  } | null>(null);

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
