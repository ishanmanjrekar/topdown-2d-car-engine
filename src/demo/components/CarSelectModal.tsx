import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useCarConfigStore } from '../../stores/useCarConfigStore';
import { CAR_PRESETS, CarPreset, applyCarPreset } from '../carPresets';
import { CarPreview } from './CarPreview';
import { X, ChevronLeft, ChevronRight, Gauge, Zap, Compass, Check } from 'lucide-react';

function getContrastInfo(hexColor: string) {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  const textColor = luminance >= 140 ? '#090d16' : '#ffffff';
  const shadowR = Math.max(0, Math.floor(r * 0.65));
  const shadowG = Math.max(0, Math.floor(g * 0.65));
  const shadowB = Math.max(0, Math.floor(b * 0.65));
  const shadowColor = `rgb(${shadowR}, ${shadowG}, ${shadowB})`;
  const borderColor = luminance >= 140 ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.4)';
  return { textColor, shadowColor, borderColor };
}

export const CarSelectModal: React.FC = () => {
  const { carSelectOpen, setCarSelectOpen } = useGameStore();
  const currentPresetId = useCarConfigStore((s) => s.presetId);

  // Default to currently loaded preset or first car
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    if (carSelectOpen) {
      const idx = CAR_PRESETS.findIndex((p) => p.id === currentPresetId);
      if (idx !== -1) setSelectedIndex(idx);
    }
  }, [carSelectOpen, currentPresetId]);

  // Keyboard navigation
  useEffect(() => {
    if (!carSelectOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCarSelectOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : CAR_PRESETS.length - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev < CAR_PRESETS.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        handleDrive();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carSelectOpen, selectedIndex]);

  if (!carSelectOpen) return null;

  const activeCar: CarPreset = CAR_PRESETS[selectedIndex];
  const isCurrentlyEquipped = (currentPresetId || 'apex-gt') === activeCar.id;

  const handleDrive = () => {
    applyCarPreset(activeCar.id);
    setCarSelectOpen(false);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : CAR_PRESETS.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < CAR_PRESETS.length - 1 ? prev + 1 : 0));
  };

  const contrast = getContrastInfo(activeCar.visuals.primaryColor);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={() => setCarSelectOpen(false)}
    >
      {/* Option A Bright Frosted Modal Container */}
      <div
        className="ui-modal-sheet"
        style={{
          width: '100%',
          maxWidth: '430px',
          maxHeight: '94%',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: `0 24px 65px rgba(0, 0, 0, 0.25), 0 0 35px ${activeCar.visuals.primaryColor}33`,
          border: '2px solid #ffffff',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--theme-font-body)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '1.5px',
                textTransform: 'uppercase'
              }}
            >
              Vehicle Showroom
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '26px',
                fontFamily: 'var(--theme-font-display)',
                letterSpacing: '0.6px',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {activeCar.name}
            </h2>
          </div>

          <button
            onClick={() => setCarSelectOpen(false)}
            className="btn-chunky btn-chunky-light btn-chunky-circle"
            title="Close"
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} color="#0f172a" />
          </button>
        </div>

        {/* Car Badge & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                background: activeCar.visuals.primaryColor,
                color: contrast.textColor,
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--theme-font-body)',
                padding: '4px 10px',
                borderRadius: '8px',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                boxShadow: `0 2px 0 ${contrast.shadowColor}`,
                textShadow: contrast.textColor === '#ffffff' ? '0 1px 2px rgba(0, 0, 0, 0.4)' : 'none',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              {activeCar.badge}
            </span>
            <span
              style={{
                fontFamily: 'var(--theme-font-body)',
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569'
              }}
            >
              {activeCar.archetype}
            </span>
          </div>

          <p
            style={{
              margin: '4px 0 0 0',
              fontFamily: 'var(--theme-font-body)',
              fontSize: '12px',
              color: '#334155',
              lineHeight: 1.45
            }}
          >
            {activeCar.description}
          </p>
        </div>

        {/* Carousel & Visual Car Showcase Spotlight Podium */}
        <div
          className="ui-card-inset"
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '20px',
            border: '2px solid #ffffff',
            padding: '14px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '140px',
            boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous car"
            className="btn-chunky btn-chunky-light btn-chunky-circle"
            style={{
              position: 'absolute',
              left: '12px',
              zIndex: 2,
              width: '38px',
              height: '38px'
            }}
          >
            <ChevronLeft size={20} color="#0f172a" />
          </button>

          {/* Interactive 2D Top-Down Car Preview Vector */}
          <CarPreview
            car={activeCar}
            width={180}
            height={135}
          />

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            aria-label="Next car"
            className="btn-chunky btn-chunky-light btn-chunky-circle"
            style={{
              position: 'absolute',
              right: '12px',
              zIndex: 2,
              width: '38px',
              height: '38px'
            }}
          >
            <ChevronRight size={20} color="#0f172a" />
          </button>
        </div>

        {/* Preset Selector Dots / Thumbnails */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            margin: '2px 0'
          }}
        >
          {CAR_PRESETS.map((car, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={car.id}
                onClick={() => setSelectedIndex(idx)}
                style={{
                  height: '8px',
                  width: isSelected ? '28px' : '8px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? car.visuals.primaryColor : 'rgba(15, 23, 42, 0.18)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: isSelected ? `0 2px 6px ${car.visuals.primaryColor}88` : 'none'
                }}
                title={car.name}
              />
            );
          })}
        </div>

        {/* Stats Ratings (Clean Inset Tablet) */}
        <div
          className="ui-card-inset"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '18px',
            padding: '14px 16px',
            border: '1.5px solid #ffffff',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Speed */}
          <StatBar
            label="SPEED"
            rating={activeCar.ratings.speed}
            icon={<Gauge size={15} color="#0284c7" />}
            color="#0284c7"
          />

          {/* Acceleration */}
          <StatBar
            label="ACCELERATION"
            rating={activeCar.ratings.acceleration}
            icon={<Zap size={15} color="#f59e0b" />}
            color="#f59e0b"
          />

          {/* Handling (governs braking) */}
          <StatBar
            label="HANDLING & BRAKES"
            rating={activeCar.ratings.handling}
            icon={<Compass size={15} color="#10b981" />}
            color="#10b981"
          />

          <div
            style={{
              fontSize: '11px',
              fontFamily: 'var(--theme-font-body)',
              color: '#64748b',
              lineHeight: 1.35,
              marginTop: '2px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              paddingTop: '8px'
            }}
          >
            * Handling directly governs cornering grip, steering authority, and active braking deceleration.
          </div>
        </div>

        {/* Action Button: CHUNKY DRIVE BUTTON */}
        <button
          onClick={handleDrive}
          className="btn-chunky btn-chunky-lg"
          style={{
            marginTop: '8px',
            background: activeCar.visuals.primaryColor,
            color: contrast.textColor,
            borderColor: contrast.borderColor,
            boxShadow: `0 var(--theme-btn-bevel) 0 ${contrast.shadowColor}, 0 10px 24px ${activeCar.visuals.primaryColor}55`,
            textShadow: contrast.textColor === '#ffffff' ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none',
            width: '100%'
          }}
        >
          {isCurrentlyEquipped ? (
            <>
              <Check size={20} color={contrast.textColor} /> CURRENT VEHICLE • DRIVE
            </>
          ) : (
            <>SELECT & DRIVE 🏁</>
          )}
        </button>
      </div>
    </div>
  );
};

interface StatBarProps {
  label: string;
  rating: number; // 1 to 5
  icon: React.ReactNode;
  color: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, rating, icon, color }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--theme-font-body)',
          fontSize: '11.5px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 700 }}>
          {icon}
          {label}
        </span>
        <span style={{ color, fontFamily: 'var(--theme-font-action)', fontSize: '13.5px', letterSpacing: '0.5px' }}>
          {rating} / 5
        </span>
      </div>

      {/* 5 Segmented Chunky Bars */}
      <div style={{ display: 'flex', gap: '6px', width: '100%', height: '9px' }}>
        {[1, 2, 3, 4, 5].map((seg) => {
          const isFilled = seg <= rating;
          return (
            <div
              key={seg}
              style={{
                flex: 1,
                borderRadius: '4px',
                backgroundColor: isFilled ? color : '#e2e8f0',
                boxShadow: isFilled ? `0 2px 0 rgba(0, 0, 0, 0.15), 0 0 6px ${color}44` : 'none',
                transition: 'background-color 0.2s ease'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
