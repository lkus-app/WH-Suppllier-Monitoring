import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  Clock,
  Info,
  Lock,
  Plus,
  RefreshCcw,
  Save,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { OperationalHoliday, OperationalSettings } from '../../types';
import { useApp } from '../../lib/store';

export const SystemConfigTab: React.FC = () => {
  const {
    settings,
    holidays,
    docks,
    updateSettings,
    addHoliday,
    deleteHoliday,
    resetToDefaultData,
  } = useApp();

  // Settings form state
  const [openTime, setOpenTime] = useState(settings.factoryOpenTime);
  const [maxArrivalTime, setMaxArrivalTime] = useState(settings.maxArrivalBookingTime);
  const [closeTime, setCloseTime] = useState(settings.factoryCloseTime);
  const [intervalMinutes, setIntervalMinutes] = useState(settings.slotIntervalMinutes);

  // New Holiday form state
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');
  const [deleteConfirmHolidayId, setDeleteConfirmHolidayId] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      factoryOpenTime: openTime,
      maxArrivalBookingTime: maxArrivalTime,
      factoryCloseTime: closeTime,
      slotIntervalMinutes: Number(intervalMinutes),
    });
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayDesc.trim()) return;

    addHoliday({
      date: holidayDate,
      description: holidayDesc.trim(),
      isLocked: false,
    });

    setHolidayDate('');
    setHolidayDesc('');
    setShowAddHolidayModal(false);
  };

  // Helper calculations for operating metrics
  const parseHourMinute = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const totalOpenMinutes = Math.max(0, parseHourMinute(closeTime) - parseHourMinute(openTime));
  const totalOpenHours = (totalOpenMinutes / 60).toFixed(1);
  const totalSlotsPerDock = Math.floor(totalOpenMinutes / (Number(intervalMinutes) || 30));
  const totalActiveDocks = docks.filter((d) => d.isActive !== false).length;
  const theoreticalDailySlots = totalSlotsPerDock * totalActiveDocks;

  // Sort holidays chronologically
  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Konfigurasi Jam Operasional & Hari Libur Pabrik</h3>
            <p className="text-xs text-slate-400">
              Parameter global sistem, batas akhir kedatangan booking, dan kalender libur operasional
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowResetConfirmModal(true)}
          className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reset Data Demo Sistem</span>
        </button>
      </div>

      {/* Main Grid: Operating Hours & Capacity Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Parameters (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Parameter Jam & Interval Waktu</span>
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
              Prisma Model: SystemSetting
            </span>
          </div>

          <form onSubmit={handleSaveHours} className="space-y-4 text-xs">
            {/* Factory Open */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-bold text-slate-200 block text-xs">
                  Jam Buka Pabrik (Factory Open Time)
                </label>
                <span className="text-[11px] text-slate-400">
                  Waktu awal di mana gerbang pabrik mulai menerima antrean truk
                </span>
              </div>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Max Arrival Booking */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-bold text-amber-300 block text-xs">
                  Batas Akhir Slot Kedatangan (Max Arrival Time)
                </label>
                <span className="text-[11px] text-slate-400">
                  Supplier dilarang booking slot kedatangan setelah jam ini
                </span>
              </div>
              <input
                type="time"
                value={maxArrivalTime}
                onChange={(e) => setMaxArrivalTime(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-lg text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-hidden"
                required
              />
            </div>

            {/* Factory Close */}
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-bold text-rose-300 block text-xs">
                  Jam Tutup Pabrik (Factory Close Time)
                </label>
                <span className="text-[11px] text-slate-400">
                  Gerbang pabrik ditutup total dan seluruh proses bongkar wajib selesai
                </span>
              </div>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-rose-500/50 rounded-lg text-rose-300 font-mono font-bold focus:border-rose-400 focus:outline-hidden"
                required
              />
            </div>

            {/* Slot Interval */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-bold text-slate-200 block text-xs">
                  Resolusi Interval Slot Grid (Menit)
                </label>
                <span className="text-[11px] text-slate-400">
                  Pecahan interval pada Gantt Timeline & booking visual picker
                </span>
              </div>
              <select
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-semibold focus:outline-hidden"
              >
                <option value="15">15 Menit (Ultra Dense)</option>
                <option value="30">30 Menit (Standar Rekomendasi)</option>
                <option value="60">60 Menit (Hourly Block)</option>
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Parameter</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Capacity & Simulation Visuals (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Simulasi Kapasitas Harian Pabrik</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block">Total Jam Kerja</span>
                <span className="text-xl font-mono font-bold text-white mt-1 block">
                  {totalOpenHours} <span className="text-xs text-slate-400">Jam/Hari</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {openTime} s/d {closeTime}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block">Slot per Pintu</span>
                <span className="text-xl font-mono font-bold text-cyan-400 mt-1 block">
                  {totalSlotsPerDock} <span className="text-xs text-slate-400">Slot</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Interval @{intervalMinutes} menit
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block">Pintu Aktif</span>
                <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">
                  {totalActiveDocks} <span className="text-xs text-slate-400">Bay</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Dari total {docks.length} pintu dock
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block">Kapasitas Maksimal</span>
                <span className="text-xl font-mono font-bold text-amber-400 mt-1 block">
                  {theoreticalDailySlots} <span className="text-xs text-slate-400">Slot/Hari</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Kapasitas throughput teoritis
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Validasi Aturan Bisnis Terkunci:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Truk yang datang &gt; {maxArrivalTime} otomatis ditolak oleh slot engine.</li>
              <li>Bongkar armada yang melebihi {closeTime} tidak dapat di-approve PPIC.</li>
              <li>Perubahan parameter langsung disinkronkan ke seluruh user.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION: OPERATIONAL HOLIDAYS & SHUTDOWNS */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-rose-400" />
              <span>Kalender Hari Libur & Maintenance Shutdown Pabrik</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Prisma Model: <code className="text-cyan-400 font-mono">OperationalHoliday</code>. Pada tanggal-tanggal ini, pabrik ditutup dan supplier dilarang melakukan booking slot.
            </p>
          </div>

          <button
            onClick={() => {
              setHolidayDate('');
              setHolidayDesc('');
              setShowAddHolidayModal(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Hari Libur / Shutdown</span>
          </button>
        </div>

        {/* Holiday Cards / Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedHolidays.map((hol) => (
            <div
              key={hol.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {hol.date}
                  </span>
                  {hol.isLocked && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Nasional
                    </span>
                  )}
                </div>
                <h5 className="font-bold text-white text-xs mt-2.5 line-clamp-2">
                  {hol.description}
                </h5>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-[10px] text-rose-400/80 font-semibold">
                  PABRIK DITUTUP
                </span>
                {!hol.isLocked && (
                  <button
                    onClick={() => setDeleteConfirmHolidayId(hol.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                    title="Hapus Tanggal Libur"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                  <CalendarOff className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">Tambah Hari Libur / Shutdown</h3>
              </div>
              <button
                onClick={() => setShowAddHolidayModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Tanggal Libur / Shutdown *</label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-rose-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Keterangan / Alasan Penutupan *</label>
                <textarea
                  value={holidayDesc}
                  onChange={(e) => setHolidayDesc(e.target.value)}
                  rows={2}
                  placeholder="e.g. Preventive Maintenance Tahunan Crane Dock 1-5"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-rose-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-[11px] text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Slot booking untuk tanggal ini akan otomatis dinonaktifkan dari sistem pemesanan supplier.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddHolidayModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg"
                >
                  Simpan Hari Libur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Holiday Confirm Modal */}
      {deleteConfirmHolidayId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Hapus Hari Libur?</h4>
                <p className="text-xs text-slate-400">Pabrik akan kembali dibuka untuk booking pada tanggal ini.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmHolidayId(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteHoliday(deleteConfirmHolidayId);
                  setDeleteConfirmHolidayId(null);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Reset Seluruh Data Sistem?</h4>
                <p className="text-xs text-slate-400">Semua perubahan PO, booking, dan master data akan dikembalikan ke default demo.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  resetToDefaultData();
                  setShowResetConfirmModal(false);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Ya, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
