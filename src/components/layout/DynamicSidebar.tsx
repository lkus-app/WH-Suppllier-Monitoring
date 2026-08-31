import React from 'react';
import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CheckSquare,
  ClipboardList,
  Clock,
  FileText,
  History,
  KanbanSquare,
  LogOut,
  PlusCircle,
  Shield,
  ShieldCheck,
  Ticket,
  Truck,
  Users,
  Warehouse,
  Zap,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { ROLE_CONFIGS, ROLE_NAVIGATION } from '../../lib/authConfig';
import { NavigationItem, UserRole } from '../../types';

// Icon resolver for dynamic icon rendering from lucide-react
const renderNavIcon = (iconName: string, className: string = 'w-4 h-4') => {
  switch (iconName) {
    case 'FileText':
      return <FileText className={className} />;
    case 'PlusCircle':
      return <PlusCircle className={className} />;
    case 'Truck':
      return <Truck className={className} />;
    case 'CheckSquare':
      return <CheckSquare className={className} />;
    case 'CalendarRange':
      return <CalendarRange className={className} />;
    case 'CalendarDays':
      return <CalendarDays className={className} />;
    case 'CalendarPlus':
      return <CalendarPlus className={className} />;
    case 'Ticket':
      return <Ticket className={className} />;
    case 'KanbanSquare':
      return <KanbanSquare className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'History':
      return <History className={className} />;
    case 'Warehouse':
      return <Warehouse className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'BarChart3':
      return <BarChart3 className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'ClipboardList':
      return <ClipboardList className={className} />;
    default:
      return <Zap className={className} />;
  }
};

interface DynamicSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeSubView: string;
  onSelectSubView: (subView: string) => void;
}

export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeSubView,
  onSelectSubView,
}) => {
  const { currentUser, logout, switchRole } = useApp();
  const currentRole = currentUser.role;
  const roleConfig = ROLE_CONFIGS[currentRole];
  const navItems = ROLE_NAVIGATION[currentRole] || [];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-2xs ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shadow-blue-500/20 shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="text-sm font-black tracking-tight text-slate-900 block truncate">
                DOCK<span className="text-blue-600">SLOT</span> <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">SaaS</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium block truncate">
                Enterprise Dock Management
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Role Profile Badge Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/60">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Active Portal
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${roleConfig.colorScheme.badgeBg} ${roleConfig.colorScheme.badgeText}`}
              >
                {roleConfig.badgeLabel}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {currentUser.department || currentUser.supplierName || 'Pabrik Sentral'}
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${roleConfig.colorScheme.badgeBg} ${roleConfig.colorScheme.badgeText}`}
              title={`${roleConfig.badgeLabel}: ${currentUser.name}`}
            >
              {currentRole.slice(0, 2)}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Menu List specific for active role */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {!isCollapsed && (
          <div className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>
        )}

        {navItems.map((item) => {
          const isActive =
            activeSubView === item.targetSubView ||
            (activeSubView === 'DEFAULT' && item === navItems[0]);

          return (
            <button
              key={item.id}
              onClick={() => onSelectSubView(item.targetSubView)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-lg transition-all cursor-pointer text-left group ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'px-3 py-2 space-x-2'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-r-2 border-transparent'
              }`}
            >
              <div
                className={`shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                {renderNavIcon(item.iconName, 'h-4 w-4 mr-2')}
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <span className="text-xs truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                        isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Fast Demo Role Switcher Bar */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50/70">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-1">
              <span>Beralih Role (Demo)</span>
              <Shield className="w-3 h-3 text-blue-600" />
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(['PURCHASING', 'PPIC', 'SUPPLIER', 'WAREHOUSE', 'ADMIN'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer truncate text-center ${
                    currentRole === r
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={`Ganti ke role ${r}`}
                >
                  {r.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => onToggleCollapse()}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer text-xs"
              title="Buka Menu"
            >
              ⚙
            </button>
          </div>
        )}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <div className="truncate min-w-0 pr-2">
              <span className="text-xs font-semibold text-slate-900 block truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Session Active</span>
              </span>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 border border-transparent hover:border-rose-200"
              title="Logout dari Sesi"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
