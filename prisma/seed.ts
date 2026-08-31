/**
 * ============================================================================
 * PRISMA DATABASE SEEDER: Dock & Delivery Slot Management System
 * ============================================================================
 * Execute via: npx prisma db seed
 * or: npm run seed
 * ============================================================================
 */

// @ts-ignore
import { PrismaClient } from '@prisma/client';

const prisma = new (PrismaClient as any)();

// Standard bcrypt hash for default password: "Password123!"
// Generated with bcrypt.hashSync('Password123!', 10)
const DEFAULT_PASSWORD_HASH = '$2a$10$eA3pmsK7k52a11bTzK9o6OCGZ2r1jSjJ6Wd7k8.B5bW0b6c6qW7uG';

async function main() {
  console.log('🌱 Starting database seeding for Dock & Delivery Slot Management System...\n');

  // --------------------------------------------------------------------------
  // 1. GLOBAL SYSTEM SETTINGS & OPERATIONAL HOURS
  // --------------------------------------------------------------------------
  console.log('⏳ Seeding System Settings...');
  await prisma.systemSetting.upsert({
    where: { id: 'GLOBAL_CONFIG' },
    update: {
      factoryOpenTime: '08:00',
      maxArrivalBookingTime: '19:00',
      factoryCloseTime: '23:00',
      slotIntervalMinutes: 30,
    },
    create: {
      id: 'GLOBAL_CONFIG',
      factoryOpenTime: '08:00',
      maxArrivalBookingTime: '19:00',
      factoryCloseTime: '23:00',
      slotIntervalMinutes: 30,
    },
  });

  // Backward compatible table
  try {
    await prisma.operationalSetting.upsert({
      where: { id: 'default' },
      update: {
        factoryOpenTime: '08:00',
        maxArrivalBookingTime: '19:00',
        factoryCloseTime: '23:00',
        slotIntervalMinutes: 30,
      },
      create: {
        id: 'default',
        factoryOpenTime: '08:00',
        maxArrivalBookingTime: '19:00',
        factoryCloseTime: '23:00',
        slotIntervalMinutes: 30,
      },
    });
  } catch {
    // Ignore if table mapping differs
  }
  console.log('✅ System Settings seeded (Open: 08:00, Cutoff: 19:00, Close: 23:00, Interval: 30m).');

  // --------------------------------------------------------------------------
  // 2. OPERATIONAL HOLIDAYS / SHUTDOWN DATES
  // --------------------------------------------------------------------------
  console.log('📅 Seeding Operational Holidays...');
  const sampleHolidays = [
    {
      date: new Date('2026-09-05T00:00:00Z'),
      description: 'Factory Preventive Maintenance & Dock Calibration',
    },
    {
      date: new Date('2026-09-15T00:00:00Z'),
      description: 'Maulid Nabi Muhammad SAW (Hari Libur Nasional)',
    },
  ];

  for (const hol of sampleHolidays) {
    await prisma.operationalHoliday.upsert({
      where: { date: hol.date },
      update: { description: hol.description },
      create: { date: hol.date, description: hol.description },
    });
  }
  console.log(`✅ ${sampleHolidays.length} Operational Holidays seeded.`);

  // --------------------------------------------------------------------------
  // 3. USER ACCOUNTS (RBAC)
  // --------------------------------------------------------------------------
  console.log('👥 Seeding User Accounts (Default password: Password123!)...');
  const users = [
    {
      email: 'admin@factory.com',
      name: 'System Administrator (Logistics Master)',
      role: 'ADMIN' as const,
      supplierName: null,
      phoneNumber: '+62 811-0001-999',
    },
    {
      email: 'purchasing@factory.com',
      name: 'Budi Santoso (Purchasing Lead)',
      role: 'PURCHASING' as const,
      supplierName: null,
      phoneNumber: '+62 812-3456-7890',
    },
    {
      email: 'ppic@factory.com',
      name: 'Siti Rahmawati (PPIC Material Planner)',
      role: 'PPIC' as const,
      supplierName: null,
      phoneNumber: '+62 813-9876-5432',
    },
    {
      email: 'warehouse@factory.com',
      name: 'Agus Pratama (Warehouse Dock Master)',
      role: 'WAREHOUSE' as const,
      supplierName: null,
      phoneNumber: '+62 815-1122-3344',
    },
    {
      email: 'supplier@vendor.com',
      name: 'Hendra Wijaya (Vendor Logistics)',
      role: 'SUPPLIER' as const,
      supplierName: 'PT Sumber Makmur',
      phoneNumber: '+62 818-5566-7788',
    },
    {
      email: 'supplier.chem@vendor.com',
      name: 'Deni Prasetyo (Chemical Dispatch)',
      role: 'SUPPLIER' as const,
      supplierName: 'PT Kimia Prima',
      phoneNumber: '+62 819-9988-7766',
    },
  ];

  const userRecords: Record<string, any> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        supplierName: u.supplierName,
        phoneNumber: u.phoneNumber,
        passwordHash: DEFAULT_PASSWORD_HASH,
        isActive: true,
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        supplierName: u.supplierName,
        phoneNumber: u.phoneNumber,
        passwordHash: DEFAULT_PASSWORD_HASH,
        isActive: true,
      },
    });
    userRecords[u.email] = user;
  }
  console.log(`✅ ${users.length} User accounts seeded.`);

  // --------------------------------------------------------------------------
  // 4. MASTER VEHICLE TYPES & STANDARD UNLOADING TIME (SOP)
  // --------------------------------------------------------------------------
  console.log('🚛 Seeding Master Vehicle Fleet SOP...');
  const vehicles = [
    {
      code: 'CDE',
      vehicleName: 'Engkel (CDE)',
      defaultDurationMinutes: 60,
      allowedDockTypes: ['GENERAL' as const],
      description: 'Armada Colt Diesel Engkel 4 roda (Kapasitas muatan max ~2.5 Ton). SOP bongkar: 60 menit.',
    },
    {
      code: 'CDD',
      vehicleName: 'Double Engkel (CDD)',
      defaultDurationMinutes: 90,
      allowedDockTypes: ['GENERAL' as const],
      description: 'Armada Colt Diesel Double 6 roda (Kapasitas muatan max ~5 Ton). SOP bongkar: 90 menit.',
    },
    {
      code: 'FUSO',
      vehicleName: 'Fuso',
      defaultDurationMinutes: 120,
      allowedDockTypes: ['GENERAL' as const],
      description: 'Armada Truk Fuso Medium Heavy (Kapasitas muatan max ~10 Ton). SOP bongkar: 120 menit.',
    },
    {
      code: 'WB10',
      vehicleName: 'Wingbox 10 Ton',
      defaultDurationMinutes: 120,
      allowedDockTypes: ['GENERAL' as const],
      description: 'Armada Wingbox Kapasitas 10 Ton dengan hidrolik samping. SOP bongkar: 120 menit.',
    },
    {
      code: 'WB20',
      vehicleName: 'Wingbox 20 Ton',
      defaultDurationMinutes: 180,
      allowedDockTypes: ['GENERAL' as const],
      description: 'Armada Tronton Wingbox Heavy Duty 20 Ton. SOP bongkar: 180 menit (3 Jam terkunci).',
    },
    {
      code: 'ISOTANK',
      vehicleName: 'Isotank',
      defaultDurationMinutes: 180,
      allowedDockTypes: ['LIQUID_ISOTANK' as const],
      description: 'Tangki kargo curah cair / isotank bahan kimia. Wajib Dock 3 dengan sistem pompa pipa.',
    },
    {
      code: 'CONT',
      vehicleName: 'Kontainer 20/40 ft',
      defaultDurationMinutes: 240,
      allowedDockTypes: ['CONTAINER' as const, 'GENERAL' as const],
      description: 'Peti kemas kontainer impor/lokal 20ft & 40ft. SOP bongkar: 240 menit (4 Jam terkunci).',
    },
  ];

  const vehicleRecords: Record<string, any> = {};
  for (const v of vehicles) {
    const vehicle = await prisma.vehicle.upsert({
      where: { code: v.code },
      update: {
        vehicleName: v.vehicleName,
        defaultDurationMinutes: v.defaultDurationMinutes,
        allowedDockTypes: v.allowedDockTypes,
        description: v.description,
        isActive: true,
      },
      create: {
        code: v.code,
        vehicleName: v.vehicleName,
        defaultDurationMinutes: v.defaultDurationMinutes,
        allowedDockTypes: v.allowedDockTypes,
        description: v.description,
        isActive: true,
      },
    });
    vehicleRecords[v.code] = vehicle;
  }
  console.log(`✅ ${vehicles.length} Master Vehicle types seeded.`);

  // --------------------------------------------------------------------------
  // 5. MASTER DOCKS & LOADING BAYS
  // --------------------------------------------------------------------------
  console.log('🏭 Seeding Master Pintu Dock...');
  const docks = [
    {
      dockName: 'Dock 1 (General Cargo)',
      dockType: 'GENERAL' as const,
      maxTonnage: 30.0,
      notes: 'Pintu dock 01 standar. Dilengkapi Dock Leveller Hydraulic & rubber bumper untuk CDE, CDD, Fuso, Wingbox.',
    },
    {
      dockName: 'Dock 2 (General Cargo)',
      dockType: 'GENERAL' as const,
      maxTonnage: 30.0,
      notes: 'Pintu dock 02 standar dry cargo, karton box, bahan baku plastik, & palet material kering.',
    },
    {
      dockName: 'Dock 3 (Liquid / Isotank Dedicated)',
      dockType: 'LIQUID_ISOTANK' as const,
      maxTonnage: 35.0,
      notes: 'Pintu dock 03 khusus tangki cairan & isotank. Dilengkapi manifold pipa SS316, grounding clamp, & pump station.',
    },
    {
      dockName: 'Dock 4 (Container High Bay)',
      dockType: 'CONTAINER' as const,
      maxTonnage: 45.0,
      notes: 'Pintu dock 04 khusus kontainer 20ft & 40ft dengan kapasitas leveller 45 Ton & overhead crane assist.',
    },
  ];

  const dockRecords: Record<string, any> = {};
  for (const d of docks) {
    const dock = await prisma.dock.upsert({
      where: { dockName: d.dockName },
      update: {
        dockType: d.dockType,
        maxTonnage: d.maxTonnage,
        notes: d.notes,
        isActive: true,
      },
      create: {
        dockName: d.dockName,
        dockType: d.dockType,
        maxTonnage: d.maxTonnage,
        notes: d.notes,
        isActive: true,
      },
    });
    dockRecords[d.dockName] = dock;
  }
  console.log(`✅ ${docks.length} Master Loading Bay Docks seeded.`);

  // --------------------------------------------------------------------------
  // 6. SAMPLE PURCHASE ORDERS (PO)
  // --------------------------------------------------------------------------
  console.log('📦 Seeding Sample Purchase Orders...');
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const purchaseOrders = [
    {
      poNumber: 'PO-2026-001',
      supplierName: 'PT Sumber Makmur',
      supplierEmail: 'supplier@vendor.com',
      itemDescription: 'Karton Box Corrugated (Ukuran Standar 40x30x25 cm)',
      qty: 5000,
      unit: 'PCS',
      ppicEtaDateStart: new Date(`${todayStr}T00:00:00Z`),
      ppicEtaDateEnd: new Date(new Date().setDate(now.getDate() + 4)),
      ppicNotes: 'Kebutuhan urgent line packaging 2. Silakan booking slot delivery secepatnya.',
      status: 'PPIC_APPROVED' as const, // Ready for booking
      createdById: userRecords['purchasing@factory.com']?.id,
    },
    {
      poNumber: 'PO-2026-002',
      supplierName: 'PT Kimia Prima',
      supplierEmail: 'supplier.chem@vendor.com',
      itemDescription: 'Raw Chemical Liquid - Solvents Grade A (Curah Isotank)',
      qty: 20,
      unit: 'TON',
      ppicEtaDateStart: null,
      ppicEtaDateEnd: null,
      ppicNotes: null,
      status: 'DRAFT' as const, // Waiting PPIC Review
      createdById: userRecords['purchasing@factory.com']?.id,
    },
    {
      poNumber: 'PO-2026-003',
      supplierName: 'PT Sumber Makmur',
      supplierEmail: 'supplier@vendor.com',
      itemDescription: 'Corrugated Layer Pad Kraft 275 GSM',
      qty: 2500,
      unit: 'PCS',
      ppicEtaDateStart: new Date(`${todayStr}T00:00:00Z`),
      ppicEtaDateEnd: new Date(new Date().setDate(now.getDate() + 2)),
      ppicNotes: 'Disetujui untuk pengiriman pagi. Prioritaskan Dock 1 atau Dock 2.',
      status: 'SCHEDULED' as const,
      createdById: userRecords['purchasing@factory.com']?.id,
    },
    {
      poNumber: 'PO-2026-004',
      supplierName: 'PT Kimia Prima',
      supplierEmail: 'supplier.chem@vendor.com',
      itemDescription: 'Polymer Emulsion Raw Liquid (Tangki Curah 15 Ton)',
      qty: 15,
      unit: 'TON',
      ppicEtaDateStart: new Date(`${todayStr}T00:00:00Z`),
      ppicEtaDateEnd: new Date(new Date().setDate(now.getDate() + 3)),
      ppicNotes: 'Wajib masuk Dock 3 Dedicated Isotank dengan pompa pipa kimia.',
      status: 'SCHEDULED' as const,
      createdById: userRecords['purchasing@factory.com']?.id,
    },
  ];

  const poRecords: Record<string, any> = {};
  for (const po of purchaseOrders) {
    const createdPO = await prisma.purchaseOrder.upsert({
      where: { poNumber: po.poNumber },
      update: {
        supplierName: po.supplierName,
        supplierEmail: po.supplierEmail,
        itemDescription: po.itemDescription,
        qty: po.qty,
        unit: po.unit,
        ppicEtaDateStart: po.ppicEtaDateStart,
        ppicEtaDateEnd: po.ppicEtaDateEnd,
        ppicNotes: po.ppicNotes,
        status: po.status,
        createdById: po.createdById,
      },
      create: {
        poNumber: po.poNumber,
        supplierName: po.supplierName,
        supplierEmail: po.supplierEmail,
        itemDescription: po.itemDescription,
        qty: po.qty,
        unit: po.unit,
        ppicEtaDateStart: po.ppicEtaDateStart,
        ppicEtaDateEnd: po.ppicEtaDateEnd,
        ppicNotes: po.ppicNotes,
        status: po.status,
        createdById: po.createdById,
      },
    });
    poRecords[po.poNumber] = createdPO;
  }
  console.log(`✅ ${purchaseOrders.length} Sample Purchase Orders seeded.`);

  // --------------------------------------------------------------------------
  // 7. SAMPLE BOOKINGS / DOCK DELIVERY SLOTS
  // --------------------------------------------------------------------------
  console.log('⏰ Seeding Live Dock Delivery Bookings (Gantt Timeline Sample)...');

  // Slot 1: Wingbox 20T at Dock 1 (08:30 - 11:30 = 180 min)
  const startTime1 = new Date(`${todayStr}T08:30:00Z`);
  const endTime1 = new Date(`${todayStr}T11:30:00Z`);

  if (poRecords['PO-2026-003'] && dockRecords['Dock 1 (General Cargo)'] && vehicleRecords['WB20']) {
    await prisma.booking.upsert({
      where: { bookingCode: `SLOT-${todayStr.replace(/-/g, '')}-D1-001` },
      update: {
        poId: poRecords['PO-2026-003'].id,
        dockId: dockRecords['Dock 1 (General Cargo)'].id,
        vehicleId: vehicleRecords['WB20'].id,
        driverName: 'Suryanto Wibowo',
        driverPhone: '0812-9843-1122',
        licensePlate: 'B 9482 UXX',
        startTime: startTime1,
        endTime: endTime1,
        durationMinutes: 180,
        status: 'BOOKED',
        actualGateIn: null,
        createdById: userRecords['supplier@vendor.com']?.id,
      },
      create: {
        bookingCode: `SLOT-${todayStr.replace(/-/g, '')}-D1-001`,
        poId: poRecords['PO-2026-003'].id,
        dockId: dockRecords['Dock 1 (General Cargo)'].id,
        vehicleId: vehicleRecords['WB20'].id,
        driverName: 'Suryanto Wibowo',
        driverPhone: '0812-9843-1122',
        licensePlate: 'B 9482 UXX',
        startTime: startTime1,
        endTime: endTime1,
        durationMinutes: 180,
        status: 'BOOKED',
        actualGateIn: null,
        createdById: userRecords['supplier@vendor.com']?.id,
      },
    });
  }

  // Slot 2: Isotank at Dock 3 (09:00 - 12:00 = 180 min) - in progress
  const startTime2 = new Date(`${todayStr}T09:00:00Z`);
  const endTime2 = new Date(`${todayStr}T12:00:00Z`);
  const actualGateIn2 = new Date(`${todayStr}T08:52:00Z`);
  const actualStartUnload2 = new Date(`${todayStr}T09:08:00Z`);

  if (poRecords['PO-2026-004'] && dockRecords['Dock 3 (Liquid / Isotank Dedicated)'] && vehicleRecords['ISOTANK']) {
    await prisma.booking.upsert({
      where: { bookingCode: `SLOT-${todayStr.replace(/-/g, '')}-D3-001` },
      update: {
        poId: poRecords['PO-2026-004'].id,
        dockId: dockRecords['Dock 3 (Liquid / Isotank Dedicated)'].id,
        vehicleId: vehicleRecords['ISOTANK'].id,
        driverName: 'Bambang Trihatmojo',
        driverPhone: '0813-4455-6677',
        licensePlate: 'L 8821 KZ',
        startTime: startTime2,
        endTime: endTime2,
        durationMinutes: 180,
        status: 'UNLOADING',
        actualGateIn: actualGateIn2,
        actualStartUnload: actualStartUnload2,
        warehouseNotes: 'Pipa manifold terpasang, tekanan transfer stabil pada 2.2 bar.',
        unloadingStaffName: 'Agus Pratama & Tim Dock 3',
        createdById: userRecords['supplier.chem@vendor.com']?.id,
      },
      create: {
        bookingCode: `SLOT-${todayStr.replace(/-/g, '')}-D3-001`,
        poId: poRecords['PO-2026-004'].id,
        dockId: dockRecords['Dock 3 (Liquid / Isotank Dedicated)'].id,
        vehicleId: vehicleRecords['ISOTANK'].id,
        driverName: 'Bambang Trihatmojo',
        driverPhone: '0813-4455-6677',
        licensePlate: 'L 8821 KZ',
        startTime: startTime2,
        endTime: endTime2,
        durationMinutes: 180,
        status: 'UNLOADING',
        actualGateIn: actualGateIn2,
        actualStartUnload: actualStartUnload2,
        warehouseNotes: 'Pipa manifold terpasang, tekanan transfer stabil pada 2.2 bar.',
        unloadingStaffName: 'Agus Pratama & Tim Dock 3',
        createdById: userRecords['supplier.chem@vendor.com']?.id,
      },
    });
  }

  console.log('✅ Sample Live Bookings seeded.');
  console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  console.log('🔐 Credentials Summary:');
  console.log('   - Admin:      admin@factory.com      | Pass: Password123!');
  console.log('   - Purchasing: purchasing@factory.com | Pass: Password123!');
  console.log('   - PPIC:       ppic@factory.com       | Pass: Password123!');
  console.log('   - Warehouse:  warehouse@factory.com  | Pass: Password123!');
  console.log('   - Supplier:   supplier@vendor.com    | Pass: Password123!');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error executing database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
