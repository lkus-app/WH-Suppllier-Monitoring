import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Layers,
  PlusCircle,
  QrCode,
  Shield,
  Truck,
  Zap,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { SupplierBookingWizard } from './SupplierBookingWizard';
import { SupplierMyBookings } from './SupplierMyBookings';

export const SupplierDashboard: React.FC = () => {
  const { purchaseOrders, bookings, currentUser, currentSubView, setCurrentSubView } = useApp();

  // Active Tab state: 'WIZARD' | 'MY_SCHEDULES'
  const [activeTab, setActiveTab] = useState<'WIZARD' | 'MY_SCHEDULES'>('WIZARD');

  useEffect(() => {
    if (currentSubView === 'MY_SCHEDULES') {
      setActiveTab('MY_SCHEDULES');
    } else if (currentSubView === 'BOOKING_WIZARD') {
      setActiveTab('WIZARD');
    }
  }, [currentSubView]);

  const handleTabChange = (tab: 'WIZARD' | 'MY_SCHEDULES') => {
    setActiveTab(tab);
    if (tab === 'MY_SCHEDULES') {
      setCurrentSubView('MY_SCHEDULES');
    } else {
      setCurrentSubView('BOOKING_WIZARD');
    }
  };

  // Supplier-specific KPIs
  const myPOs = purchaseOrders.filter((po) => {
    if (currentUser.role === 'SUPPLIER' && currentUser.supplierName) {
      return po.supplierName.toLowerCase().includes(currentUser.supplierName.toLowerCase());
    }
    return true;
  });

  const readyToBookPOs = myPOs.filter(
    (po) => po.status === 'READY_FOR_BOOKING' || (po.status as string) === 'PPIC_APPROVED'
  );

  const myBookingsList = bookings.filter((b) => {
    if (currentUser.role === 'SUPPLIER' && currentUser.supplierName) {
      return b.supplierName.toLowerCase().includes(currentUser.supplierName.toLowerCase());
    }
    return true;
  });

  const confirmedBookings = myBookingsList.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'BOOKED'
  );

  const activeInWarehouse = myBookingsList.filter(
    (b) => b.status === 'GATE_IN' || b.status === 'UNLOADING' || b.status === 'ARRIVED'
  );

  const completedBookings = myBookingsList.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'DONE'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              PO Siap Booking
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {readyToBookPOs.length} <span className="text-xs font-normal text-slate-400">PO</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Slot Terkonfirmasi
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {confirmedBookings.length} <span className="text-xs font-normal text-slate-400">Jadwal</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Armada di Pabrik
            </span>
            <span className="text-xl font-bold text-amber-700 mt-0.5 block">
              {activeInWarehouse.length} <span className="text-xs font-normal text-slate-400">Truk</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Selesai Bongkar
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {completedBookings.length} <span className="text-xs font-normal text-slate-400">Total</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => handleTabChange('WIZARD')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'WIZARD'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Wizard Booking Slot Mandiri</span>
        </button>

        <button
          onClick={() => handleTabChange('MY_SCHEDULES')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'MY_SCHEDULES'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Tiket & Jadwal Saya ({myBookingsList.length})</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'WIZARD' ? (
        <SupplierBookingWizard onBookingCompleted={() => handleTabChange('MY_SCHEDULES')} />
      ) : (
        <SupplierMyBookings onNewBookingClick={() => handleTabChange('WIZARD')} />
      )}
    </div>
  );
};
