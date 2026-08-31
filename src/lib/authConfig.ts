import { DashboardRoute, NavigationItem, RoleConfig, User, UserRole } from '../types';

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  PURCHASING: {
    role: 'PURCHASING',
    title: 'Purchasing & Procurement Portal',
    badgeLabel: 'Purchasing Dept',
    defaultPath: '/dashboard/purchasing',
    colorScheme: {
      primary: '#2563eb',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700 border border-blue-200',
    },
    allowedViews: ['PURCHASING_POS', 'PURCHASING_NEW_PO', 'PURCHASING_DISPATCH', 'TIMELINE_READONLY'],
  },
  PPIC: {
    role: 'PPIC',
    title: 'PPIC Planning & ETA Control',
    badgeLabel: 'PPIC Planning',
    defaultPath: '/dashboard/ppic',
    colorScheme: {
      primary: '#0284c7',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-700',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700 border border-sky-200',
    },
    allowedViews: ['PPIC_VERIFY', 'PPIC_ETA_SETUP', 'PPIC_MONITOR_SLOTS', 'TIMELINE_READONLY', 'ANALYTICS'],
  },
  SUPPLIER: {
    role: 'SUPPLIER',
    title: 'Supplier Delivery & Slot Booking Portal',
    badgeLabel: 'Vendor / Supplier',
    defaultPath: '/dashboard/supplier',
    colorScheme: {
      primary: '#059669',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700 border border-emerald-200',
    },
    allowedViews: ['SUPPLIER_WIZARD', 'SUPPLIER_MY_BOOKINGS', 'SUPPLIER_QR_PASS', 'TIMELINE_READONLY'],
  },
  WAREHOUSE: {
    role: 'WAREHOUSE',
    title: 'Warehouse Gate & Dock Operations',
    badgeLabel: 'Warehouse Receiving',
    defaultPath: '/dashboard/warehouse',
    colorScheme: {
      primary: '#d97706',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700 border border-amber-200',
    },
    allowedViews: ['WAREHOUSE_TIMELINE', 'WAREHOUSE_QUEUE', 'WAREHOUSE_KANBAN', 'WAREHOUSE_HISTORY'],
  },
  ADMIN: {
    role: 'ADMIN',
    title: 'Logistics Control Center & Master Data',
    badgeLabel: 'Super Admin',
    defaultPath: '/dashboard/admin',
    colorScheme: {
      primary: '#7c3aed',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700 border border-purple-200',
    },
    allowedViews: [
      'ADMIN_VEHICLES',
      'ADMIN_DOCKS',
      'ADMIN_USERS',
      'ADMIN_HOURS',
      'ADMIN_ANALYTICS',
      'ADMIN_AUDIT',
      'TIMELINE_READONLY',
    ],
  },
};

