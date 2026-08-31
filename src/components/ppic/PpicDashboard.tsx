import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Flame,
  Layers,
  MessageSquare,
  Package,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  Warehouse,
  X,
} from 'lucide-react';
import { PurchaseOrder, PriorityLevel } from '../../types';
import { useApp } from '../../lib/store';
import { formatDateIndo } from '../../lib/utils';
import { TODAY_STR, TOMORROW_STR } from '../../lib/initialData';
import { StatusBadge } from '../common/StatusBadge';
import { DataTable, Column } from '../common/DataTable';
import { MiniDockTimeline } from '../common/MiniDockTimeline';

export const PpicDashboard: React.FC = () => {
  const { purchaseOrders, approvePpicPo, rejectPpicPo, bookings, docks } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'INBOX' | 'HISTORY'>('INBOX');

  // Modal States
  const [selectedPoForApproval, setSelectedPoForApproval] = useState<PurchaseOrder | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [selectedPoForReject, setSelectedPoForReject] = useState<PurchaseOrder | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Approval Form State
  const [etaStartDate, setEtaStartDate] = useState<string>(TODAY_STR);
  const [etaEndDate, setEtaEndDate] = useState<string>(TOMORROW_STR);
  const [ppicNotes, setPpicNotes] = useState<string>('');

  // Segregate pending review vs approved
  const pendingPOs = useMemo(() => {
    return purchaseOrders
      .filter((p) => p.status === 'WAITING_PPIC_REVIEW' || p.status === 'DRAFT')
      .sort((a, b) => {
        if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
        if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [purchaseOrders]);

  const approvedPOs = useMemo(() => {
    return purchaseOrders
      .filter((p) => p.status !== 'WAITING_PPIC_REVIEW' && p.status !== 'DRAFT')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [purchaseOrders]);

  // Statistics
  const stats = useMemo(() => {
    const totalPending = pendingPOs.length;
    const urgentPending = pendingPOs.filter((p) => p.priority === 'URGENT').length;
    const readyForBooking = purchaseOrders.filter(
      (p) => p.status === 'READY_FOR_BOOKING' || (p.status as string) === 'PPIC_APPROVED'
    ).length;
    const booked = purchaseOrders.filter(
      (p) => p.status === 'BOOKED' || (p.status as string) === 'SCHEDULED' || (p.status as string) === 'IN_PROGRESS'
    ).length;

    return { totalPending, urgentPending, readyForBooking, booked };
  }, [pendingPOs, purchaseOrders]);

  // Filtered lists
  const filteredPendingPOs = useMemo(() => {
    return pendingPOs.filter((po) => {
      if (selectedPriorityFilter !== 'ALL' && po.priority !== selectedPriorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          po.poNumber.toLowerCase().includes(q) ||
          po.supplierName.toLowerCase().includes(q) ||
          po.itemDescription.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [pendingPOs, selectedPriorityFilter, searchQuery]);

  const filteredApprovedPOs = useMemo(() => {
    return approvedPOs.filter((po) => {
      if (selectedPriorityFilter !== 'ALL' && po.priority !== selectedPriorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          po.poNumber.toLowerCase().includes(q) ||
          po.supplierName.toLowerCase().includes(q) ||
          po.itemDescription.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [approvedPOs, selectedPriorityFilter, searchQuery]);

  // Calculate live dock load preview for the selected ETA dates
  const dockLoadPreview = useMemo(() => {
    if (!etaStartDate) return { totalBookings: 0, dockCount: docks.length };
    const onStart = bookings.filter((b) => b.startTime.startsWith(etaStartDate) && b.status !== 'CANCELLED').length;
    const onEnd =
      etaEndDate && etaEndDate !== etaStartDate
        ? bookings.filter((b) => b.startTime.startsWith(etaEndDate) && b.status !== 'CANCELLED').length
        : 0;
    return {
      totalBookings: onStart + onEnd,
      startDayBookings: onStart,
      endDayBookings: onEnd,
      dockCount: docks.length,
    };
  }, [etaStartDate, etaEndDate, bookings, docks]);

  const handleOpenApprovalModal = (po: PurchaseOrder) => {
    setSelectedPoForApproval(po);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const endStr = tomorrow.toISOString().split('T')[0];

    setEtaStartDate(po.etaStartDate || po.ppicEtaDateStart || today);
    setEtaEndDate(po.etaEndDate || po.ppicEtaDateEnd || endStr);
    setPpicNotes(
      po.ppicNotes ||
        (po.priority === 'URGENT'
          ? 'Prioritas URGENT: Jalur produksi membutuhkan material ini segera. Harap supplier ambil slot seawal mungkin.'
          : 'Disetujui untuk penjadwalan slot kedatangan supplier.')
    );
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForApproval) return;

    if (new Date(etaEndDate) < new Date(etaStartDate)) {
      alert('Tanggal akhir ETA (ETA End Date) tidak boleh lebih awal dari Tanggal Mulai.');
      return;
    }

    approvePpicPo(selectedPoForApproval.id, etaStartDate, etaEndDate, ppicNotes);
    setSelectedPoForApproval(null);
  };

  const handleOpenRejectModal = (po: PurchaseOrder) => {
    setSelectedPoForReject(po);
    setRejectReason('Kapasitas gudang penerimaan bahan baku penuh / perubahan jadwal batch produksi.');
    setShowRejectModal(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForReject || !rejectReason.trim()) return;

    rejectPpicPo(selectedPoForReject.id, rejectReason.trim());
    setShowRejectModal(false);
    setSelectedPoForReject(null);
  };

  const getPriorityBadge = (priorityLevel: PriorityLevel | undefined) => {
    if (priorityLevel === 'URGENT') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
          <Flame className="w-3 h-3 text-rose-600 fill-rose-100" />
          <span>URGENT</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
        NORMAL
      </span>
    );
  };

  // Columns for Pending Review Inbox
  const pendingColumns: Column<PurchaseOrder>[] = [
    {
      header: 'Nomor PO & Prioritas',
      cell: (po) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-slate-900">{po.poNumber}</span>
            {getPriorityBadge(po.priority)}
          </div>
          <span className="text-[11px] text-slate-500 block">Dibuat: {po.createdAt.split('T')[0]}</span>
        </div>
      ),
    },
    {
      header: 'Supplier & Material',
      cell: (po) => (
        <div>
          <p className="font-semibold text-slate-900">{po.supplierName}</p>
          <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{po.itemDescription}</p>
        </div>
      ),
    },
    {
      header: 'Volume Kuantitas',
      cell: (po) => (
        <span className="font-mono font-bold text-slate-900">
          {(po.quantity ?? po.qty ?? 0).toLocaleString()} {po.unit}
        </span>
      ),
    },
    {
      header: 'Status Alur',
      cell: (po) => <StatusBadge status={po.status} />,
    },
    {
      header: 'Aksi Review',
      className: 'text-right',
      cell: (po) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => handleOpenRejectModal(po)}
            className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Kembalikan ke Purchasing"
          >
            Revisi
          </button>
          <button
            onClick={() => handleOpenApprovalModal(po)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Setujui ETA</span>
          </button>
        </div>
      ),
    },
  ];

  // Columns for History Approved POs
  const historyColumns: Column<PurchaseOrder>[] = [
    {
      header: 'Nomor PO',
      cell: (po) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-slate-900">{po.poNumber}</span>
            {getPriorityBadge(po.priority)}
          </div>
          <span className="text-[11px] text-slate-400 block">{po.createdAt.split('T')[0]}</span>
        </div>
      ),
    },
    {
      header: 'Supplier & Material',
      cell: (po) => (
        <div>
          <p className="font-semibold text-slate-800">{po.supplierName}</p>
          <p className="text-slate-500 text-[11px] line-clamp-1">{po.itemDescription}</p>
        </div>
      ),
    },
    {
      header: 'Volume',
      cell: (po) => (
        <span className="font-mono font-semibold text-slate-900">
          {(po.quantity ?? po.qty ?? 0).toLocaleString()} {po.unit}
        </span>
      ),
    },
    {
      header: 'Jendela Target ETA',
      cell: (po) => (
        <div className="flex items-center space-x-1.5 text-slate-800 font-mono text-[11px] font-semibold">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            {po.etaStartDate || po.ppicEtaDateStart} s.d {po.etaEndDate || po.ppicEtaDateEnd}
          </span>
        </div>
      ),
    },
    {
      header: 'Catatan Teknis',
      cell: (po) => (
        <p className="text-slate-600 line-clamp-1 text-[11px] italic max-w-xs">
          {po.ppicNotes ? `"${po.ppicNotes}"` : '-'}
        </p>
      ),
    },
    {
      header: 'Status Alur',
      cell: (po) => <StatusBadge status={po.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">PPIC Planning & ETA Verification</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                Module 2
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifikasi ketersediaan kapasitas gudang, atur jendela tanggal kedatangan (ETA Window), & sinkronisasi lini produksi
            </p>
          </div>
        </div>

        {/* Urgent Alert Banner */}
        {stats.urgentPending > 0 && (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
            <Flame className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{stats.urgentPending} PO URGENT Memerlukan Verifikasi Segera!</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Antrean Review PO</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalPending}</p>
          <p className="text-[11px] text-slate-500 mt-1">Menunggu penetapan ETA</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Prioritas URGENT</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{stats.urgentPending}</p>
          <p className="text-[11px] text-slate-500 mt-1">Kebutuhan line mendesak</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Siap Booking Slot</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.readyForBooking}</p>
          <p className="text-[11px] text-slate-500 mt-1">Supplier dapat booking</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Sudah Terjadwal</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.booked}</p>
          <p className="text-[11px] text-slate-500 mt-1">Memiliki jadwal bongkar</p>
        </div>
      </div>

      {/* Main Two-Column Layout (Enterprise Pattern) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Data Table & Tabs */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs and Filter Bar */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Tab Selector */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('INBOX')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === 'INBOX'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Inbox Review ({stats.totalPending})</span>
                </button>

                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === 'HISTORY'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Riwayat Disetujui ({approvedPOs.length})</span>
                </button>
              </div>

              {/* Search & Priority Selector */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari PO / Supplier / Item..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <select
                  value={selectedPriorityFilter}
                  onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                >
                  <option value="ALL">Semua Prioritas</option>
                  <option value="URGENT">🔥 Urgent</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {activeTab === 'INBOX' ? (
            <DataTable
              columns={pendingColumns}
              data={filteredPendingPOs}
              keyExtractor={(item) => item.id}
              emptyMessage="Semua PO selesai direview! Tidak ada dokumen Purchase Order yang menunggu penetapan ETA."
            />
          ) : (
            <DataTable
              columns={historyColumns}
              data={filteredApprovedPOs}
              keyExtractor={(item) => item.id}
              emptyMessage="Tidak ada riwayat PO yang disetujui sesuai dengan pencarian."
            />
          )}
        </div>

        {/* Right Column (4 cols): Mini Dock Timeline & PPIC Guidelines */}
        <div className="lg:col-span-4 space-y-4">
          <MiniDockTimeline />

          {/* Planning Guidelines Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Pedoman Verifikasi ETA & Kapasitas PPIC</span>
            </h3>
            <ul className="text-[11px] text-slate-600 space-y-2 list-disc list-inside">
              <li>
                Pastikan rentang <strong>ETA Window</strong> tidak bertabrakan dengan puncak utilisasi dock di jam sibuk.
              </li>
              <li>
                Beri catatan khusus pada PO kimia/cairan untuk diarahkan ke <strong>Dock 03 (Liquid Dedicated)</strong>.
              </li>
              <li>
                PO berstatus <strong className="text-rose-600">URGENT</strong> otomatis ditempatkan pada prioritas antrean pertama.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal 1: ETA Verification & Approval Window */}
      {selectedPoForApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 font-mono">{selectedPoForApproval.poNumber}</h3>
                    {getPriorityBadge(selectedPoForApproval.priority)}
                  </div>
                  <p className="text-xs text-slate-500">Penetapan Jendela Tanggal ETA & Instruksi Teknis Bongkar</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPoForApproval(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Item Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{selectedPoForApproval.itemDescription}</span>
                  <span className="font-mono font-bold text-sm text-blue-600">
                    {(selectedPoForApproval.quantity ?? selectedPoForApproval.qty ?? 0).toLocaleString()}{' '}
                    {selectedPoForApproval.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                  <span>Vendor: {selectedPoForApproval.supplierName}</span>
                  <span>Dibuat oleh: {selectedPoForApproval.createdBy || 'Purchasing'}</span>
                </div>
              </div>

              {/* Date Pickers for ETA Window */}
              <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-slate-900">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Rentang Jendela Kedatangan yang Diizinkan (ETA Window)</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-semibold">Wajib Dipatuhi Supplier</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tanggal Mulai Kedatangan (ETA Start) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={etaStartDate}
                      onChange={(e) => setEtaStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Batas Akhir Kedatangan (ETA End) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={etaStartDate}
                      value={etaEndDate}
                      onChange={(e) => setEtaEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Live Dock Load & Factory Headroom Preview */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Warehouse className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Beban Jadwal Dock pada rentang ini:{' '}
                      <strong className="text-slate-900 font-mono">{dockLoadPreview.totalBookings} truk terjadwal</strong> (di {dockLoadPreview.dockCount} Pintu Dock)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                    Kapasitas Aman
                  </span>
                </div>
              </div>

              {/* Technical Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Catatan Teknis PPIC & Rekomendasi Pintu Dock / SOP
                </label>
                <textarea
                  rows={3}
                  value={ppicNotes}
                  onChange={(e) => setPpicNotes(e.target.value)}
                  placeholder="Contoh: Wajib masuk Dock 03 Tangki, lakukan sampling QC sebelum pembongkaran..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 placeholder-slate-400"
                />

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium self-center">Template Catatan:</span>
                  {[
                    'Dock 03 Tangki (Wajib QC Sampling)',
                    'Bongkar Prioritas Shift 1 Pagi',
                    'Dock Kontainer / Bay 02 Overhead Crane',
                    'Standar Pallet ISPM-15 Wingbox',
                  ].map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => setPpicNotes(temp)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 transition-colors cursor-pointer border border-slate-200"
                    >
                      + {temp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Setelah disetujui, status PO akan berubah menjadi <strong>READY_FOR_BOOKING</strong> dan supplier ({selectedPoForApproval.supplierName}) dapat langsung memilih slot jam kedatangan di sistem.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedPoForApproval(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui & Buka Akses Booking Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Rejection / Return to Purchasing */}
      {showRejectModal && selectedPoForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Kembalikan PO ke Purchasing</h3>
                  <p className="text-xs text-slate-500">Nomor PO: {selectedPoForReject.poNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Pengembalian / Revisi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Jelaskan alasan mengapa PO ini belum dapat disetujui..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Kembalikan ke Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
