import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Truck,
  Warehouse,
  Zap,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { DEMO_ACCOUNTS } from '../../lib/authConfig';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, demoLogin, loginError } = useApp();

  const [email, setEmail] = useState('admin.logistik@pabrik.co.id');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDemoCheatSheet, setShowDemoCheatSheet] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Harap masukkan alamat email atau username Anda.');
      return;
    }
    if (!password) {
      setLocalError('Harap masukkan password akun Anda.');
      return;
    }

    setIsLoading(true);

    // Simulate real auth network latency for smooth UI feedback
    setTimeout(() => {
      const res = login(email, password, rememberMe);
      setIsLoading(false);
      if (!res.success && res.message) {
        setLocalError(res.message);
      }
    }, 450);
  };

  const handleSelectDemo = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setLocalError(null);
  };

  const handleInstantDemoLogin = (role: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      demoLogin(role);
      setIsLoading(false);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/10 via-cyan-500/5 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-900/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-900/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Login Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/30">
            <Warehouse className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            DOCK<span className="text-cyan-400">SLOT</span> ENTERPRISE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Delivery Slot & Factory Gate Management System
          </p>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 mt-3 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sistem Operasional Aktif • RBAC Enforced</span>
          </div>
        </div>

        {/* Clean Login Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-100">Selamat Datang</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Masuk dengan akun terdaftar untuk mengakses modul operasional dock.
            </p>
          </div>

          {/* Error Banner */}
          {(localError || loginError) && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Autentikasi Gagal</p>
                <p className="text-rose-200/90 mt-0.5">{localError || loginError}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email / Username Perusahaan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@pabrik.co.id"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowDemoCheatSheet(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer transition-colors"
                >
                  Lupa / Akun Demo?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20 cursor-pointer"
                />
                <span>Ingat Sesi Login</span>
              </label>

              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SSL Encrypted</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 hover:shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Otoritas...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Persona Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Akses Cepat Demo Role (1-Click Login)
              </span>
              <button
                type="button"
                onClick={() => setShowDemoCheatSheet(true)}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Info Akun</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleInstantDemoLogin('ADMIN')}
                className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-purple-400">Admin</span>
                  <Shield className="w-3 h-3 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">Budi Santoso</p>
                <p className="text-[9px] text-slate-400 truncate">Master & Users</p>
              </button>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin('PURCHASING')}
                className="p-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-blue-400">Purchasing</span>
                  <Zap className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">Rina Wijaya</p>
                <p className="text-[9px] text-slate-400 truncate">Upload & List PO</p>
              </button>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin('PPIC')}
                className="p-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-cyan-400">PPIC</span>
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">Hendra Pratama</p>
                <p className="text-[9px] text-slate-400 truncate">Verifikasi & ETA</p>
              </button>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin('SUPPLIER')}
                className="p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-left transition-all cursor-pointer group col-span-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-400">Supplier</span>
                  <Truck className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">Joko (Vendor)</p>
                <p className="text-[9px] text-slate-400 truncate">Booking Slot</p>
              </button>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin('WAREHOUSE')}
                className="p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 text-left transition-all cursor-pointer group col-span-1 sm:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-400">Warehouse</span>
                  <Warehouse className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">Agus Sutrisno</p>
                <p className="text-[9px] text-slate-400 truncate">Timeline & Gate Check-In</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 PT Logistik Industri Maju • Protected by Role-Based Access Control
        </p>
      </div>

      {/* Demo Credentials Cheat Sheet Modal */}
      {showDemoCheatSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Daftar Akun Demo & Otoritas Role</h3>
              </div>
              <button
                onClick={() => setShowDemoCheatSheet(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Semua akun demo menggunakan password default: <code className="px-1.5 py-0.5 bg-slate-950 text-cyan-300 rounded font-mono font-bold">password123</code>. Klik akun di bawah untuk memasukkan data otomatis:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => {
                    handleSelectDemo(acc);
                    setShowDemoCheatSheet(false);
                  }}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition-all flex items-start justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {acc.name}
                      </span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {acc.role}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-400/90 font-mono">{acc.email}</p>
                    <p className="text-[11px] text-slate-400">{acc.roleDescription}</p>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-semibold px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/40 shrink-0 ml-2 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                    Pilih Akun
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDemoCheatSheet(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer"
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
