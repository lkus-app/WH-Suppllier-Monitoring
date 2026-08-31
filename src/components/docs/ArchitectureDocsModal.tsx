import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  FileCode,
  FolderTree,
  KeyRound,
  Layers,
  Play,
  Sparkles,
  Terminal,
  TestTube2,
  Workflow,
  X,
} from 'lucide-react';

interface ArchitectureDocsModalProps {
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'FOLDER' | 'PRISMA' | 'SEED_AND_TEST' | 'API_LOGIC' | 'ALGORITHM'>('SEED_AND_TEST');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const seedScriptText = `// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD_HASH = '$2a$10$eA3pmsK7k52a11bTzK9o6OCGZ2r1jSjJ6Wd7k8.B5bW0b6c6qW7uG'; // Password123!

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. System Settings
  await prisma.systemSetting.upsert({
    where: { id: 'GLOBAL_CONFIG' },
    update: { factoryOpenTime: '08:00', maxArrivalBookingTime: '19:00', factoryCloseTime: '23:00', slotIntervalMinutes: 30 },
    create: { id: 'GLOBAL_CONFIG', factoryOpenTime: '08:00', maxArrivalBookingTime: '19:00', factoryCloseTime: '23:00', slotIntervalMinutes: 30 },
  });

  // 2. User Accounts
  const users = [
    { email: 'admin@factory.com', name: 'System Administrator', role: 'ADMIN' },
    { email: 'purchasing@factory.com', name: 'Budi Santoso', role: 'PURCHASING' },
    { email: 'ppic@factory.com', name: 'Siti Rahmawati', role: 'PPIC' },
    { email: 'warehouse@factory.com', name: 'Agus Pratama', role: 'WAREHOUSE' },
    { email: 'supplier@vendor.com', name: 'Hendra Wijaya', role: 'SUPPLIER', supplierName: 'PT Sumber Makmur' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role as any, supplierName: u.supplierName, passwordHash: DEFAULT_PASSWORD_HASH },
      create: { email: u.email, name: u.name, role: u.role as any, supplierName: u.supplierName, passwordHash: DEFAULT_PASSWORD_HASH },
    });
  }

  // 3. Master Vehicle Types & Locked SOP Unloading Times
  const vehicles = [
    { code: 'CDE', vehicleName: 'Engkel (CDE)', defaultDurationMinutes: 60, allowedDockTypes: ['GENERAL'] },
    { code: 'CDD', vehicleName: 'Double Engkel (CDD)', defaultDurationMinutes: 90, allowedDockTypes: ['GENERAL'] },
    { code: 'FUSO', vehicleName: 'Fuso', defaultDurationMinutes: 120, allowedDockTypes: ['GENERAL'] },
    { code: 'WB10', vehicleName: 'Wingbox 10 Ton', defaultDurationMinutes: 120, allowedDockTypes: ['GENERAL'] },
    { code: 'WB20', vehicleName: 'Wingbox 20 Ton', defaultDurationMinutes: 180, allowedDockTypes: ['GENERAL'] },
    { code: 'ISOTANK', vehicleName: 'Isotank', defaultDurationMinutes: 180, allowedDockTypes: ['LIQUID_ISOTANK'] },
    { code: 'CONT', vehicleName: 'Kontainer 20/40 ft', defaultDurationMinutes: 240, allowedDockTypes: ['CONTAINER', 'GENERAL'] },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { code: v.code },
      update: { vehicleName: v.vehicleName, defaultDurationMinutes: v.defaultDurationMinutes, allowedDockTypes: v.allowedDockTypes as any },
      create: { code: v.code, vehicleName: v.vehicleName, defaultDurationMinutes: v.defaultDurationMinutes, allowedDockTypes: v.allowedDockTypes as any },
    });
  }

  // 4. Master Docks
  const docks = [
    { dockName: 'Dock 1 (General Cargo)', dockType: 'GENERAL', maxTonnage: 30.0 },
    { dockName: 'Dock 2 (General Cargo)', dockType: 'GENERAL', maxTonnage: 30.0 },
    { dockName: 'Dock 3 (Liquid / Isotank Dedicated)', dockType: 'LIQUID_ISOTANK', maxTonnage: 35.0 },
    { dockName: 'Dock 4 (Container High Bay)', dockType: 'CONTAINER', maxTonnage: 45.0 },
  ];
  for (const d of docks) {
    await prisma.dock.upsert({
      where: { dockName: d.dockName },
      update: { dockType: d.dockType as any, maxTonnage: d.maxTonnage },
      create: { dockName: d.dockName, dockType: d.dockType as any, maxTonnage: d.maxTonnage },
    });
  }

  // 5. Sample Purchase Orders
  await prisma.purchaseOrder.upsert({
    where: { poNumber: 'PO-2026-001' },
    update: { supplierName: 'PT Sumber Makmur', itemDescription: 'Karton Box Corrugated', qty: 5000, unit: 'PCS', status: 'PPIC_APPROVED' },
    create: { poNumber: 'PO-2026-001', supplierName: 'PT Sumber Makmur', itemDescription: 'Karton Box Corrugated', qty: 5000, unit: 'PCS', status: 'PPIC_APPROVED' },
  });

  await prisma.purchaseOrder.upsert({
    where: { poNumber: 'PO-2026-002' },
    update: { supplierName: 'PT Kimia Prima', itemDescription: 'Raw Chemical Liquid', qty: 20, unit: 'TON', status: 'DRAFT' },
    create: { poNumber: 'PO-2026-002', supplierName: 'PT Kimia Prima', itemDescription: 'Raw Chemical Liquid', qty: 20, unit: 'TON', status: 'DRAFT' },
  });

  console.log('✅ Seeding completed successfully!');
}

main().finally(() => prisma.$disconnect());`;

