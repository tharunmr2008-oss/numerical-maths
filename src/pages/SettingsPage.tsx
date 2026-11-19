import React, { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import {
  FloatingInput,
  FloatingSelect,
  GlassButton,
  GlassCard,
} from '../components/GlassPrimitives';
import { useAcademic } from '../context/AcademicContext';
import { InterpolationMethod } from '../types/academic';
import { METHOD_METADATA } from '../utils/interpolation';

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const GlassToggleRow: React.FC<ToggleRowProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
}) => (
  <div className="flex items-center justify-between gap-4 py-4 first:pt-1 last:pb-1">
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-white cursor-pointer">
        {label}
      </label>
      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
    </div>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${
        checked
          ? 'bg-cyan-500/40 border-cyan-300/60'
          : 'bg-white/[0.06] border-white/15'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, clearAllData } = useAcademic();
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleClear = () => {
    clearAllData();
    setConfirmClear(false);
    setSavedNotice('All local student records and marks have been cleared.');
    window.setTimeout(() => setSavedNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs font-medium text-cyan-300/90 mb-1">
          Workspace Preferences
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Configure institution labels, numerical interpolation defaults, and Liquid Glass visual effects.
        </p>
      </div>

      {savedNotice && (
        <div
          role="status"
          className="glass-panel-subtle rounded-xl px-4 py-3 text-sm text-cyan-100 border-cyan-400/35 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-cyan-300" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Academic Configuration */}
      <GlassCard className="p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">
          Academic & Mathematical Defaults
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingInput
            id="setting-institution"
            label="Institution Name"
            value={settings.institutionName}
            onChange={(e) => updateSettings({ institutionName: e.target.value })}
          />
          <FloatingInput
            id="setting-term"
            label="Academic Term"
            value={settings.academicTerm}
            onChange={(e) => updateSettings({ academicTerm: e.target.value })}
          />
          <FloatingSelect
            id="setting-method"
            label="Default Interpolation Method"
            value={settings.defaultMethod}
            onChange={(e) =>
              updateSettings({ defaultMethod: e.target.value as InterpolationMethod })
            }
          >
            {(Object.keys(METHOD_METADATA) as InterpolationMethod[]).map((m) => (
              <option key={m} value={m} className="bg-[#09132c] text-slate-100">
                {METHOD_METADATA[m].name}
              </option>
            ))}
          </FloatingSelect>
          <FloatingInput
            id="setting-threshold"
            label="Passing Threshold (%)"
            type="number"
            min={1}
            max={100}
            value={settings.passingPercentage}
            onChange={(e) => {
              const val = Math.min(100, Math.max(1, Number(e.target.value) || 60));
              updateSettings({ passingPercentage: val });
            }}
          />
        </div>
      </GlassCard>

      {/* Liquid Glass & Splash Effect Preferences */}
      <GlassCard className="p-6">
        <h2 className="font-display text-lg font-semibold text-white mb-3">
          Liquid Glass & Splash Effects
        </h2>
        <div className="divide-y divide-white/[0.08]">
          <GlassToggleRow
            id="toggle-splash"
            label="Fluid Splash Cursor Effect"
            description="Renders an interactive WebGL fluid ink trail and click-splash ripples across glass surfaces while keeping your native cursor."
            checked={settings.splashEffectEnabled}
            onChange={(v) => updateSettings({ splashEffectEnabled: v })}
          />
          <GlassToggleRow
            id="toggle-tilt"
            label="3D Card Tilt & Edge Refraction"
            description="Applies subtle pointer-tracked 3D perspective and luminous specular refraction across interactive glass cards."
            checked={settings.tiltEffectsEnabled}
            onChange={(v) => updateSettings({ tiltEffectsEnabled: v })}
          />
          <GlassToggleRow
            id="toggle-glow"
            label="Ambient Background Lighting"
            description="Renders the soft midnight radial spotlight and slow aurora gradient lighting."
            checked={settings.ambientGlowEnabled}
            onChange={(v) => updateSettings({ ambientGlowEnabled: v })}
          />
          <GlassToggleRow
            id="toggle-motion"
            label="Reduce Motion Override"
            description="Disables splash ripples, card tilt, and page transition animations regardless of OS setting."
            checked={settings.reducedMotionOverride}
            onChange={(v) => updateSettings({ reducedMotionOverride: v })}
          />
        </div>
      </GlassCard>

      {/* Data Management */}
      <GlassCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            Clear Saved Records
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Remove all locally stored students, marks, and analysis history to start fresh with zero records.
          </p>
        </div>

        {confirmClear ? (
          <div className="flex items-center gap-2 shrink-0">
            <GlassButton variant="danger" size="sm" onClick={handleClear}>
              Confirm Clear
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => setConfirmClear(false)}
            >
              Cancel
            </GlassButton>
          </div>
        ) : (
          <GlassButton variant="secondary" onClick={() => setConfirmClear(true)}>
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </GlassButton>
        )}
      </GlassCard>
    </div>
  );
};
