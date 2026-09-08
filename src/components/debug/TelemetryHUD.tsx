import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useCarConfigStore } from '../../stores/useCarConfigStore';
import { Gauge, Settings2, RotateCcw, Flame, Car } from 'lucide-react';

/**
 * Calculates contrasting text and 3D bevel shadow based on background luminance.
 * Fixes low-contrast issues when car colors are bright (cyan, yellow, light green).
 */
function getContrastInfo(hexColor: string) {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;

  // Perceived luminance (ITU-R BT.709)
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  const isLight = luminance >= 140;

  const textColor = isLight ? '#090d16' : '#ffffff';
  const shadowR = Math.max(0, Math.floor(r * 0.65));
  const shadowG = Math.max(0, Math.floor(g * 0.65));
  const shadowB = Math.max(0, Math.floor(b * 0.65));
  const shadowColor = `rgb(${shadowR}, ${shadowG}, ${shadowB})`;
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.4)';

  return { textColor, shadowColor, borderColor, isLight };
}

export const TelemetryHUD: React.FC = () => {
  const { telemetry, toggleDebugMenu, setCarSelectOpen } = useGameStore();
  const { carColor } = useCarConfigStore();

  const handleReset = () => {
    if (typeof (window as any).__resetCarEngine === 'function') {
      (window as any).__resetCarEngine();
    }
  };

  const contrast = getContrastInfo(carColor);

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
        padding: '16px 16px',
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
          gap: '10px'
        }}
      >
        {/* Left Column: Speedometer & Choose Car */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'auto' }}>
          {/* Speedometer & Primary Telemetry in Standout Light Mode */}
          <div className="ui-speedo-card">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="ui-speedo-val">
                {telemetry.speedKmh}
              </span>
              <span className="ui-speedo-unit">KM/H</span>

              {telemetry.isDrifting && (
                <span className="ui-badge-drift" style={{ marginLeft: '4px' }}>
                  <Flame size={13} /> DRIFT
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                fontSize: '11px',
                marginTop: '2px'
              }}
            >
              <span className="ui-stat-label">
                SLIP <b className="ui-stat-value" style={{ color: telemetry.slipAngle > 15 ? 'var(--color-coral)' : '#0f172a' }}>{telemetry.slipAngle}°</b>
              </span>
              <span className="ui-stat-label">
                G <b className="ui-stat-value">{telemetry.lateralG}G</b>
              </span>
              <span className="ui-stat-label">
                FPS <b className="ui-stat-value" style={{ color: 'var(--color-mint)' }}>{telemetry.fps}</b>
              </span>
            </div>
          </div>

          {/* Bigger, Chunky Choose Car Button with High-Contrast Text & 3D Bevel */}
          <button
            onClick={() => setCarSelectOpen(true)}
            className="btn-chunky btn-chunky-md"
            title="Choose Vehicle (C)"
            style={{
              background: carColor,
              color: contrast.textColor,
              borderColor: contrast.borderColor,
              boxShadow: `0 4px 0 ${contrast.shadowColor}, 0 8px 18px rgba(0, 0, 0, 0.3)`,
              width: 'fit-content'
            }}
          >
            <Car size={18} color={contrast.textColor} />
            <span>Choose Car</span>
          </button>
        </div>

        {/* Action Controls (Reset, Tune) */}
        <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto', flexShrink: 0 }}>
          <button
            onClick={handleReset}
            className="btn-chunky btn-chunky-ghost btn-chunky-icon"
            style={{ width: '46px', height: '46px' }}
            title="Reset Vehicle (R)"
          >
            <RotateCcw size={19} />
          </button>

          <button
            onClick={toggleDebugMenu}
            className="btn-chunky btn-chunky-sky"
            title="Car Setup & Debug Menu"
            style={{
              height: '46px',
              padding: '0 16px',
              fontSize: '14px',
              gap: '8px'
            }}
          >
            <Settings2 size={18} />
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
          marginBottom: '16px'
        }}
      >
        <div className="ui-guidance-pill">
          <Gauge size={15} color="var(--color-sky)" />
          <span><b>Rear-Touch:</b> Drag behind car to push &amp; steer</span>
        </div>
      </div>
    </div>
  );
};