  const envExampleText = `# .env.example
# 1. DATABASE CONNECTION
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dock_slot_db?schema=public"

# 2. NEXTAUTH & SECURITY
NEXTAUTH_SECRET="super-secret-random-jwt-key-change-this-in-production-min-32-chars"
AUTH_SECRET="super-secret-random-jwt-key-change-this-in-production-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# 3. AI STUDIO / GEMINI (Optional Assistant)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# 4. APP URL
APP_URL="http://localhost:3000"`;

  const localRunGuideText = `# ==========================================================
# PANDUAN MENJALANKAN APLIKASI SECARA LOKAL (LOCAL RUN GUIDE)
# ==========================================================

# 1. Clone repository & install dependencies
git clone <repo-url>
cd dockslot-management-app
npm install

# 2. Salin dan sesuaikan file environment
cp .env.example .env

# 3. Setup database PostgreSQL & jalankan migrasi Prisma
npx prisma migrate dev --name init_dock_schema

# 4. Jalankan seeder database otomatis (Users, Docks, Vehicles, Settings, PO)
npx prisma db seed

# 5. Jalankan development server
npm run dev

# Buka browser di: http://localhost:3000
# Akun default:
#   - Admin:      admin@factory.com      | Password: Password123!
#   - Purchasing: purchasing@factory.com | Password: Password123!
#   - PPIC:       ppic@factory.com       | Password: Password123!
#   - Warehouse:  warehouse@factory.com  | Password: Password123!
#   - Supplier:   supplier@vendor.com    | Password: Password123!`;

  const folderStructureText = `dockslot-nextjs-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── vehicles/page.tsx
│   │   │   ├── docks/page.tsx
│   │   │   └── operating-hours/page.tsx
│   │   ├── purchasing/
│   │   │   ├── po/page.tsx
│   │   │   └── po/new/page.tsx
│   │   ├── ppic/
│   │   │   └── review-eta/page.tsx
│   │   ├── supplier/
│   │   │   ├── booking-wizard/page.tsx
│   │   │   ├── my-slots/page.tsx
│   │   │   └── gate-pass/[id]/page.tsx
│   │   ├── warehouse/
│   │   │   ├── timeline-gantt/page.tsx
│   │   │   ├── kanban-queue/page.tsx
│   │   │   └── kiosk-tv/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── slots/
│   │   │   ├── check-availability/route.ts
│   │   │   ├── book/route.ts
│   │   │   └── suggest-alternatives/route.ts
│   │   ├── po/
│   │   │   ├── route.ts
│   │   │   └── [id]/approve-ppic/route.ts
│   │   ├── warehouse/
│   │   │   └── [id]/advance-status/route.ts
│   │   └── master/
│   │       ├── vehicles/route.ts
│   │       └── docks/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (Button, Dialog, Badge, Calendar, Tooltip)
│   ├── timeline/
│   │   ├── HorizontalGanttTimeline.tsx
│   │   ├── TimelineHourAxis.tsx
│   │   ├── DockRow.tsx
│   │   └── BookingBlock.tsx
│   ├── supplier/
│   │   ├── StepPoVerification.tsx
│   │   ├── StepArmadaDetails.tsx
│   │   ├── StepVisualSlotGrid.tsx
│   │   └── GatePassQrSlip.tsx
│   └── warehouse/
│       ├── KanbanColumn.tsx
│       └── LiveGateActionButtons.tsx
├── lib/
│   ├── prisma.ts (Prisma Client Singleton)
│   ├── slotEngine.ts (Conflict Detector & Suggestions Engine)
│   ├── rbac.ts (Role Permissions Guard)
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── types/
    └── index.ts`;

