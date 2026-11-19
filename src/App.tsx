/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LandingIntro } from './components/LandingIntro';
import SplashCursor from './components/SplashCursor';
import { SidebarNav } from './components/SidebarNav';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { DashboardPage } from './pages/DashboardPage';
import { InterpolationCalculatorPage } from './pages/InterpolationCalculatorPage';
import { MarksEntryPage } from './pages/MarksEntryPage';
import { PerformanceAnalysisPage } from './pages/PerformanceAnalysisPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentDetailsPage } from './pages/StudentDetailsPage';

const WorkspaceShell: React.FC = () => {
  const { activePage, settings } = useAcademic();
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') !== '1';
  });

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'students':
        return <StudentDetailsPage />;
      case 'marks':
        return <MarksEntryPage />;
      case 'interpolation':
        return <InterpolationCalculatorPage />;
      case 'analysis':
        return <PerformanceAnalysisPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#040814] text-slate-100 overflow-x-clip">
      {/* Deep Midnight Liquid Glass Gradient & Ambient Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0 no-print"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 15% 10%, rgba(14, 116, 144, 0.22), transparent 60%), radial-gradient(ellipse 70% 55% at 85% 20%, rgba(79, 70, 229, 0.2), transparent 60%), linear-gradient(160deg, #030712 0%, #07122a 48%, #0b1636 100%)',
          }}
        />
        {settings.ambientGlowEnabled && !settings.reducedMotionOverride && (
          <>
            <div
              className="animate-aurora-slow absolute -top-28 -left-24 h-[520px] w-[520px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(34, 211, 238, 0.16) 0%, rgba(34, 211, 238, 0.04) 45%, transparent 72%)',
              }}
            />
            <div
              className="animate-aurora-reverse absolute top-1/4 -right-28 h-[560px] w-[560px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.05) 45%, transparent 72%)',
              }}
            />
            <div
              className="animate-aurora-slow absolute -bottom-32 left-1/3 h-[480px] w-[480px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0.03) 45%, transparent 72%)',
              }}
            />
          </>
        )}
      </div>

      {/* React Bits Fluid SplashCursor (Green & Blue Mixture) */}
      {settings.splashEffectEnabled && !settings.reducedMotionOverride && (
        <SplashCursor
          rainbow={false}
          colors={['#22c55e', '#3b82f6']}
          size={1.2}
          force={0.6}
          swirl={0.5}
          trail={2.5}
          clickSplash
          colorSpeed={0.9}
          intensity={0.45}
          momentum={1.3}
          shading={0.47}
          glow={0.07}
          className="no-print"
        />
      )}

      {/* 3-Second Animated Landing Intro -> Workspace Frame */}
      <AnimatePresence mode="wait">
        {showIntro ? (
          <LandingIntro
            key="landing-intro"
            onComplete={() => setShowIntro(false)}
            reducedMotion={settings.reducedMotionOverride}
            durationMs={3000}
          />
        ) : (
          <motion.div
            key="workspace-shell"
            initial={settings.reducedMotionOverride ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: settings.reducedMotionOverride ? 0.1 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col lg:flex-row max-w-[1600px] mx-auto lg:p-5 lg:gap-6 min-h-screen"
          >
            <SidebarNav />

            <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-2 lg:py-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  initial={
                    settings.reducedMotionOverride
                      ? { opacity: 1 }
                      : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    settings.reducedMotionOverride
                      ? { opacity: 1 }
                      : { opacity: 0, y: -6 }
                  }
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AcademicProvider>
      <WorkspaceShell />
    </AcademicProvider>
  );
}
