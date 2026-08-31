import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Booking,
  BookingStatus,
  DashboardRoute,
  Dock,
  OperationalHoliday,
  OperationalSettings,
  POStatus,
  PriorityLevel,
  PurchaseOrder,
  PurchaseOrderStatus,
  SlotAvailabilityCheckRequest,
  SlotAvailabilityResult,
  User,
  UserRole,
  Vehicle,
} from '../types';
import {
  INITIAL_BOOKINGS,
  INITIAL_DOCKS,
  INITIAL_HOLIDAYS,
  INITIAL_POS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_VEHICLES,
  TODAY_STR,
} from './initialData';
import { DEMO_ACCOUNTS, getDefaultRouteForRole } from './authConfig';
import { checkSlotAvailability, combineDateAndTime, extractDateStr, extractTimeStr, minutesToTimeStr, timeStrToMinutes } from './slotEngine';

interface NotificationToast {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

interface AppContextType {
  // Auth & RBAC State
  isAuthenticated: boolean;
  currentUser: User;
  users: User[];
  currentRoute: DashboardRoute;
  currentSubView: string;
  loginError: string | null;

  // Domain State
  vehicles: Vehicle[];
  docks: Dock[];
  purchaseOrders: PurchaseOrder[];
  bookings: Booking[];
  settings: OperationalSettings;
  holidays: OperationalHoliday[];
  selectedDate: string;
  activeView: 'TIMELINE' | 'KANBAN' | 'TABLE' | 'WIZARD' | 'DOCS' | 'ANALYTICS';
  notifications: NotificationToast[];
  searchQuery: string;

  // Auth Actions
  login: (email: string, password: string, rememberMe?: boolean) => { success: boolean; message?: string };
  demoLogin: (role: UserRole) => void;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  navigateToRoute: (route: DashboardRoute, subView?: string) => void;
  setCurrentSubView: (subView: string) => void;