  const prismaSchemaText = `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  ADMIN
  PURCHASING
  PPIC
  SUPPLIER
  WAREHOUSE
}

enum DockType {
  GENERAL
  LIQUID_ISOTANK
  CONTAINER
}

enum PurchaseOrderStatus {
  DRAFT
  PPIC_APPROVED
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum BookingStatus {
  BOOKED
  ARRIVED
  UNLOADING
  DONE
  CANCELLED
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String
  role         UserRole  @default(SUPPLIER)
  supplierName String?
  createdAt    DateTime  @default(now())
}

model Vehicle {
  id                     String     @id @default(uuid())
  vehicleName            String     @unique
  code                   String     @unique
  defaultDurationMinutes Int
  allowedDockTypes       DockType[]
  isActive               Boolean    @default(true)
}

model Dock {
  id         String    @id @default(uuid())
  dockName   String    @unique
  dockType   DockType  @default(GENERAL)
  maxTonnage Decimal?  @db.Decimal(10, 2)
  isActive   Boolean   @default(true)
}

model PurchaseOrder {
  id               String              @id @default(uuid())
  poNumber         String              @unique
  supplierName     String
  itemDescription  String
  qty              Decimal             @db.Decimal(12, 2)
  unit             String
  ppicEtaDateStart DateTime?
  ppicEtaDateEnd   DateTime?
  status           PurchaseOrderStatus @default(DRAFT)
  booking          Booking?
}

model Booking {
  id                 String        @id @default(uuid())
  bookingCode        String        @unique
  poId               String        @unique
  purchaseOrder      PurchaseOrder @relation(fields: [poId], references: [id])
  dockId             String
  dock               Dock          @relation(fields: [dockId], references: [id])
  vehicleId          String
  vehicle            Vehicle       @relation(fields: [vehicleId], references: [id])
  driverName         String
  licensePlate       String
  startTime          DateTime
  endTime            DateTime
  durationMinutes    Int
  actualGateIn       DateTime?
  actualStartUnload  DateTime?
  actualFinishUnload DateTime?
  actualGateOut      DateTime?
  status             BookingStatus @default(BOOKED)

  @@index([dockId, startTime, endTime])
}`;

