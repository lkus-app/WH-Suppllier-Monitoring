import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  RotateCcw,
  Search,
  Shield,
  User as UserIcon,
  Warehouse,
  X,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { ROLE_CONFIGS } from '../../lib/authConfig';
import { getOffsetDate, TODAY_STR, TOMORROW_STR, YESTERDAY_STR } from '../../lib/initialData';

interface DynamicTopNavbarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  activeSubView: string;
}

export const DynamicTopNavbar: React.FC<DynamicTopNavbarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  activeSubView,
}) => {
  const {
    currentUser,
    currentRoute,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    notifications,
    removeToast,
    logout,
    resetToDefaultData,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const roleConfig = ROLE_CONFIGS[currentUser.role];

  // Helper to handle date offset shifts
  const shiftDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === TODAY_STR;

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left section: Sidebar Toggle & Route Breadcrumb */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          title="Buka/Tutup Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:flex items-center space-x-2 text-xs">
          <span className="font-mono text-slate-400">dashboard</span>
          <span className="text-slate-400">/</span>
          <span className={`font-semibold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100`}>
            {currentUser.role.toLowerCase()}
          </span>
          {activeSubView && activeSubView !== 'DEFAULT' && (
            <>
              <span className="text-slate-400">/</span>
              <span className="text-slate-700 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {activeSubView.toLowerCase().replace(/_/g, '-')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center/Right section: Date Navigator & Search & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Date Selector Widget */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center space-x-1.5 px-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={() => shiftDate(1)}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(TODAY_STR)}
              className="ml-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-[10px] font-bold cursor-pointer transition-colors"
              title="Kembali ke Hari Ini"
            >
              Hari Ini
            </button>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari PO / Plat / Driver..."
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white w-44 lg:w-56 transition-all shadow-2xs"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer border border-slate-200/60"
            title="Notifikasi Sistem"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-slate-900">Log Aktivitas & Notifikasi</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold">{notifications.length} item</span>
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Belum ada notifikasi baru.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs relative group hover:bg-blue-50/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-blue-700 truncate">{n.title}</span>
                        <span className="text-[9px] text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{n.message}</p>
                      <button
                        onClick={() => removeToast(n.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 text-xs hidden group-hover:block cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center font-black text-xs ${roleConfig.colorScheme.badgeBg} ${roleConfig.colorScheme.badgeText}`}
            >
              {currentUser.role.slice(0, 2)}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                {currentUser.name.split(' ')[0]}
              </p>
              <p className="text-[9px] text-slate-500 uppercase font-semibold">
                {roleConfig.badgeLabel}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 animate-in fade-in space-y-2">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                <span
                  className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded mt-1.5 ${roleConfig.colorScheme.badgeBg} ${roleConfig.colorScheme.badgeText}`}
                >
                  Role: {currentUser.role}
                </span>
              </div>

              <div className="pt-1 space-y-1">
                <button
                  onClick={() => {
                    resetToDefaultData();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center space-x-2 cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset Demo Data Simulasi</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center space-x-2 cursor-pointer border-t border-slate-100 pt-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Logout dari Sesi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
