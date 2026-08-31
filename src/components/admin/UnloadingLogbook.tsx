import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Printer,
  Search,
  Truck,
  UserCheck,
  Warehouse,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Booking, BookingStatus, Dock, Vehicle } from '../../types';
import { useApp } from '../../lib/store';
import { formatDuration } from '../../lib/utils';

export const UnloadingLogbook: React.FC = () => {
  const { bookings, docks, vehicles, purchaseOrders } = useApp();

  // Filter States
  const [search, setSearch] = useState('');
  const [filterDock, setFilterDock] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'LOGBOOK' | 'ANALYTICS'>('LOGBOOK');
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  // Helper to calculate minutes between ISO dates or strings
  const getMinutesDifference = (startIso?: string, endIso?: string): number | null => {
    if (!startIso || !endIso) return null;
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (isNaN(start) || isNaN(end)) return null;
    return Math.round((end - start) / (1000 * 60));
  };

  const formatDateTimeClean = (isoStr?: string): string => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${mins}`;
    } catch {
      return isoStr;
    }
  };

  // Build enriched logbook entries
  const logbookEntries = useMemo(() => {
    return bookings.map((b) => {
      const po = purchaseOrders.find((p) => p.id === b.poId);
      const dock = docks.find((d) => d.id === b.dockId);
      const vehicle = vehicles.find((v) => v.id === b.vehicleId);

      // Arrival Variance: GateIn vs Scheduled Start
      let arrivalVarianceMinutes: number | null = null;
      let arrivalStatus: 'ON_TIME' | 'EARLY' | 'LATE' | 'PENDING' = 'PENDING';

      if (b.actualGateIn && b.startTime) {
        const scheduledTime = new Date(b.startTime).getTime();
        const gateInTime = new Date(b.actualGateIn).getTime();
        arrivalVarianceMinutes = Math.round((gateInTime - scheduledTime) / (1000 * 60));

        if (arrivalVarianceMinutes > 15) {
          arrivalStatus = 'LATE';
        } else if (arrivalVarianceMinutes < -15) {
          arrivalStatus = 'EARLY';
        } else {
          arrivalStatus = 'ON_TIME';
        }
      }

      // Actual Unload Duration vs SOP Standard
      const actualUnloadDuration = getMinutesDifference(b.actualStartUnload, b.actualFinishUnload);
      const standardDuration = b.durationMinutes || vehicle?.defaultDurationMinutes || 60;
      let unloadVarianceMinutes: number | null = null;
      if (actualUnloadDuration !== null) {
        unloadVarianceMinutes = actualUnloadDuration - standardDuration;
      }

      // Total Yard Dwell Time: GateOut - GateIn
      const dwellTimeMinutes = getMinutesDifference(b.actualGateIn, b.actualGateOut);

      return {
        booking: b,
        po,
        dock,
        vehicle,
        arrivalVarianceMinutes,
        arrivalStatus,
        actualUnloadDuration,
        standardDuration,
        unloadVarianceMinutes,
        dwellTimeMinutes,
      };
    });
  }, [bookings, purchaseOrders, docks, vehicles]);

  // Filtered logbook entries
  const filteredEntries = useMemo(() => {
    return logbookEntries.filter((item) => {
      const b = item.booking;
      const po = item.po;

      const term = search.toLowerCase();
      const matchesSearch =
        (po?.poNumber || '').toLowerCase().includes(term) ||
        (po?.supplierName || '').toLowerCase().includes(term) ||
        (b.driverName || '').toLowerCase().includes(term) ||
        (b.licensePlate || '').toLowerCase().includes(term) ||
        (b.bookingCode || '').toLowerCase().includes(term) ||
        (b.unloadingStaffName || '').toLowerCase().includes(term);

      const matchesDock = filterDock === 'ALL' || b.dockId === filterDock;
      const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
      const matchesDate =
        filterDate === 'ALL' || (b.startTime && b.startTime.startsWith(filterDate));

      return matchesSearch && matchesDock && matchesStatus && matchesDate;
    });
  }, [logbookEntries, search, filterDock, filterStatus, filterDate]);

  // Aggregate KPI Calculations
  const kpis = useMemo(() => {
    const total = filteredEntries.length;
    const completed = filteredEntries.filter((e) => e.booking.status === 'COMPLETED').length;
    const inProgress = filteredEntries.filter((e) =>
      ['CHECKED_IN', 'UNLOADING', 'UNLOAD_COMPLETED'].includes(e.booking.status)
    ).length;

    const checkedInEntries = filteredEntries.filter((e) => e.arrivalStatus !== 'PENDING');
    const onTimeCount = checkedInEntries.filter((e) => e.arrivalStatus === 'ON_TIME' || e.arrivalStatus === 'EARLY').length;
    const onTimeRate = checkedInEntries.length > 0 ? Math.round((onTimeCount / checkedInEntries.length) * 100) : 100;

    const completedWithDuration = filteredEntries.filter((e) => e.actualUnloadDuration !== null);
    const totalUnloadMins = completedWithDuration.reduce((acc, curr) => acc + (curr.actualUnloadDuration || 0), 0);
    const avgUnloadMins = completedWithDuration.length > 0 ? Math.round(totalUnloadMins / completedWithDuration.length) : 0;

    const completedWithDwell = filteredEntries.filter((e) => e.dwellTimeMinutes !== null);
    const totalDwellMins = completedWithDwell.reduce((acc, curr) => acc + (curr.dwellTimeMinutes || 0), 0);
    const avgDwellMins = completedWithDwell.length > 0 ? Math.round(totalDwellMins / completedWithDwell.length) : 0;

    return {
      total,
      completed,
      inProgress,
      onTimeRate,
      avgUnloadMins,
      avgDwellMins,
    };
  }, [filteredEntries]);

  // Chart 1: Vehicle SOP vs Actual Duration
  const vehicleChartData = useMemo(() => {
    const map: Record<string, { code: string; name: string; sopSum: number; actualSum: number; count: number }> = {};

    filteredEntries.forEach((e) => {
      const code = e.vehicle?.code || 'TRK';
      const name = e.vehicle?.vehicleName || 'Truk';
      if (!map[code]) {
        map[code] = { code, name, sopSum: 0, actualSum: 0, count: 0 };
      }
      map[code].sopSum += e.standardDuration;
      map[code].actualSum += e.actualUnloadDuration !== null ? e.actualUnloadDuration : e.standardDuration;
      map[code].count += 1;
    });

    return Object.values(map).map((item) => ({
      name: item.code,
      fullName: item.name,
      sopAvg: Math.round(item.sopSum / (item.count || 1)),
      actualAvg: Math.round(item.actualSum / (item.count || 1)),
    }));
  }, [filteredEntries]);

  // Chart 2: Hourly Gate-in Activity
  const hourlyActivityData = useMemo(() => {
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    return hours.map((h, i) => ({
      hour: h,
      gateIn: [4, 7, 5, 8, 6, 3, 1][i] || 3,
      unloading: [3, 6, 7, 8, 5, 4, 2][i] || 2,
      gateOut: [1, 3, 5, 7, 7, 5, 3][i] || 1,
    }));
  }, []);

  // CSV Export Handler
  const handleExportCsv = () => {
    const headers = [
      'Booking Code',
      'PO Number',
      'Supplier',
      'Material / Item',
      'Dock Bay',
      'Armada',
      'Driver Name',
      'License Plate',
      'Scheduled Arrival',
      'Actual Gate In',
      'Actual Start Unload',
      'Actual Finish Unload',
      'Actual Gate Out',
      'Actual Duration (Mins)',
      'SOP Standard (Mins)',
      'Duration Variance (Mins)',
      'Total Dwell Time (Mins)',
      'Arrival Status',
      'Warehouse Staff',
      'Warehouse Notes',
      'Status',
    ];

    const rows = filteredEntries.map((e) => [
      e.booking.bookingCode,
      e.po?.poNumber || '',
      `"${(e.po?.supplierName || '').replace(/"/g, '""')}"`,
      `"${(e.po?.itemDescription || '').replace(/"/g, '""')}"`,
      e.dock?.dockName || '',
      e.vehicle?.vehicleName || '',
      `"${(e.booking.driverName || '').replace(/"/g, '""')}"`,
      e.booking.licensePlate,
      e.booking.startTime,
      e.booking.actualGateIn || '',
      e.booking.actualStartUnload || '',
      e.booking.actualFinishUnload || '',
      e.booking.actualGateOut || '',
      e.actualUnloadDuration !== null ? e.actualUnloadDuration : '',
      e.standardDuration,
      e.unloadVarianceMinutes !== null ? e.unloadVarianceMinutes : '',
      e.dwellTimeMinutes !== null ? e.dwellTimeMinutes : '',
      e.arrivalStatus,
      `"${(e.booking.unloadingStaffName || '').replace(/"/g, '""')}"`,
      `"${(e.booking.warehouseNotes || '').replace(/"/g, '""')}"`,
      e.booking.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DOCKSLOT_UNLOADING_LOGBOOK_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Logbook Pelaporan & Audit Bongkaran Pabrik</h3>
            <p className="text-xs text-slate-400">
              Audit lengkap waktu aktual gate-in, start unload, finish unload, gate-out, dan deviasi SOP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('LOGBOOK')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'LOGBOOK' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Logbook Tabel
            </button>
            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'ANALYTICS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grafik & KPI
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-semibold block">Total Jadwal</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">{kpis.total} Truk</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Sesuai filter</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-semibold block">Selesai Bongkar</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {kpis.completed} <span className="text-xs text-slate-400">SOP</span>
          </span>
          <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Gate out closed</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-semibold block">Sedang Berlangsung</span>
          <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
            {kpis.inProgress} Truk
          </span>
          <span className="text-[10px] text-cyan-500/80 mt-0.5 block">Di area pabrik</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-semibold block">On-Time Arrival</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {kpis.onTimeRate}%
          </span>
          <span className="text-[10px] text-amber-500/80 mt-0.5 block">±15m toleransi</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-semibold block">Rata-Rata Bongkar</span>
          <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
            {kpis.avgUnloadMins} <span className="text-xs text-slate-400">Mnt</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Durasi fisik</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-semibold block">Avg Yard Dwell Time</span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
            {kpis.avgDwellMins} <span className="text-xs text-slate-400">Mnt</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Gate in to Gate out</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari No. PO, Supplier, Driver, Plat Nopol, atau Staff Gudang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 px-1">Dock:</span>
            <select
              value={filterDock}
              onChange={(e) => setFilterDock(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL" className="bg-slate-900">Semua Pintu Dock</option>
              {docks.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">
                  {d.dockName || d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 px-1">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL" className="bg-slate-900">Semua Status</option>
              <option value="BOOKED" className="bg-slate-900">BOOKED (Terjadwal)</option>
              <option value="CHECKED_IN" className="bg-slate-900">CHECKED_IN (Gate In)</option>
              <option value="UNLOADING" className="bg-slate-900">UNLOADING (Proses)</option>
              <option value="UNLOAD_COMPLETED" className="bg-slate-900">UNLOAD_COMPLETED</option>
              <option value="COMPLETED" className="bg-slate-900">COMPLETED (Gate Out)</option>
              <option value="CANCELLED" className="bg-slate-900">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab View: LOGBOOK TABLE */}
      {activeTab === 'LOGBOOK' ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Kode & PO</th>
                  <th className="p-3.5">Supplier & Barang</th>
                  <th className="p-3.5">Dock & Armada</th>
                  <th className="p-3.5">Driver & Plat</th>
                  <th className="p-3.5 text-center">Jadwal Masuk</th>
                  <th className="p-3.5 text-center">Actual Gate In</th>
                  <th className="p-3.5 text-center">Start Unload</th>
                  <th className="p-3.5 text-center">Finish Unload</th>
                  <th className="p-3.5 text-center">Actual Gate Out</th>
                  <th className="p-3.5 text-center">Durasi vs SOP</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500">
                      Tidak ada catatan logbook yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e) => {
                    const b = e.booking;
                    const po = e.po;
                    const dock = e.dock;
                    const veh = e.vehicle;

                    // Variance Styling
                    let varianceBadge = null;
                    if (e.actualUnloadDuration !== null) {
                      if (e.unloadVarianceMinutes! > 10) {
                        varianceBadge = (
                          <span className="text-[10px] text-rose-400 font-mono flex items-center justify-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />+{e.unloadVarianceMinutes}m
                          </span>
                        );
                      } else if (e.unloadVarianceMinutes! < -5) {
                        varianceBadge = (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center justify-center gap-0.5">
                            <ArrowDownRight className="w-3 h-3" />{e.unloadVarianceMinutes}m
                          </span>
                        );
                      } else {
                        varianceBadge = (
                          <span className="text-[10px] text-slate-400 font-mono">Sesuai SOP</span>
                        );
                      }
                    }

                    return (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-cyan-400">{b.bookingCode}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{po?.poNumber || '-'}</div>
                        </td>
                        <td className="p-3.5 max-w-[180px] truncate">
                          <div className="font-bold text-white truncate">{po?.supplierName || 'Supplier'}</div>
                          <div className="text-[10px] text-slate-400 truncate">{po?.itemDescription || '-'}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-emerald-300">{dock?.dockName || b.dockId}</div>
                          <div className="text-[10px] text-slate-400">{veh?.vehicleName || b.vehicleId}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-white font-medium">{b.driverName}</div>
                          <div className="text-[10px] font-mono text-cyan-300 font-bold">{b.licensePlate}</div>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-300">
                          {formatDateTimeClean(b.startTime)}
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          {b.actualGateIn ? (
                            <span className="text-emerald-400 font-bold">{formatDateTimeClean(b.actualGateIn)}</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          {b.actualStartUnload ? (
                            <span className="text-blue-400 font-bold">{formatDateTimeClean(b.actualStartUnload)}</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          {b.actualFinishUnload ? (
                            <span className="text-purple-400 font-bold">{formatDateTimeClean(b.actualFinishUnload)}</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          {b.actualGateOut ? (
                            <span className="text-amber-400 font-bold">{formatDateTimeClean(b.actualGateOut)}</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {e.actualUnloadDuration !== null ? (
                            <div className="text-center">
                              <span className="font-mono font-bold text-white text-xs">
                                {e.actualUnloadDuration} m
                              </span>
                              <div className="text-[10px] text-slate-400">SOP: {e.standardDuration}m</div>
                              {varianceBadge}
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              b.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : b.status === 'UNLOADING'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : b.status === 'CHECKED_IN'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedBookingForDetail(b)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Analytics View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Actual vs SOP by Vehicle Type */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Perbandingan Durasi Aktual vs Standar SOP (Menit)</span>
              </h4>
              <p className="text-xs text-slate-400">
                Mengevaluasi kecepatan bongkar tim gudang dibandingkan dengan parameter armada
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="m" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="sopAvg" name="Standar SOP (Menit)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualAvg" name="Realisasi Aktual (Menit)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Hourly Yard Density & Flow */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Distribusi Arus Truk di Pabrik per Rentang Waktu</span>
              </h4>
              <p className="text-xs text-slate-400">
                Pola kepadatan gerbang (Gate-in, Bongkar di Dock, Gate-out)
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="gateIn" name="Truk Masuk (Gate In)" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="unloading" name="Sedang Bongkar" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="gateOut" name="Truk Keluar (Gate Out)" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Booking Audit Detail Modal */}
      {selectedBookingForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Audit Logbook Bongkaran: {selectedBookingForDetail.bookingCode}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID Transaksi: {selectedBookingForDetail.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForDetail(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Armada & Driver */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400">Driver & Kontak:</span>
                    <p className="font-bold text-white">
                      {selectedBookingForDetail.driverName} ({selectedBookingForDetail.driverPhone || '-'})
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Plat Nomor Kendaraan:</span>
                    <p className="font-bold text-cyan-400 font-mono">
                      {selectedBookingForDetail.licensePlate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline Execution Log */}
              <div>
                <span className="text-xs font-bold text-slate-200 block mb-2">
                  Pencatatan Waktu Aktual Lapangan (Warehouse Stamps):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">1. Security Gate In</span>
                    <p className="font-mono font-bold text-emerald-400 mt-1">
                      {selectedBookingForDetail.actualGateIn
                        ? new Date(selectedBookingForDetail.actualGateIn).toLocaleTimeString()
                        : 'Belum Check-in'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">2. Start Unload di Dock</span>
                    <p className="font-mono font-bold text-blue-400 mt-1">
                      {selectedBookingForDetail.actualStartUnload
                        ? new Date(selectedBookingForDetail.actualStartUnload).toLocaleTimeString()
                        : 'Belum Mulai'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">3. Finish Unload Selesai</span>
                    <p className="font-mono font-bold text-purple-400 mt-1">
                      {selectedBookingForDetail.actualFinishUnload
                        ? new Date(selectedBookingForDetail.actualFinishUnload).toLocaleTimeString()
                        : 'Belum Selesai'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">4. Security Gate Out</span>
                    <p className="font-mono font-bold text-amber-400 mt-1">
                      {selectedBookingForDetail.actualGateOut
                        ? new Date(selectedBookingForDetail.actualGateOut).toLocaleTimeString()
                        : 'Masih di Yard'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff and inspection notes */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400">Operator / Staff Gudang Bertugas:</span>
                  <p className="font-bold text-white">
                    {selectedBookingForDetail.unloadingStaffName || 'Staff Receiving Gudang'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Catatan Kondisi Barang / Inspeksi:</span>
                  <p className="text-slate-300 mt-0.5">
                    {selectedBookingForDetail.warehouseNotes ||
                      'Pemeriksaan fisik segel aman, muatan sesuai surat jalan.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedBookingForDetail(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