  const apiLogicText = `// app/api/slots/check-availability/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { date, startTimeStr, vehicleId, dockId } = await req.json();

  // 1. Get Vehicle & Duration
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 400 });

  const durationMinutes = vehicle.defaultDurationMinutes;
  const startDateTime = new Date(\`\${date}T\${startTimeStr}:00\`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

  // 2. Validate Operational Limits (08:00 - 19:00 max arrival, 23:00 close)
  const startHour = startDateTime.getHours();
  const endHour = endDateTime.getHours();
  const endMinute = endDateTime.getMinutes();

  if (startHour < 8 || startHour > 19) {
    return NextResponse.json({
      isAvailable: false,
      reason: 'Slot arrival must be between 08:00 and 19:00 WIB'
    });
  }

  if (endHour > 23 || (endHour === 23 && endMinute > 0)) {
    return NextResponse.json({
      isAvailable: false,
      reason: 'Unloading must finish before 23:00 factory closing'
    });
  }

  // 3. Query Overlap using standard interval overlap formula:
  // (New_Start < Existing_End) AND (New_End > Existing_Start)
  const conflict = await prisma.booking.findFirst({
    where: {
      dockId: dockId,
      status: { not: 'CANCELLED' },
      AND: [
        { startTime: { lt: endDateTime } },
        { endTime: { gt: startDateTime } },
      ],
    },
    include: { vehicle: true },
  });

  if (conflict) {
    return NextResponse.json({
      isAvailable: false,
      conflictReason: \`Bertabrakan dengan \${conflict.licensePlate} (\${conflict.startTime} - \${conflict.endTime})\`,
    });
  }

  return NextResponse.json({
    isAvailable: true,
    startTime: startDateTime,
    endTime: endDateTime,
    durationMinutes,
  });
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Dokumentasi Teknis & Arsitektur Sistem (Next.js & Prisma)
              </h2>
              <p className="text-xs text-slate-400">
                Arsitektur folder modular, skema database, algoritma validasi slot, & API endpoint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('SEED_AND_TEST')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'SEED_AND_TEST'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TestTube2 className="w-4 h-4" />
            <span>1. DB Seeder, .env & E2E Test Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('FOLDER')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'FOLDER'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>2. Arsitektur Folder</span>
          </button>
          <button
            onClick={() => setActiveTab('PRISMA')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'PRISMA'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>3. Skema Prisma (schema.prisma)</span>
          </button>
          <button
            onClick={() => setActiveTab('API_LOGIC')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'API_LOGIC'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>4. Logika API Function</span>
          </button>
          <button
            onClick={() => setActiveTab('ALGORITHM')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'ALGORITHM'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>5. Algoritma Cek Bentrok</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs flex-1 bg-slate-950">
          {activeTab === 'SEED_AND_TEST' && (
            <div className="font-sans space-y-5 text-xs text-slate-300">
              {/* E2E Test Flow Checklist Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-lg space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <TestTube2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Checklist Skenario Pengujian (End-to-End Test Plan)
                    </h3>
                    <p className="text-xs text-emerald-300/80">
                      5 Alur pengujian kolaborasi lintas divisi dari PO hingga Gate-Out
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-black text-[11px] flex items-center justify-center border border-blue-500/30">
                        1
                      </span>
                      <strong className="text-white text-xs">Login Purchasing ➔ Input PO Baru</strong>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-7">
                      Pilih role Purchasing, klik "Buat PO Baru", isi nomor PO, nama vendor (PT Sumber Makmur), item, dan kuantiti. Status awal: <code className="text-amber-400">DRAFT / WAITING PPIC</code>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-[11px] flex items-center justify-center border border-indigo-500/30">
                        2
                      </span>
                      <strong className="text-white text-xs">Login PPIC ➔ Approve PO & Set Window ETA</strong>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-7">
                      Pindah ke role PPIC, buka menu "Review PO & ETA", tentukan rentang tanggal kedatangan pabrik, lalu klik "Approve PO". Status berubah menjadi <code className="text-emerald-400">READY_FOR_BOOKING</code>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center border border-emerald-500/30">
                        3
                      </span>
                      <strong className="text-white text-xs">Login Supplier ➔ Pilih Armada Wingbox 20T</strong>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-7">
                      Pindah ke role Supplier, klik "Booking Slot", pilih PO yang sudah diapprove, pilih armada Wingbox 20 Ton (sistem otomatis mengunci durasi 3 jam / 180 mnt), pilih tanggal & jam, verifikasi slot bentrok/melebihi jam 19.00 dinonaktifkan, lalu submit.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-black text-[11px] flex items-center justify-center border border-purple-500/30">
                        4
                      </span>
                      <strong className="text-white text-xs">Login Warehouse ➔ Live Timeline & Simulasi Gate</strong>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-7">
                      Pindah ke role Warehouse, buka "Live Timeline", lihat blok slot warna biru/hijau. Klik slot atau buka Kanban/Logbook lalu uji tombol alur fisik: <span className="text-amber-300 font-semibold">Gate In ➔ Start Unloading ➔ Finish Unload & Gate Out</span>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-black text-[11px] flex items-center justify-center border border-rose-500/30">
                        5
                      </span>
                      <strong className="text-white text-xs">Login Admin ➔ Ubah Parameter Durasi SOP Armada</strong>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-7">
                      Pindah ke role Admin ➔ Master Armada. Ubah estimasi durasi Wingbox dari 180 menit ke 210 menit. Buka kembali wizard Supplier dan verifikasi bahwa kalkulasi slot terkunci langsung mengikuti konfigurasi baru.
                    </p>
                  </div>
                </div>
              </div>

              {/* Local Run Guide Command Box */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-white">Panduan Menjalankan Secara Lokal (Local Run Guide):</span>
                  </div>
                  <button
                    onClick={() => handleCopy(localRunGuideText, 'local_guide')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1 font-sans text-xs cursor-pointer"
                  >
                    {copiedSection === 'local_guide' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'local_guide' ? 'Disalin' : 'Salin Perintah'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                  {localRunGuideText}
                </pre>
              </div>

              {/* Seed Script & .env.example */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <FileCode className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-white">Database Seeder (prisma/seed.ts):</span>
                    </div>
                    <button
                      onClick={() => handleCopy(seedScriptText, 'seed')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1 font-sans text-xs cursor-pointer"
                    >
                      {copiedSection === 'seed' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'seed' ? 'Disalin' : 'Salin Seed'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-72">
                    {seedScriptText}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-white">Konfigurasi .env.example:</span>
                    </div>
                    <button
                      onClick={() => handleCopy(envExampleText, 'env')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1 font-sans text-xs cursor-pointer"
                    >
                      {copiedSection === 'env' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'env' ? 'Disalin' : 'Salin .env'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto max-h-72">
                    {envExampleText}
                  </pre>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'FOLDER' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-sans font-semibold">Struktur Folder Modular Next.js 14/15 (App Router):</span>
                <button
                  onClick={() => handleCopy(folderStructureText, 'folder')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1 font-sans text-xs"
                >
                  {copiedSection === 'folder' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'folder' ? 'Disalin' : 'Salin Struktur'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 overflow-x-auto">
                {folderStructureText}
              </pre>
            </div>
          )}

          {activeTab === 'PRISMA' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-sans font-semibold">Skema Prisma ORM PostgreSQL (schema.prisma):</span>
                <button
                  onClick={() => handleCopy(prismaSchemaText, 'prisma')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1 font-sans text-xs"
                >
                  {copiedSection === 'prisma' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'prisma' ? 'Disalin' : 'Salin Prisma Schema'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto">
                {prismaSchemaText}
              </pre>
            </div>
          )}

          {activeTab === 'API_LOGIC' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-sans font-semibold">Logika Backend API Route (Next.js Route Handler):</span>
                <button
                  onClick={() => handleCopy(apiLogicText, 'api')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1 font-sans text-xs"
                >
                  {copiedSection === 'api' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'api' ? 'Disalin' : 'Salin Kode API'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 overflow-x-auto">
                {apiLogicText}
              </pre>
            </div>
          )}

          {activeTab === 'ALGORITHM' && (
            <div className="font-sans space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">1. Rumus Deteksi Bentrok Interval Waktu</h4>
                <p className="text-slate-400">
                  Dua rentang waktu <code className="text-cyan-300 font-mono">[Start_A, End_A]</code> dan{' '}
                  <code className="text-cyan-300 font-mono">[Start_B, End_B]</code> bertabrakan jika dan hanya jika:
                </p>
                <div className="p-3 rounded-lg bg-slate-950 font-mono text-amber-300 border border-amber-500/30">
                  isConflict = (Start_Baru &lt; Selesai_Eksis) &amp;&amp; (Selesai_Baru &gt; Mulai_Eksis)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">2. Algoritma Rekomendasi Slot Alternatif Otomatis</h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                  <li>
                    <strong>Tahap 1 (Dock Lain di Jam yang Sama):</strong> Cari dock lain yang memiliki jenis kompatibel (e.g. General, Tangki, Kontainer) dan tidak memiliki bentrok pada jam yang diminta.
                  </li>
                  <li>
                    <strong>Tahap 2 (Jam Berikutnya):</strong> Jika semua dock penuh, pindai waktu maju (+30 mnt, +60 mnt) dan mundur (-30 mnt) dalam batas operasional (08:00 - 19:00 WIB) sampai menemukan celah bebas &ge; durasi kendaraan.
                  </li>
                  <li>
                    <strong>Tahap 3 (Batas Jam Tutup Pabrik):</strong> Sistem memastikan <code className="text-cyan-300 font-mono">Waktu_Mulai + Durasi &le; 23:00 WIB</code>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
