import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  OperationType,
  handleFirestoreError,
  testConnection,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  uploadFileToStorage,
  getCachedAccessToken,
  setCachedAccessToken,
} from '../firebase';
import {
  InventoryItem,
  StaffMember,
  LaborShift,
  ClientQuote,
  Invoice,
  Client,
  MaintenanceRecord,
  CompanySettings,
  ActiveTab,
  QuoteStatus,
  ItemStatus,
  PaymentRecord,
  AppUser,
  UserRole,
  RolePermissions,
  USER_ROLE_DEFINITIONS,
} from '../types';
import {
  initialCompanySettings,
} from '../data/mockData';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Firebase Auth & Cloud Storage
  currentUser: AppUser | null;
  authLoading: boolean;
  isCloudSynced: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  uploadFile: (path: string, file: File | Blob) => Promise<string>;

  // User Roles & RBAC
  simulatedRole: UserRole | null;
  setSimulatedRole: (role: UserRole | null) => void;
  activeRole: UserRole;
  userHasPermission: (perm: keyof RolePermissions) => boolean;
  teamUsers: AppUser[];
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  updateTeamUser: (userId: string, updates: Partial<AppUser>) => Promise<void>;
  addTeamUser: (user: Omit<AppUser, 'uid'>) => Promise<void>;
  deleteTeamUser: (userId: string) => Promise<void>;
  switchActiveUser: (user: AppUser) => void;

  // Google Calendar Integration
  googleCalendarToken: string | null;
  connectGoogleCalendar: () => Promise<string>;
  disconnectGoogleCalendar: () => void;

  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  setItemMaintenanceStatus: (id: string, status: ItemStatus, inRepairCount?: number) => Promise<void>;

  // Staff & Scheduling
  staff: StaffMember[];
  addStaffMember: (member: Omit<StaffMember, 'id'>) => Promise<void>;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;

  shifts: LaborShift[];
  addShift: (shift: Omit<LaborShift, 'id'>) => Promise<void>;
  updateShift: (id: string, updates: Partial<LaborShift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;

  // Quotes
  quotes: ClientQuote[];
  addQuote: (quote: Omit<ClientQuote, 'id' | 'quoteNumber'>) => string;
  updateQuote: (id: string, updates: Partial<ClientQuote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  updateQuoteStatus: (id: string, status: QuoteStatus) => Promise<void>;
  convertQuoteToActiveJob: (id: string) => Promise<void>;
  updatePulledGearCount: (quoteId: string, inventoryId: string, count: number) => Promise<void>;

  // Invoices & Payments
  invoices: Invoice[];
  createInvoiceFromQuote: (quoteId: string) => string;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => string;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  recordPayment: (invoiceId: string, payment: Omit<PaymentRecord, 'id'>) => Promise<void>;

  // Clients CRM
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => string;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  selectedClientForDetail: Client | null;
  setSelectedClientForDetail: (client: Client | null) => void;

  // Maintenance
  maintenanceRecords: MaintenanceRecord[];
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'dateLogged'>) => Promise<void>;
  updateMaintenanceRecord: (id: string, updates: Partial<MaintenanceRecord>) => Promise<void>;
  completeMaintenanceRecord: (id: string, resolutionNotes: string, cost?: number) => Promise<void>;
  deleteMaintenanceRecord: (id: string) => Promise<void>;

  // Settings
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  resetAllData: () => Promise<void>;

  // View / Print States
  activeQuoteForPrint: ClientQuote | null;
  setActiveQuoteForPrint: (quote: ClientQuote | null) => void;
  activeInvoiceForPrint: Invoice | null;
  setActiveInvoiceForPrint: (invoice: Invoice | null) => void;
  selectedQuoteForPull: ClientQuote | null;
  setSelectedQuoteForPull: (quote: ClientQuote | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'inthewind_av_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Google Calendar Access Token State (In-Memory Cache)
  const [googleCalendarToken, setGoogleCalendarToken] = useState<string | null>(() => getCachedAccessToken());

  // User Roles & Access Control State
  const [simulatedRole, setSimulatedRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}simulated_role`);
    return (saved as UserRole) || null;
  });

  const [teamUsers, setTeamUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}team_users`);
    return saved ? JSON.parse(saved) : [];
  });

  // Effective Active Role (Simulated role overrides for testing RBAC, otherwise user's assigned role)
  const activeRole: UserRole = simulatedRole || (currentUser?.role as UserRole) || 'Admin';

  const userHasPermission = (perm: keyof RolePermissions): boolean => {
    const roleDef = USER_ROLE_DEFINITIONS[activeRole];
    return roleDef ? !!roleDef.permissions[perm] : false;
  };

  const setSimulatedRole = (role: UserRole | null) => {
    setSimulatedRoleState(role);
    if (role) {
      localStorage.setItem(`${STORAGE_PREFIX}simulated_role`, role);
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}simulated_role`);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    const updated = teamUsers.map((u) => (u.uid === userId ? { ...u, role: newRole } : u));
    setTeamUsers(updated);
    localStorage.setItem(`${STORAGE_PREFIX}team_users`, JSON.stringify(updated));

    if (currentUser && currentUser.uid === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }

    try {
      await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
    } catch (err) {
      console.warn('User role update to Firestore (non-fatal):', err);
    }
  };

  const addTeamUser = async (user: Omit<AppUser, 'uid'>) => {
    const newUid = `user-${Date.now().toString(36)}`;
    const fullUser: AppUser = { ...user, uid: newUid };
    const updated = [fullUser, ...teamUsers];
    setTeamUsers(updated);
    localStorage.setItem(`${STORAGE_PREFIX}team_users`, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'users', newUid), cleanForFirestore(fullUser));
    } catch (err) {
      console.warn('Firestore add team user:', err);
    }
  };

  const updateTeamUser = async (userId: string, updates: Partial<AppUser>) => {
    const updated = teamUsers.map((u) => (u.uid === userId ? { ...u, ...updates } : u));
    setTeamUsers(updated);
    localStorage.setItem(`${STORAGE_PREFIX}team_users`, JSON.stringify(updated));

    if (currentUser && currentUser.uid === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }

    try {
      await setDoc(doc(db, 'users', userId), cleanForFirestore(updates), { merge: true });
    } catch (err) {
      console.warn('Firestore update team user:', err);
    }
  };

  const switchActiveUser = (user: AppUser) => {
    setCurrentUser(user);
    setSimulatedRole(user.role);
  };

  const deleteTeamUser = async (userId: string) => {
    const updated = teamUsers.filter((u) => u.uid !== userId);
    setTeamUsers(updated);
    localStorage.setItem(`${STORAGE_PREFIX}team_users`, JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.warn('Firestore delete team user:', err);
    }
  };

  const connectGoogleCalendar = async (): Promise<string> => {
    try {
      setAuthLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setGoogleCalendarToken(credential.accessToken);
        setAuthLoading(false);
        return credential.accessToken;
      }
      setAuthLoading(false);
      throw new Error('Google did not return an access token for Calendar');
    } catch (err) {
      setAuthLoading(false);
      throw err;
    }
  };

  const disconnectGoogleCalendar = () => {
    setCachedAccessToken(null);
    setGoogleCalendarToken(null);
  };

  // Helper to strip undefined values for Firestore compatibility
  const cleanForFirestore = <T extends Record<string, any>>(obj: T): T =>
    JSON.parse(JSON.stringify(obj));

  // Entities State - Loaded live from Firestore database (no mock data fallback)
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}inventory`);
    return saved ? JSON.parse(saved) : [];
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}staff`);
    return saved ? JSON.parse(saved) : [];
  });

  const [shifts, setShifts] = useState<LaborShift[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}shifts`);
    return saved ? JSON.parse(saved) : [];
  });

  const [quotes, setQuotes] = useState<ClientQuote[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}quotes`);
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}invoices`);
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}clients`);
    return saved ? JSON.parse(saved) : [];
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}maintenance`);
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    return saved ? JSON.parse(saved) : initialCompanySettings;
  });

  const [activeQuoteForPrint, setActiveQuoteForPrint] = useState<ClientQuote | null>(null);
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<Invoice | null>(null);
  const [selectedQuoteForPull, setSelectedQuoteForPull] = useState<ClientQuote | null>(null);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);

  // Verify Firestore connection on initial boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let resolvedRole: UserRole =
          fbUser.email?.includes('chris') || fbUser.email?.includes('admin')
            ? 'Admin'
            : 'Lead Engineer';

        try {
          const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDocSnap.exists() && userDocSnap.data()?.role) {
            resolvedRole = userDocSnap.data().role as UserRole;
          }
        } catch (e) {
          // non-fatal
        }

        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'AV Crew Member',
          photoURL: fbUser.photoURL,
          role: resolvedRole,
        };
        setCurrentUser(appUser);
        setAuthLoading(false);

        // Sync or create user profile document in Firestore
        try {
          await setDoc(
            doc(db, 'users', fbUser.uid),
            {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: appUser.displayName,
              photoURL: fbUser.photoURL || '',
              role: appUser.role,
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('User profile sync skipped/non-fatal:', err);
        }
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
        setIsCloudSynced(false);
        setCachedAccessToken(null);
        setGoogleCalendarToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up Firestore real-time listeners and live data synchronization from database
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // 1. Inventory Listener
    const invUnsub = onSnapshot(
      collection(db, 'inventory'),
      (snap) => {
        const items: InventoryItem[] = [];
        snap.forEach((d) => items.push(d.data() as InventoryItem));
        setInventory(items);
        localStorage.setItem(`${STORAGE_PREFIX}inventory`, JSON.stringify(items));
        setIsCloudSynced(true);
      },
      (error) => {
        console.warn('Inventory live listener:', error);
      }
    );
    unsubscribers.push(invUnsub);

    // 2. Staff Listener
    const staffUnsub = onSnapshot(
      collection(db, 'staff'),
      (snap) => {
        const items: StaffMember[] = [];
        snap.forEach((d) => items.push(d.data() as StaffMember));
        setStaff(items);
        localStorage.setItem(`${STORAGE_PREFIX}staff`, JSON.stringify(items));
      },
      (error) => {
        console.warn('Staff live listener:', error);
      }
    );
    unsubscribers.push(staffUnsub);

    // 3. Shifts Listener
    const shiftsUnsub = onSnapshot(
      collection(db, 'shifts'),
      (snap) => {
        const items: LaborShift[] = [];
        snap.forEach((d) => items.push(d.data() as LaborShift));
        setShifts(items);
        localStorage.setItem(`${STORAGE_PREFIX}shifts`, JSON.stringify(items));
      },
      (error) => {
        console.warn('Shifts live listener:', error);
      }
    );
    unsubscribers.push(shiftsUnsub);

    // 4. Quotes Listener
    const quotesUnsub = onSnapshot(
      collection(db, 'quotes'),
      (snap) => {
        const items: ClientQuote[] = [];
        snap.forEach((d) => items.push(d.data() as ClientQuote));
        setQuotes(items);
        localStorage.setItem(`${STORAGE_PREFIX}quotes`, JSON.stringify(items));
      },
      (error) => {
        console.warn('Quotes live listener:', error);
      }
    );
    unsubscribers.push(quotesUnsub);

    // 5. Invoices Listener
    const invsUnsub = onSnapshot(
      collection(db, 'invoices'),
      (snap) => {
        const items: Invoice[] = [];
        snap.forEach((d) => items.push(d.data() as Invoice));
        setInvoices(items);
        localStorage.setItem(`${STORAGE_PREFIX}invoices`, JSON.stringify(items));
      },
      (error) => {
        console.warn('Invoices live listener:', error);
      }
    );
    unsubscribers.push(invsUnsub);

    // 6. Clients Listener
    const clientsUnsub = onSnapshot(
      collection(db, 'clients'),
      (snap) => {
        const items: Client[] = [];
        snap.forEach((d) => items.push(d.data() as Client));
        setClients(items);
        localStorage.setItem(`${STORAGE_PREFIX}clients`, JSON.stringify(items));
      },
      (error) => {
        console.warn('Clients live listener:', error);
      }
    );
    unsubscribers.push(clientsUnsub);

    // 7. Maintenance Listener
    const maintUnsub = onSnapshot(
      collection(db, 'maintenance'),
      (snap) => {
        const items: MaintenanceRecord[] = [];
        snap.forEach((d) => items.push(d.data() as MaintenanceRecord));
        setMaintenanceRecords(items);
        localStorage.setItem(`${STORAGE_PREFIX}maintenance`, JSON.stringify(items));
      },
      (error) => {
        console.warn('Maintenance live listener:', error);
      }
    );
    unsubscribers.push(maintUnsub);

    // 8. Settings Listener
    const settingsUnsub = onSnapshot(
      doc(db, 'settings', 'company'),
      (snap) => {
        if (snap.exists()) {
          const loaded = snap.data() as CompanySettings;
          setSettings(loaded);
          localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(loaded));
        }
      },
      (error) => {
        console.warn('Settings live listener:', error);
      }
    );
    unsubscribers.push(settingsUnsub);

    // 9. Team Users Listener
    const usersUnsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const loaded: AppUser[] = [];
        snap.forEach((d) => loaded.push(d.data() as AppUser));
        if (loaded.length > 0) {
          setTeamUsers(loaded);
          localStorage.setItem(`${STORAGE_PREFIX}team_users`, JSON.stringify(loaded));
        }
      },
      (error) => {
        console.warn('Users live listener:', error);
      }
    );
    unsubscribers.push(usersUnsub);

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, []);

  // Sync to localStorage as offline fallback cache
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}inventory`, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}staff`, JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}shifts`, JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}quotes`, JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}clients`, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}maintenance`, JSON.stringify(maintenanceRecords));
  }, [maintenanceRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  // Google Sign-in with Popup
  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setGoogleCalendarToken(credential.accessToken);
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setAuthLoading(false);
      throw err;
    }
  };

  // Email & Password Sign-in
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setAuthLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setAuthLoading(false);
      throw err;
    }
  };

  // Email & Password Sign-up
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setAuthLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        // Update local and firestore profile
        setCurrentUser((prev) => (prev ? { ...prev, displayName } : null));
        try {
          await setDoc(
            doc(db, 'users', userCredential.user.uid),
            {
              uid: userCredential.user.uid,
              email: userCredential.user.email || '',
              displayName,
              photoURL: '',
              role: 'Lead Engineer',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('Profile write:', e);
        }
      }
    } catch (err) {
      setAuthLoading(false);
      throw err;
    }
  };

  // Password Reset Email
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setCachedAccessToken(null);
      setGoogleCalendarToken(null);
      setCurrentUser(null);
      setIsCloudSynced(false);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Cloud Storage File Upload
  const uploadFile = async (path: string, file: File | Blob): Promise<string> => {
    return await uploadFileToStorage(path, file);
  };

  // --------------------------------------------------------------------------
  // Inventory actions
  // --------------------------------------------------------------------------
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    const id = `inv-${Date.now().toString(36)}`;
    const newItem: InventoryItem = { ...item, id };
    setInventory((prev) => [newItem, ...prev]);

    try {
      await setDoc(doc(db, 'inventory', id), cleanForFirestore(newItem));
    } catch (error) {
      console.warn('Firestore add inventory:', error);
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

    try {
      await updateDoc(doc(db, 'inventory', id), cleanForFirestore(updates));
    } catch (error) {
      console.warn('Firestore update inventory:', error);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (error) {
      console.warn('Firestore delete inventory:', error);
    }
  };

  const setItemMaintenanceStatus = async (
    id: string,
    status: ItemStatus,
    inRepairCount?: number
  ) => {
    const target = inventory.find((i) => i.id === id);
    if (!target) return;

    const newRepairQty =
      inRepairCount !== undefined
        ? inRepairCount
        : status === 'In Maintenance'
        ? Math.max(1, target.inRepairQuantity || 1)
        : 0;

    const newAvail = Math.max(0, target.totalQuantity - target.onRentQuantity - newRepairQty);

    const updates = {
      status,
      inRepairQuantity: newRepairQty,
      availableQuantity: newAvail,
    };

    await updateInventoryItem(id, updates);
  };

  // --------------------------------------------------------------------------
  // Staff & Scheduling actions
  // --------------------------------------------------------------------------
  const addStaffMember = async (member: Omit<StaffMember, 'id'>) => {
    const id = `staff-${Date.now().toString(36)}`;
    const newMember: StaffMember = { ...member, id };
    setStaff((prev) => [newMember, ...prev]);

    try {
      await setDoc(doc(db, 'staff', id), cleanForFirestore(newMember));
    } catch (error) {
      console.warn('Firestore add staff:', error);
    }
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>) => {
    setStaff((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

    try {
      await updateDoc(doc(db, 'staff', id), cleanForFirestore(updates));
    } catch (error) {
      console.warn('Firestore update staff:', error);
    }
  };

  const deleteStaffMember = async (id: string) => {
    setStaff((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (error) {
      console.warn('Firestore delete staff:', error);
    }
  };

  const addShift = async (shift: Omit<LaborShift, 'id'>) => {
    const id = `shift-${Date.now().toString(36)}`;
    const newShift: LaborShift = { ...shift, id };
    setShifts((prev) => [newShift, ...prev]);

    try {
      await setDoc(doc(db, 'shifts', id), cleanForFirestore(newShift));
    } catch (error) {
      console.warn('Firestore add shift:', error);
    }
  };

  const updateShift = async (id: string, updates: Partial<LaborShift>) => {
    setShifts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

    try {
      await updateDoc(doc(db, 'shifts', id), cleanForFirestore(updates));
    } catch (error) {
      console.warn('Firestore update shift:', error);
    }
  };

  const deleteShift = async (id: string) => {
    setShifts((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteDoc(doc(db, 'shifts', id));
    } catch (error) {
      console.warn('Firestore delete shift:', error);
    }
  };

  // --------------------------------------------------------------------------
  // Quotes actions
  // --------------------------------------------------------------------------
  const addQuote = (quote: Omit<ClientQuote, 'id' | 'quoteNumber'>): string => {
    const seq = quotes.length + 92;
    const quoteNumber = `ITW-2026-${String(seq).padStart(3, '0')}`;
    const id = `quote-${Date.now().toString(36)}`;
    const newQuote: ClientQuote = {
      ...quote,
      id,
      quoteNumber,
    };
    setQuotes((prev) => [newQuote, ...prev]);

    try {
      setDoc(doc(db, 'quotes', id), cleanForFirestore(newQuote));
    } catch (error) {
      console.warn('Firestore add quote:', error);
    }

    return id;
  };

  const updateQuote = async (id: string, updates: Partial<ClientQuote>) => {
    setQuotes((prev) =>
      prev.map((quote) => (quote.id === id ? { ...quote, ...updates } : quote))
    );

    try {
      await updateDoc(doc(db, 'quotes', id), cleanForFirestore(updates));
    } catch (error) {
      console.warn('Firestore update quote:', error);
    }
  };

  const deleteQuote = async (id: string) => {
    setQuotes((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteDoc(doc(db, 'quotes', id));
    } catch (error) {
      console.warn('Firestore delete quote:', error);
    }
  };

  const updateQuoteStatus = async (id: string, status: QuoteStatus) => {
    await updateQuote(id, { status });
  };

  const convertQuoteToActiveJob = async (id: string) => {
    const quote = quotes.find((q) => q.id === id);
    if (!quote) return;

    await updateQuote(id, { status: 'Approved', termsAccepted: true });

    // Deduct available gear & record on-rent
    for (const item of quote.equipmentItems) {
      const inv = inventory.find((i) => i.id === item.inventoryId);
      if (inv) {
        const newOnRent = inv.onRentQuantity + item.quantity;
        const newAvail = Math.max(0, inv.totalQuantity - newOnRent - inv.inRepairQuantity);
        await updateInventoryItem(inv.id, {
          onRentQuantity: newOnRent,
          availableQuantity: newAvail,
        });
      }
    }
  };

  const updatePulledGearCount = async (
    quoteId: string,
    inventoryId: string,
    count: number
  ) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;

    const currentMap = quote.pulledGearStatus || {};
    const updatedStatus = {
      ...currentMap,
      [inventoryId]: count,
    };

    await updateQuote(quoteId, { pulledGearStatus: updatedStatus });
  };

  // --------------------------------------------------------------------------
  // Invoices actions
  // --------------------------------------------------------------------------
  const createInvoiceFromQuote = (quoteId: string): string => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return '';

    const seq = invoices.length + 92;
    const invoiceNumber = `INV-2026-${String(seq).padStart(3, '0')}`;
    const id = `inv-${Date.now().toString(36)}`;

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id,
      invoiceNumber,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientCompany: quote.clientCompany,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      eventName: quote.eventName,
      venueName: quote.venueName,
      issueDate,
      dueDate,
      equipmentSubtotal: quote.equipmentSubtotal,
      laborSubtotal: quote.laborSubtotal,
      logisticsFee: quote.logisticsFee,
      damageWaiverAmount: quote.damageWaiverAmount,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      paidAmount: 0,
      balanceDue: quote.totalAmount,
      paymentStatus: 'pending',
      paymentTerms: 'Net 30',
      payments: [],
      notes: `Generated from accepted quote ${quote.quoteNumber}. Remittance via ACH / Wire Transfer.`,
      createdAt: issueDate,
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    updateQuote(quote.id, { convertedToInvoiceId: id });

    if (currentUser) {
      const path = `invoices/${id}`;
      setDoc(doc(db, 'invoices', id), newInvoice).catch((error) => {
        handleFirestoreError(error, OperationType.CREATE, path);
      });
    }

    return id;
  };

  const addInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>): string => {
    const seq = invoices.length + 92;
    const invoiceNumber = `INV-2026-${String(seq).padStart(3, '0')}`;
    const id = `inv-${Date.now().toString(36)}`;
    const newInvoice: Invoice = {
      ...invoice,
      id,
      invoiceNumber,
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    if (currentUser) {
      const path = `invoices/${id}`;
      setDoc(doc(db, 'invoices', id), newInvoice).catch((error) => {
        handleFirestoreError(error, OperationType.CREATE, path);
      });
    }

    return id;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );

    if (currentUser) {
      const path = `invoices/${id}`;
      try {
        await updateDoc(doc(db, 'invoices', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  const deleteInvoice = async (id: string) => {
    setInvoices((prev) => prev.filter((item) => item.id !== id));

    if (currentUser) {
      const path = `invoices/${id}`;
      try {
        await deleteDoc(doc(db, 'invoices', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const recordPayment = async (
    invoiceId: string,
    payment: Omit<PaymentRecord, 'id'>
  ) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    const newPaymentRecord: PaymentRecord = {
      ...payment,
      id: `pay-${Date.now().toString(36)}`,
    };

    const newPaidAmount = Number((invoice.paidAmount + payment.amount).toFixed(2));
    const newBalanceDue = Math.max(0, Number((invoice.totalAmount - newPaidAmount).toFixed(2)));

    let newStatus: Invoice['paymentStatus'] = invoice.paymentStatus;
    if (newBalanceDue === 0) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    const updates: Partial<Invoice> = {
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      paymentStatus: newStatus,
      payments: [...(invoice.payments || []), newPaymentRecord],
    };

    await updateInvoice(invoiceId, updates);
  };

  // --------------------------------------------------------------------------
  // Clients CRM actions
  // --------------------------------------------------------------------------
  const addClient = (client: Omit<Client, 'id' | 'createdAt'>): string => {
    const id = `cli-${Date.now().toString(36)}`;
    const newClient: Client = {
      ...client,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClients((prev) => [newClient, ...prev]);

    if (currentUser) {
      const path = `clients/${id}`;
      setDoc(doc(db, 'clients', id), newClient).catch((error) => {
        handleFirestoreError(error, OperationType.CREATE, path);
      });
    }

    return id;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );

    if (currentUser) {
      const path = `clients/${id}`;
      try {
        await updateDoc(doc(db, 'clients', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));

    if (currentUser) {
      const path = `clients/${id}`;
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  // --------------------------------------------------------------------------
  // Maintenance actions
  // --------------------------------------------------------------------------
  const addMaintenanceRecord = async (
    record: Omit<MaintenanceRecord, 'id' | 'dateLogged'>
  ) => {
    const id = `maint-${Date.now().toString(36)}`;
    const newRecord: MaintenanceRecord = {
      ...record,
      id,
      dateLogged: new Date().toISOString().split('T')[0],
    };
    setMaintenanceRecords((prev) => [newRecord, ...prev]);

    if (currentUser) {
      const path = `maintenance/${id}`;
      try {
        await setDoc(doc(db, 'maintenance', id), newRecord);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }

    if (newRecord.status === 'In Progress') {
      await setItemMaintenanceStatus(newRecord.inventoryItemId, 'In Maintenance');
    }
  };

  const updateMaintenanceRecord = async (
    id: string,
    updates: Partial<MaintenanceRecord>
  ) => {
    setMaintenanceRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, ...updates } : rec))
    );

    if (currentUser) {
      const path = `maintenance/${id}`;
      try {
        await updateDoc(doc(db, 'maintenance', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  const completeMaintenanceRecord = async (
    id: string,
    resolutionNotes: string,
    cost?: number
  ) => {
    const record = maintenanceRecords.find((r) => r.id === id);
    if (!record) return;

    const updates: Partial<MaintenanceRecord> = {
      status: 'Completed',
      completedDate: new Date().toISOString().split('T')[0],
      resolutionNotes,
      cost: cost !== undefined ? cost : record.cost,
    };

    await updateMaintenanceRecord(id, updates);
    await setItemMaintenanceStatus(record.inventoryItemId, 'Available', 0);
  };

  const deleteMaintenanceRecord = async (id: string) => {
    setMaintenanceRecords((prev) => prev.filter((r) => r.id !== id));

    if (currentUser) {
      const path = `maintenance/${id}`;
      try {
        await deleteDoc(doc(db, 'maintenance', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  // --------------------------------------------------------------------------
  // Settings actions
  // --------------------------------------------------------------------------
  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (currentUser) {
      const path = 'settings/company';
      try {
        await setDoc(doc(db, 'settings', 'company'), updated);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  const resetAllData = async () => {
    localStorage.removeItem(`${STORAGE_PREFIX}inventory`);
    localStorage.removeItem(`${STORAGE_PREFIX}staff`);
    localStorage.removeItem(`${STORAGE_PREFIX}shifts`);
    localStorage.removeItem(`${STORAGE_PREFIX}quotes`);
    localStorage.removeItem(`${STORAGE_PREFIX}invoices`);
    localStorage.removeItem(`${STORAGE_PREFIX}clients`);
    localStorage.removeItem(`${STORAGE_PREFIX}maintenance`);
    localStorage.removeItem(`${STORAGE_PREFIX}settings`);

    // Reload live collections from Firestore database
    try {
      const invSnap = await getDocs(collection(db, 'inventory'));
      const invItems: InventoryItem[] = [];
      invSnap.forEach((d) => invItems.push(d.data() as InventoryItem));
      setInventory(invItems);

      const staffSnap = await getDocs(collection(db, 'staff'));
      const staffItems: StaffMember[] = [];
      staffSnap.forEach((d) => staffItems.push(d.data() as StaffMember));
      setStaff(staffItems);

      const shiftsSnap = await getDocs(collection(db, 'shifts'));
      const shiftItems: LaborShift[] = [];
      shiftsSnap.forEach((d) => shiftItems.push(d.data() as LaborShift));
      setShifts(shiftItems);

      const quotesSnap = await getDocs(collection(db, 'quotes'));
      const quoteItems: ClientQuote[] = [];
      quotesSnap.forEach((d) => quoteItems.push(d.data() as ClientQuote));
      setQuotes(quoteItems);

      const invoicesSnap = await getDocs(collection(db, 'invoices'));
      const invoiceItems: Invoice[] = [];
      invoicesSnap.forEach((d) => invoiceItems.push(d.data() as Invoice));
      setInvoices(invoiceItems);

      const clientsSnap = await getDocs(collection(db, 'clients'));
      const clientItems: Client[] = [];
      clientsSnap.forEach((d) => clientItems.push(d.data() as Client));
      setClients(clientItems);

      const maintSnap = await getDocs(collection(db, 'maintenance'));
      const maintItems: MaintenanceRecord[] = [];
      maintSnap.forEach((d) => maintItems.push(d.data() as MaintenanceRecord));
      setMaintenanceRecords(maintItems);

      const setSnap = await getDoc(doc(db, 'settings', 'company'));
      if (setSnap.exists()) {
        setSettings(setSnap.data() as CompanySettings);
      }
    } catch (error) {
      console.warn('Reload live data from Firestore error:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,

        currentUser,
        authLoading,
        isCloudSynced,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        logout,
        uploadFile,

        // User Roles & RBAC
        simulatedRole,
        setSimulatedRole,
        activeRole,
        userHasPermission,
        teamUsers,
        updateUserRole,
        updateTeamUser,
        addTeamUser,
        deleteTeamUser,
        switchActiveUser,

        // Google Calendar Integration
        googleCalendarToken,
        connectGoogleCalendar,
        disconnectGoogleCalendar,

        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        setItemMaintenanceStatus,

        staff,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,

        shifts,
        addShift,
        updateShift,
        deleteShift,

        quotes,
        addQuote,
        updateQuote,
        deleteQuote,
        updateQuoteStatus,
        convertQuoteToActiveJob,
        updatePulledGearCount,

        invoices,
        createInvoiceFromQuote,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        recordPayment,

        clients,
        addClient,
        updateClient,
        deleteClient,
        selectedClientForDetail,
        setSelectedClientForDetail,

        maintenanceRecords,
        addMaintenanceRecord,
        updateMaintenanceRecord,
        completeMaintenanceRecord,
        deleteMaintenanceRecord,

        settings,
        updateSettings,
        resetAllData,

        activeQuoteForPrint,
        setActiveQuoteForPrint,
        activeInvoiceForPrint,
        setActiveInvoiceForPrint,
        selectedQuoteForPull,
        setSelectedQuoteForPull,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
