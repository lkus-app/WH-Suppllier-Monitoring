import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  Phone,
  Shield,
  Truck,
  User,
  X,
  Zap,
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { formatDateIndo, formatDuration, formatTimeHM } from '../../lib/utils';
import { useApp } from '../../lib/store';

interface BookingDetailModalProps {
  booking: Booking | null;
  onClose: () => void;
  onPrintPass?: (booking: Booking) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  onClose,
  onPrintPass,
}) => {
  const { currentUser, advanceBookingStatus, cancelBooking, updateBookingRemarks } = useApp();
  const [remarks, setRemarks] = useState(booking?.remarks || '');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);

  if (!booking) return null;

  const isWarehouseOrAdmin = currentUser.role === 'WAREHOUSE' || currentUser.role === 'ADMIN';

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'BOOKED':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">1. TERJADWAL</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">2. GATE-IN</span>;
      case 'UNLOADING':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">3. SEDANG BONGKAR</span>;
      case 'DONE':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">4. SELESAI</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">DIBATALKAN</span>;
    }
  };

  const handleSaveRemarks = () => {
    updateBookingRemarks(booking.id, remarks);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">{booking.bookingCode}</h3>
                {getStatusBadge(booking.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">PO Ref: <strong className="text-slate-800 font-mono">{booking.poNumber}</strong> • {booking.supplierName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
          {/* Main Time & Dock Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center text-xs text-slate-500 space-x-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Jadwal Slot Kedatangan</span>
              </div>
              <div className="text-xs font-bold text-slate-900">
                {formatDateIndo(booking.startTime)}
              </div>
              <div className="flex items-center space-x-2 text-xs text-blue-700 font-mono font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {formatTimeHM(booking.startTime)} - {formatTimeHM(booking.endTime)} WIB
                </span>
                <span className="text-[10px] text-slate-400 font-normal">({formatDuration(booking.durationMinutes)})</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-xs text-slate-500 space-x-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pintu Dock / Bay Bongkar</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {booking.dockName}
              </div>
              <div className="text-xs text-slate-500">
                Tipe Armada: <span className="text-slate-800 font-medium">{booking.vehicleName}</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cargo / PO Information */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Informasi Muatan / PO</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Nama Barang:</span>
                  <span className="text-slate-800 font-medium">{booking.itemDescription}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Jumlah Muatan:</span>
                    <span className="text-slate-900 font-bold">{booking.qty.toLocaleString()} {booking.unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Supplier:</span>
                    <span className="text-slate-700 font-medium">{booking.supplierName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Armada & Driver Information */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Truck className="w-4 h-4 text-cyan-600" />
                <span>Driver & Armada</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nomor Polisi:</span>
                    <span className="text-slate-900 font-mono font-bold text-xs px-2 py-0.5 rounded bg-white border border-slate-200">
                      {booking.licensePlate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Jenis:</span>
                    <span className="text-slate-800 font-medium">{booking.vehicleName}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nama Supir:</span>
                    <span className="text-slate-800 font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {booking.driverName}
                    </span>
                  </div>
                  {booking.driverPhone && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Kontak:</span>
                      <span className="text-blue-700 font-mono text-[11px] font-medium">
                        {booking.driverPhone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actual Timestamps (Gate & Unloading Log) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Log Waktu Lapangan</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block">1. Gate-In:</span>
                <span className="font-mono text-slate-800 font-bold block mt-0.5">
                  {booking.actualGateIn ? formatTimeHM(booking.actualGateIn) + ' WIB' : 'Belum'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block">2. Start Bongkar:</span>
                <span className="font-mono text-amber-700 font-bold block mt-0.5">
                  {booking.actualStartUnload ? formatTimeHM(booking.actualStartUnload) + ' WIB' : 'Belum'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block">3. Finish Bongkar:</span>
                <span className="font-mono text-purple-700 font-bold block mt-0.5">
                  {booking.actualFinishUnload ? formatTimeHM(booking.actualFinishUnload) + ' WIB' : 'Belum'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block">4. Gate-Out:</span>
                <span className="font-mono text-emerald-700 font-bold block mt-0.5">
                  {booking.actualGateOut ? formatTimeHM(booking.actualGateOut) + ' WIB' : 'Belum'}
                </span>
              </div>
            </div>

            {/* Warehouse Staff & Inspection Note */}
            {(booking.unloadingStaffName || booking.warehouseNotes) && (
              <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                {booking.unloadingStaffName && (
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <span className="text-slate-400">Petugas Bongkar:</span>
                    <strong className="text-slate-900">{booking.unloadingStaffName}</strong>
                  </div>
                )}
                {booking.warehouseNotes && (
                  <div className="text-slate-700">
                    <span className="text-slate-400 block">Catatan Gudang:</span>
                    <p className="italic text-slate-800 mt-0.5">{booking.warehouseNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remarks & Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Catatan Khusus / Remarks</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Tambah instruksi bongkar / kendala lapangan..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600"
              />
              <button
                onClick={handleSaveRemarks}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>

          {/* Cancellation section */}
          {showCancelInput && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center space-x-2 text-rose-700 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Konfirmasi Pembatalan Slot Booking</span>
              </div>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Alasan pembatalan (misal: armada mogok, penundaan supplier)..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-rose-600"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCancelInput(false)}
                  className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
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
                  className="px-3.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                >
                  Proses Batalkan Slot
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Operational Action Buttons */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            {onPrintPass && (
              <button
                onClick={() => onPrintPass(booking)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Lihat QR Gate Pass</span>
              </button>
            )}

            {booking.status !== 'CANCELLED' && booking.status !== 'DONE' && (
              <button
                onClick={() => setShowCancelInput(!showCancelInput)}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Batalkan Slot
              </button>
            )}
          </div>

          {/* Quick Action Flow for Warehouse / Admin */}
          {isWarehouseOrAdmin && booking.status !== 'CANCELLED' && booking.status !== 'DONE' && (
            <div className="flex items-center space-x-2">
              {booking.status === 'BOOKED' && (
                <button
                  onClick={() => {
                    advanceBookingStatus(booking.id, 'ARRIVED');
                    onClose();
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update: Gate-In</span>
                </button>
              )}

              {booking.status === 'ARRIVED' && (
                <button
                  onClick={() => {
                    advanceBookingStatus(booking.id, 'UNLOADING');
                    onClose();
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Update: Mulai Bongkar</span>
                </button>
              )}

              {booking.status === 'UNLOADING' && (
                <button
                  onClick={() => {
                    advanceBookingStatus(booking.id, 'DONE');
                    onClose();
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update: Selesai & Gate-Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
