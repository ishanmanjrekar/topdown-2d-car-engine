import React, { useLayoutEffect, useRef, useState } from 'react';

interface GameLayerProps {
  width: number;
  height: number;
  children: React.ReactNode;
}

export const BoundingBox: React.FC<GameLayerProps> = ({ width, height, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useLayoutEffect(() => {
    // Detect if running inside the Capacitor native WebView shell
    const checkCapacitor = typeof window !== 'undefined' && ('Capacitor' in window || (window as any).Capacitor !== undefined);
    setIsCapacitor(checkCapacitor);

    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current.parentElement || document.body;

        // On mobile itch.io, the iframe may be wider/taller than the physical screen.
        // screen.width/height give the actual device dimensions in CSS pixels,
        // so we clamp the available space to what the device can actually show.
        const availW = Math.min(clientWidth || window.innerWidth, window.screen.width);
        const availH = Math.min(clientHeight || window.innerHeight, window.screen.height);

        if (checkCapacitor) {
          // Native Android APK: 100% fluid full-screen borderless layout
          setScale(1);
        } else {
          // Standard Web/Itch.io: EXACT original scaling logic to prevent any regression
          const scaleX = availW / width;
          const scaleY = availH / height;
          setScale(Math.min(scaleX, scaleY));
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.screen.orientation?.addEventListener('change', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.screen.orientation?.removeEventListener('change', handleResize);
    };
  }, [width, height]);

  // Capacitor runs borderless and fluid; Web uses simulated phone sizing
  const innerStyle: React.CSSProperties = isCapacitor
    ? {
        width: '100%',
        height: '100%',
        position: 'relative',
      }
    : {
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative',
      };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--bg-dark, #090a0f)'
      }}
    >
      <div style={innerStyle}>
        {children}
      </div>
    </div>
  );
};

