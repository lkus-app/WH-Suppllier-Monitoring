import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Info,
  Mail,
  Package,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Truck,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { PurchaseOrder, POStatus, PriorityLevel } from '../../types';
import { useApp } from '../../lib/store';
import { formatDateIndo } from '../../lib/utils';
import { MiniDockTimeline } from '../common/MiniDockTimeline';

export const PurchasingDashboard: React.FC = () => {
  const {
    purchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    submitPoToPpic,
    cancelPurchaseOrder,
    currentUser,
    currentSubView,
    bookings,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [selectedPoDetail, setSelectedPoDetail] = useState<PurchaseOrder | null>(null);

  // Form State
  const [poNumber, setPoNumber] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierEmail, setSupplierEmail] = useState<string>('');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1000');
  const [unit, setUnit] = useState<string>('KG');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [formSaveType, setFormSaveType] = useState<'WAITING_PPIC_REVIEW' | 'DRAFT'>('WAITING_PPIC_REVIEW');

  // Bulk Upload State
  const [bulkFileUploaded, setBulkFileUploaded] = useState<boolean>(false);
  const [bulkParsedItems, setBulkParsedItems] = useState<Array<{
    poNumber: string;
    supplierName: string;
    supplierEmail: string;
    supplierPhone: string;
    itemDescription: string;
    quantity: number;
    unit: string;
    priority: PriorityLevel;
  }>>([]);

  // Respond to sidebar subview selection
  React.useEffect(() => {
    if (currentSubView === 'CREATE_PO') {
      handleOpenCreate();
    } else if (currentSubView === 'DISPATCH_STATUS') {
      setSelectedStatus('BOOKED');
    } else if (currentSubView === 'LIST_PO') {
      setSelectedStatus('ALL');
    }
  }, [currentSubView]);

  // Statistics
  const stats = useMemo(() => {
    const total = purchaseOrders.length;
    const waitingReview = purchaseOrders.filter((p) => p.status === 'WAITING_PPIC_REVIEW').length;
    const readyForBooking = purchaseOrders.filter((p) => p.status === 'READY_FOR_BOOKING' || (p.status as string) === 'PPIC_APPROVED').length;
    const bookedOrInDelivery = purchaseOrders.filter((p) => p.status === 'BOOKED' || (p.status as string) === 'SCHEDULED' || (p.status as string) === 'IN_PROGRESS').length;
    const urgentCount = purchaseOrders.filter((p) => p.priority === 'URGENT').length;
    const draftCount = purchaseOrders.filter((p) => p.status === 'DRAFT').length;

    return { total, waitingReview, readyForBooking, bookedOrInDelivery, urgentCount, draftCount };
  }, [purchaseOrders]);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      // Status Filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'READY_FOR_BOOKING') {
          if (po.status !== 'READY_FOR_BOOKING' && (po.status as string) !== 'PPIC_APPROVED') return false;
        } else if (selectedStatus === 'BOOKED') {
          if (po.status !== 'BOOKED' && (po.status as string) !== 'SCHEDULED' && (po.status as string) !== 'IN_PROGRESS') return false;
        } else if (po.status !== selectedStatus) {
          return false;
        }
      }

      // Priority Filter
      if (selectedPriority !== 'ALL' && po.priority !== selectedPriority) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          po.poNumber.toLowerCase().includes(q) ||
          po.supplierName.toLowerCase().includes(q) ||
          po.itemDescription.toLowerCase().includes(q) ||
          (po.supplierEmail && po.supplierEmail.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [purchaseOrders, selectedStatus, selectedPriority, searchQuery]);

  const handleOpenCreate = () => {
    const nextNum = Math.floor(100 + Math.random() * 900);
    setPoNumber(`PO-2026-08${nextNum}`);
    setSupplierName('PT Sumber Logistik Prima');
    setSupplierEmail('dispatch@sumberlogistik.com');
    setSupplierPhone('0812-8899-7711');
    setItemDescription('');
    setQuantity('1000');
    setUnit('KG');
    setPriority('NORMAL');
    setFormSaveType('WAITING_PPIC_REVIEW');
    setEditingPo(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (po: PurchaseOrder) => {
    setEditingPo(po);
    setPoNumber(po.poNumber);
    setSupplierName(po.supplierName);
    setSupplierEmail(po.supplierEmail || '');
    setSupplierPhone(po.supplierPhone || '');
    setItemDescription(po.itemDescription);
    setQuantity(String(po.quantity ?? po.qty ?? 0));
    setUnit(po.unit);
    setPriority(po.priority || 'NORMAL');
    setFormSaveType(po.status === 'DRAFT' ? 'DRAFT' : 'WAITING_PPIC_REVIEW');
    setShowCreateModal(true);
  };

  const handleOpenDetail = (po: PurchaseOrder) => {
    setSelectedPoDetail(po);
    setShowDetailModal(true);
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber || !supplierName || !itemDescription || !quantity) {
      alert('Mohon lengkapi seluruh kolom wajib bertanda bintang (*).');
      return;
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      alert('Kuantitas barang harus berupa angka positif.');
      return;
    }

    if (editingPo) {
      updatePurchaseOrder(editingPo.id, {
        poNumber: poNumber.trim().toUpperCase(),
        supplierName: supplierName.trim(),
        supplierEmail: supplierEmail.trim(),
        supplierPhone: supplierPhone.trim(),
        itemDescription: itemDescription.trim(),
        quantity: numQty,
        qty: numQty,
        unit: unit.trim().toUpperCase(),
        priority,
        status: formSaveType,
      });
    } else {
      createPurchaseOrder({
        poNumber: poNumber.trim().toUpperCase(),
        supplierName: supplierName.trim(),
        supplierEmail: supplierEmail.trim(),
        supplierPhone: supplierPhone.trim(),
        itemDescription: itemDescription.trim(),
        quantity: numQty,
        qty: numQty,
        unit: unit.trim().toUpperCase(),
        priority,
        status: formSaveType,
      });
    }

    setShowCreateModal(false);
  };

  const handleSetupBulkSample = () => {
    const samples = [
      {
        poNumber: `PO-2026-08${Math.floor(300 + Math.random() * 300)}`,
        supplierName: 'PT Cemerlang Paper Mills',
        supplierEmail: 'delivery@cemerlangpaper.com',
        supplierPhone: '0819-7766-5544',
        itemDescription: 'Duplex Board Sheet 350 GSM High Caliper',
        quantity: 25,
        unit: 'TON',
        priority: 'URGENT' as PriorityLevel,
      },
      {
        poNumber: `PO-2026-08${Math.floor(600 + Math.random() * 300)}`,
        supplierName: 'PT Aneka Kimia Sentosa',
        supplierEmail: 'supply@anekakimia.co.id',
        supplierPhone: '0818-1234-5678',
        itemDescription: 'Hydrochloric Acid 32% Industrial Solution',
        quantity: 15000,
        unit: 'LITER',
        priority: 'NORMAL' as PriorityLevel,
      },
      {
        poNumber: `PO-2026-08${Math.floor(900 + Math.random() * 99)}`,
        supplierName: 'PT Mitra Baja Nusantara',
        supplierEmail: 'order@mitrabaja.co.id',
        supplierPhone: '0812-3344-5566',
        itemDescription: 'Steel Rebar Deformed Grade BJTD-40 D16',
        quantity: 1200,
        unit: 'PCS',
        priority: 'URGENT' as PriorityLevel,
      },
    ];

    setBulkParsedItems(samples);
    setBulkFileUploaded(true);
  };

  const handleCommitBulkImport = () => {
    bulkParsedItems.forEach((item) => {
      createPurchaseOrder({
        ...item,
        status: 'WAITING_PPIC_REVIEW',
      });
    });
    setShowBulkModal(false);
    setBulkFileUploaded(false);
    setBulkParsedItems([]);
  };

  const getStatusBadge = (status: POStatus | string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Draft</span>
          </span>
        );
      case 'WAITING_PPIC_REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
            <span>Menunggu Review PPIC</span>
          </span>
        );
      case 'READY_FOR_BOOKING':
      case 'PPIC_APPROVED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            <span>Siap Booking Slot</span>
          </span>
        );
      case 'BOOKED':
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Truck className="w-3 h-3 text-blue-400" />
            <span>Slot Terjadwal (Booked)</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
            <RotateCcw className="w-3 h-3 text-indigo-400 animate-spin" />
            <span>Proses Bongkar</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Selesai Bongkar</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <X className="w-3 h-3 text-rose-400" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  const getPriorityBadge = (priorityLevel: PriorityLevel | undefined) => {
    if (priorityLevel === 'URGENT') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-black rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
          <Flame className="w-3 h-3 text-rose-400 fill-rose-500/40" />
          <span>URGENT</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-800/80 text-slate-400 border border-slate-700">
        <span>NORMAL</span>
      </span>
    );
  };

  // Find linked booking info for selected detail
  const linkedBooking = useMemo(() => {
    if (!selectedPoDetail) return null;
    return bookings.find((b) => b.poId === selectedPoDetail.id || b.poNumber === selectedPoDetail.poNumber);
  }, [selectedPoDetail, bookings]);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchasing Hub & PO Management</h1>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Module 2
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pembuatan Purchase Order, integrasi vendor supplier, dan alur verifikasi ETA dengan PPIC
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setShowBulkModal(true);
              setBulkFileUploaded(false);
              setBulkParsedItems([]);
            }}
            className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Bulk Import Excel/CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat PO Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total PO</span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-600 font-medium">+12%</span>
            <span>vs minggu lalu</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Menunggu PPIC</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{stats.waitingReview}</p>
          <p className="text-[11px] text-slate-500 mt-1">Belum disetujui ETA</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Siap Booking</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.readyForBooking}</p>
          <p className="text-[11px] text-slate-500 mt-1">ETA disetujui PPIC</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Slot Terjadwal</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{stats.bookedOrInDelivery}</p>
          <p className="text-[11px] text-slate-500 mt-1">Supplier sudah booking</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Prioritas URGENT</span>
            <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{stats.urgentCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Memerlukan fast-track</p>
        </div>
      </div>

      {/* Two-Column Layout (Data Table on Left + Timeline/Quick Tools on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Data Table & Filters (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari PO, supplier, material..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Priority filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 whitespace-nowrap font-medium">Prioritas:</span>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Semua Prioritas</option>
                  <option value="URGENT">🔥 Urgent Saja</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs pt-2 border-t border-slate-100">
              {[
                { id: 'ALL', label: `Semua (${stats.total})` },
                { id: 'WAITING_PPIC_REVIEW', label: `Menunggu PPIC (${stats.waitingReview})` },
                { id: 'READY_FOR_BOOKING', label: `Siap Booking (${stats.readyForBooking})` },
                { id: 'BOOKED', label: `Slot Terjadwal (${stats.bookedOrInDelivery})` },
                { id: 'DRAFT', label: `Draft (${stats.draftCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap text-xs transition-all cursor-pointer ${
                    selectedStatus === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* PO Table Container */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Nomor PO & Prioritas</th>
                    <th className="p-3.5">Vendor / Supplier</th>
                    <th className="p-3.5">Deskripsi Barang</th>
                    <th className="p-3.5">Kuantitas</th>
                    <th className="p-3.5">Target ETA PPIC</th>
                    <th className="p-3.5">Status Alur</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPOs.map((po) => {
                    const qtyVal = po.quantity ?? po.qty ?? 0;
                    const isDraft = po.status === 'DRAFT';
                    const isWaiting = po.status === 'WAITING_PPIC_REVIEW';
                    const isReady = po.status === 'READY_FOR_BOOKING' || (po.status as string) === 'PPIC_APPROVED';

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* PO Number & Priority */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm text-blue-600">{po.poNumber}</span>
                            {getPriorityBadge(po.priority)}
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                            <span>Dibuat: {po.createdAt.split('T')[0]}</span>
                            <span>•</span>
                            <span>{po.createdBy || 'Purchasing'}</span>
                          </div>
                        </td>

                        {/* Supplier */}
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800">{po.supplierName}</p>
                          <div className="flex flex-col text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                            {po.supplierEmail && (
                              <span className="flex items-center space-x-1 truncate max-w-[180px]">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{po.supplierEmail}</span>
                              </span>
                            )}
                            {po.supplierPhone && (
                              <span className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{po.supplierPhone}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Item Description */}
                        <td className="p-3.5">
                          <p className="font-medium text-slate-700 line-clamp-2 max-w-xs">{po.itemDescription}</p>
                        </td>

                        {/* Quantity */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-mono font-bold text-sm text-slate-900">
                            {qtyVal.toLocaleString()}
                            <span className="ml-1 text-xs font-normal text-slate-500">{po.unit}</span>
                          </div>
                        </td>

                        {/* ETA Window & Notes */}
                        <td className="p-3.5">
                          {po.etaStartDate || po.ppicEtaDateStart ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1 text-blue-700 font-mono font-semibold text-[11px]">
                                <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>
                                  {po.etaStartDate || po.ppicEtaDateStart} s.d {po.etaEndDate || po.ppicEtaDateEnd}
                                </span>
                              </div>
                              {po.ppicNotes && (
                                <p className="text-[10px] text-slate-500 line-clamp-1 italic max-w-[200px]">
                                  "{po.ppicNotes}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Belum ditentukan PPIC</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          {getStatusBadge(po.status)}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Detail button */}
                            <button
                              onClick={() => handleOpenDetail(po)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Detail & Audit Trail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Submit to PPIC button if DRAFT */}
                            {isDraft && (
                              <button
                                onClick={() => submitPoToPpic(po.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
                                title="Kirim ke Antrean PPIC"
                              >
                                <Send className="w-3 h-3" />
                                <span>Kirim PPIC</span>
                              </button>
                            )}

                            {/* Edit button (allowed for DRAFT or WAITING_PPIC_REVIEW) */}
                            {(isDraft || isWaiting) && (
                              <button
                                onClick={() => handleOpenEdit(po)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data PO"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete button */}
                            {(isDraft || isWaiting) && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus Purchase Order ${po.poNumber}?`)) {
                                    deletePurchaseOrder(po.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus PO"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Cancel button if ready for booking */}
                            {isReady && (
                              <button
                                onClick={() => {
                                  const reason = prompt('Masukkan alasan pembatalan PO:');
                                  if (reason) cancelPurchaseOrder(po.id, reason);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Batalkan PO"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPOs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">Tidak ada Purchase Order yang sesuai kriteria filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Mini Dock Timeline & Status Highlights (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Mini Dock Timeline Component */}
          <MiniDockTimeline />

          {/* Quick Help & Guidelines Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Pedoman Purchasing & SLA ETA</span>
            </h3>
            <ul className="text-[11px] text-slate-600 space-y-2 list-disc list-inside">
              <li>Pastikan nomor PO dan spesifikasi material sesuai dengan sistem ERP.</li>
              <li>Tandai <strong className="text-rose-600">URGENT</strong> hanya untuk kebutuhan line henti atau stockout kritis.</li>
              <li>Vendor dapat memilih slot setelah PPIC menyetujui ETA window.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal 1: Create / Edit Purchase Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPo ? `Edit Purchase Order (${editingPo.poNumber})` : 'Buat Purchase Order Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi spesifikasi pengadaan bahan baku & identitas supplier
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSavePO} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PO Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor PO <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="PO-2026-08XXX"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white"
                  />
                </div>

                {/* Priority Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Prioritas (Priority Level) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriority('NORMAL')}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        priority === 'NORMAL'
                          ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-2xs font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      NORMAL
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('URGENT')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        priority === 'URGENT'
                          ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-600" />
                      <span>URGENT</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Identitas Vendor / Supplier</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nama Perusahaan Supplier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Contoh: PT Sumber Logistik Prima"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Dispatch / Kontak Supplier
                    </label>
                    <input
                      type="email"
                      value={supplierEmail}
                      onChange={(e) => setSupplierEmail(e.target.value)}
                      placeholder="dispatch@vendor.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nomor Telepon / WhatsApp Driver
                    </label>
                    <input
                      type="text"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Material & Quantity */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Bahan Baku / Item <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Contoh: Cold Rolled Steel Coil Sheet 1.2mm JIS G3141"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kuantitas Volume <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1000"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Satuan (Unit) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                    >
                      <option value="PCS">PCS (Pieces)</option>
                      <option value="KG">KG (Kilogram)</option>
                      <option value="TON">TON (Metrik Ton)</option>
                      <option value="DRUM">DRUM (200L Steel/Plastic)</option>
                      <option value="BOX">BOX / Karton</option>
                      <option value="PALLET">PALLET</option>
                      <option value="LITER">LITER</option>
                      <option value="BAG">BAG (@25kg)</option>
                      <option value="COIL">COIL (Steel Sheet)</option>
                      <option value="ROLL">ROLL</option>
                      <option value="METER">METER</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-700 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  PO yang dikirim ke PPIC akan otomatis masuk ke antrean verifikasi PPIC untuk penetapan rentang tanggal kedatangan (ETA Window).
                </p>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    onClick={() => setFormSaveType('DRAFT')}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    Simpan Draft
                  </button>

                  <button
                    type="submit"
                    onClick={() => setFormSaveType('WAITING_PPIC_REVIEW')}
                    className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim ke PPIC</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk Import Excel / CSV */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Upload Purchase Orders</h3>
                  <p className="text-xs text-slate-500">Import batch data PO dari spreadsheet Excel / CSV ERP</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!bulkFileUploaded ? (
                <div
                  onClick={handleSetupBulkSample}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-xl p-8 text-center cursor-pointer transition-all space-y-3 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Klik untuk Memuat Contoh File PO_Batch_ERP.xlsx</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Mendukung format .XLSX, .CSV dengan header: poNumber, supplierName, itemDescription, quantity, unit, priority
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-mono shadow-2xs">
                    Format: 3 Item PO Otomatis
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Berhasil mem-parsing {bulkParsedItems.length} baris PO dari file</span>
                    </div>
                    <button
                      onClick={() => setBulkFileUploaded(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Pilih file lain
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 max-h-56 overflow-y-auto divide-y divide-slate-200">
                    {bulkParsedItems.map((item, idx) => (
                      <div key={idx} className="p-3 text-xs flex items-center justify-between bg-white">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-blue-600">{item.poNumber}</span>
                            {getPriorityBadge(item.priority)}
                          </div>
                          <p className="font-semibold text-slate-800 mt-0.5">{item.supplierName}</p>
                          <p className="text-[11px] text-slate-500">{item.itemDescription}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900">
                            {item.quantity.toLocaleString()} {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                {bulkFileUploaded && (
                  <button
                    type="button"
                    onClick={handleCommitBulkImport}
                    className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import {bulkParsedItems.length} PO ke Antrean PPIC</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: PO Detail & Audit Trail */}
      {showDetailModal && selectedPoDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 font-mono">{selectedPoDetail.poNumber}</h3>
                    {getPriorityBadge(selectedPoDetail.priority)}
                  </div>
                  <p className="text-xs text-slate-500">Audit Trail & Status Alur Logistik</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Procurement Workflow Progress Steps */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Alur Proses Pengadaan (Procurement Lifecycle)
                </p>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                    1. PO Dibuat
                  </div>
                  <div
                    className={`p-2 rounded-lg border font-bold ${
                      selectedPoDetail.status !== 'DRAFT'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    2. Review PPIC
                  </div>
                  <div
                    className={`p-2 rounded-lg border font-bold ${
                      selectedPoDetail.status === 'READY_FOR_BOOKING' ||
                      selectedPoDetail.status === 'BOOKED' ||
                      selectedPoDetail.status === 'COMPLETED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    3. Slot Ready
                  </div>
                  <div
                    className={`p-2 rounded-lg border font-bold ${
                      selectedPoDetail.status === 'BOOKED' || selectedPoDetail.status === 'COMPLETED'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    4. Terjadwal
                  </div>
                </div>
              </div>

              {/* Item & Volume */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50/50 border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Spesifikasi Barang:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedPoDetail.itemDescription}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Total Kuantitas:</span>
                  <p className="font-mono font-bold text-slate-900 text-base mt-0.5">
                    {(selectedPoDetail.quantity ?? selectedPoDetail.qty ?? 0).toLocaleString()} {selectedPoDetail.unit}
                  </p>
                </div>
              </div>

              {/* Supplier & Contact */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <span className="text-slate-500 font-medium">Informasi Supplier:</span>
                <p className="font-bold text-slate-900 text-sm">{selectedPoDetail.supplierName}</p>
                <div className="flex flex-wrap gap-4 text-slate-600 pt-1">
                  {selectedPoDetail.supplierEmail && (
                    <span className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedPoDetail.supplierEmail}</span>
                    </span>
                  )}
                  {selectedPoDetail.supplierPhone && (
                    <span className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedPoDetail.supplierPhone}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* PPIC Review Status */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <span className="text-slate-500 font-medium">Status Verifikasi PPIC:</span>
                {selectedPoDetail.etaStartDate || selectedPoDetail.ppicEtaDateStart ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-blue-700 font-bold">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>
                        Jendela ETA: {selectedPoDetail.etaStartDate || selectedPoDetail.ppicEtaDateStart} s.d{' '}
                        {selectedPoDetail.etaEndDate || selectedPoDetail.ppicEtaDateEnd}
                      </span>
                    </div>
                    {selectedPoDetail.ppicNotes && (
                      <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 italic">
                        Catatan Teknis PPIC: "{selectedPoDetail.ppicNotes}"
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Direview oleh: {selectedPoDetail.reviewedBy || 'Hendra Pratama (PPIC)'}
                    </p>
                  </div>
                ) : (
                  <p className="text-amber-600 italic">
                    PO ini sedang menunggu penetapan jendela ETA dan verifikasi kapasitas oleh tim PPIC.
                  </p>
                )}
              </div>

              {/* Linked Booking info if available */}
              {linkedBooking && (
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">Tiket Slot Booking Terkait</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                      {linkedBooking.bookingCode}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                    <div>
                      <span className="text-slate-500">Pintu Dock:</span>
                      <p className="font-bold text-slate-900">{linkedBooking.dockName}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Jadwal Tiba:</span>
                      <p className="font-bold text-slate-900">
                        {linkedBooking.startTime.split('T')[0]} ({linkedBooking.startTime.split('T')[1]?.slice(0, 5)} WIB)
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Driver & Plat:</span>
                      <p className="font-bold text-slate-900">
                        {linkedBooking.driverName} ({linkedBooking.licensePlate})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Kendaraan:</span>
                      <p className="font-bold text-slate-900">{linkedBooking.vehicleName}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
