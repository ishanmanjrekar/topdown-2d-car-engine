import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useCarConfigStore } from '../../stores/useCarConfigStore';
import { Gauge, Settings2, RotateCcw, Flame } from 'lucide-react';

export const TelemetryHUD: React.FC = () => {
  const { telemetry, toggleDebugMenu } = useGameStore();
  const { carColor } = useCarConfigStore();

  const handleReset = () => {
    if (typeof (window as any).__resetCarEngine === 'function') {
      (window as any).__resetCarEngine();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px 14px',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%',
          gap: '8px'
        }}
      >
        {/* Speedometer & Primary Telemetry */}
        <div
          className="glass-panel"
          style={{
            padding: '10px 14px',
            borderRadius: '14px',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '32px',
                fontWeight: 900,
                lineHeight: 1,
                color: '#ffffff',
                textShadow: `0 0 16px ${carColor}88`
              }}
            >
              {telemetry.speedKmh}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase'
              }}
            >
              KM/H
            </span>
            {telemetry.isDrifting && (
              <span
                style={{
                  marginLeft: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'rgba(255, 126, 64, 0.25)',
                  border: '1px solid #ff7e40',
                  color: '#ff7e40',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 800
                }}
              >
                <Flame size={12} /> DRIFT
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)'
            }}
          >
            <span>SLIP: <b style={{ color: telemetry.slipAngle > 15 ? '#ff7e40' : '#ffffff' }}>{telemetry.slipAngle}°</b></span>
            <span>G: <b style={{ color: '#ffffff' }}>{telemetry.lateralG}G</b></span>
            <span>FPS: <b style={{ color: 'var(--accent-neon)' }}>{telemetry.fps}</b></span>
          </div>
        </div>

        {/* Action Controls (Reset, Tune) */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto', flexShrink: 0 }}>
          <button
            onClick={handleReset}
            className="glass-panel"
            title="Reset Vehicle (R)"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={toggleDebugMenu}
            className="glass-panel"
            title="Car Setup & Debug Menu"
            style={{
              padding: '0 12px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--accent-cyan)',
              background: 'rgba(0, 242, 254, 0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px'
            }}
          >
            <Settings2 size={16} color="var(--accent-cyan)" />
            <span>TUNING</span>
          </button>
        </div>
      </div>

      {/* Touch Control Hint at the Bottom */}
      <div
        style={{
          marginTop: 'auto',
          alignSelf: 'center',
          pointerEvents: 'none',
          marginBottom: '20px'
        }}
      >
        <div
          className="glass-pill"
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Gauge size={13} color="var(--accent-cyan)" />
          <span><b>Rear-Touch:</b> Drag behind car to push &amp; steer</span>
        </div>
      </div>
    </div>
  );
};
