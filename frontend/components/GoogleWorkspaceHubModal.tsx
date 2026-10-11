import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  FileSpreadsheet,
  Mail,
  Contact,
  Calendar,
  Sparkles,
  ExternalLink,
  Layers,
  FileText,
  DollarSign,
  Users,
  CheckCircle2,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { GoogleSheetsModal } from './GoogleSheetsModal';
import { GmailComposeModal } from './GmailComposeModal';
import { GoogleContactsModal } from './GoogleContactsModal';
import { GoogleCalendarSyncModal } from './GoogleCalendarSyncModal';

interface GoogleWorkspaceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTool?: 'sheets' | 'gmail' | 'contacts' | 'calendar';
}

export const GoogleWorkspaceHubModal: React.FC<GoogleWorkspaceHubModalProps> = ({
  isOpen,
  onClose,
  initialTool,
}) => {
  const {
    currentUser,
    googleCalendarToken,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  } = useApp();

  const [activeSubModal, setActiveSubModal] = useState<
    'sheets' | 'gmail' | 'contacts' | 'calendar' | null
  >(initialTool || null);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-amber-500 to-emerald-500 flex items-center justify-center font-bold text-white shadow-sm">
              <Sparkles className="w-5 h-5 text-neutral-950 fill-neutral-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Google Workspace Operations Hub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-amber-300 border border-neutral-700">
                  Sheets · Gmail · Contacts · Calendar
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Connected Google tools to automate AV rental proposals, fleet inventories, crew dispatching, and CRM billing.
              </p>
            </div>
          </div>

          {/* Connection Status Card */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${
                  googleCalendarToken ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-white">
                  {googleCalendarToken ? 'Google Workspace Authenticated' : 'Google Account Not Connected'}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {googleCalendarToken
                    ? `Active for ${currentUser?.email || 'Current User'} (All Scopes Approved)`
                    : 'Sign in to access your Google Sheets, Gmail, Contacts, and Calendar'}
                </div>
              </div>
            </div>

            {googleCalendarToken ? (
              <button
                onClick={disconnectGoogleCalendar}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={connectGoogleCalendar}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Connect Google Workspace</span>
              </button>
            )}
          </div>

          {/* 4 Feature Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* 1. Google Sheets */}
            <div
              onClick={() => setActiveSubModal('sheets')}
              className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-900/60 transition-all cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Google Sheets Export & Sync
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Export live AV quotes, equipment inventory manifests, labor call sheets, and invoice ledgers directly to new or existing Google Spreadsheets.
                </p>
              </div>
            </div>

            {/* 2. Gmail Dispatcher */}
            <div
              onClick={() => setActiveSubModal('gmail')}
              className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-red-500/50 hover:bg-neutral-900/60 transition-all cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-red-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                  Gmail Dispatch & Client Comms
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Send formatted client proposals, commercial invoice payment requests, and technician shift call sheets directly via Gmail with user review.
                </p>
              </div>
            </div>

            {/* 3. Google Contacts (People API) */}
            <div
              onClick={() => setActiveSubModal('contacts')}
              className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-blue-500/50 hover:bg-neutral-900/60 transition-all cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Contact className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                  Google Contacts Directory
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Import clients and crew members from your Google Contacts address book, or export In The Wind AV contacts to Google.
                </p>
              </div>
            </div>

            {/* 4. Google Calendar */}
            <div
              onClick={() => setActiveSubModal('calendar')}
              className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-900/60 transition-all cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-purple-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  Google Calendar Timeline
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Synchronize production dates, venue load-ins, show start/end times, strikes, and individual crew call shifts directly to Google Calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Modals */}
      {activeSubModal === 'sheets' && (
        <GoogleSheetsModal isOpen={true} onClose={() => setActiveSubModal(null)} />
      )}
      {activeSubModal === 'gmail' && (
        <GmailComposeModal isOpen={true} onClose={() => setActiveSubModal(null)} />
      )}
      {activeSubModal === 'contacts' && (
        <GoogleContactsModal isOpen={true} onClose={() => setActiveSubModal(null)} />
      )}
      {activeSubModal === 'calendar' && (
        <GoogleCalendarSyncModal isOpen={true} onClose={() => setActiveSubModal(null)} />
      )}
    </>
  );
};
