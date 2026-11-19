import React, { useRef, useState } from 'react';
import { useAcademic } from '../context/AcademicContext';

export const AcademicTrendLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <div
    className={`relative flex items-center justify-center rounded-xl border border-white/25 bg-gradient-to-br from-cyan-400/25 via-blue-500/20 to-indigo-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_24px_rgba(14,165,233,0.28)] ${className}`}
  >
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path
        d="M4 19.5C7.5 19.5 8.5 11.5 12.5 11.5C16.5 11.5 17 16.5 20.5 13.5C22.2 12 23.2 9.5 24 7.5"
        stroke="url(#at-grad)"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="11.5" r="2.1" fill="#67E8F9" />
      <circle cx="24" cy="7.5" r="2.1" fill="#A5B4FC" />
      <defs>
        <linearGradient id="at-grad" x1="4" y1="19.5" x2="24" y2="7.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#A5B4FC" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  subtle?: boolean;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  interactive = false,
  subtle = false,
  className = '',
  onMouseMove,
  onMouseLeave,
  ...rest
}) => {
  const { settings } = useAcademic();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number; rx: number; ry: number } | null>(
    null
  );

  const allowTilt =
    interactive &&
    settings.tiltEffectsEnabled &&
    !settings.reducedMotionOverride &&
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(e);
    if (!interactive || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const ry = allowTilt ? ((x - 50) / 50) * 3.0 : 0;
    const rx = allowTilt ? -((y - 50) / 50) * 3.0 : 0;

    setPointer({ x, y, rx, ry });
  };

  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseLeave?.(e);
    if (pointer) setPointer(null);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={
        pointer
          ? {
              transform: allowTilt
                ? `perspective(950px) rotateX(${pointer.rx.toFixed(2)}deg) rotateY(${pointer.ry.toFixed(2)}deg) translateY(-2px)`
                : 'translateY(-1px)',
            }
          : undefined
      }
      className={`${subtle ? 'glass-panel-subtle' : 'glass-panel'} rounded-2xl transition-[transform,border-color,box-shadow] duration-200 ease-out ${
        interactive
          ? 'hover:border-cyan-300/45 hover:shadow-[0_24px_56px_-18px_rgba(56,189,248,0.28),0_0_24px_-6px_rgba(56,189,248,0.22)]'
          : ''
      } ${className}`}
      {...rest}
    >
      {/* Pointer-following luminous liquid refraction sheen */}
      {interactive && pointer && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200"
          style={{
            background: `radial-gradient(360px circle at ${pointer.x}% ${pointer.y}%, rgba(125, 211, 252, 0.16), rgba(129, 140, 248, 0.05) 45%, transparent 72%)`,
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) => {
  const sizeClass = size === 'sm' ? 'px-3.5 py-2 text-xs' : 'px-5 py-2.5 text-sm';

  const variantClass =
    variant === 'primary'
      ? 'bg-gradient-to-r from-cyan-500/85 via-blue-500/85 to-indigo-500/85 text-white border border-cyan-300/45 shadow-[0_8px_24px_-6px_rgba(56,189,248,0.45),inset_0_1px_0_rgba(255,255,255,0.38)] hover:from-cyan-400/95 hover:via-blue-500/95 hover:to-indigo-500/95 hover:shadow-[0_10px_28px_-4px_rgba(56,189,248,0.55)]'
      : variant === 'secondary'
        ? 'bg-white/[0.06] text-slate-100 border border-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-white/[0.12] hover:border-cyan-300/40'
        : variant === 'danger'
          ? 'bg-rose-500/15 text-rose-200 border border-rose-400/35 hover:bg-rose-500/25 hover:border-rose-300/55'
          : 'bg-transparent text-slate-300 border border-transparent hover:bg-white/[0.06] hover:text-white';

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap shrink-0 transition-[transform,background-color,border-color,box-shadow,color] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:opacity-45 disabled:pointer-events-none ${sizeClass} ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  label,
  error,
  value,
  placeholder,
  className = '',
  ...rest
}) => {
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const showFloatingTop = hasValue || Boolean(placeholder);

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        value={value}
        placeholder={placeholder ?? ' '}
        className={`peer glass-input w-full rounded-xl px-4 pt-6 pb-2.5 text-sm text-slate-100 placeholder:text-slate-400/75 ${
          error ? 'border-rose-400/65 focus:border-rose-400' : ''
        }`}
        {...rest}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 transition-all duration-150 ease-out whitespace-nowrap truncate max-w-[calc(100%-2rem)] ${
          showFloatingTop
            ? 'top-2 text-[11px] font-medium text-cyan-300/95'
            : 'top-4 text-sm text-slate-400 peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-cyan-300'
        }`}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1.5 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  id,
  label,
  error,
  children,
  className = '',
  ...rest
}) => {
  return (
    <div className={`relative ${className}`}>
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-2 text-[11px] font-medium text-cyan-300/95 z-10 whitespace-nowrap truncate max-w-[calc(100%-2.5rem)]"
      >
        {label}
      </label>
      <select
        id={id}
        className={`glass-input w-full appearance-none rounded-xl px-4 pt-6 pb-2.5 pr-10 text-sm text-slate-100 ${
          error ? 'border-rose-400/65' : ''
        }`}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
      {error && (
        <p className="mt-1.5 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
