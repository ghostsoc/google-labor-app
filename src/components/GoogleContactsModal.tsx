import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Contact,
  Search,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Users,
  Briefcase,
  Phone,
  Mail,
  Building,
  Upload,
  UserCheck,
} from 'lucide-react';
import {
  fetchGoogleContacts,
  exportClientToGoogleContacts,
  exportStaffToGoogleContacts,
  GooglePersonContact,
} from '../services/contactsService';

interface GoogleContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'import' | 'export';
}

export const GoogleContactsModal: React.FC<GoogleContactsModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'import',
}) => {
  const {
    clients,
    addClient,
    staff,
    addStaffMember,
    googleCalendarToken,
    connectGoogleCalendar,
  } = useApp();

  const [mode, setMode] = useState<'import' | 'export'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [googleContacts, setGoogleContacts] = useState<GooglePersonContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Export selection state
  const [exportTargetType, setExportTargetType] = useState<'clients' | 'staff'>('clients');
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccessMsg(null);
      return;
    }
    if (googleCalendarToken && mode === 'import' && googleContacts.length === 0) {
      loadContacts();
    }
  }, [isOpen, googleCalendarToken, mode]);

  const loadContacts = async () => {
    if (!googleCalendarToken) return;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchGoogleContacts(googleCalendarToken);
      setGoogleContacts(results);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch contacts from Google People API.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setError(null);
    try {
      const token = await connectGoogleCalendar();
      if (token) {
        setLoading(true);
        const results = await fetchGoogleContacts(token);
        setGoogleContacts(results);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google');
      setLoading(false);
    }
  };

  const handleImportAsClient = (c: GooglePersonContact) => {
    try {
      addClient({
        name: c.displayName,
        company: c.company || 'Production Client',
        email: c.email || `${c.displayName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
        phone: c.phone || 'N/A',
        address: c.address || '',
        billingTerms: 'Net 30',
        taxExempt: false,
        preferences: '',
        notes: `Imported from Google Contacts (${new Date().toLocaleDateString()}). ${c.jobTitle ? `Title: ${c.jobTitle}.` : ''}`,
      });
      setSuccessMsg(`Imported "${c.displayName}" into Clients CRM.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to import client.');
    }
  };

  const handleImportAsCrew = (c: GooglePersonContact) => {
    try {
      const validRoles = [
        'A1 Audio Lead',
        'A2 Audio Assistant',
        'V1 Video Lead / Switcher',
        'V2 Video Tech / Projection',
        'L1 Lighting Designer / Board Op',
        'L2 Lighting Tech',
        'Rigging Lead',
        'Stage Manager',
        'General AV Tech',
        'Production Manager',
        'Logistics & Truck Driver',
      ] as const;

      const matchedRole = validRoles.find(
        (r) => c.jobTitle && r.toLowerCase().includes(c.jobTitle.toLowerCase())
      );

      addStaffMember({
        name: c.displayName,
        role: matchedRole || 'General AV Tech',
        email: c.email || `${c.displayName.toLowerCase().replace(/\s+/g, '.')}@crew.com`,
        phone: c.phone || 'N/A',
        dayRate: 600,
        hourlyRate: 60,
        avatarUrl: c.photoUrl || '',
        status: 'Available',
        skills: ['Audio', 'Video', 'Stage Prep'],
        notes: `Imported from Google Contacts on ${new Date().toLocaleDateString()}`,
      });
      setSuccessMsg(`Imported "${c.displayName}" into Crew Staff roster.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to import staff member.');
    }
  };

  const handleExportClient = async (clientId: string) => {
    if (!googleCalendarToken) {
      setError('Please connect your Google account.');
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    setExportingId(clientId);
    setError(null);
    try {
      await exportClientToGoogleContacts(client, googleCalendarToken);
      setSuccessMsg(`Successfully exported client "${client.name}" to your Google Contacts.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to export client to Google Contacts.');
    } finally {
      setExportingId(null);
    }
  };

  const handleExportStaff = async (staffId: string) => {
    if (!googleCalendarToken) {
      setError('Please connect your Google account.');
      return;
    }
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;

    setExportingId(staffId);
    setError(null);
    try {
      await exportStaffToGoogleContacts(member, googleCalendarToken);
      setSuccessMsg(`Successfully exported technician "${member.name}" to your Google Contacts.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to export technician to Google Contacts.');
    } finally {
      setExportingId(null);
    }
  };

  const filteredGoogleContacts = googleContacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Contact className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Google Contacts Integration</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-normal">
                People API Sync
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Bi-directionally synchronize clients and crew members with your Google Contacts address book.
            </p>
          </div>
        </div>

        {/* Google Authentication Status */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                googleCalendarToken ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs text-neutral-300">
              {googleCalendarToken ? 'Google Contacts Connected' : 'Google Account Not Connected'}
            </span>
          </div>
          {!googleCalendarToken ? (
            <button
              onClick={handleConnectGoogle}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Connect Google</span>
            </button>
          ) : (
            <button
              onClick={loadContacts}
              disabled={loading}
              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'Refreshing...' : 'Refresh Contacts'}
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800 text-xs">
          <button
            onClick={() => {
              setMode('import');
              setError(null);
            }}
            className={`flex-1 py-1.5 font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'import' ? 'bg-neutral-800 text-amber-400 shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Import from Google Contacts</span>
          </button>
          <button
            onClick={() => {
              setMode('export');
              setError(null);
            }}
            className={`flex-1 py-1.5 font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'export' ? 'bg-neutral-800 text-blue-400 shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Export to Google Contacts</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {mode === 'import' ? (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter Google contacts by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {loading ? (
                <div className="py-12 text-center text-neutral-400 text-xs flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span>Loading contacts from Google People API...</span>
                </div>
              ) : filteredGoogleContacts.length === 0 ? (
                <div className="py-10 text-center text-neutral-400 text-xs bg-neutral-950 rounded-xl border border-neutral-800 p-6 space-y-2">
                  <Contact className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="font-semibold text-neutral-300">
                    {googleContacts.length === 0
                      ? 'No Google Contacts loaded yet.'
                      : 'No contacts match your search query.'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {!googleCalendarToken
                      ? 'Connect your Google account above to fetch your address book.'
                      : 'Make sure your Google account has contacts saved or try searching with a different term.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-neutral-400">
                    Found {filteredGoogleContacts.length} Google Contact(s)
                  </div>
                  {filteredGoogleContacts.map((c, idx) => (
                    <div
                      key={c.resourceName || idx}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{c.displayName}</span>
                          {c.company && (
                            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300">
                              {c.company}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-neutral-500" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-neutral-500" />
                              {c.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => handleImportAsClient(c)}
                          className="flex-1 sm:flex-none px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Import into Clients CRM"
                        >
                          <Briefcase className="w-3 h-3 text-amber-400" />
                          <span>+ Client</span>
                        </button>
                        <button
                          onClick={() => handleImportAsCrew(c)}
                          className="flex-1 sm:flex-none px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-blue-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Import into Crew Roster"
                        >
                          <Users className="w-3 h-3 text-blue-400" />
                          <span>+ Crew</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Export Target Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExportTargetType('clients')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    exportTargetType === 'clients'
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                  }`}
                >
                  Clients ({clients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExportTargetType('staff')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    exportTargetType === 'staff'
                      ? 'bg-blue-400 text-neutral-950 font-bold'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                  }`}
                >
                  Crew Technicians ({staff.length})
                </button>
              </div>

              {exportTargetType === 'clients' ? (
                <div className="space-y-2">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{client.name}</div>
                        <div className="text-[11px] text-neutral-400">
                          {client.company} · {client.email} · {client.phone}
                        </div>
                      </div>
                      <button
                        onClick={() => handleExportClient(client.id)}
                        disabled={exportingId === client.id || !googleCalendarToken}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {exportingId === client.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>Export to Google</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{member.name}</div>
                        <div className="text-[11px] text-neutral-400">
                          {member.role} · {member.email} · {member.phone}
                        </div>
                      </div>
                      <button
                        onClick={() => handleExportStaff(member.id)}
                        disabled={exportingId === member.id || !googleCalendarToken}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {exportingId === member.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>Export to Google</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
