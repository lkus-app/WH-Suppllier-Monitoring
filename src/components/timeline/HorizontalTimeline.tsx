import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import { Booking, Dock, DockType } from '../../types';
import { useApp } from '../../lib/store';
import {
  calculateTimelinePosition,
  extractDateStr,
  extractTimeStr,
  generateTimelineHours,
  timeStrToMinutes,
} from '../../lib/slotEngine';
import { formatDateIndo, formatDuration, formatTimeHM } from '../../lib/utils';
import { BookingDetailModal } from './BookingDetailModal';
import { GatePassModal } from '../supplier/GatePassModal';

export const HorizontalTimeline: React.FC = () => {
  const {
    bookings,
    docks,
    settings,
    selectedDate,
    setSelectedDate,
    setActiveView,
    currentUser,
  } = useApp();

  const [selectedDockType, setSelectedDockType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeBookingModal, setActiveBookingModal] = useState<Booking | null>(null);
  const [gatePassBooking, setGatePassBooking] = useState<Booking | null>(null);

  // Generate hourly intervals from 08:00 to 23:00
  const hours = generateTimelineHours(settings.factoryOpenTime, settings.factoryCloseTime, 60);

  // Filter bookings for selected date
  const dateBookings = bookings.filter((b) => extractDateStr(b.startTime) === selectedDate);

  // Filter docks
  const filteredDocks = docks.filter((d) => {
    if (!d.isActive) return false;
    if (selectedDockType === 'ALL') return true;
    return d.dockType === selectedDockType;
  });

  // Calculate statistics for the day
  const stats = {
    total: dateBookings.filter((b) => b.status !== 'CANCELLED').length,
    unloading: dateBookings.filter((b) => b.status === 'UNLOADING').length,
    arrived: dateBookings.filter((b) => b.status === 'ARRIVED').length,
    done: dateBookings.filter((b) => b.status === 'DONE').length,
    booked: dateBookings.filter((b) => b.status === 'BOOKED').length,
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Status color mapper
  const getBlockStyle = (status: Booking['status']) => {
    switch (status) {
      case 'UNLOADING':
        return 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-400/40 shadow-xs animate-pulse';
      case 'ARRIVED':
        return 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-xs';
      case 'BOOKED':
        return 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 shadow-xs';
      case 'DONE':
        return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 opacity-90';
      case 'CANCELLED':
        return 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 line-through';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getDockBadge = (type: DockType) => {
    switch (type) {
      case 'LIQUID_ISOTANK':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">TANGKI / ISOTANK</span>;
      case 'CONTAINER':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-50 text-purple-700 border border-purple-200">KONTAINER</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">GENERAL</span>;
    }
  };

  // Calculate cut-off line (19:00 max arrival) position percentage
  const maxArrivalMins = timeStrToMinutes(settings.maxArrivalBookingTime);
  const openMins = timeStrToMinutes(settings.factoryOpenTime);
  const closeMins = timeStrToMinutes(settings.factoryCloseTime);
  const totalDayMins = closeMins - openMins;
  const maxArrivalPercent = ((maxArrivalMins - openMins) / totalDayMins) * 100;

  return (
    <div className="space-y-4">
      {/* Top Controls & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        {/* Date Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-lg bg-slate-50 border border-slate-200 p-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-white transition-colors cursor-pointer"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 px-3 py-1 text-xs font-semibold text-slate-800">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{formatDateIndo(selectedDate)}</span>
            </div>
            <button
              onClick={handleNextDay}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-white transition-colors cursor-pointer"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 bg-white border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            Hari Ini
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
          />
        </div>

        {/* Status & Search Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dock Filter */}
          <div className="flex items-center rounded-lg bg-slate-50 border border-slate-200 p-1 text-xs">
            <span className="px-2 text-slate-500 font-medium flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-400" /> Dock:
            </span>
            {['ALL', 'GENERAL', 'LIQUID_ISOTANK', 'CONTAINER'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedDockType(type)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedDockType === type
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'ALL' ? 'Semua' : type === 'LIQUID_ISOTANK' ? 'Tangki' : type === 'CONTAINER' ? 'Kontainer' : 'General'}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari PO / Plat / Supir..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 w-44 lg:w-52"
            />
          </div>

          {/* Utilisasi Analytics CTA */}
          <button
            onClick={() => setActiveView('ANALYTICS')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-cyan-700 border border-cyan-200 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Buka Visualisasi Dock Utilization Rate Recharts"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Analisis Utilisasi</span>
          </button>

          {/* Supplier Booking CTA */}
          <button
            onClick={() => setActiveView('WIZARD')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Booking Slot Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Total Booking</span>
            <span className="text-lg font-bold text-slate-900 font-mono">{stats.total} <span className="text-xs font-normal text-slate-500">Armada</span></span>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-600 block font-medium">Sedang Bongkar</span>
            <span className="text-lg font-bold text-amber-700 font-mono">{stats.unloading} <span className="text-xs font-normal text-slate-500">Armada</span></span>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 animate-pulse">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-cyan-600 block font-medium">Antrean Gate-In</span>
            <span className="text-lg font-bold text-cyan-700 font-mono">{stats.arrived} <span className="text-xs font-normal text-slate-500">Armada</span></span>
          </div>
          <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-blue-600 block font-medium">Slot Terjadwal</span>
            <span className="text-lg font-bold text-blue-700 font-mono">{stats.booked} <span className="text-xs font-normal text-slate-500">Armada</span></span>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-600 block font-medium">Bongkar Selesai</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">{stats.done} <span className="text-xs font-normal text-slate-500">Armada</span></span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Shield className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Legend & Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-2 text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-100 border border-blue-400 inline-block"></span>
            <span>Terjadwal (Booked)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-cyan-100 border border-cyan-400 inline-block"></span>
            <span>Gate-In (Tiba di Pabrik)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-100 border border-amber-400 inline-block animate-pulse"></span>
            <span>Sedang Bongkar (Unloading)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-400 inline-block"></span>
            <span>Selesai (Gate-Out)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-200 border border-slate-300 inline-block"></span>
            <span>Area Tutup Booking (&gt; 19:00)</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>Klik blok jadwal untuk melihat detail PO, driver, atau update status gudang.</span>
        </div>
      </div>

      {/* Horizontal Gantt / Timeline Grid Container */}
      <div className="relative rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[960px] pb-4">
            {/* Header: Time Axis */}
            <div className="grid grid-cols-[220px_1fr] border-b border-slate-200 bg-slate-50 sticky top-0 z-20">
              <div className="p-3.5 font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-2 border-r border-slate-200">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Pintu Dock / Bay</span>
              </div>
              <div className="relative h-12 flex items-center">
                {/* Time labels */}
                {hours.map((h) => {
                  const leftPercent = ((h.minutes - openMins) / totalDayMins) * 100;
                  return (
                    <div
                      key={h.label}
                      className="absolute top-0 bottom-0 flex flex-col justify-between py-1.5 -translate-x-1/2 text-center"
                      style={{ left: `${leftPercent}%` }}
                    >
                      <span className="text-xs font-mono font-semibold text-slate-700">{h.label}</span>
                      <div className="w-px h-2 bg-slate-300 mx-auto" />
                    </div>
                  );
                })}

                {/* Booking cutoff marker indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10 flex flex-col items-center"
                  style={{ left: `${maxArrivalPercent}%` }}
                  title="Batas Maksimal Kedatangan (19:00 WIB)"
                >
                  <span className="absolute -top-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500 text-slate-950 whitespace-nowrap shadow-xs">
                    Max Arrival 19:00
                  </span>
                </div>
              </div>
            </div>

            {/* Docks Rows */}
            <div className="divide-y divide-slate-100">
              {filteredDocks.map((dock) => {
                // Get bookings for this dock on selected date
                const dockBookings = dateBookings.filter((b) => {
                  if (b.dockId !== dock.id) return false;
                  if (searchFilter.trim()) {
                    const q = searchFilter.toLowerCase();
                    const matchPO = b.poNumber.toLowerCase().includes(q);
                    const matchDriver = b.driverName.toLowerCase().includes(q);
                    const matchPlate = b.licensePlate.toLowerCase().includes(q);
                    const matchSupplier = b.supplierName.toLowerCase().includes(q);
                    if (!matchPO && !matchDriver && !matchPlate && !matchSupplier) return false;
                  }
                  return true;
                });

                return (
                  <div
                    key={dock.id}
                    className="grid grid-cols-[220px_1fr] hover:bg-slate-50/60 transition-colors group relative min-h-[92px]"
                  >
                    {/* Left: Dock Info */}
                    <div className="p-3.5 border-r border-slate-200 flex flex-col justify-between bg-slate-50/40">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sm text-slate-900">{dock.dockName}</span>
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          {getDockBadge(dock.dockType)}
                          {dock.maxTonnage && (
                            <span className="text-[10px] text-slate-500 font-medium">Max {dock.maxTonnage}T</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                        {dock.notes || 'Operasional normal'}
                      </span>
                    </div>

                    {/* Right: Gantt Track Area */}
                    <div className="relative h-full py-2">
                      {/* Background Vertical Hour Grid Lines */}
                      {hours.map((h) => {
                        const leftPercent = ((h.minutes - openMins) / totalDayMins) * 100;
                        return (
                          <div
                            key={h.label}
                            className="absolute top-0 bottom-0 w-px border-l border-slate-100 pointer-events-none"
                            style={{ left: `${leftPercent}%` }}
                          />
                        );
                      })}

                      {/* Shaded Area for Post-19:00 (Booking Closed window) */}
                      <div
                        className="absolute top-0 bottom-0 right-0 bg-slate-100/60 border-l border-amber-400/40 pointer-events-none"
                        style={{ left: `${maxArrivalPercent}%` }}
                      />

                      {/* Render Bookings on this Dock */}
                      {dockBookings.map((b) => {
                        const pos = calculateTimelinePosition(
                          b.startTime,
                          b.endTime,
                          settings.factoryOpenTime,
                          settings.factoryCloseTime
                        );

                        if (!pos.isWithinBounds) return null;

                        return (
                          <div
                            key={b.id}
                            onClick={() => setActiveBookingModal(b)}
                            className={`absolute top-2 bottom-2 rounded-lg p-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:z-30 overflow-hidden flex flex-col justify-between ${getBlockStyle(
                              b.status
                            )}`}
                            style={{
                              left: `${pos.leftPercent}%`,
                              width: `${pos.widthPercent}%`,
                            }}
                            title={`${b.bookingCode} | ${b.supplierName} (${b.licensePlate}) - ${formatTimeHM(
                              b.startTime
                            )} s/d ${formatTimeHM(b.endTime)}`}
                          >
                            {/* Top info */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center space-x-1.5 overflow-hidden">
                                <span className="font-mono text-xs font-bold uppercase tracking-tight truncate">
                                  {b.licensePlate}
                                </span>
                                <span className="text-[10px] font-semibold opacity-80 truncate hidden sm:inline">
                                  • {b.vehicleCode}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-medium opacity-80 shrink-0">
                                {formatTimeHM(b.startTime)} - {formatTimeHM(b.endTime)}
                              </span>
                            </div>

                            {/* Bottom info */}
                            <div className="flex items-center justify-between text-[10px] opacity-90 truncate gap-1">
                              <span className="truncate font-medium">
                                {b.poNumber}: {b.itemDescription}
                              </span>
                              <span className="shrink-0 font-bold font-mono">
                                {b.qty.toLocaleString()} {b.unit}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Empty state hint if dock has no bookings */}
                      {dockBookings.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 pointer-events-none">
                          <span className="italic">Tidak ada jadwal bongkar (Dock Kosong)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {activeBookingModal && (
        <BookingDetailModal
          booking={activeBookingModal}
          onClose={() => setActiveBookingModal(null)}
          onPrintPass={(bk) => {
            setActiveBookingModal(null);
            setGatePassBooking(bk);
          }}
        />
      )}

      {/* Gate Pass Printable Modal */}
      {gatePassBooking && (
        <GatePassModal
          booking={gatePassBooking}
          onClose={() => setGatePassBooking(null)}
        />
      )}
    </div>
  );
};
