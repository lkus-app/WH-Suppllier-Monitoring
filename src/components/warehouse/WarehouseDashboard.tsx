import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  Maximize2,
  Minimize2,
  Monitor,
  Package,
  Phone,
  Play,
  QrCode,
  Search,
  Shield,
  Truck,
  User,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Booking, BookingStatus, Dock } from '../../types';
import { useApp } from '../../lib/store';
import { extractDateStr, formatTimeHM } from '../../lib/slotEngine';
import {
  calculateArrivalVariance,
  calculateDwellTime,
  calculateUnloadingVariance,
  formatDateIndo,
} from '../../lib/utils';
import { WarehouseExecutionModal } from './WarehouseExecutionModal';
import { SecurityGateScanner } from './SecurityGateScanner';
import { WarehouseDockGrid } from './WarehouseDockGrid';
import { WarehouseTvKioskView } from './WarehouseTvKioskView';
import { HorizontalTimeline } from '../timeline/HorizontalTimeline';
import { GatePassModal } from '../supplier/GatePassModal';
import { StatusBadge } from '../common/StatusBadge';
import { DataTable, Column } from '../common/DataTable';
import { MiniDockTimeline } from '../common/MiniDockTimeline';

export const WarehouseDashboard: React.FC = () => {
  const {
    bookings,
    docks,
    selectedDate,
    setSelectedDate,
    updateWarehouseExecution,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'LIST_TWO_COLUMN' | 'KANBAN' | 'DOCKS_LIVE' | 'SECURITY_GATE' | 'TIMELINE'>('LIST_TWO_COLUMN');
  const [selectedBookingForExecution, setSelectedBookingForExecution] = useState<Booking | null>(null);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<Booking | null>(null);
  const [isTvKioskMode, setIsTvKioskMode] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter bookings for the selected date
  const dateBookings = bookings.filter(
    (b) => extractDateStr(b.startTime) === selectedDate && b.status !== 'CANCELLED'
  );

  // Split into Kanban columns
  const bookedList = dateBookings.filter((b) => b.status === 'BOOKED' || b.status === 'CONFIRMED');
  const arrivedList = dateBookings.filter((b) => b.status === 'ARRIVED' || b.status === 'GATE_IN');
  const unloadingList = dateBookings.filter((b) => b.status === 'UNLOADING');
  const doneList = dateBookings.filter((b) => b.status === 'DONE' || b.status === 'COMPLETED');

  // Filtered by search if provided
  const filterList = (list: Booking[]) => {
    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter(
      (b) =>
        b.licensePlate.toLowerCase().includes(q) ||
        b.driverName.toLowerCase().includes(q) ||
        b.itemDescription.toLowerCase().includes(q) ||
        b.poNumber.toLowerCase().includes(q) ||
        b.bookingCode.toLowerCase().includes(q)
    );
  };

  const filteredAllBookings = dateBookings
    .filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        b.licensePlate.toLowerCase().includes(q) ||
        b.driverName.toLowerCase().includes(q) ||
        b.itemDescription.toLowerCase().includes(q) ||
        b.poNumber.toLowerCase().includes(q) ||
        b.bookingCode.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Table Columns for Two-Column Dispatch View
  const dispatchColumns: Column<Booking>[] = [
    {
      header: 'Jam Slot & Kode',
      cell: (b) => (
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5 text-slate-900 font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {formatTimeHM(b.startTime)} - {formatTimeHM(b.endTime)}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 block">{b.bookingCode}</span>
        </div>
      ),
    },
    {
      header: 'Armada & Driver',
      cell: (b) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-slate-900">{b.licensePlate}</span>
            <span className="text-[11px] text-slate-500 font-medium">{b.vehicleName}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {b.driverName} {b.driverPhone && `(${b.driverPhone})`}
          </p>
        </div>
      ),
    },
    {
      header: 'Material & Vendor',
      cell: (b) => (
        <div>
          <p className="font-semibold text-slate-800 line-clamp-1">{b.itemDescription}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {b.supplierName} • {b.qty.toLocaleString()} {b.unit}
          </p>
        </div>
      ),
    },
    {
      header: 'Pintu Dock',
      cell: (b) => <span className="font-bold text-blue-700">{b.dockName}</span>,
    },
    {
      header: 'Status Alur',
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      header: 'Aksi Eksekusi',
      className: 'text-right',
      cell: (b) => (
        <div className="flex items-center justify-end space-x-1.5">
          {b.status === 'BOOKED' && (
            <button
              onClick={() => {
                const nowISO = new Date().toISOString();
                updateWarehouseExecution(b.id, {
                  status: 'ARRIVED',
                  actualGateIn: nowISO,
                });
              }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Gate-In</span>
            </button>
          )}

          {b.status === 'ARRIVED' && (
            <button
              onClick={() => {
                const nowISO = new Date().toISOString();
                updateWarehouseExecution(b.id, {
                  status: 'UNLOADING',
                  actualStartUnload: nowISO,
                  unloadingStaffName: b.unloadingStaffName || 'Tim Checker Gudang',
                });
              }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
            >
              <Play className="w-3 h-3" />
              <span>Mulai Bongkar</span>
            </button>
          )}

          {b.status === 'UNLOADING' && (
            <button
              onClick={() => {
                const nowISO = new Date().toISOString();
                updateWarehouseExecution(b.id, {
                  status: 'DONE',
                  actualFinishUnload: nowISO,
                  actualGateOut: nowISO,
                });
              }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Selesai</span>
            </button>
          )}

          <button
            onClick={() => setSelectedBookingForExecution(b)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Buka Form Eksekusi / Catatan QC"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Warehouse Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Monitoring Operasional Gudang & Gate</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                LIVE DISPATCH
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan waktu aktual, monitoring gate-in pos satpam, dan progres pembongkaran muatan dock
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Selector */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
          />

          {/* View Mode Tabs */}
          <div className="flex flex-wrap rounded-lg bg-slate-100 p-1 text-xs">
            <button
              onClick={() => setActiveTab('LIST_TWO_COLUMN')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'LIST_TWO_COLUMN'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Antrean
            </button>
            <button
              onClick={() => setActiveTab('KANBAN')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'KANBAN'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Papan Kanban
            </button>
            <button
              onClick={() => setActiveTab('DOCKS_LIVE')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'DOCKS_LIVE'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Status Pintu Dock
            </button>
            <button
              onClick={() => setActiveTab('SECURITY_GATE')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'SECURITY_GATE'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pos Satpam
            </button>
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'TIMELINE'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline Gantt
            </button>
          </div>

          {/* TV Display Mode Toggle */}
          <button
            onClick={() => setIsTvKioskMode(true)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-amber-700 border border-amber-200 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Tampilkan di Monitor TV Hall Gudang / Kiosk Pos Satpam"
          >
            <Monitor className="w-4 h-4 text-amber-600" />
            <span>Mode TV Kiosk</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">
              1. Menunggu Kedatangan
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {bookedList.length} Armada
            </span>
            <span className="text-[10px] text-slate-400">Terjadwal Hari Ini</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">
              2. Di Gerbang (Gate-In)
            </span>
            <span className="text-2xl font-bold text-cyan-700 mt-1 block">
              {arrivedList.length} Armada
            </span>
            <span className="text-[10px] text-slate-400">Antre Menuju Dock</span>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">
              3. Sedang Bongkar Muat
            </span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">
              {unloadingList.length} Armada
            </span>
            <span className="text-[10px] text-slate-400">Aktif di Pintu Dock</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">
              4. Selesai & Gate-Out
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              {doneList.length} Armada
            </span>
            <span className="text-[10px] text-slate-400">Bongkar Tuntas</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: TWO-COLUMN DISPATCH LIST (ENTERPRISE DEFAULT) */}
      {/* ======================================================== */}
      {activeTab === 'LIST_TWO_COLUMN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Data Table & Filters */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Cari Plat Nomor, Driver, PO, Material..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="BOOKED">Menunggu (Booked)</option>
                    <option value="ARRIVED">Di Gerbang (Gate-In)</option>
                    <option value="UNLOADING">Sedang Bongkar</option>
                    <option value="DONE">Selesai Bongkar</option>
                  </select>
                </div>
              </div>
            </div>

            <DataTable
              columns={dispatchColumns}
              data={filteredAllBookings}
              keyExtractor={(item) => item.id}
              emptyMessage={`Tidak ada jadwal kedatangan armada pada tanggal ${selectedDate}.`}
            />
          </div>

          {/* Right Column (4 cols): Mini Dock Timeline & Guidance */}
          <div className="lg:col-span-4 space-y-4">
            <MiniDockTimeline />

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>SOP Eksekusi Operasional Gudang</span>
              </h3>
              <ul className="text-[11px] text-slate-600 space-y-2 list-disc list-inside">
                <li>
                  Verifikasi plat nomor dan Surat Jalan sebelum menekan tombol <strong>Gate-In</strong>.
                </li>
                <li>
                  Lakukan inspeksi visual QC dan pastikan APD terpasang sebelum memulai <strong>Mulai Bongkar</strong>.
                </li>
                <li>
                  Pastikan formulir checklist penerimaan diisi oleh checker saat menyelesaikan proses bongkar.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: KANBAN QUEUE VIEW */}
      {/* ======================================================== */}
      {activeTab === 'KANBAN' && (
        <div className="space-y-4">
          {/* Quick Search */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter Plat Nomor, Supir, PO..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Klik armada untuk melihat log waktu aktual, staff checker, dan catatan inspeksi.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Column 1: BOOKED */}
            <div className="flex flex-col rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    1. Terjadwal (Booked)
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {bookedList.length}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[620px] bg-slate-50/50">
                {filterList(bookedList).map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 transition-all space-y-2.5 cursor-pointer shadow-2xs group"
                    onClick={() => setSelectedBookingForExecution(b)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-blue-600">
                        {b.licensePlate}
                      </span>
                      <span className="text-[11px] font-mono text-blue-700 font-bold">
                        {formatTimeHM(b.startTime)} - {formatTimeHM(b.endTime)}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-800 block line-clamp-1">
                        {b.itemDescription}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {b.supplierName} • {b.vehicleName}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-700">{b.dockName}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nowISO = new Date().toISOString();
                          updateWarehouseExecution(b.id, {
                            status: 'ARRIVED',
                            actualGateIn: nowISO,
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Gate-In</span>
                      </button>
                    </div>
                  </div>
                ))}

                {bookedList.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Tidak ada jadwal menunggu kedatangan.
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: ARRIVED */}
            <div className="flex flex-col rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-slate-200 bg-cyan-50/70 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
                  <h3 className="font-bold text-xs text-cyan-900 uppercase tracking-wider">
                    2. Di Gerbang (Gate-In)
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-cyan-100 text-cyan-800 border border-cyan-200">
                  {arrivedList.length}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[620px] bg-slate-50/50">
                {filterList(arrivedList).map((b) => {
                  const arrivalVar = calculateArrivalVariance(b.startTime, b.actualGateIn);
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-white border border-cyan-200 hover:border-cyan-400 transition-all space-y-2.5 cursor-pointer shadow-2xs group"
                      onClick={() => setSelectedBookingForExecution(b)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {b.licensePlate}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                          In: {b.actualGateIn ? formatTimeHM(b.actualGateIn) : '--:--'}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-800 block line-clamp-1">
                          {b.itemDescription} ({b.qty.toLocaleString()} {b.unit})
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Supir: {b.driverName} {b.driverPhone && `(${b.driverPhone})`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`px-2 py-0.5 font-semibold rounded border text-[10px] ${arrivalVar.badgeColor}`}>
                          {arrivalVar.label}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-700">{b.dockName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nowISO = new Date().toISOString();
                            updateWarehouseExecution(b.id, {
                              status: 'UNLOADING',
                              actualStartUnload: nowISO,
                              unloadingStaffName: b.unloadingStaffName || 'Tim Checker Gudang',
                            });
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span>Mulai Bongkar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {arrivedList.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Tidak ada armada antre di gerbang.
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: UNLOADING */}
            <div className="flex flex-col rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-slate-200 bg-amber-50/70 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                    3. Sedang Bongkar Muat
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                  {unloadingList.length}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[620px] bg-slate-50/50">
                {filterList(unloadingList).map((b) => {
                  const unloadingVar = calculateUnloadingVariance(
                    b.durationMinutes,
                    b.actualStartUnload,
                    b.actualFinishUnload
                  );
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-white border border-amber-300 hover:border-amber-500 transition-all space-y-2.5 cursor-pointer shadow-2xs group"
                      onClick={() => setSelectedBookingForExecution(b)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {b.licensePlate}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {b.dockName}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-800 block line-clamp-1">
                          {b.itemDescription}
                        </span>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Mulai: {formatTimeHM(b.actualStartUnload || b.startTime)}</span>
                        </div>
                      </div>

                      {/* Staff & Variance Info */}
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-600" /> Checker:
                          </span>
                          <span className="font-medium text-slate-900">{b.unloadingStaffName || 'Ditugaskan'}</span>
                        </div>
                        <div className="text-amber-700 font-bold text-[10px]">
                          {unloadingVar.label}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">Inspeksi</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nowISO = new Date().toISOString();
                            updateWarehouseExecution(b.id, {
                              status: 'DONE',
                              actualFinishUnload: nowISO,
                              actualGateOut: nowISO,
                            });
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai Bongkar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {unloadingList.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Tidak ada proses pembongkaran aktif saat ini.
                  </div>
                )}
              </div>
            </div>

            {/* Column 4: DONE */}
            <div className="flex flex-col rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-slate-200 bg-emerald-50/70 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                    4. Selesai & Gate-Out
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {doneList.length}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[620px] bg-slate-50/50">
                {filterList(doneList).map((b) => {
                  const dwell = calculateDwellTime(b.actualGateIn, b.actualGateOut);
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-2 cursor-pointer shadow-2xs"
                      onClick={() => setSelectedBookingForExecution(b)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-emerald-800">
                          {b.licensePlate}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Out: {b.actualGateOut ? formatTimeHM(b.actualGateOut) : '--:--'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-700 block line-clamp-1">{b.itemDescription}</span>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Dwell: {dwell.label}</span>
                        <span className="text-blue-700 font-semibold">{b.dockName}</span>
                      </div>
                    </div>
                  );
                })}

                {doneList.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Belum ada armada yang selesai tuntas hari ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LIVE STATUS PINTU DOCK (BAYS) */}
      {/* ======================================================== */}
      {activeTab === 'DOCKS_LIVE' && (
        <WarehouseDockGrid onSelectBooking={(b) => setSelectedBookingForExecution(b)} />
      )}

      {/* ======================================================== */}
      {/* TAB 4: POS SATPAM & GATE PASS SCANNER */}
      {/* ======================================================== */}
      {activeTab === 'SECURITY_GATE' && <SecurityGateScanner />}

      {/* ======================================================== */}
      {/* TAB 5: GANTT TIMELINE OPERASIONAL */}
      {/* ======================================================== */}
      {activeTab === 'TIMELINE' && <HorizontalTimeline />}

      {/* Modal Eksekusi Operasional Gudang */}
      {selectedBookingForExecution && (
        <WarehouseExecutionModal
          booking={selectedBookingForExecution}
          onClose={() => setSelectedBookingForExecution(null)}
          onPrintPass={(bk) => {
            setSelectedBookingForExecution(null);
            setSelectedBookingForPass(bk);
          }}
        />
      )}

      {/* Modal Digital QR Gate Pass */}
      {selectedBookingForPass && (
        <GatePassModal
          booking={selectedBookingForPass}
          onClose={() => setSelectedBookingForPass(null)}
        />
      )}

      {/* Fullscreen TV Kiosk Mode */}
      {isTvKioskMode && <WarehouseTvKioskView onClose={() => setIsTvKioskMode(false)} />}
    </div>
  );
};
