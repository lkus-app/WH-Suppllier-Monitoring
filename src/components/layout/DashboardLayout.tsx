import React, { useState } from 'react';
import { useApp } from '../../lib/store';
import { DynamicSidebar } from './DynamicSidebar';
import { DynamicTopNavbar } from './DynamicTopNavbar';
import { RoleGuard } from '../auth/RoleGuard';
import { HorizontalTimeline } from '../timeline/HorizontalTimeline';
import { SupplierDashboard } from '../supplier/SupplierDashboard';
import { WarehouseDashboard } from '../warehouse/WarehouseDashboard';
import { PurchasingDashboard } from '../purchasing/PurchasingDashboard';
import { PpicDashboard } from '../ppic/PpicDashboard';
import { AdminDashboard } from '../admin/AdminDashboard';
import { DockUtilizationChart } from '../analytics/DockUtilizationChart';
import { AiDockCopilot } from '../ai/AiDockCopilot';

export const DashboardLayout: React.FC = () => {
  const { currentUser, currentSubView, setCurrentSubView } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Render role-specific dashboard content based on current active role and sub-view
  const renderDashboardView = () => {
    switch (currentUser.role) {
      case 'PURCHASING':
        return <PurchasingDashboard />;

      case 'PPIC':
        if (currentSubView === 'MONITOR_SLOTS') {
          return <HorizontalTimeline />;
        }
        return <PpicDashboard />;

      case 'SUPPLIER':
        return <SupplierDashboard />;

      case 'WAREHOUSE':
        if (currentSubView === 'DOCK_TIMELINE' || currentSubView === 'DEFAULT') {
          return <HorizontalTimeline />;
        }
        return <WarehouseDashboard />;

      case 'ADMIN':
        if (currentSubView === 'ANALYTICS') {
          return <DockUtilizationChart />;
        }
        return <AdminDashboard />;

      default:
        return <HorizontalTimeline />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white antialiased flex">
      {/* Dynamic Sidebar tailored to current role */}
      <DynamicSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        activeSubView={currentSubView}
        onSelectSubView={setCurrentSubView}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Dynamic Top Navbar */}
        <DynamicTopNavbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          activeSubView={currentSubView}
        />

        {/* Guarded Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          <RoleGuard>{renderDashboardView()}</RoleGuard>
        </main>

        {/* AI Dock Copilot Floating Assistant */}
        <AiDockCopilot />
      </div>
    </div>
  );
};
