import { CarPhysics } from './CarPhysics';
import { ITrack, TrackBounds, SurfaceProperties } from './ITrack';

/**
 * Basic rectangular bounding arena implementation of ITrack for standalone engine usage.
 */
export class Track implements ITrack {
  public bounds: TrackBounds = {
    minX: -1200,
    maxX: 1200,
    minY: -1200,
    maxY: 1200
  };

  public update(_dt: number, _car: CarPhysics): void {
    // Basic arena has no dynamic props
  }

  public checkCollisions(car: CarPhysics, _dt: number): void {
    const margin = 34;
    const bounce = 0.45;
    const friction = 0.85;

    // Left Wall
    if (car.x < this.bounds.minX + margin) {
      car.x = this.bounds.minX + margin;
      if (car.vx < 0) {
        car.vx = -car.vx * bounce;
        car.vy *= friction;
        car.angularVelocity *= 0.4;
      }
    }
    // Right Wall
    if (car.x > this.bounds.maxX - margin) {
      car.x = this.bounds.maxX - margin;
      if (car.vx > 0) {
        car.vx = -car.vx * bounce;
        car.vy *= friction;
        car.angularVelocity *= 0.4;
      }
    }
    // Top Wall
    if (car.y < this.bounds.minY + margin) {
      car.y = this.bounds.minY + margin;
      if (car.vy < 0) {
        car.vy = -car.vy * bounce;
        car.vx *= friction;
        car.angularVelocity *= 0.4;
      }
    }
    // Bottom Wall
    if (car.y > this.bounds.maxY - margin) {
      car.y = this.bounds.maxY - margin;
      if (car.vy > 0) {
        car.vy = -car.vy * bounce;
        car.vx *= friction;
        car.angularVelocity *= 0.4;
      }
    }
  }

  public getSurfaceAt(_x: number, _y: number): SurfaceProperties {
    return { type: 'asphalt', gripMultiplier: 1.0, dragMultiplier: 1.0 };
  }

  public render(ctx: CanvasRenderingContext2D, camX: number, camY: number, viewW: number, viewH: number): void {
    const radius = Math.hypot(viewW, viewH) * 1.35;
    const startX = camX - radius;
    const endX = camX + radius;
    const startY = camY - radius;
    const endY = camY + radius;

    // Surrounding background
    ctx.fillStyle = '#0a0f18';
    ctx.fillRect(startX, startY, endX - startX, endY - startY);

    // Tarmac
    const arenaW = this.bounds.maxX - this.bounds.minX;
    const arenaH = this.bounds.maxY - this.bounds.minY;
    ctx.fillStyle = '#11141e';
    ctx.fillRect(this.bounds.minX, this.bounds.minY, arenaW, arenaH);

    // Subtle grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = this.bounds.minX; x <= this.bounds.maxX; x += 100) {
      ctx.moveTo(x, this.bounds.minY);
      ctx.lineTo(x, this.bounds.maxY);
    }
    for (let y = this.bounds.minY; y <= this.bounds.maxY; y += 100) {
      ctx.moveTo(this.bounds.minX, y);
      ctx.lineTo(this.bounds.maxX, y);
    }
    ctx.stroke();

    // Boundary barrier
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.bounds.minX, this.bounds.minY, arenaW, arenaH);
    ctx.restore();
  }

  public reset(): void {
    // No-op for generic track
  }
}
