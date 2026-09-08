import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useCarConfigStore } from '../../stores/useCarConfigStore';
import { CAR_PRESETS, CarPreset, applyCarPreset } from '../carPresets';
import { CarPreview } from './CarPreview';
import { X, ChevronLeft, ChevronRight, Gauge, Zap, Compass, Check } from 'lucide-react';

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

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={() => setCarSelectOpen(false)}
    >
      {/* Modal Container */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '430px',
          maxHeight: '94%',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: `0 0 35px ${activeCar.visuals.primaryColor}33`,
          border: `1px solid ${activeCar.visuals.primaryColor}55`,
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
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase'
              }}
            >
              Vehicle Showroom
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '22px',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                color: '#ffffff',
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
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Car Badge & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                background: `${activeCar.visuals.primaryColor}25`,
                border: `1px solid ${activeCar.visuals.primaryColor}`,
                color: activeCar.visuals.primaryColor,
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: '0.8px'
              }}
            >
              {activeCar.badge}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}
            >
              {activeCar.archetype}
            </span>
          </div>

          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}
          >
            {activeCar.description}
          </p>
        </div>

        {/* Carousel & Visual Car Showcase */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(2, 6, 23, 0.8) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '135px'
          }}
        >
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous car"
            style={{
              position: 'absolute',
              left: '8px',
              zIndex: 2,
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Car Preview Canvas */}
          <CarPreview car={activeCar} width={220} height={130} />

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            aria-label="Next car"
            style={{
              position: 'absolute',
              right: '8px',
              zIndex: 2,
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <ChevronRight size={20} />
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
                  backgroundColor: isSelected ? car.visuals.primaryColor : 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
                title={car.name}
              />
            );
          })}
        </div>

        {/* Stats Ratings (Rated 1 to 5) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          {/* Speed */}
          <StatBar
            label="SPEED"
            rating={activeCar.ratings.speed}
            icon={<Gauge size={14} color="#00f2fe" />}
            color="#00f2fe"
          />

          {/* Acceleration */}
          <StatBar
            label="ACCELERATION"
            rating={activeCar.ratings.acceleration}
            icon={<Zap size={14} color="#ffaa00" />}
            color="#ffaa00"
          />

          {/* Handling (governs braking) */}
          <StatBar
            label="HANDLING & BRAKES"
            rating={activeCar.ratings.handling}
            icon={<Compass size={14} color="#39ff14" />}
            color="#39ff14"
          />

          <div
            style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              lineHeight: 1.3,
              marginTop: '2px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '6px'
            }}
          >
            * Handling directly governs cornering grip, steering authority, and active braking deceleration.
          </div>
        </div>

        {/* Action Button: DRIVE */}
        <button
          onClick={handleDrive}
          style={{
            marginTop: '4px',
            padding: '14px 20px',
            borderRadius: '14px',
            border: 'none',
            background: `linear-gradient(135deg, ${activeCar.visuals.primaryColor}, #0284c7)`,
            color: '#ffffff',
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: `0 0 20px ${activeCar.visuals.primaryColor}66`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isCurrentlyEquipped ? (
            <>
              <Check size={18} /> CURRENT VEHICLE • DRIVE
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
          fontFamily: 'var(--font-mono)',
          fontSize: '11px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontWeight: 600 }}>
          {icon}
          {label}
        </span>
        <span style={{ color, fontWeight: 700 }}>{rating} / 5</span>
      </div>

      {/* 5 Segmented Bars */}
      <div style={{ display: 'flex', gap: '5px', width: '100%', height: '8px' }}>
        {[1, 2, 3, 4, 5].map((seg) => {
          const isFilled = seg <= rating;
          return (
            <div
              key={seg}
              style={{
                flex: 1,
                borderRadius: '3px',
                backgroundColor: isFilled ? color : 'rgba(255, 255, 255, 0.1)',
                boxShadow: isFilled ? `0 0 8px ${color}88` : 'none',
                transition: 'background-color 0.25s ease'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