export const ROLE_NAVIGATION: Record<UserRole, NavigationItem[]> = {
  PURCHASING: [
    {
      id: 'purchasing-pos',
      label: 'List Purchase Order',
      iconName: 'FileText',
      badge: 'Semua PO',
      badgeColor: 'bg-blue-500/20 text-blue-300',
      description: 'Daftar & status PO pengadaan bahan baku',
      allowedRoles: ['PURCHASING', 'ADMIN'],
      targetSubView: 'LIST_PO',
    },
    {
      id: 'purchasing-create',
      label: 'Upload / Buat PO Baru',
      iconName: 'PlusCircle',
      badge: 'Baru',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      description: 'Form input PO baru & kirim ke PPIC',
      allowedRoles: ['PURCHASING', 'ADMIN'],
      targetSubView: 'CREATE_PO',
    },
    {
      id: 'purchasing-dispatch',
      label: 'Status Pengiriman',
      iconName: 'Truck',
      description: 'Tracking status pengiriman & realisasi slot',
      allowedRoles: ['PURCHASING', 'ADMIN'],
      targetSubView: 'DISPATCH_STATUS',
    },
  ],
  PPIC: [
    {
      id: 'ppic-verify',
      label: 'Verifikasi PO & Approval',
      iconName: 'CheckSquare',
      badge: 'Pending',
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
      description: 'Review PO dari Purchasing & persetujuan window',
      allowedRoles: ['PPIC', 'ADMIN'],
      targetSubView: 'VERIFY_PO',
    },
    {
      id: 'ppic-eta',
      label: 'Atur Window ETA',
      iconName: 'CalendarRange',
      description: 'Konfigurasi rentang tanggal kedatangan barang',
      allowedRoles: ['PPIC', 'ADMIN'],
      targetSubView: 'SET_ETA',
    },
    {
      id: 'ppic-monitor',
      label: 'Monitor Jadwal & Slot',
      iconName: 'CalendarDays',
      description: 'Gantt Timeline keterisian slot per pintu dock',
      allowedRoles: ['PPIC', 'ADMIN'],
      targetSubView: 'MONITOR_SLOTS',
    },
  ],
  SUPPLIER: [
    {
      id: 'supplier-book',
      label: 'Booking Jadwal PO',
      iconName: 'CalendarPlus',
      badge: 'Slot Wizard',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      description: 'Pilih slot tanggal, armada, driver, dan docking gate',
      allowedRoles: ['SUPPLIER', 'ADMIN'],
      targetSubView: 'BOOKING_WIZARD',
    },
    {
      id: 'supplier-tickets',
      label: 'Tiket & Jadwal Saya',
      iconName: 'Ticket',
      badge: 'QR Pass',
      badgeColor: 'bg-blue-500/20 text-blue-300',
      description: 'Daftar booking aktif, tiket barcode & status gate',
      allowedRoles: ['SUPPLIER', 'ADMIN'],
      targetSubView: 'MY_SCHEDULES',
    },
  ],
  WAREHOUSE: [
    {
      id: 'wh-timeline',
      label: 'Timeline Dock Hari Ini',
      iconName: 'KanbanSquare',
      badge: 'Live Gantt',
      badgeColor: 'bg-amber-500/20 text-amber-300',
      description: 'Visualisasi slot real-time 5 pintu dock pabrik',
      allowedRoles: ['WAREHOUSE', 'ADMIN'],
      targetSubView: 'DOCK_TIMELINE',
    },
    {
      id: 'wh-queue',
      label: 'Antrean Masuk & Check-In',
      iconName: 'ShieldCheck',
      badge: 'Gate In',
      badgeColor: 'bg-blue-500/20 text-blue-300',
      description: 'Verifikasi surat jalan, scan barcode, & mulai bongkar',
      allowedRoles: ['WAREHOUSE', 'ADMIN'],
      targetSubView: 'GATE_QUEUE',
    },
    {
      id: 'wh-history',
      label: 'Riwayat Bongkar',
      iconName: 'History',
      description: 'Catatan waktu aktual gate-in, unload, dan gate-out',
      allowedRoles: ['WAREHOUSE', 'ADMIN'],
      targetSubView: 'UNLOAD_HISTORY',
    },
  ],
  ADMIN: [
    {
      id: 'admin-vehicles',
      label: 'Master Kendaraan & Durasi',
      iconName: 'Truck',
      description: 'Standard Unloading Time per tipe armada truk',
      allowedRoles: ['ADMIN'],
      targetSubView: 'MASTER_VEHICLES',
    },
    {
      id: 'admin-docks',
      label: 'Master Pintu Dock',
      iconName: 'Warehouse',
      description: 'Kapasitas tonase, tipe bay, & status operasional',
      allowedRoles: ['ADMIN'],
      targetSubView: 'MASTER_DOCKS',
    },
    {
      id: 'admin-hours',
      label: 'Konfigurasi Jam & Hari Libur',
      iconName: 'Clock',
      badge: 'Holiday Calendar',
      badgeColor: 'bg-amber-500/20 text-amber-300',
      description: 'Parameter sistem, jam operasional, & hari libur pabrik',
      allowedRoles: ['ADMIN'],
      targetSubView: 'SYSTEM_SETTINGS',
    },
    {
      id: 'admin-users',
      label: 'User Management (RBAC)',
      iconName: 'Users',
      badge: '5 Roles',
      badgeColor: 'bg-purple-500/20 text-purple-300',
      description: 'Manajemen akun, departemen, dan hak akses',
      allowedRoles: ['ADMIN'],
      targetSubView: 'USER_MANAGEMENT',
    },
    {
      id: 'admin-logbook',
      label: 'Logbook Bongkaran & Audit',
      iconName: 'ClipboardList',
      badge: 'Actual KPI',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      description: 'Pencatatan waktu aktual gate in/out, durasi & deviasi SOP',
      allowedRoles: ['ADMIN', 'WAREHOUSE'],
      targetSubView: 'LOGBOOK_REPORT',
    },
    {
      id: 'admin-analytics',
      label: 'Utilisasi Dock & Analitik',
      iconName: 'BarChart3',
      badge: 'Recharts',
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
      description: 'Analisis kepadatan mingguan & dock tersibuk',
      allowedRoles: ['ADMIN', 'PPIC'],
      targetSubView: 'ANALYTICS',
    },
  ],
};

