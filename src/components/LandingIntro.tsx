import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { AcademicTrendLogo, GlassButton } from './GlassPrimitives';

interface LandingIntroProps {
  onComplete: () => void;
  reducedMotion?: boolean;
  durationMs?: number;
}

export const LandingIntro: React.FC<LandingIntroProps> = ({
  onComplete,
  reducedMotion = false,
  durationMs = 3000,
}) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setExiting(true);
      onComplete();
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    if (exiting) return;
    setExiting(true);
    onComplete();
  };

  return (
    <motion.div
      role="region"
      aria-label="AcademicTrend Welcome Introduction"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.02 }}
      transition={{ duration: reducedMotion ? 0.15 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-40 flex items-center justify-center px-6 py-10 overflow-hidden"
    >
      {/* Subtle luminous radial backdrop behind landing centerpiece */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 38% 42%, rgba(34, 197, 94, 0.14), transparent 48%), radial-gradient(circle at 64% 56%, rgba(59, 130, 246, 0.18), transparent 52%)',
        }}
      />

      {/* Translucent Liquid Glass Landing Card */}
      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel relative w-full max-w-xl rounded-3xl p-8 sm:p-10 text-center overflow-hidden"
      >
        {/* Top Luminous Edge Reflection */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"
        />

        {/* Animated Emblem */}
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reducedMotion ? 0.1 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center"
        >
          {!reducedMotion && (
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.24, 1], opacity: [0.45, 0.15, 0.45] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/35 to-blue-500/35 blur-md"
            />
          )}
          <AcademicTrendLogo className="relative h-16 w-16 rounded-2xl" />
        </motion.div>

        {/* Brand Heading & Subtitle */}
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.1 : 0.45, delay: reducedMotion ? 0 : 0.15 }}
        >
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-emerald-300/90 mb-2">
            Liquid Glass Academic Analytics
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            AcademicTrend
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-300 max-w-md mx-auto">
            Student Performance Trend Prediction &amp; Lagrange Numerical Interpolation
          </p>
        </motion.div>

        {/* Animated Interpolation Curve SVG */}
        <div className="mx-auto mt-7 mb-7 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <svg
            viewBox="0 0 320 74"
            fill="none"
            className="w-full h-16 overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="landing-curve-grad" x1="12" y1="58" x2="308" y2="14" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="55%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal reference lines */}
            <line x1="8" y1="20" x2="312" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
            <line x1="8" y1="44" x2="312" y2="44" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />

            {/* Smooth animated interpolation trajectory */}
            <motion.path
              d="M 16 56 C 64 56, 76 32, 118 34 C 160 36, 178 46, 214 28 C 248 11, 272 22, 304 14"
              stroke="url(#landing-curve-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: reducedMotion ? 1 : 0, opacity: reducedMotion ? 1 : 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 1.7, delay: reducedMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Assessment knot points */}
            {[
              { cx: 16, cy: 56, fill: '#22C55E', delay: 0.25 },
              { cx: 118, cy: 34, fill: '#34D399', delay: 0.7 },
              { cx: 214, cy: 28, fill: '#38BDF8', delay: 1.15 },
              { cx: 304, cy: 14, fill: '#3B82F6', delay: 1.6 },
            ].map((pt, idx) => (
              <motion.circle
                key={idx}
                cx={pt.cx}
                cy={pt.cy}
                r="4.5"
                fill={pt.fill}
                stroke="#07122A"
                strokeWidth="2"
                initial={reducedMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.35,
                  delay: reducedMotion ? 0 : pt.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </svg>
        </div>

        {/* 3-Second Progress Track */}
        <div className="mx-auto max-w-xs space-y-2.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              initial={{ scaleX: reducedMotion ? 1 : 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reducedMotion ? 0.1 : durationMs / 1000, ease: 'linear' }}
              style={{ transformOrigin: 'left center' }}
              className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Preparing workspace…</span>
            <span className="font-mono-tabular text-cyan-200">3.0s</span>
          </div>
        </div>

        {/* Optional immediate entry */}
        <div className="mt-6 flex justify-center">
          <GlassButton size="sm" variant="secondary" onClick={handleSkip}>
            <span>Enter Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </GlassButton>
        </div>
      </motion.div>
    </motion.div>
  );
};
