import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Maximize2,
  Package,
  Phone,
  Play,
  QrCode,
  Shield,
  Truck,
  User,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Booking, Dock, DockType } from '../../types';
import { useApp } from '../../lib/store';
import {
  calculateArrivalVariance,
  calculateUnloadingVariance,
  formatDateIndo,
  formatDuration,
  formatTimeHM,
} from '../../lib/utils';
import { extractDateStr } from '../../lib/slotEngine';
import { WarehouseExecutionModal } from './WarehouseExecutionModal';
import { GatePassModal } from '../supplier/GatePassModal';

interface WarehouseDockGridProps {
  onSelectBooking?: (booking: Booking) => void;
}

export const WarehouseDockGrid: React.FC<WarehouseDockGridProps> = ({ onSelectBooking }) => {
  const { docks, bookings, selectedDate, updateWarehouseExecution } = useApp();

  const [selectedBookingForExecution, setSelectedBookingForExecution] = useState<Booking | null>(null);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<Booking | null>(null);

  // Filter bookings for the selected date
  const dateBookings = bookings.filter(
    (b) => extractDateStr(b.startTime) === selectedDate && b.status !== 'CANCELLED'
  );

  const getDockBadge = (type: DockType) => {
    switch (type) {
      case 'LIQUID_ISOTANK':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            TANGKI / CAIRAN
          </span>
        );
      case 'CONTAINER':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            KONTAINER
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            GENERAL CARGO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Grid of Dock Bays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {docks.map((dock) => {
          // Find currently active booking in this bay (UNLOADING or ARRIVED)
          const activeBooking = dateBookings.find(
            (b) => b.dockId === dock.id && (b.status === 'UNLOADING' || b.status === 'ARRIVED')
          );

          // Next upcoming scheduled booking for this bay
          const nextBooking = dateBookings.find(
            (b) =>
              b.dockId === dock.id &&
              (b.status === 'BOOKED' || b.status === 'CONFIRMED') &&
              (!activeBooking || b.id !== activeBooking.id)
          );

          const isUnloading = activeBooking && activeBooking.status === 'UNLOADING';
          const isArrived = activeBooking && activeBooking.status === 'ARRIVED';
          const isOccupied = isUnloading || isArrived;

          // Calculate variance if active
          const unloadingVar = activeBooking
            ? calculateUnloadingVariance(
                activeBooking.durationMinutes,
                activeBooking.actualStartUnload,
                activeBooking.actualFinishUnload
              )
            : null;

          const progressPercent = activeBooking && isUnloading && activeBooking.durationMinutes > 0
            ? Math.min(100, Math.round(((unloadingVar?.actualMinutes || 0) / activeBooking.durationMinutes) * 100))
            : 0;

          return (
            <div
              key={dock.id}
              className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm ${
                isUnloading
                  ? 'bg-white border-amber-300 ring-1 ring-amber-400/40'
                  : isArrived
                  ? 'bg-white border-cyan-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  isUnloading
                    ? 'bg-amber-50/70 border-amber-200'
                    : isArrived
                    ? 'bg-cyan-50/70 border-cyan-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`p-2 rounded-lg border ${
                      isUnloading
                        ? 'bg-amber-100 border-amber-200 text-amber-800'
                        : isArrived
                        ? 'bg-cyan-100 border-cyan-200 text-cyan-800'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{dock.dockName}</h3>
                    <div className="mt-0.5">{getDockBadge(dock.dockType)}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md border inline-block ${
                      isUnloading
                        ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        : isArrived
                        ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isUnloading ? 'SEDANG BONGKAR' : isArrived ? 'TRUK DI GERBANG' : 'DOCK TERSEDIA'}
                  </span>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="p-4 space-y-3.5 flex-1">
                {activeBooking ? (
                  <div className="space-y-3">
                    {/* Truck & Driver Highlights */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
                          {activeBooking.licensePlate}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {activeBooking.vehicleName}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-semibold text-slate-900 truncate">
                          {activeBooking.itemDescription}
                        </div>
                        <div className="text-slate-500 flex items-center justify-between text-[11px]">
                          <span>PO: <strong className="text-slate-800 font-mono">{activeBooking.poNumber}</strong></span>
                          <span>{activeBooking.qty.toLocaleString()} {activeBooking.unit}</span>
                        </div>
                        <div className="text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-200 text-[11px]">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Supir: {activeBooking.driverName}</span>
                          {activeBooking.driverPhone && (
                            <span className="text-slate-400">({activeBooking.driverPhone})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Live Unloading Progress & Variance */}
                    {isUnloading && unloadingVar && (
                      <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-900 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            Progres Pembongkaran:
                          </span>
                          <span className="font-mono font-bold text-amber-800">
                            {unloadingVar.actualMinutes} / {activeBooking.durationMinutes} mnt
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-amber-100 overflow-hidden border border-amber-200">
                          <div
                            className={`h-full transition-all duration-500 ${
                              progressPercent >= 100
                                ? 'bg-rose-500 animate-pulse'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Mulai: {formatTimeHM(activeBooking.actualStartUnload || activeBooking.startTime)}</span>
                          <span className={`font-bold ${unloadingVar.status === 'OVERTIME' ? 'text-rose-600' : 'text-amber-700'}`}>
                            {unloadingVar.label}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Unloading Staff & Notes Preview */}
                    <div className="text-xs space-y-1 p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Checker / Operator:
                        </span>
                        <span className="text-slate-900 font-medium">
                          {activeBooking.unloadingStaffName || 'Belum Ditugaskan'}
                        </span>
                      </div>
                      {activeBooking.warehouseNotes && (
                        <div className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200">
                          "{activeBooking.warehouseNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2 my-auto">
                    <Shield className="w-8 h-8 text-emerald-500/40 mx-auto" />
                    <span className="text-xs font-semibold text-emerald-700 block">Pintu Dock Siap (Standby)</span>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Bay ini kosong dan siap menerima antrean truk berikutnya sesuai jadwal.
                    </p>
                  </div>
                )}

                {/* Upcoming Next Booking */}
                {nextBooking && (
                  <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">
                      Antrean Jadwal Berikutnya:
                    </span>
                    <div className="flex items-center justify-between mt-1 font-mono text-slate-800">
                      <span>
                        {formatTimeHM(nextBooking.startTime)} - {formatTimeHM(nextBooking.endTime)}
                      </span>
                      <span className="text-blue-700 font-bold">{nextBooking.licensePlate}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                {activeBooking ? (
                  <>
                    <button
                      onClick={() => setSelectedBookingForExecution(activeBooking)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Buka Form Eksekusi
                    </button>

                    {isArrived && (
                      <button
                        onClick={() => {
                          const nowISO = new Date().toISOString();
                          updateWarehouseExecution(activeBooking.id, {
                            status: 'UNLOADING',
                            actualStartUnload: nowISO,
                          });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Mulai Bongkar</span>
                      </button>
                    )}

                    {isUnloading && (
                      <button
                        onClick={() => {
                          const nowISO = new Date().toISOString();
                          updateWarehouseExecution(activeBooking.id, {
                            status: 'DONE',
                            actualFinishUnload: nowISO,
                            actualGateOut: nowISO,
                          });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai Bongkar</span>
                      </button>
                    )}
                  </>
                ) : nextBooking ? (
                  <button
                    onClick={() => setSelectedBookingForExecution(nextBooking)}
                    className="w-full py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    Lihat Jadwal Berikutnya ({nextBooking.licensePlate})
                  </button>
                ) : (
                  <div className="w-full py-1.5 text-center text-xs text-slate-400">
                    Tidak ada jadwal menunggu untuk bay ini.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Modal */}
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

      {/* Gate Pass Modal */}
      {selectedBookingForPass && (
        <GatePassModal
          booking={selectedBookingForPass}
          onClose={() => setSelectedBookingForPass(null)}
        />
      )}
    </div>
  );
};
