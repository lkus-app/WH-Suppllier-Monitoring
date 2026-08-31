import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Maximize,
  Minimize,
  Monitor,
  Package,
  Shield,
  Truck,
  User,
  Zap,
} from 'lucide-react';
import { Booking, Dock } from '../../types';
import { useApp } from '../../lib/store';
import {
  calculateArrivalVariance,
  calculateUnloadingVariance,
  formatDateIndo,
  formatDuration,
  formatTimeHM,
} from '../../lib/utils';
import { extractDateStr } from '../../lib/slotEngine';

interface WarehouseTvKioskViewProps {
  onClose: () => void;
}

export const WarehouseTvKioskView: React.FC<WarehouseTvKioskViewProps> = ({ onClose }) => {
  const { bookings, docks, selectedDate } = useApp();

  // Current real-time clock state with seconds
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Filter bookings for the day
  const dateBookings = bookings.filter(
    (b) => extractDateStr(b.startTime) === selectedDate && b.status !== 'CANCELLED'
  );

  const activeUnloadingBookings = dateBookings.filter((b) => b.status === 'UNLOADING');
  const arrivedBookings = dateBookings.filter((b) => b.status === 'ARRIVED');
  const bookedBookings = dateBookings.filter((b) => b.status === 'BOOKED' || b.status === 'CONFIRMED');
  const doneBookings = dateBookings.filter((b) => b.status === 'DONE' || b.status === 'COMPLETED');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-y-auto font-sans select-none">
      {/* Top TV Header Bar */}
      <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black">
            <Monitor className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Warehouse Live Dispatch Monitor
              </h1>
              <span className="px-3 py-0.5 text-xs font-black rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                LIVE BROADCAST
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Dock & Delivery Slot Management System • Display Hall Gudang & Pos Keamanan
            </p>
          </div>
        </div>

        {/* Live Clock & Date Badge */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tracking-wider">
              {timeString} <span className="text-xs font-sans text-cyan-400">WIB</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {formatDateIndo(selectedDate)}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Keluar dari Layar Monitor TV"
          >
            <Minimize className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main KPI Highlight Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800/80">
        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-400 font-bold block uppercase">1. Menunggu Kedatangan</span>
            <span className="text-3xl font-black text-white font-mono">{bookedBookings.length}</span>
            <span className="text-[11px] text-slate-400 block">Armada Terjadwal</span>
          </div>
          <Clock className="w-8 h-8 text-blue-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-cyan-400 font-bold block uppercase">2. Antre di Gerbang</span>
            <span className="text-3xl font-black text-cyan-300 font-mono">{arrivedBookings.length}</span>
            <span className="text-[11px] text-slate-400 block">Gate-In Siap Panggil</span>
          </div>
          <Shield className="w-8 h-8 text-cyan-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/50 flex items-center justify-between shadow-lg shadow-amber-500/5">
          <div>
            <span className="text-xs text-amber-400 font-bold block uppercase">3. Sedang Bongkar Muat</span>
            <span className="text-3xl font-black text-amber-300 font-mono">{activeUnloadingBookings.length}</span>
            <span className="text-[11px] text-amber-400/80 block">Proses di Pintu Bay</span>
          </div>
          <Zap className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-bold block uppercase">4. Selesai Bongkar</span>
            <span className="text-3xl font-black text-emerald-300 font-mono">{doneBookings.length}</span>
            <span className="text-[11px] text-slate-400 block">Gate-Out Tuntas</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
        {/* Left Side: Live Dock Bays Status (Cols 1-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Status Pintu Bongkar (Loading Bays 1 - {docks.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Terisi: {activeUnloadingBookings.length} / {docks.length} Bay
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {docks.map((dock) => {
              const activeBooking = dateBookings.find(
                (b) => b.dockId === dock.id && (b.status === 'UNLOADING' || b.status === 'ARRIVED')
              );

              const nextBooking = dateBookings.find(
                (b) =>
                  b.dockId === dock.id &&
                  (b.status === 'BOOKED' || b.status === 'CONFIRMED') &&
                  (!activeBooking || b.id !== activeBooking.id)
              );

              const isUnloading = activeBooking && activeBooking.status === 'UNLOADING';
              const isArrived = activeBooking && activeBooking.status === 'ARRIVED';

              const unloadingVar = activeBooking
                ? calculateUnloadingVariance(
                    activeBooking.durationMinutes,
                    activeBooking.actualStartUnload,
                    activeBooking.actualFinishUnload
                  )
                : null;

              return (
                <div
                  key={dock.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isUnloading
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-xl shadow-amber-500/10'
                      : isArrived
                      ? 'bg-cyan-950/30 border-cyan-500/50'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-base font-black text-white">{dock.dockName}</span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${
                          isUnloading
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : isArrived
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {isUnloading ? 'BONGKAR AKTIF' : isArrived ? 'TRUK DI GERBANG' : 'STANDBY (READY)'}
                      </span>
                    </div>

                    <div className="py-3">
                      {activeBooking ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-lg font-black text-cyan-300">
                              {activeBooking.licensePlate}
                            </span>
                            <span className="text-xs text-slate-300 font-semibold">
                              {activeBooking.vehicleName}
                            </span>
                          </div>
                          <div className="text-xs text-white font-medium line-clamp-1">
                            {activeBooking.itemDescription}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Supir: <strong className="text-slate-200">{activeBooking.driverName}</strong> • {activeBooking.supplierName}
                          </div>

                          {isUnloading && unloadingVar && (
                            <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-amber-800/60 flex items-center justify-between text-xs">
                              <span className="text-amber-400 font-bold">Waktu Berjalan:</span>
                              <span className="font-mono font-black text-amber-300">
                                {unloadingVar.actualMinutes} / {activeBooking.durationMinutes} mnt
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-500">
                          Pintu dock kosong & siap menerima truk.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Next booking info */}
                  {nextBooking && (
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Jadwal Berikutnya:</span>
                      <span className="font-mono text-blue-300 font-bold">
                        {formatTimeHM(nextBooking.startTime)} ({nextBooking.licensePlate})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Incoming Queue & Gate Log (Cols 8-12) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Antrean Kedatangan & Gerbang Masuk</span>
            </h2>
            <span className="text-xs text-cyan-400 font-mono font-bold">
              {arrivedBookings.length + bookedBookings.length} Menunggu
            </span>
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {/* Arrived list first */}
            {arrivedBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/50 flex items-center justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-black text-cyan-300">
                      {b.licensePlate}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500 text-slate-950">
                      TIBA DI GERBANG
                    </span>
                  </div>
                  <div className="text-xs text-white font-medium mt-1">{b.itemDescription}</div>
                  <div className="text-[11px] text-slate-400">
                    Dock: <strong className="text-emerald-400">{b.dockName}</strong> • {b.driverName}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-cyan-300 font-bold block">
                    Gate-In: {b.actualGateIn ? formatTimeHM(b.actualGateIn) : '--:--'}
                  </span>
                  <span className="text-[10px] text-slate-400">{b.vehicleName}</span>
                </div>
              </div>
            ))}

            {/* Upcoming booked */}
            {bookedBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-bold text-white">{b.licensePlate}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      TERJADWAL
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium mt-1">{b.itemDescription}</div>
                  <div className="text-[11px] text-slate-400">
                    Alokasi: <strong className="text-emerald-400">{b.dockName}</strong> • {b.supplierName}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-blue-400 font-bold block">
                    {formatTimeHM(b.startTime)} - {formatTimeHM(b.endTime)}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDuration(b.durationMinutes)}</span>
                </div>
              </div>
            ))}

            {arrivedBookings.length === 0 && bookedBookings.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                Tidak ada antrean truk menunggu saat ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
