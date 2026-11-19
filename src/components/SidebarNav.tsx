import React, { useState } from 'react';
import {
  BarChart3,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ClipboardEdit,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAcademic } from '../context/AcademicContext';
import { PageId } from '../types/academic';
import { AcademicTrendLogo } from './GlassPrimitives';

export interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Student Details', icon: Users },
  { id: 'marks', label: 'Marks Entry', icon: ClipboardEdit },
  { id: 'interpolation', label: 'Interpolation Calculator', icon: Calculator },
  { id: 'analysis', label: 'Performance Analysis', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const SidebarNav: React.FC = () => {
  const { activePage, setActivePage, settings } = useAcademic();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (id: PageId) => {
    setActivePage(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Floating Glass Sidebar */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className={`hidden lg:flex flex-col shrink-0 sticky top-5 h-[calc(100vh-2.5rem)] glass-sidebar rounded-2xl transition-[width] duration-250 ease-out p-3.5 ${
          collapsed ? 'w-[84px]' : 'w-[264px]'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 min-w-0">
            <AcademicTrendLogo className="w-9 h-9 shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <span className="block font-display text-base font-bold tracking-tight text-white truncate">
                  AcademicTrend
                </span>
                <span className="block text-[11px] text-slate-400 truncate">
                  Performance Analyzer
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-cursor="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-1.5 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-cursor="nav"
                onClick={() => handleSelect(item.id)}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${
                  collapsed ? 'justify-center px-2' : ''
                } ${isActive ? 'text-white' : 'text-slate-300/85 hover:text-white'}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 via-blue-500/18 to-indigo-500/18 border border-cyan-300/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_20px_rgba(56,189,248,0.16)]"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                />
                <Icon
                  className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-colors ${
                    isActive ? 'text-cyan-300' : 'text-slate-400 group-hover:text-cyan-200'
                  }`}
                />
                {!collapsed && (
                  <span className="relative z-10 truncate whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Term Context */}
        {!collapsed && (
          <div className="pt-3 border-t border-white/[0.08] px-2">
            <p className="text-xs font-medium text-slate-300 truncate">{settings.institutionName}</p>
            <p className="text-[11px] text-slate-400 truncate">{settings.academicTerm}</p>
          </div>
        )}
      </aside>

      {/* Mobile Compact Top Bar (< 1024px) */}
      <header className="lg:hidden sticky top-0 z-40 glass-sidebar border-x-0 border-t-0 px-4 py-3 flex items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2.5 min-w-0">
          <AcademicTrendLogo className="w-8 h-8 shrink-0" />
          <span className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap">
            AcademicTrend
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-slate-100 hover:bg-white/[0.12] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Glass Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex"
          >
            <motion.nav
              aria-label="Mobile Navigation"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="w-72 max-w-[85vw] h-full glass-sidebar rounded-r-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <AcademicTrendLogo className="w-8 h-8" />
                    <span className="font-display text-base font-bold text-white">
                      AcademicTrend
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation menu"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 mt-4">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-cyan-400/20 border border-cyan-300/35 text-white'
                            : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs text-slate-400">
                <p className="font-medium text-slate-200">{settings.institutionName}</p>
                <p>{settings.academicTerm}</p>
              </div>
            </motion.nav>
            <button
              type="button"
              aria-label="Close menu backdrop"
              className="flex-1"
              onClick={() => setMobileOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
