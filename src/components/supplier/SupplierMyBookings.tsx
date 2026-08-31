import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Layers,
  MapPin,
  Phone,
  Printer,
  QrCode,
  Search,
  Shield,
  Trash2,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { useApp } from '../../lib/store';
import { formatDateIndo, formatDuration, formatTimeHM } from '../../lib/utils';
import { GatePassModal } from './GatePassModal';

interface SupplierMyBookingsProps {
  onNewBookingClick: () => void;
}

export const SupplierMyBookings: React.FC<SupplierMyBookingsProps> = ({ onNewBookingClick }) => {
  const { bookings, currentUser, cancelBooking } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Filter bookings for current supplier (or all if admin)
  const myBookings = bookings.filter((b) => {
    if (currentUser.role === 'SUPPLIER' && currentUser.supplierName) {
      if (!b.supplierName.toLowerCase().includes(currentUser.supplierName.toLowerCase())) {
        return false;
      }
    }
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'CONFIRMED' && (b.status === 'CONFIRMED' || b.status === 'BOOKED')) return true;
      if (statusFilter === 'GATE_IN' && (b.status === 'GATE_IN' || b.status === 'ARRIVED')) return true;
      if (statusFilter === 'UNLOADING' && b.status === 'UNLOADING') return true;
      if (statusFilter === 'COMPLETED' && (b.status === 'COMPLETED' || b.status === 'DONE')) return true;
      if (statusFilter === 'CANCELLED' && b.status === 'CANCELLED') return true;
      return false;
    }
    return true;
  }).filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.bookingCode.toLowerCase().includes(q) ||
      b.poNumber.toLowerCase().includes(q) ||
      b.licensePlate.toLowerCase().includes(q) ||
      b.driverName.toLowerCase().includes(q) ||
      b.itemDescription.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
      case 'BOOKED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            CONFIRMED
          </span>
        );
      case 'GATE_IN':
      case 'ARRIVED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            GATE-IN
          </span>
        );
      case 'UNLOADING':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            SEDANG BONGKAR
          </span>
        );
      case 'COMPLETED':
      case 'DONE':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            CANCELLED
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs text-slate-400">{status}</span>;
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;
    if (!cancelReason.trim()) {
      alert('Mohon isi alasan pembatalan booking.');
      return;
    }
    cancelBooking(cancelModalBooking.id, cancelReason.trim());
    setCancelModalBooking(null);
    setCancelReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            <span>Tiket & Jadwal Slot Saya</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola tiket booking slot, unduh digital QR gate pass, dan pantau status pembongkaran armada
          </p>
        </div>
        <button
          onClick={onNewBookingClick}
          className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          <span>+ Booking Slot Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No Booking, PO, Plat Truk, Supir..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['ALL', 'CONFIRMED', 'GATE_IN', 'UNLOADING', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Booking Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myBookings.map((bk) => {
          const isCancelable = bk.status === 'CONFIRMED' || bk.status === 'BOOKED';

          return (
            <div
              key={bk.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Kode Booking
                    </span>
                    <span className="font-mono text-base font-black text-blue-400">
                      {bk.bookingCode}
                    </span>
                  </div>
                  {getStatusBadge(bk.status)}
                </div>

                {/* PO & Item Description */}
                <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ref Purchase Order:</span>
                    <span className="font-mono font-bold text-indigo-300">{bk.poNumber}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                    {bk.itemDescription}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Vendor: {bk.supplierName}</span>
                    <span className="text-slate-200 font-bold">{bk.qty.toLocaleString()} {bk.unit}</span>
                  </div>
                </div>

                {/* Schedule & Dock Info */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      Jadwal Slot
                    </span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {formatDateIndo(bk.startTime)}
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-400 block">
                      {formatTimeHM(bk.startTime)} - {formatTimeHM(bk.endTime)} WIB
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      Pintu Dock
                    </span>
                    <span className="font-bold text-emerald-400 mt-0.5 block truncate">
                      {bk.dockName || 'Dock Khusus'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Durasi: {formatDuration(bk.durationMinutes)}
                    </span>
                  </div>
                </div>

                {/* Vehicle & Driver Info */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="font-mono font-bold text-cyan-300">{bk.licensePlate}</span>
                      <span className="text-slate-400 ml-1.5">• {bk.vehicleName || 'Armada'}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="text-slate-200 font-medium">{bk.driverName}</span>
                    {bk.driverPhone && <span className="text-slate-400 block">{bk.driverPhone}</span>}
                  </div>
                </div>

                {/* Remarks or Cancel Reason */}
                {bk.cancellationReason && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300">
                    Alasan Batal: {bk.cancellationReason}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedBookingForPass(bk)}
                  className="flex-1 py-2 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Lihat Digital QR Gate Pass</span>
                </button>

                {isCancelable && (
                  <button
                    onClick={() => setCancelModalBooking(bk)}
                    className="py-2 px-3 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/50 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                    title="Batalkan Booking Slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Batal</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {myBookings.length === 0 && (
          <div className="col-span-2 p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
            <QrCode className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-300">Belum Ada Tiket Booking Slot</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Silakan lakukan reservasi slot kedatangan melalui Wizard Booking untuk PO yang sudah diverifikasi PPIC.
            </p>
            <button
              onClick={onNewBookingClick}
              className="mt-2 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl inline-flex items-center space-x-2 cursor-pointer shadow-lg"
            >
              <Truck className="w-4 h-4" />
              <span>Buat Booking Sekarang</span>
            </button>
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

      {/* Cancel Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Batalkan Booking Slot?</h3>
            </div>

            <p className="text-xs text-slate-300">
              Anda akan membatalkan booking <strong className="text-white font-mono">{cancelModalBooking.bookingCode}</strong> ({cancelModalBooking.poNumber}) pada tanggal {formatDateIndo(cancelModalBooking.startTime)}.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Alasan Pembatalan: *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Kendala armada supir sakit / barang belum siap muat..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setCancelModalBooking(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl cursor-pointer"
              >
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
