import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Phone,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  Truck,
  User,
  UserCheck,
  XCircle,
  Zap,
} from 'lucide-react';
import { Booking } from '../../types';
import { useApp } from '../../lib/store';
import {
  calculateArrivalVariance,
  calculateDwellTime,
  formatDateIndo,
  formatDuration,
  formatTimeHM,
} from '../../lib/utils';
import { extractDateStr } from '../../lib/slotEngine';
import { GatePassModal } from '../supplier/GatePassModal';
import { WarehouseExecutionModal } from './WarehouseExecutionModal';

export const SecurityGateScanner: React.FC = () => {
  const {
    bookings,
    selectedDate,
    setSelectedDate,
    updateWarehouseExecution,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [gateFilter, setGateFilter] = useState<'ALL' | 'PENDING_IN' | 'INSIDE' | 'COMPLETED_OUT'>('ALL');
  const [scannedBookingCode, setScannedBookingCode] = useState('');
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<Booking | null>(null);
  const [selectedBookingForExecution, setSelectedBookingForExecution] = useState<Booking | null>(null);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Filter bookings for the selected date
  const todayBookings = useMemo(() => {
    return bookings.filter(
      (b) => extractDateStr(b.startTime) === selectedDate && b.status !== 'CANCELLED'
    );
  }, [bookings, selectedDate]);

  // Sub-lists based on gate stage
  const pendingGateInList = todayBookings.filter(
    (b) => (b.status === 'BOOKED' || b.status === 'CONFIRMED') && !b.actualGateIn
  );

  const insideFactoryList = todayBookings.filter(
    (b) =>
      b.actualGateIn &&
      (!b.actualGateOut || b.status === 'ARRIVED' || b.status === 'GATE_IN' || b.status === 'UNLOADING')
  );

  const completedGateOutList = todayBookings.filter(
    (b) => b.actualGateOut || b.status === 'DONE' || b.status === 'COMPLETED'
  );

  // Filtered result by search & tab
  const displayedBookings = useMemo(() => {
    return todayBookings
      .filter((b) => {
        if (gateFilter === 'PENDING_IN') return (b.status === 'BOOKED' || b.status === 'CONFIRMED') && !b.actualGateIn;
        if (gateFilter === 'INSIDE') return b.actualGateIn && (!b.actualGateOut || b.status !== 'DONE');
        if (gateFilter === 'COMPLETED_OUT') return b.actualGateOut || b.status === 'DONE';
        return true;
      })
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          b.bookingCode.toLowerCase().includes(q) ||
          b.licensePlate.toLowerCase().includes(q) ||
          b.driverName.toLowerCase().includes(q) ||
          b.poNumber.toLowerCase().includes(q) ||
          b.supplierName.toLowerCase().includes(q)
        );
      });
  }, [todayBookings, gateFilter, searchQuery]);

  // Handler 1-Click Gate In
  const handleSecurityGateIn = (booking: Booking) => {
    const nowISO = new Date().toISOString();
    updateWarehouseExecution(booking.id, {
      status: 'ARRIVED',
      actualGateIn: nowISO,
    });
    addToast({
      type: 'success',
      title: 'Gate-In Berhasil Dicatat',
      message: `Truk ${booking.licensePlate} (${booking.driverName}) diizinkan masuk menuju ${booking.dockName}.`,
    });
  };

  // Handler 1-Click Gate Out
  const handleSecurityGateOut = (booking: Booking) => {
    const nowISO = new Date().toISOString();
    updateWarehouseExecution(booking.id, {
      status: 'DONE',
      actualGateOut: nowISO,
    });
    addToast({
      type: 'success',
      title: 'Gate-Out Berhasil Dicatat',
      message: `Truk ${booking.licensePlate} (${booking.driverName}) telah keluar dari gerbang pabrik.`,
    });
  };

  // Simulator QR Scanner
  const handleSimulateScan = (code: string) => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      setIsSimulatingScan(false);
      const found = todayBookings.find(
        (b) => b.bookingCode.toLowerCase() === code.toLowerCase()
      );
      if (found) {
        setSelectedBookingForExecution(found);
        addToast({
          type: 'info',
          title: 'QR Code Dikenali',
          message: `Tiket ${found.bookingCode} untuk ${found.licensePlate} berhasil dipindai.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'QR Code Tidak Ditemukan',
          message: `Kode tiket ${code} tidak terdaftar pada tanggal ${formatDateIndo(selectedDate)}.`,
        });
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Scanner Console */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Pos Keamanan & Gate Pass Scanner</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                  SECURITY GATE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pindai QR Gate Pass digital supir, verifikasi nomor polisi, dan kelola alur gerbang masuk/keluar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Quick QR Scanner Barcode Simulator */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 w-full md:w-auto">
            <QrCode className="w-5 h-5 text-cyan-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">Simulasi Scan QR Surat Jalan:</span>
              <span className="text-[11px] text-slate-500">
                Pilih atau ketik Kode Booking supir untuk verifikasi cepat
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={scannedBookingCode}
                onChange={(e) => setScannedBookingCode(e.target.value)}
                placeholder="Misal: BKG-202608-001..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 font-mono focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <button
              onClick={() => handleSimulateScan(scannedBookingCode)}
              disabled={!scannedBookingCode.trim() || isSimulatingScan}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isSimulatingScan ? 'Memindai...' : 'Scan / Buka Tiket'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setGateFilter('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            gateFilter === 'ALL'
              ? 'bg-blue-50/60 border-blue-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 block">Total Armada Hari Ini</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
            {todayBookings.length}
          </span>
          <span className="text-[10px] text-blue-600">Semua Jadwal Booking</span>
        </div>

        <div
          onClick={() => setGateFilter('PENDING_IN')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            gateFilter === 'PENDING_IN'
              ? 'bg-amber-50/60 border-amber-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 block">1. Menunggu Gate-In</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold text-amber-700 mt-1 block font-mono">
            {pendingGateInList.length}
          </span>
          <span className="text-[10px] text-amber-700">Belum masuk gerbang</span>
        </div>

        <div
          onClick={() => setGateFilter('INSIDE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            gateFilter === 'INSIDE'
              ? 'bg-cyan-50/60 border-cyan-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 block">2. Di Dalam Pabrik</span>
            <Zap className="w-4 h-4 text-cyan-600 animate-pulse" />
          </div>
          <span className="text-2xl font-bold text-cyan-700 mt-1 block font-mono">
            {insideFactoryList.length}
          </span>
          <span className="text-[10px] text-cyan-700">Sedang antre / bongkar</span>
        </div>

        <div
          onClick={() => setGateFilter('COMPLETED_OUT')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            gateFilter === 'COMPLETED_OUT'
              ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 block">3. Selesai Gate-Out</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block font-mono">
            {completedGateOutList.length}
          </span>
          <span className="text-[10px] text-emerald-700">Telah keluar pabrik</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No Plat, Supir, PO, Kode Tiket..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Semua Armada' },
            { id: 'PENDING_IN', label: 'Menunggu Masuk' },
            { id: 'INSIDE', label: 'Di Area Pabrik' },
            { id: 'COMPLETED_OUT', label: 'Selesai Keluar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setGateFilter(tab.id as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                gateFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gate Verification Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedBookings.map((bk) => {
          const arrivalVar = calculateArrivalVariance(bk.startTime, bk.actualGateIn);
          const dwell = calculateDwellTime(bk.actualGateIn, bk.actualGateOut);
          const isPendingGateIn = !bk.actualGateIn;
          const isInside = bk.actualGateIn && !bk.actualGateOut;
          const isCompleted = !!bk.actualGateOut;

          return (
            <div
              key={bk.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 shadow-sm ${
                isPendingGateIn
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : isInside
                  ? 'bg-white border-cyan-300'
                  : 'bg-white border-slate-200 opacity-90'
              }`}
            >
              <div>
                {/* Top Row: Plate & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-sm font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 block">
                      {bk.licensePlate}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {bk.bookingCode}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                        isPendingGateIn
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : isInside
                          ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isPendingGateIn ? 'MENUNGGU GATE-IN' : isInside ? 'DI DALAM PABRIK' : 'GATE-OUT SELESAI'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Dock: <strong className="text-blue-700">{bk.dockName}</strong>
                    </span>
                  </div>
                </div>

                {/* Driver & PO Info */}
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Driver:</span>
                    <span className="text-slate-900 font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {bk.driverName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kontak:</span>
                    <span className="text-slate-700 font-mono text-[11px]">{bk.driverPhone || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Ref PO:</span>
                    <span className="text-slate-900 font-mono font-medium">{bk.poNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Muatan:</span>
                    <span className="text-slate-800 font-medium truncate max-w-[160px]">
                      {bk.itemDescription}
                    </span>
                  </div>
                </div>

                {/* Timestamps & Variance */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Jadwal Kedatangan</span>
                    <span className="font-mono font-bold text-blue-700 block mt-0.5">
                      {formatTimeHM(bk.startTime)} - {formatTimeHM(bk.endTime)}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDuration(bk.durationMinutes)}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Waktu Gate-In</span>
                    <span className="font-mono font-bold text-cyan-800 block mt-0.5">
                      {bk.actualGateIn ? formatTimeHM(bk.actualGateIn) + ' WIB' : 'Belum Masuk'}
                    </span>
                    <span className={`text-[10px] font-bold block ${arrivalVar.badgeColor.split(' ')[0]}`}>
                      {arrivalVar.label}
                    </span>
                  </div>
                </div>

                {/* Dwell time badge if inside */}
                {bk.actualGateIn && (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Total Waktu di Pabrik:</span>
                    <span className="font-mono font-bold text-amber-700">{dwell.label}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedBookingForPass(bk)}
                  className="py-1.5 px-2.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pass</span>
                </button>

                <button
                  onClick={() => setSelectedBookingForExecution(bk)}
                  className="py-1.5 px-2.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <span>Detail</span>
                </button>

                {isPendingGateIn && (
                  <button
                    onClick={() => handleSecurityGateIn(bk)}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Catat Gate-In</span>
                  </button>
                )}

                {isInside && (
                  <button
                    onClick={() => handleSecurityGateOut(bk)}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Catat Gate-Out</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {displayedBookings.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-12 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <Shield className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">Tidak Ada Armada Ditemukan</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada data antrean gate yang cocok dengan filter atau kata kunci pencarian pada tanggal ini.
            </p>
          </div>
        )}
      </div>

      {/* Gate Pass Modal */}
      {selectedBookingForPass && (
        <GatePassModal
          booking={selectedBookingForPass}
          onClose={() => setSelectedBookingForPass(null)}
        />
      )}

      {/* Execution Modal */}
      {selectedBookingForExecution && (
        <WarehouseExecutionModal
          booking={selectedBookingForExecution}
          onClose={() => setSelectedBookingForExecution(null)}
        />
      )}
    </div>
  );
};
