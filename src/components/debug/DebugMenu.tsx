import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, RefreshCw, Zap, Shield, Sparkles } from 'lucide-react';
import { useCarConfigStore, PresetName } from '../../stores/useCarConfigStore';
import { useGameStore } from '../../stores/useGameStore';

export const DebugMenu: React.FC = () => {
  const { debugMenuOpen, setDebugMenuOpen, controlMode, setControlMode } = useGameStore();
  const config = useCarConfigStore();

  if (!debugMenuOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 7, 12, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <motion.div
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '400px',
            height: '100%',
            overflowY: 'auto',
            padding: '24px',
            boxSizing: 'border-box',
            borderLeft: '1px solid var(--border-active)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="var(--accent-cyan)" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>
                CAR SETUP & TUNING
              </h2>
            </div>
            <button
              onClick={() => setDebugMenuOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Preset Buttons */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Vehicle Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {(['smash-cops', 'street-drift', 'track-grip', 'heavy-muscle'] as PresetName[]).map((p) => (
                <button
                  key={p}
                  onClick={() => config.loadPreset(p)}
                  className="glass-pill"
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {p.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Control Mode */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Control Scheme
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setControlMode('rear-touch')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: controlMode === 'rear-touch' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)',
                  color: controlMode === 'rear-touch' ? '#000000' : '#ffffff',
                  border: 'none'
                }}
              >
                Rear-Touch (Smash Cops)
              </button>
              <button
                onClick={() => setControlMode('keyboard')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: controlMode === 'keyboard' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)',
                  color: controlMode === 'keyboard' ? '#000000' : '#ffffff',
                  border: 'none'
                }}
              >
                Keyboard (WASD/Arrows)
              </button>
            </div>
          </div>

          {/* Section: Smash Cops Rear-Touch Steering */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
              <Zap size={16} />
              <span style={{ fontSize: '13px', fontWeight: 800 }}>Rear-Touch Push Tuning</span>
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
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Invert Steering Push</span>
              <input
                type="checkbox"
                checked={config.invertSteer}
                onChange={(e) => config.updateConfig({ invertSteer: e.target.checked })}
              />
            </div>
          </div>

          {/* Section: Vehicle Dynamics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-orange)' }}>
              <Shield size={16} />
              <span style={{ fontSize: '13px', fontWeight: 800 }}>Physics &amp; Handling</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-neon)' }}>
              <Sparkles size={16} />
              <span style={{ fontSize: '13px', fontWeight: 800 }}>Visual Debugging</span>
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
            className="glass-pill"
            style={{
              marginTop: 'auto',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} /> Reset All Parameters
          </button>
        </motion.div>
      </motion.div>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
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
      style={{ accentColor: 'var(--accent-cyan)', width: '100%' }}
    />
  </div>
);

const ToggleControl: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label,
  checked,
  onChange
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </div>
);
