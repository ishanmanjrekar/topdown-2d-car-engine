export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
  color: string;
}

export interface SkidSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  width: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public skidSegments: SkidSegment[] = [];
  private lastWheelPos: Map<number, { x: number; y: number }> = new Map();
  private readonly maxSkidSegments: number = 600;

  public addSmoke(x: number, y: number, baseVx: number, baseVy: number, count: number = 2) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 25 + 5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: baseVx * 0.15 + Math.cos(angle) * speed,
        vy: baseVy * 0.15 + Math.sin(angle) * speed,
        radius: Math.random() * 4 + 3,
        alpha: 0.6,
        decay: Math.random() * 0.8 + 0.9, // alpha fade per sec
        color: 'rgba(210, 220, 235,'
      });
    }
  }

  public recordTireMark(wheelIndex: number, x: number, y: number, isDrifting: boolean, speed: number) {
    const prev = this.lastWheelPos.get(wheelIndex);
    if (isDrifting && prev && speed > 50) {
      const dist = Math.hypot(x - prev.x, y - prev.y);
      if (dist > 3 && dist < 50) {
        this.skidSegments.push({
          x1: prev.x,
          y1: prev.y,
          x2: x,
          y2: y,
          alpha: Math.min(0.55, speed / 300),
          width: 5
        });

        if (this.skidSegments.length > this.maxSkidSegments) {
          this.skidSegments.shift();
        }
      }
    }
    this.lastWheelPos.set(wheelIndex, { x, y });
  }

  public update(dt: number) {
    // Update and prune smoke particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += 8 * dt; // Smoke expands
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Slowly fade older skid marks
    for (let i = 0; i < this.skidSegments.length; i++) {
      this.skidSegments[i].alpha -= 0.008 * dt;
    }
    this.skidSegments = this.skidSegments.filter((s) => s.alpha > 0.05);
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 1. Draw Skid Marks
    if (this.skidSegments.length > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      for (const seg of this.skidSegments) {
        ctx.strokeStyle = `rgba(18, 18, 22, ${seg.alpha.toFixed(3)})`;
        ctx.lineWidth = seg.width;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Smoke Particles
    if (this.particles.length > 0) {
      ctx.save();
      for (const p of this.particles) {
        ctx.fillStyle = `${p.color} ${p.alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  public clear() {
    this.particles = [];
    this.skidSegments = [];
    this.lastWheelPos.clear();
  }
}
