import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileCheck,
  FileText,
  Lock,
  Package,
  Phone,
  Play,
  Printer,
  QrCode,
  Save,
  Shield,
  Truck,
  User,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { useApp } from '../../lib/store';
import {
  calculateArrivalVariance,
  calculateDwellTime,
  calculateUnloadingVariance,
  formatDateIndo,
  formatDuration,
  formatTimeHM,
} from '../../lib/utils';
import { GatePassModal } from '../supplier/GatePassModal';

interface WarehouseExecutionModalProps {
  booking: Booking | null;
  onClose: () => void;
  onPrintPass?: (booking: Booking) => void;
}

const COMMON_STAFF = [
  'Budi Santoso (Head Checker)',
  'Agus Pratama (Forklift Operator A)',
  'Hendra Wijaya (Forklift Operator B)',
  'Joko Susilo (Receiving Staff)',
  'Rian Kurniawan (QC Material Checker)',
];

export const WarehouseExecutionModal: React.FC<WarehouseExecutionModalProps> = ({
  booking,
  onClose,
  onPrintPass,
}) => {
  const { currentUser, updateWarehouseExecution, advanceBookingStatus, cancelBooking } = useApp();

  if (!booking) return null;

  // Local state for editable fields
  const [unloadingStaffName, setUnloadingStaffName] = useState(booking.unloadingStaffName || '');
  const [warehouseNotes, setWarehouseNotes] = useState(booking.warehouseNotes || '');
  const [remarks, setRemarks] = useState(booking.remarks || '');
  const [showGatePassModal, setShowGatePassModal] = useState(false);

  // Manual timestamp override toggles
  const [isEditingTimestamps, setIsEditingTimestamps] = useState(false);
  const [manualGateIn, setManualGateIn] = useState(
    booking.actualGateIn ? booking.actualGateIn.slice(0, 16) : ''
  );
  const [manualStartUnload, setManualStartUnload] = useState(
    booking.actualStartUnload ? booking.actualStartUnload.slice(0, 16) : ''
  );
  const [manualFinishUnload, setManualFinishUnload] = useState(
    booking.actualFinishUnload ? booking.actualFinishUnload.slice(0, 16) : ''
  );
  const [manualGateOut, setManualGateOut] = useState(
    booking.actualGateOut ? booking.actualGateOut.slice(0, 16) : ''
  );

  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Calculations
  const arrivalVariance = calculateArrivalVariance(booking.startTime, booking.actualGateIn);
  const unloadingVariance = calculateUnloadingVariance(
    booking.durationMinutes,
    booking.actualStartUnload,
    booking.actualFinishUnload
  );
  const dwellTime = calculateDwellTime(booking.actualGateIn, booking.actualGateOut);

  const isWarehouseOrAdmin =
    currentUser.role === 'WAREHOUSE' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Save general notes & staff name
  const handleSaveChanges = () => {
    const updates: any = {
      unloadingStaffName: unloadingStaffName.trim(),
      warehouseNotes: warehouseNotes.trim(),
      remarks: remarks.trim(),
    };

    if (isEditingTimestamps) {
      if (manualGateIn) updates.actualGateIn = new Date(manualGateIn).toISOString();
      if (manualStartUnload) updates.actualStartUnload = new Date(manualStartUnload).toISOString();
      if (manualFinishUnload) updates.actualFinishUnload = new Date(manualFinishUnload).toISOString();
      if (manualGateOut) updates.actualGateOut = new Date(manualGateOut).toISOString();
    }

    updateWarehouseExecution(booking.id, updates);
    setIsEditingTimestamps(false);
  };

  // Quick Action: 1-Click Gate-In
  const handleQuickGateIn = () => {
    const nowISO = new Date().toISOString();
    updateWarehouseExecution(booking.id, {
      status: 'ARRIVED',
      actualGateIn: nowISO,
    });
  };

  // Quick Action: 1-Click Start Unload
  const handleQuickStartUnload = () => {
    const nowISO = new Date().toISOString();
    updateWarehouseExecution(booking.id, {
      status: 'UNLOADING',
      actualStartUnload: nowISO,
      unloadingStaffName: unloadingStaffName.trim() || 'Tim Checker Gudang',
    });
  };

  // Quick Action: 1-Click Finish Unload
  const handleQuickFinishUnload = () => {
    const nowISO = new Date().toISOString();
    updateWarehouseExecution(booking.id, {
      status: 'DONE',
      actualFinishUnload: nowISO,
      actualGateOut: nowISO,
      warehouseNotes: warehouseNotes.trim() || 'Barang diterima lengkap dan sesuai spesifikasi PO.',
    });
  };

  // Quick Action: 1-Click Gate-Out
  const handleQuickGateOut = () => {
    const nowISO = new Date().toISOString();
    updateWarehouseExecution(booking.id, {
      status: 'DONE',
      actualGateOut: nowISO,
    });
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'BOOKED':
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            1. TERJADWAL
          </span>
        );
      case 'ARRIVED':
      case 'GATE_IN':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
            2. DI GERBANG
          </span>
        );
      case 'UNLOADING':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            3. SEDANG BONGKAR
          </span>
        );
      case 'DONE':
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            4. SELESAI
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            DIBATALKAN
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">{booking.bookingCode}</h3>
                {getStatusBadge(booking.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ref PO: <strong className="text-slate-800 font-mono">{booking.poNumber}</strong> • Vendor:{' '}
                <span className="text-slate-700">{booking.supplierName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Main Key Metrics & Bay Info Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Scheduled Slot */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="flex items-center gap-1 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Jadwal Slot Reservasi
                </span>
                <span className="font-mono text-blue-700 font-bold">
                  {formatDuration(booking.durationMinutes)}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800">{formatDateIndo(booking.startTime)}</div>
              <div className="font-mono text-sm font-bold text-blue-700">
                {formatTimeHM(booking.startTime)} - {formatTimeHM(booking.endTime)} WIB
              </div>
            </div>

            {/* Dock Bay Allocation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="flex items-center gap-1 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Alokasi Pintu Dock
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                  ACTIVE
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">{booking.dockName}</div>
              <div className="text-xs text-slate-500">
                Armada: <span className="font-medium text-slate-800">{booking.vehicleName}</span>
              </div>
            </div>

            {/* Dwell Time & Variance Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Total Dwell / Di Pabrik
                </span>
                <span className="text-[10px] text-slate-400">Gate-In s.d Out</span>
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {dwellTime.label !== '-' ? dwellTime.label : 'Belum Gate-In'}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${arrivalVariance.badgeColor}`}>
                  {arrivalVariance.label}
                </span>
              </div>
            </div>
          </div>

          {/* Details: Cargo Information & Driver Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cargo / PO Information */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Rincian Muatan & PO</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-400 block">Deskripsi Barang:</span>
                  <span className="text-slate-900 font-semibold text-xs">{booking.itemDescription}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kuantitas PO:</span>
                    <span className="text-slate-900 font-bold">
                      {booking.qty.toLocaleString()} {booking.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Status PO:</span>
                    <span className="text-emerald-700 font-semibold">Terverifikasi PPIC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle & Driver Identity */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Truck className="w-4 h-4 text-cyan-600" />
                <span>Identitas Driver & Plat Armada</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nomor Polisi:</span>
                    <span className="font-mono text-sm font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                      {booking.licensePlate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Tipe Kendaraan:</span>
                    <span className="text-slate-800 font-medium">{booking.vehicleName}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nama Supir:</span>
                    <span className="text-slate-900 font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {booking.driverName}
                    </span>
                  </div>
                  {booking.driverPhone && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Kontak:</span>
                      <span className="text-blue-600 font-mono font-medium">{booking.driverPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Real-Time Operational Timestamp Milestones */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  Log Waktu Aktual Lapangan
                </h4>
              </div>
              <button
                onClick={() => setIsEditingTimestamps(!isEditingTimestamps)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingTimestamps ? 'Tutup Koreksi' : 'Koreksi Manual Jam'}</span>
              </button>
            </div>

            {/* 4-Step Milestone Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Milestone 1: actualGateIn */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  booking.actualGateIn
                    ? 'bg-white border-cyan-300 text-cyan-900'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] text-slate-700">1. Gate-In (Satpam)</span>
                  {booking.actualGateIn && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />}
                </div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {booking.actualGateIn ? formatTimeHM(booking.actualGateIn) + ' WIB' : '--:--'}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {booking.actualGateIn ? formatDateIndo(booking.actualGateIn) : 'Menunggu Truk'}
                </span>
              </div>

              {/* Milestone 2: actualStartUnload */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  booking.actualStartUnload
                    ? 'bg-white border-amber-300 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] text-slate-700">2. Start Bongkar</span>
                  {booking.actualStartUnload && <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                </div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {booking.actualStartUnload ? formatTimeHM(booking.actualStartUnload) + ' WIB' : '--:--'}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {booking.actualStartUnload ? 'Sedang Dibongkar' : 'Belum Dimulai'}
                </span>
              </div>

              {/* Milestone 3: actualFinishUnload */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  booking.actualFinishUnload
                    ? 'bg-white border-purple-300 text-purple-900'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] text-slate-700">3. Selesai Bongkar</span>
                  {booking.actualFinishUnload && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {booking.actualFinishUnload ? formatTimeHM(booking.actualFinishUnload) + ' WIB' : '--:--'}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {unloadingVariance.status !== 'PENDING' ? unloadingVariance.label : 'Menunggu Selesai'}
                </span>
              </div>

              {/* Milestone 4: actualGateOut */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  booking.actualGateOut
                    ? 'bg-white border-emerald-300 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] text-slate-700">4. Gate-Out</span>
                  {booking.actualGateOut && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {booking.actualGateOut ? formatTimeHM(booking.actualGateOut) + ' WIB' : '--:--'}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {booking.actualGateOut ? 'Keluar Pabrik' : 'Belum Gate-Out'}
                </span>
              </div>
            </div>

            {/* Manual Timestamp Editing Form */}
            {isEditingTimestamps && (
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2.5 animate-in fade-in">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span>Koreksi Timestamp Manual</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Gate In:</label>
                    <input
                      type="datetime-local"
                      value={manualGateIn}
                      onChange={(e) => setManualGateIn(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Start Unload:</label>
                    <input
                      type="datetime-local"
                      value={manualStartUnload}
                      onChange={(e) => setManualStartUnload(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Finish Unload:</label>
                    <input
                      type="datetime-local"
                      value={manualFinishUnload}
                      onChange={(e) => setManualFinishUnload(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Gate Out:</label>
                    <input
                      type="datetime-local"
                      value={manualGateOut}
                      onChange={(e) => setManualGateOut(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Petugas Bongkar & Catatan Gudang */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Petugas Operator / Checker Bongkar:</span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={unloadingStaffName}
                  onChange={(e) => setUnloadingStaffName(e.target.value)}
                  placeholder="Ketik nama operator forklift / checker..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {COMMON_STAFF.map((staff) => (
                    <button
                      key={staff}
                      type="button"
                      onClick={() => setUnloadingStaffName(staff)}
                      className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                    >
                      + {staff.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Catatan Hasil Inspeksi Gudang:</span>
              </label>
              <textarea
                value={warehouseNotes}
                onChange={(e) => setWarehouseNotes(e.target.value)}
                placeholder="Contoh: Muatan 24 Pallet diterima utuh tanpa kerusakan..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600"
              />
            </div>
          </div>

          {/* Cancellation section */}
          {showCancelInput && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5">
              <div className="flex items-center space-x-2 text-rose-700 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Konfirmasi Pembatalan Booking Slot</span>
              </div>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Alasan pembatalan (misal: armada mogok, muatan rusak)..."
                className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-rose-600"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCancelInput(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!cancelReason.trim()) return;
                    cancelBooking(booking.id, cancelReason);
                    onClose();
                  }}
                  disabled={!cancelReason.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                >
                  Proses Batalkan Slot
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowGatePassModal(true)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Lihat QR Gate Pass</span>
            </button>

            <button
              onClick={handleSaveChanges}
              className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simpan Catatan & Staff</span>
            </button>

            {booking.status !== 'CANCELLED' && booking.status !== 'DONE' && (
              <button
                onClick={() => setShowCancelInput(!showCancelInput)}
                className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Batalkan Slot
              </button>
            )}
          </div>

          {/* Workflow Status Transition Buttons */}
          {isWarehouseOrAdmin && booking.status !== 'CANCELLED' && (
            <div className="flex flex-wrap items-center gap-2">
              {(booking.status === 'BOOKED' || booking.status === 'CONFIRMED') && (
                <button
                  onClick={() => {
                    handleQuickGateIn();
                    handleSaveChanges();
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Check-In Gerbang (Gate-In)</span>
                </button>
              )}

              {(booking.status === 'ARRIVED' || booking.status === 'GATE_IN') && (
                <button
                  onClick={() => {
                    handleQuickStartUnload();
                    handleSaveChanges();
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>2. Mulai Bongkar (Start Unloading)</span>
                </button>
              )}

              {booking.status === 'UNLOADING' && (
                <button
                  onClick={() => {
                    handleQuickFinishUnload();
                    handleSaveChanges();
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>3. Selesai Bongkar & Finalisasi</span>
                </button>
              )}

              {booking.status === 'DONE' && !booking.actualGateOut && (
                <button
                  onClick={handleQuickGateOut}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>4. Catat Gate-Out (Keluar Pabrik)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showGatePassModal && (
        <GatePassModal
          booking={booking}
          onClose={() => setShowGatePassModal(false)}
        />
      )}
    </div>
  );
};
