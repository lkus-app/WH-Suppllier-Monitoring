import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Menu,
  Plus,
  Shield,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Truck,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { UserRole } from '../../types';
import { useApp } from '../../lib/store';
import { ArchitectureDocsModal } from '../docs/ArchitectureDocsModal';

export const Header: React.FC = () => {
  const {
    currentUser,
    switchRole,
    activeView,
    setActiveView,
    notifications,
    removeToast,
    settings,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showDocsModal, setShowDocsModal] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const roles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'ADMIN', label: 'Admin Master', icon: Shield, color: 'text-rose-400 bg-rose-950/50 border-rose-800' },
    { role: 'PURCHASING', label: 'Purchasing (PO)', icon: ShoppingCart, color: 'text-blue-400 bg-blue-950/50 border-blue-800' },
    { role: 'PPIC', label: 'PPIC (ETA Window)', icon: Calendar, color: 'text-purple-400 bg-purple-950/50 border-purple-800' },
    { role: 'SUPPLIER', label: 'Supplier (Booking)', icon: Truck, color: 'text-emerald-400 bg-emerald-950/50 border-emerald-800' },
    { role: 'WAREHOUSE', label: 'Warehouse (Gudang)', icon: Layers, color: 'text-amber-400 bg-amber-950/50 border-amber-800' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar: Brand, Role Switcher, Clock */}
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 border border-blue-400/30">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-black tracking-tight text-white">DockSlot</h1>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Sistem Antrean Pabrik
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Dock & Delivery Slot Management System
                </p>
              </div>
            </div>

            {/* Middle: Role Simulator Switcher */}
            <div className="hidden lg:flex items-center rounded-2xl bg-slate-900/90 border border-slate-800 p-1 space-x-1 shadow-inner">
              <span className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider">
                Simulasi Peran:
              </span>
              {roles.map((r) => {
                const Icon = r.icon;
                const isActive = currentUser.role === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      if (r.role === 'SUPPLIER') setActiveView('WIZARD');
                      else if (r.role === 'WAREHOUSE') setActiveView('KANBAN');
                      else if (r.role === 'PURCHASING') setActiveView('TABLE');
                      else if (r.role === 'PPIC') setActiveView('TABLE');
                      else if (r.role === 'ADMIN') setActiveView('DOCS');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isActive
                        ? `${r.color} border shadow-sm`
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{r.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Clock & Docs Trigger */}
            <div className="flex items-center space-x-2.5">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span className="font-mono font-bold text-slate-200">{currentTime} WIB</span>
              </div>

              <button
                onClick={() => setShowDocsModal(true)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/50 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
                title="Lihat Arsitektur Folder Modular Next.js & Skema Prisma"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Dokumentasi & Prisma Schema</span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Bottom Bar: Module Navigation Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto py-2.5 border-t border-slate-800/60 text-xs font-bold scrollbar-none">
            <button
              onClick={() => setActiveView('TIMELINE')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'TIMELINE'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Gantt Timeline (08:00 - 23:00)</span>
            </button>

            <button
              onClick={() => setActiveView('ANALYTICS')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'ANALYTICS'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-cyan-400/90 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-900/40'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Utilisasi Dock & Analitik</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-cyan-400/20 text-cyan-300">
                Recharts
              </span>
            </button>

            <button
              onClick={() => setActiveView('WIZARD')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'WIZARD'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Wizard Booking Supplier</span>
            </button>

            <button
              onClick={() => setActiveView('KANBAN')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'KANBAN'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Gudang & Gate Kanban</span>
            </button>

            <button
              onClick={() => setActiveView('TABLE')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'TABLE' && currentUser.role === 'PURCHASING'
                  ? 'bg-blue-600 text-white'
                  : activeView === 'TABLE' && currentUser.role === 'PPIC'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>
                {currentUser.role === 'PPIC'
                  ? 'PPIC Review ETA'
                  : currentUser.role === 'PURCHASING'
                  ? 'Purchasing PO Hub'
                  : 'Manajemen PO & Review'}
              </span>
            </button>

            <button
              onClick={() => setActiveView('DOCS')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'DOCS'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Master Data</span>
            </button>
          </div>

          {/* Mobile Role Switcher Bar */}
          {isMobileMenuOpen && (
            <div className="lg:hidden p-3 bg-slate-900 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">Pilih Simulasi Role:</span>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold text-left ${
                      currentUser.role === r.role ? r.color : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {notifications.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-2xl shadow-2xl border text-xs pointer-events-auto flex items-start space-x-2.5 transition-all animate-in slide-in-from-top-2 ${
              t.type === 'success'
                ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
                : t.type === 'warning'
                ? 'bg-slate-900 border-amber-500/50 text-amber-300'
                : t.type === 'error'
                ? 'bg-slate-900 border-rose-500/50 text-rose-300'
                : 'bg-slate-900 border-blue-500/50 text-blue-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-slate-100">{t.title}</div>
              <div className="text-slate-300 mt-0.5 leading-relaxed">{t.message}</div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Architecture & Prisma Docs Modal */}
      {showDocsModal && (
        <ArchitectureDocsModal onClose={() => setShowDocsModal(false)} />
      )}
    </>
  );
};
