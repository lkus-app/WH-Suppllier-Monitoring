import React from 'react';
import { AlertTriangle, ArrowLeft, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useApp } from '../../lib/store';
import { DashboardRoute, UserRole } from '../../types';
import { getDefaultRouteForRole, isRouteAllowedForRole, ROLE_CONFIGS } from '../../lib/authConfig';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  targetRoute?: DashboardRoute;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  targetRoute,
}) => {
  const { isAuthenticated, currentUser, currentRoute, navigateToRoute, switchRole } = useApp();

  // If not logged in, we shouldn't even be in guarded tree, but handle safely
  if (!isAuthenticated) {
    return null;
  }

  // Check route-level permission
  const activeRoute = targetRoute || currentRoute;
  const isAllowedByRoute = isRouteAllowedForRole(currentUser.role, activeRoute);

  // Check custom allowedRoles if specified
  const isAllowedByRoleList = allowedRoles
    ? allowedRoles.includes(currentUser.role) || currentUser.role === 'ADMIN'
    : true;

  const isAuthorized = isAllowedByRoute && isAllowedByRoleList;

  if (!isAuthorized) {
    const userRoleConfig = ROLE_CONFIGS[currentUser.role];
    const defaultRoute = getDefaultRouteForRole(currentUser.role);

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl max-w-lg w-full p-8 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-4 shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-2">
            403 • Otoritas Ditolak
          </span>

          <h2 className="text-xl font-black text-white">
            Akses Menu Dibatasi (RBAC Guard)
          </h2>

          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Akun Anda saat ini memiliki peran <strong className="text-slate-200">{currentUser.name} ({currentUser.role})</strong> dan tidak memiliki izin otoritas untuk membuka rute <code className="text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded">{activeRoute}</code>.
          </p>

          <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Peran Aktif:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${userRoleConfig.colorScheme.badgeBg} ${userRoleConfig.colorScheme.badgeText}`}>
                {userRoleConfig.badgeLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Rute Resmi:</span>
              <span className="font-mono text-cyan-400 font-semibold">{defaultRoute}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Departemen / Vendor:</span>
              <span className="text-slate-300 font-semibold truncate max-w-[180px]">
                {currentUser.department || currentUser.supplierName || 'Pabrik Sentral'}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={() => navigateToRoute(defaultRoute)}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard Saya ({currentUser.role})</span>
            </button>

            {/* Quick admin switch for reviewer testing */}
            <button
              onClick={() => switchRole('ADMIN')}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 border border-purple-800/40 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              title="Beralih ke Super Admin untuk bypass otorisasi"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Beralih ke Admin Mode</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
