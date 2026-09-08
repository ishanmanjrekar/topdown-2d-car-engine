import React, { useEffect, useRef } from 'react';
import { CarPreset } from '../carPresets';

interface CarPreviewProps {
  car: CarPreset;
  width?: number;
  height?: number;
}

export const CarPreview: React.FC<CarPreviewProps> = ({
  car,
  width = 200,
  height = 130
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const length = 76;
    const carWidth = 38;
    const halfL = length / 2;
    const halfW = carWidth / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    // 1. Neon Underglow
    const glowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 55);
    glowGrad.addColorStop(0, car.visuals.underglowColor);
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Chassis Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(-halfL + 3, -halfW + 4, length, carWidth, 8);
    ctx.fill();

    // 3. Wheels
    ctx.fillStyle = '#1e293b';
    const wheelL = 18;
    const wheelW = 8;
    const wheelXFront = 25;
    const wheelXRear = -25;
    const wheelY = halfW + 1;

    // Front Left & Right
    ctx.fillRect(wheelXFront - wheelL / 2, -wheelY - wheelW / 2, wheelL, wheelW);
    ctx.fillRect(wheelXFront - wheelL / 2, wheelY - wheelW / 2, wheelL, wheelW);
    // Rear Left & Right
    ctx.fillRect(wheelXRear - wheelL / 2, -wheelY - wheelW / 2, wheelL, wheelW);
    ctx.fillRect(wheelXRear - wheelL / 2, wheelY - wheelW / 2, wheelL, wheelW);

    // Wheel rims
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(wheelXFront - 1, -wheelY - wheelW / 2 + 1, 2, wheelW - 2);
    ctx.fillRect(wheelXFront - 1, wheelY - wheelW / 2 + 1, 2, wheelW - 2);
    ctx.fillRect(wheelXRear - 1, -wheelY - wheelW / 2 + 1, 2, wheelW - 2);
    ctx.fillRect(wheelXRear - 1, wheelY - wheelW / 2 + 1, 2, wheelW - 2);

    // 4. Main Body Shell
    ctx.fillStyle = car.visuals.primaryColor;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, length, carWidth, 10);
    ctx.fill();

    // Subtle edge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Racing Stripe (if enabled)
    if (car.visuals.stripe) {
      ctx.fillStyle = car.visuals.accentColor;
      ctx.fillRect(-halfL, -4, length, 8);
    }

    // 6. Cockpit Canopy / Roof
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-halfL + 16, -halfW + 5, length - 32, carWidth - 10, 6);
    ctx.fill();

    // 7. Windshield (Front)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(halfL - 32, -halfW + 7, 9, carWidth - 14, 3);
    ctx.fill();

    // 8. Rear Window
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-halfL + 18, -halfW + 7, 7, carWidth - 14, 2);
    ctx.fill();

    // 9. Side Windows
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(-halfL + 27, -halfW + 5, 12, 2);
    ctx.fillRect(-halfL + 27, halfW - 7, 12, 2);

    // 10. Headlights (amber/yellow glow)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(halfL - 4, -halfW + 3, 4, 7);
    ctx.fillRect(halfL - 4, halfW - 10, 4, 7);

    // Atmospheric headlight cone
    const headGrad = ctx.createRadialGradient(halfL + 6, 0, 4, halfL + 60, 0, 70);
    headGrad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
    headGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(halfL, -halfW + 3);
    ctx.lineTo(halfL + 55, -halfW - 20);
    ctx.lineTo(halfL + 55, halfW + 20);
    ctx.lineTo(halfL, halfW - 3);
    ctx.closePath();
    ctx.fill();

    // 11. Taillights (ruby red)
    ctx.fillStyle = '#ff0033';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 8;
    ctx.fillRect(-halfL, -halfW + 4, 3, 7);
    ctx.fillRect(-halfL, halfW - 11, 3, 7);
    ctx.shadowBlur = 0;

    // 12. Spoilers & Wings
    if (car.visuals.spoilerType === 'gt-wing') {
      // Large track GT wing with carbon fiber endplates
      ctx.fillStyle = '#020617';
      ctx.fillRect(-halfL - 5, -halfW - 3, 6, carWidth + 6);
      // Wing stands
      ctx.fillStyle = '#475569';
      ctx.fillRect(-halfL - 2, -halfW + 6, 4, 3);
      ctx.fillRect(-halfL - 2, halfW - 9, 4, 3);
      // Accent lip
      ctx.fillStyle = car.visuals.primaryColor;
      ctx.fillRect(-halfL - 5, -halfW - 3, 2, carWidth + 6);
    } else if (car.visuals.spoilerType === 'dual-fin') {
      // Tuner dual fins
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfL - 4, -halfW + 2, 5, 8);
      ctx.fillRect(-halfL - 4, halfW - 10, 5, 8);
    } else if (car.visuals.spoilerType === 'ducktail') {
      // Smooth molded ducktail
      ctx.fillStyle = car.visuals.primaryColor;
      ctx.fillRect(-halfL - 3, -halfW + 5, 3, carWidth - 10);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(-halfL - 3, -halfW + 5, 1, carWidth - 10);
    }

    ctx.restore();
  }, [car, width, height]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'block'
        }}
      />
    </div>
  );
};
