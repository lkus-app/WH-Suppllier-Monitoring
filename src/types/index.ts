export type UserRole = 'ADMIN' | 'PURCHASING' | 'PPIC' | 'SUPPLIER' | 'WAREHOUSE';

export type DashboardRoute = 
  | '/login'
  | '/dashboard/admin'
  | '/dashboard/purchasing'
  | '/dashboard/ppic'
  | '/dashboard/supplier'
  | '/dashboard/warehouse';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token?: string;
  loginAt?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  iconName: string;
  badge?: string | number;
  badgeColor?: string;
  description?: string;
  allowedRoles: UserRole[];
  targetSubView: string;
}

export interface RoleConfig {
  role: UserRole;
  title: string;
  badgeLabel: string;
  defaultPath: DashboardRoute;
  colorScheme: {
    primary: string;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
  };
  allowedViews: string[];
}

export type DockType = 'GENERAL' | 'LIQUID' | 'CONTAINER' | 'LIQUID_ISOTANK';

export type POStatus = 
  | 'DRAFT' 
  | 'WAITING_PPIC_REVIEW' 
  | 'READY_FOR_BOOKING' 
  | 'BOOKED' 
  | 'COMPLETED' 
  | 'CANCELLED';

// Backward compatibility alias
export type PurchaseOrderStatus = POStatus | 'PPIC_APPROVED' | 'SCHEDULED' | 'IN_PROGRESS';

export type PriorityLevel = 'NORMAL' | 'URGENT';

export type BookingStatus = 
  | 'CONFIRMED'
  | 'GATE_IN'
  | 'UNLOADING'
  | 'COMPLETED'
  | 'CANCELLED'
  // Backward compatibility aliases
  | 'BOOKED'
  | 'ARRIVED'
  | 'DONE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  supplierName?: string;
  department?: string;
  phoneNumber?: string;
  isActive?: boolean;
  avatar?: string;
}

export interface VehicleType {
  id: string;
  name: string;              // Engkel, Double Engkel, Fuso, Wingbox 10 Ton, Wingbox 20 Ton, Isotank, Kontainer
  durationMinutes: number;   // 60, 90, 120, 180, 240
  isActive: boolean;
  // Extended helper fields
  vehicleName: string;
  code: string;
  allowedDockTypes: DockType[];
  description?: string;
  defaultDurationMinutes: number;
  maxTonnageCapacity?: number;
}

// Backward compatibility alias
export type Vehicle = VehicleType;

export interface Dock {
  id: string;
  name: string;              // Dock 1, Dock 2, Dock Khusus Cairan/Isotank
  dockName: string;
  dockType: DockType | string; // GENERAL, LIQUID, CONTAINER, LIQUID_ISOTANK
  isActive: boolean;
  maxTonnage?: number;
  notes?: string;
  features?: string[];
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  itemDescription: string;
  quantity: number;
  qty?: number; // fallback alias for quantity
  unit: string;
  status: POStatus;
  priority: PriorityLevel;
  
  // Input oleh PPIC
  etaStartDate?: string; // YYYY-MM-DD
  etaEndDate?: string;   // YYYY-MM-DD
  ppicEtaDateStart?: string; // backward compat
  ppicEtaDateEnd?: string;   // backward compat
  ppicNotes?: string;
  
  createdBy: string;         // ID User Purchasing
  reviewedBy?: string;       // ID User PPIC
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "BKG-202608-001"
  poId: string;
  poNumber: string;
  supplierName: string;
  itemDescription: string;
  qty: number;
  unit: string;
  
  dockId: string;
  dockName?: string;
  dock?: Dock;
  
  vehicleTypeId?: string;
  vehicleId?: string;
  vehicleName?: string;
  vehicleCode?: string;
  vehicleType?: VehicleType;
  
  driverName: string;
  driverPhone?: string;
  licensePlate: string; // No Polisi
  
  // Date and Time (ISO strings)
  bookingDate?: string; // Tanggal kedatangan "YYYY-MM-DD"
  startTime: string; // e.g. "2026-08-31T09:00:00"
  endTime: string;   // e.g. "2026-08-31T10:30:00"
  durationMinutes: number;
  
  // Relation
  purchaseOrder?: PurchaseOrder;

  // Warehouse Execution
  actualGateIn?: string;
  actualStartUnload?: string;
  actualFinishUnload?: string;
  actualGateOut?: string;
  warehouseNotes?: string;
  unloadingStaffName?: string;
  
  status: BookingStatus;
  remarks?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface OperationalHoliday {
  id: string;
  date: string; // "YYYY-MM-DD"
  description: string;
  isLocked?: boolean;
}

export interface SystemSetting {
  id: string;
  factoryOpenTime: string;       // "08:00"
  maxArrivalBookingTime: string; // "19:00"
  factoryCloseTime: string;      // "23:00"
  slotIntervalMinutes: number;   // 30
  updatedAt?: string;
}

export interface OperationalSettings {
  factoryOpenTime: string;       // "08:00"
  maxArrivalBookingTime: string; // "19:00"
  factoryCloseTime: string;      // "23:00"
  slotIntervalMinutes: number;   // 30
}

export interface SlotAvailabilityCheckRequest {
  date: string; // "YYYY-MM-DD"
  startTimeStr: string; // "HH:mm"
  vehicleId: string;
  dockId?: string; // Optional preferred dock
  excludeBookingId?: string;
}

export interface SlotAvailabilityResult {
  isAvailable: boolean;
  conflictReason?: string;
  conflictingBooking?: Booking;
  calculatedEndTimeStr: string;
  durationMinutes: number;
  assignedDock?: Dock;
  alternativeSuggestions: Array<{
    dockId: string;
    dockName: string;
    startTimeStr: string;
    endTimeStr: string;
    type: 'SAME_TIME_DIFF_DOCK' | 'NEXT_AVAILABLE_SLOT';
  }>;
}

export interface TimeSlotOption {
  timeStr: string; // "08:00", "08:30"
  hour: number;
  minute: number;
  isPastMaxArrival: boolean; // >= 19:00
  isAvailable: boolean;
  conflictsByDock: Record<string, boolean>; // dockId -> isBusy
}
