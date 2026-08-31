import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Clock,
  Layers,
  RefreshCcw,
  Settings,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { VehicleMasterTab } from './VehicleMasterTab';
import { DockMasterTab } from './DockMasterTab';
import { SystemConfigTab } from './SystemConfigTab';
import { UserManagementTab } from './UserManagementTab';
import { UnloadingLogbook } from './UnloadingLogbook';
import { DockUtilizationChart } from '../analytics/DockUtilizationChart';

export type AdminTabType = 'VEHICLES' | 'DOCKS' | 'HOURS' | 'USERS' | 'LOGBOOK' | 'ANALYTICS';

export const AdminDashboard: React.FC = () => {
  const { currentSubView, setCurrentSubView, resetToDefaultData } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTabType>('VEHICLES');

  // Synchronize internal tab with currentSubView from Sidebar/Navbar
  useEffect(() => {
    if (currentSubView === 'MASTER_VEHICLES') {
      setActiveTab('VEHICLES');
    } else if (currentSubView === 'MASTER_DOCKS') {
      setActiveTab('DOCKS');
    } else if (currentSubView === 'SYSTEM_SETTINGS') {
      setActiveTab('HOURS');
    } else if (currentSubView === 'USER_MANAGEMENT') {
      setActiveTab('USERS');
    } else if (currentSubView === 'LOGBOOK_REPORT') {
      setActiveTab('LOGBOOK');
    } else if (currentSubView === 'ANALYTICS') {
      setActiveTab('ANALYTICS');
    }
  }, [currentSubView]);

  const handleTabChange = (tab: AdminTabType) => {
    setActiveTab(tab);
    if (tab === 'VEHICLES') setCurrentSubView('MASTER_VEHICLES');
    else if (tab === 'DOCKS') setCurrentSubView('MASTER_DOCKS');
    else if (tab === 'HOURS') setCurrentSubView('SYSTEM_SETTINGS');
    else if (tab === 'USERS') setCurrentSubView('USER_MANAGEMENT');
    else if (tab === 'LOGBOOK') setCurrentSubView('LOGBOOK_REPORT');
    else if (tab === 'ANALYTICS') setCurrentSubView('ANALYTICS');
  };

  return (
    <div className="space-y-5">
      {/* Admin Control Center Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-rose-600/20 border border-rose-500/30 text-rose-400 shadow-md shadow-rose-600/10">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Admin Control Center & Master Data</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                Enterprise v1.5
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Konfigurasi parameter sistem, armada terkunci, master pintu dock, RBAC user, & audit logbook
            </p>
          </div>
        </div>

        <button
          onClick={resetToDefaultData}
          className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Demo</span>
        </button>
      </div>

      {/* Admin Navigation Pills Tabs */}
      <div className="flex flex-wrap rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800 text-xs font-semibold gap-1 shadow-lg">
        <button
          onClick={() => handleTabChange('VEHICLES')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'VEHICLES'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>1. Master Armada & SOP</span>
        </button>

        <button
          onClick={() => handleTabChange('DOCKS')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'DOCKS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Warehouse className="w-3.5 h-3.5" />
          <span>2. Master Pintu Dock</span>
        </button>

        <button
          onClick={() => handleTabChange('HOURS')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'HOURS'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>3. Jam & Hari Libur</span>
        </button>

        <button
          onClick={() => handleTabChange('USERS')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>4. User Management (RBAC)</span>
        </button>

        <button
          onClick={() => handleTabChange('LOGBOOK')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'LOGBOOK'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>5. Logbook Bongkaran & KPI</span>
        </button>

        <button
          onClick={() => handleTabChange('ANALYTICS')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ANALYTICS'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-cyan-400/80 hover:text-cyan-300 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>6. Utilisasi Dock (Recharts)</span>
        </button>
      </div>

      {/* Active Tab Panel Body */}
      <div className="transition-all duration-200">
        {activeTab === 'VEHICLES' && <VehicleMasterTab />}
        {activeTab === 'DOCKS' && <DockMasterTab />}
        {activeTab === 'HOURS' && <SystemConfigTab />}
        {activeTab === 'USERS' && <UserManagementTab />}
        {activeTab === 'LOGBOOK' && <UnloadingLogbook />}
        {activeTab === 'ANALYTICS' && <DockUtilizationChart />}
      </div>
    </div>
  );
};
