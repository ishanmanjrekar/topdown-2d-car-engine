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

  // Zero-allocation previous wheel coordinate tracking
  private prevWheelX: Float64Array = new Float64Array(4);
  private prevWheelY: Float64Array = new Float64Array(4);
  private hasPrevWheel: Uint8Array = new Uint8Array(4);

  private readonly maxSkidSegments: number = 600;

  public addSmoke(
    x: number,
    y: number,
    baseVx: number,
    baseVy: number,
    count: number = 2,
    colorPrefix: string = 'rgba(210, 220, 235,'
  ) {
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
        color: colorPrefix
      });
    }
  }

  public recordTireMark(wheelIndex: number, x: number, y: number, isDrifting: boolean, speed: number) {
    if (wheelIndex < 0 || wheelIndex >= 4) return;

    if (this.hasPrevWheel[wheelIndex] && isDrifting && speed > 50) {
      const px = this.prevWheelX[wheelIndex];
      const py = this.prevWheelY[wheelIndex];
      const dist = Math.hypot(x - px, y - py);

      if (dist > 3 && dist < 50) {
        if (this.skidSegments.length >= this.maxSkidSegments) {
          // Remove oldest segment efficiently
          this.skidSegments.splice(0, 1);
        }

        this.skidSegments.push({
          x1: px,
          y1: py,
          x2: x,
          y2: y,
          alpha: Math.min(0.55, speed / 300),
          width: 5
        });
      }
    }

    this.prevWheelX[wheelIndex] = x;
    this.prevWheelY[wheelIndex] = y;
    this.hasPrevWheel[wheelIndex] = 1;
  }

  public update(dt: number) {
    // 1. Update and prune smoke particles
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

    // 2. In-place fade and compact skid marks (zero array allocations)
    let writeIdx = 0;
    const fade = 0.008 * dt;
    for (let i = 0; i < this.skidSegments.length; i++) {
      const seg = this.skidSegments[i];
      seg.alpha -= fade;
      if (seg.alpha > 0.04) {
        this.skidSegments[writeIdx++] = seg;
      }
    }
    this.skidSegments.length = writeIdx;
  }

  /**
   * Batched render pass grouping skid segments into alpha bands
   * reducing 600 separate draw calls down to 3 batched stroke passes.
   */
  public render(ctx: CanvasRenderingContext2D) {
    // 1. Batched Skid Marks
    const len = this.skidSegments.length;
    if (len > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 5;

      // Group into 3 alpha buckets to avoid per-segment context state changes and string allocations
      const bucketHeavy: SkidSegment[] = [];
      const bucketMed: SkidSegment[] = [];
      const bucketLight: SkidSegment[] = [];

      for (let i = 0; i < len; i++) {
        const seg = this.skidSegments[i];
        if (seg.alpha > 0.35) bucketHeavy.push(seg);
        else if (seg.alpha > 0.18) bucketMed.push(seg);
        else bucketLight.push(seg);
      }

      if (bucketHeavy.length > 0) {
        ctx.strokeStyle = 'rgba(18, 18, 22, 0.45)';
        ctx.beginPath();
        for (const s of bucketHeavy) {
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
        }
        ctx.stroke();
      }

      if (bucketMed.length > 0) {
        ctx.strokeStyle = 'rgba(18, 18, 22, 0.28)';
        ctx.beginPath();
        for (const s of bucketMed) {
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
        }
        ctx.stroke();
      }

      if (bucketLight.length > 0) {
        ctx.strokeStyle = 'rgba(18, 18, 22, 0.12)';
        ctx.beginPath();
        for (const s of bucketLight) {
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
        }
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
    this.hasPrevWheel.fill(0);
  }
}
