import React from 'react';
import { AppProvider, useApp } from './lib/store';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { notifications, removeToast } = useApp();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.map((toast) => {
        let Icon = CheckCircle2;
        let borderClass = 'border-emerald-500/30 bg-slate-900/95 text-emerald-300';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-rose-500/30 bg-slate-900/95 text-rose-300';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = 'border-amber-500/30 bg-slate-900/95 text-amber-300';
        } else if (toast.type === 'info') {
          Icon = Info;
          borderClass = 'border-cyan-500/30 bg-slate-900/95 text-cyan-300';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start space-x-3 transition-all animate-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white truncate">{toast.title}</p>
                <span className="text-[10px] text-slate-400 ml-2">{toast.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5 rounded-md hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const RootRouter: React.FC = () => {
  const { isAuthenticated } = useApp();

  return (
    <>
      {!isAuthenticated ? <LoginPage /> : <DashboardLayout />}
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <RootRouter />
    </AppProvider>
  );
}

