import React from 'react';
import {
  Clock,
  Warehouse,
  Truck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { StatusBadge } from './StatusBadge';

interface MiniDockTimelineProps {
  onViewFullTimeline?: () => void;
}

export const MiniDockTimeline: React.FC<MiniDockTimelineProps> = ({ onViewFullTimeline }) => {
  const { docks, bookings, selectedDate, setSelectedDate, setCurrentSubView } = useApp();

  // Filter bookings for the selected date
  const dayBookings = bookings.filter((b) => b.startTime.startsWith(selectedDate));

  // Quick summary stats
  const totalSlotsToday = dayBookings.length;
  const activeUnloading = dayBookings.filter((b) => b.status === 'UNLOADING').length;
  const bookedUpcoming = dayBookings.filter((b) => b.status === 'BOOKED' || b.status === 'CONFIRMED').length;

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Warehouse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Mini Dock Timeline</h3>
            <p className="text-[11px] text-slate-500 font-mono">Tanggal: {selectedDate}</p>
          </div>
        </div>

        {onViewFullTimeline ? (
          <button
            onClick={onViewFullTimeline}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Live Gantt</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentSubView('MONITOR_SLOTS')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Mini KPI Pill */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-1.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-medium block">Total Slot</span>
          <span className="font-bold text-slate-900 text-sm">{totalSlotsToday}</span>
        </div>
        <div className="p-1.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] text-amber-600 font-medium block">Unload Live</span>
          <span className="font-bold text-amber-700 text-sm">{activeUnloading}</span>
        </div>
        <div className="p-1.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] text-blue-600 font-medium block">Booked ETA</span>
          <span className="font-bold text-blue-700 text-sm">{bookedUpcoming}</span>
        </div>
      </div>

      {/* Dock Bays Status List */}
      <div className="p-4 space-y-3.5 flex-1 overflow-y-auto max-h-[420px]">
        {docks.map((dock) => {
          const dockBookings = dayBookings.filter((b) => b.dockId === dock.id);
          const currentOccupant = dockBookings.find((b) => b.status === 'UNLOADING');

          return (
            <div
              key={dock.id}
              className="p-3 rounded-lg bg-slate-50/60 border border-slate-200 hover:border-slate-300 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-slate-900">{dock.name}</span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {dock.type}
                  </span>
                </div>
                {dock.status === 'MAINTENANCE' ? (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Maintenance
                  </span>
                ) : currentOccupant ? (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                    ● Bongkar Aktif
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Tersedia
                  </span>
                )}
              </div>

              {/* Occupant or Slot preview */}
              {currentOccupant ? (
                <div className="p-2 rounded bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 truncate">
                      {currentOccupant.vehicleName || 'Armada Bongkar'}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-amber-700">
                      {currentOccupant.startTime.slice(11, 16)} - {currentOccupant.endTime.slice(11, 16)}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 truncate">
                    Vendor: {currentOccupant.supplierName || 'PT Sumber Logistik'}
                  </p>
                </div>
              ) : dockBookings.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Jadwal Terdaftar ({dockBookings.length} Armada):
                  </span>
                  <div className="space-y-1">
                    {dockBookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200 text-[11px]"
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          <Truck className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">
                            {b.supplierName || b.vehicleName}
                          </span>
                        </div>
                        <span className="font-mono text-slate-600 shrink-0 font-medium">
                          {b.startTime.slice(11, 16)} - {b.endTime.slice(11, 16)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Tidak ada antrean hari ini.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