export interface DemoUserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  department: string;
  supplierName?: string;
  badge: string;
  roleDescription: string;
}

export const DEMO_ACCOUNTS: DemoUserAccount[] = [
  {
    id: 'user-admin',
    name: 'Budi Santoso, ST',
    email: 'admin.logistik@pabrik.co.id',
    role: 'ADMIN',
    password: 'password123',
    department: 'Plant Operations & IT',
    badge: 'Super Admin',
    roleDescription: 'Akses penuh seluruh master data, konfigurasi dock & analitik pabrik',
  },
  {
    id: 'user-purchasing',
    name: 'Rina Wijaya, SE',
    email: 'purchasing@pabrik.co.id',
    role: 'PURCHASING',
    password: 'password123',
    department: 'Procurement Division',
    badge: 'Purchasing',
    roleDescription: 'Membuat Purchase Order baru dan memantau status pengiriman vendor',
  },
  {
    id: 'user-ppic',
    name: 'Hendra Pratama',
    email: 'ppic.planning@pabrik.co.id',
    role: 'PPIC',
    password: 'password123',
    department: 'Production Planning & Control',
    badge: 'PPIC Planner',
    roleDescription: 'Verifikasi PO & menentukan window ETA kedatangan armada',
  },
  {
    id: 'user-supplier-1',
    name: 'Joko Susilo',
    email: 'dispatch@sumberlogistik.com',
    role: 'SUPPLIER',
    password: 'password123',
    department: 'Logistics Vendor',
    supplierName: 'PT Sumber Logistik Prima',
    badge: 'Supplier Vendor',
    roleDescription: 'Booking slot dock pengiriman barang sesuai rentang ETA PPIC',
  },
  {
    id: 'user-warehouse',
    name: 'Agus Sutrisno',
    email: 'gudang.receiving@pabrik.co.id',
    role: 'WAREHOUSE',
    password: 'password123',
    department: 'Warehouse Receiving & Gate Control',
    badge: 'Warehouse Gate',
    roleDescription: 'Check-in armada, monitoring Gantt timeline & eksekusi bongkar muat',
  },
];

export function getDefaultRouteForRole(role: UserRole): DashboardRoute {
  switch (role) {
    case 'PURCHASING':
      return '/dashboard/purchasing';
    case 'PPIC':
      return '/dashboard/ppic';
    case 'SUPPLIER':
      return '/dashboard/supplier';
    case 'WAREHOUSE':
      return '/dashboard/warehouse';
    case 'ADMIN':
      return '/dashboard/admin';
    default:
      return '/dashboard/warehouse';
  }
}

export function isRouteAllowedForRole(role: UserRole, targetRoute: DashboardRoute): boolean {
  if (targetRoute === '/login') return true;
  if (role === 'ADMIN') return true; // Admin has super-user bypass
  
  const expectedRoute = getDefaultRouteForRole(role);
  return targetRoute === expectedRoute;
}
