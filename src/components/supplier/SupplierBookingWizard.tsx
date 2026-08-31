import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Phone,
  QrCode,
  Shield,
  Sparkles,
  Truck,
  User,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Booking, Dock, PurchaseOrder, Vehicle } from '../../types';
import { useApp } from '../../lib/store';
import {
  checkSlotAvailability,
  findAlternativeSuggestions,
  formatTimeHM,
  isDockCompatible,
  minutesToTimeStr,
  timeStrToMinutes,
} from '../../lib/slotEngine';
import { formatDateIndo, formatDuration } from '../../lib/utils';
import { GatePassModal } from './GatePassModal';

interface SupplierBookingWizardProps {
  onBookingCompleted?: () => void;
}

export const SupplierBookingWizard: React.FC<SupplierBookingWizardProps> = ({ onBookingCompleted }) => {
  const {
    purchaseOrders,
    vehicles,
    docks,
    settings,
    bookings,
    holidays,
    currentUser,
    createBooking,
    setActiveView,
    setCurrentSubView,
  } = useApp();

  // Wizard Step (1: Select PO, 2: Armada & Driver Info, 3: Interactive Visual Slot Selection, 4: Success/Confirmation)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State: Selected PO
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [poSearchQuery, setPoSearchQuery] = useState<string>('');

  // Step 2 State: Armada & Driver Info
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Step 3 State: Date & Interactive Slot Selection
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [bookingDate, setBookingDate] = useState<string>(tomorrowStr);
  const [selectedTimeStr, setSelectedTimeStr] = useState<string>('09:00');
  const [selectedDockId, setSelectedDockId] = useState<string>(''); // empty means auto-assign

  // Final confirmation
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showGatePassModal, setShowGatePassModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter approved POs that are ready for delivery slot booking
  const availablePOs = purchaseOrders.filter((po) => {
    // If supplier user, filter only their POs, otherwise allow choosing any approved PO
    if (currentUser.role === 'SUPPLIER' && currentUser.supplierName) {
      if (!po.supplierName.toLowerCase().includes(currentUser.supplierName.toLowerCase())) {
        return false;
      }
    }
    // Only READY_FOR_BOOKING or PPIC_APPROVED can be booked
    const isApproved = po.status === 'READY_FOR_BOOKING' || po.status === 'PPIC_APPROVED';
    if (!isApproved) return false;

    if (poSearchQuery.trim()) {
      const q = poSearchQuery.toLowerCase();
      return (
        po.poNumber.toLowerCase().includes(q) ||
        po.itemDescription.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedPO = purchaseOrders.find((p) => p.id === selectedPoId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const durationMinutes = selectedVehicle?.durationMinutes || selectedVehicle?.defaultDurationMinutes || 60;

  // Filter docks compatible with selected vehicle
  const compatibleDocks = useMemo(() => {
    if (!selectedVehicle) return docks;
    return docks.filter((d) => isDockCompatible(d, selectedVehicle));
  }, [docks, selectedVehicle]);

  // Generate 30-min time slots from 08:00 to 19:00 (Max arrival)
  const timeSlots = useMemo(() => {
    const slots: { timeStr: string; label: string; startMins: number; endMins: number }[] = [];
    const openMins = timeStrToMinutes(settings.factoryOpenTime); // 480 (08:00)
    const maxArrivalMins = timeStrToMinutes(settings.maxArrivalBookingTime); // 1140 (19:00)
    const interval = settings.slotIntervalMinutes || 30;

    for (let m = openMins; m <= maxArrivalMins; m += interval) {
      const timeStr = minutesToTimeStr(m);
      const endMins = m + durationMinutes;
      slots.push({
        timeStr,
        label: `${timeStr} - ${minutesToTimeStr(endMins)} WIB`,
        startMins: m,
        endMins,
      });
    }
    return slots;
  }, [settings, durationMinutes]);

  // Evaluate real-time slot availability for each time slot on selected date
  const slotEvaluations = useMemo(() => {
    if (!selectedVehicleId) return {};
    const evals: Record<string, { isAvailable: boolean; reason?: string; assignedDock?: Dock }> = {};

    for (const slot of timeSlots) {
      const res = checkSlotAvailability(
        {
          date: bookingDate,
          startTimeStr: slot.timeStr,
          vehicleId: selectedVehicleId,
          dockId: selectedDockId || undefined,
        },
        bookings,
        docks,
        vehicles,
        settings
      );
      evals[slot.timeStr] = {
        isAvailable: res.isAvailable,
        reason: res.conflictReason,
        assignedDock: res.assignedDock,
      };
    }
    return evals;
  }, [bookingDate, selectedVehicleId, selectedDockId, bookings, docks, vehicles, settings, timeSlots]);

  // Current selected slot validation
  const currentSlotResult = useMemo(() => {
    if (!selectedVehicleId) return null;
    return checkSlotAvailability(
      {
        date: bookingDate,
        startTimeStr: selectedTimeStr,
        vehicleId: selectedVehicleId,
        dockId: selectedDockId || undefined,
      },
      bookings,
      docks,
      vehicles,
      settings
    );
  }, [bookingDate, selectedTimeStr, selectedVehicleId, selectedDockId, bookings, docks, vehicles, settings]);

  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPoId(po.id);
    if (po.ppicEtaDateStart) {
      setBookingDate(po.ppicEtaDateStart);
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedPO || !selectedVehicle) return;

    if (!licensePlate.trim() || !driverName.trim()) {
      alert('Mohon isi Nomor Polisi dan Nama Supir armada.');
      return;
    }

    if (!currentSlotResult || !currentSlotResult.isAvailable) {
      alert(currentSlotResult?.conflictReason || 'Slot waktu yang dipilih tidak tersedia.');
      return;
    }

    const assignedDockId = selectedDockId || currentSlotResult.assignedDock?.id || compatibleDocks[0]?.id;
    if (!assignedDockId) {
      alert('Tidak ada dock yang tersedia.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBk = createBooking({
        poId: selectedPO.id,
        dockId: assignedDockId,
        vehicleId: selectedVehicle.id,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        date: bookingDate,
        startTimeStr: selectedTimeStr,
        remarks: remarks.trim(),
      });

      setConfirmedBooking(newBk);
      setCurrentStep(4);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan booking slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Step Progress Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              <span>Portal Booking Slot Kedatangan Supplier</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistem reservasi otomatis dock bongkar muat dengan validasi durasi armada real-time
            </p>
          </div>
          <button
            onClick={() => setActiveView('TIMELINE')}
            className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ← Kembali ke Timeline
          </button>
        </div>

        {/* Step indicators */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div
            className={`p-2.5 rounded-xl border flex items-center space-x-3 transition-all ${
              currentStep === 1
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : currentStep > 1
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-slate-900 border border-current">
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold block truncate">1. Pilih No. PO</span>
              <span className="text-[10px] opacity-75 truncate block">Verifikasi PO PPIC</span>
            </div>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center space-x-3 transition-all ${
              currentStep === 2
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : currentStep > 2
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-slate-900 border border-current">
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold block truncate">2. Info Armada</span>
              <span className="text-[10px] opacity-75 truncate block">Jenis Truk & Driver</span>
            </div>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center space-x-3 transition-all ${
              currentStep === 3
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : currentStep === 4
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-slate-900 border border-current">
              {currentStep === 4 ? '✓' : '3'}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold block truncate">3. Pilih Jam & Dock</span>
              <span className="text-[10px] opacity-75 truncate block">Visual Slot Picker</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 1: PO SELECTION & VERIFICATION */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Langkah 1: Masukkan / Pilih Nomor Purchase Order (PO)</h3>
                <p className="text-xs text-slate-400">
                  Hanya PO yang telah disetujui jadwalnya oleh PPIC yang dapat dibooking.
                </p>
              </div>
              <input
                type="text"
                value={poSearchQuery}
                onChange={(e) => setPoSearchQuery(e.target.value)}
                placeholder="Ketik No PO atau nama barang..."
                className="px-3.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            {/* PO List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {availablePOs.map((po) => {
                const isSelected = selectedPoId === po.id;
                return (
                  <div
                    key={po.id}
                    onClick={() => handleSelectPO(po)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-blue-400">{po.poNumber}</span>
                        {po.status === 'PPIC_APPROVED' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            PPIC Disetujui
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-800 text-slate-400">
                            Draft
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm text-slate-100 mt-2 line-clamp-1">
                        {po.itemDescription}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Vendor: <span className="text-slate-300 font-medium">{po.supplierName}</span>
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Qty: </span>
                        <span className="text-white font-bold">{po.qty.toLocaleString()} {po.unit}</span>
                      </div>
                      {po.ppicEtaDateStart && (
                        <div className="text-[11px] text-amber-400 font-mono">
                          ETA: {po.ppicEtaDateStart}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {availablePOs.length === 0 && (
                <div className="col-span-2 p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                  <FileCheck className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-medium text-slate-400">Tidak ada PO yang siap dibooking.</p>
                  <p className="text-xs text-slate-400">
                    Pastikan Purchasing sudah mengupload PO dan PPIC sudah menyetujui jadwal ETA.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!selectedPoId}
              className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Lanjut ke Langkah 2: Info Armada</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: ARMADA & DRIVER INFO */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white">Langkah 2: Pilih Jenis Kendaraan & Input Supir</h3>
              <p className="text-xs text-slate-400">
                Sistem otomatis mengunci durasi booking sesuai spesifikasi standar armada untuk mencegah keterlambatan.
              </p>
            </div>

            {/* Selected PO Summary Chip */}
            {selectedPO && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-mono font-bold text-blue-300">{selectedPO.poNumber}</span>
                  <span className="text-slate-300">• {selectedPO.itemDescription} ({selectedPO.qty} {selectedPO.unit})</span>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-blue-400 underline hover:text-blue-300"
                >
                  Ganti PO
                </button>
              </div>
            )}

            {/* Vehicle Selection Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Pilih Jenis Kendaraan / Armada:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {vehicles.map((veh) => {
                  const isSelected = selectedVehicleId === veh.id;
                  return (
                    <div
                      key={veh.id}
                      onClick={() => setSelectedVehicleId(veh.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-white">{veh.code || veh.name}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300">
                            {formatDuration(veh.durationMinutes || veh.defaultDurationMinutes || 60)}
                          </span>
                        </div>
                        <span className="font-semibold text-xs text-slate-200 mt-1 block">
                          {veh.name || veh.vehicleName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 line-clamp-1">
                        {veh.description || `Standar alokasi ${veh.durationMinutes || veh.defaultDurationMinutes} menit`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Locked Duration Banner */}
            {selectedVehicle && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Durasi Terkunci: {formatDuration(selectedVehicle.durationMinutes || selectedVehicle.defaultDurationMinutes || 60)} ({selectedVehicle.durationMinutes || selectedVehicle.defaultDurationMinutes || 60} menit)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Sesuai SOP pembongkaran pabrik untuk tipe {selectedVehicle.name || selectedVehicle.vehicleName}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-800/40">
                  Auto-Calculated
                </span>
              </div>
            )}

            {/* License Plate, Driver Name & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nomor Polisi (Plat Truk) *</span>
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="Contoh: B 9842 UXX"
                  className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 placeholder-slate-600 focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Nama Lengkap Supir *</span>
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Nama pengemudi armada"
                  className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>No. HP / WhatsApp Supir</span>
                </label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Optional Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Catatan Pengiriman / Permintaan Khusus (Opsional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Contoh: Butuh forklift samping, barang mudah pecah, dsb."
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-400"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors"
            >
              ← Kembali ke Langkah 1
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!licensePlate.trim() || !driverName.trim()}
              className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Lanjut ke Langkah 3: Pilih Slot Jam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: VISUAL INTERACTIVE TIME SLOT & DOCK PICKER */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Langkah 3: Pilih Jadwal Tanggal & Jam Kedatangan</span>
                <span className="text-xs font-normal text-slate-400">
                  (Batas Booking: 08:00 s.d 19:00 WIB, Tutup Pabrik: 23:00)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pilih slot hijau (tersedia). Slot merah dinonaktifkan karena bentrok dengan jadwal truk lain.
              </p>
            </div>

            {/* Date Picker & Dock Allocation Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Tanggal Rencana Kedatangan:</span>
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Alokasi Pintu Dock:</span>
                </label>
                <select
                  value={selectedDockId}
                  onChange={(e) => setSelectedDockId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Auto-Assign (Otomatis Pilih Dock Kosong)</option>
                  {compatibleDocks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.dockName} ({d.dockType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Holiday Warning Banner if selected date is closed */}
            {holidays.some((h) => h.date === bookingDate) && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start space-x-3 text-xs text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-200 block text-sm">
                    Pabrik Tutup / Hari Libur Operasional
                  </span>
                  <p className="mt-0.5">
                    Tanggal {bookingDate} terdaftar dalam kalender libur:{' '}
                    <strong className="text-white">
                      {holidays.find((h) => h.date === bookingDate)?.description}
                    </strong>
                    . Silakan pilih tanggal kerja lain untuk melakukan booking slot.
                  </p>
                </div>
              </div>
            )}

            {/* Visual Time Slot Matrix (Green = Available, Red = Busy/Conflict) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Pilih Jam Kedatangan (Durasi {durationMinutes} Menit):</span>
                </label>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Tersedia
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Bentrok / Penuh
                  </span>
                </div>
              </div>

              {/* Grid of Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
                {timeSlots.map((slot) => {
                  const evalRes = slotEvaluations[slot.timeStr];
                  const isAvail = evalRes?.isAvailable ?? false;
                  const isSelected = selectedTimeStr === slot.timeStr;

                  return (
                    <button
                      key={slot.timeStr}
                      type="button"
                      onClick={() => setSelectedTimeStr(slot.timeStr)}
                      className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? isAvail
                            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg'
                            : 'bg-rose-950 border-rose-500 ring-2 ring-rose-500 text-white'
                          : isAvail
                          ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-800/60 text-emerald-300 cursor-pointer'
                          : 'bg-rose-950/20 border-rose-900/40 text-rose-400/70 hover:bg-rose-950/30 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono font-bold text-sm">{slot.timeStr}</span>
                        {isAvail ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                      </div>
                      <span className="text-[10px] opacity-85 block mt-1 font-mono">
                        s/d {minutesToTimeStr(slot.endMins)}
                      </span>
                      <span className="text-[9px] mt-1 font-semibold uppercase tracking-wider">
                        {isAvail ? 'Tersedia' : 'Penuh'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Validation Feedback & Intelligent Alternative Recommender */}
            {currentSlotResult && (
              <div>
                {currentSlotResult.isAvailable ? (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/60 flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300">
                        Slot Tersedia: {selectedTimeStr} - {currentSlotResult.calculatedEndTimeStr} WIB
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Alokasi Pintu:{' '}
                        <strong className="text-white">
                          {currentSlotResult.assignedDock?.dockName || 'Semua Dock Kompatibel'}
                        </strong>
                        . Tidak ada bentrokan jadwal bongkar muat.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-3">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-300">
                          Slot Jam {selectedTimeStr} Tidak Dapat Dipesan (Bentrok)
                        </h4>
                        <p className="text-xs text-rose-200 mt-0.5">
                          {currentSlotResult.conflictReason}
                        </p>
                      </div>
                    </div>

                    {/* Algoritma Saran Slot Alternatif */}
                    {currentSlotResult.alternativeSuggestions.length > 0 && (
                      <div className="pt-2 border-t border-rose-800/40 space-y-2">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-300">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Rekomendasi Slot Kosong Alternatif Dari Sistem:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {currentSlotResult.alternativeSuggestions.map((alt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedTimeStr(alt.startTimeStr);
                                setSelectedDockId(alt.dockId);
                              }}
                              className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div>
                                <span className="font-mono font-bold text-amber-300 block">
                                  {alt.startTimeStr} - {alt.endTimeStr} WIB
                                </span>
                                <span className="text-[11px] text-slate-300">{alt.dockName}</span>
                              </div>
                              <span className="text-[10px] font-semibold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/50">
                                Pilih Slot Ini
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors"
            >
              ← Kembali ke Langkah 2
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={!currentSlotResult?.isAvailable || isSubmitting || holidays.some((h) => h.date === bookingDate)}
              className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi & Terbitkan Slot Booking'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: SUCCESS & GATE PASS QR GENERATION */}
      {/* ======================================================== */}
      {currentStep === 4 && confirmedBooking && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
              Booking Berhasil Dikonfirmasi
            </span>
            <h2 className="text-2xl font-black text-white mt-1">
              {confirmedBooking.bookingCode}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Slot kedatangan telah dikunci di sistem. Tunjukkan surat jalan / QR code saat tiba di gerbang pabrik.
            </p>
          </div>

          {/* Ticket Summary Card */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Pintu Dock:</span>
              <span className="font-bold text-emerald-400">{confirmedBooking.dockName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Jadwal Slot:</span>
              <span className="font-mono font-bold text-blue-400">
                {formatDateIndo(confirmedBooking.startTime)} ({formatTimeHM(confirmedBooking.startTime)} - {formatTimeHM(confirmedBooking.endTime)} WIB)
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Armada & Supir:</span>
              <span className="font-medium text-slate-200">
                {confirmedBooking.licensePlate} • {confirmedBooking.driverName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">PO Ref:</span>
              <span className="font-mono text-indigo-300">{confirmedBooking.poNumber}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowGatePassModal(true)}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Cetak / Unduh Digital Gate Pass</span>
            </button>

            {onBookingCompleted && (
              <button
                onClick={onBookingCompleted}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Buka Jadwal & Tiket Saya</span>
              </button>
            )}

            <button
              onClick={() => setActiveView('TIMELINE')}
              className="px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Lihat Jadwal di Timeline
            </button>

            <button
              onClick={() => {
                setCurrentStep(1);
                setSelectedPoId('');
                setLicensePlate('');
                setDriverName('');
                setDriverPhone('');
              }}
              className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Booking PO Lainnya
            </button>
          </div>
        </div>
      )}

      {/* Gate Pass Modal */}
      {showGatePassModal && confirmedBooking && (
        <GatePassModal
          booking={confirmedBooking}
          onClose={() => setShowGatePassModal(false)}
        />
      )}
    </div>
  );
};