  // General Setters & Actions
  setSelectedDate: (date: string) => void;
  setActiveView: (view: 'TIMELINE' | 'KANBAN' | 'TABLE' | 'WIZARD' | 'DOCS' | 'ANALYTICS') => void;
  setSearchQuery: (query: string) => void;
  addToast: (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;

  // Purchasing & PPIC Actions
  createPurchaseOrder: (po: {
    poNumber: string;
    supplierName: string;
    supplierEmail?: string;
    supplierPhone?: string;
    itemDescription: string;
    quantity: number;
    qty?: number;
    unit: string;
    priority?: PriorityLevel;
    status?: POStatus;
  }) => PurchaseOrder;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  submitPoToPpic: (id: string) => void;
  approvePpicPo: (id: string, etaStartDate: string, etaEndDate: string, ppicNotes?: string) => void;
  rejectPpicPo: (id: string, reason: string) => void;
  cancelPurchaseOrder: (id: string, reason?: string) => void;

  // Booking & Supplier Actions
  checkAvailability: (req: SlotAvailabilityCheckRequest) => SlotAvailabilityResult;
  createBooking: (data: {
    poId: string;
    dockId: string;
    vehicleId: string;
    driverName: string;
    driverPhone?: string;
    licensePlate: string;
    date: string;
    startTimeStr: string;
    remarks?: string;
  }) => Booking;
  cancelBooking: (id: string, reason: string) => void;

  // Warehouse Actions (Status transitions)
  advanceBookingStatus: (id: string, targetStatus?: BookingStatus, remarks?: string) => void;
  updateBookingRemarks: (id: string, remarks: string) => void;
  updateWarehouseExecution: (
    id: string,
    data: {
      status?: BookingStatus;
      actualGateIn?: string;
      actualStartUnload?: string;
      actualFinishUnload?: string;
      actualGateOut?: string;
      warehouseNotes?: string;
      unloadingStaffName?: string;
      remarks?: string;
    }
  ) => void;

  // Admin Master Data & User Actions
  updateVehicle: (vehicle: Vehicle) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  deleteVehicle: (id: string) => void;
  toggleVehicleStatus: (id: string) => void;

  updateDock: (dock: Dock) => void;
  addDock: (dock: Omit<Dock, 'id'>) => void;
  deleteDock: (id: string) => void;
  toggleDockStatus: (id: string) => void;

  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;

  addHoliday: (holiday: Omit<OperationalHoliday, 'id'>) => void;
  updateHoliday: (holiday: OperationalHoliday) => void;
  deleteHoliday: (id: string) => void;

  updateSettings: (settings: OperationalSettings) => void;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'dockslot_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persisted state or fallback to seed
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [holidays, setHolidays] = useState<OperationalHoliday[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}holidays`);
    return saved ? JSON.parse(saved) : INITIAL_HOLIDAYS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}is_auth`);
    return saved ? JSON.parse(saved) : false; // Default to login screen
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user`);
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const [currentRoute, setCurrentRoute] = useState<DashboardRoute>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}route`);
    return (saved as DashboardRoute) || '/login';
  });

  const [currentSubView, setCurrentSubView] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}subview`);
    return saved || 'DEFAULT';
  });

  const [loginError, setLoginError] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}vehicles`);
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [docks, setDocks] = useState<Dock[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}docks`);
    return saved ? JSON.parse(saved) : INITIAL_DOCKS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}pos`);
    return saved ? JSON.parse(saved) : INITIAL_POS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}bookings`);
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [settings, setSettings] = useState<OperationalSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [activeView, setActiveView] = useState<'TIMELINE' | 'KANBAN' | 'TABLE' | 'WIZARD' | 'DOCS' | 'ANALYTICS'>('TIMELINE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);

  // Sync auth and routes to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}is_auth`, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}route`, currentRoute);
  }, [currentRoute]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}subview`, currentSubView);
  }, [currentSubView]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}vehicles`, JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}docks`, JSON.stringify(docks));
  }, [docks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}pos`, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}bookings`, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}holidays`, JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  const addToast = (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    const newToast: NotificationToast = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };
    setNotifications((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      removeToast(newToast.id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setNotifications((prev) => prev.filter((t) => t.id !== id));
  };

  // ----------------------------------------------------
  // Authentication & RBAC Actions
  // ----------------------------------------------------
  const login = (email: string, password: string, rememberMe: boolean = true) => {
    setLoginError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      const err = 'Email/Username dan Password wajib diisi.';
      setLoginError(err);
      return { success: false, message: err };
    }

    // Check against demo accounts or users
    const matchedDemo = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === cleanEmail || acc.email.split('@')[0] === cleanEmail
    );

    if (!matchedDemo) {
      const err = 'Akun tidak ditemukan. Gunakan salah satu email demo yang tersedia.';
      setLoginError(err);
      return { success: false, message: err };
    }

    if (password !== matchedDemo.password && password !== 'password123' && password !== 'admin') {
      const err = 'Password tidak valid. (Password default: password123)';
      setLoginError(err);
      return { success: false, message: err };
    }

    // Authenticated successfully
    const targetUser: User = {
      id: matchedDemo.id,
      name: matchedDemo.name,
      email: matchedDemo.email,
      role: matchedDemo.role,
      department: matchedDemo.department,
      supplierName: matchedDemo.supplierName,
    };

    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    const destRoute = getDefaultRouteForRole(matchedDemo.role);
    setCurrentRoute(destRoute);
    setCurrentSubView('DEFAULT');

    if (!rememberMe) {
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}session_only`, 'true');
    }

    addToast({
      type: 'success',
      title: 'Login Berhasil',
      message: `Selamat datang, ${targetUser.name} (${targetUser.role}). Anda dialihkan ke ${destRoute}.`,
    });

    return { success: true };
  };

  const demoLogin = (role: UserRole) => {
    const demo = DEMO_ACCOUNTS.find((d) => d.role === role) || DEMO_ACCOUNTS[0];
    const targetUser: User = {
      id: demo.id,
      name: demo.name,
      email: demo.email,
      role: demo.role,
      department: demo.department,
      supplierName: demo.supplierName,
    };

    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    setLoginError(null);
    const destRoute = getDefaultRouteForRole(role);
    setCurrentRoute(destRoute);
    setCurrentSubView('DEFAULT');

    addToast({
      type: 'success',
      title: `Login Demo (${role})`,
      message: `Masuk sebagai ${demo.name}. Menuju dashboard ${destRoute}.`,
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentRoute('/login');
    setCurrentSubView('DEFAULT');
    setLoginError(null);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}is_auth`);
    addToast({
      type: 'info',
      title: 'Logout Selesai',
      message: 'Sesi login Anda telah diakhiri dengan aman.',
    });
  };

  const switchRole = (role: UserRole) => {
    const target = users.find((u) => u.role === role) || {
      id: `user-${role.toLowerCase()}`,
      name: `${role} User`,
      email: `${role.toLowerCase()}@pabrik.co.id`,
      role,
    };
    setCurrentUser(target);
    const newRoute = getDefaultRouteForRole(role);
    setCurrentRoute(newRoute);
    setCurrentSubView('DEFAULT');
    addToast({
      type: 'info',
      title: 'Peran Berganti',
      message: `Beralih ke role ${role} (${target.name}) -> ${newRoute}`,
    });
  };

  const navigateToRoute = (route: DashboardRoute, subView?: string) => {
    setCurrentRoute(route);
    if (subView) {
      setCurrentSubView(subView);
    }
  };

  // ----------------------------------------------------
  // Purchasing & PPIC Actions
  // ----------------------------------------------------
  const createPurchaseOrder = (poData: {
    poNumber: string;
    supplierName: string;
    supplierEmail?: string;
    supplierPhone?: string;
    itemDescription: string;
    quantity: number;
    qty?: number;
    unit: string;
    priority?: PriorityLevel;
    status?: POStatus;
  }) => {
    const qtyVal = poData.quantity ?? poData.qty ?? 0;
    const nowIso = new Date().toISOString();
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: poData.poNumber.trim().toUpperCase(),
      supplierName: poData.supplierName.trim(),
      supplierEmail: poData.supplierEmail?.trim(),
      supplierPhone: poData.supplierPhone?.trim(),
      itemDescription: poData.itemDescription.trim(),
      quantity: qtyVal,
      qty: qtyVal,
      unit: poData.unit.trim().toUpperCase(),
      priority: poData.priority || 'NORMAL',
      status: poData.status || 'WAITING_PPIC_REVIEW',
      createdBy: currentUser.name || 'Purchasing Department',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setPurchaseOrders((prev) => [newPO, ...prev]);
    addToast({
      type: 'success',
      title: 'PO Berhasil Dibuat',
      message: `PO ${newPO.poNumber} (${newPO.supplierName}) telah masuk antrean ${
        newPO.status === 'WAITING_PPIC_REVIEW' ? 'Review PPIC' : 'Draft'
      }.`,
    });
    return newPO;
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    const nowIso = new Date().toISOString();
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id !== id) return po;
        const qtyVal = updates.quantity ?? updates.qty ?? po.quantity;
        return {
          ...po,
          ...updates,
          quantity: qtyVal,
          qty: qtyVal,
          updatedAt: nowIso,
        };
      })
    );
    addToast({
      type: 'info',
      title: 'PO Diperbarui',
      message: `Perubahan data PO berhasil disimpan.`,
    });
  };

  const submitPoToPpic = (id: string) => {
    const nowIso = new Date().toISOString();
    const target = purchaseOrders.find((p) => p.id === id);
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === id
          ? {
              ...po,
              status: 'WAITING_PPIC_REVIEW',
              updatedAt: nowIso,
            }
          : po
      )
    );
    addToast({
      type: 'success',
      title: 'PO Diajukan ke PPIC',
      message: `PO ${target?.poNumber} dikirim ke antrean review PPIC untuk verifikasi ETA.`,
    });
  };

  const deletePurchaseOrder = (id: string) => {
    const target = purchaseOrders.find((p) => p.id === id);
    if (target?.status === 'BOOKED' || target?.status === 'COMPLETED' || target?.status === 'SCHEDULED' || target?.status === 'IN_PROGRESS') {
      addToast({
        type: 'error',
        title: 'Gagal Hapus PO',
        message: 'PO yang sudah berstatus booked/scheduled/completed tidak dapat dihapus.',
      });
      return;
    }
    setPurchaseOrders((prev) => prev.filter((p) => p.id !== id));
    addToast({
      type: 'warning',
      title: 'PO Dihapus',
      message: `PO ${target?.poNumber || id} telah dihapus dari sistem.`,
    });
  };

  const approvePpicPo = (id: string, etaStartDate: string, etaEndDate: string, notes?: string) => {
    const nowIso = new Date().toISOString();
    const reviewer = currentUser.name || 'PPIC Planning';
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === id
          ? {
              ...po,
              status: 'READY_FOR_BOOKING',
              etaStartDate,
              etaEndDate,
              ppicEtaDateStart: etaStartDate,
              ppicEtaDateEnd: etaEndDate,
              ppicNotes: notes || po.ppicNotes,
              reviewedBy: reviewer,
              updatedAt: nowIso,
            }
          : po
      )
    );
    const target = purchaseOrders.find((p) => p.id === id);
    addToast({
      type: 'success',
      title: 'PO Disetujui PPIC (Ready for Booking)',
      message: `PO ${target?.poNumber} disetujui untuk window ${etaStartDate} s.d ${etaEndDate}. Supplier dapat segera memesan slot dock.`,
    });
  };

  const rejectPpicPo = (id: string, reason: string) => {
    const nowIso = new Date().toISOString();
    const reviewer = currentUser.name || 'PPIC Planning';
    const target = purchaseOrders.find((p) => p.id === id);
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === id
          ? {
              ...po,
              status: 'DRAFT',
              ppicNotes: `[REVISI PPIC]: ${reason}`,
              reviewedBy: reviewer,
              updatedAt: nowIso,
            }
          : po
      )
    );
    addToast({
      type: 'warning',
      title: 'PO Dikembalikan ke Purchasing',
      message: `PO ${target?.poNumber} dikembalikan ke Draft: ${reason}`,
    });
  };

  const cancelPurchaseOrder = (id: string, reason?: string) => {
    const nowIso = new Date().toISOString();
    const target = purchaseOrders.find((p) => p.id === id);
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === id
          ? {
              ...po,
              status: 'CANCELLED',
              ppicNotes: reason ? `[DIBATALKAN]: ${reason}` : po.ppicNotes,
              updatedAt: nowIso,
            }
          : po
      )
    );
    addToast({
      type: 'warning',
      title: 'PO Dibatalkan',
      message: `PO ${target?.poNumber} telah ditandai CANCELLED.`,
    });
  };

  // ----------------------------------------------------
  // Slot Booking Engine
  // ----------------------------------------------------
  const checkAvailability = (req: SlotAvailabilityCheckRequest): SlotAvailabilityResult => {
    return checkSlotAvailability(req, bookings, docks, vehicles, settings);
  };

  const createBooking = (data: {
    poId: string;
    dockId: string;
    vehicleId: string;
    driverName: string;
    driverPhone?: string;
    licensePlate: string;
    date: string;
    startTimeStr: string;
    remarks?: string;
  }): Booking => {
    const po = purchaseOrders.find((p) => p.id === data.poId);
    if (!po) throw new Error('Data PO tidak ditemukan.');

    const dock = docks.find((d) => d.id === data.dockId);
    if (!dock) throw new Error('Data Dock tidak ditemukan.');

    const vehicle = vehicles.find((v) => v.id === data.vehicleId);
    if (!vehicle) throw new Error('Data Kendaraan tidak ditemukan.');

    // Availability validation check
    const validation = checkSlotAvailability(
      {
        date: data.date,
        startTimeStr: data.startTimeStr,
        vehicleId: data.vehicleId,
        dockId: data.dockId,
      },
      bookings,
      docks,
      vehicles,
      settings
    );

    if (!validation.isAvailable) {
      throw new Error(validation.conflictReason || 'Slot waktu tidak tersedia (bentrok).');
    }

    const durationMinutes = vehicle.defaultDurationMinutes;
    const startMins = timeStrToMinutes(data.startTimeStr);
    const endMins = startMins + durationMinutes;
    const endTimeStr = minutesToTimeStr(endMins);

    const startTimeISO = combineDateAndTime(data.date, data.startTimeStr);
    const endTimeISO = combineDateAndTime(data.date, endTimeStr);

    const bookingCode = `SLOT-${data.date.replace(/-/g, '')}-${dock.dockName.slice(0, 6).replace(/\s/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingCode,
      poId: po.id,
      poNumber: po.poNumber,
      supplierName: po.supplierName,
      itemDescription: po.itemDescription,
      qty: po.qty,
      unit: po.unit,
      dockId: dock.id,
      dockName: dock.dockName,
      vehicleId: vehicle.id,
      vehicleName: vehicle.vehicleName,
      vehicleCode: vehicle.code,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      licensePlate: data.licensePlate.toUpperCase(),
      startTime: startTimeISO,
      endTime: endTimeISO,
      durationMinutes,
      status: 'BOOKED',
      remarks: data.remarks,
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Update PO status to SCHEDULED
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === po.id ? { ...p, status: 'SCHEDULED' } : p))
    );

    addToast({
      type: 'success',
      title: 'Slot Berhasil Dipesan!',
      message: `Kode Booking: ${newBooking.bookingCode} di ${dock.dockName} (${data.startTimeStr} - ${endTimeStr} WIB).`,
    });

    return newBooking;
  };

  const cancelBooking = (id: string, reason: string) => {
    const target = bookings.find((b) => b.id === id);
    if (!target) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'CANCELLED',
              cancellationReason: reason,
            }
          : b
      )
    );

    // Revert PO back to PPIC_APPROVED
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === target.poId ? { ...p, status: 'PPIC_APPROVED' } : p))
    );

    addToast({
      type: 'warning',
      title: 'Booking Dibatalkan',
      message: `Jadwal slot ${target.bookingCode} telah dibatalkan. PO kembali siap dibooking.`,
    });
  };

  // ----------------------------------------------------
  // Warehouse Flow (Gate-In -> Unloading -> Done -> Gate-Out)
  // ----------------------------------------------------
  const advanceBookingStatus = (id: string, targetStatus?: BookingStatus, remarks?: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    const nowISO = new Date().toISOString();
    let nextStatus: BookingStatus = targetStatus || 'ARRIVED';

    if (!targetStatus) {
      if (booking.status === 'BOOKED') nextStatus = 'ARRIVED';
      else if (booking.status === 'ARRIVED') nextStatus = 'UNLOADING';
      else if (booking.status === 'UNLOADING') nextStatus = 'DONE';
    }

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, status: nextStatus, remarks: remarks || b.remarks };
        if (nextStatus === 'ARRIVED' && !b.actualGateIn) {
          updated.actualGateIn = nowISO;
        } else if (nextStatus === 'UNLOADING' && !b.actualStartUnload) {
          updated.actualStartUnload = nowISO;
        } else if (nextStatus === 'DONE' && !b.actualFinishUnload) {
          updated.actualFinishUnload = nowISO;
          updated.actualGateOut = nowISO;
        }
        return updated;
      })
    );

    // Update PO Status accordingly
    let poStatus: PurchaseOrderStatus = 'SCHEDULED';
    if (nextStatus === 'ARRIVED' || nextStatus === 'UNLOADING') {
      poStatus = 'IN_PROGRESS';
    } else if (nextStatus === 'DONE') {
      poStatus = 'COMPLETED';
    }

    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === booking.poId ? { ...p, status: poStatus } : p))
    );

    const statusLabels: Record<BookingStatus, string> = {
      BOOKED: 'Terjadwal (Booked)',
      CONFIRMED: 'Dikonfirmasi (Confirmed)',
      ARRIVED: 'Gate-In / Tiba di Pabrik',
      GATE_IN: 'Gate-In / Masuk Gerbang',
      UNLOADING: 'Mulai Bongkar Muat',
      DONE: 'Selesai & Gate-Out',
      COMPLETED: 'Selesai Dibongkar',
      CANCELLED: 'Dibatalkan',
    };

    addToast({
      type: 'success',
      title: 'Status Diperbarui',
      message: `${booking.driverName} (${booking.licensePlate}) -> ${statusLabels[nextStatus]}`,
    });
  };

  const updateBookingRemarks = (id: string, remarks: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, remarks } : b))
    );
  };

  const updateWarehouseExecution = (
    id: string,
    data: {
      status?: BookingStatus;
      actualGateIn?: string;
      actualStartUnload?: string;
      actualFinishUnload?: string;
      actualGateOut?: string;
      warehouseNotes?: string;
      unloadingStaffName?: string;
      remarks?: string;
    }
  ) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          status: data.status !== undefined ? data.status : b.status,
          actualGateIn: data.actualGateIn !== undefined ? data.actualGateIn : b.actualGateIn,
          actualStartUnload: data.actualStartUnload !== undefined ? data.actualStartUnload : b.actualStartUnload,
          actualFinishUnload: data.actualFinishUnload !== undefined ? data.actualFinishUnload : b.actualFinishUnload,
          actualGateOut: data.actualGateOut !== undefined ? data.actualGateOut : b.actualGateOut,
          warehouseNotes: data.warehouseNotes !== undefined ? data.warehouseNotes : b.warehouseNotes,
          unloadingStaffName: data.unloadingStaffName !== undefined ? data.unloadingStaffName : b.unloadingStaffName,
          remarks: data.remarks !== undefined ? data.remarks : b.remarks,
        };
      })
    );

    // Sync PO status if status changed
    if (data.status) {
      let poStatus: PurchaseOrderStatus = 'SCHEDULED';
      if (data.status === 'ARRIVED' || data.status === 'GATE_IN' || data.status === 'UNLOADING') {
        poStatus = 'IN_PROGRESS';
      } else if (data.status === 'DONE' || data.status === 'COMPLETED') {
        poStatus = 'COMPLETED';
      }
      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === booking.poId ? { ...p, status: poStatus } : p))
      );
    }

    addToast({
      type: 'success',
      title: 'Pencatatan Operasional Disimpan',
      message: `Data eksekusi lapangan untuk ${booking.licensePlate} (${booking.bookingCode}) berhasil diperbarui.`,
    });
  };

  // ----------------------------------------------------
  // Admin Master Data & User Actions
  // ----------------------------------------------------
  const updateVehicle = (vehicle: Vehicle) => {
    setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? vehicle : v)));
    addToast({
      type: 'info',
      title: 'Master Kendaraan Disimpan',
      message: `Durasi ${vehicle.vehicleName} diatur ke ${vehicle.defaultDurationMinutes} menit.`,
    });
  };

  const addVehicle = (vehData: Omit<Vehicle, 'id'>) => {
    const newVeh: Vehicle = {
      ...vehData,
      id: `veh-${Date.now()}`,
    };
    setVehicles((prev) => [...prev, newVeh]);
    addToast({
      type: 'success',
      title: 'Armada Ditambahkan',
      message: `${newVeh.vehicleName} (${newVeh.code}) berhasil ditambahkan ke master data.`,
    });
  };

  const deleteVehicle = (id: string) => {
    const veh = vehicles.find((v) => v.id === id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    addToast({
      type: 'warning',
      title: 'Armada Dihapus',
      message: `${veh?.vehicleName || 'Armada'} telah dihapus dari sistem.`,
    });
  };

  const toggleVehicleStatus = (id: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = !v.isActive;
          addToast({
            type: updated ? 'success' : 'warning',
            title: 'Status Armada Diperbarui',
            message: `${v.vehicleName} sekarang ${updated ? 'AKTIF' : 'NON-AKTIF'}.`,
          });
          return { ...v, isActive: updated };
        }
        return v;
      })
    );
  };

  const updateDock = (dock: Dock) => {
    setDocks((prev) => prev.map((d) => (d.id === dock.id ? dock : d)));
    addToast({
      type: 'info',
      title: 'Master Dock Disimpan',
      message: `Konfigurasi ${dock.dockName} diperbarui.`,
    });
  };

  const addDock = (dockData: Omit<Dock, 'id'>) => {
    const newDock: Dock = {
      ...dockData,
      id: `dock-${Date.now()}`,
    };
    setDocks((prev) => [...prev, newDock]);
    addToast({
      type: 'success',
      title: 'Pintu Dock Ditambahkan',
      message: `${newDock.dockName} siap digunakan untuk operasional.`,
    });
  };

  const deleteDock = (id: string) => {
    const d = docks.find((item) => item.id === id);
    setDocks((prev) => prev.filter((item) => item.id !== id));
    addToast({
      type: 'warning',
      title: 'Pintu Dock Dihapus',
      message: `${d?.dockName || 'Dock'} telah dinonaktifkan permanen dari daftar.`,
    });
  };

  const toggleDockStatus = (id: string) => {
    setDocks((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = !d.isActive;
          addToast({
            type: updated ? 'success' : 'warning',
            title: 'Status Dock Diubah',
            message: `${d.dockName} sekarang ${updated ? 'SIAP OPERASIONAL' : 'STANDBY / MAINTENANCE'}.`,
          });
          return { ...d, isActive: updated };
        }
        return d;
      })
    );
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    };
    setUsers((prev) => [...prev, newUser]);
    addToast({
      type: 'success',
      title: 'Pengguna Baru Terdaftar',
      message: `Akun ${newUser.name} (${newUser.role}) berhasil ditambahkan.`,
    });
  };

  const updateUser = (userData: User) => {
    setUsers((prev) => prev.map((u) => (u.id === userData.id ? userData : u)));
    if (currentUser.id === userData.id) {
      setCurrentUser(userData);
    }
    addToast({
      type: 'info',
      title: 'Profil Pengguna Disimpan',
      message: `Data ${userData.name} telah diperbarui.`,
    });
  };

  const deleteUser = (id: string) => {
    if (id === currentUser.id) {
      addToast({
        type: 'error',
        title: 'Gagal Menghapus Akun',
        message: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.',
      });
      return;
    }
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addToast({
      type: 'warning',
      title: 'Akun Pengguna Dihapus',
      message: `Pengguna ${target?.name || id} telah dihapus dari sistem.`,
    });
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = u.isActive === false ? true : false;
          addToast({
            type: updated ? 'success' : 'warning',
            title: 'Status Akun Pengguna Diubah',
            message: `Akun ${u.name} sekarang ${updated ? 'AKTIF' : 'DINONAKTIFKAN'}.`,
          });
          return { ...u, isActive: updated };
        }
        return u;
      })
    );
  };

  const addHoliday = (holData: Omit<OperationalHoliday, 'id'>) => {
    const newHol: OperationalHoliday = {
      ...holData,
      id: `hol-${Date.now()}`,
    };
    setHolidays((prev) => [...prev, newHol]);
    addToast({
      type: 'success',
      title: 'Hari Libur / Shutdown Ditetapkan',
      message: `Tanggal ${newHol.date} (${newHol.description}) berhasil didaftarkan.`,
    });
  };

  const updateHoliday = (hol: OperationalHoliday) => {
    setHolidays((prev) => prev.map((h) => (h.id === hol.id ? hol : h)));
    addToast({
      type: 'info',
      title: 'Jadwal Libur Diperbarui',
      message: `Data ${hol.date} telah diperbarui.`,
    });
  };

  const deleteHoliday = (id: string) => {
    const h = holidays.find((item) => item.id === id);
    setHolidays((prev) => prev.filter((item) => item.id !== id));
    addToast({
      type: 'warning',
      title: 'Hari Libur Dihapus',
      message: `Jadwal libur ${h?.date || ''} telah dihapus dari kalender pabrik.`,
    });
  };

  const updateSettings = (newSettings: OperationalSettings) => {
    setSettings(newSettings);
    addToast({
      type: 'success',
      title: 'Jam Operasional Disimpan',
      message: `Pabrik: ${newSettings.factoryOpenTime} - ${newSettings.factoryCloseTime} (Batas Booking: ${newSettings.maxArrivalBookingTime})`,
    });
  };

  const resetToDefaultData = () => {
    setVehicles(INITIAL_VEHICLES);
    setDocks(INITIAL_DOCKS);
    setPurchaseOrders(INITIAL_POS);
    setBookings(INITIAL_BOOKINGS);
    setSettings(INITIAL_SETTINGS);
    setHolidays(INITIAL_HOLIDAYS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.clear();
    addToast({
      type: 'info',
      title: 'Data Direset',
      message: 'Semua master data, PO, dan jadwal dikembalikan ke data simulasi default.',
    });
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        users,
        currentRoute,
        currentSubView,
        loginError,
        vehicles,
        docks,
        purchaseOrders,
        bookings,
        settings,
        holidays,
        selectedDate,
        activeView,
        notifications,
        searchQuery,
        login,
        demoLogin,
        logout,
        setCurrentUser,
        switchRole,
        navigateToRoute,
        setCurrentSubView,
        setSelectedDate,
        setActiveView,
        setSearchQuery,
        addToast,
        removeToast,
        createPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        submitPoToPpic,
        approvePpicPo,
        rejectPpicPo,
        cancelPurchaseOrder,
        checkAvailability,
        createBooking,
        cancelBooking,
        advanceBookingStatus,
        updateBookingRemarks,
        updateWarehouseExecution,
        updateVehicle,
        addVehicle,
        deleteVehicle,
        toggleVehicleStatus,
        updateDock,
        addDock,
        deleteDock,
        toggleDockStatus,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addHoliday,
        updateHoliday,
        deleteHoliday,
        updateSettings,
        resetToDefaultData,
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
