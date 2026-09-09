import { CarPhysics } from '../CarPhysics';
import { CarPhysicsConfig } from '../../stores/useCarConfigStore';

/**
 * Renders stylized vehicle chassis with wheels, windows, headlights & brake glow
 */
export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: CarPhysics,
  config: CarPhysicsConfig,
  throttle: number
): void {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  const length = car.length;
  const width = car.width;
  const halfL = length / 2;
  const halfW = width / 2;

  // 1. Soft Dynamic Drop Shadow & Optional Underglow
  if (config.underglowColor) {
    ctx.save();
    const glowGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 48);
    glowGrad.addColorStop(0, config.underglowColor);
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 46, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-halfL + 4, -halfW + 5, length, width, 8);
  ctx.fill();

  // 2. Wheels
  ctx.fillStyle = '#1e293b';
  const wheelL = 16;
  const wheelW = 7;
  const wheelXFront = car.wheelBase / 2;
  const wheelXRear = -car.wheelBase / 2;
  const wheelYOffset = car.trackWidth / 2;

  // Front Left Wheel (Steered)
  ctx.save();
  ctx.translate(wheelXFront, -wheelYOffset);
  ctx.rotate(car.frontWheelSteerAngle);
  ctx.fillRect(-wheelL / 2, -wheelW / 2, wheelL, wheelW);
  ctx.restore();

  // Front Right Wheel (Steered)
  ctx.save();
  ctx.translate(wheelXFront, wheelYOffset);
  ctx.rotate(car.frontWheelSteerAngle);
  ctx.fillRect(-wheelL / 2, -wheelW / 2, wheelL, wheelW);
  ctx.restore();

  // Rear Left Wheel
  ctx.fillRect(wheelXRear - wheelL / 2, -wheelYOffset - wheelW / 2, wheelL, wheelW);
  // Rear Right Wheel
  ctx.fillRect(wheelXRear - wheelL / 2, wheelYOffset - wheelW / 2, wheelL, wheelW);

  // 3. Car Main Body Shell
  ctx.fillStyle = config.carColor;
  ctx.beginPath();
  ctx.roundRect(-halfL, -halfW, length, width, 10);
  ctx.fill();

  // Optional racing stripe
  if (config.stripe && config.accentColor) {
    ctx.fillStyle = config.accentColor;
    ctx.fillRect(-halfL, -3.5, length, 7);
  }

  // Dark roof/cockpit
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-halfL + 12, -halfW + 4, length - 26, width - 8, 6);
  ctx.fill();

  // Windshield (Front)
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.roundRect(halfL - 26, -halfW + 5, 8, width - 10, 3);
  ctx.fill();

  // Rear Window
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(-halfL + 14, -halfW + 5, 6, width - 10, 2);
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(halfL - 4, -halfW + 2, 4, 6);
  ctx.fillRect(halfL - 4, halfW - 8, 4, 6);

  // Brake / Taillights
  const isBraking = throttle < 0 || (car.speed > 30 && throttle === 0);
  ctx.fillStyle = isBraking ? '#ff0033' : '#7f1d1d';
  ctx.fillRect(-halfL, -halfW + 3, 3, 6);
  ctx.fillRect(-halfL, halfW - 9, 3, 6);

  // Taillight glow on braking
  if (isBraking) {
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 12;
    ctx.fillRect(-halfL - 2, -halfW + 3, 2, 6);
    ctx.fillRect(-halfL - 2, halfW - 9, 2, 6);
    ctx.shadowBlur = 0;
  }

  // Spoilers & Rear Aero Wings
  if (config.spoilerType === 'gt-wing') {
    ctx.fillStyle = '#020617';
    ctx.fillRect(-halfL - 4, -halfW - 2, 5, width + 4);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-halfL - 2, -halfW + 5, 3, 2.5);
    ctx.fillRect(-halfL - 2, halfW - 7.5, 3, 2.5);
    ctx.fillStyle = config.carColor;
    ctx.fillRect(-halfL - 4, -halfW - 2, 1.5, width + 4);
  } else if (config.spoilerType === 'dual-fin') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfL - 3, -halfW + 2, 4, 6);
    ctx.fillRect(-halfL - 3, halfW - 8, 4, 6);
  } else if (config.spoilerType === 'ducktail') {
    ctx.fillStyle = config.carColor;
    ctx.fillRect(-halfL - 2, -halfW + 4, 2.5, width - 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(-halfL - 2, -halfW + 4, 1, width - 8);
  }

  // Front Headlight Beam (Atmospheric light cone)
  ctx.save();
  const grad = ctx.createRadialGradient(halfL + 10, 0, 5, halfL + 90, 0, 100);
  grad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
  grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(halfL, -halfW + 2);
  ctx.lineTo(halfL + 130, -halfW - 35);
  ctx.lineTo(halfL + 130, halfW + 35);
  ctx.lineTo(halfL, halfW - 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
