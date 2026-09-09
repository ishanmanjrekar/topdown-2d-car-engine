import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, RefreshCw, Zap, Shield, Sparkles } from 'lucide-react';
import { useCarConfigStore, PresetName } from '../../stores/useCarConfigStore';
import { useGameStore } from '../../stores/useGameStore';

export const DebugMenu: React.FC = () => {
  const debugMenuOpen = useGameStore((s) => s.debugMenuOpen);
  const setDebugMenuOpen = useGameStore((s) => s.setDebugMenuOpen);
  const controlMode = useGameStore((s) => s.controlMode);
  const setControlMode = useGameStore((s) => s.setControlMode);
  const config = useCarConfigStore();

  return (
    <AnimatePresence>
      {debugMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end'
        }}
        onClick={() => setDebugMenuOpen(false)}
      >
        <motion.div
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="ui-drawer-sheet"
          style={{
            width: '100%',
            maxWidth: '400px',
            height: '100%',
            borderRadius: '26px 0 0 26px',
            overflow: 'hidden',
            padding: 0,
            boxSizing: 'border-box',
            borderRight: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Frozen / Sticky Top Header Pane */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1.5px solid rgba(0, 0, 0, 0.08)',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(24px)',
              flexShrink: 0,
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={22} color="#0284c7" />
              <h2
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontFamily: 'var(--theme-font-display)',
                  letterSpacing: '0.6px',
                  color: '#0f172a'
                }}
              >
                CAR SETUP & TUNING
              </h2>
            </div>
            <button
              onClick={() => setDebugMenuOpen(false)}
              className="btn-chunky btn-chunky-light btn-chunky-circle"
              style={{ width: '36px', height: '36px' }}
              title="Close (Esc)"
            >
              <X size={18} color="#0f172a" />
            </button>
          </div>

          {/* Scrollable Settings Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Preset Buttons */}
            <div>
            <label
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                fontFamily: 'var(--theme-font-body)',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}
            >
              Vehicle Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {(['arcade-default', 'street-drift', 'track-grip', 'heavy-muscle'] as PresetName[]).map((p) => (
                <button
                  key={p}
                  onClick={() => config.loadPreset(p)}
                  className="btn-chunky btn-chunky-sm btn-chunky-light"
                  style={{
                    padding: '8px 10px',
                    fontSize: '11.5px',
                    fontFamily: 'var(--theme-font-body)',
                    fontWeight: 700,
                    letterSpacing: '0.2px',
                    textTransform: 'capitalize'
                  }}
                >
                  {p.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Control Scheme */}
          <div>
            <label
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                fontFamily: 'var(--theme-font-body)',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}
            >
              Control Scheme
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setControlMode('rear-touch')}
                className={`btn-chunky btn-chunky-sm ${controlMode === 'rear-touch' ? 'btn-chunky-sky' : 'btn-chunky-light'}`}
                style={{
                  fontSize: '11.5px',
                  padding: '8px 6px',
                  fontFamily: 'var(--theme-font-body)',
                  fontWeight: 700,
                  letterSpacing: '0.2px'
                }}
              >
                Rear-Touch
              </button>
              <button
                onClick={() => setControlMode('keyboard')}
                className={`btn-chunky btn-chunky-sm ${controlMode === 'keyboard' ? 'btn-chunky-sky' : 'btn-chunky-light'}`}
                style={{
                  fontSize: '11.5px',
                  padding: '8px 6px',
                  fontFamily: 'var(--theme-font-body)',
                  fontWeight: 700,
                  letterSpacing: '0.2px'
                }}
              >
                Keyboard
              </button>
            </div>
          </div>

          {/* Section: Rear-Touch Push Steering */}
          <div
            className="ui-card-inset"
            style={{
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7' }}>
              <Zap size={16} />
              <span style={{ fontSize: '13px', fontFamily: 'var(--theme-font-body)', fontWeight: 800, color: '#0f172a' }}>
                Rear-Touch Push Tuning
              </span>
            </div>

            <SliderControl
              label="Rear Bumper Anchor Distance"
              value={config.rearAnchorDistance}
              min={20}
              max={120}
              step={2}
              unit="px"
              onChange={(val) => config.updateConfig({ rearAnchorDistance: val })}
            />

            <SliderControl
              label="Push Throttle Radius"
              value={config.rearPushRadius}
              min={60}
              max={220}
              step={5}
              unit="px"
              onChange={(val) => config.updateConfig({ rearPushRadius: val })}
            />

            <SliderControl
              label="Steering Sensitivity Radius"
              value={config.rearSteerMaxOffset}
              min={40}
              max={150}
              step={5}
              unit="px"
              onChange={(val) => config.updateConfig({ rearSteerMaxOffset: val })}
            />

            <SliderControl
              label="Touch Deadzone"
              value={config.rearDeadzone}
              min={0}
              max={30}
              step={1}
              unit="px"
              onChange={(val) => config.updateConfig({ rearDeadzone: val })}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'var(--theme-font-body)', color: '#475569', fontWeight: 600 }}>
                Invert Steering Push
              </span>
              <input
                type="checkbox"
                checked={config.invertSteer}
                onChange={(e) => config.updateConfig({ invertSteer: e.target.checked })}
                style={{ accentColor: '#0284c7', width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Section: Vehicle Dynamics */}
          <div
            className="ui-card-inset"
            style={{
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4757' }}>
              <Shield size={16} />
              <span style={{ fontSize: '13px', fontFamily: 'var(--theme-font-body)', fontWeight: 800, color: '#0f172a' }}>
                Physics &amp; Handling
              </span>
            </div>

            <SliderControl
              label="Max Speed"
              value={config.maxSpeed}
              min={200}
              max={800}
              step={10}
              unit="px/s"
              onChange={(val) => config.updateConfig({ maxSpeed: val })}
            />

            <SliderControl
              label="Acceleration"
              value={config.acceleration}
              min={150}
              max={900}
              step={10}
              unit="px/s²"
              onChange={(val) => config.updateConfig({ acceleration: val })}
            />

            <SliderControl
              label="Braking Power"
              value={config.braking}
              min={200}
              max={1000}
              step={20}
              unit="px/s²"
              onChange={(val) => config.updateConfig({ braking: val })}
            />

            <SliderControl
              label="Drift Factor (Lateral Grip)"
              value={config.driftFactor}
              min={0.82}
              max={0.98}
              step={0.005}
              unit=""
              onChange={(val) => config.updateConfig({ driftFactor: val })}
            />

            <SliderControl
              label="Steering Turn Rate"
              value={config.steerRate}
              min={1.5}
              max={7.0}
              step={0.1}
              unit="rad/s"
              onChange={(val) => config.updateConfig({ steerRate: val })}
            />
          </div>

          {/* Section: Visuals */}
          <div
            className="ui-card-inset"
            style={{
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
              <Sparkles size={16} />
              <span style={{ fontSize: '13px', fontFamily: 'var(--theme-font-body)', fontWeight: 800, color: '#0f172a' }}>
                Visual Debugging
              </span>
            </div>

            <ToggleControl
              label="Show Push Tether & Gizmo"
              checked={config.showTouchGizmo}
              onChange={(v) => config.updateConfig({ showTouchGizmo: v })}
            />
            <ToggleControl
              label="Show Physics Vectors"
              checked={config.showDebugVectors}
              onChange={(v) => config.updateConfig({ showDebugVectors: v })}
            />
            <ToggleControl
              label="Show Tire Skid Marks"
              checked={config.showTireTracks}
              onChange={(v) => config.updateConfig({ showTireTracks: v })}
            />
          </div>

          {/* Reset All */}
          <button
            onClick={() => config.resetToDefault()}
            className="btn-chunky btn-chunky-coral"
            style={{
              marginTop: 'auto',
              padding: '12px',
              fontSize: '13px',
              width: '100%'
            }}
          >
            <RefreshCw size={15} />
            <span>Reset All Parameters</span>
          </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
}

const SliderControl: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        fontFamily: 'var(--theme-font-body)'
      }}
    >
      <span style={{ color: '#475569', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--theme-font-mono)', fontWeight: 700, color: '#0f172a' }}>
        {value} {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ accentColor: '#0284c7', width: '100%', cursor: 'pointer' }}
    />
  </div>
);

const ToggleControl: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label,
  checked,
  onChange
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      fontFamily: 'var(--theme-font-body)'
    }}
  >
    <span style={{ color: '#475569', fontWeight: 600 }}>{label}</span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ accentColor: '#0284c7', width: '16px', height: '16px', cursor: 'pointer' }}
    />
  </div>
);
