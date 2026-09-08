import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores/useGameStore';

export const SplashScreen: React.FC = () => {
  const isGameStarted = useGameStore((s) => s.isGameStarted);
  const startGame = useGameStore((s) => s.startGame);

  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Simulated engine asset/physics loader (smooth natural progression)
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      // Fast start, slight pause around 70%, then quick finish
      const increment = current < 60 ? 4 : current < 85 ? 2.5 : 5;
      current = Math.min(100, current + increment);
      setProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoaded(true);
        }, 150);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const handleStart = useCallback(() => {
    if (!isLoaded || isExiting || isDismissed) return;
    setIsExiting(true);
    setTimeout(() => {
      startGame();
      setIsDismissed(true);
    }, 450);
  }, [isLoaded, isExiting, isDismissed, startGame]);

  // Keyboard shortcut (Space / Enter) for desktop players
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStart]);

  if (isDismissed || isGameStarted) {
    return null;
  }

  return (
    <div
      onClick={handleStart}
      onTouchStart={handleStart}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 100,
        backgroundImage: 'url(/splash.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isExiting ? 'none' : 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
        cursor: isLoaded ? 'pointer' : 'default'
      }}
    >
      <style>{`
        @keyframes pulsePrompt {
          0% {
            transform: scale(0.97);
            opacity: 0.85;
            text-shadow: 0 0 10px rgba(255, 170, 0, 0.7), 0 0 20px rgba(255, 80, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
            text-shadow: 0 0 16px rgba(255, 200, 0, 0.95), 0 0 30px rgba(255, 100, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.9);
          }
          100% {
            transform: scale(0.97);
            opacity: 0.85;
            text-shadow: 0 0 10px rgba(255, 170, 0, 0.7), 0 0 20px rgba(255, 80, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);
          }
        }
        @keyframes shimmerGlow {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Interactive Controls Overlay positioned precisely below the "Sandbox Car Engine" text */}
      <div
        style={{
          position: 'absolute',
          top: '49.5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '82%',
          maxWidth: '310px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Progress status & percentage */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: '6px',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: '#ffe099',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)',
            textTransform: 'uppercase'
          }}
        >
          <span>{isLoaded ? 'ENGINE INITIALIZED' : 'LOADING ENGINE...'}</span>
          <span>{Math.floor(progress)}%</span>
        </div>

        {/* Loading Bar Track */}
        <div
          style={{
            width: '100%',
            height: '12px',
            borderRadius: '999px',
            backgroundColor: 'rgba(10, 14, 22, 0.85)',
            border: '1.5px solid rgba(255, 170, 40, 0.55)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7), inset 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 12px rgba(255, 120, 0, 0.25)',
            overflow: 'hidden',
            padding: '2px',
            boxSizing: 'border-box',
            position: 'relative'
          }}
        >
          {/* Animated Fill Bar */}
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #ff4500 0%, #ff8c00 50%, #ffd000 100%)',
              boxShadow: '0 0 12px rgba(255, 150, 0, 0.8)',
              transition: 'width 0.08s ease-out'
            }}
          />
        </div>

        {/* Tap to Continue Prompt */}
        <div
          style={{
            marginTop: '16px',
            minHeight: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isLoaded ? (
            <div
              style={{
                animation: 'pulsePrompt 1.4s ease-in-out infinite',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  fontFamily: '"Lilita One", "Outfit", sans-serif',
                  fontSize: '22px',
                  color: '#ffffff',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase'
                }}
              >
                TAP TO CONTINUE
              </div>
            </div>
          ) : (
            <div
              style={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase'
              }}
            >
              PLEASE WAIT...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
