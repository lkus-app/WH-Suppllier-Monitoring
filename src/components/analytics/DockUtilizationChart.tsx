import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Line,
  ComposedChart,
  Area,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Truck,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { Booking, Dock } from '../../types';
import { timeStrToMinutes, formatTimeHM } from '../../lib/slotEngine';

interface DayDockData {
  date: string;
  dayLabel: string;
  fullDateLabel: string;
  isToday: boolean;
  totalBookings: number;
  totalBookedMinutes: number;
  factoryUtilizationRate: number; // overall percentage across all docks
  [key: string]: any; // dock utilization rates e.g. dock_dock-1_rate: 65, dock_dock-1_hours: 9.75, dock_dock-1_count: 3
}

export const DockUtilizationChart: React.FC = () => {
  const { bookings, docks, settings, selectedDate, setSelectedDate, setActiveView } = useApp();

  // Controls
  const [metricMode, setMetricMode] = useState<'UTILIZATION_RATE' | 'HOURS' | 'TRUCK_COUNT'>('UTILIZATION_RATE');
  const [chartType, setChartType] = useState<'GROUPED' | 'STACKED' | 'COMPOSED'>('GROUPED');
  const [selectedDockFilter, setSelectedDockFilter] = useState<string[]>(docks.map((d) => d.id));
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, -1 = last week, +1 = next week

  // Color palette for docks
  const dockColors: Record<string, { main: string; light: string; border: string; badge: string }> = {
    'dock-1': { main: '#38bdf8', light: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    'dock-2': { main: '#818cf8', light: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    'dock-3': { main: '#34d399', light: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    'dock-4': { main: '#fbbf24', light: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    'dock-5': { main: '#f43f5e', light: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  };

  const getDockColor = (dockId: string, index: number) => {
    if (dockColors[dockId]) return dockColors[dockId];
    const fallbackPalette = ['#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];
    const color = fallbackPalette[index % fallbackPalette.length];
    return {
      main: color,
      light: `${color}25`,
      border: `${color}60`,
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  };

  // Factory daily operating capacity
  const factoryOpenMins = timeStrToMinutes(settings.factoryOpenTime);
  const factoryCloseMins = timeStrToMinutes(settings.factoryCloseTime);
  const totalDailyCapacityMinutesPerDock = Math.max(60, factoryCloseMins - factoryOpenMins); // e.g. 900 mins = 15 hours
  const totalDailyOperatingHoursPerDock = totalDailyCapacityMinutesPerDock / 60;

  // Generate 7 days of the target week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const today = new Date();
    // Find current Monday
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + weekOffset * 7);

    const days: Array<{ dateStr: string; dateObj: Date; dayName: string; formatted: string; isToday: boolean }> = [];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === today.toISOString().split('T')[0];
      days.push({
        dateStr,
        dateObj: d,
        dayName: dayNames[i],
        formatted: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        isToday,
      });
    }
    return days;
  }, [weekOffset]);

  // Aggregate daily data per dock and total factory
  const chartData = useMemo(() => {
    return weekDays.map((day) => {
      const item: DayDockData = {
        date: day.dateStr,
        dayLabel: `${day.dayName} (${day.formatted})`,
        fullDateLabel: `${day.dayName}, ${day.dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        isToday: day.isToday,
        totalBookings: 0,
        totalBookedMinutes: 0,
        factoryUtilizationRate: 0,
      };

      // Filter bookings for this date excluding cancelled ones
      const dayBookings = bookings.filter(
        (b) => b.startTime.startsWith(day.dateStr) && b.status !== 'CANCELLED'
      );

      let totalDayBookedMinutesAllDocks = 0;
      let activeDocksCount = 0;

      docks.forEach((dock) => {
        const dockBookings = dayBookings.filter((b) => b.dockId === dock.id);
        const bookedMins = dockBookings.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
        const bookedHours = Number((bookedMins / 60).toFixed(1));
        const rate = Math.min(100, Math.round((bookedMins / totalDailyCapacityMinutesPerDock) * 100));

        item[`${dock.id}_rate`] = rate;
        item[`${dock.id}_hours`] = bookedHours;
        item[`${dock.id}_count`] = dockBookings.length;
        item[`${dock.id}_name`] = dock.dockName;

        totalDayBookedMinutesAllDocks += bookedMins;
        if (dock.isActive) activeDocksCount += 1;
      });

      item.totalBookings = dayBookings.length;
      item.totalBookedMinutes = totalDayBookedMinutesAllDocks;
      
      const totalPossibleCapacityAllDocks = totalDailyCapacityMinutesPerDock * Math.max(1, activeDocksCount);
      item.factoryUtilizationRate = Math.min(
        100,
        Math.round((totalDayBookedMinutesAllDocks / totalPossibleCapacityAllDocks) * 100)
      );

      return item;
    });
  }, [weekDays, bookings, docks, totalDailyCapacityMinutesPerDock]);

  // Aggregate weekly metrics per dock to determine the busiest dock
  const dockWeeklySummary = useMemo(() => {
    return docks.map((dock, index) => {
      let totalMinutes = 0;
      let totalTrucks = 0;
      let maxDayRate = 0;
      let maxDayName = '';

      chartData.forEach((dayData) => {
        const rate = dayData[`${dock.id}_rate`] || 0;
        const hours = dayData[`${dock.id}_hours`] || 0;
        const count = dayData[`${dock.id}_count`] || 0;

        totalMinutes += hours * 60;
        totalTrucks += count;

        if (rate > maxDayRate) {
          maxDayRate = rate;
          maxDayName = dayData.dayLabel;
        }
      });

      const totalWeekCapacityMinutes = totalDailyCapacityMinutesPerDock * 7;
      const averageUtilizationRate = Math.min(100, Math.round((totalMinutes / totalWeekCapacityMinutes) * 100));
      const totalHours = Number((totalMinutes / 60).toFixed(1));

      return {
        dockId: dock.id,
        dockName: dock.dockName,
        dockType: dock.dockType,
        totalHours,
        totalTrucks,
        averageUtilizationRate,
        maxDayRate,
        maxDayName,
        color: getDockColor(dock.id, index),
      };
    }).sort((a, b) => b.averageUtilizationRate - a.averageUtilizationRate);
  }, [docks, chartData, totalDailyCapacityMinutesPerDock]);

  // Top KPIs
  const busiestDock = dockWeeklySummary[0];
  const peakDay = useMemo(() => {
    let highest = chartData[0];
    chartData.forEach((d) => {
      if (d.factoryUtilizationRate > (highest?.factoryUtilizationRate || 0)) {
        highest = d;
      }
    });
    return highest;
  }, [chartData]);

  const factoryWeeklyAvgRate = useMemo(() => {
    if (!chartData.length) return 0;
    const sum = chartData.reduce((acc, d) => acc + d.factoryUtilizationRate, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  const totalWeeklyTrucks = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.totalBookings, 0);
  }, [chartData]);

  // Toggle dock filter
  const toggleDockFilter = (dockId: string) => {
    setSelectedDockFilter((prev) => {
      if (prev.includes(dockId)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((id) => id !== dockId);
      } else {
        return [...prev, dockId];
      }
    });
  };

  const selectAllDocks = () => setSelectedDockFilter(docks.map((d) => d.id));

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload as DayDockData;
      return (
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xl text-xs space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {dataPoint?.fullDateLabel || label}
            </span>
            {dataPoint?.isToday && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                HARI INI
              </span>
            )}
          </div>

          <div className="space-y-1.5 py-1">
            <div className="flex items-center justify-between font-semibold text-slate-700 pb-1 border-b border-slate-100">
              <span>Utilisasi Seluruh Pabrik:</span>
              <span className="font-mono font-bold text-blue-700">
                {dataPoint?.factoryUtilizationRate}% ({dataPoint?.totalBookings} Armada)
              </span>
            </div>

            {docks
              .filter((d) => selectedDockFilter.includes(d.id))
              .map((dock) => {
                const rate = dataPoint?.[`${dock.id}_rate`] || 0;
                const hours = dataPoint?.[`${dock.id}_hours`] || 0;
                const count = dataPoint?.[`${dock.id}_count`] || 0;
                const color = dockColors[dock.id]?.main || '#38bdf8';

                return (
                  <div key={dock.id} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-slate-700 truncate max-w-[140px]">{dock.dockName}</span>
                    </div>
                    <div className="font-mono text-right">
                      {metricMode === 'UTILIZATION_RATE' && (
                        <span className="font-bold text-slate-900">
                          {rate}% <span className="text-slate-400 font-normal">({hours}j)</span>
                        </span>
                      )}
                      {metricMode === 'HOURS' && (
                        <span className="font-bold text-slate-900">
                          {hours} Jam <span className="text-slate-400 font-normal">({rate}%)</span>
                        </span>
                      )}
                      {metricMode === 'TRUCK_COUNT' && (
                        <span className="font-bold text-slate-900">
                          {count} Truk <span className="text-slate-400 font-normal">({hours}j)</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Kapasitas Harian:</span>
            <span className="font-mono font-medium">{totalDailyOperatingHoursPerDock} Jam/Dock</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Dock Utilization Rate & Analisis Kepadatan Mingguan</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Recharts Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasi persentase kapasitas terpakai tiap pintu dock per hari ({settings.factoryOpenTime} - {settings.factoryCloseTime} WIB) & identifikasi dock tersibuk.
              </p>
            </div>
          </div>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-lg bg-slate-50 border border-slate-200 p-1">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              title="Minggu Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-800 min-w-[140px] text-center">
              {weekOffset === 0
                ? 'Minggu Ini'
                : weekOffset === -1
                ? 'Minggu Lalu'
                : weekOffset === 1
                ? 'Minggu Depan'
                : `${Math.abs(weekOffset)} Minggu ${weekOffset < 0 ? 'Lalu' : 'Mendatang'}`}
            </span>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              title="Minggu Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              Kembali ke Hari Ini
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards: Weekly Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Busiest Dock */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              Dock Tersibuk Minggu Ini
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              #1 Terpadat
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 truncate">{busiestDock?.dockName || '-'}</h3>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black font-mono text-amber-700">
                {busiestDock?.averageUtilizationRate || 0}%
              </span>
              <span className="text-xs text-slate-500">
                rata-rata ({busiestDock?.totalHours || 0} jam total)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Puncak: <strong className="text-slate-800">{busiestDock?.maxDayRate}%</strong> pada {busiestDock?.maxDayName}
          </p>
        </div>

        {/* KPI 2: Peak Utilization Day */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              Hari Puncak (Peak Day)
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              Volume Tertinggi
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 truncate">{peakDay?.fullDateLabel || '-'}</h3>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black font-mono text-rose-700">
                {peakDay?.factoryUtilizationRate || 0}%
              </span>
              <span className="text-xs text-slate-500">
                kapasitas pabrik ({peakDay?.totalBookings || 0} truk)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Total waktu bongkar: <strong className="text-slate-800">{Number(((peakDay?.totalBookedMinutes || 0) / 60).toFixed(1))} jam</strong>
          </p>
        </div>

        {/* KPI 3: Average Factory Utilization */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Rata-rata Utilisasi Pabrik
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              5 Pintu Dock
            </span>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black font-mono text-blue-700">
                {factoryWeeklyAvgRate}%
              </span>
              <span className="text-xs text-slate-500">dari target kapasitas 75%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  factoryWeeklyAvgRate > 80
                    ? 'bg-rose-500'
                    : factoryWeeklyAvgRate > 60
                    ? 'bg-emerald-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, factoryWeeklyAvgRate)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Kapasitas: <strong className="text-slate-800">{totalDailyOperatingHoursPerDock * 5} Jam/Hari</strong>
          </p>
        </div>

        {/* KPI 4: Total Trucks Serviced */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              Total Armada Terjadwal
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              7 Hari
            </span>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black font-mono text-emerald-700">
                {totalWeeklyTrucks}
              </span>
              <span className="text-xs text-slate-500">Armada Truk</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Rata-rata {Number((totalWeeklyTrucks / 7).toFixed(1))} truk / hari
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Status: <strong className="text-emerald-700">Terkendali & Bebas Antrean Macet</strong>
          </p>
        </div>
      </div>

      {/* Main Recharts Visualization Card */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
        {/* Visualization Controls & View Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Metric Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setMetricMode('UTILIZATION_RATE')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                metricMode === 'UTILIZATION_RATE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tingkat Utilisasi (%)
            </button>
            <button
              onClick={() => setMetricMode('HOURS')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                metricMode === 'HOURS'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total Durasi (Jam)
            </button>
            <button
              onClick={() => setMetricMode('TRUCK_COUNT')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                metricMode === 'TRUCK_COUNT'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jumlah Truk
            </button>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setChartType('GROUPED')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                chartType === 'GROUPED'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grouped Bars
            </button>
            <button
              onClick={() => setChartType('STACKED')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                chartType === 'STACKED'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stacked Bars
            </button>
            <button
              onClick={() => setChartType('COMPOSED')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                chartType === 'COMPOSED'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trendline + Area
            </button>
          </div>
        </div>

        {/* Dock Visibility Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filter Pintu Dock:
          </span>
          <button
            onClick={selectAllDocks}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
          >
            Semua
          </button>
          {docks.map((dock, idx) => {
            const isSelected = selectedDockFilter.includes(dock.id);
            const color = dockColors[dock.id]?.main || '#38bdf8';
            return (
              <button
                key={dock.id}
                onClick={() => toggleDockFilter(dock.id)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center space-x-1.5 transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 border-slate-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: isSelected ? color : '#cbd5e1' }}
                />
                <span>{dock.dockName.split(' ')[0]} {dock.dockName.split(' ')[1]}</span>
              </button>
            );
          })}
        </div>

        {/* Chart Canvas */}
        <div className="w-full h-80 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'COMPOSED' ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, metricMode === 'UTILIZATION_RATE' ? 100 : 'auto']}
                  unit={metricMode === 'UTILIZATION_RATE' ? '%' : ''}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <ReferenceLine
                  y={75}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Batas Ideal (75%)',
                    fill: '#b45309',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />

                {/* Background Area for Factory Overall Utilization */}
                <Area
                  type="monotone"
                  dataKey="factoryUtilizationRate"
                  name="Utilisasi Total Pabrik (%)"
                  fill="rgba(59, 130, 246, 0.08)"
                  stroke="#2563eb"
                  strokeWidth={2}
                />

                {/* Individual Dock Lines */}
                {docks
                  .filter((d) => selectedDockFilter.includes(d.id))
                  .map((dock) => {
                    const dataKey =
                      metricMode === 'UTILIZATION_RATE'
                        ? `${dock.id}_rate`
                        : metricMode === 'HOURS'
                        ? `${dock.id}_hours`
                        : `${dock.id}_count`;
                    const color = dockColors[dock.id]?.main || '#38bdf8';
                    return (
                      <Line
                        key={dock.id}
                        type="monotone"
                        dataKey={dataKey}
                        name={dock.dockName}
                        stroke={color}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: color }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}
              </ComposedChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[
                    0,
                    chartType === 'STACKED'
                      ? 'auto'
                      : metricMode === 'UTILIZATION_RATE'
                      ? 100
                      : 'auto',
                  ]}
                  unit={chartType === 'GROUPED' && metricMode === 'UTILIZATION_RATE' ? '%' : ''}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                {chartType === 'GROUPED' && metricMode === 'UTILIZATION_RATE' && (
                  <ReferenceLine
                    y={75}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Target 75%',
                      fill: '#b45309',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                )}

                {/* Bars for each dock */}
                {docks
                  .filter((d) => selectedDockFilter.includes(d.id))
                  .map((dock) => {
                    const dataKey =
                      metricMode === 'UTILIZATION_RATE'
                        ? `${dock.id}_rate`
                        : metricMode === 'HOURS'
                        ? `${dock.id}_hours`
                        : `${dock.id}_count`;
                    const color = dockColors[dock.id]?.main || '#38bdf8';

                    return (
                      <Bar
                        key={dock.id}
                        dataKey={dataKey}
                        name={dock.dockName}
                        fill={color}
                        stackId={chartType === 'STACKED' ? 'a' : undefined}
                        radius={chartType === 'STACKED' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                      />
                    );
                  })}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Section: Busiest Docks Ranking Leaderboard & Day-by-Day Heatmap Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 Cols): Leaderboard & Busiest Ranking */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Peringkat Kepadatan Dock Mingguan</span>
            </h3>
            <span className="text-[11px] text-slate-500">Urutan Tersibuk</span>
          </div>

          <p className="text-xs text-slate-500">
            Daftar seluruh pintu dock diurutkan berdasarkan rata-rata utilisasi sepanjang 7 hari operasional.
          </p>

          <div className="space-y-2.5">
            {dockWeeklySummary.map((dock, idx) => {
              const rankIcons = ['🥇 #1', '🥈 #2', '🥉 #3', '#4', '#5'];
              const isTop = idx === 0;

              return (
                <div
                  key={dock.dockId}
                  className={`p-3 rounded-xl border transition-all ${
                    isTop
                      ? 'bg-amber-50/60 border-amber-200 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-black font-mono ${
                          isTop
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rankIcons[idx] || `#${idx + 1}`}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{dock.dockName}</span>
                          <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {dock.dockType}
                          </span>
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {dock.totalTrucks} Armada Truk • {dock.totalHours} Jam Terpakai
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {dock.averageUtilizationRate}%
                      </span>
                      <span className="block text-[10px] text-slate-400">Utilisasi Avg</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dock.averageUtilizationRate}%`,
                        backgroundColor: dock.color.main,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                    <span>
                      Hari Puncak: <strong className="text-slate-800">{dock.maxDayName}</strong>
                    </span>
                    <span className="font-semibold text-slate-700">
                      Beban Max: {dock.maxDayRate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 Cols): Day x Dock Heatmap Matrix */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Matriks Utilisasi Harian (Day x Dock Heatmap)</span>
              </h3>
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2 h-2 rounded bg-emerald-500" /> &lt;50%
                </span>
                <span className="flex items-center gap-1 text-blue-700">
                  <span className="w-2 h-2 rounded bg-blue-500" /> 50-75%
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="w-2 h-2 rounded bg-amber-500" /> 75-90%
                </span>
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2 h-2 rounded bg-rose-500" /> &gt;90%
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Klik salah satu hari untuk langsung membuka jadwal detail pada tampilan Gantt Timeline.
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Hari / Tanggal</th>
                    {docks.map((d) => (
                      <th key={d.id} className="p-3 text-center">
                        {d.dockName.split(' ')[0]} {d.dockName.split(' ')[1]}
                      </th>
                    ))}
                    <th className="p-3 text-right">Pabrik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {chartData.map((day) => (
                    <tr
                      key={day.date}
                      onClick={() => {
                        setSelectedDate(day.date);
                        setActiveView('TIMELINE');
                      }}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        day.isToday ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-slate-900 flex items-center space-x-1.5">
                        <span>{day.dayLabel}</span>
                        {day.isToday && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-blue-100 text-blue-800">
                            Hari Ini
                          </span>
                        )}
                      </td>

                      {docks.map((dock) => {
                        const rate = day[`${dock.id}_rate`] || 0;
                        const hours = day[`${dock.id}_hours`] || 0;

                        let pillColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        if (rate > 90) pillColor = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
                        else if (rate >= 75) pillColor = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
                        else if (rate >= 50) pillColor = 'bg-blue-50 text-blue-700 border-blue-200';
                        else if (rate > 0) pillColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                        return (
                          <td key={dock.id} className="p-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-xs font-mono border ${pillColor}`}
                              title={`${hours} Jam terpakai dari ${totalDailyOperatingHoursPerDock} Jam`}
                            >
                              {rate}%
                            </span>
                          </td>
                        );
                      })}

                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        {day.factoryUtilizationRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Slot interval 30 menit • Waktu bongkar terkunci otomatis sesuai master armada
            </span>

            <button
              onClick={() => setActiveView('TIMELINE')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span>Buka Timeline & Slot Gantt</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
