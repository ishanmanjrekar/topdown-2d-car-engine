import { CarPhysics } from '../CarPhysics';

/**
 * Draws real-time physics vectors (velocity, heading, lateral slip)
 */
export function drawDebugVectors(ctx: CanvasRenderingContext2D, car: CarPhysics): void {
  ctx.save();
  // 1. Heading Vector (Cyan)
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(car.x, car.y);
  ctx.lineTo(car.x + Math.cos(car.angle) * 50, car.y + Math.sin(car.angle) * 50);
  ctx.stroke();

  // 2. Velocity Vector (Green / Yellow)
  if (car.speed > 5) {
    ctx.strokeStyle = car.isDrifting ? '#ff7e40' : '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(car.x, car.y);
    ctx.lineTo(car.x + car.vx * 0.25, car.y + car.vy * 0.25);
    ctx.stroke();
  }

  ctx.restore();
}
